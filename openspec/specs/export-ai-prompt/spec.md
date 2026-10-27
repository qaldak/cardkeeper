# AI Prompt Export Specification

## Purpose
Text export of the current overview selection for an AI prompt, for example to let an AI build the strongest possible deck from the collection. One line per distinct card with its quantity and the data that matter for the rules of the game.

## Requirements

### Requirement: Dialog with the selection and the options
The system SHALL open from the menu entry "Copy for AI" a dialog that shows the selection of the overview (game, owner, status, sort order, search, number of cards) and the options "only active cards", "include card text" and "introduction", all checked by default.
Source: User instruction 2026-10-27 (AI export; recommendations accepted); code app/app/components/ExportDialog.vue | Origin: user requirement

#### Scenario: Defaults
- GIVEN the overview with a selection
- WHEN "Copy for AI" is chosen
- THEN the dialog shows the selection and the three options checked

### Requirement: Only active cards
The system SHALL leave out all cards whose status is not active when the option "only active cards" is checked, and use all cards of the selection when it is not.
Source: User instruction 2026-10-27 ("only export active cards" for deck recommendations) | Origin: user requirement

#### Scenario: Option checked
- GIVEN a selection of 4 active cards and 2 sold cards
- WHEN the text is created with "only active cards"
- THEN only the 4 active cards appear

#### Scenario: Option unchecked
- GIVEN the same selection
- WHEN the option is unchecked
- THEN all 6 cards appear

### Requirement: The selection of the overview is used as it is
The system SHALL use the cards of the current selection (filters, search, game, every page) in the sort order of the overview, without restriction to the owner.
Source: User instruction 2026-10-27 ("cards according to the selection"); same rule as the CSV export | Origin: user requirement

#### Scenario: Other owners
- GIVEN a selection with cards of several owners
- WHEN the text is created
- THEN cards of all owners are included

### Requirement: Identical cards are merged with a quantity
The system SHALL write one line per distinct card (same game and same card number) with the quantity "Nx", counting the selected cards across prints, editions and owners, and a heading with the number of distinct cards and the total.
Source: User instruction 2026-10-27 (recommendation 1 accepted); README (a card is added once, no quantity) | Origin: user requirement

#### Scenario: Three copies
- GIVEN three cards "Dark Magician" in different sets
- WHEN the text is created
- THEN one line "3x Dark Magician …" appears and the heading counts 1 distinct card and 3 in total

### Requirement: English text with the German name
The system SHALL write names, rules text and type names in English, add the German name in the form "(DE: …)" where it differs, and use the available text for a card that has no English text.
Source: User instruction 2026-10-27 (recommendation 2 accepted: English) | Origin: user requirement

#### Scenario: German name
- GIVEN a card "Dark Magician" with the German name "Dunkler Magier"
- WHEN the text is created
- THEN the line reads "Dark Magician (DE: Dunkler Magier)"

### Requirement: Card number in every line
The system SHALL write the card number (Yu-Gi-Oh!: passcode, Pokémon: card ID) in every line.
Source: User instruction 2026-10-27 (recommendation 5 accepted) | Origin: user requirement

#### Scenario: Pokémon line
- GIVEN the Pokémon card with the ID "sv08-057"
- WHEN the text is created
- THEN its line contains "sv08-057"

### Requirement: Yu-Gi-Oh! data
The system SHALL write for a Yu-Gi-Oh! card the card type, monster type, attribute, level, ATK/DEF (with "?" for unknown values), pendulum scale, link value with arrows and the archetype, where the card has them.
Source: User instruction 2026-10-27 (relevant data for the deck); code app/server/services/export.ts (stored attributes) | Origin: user requirement

#### Scenario: Monster
- GIVEN a level 7 DARK Spellcaster with ATK 2500 and DEF 2100
- WHEN the text is created
- THEN the line contains "Lv7", "DARK", "Spellcaster" and "ATK 2500 / DEF 2100"

### Requirement: Pokémon data
The system SHALL write for a Pokémon card the category, stage, types, HP, retreat cost, weakness, resistance, regulation mark and the legality in Standard and Expanded, where the card has them.
Source: User instruction 2026-10-27 (relevant data for the deck); code app/shared/types/pokemon.ts | Origin: user requirement

#### Scenario: Pokémon
- GIVEN a Basic Lightning Pokémon with 200 HP, mark H, legal in Standard
- WHEN the text is created
- THEN the line contains "Basic", "Lightning", "HP 200", "H" and "Standard"

### Requirement: Card text is optional
The system SHALL add on a second line the rules text (Yu-Gi-Oh!) or the attacks, abilities and rules text (Pokémon) when "include card text" is checked, and omit them otherwise, keeping all other data.
Source: User instruction 2026-10-27 (card text optional to shorten the prompt) | Origin: user requirement

#### Scenario: Text off
- GIVEN "include card text" is unchecked
- WHEN the text is created
- THEN no rules text, attack or ability appears and the data of the line remain

### Requirement: One section per game
The system SHALL group the lines by game under a heading per game when the selection contains cards of both games.
Source: User instruction 2026-10-27 (proposal accepted) | Origin: user requirement

#### Scenario: Both games
- GIVEN "All games" with cards of both games
- WHEN the text is created
- THEN a section "Yu-Gi-Oh!" and a section "Pokémon" appear, each with its own heading

### Requirement: Introduction and wish
The system SHALL prepend an introduction when it is checked that explains the data, asks the AI to respect the banlist and at most three copies (Yu-Gi-Oh!) and the format legality shown (Pokémon), and contains an optional wish of the user typed into the dialog.
Source: User instruction 2026-10-27 (recommendations 3 and 4 accepted); the banlist is not stored | Origin: user requirement

#### Scenario: With a wish
- GIVEN the wish "Build a competitive Standard deck"
- WHEN the text is created with the introduction
- THEN the introduction contains this wish

#### Scenario: Without the introduction
- GIVEN the introduction is unchecked
- WHEN the text is created
- THEN the text starts with the first heading and the wish is not used

### Requirement: Preview and copy or download
The system SHALL show a preview of the beginning of the text with the number of cards and an estimate of its size, and offer "Copy" (to the clipboard, also where the browser has no clipboard interface) and "Download" (`cardkeeper-ai-YYYY-MM-DD.txt`) as plain text; both SHALL be disabled when the selection contains no cards.
Source: User instruction 2026-10-27 (proposal accepted); the CSV dialog for the empty selection | Origin: user requirement

#### Scenario: Copy
- GIVEN the dialog shows a preview
- WHEN "Copy" is clicked
- THEN the whole text is in the clipboard

#### Scenario: Empty selection
- GIVEN the selection contains no cards, or no active card with the option checked
- WHEN the dialog appears
- THEN "Copy" and "Download" are not possible
