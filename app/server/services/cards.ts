import type { Prisma, PrismaClient } from '../generated/prisma/client'
import type { CardDetailDto, CardListResponseDto, FacetsDto, LookupCandidateDto } from '../../shared/types/api'
import type { CardSort, SortDirection } from '../../shared/utils/sorting'
import type { AppConfig } from '../lib/config'
import { buildCardWhere, type CardFilters } from '../lib/card-filters'
import { sortRows, type SortRow } from '../lib/card-sort'
import { formatDateOnly, parseDateOnly, utcToday } from '../lib/dates'
import { badRequest, notFound } from '../lib/errors'
import { detectImageType, removeCardImageDir, saveImage } from '../lib/image-files'
import { downloadImage } from '../lib/image-download'
import { fromCents, toCents } from '../lib/money'
import type { CreateCardInput, UpdateCardInput } from '../lib/schemas'
import { normalizeStatusChange } from '../lib/status'
import { mergeLanguageCards, primaryName, type MergedCard } from '../lib/translations'
import type { AdapterRegistry } from '../tcg/registry'
import type { CardAdapter, CommonCard, CommonCardImage } from '../tcg/types'
import { detailInclude, listInclude, toDetail, toListItem } from './mappers'

export interface CardServiceDeps {
  db: PrismaClient
  registry: AdapterRegistry
  config: AppConfig
  fetchFn?: typeof fetch
  now?: () => Date
}

