import { Prisma, type PrismaClient } from '../generated/prisma/client'
import type { CardDetailDto, CardListResponseDto, FacetsDto, LookupCandidateDto } from '../../shared/types/api'
import { EDITION_KEYS } from '../../shared/utils/editions'
import { eszettVariants } from '../../shared/utils/eszett'
import { getGameConfig } from '../../shared/utils/game-config'
import type { CardSort, SortDirection } from '../../shared/utils/sorting'
import { assertOwner, type Actor } from '../lib/actor'
import type { AppConfig } from '../lib/config'
import { buildCardWhere, type CardFilters } from '../lib/card-filters'
import { sortRows, type SortRow } from '../lib/card-sort'
import type { UnknownEdition } from '../lib/editions'
import { formatDateOnly, parseDateOnly, utcToday } from '../lib/dates'
import { badRequest, notFound } from '../lib/errors'
import { detectImageType, removeCardImageDir, saveImage } from '../lib/image-files'
import { downloadImage } from '../lib/image-download'
import { allowedImageUrl } from '../lib/image-url'
import { fromCents, toCents } from '../lib/money'
import type { CreateCardInput, UpdateCardInput } from '../lib/schemas'
import { normalizeStatusChange } from '../lib/status'
import { mergeLanguageCards, primaryName, type MergedCard } from '../lib/translations'
import type { AdapterRegistry } from '../tcg/registry'
import type { CardAdapter, CommonCard, CommonCardImage } from '../tcg/types'
import { POKEMON_VARIANTS } from '../../shared/types/pokemon'
import { detailInclude, listInclude, toDetail, toListItem } from './mappers'

export interface CardServiceDeps {
  db: PrismaClient
  registry: AdapterRegistry
  config: AppConfig
  fetchFn?: typeof fetch
  now?: () => Date
}

type Json = Prisma.InputJsonValue

/** Prisma needs an explicit marker to store SQL NULL in a JSON column. */
const jsonOrNull = (value: Record<string, unknown> | null | undefined) =>
  value ? (value as Json) : Prisma.DbNull

const stringify = (value: unknown): string | null =>
  value === null || value === undefined ? null : typeof value === 'object' ? JSON.stringify(value) : String(value)

interface FieldChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

