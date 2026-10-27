# Game Adapters Specification

## Purpose
Card games as exchangeable adapters: registration, contract, data and languages of Yu-Gi-Oh! (YGOPRODeck) and Pokémon (TCGdex) as well as the behaviour on errors of the card databases. Decisions: [ADR 0004](../../../docs/adr/0004-adapter-pattern-per-game.md), [ADR 0005](../../../docs/adr/0005-game-attributes-as-jsonb.md), [ADR 0023](../../../docs/adr/0023-card-data-sources-ygoprodeck-tcgdex.md).

## Requirements

### Requirement: Several games through adapters
The system SHALL keep Yu-Gi-Oh! and Pokémon in one collection; a further game SHALL be addable through an adapter (`fetchCardById`, `fetchCardByName`, `searchCards`, `mapToCommonSchema`) and an entry in `server/tcg/registry.ts` without changing the core schema and core services.
Source: README §Adding a game; KONZEPT §Multi-TCG (confirmed by the user 2026-10-23); code app/server/tcg/types.ts, registry.ts | Origin: user requirement

#### Scenario: New game
- GIVEN a new adapter is registered
- WHEN a card of the game is entered
- THEN no schema change is needed, the game-specific values are in JSONB

### Requirement: Game behaviour per print
The system SHALL describe the behaviour of a game for the print (set code and edition or variant) in `shared/utils/game-config.ts`.
Source: README §Pokémon, §Adding a game; code app/shared/utils/game-config.ts | Origin: derived

#### Scenario: Print
- GIVEN a game with variants
- WHEN a print is chosen
- THEN the rules of the game configuration apply

### Requirement: Languages of the adapters
The system SHALL store German and English for Yu-Gi-Oh!, additionally Japanese for Pokémon, and use the first available one in the order de, en, ja as the display name.
Source: User instruction 2026-10-05 19:48/19:55 (Japanese as the third language); code app/server/tcg/*/adapter.ts, app/shared/utils/languages.ts | Origin: user requirement

#### Scenario: Display name
- GIVEN a Pokémon card with a German and an English name
- WHEN it is shown
- THEN the German name is the display name

### Requirement: Pokémon data model
The system SHALL separate for Pokémon language-independent values (`PokemonAttributes`, from the English answer) and language-dependent ones (`PokemonDetails`); the print is the card ID, the variant (`normal`, `reverse`, `holo`, `firstEdition`, `wPromo`) is selectable among the existing ones.
Source: User instruction 2026-10-05 18:57/18:58 ("explicit data model", "variant"); README §Pokémon | Origin: user requirement

#### Scenario: Variant
- GIVEN a card that exists only as holo
- WHEN the variant is chosen
- THEN only holo is available

### Requirement: Japanese cards
The system SHALL keep Japanese cards from the own TCGdex database, findable only through set and number or ID; categories, types and stages SHALL be mapped to the English spelling.
Source: User instruction 2026-10-05 19:48, 19:55; README §Pokémon | Origin: user requirement

#### Scenario: Japanese
- GIVEN the set of a Japanese card is chosen
- WHEN the number is entered
- THEN the card is found

### Requirement: Images only from declared hosts
The system SHALL load images only from the hosts declared by the adapter; a YGO hit loads only YGO images, a Pokémon hit only TCGdex images.
Source: User instruction 2026-10-08 17:52 ("always fetched a Pokémon image"); README §Notes on the card API; test api-calls.test.ts | Origin: user requirement

#### Scenario: YGO hit
- GIVEN a Yu-Gi-Oh! hit is entered
- WHEN the image is loaded
- THEN it comes from YGOPRODeck

### Requirement: Size of the result list
The system SHALL limit the search to at most 25 hits for Yu-Gi-Oh! and at most 50 for Pokémon.
Source: Code app/server/tcg/ygo/adapter.ts, tcgdex/adapter.ts (`MAX_SEARCH_RESULTS`); README §Notes on the card API | Origin: derived

#### Scenario: Broad name
- GIVEN a name with very many cards
- WHEN it is searched
- THEN at most 25 (YGO) or 50 (Pokémon) hits appear

### Requirement: Errors of the card database
The system SHALL treat on an HTTP 400 answer of YGOPRODeck only "No card matching" as an empty result and all others as error 502 `upstream_error` with the text.
Source: User instruction 2026-10-04 20:47 (check error handling according to the API); README §Notes on the card API; code app/server/tcg/ygo/adapter.ts | Origin: user requirement

#### Scenario: No hits
- GIVEN "No card matching"
- WHEN it is searched
- THEN the result list is empty

#### Scenario: Other error
- GIVEN HTTP 400 with another text
- WHEN it is searched
- THEN error 502 appears with the text

### Requirement: Reachability and limit
The system SHALL report an unreachable card database as 502 `upstream_unreachable`, an unexpected answer as 502 `upstream_invalid_response` and a limit of requests as 429 `upstream_rate_limited`.
Source: User instruction 2026-10-10 21:15 (limit up to the user); code app/server/tcg/ygo/adapter.ts, tcgdex/adapter.ts | Origin: derived

#### Scenario: Limit
- GIVEN TCGdex refuses further requests
- WHEN a card is updated
- THEN 429 `upstream_rate_limited` is returned

### Requirement: Tolerant reading of the Yu-Gi-Oh! data
The system SHALL leave out unexpected field values of a YGO card and log once, and reject only a card without ID or name with 502 `upstream_invalid_response`.
Source: User instruction 2026-10-08 19:03/19:07/19:13 (link card with `def: null`); code app/server/tcg/ygo/mapper.ts | Origin: user requirement

#### Scenario: Link card
- GIVEN a card with `def: null`
- WHEN it is entered
- THEN it is entered without the value

### Requirement: Untranslated card
The system SHALL recognise an English copy on a German request and not store it as a German translation.
Source: README §Notes on the card API; code app/server/tcg/ygo/adapter.ts | Origin: derived

#### Scenario: English only
- GIVEN the API delivers the English text on a German request
- WHEN the card is entered
- THEN no German translation is stored
