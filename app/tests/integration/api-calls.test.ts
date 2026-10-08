import { describe, expect, it } from 'vitest'
import { DARK_MAGICIAN } from '../helpers/ygo-fake'
import { TEST_DATABASE_URL, useHarness } from './helpers'

// Every game talks to its own card database and image host only; a card never gets the image of another game.
describe.skipIf(!TEST_DATABASE_URL)('calls to the card databases', () => {
  const h = useHarness()

  it('a Yu-Gi-Oh! card only uses YGOPRODeck and gets its image from there', async () => {
    const found = await h.services.cards.lookup('ygo', 'Dunkler')
    expect(found.map(card => card.externalId)).toEqual([String(DARK_MAGICIAN.id)])
    const card = await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id) }, h.anna)

    expect(h.ygo.apiCalls()).toBeGreaterThan(0)
    expect(h.ygo.requestedImages).toEqual([`/images/cards/${DARK_MAGICIAN.id}.jpg`])
    expect(h.tcgdex.requestedUrls).toEqual([])
    expect(h.tcgdex.requestedImages).toEqual([])
    expect(card.images).toHaveLength(1)
    expect(card.images[0]).toMatchObject({ source: 'API', isPrimary: true })
  })

  it('a Pokémon card only uses TCGdex and gets its image from there', async () => {
    const card = await h.services.cards.create({ game: 'pokemon', externalId: 'swsh3-136', set: { setCode: 'swsh3-136', rarity: 'Uncommon', edition: 'reverse' } }, h.anna)

    expect(h.tcgdex.requestedImages).toHaveLength(1)
    expect(h.tcgdex.requestedImages[0]).toContain('swsh3')
    expect(h.ygo.apiCalls()).toBe(0)
    expect(h.ygo.requestedImages).toEqual([])
    expect(card.images).toHaveLength(1)
  })

  it('cards of both games keep their own image', async () => {
    const ygo = await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id) }, h.anna)
    const pokemon = await h.services.cards.create({ game: 'pokemon', externalId: 'swsh3-136', set: { setCode: 'swsh3-136', rarity: 'Uncommon', edition: 'reverse' } }, h.anna)

    const files = await h.db.cardImage.findMany({ orderBy: { id: 'asc' } })
    expect(files.map(file => file.cardId)).toEqual([ygo.id, pokemon.id])
    expect(files[0]!.filePath.startsWith(`${ygo.id}/`)).toBe(true)
    expect(files[1]!.filePath.startsWith(`${pokemon.id}/`)).toBe(true)
    expect(h.ygo.requestedImages).toHaveLength(1)
    expect(h.tcgdex.requestedImages).toHaveLength(1)
  })
})
