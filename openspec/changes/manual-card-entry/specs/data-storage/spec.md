# Spec Delta

## MODIFIED Requirements

### Requirement: Card data is read-only
The system SHALL keep names, texts and attributes of a card from the card database read-only; only set code and edition or variant of the print (`card_sets`) SHALL be editable, `manual_overrides` is dropped. A manually entered card (without external ID) is not read-only, see `card-detail`.
Source: README (7f3d955) §Data model; User instruction 2026-11-07 (manual cards editable); code app/prisma/schema.prisma | Origin: derived

#### Scenario: Name
- GIVEN the detail page of a card from the card database is open
- WHEN the name is shown
- THEN it is not editable

## ADDED Requirements

### Requirement: A manually entered card has no external ID
The system SHALL store a manually entered card without external ID, without raw-data snapshots and without price rows, and SHALL treat a card without external ID as entered manually wherever the origin is shown.
Source: User instruction 2026-11-07 (existing display is enough); code app/prisma/schema.prisma (`external_id` nullable), app/server/services/export.ts (origin) | Origin: user requirement

#### Scenario: Stored parts
- GIVEN a card was entered manually
- WHEN its rows are read
- THEN `external_id` is empty and there are no `api_snapshots` and no `price_history` rows

#### Scenario: Origin
- GIVEN a card without external ID
- WHEN the card page header and the CSV export are shown
- THEN both say "entered manually"
