# Karten blättern Specification

## Purpose
Zwischen den Karten der aktuellen Auswahl der Übersicht auf der Detailseite blättern (zurück/weiter, auch mit den Pfeiltasten). Die Auswahl (Filter, Sortierung) reist in der Adresse der Karte mit. Übersicht: `uebersicht`; Detailseite: `karte-detail`.

## Requirements

### Requirement: Kontext in der Adresse
Das System MUSS Filter und Sortierung der Übersicht beim Öffnen einer Karte in deren Adresse mitgeben (`nav=1` und die Parameter), damit die Detailseite die Reihenfolge der Übersicht kennt; eine Karte ohne `nav=1` (Direktlink, neue Karte) zeigt kein Blättern.
Quelle: Chat 2026-10-21 11:00, 11:02 (URL ist okay); Code shared/utils/overview-query.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Aus der Übersicht
- GIVEN eine Auswahl nach Name sortiert
- WHEN eine Karte geöffnet wird
- THEN enthält die Adresse `nav=1`, Besitzer, Spiel, Sortierung und Richtung

#### Scenario: Direktlink
- GIVEN eine Adresse ohne `nav=1`
- WHEN die Karte geöffnet wird
- THEN erscheinen keine Blätter-Knöpfe

### Requirement: Zurück und weiter mit Umlauf
Das System MUSS auf der Detailseite „zurück“ und „weiter“ mit der Position („3 / 120“) anbieten, in der Reihenfolge der Auswahl der Übersicht, nach der letzten Karte die erste und vor der ersten die letzte zeigen; bei nur einer Karte sind beide Knöpfe nicht aktiv.
Quelle: Chat 2026-10-21 11:00, 11:02 (Umlauf); Code server/services/cards.ts (neighbors); Test cards.test.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Umlauf
- GIVEN die letzte Karte der Auswahl
- WHEN „weiter“ geklickt wird
- THEN erscheint die erste Karte

#### Scenario: Zurück am Anfang
- GIVEN die erste Karte der Auswahl
- WHEN „zurück“ geklickt wird
- THEN erscheint die letzte Karte

### Requirement: Nachbarn-Schnittstelle
Das System MUSS `GET /api/cards/<id>/neighbors` mit denselben Filtern und derselben Sortierung wie die Liste anbieten und Position, Anzahl, Vorgänger, Nachfolger und die Übersichtsseite der Karte liefern, bei einer Karte ausserhalb der Auswahl `position: null`.
Quelle: Code server/api/cards/[id]/neighbors.get.ts, server/services/cards.ts; Test cards.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Ausserhalb
- GIVEN eine Karte passt nicht mehr zu den Filtern
- WHEN ihre Nachbarn angefragt werden
- THEN ist `position` null, ohne Vorgänger und Nachfolger

#### Scenario: Seite
- GIVEN Seitengrösse 2 und die Karte an Position 3
- WHEN die Seite angefragt wird
- THEN ist es Seite 2

### Requirement: Rückfrage bei ungespeicherten Änderungen
Das System MUSS beim Blättern bei ungespeicherten Änderungen im Formular fragen, ob gespeichert werden soll (Speichern, Verwerfen, Abbrechen), und nach „Speichern“ nur bei Erfolg wechseln.
Quelle: Chat 2026-10-21 11:02 (3.a); Code app/app/pages/cards/[id].vue | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Verwerfen
- GIVEN geänderte, nicht gespeicherte Felder
- WHEN „weiter“ geklickt und „Verwerfen“ gewählt wird
- THEN wechselt die Seite ohne zu speichern

#### Scenario: Abbrechen
- GIVEN geänderte Felder
- WHEN „Abbrechen“ gewählt wird
- THEN bleibt die Karte offen

### Requirement: Zurück zur Übersicht auf der Seite der Karte
Das System MUSS „Zur Übersicht“ auf die Seite der Übersicht führen, auf der die aktuelle Karte liegt, mit den Filtern und der Sortierung der Auswahl.
Quelle: Chat 2026-10-21 11:02 (5. ok); Code app/app/pages/cards/[id].vue (overviewLink) | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Weitergeblättert
- GIVEN der Benutzer blätterte auf eine Karte der Seite 3
- WHEN „Zur Übersicht“ geklickt wird
- THEN zeigt die Übersicht Seite 3 mit denselben Filtern

### Requirement: Pfeiltasten blättern
Das System MUSS auf einer aus der Übersicht geöffneten Karte ← und → zum Blättern nutzen, ausser bei offenem Bildzoom (dort Bilderwechsel), bei Fokus in einem Feld oder einer Liste, bei offenem Dialog oder mit Zusatztaste (Alt, Strg, Meta, Umschalt); ohne `nav=1` bewirken sie nichts.
Quelle: Chat 2026-10-21 11:46, 11:48; Code app/app/pages/cards/[id].vue (onArrowKey) | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Taste im Feld
- GIVEN der Cursor steht im Set-Code-Feld
- WHEN ← gedrückt wird
- THEN bewegt sich nur der Cursor

#### Scenario: Bildzoom
- GIVEN der Bildzoom ist offen
- WHEN → gedrückt wird
- THEN wechselt das Bild und nicht die Karte
