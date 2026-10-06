import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { HttpError } from '../../server/lib/errors'
import { mapTcgdexPricing } from '../../server/tcg/tcgdex/pricing'
import { createTcgdexAdapter } from '../../server/tcg/tcgdex/adapter'
import { createRegistry } from '../../server/tcg/registry'
import type { PokemonAttributes, PokemonDetails } from '../../shared/types/pokemon'

const load = (name: string) =>
  JSON.parse(readFileSync(new URL(`../fixtures/tcgdex/${name}.json`, import.meta.url), 'utf8')) as Record<string, unknown>

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const adapterWith = (fetchFn: typeof fetch) =>
  createTcgdexAdapter({ baseUrl: 'https://tcgdex.test/v2/', fetchFn })

const requested = (fetchFn: ReturnType<typeof vi.fn>, call = 0) => fetchFn.mock.calls[call]![0] as URL

describe('TCGdex adapter: mapping a Pokémon card', () => {
  const adapter = adapterWith(vi.fn() as unknown as typeof fetch)
  const english = adapter.mapToCommonSchema(load('furret-en'), 'en')
  const german = adapter.mapToCommonSchema(load('furret-de'), 'de')
  const attributes = english.attributes as unknown as PokemonAttributes

  it('maps the common fields', () => {
    expect(english).toMatchObject({ externalId: 'swsh3-136', name: 'Furret', language: 'en', description: 'Its nest is a long, narrow tunnel.' })
    expect(german).toMatchObject({ externalId: 'swsh3-136', name: 'Wiesenior', language: 'de', description: 'Sein Nest ist ein langer Tunnel.' })
  })

  it('maps the language independent attributes', () => {
    expect(attributes).toEqual({
      category: 'Pokemon',
      localId: '136',
      setId: 'swsh3',
      setCardCount: { official: 189, total: 201 },
      hp: 110,
      types: ['Colorless'],
      stage: 'Stage1',
      evolveFrom: 'Sentret',
      dexId: [162],
      retreat: 1,
      regulationMark: 'D',
      illustrator: 'tetsuya koizumi',
      legal: { standard: false, expanded: true },
      variants: { normal: true, reverse: true, holo: false, firstEdition: false, wPromo: false },
    })
  })

  it('keeps the texts and the localized names of each language in the details', () => {
    const en = english.details as PokemonDetails
    const de = german.details as PokemonDetails
    expect(en).toMatchObject({ category: 'Pokemon', types: ['Colorless'], stage: 'Stage1', rarity: 'Uncommon', set: { name: 'Darkness Ablaze' } })
    expect(en.attacks).toEqual([
      { name: 'Fetch', cost: ['Colorless'], effect: 'Draw a card.' },
      { name: 'Tail Smash', cost: ['Colorless', 'Colorless', 'Colorless'], damage: 120, effect: 'Flip a coin. If tails, this attack does nothing.' },
    ])
    expect(en.weaknesses).toEqual([{ type: 'Fighting', value: '×2' }])
    expect(de).toMatchObject({ category: 'Pokémon', types: ['Farblos'], stage: 'Phase1', rarity: 'Nicht so selten', set: { name: 'Flammende Finsternis' } })
    expect(de.attacks?.[0]).toMatchObject({ name: 'Apportieren', effect: 'Ziehe eine Karte.' })
  })

  it('offers one printing per variant that exists', () => {
    expect(english.sets).toEqual([
      { setCode: 'swsh3-136', setName: 'Darkness Ablaze', rarity: 'Uncommon', edition: 'normal' },
      { setCode: 'swsh3-136', setName: 'Darkness Ablaze', rarity: 'Uncommon', edition: 'reverse' },
    ])
  })

  it('maps images, keeping the raw payload', () => {
    expect(english.images).toEqual([{
      url: 'https://assets.tcgdex.net/en/swsh/swsh3/136/high.webp',
      smallUrl: 'https://assets.tcgdex.net/en/swsh/swsh3/136/low.webp',
    }])
    expect(english.raw).toEqual(load('furret-en'))
  })

  it('maps the prices of both marketplaces in their currency', () => {
    expect(english.prices).toEqual([
      { source: 'cardmarket', price: 0.1, currency: 'EUR' },
      { source: 'cardmarket-holo', price: 0.4, currency: 'EUR' },
      { source: 'tcgplayer-normal', price: 0.13, currency: 'USD' },
      { source: 'tcgplayer-reverse', price: 0.35, currency: 'USD' },
    ])
  })
})

