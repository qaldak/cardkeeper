import { z } from 'zod'

// Shape of a card in the TCGdex REST API v2 (https://tcgdex.dev/reference/card). Only what the
// adapter reads is validated and everything is optional except id and name, because Pokémon,
// Trainer and Energy cards have different fields. The unmodified response is kept as a snapshot.

const numeric = z.union([z.number(), z.string()])
const flag = z.boolean().optional()

const attackSchema = z.object({
  name: z.string(),
  cost: z.array(z.string()).optional(),
  damage: numeric.optional(),
  effect: z.string().optional(),
})

const abilitySchema = z.object({
  type: z.string().optional(),
  name: z.string(),
  effect: z.string().optional(),
})

const typeValueSchema = z.object({
  type: z.string(),
  value: numeric.optional(),
})

export const tcgdexCardSchema = z.object({
  id: z.string().min(1),
  localId: numeric.optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  illustrator: z.string().optional(),
  /** Base URL of the card image; a quality and an extension are appended ("/high.webp"). */
  image: z.string().optional(),
  rarity: z.string().optional(),
  set: z.object({
    id: z.string(),
    name: z.string(),
    cardCount: z.object({ official: z.number().optional(), total: z.number().optional() }).optional(),
  }).optional(),
  variants: z.object({
    normal: flag,
    reverse: flag,
    holo: flag,
    firstEdition: flag,
    wPromo: flag,
  }).optional(),
  dexId: z.array(z.number()).optional(),
  hp: numeric.optional(),
  types: z.array(z.string()).optional(),
  evolveFrom: z.string().optional(),
  description: z.string().optional(),
  level: numeric.optional(),
  stage: z.string().optional(),
  suffix: z.string().optional(),
  attacks: z.array(attackSchema).optional(),
  abilities: z.array(abilitySchema).optional(),
  weaknesses: z.array(typeValueSchema).optional(),
  resistances: z.array(typeValueSchema).optional(),
  retreat: numeric.optional(),
  regulationMark: z.string().optional(),
  legal: z.object({ standard: flag, expanded: flag }).optional(),
  // Trainer and Energy cards:
  trainerType: z.string().optional(),
  energyType: z.string().optional(),
  effect: z.string().optional(),
  pricing: z.object({
    cardmarket: z.record(z.string(), z.unknown()).nullish(),
    tcgplayer: z.record(z.string(), z.unknown()).nullish(),
  }).nullish(),
})

export type TcgdexCardRaw = z.infer<typeof tcgdexCardSchema>

/** Search results are brief cards: no set, rarity, types or prices. */
export const tcgdexBriefListSchema = z.array(z.object({
  id: z.string().min(1),
  localId: numeric.optional(),
  name: z.string().min(1),
  image: z.string().optional(),
}))

const setCardCountSchema = z.object({ official: z.number().optional(), total: z.number().optional() })

/** The set list holds brief sets: id, name, logo, symbol and the card count. */
export const tcgdexSetListSchema = z.array(z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  logo: z.string().optional(),
  symbol: z.string().optional(),
  cardCount: setCardCountSchema.optional(),
}))

/** A set holds its cards as brief cards. */
export const tcgdexSetSchema = z.object({
  id: z.string().min(1),
  cards: z.array(z.object({
    id: z.string().min(1),
    localId: numeric.optional(),
    name: z.string().min(1),
    image: z.string().optional(),
  })).default([]),
})
