import { describe, expect, it, vi } from 'vitest'
import { BLUE_EYES, DARK_MAGICIAN, LINK_MONSTER } from '../helpers/ygo-fake'
import { TEST_DATABASE_URL, useHarness } from './helpers'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const CREATED = new Date('2026-10-04T12:00:00Z').getTime()
/** The clock of the tests: days after the cards were added. */
const daysLater = (days: number) => () => new Date(CREATED + days * DAY)

describe.skipIf(!TEST_DATABASE_URL)('scheduled price reload', () => {
  const h = useHarness()
  const noWait = () => vi.fn(async () => {})

  const add = (externalId: number) => h.services.cards.create({ game: 'ygo', externalId: String(externalId) }, h.anna)
  const rowsOf = (cardId: number) => h.db.priceHistory.findMany({ where: { cardId }, orderBy: { id: 'asc' } })
  /** A copy of a card of the fake database that a test may change (the fixtures are shared by all tests). */
  const changeable = (id: number) => {
    const copy = { ...h.ygo.cards.get(id)! }
    h.ygo.cards.set(id, copy)
    return copy
  }
  const checked = async (cardId: number) => (await h.db.card.findUniqueOrThrow({ where: { id: cardId } })).pricesCheckedAt

  it('waits until the prices are older than the interval, then reloads them', async () => {
    const card = await add(DARK_MAGICIAN.id)
    expect(await checked(card.id)).toEqual(new Date(CREATED))

    expect(await h.servicesAt(daysLater(6), noWait()).prices.runDue()).toBeNull()
    expect((await rowsOf(card.id))).toHaveLength(2)

    const summary = await h.servicesAt(daysLater(8), noWait()).prices.runDue()
    expect(summary).toEqual({ status: 'done', due: 1, updated: 1, failed: 0 })
    expect(await checked(card.id)).toEqual(new Date(CREATED + 8 * DAY))
  })

  it('adds the price again when it has not changed, so that the history shows it was looked at', async () => {
    const card = await add(DARK_MAGICIAN.id)
    await h.servicesAt(daysLater(8), noWait()).prices.runDue()
    const rows = await rowsOf(card.id)
    expect(rows.map(row => [row.source, Number(row.price), row.fetchedAt.getTime()])).toEqual([
      ['cardmarket', 18, CREATED],
      ['tcgplayer', 20, CREATED],
      ['cardmarket', 18, CREATED + 8 * DAY],
      ['tcgplayer', 20, CREATED + 8 * DAY],
    ])
  })

  it('records a changed price and shows it as the current one', async () => {
    const card = await add(DARK_MAGICIAN.id)
    changeable(DARK_MAGICIAN.id).prices = { cardmarket_price: '21.50', tcgplayer_price: '20.00', ebay_price: '0', amazon_price: '0', coolstuffinc_price: '0' }
    await h.servicesAt(daysLater(8), noWait()).prices.runDue()
    const detail = await h.services.cards.get(card.id)
    expect(detail.priceHistory.filter(point => point.source === 'cardmarket').map(point => point.price)).toEqual([21.5, 18])
    const list = await h.services.cards.list({}, { page: 1, pageSize: 10 })
    expect(list.items[0]!.price).toMatchObject({ amount: 21.5, source: 'cardmarket' })
    expect(detail.pricesCheckedAt).toBe(new Date(CREATED + 8 * DAY).toISOString())
  })

  it('writes nothing but prices: texts, attributes and everything the user entered stay as they are', async () => {
    const card = await add(DARK_MAGICIAN.id)
    await h.services.cards.update(card.id, { set: { setCode: 'LOB-DE005', edition: 'FIRST_EDITION' }, status: 'ACTIVE', purchaseDate: '2026-07-01' }, h.anna)
    const before = await h.db.card.findUniqueOrThrow({ where: { id: card.id }, include: { translations: true, sets: true } })
    // The database has changed all over: the reload must not take any of it over.
    const fake = changeable(DARK_MAGICIAN.id)
    fake.name = 'Renamed'
    fake.nameDe = 'Umbenannt'
    fake.level = 12
    fake.prices = { cardmarket_price: '99.00', tcgplayer_price: '0', ebay_price: '0', amazon_price: '0', coolstuffinc_price: '0' }

    await h.servicesAt(daysLater(8), noWait()).prices.runDue()

    const after = await h.db.card.findUniqueOrThrow({ where: { id: card.id }, include: { translations: true, sets: true } })
    const { pricesCheckedAt: beforeChecked, ...beforeRest } = before
    const { pricesCheckedAt: afterChecked, ...afterRest } = after
    expect(afterRest).toEqual(beforeRest)
    expect(afterChecked!.getTime()).toBeGreaterThan(beforeChecked!.getTime())
    expect(after.name).toBe('Dunkler Magier')
    expect(after.sets[0]).toMatchObject({ setCode: 'LOB-DE005', edition: 'FIRST_EDITION' })
    expect(await h.db.apiSnapshot.count({ where: { cardId: card.id } })).toBe(2)
    expect(await h.db.auditLog.count({ where: { field: 'refreshed' } })).toBe(0)
  })

  it('reloads a tranche at a time and starts the next one not before the pause has passed', async () => {
    const ids = [DARK_MAGICIAN.id, BLUE_EYES.id, LINK_MONSTER.id]
    for (const id of ids) {
      await add(id)
    }
    const config = { batchSize: 2, batchEvery: DAY }
    expect(await h.servicesAt(daysLater(8), noWait(), config).prices.runDue()).toMatchObject({ due: 3, updated: 2 })
    expect(await h.servicesAt(() => new Date(CREATED + 8 * DAY + 2 * HOUR), noWait(), config).prices.runDue()).toBeNull()
    expect(await h.servicesAt(() => new Date(CREATED + 9 * DAY + HOUR), noWait(), config).prices.runDue()).toMatchObject({ due: 1, updated: 1 })
    expect(await h.servicesAt(() => new Date(CREATED + 10 * DAY + 2 * HOUR), noWait(), config).prices.runDue()).toBeNull()

    const runs = await h.db.priceRefreshRun.findMany({ orderBy: { id: 'asc' } })
    expect(runs.map(run => [run.status, run.cardsDue, run.cardsUpdated, run.cardsFailed])).toEqual([['done', 3, 2, 0], ['done', 1, 1, 0]])
    expect(runs.every(run => run.finishedAt !== null)).toBe(true)
  })

  it('takes the oldest prices first, and the cards of one set together', async () => {
    const SET_A = 'Set A'
    const SET_B = 'Set B'
    const print = (setName: string, code: string) => ({ set_name: setName, set_code: code, set_rarity: 'Common' })
    // Same day, so the set decides: the cards of Set A (ids 3, 4) come before Set B (id 2) though 2 is older.
    for (const [id, set] of [[2, SET_B], [3, SET_A], [4, SET_A]] as const) {
      h.ygo.cards.set(id, { id, name: `Card ${id}`, sets: [print(set, `X-${id}`)] })
      await h.services.cards.create({ game: 'ygo', externalId: String(id), set: { setCode: `X-${id}`, rarity: 'Common' } }, h.anna)
    }
    h.ygo.requestedIds.length = 0
    await h.servicesAt(daysLater(8), noWait(), { batchSize: 2 }).prices.runDue()
    expect(h.ygo.requestedIds).toEqual([['3', '4']])
  })

  it('asks for many cards in one request and pauses between requests', async () => {
    for (let id = 100; id < 145; id += 1) {
      h.ygo.cards.set(id, { id, name: `Card ${id}`, sets: [] })
      await h.services.cards.create({ game: 'ygo', externalId: String(id) }, h.anna)
    }
    h.ygo.requestedIds.length = 0
    const sleep = noWait()
    expect(await h.servicesAt(daysLater(8), sleep, { batchSize: 100, delayMs: 300 }).prices.runDue()).toMatchObject({ due: 45, updated: 45 })
    expect(h.ygo.requestedIds.map(request => request.length)).toEqual([20, 20, 5])
    expect(sleep).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(300)
  })

  it('leaves out cards that are not active any more', async () => {
    const active = await add(DARK_MAGICIAN.id)
    const sold = await add(BLUE_EYES.id)
    await h.services.cards.update(sold.id, { status: 'SOLD', statusDate: '2026-10-05', statusPerson: 'Max' }, h.anna)
    const service = h.servicesAt(daysLater(8), noWait())
    expect(await service.prices.dueCount()).toBe(1)
    await service.prices.runDue()
    expect(await rowsOf(sold.id)).toHaveLength(2)
    expect((await rowsOf(active.id)).length).toBe(4)
  })

  it('tries a card the database does not know again after the pause between tranches, not after the interval', async () => {
    const unknown = await add(DARK_MAGICIAN.id)
    const known = await add(BLUE_EYES.id)
    h.ygo.cards.delete(DARK_MAGICIAN.id)
    const summary = await h.servicesAt(daysLater(8), noWait()).prices.runDue()
    expect(summary).toMatchObject({ status: 'done', updated: 1, failed: 1 })
    // seven days interval, one day pause: due again one day later
    expect(await checked(unknown.id)).toEqual(new Date(CREATED + 8 * DAY - 6 * DAY))
    expect(await checked(known.id)).toEqual(new Date(CREATED + 8 * DAY))
    expect(await h.servicesAt(() => new Date(CREATED + 9 * DAY + HOUR), noWait()).prices.dueCount()).toBe(1)
  })

  it('stops when the card database refuses further requests, and leaves the rest due', async () => {
    const a = await add(DARK_MAGICIAN.id)
    const b = await add(BLUE_EYES.id)
    h.ygo.rateLimited = true
    const summary = await h.servicesAt(daysLater(8), noWait()).prices.runDue()
    expect(summary).toMatchObject({ status: 'rate_limited', updated: 0 })
    expect(await checked(a.id)).toEqual(new Date(CREATED))
    expect(await checked(b.id)).toEqual(new Date(CREATED))
    const run = await h.db.priceRefreshRun.findFirstOrThrow()
    expect(run).toMatchObject({ status: 'rate_limited', cardsUpdated: 0 })
    expect(run.message).toContain('refused')
  })

  it('reloads the prices of Pokémon cards as well, in the language the card has', async () => {
    const card = await h.services.cards.create({ game: 'pokemon', externalId: 'swsh3-136', set: { setCode: 'swsh3-136', rarity: 'Uncommon', edition: 'reverse' } }, h.anna)
    const before = await rowsOf(card.id)
    expect(before.length).toBeGreaterThan(0)
    h.tcgdex.requestedUrls.length = 0
    expect(await h.servicesAt(daysLater(8), noWait()).prices.runDue()).toMatchObject({ due: 1, updated: 1, failed: 0 })
    expect(h.tcgdex.requestedUrls).toEqual(['/v2/en/cards/swsh3-136'])
    expect(await rowsOf(card.id)).toHaveLength(before.length * 2)
  })

  it('does nothing when it is switched off', async () => {
    await add(DARK_MAGICIAN.id)
    const service = h.servicesAt(daysLater(30), noWait(), { after: null })
    expect(service.prices.enabled).toBe(false)
    expect(await service.prices.dueCount()).toBe(0)
    expect(await service.prices.runDue()).toBeNull()
    expect(service.prices.describe()).toContain('off')
  })

  it('does not hold up the next tranches because of one that never finished', async () => {
    await add(DARK_MAGICIAN.id)
    await h.db.priceRefreshRun.create({ data: { status: 'running', startedAt: new Date(CREATED + 6 * DAY) } })
    expect(await h.servicesAt(daysLater(8), noWait()).prices.runDue()).toMatchObject({ updated: 1 })
    expect((await h.db.priceRefreshRun.findMany({ orderBy: { id: 'asc' } })).map(run => run.status)).toEqual(['interrupted', 'done'])
  })

  it('counts a manual refresh as a look at the prices', async () => {
    const card = await add(DARK_MAGICIAN.id)
    const later = h.servicesAt(daysLater(3), noWait())
    await later.cards.refresh(card.id, h.anna)
    expect(await checked(card.id)).toEqual(new Date(CREATED + 3 * DAY))
    // ... so the scheduled reload waits for another week.
    expect(await h.servicesAt(daysLater(8), noWait()).prices.dueCount()).toBe(0)
    expect(await h.servicesAt(daysLater(11), noWait()).prices.dueCount()).toBe(1)
  })
})
