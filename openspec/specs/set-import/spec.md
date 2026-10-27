# Set Import Specification

## Purpose
Adding all cards of a set in one pass (wizard), for Yu-Gi-Oh! and Pokémon. Only unclear cards require a decision. Single cards are in `card-entry`.

## Requirements

### Requirement: Wizard "Whole set"
The system SHALL offer the tab "Whole set" when adding cards (Yu-Gi-Oh!: next to "Single card"; Pokémon: next to "By set and number" and "By name or ID") with the steps choose the set, check the cards, add.
Source: User instruction 2026-10-10 12:56, 19:56; README §Features; code app/app/components/SetImportWizard.vue | Origin: user requirement

#### Scenario: Searching a set
- GIVEN the set list (newest first)
- WHEN the user enters "Albaz"
- THEN "Structure Deck: Albaz Strike" appears with code, number of cards and date

### Requirement: Yu-Gi-Oh!: the language determines the set code
The system SHALL let the user choose in the Yu-Gi-Oh! wizard the language of the cards (German, English, Japanese) in which the set codes are stored (e.g. `SDAZ-DE001`), and show the codes in this language in the table.
Source: User instruction 2026-10-10 12:56; README §Features; code shared/utils/set-import.ts (importBody) | Origin: user requirement

#### Scenario: German codes
- GIVEN set SDAZ, language German
- WHEN the cards are checked
- THEN the table shows `SDAZ-DE001` and stores this code

### Requirement: Edition once for the set, changeable per card
The system SHALL let the user choose in the Yu-Gi-Oh! wizard the edition (1st Edition, Limited Edition, none = Unlimited) once for the whole set and store it changeable per card.
Source: User instruction 2026-10-10 12:56 ("stored per card"); README §Features | Origin: user requirement

#### Scenario: Set edition
- GIVEN "1st Edition" for the set
- WHEN one card is set to "Limited Edition"
- THEN this card gets the Limited Edition and the others the 1st Edition

### Requirement: Clear or unclear
The system SHALL treat a row as clear when the card has exactly one print in the set or the Pokémon variant chosen for the whole set occurs exactly once, and as a conflict when several prints remain (Yu-Gi-Oh!: a code in several rarities or several codes).
Source: README §Features; code shared/utils/set-import.ts; test set-import.test.ts | Origin: derived

#### Scenario: Only print
- GIVEN a card with one print
- WHEN the set is loaded
- THEN its print is chosen

#### Scenario: Several rarities
- GIVEN a code in two rarities
- WHEN the set is loaded
- THEN the card is a conflict and the user has to choose

### Requirement: Only conflicts are visible by default
The system SHALL show only the conflict cards (marked yellow) by default after the set is chosen, summarise the number of unambiguous cards and make the complete list expandable for deselecting single cards; a decided card SHALL NOT disappear from the list.
Source: User instruction 2026-10-10 13:24; README §Features; test set-import.test.ts (visibleRows) | Origin: user requirement

#### Scenario: Without conflicts
- GIVEN a set without conflicts
- WHEN it is loaded
- THEN it says "All cards are unambiguous" and adding is possible at once

#### Scenario: Deselecting
- GIVEN the complete list is open
- WHEN the user deselects cards
- THEN these are not added

### Requirement: Adding only without an open choice
The system SHALL allow adding only when a print is fixed for all cards to be added.
Source: README §Features; code shared/utils/set-import.ts (needsChoice); test set-import.test.ts | Origin: derived

#### Scenario: Open choice
- GIVEN a conflict card is undecided
- WHEN the user wants to add
- THEN "Add" is not possible

### Requirement: Adding with the same checks, three at a time
The system SHALL add the cards one by one with the same checks as a single card, at most three at a time (limit of the card database), show the progress, list failed cards and allow a new attempt; every card is added once, there is no quantity.
Source: User instruction 2026-10-10 12:56, 19:56; README §Features | Origin: user requirement

#### Scenario: Failure
- GIVEN a card fails
- WHEN all were added
- THEN it appears in the error list and can be tried again

### Requirement: Yu-Gi-Oh! and Pokémon send different data
The system SHALL send to `POST /api/cards` only card ID and variant for Pokémon, and set code, rarity, edition and printed code in the language of the set for Yu-Gi-Oh!.
Source: Code shared/utils/set-import.ts (importBody); test set-import.test.ts | Origin: derived

#### Scenario: Pokémon
- GIVEN a clear Pokémon row
- WHEN it is added
- THEN the call contains `externalId` and the variant as `edition`

### Requirement: Pokémon: the variant is the unclear part
The system SHALL let the user choose the language of the set list in the Pokémon wizard, treat the variant as the unclear point (one variant can be chosen for the whole set and applies to every card that has it exactly once) and store all languages of a card as for a single card.
Source: User instruction 2026-10-10 19:56; README §Features | Origin: user requirement

#### Scenario: One variant for all
- GIVEN variant "reverse" for the set
- WHEN cards with this variant are checked
- THEN they are clear, the others are conflicts

### Requirement: Pokémon: variants are loaded per card
The system SHALL load the variants per card individually (at most four at a time) when a Pokémon set is opened and cache them for a few hours; a card that cannot be loaded is left out, a limit of the card database is reported.
Source: README §Features; code server/tcg/tcgdex/adapter.ts (listCardPrints), server/services/catalog.ts | Origin: derived

#### Scenario: Large set
- GIVEN a set with many cards
- WHEN it is opened
- THEN loading takes a while, afterwards it comes from the cache

### Requirement: Step display without buttons
The system SHALL show the steps of the wizard as a non-clickable progress display (numbered circles, check marks for finished steps, current step highlighted), not as buttons.
Source: User instruction 2026-10-10 18:42, 19:56 ("fine like this"); code app/app/components/SetImportWizard.vue | Origin: user requirement

#### Scenario: Display
- GIVEN the wizard is in the second step
- WHEN it is shown
- THEN step 1 shows a check mark, step 2 is highlighted, step 3 is pale, without click behaviour
