import { badRequest } from './errors'

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parses `YYYY-MM-DD` into a Date at UTC midnight; throws a 400 for anything that is not a real calendar date. */
export function parseDateOnly(value: string): Date {
  const match = DATE_ONLY.exec(value)
  if (!match) {
    throw badRequest('invalid_date', `Invalid date "${value}", expected YYYY-MM-DD`)
  }
  const [, year, month, day] = match.map(Number) as [number, number, number, number]
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw badRequest('invalid_date', `Invalid date "${value}"`)
  }
  return date
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Today at UTC midnight. */
export function utcToday(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}
