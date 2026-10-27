import type { Prisma, PrismaClient } from '../generated/prisma/client'
import type { PokemonAttributes, PokemonDetails } from '../../shared/types/pokemon'
import { editionLabel } from '../../shared/utils/editions'
import { sortByLanguagePreference } from '../../shared/utils/languages'
import type { CardSort, SortDirection } from '../../shared/utils/sorting'
import type { CardFilters } from '../lib/card-filters'
import type { AppConfig } from '../lib/config'
import { buildAiText, type AiCard } from '../lib/ai-text'
import { buildCsv, type CsvValue } from '../lib/csv'
import { formatDateOnly } from '../lib/dates'
import { translator, type ExportLocale, type Translator } from '../lib/messages'
import type { Converter, ExchangeRateService } from './rates'

export interface ExportServiceDeps {
  db: PrismaClient
  config: AppConfig
  rates: ExchangeRateService
  /** The ids of the cards of a selection in the order of the overview. */
  orderedIds: (filters: CardFilters, order: { sort: CardSort, dir?: SortDirection }) => Promise<number[]>
  now?: () => Date
}

const exportInclude = (priceSource: string) => ({
  game: { select: { slug: true, displayName: true } },
  owner: { select: { name: true } },
  translations: true,
  sets: { orderBy: { id: 'asc' }, take: 1 },
  priceHistory: { where: { source: priceSource }, orderBy: [{ fetchedAt: 'desc' }, { id: 'desc' }], take: 1 },
  statusHistory: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 },
}) satisfies Prisma.CardInclude

/** What the text for an AI needs: no prices, owners or histories. */
const aiInclude = { game: { select: { slug: true, displayName: true } }, translations: true } satisfies Prisma.CardInclude

type ExportCard = Prisma.CardGetPayload<{ include: ReturnType<typeof exportInclude> }>
type Attributes = Record<string, unknown>

/** How many cards are loaded with all their data in one query. */
const CHUNK = 300

const timestamp = (date: Date | null | undefined) => (date ? date.toISOString().slice(0, 16).replace('T', ' ') : '')
const joined = (values: unknown[] | undefined) => (values ?? []).map(String).join(', ')
const oneLine = (text: string | undefined) => (text ?? '').replace(/\s*[\r\n]+\s*/g, ' ').trim()

/** ATK/DEF: -1 is the marker of the API for an unknown ("?") value. */
const stat = (value: unknown): CsvValue => (value === -1 ? '?' : typeof value === 'number' ? value : value === undefined || value === null ? '' : String(value))
const num = (value: unknown): CsvValue => (typeof value === 'number' ? value : '')
const str = (value: unknown): CsvValue => (typeof value === 'string' || typeof value === 'number' ? String(value) : '')

/**
 * The column keys of the table export in the order of the card page, top to bottom: basic data, the attributes of the
 * game, the description, status and owner, the dates and the latest price. The header of each is `export.columns.<key>`.
 */
export const COLUMN_KEYS = [
  'game', 'name', 'setCode', 'edition', 'setName', 'rarity', 'externalId', 'origin',
  // Yu-Gi-Oh!
  'atk', 'def', 'level', 'cardType', 'race', 'attribute', 'archetype', 'scale', 'linkval', 'linkmarkers', 'frameType', 'typeline',
  // Pokémon
  'pokemonCategory', 'hp', 'pokemonTypes', 'stage', 'trainerType', 'energyType', 'retreat', 'evolveFrom', 'number', 'illustrator',
  'regulationMark', 'dexId', 'pokemonLevel', 'suffix', 'legalStandard', 'legalExpanded', 'effect', 'abilities', 'attacks', 'weaknesses', 'resistances',
  'description',
  'status', 'statusDate', 'statusPerson', 'owner', 'purchaseDate',
  'lastModifiedAt', 'lastModifiedBy', 'lastFetchedAt', 'pricesCheckedAt',
  'priceSource', 'price', 'currency', 'priceIn', 'priceDate',
] as const

type ColumnKey = (typeof COLUMN_KEYS)[number]

/** The translation a card is shown in: the language asked for, else English, else whatever the card has. */
function pickTranslation(card: ExportCard, locale: ExportLocale) {
  const sorted = sortByLanguagePreference(card.translations)
  return sorted.find(entry => entry.language === locale) ?? sorted.find(entry => entry.language === 'en') ?? sorted[0]
}

