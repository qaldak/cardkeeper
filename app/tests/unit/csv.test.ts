import { describe, expect, it } from 'vitest'
import { buildCsv, csvCell } from '../../server/lib/csv'

describe('csvCell', () => {
  it('writes plain text, numbers and nothing as they are', () => {
    expect(csvCell('Dark Magician')).toBe('Dark Magician')
    expect(csvCell(2500)).toBe('2500')
    expect(csvCell(18.5)).toBe('18.5')
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
    expect(csvCell(Number.NaN)).toBe('')
  })

  it('quotes text with a semicolon, a quote or a line break, and doubles the quotes', () => {
    expect(csvCell('a;b')).toBe('"a;b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('one\ntwo')).toBe('"one\ntwo"')
    expect(csvCell('a,b')).toBe('a,b')
  })

  it('keeps a spreadsheet from running card text as a formula', () => {
    expect(csvCell('=1+1')).toBe('\'=1+1')
    expect(csvCell('+cmd')).toBe('\'+cmd')
    expect(csvCell('@SUM(A1)')).toBe('\'@SUM(A1)')
    expect(csvCell('-2+3')).toBe('\'-2+3')
    expect(csvCell('=HYPERLINK("http://x";"y")')).toBe('"\'=HYPERLINK(""http://x"";""y"")"')
  })

  it('does not touch numbers, also negative ones', () => {
    expect(csvCell(-1)).toBe('-1')
  })
})

describe('buildCsv', () => {
  it('starts with a byte order mark, separates with semicolons and ends every line with CRLF', () => {
    const csv = buildCsv(['Name', 'ATK'], [['Dark Magician', 2500], ['Pot of Greed', null]])
    expect(csv.charCodeAt(0)).toBe(0xFEFF)
    expect(csv.slice(1)).toBe('Name;ATK\r\nDark Magician;2500\r\nPot of Greed;\r\n')
  })

  it('writes just the header for no rows', () => {
    expect(buildCsv(['A', 'B'], []).slice(1)).toBe('A;B\r\n')
  })
})
