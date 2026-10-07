import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TEST_DATABASE_URL, useHarness } from './helpers'

const MIGRATION = readFileSync(join(__dirname, '../../prisma/migrations/20261007130000_edition_keys/migration.sql'), 'utf8')

// Old literal → expected value after the migration. `null` stays null.
const ROWS: [string | null, string | null][] = [
  ['1st Edition', 'FIRST_EDITION'],
  ['1st edition', 'FIRST_EDITION'],
  ['  1ST EDITION  ', 'FIRST_EDITION'],
  ['1. Auflage', 'FIRST_EDITION'],
  ['1.Auflage', 'FIRST_EDITION'],
  ['  1. AUFLAGE ', 'FIRST_EDITION'],
  ['Unlimited', 'UNLIMITED'],
  ['unlimited ', 'UNLIMITED'],
  ['Limited Edition', 'LIMITED_EDITION'],
  ['limited edition', 'LIMITED_EDITION'],
  // Free text, other languages and other games stay exactly as they are.
  ['2. Auflage', '2. Auflage'],
  ['Erstauflage', 'Erstauflage'],
  ['Unlimitierte Auflage', 'Unlimitierte Auflage'],
  ['Limited', 'Limited'],
  ['Unlimited Edition', 'Unlimited Edition'],
  ['Special Edition', 'Special Edition'],
  ['reverse', 'reverse'],
  ['firstEdition', 'firstEdition'],
  ['FIRST_EDITION', 'FIRST_EDITION'],
  ['', ''],
  [null, null],
]

describe.skipIf(!TEST_DATABASE_URL)('edition key migration', () => {
  const h = useHarness()

  const edition = async () => {
    const sets = await h.db.cardSet.findMany({ orderBy: { id: 'asc' } })
    return sets.map(set => set.edition)
  }

  async function seed() {
    const game = await h.db.game.create({ data: { slug: 'ygo', displayName: 'Yu-Gi-Oh!' } })
    const card = await h.db.card.create({ data: { gameId: game.id, name: 'Dunkler Magier' } })
    for (const [old] of ROWS) {
      await h.db.cardSet.create({ data: { cardId: card.id, setCode: 'LOB-005', edition: old } })
    }
  }

  it('turns the three English presets into their keys and leaves every other value alone', async () => {
    await seed()
    await h.db.$executeRawUnsafe(MIGRATION)
    expect(await edition()).toEqual(ROWS.map(([, expected]) => expected))
  })

  it('can run again without changing anything', async () => {
    await seed()
    await h.db.$executeRawUnsafe(MIGRATION)
    await h.db.$executeRawUnsafe(MIGRATION)
    expect(await edition()).toEqual(ROWS.map(([, expected]) => expected))
  })
})