function rowOf(card: ExportCard, locale: ExportLocale, i18n: Translator, convert: Converter, displayCurrency: string | null): Record<ColumnKey, CsvValue> {
  const { t, has } = i18n
  const translation = pickTranslation(card, locale)
  const fallbackDetails = card.translations.find(entry => entry.language === 'en')?.details
  // The details (Pokémon: attacks, localized names) of the language, English where the card has none for it.
  const details = ((translation?.details ?? fallbackDetails) ?? {}) as PokemonDetails
  const attrs = card.gameSpecificAttributes as Attributes
  const pokemon = attrs as Partial<PokemonAttributes>
  const isPokemon = card.game.slug === 'pokemon'
  const set = card.sets[0]
  const latestStatus = card.statusHistory[0]
  const hasStatusInfo = card.status !== 'ACTIVE' && latestStatus?.status === card.status
  const price = card.priceHistory[0]
  const amount = price ? Number(price.price.toString()) : null
  const converted = price && amount !== null ? convert(amount, price.currency) : null
  // The price in the display currency: converted, or as it is when it is in that currency already.
  const inDisplay = converted ? converted.amount : (price && price.currency === displayCurrency && amount !== null ? amount : null)

  const label = (prefix: string, value: string | null | undefined) => (value ? (has(`${prefix}.${value}`) ? t(`${prefix}.${value}`) : value) : '')
  const yesNo = (value: boolean | undefined) => (value === undefined ? '' : t(value ? 'export.yes' : 'export.no'))
  const typeValues = (entries: PokemonDetails['weaknesses']) => (entries ?? []).map(entry => `${label('pokemon.type', entry.type)} ${entry.value ?? ''}`.trim()).join(', ')
  const damage = (value: string | number | undefined) => (value === undefined ? '' : ` → ${value}`)

  const types = details.types ?? (pokemon.types ?? []).map(type => label('pokemon.type', type))
  const number = pokemon.localId ? (pokemon.setCardCount?.official ? `${pokemon.localId}/${pokemon.setCardCount.official}` : pokemon.localId) : ''
  const edition = isPokemon ? label('variant', set?.edition) : editionLabel(set?.edition, key => t(key))

  return {
    game: card.game.displayName,
    name: translation?.name ?? card.name,
    setCode: set?.setCode ?? '',
    edition,
    setName: (isPokemon ? details.set?.name : undefined) ?? set?.setName ?? '',
    rarity: (isPokemon ? details.rarity : undefined) ?? set?.rarity ?? '',
    externalId: card.externalId ?? '',
    origin: t(card.externalId ? 'card.origin.api' : 'card.origin.manual'),

    atk: isPokemon ? '' : stat(attrs.atk),
    def: isPokemon ? '' : stat(attrs.def),
    level: isPokemon ? '' : num(attrs.level),
    cardType: isPokemon ? '' : str(attrs.type),
    race: isPokemon ? '' : str(attrs.race),
    attribute: isPokemon ? '' : str(attrs.attribute),
    archetype: isPokemon ? '' : str(attrs.archetype),
    scale: isPokemon ? '' : num(attrs.scale),
    linkval: isPokemon ? '' : num(attrs.linkval),
    linkmarkers: isPokemon ? '' : joined(attrs.linkmarkers as unknown[] | undefined),
    frameType: isPokemon ? '' : str(attrs.frameType),
    typeline: isPokemon ? '' : joined(attrs.typeline as unknown[] | undefined),

    pokemonCategory: isPokemon ? (details.category ?? label('pokemon.category', pokemon.category)) : '',
    hp: isPokemon ? num(pokemon.hp) : '',
    pokemonTypes: isPokemon ? types.join(', ') : '',
    stage: isPokemon ? (details.stage ?? label('pokemon.stage', pokemon.stage)) : '',
    trainerType: isPokemon ? (details.trainerType ?? label('pokemon.trainerType', pokemon.trainerType)) : '',
    energyType: isPokemon ? (details.energyType ?? label('pokemon.energyType', pokemon.energyType)) : '',
    retreat: isPokemon ? num(pokemon.retreat) : '',
    evolveFrom: isPokemon ? (details.evolveFrom ?? pokemon.evolveFrom ?? '') : '',
    number: isPokemon ? number : '',
    illustrator: isPokemon ? (pokemon.illustrator ?? '') : '',
    regulationMark: isPokemon ? (pokemon.regulationMark ?? '') : '',
    dexId: isPokemon ? joined(pokemon.dexId) : '',
    pokemonLevel: isPokemon ? num(pokemon.level) : '',
    suffix: isPokemon ? (pokemon.suffix ?? '') : '',
    legalStandard: isPokemon ? yesNo(pokemon.legal?.standard) : '',
    legalExpanded: isPokemon ? yesNo(pokemon.legal?.expanded) : '',
    effect: isPokemon ? oneLine(details.effect) : '',
    abilities: (details.abilities ?? []).map(ability => `${ability.type ? `[${ability.type}] ` : ''}${ability.name}${ability.effect ? `: ${oneLine(ability.effect)}` : ''}`).join(' | '),
    attacks: (details.attacks ?? []).map(attack => `${attack.name} (${attack.cost.join(', ')}${damage(attack.damage)})${attack.effect ? `: ${oneLine(attack.effect)}` : ''}`).join(' | '),
    weaknesses: typeValues(details.weaknesses),
    resistances: typeValues(details.resistances),

    description: translation?.description ?? '',

    status: t(`status.${card.status}`),
    statusDate: hasStatusInfo ? formatDateOnly(latestStatus.date) : '',
    statusPerson: hasStatusInfo ? (latestStatus.personText ?? '') : '',
    owner: card.owner?.name ?? '',
    purchaseDate: card.purchaseDate ? formatDateOnly(card.purchaseDate) : '',

    lastModifiedAt: timestamp(card.lastModifiedAt),
    lastModifiedBy: card.lastModifiedBy ?? '',
    lastFetchedAt: timestamp(card.lastFetchedAt),
    pricesCheckedAt: timestamp(card.pricesCheckedAt),

    priceSource: price?.source ?? '',
    price: amount === null ? '' : amount,
    currency: price?.currency ?? '',
    priceIn: inDisplay ?? '',
    priceDate: timestamp(price?.fetchedAt),
  }
}

