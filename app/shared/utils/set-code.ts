// The set code printed on a card, e.g. "LOB-EN005" or "L5DD-ENA15": the set ("LOB"), the language of the print ("EN")
// and the number in the set ("005", "A15"). Older sets have no language ("SDY-006").

/** Languages of a print as they appear in a set code. English is the one every card of a set exists in. */
const REGIONS = ['EN', 'DE', 'FR', 'IT', 'PT', 'SP', 'ES', 'JP', 'JA', 'KR', 'AE', 'SC', 'TC'] as const

const SET_CODE = /^([A-Z0-9]{2,6})-([A-Z]{0,4}\d{1,4})$/

/** The text in capitals and without surrounding blanks. */
export const normalizeSetCode = (text: string): string => text.trim().toUpperCase()

/** Whether a text looks like a set code ("L5DD-ENA15", "lob-en005", "SDY-006"). */
export const isSetCode = (text: string): boolean => SET_CODE.test(normalizeSetCode(text))

/**
 * The set codes to look for, the typed one first: a code of another language ("L5DD-DEA15") is followed by the
 * English one ("L5DD-ENA15"), because a card often exists in the database only with its English print.
 */
export function setCodeSpellings(text: string): string[] {
  const code = normalizeSetCode(text)
  const match = SET_CODE.exec(code)
  if (!match) {
    return [code]
  }
  const [, set, rest] = match as unknown as [string, string, string]
  const region = REGIONS.find(candidate => rest.startsWith(candidate) && /^[A-Z]{0,2}\d/.test(rest.slice(candidate.length)))
  if (!region || region === 'EN') {
    return [code]
  }
  return [code, `${set}-EN${rest.slice(region.length)}`]
}
