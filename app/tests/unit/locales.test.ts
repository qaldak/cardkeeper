import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'
import { COLUMN_KEYS } from '../../server/services/export'

type Tree = { [key: string]: string | Tree }

/** Every text of a locale file by its dotted key. */
function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) =>
    typeof value === 'string' ? { ...all, [`${prefix}${key}`]: value } : { ...all, ...flatten(value, `${prefix}${key}.`) }, {})
}

const german = flatten(de as Tree)
const english = flatten(en as Tree)
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()

describe('locale files', () => {
  it('have the same keys in German and English', () => {
    expect(Object.keys(german).sort()).toEqual(Object.keys(english).sort())
  })

  it('have no empty text', () => {
    expect(Object.entries({ ...german }).filter(([, text]) => text.trim() === '').map(([key]) => key)).toEqual([])
    expect(Object.entries({ ...english }).filter(([, text]) => text.trim() === '').map(([key]) => key)).toEqual([])
  })

  it('use the same placeholders in both languages', () => {
    const different = Object.keys(german).filter(key => JSON.stringify(placeholders(german[key]!)) !== JSON.stringify(placeholders(english[key] ?? '')))
    expect(different).toEqual([])
  })

  it('have a header for every column of the table export, in both languages', () => {
    for (const key of COLUMN_KEYS) {
      expect(german[`export.columns.${key}`], `de export.columns.${key}`).toBeTruthy()
      expect(english[`export.columns.${key}`], `en export.columns.${key}`).toBeTruthy()
    }
    const known = new Set<string>(COLUMN_KEYS)
    expect(Object.keys(german).filter(key => key.startsWith('export.columns.') && !known.has(key.slice('export.columns.'.length)))).toEqual([])
  })

  it('contain every text the code asks for by a fixed key', () => {
    const files: string[] = []
    const walk = (directory: string) => {
      for (const name of readdirSync(directory)) {
        const path = join(directory, name)
        if (statSync(path).isDirectory()) {
          walk(path)
        }
        else if (/\.(vue|ts)$/.test(name)) {
          files.push(path)
        }
      }
    }
    walk('app')
    const missing: string[] = []
    for (const file of files) {
      for (const match of readFileSync(file, 'utf8').matchAll(/(?<![\w.$])t\(\s*'([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)'/g)) {
        if (!(match[1]! in german)) {
          missing.push(`${file}: ${match[1]}`)
        }
      }
    }
    expect(missing).toEqual([])
  })
})
