import { describe, expect, it } from 'vitest'
import { buildCardWhere } from '../../server/lib/card-filters'

describe('buildCardWhere', () => {
  it('returns an empty filter for no criteria', () => {
    expect(buildCardWhere({})).toEqual({})
  })

  it('filters by game, status and player', () => {
    expect(buildCardWhere({ game: 'ygo', status: 'ACTIVE', player: 3 })).toEqual({
      game: { slug: 'ygo' },
      status: 'ACTIVE',
      assignedPlayerId: 3,
    })
  })

  it('maps player "none" to unassigned cards', () => {
    expect(buildCardWhere({ player: 'none' })).toEqual({ assignedPlayerId: null })
  })

  it('searches name, external id and set fields case-insensitively', () => {
    const where = buildCardWhere({ q: ' lob-005 ' })
    expect(where.OR).toEqual([
      { name: { contains: 'lob-005', mode: 'insensitive' } },
      { externalId: 'lob-005' },
      { sets: { some: { setCode: { contains: 'lob-005', mode: 'insensitive' } } } },
      { sets: { some: { setName: { contains: 'lob-005', mode: 'insensitive' } } } },
    ])
  })

  it('ignores a blank search text', () => {
    expect(buildCardWhere({ q: '   ' })).toEqual({})
  })
})
