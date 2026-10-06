// Sort orders of the collection overview.
export const CARD_SORTS = ['created', 'name', 'level', 'hp', 'purchaseDate', 'price'] as const

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

/** Sort orders that make sense for a game; `level` is a Yu-Gi-Oh! value, `hp` a Pokémon value. */
export function sortsForGame(gameSlug: string | undefined): CardSort[] {
  return CARD_SORTS.filter((sort) => {
    if (sort === 'level') {
      return gameSlug === undefined || gameSlug === 'ygo'
    }
    if (sort === 'hp') {
      return gameSlug === undefined || gameSlug === 'pokemon'
    }
    return true
  })
}
