import type { Prisma, PrismaClient } from '../generated/prisma/client'
import type { CardDetailDto, CardListResponseDto, LookupCandidateDto } from '../../shared/types/api'
import { getAttributeFields } from '../../shared/utils/game-fields'
import type { AppConfig } from '../lib/config'
import { buildCardWhere, type CardFilters } from '../lib/card-filters'
import { formatDateOnly, parseDateOnly, utcToday } from '../lib/dates'
import { badRequest, notFound } from '../lib/errors'
import { detectImageType, removeCardImageDir, saveImage } from '../lib/image-files'
import { downloadImage } from '../lib/image-download'
import { fromCents, toCents } from '../lib/money'
import { recordOverrides, type FieldChange } from '../lib/overrides'
import type { CreateCardInput, UpdateCardInput } from '../lib/schemas'
import { normalizeStatusChange } from '../lib/status'
import type { AdapterRegistry } from '../tcg/registry'
import type { CommonCard } from '../tcg/types'
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

  function priceRows(card: CommonCard) {
    return card.prices.map(price => ({
      source: price.source,
      price: price.price,
      currency: price.currency,
    }))
  }

  async function get(id: number): Promise<CardDetailDto> {
    const card = await db.card.findUnique({ where: { id }, include: detailInclude() })
    if (!card) {
      throw notFound('card_not_found', 'Card not found')
    }
    return toDetail(card, config.priceSource)
  }

  /** Downloads the API image of a new card. Failures are logged and never block card creation. */
  async function attachApiImage(cardId: number, common: CommonCard, adapterHosts: readonly string[], actor: string) {
    const image = common.images[0]
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
      await db.cardImage.create({
        data: { cardId, filePath, source: 'API', isPrimary: true, uploadedBy: actor },
      })
    }
    catch (error) {
      console.warn(`Could not store API image for card ${cardId}:`, error instanceof Error ? error.message : error)
    }
  }

  return {
    get,

    async list(filters: CardFilters, paging: { page: number, pageSize: number }): Promise<CardListResponseDto> {
      const where = buildCardWhere(filters)
      const orderBy: Prisma.CardOrderByWithRelationInput[] = [{ createdAt: 'desc' }, { id: 'desc' }]

      const [cards, valueRows] = await Promise.all([
        db.card.findMany({
          where,
          orderBy,
          skip: (paging.page - 1) * paging.pageSize,
          take: paging.pageSize,
          include: listInclude(config.priceSource),
        }),
        // The summary covers all matching cards, not just the current page. A personal collection
        // is small enough that loading status and latest price of every match is cheap.
        db.card.findMany({
          where,
          select: {
            status: true,
            priceHistory: {
              where: { source: config.priceSource },
              orderBy: [{ fetchedAt: 'desc' }, { id: 'desc' }],
              take: 1,
              select: { price: true, currency: true },
            },
          },
        }),
      ])

      const centsByCurrency = new Map<string, number>()
      let activeCount = 0
      for (const row of valueRows) {
        if (row.status !== 'ACTIVE') {
          continue
        }
        activeCount += 1
        const latest = row.priceHistory[0]
        if (latest) {
          centsByCurrency.set(latest.currency, (centsByCurrency.get(latest.currency) ?? 0) + toCents(Number(latest.price)))
        }
      }

      return {
        items: cards.map(toListItem),
        page: paging.page,
        pageSize: paging.pageSize,
        summary: {
          count: valueRows.length,
          activeCount,
          totals: [...centsByCurrency.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([currency, cents]) => ({ currency, amount: fromCents(cents) })),
        },
      }
    },

    async lookup(gameSlug: string, query: string, language?: string): Promise<LookupCandidateDto[]> {
      const adapter = registry.require(gameSlug)
      const results = await adapter.searchCards(query, language)
      return results.map(card => ({
        externalId: card.externalId,
        name: card.name,
        description: card.description,
        language: card.language,
        attributes: card.attributes,
        sets: card.sets,
      }))
    },

    async create(input: CreateCardInput, actor: string): Promise<CardDetailDto> {
      const adapter = registry.require(input.game)
      const common = await adapter.fetchCardById(input.externalId, input.language)
      if (!common) {
        throw notFound('upstream_card_not_found', 'Card not found at the card database')
      }

      let chosenSet: CommonCard['sets'][number] | undefined
      if (input.set) {
        chosenSet = common.sets.find(set =>
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
            externalId: common.externalId,
            name: common.name,
            description: common.description,
            language: common.language,
            gameSpecificAttributes: common.attributes as Json,
            assignedPlayerId: input.playerId ?? null,
            purchaseDate: input.purchaseDate ? parseDateOnly(input.purchaseDate) : null,
            lastFetchedAt: timestamp,
            lastModifiedBy: actor,
            sets: chosenSet ? { create: { setCode: chosenSet.setCode, setName: chosenSet.setName, rarity: chosenSet.rarity } } : undefined,
            priceHistory: { create: priceRows(common).map(row => ({ ...row, fetchedAt: timestamp })) },
            snapshots: { create: { rawJson: common.raw as Json, fetchedAt: timestamp } },
            statusHistory: { create: { status: 'ACTIVE', date: utcToday(timestamp), changedBy: actor } },
          },
        })
        await tx.auditLog.create({
          data: { entity: 'card', entityId: created.id, field: 'created', newValue: created.name, changedBy: actor },
        })
        return created
      })

      await attachApiImage(card.id, common, adapter.imageHosts, actor)
      return get(card.id)
    },

    async update(id: number, patch: UpdateCardInput, actor: string): Promise<CardDetailDto> {
      const card = await db.card.findUnique({
        where: { id },
        include: {
          game: { select: { slug: true } },
          sets: { orderBy: { id: 'asc' }, take: 1 },
          statusHistory: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 },
        },
      })
      if (!card) {
        throw notFound('card_not_found', 'Card not found')
      }

      const audit: FieldChange[] = []
      // Subset of `audit` that edits API provided data and therefore counts as a manual override.
      const overrideChanges: FieldChange[] = []
      const data: Prisma.CardUpdateInput = { lastModifiedBy: actor }
      const track = (field: string, oldValue: unknown, newValue: unknown, isOverride: boolean) => {
        if (stringify(oldValue) === stringify(newValue)) {
          return false
        }
        const change = { field, oldValue, newValue }
        audit.push(change)
        if (isOverride && card.externalId !== null) {
          overrideChanges.push(change)
        }
        return true
      }

      if (patch.name !== undefined && track('name', card.name, patch.name, true)) {
        data.name = patch.name
      }
      if (patch.description !== undefined) {
        const description = patch.description?.trim() ? patch.description : null
        if (track('description', card.description, description, true)) {
          data.description = description
        }
      }

      if (patch.attributes) {
        const allowed = new Map(getAttributeFields(card.game.slug).map(field => [field.key, field.kind]))
        const current = new Map(Object.entries(card.gameSpecificAttributes as Record<string, unknown>))
        let attributesChanged = false
        for (const [key, value] of Object.entries(patch.attributes)) {
          const kind = allowed.get(key)
          if (!kind) {
            throw badRequest('invalid_attribute', `Attribute "${key}" cannot be edited`)
          }
          if (value !== null && (kind === 'number' ? !Number.isInteger(value) : typeof value !== 'string')) {
            throw badRequest('invalid_attribute', `Invalid value for attribute "${key}"`)
          }
          if (track(`attributes.${key}`, current.get(key) ?? null, value, true)) {
            attributesChanged = true
            // Clearing an attribute removes it instead of storing null.
            if (value === null) {
              current.delete(key)
            }
            else {
              current.set(key, value)
            }
          }
        }
        if (attributesChanged) {
          data.gameSpecificAttributes = Object.fromEntries(current) as Json
        }
      }

      if (patch.assignedPlayerId !== undefined) {
        if (patch.assignedPlayerId !== null) {
          await requirePlayer(patch.assignedPlayerId)
        }
        if (track('assignedPlayerId', card.assignedPlayerId, patch.assignedPlayerId, false)) {
          data.assignedPlayer = patch.assignedPlayerId === null
            ? { disconnect: true }
            : { connect: { id: patch.assignedPlayerId } }
        }
      }

      if (patch.purchaseDate !== undefined) {
        const newDate = patch.purchaseDate ? parseDateOnly(patch.purchaseDate) : null
        const oldDate = card.purchaseDate ? formatDateOnly(card.purchaseDate) : null
        if (track('purchaseDate', oldDate, patch.purchaseDate, false)) {
          data.purchaseDate = newDate
        }
      }

      const existingSet = card.sets[0]
      const setPatch = patch.set
      if (setPatch) {
        const setData: Prisma.CardSetUpdateWithoutCardInput = {}
        // Code and name are required columns, rarity and edition may be cleared.
        for (const field of ['setCode', 'setName'] as const) {
          const value = setPatch[field]
          if (value !== undefined && track(`set.${field}`, existingSet?.[field] ?? null, value, false)) {
            setData[field] = value
          }
        }
        for (const field of ['rarity', 'edition'] as const) {
          const value = setPatch[field]
          if (value !== undefined && track(`set.${field}`, existingSet?.[field] ?? null, value, false)) {
            setData[field] = value
          }
        }
        if (Object.keys(setData).length > 0) {
          if (existingSet) {
            data.sets = { update: { where: { id: existingSet.id }, data: setData } }
          }
          else {
            if (!setPatch.setCode || !setPatch.setName) {
              throw badRequest('invalid_set', 'Set code and set name are required')
            }
            data.sets = {
              create: {
                setCode: setPatch.setCode,
                setName: setPatch.setName,
                rarity: setPatch.rarity ?? null,
                edition: setPatch.edition ?? null,
              },
            }
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
        track('status', card.status, change.status, false)
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
          track('statusDate', formatDateOnly(latestHistory.date), formatDateOnly(change.date), false)
          track('statusPerson', latestHistory.personText, change.person, false)
          historyAction = () => db.statusHistory.update({
            where: { id: latestHistory.id },
            data: { date: change.date, personText: change.person, changedBy: actor },
          })
        }
      }

      if (overrideChanges.length > 0) {
        data.manualOverrides = recordOverrides(card.manualOverrides as Record<string, unknown>, overrideChanges) as Json
      }

      if (audit.length > 0) {
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

    /** Fetches fresh prices (and a new raw snapshot) for a card from its game's API. */
    async refreshPrices(id: number, actor: string): Promise<CardDetailDto> {
      const card = await db.card.findUnique({
        where: { id },
        select: { id: true, externalId: true, language: true, game: { select: { slug: true } } },
      })
      if (!card) {
        throw notFound('card_not_found', 'Card not found')
      }
      if (!card.externalId) {
        throw badRequest('no_external_id', 'This card is not linked to a card database')
      }

      const adapter = registry.require(card.game.slug)
      const common = await adapter.fetchCardById(card.externalId, card.language)
      if (!common) {
        throw notFound('upstream_card_not_found', 'Card not found at the card database')
      }

      const timestamp = now()
      await db.$transaction([
        db.priceHistory.createMany({
          data: priceRows(common).map(row => ({ ...row, cardId: id, fetchedAt: timestamp })),
        }),
        db.apiSnapshot.create({ data: { cardId: id, rawJson: common.raw as Json, fetchedAt: timestamp } }),
        db.card.update({ where: { id }, data: { lastFetchedAt: timestamp, lastModifiedBy: actor } }),
      ])
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
