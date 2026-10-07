import type { Prisma } from '../generated/prisma/client'
import type { CardStatusValue } from '../../shared/utils/status'

export interface CardFilters {
  game?: string
  status?: CardStatusValue
  /** A user id, or "none" for cards without an owner. */
  owner?: number | 'none'
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
  /** Pokémon: "Pokemon", "Trainer" or "Energy" (`attributes.category`). */
  category?: string
  /** Pokémon: energy type such as "Fire", contained in `attributes.types`. */
  pokemonType?: string
  /** Pokémon: "Basic", "Stage1", ... (`attributes.stage`). */
  stage?: string
  /** Pokémon: variant of the physical card (the printing's edition). */
  variant?: string
  hpMin?: number
  hpMax?: number
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
  if (filters.owner === 'none') {
    conditions.push({ ownerUserId: null })
  }
  else if (typeof filters.owner === 'number') {
    conditions.push({ ownerUserId: filters.owner })
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
  if (filters.category) {
    conditions.push(attributeIs('category', filters.category))
  }
  if (filters.pokemonType) {
    conditions.push({ gameSpecificAttributes: { path: ['types'], array_contains: filters.pokemonType } })
  }
  if (filters.stage) {
    conditions.push(attributeIs('stage', filters.stage))
  }
  if (filters.variant) {
    conditions.push({ sets: { some: { edition: filters.variant } } })
  }
  if (filters.hpMin !== undefined) {
    conditions.push({ gameSpecificAttributes: { path: ['hp'], gte: filters.hpMin } })
  }
  if (filters.hpMax !== undefined) {
    conditions.push({ gameSpecificAttributes: { path: ['hp'], lte: filters.hpMax } })
  }
  if (filters.levelMin !== undefined) {
    conditions.push({ gameSpecificAttributes: { path: ['level'], gte: filters.levelMin } })
  }
  if (filters.levelMax !== undefined) {
    conditions.push({ gameSpecificAttributes: { path: ['level'], lte: filters.levelMax } })
  }

  return conditions.length > 0 ? { AND: conditions } : {}
}
