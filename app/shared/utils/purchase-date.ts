// A card cannot be bought in the future, and a date typed with a short year ("18.12.26" read as the year 26) is not a purchase
// date either. The date field is limited to the range below, and the server refuses a date outside of it as well
// (`assertPurchaseDate` in `server/lib/dates.ts`).

/**
 * The earliest purchase date: before the first Pokémon (1996) and Yu-Gi-Oh! (1999) cards. A year typed with two or three digits
 * ("26" is year 26, not 2026) lies before it and is refused instead of stored.
 */
export const EARLIEST_PURCHASE_DATE = '1990-01-01'

/** Today's date on this device as `YYYY-MM-DD`: the `max` of a date field. */
export function todayOnDevice(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * The latest purchase date the server accepts: the date it already is in the most eastern time zone (UTC+14). The server
 * does not know the time zone of the user, and a date that is "today" somewhere must pass: otherwise the day of a user in
 * Switzerland would be refused in the first hours after midnight, while it is still the day before in UTC.
 */
export function latestPurchaseDate(now: Date = new Date()): string {
  return new Date(now.getTime() + 14 * 3_600_000).toISOString().slice(0, 10)
}
