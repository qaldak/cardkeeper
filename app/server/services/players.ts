import type { PrismaClient } from '../generated/prisma/client'
import type { PlayerDto } from '../../shared/types/api'
import { isUniqueViolation } from '../lib/api-errors'
import { HttpError, notFound } from '../lib/errors'
import type { PlayerInput } from '../lib/schemas'

const toDto = (player: { id: number, name: string, contact: string | null, _count: { cards: number } }): PlayerDto => ({
  id: player.id,
  name: player.name,
  contact: player.contact,
  cardCount: player._count.cards,
})

const duplicate = () => new HttpError(409, 'player_exists', 'A player with this name already exists')

export function createPlayerService(db: PrismaClient) {
  const select = { id: true, name: true, contact: true, _count: { select: { cards: true } } } as const

  return {
    async list(): Promise<PlayerDto[]> {
      const players = await db.player.findMany({ orderBy: { name: 'asc' }, select })
      return players.map(toDto)
    },

    async create(input: PlayerInput): Promise<PlayerDto> {
      try {
        return toDto(await db.player.create({
          data: { name: input.name, contact: input.contact || null },
          select,
        }))
      }
      catch (error) {
        throw isUniqueViolation(error) ? duplicate() : error
      }
    },

    async update(id: number, input: PlayerInput): Promise<PlayerDto> {
      const existing = await db.player.findUnique({ where: { id }, select: { id: true } })
      if (!existing) {
        throw notFound('player_not_found', 'Player not found')
      }
      try {
        return toDto(await db.player.update({
          where: { id },
          data: { name: input.name, contact: input.contact || null },
          select,
        }))
      }
      catch (error) {
        throw isUniqueViolation(error) ? duplicate() : error
      }
    },

    /** Deleting a player keeps their cards; they simply become unassigned. */
    async remove(id: number): Promise<void> {
      const existing = await db.player.findUnique({ where: { id }, select: { id: true } })
      if (!existing) {
        throw notFound('player_not_found', 'Player not found')
      }
      await db.player.delete({ where: { id } })
    },
  }
}

export type PlayerService = ReturnType<typeof createPlayerService>
