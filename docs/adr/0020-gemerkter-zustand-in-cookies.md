# ADR 0020: Gemerkter Zustand der Bedienung in Cookies

- **Status:** Akzeptiert
- **Datum:** 2026-10-06 und 2026-10-20
- **Herkunft:** User-Vorgabe für das Verhalten (Chat 2026-10-06 07:31, 13:08; 2026-10-20 09:09); die Wahl von Cookies als Speicherort stammt vom Assistenten bzw. vom Benutzer im Wortlaut „(cookie)“ (13:08).
- **Inventar:** D-042, R-002, R-003, R-089
- **Specs:** [`uebersicht`](../../openspec/specs/uebersicht/spec.md), [`kartenerfassung`](../../openspec/specs/kartenerfassung/spec.md), [`oberflaeche`](../../openspec/specs/oberflaeche/spec.md)

## Kontext

Der Benutzer wollte, dass sich die App das zuletzt gewählte Spiel beim Erfassen merkt, dass die Übersicht „Alle Spiele“ als Standard hat und die letzte Einstellung behält, und am 2026-10-20, dass die Filter beim Zurück zur Übersicht erhalten bleiben, bei Neuanmeldung oder Neustart aber auf den Standard (eigene Person) zurückgehen.

## Entscheid

Der Zustand liegt in Cookies: `cardkeeper-last-game` (Erfassen, 1 Jahr), `cardkeeper-overview-game` (Spiel der Übersicht), `cardkeeper-overview-query` (Filter, Sortierung, Seite; Session-Cookie, bei Login/Logout gelöscht) und `cardkeeper_locale` (Sprache). Das Erscheinungsbild wird im Browser gemerkt.

## Betrachtete Alternativen

nicht dokumentiert (frühere Standards: Yu-Gi-Oh! als Standardspiel, Besitzer „alle“; siehe `history.md` H-04, H-05, H-16).

## Konsequenzen

- Der Zustand gilt je Browser, nicht je Benutzerkonto.
- Die Übersicht stellt die gemerkte Auswahl nur beim Aufruf von `/` ohne Parameter wieder her.

## Quellen

- Chat 2026-10-06 07:31, 13:08; 2026-10-20 09:09
- `docs/spec-migration/history.md` H-04, H-05, H-16
- `app/shared/utils/overview-query.ts`, `app/app/middleware/overview-query.global.ts`
