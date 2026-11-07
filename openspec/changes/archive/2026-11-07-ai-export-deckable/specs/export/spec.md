# Spec Delta

## MODIFIED Requirements

### Requirement: Columns in the order of the card page
The system SHALL export all data of the card without images in the order of the card page (master data, Yu-Gi-Oh! attributes, Pokémon attributes, description, deck use, status, owner, timestamps, price); columns of the other game stay empty.
Source: User instruction 2026-10-22 11:53 ("all attributes… order as in the detail"), 2026-11-07 (deck use); code app/server/services/export.ts; test app/tests/integration/export.test.ts | Origin: user requirement

#### Scenario: Yu-Gi-Oh! card
- GIVEN a Yu-Gi-Oh! card
- WHEN exported
- THEN ATK, DEF, level, card type, type, attribute are filled and the Pokémon columns are empty

#### Scenario: Pokémon card
- GIVEN a Pokémon card with attacks
- WHEN exported
- THEN all attacks are in one cell, separated by ` | `

#### Scenario: Deck use
- GIVEN a Yu-Gi-Oh! card that is not for the deck and a Pokémon card
- WHEN exported
- THEN the column "For deck" says "No" for the first card and is empty for the Pokémon card
