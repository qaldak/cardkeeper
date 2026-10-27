# ADR 0020: Remembered state of the operation in cookies

- **Status:** Accepted
- **Date:** 2026-10-06 and 2026-10-20
- **Origin:** User requirement for the behaviour (User instruction 2026-10-06 07:31, 13:08; 2026-10-20 09:09); the choice of cookies as the place of storage comes from the assistant or from the user in the wording "(cookie)" (13:08).
- **Specs:** [`overview`](../../openspec/specs/overview/spec.md), [`card-entry`](../../openspec/specs/card-entry/spec.md), [`user-interface`](../../openspec/specs/user-interface/spec.md)

## Context

The user wanted the app to remember the game chosen last when adding cards, the overview to have "All games" as the default and keep the last setting, and on 2026-10-20 the filters to be kept when going back to the overview but to return to the default (own person) on a new sign-in or restart.

## Decision

The state is kept in cookies: `cardkeeper-last-game` (adding, 1 year), `cardkeeper-overview-game` (game of the overview), `cardkeeper-overview-query` (filters, sort order, page; session cookie, deleted on login/logout) and `cardkeeper_locale` (language). The appearance is remembered in the browser.

## Considered alternatives

Not documented (earlier defaults: Yu-Gi-Oh! as the default game, owner "all", User instruction 2026-10-06 and 2026-10-20).

## Consequences

- The state applies per browser, not per user account.
- The overview restores the remembered selection only on a call of `/` without parameters.

## Sources

- User instruction 2026-10-06 07:31, 13:08; 2026-10-20 09:09
- `app/shared/utils/overview-query.ts`, `app/app/middleware/overview-query.global.ts`
