import { randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'

export interface ImageType {
  mime: string
  extension: string
}

/** Detects the real image type from the file signature; the client supplied type is never trusted. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
    && bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
    return { mime: 'image/png', extension: 'png' }
  }
  if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { mime: 'image/jpeg', extension: 'jpg' }
  }
  if (bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return { mime: 'image/webp', extension: 'webp' }
  }
  return null
}

export function mimeFromExtension(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'png': return 'image/png'
    case 'webp': return 'image/webp'
    default: return 'image/jpeg'
  }
}

/** Resolves a stored relative path inside the image directory and rejects anything that escapes it. */
export function resolveImagePath(imageDir: string, relativePath: string): string {
  const root = resolve(imageDir)
  const target = resolve(root, relativePath)
  if (!target.startsWith(root + sep)) {
    throw new Error('Image path escapes the image directory')
  }
  return target
}

/** Stores image bytes as `<cardId>/<uuid>.<ext>` and returns the path relative to the image directory. */
export async function saveImage(
  imageDir: string,
  cardId: number,
  bytes: Uint8Array,
  type: ImageType,
): Promise<string> {
  const relativePath = `${cardId}/${randomUUID()}.${type.extension}`
  const target = resolveImagePath(imageDir, relativePath)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, bytes)
  return relativePath
}

export async function removeImageFile(imageDir: string, relativePath: string): Promise<void> {
  await rm(resolveImagePath(imageDir, relativePath), { force: true })
}

export async function removeCardImageDir(imageDir: string, cardId: number): Promise<void> {
  await rm(resolveImagePath(imageDir, String(cardId)), { recursive: true, force: true })
}
