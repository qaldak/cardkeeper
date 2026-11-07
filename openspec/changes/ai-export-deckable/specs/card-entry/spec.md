# Spec Delta

## ADDED Requirements

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
