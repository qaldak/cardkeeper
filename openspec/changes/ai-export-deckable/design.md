# Design

## Context

The text for an AI is built on the server by `cardsAiText` in `app/server/services/export.ts`: it loads the cards of the selection in chunks (`aiInclude` loads every column of `cards`, so a new column is available without a change there), drops the non-active ones when `onlyActive` is set, and merges identical cards with a quantity (`buildAiText`). `GET /api/export/ai` takes the options as query parameters (`aiExportQuerySchema`); the dialog `AiExportDialog.vue` fetches the text when it opens and when an option changes and always shows a preview.

A card has no field for deck use. [ADR 0005](../../../docs/adr/0005-game-attributes-as-jsonb.md) keeps game attributes in `game_specific_attributes`, but `refresh` overwrites that column completely (`gameSpecificAttributes: merged.attributes`), so a value of the user kept there would be lost. The manual entry (release 0.26.0) created the first cards that the card database cannot describe. See proposal.md for the motivation and `specs/` for the behaviour.

## Goals / Non-Goals

**Goals:**
- One flag per card that the owner controls, with a default that is right without any action (the card database rule), and an export option that uses it.
- A migration that is correct for the data that exists on the day it runs, including cards entered by hand since 0.26.0.

**Non-Goals:**
- A filter, column or marker for the flag in the overview.
- Pokémon (the flag exists on the row but has no meaning and no interface there).
- Bulk changing of the flag (a card at a time, on its page).
- Rules by format or banlist (the introduction of the text still asks the AI to check the banlist).

## Decisions

**1. A column `cards.deckable`, not a JSON attribute.**
`deckable Boolean @default(true)` on `Card`. The flag is the owner's data, like the status or the purchase date, and not an attribute of the card; it must survive "Update from API" (see Context). The exception to ADR 0005 is recorded in ADR 0026.
*Alternative:* `deckable` in `game_specific_attributes`, merged by `refresh`. Rejected: it makes the refresh carry user data, and the "read-only attributes" principle would have a second exception.

**2. The default comes from the card type, in one list.**
The API has no deck field (checked on 2026-11-07); the card types `Token` (frame type `token`, 106 cards) and `Skill Card` (frame type `skill`, 124 cards) are the cards that cannot be in a deck, and no other card type shares those frame types. `app/shared/utils/ygo-values.ts` gets `YGO_NON_DECK_CARD_TYPES = ['Token', 'Skill Card']` and `deckableByDefault(cardType)`. `create` (also used by the whole-set import) stores `!isNonDeck(type)` for a game with deck use; `createManual` takes the value of the form (default false). Skill cards are included on the strength of the API data (they sit in a skill slot in Speed Duel, never in the deck); this is an assumption of this change and one line to remove from the list.

**3. A game setting `deckUse`.**
`GameConfig` gets `deckUse: boolean` (true for `ygo`, false for `pokemon` and the default), next to `manualEntry`. `update` rejects `deckable` for a game without it (400 `field_not_editable`), the AI export ignores the flag for such a game, and the interface hides the switch.

**4. The migration derives the value from the data.**
`ALTER TABLE cards ADD COLUMN deckable boolean NOT NULL DEFAULT true`, then `UPDATE cards SET deckable = false` for the cards of the game `ygo` whose `external_id` is null or whose `game_specific_attributes->>'type'` is `Token` or `Skill Card`. "All existing cards true" would be wrong for cards entered by hand since 0.26.0 and for tokens that were already added from the card database; for the data of before the manual entry both rules give the same result.

**5. Editing goes through the existing `PATCH /api/cards/:id`.**
`updateCardSchema` gets `deckable: z.boolean().optional()`; `update` tracks it with `track('deckable', old, new)` (log and "modified on" as for the other fields) and `assertOwner` applies. `CardDetailDto` gets `deckable`. The card page shows a `USwitch` below the description (disabled for a user who may not change the card, hidden for a game without deck use); `buildPatch` sends it when it differs. `ManualCardForm` has the same switch below the description, off by default, and `createManualCardSchema` gets `deckable: z.boolean().default(false)`.

**6. The AI export gets `deckOnly` and reports what it left out.**
`aiExportQuerySchema` gets `deckOnly` (default true, like `onlyActive`). `cardsAiText` skips a card of a game with deck use whose `deckable` is false, before the cards are merged (so the quantities count the cards that remain), and returns `excluded`, the number of cards that only this option removed (after the status option). The dialog shows "N cards left out because they are not for the deck" when it is above 0.

**7. The preview is a collapsible, closed by default.**
The preview block of `AiExportDialog.vue` becomes a `UCollapsible` whose trigger row carries the heading, the size estimate and a chevron; the number of cards stays in the selection summary above. "Copy" and "Download" use the text that is already loaded, so they do not depend on the preview being open.

**8. The CSV gets a column `deckable`.**
`COLUMN_KEYS` gets `deckable` after `description` (the order of the card page), with a header in both languages and the values of the existing `yesNo` helper (Yes and No, empty for a game without deck use), because the spec for the table export asks for every field of the card page.

## Risks / Trade-offs

- [The API adds a card type that cannot be in a deck] → the list is one constant with a test; a card of such a type that is added before the list is changed is for the deck until its owner switches it off.
- [The migration is wrong for data that no test imagined] → an integration test runs the SQL on a Yu-Gi-Oh! card, a manual card, a token, a skill card and a Pokémon card; the rule is stated in the spec so that it can be read before it runs.
- [A card is switched to "not for the deck" by mistake and goes missing in the AI text] → the dialog says how many cards were left out and the option can be unchecked.
- [The flag exists for Pokémon rows but means nothing] → documented in the spec and ignored by the export; the setting `deckUse` is the one place that decides.

## Migration Plan

One Prisma migration (`app/prisma/migrations/<timestamp>_deckable/migration.sql`, new column and the update above); it runs at the start of the container like the earlier ones, and the app applies it before it serves. Rollback: the column can stay (the old code ignores it); there is no data to restore. Take a backup first (README §Backup), as for every update with a migration.

## Open Questions

- Whether the overview should offer a filter for "for the deck" (the proposal leaves it out; one more story if the flag is used a lot).
