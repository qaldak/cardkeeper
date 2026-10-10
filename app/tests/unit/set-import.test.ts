import { describe, expect, it } from 'vitest'
import type { SetCardDto } from '../../shared/types/api'
import { buildImportRows, clearPrintIndex, effectivePrintIndex, importBody, isConflict, needsChoice, shownSetCode, visibleRows } from '../../shared/utils/set-import'
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
    expect(rows.map(row => needsChoice(row))).toEqual([false, false, true, true, false, false])
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
    expect(importBody(clear, { game: 'ygo', region: SET_IMPORT_REGIONS.en, setEdition: 'FIRST_EDITION' })).toEqual({
      game: 'ygo',
      externalId: '1',
      set: { setCode: 'SDAZ-EN001', rarity: 'Ultra Rare', edition: 'FIRST_EDITION', printedSetCode: undefined },
    })
  })

  it('stores the code of the chosen language as the printed code', () => {
    expect(importBody(clear, { game: 'ygo', region: SET_IMPORT_REGIONS.de, setEdition: null })!.set).toMatchObject({ setCode: 'SDAZ-EN001', printedSetCode: 'SDAZ-DE001', edition: null })
    expect(importBody(clear, { game: 'ygo', region: SET_IMPORT_REGIONS.ja, setEdition: null })!.set.printedSetCode).toBe('SDAZ-JP001')
  })

  it('prefers the edition of the card to the one of the set, and none is none', () => {
    expect(importBody({ ...clear, edition: 'LIMITED_EDITION' }, { game: 'ygo', region: 'EN', setEdition: 'FIRST_EDITION' })!.set.edition).toBe('LIMITED_EDITION')
    expect(importBody({ ...clear, edition: null }, { game: 'ygo', region: 'EN', setEdition: 'FIRST_EDITION' })!.set.edition).toBeNull()
  })

  it('has no body for a card that is left out or whose print is open', () => {
    expect(importBody({ ...clear, include: false }, { game: 'ygo', region: 'EN' })).toBeNull()
    expect(importBody(open, { game: 'ygo', region: 'EN' })).toBeNull()
    expect(importBody({ ...open, printIndex: 1 }, { game: 'ygo', region: 'DE' })!.set).toMatchObject({ rarity: 'Super Rare', printedSetCode: 'SDAZ-DE003' })
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

describe('which rows are shown', () => {
  const rows = buildImportRows(CARDS)

  it('shows only the cards with several prints by default', () => {
    expect(visibleRows(rows, false).map(row => row.externalId)).toEqual(['3', '4'])
    expect(rows.filter(row => isConflict(row)).map(row => row.externalId)).toEqual(['3', '4'])
  })

  it('shows all of them when asked to', () => {
    expect(visibleRows(rows, true).map(row => row.externalId)).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('keeps a conflict in the list after the person has chosen', () => {
    const chosen = rows.map(row => (isConflict(row) ? { ...row, printIndex: 0 } : row))
    expect(chosen.filter(row => needsChoice(row))).toEqual([])
    expect(visibleRows(chosen, false).map(row => row.externalId)).toEqual(['3', '4'])
  })

  it('shows nothing when there is no conflict', () => {
    expect(visibleRows(buildImportRows([CARDS[0]!, CARDS[1]!]), false)).toEqual([])
  })
})

describe('Pokémon: the variant of a card is the print', () => {
  const variants = (id: string, editions: string[]): SetCardDto => card(id, editions.map(edition => ({ setCode: id, rarity: 'Rare', edition })))
  const CARDS: SetCardDto[] = [
    variants('swsh3-001', ['holo']), // one variant: clear
    variants('swsh3-002', ['normal', 'reverse']), // two
    variants('swsh3-003', ['normal', 'reverse', 'holo']),
    variants('swsh3-004', ['reverse', 'holo']), // has no normal
    variants('swsh3-005', ['holo', 'wPromo']), // has no normal, no reverse
    variants('swsh3-006', []), // not loadable
  ]
  const rows = buildImportRows(CARDS)

  it('leaves every card with several variants open as long as no variant is chosen for the set', () => {
    expect(rows.map(row => isConflict(row))).toEqual([false, true, true, true, true, false])
    expect(rows.map(row => needsChoice(row))).toEqual([false, true, true, true, true, false])
    expect(visibleRows(rows, false).map(row => row.externalId)).toEqual(['swsh3-002', 'swsh3-003', 'swsh3-004', 'swsh3-005'])
  })

  it('takes the variant chosen for the set where a card has it, and asks only for the others', () => {
    expect(rows.map(row => clearPrintIndex(row, 'normal'))).toEqual([0, 0, 0, null, null, null])
    expect(rows.map(row => needsChoice(row, 'normal'))).toEqual([false, false, false, true, true, false])
    expect(visibleRows(rows, false, 'normal').map(row => row.externalId)).toEqual(['swsh3-004', 'swsh3-005'])
    expect(visibleRows(rows, false, 'reverse').map(row => row.externalId)).toEqual(['swsh3-005'])
  })

  it('prefers the choice of the person to the variant of the set, and keeps the card listed', () => {
    const chosen = { ...rows[2]!, printIndex: 2 }
    expect(effectivePrintIndex(chosen, 'normal')).toBe(2)
    expect(importBody(chosen, { game: 'pokemon', defaultVariant: 'normal' })!.set.edition).toBe('holo')
    const open = { ...rows[3]!, printIndex: 1 }
    expect(needsChoice(open, 'normal')).toBe(false)
    expect(isConflict(open, 'normal')).toBe(true)
  })

  it('has no body for a card that is open or has no variants, and none for a card left out', () => {
    expect(importBody(rows[1]!, { game: 'pokemon' })).toBeNull()
    expect(importBody(rows[5]!, { game: 'pokemon', defaultVariant: 'normal' })).toBeNull()
    expect(importBody({ ...rows[0]!, include: false }, { game: 'pokemon' })).toBeNull()
  })

  it('adds the card with its id as set code and the variant, without a rarity', () => {
    expect(importBody(rows[1]!, { game: 'pokemon', defaultVariant: 'reverse' })).toEqual({
      game: 'pokemon',
      externalId: 'swsh3-002',
      set: { setCode: 'swsh3-002', edition: 'reverse' },
    })
    expect(importBody(rows[0]!, { game: 'pokemon' })!.set).toEqual({ setCode: 'swsh3-001', edition: 'holo' })
  })

  it('does not look at the variant for Yu-Gi-Oh!', () => {
    const ygo = buildImportRows([card('1', [{ setCode: 'A-EN001', rarity: 'Common' }, { setCode: 'A-EN001', rarity: 'Rare' }])])[0]!
    expect(clearPrintIndex(ygo, 'normal')).toBeNull()
  })
})
