# Kartendetail Specification

## Purpose
Die Detailseite einer Karte: Texte in mehreren Sprachen, die wenigen änderbaren Felder, Aktualisieren aus der Karten-Datenbank, Löschen und Anzeige der Änderungen. Status steht in `kartenstatus`, Bilder in `bilder`, Preisverlauf in `preise`, Blättern in `karten-blaettern`. Entscheide: [ADR 0006](../../../docs/adr/0006-texte-pro-sprache.md) (Texte pro Sprache), [ADR 0011](../../../docs/adr/0011-editionen-als-schluessel.md) (Editionen).

## Requirements

### Requirement: Texte in mehreren Sprachen mit Umschalter
Das System MUSS die Texte einer Karte in Deutsch und Englisch (Pokémon zusätzlich Japanisch) mit einem Sprachumschalter zeigen, Deutsch zuerst wählen, wenn vorhanden, und eine Sprache, die die Karte nicht hat, nicht wählbar machen.
Quelle: Chat 2026-10-04 19:40 (3), 2026-10-05 18:57; README §Features; Code app/app/pages/cards/[id].vue | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Deutsch zuerst
- GIVEN eine Karte mit deutschem und englischem Text
- WHEN die Detailseite geöffnet wird
- THEN ist Deutsch gewählt

#### Scenario: Fehlende Sprache
- GIVEN eine Karte nur mit englischem Text
- WHEN die Detailseite geöffnet wird
- THEN ist die Auswahl Deutsch nicht möglich

### Requirement: Daten aus der Karten-Datenbank sind schreibgeschützt
Das System MUSS Namen, Texte und Attribute einer Karte schreibgeschützt anzeigen und als änderbare Kartendaten nur Set-Code und Edition (bei Pokémon die Variante) zulassen, ohne eine Beschriftung „änderbar“.
Quelle: Chat 2026-10-04 19:40 (5), 2026-10-05 17:18; README §Data model; Code server/lib/schemas.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Name ändern
- GIVEN ein Änderungsaufruf enthält einen Namen
- WHEN er gesendet wird
- THEN lehnt das System ihn ab (nur `set`, `ownerId`, `purchaseDate`, Status erlaubt)

### Requirement: Set-Code und Edition gelten für alle Sprachen
Das System MUSS Änderungen an Set-Code und Edition für alle Sprachen der Karte übernehmen, weil sie die tatsächliche Karte beschreiben (z. B. deutsche oder japanische Drucke).
Quelle: Chat 2026-10-04 19:40 (5); README §Data model | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Deutscher Druck
- GIVEN eine Karte mit englischem Set-Code
- WHEN der Set-Code auf `LOB-DE005` geändert wird
- THEN gilt der Code in Deutsch und Englisch

### Requirement: Set-Code in Grossbuchstaben
Das System MUSS die Eingabe im Set-Code-Feld sofort in Grossbuchstaben umwandeln, ohne den Cursor zu verschieben.
Quelle: Chat 2026-10-08 18:18 („immer UPPERCASE“); Code app/app/pages/cards/[id].vue (upperCaseSetCode) | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Kleinbuchstaben
- GIVEN das Set-Code-Feld ist leer
- WHEN `lob-005` getippt wird
- THEN zeigt das Feld `LOB-005`

### Requirement: Edition bei Yu-Gi-Oh!
Das System MUSS die Edition auf der Kartenseite als Dropdown mit „1. Auflage“ und „Limitierte Auflage“ anbieten, den Wert über ein ✕ leeren können (Unlimited = leer), kein Freitextfeld und keinen Eintrag „Ohne Aufdruck“ enthalten, und einen bereits gespeicherten fremden Text als zusätzlichen Eintrag sichtbar halten.
Quelle: Chat 2026-10-08 17:42, 17:52, 18:13; README §Data model; Code app/app/pages/cards/[id].vue | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Leeren
- GIVEN eine Karte mit „1. Auflage“
- WHEN das ✕ geklickt und gespeichert wird
- THEN ist die Edition leer und der Platzhalter „Keine Edition“ erscheint

