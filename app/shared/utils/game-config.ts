// How the printing of a card (card_sets row) behaves per game.

export interface GameConfig {
  /**
   * `text`: the edition is free text (Yu-Gi-Oh!: "1st Edition").
   * `variant`: the edition is the variant of the physical card, chosen among the variants the card
   * exists in (Pokémon: normal, reverse, holo, ...).
   */
  editionKind: 'text' | 'variant'
  /** Whether the set code can be corrected by hand (German or Japanese Yu-Gi-Oh! prints have other codes). */
  setCodeEditable: boolean
  /** Whether a card can only be added together with a printing (Pokémon needs its variant). */
  printingRequired: boolean
}

const DEFAULT_CONFIG: GameConfig = { editionKind: 'text', setCodeEditable: true, printingRequired: false }

export const GAME_CONFIG: Record<string, GameConfig> = {
  ygo: { editionKind: 'text', setCodeEditable: true, printingRequired: false },
  pokemon: { editionKind: 'variant', setCodeEditable: false, printingRequired: true },
}

export function getGameConfig(gameSlug: string): GameConfig {
  return GAME_CONFIG[gameSlug] ?? DEFAULT_CONFIG
}
