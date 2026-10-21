/** Name of the session cookie that remembers the filters, sort order and page of the overview until the next login or logout. */
export const OVERVIEW_QUERY_COOKIE = 'cardkeeper-overview-query'
/** The value of the owner filter for "all owners" in the url; no owner in the url means the logged in user. */
export const ALL_OWNERS = 'all'

/**
 * The owner the overview filters by: the one in the url, else the logged in user (the default). `undefined` shows all
 * owners, `"none"` the cards without one.
 */
export function overviewOwner(fromUrl: string | null | undefined, userId: number | null | undefined): string | undefined {
  if (fromUrl === ALL_OWNERS) {
    return undefined
  }
  if (fromUrl) {
    return fromUrl
  }
  return userId === null || userId === undefined ? undefined : String(userId)
}

/**
 * The query remembered in the cookie as a flat list of strings, or `null` when there is none (or the cookie holds
 * something else). A remembered query is never empty, which is what keeps the redirect to it from repeating.
 */
export function rememberedQuery(value: unknown): Record<string, string> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '')
  return entries.length > 0 ? Object.fromEntries(entries) : null
}

/**
 * The parts of the overview that a card page needs to page through the cards in the order of the overview: the url of a
 * card opened from the overview carries them (and `nav=1`).
 */
const NAV_KEYS = [
  'game', 'status', 'owner', 'q', 'cardType', 'race', 'attribute', 'category', 'pokemonType', 'stage', 'variant', 'rarity',
  'levelMin', 'levelMax', 'hpMin', 'hpMax', 'sort', 'dir',
] as const

type Params = Record<string, unknown>

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : typeof value === 'number' ? String(value) : undefined

/** The url query of a card opened from the overview; `state` is what the overview asks the list for (all games and all owners are `undefined`). */
export function cardLinkQuery(state: Params): Record<string, string> {
  const query: Record<string, string> = { nav: '1' }
  for (const key of NAV_KEYS) {
    const value = text(state[key]) ?? (key === 'game' || key === 'owner' ? 'all' : undefined)
    if (value !== undefined) {
      query[key] = value
    }
  }
  return query
}

/** Whether a card page was opened from the overview, so that it can page through the cards. */
export const hasCardNavigation = (query: Params): boolean => query.nav === '1'

/** The filters and sort order of a card link as the list API takes them. */
export function navApiQuery(query: Params): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of NAV_KEYS) {
    const value = text(query[key])
    if (value !== undefined && !((key === 'game' || key === 'owner') && value === ALL_OWNERS)) {
      result[key] = value
    }
  }
  return result
}

/** The url query of the overview a card link came from, at the page that shows the card (`page` is omitted for the first). */
export function overviewQueryOf(query: Params, page: number | null | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of NAV_KEYS) {
    const value = text(query[key])
    if (value !== undefined) {
      result[key] = value
    }
  }
  if (page && page > 1) {
    result.page = String(page)
  }
  return result
}
