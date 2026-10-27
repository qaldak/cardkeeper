import { describe, expect, it } from 'vitest'
import { BLUE_EYES, DARK_MAGICIAN, ENGLISH_ONLY } from '../helpers/ygo-fake'
import { TEST_DATABASE_URL, useHarness } from './helpers'

/** Reads a CSV document of the export: the byte order mark and the quotes are handled, a cell can hold line breaks. */
function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const text = csv.charCodeAt(0) === 0xFEFF ? csv.slice(1) : csv
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"'
        i += 1
      }
      else if (char === '"') {
        quoted = false
      }
      else {
        cell += char
      }
    }
    else if (char === '"') {
      quoted = true
    }
    else if (char === ';') {
      row.push(cell)
      cell = ''
    }
    else if (char === '\r' && text[i + 1] === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      i += 1
    }
    else {
      cell += char
    }
  }
  return rows
}

describe.skipIf(!TEST_DATABASE_URL)('table export', () => {
  const h = useHarness()
  const sorted = { sort: 'name' as const, dir: 'asc' as const }

  const asTable = async (filters: Parameters<typeof h.services.export.cardsCsv>[0], locale: 'de' | 'en', services = h.services) => {
    const { csv, count } = await services.export.cardsCsv(filters, sorted, locale)
    const [header, ...rows] = parseCsv(csv)
    const column = (name: string) => header!.indexOf(name)
    return { csv, count, header: header!, rows, column, cell: (row: string[], name: string) => row[column(name)] }
  }

  async function seed() {
    const magician = await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id), set: { setCode: 'LOB-005', rarity: 'Ultra Rare', edition: 'FIRST_EDITION' }, purchaseDate: '2026-07-15' }, h.anna)
    const dragon = await h.services.cards.create({ game: 'ygo', externalId: String(BLUE_EYES.id), set: { setCode: 'LOB-001', rarity: 'Ultra Rare' } }, h.sven)
    const spell = await h.services.cards.create({ game: 'ygo', externalId: String(ENGLISH_ONLY.id) }, h.anna)
    await h.services.cards.update(spell.id, { status: 'SOLD', statusPerson: 'Max' }, h.anna)
    return { magician, dragon, spell }
  }

  it('writes every card of the selection in the order of the overview, whoever owns it and whatever its status', async () => {
    await seed()
    const table = await asTable({}, 'de')
    expect(table.count).toBe(3)
    expect(table.rows.map(row => table.cell(row, 'Name'))).toEqual(['Blauäugiger weißer Drache', 'Dunkler Magier', 'Obscure Spell'])
    expect(table.rows.map(row => table.cell(row, 'Besitzer'))).toEqual(['Sven', 'Anna', 'Anna'])
    expect(table.rows.map(row => table.cell(row, 'Status'))).toEqual(['Aktiv', 'Aktiv', 'Verkauft'])
    const descending = await h.services.export.cardsCsv({}, { sort: 'name', dir: 'desc' }, 'de')
    expect(parseCsv(descending.csv).slice(1).map(row => row[1])).toEqual(['Obscure Spell', 'Dunkler Magier', 'Blauäugiger weißer Drache'])
  })

  it('follows the filters of the overview', async () => {
    await seed()
    expect((await asTable({ owner: h.sven.id }, 'de')).count).toBe(1)
    expect((await asTable({ status: 'SOLD' }, 'de')).count).toBe(1)
    const searched = await asTable({ q: 'Dark Magician', owner: h.anna.id }, 'de')
    expect(searched.rows.map(row => row[searched.column('Name')])).toEqual(['Dunkler Magier'])
    expect((await asTable({ game: 'pokemon' }, 'de')).count).toBe(0)
  })

  it('has the data of a Yu-Gi-Oh! card in the order of the card page, with the latest price only', async () => {
    await seed()
    const table = await asTable({ q: 'Dunkler' }, 'de')
    const [row] = table.rows
    expect(table.header.slice(0, 9)).toEqual(['Spiel', 'Name', 'Set-Code', 'Edition / Variante', 'Set', 'Seltenheit', 'Externe ID', 'Herkunft', 'ATK'])
    expect(table.header.indexOf('Beschreibung')).toBeGreaterThan(table.header.indexOf('Attribut'))
    expect(table.header.indexOf('Status')).toBeGreaterThan(table.header.indexOf('Beschreibung'))
    expect(table.header.indexOf('Preis')).toBeGreaterThan(table.header.indexOf('Kaufdatum'))
    expect(table.cell(row!, 'Spiel')).toBe('Yu-Gi-Oh!')
    expect(table.cell(row!, 'Set-Code')).toBe('LOB-005')
    expect(table.cell(row!, 'Edition / Variante')).toBe('1. Auflage')
    expect(table.cell(row!, 'Set')).toBe('Legend of Blue Eyes White Dragon')
    expect(table.cell(row!, 'Seltenheit')).toBe('Ultra Rare')
    expect(table.cell(row!, 'Externe ID')).toBe(String(DARK_MAGICIAN.id))
    expect(table.cell(row!, 'Herkunft')).toBe('aus API übernommen')
    expect(table.cell(row!, 'Level')).toBe('7')
    expect(table.cell(row!, 'Kartentyp')).toBe('Normal Monster')
    expect(table.cell(row!, 'Typ')).toBe('Spellcaster')
    expect(table.cell(row!, 'Attribut')).toBe('DARK')
    expect(table.cell(row!, 'Beschreibung')).toBe('Der ultimative Magier in Angriff und Verteidigung.')
    expect(table.cell(row!, 'Kaufdatum')).toBe('2026-07-15')
    expect([table.cell(row!, 'Preisquelle'), table.cell(row!, 'Preis'), table.cell(row!, 'Währung')]).toEqual(['cardmarket', '18', 'EUR'])
    // Pokémon columns stay empty for a Yu-Gi-Oh! card.
    expect(table.cell(row!, 'KP')).toBe('')
    expect(table.cell(row!, 'Attacken')).toBe('')
  })

  it('writes the latest price once, however many there are', async () => {
    const { magician } = await seed()
    await h.db.priceHistory.create({ data: { cardId: magician.id, source: 'cardmarket', price: '21.50', currency: 'EUR', fetchedAt: new Date('2026-10-05T10:00:00Z') } })
    const table = await asTable({ q: 'Dunkler' }, 'de')
    expect(table.rows).toHaveLength(1)
    expect(table.cell(table.rows[0]!, 'Preis')).toBe('21.5')
    expect(table.cell(table.rows[0]!, 'Preis-Datum')).toBe('2026-10-05 10:00')
  })

  it('exports in the language of the interface, and in English where a card has no text in it', async () => {
    await seed()
    const german = await asTable({}, 'de')
    const english = await asTable({}, 'en')
    expect(english.header.slice(0, 3)).toEqual(['Game', 'Name', 'Set code'])
    expect(english.rows.map(row => english.cell(row, 'Name'))).toEqual(['Blue-Eyes White Dragon', 'Dark Magician', 'Obscure Spell'])
    expect(english.rows.map(row => english.cell(row, 'Status'))).toEqual(['Active', 'Active', 'Sold'])
    expect(english.cell(english.rows[1]!, 'Edition / variant')).toBe('1st Edition')
    expect(english.cell(english.rows[1]!, 'Description')).not.toBe(german.cell(german.rows[1]!, 'Beschreibung'))
    // The card that only exists in English is exported with its English text in the German export as well.
    expect(german.cell(german.rows[2]!, 'Name')).toBe('Obscure Spell')
    expect(german.cell(german.rows[2]!, 'Beschreibung')).not.toBe('')
  })

  it('has the data of a Pokémon card, translated, and the attacks in one cell', async () => {
    await h.services.cards.create({ game: 'pokemon', externalId: 'swsh3-136', set: { setCode: 'swsh3-136', rarity: 'Uncommon', edition: 'reverse' } }, h.anna)
    const german = await asTable({ game: 'pokemon' }, 'de')
    const english = await asTable({ game: 'pokemon' }, 'en')
    const [row] = german.rows
    expect(german.cell(row!, 'Spiel')).toBe('Pokémon')
    expect(german.cell(row!, 'Name')).toBe('Wiesenior')
    expect(english.cell(english.rows[0]!, 'Name')).toBe('Furret')
    expect(german.cell(row!, 'Edition / Variante')).toBe('Reverse Holo')
    expect(german.cell(row!, 'KP')).toBe('110')
    expect(german.cell(row!, 'Kategorie')).not.toBe('')
    expect(german.cell(row!, 'Attacken')).toContain('→')
    expect(german.cell(row!, 'ATK')).toBe('')
    expect(english.cell(english.rows[0]!, 'Attacks')).not.toBe(german.cell(row!, 'Attacken'))
  })

  it('adds the price in the display currency, converted where needed', async () => {
    await seed()
    const rates = (async (input: URL | RequestInfo) => {
      const url = new URL(String(input))
      return url.searchParams.get('base') === 'EUR'
        ? new Response(JSON.stringify({ rates: { CHF: 0.9 } }), { status: 200 })
        : new Response('{}', { status: 404 })
    }) as typeof fetch
    const services = h.servicesAt(() => new Date('2026-10-04T12:00:00Z'), undefined, undefined, { currency: 'CHF', fetchFn: rates })
    const table = await asTable({ q: 'Dunkler' }, 'de', services)
    expect(table.header).toContain('Preis in CHF')
    expect(table.cell(table.rows[0]!, 'Preis')).toBe('18')
    expect(table.cell(table.rows[0]!, 'Preis in CHF')).toBe('16.2')
    expect((await asTable({}, 'de')).header).not.toContain('Preis in CHF')
  })

  it('quotes cells and keeps card text from running as a formula', async () => {
    const { magician } = await seed()
    await h.db.cardTranslation.updateMany({ where: { cardId: magician.id, language: 'de' }, data: { description: '=1+1; "quoted"\nsecond line' } })
    const table = await asTable({ q: 'Dunkler' }, 'de')
    expect(table.cell(table.rows[0]!, 'Beschreibung')).toBe('\'=1+1; "quoted"\nsecond line')
  })

  it('names the file after the day', async () => {
    const { fileName } = await h.services.export.cardsCsv({}, sorted, 'de')
    expect(fileName).toBe('cardkeeper-export-2026-10-04.csv')
  })
})

