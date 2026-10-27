# ADR 0010: Card status as a language-neutral enum

- **Status:** Accepted
- **Date:** 2026-10-04
- **Origin:** Derived (decision of the assistant, named in the chat as a deviation from the concept and not objected to; User instruction 2026-10-04 10:43).
- **Specs:** [`card-status`](../../openspec/specs/card-status/spec.md), [`data-storage`](../../openspec/specs/data-storage/spec.md)

## Context

The concept names the status values in German (`aktiv`, `verkauft`, `getauscht`, `verschenkt`, `verloren`) as a dropdown. The interface is bilingual (German/English).

## Decision

The status is stored as the enum `ACTIVE`, `SOLD`, `TRADED`, `GIFTED`, `LOST` and translated in the interface (`status.<KEY>`). Date and person belong to the history row (`status_history`).

## Considered alternatives

- German values in the database (concept); replaced by the enum, the reason is not documented in detail.

## Consequences

- New statuses need a migration and translations.
- Export and display translate the status into the chosen language.

## Sources

- `docs/KONZEPT.md` §Datenmodell
- `README.md` §Data model
- User instruction 2026-10-04 10:43
- `app/prisma/schema.prisma`
