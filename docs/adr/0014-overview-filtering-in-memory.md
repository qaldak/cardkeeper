# ADR 0014: Filtering and sorting the overview in memory over all hits

- **Status:** Accepted
- **Date:** Not documented
- **Origin:** Derived (code comment; not discussed in the user instructions).
- **Specs:** [`overview`](../../openspec/specs/overview/spec.md), [`card-paging`](../../openspec/specs/card-paging/spec.md), [`export`](../../openspec/specs/export/spec.md)

## Context

Level and price cannot be sorted directly in the database (they are in JSONB or in the price history); the collection is small (code comment in `cards.ts`).

## Decision

The list loads the hits and filters, sorts and pages in memory; the summary (count, total) covers all hits. The neighbours query and the export use the same filter and sort logic.

## Considered alternatives

Not documented.

## Consequences

- Scales only as long as the collection stays small (assumption of the code comment).
- Uniform order in list, paging and export.

## Sources

- `app/server/services/cards.ts` (comment in `list`), `app/server/lib/card-filters.ts`, `card-sort.ts`
