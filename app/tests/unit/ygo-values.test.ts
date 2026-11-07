import { describe, expect, it } from 'vitest'
import { deckableByDefault, YGO_ATTRIBUTES, YGO_CARD_TYPES, YGO_NON_DECK_CARD_TYPES, YGO_RACES } from '../../shared/utils/ygo-values'

describe('values of the Yu-Gi-Oh! card database', () => {
  it('knows the 29 card types, including Token', () => {
    expect(YGO_CARD_TYPES).toHaveLength(29)
    expect(YGO_CARD_TYPES).toContain('Token')
  })

  it('has no type "Token" (the API has none)', () => {
    expect(YGO_RACES).not.toContain('Token')
  })

  it('spells the types as the API does', () => {
    expect(YGO_RACES).toContain('Creator God')
    expect(YGO_RACES).not.toContain('Creator-God')
    expect(YGO_RACES).toContain('Illusion')
    expect(YGO_RACES).toContain('Counter')
    expect(YGO_RACES).toHaveLength(33)
  })

  it('has seven attributes', () => {
    expect([...YGO_ATTRIBUTES]).toEqual(['DARK', 'DIVINE', 'EARTH', 'FIRE', 'LIGHT', 'WATER', 'WIND'])
  })

  it.each([
    ['card types', YGO_CARD_TYPES],
    ['types', YGO_RACES],
    ['attributes', YGO_ATTRIBUTES],
  ])('has no duplicate %s', (_name, values) => {
    expect(new Set(values).size).toBe(values.length)
  })
})

describe('deck use by default', () => {
  it('excludes exactly the tokens and the skill cards', () => {
    expect([...YGO_NON_DECK_CARD_TYPES]).toEqual(['Token', 'Skill Card'])
    expect(YGO_CARD_TYPES.filter(type => !deckableByDefault(type))).toEqual(['Skill Card', 'Token'])
  })

  it('is for the deck for every other card type of the card database', () => {
    const others = YGO_CARD_TYPES.filter(type => type !== 'Token' && type !== 'Skill Card')
    expect(others).toHaveLength(27)
    expect(others.every(type => deckableByDefault(type))).toBe(true)
  })

  it('is for the deck without a card type', () => {
    expect(deckableByDefault(undefined)).toBe(true)
    expect(deckableByDefault(null)).toBe(true)
    expect(deckableByDefault('')).toBe(true)
  })
})

