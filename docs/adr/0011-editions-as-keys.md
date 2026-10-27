# ADR 0011: Yu-Gi-Oh! editions as keys, "Unlimited" as an empty value

- **Status:** Accepted
- **Date:** 2026-10-07 to 2026-10-08
- **Origin:** User requirement (decided step by step in the user instructions).
- **Specs:** [`data-storage`](../../openspec/specs/data-storage/spec.md), [`card-entry`](../../openspec/specs/card-entry/spec.md)

## Context

The YGOPRODeck API provides no edition; it has to be entered per physical card. The course: free text (until 2026-10-07 19:37), buttons with English values (19:44), keys `FIRST_EDITION`, `UNLIMITED`, `LIMITED_EDITION` with translation (21:15–21:40), finally only `FIRST_EDITION` and `LIMITED_EDITION`, "Unlimited" = empty (2026-10-08 17:42–18:18), because "Unlimited" is not printed on the card.

## Decision

Printed editions are stored as the keys `FIRST_EDITION` and `LIMITED_EDITION` and translated on display; "Unlimited" is NULL; the free text is dropped. Values that match no key stay in place and are reported in the log at startup (with an SQL proposal). A migration sets values with "1st" or "1." to `FIRST_EDITION`.

## Considered alternatives

- Free text (rejected).
- Buttons with English values (rejected).
- Keys including `UNLIMITED` (rejected, because "Unlimited" is not printed).

## Consequences

- Less error-prone; cleaning up foreign values is done by the user with SQL.
- A new edition is one more key in `shared/utils/editions.ts` with translations.
- For Pokémon the same column holds the variant key (`normal`, `reverse`, …).

## Sources

- User instruction 2026-10-07 19:37, 19:44, 21:15, 21:37; 2026-10-08 17:42, 17:52, 18:13, 18:18
- `README.md` (7f3d955) §Data model
- `app/server/plugins/editions.ts`, `app/shared/utils/editions.ts`
