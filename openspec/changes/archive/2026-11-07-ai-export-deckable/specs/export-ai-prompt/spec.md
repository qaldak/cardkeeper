# Spec Delta

## MODIFIED Requirements

### Requirement: Dialog with the selection and the options
The system SHALL open from the menu entry "Copy for AI" a dialog that shows the selection of the overview (game, owner, status, sort order, search, number of cards) and the options "only active cards", "only cards for the deck", "include card text" and "introduction", all checked by default.
Source: User instruction 2026-10-27 (AI export; recommendations accepted), 2026-11-07 (option "only cards for the deck"); code app/app/components/ExportDialog.vue | Origin: user requirement

#### Scenario: Defaults
- GIVEN the overview with a selection
- WHEN "Copy for AI" is chosen
- THEN the dialog shows the selection and the four options checked

### Requirement: Only active cards
The system SHALL leave out all cards whose status is not active when the option "only active cards" is checked, and not restrict the cards by their status when it is not.
Source: User instruction 2026-10-27 ("only export active cards" for deck recommendations) | Origin: user requirement

#### Scenario: Option checked
- GIVEN a selection of 4 active cards and 2 sold cards
- WHEN the text is created with "only active cards"
- THEN only the 4 active cards appear

#### Scenario: Option unchecked
- GIVEN the same selection, all of its cards for the deck
- WHEN the option is unchecked
- THEN all 6 cards appear

### Requirement: The selection of the overview is used as it is
The system SHALL use the cards of the current selection (filters, search, game, every page) in the sort order of the overview, without restriction to the owner; only the options of the dialog leave cards out.
Source: User instruction 2026-10-27 ("cards according to the selection"); same rule as the CSV export | Origin: user requirement

#### Scenario: Other owners
- GIVEN a selection with cards of several owners
- WHEN the text is created
- THEN cards of all owners are included

### Requirement: Preview and copy or download
The system SHALL show a preview of the beginning of the text that is collapsed until the user opens it, keep the number of cards and the size estimate visible, and offer "Copy" (to the clipboard, also where the browser has no clipboard interface) and "Download" (`cardkeeper-ai-YYYY-MM-DD.txt`) as plain text; both SHALL be disabled when the selection contains no cards.
Source: User instruction 2026-10-27 (proposal accepted), 2026-11-07 (preview collapsed, "takes too much space"); the CSV dialog for the empty selection | Origin: user requirement

#### Scenario: Collapsed
- GIVEN the dialog opens
- WHEN it appears
- THEN the preview is closed, the size is visible, and a click on its heading opens it

#### Scenario: Copy
- GIVEN the dialog shows the text of the selection
- WHEN "Copy" is clicked
- THEN the whole text is in the clipboard, whether the preview is open or not

#### Scenario: Empty selection
- GIVEN the selection contains no cards, or no card that remains with the checked options
- WHEN the dialog appears
- THEN "Copy" and "Download" are not possible

## ADDED Requirements

### Requirement: Only cards for the deck
The system SHALL leave out the Yu-Gi-Oh! cards that are not marked for the deck when the option "only cards for the deck" is checked, never leave out a Pokémon card because of it, count the quantities after leaving out, and show in the dialog how many cards were left out.
Source: User instruction 2026-11-07 (cards that cannot go into a deck are not exported; option; Yu-Gi-Oh! only); code app/server/services/export.ts | Origin: user requirement

#### Scenario: Token left out
- GIVEN a selection with 3 normal Yu-Gi-Oh! cards and one token that is not for the deck
- WHEN the text is created with the option
- THEN the token is not in the text and the dialog says that 1 card was left out

#### Scenario: Option unchecked
- GIVEN the same selection
- WHEN the option is unchecked
- THEN the token appears and no card is reported as left out

#### Scenario: Pokémon
- GIVEN a selection with Pokémon cards
- WHEN the text is created with the option
- THEN all Pokémon cards appear

#### Scenario: Quantities
- GIVEN three copies of the same Yu-Gi-Oh! card, one of them not for the deck
- WHEN the text is created with the option
- THEN the line says "2x"
