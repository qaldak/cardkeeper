# Spiele-Adapter Specification

## Purpose
Kartenspiele als austauschbare Adapter: Registrierung, Vertrag, Daten und Sprachen von Yu-Gi-Oh! (YGOPRODeck) und Pokémon (TCGdex) sowie das Verhalten bei Fehlern der Karten-DBs. Entscheide: ADR 0004, 0005, 0023. Verlauf: H-09, H-10.

## Requirements

### Requirement: Mehrere Spiele über Adapter
Das System MUSS Yu-Gi-Oh! und Pokémon in einer Sammlung führen; ein weiteres Spiel MUSS über einen Adapter (`fetchCardById`, `fetchCardByName`, `searchCards`, `mapToCommonSchema`) und einen Eintrag in `server/tcg/registry.ts` ohne Änderung von Kernschema und Kerndiensten hinzufügbar sein.
Quelle: README §Adding a game; KONZEPT §Multi-TCG; Code app/server/tcg/types.ts, registry.ts | Herkunft: Abgeleitet | Inventar: R-001 | MUSS=SHALL

#### Scenario: Neues Spiel
- GIVEN ein neuer Adapter ist registriert
- WHEN eine Karte des Spiels erfasst wird
- THEN ist keine Schemaänderung nötig, die spielspezifischen Werte stehen in JSONB

### Requirement: Spielverhalten pro Druck
Das System SOLL das Verhalten eines Spiels beim Druck (Set-Code und Edition bzw. Variante) in `shared/utils/game-config.ts` beschreiben.
Quelle: README §Pokémon, §Adding a game; Code app/shared/utils/game-config.ts | Herkunft: Abgeleitet | Inventar: D-017 | MUSS=SHALL

#### Scenario: Druck
- GIVEN ein Spiel mit Varianten
- WHEN ein Druck gewählt wird
- THEN gelten die Regeln der Spielkonfiguration

