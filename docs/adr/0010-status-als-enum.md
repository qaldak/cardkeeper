# ADR 0010: Kartenstatus als sprachneutrales Enum

- **Status:** Akzeptiert
- **Datum:** 2026-10-04
- **Herkunft:** Abgeleitet (Entscheid des Assistenten, im Chat als Abweichung vom Konzept genannt und nicht beanstandet; Chat 2026-10-04 10:43).
- **Inventar:** D-011, D-035
- **Specs:** [`kartenstatus`](../../openspec/specs/kartenstatus/spec.md), [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md)

## Kontext

Das Konzept nennt die Status-Werte in Deutsch (`aktiv`, `verkauft`, `getauscht`, `verschenkt`, `verloren`) als Dropdown. Die Oberfläche ist zweisprachig (Deutsch/Englisch).

## Entscheid

Der Status wird als Enum `ACTIVE`, `SOLD`, `TRADED`, `GIFTED`, `LOST` gespeichert und in der Oberfläche übersetzt (`status.<KEY>`). Datum und Person gehören zur Verlaufszeile (`status_history`).

## Betrachtete Alternativen

- Deutsche Werte in der Datenbank (Konzept); durch das Enum ersetzt, Begründung im Chat nicht ausführlich dokumentiert.

## Konsequenzen

- Neue Status brauchen eine Migration und Übersetzungen.
- Export und Anzeige übersetzen den Status in der gewählten Sprache.

## Quellen

- `docs/KONZEPT.md` §Datenmodell
- `README.md` §Data model
- Chat 2026-10-04 10:43 (D-035)
- `app/prisma/schema.prisma`
