import { describe, expect, it } from 'vitest'
import { formatPrintedNumber, normalizeCardNumberInput, parseCardNumber, sameCardNumber } from '../../shared/utils/pokemon-number'

describe('parseCardNumber', () => {
  it('reads the number and the printed set size of "040/088"', () => {
    expect(parseCardNumber('040/088')).toEqual({ number: '040', total: 88 })
    expect(parseCardNumber(' 40 / 88 ')).toEqual({ number: '40', total: 88 })
  })

  it('reads a number typed without the slash', () => {
    expect(parseCardNumber('040088')).toEqual({ number: '040', total: 88 })
    expect(parseCardNumber('040 088')).toEqual({ number: '040', total: 88 })
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

describe('normalizeCardNumberInput', () => {
  it('adds the slash when it was left out', () => {
    expect(normalizeCardNumberInput('040088')).toBe('040/088')
    expect(normalizeCardNumberInput(' 136189 ')).toBe('136/189')
    expect(normalizeCardNumberInput('00400088')).toBe('0040/0088')
  })

  it('takes a space as the slash', () => {
    expect(normalizeCardNumberInput('040 088')).toBe('040/088')
    expect(normalizeCardNumberInput('40  88')).toBe('40/88')
  })

  it('keeps a typed slash and tidies the spaces around it', () => {
    expect(normalizeCardNumberInput('040/088')).toBe('040/088')
    expect(normalizeCardNumberInput('40 / 88')).toBe('40/88')
  })

  it('leaves ambiguous or lettered input as typed', () => {
    for (const input of ['040', '40088', '4088', '1234567', 'TG01', 'SWSH001', 'TG01/TG30', '04 0', '']) {
      expect(normalizeCardNumberInput(input), input).toBe(input)
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
