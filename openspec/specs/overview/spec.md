# Overview Specification

## Purpose
The overview of the collection: list of cards with game choice, filters, search, sort order, totals and the remembered state. Paging on the detail page is in `card-paging`, export in `export`, prices in `prices`. Decisions: [ADR 0014](../../../docs/adr/0014-overview-filtering-in-memory.md) (filter in memory), [ADR 0020](../../../docs/adr/0020-remembered-state-in-cookies.md) (cookies).

## Requirements

### Requirement: Game choice with "All games" as the default
The system SHALL show one game or all games in the overview (chips "All games" and one per game), all on the first visit, afterwards the last choice of the browser (cookie `cardkeeper-overview-game`); a game in the address takes precedence, an unknown one is ignored, with only one game that game is shown.
Source: User instruction 2026-10-06 13:08 (2); README (7f3d955) §Features; test last-game.test.ts | Origin: user requirement

#### Scenario: First visit
- GIVEN no cookie
- WHEN the overview is opened
- THEN it shows all games

#### Scenario: Last choice
- GIVEN the user chose Pokémon
- WHEN they open the overview again
- THEN Pokémon is chosen

#### Scenario: Address
- GIVEN `?game=pokemon`
- WHEN the overview is opened
- THEN Pokémon applies, without changing the remembered choice

### Requirement: Filters per game
The system SHALL offer filters for status and owner and own filters per game (Yu-Gi-Oh!: card type, monster type, attribute, rarity, level; Pokémon: category, type, stage, rarity, variant, HP) with selection lists from the collection; game-related filters are reset when the game is switched.
Source: User instruction 2026-10-04 19:40 (7), 2026-10-05 18:57/18:58; README (7f3d955) §Features; test cards.test.ts (facets, filters) | Origin: user requirement

#### Scenario: Card type
- GIVEN cards with different card types
- WHEN filtered by "Normal Monster"
- THEN only these cards remain

#### Scenario: Game switch
- GIVEN a level filter is set
- WHEN switched to Pokémon
- THEN the level filter is reset

### Requirement: Uniform filter values regardless of the language
The system SHALL always keep card type, monster type, attribute and the Pokémon values (category, type, stage) for filtering and sorting in one spelling, namely from the English answer, and show them translated in the selection lists.
Source: User instruction 2026-10-05 17:18; assistant 2026-10-05 17:22; README (7f3d955) §Pokémon; test translations.test.ts | Origin: user requirement

#### Scenario: German answer
- GIVEN the German answer names different values
- WHEN a card is stored
- THEN the stored values are the English ones

### Requirement: Search across names of all languages, codes and sets
The system SHALL run the search of the overview against card names in all stored languages, the card identifier (exact), the set code and the set name, case-insensitively.
Source: User instruction 2026-10-04 19:40, 2026-10-21 04:40; decision by the user (2026-10-23: no error, owner filter); README (7f3d955) §Features; test cards.test.ts | Origin: user requirement

#### Scenario: English title
- GIVEN a card "Dunkler Magier" / "Dark Magician"
- WHEN "Dark Magician" is searched
- THEN the card is found

#### Scenario: Set
- GIVEN the set name "Legend of Blue Eyes"
- WHEN it is searched
- THEN the cards of this set are found

### Requirement: Search together with the filters
The system SHALL combine the search with all other filters (all conditions apply at the same time), work with ß/ss variants and apply the input only after a short pause.
Source: User instruction 2026-10-21 04:40 (filters taken into account), 2026-10-09 20:41; code app/app/pages/index.vue; test cards.test.ts (applies the other filters…) | Origin: user requirement

#### Scenario: With a filter
- GIVEN an owner filter is set
- WHEN it is searched
- THEN search and filter apply together

#### Scenario: ß/ss
- GIVEN the collection has a card "weißer Drache"
- WHEN "weisser" is searched
- THEN it is found

### Requirement: Sort selection
The system SHALL sort by recently added (default, newest first), name, level (Yu-Gi-Oh!/all games), HP (Pokémon/all games), purchase date and price (latest price of the `PRICE_SOURCE`) ascending and descending, across all pages, with the sort order in the address.
Source: User instruction 2026-10-05 17:18, 18:57; README (7f3d955) §Features; code shared/utils/sorting.ts; tests cards.test.ts, card-sort.test.ts | Origin: user requirement

#### Scenario: Default
- GIVEN no sort order chosen
- WHEN the overview appears
- THEN the newest cards come first

