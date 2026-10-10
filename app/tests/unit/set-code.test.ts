import { describe, expect, it } from 'vitest'
import { isSetCode, normalizeSetCode, setCodeSpellings } from '../../shared/utils/set-code'

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
