import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TEST_DATABASE_URL, useHarness } from './helpers'

const MIGRATION = readFileSync(join(__dirname, '../../prisma/migrations/20261107200000_deckable/migration.sql'), 'utf8')

describe.skipIf(!TEST_DATABASE_URL)('migration "deckable"', () => {
  const h = useHarness()

  async function card(game: 'ygo' | 'pokemon', name: string, externalId: string | null, attributes: Record<string, unknown>) {
    const found = await h.db.game.upsert({ where: { slug: game }, update: {}, create: { slug: game, displayName: game } })
    // Cards as they exist before the migration: the column is still true for every row.
    return h.db.card.create({ data: { gameId: found.id, name, externalId, gameSpecificAttributes: attributes as object, ownerUserId: h.anna.id, deckable: true } })
  }

  it('keeps cards for the deck and takes manual cards, tokens and skill cards out, for Yu-Gi-Oh! only', async () => {
    const normal = await card('ygo', 'Dunkler Magier', '46986414', { type: 'Normal Monster' })
    const spell = await card('ygo', 'Topf der Gier', '55144522', { type: 'Spell Card' })
    const noType = await card('ygo', 'Ohne Typ', '1', {})
    const manual = await card('ygo', 'Albaz der Verschleierte', null, { type: 'Token' })
    const manualNormal = await card('ygo', 'Handgemachte Karte', null, { type: 'Effect Monster' })
    const token = await card('ygo', 'Sheep Token', '23', { type: 'Token' })
    const skill = await card('ygo', 'Skill - Yugi', '24', { type: 'Skill Card' })
    const pokemon = await card('pokemon', 'Furret', 'swsh3-136', { category: 'Pokemon' })
    const pokemonWithoutId = await card('pokemon', 'Ohne ID', null, {})

    await h.db.$executeRawUnsafe(MIGRATION)

    const flags = async (...cards: { id: number }[]) =>
      Promise.all(cards.map(async entry => (await h.db.card.findUniqueOrThrow({ where: { id: entry.id } })).deckable))
    expect(await flags(normal, spell, noType, pokemon, pokemonWithoutId)).toEqual([true, true, true, true, true])
    expect(await flags(manual, manualNormal, token, skill)).toEqual([false, false, false, false])
  })

  it('can run again without harm', async () => {
    const token = await card('ygo', 'Sheep Token', '23', { type: 'Token' })
    await h.db.$executeRawUnsafe(MIGRATION)
    await h.db.card.update({ where: { id: token.id }, data: { deckable: true } })
    await h.db.$executeRawUnsafe(MIGRATION)
    expect((await h.db.card.findUniqueOrThrow({ where: { id: token.id } })).deckable).toBe(false)
  })
})