#### Scenario: Fremder Text
- GIVEN eine Karte mit Edition „Special Edition“
- WHEN die Seite geöffnet wird
- THEN erscheint „Special Edition“ als vierter Eintrag und geht beim Speichern nicht verloren

### Requirement: Variante bei Pokémon
Das System MUSS bei Pokémon-Karten die Variante nur unter den Varianten anbieten, die die Karte laut Datenbank hat (und der gespeicherten), und eine andere mit 400 `invalid_variant` ablehnen; die Karten-ID ist nicht änderbar (400 `field_not_editable`).
Quelle: Chat 2026-10-05 18:58 (Fragerunde), 2026-10-10 20:33; README §Pokémon; Code server/services/cards.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Nur eine Variante
- GIVEN eine Karte, die es nur als Holo gibt
- WHEN die Detailseite geöffnet wird
- THEN bietet das Dropdown nur Holo an (keine Änderung gewünscht)

#### Scenario: Unbekannte Variante
- GIVEN eine Karte ohne Variante `firstEdition`
- WHEN diese per API gesetzt wird
- THEN lehnt das System mit `invalid_variant` ab

### Requirement: Speichern mit Änderungsprotokoll
Das System MUSS Änderungen an Set-Code, Edition, Besitzer, Kaufdatum und Status über „Speichern“ übernehmen, jede geänderte Eigenschaft mit altem und neuem Wert im Änderungsprotokoll festhalten und bei unveränderten Werten nichts protokollieren und „geändert am“ nicht setzen.
Quelle: Code server/services/cards.ts (update); Tests cards.test.ts (does nothing…), ownership.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Änderung
- GIVEN eine Karte mit Set-Code `LOB-005`
- WHEN er auf `LOB-DE005` geändert wird
- THEN enthält das Änderungsprotokoll `set.setCode` mit altem und neuem Wert und `userModifiedAt` ist gesetzt

#### Scenario: Keine Änderung
- GIVEN unveränderte Werte
- WHEN gespeichert wird
- THEN entsteht kein Protokolleintrag

### Requirement: Hinweis „geändert am“
Das System MUSS in der Kopfzeile der Karte hinter der Herkunft („aus API übernommen“ oder „manuell erfasst“) „geändert am“ mit Datum zeigen, sobald ein Benutzer etwas geändert hat; Aktualisieren aus der API zählt nicht.
Quelle: Chat 2026-10-04 19:40 (4); README §Features; Code app/app/pages/cards/[id].vue | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Nach Änderung
- GIVEN ein Benutzer ändert die Edition
- WHEN die Karte geöffnet wird
- THEN zeigt die Kopfzeile „aus API übernommen · geändert am <Datum>“

#### Scenario: Nach Refresh
- GIVEN eine Karte wird nur aktualisiert
- WHEN sie geöffnet wird
- THEN fehlt „geändert am“

### Requirement: Aktualisieren aus der Karten-Datenbank
Das System MUSS „Von API aktualisieren“ Texte, Attribute und Preise in allen gespeicherten Sprachen neu laden und dabei Set-Code, Edition, Status, Besitzer, Kaufdatum und Bilder unverändert lassen.
Quelle: Chat 2026-10-04 19:40 (6); README §Features; Test cards.test.ts (refresh) | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Daten geändert
- GIVEN die Datenbank hat einen neuen Text
- WHEN die Karte aktualisiert wird
- THEN zeigt sie den neuen Text, und die Benutzerdaten bleiben

#### Scenario: Neue Sprache
- GIVEN eine Sprache wird verfügbar
- WHEN aktualisiert wird
- THEN wird sie ergänzt

#### Scenario: Sprache fehlt
- GIVEN die Datenbank liefert eine Sprache nicht mehr
- WHEN aktualisiert wird
- THEN bleibt der gespeicherte Text

