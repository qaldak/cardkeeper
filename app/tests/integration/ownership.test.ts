import { describe, expect, it } from 'vitest'
import { PNG_BYTES } from '../helpers/png'
import { DARK_MAGICIAN } from '../helpers/ygo-fake'
import { TEST_DATABASE_URL, useHarness } from './helpers'

describe.skipIf(!TEST_DATABASE_URL)('card ownership', () => {
  const h = useHarness()

  const add = (actor = h.anna) => h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id), set: { setCode: 'LOB-005', rarity: 'Ultra Rare' } }, actor)
  const forbidden = { status: 403, code: 'not_card_owner' }

  it('makes the person who adds a card its owner', async () => {
    const card = await add(h.sven)
    expect(card.owner).toEqual({ id: h.sven.id, name: 'Sven' })
    expect((await h.db.card.findUniqueOrThrow({ where: { id: card.id } })).ownerUserId).toBe(h.sven.id)
  })

  it('lets everybody see every card', async () => {
    const card = await add(h.anna)
    expect((await h.services.cards.get(card.id)).owner?.name).toBe('Anna')
    const list = await h.services.cards.list({}, { page: 1, pageSize: 48 })
    expect(list.items.map(item => [item.id, item.owner?.name])).toEqual([[card.id, 'Anna']])
    expect((await h.services.cards.list({ owner: h.sven.id }, { page: 1, pageSize: 48 })).items).toEqual([])
  })

  describe('another user cannot change the card', () => {
    it('neither its data', async () => {
      const card = await add(h.anna)
      await expect(h.services.cards.update(card.id, { status: 'SOLD', statusPerson: 'Max' }, h.sven)).rejects.toMatchObject(forbidden)
      await expect(h.services.cards.update(card.id, { ownerId: h.sven.id }, h.sven)).rejects.toMatchObject(forbidden)
      await expect(h.services.cards.update(card.id, { set: { setCode: 'LOB-DE005' } }, h.sven)).rejects.toMatchObject(forbidden)
      expect(await h.services.cards.get(card.id)).toMatchObject({ status: 'ACTIVE', owner: { id: h.anna.id }, userModifiedAt: null })
      expect(await h.db.auditLog.count({ where: { entityId: card.id, field: { not: 'created' } } })).toBe(0)
    })

    it('nor refresh it from the API', async () => {
      const card = await add(h.anna)
      await expect(h.services.cards.refresh(card.id, h.sven)).rejects.toMatchObject(forbidden)
    })

    it('nor delete it', async () => {
      const card = await add(h.anna)
      await expect(h.services.cards.remove(card.id, h.sven)).rejects.toMatchObject(forbidden)
      expect(await h.db.card.count()).toBe(1)
    })

    it('nor touch its images', async () => {
      const card = await add(h.anna)
      const image = await h.services.images.addManual(card.id, PNG_BYTES, h.anna)
      await expect(h.services.images.addManual(card.id, PNG_BYTES, h.sven)).rejects.toMatchObject(forbidden)
      await expect(h.services.images.setPrimary(image.id, h.sven)).rejects.toMatchObject(forbidden)
      await expect(h.services.images.remove(image.id, h.sven)).rejects.toMatchObject(forbidden)
      expect(await h.db.cardImage.count({ where: { cardId: card.id, source: 'MANUAL' } })).toBe(1)
    })
  })

  it('lets the owner do all of it', async () => {
    const card = await add(h.anna)
    await h.services.cards.update(card.id, { status: 'SOLD', statusPerson: 'Max' }, h.anna)
    await h.services.cards.refresh(card.id, h.anna)
    const image = await h.services.images.addManual(card.id, PNG_BYTES, h.anna)
    await h.services.images.remove(image.id, h.anna)
    await h.services.cards.remove(card.id, h.anna)
    expect(await h.db.card.count()).toBe(0)
  })

  it('hands the card over: the old owner loses the right, the new one gains it', async () => {
    const card = await add(h.anna)
    await h.services.cards.update(card.id, { ownerId: h.sven.id }, h.anna)
    await expect(h.services.cards.remove(card.id, h.anna)).rejects.toMatchObject(forbidden)
    await h.services.cards.remove(card.id, h.sven)
    expect(await h.db.card.count()).toBe(0)
  })

  describe('a card without an owner (from before the logins)', () => {
    async function ownerless() {
      const card = await add(h.anna)
      await h.db.card.update({ where: { id: card.id }, data: { ownerUserId: null } })
      return card
    }
    const noOwner = { status: 403, code: 'card_has_no_owner' }

    it('can be seen by everybody', async () => {
      const card = await ownerless()
      expect((await h.services.cards.get(card.id)).owner).toBeNull()
      expect((await h.services.cards.list({ owner: 'none' }, { page: 1, pageSize: 48 })).items.map(item => item.id)).toEqual([card.id])
    })

    it('can be changed by nobody, not even by its former owner', async () => {
      const card = await ownerless()
      for (const actor of [h.anna, h.sven]) {
        await expect(h.services.cards.update(card.id, { status: 'LOST' }, actor)).rejects.toMatchObject(noOwner)
        await expect(h.services.cards.update(card.id, { ownerId: actor.id }, actor)).rejects.toMatchObject(noOwner)
        await expect(h.services.cards.refresh(card.id, actor)).rejects.toMatchObject(noOwner)
        await expect(h.services.cards.remove(card.id, actor)).rejects.toMatchObject(noOwner)
        await expect(h.services.images.addManual(card.id, PNG_BYTES, actor)).rejects.toMatchObject(noOwner)
      }
    })

    it('can be handed to somebody by setting the owner in the database', async () => {
      const card = await ownerless()
      await h.db.$executeRawUnsafe(`UPDATE cards SET owner_user_id = ${h.sven.id} WHERE id = ${card.id}`)
      expect((await h.services.cards.update(card.id, { status: 'LOST' }, h.sven)).status).toBe('LOST')
    })
  })

  it('keeps the cards of a deleted user, without an owner', async () => {
    const card = await add(h.sven)
    await h.db.user.delete({ where: { id: h.sven.id } })
    expect((await h.services.cards.get(card.id)).owner).toBeNull()
  })
})
