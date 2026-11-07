# Spec Delta

## MODIFIED Requirements

### Requirement: Updating from the card database
The system SHALL reload texts, attributes and prices in all stored languages on "Update from API" and leave set code, edition, deck use, status, owner, purchase date and images unchanged.
Source: User instruction 2026-10-04 19:40 (6), 2026-11-07 (deck use stays); README (7f3d955) §Features; test cards.test.ts (refresh) | Origin: user requirement

#### Scenario: Data changed
- GIVEN the database has a new text
- WHEN the card is updated
- THEN it shows the new text and the user data remain

#### Scenario: Deck use stays
- GIVEN a card from the card database that the owner switched to "not for the deck"
- WHEN it is updated
- THEN it is still not for the deck

#### Scenario: New language
- GIVEN a language becomes available
- WHEN it is updated
- THEN it is added

#### Scenario: Language missing
- GIVEN the database no longer delivers a language
- WHEN it is updated
- THEN the stored text remains

## ADDED Requirements

### Requirement: Deck use of a Yu-Gi-Oh! card
The system SHALL show on the card page of a Yu-Gi-Oh! card below the description a switch "Use for deck" that the owner can change, write every change with old and new value into the change log, and reject the change for a card of another game with 400 `field_not_editable`.
Source: User instruction 2026-11-07 (answers 4 and 8: switch below the description; Yu-Gi-Oh! only); code app/app/pages/cards/[id].vue | Origin: user requirement

#### Scenario: Switching
- GIVEN a Yu-Gi-Oh! card that is for the deck
- WHEN its owner switches it off and saves
- THEN the card is not for the deck and the change log contains `deckable` with both values

#### Scenario: Not the owner
- GIVEN a card of another user
- WHEN its page is opened
- THEN the switch shows the value and cannot be changed

#### Scenario: Pokémon
- GIVEN a Pokémon card
- WHEN its page is opened
- THEN there is no switch, and a change call with `deckable` is rejected with `field_not_editable`
