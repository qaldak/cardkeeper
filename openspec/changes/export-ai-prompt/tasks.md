# Tasks

## 1. Text builder on the server

- [x] 1.1 Add to `app/server/services/export.ts` a function `cardsAiText(filters, order, options)` that loads the selected cards like `cardsCsv`, optionally drops cards that are not active, merges them by game and card number (manual cards by English name) and returns `text`, `fileName`, `total` and `distinct`. Verify with integration tests in `app/tests/integration/export.test.ts`: three copies give "3x" and the right counts; with "only active cards" the sold card is missing and without it present.
- [x] 1.2 Write the Yu-Gi-Oh! lines (type, monster type, attribute, level, ATK/DEF with "?", scale, link value and arrows, archetype, card number, German name when different) and the Pokémon lines (category, stage, types, HP, retreat, weakness, resistance, regulation mark, legality). Verify with tests for one monster with ATK 2500 and for one Pokémon card with legal Standard; an unknown ATK (-1) appears as "?".
- [x] 1.3 Add the optional second line with the text (rules text; attacks and abilities) and the section headings per game. Verify with tests: text off removes the text but keeps the data; a selection of both games gives two sections with their own counts.
- [x] 1.4 Add the introduction with the optional wish. Verify with tests: the wish appears in the introduction; without the introduction the text starts with the first heading and the wish is ignored.

## 2. Endpoint

- [x] 2.1 Add `app/server/api/export/ai.get.ts` with the filters and sort order of the list plus `onlyActive`, `withText`, `intro` (boolean) and `wish` (at most 500 characters); it answers JSON and sends `cache-control: no-store`. Verify with a test that an over-long wish and an unknown option value are rejected with a 400 error, and that the call needs a login.

## 3. Dialog and menu

- [x] 3.1 Create `app/app/components/AiExportDialog.vue` with the selection summary, the three options, the wish field, the preview, the size estimate, and the buttons "Copy" and "Download" (disabled without cards); it fetches `/api/export/ai` when it opens and when an option changes. Verify in the running dev stack (`make dev`) in light and dark mode: preview, counts and the disabled state with an empty selection.
- [x] 3.2 Copy with `navigator.clipboard.writeText`, with the fallback to `document.execCommand('copy')` and a hint when both fail; download the text as `cardkeeper-ai-YYYY-MM-DD.txt`. Verify by opening the app over plain http (non-secure context) and copying, and by checking the downloaded file.
- [x] 3.3 Activate the menu entry in `app/app/pages/index.vue` (remove `disabled` from `export.menu.ai`, open the dialog) and pass the same selection summary as the CSV dialog. Verify that "Copy for AI" opens the dialog and "Print list (coming)" stays disabled.
- [x] 3.4 Add the texts in `app/i18n/locales/de.json` and `en.json` (menu entry without "coming", dialog title, options, wish label, hints, buttons). Verify with `make test` (the locale test checks both files and the placeholders).

## 4. Documentation

- [x] 4.1 Update the README: remove "Copy for AI" from the roadmap line and mention it in the features list. Verify by reading the section.
- [x] 4.2 Run `make lint`, `make typecheck` and `make test`, then `openspec validate export-ai-prompt --strict`. Verify that all pass.

## Workflow follow-up

- After the implementation is merged: `/opsx:archive` moves the deltas into `openspec/specs/export-ai-prompt/spec.md` and `openspec/specs/export/spec.md` (adjust the Purpose of `export`, which still names the copy for AI prompts as planned).
