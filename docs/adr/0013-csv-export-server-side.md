# ADR 0013: CSV export on the server, triggered through an "Export" menu

- **Status:** Accepted
- **Date:** 2026-10-21/22 (request), 2026-10-23 (corrections)
- **Origin:** User requirement (request, format, placement); server-side implementation: derived.
- **Specs:** [`export`](../../openspec/specs/export/spec.md)

## Context

The concept named an export as PDF, CSV and Markdown; on 2026-10-21/22 the user requested an export "suitable for an AI prompt" and for Excel, in phase 1 only for the own cards. After a mockup and questions (2026-10-22 11:26–11:53) the user decided: all attributes without images as CSV, language by choice with a fallback to English, selection by filter without restriction to status and user, order like the detail page, only the latest price, download instead of opening, semicolon, implementation according to the mockup.

## Decision

The export runs on the server (`GET /api/export/cards`) over all pages with the same filter and sort logic as the list. Format: semicolon, UTF-8 with BOM, CRLF, protection against formulas. It is triggered through the menu "Export" next to the sort order; "Copy for AI" and "Print list" are disabled placeholders.

## Considered alternatives

- Placement next to "+ Add card" (question of the user, 2026-10-22; the menu next to the sort order was chosen).
- Export as a dialog ("wizard") instead of a direct action (question of the user; dialog with the selection chosen).
- Export in the browser: not documented.
- PDF and Markdown (concept): not implemented.

## Consequences

- The export also includes cards of other users and all statuses.
- The interface opens the download through a normal external link, because a router link led to a 404 (fix after the report of the user, 2026-10-23).
- Open: content of the AI copy.

## Sources

- User instruction 2026-10-21/22 (request), 2026-10-22 11:26, 11:46, 11:53; 2026-10-23 14:59, 15:05, 15:23
- `docs/KONZEPT.md` §Architektur
- `app/server/api/export/cards.get.ts`, `app/server/services/export.ts`
