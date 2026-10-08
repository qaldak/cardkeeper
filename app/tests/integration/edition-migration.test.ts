import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TEST_DATABASE_URL, useHarness } from './helpers'

const migration = (name: string) => readFileSync(join(__dirname, `../../prisma/migrations/${name}/migration.sql`), 'utf8')
const EDITION_KEYS = migration('20261007130000_edition_keys')
const UNLIMITED_IS_EMPTY = migration('20261008100000_unlimited_is_empty')
const FIRST_EDITION_PREFIX = migration('20261008120000_first_edition_prefix')

// Old literal → expected value after both migrations. `null` stays null.
const ROWS: [string | null, string | null][] = [
  ['1st Edition', 'FIRST_EDITION'],
  ['1st edition', 'FIRST_EDITION'],
  ['  1ST EDITION  ', 'FIRST_EDITION'],
  ['1. Auflage', 'FIRST_EDITION'],
  ['1.Auflage', 'FIRST_EDITION'],
  ['  1. AUFLAGE ', 'FIRST_EDITION'],
  ['Limited Edition', 'LIMITED_EDITION'],
  ['limited edition', 'LIMITED_EDITION'],
  // Unlimited is not printed on the card: no edition.
  ['Unlimited', null],
  ['unlimited ', null],
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

describe.skipIf(!TEST_DATABASE_URL)('edition migrations', () => {
  const h = useHarness()

  const editions = async () => (await h.db.cardSet.findMany({ orderBy: { id: 'asc' } })).map(set => set.edition)

  async function seed(values: (string | null)[], slug = 'ygo') {
    const game = await h.db.game.create({ data: { slug, displayName: slug } })
    const card = await h.db.card.create({ data: { gameId: game.id, name: 'Dunkler Magier' } })
    for (const edition of values) {
      await h.db.cardSet.create({ data: { cardId: card.id, setCode: 'LOB-005', edition } })
    }
  }

  const run = async () => {
    await h.db.$executeRawUnsafe(EDITION_KEYS)
    await h.db.$executeRawUnsafe(UNLIMITED_IS_EMPTY)
    await h.db.$executeRawUnsafe(FIRST_EDITION_PREFIX)
  }

  it('turns the printed editions into their keys, makes Unlimited empty and leaves every other value alone', async () => {
    await seed(ROWS.map(([old]) => old))
    await run()
    expect(await editions()).toEqual(ROWS.map(([, expected]) => expected))
  })

  it('can run again without changing anything', async () => {
    await seed(ROWS.map(([old]) => old))
    await run()
    await run()
    expect(await editions()).toEqual(ROWS.map(([, expected]) => expected))
  })

  it('also empties the key UNLIMITED of a database where only the first migration has run before', async () => {
    await seed(['UNLIMITED', 'FIRST_EDITION', 'LIMITED_EDITION', 'Special Edition', null])
    await h.db.$executeRawUnsafe(UNLIMITED_IS_EMPTY)
    expect(await editions()).toEqual([null, 'FIRST_EDITION', 'LIMITED_EDITION', 'Special Edition', null])
  })

  it('makes everything that starts with "1st" or "1." the first edition and leaves the rest', async () => {
    await seed(['1st', '1st Ed.', ' 1ST edition', '1. Auflage', '1.Auflage', '1. Edition 2002', '1x', '11', 'Special Edition', 'Limitierte Auflage', 'LIMITED_EDITION', null, ''])
    await h.db.$executeRawUnsafe(FIRST_EDITION_PREFIX)
    expect(await editions()).toEqual([
      'FIRST_EDITION', 'FIRST_EDITION', 'FIRST_EDITION', 'FIRST_EDITION', 'FIRST_EDITION', 'FIRST_EDITION',
      '1x', '11', 'Special Edition', 'Limitierte Auflage', 'LIMITED_EDITION', null, '',
    ])
  })

  it('does not touch the editions of another game', async () => {
    await seed(['1st thing', 'firstEdition'], 'pokemon')
    await h.db.$executeRawUnsafe(FIRST_EDITION_PREFIX)
    expect(await editions()).toEqual(['1st thing', 'firstEdition'])
  })
})
