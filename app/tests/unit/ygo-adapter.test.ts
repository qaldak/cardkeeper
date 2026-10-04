import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { HttpError } from '../../server/lib/errors'
import { createRegistry } from '../../server/tcg/registry'
import { createYgoAdapter } from '../../server/tcg/ygo/adapter'

const fixture = JSON.parse(readFileSync(new URL('../fixtures/ygo-dark-magician.json', import.meta.url), 'utf8')) as { data: unknown[] }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function adapterWith(fetchFn: typeof fetch) {
  return createYgoAdapter({ baseUrl: 'https://ygo.test/api/v7/', fetchFn })
}

function requestedUrl(fetchFn: ReturnType<typeof vi.fn>): URL {
  return fetchFn.mock.calls[0]![0] as URL
}

describe('YGO adapter: mapping', () => {
  const adapter = adapterWith(vi.fn() as unknown as typeof fetch)
  const card = adapter.mapToCommonSchema(fixture.data[0])

  it('maps the common fields', () => {
    expect(card.externalId).toBe('46986414')
    expect(card.name).toBe('Dark Magician')
    expect(card.description).toBe('The ultimate wizard in terms of attack and defense.')
    expect(card.language).toBe('en')
  })

  it('maps game specific attributes', () => {
    expect(card.attributes).toMatchObject({
      passcode: '46986414',
      type: 'Normal Monster',
      race: 'Spellcaster',
      attribute: 'DARK',
      atk: 2500,
      def: 2100,
      level: 7,
      archetype: 'Dark Magician',
    })
    expect(card.attributes).not.toHaveProperty('scale')
    expect(card.attributes).not.toHaveProperty('linkval')
  })

  it('maps printings', () => {
    expect(card.sets).toEqual([
      { setCode: 'LOB-005', setName: 'Legend of Blue Eyes White Dragon', rarity: 'Ultra Rare' },
      { setCode: 'LOB-EN005', setName: 'Legend of Blue Eyes White Dragon', rarity: 'Secret Rare' },
    ])
  })

  it('maps images and keeps the raw payload', () => {
    expect(card.images).toEqual([{
      url: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
      smallUrl: 'https://images.ygoprodeck.com/images/cards_small/46986414.jpg',
    }])
    expect(card.raw).toBe(fixture.data[0])
  })

  it('maps marketplace prices with their own currency and skips zero prices', () => {
    expect(card.prices).toEqual([
      { source: 'cardmarket', price: 0.05, currency: 'EUR' },
      { source: 'tcgplayer', price: 0.17, currency: 'USD' },
      { source: 'ebay', price: 1.29, currency: 'USD' },
      { source: 'amazon', price: 1.99, currency: 'USD' },
    ])
  })

  it('tolerates cards without printings, images and prices', () => {
    const minimal = adapter.mapToCommonSchema({ id: 1, name: 'Minimal' }, 'de')
    expect(minimal).toMatchObject({ externalId: '1', description: null, language: 'de', sets: [], images: [], prices: [] })
  })

  it('rejects malformed card payloads with a 502', () => {
    expect(() => adapter.mapToCommonSchema({ id: 'x' })).toThrow(HttpError)
    try {
      adapter.mapToCommonSchema({ name: 'no id' })
    }
    catch (error) {
      expect((error as HttpError).status).toBe(502)
      expect((error as HttpError).code).toBe('upstream_invalid_response')
    }
  })

  it('rejects unsupported languages', () => {
    expect(() => adapter.mapToCommonSchema(fixture.data[0], 'xx')).toThrow(/Unsupported/)
  })
})

