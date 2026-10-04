import { HttpError } from '../../lib/errors'
import { parsePrice } from '../../lib/money'
import type { CommonCard, CommonCardPrice } from '../types'
import { ygoCardSchema } from './schema'

// Marketplace price fields of the API and the currency each one is quoted in.
const PRICE_SOURCES = [
  { field: 'cardmarket_price', source: 'cardmarket', currency: 'EUR' },
  { field: 'tcgplayer_price', source: 'tcgplayer', currency: 'USD' },
  { field: 'ebay_price', source: 'ebay', currency: 'USD' },
  { field: 'amazon_price', source: 'amazon', currency: 'USD' },
  { field: 'coolstuffinc_price', source: 'coolstuffinc', currency: 'USD' },
] as const

/** Maps one YGOPRODeck card to the common card schema. Throws a 502 if the payload is malformed. */
export function mapYgoCard(raw: unknown, language: string): CommonCard {
  const parsed = ygoCardSchema.safeParse(raw)
  if (!parsed.success) {
    throw new HttpError(502, 'upstream_invalid_response', 'Unexpected card data from YGOPRODeck')
  }
  const card = parsed.data

  const attributes = Object.fromEntries(Object.entries({
    passcode: String(card.id),
    type: card.type,
    frameType: card.frameType,
    race: card.race,
    attribute: card.attribute,
    archetype: card.archetype,
    typeline: card.typeline,
    atk: card.atk,
    def: card.def,
    level: card.level,
    scale: card.scale,
    linkval: card.linkval,
    linkmarkers: card.linkmarkers,
  }).filter(([, value]) => value !== undefined))

  const prices: CommonCardPrice[] = []
  const priceRecord = card.card_prices?.[0]
  if (priceRecord) {
    for (const { field, source, currency } of PRICE_SOURCES) {
      const price = parsePrice(priceRecord[field])
      if (price !== null) {
        prices.push({ source, price, currency })
      }
    }
  }

  return {
    externalId: String(card.id),
    name: card.name,
    description: card.desc ?? null,
    language,
    attributes,
    sets: (card.card_sets ?? []).map(set => ({
      setCode: set.set_code,
      setName: set.set_name,
      rarity: set.set_rarity ?? null,
    })),
    images: (card.card_images ?? []).map(image => ({
      url: image.image_url,
      smallUrl: image.image_url_small ?? null,
    })),
    prices,
    raw,
  }
}
