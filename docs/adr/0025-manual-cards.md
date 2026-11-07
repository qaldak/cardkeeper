# ADR 0025: Cards entered by hand: no external ID, editable, values of the card database

- **Status:** Accepted
- **Date:** 2026-11-07
- **Origin:** User requirement (User instruction 2026-11-07); the technical choices (origin from the missing external ID, a separate route, one list of values) are decisions of the assistant, confirmed by the user with the change `manual-card-entry`.
- **Specs:** [`card-entry`](../../openspec/specs/card-entry/spec.md), [`card-detail`](../../openspec/specs/card-detail/spec.md), [`data-storage`](../../openspec/specs/data-storage/spec.md), [`prices`](../../openspec/specs/prices/spec.md)

## Context

A Yu-Gi-Oh! set contains cards that the card database does not know, for example tokens such as SDAZ-EN047 (checked against the API on 2026-11-07: the print does not exist, the set ends at SDAZ-EN046). The user wants the whole set in the app. Until now every card came from a card database, and its name, texts and attributes were read-only ([ADR 0006](0006-texts-per-language.md)). The schema already allowed a card without external ID, and the card page, the CSV export, the price reload and "Update from API" already treated such a card as entered manually.

## Decision

- A card without external ID is a card entered by hand. No new column marks it; the origin stays derived from the missing external ID.
- It is created with `POST /api/cards/manual` (Yu-Gi-Oh! only, `GameConfig.manualEntry`), with the same stored shape as a card from the database but without snapshots and prices, so nothing asks the card database about it.
- The owner of such a card can change all its data except the external ID. A card from the card database stays read-only (400 `field_not_editable`).
- Card type, type and attribute can only be chosen among the values that the API uses (`app/shared/utils/ygo-values.ts`, taken from the API data of 2026-11-07). The card type `Token` exists in the API; a type `Token` does not and is not added.
- Level, ATK and DEF can stay empty and are then not stored (no `-1`).
- The set code is stored in capital letters; an unusual format is warned about in the form and still saved.

## Considered alternatives

- A column `origin` (`API` or `MANUAL`): rejected, it would repeat what the missing external ID already says and could contradict it.
- One route `POST /api/cards` with a union of both shapes: rejected, it weakens the strict check of the existing call.
- Free text for card type, type and attribute, or an own type `Token`: rejected by the user ("no unsupported values").
- Making every card editable: rejected, a refresh would overwrite the changes of a card from the database.

## Consequences

- ADR 0006 holds for cards from the card database only; a manual card has no "manual override" table, its own values are the values.
- The lists of card types, types and attributes must follow the API; a new value of the API is entered only after the list is updated (a stored value stays visible).
- Manual cards cannot be linked to a database card later (open question in the change).
- Next stories: exclude cards that cannot go into a deck from the AI export; a report of unusual set codes; manual entry for Pokémon.

## Sources

- User instruction 2026-11-07 (requirement, answers 1 to 9)
- YGOPRODeck API v7, checked 2026-11-07 (`cardsetsinfo.php?setcode=SDAZ-EN047`, `cardinfo.php`)
- `app/server/services/cards.ts` (`createManual`, `update`), `app/shared/utils/ygo-values.ts`, `openspec/changes/manual-card-entry/`
