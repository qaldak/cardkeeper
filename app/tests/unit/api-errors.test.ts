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
    expect(listQuerySchema.parse({})).toEqual({ page: 1, pageSize: 48 })
    expect(listQuerySchema.parse({ player: '4', page: '2', status: 'SOLD' })).toMatchObject({ player: 4, page: 2, status: 'SOLD' })
    expect(listQuerySchema.parse({ player: 'none' }).player).toBe('none')
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

  it('rejects unknown fields on card updates', () => {
    expect(() => updateCardSchema.parse({ gameId: 2 })).toThrow()
    expect(updateCardSchema.parse({ name: ' Dunkler Magier ' }).name).toBe('Dunkler Magier')
  })

  it('validates players', () => {
    expect(playerSchema.parse({ name: ' Anna ' })).toEqual({ name: 'Anna' })
    expect(() => playerSchema.parse({ name: '   ' })).toThrow()
  })
})
