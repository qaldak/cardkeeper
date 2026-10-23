# ADR 0011: Yu-Gi-Oh!-Editionen als Schlüssel, „Unlimited“ als leerer Wert

- **Status:** Akzeptiert
- **Datum:** 2026-10-07 bis 2026-10-08
- **Herkunft:** User-Vorgabe (schrittweise im Chat entschieden).
- **Inventar:** D-014, R-025, R-104
- **Specs:** [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md)

## Kontext

Die YGOPRODeck-API liefert keine Edition, sie muss pro physischer Karte erfasst werden. Der Verlauf: Freitext (bis 2026-10-07 19:37), Schaltflächen mit englischen Werten (19:44), Schlüssel `FIRST_EDITION`, `UNLIMITED`, `LIMITED_EDITION` mit Übersetzung (21:15–21:40), schliesslich nur `FIRST_EDITION` und `LIMITED_EDITION`, „Unlimited“ = leer (2026-10-08 17:42–18:18), weil „Unlimited“ auf der Karte nicht steht.

## Entscheid

Aufgedruckte Editionen werden als Schlüssel `FIRST_EDITION` und `LIMITED_EDITION` gespeichert und beim Anzeigen übersetzt; „Unlimited“ ist NULL; der Freitext entfällt. Werte, die keinem Schlüssel entsprechen, bleiben stehen und werden beim Start im Log gemeldet (mit SQL-Vorschlag). Eine Migration setzt Werte mit „1st“ oder „1.“ auf `FIRST_EDITION`.

## Betrachtete Alternativen

- Freitext (verworfen).
- Schaltflächen mit englischen Werten (verworfen).
- Schlüssel inklusive `UNLIMITED` (verworfen, weil „Unlimited“ nicht aufgedruckt ist).

## Konsequenzen

- Weniger Fehleranfälligkeit; die Datenbereinigung fremder Werte erfolgt per SQL durch den Benutzer.
- Eine neue Edition ist ein weiterer Schlüssel in `shared/utils/editions.ts` mit Übersetzungen.
- Bei Pokémon hält dieselbe Spalte den Variantenschlüssel (`normal`, `reverse`, …).

## Quellen

- Chat 2026-10-07 19:37, 19:44, 21:15, 21:37; 2026-10-08 17:42, 17:52, 18:13, 18:18
- `docs/spec-migration/history.md` H-08
- `README.md` §Data model
- `app/server/plugins/editions.ts`, `app/shared/utils/editions.ts`
