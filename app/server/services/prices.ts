import type { PrismaClient } from '../generated/prisma/client'
import type { AppConfig } from '../lib/config'
import { HttpError } from '../lib/errors'
import type { AdapterRegistry } from '../tcg/registry'
import type { CommonCardPrice } from '../tcg/types'

export interface PriceRefreshDeps {
  db: PrismaClient
  registry: AdapterRegistry
  config: AppConfig
  now?: () => Date
  /** Waits between two requests to a card database; replaced in tests. */
  sleep?: (milliseconds: number) => Promise<void>
}

export interface PriceRefreshSummary {
  status: 'done' | 'rate_limited' | 'failed'
  due: number
  updated: number
  failed: number
}

interface DueCard {
  id: number
  externalId: string
  game: string
  /** The language to ask in: English where the card has it (the price does not depend on it). */
  language: string
  setName: string
  checkedAt: Date
}

const HOUR = 3_600_000
const DAY = 24 * HOUR
/** A tranche that stops this many requests in a row has found the card database unreachable. */
const MAX_FAILED_REQUESTS_IN_A_ROW = 3

/**
 * The scheduled reload of the prices. Cards whose prices are older than `PRICE_REFRESH_AFTER` are due; a tranche of at
 * most `PRICE_REFRESH_BATCH_SIZE` of them is reloaded, the next tranche not before `PRICE_REFRESH_BATCH_EVERY` later. The
 * oldest prices come first and, of those, the cards of one set. Only prices are written (and the time they were looked
 * at): texts, attributes and everything the user entered stay as they are. Every reload adds a price row, also when the
 * price is the same, so that the history shows that the price was looked at and held.
 */
