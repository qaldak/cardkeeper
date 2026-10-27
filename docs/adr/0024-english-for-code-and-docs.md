# ADR 0024: Code comments, README, specifications and decision records in English

- **Status:** Accepted (extended on 2026-10-27)
- **Date:** 2026-10-04; extension 2026-10-27
- **Origin:** User requirement (User instruction 2026-10-04 09:59; extension to specifications and decision records: User instruction 2026-10-27).
- **Specs:** [`development-release`](../../openspec/specs/development-release/spec.md), [`user-interface`](../../openspec/specs/user-interface/spec.md)

## Context

The user writes in German and fixed the language for code comments and README at the start. The specifications and decision records of the baseline were first written in German (as the assignment required) and then switched to English at the request of the user, so that the whole repository is in one language.

## Decision

The user decided: "Please use English exclusively for comments. Also for the README." This now also applies to the specifications (`openspec/`), the decision records (`docs/adr/`), the architecture overview and the working rules (`CLAUDE.md`). The historical initial concept `docs/KONZEPT.md` stays in German. The interface itself is bilingual (German/English).

## Considered alternatives

Not documented.

## Consequences

- Everything in the repository except the initial concept is in English.
- User-facing labels in the specifications are quoted in the language of the interface where needed.

## Sources

- User instruction 2026-10-04 09:59, 2026-10-27
- `README.md`
