import { describe, expect, it } from 'vitest'
import type { CreateManualCardInput } from '../../server/lib/schemas'
import { DARK_MAGICIAN } from '../helpers/ygo-fake'
import { TEST_DATABASE_URL, useHarness } from './helpers'

describe.skipIf(!TEST_DATABASE_URL)('cards entered by hand', () => {
  const h = useHarness()

  const albaz = (extra: Partial<CreateManualCardInput> = {}): CreateManualCardInput => ({
    game: 'ygo',
    translation: { language: 'de', name: 'Albaz der Verschleierte', description: 'Ein Spielstein.' },
    set: { setCode: 'SDAZ-DE047', setName: 'Structure Deck: Albaz Strike', rarity: 'Common' },
    attributes: { type: 'Token', race: 'Dragon', attribute: 'DARK' },
    ...extra,
  })

  describe('create', () => {
    it('stores the card with its text, print, status and log entry, and nothing from a card database', async () => {
      const card = await h.services.cards.createManual(albaz({ purchaseDate: '2026-11-07' }), h.anna)

      expect(card).toMatchObject({
        game: { slug: 'ygo' },
        externalId: null,
        name: 'Albaz der Verschleierte',
        status: 'ACTIVE',
        owner: { id: h.anna.id },
        purchaseDate: '2026-11-07',
        lastModifiedBy: h.anna.name,
        userModifiedAt: null,
        lastFetchedAt: null,
        pricesCheckedAt: null,
        images: [],
        priceHistory: [],
      })
      expect(card.translations).toEqual([{ language: 'de', name: 'Albaz der Verschleierte', description: 'Ein Spielstein.', details: null }])
      expect(card.attributes).toEqual({ type: 'Token', race: 'Dragon', attribute: 'DARK' })
      expect(card.sets).toMatchObject([{ setCode: 'SDAZ-DE047', setName: 'Structure Deck: Albaz Strike', rarity: 'Common', edition: null }])

      expect(await h.db.apiSnapshot.count({ where: { cardId: card.id } })).toBe(0)
      expect(await h.db.priceHistory.count({ where: { cardId: card.id } })).toBe(0)
      expect(await h.db.statusHistory.findMany({ where: { cardId: card.id } })).toMatchObject([{ status: 'ACTIVE', changedBy: h.anna.name }])
      expect(await h.db.auditLog.findFirst({ where: { entityId: card.id, field: 'created' } })).toMatchObject({ newValue: 'Albaz der Verschleierte', changedBy: h.anna.name })
      expect(h.ygo.apiCalls()).toBe(0)
    })

    it('stores only the filled attributes: empty level, ATK and DEF are absent', async () => {
      const card = await h.services.cards.createManual(albaz({ attributes: { type: 'Token', level: null, atk: null, def: null } }), h.anna)
      expect(card.attributes).toEqual({ type: 'Token' })
      const bare = await h.services.cards.createManual({ game: 'ygo', translation: { language: 'de', name: 'Marke' }, set: { setCode: 'X-1' } }, h.anna)
      expect(bare.attributes).toEqual({})
      expect(bare.sets).toMatchObject([{ setCode: 'X-1', setName: null, rarity: null, edition: null }])
    })

    it('keeps the number 0 (ATK 0 is a value, not an empty field)', async () => {
      const card = await h.services.cards.createManual(albaz({ attributes: { atk: 0, def: 0, level: 0 } }), h.anna)
      expect(card.attributes).toEqual({ atk: 0, def: 0, level: 0 })
    })

    it('stores the text in the chosen language', async () => {
      const card = await h.services.cards.createManual(albaz({ translation: { language: 'en', name: 'Albaz the Veiled' } }), h.anna)
      expect(card.name).toBe('Albaz the Veiled')
      expect(card.translations).toEqual([{ language: 'en', name: 'Albaz the Veiled', description: null, details: null }])
    })

    it('stores the edition as typed or chosen, and blank text fields as not present', async () => {
      const card = await h.services.cards.createManual(albaz({ set: { setCode: 'SDAZ-EN047', setName: '  ', rarity: '', edition: 'FIRST_EDITION' } }), h.anna)
      expect(card.sets).toMatchObject([{ setCode: 'SDAZ-EN047', setName: null, rarity: null, edition: 'FIRST_EDITION' }])
    })

    it('registers the game on first use', async () => {
      expect(await h.db.game.count()).toBe(0)
      await h.services.cards.createManual(albaz(), h.anna)
      expect(await h.db.game.count({ where: { slug: 'ygo' } })).toBe(1)
    })

    it('rejects a game that does not support it, and an unknown game', async () => {
      await expect(h.services.cards.createManual(albaz({ game: 'pokemon' }), h.anna)).rejects.toMatchObject({ status: 400, code: 'manual_not_supported' })
      await expect(h.services.cards.createManual(albaz({ game: 'mtg' }), h.anna)).rejects.toMatchObject({ status: 400, code: 'unknown_game' })
      expect(await h.db.card.count()).toBe(0)
    })
  })

  describe('change', () => {
    const logOf = async (cardId: number) =>
      (await h.db.auditLog.findMany({ where: { entityId: cardId, field: { not: 'created' } }, orderBy: { id: 'asc' } }))
        .map(entry => [entry.field, entry.oldValue, entry.newValue])

    it('corrects the name and the description, keeps the card name in step and logs both values', async () => {
      const card = await h.services.cards.createManual(albaz({ translation: { language: 'de', name: 'Albaz der Verschleiert', description: 'Alt' } }), h.anna)
      const changed = await h.services.cards.update(card.id, { translation: { name: 'Albaz der Verschleierte', description: 'Neu' } }, h.anna)

      expect(changed.name).toBe('Albaz der Verschleierte')
      expect(changed.translations).toEqual([{ language: 'de', name: 'Albaz der Verschleierte', description: 'Neu', details: null }])
      expect(changed.userModifiedAt).not.toBeNull()
      expect(await logOf(card.id)).toEqual([
        ['translation.name', 'Albaz der Verschleiert', 'Albaz der Verschleierte'],
        ['translation.description', 'Alt', 'Neu'],
      ])
      expect((await h.db.card.findUniqueOrThrow({ where: { id: card.id } })).name).toBe('Albaz der Verschleierte')
    })

    it('clears the description', async () => {
      const card = await h.services.cards.createManual(albaz(), h.anna)
      const changed = await h.services.cards.update(card.id, { translation: { description: null } }, h.anna)
      expect(changed.translations[0]!.description).toBeNull()
      expect(changed.name).toBe('Albaz der Verschleierte')
    })

    it('changes, adds and removes attributes; a cleared one is gone, not null', async () => {
      const card = await h.services.cards.createManual(albaz({ attributes: { type: 'Token', atk: 1800, def: 0 } }), h.anna)
      const changed = await h.services.cards.update(card.id, { attributes: { atk: null, def: 100, level: 0, race: 'Machine' } }, h.anna)

      expect(changed.attributes).toEqual({ type: 'Token', def: 100, level: 0, race: 'Machine' })
      expect((await h.db.card.findUniqueOrThrow({ where: { id: card.id } })).gameSpecificAttributes).toEqual({ type: 'Token', def: 100, level: 0, race: 'Machine' })
      expect((await logOf(card.id)).sort()).toEqual([
        ['attributes.atk', '1800', null],
        ['attributes.def', '0', '100'],
        ['attributes.level', null, '0'],
        ['attributes.race', null, 'Machine'],
      ])
    })

    it('changes set name, rarity, set code and edition of the print', async () => {
      const card = await h.services.cards.createManual(albaz(), h.anna)
      const changed = await h.services.cards.update(card.id, { set: { setName: 'Albaz Strike', rarity: 'Ultra Rare', setCode: 'SDAZ-EN047', edition: 'FIRST_EDITION' } }, h.anna)
      expect(changed.sets).toMatchObject([{ setCode: 'SDAZ-EN047', setName: 'Albaz Strike', rarity: 'Ultra Rare', edition: 'FIRST_EDITION' }])
      expect(await logOf(card.id)).toEqual(expect.arrayContaining([
        ['set.setName', 'Structure Deck: Albaz Strike', 'Albaz Strike'],
        ['set.rarity', 'Common', 'Ultra Rare'],
      ]))
    })

    it('does nothing and logs nothing for unchanged values', async () => {
      const card = await h.services.cards.createManual(albaz(), h.anna)
      const same = await h.services.cards.update(card.id, {
        translation: { name: 'Albaz der Verschleierte', description: 'Ein Spielstein.' },
        attributes: { type: 'Token', atk: null },
        set: { setName: 'Structure Deck: Albaz Strike', rarity: 'Common' },
      }, h.anna)
      expect(same.userModifiedAt).toBeNull()
      expect(await logOf(card.id)).toEqual([])
    })

    it('is only for the owner', async () => {
      const card = await h.services.cards.createManual(albaz(), h.anna)
      await expect(h.services.cards.update(card.id, { translation: { name: 'Fremd' } }, h.sven)).rejects.toMatchObject({ status: 403, code: 'not_card_owner' })
      expect((await h.services.cards.get(card.id)).name).toBe('Albaz der Verschleierte')
    })

    it('rejects text and attributes of a card from the card database, and changes nothing', async () => {
      const card = await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id), set: { setCode: 'LOB-005', rarity: 'Ultra Rare' } }, h.anna)
      for (const patch of [
        { translation: { name: 'Anders' } },
        { translation: { description: 'Anders' } },
        { attributes: { atk: 1 } },
        { set: { rarity: 'Common' } },
        { set: { setName: 'Anders' } },
        { translation: { name: 'Anders' }, set: { edition: 'FIRST_EDITION' } },
      ]) {
        await expect(h.services.cards.update(card.id, patch, h.anna), JSON.stringify(patch)).rejects.toMatchObject({ status: 400, code: 'field_not_editable' })
      }
      const after = await h.services.cards.get(card.id)
      expect(after.name).toBe('Dunkler Magier')
      expect(after.sets[0]!.edition).toBeNull()
      expect(await logOf(card.id)).toEqual([])
    })

    it('still changes status, owner and purchase date of a manual card', async () => {
      const card = await h.services.cards.createManual(albaz(), h.anna)
      const changed = await h.services.cards.update(card.id, { status: 'SOLD', statusPerson: 'Max', purchaseDate: '2026-11-01' }, h.anna)
      expect(changed).toMatchObject({ status: 'SOLD', statusPerson: 'Max', purchaseDate: '2026-11-01' })
    })
  })

  describe('in the rest of the application', () => {
    it('shows up in the list, in the filter values and in the CSV as added manually', async () => {
      await h.services.cards.createManual(albaz(), h.anna)
      await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id), set: { setCode: 'LOB-005', rarity: 'Ultra Rare' } }, h.anna)

      const list = await h.services.cards.list({}, { page: 1, pageSize: 10 })
      expect(list.items.map(item => item.name).sort()).toEqual(['Albaz der Verschleierte', 'Dunkler Magier'])
      expect(list.items.find(item => item.name === 'Albaz der Verschleierte')).toMatchObject({ setCode: 'SDAZ-DE047', price: null })

      expect((await h.services.cards.facets('ygo')).types).toContain('Token')
      const tokens = await h.services.cards.list({ game: 'ygo', cardType: 'Token' }, { page: 1, pageSize: 10 })
      expect(tokens.items.map(item => item.name)).toEqual(['Albaz der Verschleierte'])

      const { csv } = await h.services.export.cardsCsv({}, { sort: 'name', dir: 'asc' }, 'en')
      const lines = csv.replace(/^\uFEFF/, '').split('\r\n')
      const header = lines[0]!.split(';')
      const row = lines.find(line => line.includes('Albaz der Verschleierte'))!.split(';')
      expect(row[header.indexOf('Origin')]).toBe('added manually')
      expect(row[header.indexOf('External ID')]).toBe('')
    })

    it('leaves the card alone when the card database is asked for prices or an update', async () => {
      const card = await h.services.cards.createManual(albaz(), h.anna)
      await expect(h.services.cards.refresh(card.id, h.anna)).rejects.toMatchObject({ status: 400, code: 'no_external_id' })
      expect(h.ygo.apiCalls()).toBe(0)
    })
  })
})