### Requirement: Sprachen der Adapter
Das System MUSS bei Yu-Gi-Oh! Deutsch und Englisch speichern, bei Pokémon zusätzlich Japanisch, und als Anzeigenamen den ersten vorhandenen in der Reihenfolge de, en, ja verwenden.
Quelle: Chat 2026-10-05 19:48/19:55 (Japanisch als dritte Sprache); Code app/server/tcg/*/adapter.ts, app/shared/utils/languages.ts | Herkunft: User-Vorgabe | Inventar: R-057, R-109 | MUSS=SHALL

#### Scenario: Anzeigename
- GIVEN eine Pokémon-Karte mit deutschem und englischem Namen
- WHEN sie angezeigt wird
- THEN ist der deutsche Name der Anzeigename

### Requirement: Pokémon-Datenmodell
Das System MUSS bei Pokémon sprachunabhängige Werte (`PokemonAttributes`, aus der englischen Antwort) und sprachabhängige (`PokemonDetails`) trennen; Druck ist die Karten-ID, die Variante (`normal`, `reverse`, `holo`, `firstEdition`, `wPromo`) wählbar unter den vorhandenen.
Quelle: Chat 2026-10-05 18:57/18:58 („Explizites Datenmodell“, „Variante“); README §Pokémon | Herkunft: User-Vorgabe | Inventar: R-053 | MUSS=SHALL

#### Scenario: Variante
- GIVEN eine Karte, die es nur als Holo gibt
- WHEN die Variante gewählt wird
- THEN steht nur Holo zur Wahl

### Requirement: Japanische Karten
Das System MUSS japanische Karten aus der eigenen TCGdex-Datenbank führen, nur über Set und Nummer oder ID auffindbar; Kategorien, Typen und Stufen MÜSSEN auf die englische Schreibweise abgebildet werden.
Quelle: Chat 2026-10-05 19:48, 19:55; README §Pokémon | Herkunft: User-Vorgabe | Inventar: R-057 | MUSS=SHALL

#### Scenario: Japanisch
- GIVEN das Set einer japanischen Karte ist gewählt
- WHEN die Nummer eingegeben wird
- THEN wird die Karte gefunden

### Requirement: Bilder nur von deklarierten Hosts
Das System MUSS Bilder nur von den vom Adapter deklarierten Hosts laden; ein YGO-Treffer lädt nur YGO-Bilder, ein Pokémon-Treffer nur TCGdex-Bilder.
Quelle: Chat 2026-10-08 17:52 („immer ein Pokemon Bild geholt“); README §Notes on the card API; Test api-calls.test.ts | Herkunft: User-Vorgabe | Inventar: R-059, R-213 | MUSS=SHALL

#### Scenario: YGO-Treffer
- GIVEN ein Yu-Gi-Oh!-Treffer wird erfasst
- WHEN das Bild geladen wird
- THEN stammt es von YGOPRODeck

### Requirement: Grösse der Trefferliste
Das System MUSS die Suche bei Yu-Gi-Oh! auf höchstens 25, bei Pokémon auf höchstens 50 Treffer begrenzen.
Quelle: Code app/server/tcg/ygo/adapter.ts, tcgdex/adapter.ts (`MAX_SEARCH_RESULTS`); README §Notes on the card API | Herkunft: Abgeleitet | Inventar: R-055 | MUSS=SHALL

#### Scenario: Breiter Name
- GIVEN ein Name mit sehr vielen Karten
- WHEN gesucht wird
- THEN erscheinen höchstens 25 (YGO) bzw. 50 (Pokémon) Treffer

### Requirement: Fehler der Karten-DB
Das System MUSS bei einer HTTP-400-Antwort von YGOPRODeck nur „No card matching“ als leeres Ergebnis behandeln, alle anderen als Fehler 502 `upstream_error` mit Text.
Quelle: Chat 2026-10-04 20:47 (Fehlerabfang gem. API prüfen); README §Notes on the card API; Code app/server/tcg/ygo/adapter.ts | Herkunft: User-Vorgabe | Inventar: R-059 | MUSS=SHALL

#### Scenario: Keine Treffer
- GIVEN „No card matching“
- WHEN gesucht wird
- THEN ist die Trefferliste leer

#### Scenario: Anderer Fehler
- GIVEN HTTP 400 mit anderem Text
- WHEN gesucht wird
- THEN erscheint Fehler 502 mit dem Text

### Requirement: Erreichbarkeit und Begrenzung
Das System MUSS eine unerreichbare Karten-DB als 502 `upstream_unreachable`, eine unerwartete Antwort als 502 `upstream_invalid_response` und eine Begrenzung der Anfragen als 429 `upstream_rate_limited` melden.
Quelle: Chat 2026-10-10 21:15 (Limit bis zum Benutzer); Code app/server/tcg/ygo/adapter.ts, tcgdex/adapter.ts | Herkunft: Abgeleitet | Inventar: R-059, R-032 | MUSS=SHALL

#### Scenario: Limit
- GIVEN TCGdex verweigert weitere Anfragen
- WHEN eine Karte aktualisiert wird
- THEN kommt 429 `upstream_rate_limited`

### Requirement: Tolerantes Lesen der Yu-Gi-Oh!-Daten
Das System MUSS unerwartete Feldwerte einer YGO-Karte auslassen und einmal loggen und nur eine Karte ohne ID oder Name mit 502 `upstream_invalid_response` ablehnen.
Quelle: Chat 2026-10-08 19:03/19:07/19:13 (Link-Karte mit `def: null`); Code app/server/tcg/ygo/mapper.ts | Herkunft: User-Vorgabe | Inventar: R-059 | MUSS=SHALL

#### Scenario: Link-Karte
- GIVEN eine Karte mit `def: null`
- WHEN sie erfasst wird
- THEN wird sie ohne den Wert erfasst

### Requirement: Unübersetzte Karte
Das System MUSS eine englische Kopie auf eine deutsche Anfrage erkennen und nicht als deutsche Übersetzung speichern.
Quelle: README §Notes on the card API; Code app/server/tcg/ygo/adapter.ts | Herkunft: Abgeleitet | Inventar: R-059 | MUSS=SHALL

#### Scenario: Nur Englisch
- GIVEN die API liefert auf Deutsch den englischen Text
- WHEN die Karte erfasst wird
- THEN wird keine deutsche Übersetzung gespeichert
