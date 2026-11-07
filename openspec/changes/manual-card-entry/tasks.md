# Tasks

## 1. Values of the card database and the game setting

- [ ] 1.1 Check the seven attributes against the data of the API in a session that can reach `db.ygoprodeck.com` (environment "cardkeeper"): fetch `cardinfo.php` once and list the distinct `attribute` values. Verify that the list in design.md (DARK, DIVINE, EARTH, FIRE, LIGHT, WATER, WIND) is confirmed or corrected before 1.2.
- [ ] 1.2 Create `app/shared/utils/ygo-values.ts` with `YGO_CARD_TYPES` (29), `YGO_RACES` (33, without `Token`) and `YGO_ATTRIBUTES`, and a unit test `app/tests/unit/ygo-values.test.ts`. Verify that the test passes: 29 card types including `Token`, no race `Token`, "Creator God" and "Illusion" present, no duplicates.
- [ ] 1.3 Add `manualEntry: boolean` to `GameConfig` in `app/shared/utils/game-config.ts` (true for `ygo`, false for `pokemon` and the default). Verify with a unit test next to the existing game-config tests that only `ygo` allows manual entry.

## 2. Creating a manual card (server)

- [ ] 2.1 Add `createManualCardSchema` to `app/server/lib/schemas.ts`: `game`, `name` (1 to 200 characters), `language` (`de` or `en`, default `de`), `setCode` (1 to 40, stored in capitals), optional `description`, `setName`, `rarity`, `edition`, `cardType`, `race`, `attribute` (choices of 1.2), `level` (0 to 99), `atk` and `def` (whole numbers, 0 or more), `purchaseDate`; strict, so an `externalId` is rejected. Verify with unit tests: valid input passes; missing name or set code, `cardType: "Counter / Token"`, `race: "Token"`, a negative ATK and an `externalId` are rejected.
- [ ] 2.2 Add `createManual(input, actor)` to `app/server/services/cards.ts`: reject a game without `manualEntry` with 400 `manual_not_supported`, store card, one translation, print, status history (active) and the log entry `created` in one transaction, only filled attributes in `game_specific_attributes`, no snapshot, no price, owner is the actor. Verify with integration tests in `app/tests/integration/cards.test.ts`: all parts stored; empty level/ATK/DEF absent; Pokémon rejected with `manual_not_supported`; an unknown game with `unknown_game`; German and English name stored as the translation of the chosen language and `cards.name`.
- [ ] 2.3 Add the route `app/server/api/cards/manual.post.ts` (201, needs a login like `index.post.ts`). Verify with an integration test through the handler or service that the card appears in the list, in the filter facets (`Token` under card types) and in the CSV export with the origin "entered manually".

## 3. Editing a manual card (server) and the decision record

- [ ] 3.1 Extend `updateCardSchema` with the strict objects `translation` (`name`, `description`), `attributes` (`type`, `race`, `attribute`, `level`, `atk`, `def`, `null` clears) and `set.setName` and `set.rarity` (checks of 2.1). Verify with unit tests that a name at the top level is still rejected and the new objects accept valid input.
- [ ] 3.2 Apply them in `update` for a card without `external_id`: change the single translation, keep `cards.name` equal to the name, remove cleared attributes, log every changed property with old and new value, set "modified on", change nothing and log nothing for unchanged values; reject them for a card with `external_id` with 400 `field_not_editable`; `assertOwner` applies. Verify with integration tests in `cards.test.ts` and `ownership.test.ts`: typo corrected and logged; ATK cleared; API card rejected; non-owner gets 403; unchanged save logs nothing.
- [ ] 3.3 Write ADR 0025 `docs/adr/0025-manual-cards.md` (origin from the missing external ID, editable, only values of the card database, restriction of ADR 0006), add a note to ADR 0006 and `openspec/config.yaml` (principle "read-only" now applies to cards from the card database), and link the ADR from the specs `card-entry` and `card-detail`. Verify by reading the files and by `openspec validate --specs --strict` after the archive step.

## 4. API calls skip manual cards

- [ ] 4.1 Add integration tests in `app/tests/integration/price-refresh.test.ts`: a due manual card is not selected and no request is sent for it, the run records no failed card, and a mixed run updates only the API card. Verify that they pass (no production change is expected; fix `dueCards` if a test fails).
- [ ] 4.2 Verify with a test that `refresh` of a manual card still answers 400 `no_external_id` and that the card page offers no "Update from API" for it (existing behaviour; extend the test in `cards.test.ts` only if it is not covered).

## 5. Entry form (interface)

- [ ] 5.1 Create `app/app/components/ManualCardForm.vue` with the fields of the spec (name with language choice, German preset; set code; card type, type, attribute as searchable choices with clear; level, ATK, DEF as number inputs; description; set name; rarity; edition with `EditionChips`; purchase date), the always-visible warning for an unusual set code via `isSetCode`, the capital letters for the set code, and "Save" and "Cancel". Verify in the running dev stack (`make dev`) in light and dark mode: required fields, the warning, saving with an unusual code, empty numbers.
- [ ] 5.2 Show the button "Enter manually" in `app/app/pages/cards/new.vue` next to "No card found" (`color="neutral" variant="outline"`, Yu-Gi-Oh! name mode only, not after a search error, not before a search), open the form with the prefill (set code or name) and navigate to the new card page after saving. Verify in the browser with the fake card database: searching `SDAZ-EN047` finds nothing, the button opens the form with `SDAZ-EN047`, saving creates "Albaz der Verschleierte" (card type `Token`) and the page shows "entered manually"; with the database switched off the error is shown and no button.
- [ ] 5.3 Add the texts in `app/i18n/locales/de.json` and `en.json` (button, form labels, warning, hints). Verify with `make test` (the locale test checks both files and the placeholders).
- [ ] 5.4 Mention the manual entry in the README feature list. Verify by reading the section.

## 6. Card page of a manual card (interface)

- [ ] 6.1 In `app/app/pages/cards/[id].vue` show inputs instead of read-only fields for name, description, set name, rarity, card type, type, attribute, level, ATK and DEF when the card has no external ID and the user may edit it; keep an already stored foreign value selectable; extend `toForm` and `buildPatch` to send only changed fields. Verify in the browser: correct a typo and save (toast, new name in the header and the overview); empty ATK and save (field stays empty); another user sees the fields read-only; a card from the database still shows read-only fields.
- [ ] 6.2 Verify the whole flow once more in the browser with the unsaved-changes dialog (leaving the page with a changed manual field asks, as for the other fields) and with the language switch (a manual card has one language).

## 7. Final checks

- [ ] 7.1 Run `make lint`, `make typecheck` and `make test`. Verify that all pass.
- [ ] 7.2 Run `openspec validate manual-card-entry --strict`. Verify that it passes.

## Workflow follow-up

- After the implementation is merged: `/opsx:archive` moves the deltas into `openspec/specs/card-entry`, `card-detail`, `data-storage` and `prices`; check the Purpose lines of `card-entry` and `card-detail`, which now cover manual cards.
- Next stories (not part of this change): exclude cards that cannot go into a deck from the AI export; report manual cards with an unusual set code; manual entry for Pokémon.
