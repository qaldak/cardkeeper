# Bilder Specification

## Purpose
Kartenbilder: lokale Speicherung, Hochladen, Hauptbild, Vergrösserung und Auslieferung. Bilder werden nie von den Karten-Datenbanken eingebunden, ausser den kleinen Bildern der Trefferliste bei Pokémon. Entscheid: ADR 0019. Verlauf: H-09.

## Requirements

### Requirement: Bilder werden einmal geladen und lokal gespeichert
Das System MUSS das Bild einer Karte beim Anlegen einmal von der Karten-Datenbank laden, auf dem Volume `card-images` speichern und die Karte nie mit einem fremden Bild verlinken.
Quelle: README §Features, §Notes on the card API; Test cards.test.ts, api-calls.test.ts | Herkunft: Abgeleitet | Inventar: R-027, R-213 | MUSS=SHALL

#### Scenario: Eigene Kopie
- GIVEN eine Karte wurde mit API-Bild angelegt
- WHEN die Karte angezeigt wird
- THEN kommt das Bild von `/api/images/<id>` der App

### Requirement: Ein fehlendes API-Bild verhindert das Anlegen nicht
Das System MUSS eine Karte auch dann anlegen, wenn der Bild-Download scheitert.
Quelle: Test cards.test.ts (does not block creation when the image download fails) | Herkunft: Abgeleitet | Inventar: R-076 | MUSS=SHALL

#### Scenario: Download scheitert
- GIVEN die Bildquelle antwortet mit einem Fehler
- WHEN eine Karte angelegt wird
- THEN wird die Karte ohne Bild angelegt

### Requirement: Bilder des richtigen Spiels
Das System MUSS für eine Yu-Gi-Oh!-Karte nur YGOPRODeck und für eine Pokémon-Karte nur TCGdex nach Bildern fragen, und eine Karte MUSS ihr eigenes Bild behalten.
Quelle: Chat 2026-10-08 17:52 (falsches Bild im Test); Test api-calls.test.ts | Herkunft: User-Vorgabe | Inventar: R-213 | MUSS=SHALL

#### Scenario: Gemischte Sammlung
- GIVEN je eine Karte beider Spiele
- WHEN beide angelegt werden
- THEN stammt jedes Bild von der Datenbank seines Spiels

### Requirement: Mehrere Bilder, ein Hauptbild
Das System MUSS pro Karte mehrere Bilder erlauben, das erste Bild zum Hauptbild machen, ein API-Bild beim späteren Upload als Hauptbild belassen und den Wechsel des Hauptbilds erlauben.
Quelle: KONZEPT §Datenmodell; Code server/services/images.ts; Test images.test.ts | Herkunft: Abgeleitet | Inventar: R-065, R-081 | MUSS=SHALL

#### Scenario: Erster Upload
- GIVEN eine Karte ohne Bild
- WHEN ein Bild hochgeladen wird
- THEN wird es das Hauptbild

#### Scenario: API-Bild vorhanden
- GIVEN eine Karte mit API-Bild
- WHEN ein Bild hochgeladen wird
- THEN bleibt das API-Bild das Hauptbild

#### Scenario: Wechsel
- GIVEN eine Karte mit zwei Bildern
- WHEN das zweite zum Hauptbild gemacht wird
- THEN ist nur das zweite primär

### Requirement: Upload wird geprüft
Das System MUSS einen Upload ablehnen, wenn er leer ist (400 `empty_file`), grösser als `MAX_UPLOAD_MB` (413 `file_too_large`, Standard 5) oder kein PNG, JPEG oder WebP ist (400 `unsupported_image`); der Typ wird an der Dateisignatur erkannt, nicht am gemeldeten Typ.
Quelle: Code server/services/images.ts, server/lib/image-files.ts, server/api/cards/[id]/images.post.ts; Tests images.test.ts, image-files.test.ts | Herkunft: Abgeleitet | Inventar: R-081 | MUSS=SHALL

#### Scenario: Falscher Typ
- GIVEN eine Textdatei mit Endung `.png`
- WHEN sie hochgeladen wird
- THEN lehnt das System sie mit `unsupported_image` ab

