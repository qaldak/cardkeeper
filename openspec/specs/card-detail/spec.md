# Card Detail Specification

## Purpose
The detail page of a card: texts in several languages, the few editable fields, updating from the card database, deleting and display of changes. Status is in `card-status`, images in `images`, price history in `prices`, paging in `card-paging`. Decisions: [ADR 0006](../../../docs/adr/0006-texts-per-language.md) (texts per language), [ADR 0011](../../../docs/adr/0011-editions-as-keys.md) (editions).

## Requirements

### Requirement: Texts in several languages with a switch
The system SHALL show the texts of a card in German and English (Pokémon also Japanese) with a language switch, choose German first when present, and make a language that the card does not have not selectable.
Source: User instruction 2026-10-04 19:40 (3), 2026-10-05 18:57; README §Features; code app/app/pages/cards/[id].vue | Origin: user requirement

#### Scenario: German first
- GIVEN a card with German and English text
- WHEN the detail page is opened
- THEN German is selected

#### Scenario: Missing language
- GIVEN a card with English text only
- WHEN the detail page is opened
- THEN the German choice is not possible

### Requirement: Data from the card database is read-only
The system SHALL show names, texts and attributes of a card read-only and allow only set code and edition (for Pokémon the variant) as editable card data, without a label "editable".
Source: User instruction 2026-10-04 19:40 (5), 2026-10-05 17:18; README §Data model; code server/lib/schemas.ts | Origin: user requirement

#### Scenario: Changing the name
- GIVEN a change call contains a name
- WHEN it is sent
- THEN the system rejects it (only `set`, `ownerId`, `purchaseDate` and status are allowed)

### Requirement: Set code and edition apply to all languages
The system SHALL apply changes to set code and edition to all languages of the card, because they describe the physical card (e.g. German or Japanese prints).
Source: User instruction 2026-10-04 19:40 (5); README §Data model | Origin: user requirement

#### Scenario: German print
- GIVEN a card with an English set code
- WHEN the set code is changed to `LOB-DE005`
- THEN the code applies in German and English

### Requirement: Set code in capital letters
The system SHALL convert the input in the set code field to capital letters at once, without moving the cursor.
Source: User instruction 2026-10-08 18:18 ("always UPPERCASE"); code app/app/pages/cards/[id].vue (upperCaseSetCode) | Origin: user requirement

#### Scenario: Lower case
- GIVEN the set code field is empty
- WHEN `lob-005` is typed
- THEN the field shows `LOB-005`

### Requirement: Edition for Yu-Gi-Oh!
The system SHALL offer the edition on the card page as a dropdown with "1st Edition" and "Limited Edition", allow clearing the value with a ✕ (Unlimited = empty), contain no free text field and no entry "no imprint", and keep an already stored foreign text visible as an additional entry.
Source: User instruction 2026-10-08 17:42, 17:52, 18:13; README §Data model; code app/app/pages/cards/[id].vue | Origin: user requirement

#### Scenario: Clearing
- GIVEN a card with "1st Edition"
- WHEN the ✕ is clicked and saved
- THEN the edition is empty and the placeholder "no edition" appears

#### Scenario: Foreign text
- GIVEN a card with the edition "Special Edition"
- WHEN the page is opened
- THEN "Special Edition" appears as a third entry and is not lost on saving

### Requirement: Variant for Pokémon
The system SHALL offer the variant for Pokémon cards only among the variants that the card has according to the database (and the stored one) and reject another with 400 `invalid_variant`; the card ID is not changeable (400 `field_not_editable`).
Source: User instruction 2026-10-05 18:58 (question round), 2026-10-10 20:33; README §Pokémon; code server/services/cards.ts | Origin: user requirement

#### Scenario: Only one variant
- GIVEN a card that exists only as holo
- WHEN the detail page is opened
- THEN the dropdown offers only holo (no change wanted)

#### Scenario: Unknown variant
- GIVEN a card without the variant `firstEdition`
- WHEN it is set through the API
- THEN the system rejects it with `invalid_variant`

### Requirement: Saving with a change log
The system SHALL apply changes to set code, edition, owner, purchase date and status through "Save", record every changed property with old and new value in the change log, and for unchanged values log nothing and not set "modified on".
Source: Code server/services/cards.ts (update); tests cards.test.ts (does nothing…), ownership.test.ts | Origin: derived