export function createCardService(deps: CardServiceDeps) {
  const { db, registry, config } = deps
  const now = deps.now ?? (() => new Date())

  async function ensureGame(slug: string) {
    const adapter = registry.require(slug)
    return db.game.upsert({
      where: { slug },
      update: { displayName: adapter.displayName },
      create: { slug, displayName: adapter.displayName },
    })
  }

  async function requireUser(userId: number) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } })
    if (!user) {
      throw notFound('user_not_found', 'User not found')
    }
    return user
  }

  /** Downloads the card in every stored language (German, English) and merges the answers. */
  async function fetchMerged(adapter: CardAdapter, externalId: string): Promise<MergedCard | null> {
    const results = await Promise.all(
      adapter.storedLanguages.map(language => adapter.fetchCardById(externalId, language)),
    )
    const found = results.filter((card): card is CommonCard => card !== null)
    return found.length > 0 ? mergeLanguageCards(found) : null
  }

  async function get(id: number): Promise<CardDetailDto> {
    const card = await db.card.findUnique({ where: { id }, include: detailInclude() })
    if (!card) {
      throw notFound('card_not_found', 'Card not found')
    }
    return toDetail(card, config.priceSource)
  }

  /**
   * Searches for the text as typed and with "ss" and "ß" exchanged ("weisser" also finds "weißer"), and returns the
   * cards of all spellings once each, those of the typed one first. Only a failure of the typed spelling is an error:
   * a spelling that fails is skipped, the typed one decides.
   */
  async function searchSpellings(adapter: CardAdapter, query: string, language: string): Promise<CommonCard[]> {
    const spellings = eszettVariants(query.trim())
    const answers = await Promise.allSettled(spellings.map(spelling => adapter.searchCards(spelling, language)))
    const [typed, ...others] = answers
    if (typed!.status === 'rejected') {
      throw typed!.reason
    }
    const found = new Map<string, CommonCard>()
    for (const answer of [typed!, ...others]) {
      if (answer.status === 'fulfilled') {
        for (const card of answer.value) {
          if (!found.has(card.externalId)) {
            found.set(card.externalId, card)
          }
        }
      }
    }
    return [...found.values()]
  }

  /** Downloads the API image of a card. Failures are logged and never block the calling operation. */
  async function attachApiImage(cardId: number, image: CommonCardImage | undefined, adapterHosts: readonly string[], actor: Actor) {
    if (!image) {
      return
    }
    try {
      const bytes = await downloadImage(image.url, {
        allowedHosts: adapterHosts,
        maxBytes: config.maxUploadBytes,
        fetchFn: deps.fetchFn,
      })
      const type = detectImageType(bytes)
      if (!type) {
        throw new Error('Downloaded file is not a supported image')
      }
      const filePath = await saveImage(config.imageDir, cardId, bytes, type)
      const hasPrimary = await db.cardImage.count({ where: { cardId, isPrimary: true } })
      await db.cardImage.create({
        data: { cardId, filePath, source: 'API', isPrimary: hasPrimary === 0, uploadedBy: actor.name },
      })
    }
    catch (error) {
      console.warn(`Could not store API image for card ${cardId}:`, error instanceof Error ? error.message : error)
    }
  }

  /** The image host of the game must allow it, and only URLs on that host are passed on. */
  const thumbnailOf = (adapter: CardAdapter, card: { images: CommonCardImage[] }): string | null =>
    adapter.searchThumbnails ? allowedImageUrl(card.images[0]?.smallUrl, adapter.imageHosts) : null

  const candidateOf = (adapter: CardAdapter, merged: MergedCard): LookupCandidateDto => {
    const text = merged.translations.find(entry => entry.name === merged.name) ?? merged.translations[0]!
    return {
      externalId: merged.externalId,
      name: merged.name,
      description: text.description,
      language: text.language,
      attributes: merged.attributes,
      sets: merged.sets.map(set => ({ ...set, edition: set.edition ?? null })),
      thumbnailUrl: thumbnailOf(adapter, merged),
    }
  }

  const priceRows = (merged: MergedCard) =>
    merged.prices.map(price => ({ source: price.source, price: price.price, currency: price.currency }))

  return {
    get,

    async list(
      filters: CardFilters,
      paging: { page: number, pageSize: number },
      order: { sort: CardSort, dir?: SortDirection } = { sort: 'created' },
    ): Promise<CardListResponseDto> {
      const where = buildCardWhere(filters)

      // Loads what is needed to sort and to summarize every matching card, not just the current
      // page. Level and latest price cannot be sorted by the database (JSON attribute, related
      // table), and a personal collection is small enough that this is cheap.
      const rows = await db.card.findMany({
        where,
        select: {
          id: true,
          name: true,
          createdAt: true,
          purchaseDate: true,
          status: true,
          gameSpecificAttributes: true,
          priceHistory: {
            where: { source: config.priceSource },
            orderBy: [{ fetchedAt: 'desc' }, { id: 'desc' }],
            take: 1,
            select: { price: true, currency: true },
          },
        },
      })

      const centsByCurrency = new Map<string, number>()
      let activeCount = 0
      const sortRowsInput: SortRow[] = []
      for (const row of rows) {
        const latest = row.priceHistory[0]
        const attributes = row.gameSpecificAttributes as Record<string, unknown>
        sortRowsInput.push({
          id: row.id,
          name: row.name,
          createdAt: row.createdAt,
          purchaseDate: row.purchaseDate,
          level: typeof attributes.level === 'number' ? attributes.level : null,
          hp: typeof attributes.hp === 'number' ? attributes.hp : null,
          priceCents: latest ? toCents(Number(latest.price)) : null,
        })
        if (row.status === 'ACTIVE') {
          activeCount += 1
          if (latest) {
            centsByCurrency.set(latest.currency, (centsByCurrency.get(latest.currency) ?? 0) + toCents(Number(latest.price)))
          }
        }
      }

      const pageIds = sortRows(sortRowsInput, order.sort, order.dir)
        .slice((paging.page - 1) * paging.pageSize, paging.page * paging.pageSize)
        .map(row => row.id)
      const cards = await db.card.findMany({
        where: { id: { in: pageIds } },
        include: listInclude(config.priceSource),
      })
      const byId = new Map(cards.map(card => [card.id, card]))
      const items = pageIds.flatMap((id) => {
        const card = byId.get(id)
        return card ? [toListItem(card)] : []
      })

      return {
        items,
        page: paging.page,
        pageSize: paging.pageSize,
        summary: {
          count: rows.length,
          activeCount,
          totals: [...centsByCurrency.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([currency, cents]) => ({ currency, amount: fromCents(cents) })),
        },
      }
    },

    /** Distinct values of the collection for the filter dropdowns. */
    async facets(gameSlug?: string): Promise<FacetsDto> {
      const game = gameSlug ?? null
      // Values are the English API spellings, the same for every language (see PokemonAttributes).
      const rows = await db.$queryRaw<{ kind: string, value: string }[]>`
        SELECT kind, value FROM (
          SELECT 'type' AS kind, c.game_specific_attributes->>'type' AS value
            FROM cards c JOIN games g ON g.id = c.game_id WHERE (${game}::text IS NULL OR g.slug = ${game})
          UNION ALL
          SELECT 'race', c.game_specific_attributes->>'race'
            FROM cards c JOIN games g ON g.id = c.game_id WHERE (${game}::text IS NULL OR g.slug = ${game})
          UNION ALL
          SELECT 'attribute', c.game_specific_attributes->>'attribute'
            FROM cards c JOIN games g ON g.id = c.game_id WHERE (${game}::text IS NULL OR g.slug = ${game})
          UNION ALL
          SELECT 'category', c.game_specific_attributes->>'category'
            FROM cards c JOIN games g ON g.id = c.game_id WHERE (${game}::text IS NULL OR g.slug = ${game})
          UNION ALL
          SELECT 'pokemonType', t.value
            FROM cards c JOIN games g ON g.id = c.game_id
            CROSS JOIN LATERAL jsonb_array_elements_text(
              CASE WHEN jsonb_typeof(c.game_specific_attributes->'types') = 'array'
                   THEN c.game_specific_attributes->'types' ELSE '[]'::jsonb END) AS t(value)
            WHERE (${game}::text IS NULL OR g.slug = ${game})
          UNION ALL
          SELECT 'stage', c.game_specific_attributes->>'stage'
            FROM cards c JOIN games g ON g.id = c.game_id WHERE (${game}::text IS NULL OR g.slug = ${game})
          UNION ALL
          SELECT 'rarity', s.rarity
            FROM card_sets s JOIN cards c ON c.id = s.card_id JOIN games g ON g.id = c.game_id
            WHERE (${game}::text IS NULL OR g.slug = ${game})
          UNION ALL
          SELECT 'variant', s.edition
            FROM card_sets s JOIN cards c ON c.id = s.card_id JOIN games g ON g.id = c.game_id
            WHERE (${game}::text IS NULL OR g.slug = ${game}) AND s.edition IN (${Prisma.join(POKEMON_VARIANTS)})
        ) AS facets
        WHERE value IS NOT NULL AND value <> ''
        GROUP BY kind, value
        ORDER BY kind, value`
      const valuesOf = (kind: string) => rows.filter(row => row.kind === kind).map(row => row.value)
      return {
        types: valuesOf('type'),
        races: valuesOf('race'),
        attributes: valuesOf('attribute'),
        categories: valuesOf('category'),
        pokemonTypes: valuesOf('pokemonType'),
        stages: valuesOf('stage'),
        variants: valuesOf('variant'),
        rarities: valuesOf('rarity'),
      }
    },

    /** Searches the card database: German first, English if German finds nothing. */
    /**
     * The editions of games that offer a choice of editions (Yu-Gi-Oh!) that are none of the known keys, e.g. a text
     * from before the keys existed. They are reported at startup, never changed.
     */
    async unknownEditions(): Promise<UnknownEdition[]> {
      const slugs = registry.list().map(adapter => adapter.slug).filter(slug => getGameConfig(slug).editions.length > 0)
      if (slugs.length === 0) {
        return []
      }
      const rows = await db.$queryRaw<{ game: string, edition: string, count: number }[]>`
        SELECT g.slug AS game, s.edition AS edition, count(*)::int AS count
        FROM card_sets s JOIN cards c ON c.id = s.card_id JOIN games g ON g.id = c.game_id
        WHERE g.slug IN (${Prisma.join(slugs)})
          AND s.edition IS NOT NULL AND btrim(s.edition) <> ''
          AND s.edition NOT IN (${Prisma.join(EDITION_KEYS)})
        GROUP BY g.slug, s.edition
        ORDER BY g.slug, s.edition`
      return rows
    },

    async lookup(gameSlug: string, query: string): Promise<LookupCandidateDto[]> {
      const adapter = registry.require(gameSlug)
      for (const language of adapter.storedLanguages) {
        const results = await searchSpellings(adapter, query, language)
        if (results.length > 0) {
          return results.map(card => ({
            externalId: card.externalId,
            name: card.name,
            description: card.description,
            language: card.language,
            attributes: card.attributes,
            sets: card.sets.map(set => ({ ...set, edition: set.edition ?? null })),
            thumbnailUrl: thumbnailOf(adapter, card),
          }))
        }
      }
      return []
    },

    /** One card of the lookup with the data of all languages, in particular all known printings. */
    async lookupDetails(gameSlug: string, externalId: string): Promise<LookupCandidateDto> {
      const adapter = registry.require(gameSlug)
      const merged = await fetchMerged(adapter, externalId)
      if (!merged) {
        throw notFound('upstream_card_not_found', 'Card not found at the card database')
      }
      return candidateOf(adapter, merged)
    },

    async create(input: CreateCardInput, actor: Actor): Promise<CardDetailDto> {
      const adapter = registry.require(input.game)
      const merged = await fetchMerged(adapter, input.externalId)
      if (!merged) {
        throw notFound('upstream_card_not_found', 'Card not found at the card database')
      }

      // Yu-Gi-Oh!: the card database does not know the edition, so it is whatever the user says ("1st Edition").
      // A game with variants only offers the variants of the card.
      const freeEdition = getGameConfig(input.game).editionKind === 'text'
      let chosenSet: MergedCard['sets'][number] | undefined
      if (input.set) {
        chosenSet = merged.sets.find(set =>
          set.setCode === input.set!.setCode
          && (set.rarity ?? null) === (input.set!.rarity ?? null)
          && (freeEdition || (set.edition ?? null) === (input.set!.edition ?? null)))
        if (!chosenSet) {
          throw badRequest('invalid_set', 'The selected printing does not exist for this card')
        }
      }
      else if (getGameConfig(input.game).printingRequired) {
        throw badRequest('printing_required', 'A printing (variant) must be chosen for this game')
      }
      const game = await ensureGame(input.game)
      const timestamp = now()

      const card = await db.$transaction(async (tx) => {
        const created = await tx.card.create({
          data: {
            gameId: game.id,
            externalId: merged.externalId,
            name: merged.name,
            gameSpecificAttributes: merged.attributes as Json,
            // A user only adds cards for themselves.
            ownerUserId: actor.id,
            purchaseDate: input.purchaseDate ? parseDateOnly(input.purchaseDate) : null,
            lastFetchedAt: timestamp,
            lastModifiedBy: actor.name,
            translations: {
              create: merged.translations.map(entry => ({
                language: entry.language,
                name: entry.name,
                description: entry.description,
                details: jsonOrNull(entry.details),
                fetchedAt: timestamp,
              })),
            },
            sets: chosenSet
              ? { create: { setCode: chosenSet.setCode, setName: chosenSet.setName, rarity: chosenSet.rarity, edition: (freeEdition ? input.set?.edition?.trim() || null : chosenSet.edition) ?? null } }
              : undefined,
            priceHistory: { create: priceRows(merged).map(row => ({ ...row, fetchedAt: timestamp })) },
            snapshots: {
              create: merged.snapshots.map(snapshot => ({
                language: snapshot.language,
                rawJson: snapshot.raw as Json,
                fetchedAt: timestamp,
              })),
            },
            statusHistory: { create: { status: 'ACTIVE', date: utcToday(timestamp), changedBy: actor.name } },
          },
        })
        await tx.auditLog.create({
          data: { entity: 'card', entityId: created.id, field: 'created', newValue: created.name, changedBy: actor.name },
        })
        return created
      })

      await attachApiImage(card.id, merged.images[0], adapter.imageHosts, actor)
      return get(card.id)
    },

    /**
     * Changes the printing (set code, edition) and the user's own data (status, assignment,
     * purchase date). Everything that comes from the card API can only be changed by refreshing.
     */
    async update(id: number, patch: UpdateCardInput, actor: Actor): Promise<CardDetailDto> {
      const card = await db.card.findUnique({
        where: { id },
        include: {
          game: { select: { slug: true } },
          owner: { select: { name: true } },
          sets: { orderBy: { id: 'asc' }, take: 1 },
          statusHistory: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 },
        },
      })
      if (!card) {
        throw notFound('card_not_found', 'Card not found')
      }
      assertOwner(card, actor)
      const gameConfig = getGameConfig(card.game.slug)

      const audit: FieldChange[] = []
      const data: Prisma.CardUpdateInput = { lastModifiedBy: actor.name }
      const track = (field: string, oldValue: unknown, newValue: unknown) => {
        if (stringify(oldValue) === stringify(newValue)) {
          return false
        }
        audit.push({ field, oldValue, newValue })
        return true
      }

      // Handing the card over: from then on only the new owner may change it.
      if (patch.ownerId !== undefined) {
        const newOwner = await requireUser(patch.ownerId)
        if (track('owner', card.owner?.name ?? null, newOwner.name)) {
          data.owner = { connect: { id: newOwner.id } }
        }
      }

      if (patch.purchaseDate !== undefined) {
        const oldDate = card.purchaseDate ? formatDateOnly(card.purchaseDate) : null
        if (track('purchaseDate', oldDate, patch.purchaseDate)) {
          data.purchaseDate = patch.purchaseDate ? parseDateOnly(patch.purchaseDate) : null
        }
      }

      const existingSet = card.sets[0]
      const setPatch = patch.set
      if (setPatch) {
        if (setPatch.setCode !== undefined && setPatch.setCode !== existingSet?.setCode && !gameConfig.setCodeEditable) {
          throw badRequest('field_not_editable', 'The set code of this game cannot be changed')
        }
        if (setPatch.edition !== undefined && gameConfig.editionKind === 'variant') {
          // The variant must be one of those the card exists in (e.g. no 1st Edition of a modern card).
          const variants = (card.gameSpecificAttributes as { variants?: Record<string, boolean> }).variants ?? {}
          const edition = setPatch.edition
          if (edition === null || !(POKEMON_VARIANTS as readonly string[]).includes(edition) || variants[edition] !== true) {
            throw badRequest('invalid_variant', 'This variant does not exist for this card')
          }
        }
        const setData: Prisma.CardSetUpdateWithoutCardInput = {}
        if (setPatch.setCode !== undefined && track('set.setCode', existingSet?.setCode ?? null, setPatch.setCode)) {
          setData.setCode = setPatch.setCode
        }
        if (setPatch.edition !== undefined && track('set.edition', existingSet?.edition ?? null, setPatch.edition)) {
          setData.edition = setPatch.edition
        }
        if (Object.keys(setData).length > 0) {
          if (existingSet) {
            data.sets = { update: { where: { id: existingSet.id }, data: setData } }
          }
          else {
            // A card imported without a printing: the first edit creates it. Where the set code is
            // fixed it is the card id.
            const setCode = setPatch.setCode ?? (gameConfig.setCodeEditable ? undefined : card.externalId ?? undefined)
            if (!setCode) {
              throw badRequest('invalid_set', 'A set code is required')
            }
            data.sets = { create: { setCode, edition: setPatch.edition ?? null } }
          }
        }
      }

      // Status handling: a status change appends a history row, correcting date or person
      // of the current status updates the latest row instead.
      const latestHistory = card.statusHistory[0]
      let historyAction: (() => Prisma.PrismaPromise<unknown>) | null = null
      if (patch.status !== undefined && patch.status !== card.status) {
        const change = normalizeStatusChange(
          { status: patch.status, date: patch.statusDate, person: patch.statusPerson },
          now(),
        )
        track('status', card.status, change.status)
        data.status = change.status
        historyAction = () => db.statusHistory.create({
          data: { cardId: id, status: change.status, date: change.date, personText: change.person, changedBy: actor.name },
        })
      }
      else if (card.status !== 'ACTIVE' && latestHistory && (patch.statusDate !== undefined || patch.statusPerson !== undefined)) {
        const change = normalizeStatusChange({
          status: card.status,
          date: patch.statusDate ?? formatDateOnly(latestHistory.date),
          person: patch.statusPerson !== undefined ? patch.statusPerson : latestHistory.personText,
        }, now())
        const dateChanged = formatDateOnly(change.date) !== formatDateOnly(latestHistory.date)
        const personChanged = change.person !== latestHistory.personText
        if (dateChanged || personChanged) {
          track('statusDate', formatDateOnly(latestHistory.date), formatDateOnly(change.date))
          track('statusPerson', latestHistory.personText, change.person)
          historyAction = () => db.statusHistory.update({
            where: { id: latestHistory.id },
            data: { date: change.date, personText: change.person, changedBy: actor.name },
          })
        }
      }

      if (audit.length > 0) {
        data.userModifiedAt = now()
        await db.$transaction([
          db.card.update({ where: { id }, data }),
          ...(historyAction ? [historyAction()] : []),
          db.auditLog.createMany({
            data: audit.map(change => ({
              entity: 'card',
              entityId: id,
              field: change.field,
              oldValue: stringify(change.oldValue),
              newValue: stringify(change.newValue),
              changedBy: actor.name,
            })),
          }),
        ])
      }
      return get(id)
    },

    /**
     * Fetches the card from its game's API again (all stored languages) and updates texts,
     * attributes and prices. The printing (set code, edition), status, assignment, purchase date
     * and images are the user's data and stay untouched.
     */
    async refresh(id: number, actor: Actor): Promise<CardDetailDto> {
      const card = await db.card.findUnique({
        where: { id },
        select: { id: true, name: true, externalId: true, ownerUserId: true, game: { select: { slug: true } } },
      })
      if (!card) {
        throw notFound('card_not_found', 'Card not found')
      }
      assertOwner(card, actor)
      if (!card.externalId) {
        throw badRequest('no_external_id', 'This card is not linked to a card database')
      }

      const adapter = registry.require(card.game.slug)
      const merged = await fetchMerged(adapter, card.externalId)
      if (!merged) {
        throw notFound('upstream_card_not_found', 'Card not found at the card database')
      }

      const timestamp = now()
      await db.$transaction(async (tx) => {
        for (const entry of merged.translations) {
          await tx.cardTranslation.upsert({
            where: { cardId_language: { cardId: id, language: entry.language } },
            update: { name: entry.name, description: entry.description, details: jsonOrNull(entry.details), fetchedAt: timestamp },
            create: {
              cardId: id,
              language: entry.language,
              name: entry.name,
              description: entry.description,
              details: jsonOrNull(entry.details),
              fetchedAt: timestamp,
            },
          })
        }
        // A language the API no longer returns keeps its stored text.
        const stored = await tx.cardTranslation.findMany({ where: { cardId: id } })
        await tx.card.update({
          where: { id },
          data: {
            name: primaryName(stored, card.name),
            gameSpecificAttributes: merged.attributes as Json,
            lastFetchedAt: timestamp,
            lastModifiedBy: actor.name,
          },
        })
        await tx.priceHistory.createMany({
          data: priceRows(merged).map(row => ({ ...row, cardId: id, fetchedAt: timestamp })),
        })
        await tx.apiSnapshot.createMany({
          data: merged.snapshots.map(snapshot => ({
            cardId: id,
            language: snapshot.language,
            rawJson: snapshot.raw as Json,
            fetchedAt: timestamp,
          })),
        })
        await tx.auditLog.create({
          data: { entity: 'card', entityId: id, field: 'refreshed', newValue: timestamp.toISOString(), changedBy: actor.name },
        })
      })

      // Only fetch an image if the card has none from the API yet; images the user chose stay.
      const apiImages = await db.cardImage.count({ where: { cardId: id, source: 'API' } })
      if (apiImages === 0) {
        await attachApiImage(id, merged.images[0], adapter.imageHosts, actor)
      }
      return get(id)
    },

    async remove(id: number, actor: Actor): Promise<void> {
      const card = await db.card.findUnique({ where: { id }, select: { id: true, name: true, ownerUserId: true } })
      if (!card) {
        throw notFound('card_not_found', 'Card not found')
      }
      assertOwner(card, actor)
      await db.$transaction([
        db.card.delete({ where: { id } }),
        db.auditLog.create({
          data: { entity: 'card', entityId: id, field: 'deleted', oldValue: card.name, changedBy: actor.name },
        }),
      ])
      await removeCardImageDir(config.imageDir, id)
    },
  }
}

export type CardService = ReturnType<typeof createCardService>
