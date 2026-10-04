import type { Prisma } from '../generated/prisma/client'
import type { CardStatusValue } from '../../shared/utils/status'

export interface CardFilters {
  game?: string
  status?: CardStatusValue
  /** A player id, or "none" for cards that are not assigned to anybody. */
  player?: number | 'none'
  /** Free text matched against the names (all languages), set code, set name and external id. */
  q?: string
  /** Card type, e.g. "Normal Monster" (`attributes.type`). */
  cardType?: string
  /** Monster type, e.g. "Spellcaster" (`attributes.race`). */
  race?: string
  attribute?: string
  rarity?: string
  levelMin?: number
  levelMax?: number
}

const attributeIs = (key: string, value: string): Prisma.CardWhereInput => ({
  gameSpecificAttributes: { path: [key], equals: value },
})

export function buildCardWhere(filters: CardFilters): Prisma.CardWhereInput {
  const conditions: Prisma.CardWhereInput[] = []

  if (filters.game) {
    conditions.push({ game: { slug: filters.game } })
  }
  if (filters.status) {
    conditions.push({ status: filters.status })
  }
  if (filters.player === 'none') {
    conditions.push({ assignedPlayerId: null })
  }
  else if (typeof filters.player === 'number') {
    conditions.push({ assignedPlayerId: filters.player })
  }

  const q = filters.q?.trim()
  if (q) {
    conditions.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { translations: { some: { name: { contains: q, mode: 'insensitive' } } } },
        { externalId: q },
        { sets: { some: { setCode: { contains: q, mode: 'insensitive' } } } },
        { sets: { some: { setName: { contains: q, mode: 'insensitive' } } } },
      ],
    })
  }

  if (filters.cardType) {
    conditions.push(attributeIs('type', filters.cardType))
  }
  if (filters.race) {
    conditions.push(attributeIs('race', filters.race))
  }
  if (filters.attribute) {
    conditions.push(attributeIs('attribute', filters.attribute))
  }
  if (filters.rarity) {
    conditions.push({ sets: { some: { rarity: filters.rarity } } })
  }
  if (filters.levelMin !== undefined) {
    conditions.push({ gameSpecificAttributes: { path: ['level'], gte: filters.levelMin } })
  }
  if (filters.levelMax !== undefined) {
    conditions.push({ gameSpecificAttributes: { path: ['level'], lte: filters.levelMax } })
  }

  return conditions.length > 0 ? { AND: conditions } : {}
}
