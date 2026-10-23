# Export Specification

## Purpose
Export der Karten als Tabelle zur Weiterverarbeitung (Excel). Der Export folgt der Auswahl der Übersicht. Die Kopie für KI-Prompts und die druckbare Liste sind als eigene Anforderungen geplant und im Menü als deaktivierte Platzhalter sichtbar. Entscheid: ADR 0013 (serverseitig). Verlauf: H-12, H-13. Offene Fragen: Q-008.

## Requirements

### Requirement: Menü „Exportieren“ in der Übersicht
Das System MUSS in der Übersichtsleiste neben der Sortierung ein Menü „Exportieren“ anbieten; der Eintrag „CSV-Export“ öffnet einen Dialog.
Quelle: Chat 2026-10-22 11:26, 11:46, 11:53 (Platzierung bestätigt); Code app/app/pages/index.vue | Herkunft: User-Vorgabe | Inventar: R-093 | MUSS=SHALL

#### Scenario: Menü
- GIVEN die Übersicht
- WHEN „Exportieren“ geöffnet wird
- THEN erscheint „CSV-Export“ als aktiver Eintrag

### Requirement: Geplante Funktionen als Platzhalter
Das System SOLL im Menü „Für KI kopieren (folgt)“ und „Liste drucken (folgt)“ als nicht wählbare Einträge zeigen; sie sind noch nicht umgesetzt. [OFFEN Q-008] Annahme: Inhalt der KI-Kopie und der Druckliste sind noch nicht festgelegt.
Quelle: Chat 2026-10-21 19:10, 2026-10-22 11:53; README §Roadmap; Code app/app/pages/index.vue | Herkunft: User-Vorgabe | Inventar: R-060, R-093 | MUSS=SHALL

#### Scenario: Platzhalter
- GIVEN das Menü ist offen
- WHEN auf „Für KI kopieren (folgt)“ geklickt wird
- THEN geschieht nichts, der Eintrag ist deaktiviert

### Requirement: Export folgt der Auswahl der Übersicht
Das System MUSS alle Karten der aktuellen Auswahl (Filter, Suche, Spiel, Sortierung, jede Seite) in der Reihenfolge der Übersicht exportieren, ohne Einschränkung auf Besitzer oder Status.
Quelle: Chat 2026-10-22 11:53 („Keine Einschränkung auf Status, Benutzer“); Test app/tests/integration/export.test.ts | Herkunft: User-Vorgabe | Inventar: R-013 | MUSS=SHALL

#### Scenario: Alle Besitzer
- GIVEN Karten mehrerer Besitzer, auch eine verkaufte
- WHEN ohne Filter exportiert wird
- THEN enthält die Datei alle in der Sortierung der Übersicht

#### Scenario: Filter
- GIVEN Besitzerfilter auf Sven
- WHEN exportiert wird
- THEN enthält die Datei nur dessen Karten

### Requirement: Dialog mit der Auswahl
Das System MUSS im Dialog die Auswahl zur Kontrolle zeigen (Spiel, Besitzer, Status, Sortierung, Suche, „mit weiteren Filtern“, Sprache der Texte, Anzahl Karten), die Hinweise zum Export in einem Info-Popover auf Klick, die Knöpfe rechts mit „Herunterladen“ vor „Abbrechen“, und bei 0 Karten den Download sperren.
Quelle: Chat 2026-10-23 14:59, 15:05; Code app/app/components/ExportDialog.vue | Herkunft: User-Vorgabe | Inventar: R-093 | MUSS=SHALL

#### Scenario: Auswahl
- GIVEN 4 Karten entsprechen der Auswahl
- WHEN der Dialog erscheint
- THEN zeigt er Spiel, Besitzer, Status, Sortierung, Textsprache und „4 Karten“

#### Scenario: Keine Karten
- GIVEN die Auswahl ist leer
- WHEN der Dialog erscheint
- THEN ist „Herunterladen“ nicht möglich

### Requirement: Download als Datei
Das System MUSS die Datei über `GET /api/export/cards` (Filter, Sortierung, `lang=de|en`) als Download `cardkeeper-export-YYYY-MM-DD.csv` liefern; die Oberfläche MUSS dabei die Seite nicht verlassen.
Quelle: Chat 2026-10-22 11:53 („runtergeladen“), 2026-10-23 15:23; Code app/server/api/export/cards.get.ts | Herkunft: User-Vorgabe | Inventar: R-013, R-093 | MUSS=SHALL

#### Scenario: Herunterladen
- GIVEN der Dialog ist offen
- WHEN „Herunterladen“ geklickt wird
- THEN speichert der Browser die Datei und die Übersicht bleibt stehen

