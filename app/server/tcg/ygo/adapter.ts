import { eszettVariants } from '../../../shared/utils/eszett'
import { isSetCode, normalizeSetCode, setCodeSpellings } from '../../../shared/utils/set-code'
import { badRequest, HttpError } from '../../lib/errors'
import type { CardAdapter, CommonCard } from '../types'
import { mapYgoCard } from './mapper'
import { setPrintSchema, ygoResponseSchema } from './schema'

export interface YgoAdapterOptions {
  baseUrl: string
  fetchFn?: typeof fetch
  timeoutMs?: number
}

const LANGUAGES = ['en', 'de', 'fr', 'it', 'pt'] as const
const MAX_SEARCH_RESULTS = 25

// The API reports every error as HTTP 400 with a JSON body `{ "error": "<message>" }`: an empty
// result as well as an invalid parameter. Only the message tells them apart.
const NO_RESULT = /no cards? (matching|found)/i
const MAX_ERROR_TEXT = 200

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

  /** Calls an endpoint of the API; an unreachable server and the rate limit are errors, everything else is returned. */
  async function call(endpoint: string, params: Record<string, string>, language?: string) {
    const url = new URL(`${baseUrl}/${endpoint}`)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
    // English is the API default and has no language parameter.
    if (language && language !== 'en') {
      url.searchParams.set('language', language)
    }

    let response: Response
    try {
      response = await fetchFn(url, {
        headers: { accept: 'application/json', 'user-agent': 'cardkeeper' },
        signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
      })
    }
    catch (error) {
      // Keep the cause (DNS error, refused connection, timeout, ...) so it shows up in the logs.
      throw new HttpError(502, 'upstream_unreachable', 'YGOPRODeck is not reachable', { cause: error })
    }

    if (response.status === 429) {
      throw new HttpError(429, 'upstream_rate_limited', 'YGOPRODeck rate limit reached, try again later')
    }

    const body = await response.json().catch(() => null) as { error?: unknown } | null
    const apiError = typeof body?.error === 'string' ? body.error : undefined
    return { response, body, apiError }
  }

  /** Calls `cardinfo.php` and returns the raw card objects ([] when nothing matches). */
  async function query(params: Record<string, string>, language: string): Promise<unknown[]> {
    const { response, body, apiError } = await call('cardinfo.php', params, language)

    if (response.status === 400 && apiError !== undefined && NO_RESULT.test(apiError)) {
      return []
    }
    if (!response.ok) {
      // Any other error means our request was not accepted (e.g. an invalid parameter value):
      // pass the API's own message on so the cause is visible in the logs.
      const detail = apiError ? `: ${apiError.slice(0, MAX_ERROR_TEXT)}` : ''
      throw new HttpError(502, 'upstream_error', `YGOPRODeck answered with status ${response.status}${detail}`)
    }

    const parsed = ygoResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw new HttpError(502, 'upstream_invalid_response', 'Unexpected response from YGOPRODeck')
    }
    return parsed.data.data
  }

  /** The card of one print: `cardsetsinfo.php` answers a set code with the print and the card it belongs to. */
  async function cardOfSetCode(setCode: string): Promise<{ id: string, name: string | null } | null> {
    const { response, body, apiError } = await call('cardsetsinfo.php', { setcode: setCode })
    // A code that does not exist is an error of the API (HTTP 400), the same as an empty result of a card search.
    if (response.status === 400 || response.status === 404) {
      return null
    }
    if (!response.ok) {
      const detail = apiError ? `: ${apiError.slice(0, MAX_ERROR_TEXT)}` : ''
      throw new HttpError(502, 'upstream_error', `YGOPRODeck answered with status ${response.status}${detail}`)
    }
    // The print itself, or a list of them: either way only the card (passcode and name) is wanted.
    const entry = Array.isArray((body as { data?: unknown } | null)?.data) ? (body as { data: unknown[] }).data[0] : body
    const parsed = setPrintSchema.safeParse(entry)
    if (!parsed.success) {
      if (entry !== undefined && entry !== null && apiError === undefined) {
        throw new HttpError(502, 'upstream_invalid_response', 'Unexpected response from YGOPRODeck')
      }
      return null
    }
    return { id: String(parsed.data.id), name: parsed.data.name ?? null }
  }

  // The card of a set code does not change: asking for it once per language of the lookup is enough.
  const setCodeCards = new Map<string, { at: number, card: { id: string, name: string | null } | null }>()
  const SET_CODE_CACHE_MS = 5 * 60_000
  const SET_CODE_CACHE_SIZE = 200

  /** The card of a set code; a code of another language falls back to the English print of the same card. */
  async function findBySetCode(text: string): Promise<{ id: string, name: string | null } | null> {
    const key = normalizeSetCode(text)
    const cached = setCodeCards.get(key)
    if (cached && Date.now() - cached.at < SET_CODE_CACHE_MS) {
      return cached.card
    }
    let card: { id: string, name: string | null } | null = null
    for (const spelling of setCodeSpellings(key)) {
      card = await cardOfSetCode(spelling)
      if (card) {
        break
      }
    }
    if (setCodeCards.size >= SET_CODE_CACHE_SIZE) {
      setCodeCards.clear()
    }
    setCodeCards.set(key, { at: Date.now(), card })
    return card
  }

  const adapter: CardAdapter = {
    slug: 'ygo',
    displayName: 'Yu-Gi-Oh!',
    languages: LANGUAGES,
    defaultLanguage: 'en',
    storedLanguages: ['de', 'en'],
    imageHosts: ['images.ygoprodeck.com'],
    // YGOPRODeck asks not to hotlink its images: the lookup shows them from the app's own copy (see thumbnails).
    searchThumbnails: false,
    thumbnailSource: externalId => /^\d{1,12}$/.test(externalId) ? `https://images.ygoprodeck.com/images/cards_small/${externalId}.jpg` : null,

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
      // "weisser" for "weißer": the typed spelling first, then the others, until one exists.
      for (const spelling of eszettVariants(name.trim())) {
        const [first] = await query({ name: spelling }, lang)
        if (first !== undefined) {
          return mapYgoCard(first, lang)
        }
      }
      return null
    },

    async searchCards(text, language) {
      const lang = resolveLanguage(language)
      const trimmed = text.trim()
      if (trimmed === '') {
        return []
      }
      // The set code of a print ("L5DD-ENA15"): the card it belongs to, in the language asked for. A text that only looks
      // like a set code and finds nothing is searched as a name, too.
      if (isSetCode(trimmed)) {
        const hit = await findBySetCode(trimmed)
        if (hit) {
          const card = await adapter.fetchCardById(hit.id, lang)
            ?? (lang === 'en' && hit.name ? await adapter.fetchCardByName(hit.name, lang) : null)
          return card ? [card] : []
        }
      }
      // A numeric query is a passcode, everything else is a fuzzy name search.
      const params: Record<string, string> = /^\d{3,12}$/.test(trimmed) ? { id: trimmed } : { fname: trimmed }
      const results = (await query(params, lang)).slice(0, MAX_SEARCH_RESULTS)
      // One unusable card does not spoil the search for all the others (it is logged by the mapper).
      const cards: CommonCard[] = []
      let failure: unknown
      for (const raw of results) {
        try {
          cards.push(mapYgoCard(raw, lang))
        }
        catch (error) {
          failure ??= error
        }
      }
      if (cards.length === 0 && failure) {
        throw failure
      }
      return cards
    },

    mapToCommonSchema(raw, language) {
      return mapYgoCard(raw, resolveLanguage(language))
    },
  }

  return adapter
}
