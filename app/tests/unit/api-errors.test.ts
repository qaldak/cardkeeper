import { describe, expect, it } from 'vitest'
import { ZodError, z } from 'zod'
import { isUniqueViolation, resolveActor, toErrorResponse } from '../../server/lib/api-errors'
import { badRequest, HttpError, notFound } from '../../server/lib/errors'
import { createCardSchema, listQuerySchema, playerSchema, updateCardSchema } from '../../server/lib/schemas'

describe('toErrorResponse', () => {
  it('passes HttpError details through', () => {
    expect(toErrorResponse(notFound('card_not_found', 'Card not found'))).toEqual({
      status: 404,
      code: 'card_not_found',
      message: 'Card not found',
    })
    expect(toErrorResponse(new HttpError(429, 'upstream_rate_limited')).status).toBe(429)
  })

  it('maps validation errors to 400 with issues', () => {
    const error = (() => {
      try {
        z.object({ name: z.string() }).parse({})
      }
      catch (e) {
        return e
      }
    })()
    expect(error).toBeInstanceOf(ZodError)
    const response = toErrorResponse(error)
    expect(response.status).toBe(400)
    expect(response.code).toBe('validation_error')
    expect(response.issues?.[0]?.path).toBe('name')
  })

  it('hides the message of unexpected errors', () => {
    expect(toErrorResponse(new Error('password=secret'))).toEqual({
      status: 500,
      code: 'internal_error',
      message: 'Internal server error',
    })
    expect(badRequest('x').status).toBe(400)
  })
})

describe('isUniqueViolation', () => {
  it('detects the Prisma unique constraint code', () => {
    expect(isUniqueViolation({ code: 'P2002' })).toBe(true)
    expect(isUniqueViolation({ code: 'P2025' })).toBe(false)
    expect(isUniqueViolation(null)).toBe(false)
  })
})

describe('resolveActor', () => {
  it('accepts normal user names', () => {
    expect(resolveActor('anna')).toBe('anna')
    expect(resolveActor(' Sven Müller ')).toBe('Sven Müller')
    expect(resolveActor('anna@example.org')).toBe('anna@example.org')
  })

  it('falls back to anonymous for missing or suspicious values', () => {
    expect(resolveActor(undefined)).toBe('anonymous')
    expect(resolveActor('')).toBe('anonymous')
    expect(resolveActor('a'.repeat(101))).toBe('anonymous')
    expect(resolveActor('evil\nheader')).toBe('anonymous')
    expect(resolveActor('<script>')).toBe('anonymous')
  })
})

describe('request schemas', () => {
  it('applies list defaults and coerces query strings', () => {
    expect(listQuerySchema.parse({})).toEqual({ page: 1, pageSize: 48, sort: 'created' })
    expect(listQuerySchema.parse({ player: '4', page: '2', status: 'SOLD' })).toMatchObject({ player: 4, page: 2, status: 'SOLD' })
    expect(listQuerySchema.parse({ player: 'none' }).player).toBe('none')
  })

  it('accepts the Pokémon filters and validates their ranges', () => {
    expect(listQuerySchema.parse({ category: 'Trainer', pokemonType: 'Fire', stage: 'Basic', variant: 'holo', hpMin: '30', hpMax: '200' }))
      .toMatchObject({ category: 'Trainer', pokemonType: 'Fire', stage: 'Basic', variant: 'holo', hpMin: 30, hpMax: 200 })
    expect(() => listQuerySchema.parse({ hpMin: '-5' })).toThrow()
    expect(() => listQuerySchema.parse({ hpMax: '5000' })).toThrow()
    expect(listQuerySchema.parse({ sort: 'hp' }).sort).toBe('hp')
  })

  it('accepts a variant when adding a card', () => {
    expect(createCardSchema.parse({ game: 'pokemon', externalId: 'swsh3-136', set: { setCode: 'swsh3-136', rarity: 'Uncommon', edition: 'reverse' } }).set)
      .toEqual({ setCode: 'swsh3-136', rarity: 'Uncommon', edition: 'reverse' })
  })

  it('validates the sort order', () => {
    expect(listQuerySchema.parse({})).toMatchObject({ sort: 'created' })
    expect(listQuerySchema.parse({ sort: 'price', dir: 'desc' })).toMatchObject({ sort: 'price', dir: 'desc' })
    expect(listQuerySchema.parse({ sort: 'purchaseDate' }).dir).toBeUndefined()
    expect(() => listQuerySchema.parse({ sort: 'rarity' })).toThrow()
    expect(() => listQuerySchema.parse({ dir: 'up' })).toThrow()
  })

  it('rejects out-of-range paging and unknown statuses', () => {
    expect(() => listQuerySchema.parse({ pageSize: '500' })).toThrow()
    expect(() => listQuerySchema.parse({ page: '0' })).toThrow()
    expect(() => listQuerySchema.parse({ status: 'aktiv' })).toThrow()
  })

  it('validates card creation', () => {
    expect(createCardSchema.parse({ game: 'ygo', externalId: '46986414', set: { setCode: 'LOB-005' } }).externalId).toBe('46986414')
    expect(() => createCardSchema.parse({ game: 'ygo' })).toThrow()
    expect(() => createCardSchema.parse({ game: 'ygo', externalId: '1', purchaseDate: '04.10.2026' })).toThrow()
  })

  it('only allows the printing and the user\'s own data on card updates', () => {
    expect(updateCardSchema.parse({ set: { setCode: ' LOB-DE005 ', edition: '1st Edition' } }).set).toEqual({ setCode: 'LOB-DE005', edition: '1st Edition' })
    expect(updateCardSchema.parse({ status: 'SOLD', assignedPlayerId: 3 })).toEqual({ status: 'SOLD', assignedPlayerId: 3 })
    // Texts, attributes, rarity and set name come from the API and cannot be edited.
    for (const field of [{ name: 'x' }, { description: 'x' }, { attributes: { atk: 1 } }, { gameId: 2 }, { set: { rarity: 'Common' } }, { set: { setName: 'x' } }]) {
      expect(() => updateCardSchema.parse(field)).toThrow()
    }
  })

  it('accepts the new list filters and validates their ranges', () => {
    expect(listQuerySchema.parse({ cardType: 'Normal Monster', race: 'Dragon', attribute: 'LIGHT', rarity: 'Rare', levelMin: '4', levelMax: '8' }))
      .toMatchObject({ cardType: 'Normal Monster', race: 'Dragon', attribute: 'LIGHT', rarity: 'Rare', levelMin: 4, levelMax: 8 })
    expect(() => listQuerySchema.parse({ levelMin: '-1' })).toThrow()
    expect(() => listQuerySchema.parse({ levelMax: 'high' })).toThrow()
  })

  it('validates players', () => {
    expect(playerSchema.parse({ name: ' Anna ' })).toEqual({ name: 'Anna' })
    expect(() => playerSchema.parse({ name: '   ' })).toThrow()
  })
})
