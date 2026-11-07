# Card Entry Specification

## Purpose
Adding single new cards: game choice, search in the card database (name, ID, set code, for Pokémon set and number), choice of print, edition or variant, and creating the card; for Yu-Gi-Oh! also entering a card by hand that the card database does not know. Adding a whole set is in `set-import`; data and errors of the card databases are in `game-adapters`. Decisions: [ADR 0023](../../../docs/adr/0023-card-data-sources-ygoprodeck-tcgdex.md) (data sources), [ADR 0020](../../../docs/adr/0020-remembered-state-in-cookies.md) (remembered state in cookies), [ADR 0025](../../../docs/adr/0025-manual-cards.md) (cards entered by hand).

## Requirements

### Requirement: Choose and remember the game when adding
The system SHALL require the choice of the game when adding a card and remember the last choice per browser in a cookie `cardkeeper-last-game` (1 year); an unknown game in the cookie falls back to the first game.
Source: User instruction 2026-10-05 18:57, 2026-10-06 07:31; README (7f3d955) §Features; test last-game.test.ts | Origin: user requirement

#### Scenario: Last choice
- GIVEN a user chooses Pokémon and creates a card
- WHEN they want to add another card
- THEN Pokémon is preselected

#### Scenario: Two browsers
- GIVEN two separate browser profiles
- WHEN one chooses Pokémon
- THEN the other keeps its own choice

### Requirement: Search by name or ID, German first
The system SHALL search by name or card number (Yu-Gi-Oh!: passcode, Pokémon: card ID such as `swsh3-136`) when adding a card without a language choice, first in German and only without a hit in English, and store both languages where available.
Source: User instruction 2026-10-04 19:40 (1)/(2); README (7f3d955) §Features; test cards.test.ts (lookup) | Origin: user requirement

#### Scenario: German hit
- GIVEN a card "Dunkler Magier"
- WHEN it is searched for
- THEN the search returns the German hit

#### Scenario: English name
- GIVEN the German name differs
- WHEN the English name is searched
- THEN the search finds the card through the English hit

#### Scenario: No hit
- GIVEN neither German nor English matches
- WHEN it is searched
- THEN the result list is empty

### Requirement: Result list with preview images
The system SHALL show the small image of a card in the result list and in the selection of the card, for Yu-Gi-Oh! from an own copy under `/api/thumbnails/ygo/<passcode>` (loaded once, at most 4 at the same time, browser cache one week), for Pokémon directly from `assets.tcgdex.net`.
Source: User instruction 2026-10-05 18:58 (question round), 2026-10-09 20:52; README (7f3d955) §Notes on the card API; test thumbnails.test.ts | Origin: user requirement

#### Scenario: YGO image
- GIVEN a hit in the Yu-Gi-Oh! search
- WHEN the image is shown
- THEN it comes from the app (never from YGOPRODeck)

#### Scenario: Image cannot be loaded
- GIVEN the image source does not answer
- WHEN the image is requested
- THEN the app answers with 404 and does not ask again for 60 seconds

