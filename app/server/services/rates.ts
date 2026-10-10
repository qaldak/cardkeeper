import { fromCents, toCents } from '../lib/money'

/** An amount in the currency it was given in, as the display currency, or `null` where it is not converted. */
export type Converter = (amount: number, currency: string) => { amount: number, currency: string } | null

export interface ExchangeRateDeps {
  baseUrl: string
  fetchFn?: typeof fetch
  now?: () => Date
}

interface CachedRate {
  rate: number
  /** The day (UTC, "YYYY-MM-DD") the rate was loaded; a rate is loaded again on the first use of the next day. */
  day: string
}

/** How long a failed request is not repeated, so that an unreachable service is not asked on every page view. */
const RETRY_AFTER_FAILURE_MS = 10 * 60_000
const REQUEST_TIMEOUT_MS = 5_000

/**
 * Exchange rates from Frankfurter (ECB reference rates), one per currency pair, asked for the first time a pair is
 * needed and then once per day (the first use of a new UTC day). The rates are kept in memory only, so they are shared by
 * all users and browsers and are simply asked for again after a restart. When the service cannot be reached, the rate of
 * an earlier day is used; without any, `null` is returned and the caller shows the original amount.
 */
export function createExchangeRateService({ baseUrl, fetchFn = fetch, now = () => new Date() }: ExchangeRateDeps) {
  const cache = new Map<string, CachedRate>()
  const pending = new Map<string, Promise<number | null>>()
  const failedAt = new Map<string, number>()

  async function load(from: string, to: string): Promise<number> {
    const url = `${baseUrl.replace(/\/+$/, '')}/latest?base=${from}&symbols=${to}`
    const response = await fetchFn(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const body = await response.json() as { rates?: Record<string, unknown> }
    const rate = body.rates?.[to]
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(`no rate ${from} → ${to} in the answer`)
    }
    return rate
  }

  async function refresh(key: string, from: string, to: string, day: string): Promise<number | null> {
    try {
      const rate = await load(from, to)
      cache.set(key, { rate, day })
      failedAt.delete(key)
      return rate
    }
    catch (error) {
      failedAt.set(key, now().getTime())
      console.warn(`[rates] ${from} → ${to} could not be loaded${cache.has(key) ? ', the rate of an earlier day is used' : ', the original amount is shown'}:`, (error as Error).message)
      return cache.get(key)?.rate ?? null
    }
  }

  /** How many units of `to` one unit of `from` is worth, or `null` when that is not known. */
  async function rate(from: string, to: string): Promise<number | null> {
    if (from === to) {
      return 1
    }
    const key = `${from}>${to}`
    const day = now().toISOString().slice(0, 10)
    const cached = cache.get(key)
    if (cached?.day === day) {
      return cached.rate
    }
    const failed = failedAt.get(key)
    if (failed !== undefined && now().getTime() - failed < RETRY_AFTER_FAILURE_MS) {
      return cached?.rate ?? null
    }
    let request = pending.get(key)
    if (!request) {
      request = refresh(key, from, to, day).finally(() => pending.delete(key))
      pending.set(key, request)
    }
    return request
  }

  /** The rates of several currencies into `to` at once; currencies without a known rate are left out. */
  async function ratesInto(currencies: Iterable<string>, to: string): Promise<Map<string, number>> {
    const unique = [...new Set(currencies)]
    const rates = await Promise.all(unique.map(currency => rate(currency, to)))
    return new Map(unique.flatMap((currency, index) => rates[index] === null ? [] : [[currency, rates[index]!] as const]))
  }

  /**
   * Converts amounts into the currency `to`. An amount already in that currency, or one whose rate is not known, is not
   * converted (`null`): it is shown as it is.
   */
  async function converter(currencies: Iterable<string>, to: string | null): Promise<Converter> {
    if (to === null) {
      return () => null
    }
    const rates = await ratesInto(currencies, to)
    return (amount, currency) => {
      const factor = currency === to ? undefined : rates.get(currency)
      return factor === undefined ? null : { amount: fromCents(toCents(amount * factor)), currency: to }
    }
  }

  return { rate, ratesInto, converter }
}

export type ExchangeRateService = ReturnType<typeof createExchangeRateService>
