# Design

## Context

A card is a row in `cards` with a nullable `external_id`; that column is already the sign of a card "entered manually": the card page header shows "entered manually" (`app/app/pages/cards/[id].vue`), the CSV export has the column "Origin", "Update from API" answers 400 `no_external_id`, and the scheduled price reload selects only cards with `external_id` (`dueCards` in `app/server/services/prices.ts`). What is missing is a way to create such a card: `POST /api/cards` needs an `externalId` and loads the card from the database (`create` in `app/server/services/cards.ts`). Names, texts and attributes of every card are read-only (`updateCardSchema` is `.strict()`, [ADR 0006](../../../docs/adr/0006-texts-per-language.md)). See proposal.md for the motivation and `specs/` for the behaviour.

The stored shape of a Yu-Gi-Oh! card: `cards.name`, one `card_translations` row per language (name, description), `game_specific_attributes` (JSON with `type`, `race`, `attribute`, `level`, `atk`, `def` and more), one `card_sets` row (set code, set name, rarity, edition). Filters, facets, sorting, the CSV and the AI export read exactly these.

## Goals / Non-Goals

**Goals:**
- Create and change a manual card with the same stored shape as an API card, so that overview, filters, facets, sorting and both exports work without changes.
- Only values that the card database itself uses for card type, type and attribute.

**Non-Goals:**
- Pokémon (a separate story; the game setting below prepares it).
- Two languages for one manual card, or changing the language of its text later.
- Fields that the card page does not show (archetype, pendulum scale, link value and arrows, frame type, type line, passcode): not entered, empty in the CSV.
- Linking a manual card to the card database later.
- Excluding tokens from the AI export, and the report of unusual set codes (own stories).

## Decisions

**1. A separate route `POST /api/cards/manual` with its own schema.**
The input is a different shape (no `externalId`, the card data itself), the errors are different, and `createCardSchema` stays as it is. The route answers 201 with the card detail, like `POST /api/cards`. The service gets a function `createManual` next to `create`, using the same helpers (`ensureGame`, `parseDateOnly`, status history, log entry).
*Alternative:* one route with a union of both shapes. Rejected: the union weakens the strict checks of the existing call and the error messages get unclear.

**2. A game setting `manualEntry`.**
`GameConfig` (`app/shared/utils/game-config.ts`) gets `manualEntry: boolean`, true for `ygo`, false for `pokemon` and the default. The service rejects a game without it with 400 `manual_not_supported`; the add page shows the button only for such a game. The Pokémon story switches the flag and adds its own fields.
*Alternative:* test for `ygo` in the route. Rejected: the second game would need another place to change.

**3. The stored shape is the one of the API, with only the fields that were entered.**
`game_specific_attributes` gets `type`, `race`, `attribute`, `level`, `atk`, `def`, each only if filled; an empty field is not stored (no `null`, no `-1`). Facets and filters read these keys unchanged, so the card type `Token` appears in the filter list by itself, and cards without a level are left out of a level filter as Link monsters are today. The text goes into one `card_translations` row in the chosen language (`de` or `en`), and `cards.name` is that name. There is no snapshot, no price row, `last_fetched_at` and `prices_checked_at` stay empty.

**4. The values of card type, type and attribute live in one shared file.**
`app/shared/utils/ygo-values.ts` lists the 29 card types, the types (26 monster, 6 spell and trap types shared, plus `Counter`; 33 values) and the seven attributes, taken from the data of the API on 2026-11-07 (not from third-party libraries: the API spells "Creator God", and has "Illusion"). The server validates with them, the form and the card page build their choices from them. Choices are shown as the API writes them (English), as the card page shows them today. No dependency between the fields is enforced (a spell card with a level is odd but harmless).
A stored value that is not in the list (a type that the API adds later and an API card has) stays selectable on the card page as an extra entry, as foreign editions do today.
*Alternative:* a free text field. Rejected by the user ("no unsupported values").
The seven attributes are taken from the documentation of the API and not yet checked against its data; this is a task.

**5. The form is its own component, opened by the add page.**
`ManualCardForm.vue` takes the prefill (the search text; a text that `isSetCode` fills the set code, otherwise the name) and creates the card; the add page shows it instead of the search, like the chosen-card step, and navigates to the new card page afterwards. The button "Enter manually" is a `UButton` with `color="neutral" variant="outline"` next to the message, shown only when `results` is an empty list for Yu-Gi-Oh! in the name mode (a failed search leaves `results` empty-handed and shows the error). Status and owner are not fields of the form: the card is created active for the signed-in user, as an API card is. The purchase date is the optional field of the existing form. The edition uses the existing `EditionChips`.
The set-code warning is computed with `isSetCode` and shown on every change of the field (it does not block "Save").

**6. Editing a manual card goes through the existing `PATCH /api/cards/:id`.**
`updateCardSchema` gets the optional, strict objects `translation` (`name`, `description`), `attributes` (the six keys, `null` clears) and, inside `set`, `setName` and `rarity`. `update` rejects them with 400 `field_not_editable` when the card has an `external_id`, and applies them for a manual card inside the same transaction as the other fields: the language of the text is the one of the card's single translation (not changeable), `cards.name` follows a changed name, a cleared attribute is removed from the JSON, and every changed property is logged with old and new value (`translation.name`, `translation.description`, `attributes.atk`, `set.setName`, `set.rarity`, ...) through the existing `track`. Owner checks (`assertOwner`) apply as before.
The card page shows inputs instead of read-only fields for these properties when the card has no `external_id` and the user may edit it, and sends only changed fields (`buildPatch`).

**7. The origin stays derived from the missing external ID.**
No new column. A migration would add nothing: the rule is already the one of the header, the export and the price reload. A decision record (ADR 0025) states it and restricts ADR 0006 ("no manual overrides") to cards from the database.

## Risks / Trade-offs

- [The API adds a card type, type or attribute] → the lists are in one file with a unit test; a value of an API card that is not in the list stays visible and unchanged on the card page; the user can only enter the new value after the list is updated.
- [A manual card is entered twice] → allowed, as the same API card can be added several times; every row is one physical card.
- [The card appears in the API later] → the manual card stays manual; there is no link function (see Open Questions).
- [Empty level, ATK, DEF] → exports and the AI text already skip missing values (checked for the AI text builder and the CSV columns); the overview sort by level puts cards without level last, as for Link monsters.
- [An unusual set code gets stored] → intended (warning only); a later story reports them.

## Migration Plan

No schema change and no data migration. Deployment is the normal image update. Rollback: manual cards created in between stay valid, because they only use columns that exist.

## Open Questions

- Should the card page also warn when the set code of a manual card is edited to an unusual format? It does not change the specs of this story (the warning is required in the form); it can follow with the report story.
- Linking a manual card to a database card once the database has it (e.g. when YGOPRODeck adds SDAZ-EN047): not needed now.