#### Scenario: Across pages
- GIVEN more cards than one page
- WHEN sorted by price
- THEN the order applies across all pages

### Requirement: Cards without a value last
The system SHALL show cards without a value for the chosen sort order (no level, no purchase date, no price) at the end in both directions.
Source: User instruction 2026-10-05 17:22; code server/lib/card-sort.ts; test card-sort.test.ts | Origin: user requirement

#### Scenario: Without a level
- GIVEN a spell card without a level
- WHEN sorted by level ascending or descending
- THEN it is at the end

### Requirement: Sort order in detail
The system SHALL sort names in German and case-insensitively ("Ärger" with "A", "Karte 2" before "Karte 10") and order ties by name, then by ID.
Source: User instruction 2026-10-05 17:22; code server/lib/card-sort.ts; test card-sort.test.ts | Origin: derived

#### Scenario: Numbers
- GIVEN cards "Karte 2" and "Karte 10"
- WHEN sorted by name
- THEN "Karte 2" comes before "Karte 10"

### Requirement: Pages and summary
The system SHALL deliver the cards in pages (default 48, at most 200) and keep a summary over all hits: count, number of active cards and total value of the active cards per currency (latest price of the `PRICE_SOURCE`).
Source: README (7f3d955) §Features; code server/lib/schemas.ts, server/services/cards.ts; test cards.test.ts | Origin: derived

#### Scenario: Total
- GIVEN three active cards with prices and one sold
- WHEN the summary is calculated
- THEN the total value counts only the three active cards

#### Scenario: Several pages
- GIVEN more hits than one page
- WHEN page 2 is requested
- THEN the summary still covers all hits

### Requirement: The owner filter is the own person by default
The system SHALL show the cards of the signed-in user without an owner in the address; "All owners" is `owner=all` in the address, `owner=none` shows cards without an owner.
Source: User instruction 2026-10-20 09:09; README (7f3d955) §Features; code shared/utils/overview-query.ts; test overview-query.test.ts | Origin: user requirement

#### Scenario: After the login
- GIVEN Anna signs in
- WHEN she opens the overview
- THEN she sees only her cards

#### Scenario: All
- GIVEN `?owner=all`
- WHEN the overview appears
- THEN it shows all cards

### Requirement: Filters and sort order are kept
The system SHALL remember filters, sort order and page of the overview in a session cookie `cardkeeper-overview-query` and restore them on every call of `/` without parameters until the next login or logout; afterwards the default filters apply.
Source: User instruction 2026-10-20 09:09; README (7f3d955) §Features; code app/app/middleware/overview-query.global.ts, app/app/composables/useAuth.ts | Origin: user requirement

#### Scenario: Back to the overview
- GIVEN a user filtered and opened a card
- WHEN they choose "To the overview" or the menu item
- THEN the overview shows the same filters

#### Scenario: New sign-in
- GIVEN a user signs out and signs in
- WHEN they open the overview
- THEN the default filters apply again

### Requirement: Reset filters
The system SHALL remove all filters on "Reset filters" while keeping game and sort order, but set the owner filter to "All owners".
Source: User instruction 2026-10-20 09:09 (interpretation by the assistant); code app/app/pages/index.vue (resetFilters); test overview-query.test.ts | Origin: derived

#### Scenario: Reset
- GIVEN owner and status filters and a sort order are set
- WHEN "Reset filters" is clicked
- THEN only game and sort order are kept and "All owners" is chosen

### Requirement: Tiles of the overview
The system SHALL show every card as a tile with image (or placeholder), name, set code and price, status mark and owner, with "All games" additionally the game name, and for an empty selection with filters "No hits", without filters a prompt to add the first card.
Source: README (7f3d955) §Features; code app/app/components/CardTile.vue, app/app/pages/index.vue | Origin: derived

#### Scenario: Empty collection
- GIVEN no cards and no filters
- WHEN the overview appears
- THEN there is a button "Add card"

### Requirement: Users page
The system SHALL offer a page "Users" with all users and the number of their cards, linked to the overview with the owner filter of this user; the own name is marked.
Source: Code app/app/pages/users.vue, server/api/users.get.ts; test users.test.ts (list) | Origin: derived

#### Scenario: Cards of Max
- GIVEN Max owns 3 cards
- WHEN "3 cards" is clicked
- THEN the overview shows his cards (all games)
