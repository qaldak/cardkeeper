import type { CardStatusValue } from '../utils/status'

export interface MoneyDto {
  amount: number
  currency: string
  source: string
}

export interface GameDto {
  slug: string
  displayName: string
  languages: string[]
  defaultLanguage: string
}

export interface PlayerDto {
  id: number
  name: string
  contact: string | null
  cardCount: number
}

export interface PlayerRefDto {
  id: number
  name: string
}

export interface CardListItemDto {
  id: number
  name: string
  gameSlug: string
  gameName: string
  setCode: string | null
  status: CardStatusValue
  player: PlayerRefDto | null
  imageId: number | null
  price: MoneyDto | null
}

export interface CardListSummaryDto {
  /** Number of cards matching the filters (all pages). */
  count: number
  /** Number of matching cards that are still in the collection (status ACTIVE). */
  activeCount: number
  /** Value of the active cards per currency, based on the latest price of the configured source. */
  totals: { currency: string, amount: number }[]
}

export interface CardListResponseDto {
  items: CardListItemDto[]
  page: number
  pageSize: number
  summary: CardListSummaryDto
}

export interface CardSetDto {
  id: number
  setCode: string
  setName: string | null
  rarity: string | null
  edition: string | null
}

export interface CardTranslationDto {
  language: string
  name: string
  description: string | null
  /** Further language dependent data (Pokémon: see `PokemonDetails`); null for Yu-Gi-Oh!. */
  details: Record<string, unknown> | null
}

export interface CardImageDto {
  id: number
  source: 'API' | 'MANUAL'
  isPrimary: boolean
}

export interface PricePointDto {
  id: number
  source: string
  price: number
  currency: string
  fetchedAt: string
}

export interface CardDetailDto {
  id: number
  game: { slug: string, displayName: string }
  externalId: string | null
  /** Display name in the preferred language. */
  name: string
  /** Texts per language, German first. A language that is not listed is not available for this card. */
  translations: CardTranslationDto[]
  /** Language independent attributes from the card API (read-only). */
  attributes: Record<string, unknown>
  status: CardStatusValue
  statusDate: string | null
  statusPerson: string | null
  assignedPlayerId: number | null
  purchaseDate: string | null
  sets: CardSetDto[]
  images: CardImageDto[]
  priceHistory: PricePointDto[]
  primarySource: string
  /** Last time the data was fetched from the card API. */
  lastFetchedAt: string | null
  /** Last change made by a user; null while the card is exactly as imported. */
  userModifiedAt: string | null
  lastModifiedAt: string
  lastModifiedBy: string | null
}

export interface LookupCandidateDto {
  externalId: string
  name: string
  description: string | null
  /** Language of the shown name and description (German, or English if the card has no German text). */
  language: string
  attributes: Record<string, unknown>
  /** Printings to choose from; for Pokémon one entry per variant of the card. */
  sets: { setCode: string, setName: string | null, rarity: string | null, edition: string | null }[]
  /** Small image for the search results, only for games whose image host may be used that way. */
  thumbnailUrl: string | null
}

/** Distinct values for the overview's filter dropdowns. */
export interface FacetsDto {
  // Yu-Gi-Oh!
  types: string[]
  races: string[]
  attributes: string[]
  // Pokémon
  categories: string[]
  pokemonTypes: string[]
  stages: string[]
  variants: string[]
  // both
  rarities: string[]
}

export interface ApiErrorData {
  code?: string
}

/** A set (expansion) of a game that can be browsed when adding a card. */
export interface GameSetDto {
  /** Same in every language, e.g. "me03" or the printed code of a Japanese set ("SV9"). */
  id: string
  name: string
  logoUrl: string | null
  /** The set symbol, as printed on the card. */
  symbolUrl: string | null
  /** Size of the set as printed on the cards ("088" of "040/088"). */
  official: number | null
  /** Including cards that are not part of the printed numbering (secret rares). */
  total: number | null
}

/** A card in a set, as listed when browsing the set. */
export interface SetCardDto {
  externalId: string
  /** Number in the set as in the database ("040"). */
  number: string
  name: string
  thumbnailUrl: string | null
}
