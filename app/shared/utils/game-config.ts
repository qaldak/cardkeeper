// How the printing of a card (card_sets row) behaves per game.

import { YGO_EDITIONS, type EditionKey } from './editions'

export interface GameConfig {
  /**
   * `text`: the edition is free text (Yu-Gi-Oh!: a preset key such as `FIRST_EDITION`, or any text).
   * `variant`: the edition is the variant of the physical card, chosen among the variants the card
   * exists in (Pokémon: normal, reverse, holo, ...).
   */
  editionKind: 'text' | 'variant'
  /** Whether the set code can be corrected by hand (German or Japanese Yu-Gi-Oh! prints have other codes). */
  setCodeEditable: boolean
  /** Whether a card can only be added together with a printing (Pokémon needs its variant). */
  printingRequired: boolean
  /** Languages the texts of a card are stored in; must match the adapter's `storedLanguages`. */
  languages: readonly string[]
  /** Editions offered as a quick choice next to the free text (only for `editionKind: 'text'`). */
  editions: readonly EditionKey[]
}

const DEFAULT_CONFIG: GameConfig = { editionKind: 'text', setCodeEditable: true, printingRequired: false, languages: ['de', 'en'], editions: [] }

export const GAME_CONFIG: Record<string, GameConfig> = {
  ygo: { editionKind: 'text', setCodeEditable: true, printingRequired: false, languages: ['de', 'en'], editions: YGO_EDITIONS },
  // Japanese cards exist in their own database with their own ids, so Japanese is a stored language.
  pokemon: { editionKind: 'variant', setCodeEditable: false, printingRequired: true, languages: ['de', 'en', 'ja'], editions: [] },
}

export function getGameConfig(gameSlug: string): GameConfig {
  return GAME_CONFIG[gameSlug] ?? DEFAULT_CONFIG
}
