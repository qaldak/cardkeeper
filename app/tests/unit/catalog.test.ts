import { describe, expect, it, vi } from 'vitest'
import { createCatalogService } from '../../server/services/catalog'
import { createRegistry } from '../../server/tcg/registry'
import type { CardAdapter } from '../../server/tcg/types'
import { createYgoAdapter } from '../../server/tcg/ygo/adapter'

function setup(overrides: Partial<CardAdapter> = {}) {
  const listSets = vi.fn(async () => [
    { id: 'me03', name: 'ME03', logoUrl: 'https://assets.tcgdex.net/logo.webp', symbolUrl: 'https://evil.test/symbol.webp', official: 88, total: 120 },
  ])
  const listSetCards = vi.fn(async (setId: string) => setId === 'me03'
    ? [{ id: 'me03-040', number: '040', name: 'Hippoterus', imageUrl: 'https://assets.tcgdex.net/040/high.webp', thumbnailUrl: 'https://assets.tcgdex.net/040/low.webp' }]
    : null)
  const adapter = {
    slug: 'pokemon', displayName: 'Pokémon', defaultLanguage: 'en', languages: ['en', 'de', 'ja'], storedLanguages: ['de', 'en', 'ja'],
    imageHosts: ['assets.tcgdex.net'], searchThumbnails: true, listSets, listSetCards, ...overrides,
  } as unknown as CardAdapter
  let now = new Date('2026-10-04T12:00:00Z')
  const catalog = createCatalogService({ registry: createRegistry([adapter, createYgoAdapter({ baseUrl: 'https://ygo.test' })]), now: () => now })
  return { catalog, listSets, listSetCards, advance: (hours: number) => { now = new Date(now.getTime() + hours * 3600_000) } }
}

describe('catalog service', () => {
  it('lists the sets and drops image urls of foreign hosts', async () => {
    const { catalog } = setup()
    expect(await catalog.sets('pokemon', 'ja')).toEqual([
      { id: 'me03', name: 'ME03', logoUrl: 'https://assets.tcgdex.net/logo.webp', symbolUrl: null, official: 88, total: 120 },
    ])
  })

  it('lists the cards of a set by external id and number', async () => {
    const { catalog } = setup()
    expect(await catalog.setCards('pokemon', 'me03', 'de')).toEqual([
      { externalId: 'me03-040', number: '040', name: 'Hippoterus', thumbnailUrl: 'https://assets.tcgdex.net/040/low.webp' },
    ])
  })

  it('answers repeated requests from the cache for six hours, per language', async () => {
    const { catalog, listSets, advance } = setup()
    await catalog.sets('pokemon', 'en')
    await catalog.sets('pokemon', 'en')
    expect(listSets).toHaveBeenCalledTimes(1)
    await catalog.sets('pokemon', 'de')
    expect(listSets).toHaveBeenCalledTimes(2)
    advance(5)
    await catalog.sets('pokemon', 'en')
    expect(listSets).toHaveBeenCalledTimes(2)
    advance(2)
    await catalog.sets('pokemon', 'en')
    expect(listSets).toHaveBeenCalledTimes(3)
  })

  it('does not cache a failure', async () => {
    const listSets = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue([])
    const { catalog } = setup({ listSets })
    await expect(catalog.sets('pokemon')).rejects.toThrow('down')
    expect(await catalog.sets('pokemon')).toEqual([])
  })

  it('reports an unknown set as 404', async () => {
    const { catalog } = setup()
    await expect(catalog.setCards('pokemon', 'nope')).rejects.toMatchObject({ status: 404, code: 'set_not_found' })
  })

  it('reports a game without a set browser as 400', async () => {
    const { catalog } = setup()
    await expect(catalog.sets('ygo')).rejects.toMatchObject({ status: 400, code: 'sets_not_supported' })
    await expect(catalog.setCards('ygo', 'x')).rejects.toMatchObject({ status: 400, code: 'sets_not_supported' })
  })
})