export function createPriceRefreshService({ db, registry, config, now = () => new Date(), sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) }: PriceRefreshDeps) {
  const settings = config.priceRefresh
  let running = false

  /** All active cards whose prices are due, in the order they are reloaded. */
  async function dueCards(at: Date): Promise<DueCard[]> {
    if (settings.after === null) {
      return []
    }
    const cutoff = new Date(at.getTime() - settings.after)
    const cards = await db.card.findMany({
      where: {
        status: 'ACTIVE',
        externalId: { not: null },
        OR: [{ pricesCheckedAt: null }, { pricesCheckedAt: { lt: cutoff } }],
      },
      select: {
        id: true,
        externalId: true,
        createdAt: true,
        pricesCheckedAt: true,
        game: { select: { slug: true } },
        translations: { select: { language: true } },
        sets: { select: { setName: true }, orderBy: { id: 'asc' }, take: 1 },
      },
    })
    const due = cards.flatMap((card): DueCard[] => {
      const adapter = registry.get(card.game.slug)
      if (!adapter?.fetchPrices || !card.externalId) {
        return []
      }
      const languages = card.translations.map(entry => entry.language)
      return [{
        id: card.id,
        externalId: card.externalId,
        game: card.game.slug,
        language: languages.includes('en') ? 'en' : (languages[0] ?? 'en'),
        setName: card.sets[0]?.setName ?? '',
        checkedAt: card.pricesCheckedAt ?? card.createdAt,
      }]
    })
    // The oldest day first; within a day the cards of a set stay together.
    const day = (card: DueCard) => Math.floor(card.checkedAt.getTime() / DAY)
    return due.sort((a, b) => day(a) - day(b) || a.game.localeCompare(b.game) || a.setName.localeCompare(b.setName) || a.id - b.id)
  }

  async function store(card: DueCard, prices: CommonCardPrice[]) {
    const at = now()
    await db.$transaction([
      db.priceHistory.createMany({
        data: prices.map(price => ({ cardId: card.id, source: price.source, price: price.price, currency: price.currency, fetchedAt: at })),
      }),
      db.$executeRaw`UPDATE "cards" SET "prices_checked_at" = ${at} WHERE "id" = ${card.id}`,
    ])
  }

  /** Checked, but nothing came of it: the card is tried again after the time between two tranches, not after a week. */
  async function retryLater(card: DueCard) {
    const retryIn = Math.min(settings.batchEvery, settings.after ?? settings.batchEvery)
    const checkedAt = new Date(now().getTime() - ((settings.after ?? retryIn) - retryIn))
    await db.$executeRaw`UPDATE "cards" SET "prices_checked_at" = ${checkedAt} WHERE "id" = ${card.id}`
  }

  return {
    enabled: settings.after !== null,

    /** One line for the log at start: what is scheduled. */
    describe(): string {
      if (settings.after === null) {
        return 'Scheduled price reload is off (PRICE_REFRESH_AFTER)'
      }
      const hours = (milliseconds: number) => (milliseconds % DAY === 0 ? `${milliseconds / DAY} day(s)` : `${Math.round(milliseconds / HOUR)} hour(s)`)
      return `Scheduled price reload: prices older than ${hours(settings.after)} are due, ${settings.batchSize} cards per tranche, `
        + `a tranche at most every ${hours(settings.batchEvery)}, ${settings.delayMs} ms between two requests`
    },

    /** The cards that are due now, how many (for tests and reports). */
    async dueCount(): Promise<number> {
      return (await dueCards(now())).length
    },

    /**
     * Reloads one tranche if one is due: the time since the last tranche is long enough and cards are due. Returns what
     * was done, or `null` if nothing was.
     */
    async runDue(): Promise<PriceRefreshSummary | null> {
      if (settings.after === null || running) {
        return null
      }
      running = true
      try {
        const start = now()
        // A tranche that never finished (the app was stopped) does not hold up the next ones.
        await db.priceRefreshRun.updateMany({
          where: { status: 'running', startedAt: { lt: new Date(start.getTime() - HOUR) } },
          data: { status: 'interrupted', finishedAt: start },
        })
        const last = await db.priceRefreshRun.findFirst({ orderBy: { startedAt: 'desc' } })
        if (last && start.getTime() - last.startedAt.getTime() < settings.batchEvery) {
          return null
        }
        const due = await dueCards(start)
        if (due.length === 0) {
          return null
        }
        const tranche = due.slice(0, settings.batchSize)
        const run = await db.priceRefreshRun.create({ data: { status: 'running', startedAt: start, cardsDue: due.length } })

        const summary: PriceRefreshSummary = { status: 'done', due: due.length, updated: 0, failed: 0 }
        let message: string | null = null
        let requests = 0
        let failedInARow = 0

        stop: for (const game of [...new Set(tranche.map(card => card.game))]) {
          const adapter = registry.get(game)!
          const cards = tranche.filter(card => card.game === game)
          const size = adapter.priceBatchSize ?? 1
          for (let index = 0; index < cards.length; index += size) {
            const chunk = cards.slice(index, index + size)
            if (requests > 0) {
              // The card databases limit the requests: a pause between any two of them.
              await sleep(settings.delayMs)
            }
            requests += 1
            let prices: Map<string, CommonCardPrice[]>
            try {
              prices = await adapter.fetchPrices!(chunk.map(card => ({ externalId: card.externalId, language: card.language })))
              failedInARow = 0
            }
            catch (error) {
              if (error instanceof HttpError && error.status === 429) {
                summary.status = 'rate_limited'
                message = 'The card database refused further requests; the rest follows with the next tranche'
                break stop
              }
              message = error instanceof Error ? error.message : String(error)
              summary.failed += chunk.length
              await Promise.all(chunk.map(retryLater))
              failedInARow += 1
              if (failedInARow >= MAX_FAILED_REQUESTS_IN_A_ROW) {
                summary.status = 'failed'
                break stop
              }
              continue
            }
            for (const card of chunk) {
              const found = prices.get(card.externalId)
              if (found === undefined) {
                // Not in the answer: the card database does not know it (any more).
                summary.failed += 1
                await retryLater(card)
              }
              else {
                // A card without a price is checked, too: there is just nothing to add.
                if (found.length > 0) {
                  await store(card, found)
                }
                else {
                  await db.$executeRaw`UPDATE "cards" SET "prices_checked_at" = ${now()} WHERE "id" = ${card.id}`
                }
                summary.updated += 1
              }
            }
          }
        }

        await db.priceRefreshRun.update({
          where: { id: run.id },
          data: { status: summary.status, finishedAt: now(), cardsUpdated: summary.updated, cardsFailed: summary.failed, message },
        })
        return summary
      }
      finally {
        running = false
      }
    },
  }
}

export type PriceRefreshService = ReturnType<typeof createPriceRefreshService>
