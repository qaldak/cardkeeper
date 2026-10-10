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

/**
 * The print to preselect for a typed set code: the print whose code is the typed one or, if there is none, the English
 * one. Only a single print is preselected; with several (one code printed in several rarities) the choice is left to
 * the person, who has the card in their hand. `null` if nothing is to be preselected.
 */
export function printToPreselect(prints: readonly { setCode: string }[], typed: string): number | null {
  for (const code of setCodeSpellings(typed)) {
    const found = prints.flatMap((print, index) => (print.setCode.toUpperCase() === code ? [index] : []))
    if (found.length > 0) {
      return found.length === 1 ? found[0]! : null
    }
  }
  return null
}

/**
 * The set code to store when a card was searched by the code printed on it ("L5DD-DEA15") but the print found is the
 * English one ("L5DD-ENA15"): the printed code. `undefined` if the print already has the typed code or is another card.
 */
export function printedCodeFor(typed: string, printCode: string): string | undefined {
  const code = normalizeSetCode(typed)
  const print = printCode.toUpperCase()
  return isSetCode(code) && code !== print && setCodeSpellings(code).includes(print) ? code : undefined
}

/** The language letters of a set code for the languages a whole set can be added in. */
export const SET_IMPORT_REGIONS = { de: 'DE', en: 'EN', ja: 'JP' } as const
export type SetImportLanguage = keyof typeof SET_IMPORT_REGIONS

/**
 * The code of the same print in another language: "SDAZ-EN001" in German is "SDAZ-DE001". A code without a language
 * ("SDY-006") has none to change.
 */
export function setCodeInRegion(code: string, region: string): string {
  const normalized = normalizeSetCode(code)
  const match = SET_CODE.exec(normalized)
  if (!match) {
    return normalized
  }
  const [, set, rest] = match as unknown as [string, string, string]
  const current = REGIONS.find(candidate => rest.startsWith(candidate) && /^[A-Z]{0,2}\d/.test(rest.slice(candidate.length)))
  return current ? `${set}-${region.toUpperCase()}${rest.slice(current.length)}` : normalized
}
