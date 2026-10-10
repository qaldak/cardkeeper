import { z } from 'zod'

// Shape of a card in the YGOPRODeck API v7 (https://ygoprodeck.com/api-guide/).
// Only the fields the adapter reads are validated; everything else is kept in the raw snapshot.

/** What a card needs to be usable at all. */
const coreSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
})

/**
 * The other fields are optional and checked one by one: a field with an unexpected value (a `null`, a text where a
 * number is expected, ...) is left out and reported, it does not make the whole card - and with it a whole search
 * result - unusable. Link monsters, for instance, have no level or DEF.
 */
const fieldSchemas = {
  type: z.string(),
  frameType: z.string(),
  desc: z.string(),
  race: z.string(),
  attribute: z.string(),
  archetype: z.string(),
  typeline: z.array(z.string()),
  atk: z.number(),
  def: z.number(),
  level: z.number(),
  scale: z.number(),
  linkval: z.number(),
  linkmarkers: z.array(z.string()),
  card_images: z.array(z.object({
    image_url: z.string(),
    image_url_small: z.string().optional(),
  })),
  card_prices: z.array(z.record(z.string(), z.unknown())),
} as const

const setSchema = z.object({
  set_name: z.string(),
  set_code: z.string(),
  set_rarity: z.string().nullish(),
})

type Fields = { [K in keyof typeof fieldSchemas]?: z.infer<(typeof fieldSchemas)[K]> }

export interface YgoCardRaw extends Fields {
  id: number
  name: string
  card_sets?: z.infer<typeof setSchema>[]
}

export interface ParsedYgoCard {
  card: YgoCardRaw
  /** The fields (and printings) that were left out because their value was unexpected, e.g. `def=null`. */
  ignored: string[]
}

const preview = (value: unknown) => {
  const text = JSON.stringify(value) ?? String(value)
  return text.length > 60 ? `${text.slice(0, 57)}...` : text
}

/** Parses a card of the API; `null` if it lacks an id or a name. A missing or `null` field is simply absent. */
export function parseYgoCard(raw: unknown): ParsedYgoCard | null {
  const core = coreSchema.safeParse(raw)
  if (!core.success) {
    return null
  }
  const source = raw as Record<string, unknown>
  const card: Record<string, unknown> = { ...core.data }
  const ignored: string[] = []

  for (const [field, schema] of Object.entries(fieldSchemas)) {
    const value = source[field]
    if (value === undefined || value === null) {
      continue
    }
    const parsed = schema.safeParse(value)
    if (parsed.success) {
      card[field] = parsed.data
    }
    else {
      ignored.push(`${field}=${preview(value)}`)
    }
  }

  const sets = source.card_sets
  if (Array.isArray(sets)) {
    card.card_sets = sets.flatMap((entry, index) => {
      const parsed = setSchema.safeParse(entry)
      if (!parsed.success) {
        ignored.push(`card_sets[${index}]=${preview(entry)}`)
        return []
      }
      return [parsed.data]
    })
  }
  else if (sets !== undefined && sets !== null) {
    ignored.push(`card_sets=${preview(sets)}`)
  }

  return { card: card as unknown as YgoCardRaw, ignored }
}

export const ygoResponseSchema = z.object({
  data: z.array(z.unknown()),
})

/** The answer of `cardsetsinfo.php` for a set code: the card of the print (its passcode and name). */
export const setPrintSchema = z.object({
  id: z.union([z.number().int(), z.string().regex(/^\d{1,12}$/)]),
  name: z.string().optional(),
})

/** A set in the list of `cardsets.php`. */
export const setInfoSchema = z.object({
  set_name: z.string().min(1),
  set_code: z.string().nullish(),
  num_of_cards: z.number().nullish(),
  tcg_date: z.string().nullish(),
})
