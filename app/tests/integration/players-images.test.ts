import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DARK_MAGICIAN } from '../helpers/ygo-fake'
import { JPEG_BYTES, PNG_BYTES } from '../helpers/png'
import { TEST_DATABASE_URL, useHarness } from './helpers'

describe.skipIf(!TEST_DATABASE_URL)('player service', () => {
  const h = useHarness()

  it('creates, lists, renames and deletes players', async () => {
    const anna = await h.services.players.create({ name: 'Anna', contact: 'anna@example.org' })
    await h.services.players.create({ name: 'Sven' })
    expect(anna).toMatchObject({ name: 'Anna', contact: 'anna@example.org', cardCount: 0 })

    expect((await h.services.players.list()).map(player => player.name)).toEqual(['Anna', 'Sven'])

    const renamed = await h.services.players.update(anna.id, { name: 'Anna M.', contact: null })
    expect(renamed).toMatchObject({ name: 'Anna M.', contact: null })

    await h.services.players.remove(anna.id)
    expect((await h.services.players.list()).map(player => player.name)).toEqual(['Sven'])
  })

  it('rejects duplicate names', async () => {
    await h.services.players.create({ name: 'Anna' })
    await expect(h.services.players.create({ name: 'Anna' })).rejects.toMatchObject({ status: 409, code: 'player_exists' })
    const sven = await h.services.players.create({ name: 'Sven' })
    await expect(h.services.players.update(sven.id, { name: 'Anna' })).rejects.toMatchObject({ status: 409, code: 'player_exists' })
  })

  it('answers 404 for unknown players', async () => {
    await expect(h.services.players.update(5, { name: 'x' })).rejects.toMatchObject({ status: 404 })
    await expect(h.services.players.remove(5)).rejects.toMatchObject({ status: 404 })
  })

  it('counts cards and keeps them unassigned when a player is deleted', async () => {
    const anna = await h.services.players.create({ name: 'Anna' })
    const card = await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id), playerId: anna.id }, 'test')
    expect((await h.services.players.list())[0]!.cardCount).toBe(1)

    await h.services.players.remove(anna.id)
    expect((await h.services.cards.get(card.id)).assignedPlayerId).toBeNull()
  })
})

describe.skipIf(!TEST_DATABASE_URL)('image service', () => {
  const h = useHarness()

  async function cardWithoutImage() {
    h.ygo.failImages = true
    return h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id) }, 'test')
  }

  it('makes the first upload primary and later uploads secondary', async () => {
    const card = await cardWithoutImage()
    const first = await h.services.images.addManual(card.id, PNG_BYTES, 'anna')
    const second = await h.services.images.addManual(card.id, JPEG_BYTES, 'anna')
    expect(first).toMatchObject({ source: 'MANUAL', isPrimary: true })
    expect(second).toMatchObject({ source: 'MANUAL', isPrimary: false })
    // Image changes count as a change by the user.
    expect((await h.services.cards.get(card.id)).userModifiedAt).toBe('2026-10-04T12:00:00.000Z')
    expect((await h.services.cards.get(card.id)).images.map(image => image.id)).toEqual([first.id, second.id])
  })

  it('keeps an API image primary when a manual one is added', async () => {
    h.ygo.failImages = false
    const card = await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id) }, 'test')
    const manual = await h.services.images.addManual(card.id, PNG_BYTES, 'anna')
    expect(manual.isPrimary).toBe(false)
  })

  it('rejects empty, oversized and non-image uploads', async () => {
    const card = await cardWithoutImage()
    await expect(h.services.images.addManual(card.id, new Uint8Array(), 'a')).rejects.toMatchObject({ code: 'empty_file' })
    await expect(h.services.images.addManual(card.id, new Uint8Array(2048).fill(1), 'a')).rejects.toMatchObject({ status: 413, code: 'file_too_large' })
    await expect(h.services.images.addManual(card.id, new TextEncoder().encode('<svg/>'), 'a')).rejects.toMatchObject({ code: 'unsupported_image' })
    await expect(h.services.images.addManual(999, PNG_BYTES, 'a')).rejects.toMatchObject({ status: 404 })
    expect(await h.db.cardImage.count()).toBe(0)
  })

  it('switches the primary image', async () => {
    const card = await cardWithoutImage()
    const first = await h.services.images.addManual(card.id, PNG_BYTES, 'a')
    const second = await h.services.images.addManual(card.id, JPEG_BYTES, 'a')
    await h.services.images.setPrimary(second.id, 'a')
    const images = (await h.services.cards.get(card.id)).images
    expect(images.find(image => image.id === second.id)?.isPrimary).toBe(true)
    expect(images.find(image => image.id === first.id)?.isPrimary).toBe(false)
  })

  it('deletes the file and promotes another image when the primary is removed', async () => {
    const card = await cardWithoutImage()
    const first = await h.services.images.addManual(card.id, PNG_BYTES, 'a')
    const second = await h.services.images.addManual(card.id, JPEG_BYTES, 'a')
    const stored = await h.db.cardImage.findUniqueOrThrow({ where: { id: first.id } })
    const file = join(h.config.imageDir, stored.filePath)

    await h.services.images.remove(first.id, 'a')

    expect(existsSync(file)).toBe(false)
    expect((await h.services.cards.get(card.id)).images).toEqual([{ id: second.id, source: 'MANUAL', isPrimary: true }])
  })

  it('resolves the file path and content type for serving', async () => {
    const card = await cardWithoutImage()
    const image = await h.services.images.addManual(card.id, PNG_BYTES, 'a')
    const file = await h.services.images.getFile(image.id)
    expect(file.mime).toBe('image/png')
    expect(existsSync(file.path)).toBe(true)
    await expect(h.services.images.getFile(999)).rejects.toMatchObject({ status: 404 })
  })
})