describe.skipIf(!TEST_DATABASE_URL)('text export for an AI', () => {
  const h = useHarness()
  const sorted = { sort: 'name' as const, dir: 'asc' as const }
  const all = { onlyActive: false, withText: true, intro: false }

  async function seed() {
    const magician = await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id), set: { setCode: 'LOB-005', rarity: 'Ultra Rare' } }, h.anna)
    // The same card again, in another print and with another owner.
    await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id), set: { setCode: 'SDY-006', rarity: 'Common' } }, h.sven)
    await h.services.cards.create({ game: 'ygo', externalId: String(DARK_MAGICIAN.id) }, h.anna)
    const spell = await h.services.cards.create({ game: 'ygo', externalId: String(ENGLISH_ONLY.id) }, h.anna)
    await h.services.cards.update(spell.id, { status: 'SOLD', statusPerson: 'Max' }, h.anna)
    return { magician, spell }
  }

  it('merges the copies of a card across prints and owners into one line with the quantity', async () => {
    await seed()
    const result = await h.services.export.cardsAiText({}, sorted, all)
    expect(result.total).toBe(4)
    expect(result.distinct).toBe(2)
    expect(result.text).toContain('# Yu-Gi-Oh! – 2 distinct cards (4 total)')
    expect(result.text).toContain(`3x Dark Magician (DE: Dunkler Magier) [${DARK_MAGICIAN.id}] | Normal Monster | DARK Spellcaster | Lv7 | ATK 2500 / DEF 2100`)
    expect(result.text).toContain('   Text: Description of Dark Magician')
  })

  it('leaves out the cards that are not active, only if asked', async () => {
    await seed()
    const active = await h.services.export.cardsAiText({}, sorted, { ...all, onlyActive: true })
    expect(active.total).toBe(3)
    expect(active.text).not.toContain('Obscure Spell')
    const everything = await h.services.export.cardsAiText({}, sorted, all)
    expect(everything.text).toContain('1x Obscure Spell')
  })

  it('follows the filters of the overview, whoever owns the cards', async () => {
    await seed()
    expect((await h.services.export.cardsAiText({ owner: h.sven.id }, sorted, all)).total).toBe(1)
    expect((await h.services.export.cardsAiText({ game: 'pokemon' }, sorted, all)).text).toBe('')
  })

  it('has no text lines without the option and no introduction unless asked', async () => {
    await seed()
    const short = await h.services.export.cardsAiText({}, sorted, { ...all, withText: false })
    expect(short.text).not.toContain('Text:')
    expect(short.text).toContain('ATK 2500 / DEF 2100')
    expect(short.text.startsWith('# Yu-Gi-Oh!')).toBe(true)
    const withIntro = await h.services.export.cardsAiText({}, sorted, { ...all, intro: true, wish: 'Build a Dark Magician deck' })
    expect(withIntro.text).toContain('The wish of the player: Build a Dark Magician deck')
    expect(withIntro.text.startsWith('You are helping')).toBe(true)
  })

  it('writes a Pokémon card in English with its attacks and the legality, and gives each game its section', async () => {
    await seed()
    await h.services.cards.create({ game: 'pokemon', externalId: 'swsh3-136', set: { setCode: 'swsh3-136', rarity: 'Uncommon', edition: 'reverse' } }, h.anna)
    const result = await h.services.export.cardsAiText({}, sorted, all)
    expect(result.text).toContain('# Pokémon – 1 distinct card (1 total)')
    expect(result.text).toContain('1x Furret (DE: Wiesenior) [swsh3-136] | Pokémon · Stage1 · Colorless | Evolves from Sentret | HP 110 | Retreat 1 | Weak: Fighting ×2 | Mark D')
    expect(result.text).toContain('Legal: Expanded')
    expect(result.text).toContain('   Attack [Colorless×3] Tail Smash 120')
    expect(result.text).toContain('# Yu-Gi-Oh! – 2 distinct cards (4 total)')
  })

  it('names the file after the day', async () => {
    const services = h.servicesAt(() => new Date('2026-10-27T12:00:00Z'))
    expect((await services.export.cardsAiText({}, sorted, all)).fileName).toBe('cardkeeper-ai-2026-10-27.txt')
  })
})

