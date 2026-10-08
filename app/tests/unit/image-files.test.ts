import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  detectImageType,
  downloadFileName,
  etagMatches,
  imageEtag,
  inlineDisposition,
  mimeFromExtension,
  removeCardImageDir,
  removeImageFile,
  resolveImagePath,
  saveImage,
} from '../../server/lib/image-files'
import { JPEG_BYTES, PNG_BYTES, WEBP_BYTES } from '../helpers/png'

describe('detectImageType', () => {
  it('detects PNG, JPEG and WebP by signature', () => {
    expect(detectImageType(PNG_BYTES)).toEqual({ mime: 'image/png', extension: 'png' })
    expect(detectImageType(JPEG_BYTES)).toEqual({ mime: 'image/jpeg', extension: 'jpg' })
    expect(detectImageType(WEBP_BYTES)).toEqual({ mime: 'image/webp', extension: 'webp' })
  })

  it('rejects other content regardless of what the client claims', () => {
    expect(detectImageType(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull()
    expect(detectImageType(new TextEncoder().encode('GIF89a'))).toBeNull()
    expect(detectImageType(new Uint8Array())).toBeNull()
  })

  it('maps stored extensions back to a content type', () => {
    expect(mimeFromExtension('1/a.png')).toBe('image/png')
    expect(mimeFromExtension('1/a.webp')).toBe('image/webp')
    expect(mimeFromExtension('1/a.jpg')).toBe('image/jpeg')
  })
})

describe('image storage', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cardkeeper-images-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('stores images under <cardId>/<uuid>.<ext> and reads them back', async () => {
    const relativePath = await saveImage(dir, 7, PNG_BYTES, { mime: 'image/png', extension: 'png' })
    expect(relativePath).toMatch(/^7\/[0-9a-f-]{36}\.png$/)
    expect(new Uint8Array(await readFile(resolveImagePath(dir, relativePath)))).toEqual(PNG_BYTES)
  })

  it('refuses paths that escape the image directory', () => {
    expect(() => resolveImagePath(dir, '../etc/passwd')).toThrow()
    expect(() => resolveImagePath(dir, '/etc/passwd')).toThrow()
    expect(() => resolveImagePath(dir, '1/../../secret')).toThrow()
    expect(() => resolveImagePath(dir, '.')).toThrow()
  })

  it('removes single files and whole card directories', async () => {
    const first = await saveImage(dir, 3, PNG_BYTES, { mime: 'image/png', extension: 'png' })
    await saveImage(dir, 3, JPEG_BYTES, { mime: 'image/jpeg', extension: 'jpg' })

    await removeImageFile(dir, first)
    await expect(stat(join(dir, first))).rejects.toThrow()

    await removeCardImageDir(dir, 3)
    await expect(stat(join(dir, '3'))).rejects.toThrow()
  })

  it('ignores missing files when removing', async () => {
    await expect(removeImageFile(dir, '9/missing.png')).resolves.toBeUndefined()
    await expect(removeCardImageDir(dir, 9)).resolves.toBeUndefined()
  })
})

describe('download file name', () => {
  it('is the card name with the extension of the stored file', () => {
    expect(downloadFileName('Dunkler Magier', '12/3.webp')).toBe('Dunkler Magier.webp')
    expect(downloadFileName('Hippoterus', '1/api-9.PNG')).toBe('Hippoterus.png')
  })

  it('replaces characters that are not allowed in file names', () => {
    expect(downloadFileName('A/B: "C"?', '1/1.png')).toBe('A_B_ _C__.png')
    expect(downloadFileName('..\\evil', '1/1.png')).toBe('.._evil.png')
  })

  it('keeps it short and never empty', () => {
    expect(downloadFileName('x'.repeat(200), '1/1.png')).toBe(`${'x'.repeat(80)}.png`)
    expect(downloadFileName('   ', '1/1.jpg')).toBe('card.jpg')
  })
})

describe('inlineDisposition', () => {
  it('shows the image inline and names it', () => {
    expect(inlineDisposition('Wiesenior.webp')).toBe(`inline; filename="Wiesenior.webp"; filename*=UTF-8''Wiesenior.webp`)
  })

  it('has an ASCII fallback and the exact name for modern browsers', () => {
    expect(inlineDisposition('Blauäugiger Drache.png')).toBe(`inline; filename="Blau_ugiger Drache.png"; filename*=UTF-8''Blau%C3%A4ugiger%20Drache.png`)
    expect(inlineDisposition('ピカチュウ.webp')).toContain(`filename*=UTF-8''%E3%83%94`)
  })

  it('cannot be broken out of by quotes in the name', () => {
    const header = inlineDisposition('a"; evil=1.png')
    expect(header.split('"').length).toBe(3)
    expect(header).toContain(`filename*=UTF-8''a%22%3B%20evil%3D1.png`)
  })
})

describe('image ETag', () => {
  it('is the file name without the extension, so another file under the same image id gets another tag', () => {
    expect(imageEtag('12/0b9a3f1e-7c1d-4f7e-9a55-1f2f6a8c7d10.webp')).toBe('"0b9a3f1e-7c1d-4f7e-9a55-1f2f6a8c7d10"')
    expect(imageEtag('/data/card-images/1/aaa.png')).not.toBe(imageEtag('/data/card-images/1/bbb.png'))
    expect(imageEtag('C:\\images\\1\\abc.jpg')).toBe('"abc"')
  })

  it('matches the tag in If-None-Match: a single tag, a list, a weak tag or *', () => {
    const etag = '"abc"'
    expect(etagMatches('"abc"', etag)).toBe(true)
    expect(etagMatches('"x", "abc"', etag)).toBe(true)
    expect(etagMatches('W/"abc"', etag)).toBe(true)
    expect(etagMatches('*', etag)).toBe(true)
    expect(etagMatches('"other"', etag)).toBe(false)
    expect(etagMatches(undefined, etag)).toBe(false)
    expect(etagMatches('', etag)).toBe(false)
  })
})
