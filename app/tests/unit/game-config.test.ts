import { describe, expect, it } from 'vitest'
import { getGameConfig } from '../../shared/utils/game-config'
import { POKEMON_VARIANTS } from '../../shared/types/pokemon'

describe('game configuration', () => {
  it('lets the edition and set code of Yu-Gi-Oh! cards be corrected freely', () => {
    expect(getGameConfig('ygo')).toEqual({ editionKind: 'text', setCodeEditable: true, printingRequired: false })
  })

  it('treats the edition of Pokémon cards as a variant and fixes the set code', () => {
    expect(getGameConfig('pokemon')).toEqual({ editionKind: 'variant', setCodeEditable: false, printingRequired: true })
  })

  it('falls back to free text for an unknown game', () => {
    expect(getGameConfig('mtg')).toEqual({ editionKind: 'text', setCodeEditable: true, printingRequired: false })
  })

  it('knows the Pokémon variants', () => {
    expect(POKEMON_VARIANTS).toEqual(['normal', 'reverse', 'holo', 'firstEdition', 'wPromo'])
  })
})
