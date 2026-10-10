import type { GameDto } from '../../shared/types/api'
import type { AppConfig } from '../lib/config'
import type { PrismaClient } from '../generated/prisma/client'
import type { AdapterRegistry } from '../tcg/registry'
import { createCardService } from './cards'
import { createCatalogService } from './catalog'
import { createImageService } from './images'
import { createPriceRefreshService } from './prices'
import { createExchangeRateService } from './rates'
import { createThumbnailService } from './thumbnails'
import { createUserService } from './users'

export interface ServiceDeps {
  db: PrismaClient
  registry: AdapterRegistry
  config: AppConfig
  fetchFn?: typeof fetch
  now?: () => Date
  /** Waits between two requests of the scheduled price reload; replaced in tests. */
  sleep?: (milliseconds: number) => Promise<void>
}

export function createServices(deps: ServiceDeps) {
  const rates = createExchangeRateService({ baseUrl: deps.config.exchangeRateBaseUrl, fetchFn: deps.fetchFn, now: deps.now })
  return {
    config: deps.config,
    db: deps.db,
    rates,
    cards: createCardService({ ...deps, rates }),
    catalog: createCatalogService(deps),
    images: createImageService(deps),
    prices: createPriceRefreshService(deps),
    thumbnails: createThumbnailService(deps),
    users: createUserService(deps),
    games: (): GameDto[] => deps.registry.list().map(adapter => ({
      slug: adapter.slug,
      displayName: adapter.displayName,
      languages: [...adapter.languages],
      defaultLanguage: adapter.defaultLanguage,
    })),
  }
}

export type Services = ReturnType<typeof createServices>
