import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { PokemonAttributes, PokemonDetails } from '../../shared/types/pokemon'
import { DARK_MAGICIAN } from '../helpers/ygo-fake'
import { furret } from '../helpers/tcgdex-fake'
import { parseCardNumber, sameCardNumber } from '../../shared/utils/pokemon-number'
import { TEST_DATABASE_URL, useHarness } from './helpers'

const ACTOR = 'anna'

describe.skipIf(!TEST_DATABASE_URL)('Pokémon cards', () => {
  const h = useHarness()

  const FURRET = 'swsh3-136'
  const TRAINER = 'swsh3-154'
  const ENERGY = 'swsh1-232'

  const add = (externalId: string, edition: string | null, rarity: string | null, extra: Record<string, unknown> = {}) =>
    h.services.cards.create({ game: 'pokemon', externalId, set: { setCode: externalId, rarity, edition }, ...extra }, ACTOR)
  const addFurret = (edition = 'reverse', extra: Record<string, unknown> = {}) => add(FURRET, edition, 'Uncommon', extra)

  describe('create', () => {
    it('stores German and English texts, the chosen variant, prices and the image', async () => {
      const card = await addFurret('reverse', { purchaseDate: '2026-08-01' })

      expect(card).toMatchObject({
        game: { slug: 'pokemon', displayName: 'Pokémon' },
        externalId: FURRET,
        name: 'Wiesenior',
        status: 'ACTIVE',
        purchaseDate: '2026-08-01',
        userModifiedAt: null,
      })
      expect(card.translations.map(entry => [entry.language, entry.name])).toEqual([['de', 'Wiesenior'], ['en', 'Furret']])
      expect(card.translations[0]!.description).toBe('Sein Nest ist ein langer Tunnel.')

      // Language independent values come from the English response ...
      expect(card.attributes).toMatchObject({ category: 'Pokemon', hp: 110, types: ['Colorless'], stage: 'Stage1', localId: '136', setId: 'swsh3' })
      // ... the localized ones live in the details of each language.
      const de = card.translations[0]!.details as PokemonDetails
      const en = card.translations[1]!.details as PokemonDetails
      expect(de).toMatchObject({ types: ['Farblos'], stage: 'Phase1', rarity: 'Nicht so selten', set: { name: 'Flammende Finsternis' } })
      expect(en).toMatchObject({ types: ['Colorless'], stage: 'Stage1', rarity: 'Uncommon', set: { name: 'Darkness Ablaze' } })
      expect(de.attacks?.[1]).toMatchObject({ name: 'Schweifhieb', damage: 120 })

      // The printing is the card id with the chosen variant as its edition.
      expect(card.sets).toEqual([expect.objectContaining({ setCode: FURRET, setName: 'Darkness Ablaze', rarity: 'Uncommon', edition: 'reverse' })])

      expect(card.priceHistory.map(p => [p.source, p.price, p.currency]).sort()).toEqual([
        ['cardmarket', 0.1, 'EUR'],
        ['cardmarket-holo', 0.4, 'EUR'],
        ['tcgplayer-normal', 0.13, 'USD'],
        ['tcgplayer-reverse', 0.35, 'USD'],
      ])

      expect((await h.db.apiSnapshot.findMany({ where: { cardId: card.id }, orderBy: { language: 'asc' } })).map(s => s.language)).toEqual(['de', 'en'])
      expect(card.images).toEqual([expect.objectContaining({ source: 'API', isPrimary: true })])
      const stored = await h.db.cardImage.findFirstOrThrow({ where: { cardId: card.id } })
      expect(existsSync(join(h.config.imageDir, stored.filePath))).toBe(true)
    })

    it('requests every stored language and registers the game', async () => {
      await addFurret()
      expect([...h.tcgdex.requestedLanguages].sort()).toEqual(['de', 'en', 'ja'])
      expect(await h.db.game.findMany({ select: { slug: true, displayName: true } })).toEqual([{ slug: 'pokemon', displayName: 'Pokémon' }])
    })

    it('leaves out a language the card does not exist in', async () => {
      const card = await add(TRAINER, 'holo', 'Rare')
      expect(card.name).toBe("Boss's Orders")
      expect(card.translations.map(entry => entry.language)).toEqual(['en'])
      expect(card.attributes).toMatchObject({ category: 'Trainer', trainerType: 'Supporter' })
    })

    it('does not store the English card as the German one', async () => {
      h.tcgdex.germanFallsBackToEnglish = true
      const card = await add(TRAINER, 'holo', 'Rare')
      expect(card.translations.map(entry => entry.language)).toEqual(['en'])
    })

    it('adds Trainer and Energy cards with their own attributes', async () => {
      const energy = await add(ENERGY, 'normal', 'Uncommon')
      expect(energy.name).toBe('Feuer-Energie')
      expect(energy.attributes).toMatchObject({ category: 'Energy', energyType: 'Basic' })
      expect(energy.attributes.hp).toBeUndefined()
      expect((energy.translations[0]!.details as PokemonDetails).effect).toBe('Liefert 1 Feuer-Energie.')
    })

    it('requires a printing, and only the variants the card exists in', async () => {
      await expect(h.services.cards.create({ game: 'pokemon', externalId: FURRET }, ACTOR)).rejects.toMatchObject({ status: 400, code: 'printing_required' })
      await expect(addFurret('holo')).rejects.toMatchObject({ status: 400, code: 'invalid_set' })
      await expect(addFurret('firstEdition')).rejects.toMatchObject({ status: 400, code: 'invalid_set' })
      expect(await h.db.card.count()).toBe(0)
    })

    it('rejects an unknown card and does not call Yu-Gi-Oh! for it', async () => {
      await expect(add('swsh3-999', 'normal', null)).rejects.toMatchObject({ status: 404, code: 'upstream_card_not_found' })
      expect(h.ygo.apiCalls()).toBe(0)
    })

    it('does not block creation when the image download fails', async () => {
      h.tcgdex.failImages = true
      expect((await addFurret()).images).toEqual([])
    })
  })

  describe('lookup', () => {
    it('searches German first and shows thumbnails', async () => {
      const results = await h.services.cards.lookup('pokemon', 'wiese')
      expect(results).toEqual([expect.objectContaining({
        externalId: FURRET,
        name: 'Wiesenior',
        language: 'de',
        thumbnailUrl: 'https://assets.tcgdex.net/de/swsh/swsh3/136/low.webp',
        sets: [],
      })])
      expect(h.tcgdex.requestedLanguages).toEqual(['de'])
    })

    it('falls back to English when the German name does not match', async () => {
      const results = await h.services.cards.lookup('pokemon', 'furret')
      expect(results.map(card => [card.name, card.language])).toEqual([['Furret', 'en']])
      expect(h.tcgdex.requestedLanguages).toEqual(['de', 'en'])
    })

    it('finds a card by its id', async () => {
      const results = await h.services.cards.lookup('pokemon', FURRET)
      expect(results.map(card => card.externalId)).toEqual([FURRET])
    })

    it('returns the card with one printing per variant and a thumbnail', async () => {
      const details = await h.services.cards.lookupDetails('pokemon', FURRET)
      expect(details).toMatchObject({
        externalId: FURRET,
        name: 'Wiesenior',
        language: 'de',
        thumbnailUrl: 'https://assets.tcgdex.net/en/swsh/swsh3/136/low.webp',
      })
      expect(details.sets.map(set => [set.setCode, set.rarity, set.edition])).toEqual([
        [FURRET, 'Uncommon', 'normal'],
        [FURRET, 'Uncommon', 'reverse'],
      ])
      await expect(h.services.cards.lookupDetails('pokemon', 'swsh3-999')).rejects.toMatchObject({ status: 404 })
    })

    it('shows no thumbnails for Yu-Gi-Oh!, whose image host must not be hotlinked', async () => {
      const results = await h.services.cards.lookup('ygo', 'dunkler')
      expect(results[0]!.thumbnailUrl).toBeNull()
      expect((await h.services.cards.lookupDetails('ygo', String(DARK_MAGICIAN.id))).thumbnailUrl).toBeNull()
    })
  })

  describe('update', () => {
    it('changes the variant to another one the card exists in', async () => {
      const card = await addFurret('reverse')
      const updated = await h.services.cards.update(card.id, { set: { edition: 'normal' } }, 'sven')
      expect(updated.sets[0]).toMatchObject({ setCode: FURRET, edition: 'normal' })
      expect(updated.userModifiedAt).toBe('2026-10-04T12:00:00.000Z')
      expect(await h.db.auditLog.findFirst({ where: { entityId: card.id, field: 'set.edition' } })).toMatchObject({ oldValue: 'reverse', newValue: 'normal', changedBy: 'sven' })
    })

    it('rejects variants the card does not exist in, unknown ones and clearing the variant', async () => {
      const card = await addFurret('reverse')
      for (const edition of ['holo', 'firstEdition', 'shiny', null]) {
        await expect(h.services.cards.update(card.id, { set: { edition } }, ACTOR)).rejects.toMatchObject({ status: 400, code: 'invalid_variant' })
      }
      expect((await h.services.cards.get(card.id)).sets[0]!.edition).toBe('reverse')
    })

    it('does not allow changing the set code, but accepts the unchanged one', async () => {
      const card = await addFurret()
      await expect(h.services.cards.update(card.id, { set: { setCode: 'swsh3-137' } }, ACTOR)).rejects.toMatchObject({ status: 400, code: 'field_not_editable' })
      const same = await h.services.cards.update(card.id, { set: { setCode: FURRET } }, ACTOR)
      expect(same.userModifiedAt).toBeNull()
    })

    it('still lets the status, assignment and purchase date be changed', async () => {
      const card = await addFurret()
      const anna = await h.services.players.create({ name: 'Anna' })
      const updated = await h.services.cards.update(card.id, { status: 'SOLD', statusPerson: 'Max', assignedPlayerId: anna.id, purchaseDate: '2026-01-02' }, ACTOR)
      expect(updated).toMatchObject({ status: 'SOLD', statusPerson: 'Max', assignedPlayerId: anna.id, purchaseDate: '2026-01-02' })
    })

    it('keeps Yu-Gi-Oh! printings freely editable', async () => {
      const card = await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id), set: { setCode: 'LOB-005', rarity: 'Ultra Rare' } }, ACTOR)
      const updated = await h.services.cards.update(card.id, { set: { setCode: 'LOB-DE005', edition: 'Any text' } }, ACTOR)
      expect(updated.sets[0]).toMatchObject({ setCode: 'LOB-DE005', edition: 'Any text' })
    })
  })

  describe('refresh', () => {
    it('updates texts, attributes, details and prices but keeps the variant and the user data', async () => {
      const anna = await h.services.players.create({ name: 'Anna' })
      const card = await addFurret('reverse', { playerId: anna.id })
      await h.services.cards.update(card.id, { status: 'SOLD', statusPerson: 'Max' }, ACTOR)
      const before = await h.services.cards.get(card.id)

      const updated = furret()
      updated.en = { ...updated.en!, hp: 120, pricing: { cardmarket: { unit: 'EUR', trend: 0.5 } } }
      updated.de = { ...updated.de!, name: 'Wiesenior (neu)' }
      h.tcgdex.cards.set(FURRET, updated)

      const after = await h.services.cards.refresh(card.id, 'sven')

      expect((after.attributes as unknown as PokemonAttributes).hp).toBe(120)
      expect(after.name).toBe('Wiesenior (neu)')
      expect(after.priceHistory.filter(p => p.source === 'cardmarket').map(p => p.price)).toEqual([0.5, 0.1])
      expect(after.sets).toEqual(before.sets)
      expect(after.sets[0]!.edition).toBe('reverse')
      expect(after).toMatchObject({ status: 'SOLD', statusPerson: 'Max', assignedPlayerId: anna.id, userModifiedAt: before.userModifiedAt })
      expect(after.images).toEqual(before.images)
    })

    it('adds a language that became available', async () => {
      const card = await add(TRAINER, 'holo', 'Rare')
      const updated = h.tcgdex.cards.get(TRAINER)!
      updated.de = { ...updated.en!, name: 'Chef-Befehle', description: undefined, effect: 'Deutscher Text.', trainerType: 'Unterstützer' }
      const refreshed = await h.services.cards.refresh(card.id, ACTOR)
      expect(refreshed.translations.map(entry => entry.language)).toEqual(['de', 'en'])
      expect(refreshed.name).toBe('Chef-Befehle')
    })
  })

  describe('list, filters, sorting and facets', () => {
    async function seed() {
      const reverse = await addFurret('reverse', { purchaseDate: '2026-03-01' })
      const trainer = await add(TRAINER, 'holo', 'Rare', { purchaseDate: '2026-01-01' })
      const energy = await add(ENERGY, 'normal', 'Uncommon')
      const magician = await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id), set: { setCode: 'LOB-005', rarity: 'Ultra Rare' } }, ACTOR)
      return { reverse, trainer, energy, magician }
    }
    const all = { page: 1, pageSize: 48 }
    const ids = async (filters: Parameters<typeof h.services.cards.list>[0]) =>
      (await h.services.cards.list(filters, all)).items.map(item => item.id).sort((a, b) => a - b)

    it('separates the games', async () => {
      const { reverse, trainer, energy, magician } = await seed()
      expect(await ids({ game: 'pokemon' })).toEqual([reverse.id, trainer.id, energy.id])
      expect(await ids({ game: 'ygo' })).toEqual([magician.id])
      expect(await ids({})).toHaveLength(4)
      const item = (await h.services.cards.list({ game: 'pokemon' }, all)).items.find(entry => entry.id === reverse.id)!
      expect(item).toMatchObject({ gameSlug: 'pokemon', gameName: 'Pokémon', name: 'Wiesenior', setCode: FURRET, price: { amount: 0.1, currency: 'EUR', source: 'cardmarket' } })
    })

    it('filters by category, energy type, stage and variant', async () => {
      const { reverse, trainer, energy } = await seed()
      expect(await ids({ category: 'Trainer' })).toEqual([trainer.id])
      expect(await ids({ category: 'Energy' })).toEqual([energy.id])
      expect(await ids({ category: 'Pokemon' })).toEqual([reverse.id])
      expect(await ids({ pokemonType: 'Colorless' })).toEqual([reverse.id])
      expect(await ids({ pokemonType: 'Fire' })).toEqual([])
      expect(await ids({ stage: 'Stage1' })).toEqual([reverse.id])
      expect(await ids({ variant: 'reverse' })).toEqual([reverse.id])
      expect(await ids({ variant: 'holo' })).toEqual([trainer.id])
      expect(await ids({ rarity: 'Uncommon' })).toEqual([reverse.id, energy.id])
    })

    it('filters by HP range', async () => {
      const { reverse } = await seed()
      expect(await ids({ game: 'pokemon', hpMin: 100 })).toEqual([reverse.id])
      expect(await ids({ game: 'pokemon', hpMax: 109 })).toEqual([])
      expect(await ids({ game: 'pokemon', hpMin: 110, hpMax: 110 })).toEqual([reverse.id])
    })

    it('finds cards by the name in either language and by the card id', async () => {
      const { reverse } = await seed()
      expect(await ids({ q: 'wiesenior' })).toEqual([reverse.id])
      expect(await ids({ q: 'furret' })).toEqual([reverse.id])
      expect(await ids({ q: 'swsh3-136' })).toEqual([reverse.id])
      expect(await ids({ q: 'darkness ablaze' })).toHaveLength(2)
    })

    it('sorts by HP with cards without HP last', async () => {
      const { reverse, trainer, energy } = await seed()
      const order = async (dir: 'asc' | 'desc') =>
        (await h.services.cards.list({ game: 'pokemon' }, all, { sort: 'hp', dir })).items.map(item => item.id)
      // 110 HP first; Trainer and Energy have none and come last in both directions, ordered by name.
      expect(await order('asc')).toEqual([reverse.id, trainer.id, energy.id])
      expect(await order('desc')).toEqual([reverse.id, trainer.id, energy.id])
    })

    it('sorts by price and purchase date', async () => {
      const { reverse, trainer, energy } = await seed()
      const order = async (sort: 'price' | 'purchaseDate', dir: 'asc' | 'desc') =>
        (await h.services.cards.list({ game: 'pokemon' }, all, { sort, dir })).items.map(item => item.id)
      // Cardmarket trend: Furret 0.10, Boss's Orders 1.10, Fire Energy has no price.
      expect(await order('price', 'asc')).toEqual([reverse.id, trainer.id, energy.id])
      expect(await order('price', 'desc')).toEqual([trainer.id, reverse.id, energy.id])
      expect(await order('purchaseDate', 'asc')).toEqual([trainer.id, reverse.id, energy.id])
    })

    it('lists the Pokémon facets with the English spellings and the variants in use', async () => {
      await seed()
      expect(await h.services.cards.facets('pokemon')).toEqual({
        types: [],
        races: [],
        attributes: [],
        categories: ['Energy', 'Pokemon', 'Trainer'],
        pokemonTypes: ['Colorless'],
        stages: ['Stage1'],
        variants: ['holo', 'normal', 'reverse'],
        rarities: ['Rare', 'Uncommon'],
      })
      const ygo = await h.services.cards.facets('ygo')
      expect(ygo).toMatchObject({ types: ['Normal Monster'], categories: [], variants: [] })
    })

    it('sums the value per currency across games', async () => {
      await seed()
      const { summary } = await h.services.cards.list({ game: 'pokemon' }, all)
      // 0.10 (Furret) + 1.10 (Boss's Orders); the energy has no price.
      expect(summary.totals).toEqual([{ currency: 'EUR', amount: 1.2 }])
    })
  })
  // The user's example: a Hippoterus printed "040/088" has the id me03-040. Without a set code on the card, the card is
  // found by the printed set size and the number.
  describe('finding a card by set and number', () => {
    async function findByNumber(printed: string, setId: string, language = 'en') {
      const parsed = parseCardNumber(printed)!
      const cards = await h.services.catalog.setCards('pokemon', setId, language)
      return cards.find(card => sameCardNumber(card.number, parsed.number))
    }

    it('narrows the sets down by the printed size 088', async () => {
      const sets = await h.services.catalog.sets('pokemon', 'en')
      const candidates = sets.filter(set => set.official === parseCardNumber('040/088')!.total)
      expect(candidates.map(set => set.id)).toEqual(['me03', 'fx1'])
    })

    it('reads "040088" without the slash the same way as "040/088"', async () => {
      const sets = await h.services.catalog.sets('pokemon', 'en')
      expect(sets.filter(set => set.official === parseCardNumber('040088')!.total).map(set => set.id)).toEqual(['me03', 'fx1'])
      expect(await findByNumber('040088', 'me03', 'de')).toMatchObject({ externalId: 'me03-040', name: 'Hippoterus' })
    })

    it('finds me03-040 in the chosen set, in German and English', async () => {
      expect(await findByNumber('040/088', 'me03', 'de')).toMatchObject({ externalId: 'me03-040', number: '040', name: 'Hippoterus' })
      expect(await findByNumber('040/088', 'me03', 'en')).toMatchObject({ externalId: 'me03-040', name: 'Hippowdon' })
    })

    it('matches the number without its leading zeros ("040" and "40")', async () => {
      expect(await findByNumber('040/088', 'fx1')).toMatchObject({ number: '40' })
      expect(await findByNumber('40', 'me03')).toMatchObject({ externalId: 'me03-040' })
    })

    it('finds nothing for a number the set does not have', async () => {
      expect(await findByNumber('099/088', 'me03')).toBeUndefined()
    })

    it('shows the correct values of the card that was found', async () => {
      const found = await findByNumber('040/088', 'me03', 'de')
      const candidate = await h.services.cards.lookupDetails('pokemon', found!.externalId)
      expect(candidate).toMatchObject({ externalId: 'me03-040', name: 'Hippoterus', language: 'de' })
      expect(candidate.attributes).toMatchObject({ localId: '040', setId: 'me03', setCardCount: { official: 88, total: 120 }, hp: 150 })
      expect(candidate.sets.map(set => [set.setCode, set.setName, set.edition])).toEqual([
        ['me03-040', 'Fixture Set ME03', 'normal'],
        ['me03-040', 'Fixture Set ME03', 'reverse'],
      ])

      const card = await add('me03-040', 'reverse', 'Rare')
      expect(card).toMatchObject({ externalId: 'me03-040', name: 'Hippoterus' })
      expect(card.translations.map(entry => [entry.language, entry.name])).toEqual([['de', 'Hippoterus'], ['en', 'Hippowdon']])
      expect(card.sets).toEqual([expect.objectContaining({ setName: 'Fixture Set ME03', edition: 'reverse' })])
    })
  })

  describe('Japanese cards', () => {
    it('adds a card that only exists in the Japanese database', async () => {
      const card = await add('SV9-040', 'normal', 'C')
      expect(card.translations.map(entry => [entry.language, entry.name])).toEqual([['ja', 'ピカチュウ']])
      expect(card.name).toBe('ピカチュウ')
      expect(card.attributes).toMatchObject({ category: 'Pokemon', types: ['Lightning'], stage: 'Basic', setId: 'SV9' })
    })

    it('lists Japanese cards under the English filter values', async () => {
      await add('SV9-040', 'normal', 'C')
      await addFurret()
      const { items } = await h.services.cards.list({ game: 'pokemon', pokemonType: 'Lightning' }, { page: 1, pageSize: 50 })
      expect(items.map(item => [item.name, item.setCode])).toEqual([['ピカチュウ', 'SV9-040']])
      expect((await h.services.cards.facets('pokemon')).pokemonTypes).toEqual(['Colorless', 'Lightning'])
    })

    it('finds a Japanese card by its id, but not by a Latin name', async () => {
      expect((await h.services.cards.lookup('pokemon', 'SV9-040')).map(card => card.externalId)).toEqual(['SV9-040'])
    })

    it('lists the Japanese sets', async () => {
      expect((await h.services.catalog.sets('pokemon', 'ja')).map(set => [set.id, set.official])).toEqual([['SV9', 100]])
    })
  })
})
