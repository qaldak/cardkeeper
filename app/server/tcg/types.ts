export interface CommonCardSet {
  setCode: string
  setName: string | null
  rarity: string | null
  /** Yu-Gi-Oh!: not provided. Pokémon: the variant (normal, reverse, holo, ...), one entry per variant. */
  edition?: string | null
}

export interface CommonCardImage {
  url: string
  smallUrl: string | null
}

export interface CommonCardPrice {
  /** Marketplace the price comes from (e.g. "cardmarket"). */
  source: string
  price: number
  /** ISO 4217 currency of the source; prices are never converted. */
  currency: string
}

/** Game independent representation of a card as returned by every adapter. */
export interface CommonCard {
  externalId: string
  name: string
  description: string | null
  language: string
  /** Game specific attributes, stored as JSONB in `cards.game_specific_attributes`. */
  attributes: Record<string, unknown>
  /** Language dependent data beyond name and description (Pokémon); null/absent if there is none. */
  details?: Record<string, unknown> | null
  sets: CommonCardSet[]
  images: CommonCardImage[]
  prices: CommonCardPrice[]
  /** Unmodified API response, kept as an immutable snapshot. */
  raw: unknown
}

/** One adapter per supported trading card game. */
export interface CardAdapter {
  readonly slug: string
  readonly displayName: string
  readonly languages: readonly string[]
  readonly defaultLanguage: string
  /** Languages whose texts are downloaded and stored for every card, in order of preference. */
  readonly storedLanguages: readonly string[]
  /** Hosts card images may be downloaded from. */
  readonly imageHosts: readonly string[]
  /** Whether search results may show small images loaded straight from the image host. */
  readonly searchThumbnails: boolean
  fetchCardById(externalId: string, language?: string): Promise<CommonCard | null>
  fetchCardByName(name: string, language?: string): Promise<CommonCard | null>
  /** Fuzzy search used by the "add card" lookup. */
  searchCards(query: string, language?: string): Promise<CommonCard[]>
  mapToCommonSchema(raw: unknown, language?: string): CommonCard
}