describe('YGO adapter: requests', () => {
  it('fetches a card by passcode', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(fixture))
    const card = await adapterWith(fetchFn).fetchCardById('46986414')
    expect(card?.name).toBe('Dark Magician')
    expect(requestedUrl(fetchFn).toString()).toBe('https://ygo.test/api/v7/cardinfo.php?id=46986414')
  })

  it('requests a localized card and omits the parameter for English', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(fixture))
    const card = await adapterWith(fetchFn).fetchCardById('46986414', 'de')
    expect(requestedUrl(fetchFn).searchParams.get('language')).toBe('de')
    expect(card?.language).toBe('de')

    const english = vi.fn().mockResolvedValue(json(fixture))
    await adapterWith(english).fetchCardById('46986414', 'en')
    expect(requestedUrl(english).searchParams.has('language')).toBe(false)
  })

  it('does not call the API for a malformed passcode', async () => {
    const fetchFn = vi.fn()
    expect(await adapterWith(fetchFn).fetchCardById('46986414&misc=yes')).toBeNull()
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('fetches by exact name', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(fixture))
    await adapterWith(fetchFn).fetchCardByName('Dark Magician')
    expect(requestedUrl(fetchFn).searchParams.get('name')).toBe('Dark Magician')
  })

  it('searches fuzzy by name and by passcode', async () => {
    const byName = vi.fn().mockResolvedValue(json(fixture))
    const results = await adapterWith(byName).searchCards('Dark Mag')
    expect(results).toHaveLength(1)
    expect(requestedUrl(byName).searchParams.get('fname')).toBe('Dark Mag')

    const byId = vi.fn().mockResolvedValue(json(fixture))
    await adapterWith(byId).searchCards('46986414')
    expect(requestedUrl(byId).searchParams.get('id')).toBe('46986414')
  })

  it('caps the number of search results', async () => {
    const many = { data: Array.from({ length: 80 }, (_, index) => ({ id: index + 1, name: `Card ${index}` })) }
    const results = await adapterWith(vi.fn().mockResolvedValue(json(many))).searchCards('card')
    expect(results).toHaveLength(25)
  })

  it('returns nothing for a blank search without calling the API', async () => {
    const fetchFn = vi.fn()
    expect(await adapterWith(fetchFn).searchCards('   ')).toEqual([])
    expect(fetchFn).not.toHaveBeenCalled()
  })

  // The API reports every error as HTTP 400 with {"error": "..."}; the text tells them apart.
  it.each([
    'No card matching your query was found in the database.',
    'No card matching your query was found in the database. Please see https://ygoprodeck.com/api-guide/ for syntax usage.',
    'No cards found.',
  ])('treats the 400 "%s" as an empty result', async (message) => {
    // A fresh Response per call: a body can only be read once.
    const fetchFn = vi.fn().mockImplementation(() => Promise.resolve(json({ error: message }, 400)))
    const adapter = adapterWith(fetchFn)
    expect(await adapter.fetchCardById('1234567')).toBeNull()
    expect(await adapter.searchCards('zzzz')).toEqual([])
  })

  it('does not treat other 400 errors as an empty result and passes the API message on', async () => {
    const message = 'No valid parameter set. Accepted parameters: name, fname, id, ...'
    const fetchFn = vi.fn().mockImplementation(() => Promise.resolve(json({ error: message }, 400)))
    const error = await adapterWith(fetchFn).searchCards('dark').catch((e: HttpError) => e)
    expect(error).toMatchObject({ status: 502, code: 'upstream_error' })
    expect((error as HttpError).message).toContain('status 400')
    expect((error as HttpError).message).toContain(message)
  })

  it('shortens a very long API error message', async () => {
    const fetchFn = vi.fn().mockImplementation(() => Promise.resolve(json({ error: 'x'.repeat(5000) }, 400)))
    const error = await adapterWith(fetchFn).searchCards('dark').catch((e: HttpError) => e)
    expect((error as HttpError).message.length).toBeLessThan(300)
  })

  it('handles a 400 without a JSON body or without an error text', async () => {
    for (const response of [() => new Response('<html>blocked</html>', { status: 400 }), () => json({ unexpected: true }, 400), () => json({ error: { nested: true } }, 400)]) {
      const fetchFn = vi.fn().mockImplementation(() => Promise.resolve(response()))
      expect(await adapterWith(fetchFn).fetchCardById('46986414').catch((e: HttpError) => e)).toMatchObject({ status: 502, code: 'upstream_error' })
    }
  })

  it('keeps the cause of a network failure for the logs', async () => {
    const cause = Object.assign(new Error('connect EHOSTUNREACH 104.20.45.245:443'), { code: 'EHOSTUNREACH' })
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('fetch failed', { cause }))
    const error = await adapterWith(fetchFn).fetchCardById('46986414').catch((e: HttpError) => e)
    expect(error).toMatchObject({ status: 502, code: 'upstream_unreachable' })
    expect(((error as HttpError).cause as Error).cause).toBe(cause)
  })

  it('maps upstream failures to stable error codes', async () => {
    const run = (response: Response | Error) => {
      const fetchFn = response instanceof Error
        ? vi.fn().mockRejectedValue(response)
        : vi.fn().mockResolvedValue(response)
      return adapterWith(fetchFn).fetchCardById('46986414').catch((error: HttpError) => error)
    }

    expect(await run(new Response('', { status: 429 }))).toMatchObject({ status: 429, code: 'upstream_rate_limited' })
    expect(await run(new Response('boom', { status: 500 }))).toMatchObject({ status: 502, code: 'upstream_error' })
    expect(await run(json({ error: 'Some other 400' }, 400))).toMatchObject({ status: 502, code: 'upstream_error' })
    expect(await run(json({ unexpected: true }))).toMatchObject({ status: 502, code: 'upstream_invalid_response' })
    expect(await run(new TypeError('fetch failed'))).toMatchObject({ status: 502, code: 'upstream_unreachable' })
  })
})

describe('adapter registry', () => {
  const adapter = adapterWith(vi.fn() as unknown as typeof fetch)
  const registry = createRegistry([adapter])

  it('looks adapters up by game slug', () => {
    expect(registry.get('ygo')).toBe(adapter)
    expect(registry.require('ygo')).toBe(adapter)
    expect(registry.list()).toHaveLength(1)
  })

  it('rejects unknown games', () => {
    expect(registry.get('pokemon')).toBeUndefined()
    expect(() => registry.require('pokemon')).toThrow(/Unknown game/)
  })
})