describe('TCGdex adapter: Trainer and Energy cards', () => {
  const adapter = adapterWith(vi.fn() as unknown as typeof fetch)

  it('maps a Trainer card with its rules text as description', () => {
    const card = adapter.mapToCommonSchema(load('trainer-en'), 'en')
    const attributes = card.attributes as unknown as PokemonAttributes
    expect(attributes).toMatchObject({ category: 'Trainer', trainerType: 'Supporter', regulationMark: 'D' })
    expect(attributes.hp).toBeUndefined()
    expect(attributes.types).toBeUndefined()
    expect(card.description).toBe("Switch 1 of your opponent's Benched Pokémon with their Active Pokémon.")
    expect(card.sets.map(set => set.edition)).toEqual(['holo'])
    expect(card.prices.map(price => price.source)).toEqual(['cardmarket', 'cardmarket-holo'])
  })

  it('maps an Energy card', () => {
    const card = adapter.mapToCommonSchema(load('energy-de'), 'de')
    expect(card.attributes).toMatchObject({ category: 'Energy', energyType: 'Basis' })
    expect((card.details as PokemonDetails).effect).toBe('Liefert 1 Feuer-Energie.')
    expect(card.prices).toEqual([])
  })

  it('tolerates a card with only id and name and offers the normal variant', () => {
    const card = adapter.mapToCommonSchema({ id: 'x1-001', name: 'Minimal' }, 'en')
    expect(card.attributes).toMatchObject({ category: 'Pokemon', localId: '001', setId: 'x1' })
    expect(card.sets).toEqual([{ setCode: 'x1-001', setName: null, rarity: null, edition: 'normal' }])
    expect(card.images).toEqual([])
    expect(card.prices).toEqual([])
  })

  it('rejects malformed payloads with a 502', () => {
    expect(() => adapter.mapToCommonSchema({ name: 'no id' }, 'en')).toThrow(HttpError)
    expect(() => adapter.mapToCommonSchema({ id: 'a-1', name: 'x', attacks: 'many' }, 'en')).toThrow(HttpError)
  })

  it('rejects unsupported languages', () => {
    expect(() => adapter.mapToCommonSchema(load('furret-en'), 'xx')).toThrow(/Unsupported/)
  })
})

describe('mapTcgdexPricing', () => {
  it('uses the trend, falls back to the average and skips missing or zero values', () => {
    expect(mapTcgdexPricing({ cardmarket: { unit: 'EUR', avg: 2.5, trend: null } })).toEqual([{ source: 'cardmarket', price: 2.5, currency: 'EUR' }])
    expect(mapTcgdexPricing({ cardmarket: { unit: 'EUR', trend: 0, avg: 0 } })).toEqual([])
    expect(mapTcgdexPricing({ cardmarket: { trend: 1 } })).toEqual([{ source: 'cardmarket', price: 1, currency: 'EUR' }])
  })

  it('maps every TCGplayer variant and falls back to the mid price', () => {
    const prices = mapTcgdexPricing({
      tcgplayer: { unit: 'USD', 'reverse-holofoil': { marketPrice: 5 }, normal: { midPrice: 1.5 }, holo: { lowPrice: 1 }, updated: '2026-10-01' },
    })
    expect(prices).toEqual([
      { source: 'tcgplayer-reverse-holofoil', price: 5, currency: 'USD' },
      { source: 'tcgplayer-normal', price: 1.5, currency: 'USD' },
    ])
  })

  it('handles missing pricing', () => {
    expect(mapTcgdexPricing(undefined)).toEqual([])
    expect(mapTcgdexPricing(null)).toEqual([])
    expect(mapTcgdexPricing({ cardmarket: null, tcgplayer: 'broken' })).toEqual([])
  })
})

