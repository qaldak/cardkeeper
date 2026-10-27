# ADR 0023: Card data from YGOPRODeck (Yu-Gi-Oh!) and TCGdex (Pokémon)

- **Status:** Accepted
- **Date:** 2026-10-03 (YGOPRODeck, concept); 2026-10-05 (TCGdex)
- **Origin:** YGOPRODeck: user requirement (concept of the user, confirmed by the user on 2026-10-23). TCGdex: user requirement (User instruction 2026-10-05 18:57).
- **Specs:** [`game-adapters`](../../openspec/specs/game-adapters/spec.md)

## Context

The concept names the YGO adapter (YGOPRODeck) as the first and the Pokémon TCG API (pokemontcg.io) and Scryfall for Magic as later candidates. On 2026-10-05 18:57 the user requested Pokémon and specified TCGdex with a research text: free, no API key, REST.

## Decision

Yu-Gi-Oh! data comes from YGOPRODeck, Pokémon data from TCGdex (German, English and an own database for Japanese). The base URLs can be overridden through `YGOPRODECK_API_URL` and `TCGDEX_API_URL` in the container environment.

## Considered alternatives

- Pokémon TCG API (pokemontcg.io) and Scryfall (named in the concept as later candidates; the choice for Pokémon fell on TCGdex).

## Consequences

- Both services have limits; the app reports them to the user (specs `game-adapters`, `prices`).
- Magic is not implemented.
- The base URLs are read only from the container environment; `docker-compose.yml` does not pass them on from `.env`, the development file only `YGOPRODECK_API_URL` (README §Configuration).

## Sources

- `docs/KONZEPT.md` §Multi-TCG-Konzept
- User instruction 2026-10-05 18:57
- `README.md` §Pokémon, §Notes on the card API
- `app/server/tcg/ygo/adapter.ts`, `app/server/tcg/tcgdex/adapter.ts`
