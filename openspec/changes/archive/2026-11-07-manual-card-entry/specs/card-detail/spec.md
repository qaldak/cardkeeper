# Spec Delta

## MODIFIED Requirements

### Requirement: Data from the card database is read-only
The system SHALL show names, texts and attributes of a card from the card database read-only and allow only set code and edition (for Pokémon the variant) as editable card data, without a label "editable"; a manually entered card is the exception (see "Data of a manually entered card is editable").
Source: User instruction 2026-10-04 19:40 (5), 2026-10-05 17:18, 2026-11-07 (exception for manual cards); README (7f3d955) §Data model; code server/lib/schemas.ts | Origin: user requirement

#### Scenario: Changing the name
- GIVEN a card from the card database and a change call that contains a name
- WHEN it is sent
- THEN the system rejects it (only `set`, `ownerId`, `purchaseDate` and status are allowed)

#### Scenario: Text of a card from the card database
- GIVEN a card from the card database and a change call that contains a text or an attribute
- WHEN it is sent
- THEN the system rejects it with 400 `field_not_editable`

## ADDED Requirements

### Requirement: Data of a manually entered card is editable
The system SHALL let the owner change name, description, set name, rarity, card type, type, attribute, level, ATK and DEF of a manually entered card (a card without external ID) on the card page, using the same choices and checks as when entering, with the language of its text fixed; the external ID is not shown as editable.
Source: User instruction 2026-11-07 ("editable afterwards", answer 2 "yes"); code app/app/pages/cards/[id].vue | Origin: user requirement

#### Scenario: Correcting a typo
- GIVEN a manually entered card with the name "Albaz der Verschleiert"
- WHEN the owner changes it to "Albaz der Verschleierte" and saves
- THEN the card page and the overview show the new name

#### Scenario: Not the owner
- GIVEN a manually entered card of another user
- WHEN the fields are shown
- THEN they are read-only, as for every card

#### Scenario: Clearing a number
- GIVEN a manually entered card with ATK 0
- WHEN the field is emptied and saved
- THEN the card has no ATK and the field stays empty

### Requirement: Changes of a manually entered card are logged
The system SHALL record every changed property of a manually entered card with old and new value in the change log, set "modified on", and keep `cards.name` equal to the name of the preferred translation.
Source: User instruction 2026-11-07 ("changes are written to the change log"); code app/server/services/cards.ts (update) | Origin: user requirement

#### Scenario: Logged change
- GIVEN a manually entered card with the rarity "Common"
- WHEN the rarity is changed to "Ultra Rare"
- THEN the change log contains the property with both values and `userModifiedAt` is set

#### Scenario: Unchanged
- GIVEN unchanged values
- WHEN the card is saved
- THEN nothing is logged
