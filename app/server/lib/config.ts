import { resolve } from 'node:path'

export interface AppConfig {
  /** Price source used for list prices and totals (e.g. "cardmarket"). */
  priceSource: string
  /** Directory on the card-images volume. */
  imageDir: string
  maxUploadBytes: number
  /** Request header set by the reverse proxy that carries the authenticated user name. */
  userHeader: string
  ygoBaseUrl: string
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

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return {
    priceSource: env.PRICE_SOURCE?.trim() || 'cardmarket',
    imageDir: resolve(env.IMAGE_DIR?.trim() || '/data/card-images'),
    maxUploadBytes: Math.round(positiveNumber(env.MAX_UPLOAD_MB, 5, 'MAX_UPLOAD_MB') * 1024 * 1024),
    userHeader: (env.AUTH_USER_HEADER?.trim() || 'x-remote-user').toLowerCase(),
    ygoBaseUrl: env.YGOPRODECK_API_URL?.trim() || 'https://db.ygoprodeck.com/api/v7',
  }
}
