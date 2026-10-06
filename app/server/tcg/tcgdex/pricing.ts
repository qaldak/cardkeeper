import { parsePrice } from '../../lib/money'
import type { CommonCardPrice } from '../types'

type Record_ = Record<string, unknown>

const isRecord = (value: unknown): value is Record_ =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function currencyOf(block: Record_, fallback: string): string {
  const unit = block.unit
  return typeof unit === 'string' && /^[A-Za-z]{3}$/.test(unit) ? unit.toUpperCase() : fallback
}

/**
 * Maps the `pricing` block of a TCGdex card. Prices keep the currency of their marketplace.
 *
 *  - `cardmarket` (EUR): the price trend, or the average if there is no trend; `cardmarket-holo` is
 *    the same for the holo variant when the API has a separate price for it.
 *  - `tcgplayer-<variant>` (USD): the market price of every variant TCGplayer lists
 *    (e.g. `tcgplayer-normal`, `tcgplayer-reverse`, `tcgplayer-holo`).
 */
export function mapTcgdexPricing(pricing: { cardmarket?: unknown, tcgplayer?: unknown } | null | undefined): CommonCardPrice[] {
  const prices: CommonCardPrice[] = []
  if (!pricing) {
    return prices
  }

  const cardmarket = pricing.cardmarket
  if (isRecord(cardmarket)) {
    const currency = currencyOf(cardmarket, 'EUR')
    const regular = parsePrice(cardmarket.trend) ?? parsePrice(cardmarket.avg)
    if (regular !== null) {
      prices.push({ source: 'cardmarket', price: regular, currency })
    }
    const holo = parsePrice(cardmarket['trend-holo']) ?? parsePrice(cardmarket['avg-holo'])
    if (holo !== null) {
      prices.push({ source: 'cardmarket-holo', price: holo, currency })
    }
  }

  const tcgplayer = pricing.tcgplayer
  if (isRecord(tcgplayer)) {
    const currency = currencyOf(tcgplayer, 'USD')
    for (const [variant, block] of Object.entries(tcgplayer)) {
      if (!isRecord(block)) {
        continue
      }
      const price = parsePrice(block.marketPrice) ?? parsePrice(block.midPrice)
      if (price !== null) {
        const name = variant.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        prices.push({ source: `tcgplayer-${name}`, price, currency })
      }
    }
  }
  return prices
}