### Requirement: Aktualisieren nur für verknüpfte Karten
Das System MUSS das Aktualisieren für Karten ohne Verknüpfung zur Karten-Datenbank (400 `no_external_id`) oder die dort nicht mehr existieren (404 `upstream_card_not_found`) ablehnen, ein API-Bild nur laden, wenn die Karte noch keines hat, und das Protokoll `refreshed` schreiben.
Quelle: Code server/services/cards.ts (refresh); Test cards.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Ohne Verknüpfung
- GIVEN eine manuell erfasste Karte
- WHEN sie aktualisiert werden soll
- THEN antwortet das System mit `no_external_id`

### Requirement: Karte löschen
Das System MUSS auf Bestätigung hin eine Karte samt Übersetzungen, Verläufen, Snapshots und Bildern (auch den Dateien) löschen und im Änderungsprotokoll mit dem Kartennamen festhalten; nur der Besitzer darf löschen.
Quelle: Code server/services/cards.ts (remove), app/app/pages/cards/[id].vue; Test cards.test.ts (remove) | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Löschen
- GIVEN eine Karte mit Bildern und Verlauf
- WHEN der Besitzer das Löschen bestätigt
- THEN sind Karte, Verläufe und Bilddateien weg und `deleted` mit dem Namen protokolliert

### Requirement: Erste Änderung einer Karte ohne Druck legt den Druck an
Das System MUSS bei einer Karte ohne Druck die erste Änderung von Set-Code oder Edition als Anlegen des Drucks behandeln und dafür einen Set-Code verlangen, wo er änderbar ist (sonst 400 `invalid_set`).
Quelle: Code server/services/cards.ts (update); Test cards.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Ohne Druck
- GIVEN eine Karte ohne Druck
- WHEN die Edition gesetzt wird, aber kein Set-Code
- THEN lehnt das System mit `invalid_set` ab

### Requirement: Beschreibungsfeld wächst mit dem Text
Das System MUSS das Beschreibungsfeld mit dem Text von 3 bis höchstens 6 Zeilen wachsen lassen und danach scrollen.
Quelle: Chat 2026-10-20 09:09 (Yu-Gi-Oh!); Ausweitung auf beide Spiele am 2026-10-23 bestätigt; Code app/app/pages/cards/[id].vue | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Langer Text
- GIVEN eine Beschreibung mit 30 Zeilen
- WHEN die Karte geöffnet wird
- THEN zeigt das Feld 6 Zeilen und scrollt

#### Scenario: Kurzer Text
- GIVEN eine kurze Beschreibung
- WHEN die Karte geöffnet wird
- THEN zeigt das Feld 3 Zeilen

### Requirement: Pokémon-Angaben
Das System MUSS bei Pokémon-Karten die sprachabhängigen Werte (Kategorie, Typen, Stufe, Attacken, Fähigkeiten, Schwäche, Resistenz, Effekt) in der gewählten Sprache schreibgeschützt zeigen und für die Attributwerte auf die englischen Schreibweisen zurückfallen.
Quelle: README §Pokémon; Code app/app/components/PokemonInfo.vue | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Attacken
- GIVEN eine Pokémon-Karte mit Attacken
- WHEN die Detailseite geöffnet wird
- THEN erscheinen die Attacken mit Kosten, Schaden und Effekt in der gewählten Sprache

### Requirement: Unbekannte Karte
Das System MUSS bei einer nicht vorhandenen Karte 404 `card_not_found` liefern und die Oberfläche eine Fehlerseite mit Zurück-Knopf zeigen.
Quelle: Code server/services/cards.ts (get), app/app/error.vue; Test cards.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Falsche ID
- GIVEN es gibt keine Karte 9999
- WHEN `/cards/9999` geöffnet wird
- THEN zeigt die App die Fehlerseite „404“
