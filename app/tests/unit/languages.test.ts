import { describe, expect, it } from 'vitest'
import { CARD_LANGUAGES, preferredLanguage, sortByLanguagePreference } from '../../shared/utils/languages'

describe('language preference', () => {
  it('downloads German and English', () => {
    expect(CARD_LANGUAGES).toEqual(['de', 'en'])
  })

  it('prefers German, then English, then whatever is there', () => {
    expect(preferredLanguage(['en', 'de'])).toBe('de')
    expect(preferredLanguage(['en'])).toBe('en')
    expect(preferredLanguage(['fr', 'it'])).toBe('fr')
    expect(preferredLanguage([])).toBeNull()
  })

  it('sorts German first, English second and others last', () => {
    const sorted = sortByLanguagePreference([{ language: 'fr' }, { language: 'en' }, { language: 'de' }, { language: 'it' }])
    expect(sorted.map(entry => entry.language)).toEqual(['de', 'en', 'fr', 'it'])
  })

  it('does not mutate its input', () => {
    const input = [{ language: 'en' }, { language: 'de' }]
    sortByLanguagePreference(input)
    expect(input.map(entry => entry.language)).toEqual(['en', 'de'])
  })
})
