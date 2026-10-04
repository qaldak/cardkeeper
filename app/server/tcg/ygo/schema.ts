import { z } from 'zod'

// Shape of a card in the YGOPRODeck API v7 (https://ygoprodeck.com/api-guide/).
// Only the fields the adapter reads are validated; everything else is kept in the raw snapshot.
export const ygoCardSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  type: z.string().optional(),
  frameType: z.string().optional(),
  desc: z.string().optional(),
  race: z.string().optional(),
  attribute: z.string().optional(),
  archetype: z.string().optional(),
  typeline: z.array(z.string()).optional(),
  atk: z.number().optional(),
  def: z.number().optional(),
  level: z.number().optional(),
  scale: z.number().optional(),
  linkval: z.number().optional(),
  linkmarkers: z.array(z.string()).optional(),
  card_sets: z.array(z.object({
    set_name: z.string(),
    set_code: z.string(),
    set_rarity: z.string().optional(),
  })).optional(),
  card_images: z.array(z.object({
    image_url: z.string(),
    image_url_small: z.string().optional(),
  })).optional(),
  card_prices: z.array(z.record(z.string(), z.unknown())).optional(),
})

export type YgoCardRaw = z.infer<typeof ygoCardSchema>

export const ygoResponseSchema = z.object({
  data: z.array(z.unknown()),
})
