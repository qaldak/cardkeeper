import { describe, expect, it } from 'vitest'
import { buildAiText, type AiCard } from '../../server/lib/ai-text'
import { aiExportQuerySchema } from '../../server/lib/schemas'

const ygo = (overrides: Partial<AiCard> = {}): AiCard => ({
  gameSlug: 'ygo',
  gameName: 'Yu-Gi-Oh!',
  externalId: '46986414',
  name: 'Dark Magician',
  nameDe: 'Dunkler Magier',
  description: 'The ultimate wizard\nin terms of attack and defense.',
  attributes: { type: 'Normal Monster', race: 'Spellcaster', attribute: 'DARK', level: 7, atk: 2500, def: 2100, archetype: 'Dark Magician' },
  details: {},
  ...overrides,
})

const pokemon = (overrides: Partial<AiCard> = {}): AiCard => ({
  gameSlug: 'pokemon',
  gameName: 'Pokémon',
  externalId: 'swsh3-136',
  name: 'Furret',
  nameDe: 'Wiesenior',
  description: '',
  attributes: { category: 'Pokemon', stage: 'Stage1', types: ['Colorless'], hp: 110, retreat: 1, regulationMark: 'D', legal: { standard: false, expanded: true } },
  details: {
    weaknesses: [{ type: 'Fighting', value: '×2' }],
    attacks: [{ name: 'Tail Smash', cost: ['Colorless', 'Colorless', 'Colorless'], damage: 120, effect: 'Flip a coin.' }],
    abilities: [{ type: 'Ability', name: 'Quick Step', effect: 'Draw a card.' }],
  },
  ...overrides,
})

const options = { withText: true, intro: false }

describe('buildAiText', () => {
  it('merges identical cards into one line with the quantity and counts them', () => {
    const { text, total, distinct } = buildAiText([ygo(), ygo(), ygo()], options)
    expect(total).toBe(3)
    expect(distinct).toBe(1)
    expect(text).toContain('# Yu-Gi-Oh! – 1 distinct card (3 total)')
    expect(text).toContain('3x Dark Magician (DE: Dunkler Magier) [46986414] | Normal Monster | DARK Spellcaster | Lv7 | ATK 2500 / DEF 2100 | Archetype: Dark Magician')
    expect(text.match(/Dark Magician \(DE/g)).toHaveLength(1)
  })

  it('writes the unknown ATK of the API (-1) as a question mark and omits the German name where it does not differ', () => {
    const { text } = buildAiText([ygo({ nameDe: 'Dark Magician', attributes: { type: 'Effect Monster', atk: -1, def: -1, level: 4 } })], options)
    expect(text).toContain('1x Dark Magician [46986414] | Effect Monster | Lv4 | ATK ? / DEF ?')
    expect(text).not.toContain('DE:')
  })

  it('has the link value with the arrows and no DEF for a Link monster', () => {
    const { text } = buildAiText([ygo({ attributes: { type: 'Link Monster', race: 'Cyberse', attribute: 'DARK', atk: 1000, linkval: 1, linkmarkers: ['Bottom'] } })], options)
    expect(text).toContain('ATK 1000 | Link 1 (Bottom)')
    expect(text).not.toContain('DEF')
  })

  it('writes the rules text on a second line and drops it without the option, keeping the data', () => {
    const withText = buildAiText([ygo()], options).text
    expect(withText).toContain('\n   Text: The ultimate wizard in terms of attack and defense.')
    const without = buildAiText([ygo()], { ...options, withText: false }).text
    expect(without).not.toContain('Text:')
    expect(without).toContain('ATK 2500 / DEF 2100')
  })

  it('has the data of a Pokémon card, with attacks and abilities only if the text is wanted', () => {
    const { text } = buildAiText([pokemon()], options)
    expect(text).toContain('1x Furret (DE: Wiesenior) [swsh3-136] | Pokémon · Stage1 · Colorless | HP 110 | Retreat 1 | Weak: Fighting ×2 | Mark D | Legal: Expanded')
    expect(text).toContain('   Ability [Ability] Quick Step: Draw a card.')
    expect(text).toContain('   Attack [Colorless×3] Tail Smash 120: Flip a coin.')
    const short = buildAiText([pokemon()], { ...options, withText: false }).text
    expect(short).not.toContain('Attack')
    expect(short).toContain('HP 110')
  })

  it('gives each game its own section with its own counts, in the order of the selection', () => {
    const { text, total, distinct } = buildAiText([pokemon(), ygo(), ygo(), pokemon({ externalId: 'swsh3-154', name: 'Boss’s Orders', nameDe: null })], options)
    expect(total).toBe(4)
    expect(distinct).toBe(3)
    expect(text.indexOf('# Pokémon – 2 distinct cards (2 total)')).toBeLessThan(text.indexOf('# Yu-Gi-Oh! – 1 distinct card (2 total)'))
  })

  it('merges a card without a card number by its name', () => {
    const { distinct } = buildAiText([ygo({ externalId: null }), ygo({ externalId: null, name: 'dark magician' }), ygo({ externalId: null, name: 'Other' })], options)
    expect(distinct).toBe(2)
  })

  it('prepends the introduction with the wish, only for the games in the selection', () => {
    const ygoOnly = buildAiText([ygo()], { withText: true, intro: true, wish: ' Build a Dark Magician deck ' }).text
    expect(ygoOnly).toMatch(/^You are helping a trading card player/)
    expect(ygoOnly).toContain('banlist')
    expect(ygoOnly).not.toContain('Standard, Expanded')
    expect(ygoOnly).toContain('The wish of the player: Build a Dark Magician deck')
    const both = buildAiText([ygo(), pokemon()], { withText: true, intro: true }).text
    expect(both).toContain('Legal: Standard, Expanded')
    expect(both).not.toContain('The wish of the player')
    expect(buildAiText([ygo()], { withText: true, intro: false, wish: 'ignored' }).text).toMatch(/^# Yu-Gi-Oh!/)
  })

  it('is empty for an empty selection', () => {
    expect(buildAiText([], { withText: true, intro: true })).toEqual({ text: '', total: 0, distinct: 0 })
  })
})

describe('aiExportQuerySchema', () => {
  it('takes the options of the dialog, all on by default', () => {
    expect(aiExportQuerySchema.parse({})).toMatchObject({ onlyActive: true, withText: true, intro: true })
    expect(aiExportQuerySchema.parse({ onlyActive: 'false', withText: 'false', intro: 'false', wish: ' x ' })).toMatchObject({ onlyActive: false, withText: false, intro: false, wish: 'x' })
  })

  it('rejects an unknown option value and a wish that is too long', () => {
    expect(aiExportQuerySchema.safeParse({ onlyActive: 'maybe' }).success).toBe(false)
    expect(aiExportQuerySchema.safeParse({ wish: 'x'.repeat(501) }).success).toBe(false)
    expect(aiExportQuerySchema.safeParse({ wish: 'x'.repeat(500) }).success).toBe(true)
  })
})
