import type { SetCardDto } from '../types/api'
import { printedCodeFor, setCodeInRegion } from './set-code'

// Adding all cards of a set at once: every card of the set becomes a row. A row is ready when it is clear which print
// of the card (code and rarity) is meant; otherwise the person has to choose, with the card in their hand.

export interface ImportPrint {
  setCode: string
  rarity: string | null
}

export interface ImportRow {
  externalId: string
  name: string
  thumbnailUrl: string | null
  /** The prints of the card in the set, each once. */
  prints: ImportPrint[]
  /** Whether the card is added. */
  include: boolean
  /** The chosen print (index in `prints`); `null` as long as it is open. */
  printIndex: number | null
  /** The edition of this card: `undefined` takes the edition chosen for the whole set, `null` is none (Unlimited). */
  edition: string | null | undefined
}

/** One row per card, all of them included. A card with a single print has it chosen already. */
export function buildImportRows(cards: readonly SetCardDto[]): ImportRow[] {
  return cards.map((card) => {
    const seen = new Set<string>()
    const prints = (card.prints ?? []).filter((print) => {
      const key = `${print.setCode}|${print.rarity ?? ''}`
      return seen.has(key) ? false : (seen.add(key), true)
    })
    return {
      externalId: card.externalId,
      name: card.name,
      thumbnailUrl: card.thumbnailUrl,
      prints,
      include: prints.length > 0,
      printIndex: prints.length === 1 ? 0 : null,
      edition: undefined,
    }
  })
}

/** A row that is added but whose print is still open: the person has to choose. */
export const needsChoice = (row: ImportRow): boolean => row.include && row.printIndex === null

/** The code printed on the card in the language of the set: the English one with its language letters changed. */
export function shownSetCode(row: ImportRow, region: string): string | null {
  const print = row.printIndex === null ? undefined : row.prints[row.printIndex]
  return print ? setCodeInRegion(print.setCode, region) : null
}

/** The body for `POST /api/cards` of a ready row; `null` for a row that is not added or not ready. */
export function importBody(row: ImportRow, region: string, setEdition: string | null) {
  const print = row.printIndex === null ? undefined : row.prints[row.printIndex]
  if (!row.include || !print) {
    return null
  }
  return {
    game: 'ygo',
    externalId: row.externalId,
    set: {
      setCode: print.setCode,
      rarity: print.rarity,
      edition: row.edition === undefined ? setEdition : row.edition,
      printedSetCode: printedCodeFor(setCodeInRegion(print.setCode, region), print.setCode),
    },
  }
}
