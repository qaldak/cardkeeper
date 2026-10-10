import type { GameSetDto, SetCardDto } from '../../shared/types/api'
import { badRequest, notFound } from '../lib/errors'
import { allowedImageUrl } from '../lib/image-url'
import type { AdapterRegistry } from '../tcg/registry'

export interface CatalogServiceDeps {
  registry: AdapterRegistry
  now?: () => Date
}

// Sets and their card lists change rarely (a few times a year), so they are kept for a few hours
// instead of asking the card database for every page view.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

/** Browsing sets and their cards, for games whose cards are easier to find by set and number than by name. */
export function createCatalogService({ registry, now = () => new Date() }: CatalogServiceDeps) {
  const cache = new Map<string, { at: number, value: unknown }>()

  async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = cache.get(key)
    if (hit && now().getTime() - hit.at < CACHE_TTL_MS) {
      return hit.value as T
    }
    const value = await load()
    cache.set(key, { at: now().getTime(), value })
    return value
  }

  return {
    async sets(gameSlug: string, language?: string): Promise<GameSetDto[]> {
      const adapter = registry.require(gameSlug)
      const listSets = adapter.listSets?.bind(adapter)
      if (!listSets) {
        throw badRequest('sets_not_supported', 'This game has no set browser')
      }
      const lang = language ?? adapter.defaultLanguage
      return cached(`sets:${gameSlug}:${lang}`, async () => {
        const sets = await listSets(lang)
        return sets.map(set => ({
          ...set,
          logoUrl: allowedImageUrl(set.logoUrl, adapter.imageHosts),
        }))
      })
    },

    async setCards(gameSlug: string, setId: string, language?: string): Promise<SetCardDto[]> {
      const adapter = registry.require(gameSlug)
      const listSetCards = adapter.listSetCards?.bind(adapter)
      if (!listSetCards) {
        throw badRequest('sets_not_supported', 'This game has no set browser')
      }
      const lang = language ?? adapter.defaultLanguage
      return cached(`cards:${gameSlug}:${lang}:${setId}`, async () => {
        const cards = await listSetCards(setId, lang)
        if (cards === null) {
          throw notFound('set_not_found', 'Set not found at the card database')
        }
        return cards.map(card => ({
          externalId: card.id,
          number: card.number,
          name: card.name,
          thumbnailUrl: adapter.searchThumbnails
            ? allowedImageUrl(card.thumbnailUrl, adapter.imageHosts)
            // A host that must not be hotlinked is shown from the app's own copy of the image.
            : adapter.thumbnailSource?.(card.id) ? `/api/thumbnails/${adapter.slug}/${encodeURIComponent(card.id)}` : null,
          ...(card.prints ? { prints: card.prints } : {}),
        }))
      })
    },
  }
}

export type CatalogService = ReturnType<typeof createCatalogService>
