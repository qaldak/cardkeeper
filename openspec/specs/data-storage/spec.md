# Data Storage Specification

## Purpose
Data model invariants of the collection: read-only card data, translations, raw-data snapshots, audit log and edition keys including the startup check. Decisions: [ADR 0003](../../../docs/adr/0003-postgresql-prisma.md), [ADR 0005](../../../docs/adr/0005-game-attributes-as-jsonb.md), [ADR 0006](../../../docs/adr/0006-texts-per-language.md), [ADR 0010](../../../docs/adr/0010-status-as-enum.md), [ADR 0011](../../../docs/adr/0011-editions-as-keys.md).

## Requirements

### Requirement: Tables
The system SHALL keep the collection in the tables `games`, `cards` (one row per physical card), `card_sets`, `card_translations`, `price_history`, `status_history`, `users`, `api_snapshots`, `card_images`, `audit_log` and `price_refresh_runs`.
Source: README §Data model; code app/prisma/schema.prisma | Origin: derived

#### Scenario: Card
- GIVEN a card that was entered
- WHEN it is saved
- THEN there is a row in `cards` and one per language in `card_translations`

### Requirement: Game-specific values as JSONB
The system SHALL store game-specific values in `cards.game_specific_attributes` (JSONB).
Source: KONZEPT §Datenmodell (confirmed by the user 2026-10-23); README §Data model | Origin: user requirement

#### Scenario: New game
- GIVEN a new game
- WHEN it is added
- THEN no schema change is needed

### Requirement: Texts per language
The system SHALL store language-dependent texts in `card_translations` (one row per card and language); `cards.name` SHALL be the display name in the preferred language.
Source: README §Data model | Origin: derived

#### Scenario: Display name
- GIVEN a card with a German and an English name
- WHEN it is read
- THEN `cards.name` is the German name

### Requirement: Card data is read-only
The system SHALL keep names, texts and attributes read-only; only set code and edition or variant of the print (`card_sets`) SHALL be editable, `manual_overrides` is dropped.
Source: README §Data model; code app/prisma/schema.prisma | Origin: derived

#### Scenario: Name
- GIVEN the detail page of a card is open
- WHEN the name is shown
- THEN it is not editable

### Requirement: Status as a key
The system SHALL store the status as a language-neutral enum (`ACTIVE`, `SOLD`, `TRADED`, `GIFTED`, `LOST`) and translate it in the interface.
Source: README §Data model; code app/prisma/schema.prisma | Origin: derived

#### Scenario: Display
- GIVEN status `SOLD` and the interface in German
- WHEN the card is shown
- THEN it says "Verkauft"

### Requirement: Editions as keys
The system SHALL store the printed Yu-Gi-Oh! editions as the keys `FIRST_EDITION` and `LIMITED_EDITION`; "Unlimited" SHALL be NULL.
Source: User instruction 2026-10-08 17:42–18:18; README §Data model | Origin: user requirement

#### Scenario: Unlimited
- GIVEN a card without an edition imprint
- WHEN it is saved
- THEN the edition is NULL

### Requirement: Startup check of the editions
The system SHALL report at startup in the log (`[editions] …`) the edition values that do not correspond to a key, with an `UPDATE` to copy; such values SHALL remain unchanged.
Source: User instruction 2026-10-08 18:18 ("other values stay… log entry in the Docker container"); code app/server/plugins/editions.ts | Origin: user requirement

#### Scenario: Foreign value
- GIVEN a card with the edition "Sonder"
- WHEN the application starts
- THEN the log reports the value and leaves it

### Requirement: Immutable raw data
The system SHALL store the unchanged answer of the card database per fetch and language in `api_snapshots` without changing it later.
Source: README §Data model ("immutable raw API responses") | Origin: derived

#### Scenario: Update
- GIVEN a card is updated
- WHEN the answer arrives
- THEN another snapshot is appended

### Requirement: Audit log and "modified on"
The system SHALL record changes by users in the audit log (old and new value) and show "modified on" only after a user has changed something; a refresh from the API does not count.
Source: User instruction 2026-10-04 19:40 ("'modified on' + date"); README §Features; code app/server/services/cards.ts | Origin: user requirement

#### Scenario: Refresh
- GIVEN a card is only updated from the API
- WHEN it is shown
- THEN "modified on" is not there

#### Scenario: Same value
- GIVEN a user saves unchanged values
- WHEN they save
- THEN no audit row is created

### Requirement: Image files in the volume
The system SHALL store image files in the volume `card-images` and store only relative paths in `card_images`.
Source: README §Data model; code app/server/lib/image-files.ts | Origin: derived

#### Scenario: Image
- GIVEN a stored image
- WHEN the row is read
- THEN the path is relative
