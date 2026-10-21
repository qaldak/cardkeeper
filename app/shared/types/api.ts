import type { CardStatusValue } from '../utils/status'

/** An amount converted into the display currency (DISPLAY_CURRENCY). */
export interface ConvertedMoneyDto {
  amount: number
  currency: string
}

export interface MoneyDto {
  amount: number
  currency: string
  source: string
  /** The amount in the display currency; `null` when none is set, the amount is in it already, or no rate is known. */
  converted: ConvertedMoneyDto | null
}

export interface GameDto {
  slug: string
  displayName: string
  languages: string[]
  defaultLanguage: string
}

/** A user of the collection; every user can see all cards, but only change their own. */
export interface UserDto {
  id: number
  name: string
  cardCount: number
}

export interface UserRefDto {
  id: number
  name: string
}

/** The logged in user. While `mustChangePassword` is set only the password change is available. */
export interface SessionUserDto {
  id: number
  name: string
  mustChangePassword: boolean
}

export interface CardListItemDto {
  id: number
  name: string
  gameSlug: string
  gameName: string
  setCode: string | null
  status: CardStatusValue
  owner: UserRefDto | null
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
  /** The price in the display currency at today's rate, or `null` as for {@link MoneyDto.converted}. */
  converted: ConvertedMoneyDto | null
  fetchedAt: string
}

/** The neighbours of a card in the order of the overview, for paging through the cards. */
export interface CardNeighborsDto {
  /** 1-based place of the card in the list; `null` when it is not in the list (any more). */
  position: number | null
  /** How many cards the list has. */
  total: number
  /** The card before (the last one at the start of the list); `null` when there is no other card. */
  previousId: number | null
  /** The card after (the first one at the end of the list); `null` when there is no other card. */
  nextId: number | null
  /** The page of the overview that shows the card. */
  page: number | null
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
  /** The only user who may change the card; null for cards that predate the logins (nobody may change them). */
  owner: UserRefDto | null
  purchaseDate: string | null
  sets: CardSetDto[]
  images: CardImageDto[]
  priceHistory: PricePointDto[]
  primarySource: string
  /** Last time the data was fetched from the card API. */
  lastFetchedAt: string | null
  /** When the prices were last asked for at the card database (the scheduled reload, a refresh, the creation). */
  pricesCheckedAt: string | null
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
  /** Size of the set as printed on the cards ("088" of "040/088"). */
  official: number | null
  /** Including cards that are not part of the printed numbering (secret rares). */
  total: number | null
  /** The code the cards of the set start with ("SDAZ"), if the database knows it. */
  code?: string | null
  releasedAt?: string | null
}

/** A card in a set, as listed when browsing the set. */
export interface SetCardDto {
  externalId: string
  /** Number in the set as in the database ("040"). */
  number: string
  name: string
  thumbnailUrl: string | null
  /** The prints of the card in this set: the code on the card and its rarity (Yu-Gi-Oh!). */
  prints?: { setCode: string, rarity: string | null, edition?: string | null }[]
}
