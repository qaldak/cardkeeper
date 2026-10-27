# ADR 0005: Game-specific attributes as JSONB

- **Status:** Accepted
- **Date:** 2026-10-03 (concept)
- **Origin:** User requirement (concept of the user; confirmed by the user on 2026-10-23).
- **Specs:** [`data-storage`](../../openspec/specs/data-storage/spec.md), [`game-adapters`](../../openspec/specs/game-adapters/spec.md)

## Context

The attributes differ per game (ATK/DEF/level for Yu-Gi-Oh!, HP/types/stage for Pokémon, mana cost for Magic).

## Decision

Game-specific values are stored in `cards.game_specific_attributes` (JSONB); there are no columns per game.

## Considered alternatives

Not documented.

## Consequences

- No schema change per new game (concept).
- Filtering and sorting by these values happens in memory (see ADR 0014).
- Language-dependent additional data (Pokémon) is in `card_translations.details` (README §Data model).

## Sources

- `docs/KONZEPT.md` §Datenmodell
- `README.md` §Data model
- `app/prisma/schema.prisma`
