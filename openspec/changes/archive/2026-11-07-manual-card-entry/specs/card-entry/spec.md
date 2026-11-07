# Spec Delta

## ADDED Requirements

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