### Requirement: Image only for numeric YGO passcodes
The system SHALL provide the preview image address only for games whose image host is not to be embedded, and only for valid card identifiers (1 to 40 characters of letters, digits, `.`, `_`, `-`).
Source: Code server/services/thumbnails.ts, server/api/thumbnails/**; test thumbnails.test.ts | Origin: derived

#### Scenario: Invalid ID
- GIVEN a request with an invalid identifier
- WHEN it arrives
- THEN the app answers with an error and loads nothing

### Requirement: Choice of the print
The system SHALL offer all known prints (set, rarity, for Yu-Gi-Oh! with codes of all languages) for choice on a hit and allow creating the card without a specific print too; a print that does not belong to the card is rejected (400 `invalid_set`).
Source: README (7f3d955) §Features; tests cards.test.ts (offers printings…, creates a card without a specific printing, rejects an unknown… printing) | Origin: derived

#### Scenario: German print
- GIVEN a print exists only in the German answer
- WHEN the card is chosen
- THEN it is offered

#### Scenario: Wrong print
- GIVEN a set code that does not exist
- WHEN the card is created with it
- THEN the system rejects it with `invalid_set`

### Requirement: Yu-Gi-Oh!: search by set code
The system SHALL recognise a text like `L5DD-ENA15` or `lob-en005` in the same search field as a set code (capital letters, codes without a language part such as `SDY-006` included), look up the print at YGOPRODeck (`cardsetsinfo.php`) and search like a name on failure.
Source: User instruction 2026-10-10 12:04; README (7f3d955) §Features; tests set-code.test.ts, ygo-adapter.test.ts | Origin: user requirement

#### Scenario: Set code
- GIVEN the card is in the set `L5DD`
- WHEN `L5DD-ENA15` is searched
- THEN the search returns the card of this print

#### Scenario: Not a code
- GIVEN a name with a hyphen and a number
- WHEN it is searched
- THEN it is searched as a name if the code finds nothing

### Requirement: Yu-Gi-Oh!: a code of another language falls back to English
The system SHALL search again with the same code in English (`L5DD-DEA15` → `L5DD-ENA15`) for a set code of another language (DE, FR, IT, PT, SP/ES, JP, KR and similar) that finds nothing.
Source: User instruction 2026-10-10 12:04 (only DE named); assistant 12:12 (extended to further languages, not objected to); test set-code.test.ts | Origin: user requirement

#### Scenario: German code
- GIVEN only the English print exists
- WHEN `L5DD-DEA15` is searched
- THEN the system finds the card through `L5DD-ENA15`

### Requirement: Yu-Gi-Oh!: the printed set code is stored
The system SHALL store the entered code if it belongs to the chosen (English) print; the print is preselected if it is the only one with this code, with several rarities the choice stays open; set and rarity come from the chosen print.
Source: User instruction 2026-10-10 12:29; README (7f3d955) §Features; test cards.test.ts (stores the code printed on the card…) | Origin: user requirement

#### Scenario: Unambiguous print
- GIVEN `L5DD-DEA15` leads to a single English print
- WHEN the card is created
- THEN the print is preselected and `L5DD-DEA15` is stored as the set code

#### Scenario: Several rarities
- GIVEN the code exists in several rarities
- WHEN the selection appears
- THEN "no specific print" (German interface: "Keine bestimmte Ausgabe") stays selected

#### Scenario: Foreign code
- GIVEN a printed code does not belong to the print
- WHEN the card is created
- THEN the system rejects it with `invalid_set_code`

### Requirement: Yu-Gi-Oh!: edition as a one-click choice
The system SHALL offer the editions "1st Edition" and "Limited Edition" next to the print as buttons when adding (a second click takes it back), activate them only after a print is chosen, and leave the edition empty without a choice (Unlimited).
Source: User instruction 2026-10-07 19:37, 2026-10-08 17:52 (buttons stay); README (7f3d955) §Features; test cards.test.ts | Origin: user requirement

#### Scenario: Choice
- GIVEN a print is chosen
- WHEN "1st Edition" is clicked
- THEN `FIRST_EDITION` is stored

#### Scenario: Without a choice
- GIVEN no button pressed
- WHEN the card is created
- THEN the edition is empty

### Requirement: Pokémon: choose a variant
The system SHALL require the choice of a variant among those that the card has according to the database (normal, reverse, holo, firstEdition, wPromo) when adding a Pokémon card, otherwise 400 `printing_required`.
Source: User instruction 2026-10-05 18:58 (question round "variant"); README (7f3d955) §Pokémon; test pokemon.test.ts | Origin: user requirement

#### Scenario: Without a variant
- GIVEN a Pokémon card without a variant
- WHEN it is to be created
- THEN the system rejects it with `printing_required`

### Requirement: Pokémon: search by set and number
The system SHALL offer for Pokémon the search by set and printed number: choose the language of the database, type the number (`040/088`), choose the set by name or logo and find the card through the number in the set; the part after the slash narrows the set list by the printed set size.
Source: User instruction 2026-10-05 19:48, 19:54; README (7f3d955) §Pokémon; tests pokemon.test.ts, pokemon-number.test.ts | Origin: user requirement

#### Scenario: Example Hippoterus
- GIVEN set `me03`, number `040/088`
- WHEN the card is searched
- THEN it is the card `me03-040`, with name, number, set and ID in the confirmation

#### Scenario: Set size
- GIVEN number `040/088`
- WHEN the set list is shown
- THEN it shows only sets with a printed size of 88

### Requirement: Pokémon: default language of the set choice
The system SHALL preset the language of the set choice to German (selectable: English, Japanese) and not remember the choice.
Source: User instruction 2026-10-07 10:47; README (7f3d955) §Pokémon; code app/app/components/PokemonSetPicker.vue | Origin: user requirement

#### Scenario: Opened again
- GIVEN the user chose English before
- WHEN the page is opened again
- THEN German is selected again

### Requirement: Pokémon: number with or without a slash
The system SHALL accept the card number with or without a slash and, for an evenly divisible digit sequence (3+3 or 4+4), add the slash at the latest when the field is left, remove spaces and ignore leading zeros when matching (`040` = `40`, `TG01` = `tg01`).
Source: User instruction 2026-10-07 11:02; README (7f3d955) §Pokémon; tests pokemon-number.test.ts | Origin: user requirement

#### Scenario: Without a slash
- GIVEN input `040088`
- WHEN the field is left
- THEN `040/088` is in the field

#### Scenario: Already with a slash
- GIVEN input `040/088`
- WHEN the field is left
- THEN it stays `040/088`

#### Scenario: Zeros
- GIVEN number `040` and a set list with `40`
- WHEN they are matched
- THEN they count as equal

### Requirement: Pokémon: the set choice shows only the logo
The system SHALL show only the logo of the set in the set choice (loaded lazily, falling back to PNG if the format is missing, otherwise an empty box), no set symbol.
Source: User instruction 2026-10-06 12:20, 13:08; 2026-10-07 10:47; README (7f3d955) §Pokémon; test image-fallback.test.ts | Origin: user requirement

#### Scenario: Logo
- GIVEN a set with a logo
- WHEN the set list appears
- THEN only the logo is loaded, no symbol

#### Scenario: Language
- GIVEN the user chooses English and opens the page again
- WHEN the choice appears
- THEN German is selected again

### Requirement: Set browser and set cache
The system SHALL deliver the set list and the cards of a set through `GET /api/sets` and `GET /api/sets/<id>`, cache them for six hours, allow logo addresses only from allowed hosts, and report 400 `sets_not_supported` for games without a set browser and 404 `set_not_found` for an unknown set.
Source: README (7f3d955) §Pokémon; code server/services/catalog.ts; test catalog.test.ts | Origin: derived

#### Scenario: Second request
- GIVEN the set list was just loaded
- WHEN it is requested again
- THEN it comes from the cache

#### Scenario: Game without a set browser
- GIVEN a game without a set browser
- WHEN the set list is requested
- THEN the system answers with `sets_not_supported`

### Requirement: Japanese Pokémon cards
The system SHALL keep Japanese cards through their own database and ID (`SV9-040`) as the third stored language, make them findable only through set and number or ID (no name search with Latin script), and store a Japanese-only card with Japanese text only.
Source: User instruction 2026-10-05 19:48, 19:55; README (7f3d955) §Pokémon; tests tcgdex-adapter.test.ts, pokemon.test.ts | Origin: user requirement

#### Scenario: Japanese only
- GIVEN a card only in the Japanese database
- WHEN it is created
- THEN it has only the Japanese text and DE/EN are not selectable

### Requirement: ß and ss in the search
The system SHALL treat "ss" and "ß" as equivalent in the search when adding (both games, name search and lookup by name) and query all spellings (at most 8; from four positions on only as typed, all "ß", all "ss"); hits appear once, those of the typed spelling first.
Source: User instruction 2026-10-09 19:19, 20:41; README (7f3d955) §Features; tests eszett.test.ts, cards.test.ts | Origin: user requirement

#### Scenario: weisser
- GIVEN the card is called "weißer Drache"
- WHEN "weisser" is searched
- THEN the search finds the card

#### Scenario: Without ss/ß
- GIVEN a text without "ss" and "ß"
- WHEN it is searched
- THEN there is no additional request

### Requirement: Create a card
The system SHALL store card, translations, print, prices, raw answers (snapshots), status history (active) and log entry `created` in one transaction when creating, make the creator the owner and take over an optional purchase date.
Source: README (7f3d955) §Features, §Data model; code server/services/cards.ts (create); test cards.test.ts | Origin: derived

#### Scenario: Create
- GIVEN a card is found
- WHEN it is created
- THEN all parts are stored and the creator is the owner

### Requirement: Creating: unknown card or unknown game
The system SHALL reject a card that does not exist at the card database with 404 `upstream_card_not_found` and an unknown game with 400 `unknown_game`, and register a game on first use.
Source: Code server/services/cards.ts, server/tcg/registry.ts; test cards.test.ts (registers the game…, rejects an unknown card, game…) | Origin: derived

#### Scenario: Unknown card
- GIVEN an identifier that does not exist
- WHEN it is created
- THEN the system answers with 404 `upstream_card_not_found`

#### Scenario: First time
- GIVEN the game was never used
- WHEN the first card is created
- THEN the game is registered and reused afterwards

### Requirement: Yu-Gi-Oh!: manual entry after an unsuccessful search
The system SHALL show a secondary button "Enter manually" (German "Manuell erfassen") next to the message "No card found" when a Yu-Gi-Oh! search by name, passcode or set code found nothing, and SHALL NOT show it after a search that failed with an error or before a search.
Source: User instruction 2026-11-07 (button below the message, secondary like the export button; only after an unsuccessful search); code app/app/pages/cards/new.vue | Origin: user requirement

#### Scenario: Nothing found
- GIVEN a Yu-Gi-Oh! search for `SDAZ-EN047` finds no card
- WHEN the message "No card found" appears
- THEN the button "Enter manually" is next to it and opens the form with `SDAZ-EN047` as the set code

#### Scenario: Search failed
- GIVEN the card database does not answer
- WHEN the error appears
- THEN there is no button "Enter manually"

#### Scenario: Name searched
- GIVEN a search for the text "Albaz der Verschleierte" finds nothing
- WHEN the button is used
- THEN the form opens with this text as the name

### Requirement: Manual card: required fields
The system SHALL require for a manually entered Yu-Gi-Oh! card the name (with its language, German preset) and the set code, make the owner the signed-in user and the status "active", and reject a request without name or set code with 400.
Source: User instruction 2026-11-07 (name and set code required; status and owner preset; purchase date optional); code app/server/lib/schemas.ts | Origin: user requirement

#### Scenario: Required fields
- GIVEN the form without a name
- WHEN the card is to be created
- THEN the system rejects it and the form points to the missing field

#### Scenario: Preset values
- GIVEN a user enters name and set code only
- WHEN the card is created
- THEN it is active, belongs to this user, has no purchase date and the name is stored in German

### Requirement: Manual card: optional fields
The system SHALL accept for a manually entered Yu-Gi-Oh! card the optional fields card type, type, attribute, level, ATK, DEF, description (in the language of the name), set name, rarity, edition and purchase date, store a field left empty as not present and reject the external ID.
Source: User instruction 2026-11-07 ("all fields except the external ID"; level, ATK, DEF may stay empty instead of "?"; purchase date stays optional) | Origin: user requirement

#### Scenario: Empty numbers
- GIVEN level, ATK and DEF are left empty
- WHEN the card is created
- THEN the card has no such attributes and the card page shows the fields empty

#### Scenario: External ID
- GIVEN a request that contains an external ID
- WHEN it is sent
- THEN the system rejects it with 400

### Requirement: Manual card: card type, type and attribute from the values of the card database
The system SHALL let the user choose card type, type and attribute only among the values that the card database uses (29 card types including `Token`; the types of monsters, spells and traps; the seven attributes), SHALL NOT offer a type `Token` and SHALL reject any other value with 400.
Source: User instruction 2026-11-07 ("no unsupported values"); YGOPRODeck API checked 2026-11-07 (card type `Token` exists, no type `Token`) | Origin: user requirement

#### Scenario: Token
- GIVEN the form
- WHEN the card type is opened
- THEN `Token` is one of the 29 choices

#### Scenario: Type without Token
- GIVEN the form
- WHEN the type is opened
- THEN there is no entry `Token` and the field may stay empty

#### Scenario: Unknown value
- GIVEN a request with the card type "Counter / Token"
- WHEN it is sent
- THEN the system rejects it with 400

### Requirement: Manual card: warning for an unusual set code
The system SHALL show a warning in the form whenever the set code does not look like a set code (`isSetCode`, for example `SDAZ-EN047`) and SHALL still allow saving; the code is stored in capital letters.
Source: User instruction 2026-11-07 ("warning, but allow saving"); code app/shared/utils/set-code.ts | Origin: user requirement

#### Scenario: Unusual format
- GIVEN the user types `Albaz 47` as the set code
- WHEN the field is left
- THEN a warning is shown and "Save" stays possible

#### Scenario: Usual format
- GIVEN the user types `sdaz-en047`
- WHEN the field is left
- THEN the field shows `SDAZ-EN047` and no warning

### Requirement: Creating a manual card
The system SHALL create a manually entered card (only for Yu-Gi-Oh!, otherwise 400 `manual_not_supported`) without a card database in one transaction with the translation in the chosen language, the print, the status history (active) and the log entry `created`, without external ID, snapshot and price.
Source: User instruction 2026-11-07; code app/server/services/cards.ts (create) | Origin: user requirement

#### Scenario: Creating
- GIVEN name "Albaz der Verschleierte", language German, set code `SDAZ-DE047`, card type `Token`
- WHEN the card is created
- THEN it exists without external ID, with one German translation, one print, the status history "active" and the log `created`

#### Scenario: Other game
- GIVEN a request for a Pokémon card without a card database
- WHEN it is sent
- THEN the system rejects it with 400 `manual_not_supported`

### Requirement: Deck use of a new Yu-Gi-Oh! card
The system SHALL mark a new Yu-Gi-Oh! card from the card database as for the deck unless its card type is `Token` or `Skill Card`, mark a manually entered card as not for the deck unless the user switches it on, and apply the rule of the card database when a whole set is added.
Source: User instruction 2026-11-07 (answers 1 to 4); YGOPRODeck API checked 2026-11-07 (no deck field; card types Token, Skill Card); code app/server/services/cards.ts | Origin: user requirement

#### Scenario: Normal card
- GIVEN the card "Dark Magician" from the card database
- WHEN it is added
- THEN it is for the deck

#### Scenario: Token from the card database
- GIVEN a card of the card type `Token`, or `Skill Card`, from the card database
- WHEN it is added, alone or with a whole set
- THEN it is not for the deck

#### Scenario: Manual card
- GIVEN a card entered by hand
- WHEN it is created without touching the switch
- THEN it is not for the deck

### Requirement: Manual card: switch for the deck
The system SHALL offer in the form for a manually entered Yu-Gi-Oh! card, below the description, the switch "Use for deck", off by default, with the hint that tokens and skill cards cannot be in a deck.
Source: User instruction 2026-11-07 (answer 4: switch below the description; manual cards excluded by default); code app/app/components/ManualCardForm.vue | Origin: user requirement

#### Scenario: Default
- GIVEN the form for a card entered by hand
- WHEN it opens
- THEN the switch is off

#### Scenario: Switched on
- GIVEN a real card that the card database lacks
- WHEN the user switches "Use for deck" on and saves
- THEN the card is for the deck
