import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HttpError } from '../../server/lib/errors'
import { BLUE_EYES, DARK_MAGICIAN } from '../helpers/ygo-fake'
import { TEST_DATABASE_URL, useHarness } from './helpers'

const ACTOR = 'anna'

describe.skipIf(!TEST_DATABASE_URL)('card service', () => {
  const h = useHarness()

  const addDarkMagician = (extra: Record<string, unknown> = {}) =>
    h.services.cards.create({
      game: 'ygo',
      externalId: String(DARK_MAGICIAN.id),
      set: { setCode: 'LOB-005', rarity: 'Ultra Rare' },
      ...extra,
    }, ACTOR)

  describe('create', () => {
    it('stores card, printing, prices, snapshot, status history and image', async () => {
      const card = await addDarkMagician({ purchaseDate: '2026-07-15' })

      expect(card).toMatchObject({
        game: { slug: 'ygo', displayName: 'Yu-Gi-Oh!' },
        externalId: '46986414',
        name: 'Dark Magician',
        language: 'en',
        status: 'ACTIVE',
        purchaseDate: '2026-07-15',
        lastModifiedBy: ACTOR,
        manualOverrides: {},
      })
      expect(card.attributes).toMatchObject({ atk: 2500, def: 2100, level: 7, attribute: 'DARK' })
      expect(card.sets).toMatchObject([{ setCode: 'LOB-005', setName: 'Legend of Blue Eyes White Dragon', rarity: 'Ultra Rare', edition: null }])

      // Zero prices are skipped, the rest keeps its own currency.
      expect(card.priceHistory.map(p => [p.source, p.price, p.currency]).sort()).toEqual([
        ['cardmarket', 18, 'EUR'],
        ['tcgplayer', 20, 'USD'],
      ])

      expect(await h.db.apiSnapshot.count({ where: { cardId: card.id } })).toBe(1)
      expect(await h.db.statusHistory.findMany({ where: { cardId: card.id } })).toMatchObject([{ status: 'ACTIVE', changedBy: ACTOR }])
      expect(await h.db.auditLog.findFirst({ where: { entityId: card.id, field: 'created' } })).toMatchObject({ newValue: 'Dark Magician', changedBy: ACTOR })

      expect(card.images).toHaveLength(1)
      expect(card.images[0]).toMatchObject({ source: 'API', isPrimary: true })
      const stored = await h.db.cardImage.findFirstOrThrow({ where: { cardId: card.id } })
      expect(existsSync(join(h.config.imageDir, stored.filePath))).toBe(true)
    })

    it('registers the game on first use and reuses it afterwards', async () => {
      await addDarkMagician()
      await h.services.cards.create({ game: 'ygo', externalId: String(BLUE_EYES.id) }, ACTOR)
      expect(await h.db.game.findMany()).toMatchObject([{ slug: 'ygo', displayName: 'Yu-Gi-Oh!' }])
    })

    it('creates a card without a specific printing', async () => {
      const card = await h.services.cards.create({ game: 'ygo', externalId: String(BLUE_EYES.id) }, ACTOR)
      expect(card.sets).toEqual([])
    })

    it('does not block creation when the image download fails', async () => {
      h.ygo.failImages = true
      const card = await addDarkMagician()
      expect(card.images).toEqual([])
    })

    it('rejects an unknown card, game, printing and player', async () => {
      await expect(h.services.cards.create({ game: 'ygo', externalId: '999' }, ACTOR)).rejects.toMatchObject({ status: 404, code: 'upstream_card_not_found' })
      await expect(h.services.cards.create({ game: 'mtg', externalId: '1' }, ACTOR)).rejects.toMatchObject({ status: 400, code: 'unknown_game' })
      await expect(addDarkMagician({ set: { setCode: 'XXX-001', rarity: 'Common' } })).rejects.toMatchObject({ status: 400, code: 'invalid_set' })
      await expect(addDarkMagician({ playerId: 99 })).rejects.toMatchObject({ status: 404, code: 'player_not_found' })
      expect(await h.db.card.count()).toBe(0)
    })
  })

  describe('lookup', () => {
    it('returns candidates without touching the database', async () => {
      const results = await h.services.cards.lookup('ygo', 'dark')
      expect(results).toEqual([expect.objectContaining({ externalId: '46986414', name: 'Dark Magician' })])
      expect(results[0]!.sets).toHaveLength(2)
      expect(results[0]).not.toHaveProperty('raw')
      expect(await h.db.card.count()).toBe(0)
    })
  })

  describe('list', () => {
    async function seed() {
      const anna = await h.services.players.create({ name: 'Anna' })
      const sven = await h.services.players.create({ name: 'Sven' })
      const magician = await addDarkMagician({ playerId: anna.id })
      const dragon = await h.services.cards.create({ game: 'ygo', externalId: String(BLUE_EYES.id), set: { setCode: 'LOB-001', rarity: 'Ultra Rare' }, playerId: sven.id }, ACTOR)
      const spare = await addDarkMagician()
      await h.services.cards.update(spare.id, { status: 'SOLD', statusPerson: 'Max' }, ACTOR)
      return { anna, sven, magician, dragon, spare }
    }

    const all = { page: 1, pageSize: 48 }

    it('lists newest first with set code, player, image and price', async () => {
      const { magician, dragon, anna } = await seed()
      const result = await h.services.cards.list({}, all)
      expect(result.items.map(item => item.id)).toEqual([...result.items.map(item => item.id)].sort((a, b) => b - a))
      const item = result.items.find(entry => entry.id === magician.id)!
      expect(item).toMatchObject({
        name: 'Dark Magician',
        gameSlug: 'ygo',
        setCode: 'LOB-005',
        status: 'ACTIVE',
        player: { id: anna.id, name: 'Anna' },
        price: { amount: 18, currency: 'EUR', source: 'cardmarket' },
      })
      expect(item.imageId).not.toBeNull()
      expect(result.items.find(entry => entry.id === dragon.id)?.price?.amount).toBe(42)
    })

    it('sums only active cards, per currency, from the configured source', async () => {
      await seed()
      const { summary } = await h.services.cards.list({}, all)
      expect(summary.count).toBe(3)
      expect(summary.activeCount).toBe(2)
      expect(summary.totals).toEqual([{ currency: 'EUR', amount: 60 }])
    })

    it('filters by status, player, game and free text', async () => {
      const { anna, magician, spare } = await seed()
      expect((await h.services.cards.list({ status: 'SOLD' }, all)).items.map(i => i.id)).toEqual([spare.id])
      expect((await h.services.cards.list({ player: anna.id }, all)).items.map(i => i.id)).toEqual([magician.id])
      expect((await h.services.cards.list({ player: 'none' }, all)).items.map(i => i.id)).toEqual([spare.id])
      expect((await h.services.cards.list({ game: 'ygo' }, all)).summary.count).toBe(3)
      expect((await h.services.cards.list({ game: 'pokemon' }, all)).summary.count).toBe(0)
      expect((await h.services.cards.list({ q: 'blue-eyes' }, all)).items).toHaveLength(1)
      expect((await h.services.cards.list({ q: 'lob-005' }, all)).items).toHaveLength(2)
      expect((await h.services.cards.list({ q: '89631139' }, all)).items).toHaveLength(1)
    })

    it('paginates while the summary still covers every match', async () => {
      await seed()
      const first = await h.services.cards.list({}, { page: 1, pageSize: 2 })
      const second = await h.services.cards.list({}, { page: 2, pageSize: 2 })
      expect(first.items).toHaveLength(2)
      expect(second.items).toHaveLength(1)
      expect(second.summary.count).toBe(3)
    })

    it('uses the latest price after a refresh', async () => {
      const { magician } = await seed()
      h.ygo.cards.set(DARK_MAGICIAN.id, { ...DARK_MAGICIAN, prices: { ...DARK_MAGICIAN.prices, cardmarket_price: '25.50' } })
      await h.services.cards.refreshPrices(magician.id, ACTOR)
      const result = await h.services.cards.list({ player: magician.assignedPlayerId! }, all)
      expect(result.items[0]!.price?.amount).toBe(25.5)
    })
  })

  describe('update', () => {
    it('records edits of API data as overrides and in the audit log', async () => {
      const card = await addDarkMagician()
      const updated = await h.services.cards.update(card.id, {
        name: 'Dunkler Magier',
        description: 'Der ultimative Magier.',
        attributes: { atk: 2600, race: null },
      }, 'sven')

      expect(updated).toMatchObject({ name: 'Dunkler Magier', description: 'Der ultimative Magier.', lastModifiedBy: 'sven' })
      expect(updated.attributes).toMatchObject({ atk: 2600, def: 2100 })
      expect(updated.attributes).not.toHaveProperty('race')
      expect(updated.manualOverrides).toEqual({
        name: 'Dark Magician',
        description: 'Description of Dark Magician',
        'attributes.atk': 2500,
        'attributes.race': 'Spellcaster',
      })

      const audit = await h.db.auditLog.findMany({ where: { entityId: card.id, field: 'name' } })
      expect(audit).toMatchObject([{ oldValue: 'Dark Magician', newValue: 'Dunkler Magier', changedBy: 'sven' }])
    })

    it('drops an override once the value is edited back', async () => {
      const card = await addDarkMagician()
      await h.services.cards.update(card.id, { name: 'Other' }, ACTOR)
      const reverted = await h.services.cards.update(card.id, { name: 'Dark Magician' }, ACTOR)
      expect(reverted.manualOverrides).toEqual({})
    })

    it('does nothing (and logs nothing) for unchanged values', async () => {
      const card = await addDarkMagician()
      const before = await h.db.auditLog.count()
      const result = await h.services.cards.update(card.id, { name: card.name, attributes: { atk: 2500 } }, 'someone-else')
      expect(await h.db.auditLog.count()).toBe(before)
      expect(result.lastModifiedBy).toBe(ACTOR)
    })

    it('validates attributes against the game definition', async () => {
      const card = await addDarkMagician()
      await expect(h.services.cards.update(card.id, { attributes: { secret: 1 } }, ACTOR)).rejects.toMatchObject({ code: 'invalid_attribute' })
      await expect(h.services.cards.update(card.id, { attributes: { atk: 'high' } }, ACTOR)).rejects.toMatchObject({ code: 'invalid_attribute' })
      await expect(h.services.cards.update(card.id, { attributes: { race: 5 } }, ACTOR)).rejects.toMatchObject({ code: 'invalid_attribute' })
    })

    it('updates the printing and keeps it out of the overrides', async () => {
      const card = await addDarkMagician()
      const updated = await h.services.cards.update(card.id, { set: { edition: '1st Edition', rarity: 'Secret Rare' } }, ACTOR)
      expect(updated.sets[0]).toMatchObject({ setCode: 'LOB-005', rarity: 'Secret Rare', edition: '1st Edition' })
      expect(updated.manualOverrides).toEqual({})
    })

    it('creates a printing on a card that has none, but needs code and name', async () => {
      const card = await h.services.cards.create({ game: 'ygo', externalId: String(BLUE_EYES.id) }, ACTOR)
      await expect(h.services.cards.update(card.id, { set: { edition: 'Unlimited' } }, ACTOR)).rejects.toMatchObject({ code: 'invalid_set' })
      const updated = await h.services.cards.update(card.id, { set: { setCode: 'LOB-001', setName: 'Legend of Blue Eyes White Dragon' } }, ACTOR)
      expect(updated.sets).toHaveLength(1)
    })

    it('assigns and unassigns a player', async () => {
      const card = await addDarkMagician()
      const anna = await h.services.players.create({ name: 'Anna' })
      expect((await h.services.cards.update(card.id, { assignedPlayerId: anna.id }, ACTOR)).assignedPlayerId).toBe(anna.id)
      expect((await h.services.cards.update(card.id, { assignedPlayerId: null }, ACTOR)).assignedPlayerId).toBeNull()
      await expect(h.services.cards.update(card.id, { assignedPlayerId: 999 }, ACTOR)).rejects.toMatchObject({ code: 'player_not_found' })
    })

    it('tracks status changes with date and person', async () => {
      const card = await addDarkMagician()
      const sold = await h.services.cards.update(card.id, { status: 'SOLD', statusDate: '2026-09-01', statusPerson: ' Max ' }, ACTOR)
      expect(sold).toMatchObject({ status: 'SOLD', statusDate: '2026-09-01', statusPerson: 'Max' })

      const lost = await h.services.cards.update(card.id, { status: 'LOST', statusPerson: 'ignored' }, ACTOR)
      expect(lost).toMatchObject({ status: 'LOST', statusDate: '2026-10-04', statusPerson: null })

      const history = await h.db.statusHistory.findMany({ where: { cardId: card.id }, orderBy: { id: 'asc' } })
      expect(history.map(entry => entry.status)).toEqual(['ACTIVE', 'SOLD', 'LOST'])

      const back = await h.services.cards.update(card.id, { status: 'ACTIVE' }, ACTOR)
      expect(back).toMatchObject({ status: 'ACTIVE', statusDate: null, statusPerson: null })
    })

    it('corrects date and person of the current status in place', async () => {
      const card = await addDarkMagician()
      await h.services.cards.update(card.id, { status: 'SOLD', statusDate: '2026-09-01', statusPerson: 'Max' }, ACTOR)
      const corrected = await h.services.cards.update(card.id, { statusDate: '2026-09-05', statusPerson: 'Maya' }, ACTOR)
      expect(corrected).toMatchObject({ status: 'SOLD', statusDate: '2026-09-05', statusPerson: 'Maya' })
      expect(await h.db.statusHistory.count({ where: { cardId: card.id } })).toBe(2)
    })

    it('rejects an invalid status date', async () => {
      const card = await addDarkMagician()
      await expect(h.services.cards.update(card.id, { status: 'SOLD', statusDate: '2026-02-30' }, ACTOR)).rejects.toMatchObject({ code: 'invalid_date' })
      expect((await h.services.cards.get(card.id)).status).toBe('ACTIVE')
    })

    it('answers 404 for an unknown card', async () => {
      await expect(h.services.cards.update(999, { name: 'x' }, ACTOR)).rejects.toBeInstanceOf(HttpError)
    })
  })

  describe('refreshPrices', () => {
    it('appends a new price point per source and a new snapshot', async () => {
      const card = await addDarkMagician()
      h.ygo.cards.set(DARK_MAGICIAN.id, { ...DARK_MAGICIAN, prices: { ...DARK_MAGICIAN.prices, cardmarket_price: '19.00' } })

      const refreshed = await h.services.cards.refreshPrices(card.id, 'sven')
      const cardmarket = refreshed.priceHistory.filter(point => point.source === 'cardmarket')
      expect(cardmarket.map(point => point.price)).toEqual([19, 18])
      expect(await h.db.apiSnapshot.count({ where: { cardId: card.id } })).toBe(2)
      expect(refreshed.lastModifiedBy).toBe('sven')
      expect(refreshed.lastFetchedAt).toBe('2026-10-04T12:00:00.000Z')
    })

    it('rejects cards that are not linked to a card database', async () => {
      const game = await h.db.game.create({ data: { slug: 'ygo', displayName: 'Yu-Gi-Oh!' } })
      const manual = await h.db.card.create({ data: { gameId: game.id, name: 'Handmade' } })
      await expect(h.services.cards.refreshPrices(manual.id, ACTOR)).rejects.toMatchObject({ code: 'no_external_id' })
    })

    it('does not record overrides for cards without an external id', async () => {
      const game = await h.db.game.create({ data: { slug: 'ygo', displayName: 'Yu-Gi-Oh!' } })
      const manual = await h.db.card.create({ data: { gameId: game.id, name: 'Handmade' } })
      const updated = await h.services.cards.update(manual.id, { name: 'Renamed' }, ACTOR)
      expect(updated.manualOverrides).toEqual({})
    })
  })

  describe('remove', () => {
    it('deletes the card with its history and image files', async () => {
      const card = await addDarkMagician()
      const stored = await h.db.cardImage.findFirstOrThrow({ where: { cardId: card.id } })
      const file = join(h.config.imageDir, stored.filePath)
      expect(existsSync(file)).toBe(true)

      await h.services.cards.remove(card.id, ACTOR)

      expect(existsSync(file)).toBe(false)
      expect(await h.db.card.count()).toBe(0)
      expect(await h.db.priceHistory.count()).toBe(0)
      expect(await h.db.statusHistory.count()).toBe(0)
      expect(await h.db.auditLog.findFirst({ where: { entityId: card.id, field: 'deleted' } })).toMatchObject({ oldValue: 'Dark Magician' })
      await expect(h.services.cards.get(card.id)).rejects.toMatchObject({ status: 404 })
    })
  })
})
