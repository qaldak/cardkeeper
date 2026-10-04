import { describe, expect, it } from 'vitest'
import { CARD_STATUSES, isCardStatus, statusNeedsDate, statusNeedsPerson } from '../../shared/utils/status'
import { normalizeStatusChange } from '../../server/lib/status'
import { HttpError } from '../../server/lib/errors'

const NOW = new Date('2026-10-04T15:30:00Z')

describe('status rules', () => {
  it('knows all statuses', () => {
    expect(CARD_STATUSES).toEqual(['ACTIVE', 'SOLD', 'TRADED', 'GIFTED', 'LOST'])
    expect(isCardStatus('SOLD')).toBe(true)
    expect(isCardStatus('aktiv')).toBe(false)
    expect(isCardStatus(undefined)).toBe(false)
  })

  it('requires a date for everything except ACTIVE', () => {
    expect(statusNeedsDate('ACTIVE')).toBe(false)
    expect(statusNeedsDate('LOST')).toBe(true)
    expect(statusNeedsDate('SOLD')).toBe(true)
  })

  it('records a person only when the card went to someone', () => {
    expect(statusNeedsPerson('SOLD')).toBe(true)
    expect(statusNeedsPerson('TRADED')).toBe(true)
    expect(statusNeedsPerson('GIFTED')).toBe(true)
    expect(statusNeedsPerson('LOST')).toBe(false)
    expect(statusNeedsPerson('ACTIVE')).toBe(false)
  })
})

describe('normalizeStatusChange', () => {
  it('keeps date and trimmed person for a sale', () => {
    const result = normalizeStatusChange({ status: 'SOLD', date: '2026-09-01', person: '  Max Muster ' }, NOW)
    expect(result.status).toBe('SOLD')
    expect(result.date.toISOString()).toBe('2026-09-01T00:00:00.000Z')
    expect(result.person).toBe('Max Muster')
  })

  it('defaults the date to today (UTC)', () => {
    const result = normalizeStatusChange({ status: 'GIFTED' }, NOW)
    expect(result.date.toISOString()).toBe('2026-10-04T00:00:00.000Z')
    expect(result.person).toBeNull()
  })

  it('drops the person for LOST', () => {
    expect(normalizeStatusChange({ status: 'LOST', date: '2026-10-01', person: 'Someone' }, NOW).person).toBeNull()
  })

  it('ignores date and person for ACTIVE', () => {
    const result = normalizeStatusChange({ status: 'ACTIVE', date: '2020-01-01', person: 'Someone' }, NOW)
    expect(result.person).toBeNull()
    expect(result.date.toISOString()).toBe('2026-10-04T00:00:00.000Z')
  })

  it('treats a blank person as empty', () => {
    expect(normalizeStatusChange({ status: 'SOLD', person: '   ' }, NOW).person).toBeNull()
  })

  it('rejects an impossible date', () => {
    expect(() => normalizeStatusChange({ status: 'SOLD', date: '2026-02-30' }, NOW)).toThrow(HttpError)
  })

  it('rejects an unknown status', () => {
    expect(() => normalizeStatusChange({ status: 'GONE' as never }, NOW)).toThrow(HttpError)
  })
})
