import { describe, expect, it } from 'vitest'
import { eszettVariants, foldEszett } from '../../shared/utils/eszett'

describe('eszettVariants', () => {
  it('returns a text without ss or ß as it is', () => {
    expect(eszettVariants('Dunkler Magier')).toEqual(['Dunkler Magier'])
    expect(eszettVariants('')).toEqual([''])
  })

  it('adds the ß spelling for a typed ss, the typed one first', () => {
    expect(eszettVariants('weisser Drache')).toEqual(['weisser Drache', 'weißer Drache'])
  })

  it('adds the ss spelling for a typed ß', () => {
    expect(eszettVariants('weißer')).toEqual(['weißer', 'weisser'])
  })

  it('exchanges every ss/ß independently: each combination is searched', () => {
    expect(eszettVariants('Fluss und Hass').sort()).toEqual(['Fluss und Hass', 'Fluss und Haß', 'Fluß und Hass', 'Fluß und Haß'].sort())
    expect(eszettVariants('Fluss und Hass')[0]).toBe('Fluss und Hass')
  })

  it('also handles capitals and ß next to ss', () => {
    expect(eszettVariants('WEISSER')).toContain('WEIßER')
    expect(eszettVariants('Straße und Strasse')).toHaveLength(4)
  })

  it('does not explode for many occurrences', () => {
    const many = 'Ass Ass Ass Ass Ass'
    // Typed text, all ß (all ss is the typed text again).
    expect(eszettVariants(many)).toEqual([many, 'Aß Aß Aß Aß Aß'])
    expect(eszettVariants('Aß Aß Aß Aß Aß')).toEqual(['Aß Aß Aß Aß Aß', 'Ass Ass Ass Ass Ass'])
  })
})

describe('foldEszett', () => {
  it('compares ß and ss, and ignores the case', () => {
    expect(foldEszett('Weißer Drache')).toBe(foldEszett('WEISSER drache'))
    expect(foldEszett('Straße')).toBe('strasse')
  })
})
