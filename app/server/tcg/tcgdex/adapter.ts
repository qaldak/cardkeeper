import { eszettVariants } from '../../../shared/utils/eszett'
import { badRequest, HttpError } from '../../lib/errors'
import type { CardAdapter, CommonCard, GameSet, SetCard } from '../types'
import { cardImages, mapTcgdexCard } from './mapper'
import { tcgdexBriefListSchema, tcgdexSetListSchema, tcgdexSetSchema } from './schema'

export interface TcgdexAdapterOptions {
  /** E.g. https://api.tcgdex.net/v2 (the language and resource are appended). */
  baseUrl: string
  fetchFn?: typeof fetch
  timeoutMs?: number
}

const LANGUAGES = ['en', 'de', 'fr', 'it', 'es', 'pt-br', 'ja'] as const
const MAX_SEARCH_RESULTS = 50
const MAX_ERROR_TEXT = 200

// Card ids are "<set id>-<number in set>", e.g. "swsh3-136", "sv04.5-001" or "P-A-001".
const CARD_ID = /^[A-Za-z0-9.]+(?:-[A-Za-z0-9.]+)+$/
// Set ids are a card id without the number; Japanese sets use the printed code in mixed case ("SV9", "S12a").
const SET_ID = /^[A-Za-z0-9.]+(?:-[A-Za-z0-9.]+)*$/

/** Logos are delivered without a file extension, like the card images. */
const asset = (base: string | undefined) => (base ? `${base}.webp` : null)

export function createTcgdexAdapter(options: TcgdexAdapterOptions): CardAdapter {
  const fetchFn = options.fetchFn ?? fetch
  const baseUrl = options.baseUrl.replace(/\/+$/, '')

  function resolveLanguage(language: string | undefined): string {
    const resolved = language ?? 'en'
    if (!(LANGUAGES as readonly string[]).includes(resolved)) {
      throw badRequest('unsupported_language', `Unsupported card language "${resolved}"`)
    }
    return resolved
  }

  /** GETs `<baseUrl>/<language>/<path>` and returns the parsed JSON, or null for 404 (not found). */
  async function request(language: string, path: string, params: Record<string, string> = {}): Promise<unknown> {
    const url = new URL(`${baseUrl}/${language}/${path}`)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
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
      throw new HttpError(502, 'upstream_unreachable', 'TCGdex is not reachable', { cause: error })
    }

    if (response.status === 404) {
      return null
    }
    if (response.status === 429) {
      throw new HttpError(429, 'upstream_rate_limited', 'TCGdex rate limit reached, try again later')
    }
    if (!response.ok) {
      const text = (await response.text().catch(() => '')).trim().slice(0, MAX_ERROR_TEXT)
      throw new HttpError(502, 'upstream_error', `TCGdex answered with status ${response.status}${text ? `: ${text}` : ''}`)
    }

    try {
      return await response.json()
    }
    catch {
      throw new HttpError(502, 'upstream_invalid_response', 'Unexpected response from TCGdex')
    }
  }

  async function fetchCardById(externalId: string, language?: string): Promise<CommonCard | null> {
    const lang = resolveLanguage(language)
    // Reject anything that is not a card id before it becomes part of a URL path.
    if (!CARD_ID.test(externalId)) {
      return null
    }
    const raw = await request(lang, `cards/${encodeURIComponent(externalId)}`)
    return raw === null ? null : mapTcgdexCard(raw, lang)
  }

  /** Brief cards of a name search: only id, number, name and image. */
  async function searchBrief(name: string, language: string, exact: boolean): Promise<CommonCard[]> {
    const body = await request(language, 'cards', {
      name: exact ? `eq:${name}` : name,
      'pagination:page': '1',
      'pagination:itemsPerPage': String(MAX_SEARCH_RESULTS),
    })
    if (body === null) {
      return []
    }
    const parsed = tcgdexBriefListSchema.safeParse(body)
    if (!parsed.success) {
      throw new HttpError(502, 'upstream_invalid_response', 'Unexpected response from TCGdex')
    }
    return parsed.data.map((brief): CommonCard => ({
      externalId: brief.id,
      name: brief.name,
      description: null,
      language,
      attributes: { localId: String(brief.localId ?? brief.id.split('-').pop() ?? '') },
      details: null,
      sets: [],
      images: cardImages(brief.image),
      prices: [],
      raw: brief,
    }))
  }

  return {
    slug: 'pokemon',
    displayName: 'Pokémon',
    languages: LANGUAGES,
    defaultLanguage: 'en',
    // Japanese cards live in their own database with their own ids; a card that does not exist in a language
    // is left out, so asking for all three languages is harmless for German and English cards.
    storedLanguages: ['de', 'en', 'ja'],
    imageHosts: ['assets.tcgdex.net'],
    // TCGdex is an open project that serves its images for apps; thumbnails make the many printings
    // of a Pokémon distinguishable.
    searchThumbnails: true,

    fetchCardById,

    async fetchCardByName(name, language) {
      const lang = resolveLanguage(language)
      // "weisser" for "weißer": the typed spelling first, then the others, until one exists.
      for (const spelling of eszettVariants(name.trim())) {
        const [first] = await searchBrief(spelling, lang, true)
        if (first) {
          return fetchCardById(first.externalId, lang)
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
      // Japanese names are written in kana and kanji: a Latin name cannot match there, so only the id is tried.
      const searchableByName = lang !== 'ja' || /[^\x20-\x7E]/.test(trimmed)
      const byName = searchableByName ? await searchBrief(trimmed, lang, false) : []
      if (byName.length > 0) {
        return byName
      }
      // Names like "Ho-Oh" look like ids, so the id is only tried when the name search finds nothing.
      if (CARD_ID.test(trimmed)) {
        const byId = await fetchCardById(trimmed, lang)
        return byId ? [byId] : []
      }
      return []
    },

    mapToCommonSchema(raw, language) {
      return mapTcgdexCard(raw, resolveLanguage(language))
    },

    async listSets(language) {
      const lang = resolveLanguage(language)
      const body = await request(lang, 'sets')
      if (body === null) {
        return []
      }
      const parsed = tcgdexSetListSchema.safeParse(body)
      if (!parsed.success) {
        throw new HttpError(502, 'upstream_invalid_response', 'Unexpected response from TCGdex')
      }
      return parsed.data.map((set): GameSet => ({
        id: set.id,
        name: set.name,
        logoUrl: asset(set.logo),
        official: set.cardCount?.official ?? null,
        total: set.cardCount?.total ?? null,
      }))
    },

    async listSetCards(setId, language) {
      const lang = resolveLanguage(language)
      if (!SET_ID.test(setId)) {
        return null
      }
      const body = await request(lang, `sets/${encodeURIComponent(setId)}`)
      if (body === null) {
        return null
      }
      const parsed = tcgdexSetSchema.safeParse(body)
      if (!parsed.success) {
        throw new HttpError(502, 'upstream_invalid_response', 'Unexpected response from TCGdex')
      }
      return parsed.data.cards.map((card): SetCard => ({
        id: card.id,
        number: String(card.localId ?? card.id.split('-').pop() ?? ''),
        name: card.name,
        imageUrl: card.image ? `${card.image}/high.webp` : null,
        thumbnailUrl: card.image ? `${card.image}/low.webp` : null,
      }))
    },
  }
}
