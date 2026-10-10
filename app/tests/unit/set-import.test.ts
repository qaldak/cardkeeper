import { describe, expect, it } from 'vitest'
import type { SetCardDto } from '../../shared/types/api'
import { buildImportRows, importBody, needsChoice, shownSetCode } from '../../shared/utils/set-import'
import { SET_IMPORT_REGIONS, setCodeInRegion } from '../../shared/utils/set-code'

const card = (externalId: string, prints: SetCardDto['prints'], name = `Card ${externalId}`): SetCardDto => ({ externalId, number: prints?.[0]?.setCode ?? '', name, thumbnailUrl: null, prints })

const CARDS: SetCardDto[] = [
  card('1', [{ setCode: 'SDAZ-EN001', rarity: 'Ultra Rare' }]),
  card('2', [{ setCode: 'SDAZ-EN002', rarity: 'Common' }, { setCode: 'SDAZ-EN002', rarity: 'Common' }]),
  card('3', [{ setCode: 'SDAZ-EN003', rarity: 'Common' }, { setCode: 'SDAZ-EN003', rarity: 'Super Rare' }]),
  card('4', [{ setCode: 'SDAZ-EN004', rarity: 'Common' }, { setCode: 'SDAZ-EN041', rarity: 'Common' }]),
  card('5', []),
  card('6', undefined),
]

describe('rows of a set', () => {
  const rows = buildImportRows(CARDS)

  it('has a row per card, with the clear ones chosen', () => {
    expect(rows).toHaveLength(6)
    expect(rows[0]).toMatchObject({ include: true, printIndex: 0 })
    // The same print twice is one print.
    expect(rows[1]!.prints).toHaveLength(1)
    expect(rows[1]).toMatchObject({ include: true, printIndex: 0 })
  })

  it('leaves the print open when a code has several rarities or a card has several codes', () => {
    expect(rows[2]).toMatchObject({ include: true, printIndex: null })
    expect(rows[3]).toMatchObject({ include: true, printIndex: null })
    expect(rows.map(needsChoice)).toEqual([false, false, true, true, false, false])
  })

  it('does not add a card without a print in the set', () => {
    expect(rows[4]).toMatchObject({ include: false, printIndex: null })
    expect(rows[5]).toMatchObject({ include: false, printIndex: null })
    expect(needsChoice(rows[4]!)).toBe(false)
  })

  it('stops asking for a card that is left out, and for one that was chosen', () => {
    const open = { ...rows[2]!, include: false }
    expect(needsChoice(open)).toBe(false)
    expect(needsChoice({ ...rows[2]!, printIndex: 1 })).toBe(false)
  })
})

describe('the body of a row', () => {
  const [clear, , open] = buildImportRows(CARDS) as [ReturnType<typeof buildImportRows>[number], unknown, ReturnType<typeof buildImportRows>[number]]

  it('keeps the English code for English and takes the edition of the whole set', () => {
    expect(importBody(clear, SET_IMPORT_REGIONS.en, 'FIRST_EDITION')).toEqual({
      game: 'ygo',
      externalId: '1',
      set: { setCode: 'SDAZ-EN001', rarity: 'Ultra Rare', edition: 'FIRST_EDITION', printedSetCode: undefined },
    })
  })

  it('stores the code of the chosen language as the printed code', () => {
    expect(importBody(clear, SET_IMPORT_REGIONS.de, null)!.set).toMatchObject({ setCode: 'SDAZ-EN001', printedSetCode: 'SDAZ-DE001', edition: null })
    expect(importBody(clear, SET_IMPORT_REGIONS.ja, null)!.set.printedSetCode).toBe('SDAZ-JP001')
  })

  it('prefers the edition of the card to the one of the set, and none is none', () => {
    expect(importBody({ ...clear, edition: 'LIMITED_EDITION' }, 'EN', 'FIRST_EDITION')!.set.edition).toBe('LIMITED_EDITION')
    expect(importBody({ ...clear, edition: null }, 'EN', 'FIRST_EDITION')!.set.edition).toBeNull()
  })

  it('has no body for a card that is left out or whose print is open', () => {
    expect(importBody({ ...clear, include: false }, 'EN', null)).toBeNull()
    expect(importBody(open, 'EN', null)).toBeNull()
    expect(importBody({ ...open, printIndex: 1 }, 'DE', null)!.set).toMatchObject({ rarity: 'Super Rare', printedSetCode: 'SDAZ-DE003' })
  })

  it('shows the code in the language', () => {
    expect(shownSetCode(clear, 'DE')).toBe('SDAZ-DE001')
    expect(shownSetCode(open, 'DE')).toBeNull()
  })
})

describe('set code in another language', () => {
  it('changes the language letters and nothing else', () => {
    expect(setCodeInRegion('SDAZ-EN001', 'DE')).toBe('SDAZ-DE001')
    expect(setCodeInRegion('L5DD-ENA15', 'JP')).toBe('L5DD-JPA15')
    expect(setCodeInRegion('sdaz-en001', 'de')).toBe('SDAZ-DE001')
    expect(setCodeInRegion('SDAZ-DE001', 'EN')).toBe('SDAZ-EN001')
  })

  it('leaves a code without a language and a text that is no code alone', () => {
    expect(setCodeInRegion('SDY-006', 'DE')).toBe('SDY-006')
    expect(setCodeInRegion('Dunkler Magier', 'DE')).toBe('DUNKLER MAGIER')
  })
})
