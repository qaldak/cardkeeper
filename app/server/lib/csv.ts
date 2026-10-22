/** The cell types of an export row: text, a number (written as is), or nothing. */
export type CsvValue = string | number | null | undefined

/** The separator of the export: Excel in the German-speaking countries splits a CSV file at semicolons. */
export const CSV_SEPARATOR = ';'

const BYTE_ORDER_MARK = String.fromCharCode(0xFEFF)

/**
 * One cell. Text with a separator, a quote or a line break is quoted (a quote inside is doubled). Text that starts with a
 * character a spreadsheet reads as a formula (`=`, `+`, `-`, `@`) gets a quote in front, so that a card text can never
 * run as one; numbers are written as they are.
 */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/** A CSV document: UTF-8 with a byte order mark (so that Excel shows umlauts right) and one line per row. */
export function buildCsv(header: readonly string[], rows: readonly (readonly CsvValue[])[]): string {
  const lines = [header, ...rows].map(row => row.map(csvCell).join(CSV_SEPARATOR))
  return `${BYTE_ORDER_MARK}${lines.join('\r\n')}\r\n`
}
