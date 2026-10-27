# Proposal

## Why

The collection is meant to feed a deck recommendation: the user wants to hand the cards of the current selection to an AI and ask for the strongest possible deck, or for another evaluation. The CSV export serves Excel (one row per physical card, all columns, UI language); it is too long and too redundant for a prompt, and it has no quantities. The menu entry "Copy for AI (coming)" has been a disabled placeholder since the CSV export (spec `export`), and its content was left open on purpose.

## What Changes

- The menu entry "Copy for AI" becomes active and opens a dialog with the selection of the overview (same summary as the CSV dialog).
- The dialog offers the options: only active cards (checked by default), include card text (checked by default), prepend an introduction for the AI (checked by default), and an optional free text with the wish of the user (for example the format or the style of deck), placed in the introduction.
- The output is compact text, one line per distinct card with its quantity; identical cards are merged across prints, editions and owners. A short preview and an estimate of the size are shown. Buttons: copy to the clipboard, and download as `.txt`.
- The text is always English (names, rules text, type names), with the German name added where it differs. The card number (passcode, Pokémon card ID) is part of every line.
- Yu-Gi-Oh! lines carry card type, monster type, attribute, level, ATK/DEF, pendulum scale, link value and arrows, archetype and optionally the text. Pokémon lines carry category, stage, types, HP, retreat, weakness/resistance, regulation mark, legality, and optionally attacks, abilities and the rules text.
- With "All games" selected, the text has one section per game.
- The introduction asks the AI to respect the current banlist and at most three copies; the banlist itself is not stored and is not part of this change.
- The placeholder requirement of the spec `export` is reduced to the print list.

Not changed: the CSV export, filters, sort order and the rules for owners (the selection is used as it is, without restriction to the owner).

## Capabilities

### New Capabilities
- `export-ai-prompt`: the text export of the current selection for an AI prompt: options, content per game, quantities, language, introduction, clipboard and file output.

### Modified Capabilities
- `export`: the menu offers a second active entry "Copy for AI"; the placeholder requirement no longer lists "Copy for AI".

## Impact

- Server: `app/server/services/export.ts` (new function for the prompt text), new route `app/server/api/export/ai.get.ts`, tests in `app/tests/integration/export.test.ts`.
- Interface: `app/app/pages/index.vue` (menu entry), new dialog component next to `ExportDialog.vue`, texts in `app/i18n/locales/de.json` and `en.json`.
- Documentation: spec `export` and new spec `export-ai-prompt` (on archive), README roadmap line, ADR for the aggregation and language decisions if the design asks for it.
- No schema change, no migration, no new dependency, no new environment variable.
