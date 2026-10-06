import { describe, expect, it } from 'vitest'
import { buildCardWhere } from '../../server/lib/card-filters'

describe('buildCardWhere', () => {
  it('returns an empty filter for no criteria', () => {
    expect(buildCardWhere({})).toEqual({})
  })

  it('filters by game, status and player', () => {
    expect(buildCardWhere({ game: 'ygo', status: 'ACTIVE', player: 3 })).toEqual({
      AND: [{ game: { slug: 'ygo' } }, { status: 'ACTIVE' }, { assignedPlayerId: 3 }],
    })
  })

  it('maps player "none" to unassigned cards', () => {
    expect(buildCardWhere({ player: 'none' })).toEqual({ AND: [{ assignedPlayerId: null }] })
  })

  it('searches names in all languages, set code, set name and external id case-insensitively', () => {
    expect(buildCardWhere({ q: ' lob-005 ' })).toEqual({
      AND: [{
        OR: [
          { name: { contains: 'lob-005', mode: 'insensitive' } },
          { translations: { some: { name: { contains: 'lob-005', mode: 'insensitive' } } } },
          { externalId: 'lob-005' },
          { sets: { some: { setCode: { contains: 'lob-005', mode: 'insensitive' } } } },
          { sets: { some: { setName: { contains: 'lob-005', mode: 'insensitive' } } } },
        ],
      }],
    })
  })

  it('ignores a blank search text', () => {
    expect(buildCardWhere({ q: '   ' })).toEqual({})
  })

  it('filters by card type, monster type and attribute on the JSON attributes', () => {
    expect(buildCardWhere({ cardType: 'Normal Monster', race: 'Dragon', attribute: 'LIGHT' })).toEqual({
      AND: [
        { gameSpecificAttributes: { path: ['type'], equals: 'Normal Monster' } },
        { gameSpecificAttributes: { path: ['race'], equals: 'Dragon' } },
        { gameSpecificAttributes: { path: ['attribute'], equals: 'LIGHT' } },
      ],
    })
  })

  it('filters by rarity on the printings', () => {
    expect(buildCardWhere({ rarity: 'Ultra Rare' })).toEqual({ AND: [{ sets: { some: { rarity: 'Ultra Rare' } } }] })
  })

  it('filters by level range, including a lower bound of zero', () => {
    expect(buildCardWhere({ levelMin: 4, levelMax: 8 })).toEqual({
      AND: [
        { gameSpecificAttributes: { path: ['level'], gte: 4 } },
        { gameSpecificAttributes: { path: ['level'], lte: 8 } },
      ],
    })
    expect(buildCardWhere({ levelMin: 0 })).toEqual({ AND: [{ gameSpecificAttributes: { path: ['level'], gte: 0 } }] })
  })

  it('filters Pokémon by category, stage and energy type (a type is contained in the card\'s types)', () => {
    expect(buildCardWhere({ category: 'Trainer', stage: 'Stage1', pokemonType: 'Fire' })).toEqual({
      AND: [
        { gameSpecificAttributes: { path: ['category'], equals: 'Trainer' } },
        { gameSpecificAttributes: { path: ['types'], array_contains: 'Fire' } },
        { gameSpecificAttributes: { path: ['stage'], equals: 'Stage1' } },
      ],
    })
  })

  it('filters Pokémon by variant and HP range', () => {
    expect(buildCardWhere({ variant: 'reverse', hpMin: 60, hpMax: 120 })).toEqual({
      AND: [
        { sets: { some: { edition: 'reverse' } } },
        { gameSpecificAttributes: { path: ['hp'], gte: 60 } },
        { gameSpecificAttributes: { path: ['hp'], lte: 120 } },
      ],
    })
  })
})
