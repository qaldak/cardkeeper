# Tasks

## 1. Data model, rule and game setting

- [x] 1.1 Add `deckable Boolean @default(true)` to `Card` in `app/prisma/schema.prisma` and a migration `app/prisma/migrations/20261107200000_deckable/migration.sql` (add the column, then set false for `ygo` cards with `external_id IS NULL` or card type `Token` or `Skill Card`). Verify with an integration test like `edition-migration.test.ts`: a normal Yu-Gi-Oh! card and a Pokémon card stay true; a manual card, a token and a skill card become false.
- [x] 1.2 Add `YGO_NON_DECK_CARD_TYPES` and `deckableByDefault` to `app/shared/utils/ygo-values.ts` and `deckUse: boolean` to `GameConfig` (true for `ygo` only). Verify with unit tests in `ygo-values.test.ts` and `game-config.test.ts`: Token and Skill Card are not deckable by default, every other of the 29 card types is, an absent card type is; only `ygo` has deck use.

## 2. Creating cards

- [x] 2.1 In `create` (`app/server/services/cards.ts`) store `deckable` from the card type of the card database for a game with deck use, and true otherwise; in `createManual` store the input, and add `deckable: z.boolean().default(false)` to `createManualCardSchema`. Verify with integration tests in `cards.test.ts` and `manual-card.test.ts`: Dark Magician is for the deck; a token from the fake card database is not; a manual card is not by default and is when `deckable: true`; a Pokémon card is.
- [x] 2.2 Verify the whole-set import path with a test that adds a set containing a token through `create`. Check that the stored flag follows the card database rule (no code change is expected; fix `create` if it does not).

## 3. Changing the flag

- [x] 3.1 Add `deckable` to `CardDetailDto` and `toDetail`, `deckable: z.boolean().optional()` to `updateCardSchema`, and handle it in `update`: owner only, 400 `field_not_editable` for a game without deck use, logged with old and new value, "modified on" set, nothing logged for an unchanged value. Verify with integration tests in `manual-card.test.ts` or `cards.test.ts`: switching off and on is logged; a non-owner gets 403; a Pokémon card is rejected; an unchanged value logs nothing.
- [x] 3.2 Verify that `refresh` leaves the flag unchanged: a token from the card database switched on by its owner is still on after "Update from API", and a card switched off is still off. Add the test to `cards.test.ts` (no code change is expected).

## 4. Text for the AI (server)

- [ ] 4.1 Add `deckOnly` (default true) to `aiExportQuerySchema` and `GET /api/export/ai`, and handle it in `cardsAiText`: skip Yu-Gi-Oh! cards that are not for the deck before merging, never skip other games, and return `excluded` (the cards that only this option removed, after the status option). Verify with integration tests in `export.test.ts`: a token is missing with the option and present without; the quantity of three copies with one not for the deck is "2x"; a Pokémon card stays; `excluded` is 1 and does not count a sold card that the status option already removed; an unknown value of `deckOnly` is rejected with 400.

## 5. Dialog (interface)

- [ ] 5.1 In `AiExportDialog.vue` add the option "Only cards for the deck" (checked by default, sent as `deckOnly`) and the notice "N cards left out because they are not for the deck" when `excluded` is above 0, and make the preview a `UCollapsible` that is closed by default with the heading, the size estimate and a chevron in its trigger row. Add the texts to `de.json` and `en.json`. Verify in the browser (`make dev` or the dev server) in light and dark mode: the four options checked, the notice for a selection with a manual card, the preview closed and opening on a click, "Copy" working with the preview closed, the empty state when every card is left out.

## 6. Card page and entry form (interface)

- [ ] 6.1 Add the switch "For deck" below the description in `app/app/pages/cards/[id].vue` (Yu-Gi-Oh! only via `deckUse`, disabled for a user who may not change the card), `deckable` in `toForm` and `buildPatch`, and the texts. Verify in the browser: switching off and saving shows the new state after a reload; another user sees it disabled; a Pokémon card has no switch (check with a test card inserted by SQL).
- [ ] 6.2 Add the same switch below the description in `ManualCardForm.vue`, off by default, with the hint that tokens and skill cards cannot be in a deck, and send `deckable`. Verify in the browser: a token entered by hand stays not for the deck; with the switch on, the card page shows it on.

## 7. CSV export

- [ ] 7.1 Add the column `deckable` after `description` to `COLUMN_KEYS` and the rows of `app/server/services/export.ts` (yes and no, empty for a game without deck use) and its header in both locale files. Verify with the tests in `export.test.ts` (a Yu-Gi-Oh! card not for the deck says "no", a Pokémon card is empty, the English and German headers) and `locales.test.ts`.

## 8. Documentation and final checks

- [ ] 8.1 Write ADR 0026 `docs/adr/0026-deck-use-flag.md` (column instead of JSON attribute, the card type rule, the migration rule), add a note to ADR 0005, mention the flag in the README feature list and in `openspec/config.yaml` (principles), and update the count of ADRs there. Verify by reading the files.
- [ ] 8.2 Run `make lint`, `make typecheck` and `make test`, then `openspec validate ai-export-deckable --strict`. Verify that all pass.

## Workflow follow-up

- After the implementation is merged: `/opsx:archive` moves the deltas into `openspec/specs/export-ai-prompt`, `card-detail`, `card-entry`, `export` and `data-storage`; add ADR 0026 to the Purpose lines of `card-detail` and `data-storage`.
- Next stories (not part of this change): a filter or marker for "for the deck" in the overview if wanted; a report of manual cards with an unusual set code; manual entry for Pokémon.
