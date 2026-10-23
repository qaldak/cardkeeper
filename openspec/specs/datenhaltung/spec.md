# Datenhaltung Specification

## Purpose
Datenmodell-Invarianten der Sammlung: schreibgeschützte Kartendaten, Übersetzungen, Rohdaten-Snapshots, Audit-Log und Editionsschlüssel samt Startprüfung. Entscheide: ADR 0003, 0005, 0006, 0010, 0011. Verlauf: H-08.

## Requirements

### Requirement: Tabellen
Das System MUSS die Sammlung in den Tabellen `games`, `cards` (eine Zeile je physischer Karte), `card_sets`, `card_translations`, `price_history`, `status_history`, `users`, `api_snapshots`, `card_images`, `audit_log` und `price_refresh_runs` führen.
Quelle: README §Data model; Code app/prisma/schema.prisma | Herkunft: Abgeleitet | Inventar: D-004, D-005 | MUSS=SHALL

#### Scenario: Karte
- GIVEN eine erfasste Karte
- WHEN sie gespeichert wird
- THEN gibt es eine Zeile in `cards` und je Sprache eine in `card_translations`

### Requirement: Spielspezifische Werte als JSONB
Das System MUSS spielspezifische Werte in `cards.game_specific_attributes` (JSONB) speichern.
Quelle: KONZEPT §Datenmodell; README §Data model | Herkunft: Abgeleitet | Inventar: D-007 | MUSS=SHALL

#### Scenario: Neues Spiel
- GIVEN ein neues Spiel
- WHEN es hinzugefügt wird
- THEN ist keine Schemaänderung nötig

### Requirement: Texte je Sprache
Das System MUSS sprachabhängige Texte in `card_translations` (eine Zeile je Karte und Sprache) speichern; `cards.name` MUSS der Anzeigename in der bevorzugten Sprache sein.
Quelle: README §Data model | Herkunft: Abgeleitet | Inventar: D-012 | MUSS=SHALL

#### Scenario: Anzeigename
- GIVEN eine Karte mit deutschem und englischem Namen
- WHEN sie gelesen wird
- THEN ist `cards.name` der deutsche Name

### Requirement: Kartendaten schreibgeschützt
Das System MUSS Namen, Texte und Attribute schreibgeschützt führen; editierbar MÜSSEN nur Set-Code und Edition bzw. Variante des Drucks (`card_sets`) sein, `manual_overrides` entfällt.
Quelle: README §Data model; Code app/prisma/schema.prisma | Herkunft: Abgeleitet | Inventar: D-013 | MUSS=SHALL

#### Scenario: Name
- GIVEN die Detailseite einer Karte ist offen
- WHEN der Name angezeigt wird
- THEN ist er nicht editierbar

### Requirement: Status als Schlüssel
Das System MUSS den Status als sprachneutrales Enum (`ACTIVE`, `SOLD`, `TRADED`, `GIFTED`, `LOST`) speichern und in der Oberfläche übersetzen.
Quelle: README §Data model; Code app/prisma/schema.prisma | Herkunft: Abgeleitet | Inventar: D-011 | MUSS=SHALL

#### Scenario: Anzeige
- GIVEN Status `SOLD` und Oberfläche Deutsch
- WHEN die Karte angezeigt wird
- THEN steht dort „Verkauft“

### Requirement: Editionen als Schlüssel
Das System MUSS die aufgedruckten Yu-Gi-Oh!-Editionen als Schlüssel `FIRST_EDITION` und `LIMITED_EDITION` speichern; „Unlimited“ MUSS NULL sein.
Quelle: Chat 2026-10-08 17:42–18:18; README §Data model | Herkunft: User-Vorgabe | Inventar: D-014 | MUSS=SHALL

#### Scenario: Unlimited
- GIVEN eine Karte ohne Edition-Aufdruck
- WHEN sie gespeichert wird
- THEN ist die Edition NULL

### Requirement: Startprüfung der Editionen
Das System MUSS beim Start im Log (`[editions] …`) die Editionswerte melden, die keinem Schlüssel entsprechen, mit einem `UPDATE` zum Kopieren; solche Werte MÜSSEN unverändert bleiben.
Quelle: Chat 2026-10-08 18:18 („Andere Werte bleiben… Logeintrag im Docker Container“); Code app/server/plugins/editions.ts | Herkunft: User-Vorgabe | Inventar: R-104 | MUSS=SHALL

#### Scenario: Fremder Wert
- GIVEN eine Karte mit Edition „Sonder“
- WHEN die Anwendung startet
- THEN meldet das Log den Wert und lässt ihn stehen

### Requirement: Unveränderliche Rohdaten
Das System MUSS je Abruf und Sprache die unveränderte Antwort der Karten-DB in `api_snapshots` ablegen, ohne sie später zu ändern.
Quelle: README §Data model („immutable raw API responses“) | Herkunft: Abgeleitet | Inventar: D-012 | MUSS=SHALL

#### Scenario: Aktualisierung
- GIVEN eine Karte wird aktualisiert
- WHEN die Antwort eintrifft
- THEN wird ein weiterer Snapshot angehängt

### Requirement: Audit-Log und „geändert am“
Das System MUSS Änderungen von Benutzern im Audit-Log festhalten (alter und neuer Wert) und „geändert am“ erst zeigen, wenn ein Benutzer etwas geändert hat; ein Refresh von der API zählt nicht.
Quelle: Chat 2026-10-04 19:40 („‚geändert am‘ + Datum“); README §Features; Code app/server/services/cards.ts | Herkunft: User-Vorgabe | Inventar: R-033, R-077, R-080 | MUSS=SHALL

#### Scenario: Refresh
- GIVEN eine Karte wird nur von der API aktualisiert
- WHEN sie angezeigt wird
- THEN steht „geändert am“ nicht da

#### Scenario: Gleicher Wert
- GIVEN ein Benutzer speichert unveränderte Werte
- WHEN er speichert
- THEN entsteht keine Audit-Zeile

### Requirement: Bilddateien im Volume
Das System MUSS Bilddateien im Volume `card-images` ablegen und in `card_images` nur relative Pfade speichern.
Quelle: README §Data model; Code app/server/lib/image-files.ts | Herkunft: Abgeleitet | Inventar: D-046 | MUSS=SHALL

#### Scenario: Bild
- GIVEN ein gespeichertes Bild
- WHEN die Zeile gelesen wird
- THEN ist der Pfad relativ
