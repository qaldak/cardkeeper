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
  setName: string
  rarity: string | null
  edition: string | null
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
  name: string
  description: string | null
  language: string
  attributes: Record<string, string | number | null>
  /** Manually edited fields mapped to the value they had before the first edit. */
  manualOverrides: Record<string, unknown>
  status: CardStatusValue
  statusDate: string | null
  statusPerson: string | null
  assignedPlayerId: number | null
  purchaseDate: string | null
  sets: CardSetDto[]
  images: CardImageDto[]
  priceHistory: PricePointDto[]
  primarySource: string
  lastFetchedAt: string | null
  lastModifiedAt: string
  lastModifiedBy: string | null
}

export interface LookupCandidateDto {
  externalId: string
  name: string
  description: string | null
  language: string
  attributes: Record<string, unknown>
  sets: { setCode: string, setName: string, rarity: string | null }[]
}

export interface ApiErrorData {
  code?: string
}
