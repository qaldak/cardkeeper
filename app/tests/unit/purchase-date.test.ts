import { describe, expect, it } from 'vitest'
import { assertPurchaseDate } from '../../server/lib/dates'
import { EARLIEST_PURCHASE_DATE, latestPurchaseDate, todayOnDevice } from '../../shared/utils/purchase-date'

describe('purchase date in the browser', () => {
  it('is today on the device, whatever the time zone', () => {
    // local time, not UTC: half past midnight is already the new day
    expect(todayOnDevice(new Date(2026, 10, 19, 0, 30))).toBe('2026-11-19')
    expect(todayOnDevice(new Date(2026, 10, 18, 23, 59))).toBe('2026-11-18')
    expect(todayOnDevice(new Date(2027, 0, 5, 12, 0))).toBe('2027-01-05')
  })
})

describe('the latest purchase date the server accepts', () => {
  it('is the date it already is at UTC+14', () => {
    expect(latestPurchaseDate(new Date('2026-11-18T09:59:59Z'))).toBe('2026-11-18')
    expect(latestPurchaseDate(new Date('2026-11-18T10:00:00Z'))).toBe('2026-11-19')
    expect(latestPurchaseDate(new Date('2026-11-18T23:30:00Z'))).toBe('2026-11-19')
    expect(latestPurchaseDate(new Date('2026-12-31T12:00:00Z'))).toBe('2027-01-01')
  })

  it('lets the day of a user in Switzerland through in the first hours after midnight', () => {
    // 00:30 in Zurich on 19 November is 23:30 UTC on 18 November
    expect(latestPurchaseDate(new Date('2026-11-18T23:30:00Z')) >= '2026-11-19').toBe(true)
  })
})

describe('assertPurchaseDate', () => {
  const now = new Date('2026-11-18T12:00:00Z')

  it('accepts no date, a past date and today', () => {
    for (const value of [undefined, null, '', '1990-01-01', '2020-01-01', '2026-11-17', '2026-11-18']) {
      expect(() => assertPurchaseDate(value, now), String(value)).not.toThrow()
    }
  })

  it('refuses a date after the latest accepted date, with its own code', () => {
    for (const value of ['2026-11-20', '2026-12-01', '2027-01-01']) {
      expect(() => assertPurchaseDate(value, now), value).toThrowError(expect.objectContaining({ status: 400, code: 'purchase_date_in_future' }))
    }
  })

  it('refuses a date before the earliest date, with its own code (a year typed with two or three digits)', () => {
    expect(EARLIEST_PURCHASE_DATE).toBe('1990-01-01')
    for (const value of ['0026-12-18', '0126-12-18', '1899-01-01', '1989-12-31']) {
      expect(() => assertPurchaseDate(value, now), value).toThrowError(expect.objectContaining({ status: 400, code: 'purchase_date_too_early' }))
    }
  })
})
