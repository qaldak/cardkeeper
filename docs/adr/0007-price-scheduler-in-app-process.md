# ADR 0007: Price reload as a plugin in the app process, state in the database

- **Status:** Accepted (confirmed by the user on 2026-10-23)
- **Date:** 2026-10-10
- **Origin:** User requirement: the user requested the staggered price reload (User instruction 2026-10-10 20:40); the assistant chose where it runs, and the user confirmed it on 2026-10-23.
- **Specs:** [`prices`](../../openspec/specs/prices/spec.md), [`operations`](../../openspec/specs/operations/spec.md)

## Context

The concept names a separate scheduler container with node-cron and `CRON_SCHEDULE`, independent of the web app process (concept §Tech-Stack, §Deployment). On 2026-10-10 20:40 the user requested the reload of the prices "via API… staggered", without fixing the place, and: "The configuration does not have to happen in the UI. That can be done in the .env."

## Decision

A Nitro plugin in the app process checks 60 seconds after the start and then every 10 minutes whether a tranche is due. The state is kept in `price_refresh_runs`; there is no second container. Configuration through `PRICE_REFRESH_*` in `.env`.

## Considered alternatives

- Separate scheduler container with node-cron (concept): rejected by the user on 2026-10-23.
- Allow both: not chosen.

## Consequences

- Fewer containers and less configuration; `docker-compose.yml` contains only `db` and `app`.
- If the app is not running, the price reload does not run either; a restart interrupts a running tranche (state `interrupted`).

## Sources

- `docs/KONZEPT.md` §Architektur, §Tech-Stack, §Deployment
- User instruction 2026-10-10 20:40, 20:58, 21:10–21:19
- `app/server/plugins/price-refresh.ts`, `app/server/services/prices.ts`
- `docker-compose.yml`
