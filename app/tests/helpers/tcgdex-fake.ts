import { readFileSync } from 'node:fs'
import { PNG_BYTES } from './png'

export type RawTcgdexCard = Record<string, unknown> & { id: string, name: string, image?: string, localId?: string }

const fixture = (name: string): RawTcgdexCard =>
  JSON.parse(readFileSync(new URL(`../fixtures/tcgdex/${name}.json`, import.meta.url), 'utf8')) as RawTcgdexCard

export interface FakePokemonCard {
  id: string
  /** Japanese cards exist in the Japanese database only and have no English version. */
  en?: RawTcgdexCard
  /** Cards that were never released in German have no German version. */
  de?: RawTcgdexCard
  ja?: RawTcgdexCard
}

/** Furret / Wiesenior: a Pokémon in Normal and Reverse Holo, with prices. */
export const furret = (): FakePokemonCard => ({ id: 'swsh3-136', en: fixture('furret-en'), de: fixture('furret-de') })
/** A Trainer card that exists in English only. */
export const bossOrders = (): FakePokemonCard => ({ id: 'swsh3-154', en: fixture('trainer-en') })
export const fireEnergy = (): FakePokemonCard => ({ id: 'swsh1-232', en: fixture('energy-en'), de: fixture('energy-de') })
/** The card of the user's example: me03-040, printed as 040/088 (Hippoterus / Hippowdon). */
export const hippowdon = (): FakePokemonCard => ({ id: 'me03-040', en: fixture('hippowdon-en'), de: fixture('hippowdon-de') })
/** A card that only exists in the Japanese database. */
export const japanesePikachu = (): FakePokemonCard => ({ id: 'SV9-040', ja: fixture('pikachu-ja') })

const setFixtures: Record<string, Record<string, unknown>> = {
  'me03:en': fixture('set-me03-en'),
  'me03:de': fixture('set-me03-de'),
  'fx1:en': fixture('set-fx1-en'),
  'SV9:ja': fixture('set-SV9-ja'),
}
const setLists: Record<string, unknown> = { en: fixture('sets-en'), de: fixture('sets-de'), ja: fixture('sets-ja') }

export interface FakeTcgdexServer {
  fetchFn: typeof fetch
  cards: Map<string, FakePokemonCard>
  requestedLanguages: string[]
  requestedUrls: string[]
  /** Images requested from the image host so far. */
  requestedImages: string[]
  failImages: boolean
  /** Simulates an API that answers a German request for an untranslated card with the English card. */
  germanFallsBackToEnglish: boolean
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** In-memory stand-in for TCGdex: the card API (`/v2/<language>/cards`) and the image host. */
export function createFakeTcgdexServer(initial: FakePokemonCard[]): FakeTcgdexServer {
  const cards = new Map(initial.map(card => [card.id, card]))
  const server: FakeTcgdexServer = {
    cards,
    requestedLanguages: [],
    requestedUrls: [],
    requestedImages: [],
    failImages: false,
    germanFallsBackToEnglish: false,
    fetchFn: (async (input: URL | RequestInfo) => {
      const url = new URL(input instanceof Request ? input.url : String(input))
      if (url.hostname === 'assets.tcgdex.net') {
        server.requestedImages.push(url.pathname)
        return server.failImages
          ? new Response('not found', { status: 404 })
          : new Response(PNG_BYTES as BodyInit, { status: 200, headers: { 'content-type': 'image/webp' } })
      }
      server.requestedUrls.push(url.pathname + url.search)

      const [, , language, resource, id] = url.pathname.split('/')
      server.requestedLanguages.push(language!)
      const rawOf = (card: FakePokemonCard) =>
        language === 'de' ? card.de ?? (server.germanFallsBackToEnglish ? card.en : undefined) : language === 'ja' ? card.ja : card.en

      if (resource === 'sets') {
        if (!id) {
          return setLists[language!] ? json(setLists[language!]) : json({ error: 'not found' }, 404)
        }
        const set = setFixtures[`${decodeURIComponent(id)}:${language}`]
        return set ? json(set) : json({ error: 'Endpoint or id not found' }, 404)
      }
      if (resource !== 'cards') {
        return json({ error: 'not found' }, 404)
      }
      if (id) {
        const card = cards.get(decodeURIComponent(id))
        const raw = card && rawOf(card)
        return raw ? json(raw) : json({ error: 'not found' }, 404)
      }
      const name = url.searchParams.get('name')?.replace(/^eq:/, '').toLowerCase() ?? ''
      const limit = Number(url.searchParams.get('pagination:itemsPerPage') ?? 100)
      const matches = [...cards.values()]
        .map(rawOf)
        .filter((raw): raw is RawTcgdexCard => raw !== undefined && raw.name.toLowerCase().includes(name))
        .slice(0, limit)
        .map(raw => ({ id: raw.id, localId: raw.localId, name: raw.name, image: raw.image }))
      return json(matches)
    }) as typeof fetch,
  }
  return server
}
