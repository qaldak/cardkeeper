import { describe, expect, it } from 'vitest'
import { sortRows, type SortRow } from '../../server/lib/card-sort'
import { CARD_SORTS, defaultDirection, isCardSort, isSortDirection } from '../../shared/utils/sorting'

const day = (value: string) => new Date(`${value}T00:00:00Z`)

const rows: SortRow[] = [
  { id: 1, name: 'Zeitmagierin', createdAt: day('2026-03-01'), purchaseDate: day('2026-03-01'), level: 2, priceCents: 950 },
  { id: 2, name: 'Ärger', createdAt: day('2026-01-01'), purchaseDate: day('2026-01-01'), level: 7, priceCents: 1800 },
  { id: 3, name: 'apfel', createdAt: day('2026-02-01'), purchaseDate: null, level: null, priceCents: null },
  { id: 4, name: 'blue', createdAt: day('2026-04-01'), purchaseDate: day('2026-03-01'), level: 7, priceCents: 1800 },
]

const ids = (sort: Parameters<typeof sortRows>[1], dir?: 'asc' | 'desc') => sortRows(rows, sort, dir).map(row => row.id)

describe('sortRows', () => {
  it('sorts by name case-insensitively and with umlauts next to their base letter', () => {
    expect(ids('name', 'asc')).toEqual([3, 2, 4, 1]) // apfel, Ärger, blue, Zeitmagierin
    expect(ids('name', 'desc')).toEqual([1, 4, 2, 3])
  })

  it('sorts numbers inside names by value', () => {
    const numbered = ['Card 10', 'Card 2', 'Card 1'].map((name, index): SortRow => ({
      id: index + 1, name, createdAt: day('2026-01-01'), purchaseDate: null, level: null, priceCents: null,
    }))
    expect(sortRows(numbered, 'name', 'asc').map(row => row.name)).toEqual(['Card 1', 'Card 2', 'Card 10'])
  })

  it('sorts by level and breaks ties by name; cards without a level come last in both directions', () => {
    expect(ids('level', 'asc')).toEqual([1, 2, 4, 3]) // 2, then 7 (Ärger, blue), then none
    expect(ids('level', 'desc')).toEqual([2, 4, 1, 3]) // 7 (Ärger, blue), 2, then none
  })

  it('sorts by purchase date; cards without a date come last in both directions', () => {
    expect(ids('purchaseDate', 'asc')).toEqual([2, 4, 1, 3]) // Jan, Mar (blue, Zeitmagierin), none
    expect(ids('purchaseDate', 'desc')).toEqual([4, 1, 2, 3]) // Mar (blue, Zeitmagierin), Jan, none
  })

  it('sorts by price; cards without a price come last in both directions', () => {
    expect(ids('price', 'asc')).toEqual([1, 2, 4, 3])
    expect(ids('price', 'desc')).toEqual([2, 4, 1, 3])
  })

  it('sorts by the date a card was added', () => {
    expect(ids('created', 'asc')).toEqual([2, 3, 1, 4])
    expect(ids('created', 'desc')).toEqual([4, 1, 3, 2])
  })

  it('uses the default direction when none is given', () => {
    expect(ids('created')).toEqual(ids('created', 'desc'))
    expect(ids('name')).toEqual(ids('name', 'asc'))
    expect(ids('price')).toEqual(ids('price', 'asc'))
  })

  it('is stable for equal values and does not change its input', () => {
    const equal = [3, 1, 2].map((id): SortRow => ({ id, name: 'Same', createdAt: day('2026-01-01'), purchaseDate: null, level: 5, priceCents: 100 }))
    expect(sortRows(equal, 'level', 'asc').map(row => row.id)).toEqual([1, 2, 3])
    expect(equal.map(row => row.id)).toEqual([3, 1, 2])
  })
})

describe('sort definitions', () => {
  it('lists the orders of the overview', () => {
    expect(CARD_SORTS).toEqual(['created', 'name', 'level', 'purchaseDate', 'price'])
    expect(isCardSort('price')).toBe(true)
    expect(isCardSort('rarity')).toBe(false)
    expect(isSortDirection('desc')).toBe(true)
    expect(isSortDirection('up')).toBe(false)
  })

  it('starts "recently added" with the newest card and every other order with the smallest value', () => {
    expect(defaultDirection('created')).toBe('desc')
    for (const sort of CARD_SORTS.filter(entry => entry !== 'created')) {
      expect(defaultDirection(sort)).toBe('asc')
    }
  })
})
