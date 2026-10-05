import { readFileSync } from 'node:fs'
import { PNG_BYTES } from './png'

export type RawTcgdexCard = Record<string, unknown> & { id: string, name: string, image?: string, localId?: string }

const fixture = (name: string): RawTcgdexCard =>
  JSON.parse(readFileSync(new URL(`../fixtures/tcgdex/${name}.json`, import.meta.url), 'utf8')) as RawTcgdexCard

export interface FakePokemonCard {
  id: string
  en: RawTcgdexCard
  /** Cards that were never released in German have no German version. */
  de?: RawTcgdexCard
}

/** Furret / Wiesenior: a Pokémon in Normal and Reverse Holo, with prices. */
export const furret = (): FakePokemonCard => ({ id: 'swsh3-136', en: fixture('furret-en'), de: fixture('furret-de') })
/** A Trainer card that exists in English only. */
export const bossOrders = (): FakePokemonCard => ({ id: 'swsh3-154', en: fixture('trainer-en') })
export const fireEnergy = (): FakePokemonCard => ({ id: 'swsh1-232', en: fixture('energy-en'), de: fixture('energy-de') })

export interface FakeTcgdexServer {
  fetchFn: typeof fetch
  cards: Map<string, FakePokemonCard>
  requestedLanguages: string[]
  requestedUrls: string[]
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
    failImages: false,
    germanFallsBackToEnglish: false,
    fetchFn: (async (input: URL | RequestInfo) => {
      const url = new URL(input instanceof Request ? input.url : String(input))
      if (url.hostname === 'assets.tcgdex.net') {
        return server.failImages
          ? new Response('not found', { status: 404 })
          : new Response(PNG_BYTES as BodyInit, { status: 200, headers: { 'content-type': 'image/webp' } })
      }
      server.requestedUrls.push(url.pathname + url.search)

      const [, , language, resource, id] = url.pathname.split('/')
      server.requestedLanguages.push(language!)
      const rawOf = (card: FakePokemonCard) =>
        language === 'de' ? card.de ?? (server.germanFallsBackToEnglish ? card.en : undefined) : card.en

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
