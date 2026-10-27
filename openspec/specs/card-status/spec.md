# Card Status Specification

## Purpose
Life cycle of a card (active, sold, traded, gifted, lost) with date, counterpart and history. Decision: [ADR 0010](../../../docs/adr/0010-status-as-enum.md) (language-neutral enum).

## Requirements

### Requirement: Five status values
The system SHALL keep exactly one of the statuses active, sold, traded, gifted or lost for every card (new cards: active) and show them in the interface in the chosen language.
Source: README (7f3d955) §Features, §Data model; KONZEPT §Datenmodell; User instruction 2026-10-04 09:59 (concept); code shared/utils/status.ts | Origin: user requirement

#### Scenario: New card
- GIVEN a card is created
- WHEN it is saved
- THEN it has the status active and a first row in the status history

#### Scenario: Language neutral
- GIVEN a card is sold
- WHEN the interface is set to English
- THEN it shows "Sold"

### Requirement: Date and person
The system SHALL keep a date for every status except active (default: today) and a person for sold, traded and gifted; for lost and active a given person SHALL be discarded.
Source: Decision by the user (2026-10-23: date also for lost); code server/lib/status.ts; tests status.test.ts, cards.test.ts; KONZEPT §Datenmodell | Origin: user requirement

#### Scenario: Sold with a person
- GIVEN an active card
- WHEN it is saved as sold with the person "Max"
- THEN the history shows today's date and "Max"

#### Scenario: Lost with a person
- GIVEN an active card
- WHEN it is saved as lost with a person
- THEN the person is not stored

### Requirement: A status change creates a history row
The system SHALL append a new row to the status history on a status change (status, date, person, changing user) and record the change in the change log.
Source: Code server/services/cards.ts (update); test cards.test.ts (tracks status changes) | Origin: derived

#### Scenario: Change
- GIVEN an active card
- WHEN it is set to sold
- THEN the system appends a history row and writes an audit entry `status`

### Requirement: Correcting the current status
The system SHALL correct the date or person of the current (non-active) status in the last history row instead of creating a new one.
Source: Code server/services/cards.ts (update); test cards.test.ts (corrects date and person in place) | Origin: derived

#### Scenario: Correcting the date
- GIVEN a card is sold
- WHEN only the date is changed
- THEN the last history row is updated and no new one is created

### Requirement: An invalid date is rejected
The system SHALL reject a status date that is not a real calendar date in the format `YYYY-MM-DD`.
Source: Code server/lib/dates.ts, server/lib/schemas.ts; test cards.test.ts (rejects an invalid status date) | Origin: derived

#### Scenario: Not a date
- GIVEN a card is set to sold
- WHEN the date is `2026-13-40`
- THEN the system answers with a 400 error

### Requirement: Status display
The system SHALL mark the status by colour: active green, lost red, all others neutral.
Source: Code app/app/components/StatusBadge.vue (comment: after the UI mockups) | Origin: derived

#### Scenario: Badge
- GIVEN cards with the statuses active, lost and sold
- WHEN the overview is shown
- THEN they appear green, red and neutral
