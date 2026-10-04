import { PNG_BYTES } from './png'

export interface FakeYgoCard {
  id: number
  name: string
  prices?: Record<string, string>
  sets?: { set_name: string, set_code: string, set_rarity: string }[]
}

export const DARK_MAGICIAN: FakeYgoCard = {
  id: 46986414,
  name: 'Dark Magician',
  prices: { cardmarket_price: '18.00', tcgplayer_price: '20.00', ebay_price: '0', amazon_price: '0', coolstuffinc_price: '0' },
  sets: [
    { set_name: 'Legend of Blue Eyes White Dragon', set_code: 'LOB-005', set_rarity: 'Ultra Rare' },
    { set_name: 'Starter Deck: Yugi', set_code: 'SDY-006', set_rarity: 'Common' },
  ],
}

export const BLUE_EYES: FakeYgoCard = {
  id: 89631139,
  name: 'Blue-Eyes White Dragon',
  prices: { cardmarket_price: '42.00', tcgplayer_price: '50.00', ebay_price: '0', amazon_price: '0', coolstuffinc_price: '0' },
  sets: [{ set_name: 'Legend of Blue Eyes White Dragon', set_code: 'LOB-001', set_rarity: 'Ultra Rare' }],
}

export function toRawCard(card: FakeYgoCard) {
  return {
    id: card.id,
    name: card.name,
    type: 'Normal Monster',
    frameType: 'normal',
    desc: `Description of ${card.name}`,
    race: 'Spellcaster',
    atk: 2500,
    def: 2100,
    level: 7,
    attribute: 'DARK',
    card_sets: card.sets ?? [],
    card_images: [{
      id: card.id,
      image_url: `https://images.ygoprodeck.com/images/cards/${card.id}.jpg`,
      image_url_small: `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`,
    }],
    card_prices: [card.prices ?? {}],
  }
}

export interface FakeYgoServer {
  fetchFn: typeof fetch
  cards: Map<number, FakeYgoCard>
  /** Number of calls to the card API, to assert that no needless requests are made. */
  apiCalls: () => number
  failImages: boolean
}

/** In-memory stand-in for YGOPRODeck: the card API and the image host. */
export function createFakeYgoServer(initial: FakeYgoCard[]): FakeYgoServer {
  const cards = new Map(initial.map(card => [card.id, card]))
  let calls = 0
  const server: FakeYgoServer = {
    cards,
    failImages: false,
    apiCalls: () => calls,
    fetchFn: (async (input: URL | RequestInfo) => {
      const url = new URL(input instanceof Request ? input.url : String(input))
      if (url.hostname === 'images.ygoprodeck.com') {
        return server.failImages
          ? new Response('not found', { status: 404 })
          : new Response(PNG_BYTES as BodyInit, { status: 200, headers: { 'content-type': 'image/png' } })
      }
      calls += 1
      const id = url.searchParams.get('id')
      const fname = url.searchParams.get('fname')?.toLowerCase()
      const matches = [...cards.values()].filter(card =>
        id ? String(card.id) === id : fname ? card.name.toLowerCase().includes(fname) : false)
      if (matches.length === 0) {
        return new Response(JSON.stringify({ error: 'No card matching your query was found in the database.' }), { status: 400 })
      }
      return new Response(JSON.stringify({ data: matches.map(toRawCard) }), { status: 200 })
    }) as typeof fetch,
  }
  return server
}