/**
 * The table export of a selection: every card that matches the filters of the overview, in its order, with all data
 * except the images, as CSV for a spreadsheet. The language is the one of the interface, English where a card has no
 * text in it. Prices: the latest of the price source, also in the display currency when there is one.
 */
export function createExportService({ db, config, rates, orderedIds, now = () => new Date() }: ExportServiceDeps) {
  return {
    async cardsCsv(
      filters: CardFilters,
      order: { sort: CardSort, dir?: SortDirection },
      locale: ExportLocale,
    ): Promise<{ fileName: string, csv: string, count: number }> {
      const i18n = translator(locale)
      const ids = await orderedIds(filters, order)

      const cards = new Map<number, ExportCard>()
      for (let start = 0; start < ids.length; start += CHUNK) {
        const found = await db.card.findMany({ where: { id: { in: ids.slice(start, start + CHUNK) } }, include: exportInclude(config.priceSource) })
        for (const card of found) {
          cards.set(card.id, card)
        }
      }

      const displayCurrency = config.displayCurrency
      const currencies = [...cards.values()].flatMap(card => card.priceHistory.map(point => point.currency))
      const convert = await rates.converter(currencies, displayCurrency)

      const keys = COLUMN_KEYS.filter(key => key !== 'priceIn' || displayCurrency !== null)
      const header = keys.map(key => i18n.t(`export.columns.${key}`, { currency: displayCurrency ?? '' }))
      const rows = ids.flatMap((id) => {
        const card = cards.get(id)
        if (!card) {
          return []
        }
        const row = rowOf(card, locale, i18n, convert, displayCurrency)
        return [keys.map(key => row[key])]
      })

      const day = now().toISOString().slice(0, 10)
      return { fileName: `cardkeeper-export-${day}.csv`, csv: buildCsv(header, rows), count: rows.length }
    },

    /**
     * The text of a selection for an AI prompt: the cards of the selection in the order of the overview (the active ones
     * only, if asked), merged to one line per distinct card with the quantity; see `buildAiText`.
     */
    async cardsAiText(
      filters: CardFilters,
      order: { sort: CardSort, dir?: SortDirection },
      options: { onlyActive: boolean, withText: boolean, intro: boolean, wish?: string },
    ): Promise<{ text: string, fileName: string, total: number, distinct: number }> {
      const ids = await orderedIds(filters, order)
      const loaded = new Map<number, Prisma.CardGetPayload<{ include: typeof aiInclude }>>()
      for (let start = 0; start < ids.length; start += CHUNK) {
        const found = await db.card.findMany({ where: { id: { in: ids.slice(start, start + CHUNK) } }, include: aiInclude })
        for (const card of found) {
          loaded.set(card.id, card)
        }
      }

      const cards = ids.flatMap((id): AiCard[] => {
        const card = loaded.get(id)
        if (!card || (options.onlyActive && card.status !== 'ACTIVE')) {
          return []
        }
        // English, else whatever the card has; the German name is added next to it where it differs.
        const sorted = sortByLanguagePreference(card.translations)
        const translation = sorted.find(entry => entry.language === 'en') ?? sorted[0]
        const german = card.translations.find(entry => entry.language === 'de')
        return [{
          gameSlug: card.game.slug,
          gameName: card.game.displayName,
          externalId: card.externalId,
          name: translation?.name ?? card.name,
          nameDe: german?.name ?? null,
          description: translation?.description ?? '',
          attributes: (card.gameSpecificAttributes ?? {}) as Record<string, unknown>,
          details: ((translation?.details ?? {}) as PokemonDetails),
        }]
      })

      const { text, total, distinct } = buildAiText(cards, options)
      const day = now().toISOString().slice(0, 10)
      return { text, fileName: `cardkeeper-ai-${day}.txt`, total, distinct }
    },
  }
}

export type ExportService = ReturnType<typeof createExportService>
