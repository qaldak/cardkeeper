# ADR 0014: Filtern und Sortieren der Übersicht im Speicher über alle Treffer

- **Status:** Akzeptiert
- **Datum:** nicht dokumentiert
- **Herkunft:** Abgeleitet (Code-Kommentar; im Chat nicht besprochen).
- **Inventar:** D-029, R-084, R-085, R-086
- **Specs:** [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [`karten-blaettern`](../../openspec/specs/karten-blaettern/spec.md), [`export`](../../openspec/specs/export/spec.md)

## Kontext

Level und Preis lassen sich nicht direkt in der Datenbank sortieren (sie stehen in JSONB bzw. in der Preishistorie); die Sammlung ist klein (Code-Kommentar in `cards.ts`).

## Entscheid

Die Liste lädt die Treffer und filtert, sortiert und seitet im Speicher; Zusammenfassung (Anzahl, Total) über alle Treffer. Die Nachbarn-Abfrage und der Export verwenden dieselbe Filter- und Sortierlogik.

## Betrachtete Alternativen

nicht dokumentiert.

## Konsequenzen

- Skaliert nur, solange die Sammlung klein bleibt (Annahme des Code-Kommentars).
- Einheitliche Reihenfolge in Liste, Blättern und Export.

## Quellen

- `app/server/services/cards.ts` (Kommentar in `list`), `app/server/lib/card-filters.ts`, `card-sort.ts`
