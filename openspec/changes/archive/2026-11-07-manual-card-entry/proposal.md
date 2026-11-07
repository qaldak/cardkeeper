# Proposal

## Why

A Yu-Gi-Oh! player wants the whole set in the app, including cards that the card database (YGOPRODeck) does not contain: tokens and counters of a structure deck such as SDAZ-EN047. Today a card can only be added from the database; `POST /api/cards` answers 404 `upstream_card_not_found` for everything else, so these cards stay on paper.

Checked against the API on 2026-11-07: the print `SDAZ-EN047` (and `SDAZ-DE047`) does not exist (the set ends at `SDAZ-EN046`), and there is no card "Albaz the Veiled". The API does know the card type `Token` (106 cards, each with a monster type, none with attribute, level, ATK or DEF), but no type `Token`.

## What Changes

- After a name or set-code search that found nothing (message "No card found"), the add page shows a secondary button "Enter manually" (German "Manuell erfassen") next to the message, styled like the export button. It is not shown after a failed search (API error). The search text prefills the name, or the set code if it looks like one.
- A form creates a manually entered Yu-Gi-Oh! card: name (required, with a language choice German/English, German preset), set code (required, capital letters; a warning is always shown for an unusual format, saving stays possible). Optional: card type, type, attribute (each chosen from the values of the API, including the card type `Token`), level, ATK, DEF (numbers, may stay empty), description (in the language of the name), set name, rarity, edition and the purchase date. The external ID cannot be entered.
- The card is created like an API card: status active, the signed-in user as owner, log entry `created`. It has no external ID, no raw-data snapshot and no price. The existing header ("entered manually") and the export column "Origin" show where it comes from; there is no further marker.
- A manually entered card can be changed afterwards in all its fields except the external ID (name, description, set name, rarity, card type, type, attribute, level, ATK, DEF and the existing set code, edition, owner, purchase date, status); every change is written to the change log. Cards from the API stay read-only. This restricts the principle "names, texts and attributes are read-only" to cards from the API.
- Cards without external ID are not asked at the card database: the scheduled price reload and "Update from API" skip them without an error (existing behaviour, now covered by a requirement and a test).
- Only Yu-Gi-Oh! can be entered manually; a manual card of another game is rejected.

Not changed: Pokémon (manual entry is a separate story), the AI export (excluding cards that cannot go into a deck is the next story), a report of manual cards with an unusual set code (own story later), the images (uploaded after creating with the existing upload), the CSV export.

## Capabilities

### New Capabilities

None. The behaviour belongs to the existing capabilities below.

### Modified Capabilities

- `card-entry`: manual entry after an unsuccessful search (button, form, required and optional fields, values from the API, set-code warning, creating without a card database).
- `card-detail`: the data of a manually entered card is editable and logged; data from the card database stays read-only.
- `data-storage`: the invariant "card data is read-only" applies to cards from the card database; a card without external ID has no snapshots and no prices.
- `prices`: cards without external ID are skipped by the scheduled reload.

## Impact

- Server: `app/server/lib/schemas.ts` (schema for a manual card, extended update schema), `app/server/services/cards.ts` (`createManual`, `update` for manual cards), new route `app/server/api/cards/manual.post.ts` (or a branch in `index.post.ts`), `app/shared/utils/` (lists of card types, types and attributes of the API), tests in `app/tests/`.
- Interface: `app/app/pages/cards/new.vue` (button next to "No card found", new component for the form), `app/app/pages/cards/[id].vue` (fields editable for a manual card), `app/i18n/locales/de.json` and `en.json`.
- Documentation: the four specs above, an ADR (next number) for the manual card and the restriction of ADR 0006, `openspec/config.yaml` (principle "read-only"), README (feature list), `docs/ARCHITECTURE.md` only if the flow description changes.
- No schema change, no migration, no new dependency, no new environment variable. The origin "manual" stays derived from the missing external ID.
