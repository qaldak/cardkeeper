// The number printed on a Pokémon card, e.g. "040/088": the number in the set and the size of the set
// as printed (TCGdex: `cardCount.official`). Used to narrow down the set and to find the card in it.

export interface CardNumber {
  /** The number as typed, e.g. "040" or "TG01". */
  number: string
  /** Printed size of the set ("088" → 88), or null when only the number was typed. */
  total: number | null
}

/**
 * Brings a typed card number into the printed form "040/088". The slash may be left out when the digits split evenly
 * ("040088" → "040/088", "00400088" → "0040/0088") or replaced by a space ("040 088"). Anything else is only tidied up
 * ("40 / 88" → "40/88"): numbers with an uneven digit count ("40088") are ambiguous and stay as typed.
 */
export function normalizeCardNumberInput(input: string): string {
  const text = input.trim()
  const joined = text.match(/^(\d{3})(\d{3})$/) ?? text.match(/^(\d{4})(\d{4})$/) ?? text.match(/^(\d{1,4})\s+(\d{2,4})$/)
  return joined ? `${joined[1]}/${joined[2]}` : text.replace(/\s*\/\s*/, '/')
}

/** Parses "040/088", "040088", "40 / 88", "040", "TG01/TG30" or "SWSH001". Returns null for anything else. */
export function parseCardNumber(input: string): CardNumber | null {
  const [numberPart, totalPart, ...rest] = normalizeCardNumberInput(input).split('/').map(part => part.trim())
  if (rest.length > 0 || !numberPart || !/^[A-Za-z0-9-]{1,12}$/.test(numberPart)) {
    return null
  }
  if (totalPart === undefined || totalPart === '') {
    return { number: numberPart, total: null }
  }
  // The printed size is a plain number; a promo style "TG30" has no numeric size to compare.
  return { number: numberPart, total: /^\d{1,4}$/.test(totalPart) ? Number(totalPart) : null }
}

const isDigits = (value: string) => /^\d+$/.test(value)

/**
 * Whether two card numbers are the same card number. Leading zeros do not matter ("040" = "40"),
 * letters are compared case-insensitively ("TG01" = "tg01"). A numeric and a lettered number never match.
 */
export function sameCardNumber(a: string, b: string): boolean {
  const left = a.trim()
  const right = b.trim()
  if (isDigits(left) && isDigits(right)) {
    return Number(left) === Number(right)
  }
  return left.toLowerCase() === right.toLowerCase()
}

/** The number as printed on the card: "040/088" (the set size is padded to the width of the number). */
export function formatPrintedNumber(localId: string, official: number | null | undefined): string {
  if (official === null || official === undefined) {
    return localId
  }
  return `${localId}/${isDigits(localId) ? String(official).padStart(localId.length, '0') : official}`
}
