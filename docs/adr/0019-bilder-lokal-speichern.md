# ADR 0019: Kartenbilder lokal im Volume speichern, nicht hotlinken

- **Status:** Akzeptiert
- **Datum:** 2026-10-03 (Konzept); Vorschaubilder: 2026-10-09
- **Herkunft:** User-Vorgabe (Konzept des Benutzers, vom Benutzer am 2026-10-23 bestätigt); das Bild schon bei Suche und Auswahl ist eine User-Vorgabe (Chat 2026-10-09 20:52), die Umsetzung über eine eigene Kopie ein Entscheid des Assistenten (20:58).
- **Specs:** [`bilder`](../../openspec/specs/bilder/spec.md), [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md)

## Kontext

Das Konzept hält Bilder in einem lokalen Docker-Volume (`/data/card-images/`), „kein DB-Blob“. Am 2026-10-09 20:52 verlangte der Benutzer das Kartenbild schon bei Suche und Auswahl, auch bei Yu-Gi-Oh!; YGOPRODeck verbietet das Einbinden („nicht hotlinken“, Assistent 20:58).

## Entscheid

Bilder werden einmal heruntergeladen und im Volume `card-images` gespeichert; die Tabelle `card_images` hält nur relative Pfade. Für Yu-Gi-Oh!-Vorschaubilder in der Suche gibt es eine eigene Kopie (`/api/thumbnails/ygo/<passcode>`, höchstens 4 gleichzeitig). Pokémon-Bilder der Suche kommen direkt von TCGdex. Heruntergeladen wird nur über HTTPS von den vom Adapter deklarierten Hosts.

## Betrachtete Alternativen

- Bilder als Datenbank-Blob (Konzept: ausgeschlossen).
- Hotlinking der Bilder von YGOPRODeck (verworfen).

## Konsequenzen

- Das Volume `card-images` muss gesichert werden (README §Backup).
- Beim Löschen einer Karte werden Bilddateien und Verzeichnis entfernt.

## Quellen

- `docs/KONZEPT.md` §Datenmodell
- Chat 2026-10-09 20:52, 20:58
- `README.md` §Features, §Notes on the card API
- `app/server/services/thumbnails.ts`, `images.ts`
