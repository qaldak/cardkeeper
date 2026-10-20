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
