# ADR 0013: CSV-Export serverseitig, ausgelöst über ein Menü „Exportieren“

- **Status:** Akzeptiert
- **Datum:** 2026-10-21/22 (Anforderung), 2026-10-23 (Korrekturen)
- **Herkunft:** User-Vorgabe (Anforderung, Format, Platzierung); serverseitige Umsetzung: Abgeleitet.
- **Specs:** [`export`](../../openspec/specs/export/spec.md)

## Kontext

Das Konzept nannte einen Export als PDF, CSV und Markdown; am 2026-10-21/22 verlangte der Benutzer einen Export, „geeignet für einen AI-Prompt“ und für Excel, in Phase 1 nur für die eigenen Karten. Nach Mockup und Rückfragen (2026-10-22 11:26–11:53) legte der Benutzer fest: alle Attribute ohne Bilder als CSV, Sprache nach Auswahl mit Rückfall Englisch, Auswahl nach Filter ohne Einschränkung auf Status und Benutzer, Reihenfolge wie die Detailseite, nur der letzte Preis, Download statt Öffnen, Semikolon, Umsetzung nach Mockup.

## Entscheid

Der Export läuft serverseitig (`GET /api/export/cards`) über alle Seiten mit derselben Filter- und Sortierlogik wie die Liste. Format: Semikolon, UTF-8 mit BOM, CRLF, Formelschutz. Auslösung über das Menü „Exportieren“ neben der Sortierung; „Für KI kopieren“ und „Liste drucken“ sind deaktivierte Platzhalter.

## Betrachtete Alternativen

- Platzierung neben „+ Karte hinzufügen“ (Rückfrage des Benutzers, 2026-10-22; Menü neben der Sortierung gewählt).
- Export als Dialog („Wizard“) statt direkter Aktion (Rückfrage des Benutzers; Dialog mit Auswahl gewählt).
- Export im Browser: nicht dokumentiert.
- PDF und Markdown (Konzept): nicht umgesetzt.

## Konsequenzen

- Der Export erfasst auch Karten anderer Benutzer und alle Status.
- Die Oberfläche öffnet den Download über einen normalen externen Link, weil ein Router-Link zu einem 404 führte (Fehlerbehebung nach der Meldung des Benutzers, 2026-10-23).
- Offen: Inhalt der KI-Kopie.

## Quellen

- Chat 2026-10-21/22 (Anforderung), 2026-10-22 11:26, 11:46, 11:53; 2026-10-23 14:59, 15:05, 15:23
- `docs/KONZEPT.md` §Architektur
- `app/server/api/export/cards.get.ts`, `app/server/services/export.ts`
