import type { Prisma } from '../generated/prisma/client'
import type { CardStatusValue } from '../../shared/utils/status'

export interface CardFilters {
  game?: string
  status?: CardStatusValue
  /** A player id, or "none" for cards that are not assigned to anybody. */
  player?: number | 'none'
  /** Free text matched against name, set code, set name and external id. */
  q?: string
}

export function buildCardWhere(filters: CardFilters): Prisma.CardWhereInput {
  const where: Prisma.CardWhereInput = {}

  if (filters.game) {
    where.game = { slug: filters.game }
  }
  if (filters.status) {
    where.status = filters.status
  }
  if (filters.player === 'none') {
    where.assignedPlayerId = null
  }
  else if (typeof filters.player === 'number') {
    where.assignedPlayerId = filters.player
  }

  const q = filters.q?.trim()
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { externalId: q },
      { sets: { some: { setCode: { contains: q, mode: 'insensitive' } } } },
      { sets: { some: { setName: { contains: q, mode: 'insensitive' } } } },
    ]
  }

  return where
}
