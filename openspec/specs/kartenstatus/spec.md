# Kartenstatus Specification

## Purpose
Lebenszyklus einer Karte (aktiv, verkauft, getauscht, verschenkt, verloren) mit Datum, Gegenpartei und Verlauf. Entscheid: [ADR 0010](../../../docs/adr/0010-status-als-enum.md) (sprachneutrales Enum).

## Requirements

### Requirement: Fünf Statuswerte
Das System MUSS für jede Karte genau einen der Status aktiv, verkauft, getauscht, verschenkt oder verloren führen (neue Karten: aktiv) und diese in der Oberfläche in der gewählten Sprache anzeigen.
Quelle: README §Features, §Data model; KONZEPT §Datenmodell; Chat 2026-10-04 09:59 (Konzept); Code shared/utils/status.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Neue Karte
- GIVEN eine Karte wird angelegt
- WHEN sie gespeichert ist
- THEN hat sie den Status aktiv und eine erste Zeile im Statusverlauf

#### Scenario: Sprachneutral
- GIVEN eine Karte ist verkauft
- WHEN die Oberfläche auf Englisch steht
- THEN zeigt sie „Sold“

### Requirement: Datum und Person
Das System MUSS bei jedem Status ausser aktiv ein Datum führen (Standard: heute) und bei verkauft, getauscht und verschenkt eine Person; bei verloren und aktiv MUSS eine übergebene Person verworfen werden.
Quelle: Entscheid des Benutzers (2026-10-23: Datum auch bei verloren); Code server/lib/status.ts; Test status.test.ts, cards.test.ts; KONZEPT §Datenmodell | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Verkauft mit Person
- GIVEN eine aktive Karte
- WHEN sie als verkauft mit Person „Max“ gespeichert wird
- THEN steht im Verlauf das heutige Datum und „Max“

#### Scenario: Verloren mit Person
- GIVEN eine aktive Karte
- WHEN sie als verloren mit einer Person gespeichert wird
- THEN wird die Person nicht gespeichert

### Requirement: Statuswechsel erzeugt Verlaufszeile
Das System MUSS bei einem Statuswechsel eine neue Zeile im Statusverlauf anhängen (Status, Datum, Person, ändernder Benutzer) und den Wechsel im Änderungsprotokoll festhalten.
Quelle: Code server/services/cards.ts (update); Test cards.test.ts (tracks status changes) | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Wechsel
- GIVEN eine aktive Karte
- WHEN sie auf verkauft gesetzt wird
- THEN hängt das System eine Verlaufszeile an und schreibt einen Audit-Eintrag `status`

### Requirement: Korrektur des aktuellen Status
Das System MUSS Datum oder Person des aktuellen (nicht aktiven) Status in der letzten Verlaufszeile korrigieren statt eine neue anzulegen.
Quelle: Code server/services/cards.ts (update); Test cards.test.ts (corrects date and person in place) | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Datum korrigieren
- GIVEN eine Karte ist verkauft
- WHEN nur das Datum geändert wird
- THEN wird die letzte Verlaufszeile aktualisiert und keine neue angelegt

### Requirement: Ungültiges Datum wird abgelehnt
Das System MUSS ein Statusdatum ablehnen, das kein echtes Kalenderdatum im Format `YYYY-MM-DD` ist.
Quelle: Code server/lib/dates.ts, server/lib/schemas.ts; Test cards.test.ts (rejects an invalid status date) | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Kein Datum
- GIVEN eine Karte wird auf verkauft gesetzt
- WHEN das Datum `2026-13-40` lautet
- THEN antwortet das System mit einem 400-Fehler

### Requirement: Statusanzeige
Das System SOLL den Status farbig kennzeichnen: aktiv grün, verloren rot, alle anderen neutral.
Quelle: Code app/app/components/StatusBadge.vue (Kommentar: nach den UI-Mockups) | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Abzeichen
- GIVEN Karten mit den Status aktiv, verloren und verkauft
- WHEN die Übersicht angezeigt wird
- THEN erscheinen grün, rot und neutral
