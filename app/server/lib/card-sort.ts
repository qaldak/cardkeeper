import { defaultDirection, type CardSort, type SortDirection } from '../../shared/utils/sorting'

/** The values a card is sorted by, loaded together with the filtered cards. */
export interface SortRow {
  id: number
  name: string
  createdAt: Date
  purchaseDate: Date | null
  level: number | null
  /** Latest price of the configured source in cents. */
  priceCents: number | null
}

// German collation: case insensitive, "ä" sorts with "a", numbers by value ("Card 2" before "Card 10").
const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true })

function sortKey(row: SortRow, sort: CardSort): number | string | null {
  switch (sort) {
    case 'name': return row.name
    case 'level': return row.level
    case 'purchaseDate': return row.purchaseDate?.getTime() ?? null
    case 'price': return row.priceCents
    case 'created': return row.createdAt.getTime()
  }
}

const compareKeys = (a: number | string, b: number | string) =>
  typeof a === 'string' && typeof b === 'string' ? collator.compare(a, b) : Number(a) - Number(b)

/**
 * Sorts cards by the chosen order. Cards without a value (no level, no purchase date, no price)
 * always come last, in both directions. Ties are broken by name, then by id, so the order is stable.
 */
export function sortRows(rows: readonly SortRow[], sort: CardSort, direction: SortDirection = defaultDirection(sort)): SortRow[] {
  const sign = direction === 'asc' ? 1 : -1
  const tieBreak = (a: SortRow, b: SortRow) =>
    sort === 'created' ? (a.id - b.id) * sign : collator.compare(a.name, b.name) || a.id - b.id

  return [...rows].sort((a, b) => {
    const keyA = sortKey(a, sort)
    const keyB = sortKey(b, sort)
    if (keyA === null || keyB === null) {
      return keyA === keyB ? tieBreak(a, b) : keyA === null ? 1 : -1
    }
    return compareKeys(keyA, keyB) * sign || tieBreak(a, b)
  })
}
