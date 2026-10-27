# Export Specification

## Purpose
Export of the cards as a table for further processing (Excel). The export follows the selection of the overview. The copy for AI prompts and the printable list are planned as separate requirements and are visible in the menu as disabled placeholders. Decision: [ADR 0013](../../../docs/adr/0013-csv-export-server-side.md) (server side).

## Requirements

### Requirement: Menu "Export" in the overview
The system SHALL offer a menu "Export" (German: "Exportieren") in the toolbar of the overview next to the sort order; the entry "CSV export" opens a dialog.
Source: User instruction 2026-10-22 11:26, 11:46, 11:53 (placement confirmed); code app/app/pages/index.vue | Origin: user requirement

#### Scenario: Menu
- GIVEN the overview
- WHEN "Export" is opened
- THEN "CSV export" appears as an active entry

### Requirement: Planned functions as placeholders
The system SHALL show "Copy for AI (coming)" and "Print list (coming)" in the menu as entries that cannot be chosen; they are not implemented yet and their content is deliberately not defined yet.
Source: User instruction 2026-10-21 19:10, 2026-10-22 11:53; README §Roadmap; code app/app/pages/index.vue | Origin: user requirement

#### Scenario: Placeholder
- GIVEN the menu is open
- WHEN "Copy for AI (coming)" is clicked
- THEN nothing happens, the entry is disabled

### Requirement: The export follows the selection of the overview
The system SHALL export all cards of the current selection (filters, search, game, sort order, every page) in the order of the overview, without restriction to owner or status.
Source: User instruction 2026-10-22 11:53 ("no restriction to status, user"); test app/tests/integration/export.test.ts | Origin: user requirement

#### Scenario: All owners
- GIVEN cards of several owners, including a sold one
- WHEN exported without a filter
- THEN the file contains all of them in the sort order of the overview

#### Scenario: Filter
- GIVEN an owner filter on Sven
- WHEN exported
- THEN the file contains only his cards

### Requirement: Dialog with the selection
The system SHALL show the selection for checking in the dialog (game, owner, status, sort order, search, "with further filters", language of the texts, number of cards), the notes on the export in an info popover on click, the buttons on the right with "Download" before "Cancel", and disable the download for 0 cards.
Source: User instruction 2026-10-23 14:59, 15:05; code app/app/components/ExportDialog.vue | Origin: user requirement

#### Scenario: Selection
- GIVEN 4 cards match the selection
- WHEN the dialog appears
- THEN it shows game, owner, status, sort order, text language and "4 cards"

#### Scenario: No cards
- GIVEN the selection is empty
- WHEN the dialog appears
- THEN "Download" is not possible

### Requirement: Download as a file
The system SHALL deliver the file through `GET /api/export/cards` (filters, sort order, `lang=de|en`) as a download `cardkeeper-export-YYYY-MM-DD.csv`; the interface SHALL NOT leave the page in the process.
Source: User instruction 2026-10-22 11:53 ("downloaded"), 2026-10-23 15:23; code app/server/api/export/cards.get.ts | Origin: user requirement

#### Scenario: Download
- GIVEN the dialog is open
- WHEN "Download" is clicked
- THEN the browser saves the file and the overview stays in place

### Requirement: CSV format
The system SHALL write the file with a semicolon as the separator, UTF-8 with a byte order mark, line ending CRLF and quotation marks for cells with a semicolon, quotation mark or line break (quotation marks doubled).
Source: User instruction 2026-10-22 11:53 ("semicolon"); code app/server/lib/csv.ts; test app/tests/unit/csv.test.ts | Origin: user requirement

#### Scenario: Quotation marks
- GIVEN a text with a quotation mark in the middle
- WHEN it is written
- THEN it is enclosed in quotation marks and the inner quotation mark is doubled

### Requirement: Protection against formulas
The system SHALL write text that starts with `=`, `+`, `-`, `@`, a tab or a line break with a leading apostrophe, so that a spreadsheet does not run it as a formula; numbers stay unchanged.
Source: Code app/server/lib/csv.ts; tests app/tests/unit/csv.test.ts, export.test.ts (quotes cells and keeps card text…) | Origin: derived

#### Scenario: Formula
- GIVEN a description starts with `=1+1`
- WHEN exported
- THEN `'=1+1` is in the cell

### Requirement: Columns in the order of the card page
The system SHALL export all data of the card without images in the order of the card page (master data, Yu-Gi-Oh! attributes, Pokémon attributes, description, status, owner, timestamps, price); columns of the other game stay empty.
Source: User instruction 2026-10-22 11:53 ("all attributes… order as in the detail"); code app/server/services/export.ts; test app/tests/integration/export.test.ts | Origin: user requirement

#### Scenario: Yu-Gi-Oh! card
- GIVEN a Yu-Gi-Oh! card
- WHEN exported
- THEN ATK, DEF, level, card type, type, attribute are filled and the Pokémon columns are empty

#### Scenario: Pokémon card
- GIVEN a Pokémon card with attacks
- WHEN exported
- THEN all attacks are in one cell, separated by ` | `

### Requirement: Language of the texts
The system SHALL output header, status values, editions, Pokémon values and card texts in the language of the interface (`de` or `en`) and use the English text for a card without a text in this language.
Source: User instruction 2026-10-22 11:53 ("fallback is English"); test app/tests/integration/export.test.ts, locales.test.ts | Origin: user requirement

#### Scenario: English
- GIVEN the interface is set to English
- WHEN exported
- THEN the first column is called "Game" and the status "Active"

#### Scenario: English-only card
- GIVEN a card with English text only, interface German
- WHEN exported
- THEN the English text is in the file

### Requirement: Latest price
The system SHALL output per card only the latest price of the `PRICE_SOURCE` with source, amount (period as the decimal separator), currency and timestamp (UTC, `YYYY-MM-DD HH:MM`), and with `DISPLAY_CURRENCY` set additionally the column "Price in <currency>".
Source: User instruction 2026-10-22 11:53 ("only the latest price"); code app/server/services/export.ts; test app/tests/integration/export.test.ts | Origin: user requirement

#### Scenario: Several prices
- GIVEN a card with two prices
- WHEN exported
- THEN only the newer one is in the file

#### Scenario: CHF
- GIVEN `DISPLAY_CURRENCY=CHF` and a EUR price of 18 at a rate of 0.9
- WHEN exported
- THEN "Price in CHF" contains 16.2
