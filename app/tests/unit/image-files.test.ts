import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  detectImageType,
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
