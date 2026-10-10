import { z } from 'zod'
import { CARD_SORTS } from '../../shared/utils/sorting'
import { CARD_STATUSES } from '../../shared/utils/status'
import { PASSWORD_MAX_LENGTH } from '../../shared/utils/users'

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()

export const listQuerySchema = z.object({
  game: z.string().trim().min(1).max(40).optional(),
  status: z.enum(CARD_STATUSES).optional(),
  owner: z.union([z.literal('none'), z.coerce.number().int().positive()]).optional(),
  q: z.string().trim().max(100).optional(),
  cardType: z.string().trim().min(1).max(80).optional(),
  race: z.string().trim().min(1).max(80).optional(),
  attribute: z.string().trim().min(1).max(80).optional(),
  rarity: z.string().trim().min(1).max(80).optional(),
  levelMin: z.coerce.number().int().min(0).max(99).optional(),
  levelMax: z.coerce.number().int().min(0).max(99).optional(),
  // Pokémon:
  category: z.string().trim().min(1).max(40).optional(),
  pokemonType: z.string().trim().min(1).max(40).optional(),
  stage: z.string().trim().min(1).max(40).optional(),
  variant: z.string().trim().min(1).max(40).optional(),
  hpMin: z.coerce.number().int().min(0).max(999).optional(),
  hpMax: z.coerce.number().int().min(0).max(999).optional(),
  sort: z.enum(CARD_SORTS).default('created'),
  // Without a direction every order uses its default (see `defaultDirection`).
  dir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(48),
})

export const setsQuerySchema = z.object({
  game: z.string().trim().min(1).max(40),
  language: z.string().trim().min(2).max(5).optional(),
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
    // Pokémon: the variant of the card (normal, reverse, holo, ...).
    edition: z.string().trim().max(80).nullable().optional(),
    // Yu-Gi-Oh!: the set code printed on the card when it is the code of another language than the print that was
    // chosen ("L5DD-DEA15" for the English print "L5DD-ENA15"). It is stored instead of the code of the print.
    printedSetCode: z.string().trim().max(40).nullable().optional(),
  }).optional(),
  purchaseDate: dateOnly.nullable().optional(),
})

// Only the printing (set code, edition) and the user's own data can be changed. Names, texts and
// attributes come from the card API and are updated by refreshing the card.
export const updateCardSchema = z.object({
  set: z.object({
    setCode: z.string().trim().min(1).max(40).optional(),
    edition: optionalText(80),
  }).strict().optional(),
  // Handing the card over to another user; a card always has an owner, so it cannot be cleared.
  ownerId: z.number().int().positive().optional(),
  purchaseDate: dateOnly.nullable().optional(),
  status: z.enum(CARD_STATUSES).optional(),
  statusDate: dateOnly.nullable().optional(),
  statusPerson: optionalText(120),
}).strict()

export const loginSchema = z.object({
  name: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  // The rules (length, not the initial password) are checked by the service, which answers with a specific error.
  newPassword: z.string().max(PASSWORD_MAX_LENGTH + 1),
})

export const idParamSchema = z.coerce.number().int().positive()

export type ListQuery = z.infer<typeof listQuerySchema>
export type CreateCardInput = z.infer<typeof createCardSchema>
export type UpdateCardInput = z.infer<typeof updateCardSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
