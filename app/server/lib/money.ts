/** Converts a decimal amount to integer cents to avoid floating point drift when summing. */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

/** Parses a price string from an external API; returns null for missing, zero or invalid values. */
export function parsePrice(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null
  }
  const parsed = typeof value === 'number' ? value : Number(value.trim())
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  return fromCents(toCents(parsed))
}
