import { describe, expect, it } from 'vitest'
import { mergeLanguageCards, primaryName } from '../../server/lib/translations'
import type { CommonCard } from '../../server/tcg/types'

function card(language: string, overrides: Partial<CommonCard> = {}): CommonCard {
  return {
    externalId: '46986414',
    name: language === 'de' ? 'Dunkler Magier' : 'Dark Magician',
    description: language === 'de' ? 'Der ultimative Magier.' : 'The ultimate wizard.',
    language,
    attributes: { atk: 2500, race: language === 'de' ? 'Magier' : 'Spellcaster' },
    sets: [{ setCode: 'LOB-005', setName: 'Legend of Blue Eyes White Dragon', rarity: 'Ultra Rare' }],
    images: [{ url: `https://images.example/${language}.jpg`, smallUrl: null }],
    prices: [{ source: 'cardmarket', price: language === 'de' ? 1 : 18, currency: 'EUR' }],
    raw: { language },
    ...overrides,
  }
}

describe('mergeLanguageCards', () => {
  it('keeps both texts, German first, and names the card after the German text', () => {
    const merged = mergeLanguageCards([card('en'), card('de')])
    expect(merged.name).toBe('Dunkler Magier')
    expect(merged.translations).toEqual([
      { language: 'de', name: 'Dunkler Magier', description: 'Der ultimative Magier.', details: null },
      { language: 'en', name: 'Dark Magician', description: 'The ultimate wizard.', details: null },
    ])
  })

  it('takes the language independent data from the English response', () => {
    const merged = mergeLanguageCards([card('de'), card('en')])
    expect(merged.attributes).toEqual({ atk: 2500, race: 'Spellcaster' })
    expect(merged.images[0]!.url).toBe('https://images.example/en.jpg')
    expect(merged.prices).toEqual([{ source: 'cardmarket', price: 18, currency: 'EUR' }])
  })

  it('falls back to the only available response', () => {
    const german = mergeLanguageCards([card('de')])
    expect(german.name).toBe('Dunkler Magier')
    expect(german.attributes.race).toBe('Magier')
    expect(mergeLanguageCards([card('en')]).name).toBe('Dark Magician')
  })

  it('unites the printings of all languages without duplicates', () => {
    const german = card('de', {
      sets: [
        { setCode: 'LOB-005', setName: 'Legend of Blue Eyes White Dragon', rarity: 'Ultra Rare' },
        { setCode: 'LOB-DE005', setName: 'Legend of Blue Eyes White Dragon', rarity: 'Secret Rare' },
      ],
    })
    const merged = mergeLanguageCards([german, card('en')])
    expect(merged.sets.map(set => `${set.setCode}/${set.rarity}`)).toEqual(['LOB-005/Ultra Rare', 'LOB-DE005/Secret Rare'])
  })

  it('treats the same code with a different rarity as a different printing', () => {
    const merged = mergeLanguageCards([card('en', {
      sets: [
        { setCode: 'LOB-005', setName: 'LOB', rarity: 'Ultra Rare' },
        { setCode: 'LOB-005', setName: 'LOB', rarity: 'Secret Rare' },
      ],
    })])
    expect(merged.sets).toHaveLength(2)
  })

  it('drops a "German" response that is just the English card', () => {
    const englishCopy = card('de', { name: 'Dark Magician', description: 'The ultimate wizard.' })
    const merged = mergeLanguageCards([englishCopy, card('en')])
    expect(merged.translations.map(entry => entry.language)).toEqual(['en'])
    expect(merged.name).toBe('Dark Magician')
  })

  it('keeps a translation whose name happens to equal the English name but whose text differs', () => {
    const sameName = card('de', { name: 'Jinzo', description: 'Ein deutscher Text.' })
    const merged = mergeLanguageCards([sameName, card('en', { name: 'Jinzo' })])
    expect(merged.translations.map(entry => entry.language)).toEqual(['de', 'en'])
  })

  it('stores one raw snapshot per language', () => {
    expect(mergeLanguageCards([card('de'), card('en')]).snapshots).toEqual([
      { language: 'de', raw: { language: 'de' } },
      { language: 'en', raw: { language: 'en' } },
    ])
  })

  it('needs at least one response', () => {
    expect(() => mergeLanguageCards([])).toThrow()
  })
})

describe('mergeLanguageCards: details and variants', () => {
  const pokemon = (language: string, details: Record<string, unknown> | null, overrides: Partial<CommonCard> = {}): CommonCard => ({
    ...card(language),
    name: 'Pikachu',
    description: language === 'de' ? 'Deutscher Text.' : 'English text.',
    details,
    sets: [
      { setCode: 'swsh3-1', setName: 'Set', rarity: 'Rare', edition: 'normal' },
      { setCode: 'swsh3-1', setName: 'Set', rarity: 'Rare', edition: 'reverse' },
    ],
    ...overrides,
  })

  it('keeps the details of every language', () => {
    const merged = mergeLanguageCards([
      pokemon('de', { types: ['Elektro'] }),
      pokemon('en', { types: ['Lightning'] }),
    ])
    expect(merged.translations).toEqual([
      { language: 'de', name: 'Pikachu', description: 'Deutscher Text.', details: { types: ['Elektro'] } },
      { language: 'en', name: 'Pikachu', description: 'English text.', details: { types: ['Lightning'] } },
    ])
  })

  it('keeps German when the name is the same but the text and details differ', () => {
    const merged = mergeLanguageCards([pokemon('de', { types: ['Elektro'] }), pokemon('en', { types: ['Lightning'] })])
    expect(merged.translations.map(entry => entry.language)).toEqual(['de', 'en'])
  })

  it('drops a German response that equals the English one including the details', () => {
    const english = pokemon('en', { types: ['Lightning'] })
    const copy = pokemon('de', { types: ['Lightning'] }, { description: 'English text.' })
    expect(mergeLanguageCards([copy, english]).translations.map(entry => entry.language)).toEqual(['en'])
  })

  it('does not duplicate a printing because its rarity is translated', () => {
    const german = pokemon('de', null, { sets: [
      { setCode: 'swsh3-1', setName: 'Satz', rarity: 'Selten', edition: 'normal' },
      { setCode: 'swsh3-1', setName: 'Satz', rarity: 'Selten', edition: 'reverse' },
    ] })
    const merged = mergeLanguageCards([german, pokemon('en', null)])
    expect(merged.sets).toEqual([
      { setCode: 'swsh3-1', setName: 'Set', rarity: 'Rare', edition: 'normal' },
      { setCode: 'swsh3-1', setName: 'Set', rarity: 'Rare', edition: 'reverse' },
    ])
  })

  it('treats the variants of one card as separate printings', () => {
    const merged = mergeLanguageCards([pokemon('de', null), pokemon('en', null)])
    expect(merged.sets.map(set => set.edition)).toEqual(['normal', 'reverse'])
  })
})

describe('primaryName', () => {
  it('prefers German among stored translations and falls back otherwise', () => {
    expect(primaryName([{ language: 'en', name: 'A', description: null }, { language: 'de', name: 'B', description: null }], 'x')).toBe('B')
    expect(primaryName([{ language: 'en', name: 'A', description: null }], 'x')).toBe('A')
    expect(primaryName([], 'fallback')).toBe('fallback')
  })
})