describe('TCGdex adapter: requests', () => {
  it('fetches a card by id in the requested language', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(load('furret-de')))
    const card = await adapterWith(fetchFn).fetchCardById('swsh3-136', 'de')
    expect(card?.name).toBe('Wiesenior')
    expect(requested(fetchFn).toString()).toBe('https://tcgdex.test/v2/de/cards/swsh3-136')
  })

  it('answers null for an unknown card (404)', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('', { status: 404 }))
    expect(await adapterWith(fetchFn).fetchCardById('swsh3-999', 'en')).toBeNull()
  })

  it('does not call the API for something that is not a card id', async () => {
    const fetchFn = vi.fn()
    const adapter = adapterWith(fetchFn)
    for (const value of ['', 'furret', '../../etc', 'swsh3-136/../x', 'a b-1', 'swsh3-136?x=1']) {
      expect(await adapter.fetchCardById(value)).toBeNull()
    }
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('searches by name with a page size and returns brief cards with thumbnails', async () => {
    const list = [{ id: 'swsh3-136', localId: '136', name: 'Furret', image: 'https://assets.tcgdex.net/en/swsh/swsh3/136' }, { id: 'base1-4', name: 'Charizard' }]
    const fetchFn = vi.fn().mockResolvedValue(json(list))
    const results = await adapterWith(fetchFn).searchCards('fur', 'en')
    const url = requested(fetchFn)
    expect(url.pathname).toBe('/v2/en/cards')
    expect(url.searchParams.get('name')).toBe('fur')
    expect(url.searchParams.get('pagination:itemsPerPage')).toBe('50')
    expect(results.map(card => card.externalId)).toEqual(['swsh3-136', 'base1-4'])
    expect(results[0]!.images[0]!.smallUrl).toBe('https://assets.tcgdex.net/en/swsh/swsh3/136/low.webp')
    expect(results[1]!.images).toEqual([])
    expect(results[0]).toMatchObject({ language: 'en', sets: [], prices: [], attributes: { localId: '136' } })
  })

  it('finds a card by its id when the name search finds nothing', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(json([]))
      .mockResolvedValueOnce(json(load('furret-en')))
    const results = await adapterWith(fetchFn).searchCards('swsh3-136', 'en')
    expect(results.map(card => card.externalId)).toEqual(['swsh3-136'])
    expect(requested(fetchFn, 1).pathname).toBe('/v2/en/cards/swsh3-136')
  })

  it('does not mistake a name with a hyphen for an id when the name matches', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json([{ id: 'sm7-87', name: 'Ho-Oh' }]))
    const results = await adapterWith(fetchFn).searchCards('Ho-Oh', 'en')
    expect(results.map(card => card.name)).toEqual(['Ho-Oh'])
    expect(fetchFn).toHaveBeenCalledOnce()
  })

  it('returns nothing for a blank search and for no match', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json([]))
    const adapter = adapterWith(fetchFn)
    expect(await adapter.searchCards('   ')).toEqual([])
    expect(await adapter.searchCards('zzzz', 'en')).toEqual([])
  })

  it('fetches a card by exact name', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(json([{ id: 'swsh3-136', name: 'Furret' }]))
      .mockResolvedValueOnce(json(load('furret-en')))
    const card = await adapterWith(fetchFn).fetchCardByName('Furret', 'en')
    expect(requested(fetchFn).searchParams.get('name')).toBe('eq:Furret')
    expect(card?.externalId).toBe('swsh3-136')
  })

  it('maps upstream failures to stable error codes and keeps the details', async () => {
    const run = (response: Response | Error) => {
      const fetchFn = response instanceof Error ? vi.fn().mockRejectedValue(response) : vi.fn().mockResolvedValue(response)
      return adapterWith(fetchFn).fetchCardById('swsh3-136').catch((error: HttpError) => error)
    }
    expect(await run(new Response('', { status: 429 }))).toMatchObject({ status: 429, code: 'upstream_rate_limited' })
    const failed = await run(new Response('database error', { status: 500 }))
    expect(failed).toMatchObject({ status: 502, code: 'upstream_error' })
    expect((failed as HttpError).message).toContain('status 500')
    expect((failed as HttpError).message).toContain('database error')
    expect(await run(new Response('<html>', { status: 200 }))).toMatchObject({ status: 502, code: 'upstream_invalid_response' })
    expect(await run(json({ id: 1 }))).toMatchObject({ status: 502, code: 'upstream_invalid_response' })

    const cause = new Error('connect EHOSTUNREACH')
    const unreachable = await run(new TypeError('fetch failed', { cause }))
    expect(unreachable).toMatchObject({ status: 502, code: 'upstream_unreachable' })
    expect(((unreachable as HttpError).cause as Error).cause).toBe(cause)
  })

  it('rejects an unexpected search response', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json({ not: 'a list' }))
    await expect(adapterWith(fetchFn).searchCards('fur', 'en')).rejects.toMatchObject({ status: 502, code: 'upstream_invalid_response' })
  })
})

describe('TCGdex adapter: configuration', () => {
  const adapter = adapterWith(vi.fn() as unknown as typeof fetch)

  it('describes the game', () => {
    expect(adapter).toMatchObject({
      slug: 'pokemon',
      displayName: 'Pokémon',
      defaultLanguage: 'en',
      storedLanguages: ['de', 'en', 'ja'],
      imageHosts: ['assets.tcgdex.net'],
      searchThumbnails: true,
    })
    expect(adapter.languages).toEqual(['en', 'de', 'fr', 'it', 'es', 'pt-br', 'ja'])
  })

  it('is registered next to Yu-Gi-Oh!', () => {
    const registry = createRegistry([adapter])
    expect(registry.require('pokemon')).toBe(adapter)
  })
})

