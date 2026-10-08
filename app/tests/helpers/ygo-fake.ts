import { PNG_BYTES } from './png'

export interface FakeYgoCard {
  id: number
  name: string
  /** German name; a card without one is only available in English. */
  nameDe?: string
  descDe?: string
  type?: string
  race?: string
  attribute?: string
  level?: number
  prices?: Record<string, string>
  sets?: { set_name: string, set_code: string, set_rarity: string }[]
  /** Printings in the German response, if they differ from the English ones. */
  setsDe?: { set_name: string, set_code: string, set_rarity: string }[]
  /** Fields of the raw API card that replace the generated ones (`undefined` removes one). */
  raw?: Record<string, unknown>
}

export const DARK_MAGICIAN: FakeYgoCard = {
  id: 46986414,
  name: 'Dark Magician',
  nameDe: 'Dunkler Magier',
  descDe: 'Der ultimative Magier in Angriff und Verteidigung.',
  type: 'Normal Monster',
  race: 'Spellcaster',
  attribute: 'DARK',
  level: 7,
  prices: { cardmarket_price: '18.00', tcgplayer_price: '20.00', ebay_price: '0', amazon_price: '0', coolstuffinc_price: '0' },
  sets: [
    { set_name: 'Legend of Blue Eyes White Dragon', set_code: 'LOB-005', set_rarity: 'Ultra Rare' },
    { set_name: 'Starter Deck: Yugi', set_code: 'SDY-006', set_rarity: 'Common' },
  ],
  setsDe: [
    { set_name: 'Legend of Blue Eyes White Dragon', set_code: 'LOB-005', set_rarity: 'Ultra Rare' },
    { set_name: 'Starter Deck: Yugi', set_code: 'SDY-006', set_rarity: 'Common' },
    { set_name: 'Legend of Blue Eyes White Dragon', set_code: 'LOB-DE005', set_rarity: 'Secret Rare' },
  ],
}

export const BLUE_EYES: FakeYgoCard = {
  id: 89631139,
  name: 'Blue-Eyes White Dragon',
  nameDe: 'Blauäugiger weißer Drache',
  type: 'Normal Monster',
  race: 'Dragon',
  attribute: 'LIGHT',
  level: 8,
  prices: { cardmarket_price: '42.00', tcgplayer_price: '50.00', ebay_price: '0', amazon_price: '0', coolstuffinc_price: '0' },
  sets: [{ set_name: 'Legend of Blue Eyes White Dragon', set_code: 'LOB-001', set_rarity: 'Ultra Rare' }],
}

/** A Link monster: no level and no DEF, but a link rating and link markers. */
export const LINK_MONSTER: FakeYgoCard = {
  id: 24361622,
  name: 'Link Spider',
  nameDe: 'Link-Spinne',
  type: 'Link Monster',
  race: 'Cyberse',
  attribute: 'EARTH',
  prices: { cardmarket_price: '0.50', tcgplayer_price: '0.40', ebay_price: '0', amazon_price: '0', coolstuffinc_price: '0' },
  sets: [{ set_name: 'Starter Deck: Link Strike', set_code: 'SDLS-EN043', set_rarity: 'Common' }],
  raw: { frameType: 'link', atk: 1000, def: undefined, level: undefined, linkval: 1, linkmarkers: ['Bottom'], typeline: ['Cyberse', 'Link', 'Normal'] },
}

/** A card that exists in English only. */
export const ENGLISH_ONLY: FakeYgoCard = {
  id: 11111111,
  name: 'Obscure Spell',
  type: 'Spell Card',
  race: 'Normal',
  prices: { cardmarket_price: '1.50', tcgplayer_price: '0', ebay_price: '0', amazon_price: '0', coolstuffinc_price: '0' },
  sets: [{ set_name: 'Obscure Set', set_code: 'OBS-001', set_rarity: 'Rare' }],
}

export function toRawCard(card: FakeYgoCard, language = 'en') {
  // A card without German text answers with the English text, like the real API might.
  const german = language === 'de' && card.nameDe !== undefined
  return {
    id: card.id,
    name: german ? card.nameDe ?? card.name : card.name,
    type: card.type ?? 'Effect Monster',
    frameType: 'normal',
    desc: german ? card.descDe ?? `Beschreibung von ${card.nameDe ?? card.name}` : `Description of ${card.name}`,
    race: card.race ?? 'Spellcaster',
    ...(card.type === 'Spell Card' ? {} : { atk: 2500, def: 2100, level: card.level ?? 4, attribute: card.attribute ?? 'DARK' }),
    card_sets: (german ? card.setsDe : undefined) ?? card.sets ?? [],
    card_images: [{
      id: card.id,
      image_url: `https://images.ygoprodeck.com/images/cards/${card.id}.jpg`,
      image_url_small: `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`,
    }],
    card_prices: [card.prices ?? {}],
    ...card.raw,
  }
}

export interface FakeYgoServer {
  fetchFn: typeof fetch
  cards: Map<number, FakeYgoCard>
  /** Number of calls to the card API, to assert that no needless requests are made. */
  apiCalls: () => number
  /** Languages requested so far, in order. */
  requestedLanguages: string[]
  /** Images requested from the image host so far. */
  requestedImages: string[]
  failImages: boolean
  /**
   * Simulates an API that answers a German request for an untranslated card with the English card
   * instead of "not found".
   */
  germanFallsBackToEnglish: boolean
}

/** In-memory stand-in for YGOPRODeck: the card API and the image host. */
export function createFakeYgoServer(initial: FakeYgoCard[]): FakeYgoServer {
  const cards = new Map(initial.map(card => [card.id, card]))
  let calls = 0
  const server: FakeYgoServer = {
    cards,
    failImages: false,
    germanFallsBackToEnglish: false,
    requestedLanguages: [],
    requestedImages: [],
    apiCalls: () => calls,
    fetchFn: (async (input: URL | RequestInfo) => {
      const url = new URL(input instanceof Request ? input.url : String(input))
      if (url.hostname === 'images.ygoprodeck.com') {
        server.requestedImages.push(url.pathname)
        return server.failImages
          ? new Response('not found', { status: 404 })
          : new Response(PNG_BYTES as BodyInit, { status: 200, headers: { 'content-type': 'image/png' } })
      }
      calls += 1
      const language = url.searchParams.get('language') ?? 'en'
      server.requestedLanguages.push(language)
      const german = language === 'de'
      const id = url.searchParams.get('id')
      const fname = url.searchParams.get('fname')?.toLowerCase()
      const matches = [...cards.values()].filter((card) => {
        if (german && !card.nameDe && !server.germanFallsBackToEnglish) {
          return false
        }
        const nameInLanguage = (german ? card.nameDe : undefined) ?? card.name
        return id ? String(card.id) === id : fname ? nameInLanguage.toLowerCase().includes(fname) : false
      })
      if (matches.length === 0) {
        return new Response(JSON.stringify({ error: 'No card matching your query was found in the database.' }), { status: 400 })
      }
      return new Response(JSON.stringify({ data: matches.map(card => toRawCard(card, language)) }), { status: 200 })
    }) as typeof fetch,
  }
  return server
}
