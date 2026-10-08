import { describe, expect, it } from 'vitest'
import { getGameConfig } from '../../shared/utils/game-config'
import { YGO_EDITIONS } from '../../shared/utils/editions'
import { POKEMON_VARIANTS } from '../../shared/types/pokemon'

describe('game configuration', () => {
  it('lets the edition and set code of Yu-Gi-Oh! cards be corrected freely', () => {
    expect(getGameConfig('ygo')).toEqual({ editionKind: 'text', setCodeEditable: true, printingRequired: false, languages: ['de', 'en'], editions: YGO_EDITIONS })
  })

  it('treats the edition of Pokémon cards as a variant and fixes the set code', () => {
    expect(getGameConfig('pokemon')).toEqual({ editionKind: 'variant', setCodeEditable: false, printingRequired: true, languages: ['de', 'en', 'ja'], editions: [] })
  })

  it('falls back to free text for an unknown game', () => {
    expect(getGameConfig('mtg')).toEqual({ editionKind: 'text', setCodeEditable: true, printingRequired: false, languages: ['de', 'en'], editions: [] })
  })

  it('offers the printed editions for Yu-Gi-Oh! only, as stable keys', () => {
    expect(YGO_EDITIONS).toEqual(['FIRST_EDITION', 'LIMITED_EDITION'])
    expect(getGameConfig('pokemon').editions).toEqual([])
  })

  it('knows the Pokémon variants', () => {
    expect(POKEMON_VARIANTS).toEqual(['normal', 'reverse', 'holo', 'firstEdition', 'wPromo'])
  })
})

describe('game configuration and adapters', () => {
  it('lists the same languages as the adapter stores', async () => {
    const { createTcgdexAdapter } = await import('../../server/tcg/tcgdex/adapter')
    const { createYgoAdapter } = await import('../../server/tcg/ygo/adapter')
    for (const adapter of [createTcgdexAdapter({ baseUrl: 'https://x.test' }), createYgoAdapter({ baseUrl: 'https://x.test' })]) {
      expect([...getGameConfig(adapter.slug).languages], adapter.slug).toEqual([...adapter.storedLanguages])
    }
  })
})
