import { describe, expect, it } from 'vitest'
import { isSetCode, normalizeSetCode, printedCodeFor, printToPreselect, setCodeSpellings } from '../../shared/utils/set-code'

describe('set codes', () => {
  it('recognises the set codes of prints', () => {
    for (const code of ['LOB-EN005', 'L5DD-ENA15', 'SDY-006', 'RA02-EN039', 'MP22-EN001', 'LDK2-ENK01', 'SDLS-DE043', ' lob-en005 ']) {
      expect(isSetCode(code), code).toBe(true)
    }
  })

  it('does not take names, passcodes and other texts for set codes', () => {
    for (const text of ['Dunkler Magier', 'Blue-Eyes White Dragon', '46986414', 'X-Saber', 'LOB-', '-005', 'LOB EN005', 'TOOLONGSET-EN005', '']) {
      expect(isSetCode(text), text).toBe(false)
    }
  })

  it('writes the code in capitals', () => {
    expect(normalizeSetCode(' l5dd-ena15 ')).toBe('L5DD-ENA15')
  })

  it('follows a code of another language with the English one', () => {
    expect(setCodeSpellings('L5DD-DEA15')).toEqual(['L5DD-DEA15', 'L5DD-ENA15'])
    expect(setCodeSpellings('lob-de005')).toEqual(['LOB-DE005', 'LOB-EN005'])
    expect(setCodeSpellings('SDLS-FR043')).toEqual(['SDLS-FR043', 'SDLS-EN043'])
    expect(setCodeSpellings('SDLS-SP043')).toEqual(['SDLS-SP043', 'SDLS-EN043'])
  })

  it('has nothing to map for English codes, codes without a language and texts that are no code', () => {
    expect(setCodeSpellings('L5DD-ENA15')).toEqual(['L5DD-ENA15'])
    expect(setCodeSpellings('SDY-006')).toEqual(['SDY-006'])
    expect(setCodeSpellings('Dunkler Magier')).toEqual(['DUNKLER MAGIER'])
  })
})

describe('preselecting the print of a typed set code', () => {
  const prints = [
    { setCode: 'L5DD-ENA15' }, // 0: one print
    { setCode: 'LOB-EN005' }, // 1, 2: one code in two rarities
    { setCode: 'LOB-EN005' },
    { setCode: 'SDY-006' }, // 3
    { setCode: 'LOB-DE005' }, // 4: a German print as well
  ]

  it('takes the English print for the code of another language, if it is the only one', () => {
    expect(printToPreselect(prints, 'L5DD-DEA15')).toBe(0)
    expect(printToPreselect(prints, 'l5dd-ena15')).toBe(0)
    expect(printToPreselect(prints, 'SDY-006')).toBe(3)
  })

  it('leaves the choice open when several prints have the code', () => {
    expect(printToPreselect(prints, 'LOB-EN005')).toBeNull()
    // The German print is looked for first: it is the only one with that code.
    expect(printToPreselect(prints, 'LOB-DE005')).toBe(4)
    expect(printToPreselect(prints.slice(0, 3), 'LOB-DE005')).toBeNull()
  })

  it('preselects nothing when no print has the code or the text is no code', () => {
    expect(printToPreselect(prints, 'XXXX-DE999')).toBeNull()
    expect(printToPreselect(prints, 'Dunkler Magier')).toBeNull()
    expect(printToPreselect([], 'LOB-EN005')).toBeNull()
  })
})

describe('the set code that is stored', () => {
  it('is the printed code when the print found is the English one of the same card', () => {
    expect(printedCodeFor('L5DD-DEA15', 'L5DD-ENA15')).toBe('L5DD-DEA15')
    expect(printedCodeFor(' l5dd-dea15 ', 'l5dd-ena15')).toBe('L5DD-DEA15')
    expect(printedCodeFor('SDLS-FR043', 'SDLS-EN043')).toBe('SDLS-FR043')
  })

  it('is nothing when the print has the typed code, is another card, or the text is no code', () => {
    expect(printedCodeFor('L5DD-ENA15', 'L5DD-ENA15')).toBeUndefined()
    expect(printedCodeFor('LOB-DE005', 'LOB-DE005')).toBeUndefined()
    expect(printedCodeFor('L5DD-DEA15', 'LOB-EN005')).toBeUndefined()
    expect(printedCodeFor('Dunkler Magier', 'LOB-EN005')).toBeUndefined()
  })
})
