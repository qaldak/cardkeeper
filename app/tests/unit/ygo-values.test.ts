import { describe, expect, it } from 'vitest'
import { YGO_ATTRIBUTES, YGO_CARD_TYPES, YGO_RACES } from '../../shared/utils/ygo-values'

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
