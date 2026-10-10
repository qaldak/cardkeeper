const HOUR = 3_600_000
const DAY = 24 * HOUR

const UNITS: Record<string, number> = {
  h: HOUR, hour: HOUR, hours: HOUR,
  d: DAY, day: DAY, days: DAY,
  w: 7 * DAY, week: 7 * DAY, weeks: 7 * DAY,
  // A month is 30 days: the intervals are rough on purpose.
  mo: 30 * DAY, month: 30 * DAY, months: 30 * DAY,
}

const OFF = new Set(['off', 'never', 'false', 'no', '0'])

/** "12h", "1d", "3 days", "2w", "1mo", "3 months" → milliseconds. Throws a clear error for anything else. */
export function parseDuration(value: string, name: string): number {
  const match = /^(\d+)\s*([a-z]+)$/i.exec(value.trim())
  const unit = match ? UNITS[match[2]!.toLowerCase()] : undefined
  const amount = match ? Number(match[1]) : 0
  if (!match || unit === undefined || amount <= 0) {
    throw new Error(`${name} must be a number and a unit (h, d, w or mo), e.g. 12h, 1d, 2w or 1mo, got "${value}"`)
  }
  return amount * unit
}

/** Like `parseDuration`, but unset gives the default and "off" gives `null` (the feature is switched off). */
export function parseOptionalDuration(value: string | undefined, fallback: string, name: string): number | null {
  const text = value?.trim() ? value.trim() : fallback
  return OFF.has(text.toLowerCase()) ? null : parseDuration(text, name)
}
