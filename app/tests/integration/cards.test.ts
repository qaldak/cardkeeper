import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HttpError } from '../../server/lib/errors'
import { BLUE_EYES, DARK_MAGICIAN, ENGLISH_ONLY } from '../helpers/ygo-fake'
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
    it('stores German and English texts, the printing, prices, snapshots and the image', async () => {
      const card = await addDarkMagician({ purchaseDate: '2026-07-15' })

      expect(card).toMatchObject({
        game: { slug: 'ygo', displayName: 'Yu-Gi-Oh!' },
        externalId: '46986414',
        name: 'Dunkler Magier',
        status: 'ACTIVE',
        purchaseDate: '2026-07-15',
        lastModifiedBy: ACTOR,
        userModifiedAt: null,
      })
      expect(card.translations).toEqual([
        { language: 'de', name: 'Dunkler Magier', description: 'Der ultimative Magier in Angriff und Verteidigung.' },
        { language: 'en', name: 'Dark Magician', description: 'Description of Dark Magician' },
      ])
      expect(card.attributes).toMatchObject({ atk: 2500, def: 2100, level: 7, race: 'Spellcaster', type: 'Normal Monster', attribute: 'DARK' })
      expect(card.sets).toMatchObject([{ setCode: 'LOB-005', setName: 'Legend of Blue Eyes White Dragon', rarity: 'Ultra Rare', edition: null }])

      // Zero prices are skipped, the rest keeps its own currency.
      expect(card.priceHistory.map(p => [p.source, p.price, p.currency]).sort()).toEqual([
        ['cardmarket', 18, 'EUR'],
        ['tcgplayer', 20, 'USD'],
      ])

      expect((await h.db.apiSnapshot.findMany({ where: { cardId: card.id }, orderBy: { language: 'asc' } })).map(s => s.language)).toEqual(['de', 'en'])
      expect(await h.db.statusHistory.findMany({ where: { cardId: card.id } })).toMatchObject([{ status: 'ACTIVE', changedBy: ACTOR }])
      expect(await h.db.auditLog.findFirst({ where: { entityId: card.id, field: 'created' } })).toMatchObject({ newValue: 'Dunkler Magier', changedBy: ACTOR })

      expect(card.images).toHaveLength(1)
      expect(card.images[0]).toMatchObject({ source: 'API', isPrimary: true })
      const stored = await h.db.cardImage.findFirstOrThrow({ where: { cardId: card.id } })
      expect(existsSync(join(h.config.imageDir, stored.filePath))).toBe(true)
    })

    it('requests both languages, German first', async () => {
      await addDarkMagician()
      expect([...h.ygo.requestedLanguages].sort()).toEqual(['de', 'en'])
    })

    it('stores only English for a card without German text', async () => {
      const card = await h.services.cards.create({ game: 'ygo', externalId: String(ENGLISH_ONLY.id) }, ACTOR)
      expect(card.name).toBe('Obscure Spell')
      expect(card.translations.map(t => t.language)).toEqual(['en'])
    })

    it('does not store English text as German when the API answers with the English card', async () => {
      h.ygo.germanFallsBackToEnglish = true
      const card = await h.services.cards.create({ game: 'ygo', externalId: String(ENGLISH_ONLY.id) }, ACTOR)
      expect(card.translations.map(t => t.language)).toEqual(['en'])
    })

    it('offers printings that only exist in the German response', async () => {
      const card = await addDarkMagician({ set: { setCode: 'LOB-DE005', rarity: 'Secret Rare' } })
      expect(card.sets[0]).toMatchObject({ setCode: 'LOB-DE005', rarity: 'Secret Rare' })
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
    it('searches German first', async () => {
      const results = await h.services.cards.lookup('ygo', 'dunkler')
      expect(results).toEqual([expect.objectContaining({ externalId: '46986414', name: 'Dunkler Magier', language: 'de' })])
      expect(results[0]).not.toHaveProperty('raw')
      expect(h.ygo.requestedLanguages).toEqual(['de'])
      expect(await h.db.card.count()).toBe(0)
    })

    it('falls back to English when there is no German match', async () => {
      const results = await h.services.cards.lookup('ygo', 'obscure')
      expect(results).toEqual([expect.objectContaining({ externalId: '11111111', name: 'Obscure Spell', language: 'en' })])
      expect(h.ygo.requestedLanguages).toEqual(['de', 'en'])
    })

    it('finds a card by its English name even though the German name differs', async () => {
      const results = await h.services.cards.lookup('ygo', 'blue-eyes')
      expect(results.map(r => r.externalId)).toEqual(['89631139'])
      expect(results[0]!.language).toBe('en')
    })

    it('returns nothing when neither language matches', async () => {
      expect(await h.services.cards.lookup('ygo', 'does not exist')).toEqual([])
    })

    it('returns the card with the printings of all languages', async () => {
      const details = await h.services.cards.lookupDetails('ygo', String(DARK_MAGICIAN.id))
      expect(details).toMatchObject({ externalId: '46986414', name: 'Dunkler Magier', language: 'de' })
      expect(details.sets.map(set => set.setCode)).toEqual(['LOB-005', 'SDY-006', 'LOB-DE005'])
      await expect(h.services.cards.lookupDetails('ygo', '999')).rejects.toMatchObject({ status: 404 })
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
      const spell = await h.services.cards.create({ game: 'ygo', externalId: String(ENGLISH_ONLY.id), set: { setCode: 'OBS-001', rarity: 'Rare' } }, ACTOR)
      return { anna, sven, magician, dragon, spare, spell }
    }

    const all = { page: 1, pageSize: 48 }
    const ids = async (filters: Parameters<typeof h.services.cards.list>[0]) =>
      (await h.services.cards.list(filters, all)).items.map(item => item.id).sort((a, b) => a - b)

    it('lists newest first with the preferred name, set code, player, image and price', async () => {
      const { magician, anna } = await seed()
      const result = await h.services.cards.list({}, all)
      expect(result.items.map(item => item.id)).toEqual([...result.items.map(item => item.id)].sort((a, b) => b - a))
      const item = result.items.find(entry => entry.id === magician.id)!
      expect(item).toMatchObject({
        name: 'Dunkler Magier',
        gameSlug: 'ygo',
        setCode: 'LOB-005',
        status: 'ACTIVE',
        player: { id: anna.id, name: 'Anna' },
        price: { amount: 18, currency: 'EUR', source: 'cardmarket' },
      })
      expect(item.imageId).not.toBeNull()
    })

    it('sums only active cards, per currency, from the configured source', async () => {
      await seed()
      const { summary } = await h.services.cards.list({}, all)
      expect(summary.count).toBe(4)
      expect(summary.activeCount).toBe(3)
      // Dark Magician 18 + Blue-Eyes 42 + Obscure Spell 1.50; the sold copy is not counted.
      expect(summary.totals).toEqual([{ currency: 'EUR', amount: 61.5 }])
    })

    it('filters by status, player and game', async () => {
      const { anna, magician, spare } = await seed()
      expect(await ids({ status: 'SOLD' })).toEqual([spare.id])
      expect(await ids({ player: anna.id })).toEqual([magician.id])
      expect(await ids({ player: 'none' })).toHaveLength(2)
      expect((await h.services.cards.list({ game: 'ygo' }, all)).summary.count).toBe(4)
      expect((await h.services.cards.list({ game: 'pokemon' }, all)).summary.count).toBe(0)
    })

    it('searches names in every language, set code, set name and passcode', async () => {
      const { dragon, magician, spare, spell } = await seed()
      expect(await ids({ q: 'blue-eyes' })).toEqual([dragon.id])
      expect(await ids({ q: 'DRACHE' })).toEqual([dragon.id])
      expect(await ids({ q: 'dark magician' })).toEqual([magician.id, spare.id])
      expect(await ids({ q: 'lob-001' })).toEqual([dragon.id])
      expect(await ids({ q: 'legend of blue' })).toEqual([magician.id, dragon.id, spare.id])
      expect(await ids({ q: '89631139' })).toEqual([dragon.id])
      expect(await ids({ q: 'obscure set' })).toEqual([spell.id])
    })

    it('filters by card type, monster type, attribute and rarity', async () => {
      const { magician, dragon, spare, spell } = await seed()
      expect(await ids({ cardType: 'Spell Card' })).toEqual([spell.id])
      expect(await ids({ cardType: 'Normal Monster' })).toEqual([magician.id, dragon.id, spare.id])
      expect(await ids({ race: 'Dragon' })).toEqual([dragon.id])
      expect(await ids({ race: 'Spellcaster' })).toEqual([magician.id, spare.id])
      expect(await ids({ attribute: 'LIGHT' })).toEqual([dragon.id])
      expect(await ids({ rarity: 'Rare' })).toEqual([spell.id])
      expect(await ids({ rarity: 'Ultra Rare' })).toEqual([magician.id, dragon.id, spare.id])
    })

    it('filters by level range', async () => {
      const { magician, dragon, spare } = await seed()
      expect(await ids({ levelMin: 8 })).toEqual([dragon.id])
      expect(await ids({ levelMax: 7 })).toEqual([magician.id, spare.id])
      expect(await ids({ levelMin: 7, levelMax: 8 })).toEqual([magician.id, dragon.id, spare.id])
      expect(await ids({ levelMin: 9 })).toEqual([])
    })

    it('combines filters', async () => {
      const { magician } = await seed()
      expect(await ids({ race: 'Spellcaster', status: 'ACTIVE', q: 'dunkler', levelMin: 7 })).toEqual([magician.id])
      expect(await ids({ race: 'Dragon', status: 'SOLD' })).toEqual([])
    })

    it('paginates while the summary still covers every match', async () => {
      await seed()
      const first = await h.services.cards.list({}, { page: 1, pageSize: 3 })
      const second = await h.services.cards.list({}, { page: 2, pageSize: 3 })
      expect(first.items).toHaveLength(3)
      expect(second.items).toHaveLength(1)
      expect(second.summary.count).toBe(4)
    })

    it('uses the latest price after a refresh', async () => {
      const { magician } = await seed()
      h.ygo.cards.set(DARK_MAGICIAN.id, { ...DARK_MAGICIAN, prices: { ...DARK_MAGICIAN.prices, cardmarket_price: '25.50' } })
      await h.services.cards.refresh(magician.id, ACTOR)
      const result = await h.services.cards.list({ player: magician.assignedPlayerId! }, all)
      expect(result.items[0]!.price?.amount).toBe(25.5)
    })
  })

  describe('facets', () => {
    it('lists the distinct values in the collection', async () => {
      await addDarkMagician()
      await h.services.cards.create({ game: 'ygo', externalId: String(BLUE_EYES.id), set: { setCode: 'LOB-001', rarity: 'Ultra Rare' } }, ACTOR)
      await h.services.cards.create({ game: 'ygo', externalId: String(ENGLISH_ONLY.id), set: { setCode: 'OBS-001', rarity: 'Rare' } }, ACTOR)

      expect(await h.services.cards.facets('ygo')).toEqual({
        types: ['Normal Monster', 'Spell Card'],
        races: ['Dragon', 'Normal', 'Spellcaster'],
        attributes: ['DARK', 'LIGHT'],
        rarities: ['Rare', 'Ultra Rare'],
      })
      expect(await h.services.cards.facets()).toMatchObject({ types: ['Normal Monster', 'Spell Card'] })
      expect(await h.services.cards.facets('pokemon')).toEqual({ types: [], races: [], attributes: [], rarities: [] })
    })
  })

  describe('update', () => {
    it('changes set code and edition, marks the card as modified and logs it', async () => {
      const card = await addDarkMagician()
      const updated = await h.services.cards.update(card.id, { set: { setCode: 'LOB-DE005', edition: '1st Edition' } }, 'sven')

      expect(updated.sets[0]).toMatchObject({ setCode: 'LOB-DE005', edition: '1st Edition', rarity: 'Ultra Rare' })
      expect(updated.userModifiedAt).toBe('2026-10-04T12:00:00.000Z')
      expect(updated.lastModifiedBy).toBe('sven')
      // The printing is shared by all languages: the texts are untouched.
      expect(updated.translations).toEqual(card.translations)
      expect(updated.name).toBe('Dunkler Magier')

      const audit = await h.db.auditLog.findMany({ where: { entityId: card.id, field: 'set.setCode' } })
      expect(audit).toMatchObject([{ oldValue: 'LOB-005', newValue: 'LOB-DE005', changedBy: 'sven' }])
    })

    it('does nothing (and logs nothing) for unchanged values', async () => {
      const card = await addDarkMagician()
      const before = await h.db.auditLog.count()
      const result = await h.services.cards.update(card.id, { set: { setCode: 'LOB-005' } }, 'someone-else')
      expect(await h.db.auditLog.count()).toBe(before)
      expect(result.lastModifiedBy).toBe(ACTOR)
      expect(result.userModifiedAt).toBeNull()
    })

    it('creates a printing on a card that has none, but needs a set code', async () => {
      const card = await h.services.cards.create({ game: 'ygo', externalId: String(BLUE_EYES.id) }, ACTOR)
      await expect(h.services.cards.update(card.id, { set: { edition: 'Unlimited' } }, ACTOR)).rejects.toMatchObject({ code: 'invalid_set' })
      const updated = await h.services.cards.update(card.id, { set: { setCode: 'LOB-DE001', edition: '1st Edition' } }, ACTOR)
      expect(updated.sets).toEqual([expect.objectContaining({ setCode: 'LOB-DE001', setName: null, edition: '1st Edition' })])
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
      await expect(h.services.cards.update(999, { status: 'LOST' }, ACTOR)).rejects.toBeInstanceOf(HttpError)
    })
  })

  describe('refresh', () => {
    it('updates texts, attributes and prices from the API', async () => {
      const card = await addDarkMagician()
      h.ygo.cards.set(DARK_MAGICIAN.id, {
        ...DARK_MAGICIAN,
        nameDe: 'Dunkler Magier (neu)',
        level: 8,
        prices: { ...DARK_MAGICIAN.prices, cardmarket_price: '19.00' },
      })

      const refreshed = await h.services.cards.refresh(card.id, 'sven')

      expect(refreshed.name).toBe('Dunkler Magier (neu)')
      expect(refreshed.translations.map(t => t.name)).toEqual(['Dunkler Magier (neu)', 'Dark Magician'])
      expect(refreshed.attributes.level).toBe(8)
      expect(refreshed.priceHistory.filter(p => p.source === 'cardmarket').map(p => p.price)).toEqual([19, 18])
      expect(await h.db.apiSnapshot.count({ where: { cardId: card.id } })).toBe(4)
      expect(refreshed.lastModifiedBy).toBe('sven')
      expect(refreshed.lastFetchedAt).toBe('2026-10-04T12:00:00.000Z')
      expect(await h.db.auditLog.findFirst({ where: { entityId: card.id, field: 'refreshed' } })).toMatchObject({ changedBy: 'sven' })
    })

    it('keeps set code, edition, status, assignment, purchase date and images', async () => {
      const anna = await h.services.players.create({ name: 'Anna' })
      const card = await addDarkMagician({ playerId: anna.id, purchaseDate: '2026-07-15' })
      await h.services.cards.update(card.id, {
        set: { setCode: 'LOB-DE005', edition: '1st Edition' },
        status: 'SOLD',
        statusDate: '2026-09-01',
        statusPerson: 'Max',
      }, ACTOR)
      const before = await h.services.cards.get(card.id)
      h.ygo.cards.set(DARK_MAGICIAN.id, { ...DARK_MAGICIAN, nameDe: 'Anderer Name' })

      const after = await h.services.cards.refresh(card.id, 'sven')

      expect(after.name).toBe('Anderer Name')
      expect(after.sets).toEqual(before.sets)
      expect(after.sets[0]).toMatchObject({ setCode: 'LOB-DE005', edition: '1st Edition' })
      expect(after).toMatchObject({
        status: 'SOLD',
        statusDate: '2026-09-01',
        statusPerson: 'Max',
        assignedPlayerId: anna.id,
        purchaseDate: '2026-07-15',
        // A refresh is not a change made by the user.
        userModifiedAt: before.userModifiedAt,
      })
      expect(after.images).toEqual(before.images)
    })

    it('adds a language that became available', async () => {
      const card = await h.services.cards.create({ game: 'ygo', externalId: String(ENGLISH_ONLY.id) }, ACTOR)
      expect(card.translations.map(t => t.language)).toEqual(['en'])

      h.ygo.cards.set(ENGLISH_ONLY.id, { ...ENGLISH_ONLY, nameDe: 'Obskurer Zauber' })
      const refreshed = await h.services.cards.refresh(card.id, ACTOR)

      expect(refreshed.translations.map(t => t.language)).toEqual(['de', 'en'])
      expect(refreshed.name).toBe('Obskurer Zauber')
    })

    it('keeps a stored language the API no longer returns', async () => {
      const card = await addDarkMagician()
      h.ygo.cards.set(DARK_MAGICIAN.id, { ...DARK_MAGICIAN, nameDe: undefined })
      const refreshed = await h.services.cards.refresh(card.id, ACTOR)
      expect(refreshed.translations.map(t => t.language)).toEqual(['de', 'en'])
      expect(refreshed.name).toBe('Dunkler Magier')
    })

    it('fetches the API image only if the card has none', async () => {
      h.ygo.failImages = true
      const card = await addDarkMagician()
      expect(card.images).toEqual([])

      h.ygo.failImages = false
      const refreshed = await h.services.cards.refresh(card.id, ACTOR)
      expect(refreshed.images).toEqual([expect.objectContaining({ source: 'API', isPrimary: true })])

      const again = await h.services.cards.refresh(card.id, ACTOR)
      expect(again.images).toHaveLength(1)
    })

    it('rejects cards that are not linked to a card database or no longer exist there', async () => {
      const game = await h.db.game.create({ data: { slug: 'ygo', displayName: 'Yu-Gi-Oh!' } })
      const manual = await h.db.card.create({ data: { gameId: game.id, name: 'Handmade' } })
      await expect(h.services.cards.refresh(manual.id, ACTOR)).rejects.toMatchObject({ code: 'no_external_id' })

      const card = await addDarkMagician()
      h.ygo.cards.delete(DARK_MAGICIAN.id)
      await expect(h.services.cards.refresh(card.id, ACTOR)).rejects.toMatchObject({ status: 404, code: 'upstream_card_not_found' })
    })
  })

  describe('remove', () => {
    it('deletes the card with its translations, history and image files', async () => {
      const card = await addDarkMagician()
      const stored = await h.db.cardImage.findFirstOrThrow({ where: { cardId: card.id } })
      const file = join(h.config.imageDir, stored.filePath)
      expect(existsSync(file)).toBe(true)

      await h.services.cards.remove(card.id, ACTOR)

      expect(existsSync(file)).toBe(false)
      expect(await h.db.card.count()).toBe(0)
      expect(await h.db.cardTranslation.count()).toBe(0)
      expect(await h.db.priceHistory.count()).toBe(0)
      expect(await h.db.statusHistory.count()).toBe(0)
      expect(await h.db.auditLog.findFirst({ where: { entityId: card.id, field: 'deleted' } })).toMatchObject({ oldValue: 'Dunkler Magier' })
      await expect(h.services.cards.get(card.id)).rejects.toMatchObject({ status: 404 })
    })
  })
})
