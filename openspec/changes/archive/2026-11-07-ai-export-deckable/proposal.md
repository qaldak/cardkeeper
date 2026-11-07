# Proposal

## Why

The text for an AI is meant to produce a strong deck from the collection. Tokens (such as the Albaz token SDAZ-EN047, entered by hand) and skill cards are in the collection but can never be in a deck; today they are exported like any other card and mislead the AI. The manual entry (release 0.26.0) made this visible: a manually entered card has no card database behind it that could tell.

Checked against the API on 2026-11-07 (full card list): there is no field for deck use. The only signal is the card type: `Token` (106 cards) and `Skill Card` (124 cards) are exactly the cards with the frame types `token` and `skill`, and no other card type has either. A search of the card texts of all other cards found no card that says it cannot be in a deck.

## What Changes

- A new flag per card, "for deck" (`deckable`, true or false), kept by the owner of the card. It applies to Yu-Gi-Oh! only; Pokémon cards ignore it and are always exported.
- Defaults: a card from the card database is for the deck, unless its card type is `Token` or `Skill Card`; a manually entered card is not. The whole-set import follows the card database rule.
- The card page shows the flag as a switch below the description (Yu-Gi-Oh! only, changeable by the owner, logged); the form for entering a card by hand has the same switch below the description, off by default. "Update from API" never changes the flag.
- The dialog "Copy for AI" gets a fourth option, "Only cards for the deck" (checked by default). It leaves out the Yu-Gi-Oh! cards that are not for the deck and says how many were left out. The preview becomes collapsible and is collapsed by default; the number of cards and the size estimate stay visible.
- The CSV export gets a column "For deck" (the spec asks for every card page field in the export).
- Migration: existing cards are for the deck, except Yu-Gi-Oh! cards without external ID (entered by hand) and Yu-Gi-Oh! cards of card type `Token` or `Skill Card`.

Not changed: the overview (no filter or marker for the flag, a later story if wanted), the other options of the dialog, the price reload, the CSV selection.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `export-ai-prompt`: the option "Only cards for the deck", the notice of left-out cards, the collapsible preview; the statements that every card of the selection is used are narrowed to the options.
- `card-detail`: the switch "for deck" on the card page (owner only, Yu-Gi-Oh! only, logged); "Update from API" leaves it unchanged.
- `card-entry`: the default of the flag for a new card (card database rule, manual off) and the switch in the form for a manual card.
- `export`: the column "For deck" in the CSV export.
- `data-storage`: the column, its default and the migration.

## Impact

- Database: new column `cards.deckable boolean not null default true` and a migration that sets the existing rows ([ADR 0005](../../../docs/adr/0005-game-attributes-as-jsonb.md) keeps game attributes in JSONB; the flag is user data like the status, so a column; recorded in a new ADR).
- Server: `app/prisma/schema.prisma`, `app/server/services/cards.ts` (create, createManual, update), `app/server/lib/schemas.ts`, `app/server/services/export.ts` (AI text, CSV column), `app/server/api/export/ai.get.ts`, `app/shared/utils/ygo-values.ts` and `game-config.ts`, `app/shared/types/api.ts`, `app/server/services/mappers.ts`.
- Interface: `app/app/components/AiExportDialog.vue`, `app/app/components/ManualCardForm.vue`, `app/app/pages/cards/[id].vue`, `app/i18n/locales/de.json` and `en.json`.
- Documentation: the five specs above, ADR 0026, README feature list.
- No new dependency, no new environment variable.
