# ADR 0001: Self-hosted on the Raspberry Pi with a local database

- **Status:** Accepted
- **Date:** 2026-10-03 (date of the concept)
- **Origin:** User requirement (the concept of the user, `docs/KONZEPT.md`; confirmed on 2026-10-23: the decisions of the concept are the user's own). The containerisation is additionally a user instruction (2026-10-04 09:59).
- **Specs:** [`operations`](../../openspec/specs/operations/spec.md)

## Context

The concept compares three hosting variants by data sovereignty, attack surface, fit with "no hacking from outside", running costs and behaviour when the home network fails.

## Decision

Variant 1: Raspberry Pi, purely internal or through VPN, local database. Everything runs in containers (Docker Compose); only Docker is needed on the host.

## Considered alternatives

- Variant 2: Raspberry Pi with Supabase (data sovereignty "mixed", access depends on the Supabase account, free tier "risky in the long run").
- Variant 3: fully external (attack surface "largest, requires auth/hardening", independent of the home network).

## Consequences

- When the home network fails, app and database are unreachable at the same time (concept).
- The container stack is portable; a later move to variant 3 would be "the same container stack on another platform plus a DB dump" (concept).
- The resource budget of the Pi (Pi 4, 1–2 GB RAM) influences the configuration (spec `operations`, requirement "Hardening and resources").

## Sources

- `docs/KONZEPT.md` §Hosting-Varianten, §Deployment
- User instruction 2026-10-04 09:59 ("no local installation on the host but everything via docker/containers")
- `README.md` §Quick start
