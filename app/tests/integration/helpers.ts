import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, beforeEach } from 'vitest'
import { createPrisma, type PrismaClient } from '../../server/db'
import type { Actor } from '../../server/lib/actor'
import type { AppConfig } from '../../server/lib/config'
import { createServices, type Services } from '../../server/services'
import { createRegistry } from '../../server/tcg/registry'
import { createTcgdexAdapter } from '../../server/tcg/tcgdex/adapter'
import { createYgoAdapter } from '../../server/tcg/ygo/adapter'
import { bossOrders, createFakeTcgdexServer, fireEnergy, furret, hippowdon, japanesePikachu, type FakeTcgdexServer } from '../helpers/tcgdex-fake'
import { BLUE_EYES, createFakeYgoServer, DARK_MAGICIAN, ENGLISH_ONLY, LINK_MONSTER, type FakeYgoServer } from '../helpers/ygo-fake'

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

export interface Harness {
  db: PrismaClient
  services: Services
  ygo: FakeYgoServer
  tcgdex: FakeTcgdexServer
  config: AppConfig
  /** Two users ("Anna" and "Sven") that exist in every test; they are the people on whose behalf cards are changed. */
  anna: Actor
  sven: Actor
}

const TABLES = ['audit_log', 'card_images', 'api_snapshots', 'status_history', 'price_history', 'card_sets', 'card_translations', 'cards', 'users', 'games']

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
      sessionSecret: 'test-session-secret-test-session-secret',
      users: [],
      ygoBaseUrl: 'https://ygo.test/api/v7',
      tcgdexBaseUrl: 'https://tcgdex.test/v2',
    }
  })

  beforeEach(async () => {
    await harness.db.$executeRawUnsafe(`TRUNCATE ${TABLES.map(table => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`)
    harness.ygo = createFakeYgoServer([DARK_MAGICIAN, BLUE_EYES, ENGLISH_ONLY, LINK_MONSTER])
    harness.tcgdex = createFakeTcgdexServer([furret(), bossOrders(), fireEnergy(), hippowdon(), japanesePikachu()])
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
    const [anna, sven] = await Promise.all([
      harness.db.user.create({ data: { name: 'Anna' } }),
      harness.db.user.create({ data: { name: 'Sven' } }),
    ])
    harness.anna = { id: anna.id, name: anna.name }
    harness.sven = { id: sven.id, name: sven.name }
  })

  afterAll(async () => {
    await harness.db.$disconnect()
    await rm(imageDir, { recursive: true, force: true })
  })

  return harness
}
