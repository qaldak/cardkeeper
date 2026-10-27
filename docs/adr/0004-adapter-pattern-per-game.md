# ADR 0004: Adapter pattern with a registry per card game

- **Status:** Accepted
- **Date:** 2026-10-03 (concept); extension with Pokémon: 2026-10-05
- **Origin:** User requirement (concept of the user; confirmed by the user on 2026-10-23). The second game, Pokémon, was requested by the user (User instruction 2026-10-05 18:57).
- **Specs:** [`game-adapters`](../../openspec/specs/game-adapters/spec.md)

## Context

The concept wants to be able to add further games "without touching the core schema or the UI"; the first version was for Yu-Gi-Oh! only, Pokémon was added on 2026-10-05.

## Decision

Every game gets an adapter with a uniform interface (`fetchCardById`, `fetchCardByName`, `searchCards`, `mapToCommonSchema`); a registry selects it by game. The behaviour of the print per game is in `shared/utils/game-config.ts`.

## Considered alternatives

Not documented.

## Consequences

- A new game needs no schema change and no change of the core services (README §Adding a game).
- Card database errors are reported uniformly (spec `game-adapters`).

## Sources

- `docs/KONZEPT.md` §Multi-TCG-Konzept
- `README.md` §Adding a game, §Pokémon
- User instruction 2026-10-05 18:57
- `app/server/tcg/types.ts`, `registry.ts`
