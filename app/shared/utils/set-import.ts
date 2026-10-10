import type { SetCardDto } from '../types/api'
import { printedCodeFor, setCodeInRegion } from './set-code'

// Adding all cards of a set at once: every card of the set becomes a row. A row is ready when it is clear which print
// of the card is meant (Yu-Gi-Oh!: code and rarity, Pokémon: the variant); otherwise the person has to choose, with the
// card in their hand.

export interface ImportPrint {
  setCode: string
  rarity: string | null
  /** Pokémon: the variant (normal, reverse, holo, ...). */
  edition?: string | null
}

export interface ImportRow {
  externalId: string
  name: string
  /** The number in the set as the database writes it ("040"). */
  number: string
  thumbnailUrl: string | null
  /** The prints of the card in the set, each once. */
  prints: ImportPrint[]
  /** Whether the card is added. */
  include: boolean
  /** The print the person chose (index in `prints`); `null` as long as they have not. */
  printIndex: number | null
  /** The edition of this card: `undefined` takes the edition chosen for the whole set, `null` is none (Unlimited). */
  edition: string | null | undefined
}

/** What is chosen for the whole set. */
export interface ImportOptions {
  game: 'ygo' | 'pokemon'
  /** Yu-Gi-Oh!: the language letters of the set codes that are stored ("DE"). */
  region?: string
  /** Yu-Gi-Oh!: the edition of the whole set; `null` is none (Unlimited). */
  setEdition?: string | null
  /** Pokémon: the variant to take where a card has it ("reverse"), `null` while none is chosen. */
  defaultVariant?: string | null
}

/** One row per card, all of them included. A card with a single print has it chosen already. */
export function buildImportRows(cards: readonly SetCardDto[]): ImportRow[] {
  return cards.map((card) => {
    const seen = new Set<string>()
    const prints = (card.prints ?? []).filter((print) => {
      const key = `${print.setCode}|${print.rarity ?? ''}|${print.edition ?? ''}`
      return seen.has(key) ? false : (seen.add(key), true)
    })
    return {
      externalId: card.externalId,
      name: card.name,
      number: card.number,
      thumbnailUrl: card.thumbnailUrl,
      prints,
      include: prints.length > 0,
      printIndex: prints.length === 1 ? 0 : null,
      edition: undefined,
    }
  })
}

/**
 * The print that is clear without the person: the only one, or the one with the variant chosen for the whole set when
 * the card has it exactly once. `null` if it is not clear.
 */
export function clearPrintIndex(row: ImportRow, defaultVariant: string | null = null): number | null {
  if (row.prints.length === 1) {
    return 0
  }
  if (defaultVariant) {
    const matching = row.prints.flatMap((print, index) => (print.edition === defaultVariant ? [index] : []))
    if (matching.length === 1) {
      return matching[0]!
    }
  }
  return null
}

/** The print that is used: the one the person chose, else the one that is clear; `null` if neither. */
export const effectivePrintIndex = (row: ImportRow, defaultVariant: string | null = null): number | null =>
  row.printIndex ?? clearPrintIndex(row, defaultVariant)

/**
 * A card that has to be looked at: several prints and none is clear. This stays true after the person has chosen, so that
 * the card does not disappear from the list under their hands.
 */
export const isConflict = (row: ImportRow, defaultVariant: string | null = null): boolean =>
  row.prints.length > 1 && clearPrintIndex(row, defaultVariant) === null

/** The rows to show: only the conflicts, or all of them when the person asks for it. */
export const visibleRows = (rows: readonly ImportRow[], showAll: boolean, defaultVariant: string | null = null): ImportRow[] =>
  showAll ? [...rows] : rows.filter(row => isConflict(row, defaultVariant))

/** A row that is added but whose print is still open: the person has to choose. */
export const needsChoice = (row: ImportRow, defaultVariant: string | null = null): boolean =>
  row.include && effectivePrintIndex(row, defaultVariant) === null

/** The code printed on the card in the language of the set: the English one with its language letters changed. */
export function shownSetCode(row: ImportRow, region: string): string | null {
  const index = effectivePrintIndex(row)
  const print = index === null ? undefined : row.prints[index]
  return print ? setCodeInRegion(print.setCode, region) : null
}

/** The body for `POST /api/cards` of a ready row; `null` for a row that is not added or not ready. */
export function importBody(row: ImportRow, options: ImportOptions) {
  const index = effectivePrintIndex(row, options.defaultVariant ?? null)
  const print = index === null ? undefined : row.prints[index]
  if (!row.include || !print) {
    return null
  }
  if (options.game === 'pokemon') {
    // The card id is its set code; which rarity the card has is up to the card database, the variant is what is chosen.
    return { game: 'pokemon', externalId: row.externalId, set: { setCode: print.setCode, edition: print.edition ?? null } }
  }
  return {
    game: 'ygo',
    externalId: row.externalId,
    set: {
      setCode: print.setCode,
      rarity: print.rarity,
      edition: row.edition === undefined ? (options.setEdition ?? null) : row.edition,
      printedSetCode: printedCodeFor(setCodeInRegion(print.setCode, options.region ?? 'EN'), print.setCode),
    },
  }
}
