# ADR 0002: Nuxt (Vue, Nitro) with Nuxt UI and Tailwind as one codebase for interface and API

- **Status:** Accepted (Nuxt 4 instead of the Nuxt 3 named in the concept)
- **Date:** 2026-10-03 (concept); deviation Nuxt 4: 2026-10-04
- **Origin:** User requirement (concept of the user; confirmed by the user on 2026-10-23). The deviations Nuxt 4 and Node 24 come from the assistant; the user did not object (User instruction 2026-10-04 10:43).
- **Specs:** [`user-interface`](../../openspec/specs/user-interface/spec.md), [`operations`](../../openspec/specs/operations/spec.md)

## Context

The concept demands "one codebase for UI + API routes (Nitro), modern look, fits existing Vue experience" and "fast, consistent, beginner-friendly components instead of an admin-grid look".

## Decision

Nuxt (TypeScript, Vue 3, Nitro) for interface and API routes, Tailwind CSS with Nuxt UI for the components. Implemented with Nuxt 4 (default layout `app/app/`) and Node 24; the concept named Nuxt 3 and `node:20-alpine`.

## Considered alternatives

Not documented (the concept names only the choice and its reasons).

## Consequences

- One codebase, one container image for UI and API.
- The services are framework-independent factories (`createXService(deps)`), the Nitro layer stays thin.
- Concept and implementation differ in Nuxt version and Node version.

## Sources

- `docs/KONZEPT.md` §Tech-Stack
- `README.md` §Architecture, §Data model (Nuxt 4 default layout)
- User instruction 2026-10-04 10:43 (deviations from the concept)
- `app/package.json`
