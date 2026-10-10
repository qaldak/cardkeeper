import { existsSync } from 'node:fs'
import { readFile, rm } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BLUE_EYES, DARK_MAGICIAN } from '../helpers/ygo-fake'
import { PNG_BYTES } from '../helpers/png'
import { TEST_DATABASE_URL, useHarness } from './helpers'

describe.skipIf(!TEST_DATABASE_URL)('thumbnails of the lookup', () => {
  const h = useHarness()
  const id = String(DARK_MAGICIAN.id)

  // The image directory lives as long as the test file: start every test without stored thumbnails.
  beforeEach(() => rm(`${h.config.imageDir}/thumbnails`, { recursive: true, force: true }))

  it('downloads the small image from the image host once and then serves its own copy', async () => {
    const first = await h.services.thumbnails.get('ygo', id)
    expect(first.mime).toBe('image/png')
    expect(first.path.startsWith(h.config.imageDir)).toBe(true)
    expect(new Uint8Array(await readFile(first.path))).toEqual(PNG_BYTES)
    expect(h.ygo.requestedImages).toEqual([`/images/cards_small/${id}.jpg`])

    const second = await h.services.thumbnails.get('ygo', id)
    expect(second.path).toBe(first.path)
    expect(h.ygo.requestedImages).toHaveLength(1)
  })

  it('loads an image only once when many are asked for at the same time, and one per card', async () => {
    const results = await Promise.all([
      ...Array.from({ length: 6 }, () => h.services.thumbnails.get('ygo', id)),
      h.services.thumbnails.get('ygo', String(BLUE_EYES.id)),
    ])
    expect(new Set(results.map(result => result.path)).size).toBe(2)
    expect(h.ygo.requestedImages.sort()).toEqual([`/images/cards_small/${BLUE_EYES.id}.jpg`, `/images/cards_small/${id}.jpg`].sort())
  })

  it('answers 404 when the image cannot be loaded, keeps no file, and does not ask again right away', async () => {
    h.ygo.failImages = true
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(h.services.thumbnails.get('ygo', id)).rejects.toMatchObject({ status: 404, code: 'thumbnail_not_found' })
    await expect(h.services.thumbnails.get('ygo', id)).rejects.toMatchObject({ status: 404 })
    expect(h.ygo.requestedImages).toHaveLength(1)
    expect(existsSync(`${h.config.imageDir}/thumbnails/ygo`)).toBe(false)
    warn.mockRestore()
  })

  it('only serves ids of games that keep thumbnails, and rejects anything that is no card id', async () => {
    // Pokémon images are shown straight from their host.
    await expect(h.services.thumbnails.get('pokemon', 'swsh3-136')).rejects.toMatchObject({ status: 404, code: 'thumbnail_not_available' })
    await expect(h.services.thumbnails.get('mtg', '1')).rejects.toMatchObject({ status: 404 })
    for (const bad of ['../../etc/passwd', 'a/b', '4698 6414', '']) {
      await expect(h.services.thumbnails.get('ygo', bad), bad).rejects.toMatchObject({ status: 400 })
    }
    // A valid text that is no passcode has no image address.
    await expect(h.services.thumbnails.get('ygo', 'abc')).rejects.toMatchObject({ status: 404 })
    expect(h.ygo.requestedImages).toEqual([])
  })
})
