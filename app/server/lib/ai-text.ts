import type { PokemonAttributes, PokemonDetails } from '../../shared/types/pokemon'

/** What the text of the AI export needs to know about one selected card. */
export interface AiCard {
  gameSlug: string
  gameName: string
  /** The card number of the card database; a card entered by hand has none. */
  externalId: string | null
  /** English name (or the first available one). */
  name: string
  /** German name, when the card has one. */
  nameDe: string | null
  /** Rules text in the language of `name` (Yu-Gi-Oh!). */
  description: string
  attributes: Record<string, unknown>
  /** Language dependent details in the language of `name` (Pokémon). */
  details: PokemonDetails
}

export interface AiTextOptions {
  withText: boolean
  intro: boolean
  wish?: string
}

export interface AiText {
  text: string
  /** Number of selected cards. */
  total: number
  /** Number of lines (distinct cards). */
  distinct: number
}

interface Group {
  card: AiCard
  quantity: number
}

const oneLine = (text: string | undefined) => (text ?? '').replace(/\s*[\r\n]+\s*/g, ' ').trim()
const number = (value: unknown): number | undefined => (typeof value === 'number' ? value : undefined)
const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined)
/** ATK/DEF: -1 is the marker of the API for an unknown ("?") value. */
const stat = (value: number) => (value === -1 ? '?' : String(value))

const groupKey = (card: AiCard) => `${card.gameSlug}:${card.externalId ?? `name:${card.name.toLowerCase()}`}`

/** The part of a line that every card has: quantity, name, the German name where it differs, and the card number. */
function head(group: Group): string {
  const { card, quantity } = group
  const german = card.nameDe && card.nameDe !== card.name ? ` (DE: ${card.nameDe})` : ''
  const id = card.externalId ? ` [${card.externalId}]` : ''
  return `${quantity}x ${card.name}${german}${id}`
}

function yugiohLine(group: Group, withText: boolean): string[] {
  const { attributes: a, description } = group.card
  const parts: string[] = []
  const cardType = text(a.type)
  if (cardType) {
    parts.push(cardType)
  }
  const attribute = text(a.attribute)
  const race = text(a.race)
  const kind = [attribute, race].filter(Boolean).join(' ')
  if (kind) {
    parts.push(kind)
  }
  const level = number(a.level)
  if (level !== undefined) {
    parts.push(`Lv${level}`)
  }
  const atk = number(a.atk)
  const def = number(a.def)
  if (atk !== undefined) {
    parts.push(def !== undefined ? `ATK ${stat(atk)} / DEF ${stat(def)}` : `ATK ${stat(atk)}`)
  }
  const scale = number(a.scale)
  if (scale !== undefined) {
    parts.push(`Scale ${scale}`)
  }
  const link = number(a.linkval)
  if (link !== undefined) {
    const markers = Array.isArray(a.linkmarkers) ? a.linkmarkers.map(String).join(', ') : ''
    parts.push(`Link ${link}${markers ? ` (${markers})` : ''}`)
  }
  const archetype = text(a.archetype)
  if (archetype) {
    parts.push(`Archetype: ${archetype}`)
  }
  const lines = [[head(group), ...parts].join(' | ')]
  if (withText && oneLine(description)) {
    lines.push(`   Text: ${oneLine(description)}`)
  }
  return lines
}

/** Energy cost with equal types counted: ["Colorless", "Colorless", "Fire"] becomes "Colorless×2, Fire". */
function cost(types: string[]): string {
  const counts = new Map<string, number>()
  for (const type of types) {
    counts.set(type, (counts.get(type) ?? 0) + 1)
  }
  return [...counts].map(([type, n]) => (n > 1 ? `${type}×${n}` : type)).join(', ')
}

const typeValues = (entries: PokemonDetails['weaknesses']) => (entries ?? []).map(entry => `${entry.type}${entry.value === undefined ? '' : ` ${entry.value}`}`).join(', ')

