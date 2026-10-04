import { describe, expect, it } from 'vitest'
import { formatDateOnly, parseDateOnly, utcToday } from '../../server/lib/dates'
import { fromCents, parsePrice, toCents } from '../../server/lib/money'

describe('dates', () => {
  it('parses and formats a date-only value without timezone shifts', () => {
    const date = parseDateOnly('2026-12-31')
    expect(date.toISOString()).toBe('2026-12-31T00:00:00.000Z')
    expect(formatDateOnly(date)).toBe('2026-12-31')
  })

  it('accepts leap days only in leap years', () => {
    expect(formatDateOnly(parseDateOnly('2028-02-29'))).toBe('2028-02-29')
    expect(() => parseDateOnly('2027-02-29')).toThrow()
  })

  it.each(['2026-1-1', '04.10.2026', '2026-13-01', '', '2026-10-04T10:00:00Z'])('rejects %j', (value) => {
    expect(() => parseDateOnly(value)).toThrow()
  })

  it('computes today at UTC midnight', () => {
    expect(utcToday(new Date('2026-10-04T23:59:59Z')).toISOString()).toBe('2026-10-04T00:00:00.000Z')
  })
})

describe('money', () => {
  it('sums without floating point drift when using cents', () => {
    const cents = toCents(0.1) + toCents(0.2)
    expect(fromCents(cents)).toBe(0.3)
  })

  it.each([
    ['18.00', 18],
    [' 0.05 ', 0.05],
    [1.239, 1.24],
    [7, 7],
  ])('parses %j as %d', (input, expected) => {
    expect(parsePrice(input)).toBe(expected)
  })

  it.each(['0.00', '', 'abc', null, undefined, -3, {}, NaN])('returns null for %j', (input) => {
    expect(parsePrice(input)).toBeNull()
  })
})