describe('TCGdex adapter: sets', () => {
  const setRoutes = (routes: Record<string, unknown>) =>
    vi.fn(async (input: URL | RequestInfo) => {
      const path = new URL(String(input)).pathname
      return path in routes ? json(routes[path]) : json({ error: 'not found' }, 404)
    })

  it('lists the sets with logo and the printed and total card counts', async () => {
    const fetchFn = setRoutes({ '/v2/en/sets': load('sets-en') })
    const sets = await adapterWith(fetchFn as unknown as typeof fetch).listSets!('en')
    expect(sets.find(set => set.id === 'me03')).toEqual({
      id: 'me03',
      name: 'Fixture Set ME03',
      logoUrl: 'https://assets.tcgdex.net/en/me/me03/logo.webp',
      official: 88,
      total: 120,
    })
    // the printed size 88 belongs to more than one set: the number alone does not identify the set
    expect(sets.filter(set => set.official === 88).map(set => set.id)).toEqual(['me03', 'fx1'])
  })

  it('keeps sets without a card count and without images', async () => {
    const sets = await adapterWith(setRoutes({ '/v2/en/sets': load('sets-en') }) as unknown as typeof fetch).listSets!('en')
    expect(sets.find(set => set.id === 'nocount')).toMatchObject({ official: null, total: null })
  })

  it('lists the cards of a set with their number and thumbnail', async () => {
    const fetchFn = setRoutes({ '/v2/de/sets/me03': load('set-me03-de') })
    const cards = await adapterWith(fetchFn as unknown as typeof fetch).listSetCards!('me03', 'de')
    expect(cards!.find(card => card.id === 'me03-040')).toEqual({
      id: 'me03-040',
      number: '040',
      name: 'Hippoterus',
      imageUrl: 'https://assets.tcgdex.net/de/me/me03/040/high.webp',
      thumbnailUrl: 'https://assets.tcgdex.net/de/me/me03/040/low.webp',
    })
  })

  it('returns null for an unknown set', async () => {
    const fetchFn = setRoutes({})
    expect(await adapterWith(fetchFn as unknown as typeof fetch).listSetCards!('nope', 'en')).toBeNull()
  })

  it('does not ask the API for a set id with unexpected characters', async () => {
    const fetchFn = setRoutes({})
    expect(await adapterWith(fetchFn as unknown as typeof fetch).listSetCards!('../cards', 'en')).toBeNull()
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('rejects an unexpected set list with a 502', async () => {
    const fetchFn = setRoutes({ '/v2/en/sets': { not: 'a list' } })
    await expect(adapterWith(fetchFn as unknown as typeof fetch).listSets!('en')).rejects.toMatchObject({ status: 502, code: 'upstream_invalid_response' })
  })
})

describe('TCGdex adapter: Japanese cards', () => {
  const adapter = adapterWith(vi.fn() as unknown as typeof fetch)

  it('maps Japanese categories, types and stages to the English spelling', () => {
    const card = adapter.mapToCommonSchema(load('pikachu-ja'), 'ja')
    expect(card).toMatchObject({ externalId: 'SV9-040', name: 'ピカチュウ', language: 'ja' })
    expect(card.attributes).toMatchObject({ category: 'Pokemon', types: ['Lightning'], stage: 'Basic', localId: '040', setId: 'SV9' })
  })

  it('leaves unknown Japanese values as delivered', () => {
    const card = adapter.mapToCommonSchema({ ...load('pikachu-ja'), stage: 'ふしぎ' }, 'ja')
    expect(card.attributes).toMatchObject({ stage: 'ふしぎ' })
  })

  it('does not touch the values of other languages', () => {
    const card = adapter.mapToCommonSchema(load('furret-de'), 'de')
    expect(card.attributes).toMatchObject({ types: ['Farblos'] })
  })

  it('searches Japanese names only with Japanese text; a Latin text is tried as an id', async () => {
    const fetchFn = vi.fn(async () => json({ error: 'not found' }, 404))
    const ja = adapterWith(fetchFn as unknown as typeof fetch)
    await ja.searchCards('SV9-040', 'ja')
    expect(fetchFn.mock.calls.map(call => String((call as unknown as [URL])[0]))).toEqual(['https://tcgdex.test/v2/ja/cards/SV9-040'])
    fetchFn.mockClear()
    await ja.searchCards('ピカ', 'ja')
    expect(String((fetchFn.mock.calls[0] as unknown as [URL])[0])).toContain('/v2/ja/cards?name=')
  })
})