function pokemonLine(group: Group, withText: boolean): string[] {
  const { attributes, details } = group.card
  const a = attributes as Partial<PokemonAttributes>
  const parts: string[] = []
  const kind = [
    a.category === 'Pokemon' ? 'Pokémon' : a.category,
    a.stage,
    a.trainerType,
    a.energyType,
    a.types?.join('/'),
  ].filter(Boolean)
  if (kind.length > 0) {
    parts.push(kind.join(' · '))
  }
  if (a.evolveFrom) {
    parts.push(`Evolves from ${a.evolveFrom}`)
  }
  if (a.hp !== undefined) {
    parts.push(`HP ${a.hp}`)
  }
  if (a.retreat !== undefined) {
    parts.push(`Retreat ${a.retreat}`)
  }
  const weak = typeValues(details.weaknesses)
  if (weak) {
    parts.push(`Weak: ${weak}`)
  }
  const resist = typeValues(details.resistances)
  if (resist) {
    parts.push(`Resist: ${resist}`)
  }
  if (a.regulationMark) {
    parts.push(`Mark ${a.regulationMark}`)
  }
  if (a.legal && (a.legal.standard !== undefined || a.legal.expanded !== undefined)) {
    const formats = [a.legal.standard ? 'Standard' : '', a.legal.expanded ? 'Expanded' : ''].filter(Boolean)
    parts.push(`Legal: ${formats.length > 0 ? formats.join(', ') : 'none'}`)
  }
  const lines = [[head(group), ...parts].join(' | ')]
  if (withText) {
    for (const ability of details.abilities ?? []) {
      lines.push(`   Ability${ability.type ? ` [${ability.type}]` : ''} ${ability.name}${ability.effect ? `: ${oneLine(ability.effect)}` : ''}`)
    }
    for (const attack of details.attacks ?? []) {
      const damage = attack.damage === undefined ? '' : ` ${attack.damage}`
      lines.push(`   Attack [${cost(attack.cost)}] ${attack.name}${damage}${attack.effect ? `: ${oneLine(attack.effect)}` : ''}`)
    }
    if (oneLine(details.effect)) {
      lines.push(`   Text: ${oneLine(details.effect)}`)
    }
  }
  return lines
}

function introduction(slugs: string[], wish: string | undefined): string {
  const lines = [
    'You are helping a trading card player to build the strongest possible deck from their own collection.',
    '',
    'Below is the collection, grouped by game. Every line is one distinct card: the quantity the player owns ("3x"), the name, the card number in square brackets and the data that matter for the rules of the game; a line that follows with indentation holds the card text. Use only cards from this list and never more copies than the quantity.',
    '',
  ]
  if (slugs.includes('ygo')) {
    lines.push('Yu-Gi-Oh!: a deck may contain at most three copies of a card, and the current banlist of the format applies. The banlist is not part of the data, so check it yourself.')
  }
  if (slugs.includes('pokemon')) {
    lines.push('Pokémon: respect the format legality shown on each line ("Legal: Standard, Expanded"). It shows the state at the last update from the card database and may be outdated after a rotation.')
  }
  lines.push('', 'Explain briefly why you chose the cards, and name important cards that the collection lacks.')
  const request = wish?.trim()
  if (request) {
    lines.push('', `The wish of the player: ${request}`)
  }
  return lines.join('\n')
}

/**
 * The text of the AI export: one line per distinct card (same game and card number) with the quantity, in the order in
 * which the cards first appear in the selection, one section per game. Identical cards of different prints, editions
 * and owners are merged. The text is English; the German name is added where it differs.
 */
export function buildAiText(cards: readonly AiCard[], options: AiTextOptions): AiText {
  const groups = new Map<string, Group>()
  for (const card of cards) {
    const key = groupKey(card)
    const found = groups.get(key)
    if (found) {
      found.quantity += 1
    }
    else {
      groups.set(key, { card, quantity: 1 })
    }
  }

  const games = new Map<string, { name: string, groups: Group[] }>()
  for (const group of groups.values()) {
    const section = games.get(group.card.gameSlug) ?? { name: group.card.gameName, groups: [] }
    section.groups.push(group)
    games.set(group.card.gameSlug, section)
  }

  const blocks: string[] = []
  for (const [slug, section] of games) {
    const total = section.groups.reduce((sum, group) => sum + group.quantity, 0)
    const lines = [`# ${section.name} – ${section.groups.length} distinct ${section.groups.length === 1 ? 'card' : 'cards'} (${total} total)`]
    for (const group of section.groups) {
      lines.push(...(slug === 'pokemon' ? pokemonLine(group, options.withText) : yugiohLine(group, options.withText)))
    }
    blocks.push(lines.join('\n'))
  }

  if (blocks.length === 0) {
    return { text: '', total: 0, distinct: 0 }
  }
  const body = blocks.join('\n\n')
  return {
    text: `${options.intro ? `${introduction([...games.keys()], options.wish)}\n\n` : ''}${body}\n`,
    total: cards.length,
    distinct: groups.size,
  }
}
