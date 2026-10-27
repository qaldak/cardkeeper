# ADR 0021: Security headers and protection against cross-site write requests

- **Status:** Accepted
- **Date:** 2026-10-21
- **Origin:** User requirement (assignment to check an external review and implement the necessary changes, User instruction 2026-10-21 14:27); concrete measures: derived.
- **Specs:** [`security`](../../openspec/specs/security/spec.md)

## Context

The user submitted an external review (security, architecture) with the assignment "Check the inputs/review comments, validate them and make sure that the necessary changes are implemented." Many claims of the review turned out to be incorrect (assistant 14:37 ff.).

## Decision

Every response carries `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: same-origin`. Write requests to `/api` with `Sec-Fetch-Site: cross-site` or `same-site` are rejected with 403 `cross_site_request`; the session cookie is `SameSite=Lax`. HTTPS, HSTS and a content security policy are left to the reverse proxy (README).

## Considered alternatives

Not documented. The review points soft delete, splitting `cards.ts` and scans were postponed or not implemented (user: "ok. no further activities necessary.", 14:37).

## Consequences

- Browsers send the header only to https and localhost; over plain http in the home network the check does not apply, there `SameSite=Lax` remains (code comment in `cross-site.ts`). Programs without the header (curl, scripts) carry no browser login and are not affected.
- Transport security lies outside the app.

## Sources

- User instruction 2026-10-21 14:27, 14:37 ff.
- `README.md` §Users and passwords (safeguards)
- `app/nuxt.config.ts`, `app/server/lib/cross-site.ts`, `app/server/middleware/cross-site.ts`
