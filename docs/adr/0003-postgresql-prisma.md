# ADR 0003: PostgreSQL 16 mit Prisma als Datenhaltung

- **Status:** Akzeptiert
- **Datum:** 2026-10-03 (Konzept)
- **Herkunft:** Abgeleitet (Konzept des Benutzers; Q-007).
- **Inventar:** D-004, D-005, R-036, R-038
- **Specs:** [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [`betrieb`](../../openspec/specs/betrieb/spec.md)

## Kontext

Das Konzept fordert JSONB für spielspezifische Attribute, arm64-Unterstützung (Raspberry Pi) und Zeitreihenfähigkeit für die Preishistorie sowie typsichere Zugriffe und einfache Migrationen.

## Entscheid

PostgreSQL 16 als Datenbank, Prisma als ORM. Die App nutzt eine eigene Datenbankrolle ohne Superuser; Migrationen werden bei jedem Start angewendet.

## Betrachtete Alternativen

nicht dokumentiert.

## Konsequenzen

- Datenmodell und Invarianten: Spec `datenhaltung`.
- Datenbank ohne veröffentlichten Port, zwei Volumes (`db-data`, `card-images`): Spec `betrieb`.
- Prisma-Client wird im Image erzeugt; im Laufzeit-Image liegt nur die Prisma-CLI für Migrationen (D-033).

## Quellen

- `docs/KONZEPT.md` §Tech-Stack, §Datenmodell
- `README.md` §Data model, §Quick start
- `app/prisma/schema.prisma`
