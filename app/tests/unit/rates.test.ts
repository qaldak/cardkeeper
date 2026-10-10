import { describe, expect, it, vi } from 'vitest'
import { createExchangeRateService } from '../../server/services/rates'

/** A fake Frankfurter: answers `latest?base=X&symbols=Y` from a table, counts the requests. */
function fakeFrankfurter(table: Record<string, number>) {
  const urls: string[] = []
  const state = { fail: false, status: 200 }
  const fetchFn = (async (input: URL | RequestInfo) => {
    const url = new URL(String(input))
    urls.push(String(input))
    if (state.fail) {
      throw new Error('network down')
    }
    const base = url.searchParams.get('base')!
    const symbol = url.searchParams.get('symbols')!
    const rate = table[`${base}>${symbol}`]
    if (state.status !== 200 || rate === undefined) {
      return new Response('{}', { status: state.status !== 200 ? state.status : 404 })
    }
    return new Response(JSON.stringify({ amount: 1, base, date: '2026-10-09', rates: { [symbol]: rate } }), { status: 200 })
  }) as typeof fetch
  return { fetchFn, urls, state }
}

const RATES = { 'EUR>CHF': 0.93, 'USD>CHF': 0.8 }

function setup(table: Record<string, number> = RATES) {
  const fake = fakeFrankfurter(table)
  const clock = { time: new Date('2026-10-10T08:00:00Z') }
  const service = createExchangeRateService({ baseUrl: 'https://rates.test/v1/', fetchFn: fake.fetchFn, now: () => clock.time })
  return { ...fake, clock, service }
}

describe('exchange rates', () => {
  it('asks the service for a pair on first use, once per day', async () => {
    const { service, urls, clock } = setup()
    expect(await service.rate('EUR', 'CHF')).toBe(0.93)
    expect(await service.rate('EUR', 'CHF')).toBe(0.93)
    expect(urls).toEqual(['https://rates.test/v1/latest?base=EUR&symbols=CHF'])

    clock.time = new Date('2026-10-10T23:59:00Z')
    await service.rate('EUR', 'CHF')
    expect(urls).toHaveLength(1)

    clock.time = new Date('2026-10-11T00:01:00Z')
    await service.rate('EUR', 'CHF')
    expect(urls).toHaveLength(2)
  })

  it('asks for a pair only when it is needed', async () => {
    const { service, urls } = setup()
    await service.rate('EUR', 'CHF')
    expect(urls).toHaveLength(1)
    await service.rate('USD', 'CHF')
    expect(urls).toEqual(['https://rates.test/v1/latest?base=EUR&symbols=CHF', 'https://rates.test/v1/latest?base=USD&symbols=CHF'])
  })

  it('needs no request for the same currency', async () => {
    const { service, urls } = setup()
    expect(await service.rate('CHF', 'CHF')).toBe(1)
    expect(urls).toHaveLength(0)
  })

  it('asks once for simultaneous requests of the same pair', async () => {
    const { service, urls } = setup()
    const rates = await Promise.all([service.rate('EUR', 'CHF'), service.rate('EUR', 'CHF'), service.rate('EUR', 'CHF')])
    expect(rates).toEqual([0.93, 0.93, 0.93])
    expect(urls).toHaveLength(1)
  })

  it('has no rate when the service fails, and tries again only after ten minutes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { service, urls, state, clock } = setup()
    state.fail = true
    expect(await service.rate('EUR', 'CHF')).toBeNull()
    expect(await service.rate('EUR', 'CHF')).toBeNull()
    expect(urls).toHaveLength(1)

    state.fail = false
    clock.time = new Date('2026-10-10T08:11:00Z')
    expect(await service.rate('EUR', 'CHF')).toBe(0.93)
    expect(urls).toHaveLength(2)
    warn.mockRestore()
  })

  it('has no rate for an HTTP error, an unknown currency or a bad answer', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { service, state } = setup()
    expect(await service.rate('XXX', 'CHF')).toBeNull()
    state.status = 500
    expect(await service.rate('EUR', 'CHF')).toBeNull()

    const bad = createExchangeRateService({
      baseUrl: 'https://rates.test/v1',
      fetchFn: (async () => new Response(JSON.stringify({ rates: { CHF: 'abc' } }), { status: 200 })) as typeof fetch,
    })
    expect(await bad.rate('EUR', 'CHF')).toBeNull()
    warn.mockRestore()
  })

  it('keeps using the rate of an earlier day while the service is down', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { service, state, clock } = setup()
    await service.rate('EUR', 'CHF')
    state.fail = true
    clock.time = new Date('2026-10-11T09:00:00Z')
    expect(await service.rate('EUR', 'CHF')).toBe(0.93)
    warn.mockRestore()
  })

  describe('converter', () => {
    it('converts into the display currency and leaves it and unknown rates alone', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { service } = setup()
      const convert = await service.converter(['EUR', 'USD', 'CHF', 'XXX'], 'CHF')
      expect(convert(0.09, 'EUR')).toEqual({ amount: 0.08, currency: 'CHF' })
      expect(convert(10, 'USD')).toEqual({ amount: 8, currency: 'CHF' })
      expect(convert(5, 'CHF')).toBeNull()
      expect(convert(5, 'XXX')).toBeNull()
      warn.mockRestore()
    })

    it('does nothing without a display currency', async () => {
      const { service, urls } = setup()
      const convert = await service.converter(['EUR'], null)
      expect(convert(5, 'EUR')).toBeNull()
      expect(urls).toHaveLength(0)
    })
  })
})
