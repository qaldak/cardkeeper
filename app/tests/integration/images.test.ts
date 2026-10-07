import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DARK_MAGICIAN } from '../helpers/ygo-fake'
import { JPEG_BYTES, PNG_BYTES } from '../helpers/png'
import { TEST_DATABASE_URL, useHarness } from './helpers'

describe.skipIf(!TEST_DATABASE_URL)('image service', () => {
  const h = useHarness()

  async function cardWithoutImage() {
    h.ygo.failImages = true
    return h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id) }, h.anna)
  }

  it('makes the first upload primary and later uploads secondary', async () => {
    const card = await cardWithoutImage()
    const first = await h.services.images.addManual(card.id, PNG_BYTES, h.anna)
    const second = await h.services.images.addManual(card.id, JPEG_BYTES, h.anna)
    expect(first).toMatchObject({ source: 'MANUAL', isPrimary: true })
    expect(second).toMatchObject({ source: 'MANUAL', isPrimary: false })
    // Image changes count as a change by the user.
    expect((await h.services.cards.get(card.id)).userModifiedAt).toBe('2026-10-04T12:00:00.000Z')
    expect((await h.services.cards.get(card.id)).images.map(image => image.id)).toEqual([first.id, second.id])
  })

  it('keeps an API image primary when a manual one is added', async () => {
    h.ygo.failImages = false
    const card = await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id) }, h.anna)
    const manual = await h.services.images.addManual(card.id, PNG_BYTES, h.anna)
    expect(manual.isPrimary).toBe(false)
  })

  it('rejects empty, oversized and non-image uploads', async () => {
    const card = await cardWithoutImage()
    await expect(h.services.images.addManual(card.id, new Uint8Array(), h.anna)).rejects.toMatchObject({ code: 'empty_file' })
    await expect(h.services.images.addManual(card.id, new Uint8Array(2048).fill(1), h.anna)).rejects.toMatchObject({ status: 413, code: 'file_too_large' })
    await expect(h.services.images.addManual(card.id, new TextEncoder().encode('<svg/>'), h.anna)).rejects.toMatchObject({ code: 'unsupported_image' })
    await expect(h.services.images.addManual(999, PNG_BYTES, h.anna)).rejects.toMatchObject({ status: 404 })
    expect(await h.db.cardImage.count()).toBe(0)
  })

  it('switches the primary image', async () => {
    const card = await cardWithoutImage()
    const first = await h.services.images.addManual(card.id, PNG_BYTES, h.anna)
    const second = await h.services.images.addManual(card.id, JPEG_BYTES, h.anna)
    await h.services.images.setPrimary(second.id, h.anna)
    const images = (await h.services.cards.get(card.id)).images
    expect(images.find(image => image.id === second.id)?.isPrimary).toBe(true)
    expect(images.find(image => image.id === first.id)?.isPrimary).toBe(false)
  })

  it('deletes the file and promotes another image when the primary is removed', async () => {
    const card = await cardWithoutImage()
    const first = await h.services.images.addManual(card.id, PNG_BYTES, h.anna)
    const second = await h.services.images.addManual(card.id, JPEG_BYTES, h.anna)
    const stored = await h.db.cardImage.findUniqueOrThrow({ where: { id: first.id } })
    const file = join(h.config.imageDir, stored.filePath)

    await h.services.images.remove(first.id, h.anna)

    expect(existsSync(file)).toBe(false)
    expect((await h.services.cards.get(card.id)).images).toEqual([{ id: second.id, source: 'MANUAL', isPrimary: true }])
  })

  it('resolves the file path and content type for serving', async () => {
    const card = await cardWithoutImage()
    const image = await h.services.images.addManual(card.id, PNG_BYTES, h.anna)
    const file = await h.services.images.getFile(image.id)
    expect(file.mime).toBe('image/png')
    expect(file.fileName).toBe('Dunkler Magier.png')
    expect(existsSync(file.path)).toBe(true)
    await expect(h.services.images.getFile(999)).rejects.toMatchObject({ status: 404 })
  })
})
