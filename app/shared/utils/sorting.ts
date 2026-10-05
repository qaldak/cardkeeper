// Sort orders of the collection overview.
export const CARD_SORTS = ['created', 'name', 'level', 'purchaseDate', 'price'] as const

export type CardSort = (typeof CARD_SORTS)[number]

export type SortDirection = 'asc' | 'desc'

export function isCardSort(value: unknown): value is CardSort {
  return typeof value === 'string' && (CARD_SORTS as readonly string[]).includes(value)
}

export function isSortDirection(value: unknown): value is SortDirection {
  return value === 'asc' || value === 'desc'
}

/** "Recently added" starts with the newest card, every other order with the smallest value. */
export function defaultDirection(sort: CardSort): SortDirection {
  return sort === 'created' ? 'desc' : 'asc'
}
