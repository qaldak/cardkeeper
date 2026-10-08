import { EDITION_KEYS } from '../../shared/utils/editions'

export interface UnknownEdition {
  game: string
  edition: string
  count: number
}

const sqlText = (value: string) => `'${value.replace(/'/g, "''")}'`

/**
 * The log lines about editions that are none of the known keys, or `null` if there are none. The values stay in the
 * database untouched; the lines name them with an UPDATE to copy, so that they can be fixed with SQL.
 */
export function describeUnknownEditions(rows: readonly UnknownEdition[]): string[] | null {
  if (rows.length === 0) {
    return null
  }
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  return [
    `${total} card(s) have an edition that is not one of ${EDITION_KEYS.join(', ')}. The values were left as they are; `
    + `fix them with SQL (replace <KEY> by one of the keys, or NULL for Unlimited):`,
    ...rows.map(row => `  [${row.game}] ${row.count} card(s): UPDATE card_sets SET edition = <KEY> WHERE edition = ${sqlText(row.edition)};`),
  ]
}