### Requirement: CSV-Format
Das System MUSS die Datei mit Semikolon als Trenner, UTF-8 mit Byte-Order-Mark, Zeilenende CRLF und Anführungszeichen für Zellen mit Semikolon, Anführungszeichen oder Zeilenumbruch (Anführungszeichen verdoppelt) schreiben.
Quelle: Chat 2026-10-22 11:53 („Semikolon“); Code app/server/lib/csv.ts; Test app/tests/unit/csv.test.ts | Herkunft: User-Vorgabe | Inventar: R-013, R-092 | MUSS=SHALL

#### Scenario: Anführungszeichen
- GIVEN ein Text mit einem Anführungszeichen in der Mitte
- WHEN er geschrieben wird
- THEN steht er in Anführungszeichen und das innere Anführungszeichen ist verdoppelt

### Requirement: Schutz vor Formeln
Das System MUSS Text, der mit `=`, `+`, `-`, `@`, Tabulator oder Zeilenumbruch beginnt, mit einem vorangestellten Hochkomma schreiben, damit ihn eine Tabellenkalkulation nicht als Formel ausführt; Zahlen bleiben unverändert.
Quelle: Code app/server/lib/csv.ts; Tests app/tests/unit/csv.test.ts, export.test.ts (quotes cells and keeps card text…) | Herkunft: Abgeleitet | Inventar: R-092 | MUSS=SHALL

#### Scenario: Formel
- GIVEN eine Beschreibung beginnt mit `=1+1`
- WHEN exportiert wird
- THEN steht `'=1+1` in der Zelle

### Requirement: Spalten in der Reihenfolge der Kartenseite
Das System MUSS alle Daten der Karte ohne Bilder in der Reihenfolge der Kartenseite exportieren (Stammdaten, Yu-Gi-Oh!-Attribute, Pokémon-Attribute, Beschreibung, Status, Besitzer, Zeitstempel, Preis); Spalten des anderen Spiels bleiben leer.
Quelle: Chat 2026-10-22 11:53 („alle Attribute… Reihenfolge analog Detail“); Code app/server/services/export.ts; Test app/tests/integration/export.test.ts | Herkunft: User-Vorgabe | Inventar: R-013, R-092 | MUSS=SHALL

#### Scenario: Yu-Gi-Oh!-Karte
- GIVEN eine Yu-Gi-Oh!-Karte
- WHEN exportiert wird
- THEN stehen ATK, DEF, Level, Kartentyp, Typ, Attribut gefüllt und die Pokémon-Spalten leer

#### Scenario: Pokémon-Karte
- GIVEN eine Pokémon-Karte mit Attacken
- WHEN exportiert wird
- THEN stehen alle Attacken in einer Zelle, getrennt durch ` | `

### Requirement: Sprache der Texte
Das System MUSS Kopfzeile, Statuswerte, Editionen, Pokémon-Werte und Kartentexte in der Sprache der Oberfläche (`de` oder `en`) ausgeben und bei einer Karte ohne Text in dieser Sprache den englischen Text verwenden.
Quelle: Chat 2026-10-22 11:53 („Fallback ist Englisch“); Test app/tests/integration/export.test.ts, locales.test.ts | Herkunft: User-Vorgabe | Inventar: R-013 | MUSS=SHALL

#### Scenario: Englisch
- GIVEN die Oberfläche steht auf Englisch
- WHEN exportiert wird
- THEN heisst die erste Spalte „Game“ und der Status „Active“

#### Scenario: Nur englische Karte
- GIVEN eine Karte nur mit englischem Text, Oberfläche Deutsch
- WHEN exportiert wird
- THEN steht der englische Text

### Requirement: Letzter Preis
Das System MUSS pro Karte nur den letzten Preis der `PRICE_SOURCE` mit Quelle, Betrag (Punkt als Dezimalzeichen), Währung und Zeitstempel (UTC, `YYYY-MM-DD HH:MM`) ausgeben, bei gesetzter `DISPLAY_CURRENCY` zusätzlich die Spalte „Preis in <Währung>“.
Quelle: Chat 2026-10-22 11:53 („Preis nur der letzte“); Code app/server/services/export.ts; Test app/tests/integration/export.test.ts | Herkunft: User-Vorgabe | Inventar: R-013, R-092 | MUSS=SHALL

#### Scenario: Mehrere Preise
- GIVEN eine Karte mit zwei Preisen
- WHEN exportiert wird
- THEN steht nur der neuere in der Datei

#### Scenario: CHF
- GIVEN `DISPLAY_CURRENCY=CHF` und ein EUR-Preis 18 bei Kurs 0.9
- WHEN exportiert wird
- THEN steht in „Preis in CHF“ der Wert 16.2
