import { z } from 'zod'
import { CARD_SORTS } from '../../shared/utils/sorting'
import { CARD_STATUSES } from '../../shared/utils/status'

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()

export const listQuerySchema = z.object({
  game: z.string().trim().min(1).max(40).optional(),
  status: z.enum(CARD_STATUSES).optional(),
  player: z.union([z.literal('none'), z.coerce.number().int().positive()]).optional(),
  q: z.string().trim().max(100).optional(),
  cardType: z.string().trim().min(1).max(80).optional(),
  race: z.string().trim().min(1).max(80).optional(),
  attribute: z.string().trim().min(1).max(80).optional(),
  rarity: z.string().trim().min(1).max(80).optional(),
  levelMin: z.coerce.number().int().min(0).max(99).optional(),
  levelMax: z.coerce.number().int().min(0).max(99).optional(),
  sort: z.enum(CARD_SORTS).default('created'),
  // Without a direction every order uses its default (see `defaultDirection`).
  dir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(48),
})

export const facetsQuerySchema = z.object({
  game: z.string().trim().min(1).max(40).optional(),
})

export const lookupQuerySchema = z.object({
  game: z.string().trim().min(1).max(40),
  q: z.string().trim().min(2).max(100),
})

export const createCardSchema = z.object({
  game: z.string().trim().min(1).max(40),
  externalId: z.string().trim().min(1).max(40),
  set: z.object({
    setCode: z.string().trim().min(1).max(40),
    rarity: z.string().trim().max(80).nullable().optional(),
  }).optional(),
  playerId: z.number().int().positive().nullable().optional(),
  purchaseDate: dateOnly.nullable().optional(),
})

// Only the printing (set code, edition) and the user's own data can be changed. Names, texts and
// attributes come from the card API and are updated by refreshing the card.
export const updateCardSchema = z.object({
  set: z.object({
    setCode: z.string().trim().min(1).max(40).optional(),
    edition: optionalText(80),
  }).strict().optional(),
  assignedPlayerId: z.number().int().positive().nullable().optional(),
  purchaseDate: dateOnly.nullable().optional(),
  status: z.enum(CARD_STATUSES).optional(),
  statusDate: dateOnly.nullable().optional(),
  statusPerson: optionalText(120),
}).strict()

export const playerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  contact: optionalText(200),
})

export const idParamSchema = z.coerce.number().int().positive()

export type ListQuery = z.infer<typeof listQuerySchema>
export type CreateCardInput = z.infer<typeof createCardSchema>
export type UpdateCardInput = z.infer<typeof updateCardSchema>
export type PlayerInput = z.infer<typeof playerSchema>
