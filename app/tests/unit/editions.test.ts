import { describe, expect, it } from 'vitest'
import de from '../../i18n/locales/de.json'
import en from '../../i18n/locales/en.json'
import { editionLabel, EDITION_KEYS, isEditionKey } from '../../shared/utils/editions'

type Messages = Record<string, unknown>
// A minimal stand-in for vue-i18n's `t`: follows a dotted key through a locale file.
const translator = (messages: Messages) => (key: string) =>
  key.split('.').reduce<unknown>((node, part) => (node as Messages | undefined)?.[part], messages) as string

describe('edition labels', () => {
  it('knows the three preset keys', () => {
    expect(EDITION_KEYS).toEqual(['FIRST_EDITION', 'UNLIMITED', 'LIMITED_EDITION'])
    expect(isEditionKey('UNLIMITED')).toBe(true)
    expect(isEditionKey('Unlimited')).toBe(false)
    expect(isEditionKey(null)).toBe(false)
  })

  it('translates a known key into the language of the locale', () => {
    expect(editionLabel('FIRST_EDITION', translator(de))).toBe('1. Auflage')
    expect(editionLabel('UNLIMITED', translator(de))).toBe('Unlimitierte Auflage')
    expect(editionLabel('LIMITED_EDITION', translator(de))).toBe('Limitierte Auflage')
    expect(editionLabel('FIRST_EDITION', translator(en))).toBe('1st Edition')
    expect(editionLabel('UNLIMITED', translator(en))).toBe('Unlimited')
    expect(editionLabel('LIMITED_EDITION', translator(en))).toBe('Limited Edition')
  })

  it('has a label for every key in both languages', () => {
    for (const messages of [de, en]) {
      for (const key of EDITION_KEYS) {
        expect(translator(messages)(`edition.${key}`)).toEqual(expect.any(String))
      }
    }
  })

  it('returns anything that is not a key unchanged, in both languages', () => {
    for (const messages of [de, en]) {
      const label = (value: string) => editionLabel(value, translator(messages))
      expect(label('Special Edition')).toBe('Special Edition')
      expect(label('1st Edition')).toBe('1st Edition')
      expect(label('1. Auflage')).toBe('1. Auflage')
      expect(label('first_edition')).toBe('first_edition')
      expect(label('constructor')).toBe('constructor')
    }
  })

  it('shows nothing for no edition', () => {
    expect(editionLabel(null, translator(de))).toBe('')
    expect(editionLabel(undefined, translator(de))).toBe('')
    expect(editionLabel('', translator(de))).toBe('')
  })
})
