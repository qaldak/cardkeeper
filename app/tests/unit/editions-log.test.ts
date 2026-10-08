import { describe, expect, it } from 'vitest'
import { describeUnknownEditions } from '../../server/lib/editions'

describe('log of unknown editions', () => {
  it('says nothing when every edition is known', () => {
    expect(describeUnknownEditions([])).toBeNull()
  })

  it('names every value with its count and an UPDATE to copy', () => {
    const lines = describeUnknownEditions([
      { game: 'ygo', edition: 'Special Edition', count: 2 },
      { game: 'ygo', edition: "Collector's Edition", count: 1 },
    ])!
    expect(lines[0]).toContain('3 card(s)')
    expect(lines[0]).toContain('FIRST_EDITION, LIMITED_EDITION')
    expect(lines.slice(1)).toEqual([
      "  [ygo] 2 card(s): UPDATE card_sets SET edition = <KEY> WHERE edition = 'Special Edition';",
      "  [ygo] 1 card(s): UPDATE card_sets SET edition = <KEY> WHERE edition = 'Collector''s Edition';",
    ])
  })
})
