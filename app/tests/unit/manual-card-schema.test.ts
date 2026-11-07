import { describe, expect, it } from 'vitest'
import { createManualCardSchema, updateCardSchema } from '../../server/lib/schemas'

const valid = { game: 'ygo', translation: { name: 'Albaz der Verschleierte' }, set: { setCode: 'sdaz-de047' } }

describe('input for a manually entered card', () => {
  it('accepts name and set code only, writes the set code in capitals and presets German', () => {
    const parsed = createManualCardSchema.parse(valid)
    expect(parsed.set.setCode).toBe('SDAZ-DE047')
    expect(parsed.translation.language).toBe('de')
    expect(parsed.attributes).toBeUndefined()
  })

  it('accepts every optional field', () => {
    const parsed = createManualCardSchema.parse({
      ...valid,
      translation: { language: 'en', name: 'Albaz Token', description: 'A token.' },
      set: { setCode: 'SDAZ-EN047', setName: 'Structure Deck: Albaz Strike', rarity: 'Common', edition: 'FIRST_EDITION' },
      attributes: { type: 'Token', race: 'Dragon', attribute: 'DARK', level: 4, atk: 1800, def: 0 },
      purchaseDate: '2026-11-07',
    })
    expect(parsed.attributes).toEqual({ type: 'Token', race: 'Dragon', attribute: 'DARK', level: 4, atk: 1800, def: 0 })
    expect(parsed.translation.language).toBe('en')
  })

  it('accepts the switch for the deck as a boolean only', () => {
    expect(createManualCardSchema.parse({ ...valid, deckable: true }).deckable).toBe(true)
    expect(createManualCardSchema.parse(valid).deckable).toBeUndefined()
    expect(() => createManualCardSchema.parse({ ...valid, deckable: 'yes' })).toThrow()
    expect(updateCardSchema.parse({ deckable: false })).toEqual({ deckable: false })
    expect(() => updateCardSchema.parse({ deckable: null })).toThrow()
  })

  it('accepts empty numbers and an empty description', () => {
    expect(() => createManualCardSchema.parse({ ...valid, translation: { name: 'X', description: null }, attributes: { level: null, atk: null, def: null } })).not.toThrow()
  })

  it.each([
    ['without a name', { ...valid, translation: {} }],
    ['with an empty name', { ...valid, translation: { name: '  ' } }],
    ['without a set code', { ...valid, set: {} }],
    ['with an empty set code', { ...valid, set: { setCode: ' ' } }],
    ['with an external ID', { ...valid, externalId: '12345' }],
    ['with a card type the database does not have', { ...valid, attributes: { type: 'Counter / Token' } }],
    ['with the type "Token"', { ...valid, attributes: { race: 'Token' } }],
    ['with an unknown attribute', { ...valid, attributes: { attribute: 'Dark' } }],
    ['with a negative ATK', { ...valid, attributes: { atk: -1 } }],
    ['with the marker "?"', { ...valid, attributes: { def: '?' } }],
    ['with a fractional level', { ...valid, attributes: { level: 4.5 } }],
    ['with a language that is not stored', { ...valid, translation: { language: 'ja', name: 'X' } }],
    ['with a wrong date', { ...valid, purchaseDate: '07.11.2026' }],
  ])('rejects input %s', (_name, input) => {
    expect(() => createManualCardSchema.parse(input)).toThrow()
  })
})

describe('changing a card (text and attributes of a manual card)', () => {
  it('accepts text, set name, rarity and attributes', () => {
    const parsed = updateCardSchema.parse({
      translation: { name: 'Albaz der Verschleierte', description: null },
      set: { setName: 'Structure Deck: Albaz Strike', rarity: 'Common' },
      attributes: { type: 'Token', atk: null },
    })
    expect(parsed.attributes).toEqual({ type: 'Token', atk: null })
  })

  it('still rejects a name at the top level', () => {
    expect(() => updateCardSchema.parse({ name: 'X' })).toThrow()
  })

  it('rejects a value the card database does not use', () => {
    expect(() => updateCardSchema.parse({ attributes: { type: 'Counter / Token' } })).toThrow()
    expect(() => updateCardSchema.parse({ translation: { name: '' } })).toThrow()
  })
})
