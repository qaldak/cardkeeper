import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, beforeEach } from 'vitest'
import { createPrisma, type PrismaClient } from '../../server/db'
import type { AppConfig } from '../../server/lib/config'
import { createServices, type Services } from '../../server/services'
import { createRegistry } from '../../server/tcg/registry'
import { createTcgdexAdapter } from '../../server/tcg/tcgdex/adapter'
import { createYgoAdapter } from '../../server/tcg/ygo/adapter'
import { bossOrders, createFakeTcgdexServer, fireEnergy, furret, type FakeTcgdexServer } from '../helpers/tcgdex-fake'
import { BLUE_EYES, createFakeYgoServer, DARK_MAGICIAN, ENGLISH_ONLY, type FakeYgoServer } from '../helpers/ygo-fake'

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

export interface Harness {
  db: PrismaClient
  services: Services
  ygo: FakeYgoServer
  tcgdex: FakeTcgdexServer
  config: AppConfig
}

const TABLES = ['audit_log', 'card_images', 'api_snapshots', 'status_history', 'price_history', 'card_sets', 'card_translations', 'cards', 'players', 'games']

/**
 * Sets up services against the real test database with a fake YGOPRODeck and a temporary image
 * directory, and wipes all data before every test. Only ever points at TEST_DATABASE_URL, so a
 * regular DATABASE_URL (the real collection) can never be truncated by accident.
 */
export function useHarness(): Harness {
  const harness = {} as Harness
  let imageDir: string

  beforeAll(async () => {
    imageDir = await mkdtemp(join(tmpdir(), 'cardkeeper-it-'))
    harness.db = createPrisma(TEST_DATABASE_URL!)
    harness.config = {
      priceSource: 'cardmarket',
      imageDir,
      maxUploadBytes: 1024,
      userHeader: 'x-remote-user',
      ygoBaseUrl: 'https://ygo.test/api/v7',
      tcgdexBaseUrl: 'https://tcgdex.test/v2',
    }
  })

  beforeEach(async () => {
    await harness.db.$executeRawUnsafe(`TRUNCATE ${TABLES.map(table => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`)
    harness.ygo = createFakeYgoServer([DARK_MAGICIAN, BLUE_EYES, ENGLISH_ONLY])
    harness.tcgdex = createFakeTcgdexServer([furret(), bossOrders(), fireEnergy()])
    const registry = createRegistry([
      createYgoAdapter({ baseUrl: harness.config.ygoBaseUrl, fetchFn: harness.ygo.fetchFn }),
      createTcgdexAdapter({ baseUrl: harness.config.tcgdexBaseUrl, fetchFn: harness.tcgdex.fetchFn }),
    ])
    // Image downloads: each fake serves its own image host.
    const fetchFn = ((input: URL | RequestInfo, init?: RequestInit) =>
      new URL(input instanceof Request ? input.url : String(input)).hostname === 'assets.tcgdex.net'
        ? harness.tcgdex.fetchFn(input, init)
        : harness.ygo.fetchFn(input, init)) as typeof fetch
    harness.services = createServices({
      db: harness.db,
      registry,
      config: harness.config,
      fetchFn,
      now: () => new Date('2026-10-04T12:00:00Z'),
    })
  })

  afterAll(async () => {
    await harness.db.$disconnect()
    await rm(imageDir, { recursive: true, force: true })
  })

  return harness
}