#### Scenario: Change
- GIVEN a card with set code `LOB-005`
- WHEN it is changed to `LOB-DE005`
- THEN the change log contains `set.setCode` with old and new value and `userModifiedAt` is set

#### Scenario: No change
- GIVEN unchanged values
- WHEN it is saved
- THEN no log entry is created

### Requirement: Note "modified on"
The system SHALL show "modified on" with the date in the header of the card after the origin ("taken from API" or "entered manually") as soon as a user has changed something; updating from the API does not count.
Source: User instruction 2026-10-04 19:40 (4); README §Features; code app/app/pages/cards/[id].vue | Origin: user requirement

#### Scenario: After a change
- GIVEN a user changes the edition
- WHEN the card is opened
- THEN the header shows "taken from API · modified on <date>"

#### Scenario: After a refresh
- GIVEN a card is only updated
- WHEN it is opened
- THEN "modified on" is missing

### Requirement: Updating from the card database
The system SHALL reload texts, attributes and prices in all stored languages on "Update from API" and leave set code, edition, status, owner, purchase date and images unchanged.
Source: User instruction 2026-10-04 19:40 (6); README §Features; test cards.test.ts (refresh) | Origin: user requirement

#### Scenario: Data changed
- GIVEN the database has a new text
- WHEN the card is updated
- THEN it shows the new text and the user data remain

#### Scenario: New language
- GIVEN a language becomes available
- WHEN it is updated
- THEN it is added

#### Scenario: Language missing
- GIVEN the database no longer delivers a language
- WHEN it is updated
- THEN the stored text remains

### Requirement: Updating only for linked cards
The system SHALL reject updating for cards without a link to the card database (400 `no_external_id`) or that no longer exist there (404 `upstream_card_not_found`), load an API image only if the card has none yet, and write the log `refreshed`.
Source: Code server/services/cards.ts (refresh); test cards.test.ts | Origin: derived

#### Scenario: Without a link
- GIVEN a manually entered card
- WHEN it is to be updated
- THEN the system answers with `no_external_id`

### Requirement: Delete a card
The system SHALL delete a card on confirmation together with translations, histories, snapshots and images (also the files) and record it in the change log with the card name; only the owner may delete.
Source: Code server/services/cards.ts (remove), app/app/pages/cards/[id].vue; test cards.test.ts (remove) | Origin: derived

#### Scenario: Delete
- GIVEN a card with images and history
- WHEN the owner confirms deleting
- THEN card, histories and image files are gone and `deleted` is logged with the name

### Requirement: The first change of a card without a print creates the print
The system SHALL treat the first change of set code or edition on a card without a print as creating the print and require a set code for it where it is editable (otherwise 400 `invalid_set`).
Source: Code server/services/cards.ts (update); test cards.test.ts | Origin: derived

#### Scenario: Without a print
- GIVEN a card without a print
- WHEN the edition is set but no set code
- THEN the system rejects it with `invalid_set`

### Requirement: The description field grows with the text
The system SHALL let the description field grow with the text from 3 up to at most 6 lines and scroll after that.
Source: User instruction 2026-10-20 09:09 (Yu-Gi-Oh!); extension to both games confirmed on 2026-10-23; code app/app/pages/cards/[id].vue | Origin: user requirement

#### Scenario: Long text
- GIVEN a description of 30 lines
- WHEN the card is opened
- THEN the field shows 6 lines and scrolls

#### Scenario: Short text
- GIVEN a short description
- WHEN the card is opened
- THEN the field shows 3 lines

### Requirement: Pokémon details
The system SHALL show the language-dependent values of Pokémon cards (category, types, stage, attacks, abilities, weakness, resistance, effect) read-only in the chosen language and fall back to the English spellings for the attribute values.
Source: README §Pokémon; code app/app/components/PokemonInfo.vue | Origin: derived

#### Scenario: Attacks
- GIVEN a Pokémon card with attacks
- WHEN the detail page is opened
- THEN the attacks appear with cost, damage and effect in the chosen language

### Requirement: Unknown card
The system SHALL return 404 `card_not_found` for a card that does not exist and the interface SHALL show an error page with a back button.
Source: Code server/services/cards.ts (get), app/app/error.vue; test cards.test.ts | Origin: derived

#### Scenario: Wrong ID
- GIVEN there is no card 9999
- WHEN `/cards/9999` is opened
- THEN the app shows the error page "404"
