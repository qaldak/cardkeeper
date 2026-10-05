// Explicit data model of Pokémon cards as delivered by TCGdex (https://tcgdex.dev).
//
// The data is split like everything else in the app:
//  - `PokemonAttributes` is language independent and stored in `cards.game_specific_attributes`.
//    It is always taken from the English response, so filters and sorting use one stable spelling
//    ("Fire", "Stage1", "Trainer") whatever language the card is shown in.
//  - `PokemonDetails` is language dependent and stored in `card_translations.details`, one object per
//    language (German and English): texts of attacks and abilities and the localized names of types,
//    stage and rarity.

/** The variants a card can exist in; the physical card the user owns is exactly one of them. */
export const POKEMON_VARIANTS = ['normal', 'reverse', 'holo', 'firstEdition', 'wPromo'] as const

export type PokemonVariant = (typeof POKEMON_VARIANTS)[number]

export type PokemonVariants = Record<PokemonVariant, boolean>

export interface PokemonAttributes {
  /** "Pokemon", "Trainer" or "Energy" (English API value). */
  category: string
  /** Number within the set, e.g. "136". */
  localId: string
  setId: string
  /** Cards in the set: `official` is the printed total ("136/189"), `total` includes secret rares. */
  setCardCount?: { official?: number, total?: number }
  hp?: number
  /** Energy types, e.g. ["Fire"] (English). */
  types?: string[]
  /** "Basic", "Stage1", "Stage2", "VMAX", ... (English). */
  stage?: string
  evolveFrom?: string
  /** National Pokédex numbers. */
  dexId?: number[]
  level?: number
  /** "EX", "V", "GX", ... */
  suffix?: string
  retreat?: number
  regulationMark?: string
  illustrator?: string
  /** Trainer cards: "Item", "Supporter", "Stadium", ... (English). */
  trainerType?: string
  /** Energy cards: "Basic" or "Special" (English). */
  energyType?: string
  legal?: { standard?: boolean, expanded?: boolean }
  /** Which variants of this card exist. */
  variants: PokemonVariants
}

export interface PokemonAttack {
  name: string
  /** Energy cost, one entry per energy (localized type names). */
  cost: string[]
  damage?: string | number
  effect?: string
}

export interface PokemonAbility {
  type?: string
  name: string
  effect?: string
}

export interface PokemonTypeValue {
  type: string
  /** E.g. "×2" or "-30". */
  value?: string | number
}

export interface PokemonDetails {
  category?: string
  types?: string[]
  stage?: string
  rarity?: string
  trainerType?: string
  energyType?: string
  evolveFrom?: string
  set?: { name: string }
  attacks?: PokemonAttack[]
  abilities?: PokemonAbility[]
  weaknesses?: PokemonTypeValue[]
  resistances?: PokemonTypeValue[]
  /** Rules text of Trainer and Energy cards. */
  effect?: string
}
