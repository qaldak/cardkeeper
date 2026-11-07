# ADR 0026: A flag "for deck" per card, as a column

- **Status:** Accepted
- **Date:** 2026-11-07
- **Origin:** User requirement (User instruction 2026-11-07: a flag `deckable`, tokens and cards entered by hand are not for the deck, migration of the existing cards); the column, the card type rule and the migration rule are decisions of the assistant, confirmed by the user with the change `ai-export-deckable`.
- **Specs:** [`data-storage`](../../openspec/specs/data-storage/spec.md), [`card-detail`](../../openspec/specs/card-detail/spec.md), [`card-entry`](../../openspec/specs/card-entry/spec.md), [`export-ai-prompt`](../../openspec/specs/export-ai-prompt/spec.md), [`export`](../../openspec/specs/export/spec.md)

## Context

The text for an AI is meant to produce a deck. Tokens and skill cards, and cards entered by hand since release 0.26.0, are in the collection but are not cards for a deck, and the AI cannot tell. The card database has no field for this (checked against its data on 2026-11-07: no key says anything about decks). Its card types `Token` (frame type `token`) and `Skill Card` (frame type `skill`) are the only signal, and no other card type has those frame types.

[ADR 0005](0005-game-attributes-as-jsonb.md) keeps game-specific values in `game_specific_attributes`, but "Update from API" replaces that column completely, and a value of the user would be lost.

## Decision

- `cards.deckable` is a column (`boolean`, not null, default true). It is the owner's data, like the status and the purchase date, and "Update from API" does not change it.
- It only has a meaning for a game with `GameConfig.deckUse` (Yu-Gi-Oh!); the other games ignore it and cannot change it.
- The default for a new card: a card from the card database is for the deck unless its card type is `Token` or `Skill Card` (`app/shared/utils/ygo-values.ts`); a card entered by hand is not, unless the user switches it on in the form.
- The migration sets false for Yu-Gi-Oh! cards without external ID (entered by hand) and of card type `Token` or `Skill Card`, true for every other card.
- The text for an AI leaves out the cards that are not for the deck when the option "only cards for the deck" is checked (by default) and says how many it left out.

## Considered alternatives

- The flag in `game_specific_attributes`: rejected, the refresh overwrites that column.
- "Every existing card true" as the migration: rejected, it is wrong for cards entered by hand since 0.26.0 and for tokens that were already added from the card database.
- Leaving the card database cards of any card type for the deck: rejected, it would put the 106 tokens and 124 skill cards of the card database into the text.
- An unconditional exclusion without an option: rejected by the user.

## Consequences

- The column exists for every row, also for Pokémon cards, where it is always true and without effect.
- A new card type of the card database that cannot be in a deck needs an entry in the list of card types; until then a card of that type is for the deck until its owner switches it off.
- A filter for the flag in the overview is a later story (the filter display has no room for it yet).

## Sources

- User instruction 2026-11-07 (requirement, answers 1 to 8)
- YGOPRODeck API v7, checked 2026-11-07 (`cardinfo.php?misc=yes`: keys, card types and frame types)
- `app/prisma/migrations/20261107200000_deckable/`, `app/server/services/cards.ts`, `app/server/services/export.ts`, `app/shared/utils/ygo-values.ts`, `openspec/changes/ai-export-deckable/`
