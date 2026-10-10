import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { AppConfig } from '../lib/config'
import { badRequest, notFound } from '../lib/errors'
import { downloadImage } from '../lib/image-download'
import { detectImageType, mimeFromExtension, resolveImagePath } from '../lib/image-files'
import type { AdapterRegistry } from '../tcg/registry'

export interface ThumbnailServiceDeps {
  registry: AdapterRegistry
  config: AppConfig
  fetchFn?: typeof fetch
  now?: () => Date
}

const EXTENSIONS = ['jpg', 'png', 'webp'] as const
const MAX_BYTES = 1024 * 1024
/** At most this many downloads at once: a page of search results asks for many images together. */
const MAX_PARALLEL = 4
/** A thumbnail that could not be downloaded is not asked for again for this long. */
const RETRY_AFTER_MS = 60_000
const EXTERNAL_ID = /^[A-Za-z0-9._-]{1,40}$/

/**
 * The small card images of the lookup for games whose image host asks not to be hotlinked (Yu-Gi-Oh!). Each image is
 * downloaded from the host once, the first time it is wanted, kept in the image directory and served from there.
 */
export function createThumbnailService({ registry, config, fetchFn, now = () => new Date() }: ThumbnailServiceDeps) {
  const inFlight = new Map<string, Promise<string | null>>()
  const failedAt = new Map<string, number>()
  let running = 0
  const waiting: (() => void)[] = []

  async function inSlot<T>(job: () => Promise<T>): Promise<T> {
    if (running >= MAX_PARALLEL) {
      await new Promise<void>(resolve => waiting.push(resolve))
    }
    running += 1
    try {
      return await job()
    }
    finally {
      running -= 1
      waiting.shift()?.()
    }
  }

  const relativePath = (slug: string, externalId: string, extension: string) => `thumbnails/${slug}/${externalId}.${extension}`

  async function stored(slug: string, externalId: string): Promise<string | null> {
    for (const extension of EXTENSIONS) {
      const path = resolveImagePath(config.imageDir, relativePath(slug, externalId, extension))
      if ((await stat(path).catch(() => null))?.isFile()) {
        return path
      }
    }
    return null
  }

  async function download(slug: string, externalId: string, source: string, hosts: readonly string[]): Promise<string | null> {
    const key = `${slug}/${externalId}`
    if (now().getTime() - (failedAt.get(key) ?? 0) < RETRY_AFTER_MS) {
      return null
    }
    try {
      const bytes = await inSlot(() => downloadImage(source, { allowedHosts: hosts, maxBytes: MAX_BYTES, fetchFn }))
      const type = detectImageType(bytes)
      if (!type) {
        throw new Error('Downloaded file is not a supported image')
      }
      const path = resolveImagePath(config.imageDir, relativePath(slug, externalId, type.extension))
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, bytes)
      failedAt.delete(key)
      return path
    }
    catch (error) {
      failedAt.set(key, now().getTime())
      console.warn(`Could not load the thumbnail of ${key}:`, error instanceof Error ? error.message : error)
      return null
    }
  }

  return {
    /** The stored small image of a card; downloaded on the first request. Throws a 404 if there is none. */
    async get(slug: string, externalId: string): Promise<{ path: string, mime: string }> {
      const adapter = registry.get(slug)
      if (!adapter?.thumbnailSource) {
        throw notFound('thumbnail_not_available', 'This game has no stored thumbnails')
      }
      if (!EXTERNAL_ID.test(externalId)) {
        throw badRequest('invalid_card_id', 'Invalid card id')
      }
      const source = adapter.thumbnailSource(externalId)
      if (!source) {
        throw notFound('thumbnail_not_found', 'Thumbnail not found')
      }

      let path = await stored(slug, externalId)
      if (!path) {
        const key = `${slug}/${externalId}`
        // Everybody who asks for the same image while it is loaded waits for that one download.
        const pending = inFlight.get(key) ?? download(slug, externalId, source, adapter.imageHosts)
        inFlight.set(key, pending)
        try {
          path = await pending
        }
        finally {
          inFlight.delete(key)
        }
      }
      if (!path) {
        throw notFound('thumbnail_not_found', 'Thumbnail not found')
      }
      return { path, mime: mimeFromExtension(path) }
    },
  }
}

export type ThumbnailService = ReturnType<typeof createThumbnailService>
