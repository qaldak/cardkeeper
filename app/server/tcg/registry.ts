import { badRequest } from '../lib/errors'
import type { AppConfig } from '../lib/config'
import type { CardAdapter } from './types'
import { createYgoAdapter } from './ygo/adapter'

export interface AdapterRegistry {
  list: () => CardAdapter[]
  get: (slug: string) => CardAdapter | undefined
  /** Like `get`, but throws a 400 for an unknown game. */
  require: (slug: string) => CardAdapter
}

export function createRegistry(adapters: CardAdapter[]): AdapterRegistry {
  const bySlug = new Map(adapters.map(adapter => [adapter.slug, adapter]))
  return {
    list: () => [...bySlug.values()],
    get: slug => bySlug.get(slug),
    require: (slug) => {
      const adapter = bySlug.get(slug)
      if (!adapter) {
        throw badRequest('unknown_game', `Unknown game "${slug}"`)
      }
      return adapter
    },
  }
}

/** Registers all supported games. Adding a game means adding its adapter here. */
export function createDefaultRegistry(config: AppConfig): AdapterRegistry {
  return createRegistry([
    createYgoAdapter({ baseUrl: config.ygoBaseUrl }),
  ])
}