#### Scenario: Zu gross
- GIVEN eine Datei über dem Limit
- WHEN sie hochgeladen wird
- THEN lehnt das System mit 413 ab

### Requirement: Bildaktionen wirken sofort
Das System MUSS Hochladen, Hauptbild-Wechsel und Löschen eines Bildes sofort speichern (ohne weiteres „Speichern“), im Änderungsprotokoll festhalten und als Änderung des Benutzers zählen; nur der Besitzer darf sie ausführen.
Quelle: Chat 2026-10-07 18:51; Code server/services/images.ts; Tests images.test.ts, ownership.test.ts | Herkunft: Abgeleitet | Inventar: R-081, R-075 | MUSS=SHALL

#### Scenario: Upload
- GIVEN ein Besitzer lädt ein Bild hoch
- WHEN der Upload fertig ist
- THEN steht ein Audit-Eintrag und die Karte zeigt „geändert am“

### Requirement: Löschen befördert das nächste Bild
Das System MUSS beim Löschen des Hauptbildes das älteste verbleibende Bild zum Hauptbild machen und die Bilddatei entfernen.
Quelle: Code server/services/images.ts; Test images.test.ts | Herkunft: Abgeleitet | Inventar: R-081 | MUSS=SHALL

#### Scenario: Hauptbild gelöscht
- GIVEN eine Karte mit zwei Bildern
- WHEN das Hauptbild gelöscht wird
- THEN wird das andere Hauptbild und die Datei ist weg

### Requirement: Auslieferung mit Wiederholungsprüfung
Das System MUSS Bilder mit ETag, `Cache-Control: private, no-cache`, `X-Content-Type-Options: nosniff` und einem Dateinamen nach dem Kartennamen (`inline`) ausliefern, damit der Browser bei jedem Abruf prüft, ob es noch dasselbe Bild ist.
Quelle: Chat 2026-10-07 17:48, 2026-10-08 18:08 (Cache); Code server/api/images/[id]/index.get.ts | Herkunft: User-Vorgabe | Inventar: R-016, R-082 | MUSS=SHALL

#### Scenario: Erneuter Abruf
- GIVEN ein Browser hat das Bild bereits
- WHEN er es mit passendem `If-None-Match` anfragt
- THEN antwortet das System mit 304

#### Scenario: Speichern unter
- GIVEN das Bild einer Karte „Dunkler Magier“
- WHEN es im Browser gespeichert wird
- THEN lautet der vorgeschlagene Name „Dunkler Magier.webp“

### Requirement: Vergrösserung im Dialog
Das System MUSS ein Bild in einem Dialog vergrössern, der sich mit Klick auf das Bild, Esc oder dem Kreuz schliesst, bei mehreren Bildern per grossen Pfeilflächen und Pfeiltasten wechselt, die Bildnummer zeigt und einen Download-Knopf hat; das Kontextmenü des Bildes MUSS erhalten bleiben.
Quelle: Chat 2026-10-07 17:18, 17:48; README §Features; Code app/app/pages/cards/[id].vue | Herkunft: User-Vorgabe | Inventar: R-016 | MUSS=SHALL

#### Scenario: Klick aufs Bild
- GIVEN der Dialog ist offen
- WHEN auf das Bild geklickt wird
- THEN schliesst der Dialog

#### Scenario: Rechtsklick
- GIVEN der Dialog ist offen
- WHEN ein Rechtsklick auf das Bild erfolgt
- THEN bleibt der Dialog offen und das Browser-Menü „Bild speichern“ erscheint

### Requirement: Bildplatzhalter
Das System SOLL für eine Karte ohne Bild einen Platzhalter „Bild“ zeigen und bei Karten-Datenbank-Bildern, die fehlen, auf das nächste Format zurückfallen und sonst einen leeren Kasten gleicher Grösse zeigen.
Quelle: Code app/app/components/RemoteImage.vue, app/app/components/CardTile.vue; Test image-fallback.test.ts | Herkunft: Abgeleitet | Inventar: R-016 | MUSS=SHALL

#### Scenario: Karte ohne Bild
- GIVEN eine Karte ohne Bild
- WHEN die Übersicht angezeigt wird
- THEN steht im Bildfeld der Text „Bild“
