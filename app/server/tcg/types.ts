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
  /**
   * For games whose image host asks not to be hotlinked: the url of the small image of a card, which the app downloads
   * once, keeps, and shows from its own address in the "add card" lookup. `null` if the card has none.
   */
  thumbnailSource?(externalId: string): string | null
  fetchCardById(externalId: string, language?: string): Promise<CommonCard | null>
  fetchCardByName(name: string, language?: string): Promise<CommonCard | null>
  /** Fuzzy search used by the "add card" lookup. */
  searchCards(query: string, language?: string): Promise<CommonCard[]>
  mapToCommonSchema(raw: unknown, language?: string): CommonCard
  /** Sets of the game, for games whose cards are easier to find by set and number than by name. */
  listSets?(language?: string): Promise<GameSet[]>
  /** Cards of one set; null if the set does not exist. */
  listSetCards?(setId: string, language?: string): Promise<SetCard[] | null>
}

/** A set (expansion) as listed by a game's database. */
export interface GameSet {
  id: string
  name: string
  logoUrl: string | null
  /** Size of the set as printed on the cards. */
  official: number | null
  total: number | null
  /** The code the cards of the set start with ("SDAZ"), if the database knows it. */
  code?: string | null
  /** Release date as the database writes it ("2021-12-03"). */
  releasedAt?: string | null
}

/** One print of a card in a set: the code on the card and its rarity. */
export interface SetCardPrint {
  setCode: string
  rarity: string | null
}

/** A card in a set. */
export interface SetCard {
  id: string
  /** Number in the set as stored by the database, e.g. "040". */
  number: string
  name: string
  imageUrl: string | null
  thumbnailUrl: string | null
  /** The prints of the card in this set (one code, usually in one rarity); only for games that list them. */
  prints?: SetCardPrint[]
}
