import { describe, expect, it } from 'vitest'
import { formatPrintedNumber, parseCardNumber, sameCardNumber } from '../../shared/utils/pokemon-number'

describe('parseCardNumber', () => {
  it('reads the number and the printed set size of "040/088"', () => {
    expect(parseCardNumber('040/088')).toEqual({ number: '040', total: 88 })
    expect(parseCardNumber(' 40 / 88 ')).toEqual({ number: '40', total: 88 })
  })

  it('accepts a number without the set size', () => {
    expect(parseCardNumber('040')).toEqual({ number: '040', total: null })
    expect(parseCardNumber('040/')).toEqual({ number: '040', total: null })
    expect(parseCardNumber('TG01')).toEqual({ number: 'TG01', total: null })
  })

  it('has no numeric size for lettered sizes such as "TG01/TG30"', () => {
    expect(parseCardNumber('TG01/TG30')).toEqual({ number: 'TG01', total: null })
  })

  it('rejects anything that is not a card number', () => {
    for (const input of ['', '  ', '/88', '1/2/3', 'hello world', '04 0']) {
      expect(parseCardNumber(input), input).toBeNull()
    }
  })
})

describe('sameCardNumber', () => {
  it('ignores leading zeros of numeric numbers', () => {
    expect(sameCardNumber('040', '40')).toBe(true)
    expect(sameCardNumber('40', '040')).toBe(true)
    expect(sameCardNumber('040', '041')).toBe(false)
  })

  it('compares lettered numbers case-insensitively', () => {
    expect(sameCardNumber('TG01', 'tg01')).toBe(true)
    expect(sameCardNumber('TG01', 'TG1')).toBe(false)
    expect(sameCardNumber('040', 'TG040')).toBe(false)
  })
})

describe('formatPrintedNumber', () => {
  it('prints the number as on the card', () => {
    expect(formatPrintedNumber('040', 88)).toBe('040/088')
    expect(formatPrintedNumber('136', 189)).toBe('136/189')
    expect(formatPrintedNumber('40', 88)).toBe('40/88')
  })

  it('has no size when it is unknown or the number is lettered', () => {
    expect(formatPrintedNumber('040', null)).toBe('040')
    expect(formatPrintedNumber('TG01', 30)).toBe('TG01/30')
  })
})
