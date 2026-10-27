# ADR 0003: PostgreSQL 16 with Prisma for data storage

- **Status:** Accepted
- **Date:** 2026-10-03 (concept)
- **Origin:** User requirement (concept of the user; confirmed by the user on 2026-10-23).
- **Specs:** [`data-storage`](../../openspec/specs/data-storage/spec.md), [`operations`](../../openspec/specs/operations/spec.md)

## Context

The concept demands JSONB for game-specific attributes, arm64 support (Raspberry Pi) and time-series capability for the price history, as well as type-safe access and simple migrations.

## Decision

PostgreSQL 16 as the database, Prisma as the ORM. The app uses its own database role without superuser rights; migrations are applied on every start.

## Considered alternatives

Not documented.

## Consequences

- Data model and invariants: spec `data-storage`.
- Database without a published port, two volumes (`db-data`, `card-images`): spec `operations`.
- The Prisma client is generated in the image; the runtime image contains only the Prisma CLI for migrations.

## Sources

- `docs/KONZEPT.md` §Tech-Stack, §Datenmodell
- `README.md` (7f3d955) §Data model, §Quick start
- `app/prisma/schema.prisma`
