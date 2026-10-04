import { badRequest, HttpError } from '../../lib/errors'
import type { CardAdapter, CommonCard } from '../types'
import { mapYgoCard } from './mapper'
import { ygoResponseSchema } from './schema'

export interface YgoAdapterOptions {
  baseUrl: string
  fetchFn?: typeof fetch
  timeoutMs?: number
}

const LANGUAGES = ['en', 'de', 'fr', 'it', 'pt'] as const
const MAX_SEARCH_RESULTS = 25

export function createYgoAdapter(options: YgoAdapterOptions): CardAdapter {
  const fetchFn = options.fetchFn ?? fetch
  const baseUrl = options.baseUrl.replace(/\/+$/, '')

  function resolveLanguage(language: string | undefined): string {
    const resolved = language ?? 'en'
    if (!(LANGUAGES as readonly string[]).includes(resolved)) {
      throw badRequest('unsupported_language', `Unsupported card language "${resolved}"`)
    }
    return resolved
  }

  /** Calls `cardinfo.php` and returns the raw card objects ([] when nothing matches). */
  async function query(params: Record<string, string>, language: string): Promise<unknown[]> {
    const url = new URL(`${baseUrl}/cardinfo.php`)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
    // English is the API default and has no language parameter.
    if (language !== 'en') {
      url.searchParams.set('language', language)
    }

    let response: Response
    try {
      response = await fetchFn(url, {
        headers: { accept: 'application/json', 'user-agent': 'cardkeeper' },
        signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
      })
    }
    catch {
      throw new HttpError(502, 'upstream_unreachable', 'YGOPRODeck is not reachable')
    }

    if (response.status === 429) {
      throw new HttpError(429, 'upstream_rate_limited', 'YGOPRODeck rate limit reached, try again later')
    }

    const body = await response.json().catch(() => null) as { error?: string } | null

    // The API answers an empty result with HTTP 400 and an explanatory message.
    if (response.status === 400 && typeof body?.error === 'string' && /no card matching/i.test(body.error)) {
      return []
    }
    if (!response.ok) {
      throw new HttpError(502, 'upstream_error', `YGOPRODeck answered with status ${response.status}`)
    }

    const parsed = ygoResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new HttpError(502, 'upstream_invalid_response', 'Unexpected response from YGOPRODeck')
    }
    return parsed.data.data
  }

  const adapter: CardAdapter = {
    slug: 'ygo',
    displayName: 'Yu-Gi-Oh!',
    languages: LANGUAGES,
    defaultLanguage: 'en',
    storedLanguages: ['de', 'en'],
    imageHosts: ['images.ygoprodeck.com'],

    async fetchCardById(externalId, language) {
      const lang = resolveLanguage(language)
      if (!/^\d{1,12}$/.test(externalId)) {
        return null
      }
      const [first] = await query({ id: externalId }, lang)
      return first === undefined ? null : mapYgoCard(first, lang)
    },

    async fetchCardByName(name, language) {
      const lang = resolveLanguage(language)
      const [first] = await query({ name }, lang)
      return first === undefined ? null : mapYgoCard(first, lang)
    },

    async searchCards(text, language) {
      const lang = resolveLanguage(language)
      const trimmed = text.trim()
      if (trimmed === '') {
        return []
      }
      // A numeric query is a passcode, everything else is a fuzzy name search.
      const params: Record<string, string> = /^\d{3,12}$/.test(trimmed) ? { id: trimmed } : { fname: trimmed }
      const results = await query(params, lang)
      return results.slice(0, MAX_SEARCH_RESULTS).map((raw): CommonCard => mapYgoCard(raw, lang))
    },

    mapToCommonSchema(raw, language) {
      return mapYgoCard(raw, resolveLanguage(language))
    },
  }

  return adapter
}