type Json = Prisma.InputJsonValue

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

  async function requirePlayer(playerId: number) {
    const player = await db.player.findUnique({ where: { id: playerId }, select: { id: true } })
    if (!player) {
      throw notFound('player_not_found', 'Player not found')
    }
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

  /** Downloads the API image of a card. Failures are logged and never block the calling operation. */
  async function attachApiImage(cardId: number, image: CommonCardImage | undefined, adapterHosts: readonly string[], actor: string) {
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
        data: { cardId, filePath, source: 'API', isPrimary: hasPrimary === 0, uploadedBy: actor },
      })
    }
    catch (error) {
      console.warn(`Could not store API image for card ${cardId}:`, error instanceof Error ? error.message : error)
    }
  }

  const candidateOf = (merged: MergedCard): LookupCandidateDto => {
    const text = merged.translations.find(entry => entry.name === merged.name) ?? merged.translations[0]!
    return {
      externalId: merged.externalId,
      name: merged.name,
      description: text.description,
      language: text.language,
      attributes: merged.attributes,
      sets: merged.sets,
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
        const level = (row.gameSpecificAttributes as Record<string, unknown>).level
        sortRowsInput.push({
          id: row.id,
          name: row.name,
          createdAt: row.createdAt,
          purchaseDate: row.purchaseDate,
          level: typeof level === 'number' ? level : null,
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
          SELECT 'rarity', s.rarity
            FROM card_sets s JOIN cards c ON c.id = s.card_id JOIN games g ON g.id = c.game_id
            WHERE (${game}::text IS NULL OR g.slug = ${game})
        ) AS facets
        WHERE value IS NOT NULL AND value <> ''
        GROUP BY kind, value
        ORDER BY kind, value`
      const valuesOf = (kind: string) => rows.filter(row => row.kind === kind).map(row => row.value)
      return {
        types: valuesOf('type'),
        races: valuesOf('race'),
        attributes: valuesOf('attribute'),
        rarities: valuesOf('rarity'),
      }
    },

    /** Searches the card database: German first, English if German finds nothing. */
    async lookup(gameSlug: string, query: string): Promise<LookupCandidateDto[]> {
      const adapter = registry.require(gameSlug)
      for (const language of adapter.storedLanguages) {
        const results = await adapter.searchCards(query, language)
        if (results.length > 0) {
          return results.map(card => ({
            externalId: card.externalId,
            name: card.name,
            description: card.description,
            language: card.language,
            attributes: card.attributes,
            sets: card.sets,
          }))
        }
      }
      return []
    },

    /** One card of the lookup with the data of all languages, in particular all known printings. */
    async lookupDetails(gameSlug: string, externalId: string): Promise<LookupCandidateDto> {
      const merged = await fetchMerged(registry.require(gameSlug), externalId)
      if (!merged) {
        throw notFound('upstream_card_not_found', 'Card not found at the card database')
      }
      return candidateOf(merged)
    },

    async create(input: CreateCardInput, actor: string): Promise<CardDetailDto> {
      const adapter = registry.require(input.game)
      const merged = await fetchMerged(adapter, input.externalId)
      if (!merged) {
        throw notFound('upstream_card_not_found', 'Card not found at the card database')
      }

      let chosenSet: MergedCard['sets'][number] | undefined
      if (input.set) {
        chosenSet = merged.sets.find(set =>
          set.setCode === input.set!.setCode && (set.rarity ?? null) === (input.set!.rarity ?? null))
        if (!chosenSet) {
          throw badRequest('invalid_set', 'The selected printing does not exist for this card')
        }
      }
      if (input.playerId) {
        await requirePlayer(input.playerId)
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
            assignedPlayerId: input.playerId ?? null,
            purchaseDate: input.purchaseDate ? parseDateOnly(input.purchaseDate) : null,
            lastFetchedAt: timestamp,
            lastModifiedBy: actor,
            translations: {
              create: merged.translations.map(entry => ({ ...entry, fetchedAt: timestamp })),
            },
            sets: chosenSet ? { create: { setCode: chosenSet.setCode, setName: chosenSet.setName, rarity: chosenSet.rarity } } : undefined,
            priceHistory: { create: priceRows(merged).map(row => ({ ...row, fetchedAt: timestamp })) },
            snapshots: {
              create: merged.snapshots.map(snapshot => ({
                language: snapshot.language,
                rawJson: snapshot.raw as Json,
                fetchedAt: timestamp,
              })),
            },
            statusHistory: { create: { status: 'ACTIVE', date: utcToday(timestamp), changedBy: actor } },
          },
        })
        await tx.auditLog.create({
          data: { entity: 'card', entityId: created.id, field: 'created', newValue: created.name, changedBy: actor },
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
    async update(id: number, patch: UpdateCardInput, actor: string): Promise<CardDetailDto> {
      const card = await db.card.findUnique({
        where: { id },
        include: {
          sets: { orderBy: { id: 'asc' }, take: 1 },
          statusHistory: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 },
        },
      })
      if (!card) {
        throw notFound('card_not_found', 'Card not found')
      }

      const audit: FieldChange[] = []
      const data: Prisma.CardUpdateInput = { lastModifiedBy: actor }
      const track = (field: string, oldValue: unknown, newValue: unknown) => {
        if (stringify(oldValue) === stringify(newValue)) {
          return false
        }
        audit.push({ field, oldValue, newValue })
        return true
      }

      if (patch.assignedPlayerId !== undefined) {
        if (patch.assignedPlayerId !== null) {
          await requirePlayer(patch.assignedPlayerId)
        }
        if (track('assignedPlayerId', card.assignedPlayerId, patch.assignedPlayerId)) {
          data.assignedPlayer = patch.assignedPlayerId === null
            ? { disconnect: true }
            : { connect: { id: patch.assignedPlayerId } }
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
            // A card imported without a printing: the first edit creates it.
            if (!setPatch.setCode) {
              throw badRequest('invalid_set', 'A set code is required')
            }
            data.sets = { create: { setCode: setPatch.setCode, edition: setPatch.edition ?? null } }
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
          data: { cardId: id, status: change.status, date: change.date, personText: change.person, changedBy: actor },
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
            data: { date: change.date, personText: change.person, changedBy: actor },
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
              changedBy: actor,
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
    async refresh(id: number, actor: string): Promise<CardDetailDto> {
      const card = await db.card.findUnique({
        where: { id },
        select: { id: true, name: true, externalId: true, game: { select: { slug: true } } },
      })
      if (!card) {
        throw notFound('card_not_found', 'Card not found')
      }
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
            update: { name: entry.name, description: entry.description, fetchedAt: timestamp },
            create: { cardId: id, ...entry, fetchedAt: timestamp },
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
            lastModifiedBy: actor,
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
          data: { entity: 'card', entityId: id, field: 'refreshed', newValue: timestamp.toISOString(), changedBy: actor },
        })
      })

      // Only fetch an image if the card has none from the API yet; images the user chose stay.
      const apiImages = await db.cardImage.count({ where: { cardId: id, source: 'API' } })
      if (apiImages === 0) {
        await attachApiImage(id, merged.images[0], adapter.imageHosts, actor)
      }
      return get(id)
    },

    async remove(id: number, actor: string): Promise<void> {
      const card = await db.card.findUnique({ where: { id }, select: { id: true, name: true } })
      if (!card) {
        throw notFound('card_not_found', 'Card not found')
      }
      await db.$transaction([
        db.card.delete({ where: { id } }),
        db.auditLog.create({
          data: { entity: 'card', entityId: id, field: 'deleted', oldValue: card.name, changedBy: actor },
        }),
      ])
      await removeCardImageDir(config.imageDir, id)
    },
  }
}

export type CardService = ReturnType<typeof createCardService>
