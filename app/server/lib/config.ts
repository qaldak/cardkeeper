import { resolve } from 'node:path'
import { parseDuration, parseOptionalDuration } from './duration'
import { USERNAME_PATTERN } from '../../shared/utils/users'

export interface AppConfig {
  /** Price source used for list prices and totals (e.g. "cardmarket"). */
  priceSource: string
  /** Directory on the card-images volume. */
  imageDir: string
  maxUploadBytes: number
  /** Secret that seals the session cookies; changing it logs everybody out. */
  sessionSecret: string
  /** Users that are created at startup when they do not exist yet (from USERS). */
  users: string[]
  ygoBaseUrl: string
  tcgdexBaseUrl: string
  priceRefresh: PriceRefreshConfig
}

/** The scheduled reload of the prices (from PRICE_REFRESH_*). */
export interface PriceRefreshConfig {
  /** How old the prices of a card may get before they are loaded again, in milliseconds; `null` switches the reload off. */
  after: number | null
  /** How many cards are reloaded in one go (one tranche). */
  batchSize: number
  /** The least time between two tranches, in milliseconds. */
  batchEvery: number
  /** The pause between two requests to a card database, in milliseconds. */
  delayMs: number
}

function positiveNumber(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value.trim() === '') {
    return fallback
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number, got "${value}"`)
  }
  return parsed
}

const MIN_SECRET_LENGTH = 32

// The card databases limit the requests (YGOPRODeck: 20 per second, and blocks for an hour above that): the pause between
// two requests has a floor, and a tranche is not started more often than once an hour.
const MIN_DELAY_MS = 100
const MIN_BATCH_EVERY_MS = 3_600_000

function priceRefresh(env: Record<string, string | undefined>): PriceRefreshConfig {
  const delayMs = Math.round(positiveNumber(env.PRICE_REFRESH_DELAY_MS, 500, 'PRICE_REFRESH_DELAY_MS'))
  if (delayMs < MIN_DELAY_MS) {
    throw new Error(`PRICE_REFRESH_DELAY_MS must be at least ${MIN_DELAY_MS}: the card databases limit the requests per second`)
  }
  const batchEvery = parseDuration(env.PRICE_REFRESH_BATCH_EVERY?.trim() || '1d', 'PRICE_REFRESH_BATCH_EVERY')
  if (batchEvery < MIN_BATCH_EVERY_MS) {
    throw new Error('PRICE_REFRESH_BATCH_EVERY must be at least 1h')
  }
  return {
    after: parseOptionalDuration(env.PRICE_REFRESH_AFTER, '1w', 'PRICE_REFRESH_AFTER'),
    batchSize: Math.round(positiveNumber(env.PRICE_REFRESH_BATCH_SIZE, 100, 'PRICE_REFRESH_BATCH_SIZE')),
    batchEvery,
    delayMs,
  }
}

/** "anna, max,sven" → ["anna", "max", "sven"]; a name that appears twice (in any case) is kept once. */
function parseUsers(value: string | undefined): string[] {
  const seen = new Set<string>()
  const users: string[] = []
  for (const name of (value ?? '').split(',').map(entry => entry.trim()).filter(Boolean)) {
    if (!USERNAME_PATTERN.test(name)) {
      throw new Error(`USERS contains an invalid name "${name}" (letters, digits, space and . _ @ + - are allowed)`)
    }
    if (!seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase())
      users.push(name)
    }
  }
  return users
}

function sessionSecret(value: string | undefined): string {
  const secret = value?.trim() ?? ''
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`SESSION_SECRET must be set to a random value of at least ${MIN_SECRET_LENGTH} characters (e.g. openssl rand -hex 32)`)
  }
  return secret
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return {
    priceSource: env.PRICE_SOURCE?.trim() || 'cardmarket',
    imageDir: resolve(env.IMAGE_DIR?.trim() || '/data/card-images'),
    maxUploadBytes: Math.round(positiveNumber(env.MAX_UPLOAD_MB, 5, 'MAX_UPLOAD_MB') * 1024 * 1024),
    sessionSecret: sessionSecret(env.SESSION_SECRET),
    users: parseUsers(env.USERS),
    ygoBaseUrl: env.YGOPRODECK_API_URL?.trim() || 'https://db.ygoprodeck.com/api/v7',
    tcgdexBaseUrl: env.TCGDEX_API_URL?.trim() || 'https://api.tcgdex.net/v2',
    priceRefresh: priceRefresh(env),
  }
}
