# Kartenerfassung Specification

## Purpose
Neue Karten einzeln erfassen: Spielwahl, Suche in der Karten-Datenbank (Name, ID, Set-Code, bei Pokémon Set und Nummer), Wahl von Druck, Edition oder Variante und Anlegen der Karte. Das Hinzufügen eines ganzen Sets steht in `set-import`, Daten und Fehler der Karten-Datenbanken in `spiele-adapter`. Entscheide: [ADR 0023](../../../docs/adr/0023-kartendatenquellen-ygoprodeck-tcgdex.md) (Datenquellen), [ADR 0020](../../../docs/adr/0020-gemerkter-zustand-in-cookies.md) (gemerkter Zustand in Cookies). Verlauf: H-05, H-06, H-20.

## Requirements

### Requirement: Spiel beim Erfassen wählen und merken
Das System MUSS beim Erfassen die Wahl des Spiels verlangen und die zuletzt gewählte Wahl pro Browser in einem Cookie `cardkeeper-last-game` (1 Jahr) merken; ein unbekanntes Spiel im Cookie fällt auf das erste Spiel zurück.
Quelle: Chat 2026-10-05 18:57, 2026-10-06 07:31; README §Features; Test last-game.test.ts | Herkunft: User-Vorgabe | Inventar: R-002 | MUSS=SHALL

#### Scenario: Letzte Wahl
- GIVEN ein Benutzer wählt Pokémon und legt eine Karte an
- WHEN er eine weitere Karte erfassen will
- THEN ist Pokémon vorgewählt

#### Scenario: Zwei Browser
- GIVEN zwei getrennte Browserprofile
- WHEN eines Pokémon wählt
- THEN bleibt das andere bei seiner eigenen Wahl

### Requirement: Suche nach Name oder ID, Deutsch zuerst
Das System MUSS beim Erfassen ohne Sprachwahl nach Name oder Kartennummer (YGO: Passcode, Pokémon: Karten-ID wie `swsh3-136`) suchen, zuerst auf Deutsch und nur ohne Treffer auf Englisch, und beide Sprachen speichern, soweit vorhanden.
Quelle: Chat 2026-10-04 19:40 (1)/(2); README §Features; Test cards.test.ts (lookup) | Herkunft: User-Vorgabe | Inventar: R-023, R-025 | MUSS=SHALL

#### Scenario: Deutscher Treffer
- GIVEN eine Karte „Dunkler Magier“
- WHEN danach gesucht wird
- THEN liefert die Suche den deutschen Treffer

#### Scenario: Englischer Name
- GIVEN der deutsche Name weicht ab
- WHEN der englische Name gesucht wird
- THEN findet die Suche die Karte über den englischen Treffer

#### Scenario: Kein Treffer
- GIVEN weder Deutsch noch Englisch passt
- WHEN gesucht wird
- THEN ist die Trefferliste leer

### Requirement: Trefferliste mit Vorschaubildern
Das System MUSS in der Trefferliste und in der Auswahl der Karte deren kleines Bild zeigen, bei Yu-Gi-Oh! aus einer eigenen Kopie unter `/api/thumbnails/ygo/<Passcode>` (einmal geladen, höchstens 4 gleichzeitig, Browser-Cache eine Woche), bei Pokémon direkt von `assets.tcgdex.net`.
Quelle: Chat 2026-10-05 18:58 (Fragerunde), 2026-10-09 20:52; README §Notes on the card API; Test thumbnails.test.ts | Herkunft: User-Vorgabe | Inventar: R-055, R-058, R-100 | MUSS=SHALL

#### Scenario: YGO-Bild
- GIVEN ein Treffer in der Yu-Gi-Oh!-Suche
- WHEN das Bild angezeigt wird
- THEN kommt es von der App (nie von YGOPRODeck)

#### Scenario: Bild nicht ladbar
- GIVEN die Bildquelle antwortet nicht
- WHEN das Bild angefragt wird
- THEN antwortet die App mit 404 und fragt 60 Sekunden lang nicht erneut

### Requirement: Bild nur für numerische YGO-Passcodes
Das System MUSS die Vorschaubild-Adresse nur für Spiele bereitstellen, deren Bildhost nicht eingebunden werden soll, und nur für gültige Kartenkennungen (1 bis 40 Zeichen aus Buchstaben, Ziffern, `.`, `_`, `-`).
Quelle: Code server/services/thumbnails.ts, server/api/thumbnails/**; Test thumbnails.test.ts | Herkunft: Abgeleitet | Inventar: R-100 | MUSS=SHALL

#### Scenario: Ungültige ID
- GIVEN eine Anfrage mit einer ungültigen Kennung
- WHEN sie eintrifft
- THEN antwortet die App mit einem Fehler und lädt nichts

### Requirement: Auswahl des Drucks
Das System MUSS bei einem Treffer alle bekannten Drucke (Set, Seltenheit, bei Yu-Gi-Oh! mit Codes aller Sprachen) zur Wahl anbieten und das Anlegen auch ohne bestimmten Druck erlauben; ein Druck, der nicht zur Karte gehört, wird abgelehnt (400 `invalid_set`).
Quelle: README §Features; Tests cards.test.ts (offers printings…, creates a card without a specific printing, rejects an unknown… printing) | Herkunft: Abgeleitet | Inventar: R-023, R-076 | MUSS=SHALL

#### Scenario: Deutscher Druck
- GIVEN ein Druck existiert nur in der deutschen Antwort
- WHEN die Karte gewählt wird
- THEN wird er angeboten

#### Scenario: Falscher Druck
- GIVEN ein nicht existierender Set-Code
- WHEN die Karte damit angelegt wird
- THEN lehnt das System mit `invalid_set` ab

### Requirement: Yu-Gi-Oh!: Suche über den Set-Code
Das System MUSS im selben Suchfeld einen Text wie `L5DD-ENA15` oder `lob-en005` als Set-Code erkennen (Grossbuchstaben, Codes ohne Sprachteil wie `SDY-006` eingeschlossen), den Druck bei YGOPRODeck (`cardsetsinfo.php`) suchen und bei Misserfolg wie einen Namen suchen.
Quelle: Chat 2026-10-10 12:04; README §Features; Tests set-code.test.ts, ygo-adapter.test.ts | Herkunft: User-Vorgabe | Inventar: R-024 | MUSS=SHALL

#### Scenario: Set-Code
- GIVEN die Karte ist im Set `L5DD`
- WHEN `L5DD-ENA15` gesucht wird
- THEN liefert die Suche die Karte dieses Drucks

#### Scenario: Kein Code
- GIVEN ein Name mit Bindestrich und Zahl
- WHEN gesucht wird
- THEN wird er als Name gesucht, wenn der Code nichts findet

### Requirement: Yu-Gi-Oh!: Code einer anderen Sprache fällt auf Englisch zurück
Das System MUSS einen Set-Code einer anderen Sprache (DE, FR, IT, PT, SP/ES, JP, KR u. ä.), der nichts findet, mit demselben Code in englischer Sprache (`L5DD-DEA15` → `L5DD-ENA15`) erneut suchen.
Quelle: Chat 2026-10-10 12:04 (nur DE genannt); Assistent 12:12 (auf weitere Sprachen ausgeweitet, nicht beanstandet); Test set-code.test.ts | Herkunft: User-Vorgabe | Inventar: R-024 | MUSS=SHALL

#### Scenario: Deutscher Code
- GIVEN nur der englische Druck existiert
- WHEN `L5DD-DEA15` gesucht wird
- THEN findet das System die Karte über `L5DD-ENA15`

### Requirement: Yu-Gi-Oh!: Der gedruckte Set-Code wird gespeichert
Das System MUSS den eingegebenen Code speichern, wenn er zum gewählten (englischen) Druck gehört; der Druck wird vorgewählt, wenn er der einzige mit diesem Code ist, bei mehreren Seltenheiten bleibt die Wahl offen; Set und Seltenheit stammen vom gewählten Druck.
Quelle: Chat 2026-10-10 12:29; README §Features; Test cards.test.ts (stores the code printed on the card…) | Herkunft: User-Vorgabe | Inventar: R-024 | MUSS=SHALL

#### Scenario: Eindeutiger Druck
- GIVEN `L5DD-DEA15` führt zu einem einzigen englischen Druck
- WHEN die Karte angelegt wird
- THEN ist der Druck vorgewählt und `L5DD-DEA15` wird als Set-Code gespeichert

#### Scenario: Mehrere Seltenheiten
- GIVEN der Code existiert in mehreren Seltenheiten
- WHEN die Auswahl erscheint
- THEN bleibt „Keine bestimmte Ausgabe“ stehen

#### Scenario: Fremder Code
- GIVEN ein gedruckter Code gehört nicht zum Druck
- WHEN angelegt wird
- THEN lehnt das System mit `invalid_set_code` ab

### Requirement: Yu-Gi-Oh!: Edition als Ein-Klick-Wahl
Das System MUSS bei der Erfassung neben dem Druck die Editionen „1. Auflage“ und „Limitierte Auflage“ als Schaltflächen anbieten (zweiter Klick nimmt zurück), erst nach Wahl eines Drucks aktivieren, und ohne Wahl die Edition leer lassen (Unlimited).
Quelle: Chat 2026-10-07 19:37, 2026-10-08 17:52 (Buttons bleiben); README §Features; Test cards.test.ts | Herkunft: User-Vorgabe | Inventar: R-025 | MUSS=SHALL

#### Scenario: Wahl
- GIVEN ein Druck ist gewählt
- WHEN „1. Auflage“ geklickt wird
- THEN wird `FIRST_EDITION` gespeichert

#### Scenario: Ohne Wahl
- GIVEN keine Schaltfläche gedrückt
- WHEN die Karte angelegt wird
- THEN ist die Edition leer

### Requirement: Pokémon: Variante wählen
Das System MUSS beim Erfassen einer Pokémon-Karte die Wahl einer Variante unter denen verlangen, die die Karte laut Datenbank hat (normal, reverse, holo, firstEdition, wPromo), sonst 400 `printing_required`.
Quelle: Chat 2026-10-05 18:58 (Fragerunde „Variante“); README §Pokémon; Test pokemon.test.ts | Herkunft: User-Vorgabe | Inventar: R-053, R-076 | MUSS=SHALL

#### Scenario: Ohne Variante
- GIVEN eine Pokémon-Karte ohne Variante
- WHEN sie angelegt werden soll
- THEN lehnt das System mit `printing_required` ab

### Requirement: Pokémon: Suche nach Set und Nummer
Das System MUSS bei Pokémon die Suche nach Set und aufgedruckter Nummer anbieten: Sprache der Datenbank wählen, Nummer tippen (`040/088`), Set nach Name oder Logo wählen und die Karte über die Nummer im Set finden; der Teil nach dem Schrägstrich grenzt die Setliste nach der gedruckten Setgrösse ein.
Quelle: Chat 2026-10-05 19:48, 19:54; README §Pokémon; Tests pokemon.test.ts, pokemon-number.test.ts | Herkunft: User-Vorgabe | Inventar: R-056 | MUSS=SHALL

#### Scenario: Beispiel Hippoterus
- GIVEN Set `me03`, Nummer `040/088`
- WHEN die Karte gesucht wird
- THEN ist es die Karte `me03-040`, mit Name, Nummer, Set und ID in der Bestätigung

#### Scenario: Setgrösse
- GIVEN Nummer `040/088`
- WHEN die Setliste angezeigt wird
- THEN zeigt sie nur Sets mit gedruckter Grösse 88

### Requirement: Pokémon: Standardsprache der Set-Auswahl
Das System MUSS die Sprache der Set-Auswahl auf Deutsch vorbelegen (wählbar: Englisch, Japanisch) und die Wahl nicht merken.
Quelle: Chat 2026-10-07 10:47; README §Pokémon; Code app/app/components/PokemonSetPicker.vue | Herkunft: User-Vorgabe | Inventar: R-056 | MUSS=SHALL

#### Scenario: Neu geöffnet
- GIVEN der Benutzer wählte zuvor Englisch
- WHEN die Seite neu geöffnet wird
- THEN steht wieder Deutsch

### Requirement: Pokémon: Nummer mit oder ohne Schrägstrich
Das System MUSS die Kartennummer mit oder ohne Schrägstrich akzeptieren und bei gleichmässig teilbarer Ziffernfolge (3+3 oder 4+4) den Schrägstrich spätestens beim Verlassen des Feldes ergänzen, Leerzeichen entfernen und führende Nullen beim Abgleich ignorieren (`040` = `40`, `TG01` = `tg01`).
Quelle: Chat 2026-10-07 11:02; README §Pokémon; Tests pokemon-number.test.ts | Herkunft: User-Vorgabe | Inventar: R-056 | MUSS=SHALL

#### Scenario: Ohne Schrägstrich
- GIVEN Eingabe `040088`
- WHEN das Feld verlassen wird
- THEN steht `040/088` im Feld

#### Scenario: Schon mit Schrägstrich
- GIVEN Eingabe `040/088`
- WHEN das Feld verlassen wird
- THEN bleibt `040/088`

#### Scenario: Nullen
- GIVEN Nummer `040` und Setliste mit `40`
- WHEN abgeglichen wird
- THEN gelten sie als gleich

### Requirement: Pokémon: Set-Auswahl zeigt nur das Logo
Das System MUSS in der Set-Auswahl nur das Logo des Sets (verzögert geladen, bei fehlendem Format auf PNG zurückfallend, sonst leerer Kasten) zeigen, kein Set-Symbol.
Quelle: Chat 2026-10-06 12:20, 13:08; 2026-10-07 10:47; README §Pokémon; Test image-fallback.test.ts | Herkunft: User-Vorgabe | Inventar: R-056 | MUSS=SHALL

#### Scenario: Logo
- GIVEN ein Set mit Logo
- WHEN die Set-Liste erscheint
- THEN wird nur das Logo geladen, kein Symbol

#### Scenario: Sprache
- GIVEN der Benutzer wählt Englisch und öffnet die Seite neu
- WHEN die Auswahl erscheint
- THEN steht wieder Deutsch

### Requirement: Set-Browser und Sets-Zwischenspeicher
Das System MUSS die Set-Liste und die Karten eines Sets über `GET /api/sets` und `GET /api/sets/<id>` liefern, sechs Stunden zwischenspeichern, Logo-Adressen nur von erlaubten Hosts zulassen und für Spiele ohne Set-Browser 400 `sets_not_supported`, für ein unbekanntes Set 404 `set_not_found` melden.
Quelle: README §Pokémon; Code server/services/catalog.ts; Test catalog.test.ts | Herkunft: Abgeleitet | Inventar: R-099 | MUSS=SHALL

#### Scenario: Zweiter Abruf
- GIVEN die Set-Liste wurde soeben geladen
- WHEN sie erneut angefragt wird
- THEN kommt sie aus dem Zwischenspeicher

#### Scenario: Spiel ohne Set-Browser
- GIVEN ein Spiel ohne Set-Browser
- WHEN die Set-Liste angefragt wird
- THEN antwortet das System mit `sets_not_supported`

### Requirement: Japanische Pokémon-Karten
Das System MUSS japanische Karten über ihre eigene Datenbank und ID (`SV9-040`) als dritte gespeicherte Sprache führen, nur über Set und Nummer oder ID auffindbar machen (kein Namenssuche mit lateinischer Schrift) und eine nur japanische Karte nur mit japanischem Text speichern.
Quelle: Chat 2026-10-05 19:48, 19:55; README §Pokémon; Test tcgdex-adapter.test.ts, pokemon.test.ts | Herkunft: User-Vorgabe | Inventar: R-057 | MUSS=SHALL

#### Scenario: Nur japanisch
- GIVEN eine Karte nur in der japanischen Datenbank
- WHEN sie angelegt wird
- THEN hat sie nur den japanischen Text und DE/EN sind nicht wählbar

### Requirement: ß und ss in der Suche
Das System MUSS bei der Suche beim Erfassen (beide Spiele, Namenssuche und Abruf nach Namen) „ss“ und „ß“ als gleichwertig behandeln und alle Schreibweisen abfragen (höchstens 8; ab vier Stellen nur getippt, alles „ß“, alles „ss“); Treffer erscheinen einmal, die der getippten Schreibweise zuerst.
Quelle: Chat 2026-10-09 19:19, 20:41; README §Features; Tests eszett.test.ts, cards.test.ts | Herkunft: User-Vorgabe | Inventar: R-026 | MUSS=SHALL

#### Scenario: weisser
- GIVEN die Karte heisst „weißer Drache“
- WHEN „weisser“ gesucht wird
- THEN findet die Suche die Karte

#### Scenario: Ohne ss/ß
- GIVEN ein Text ohne „ss“ und „ß“
- WHEN gesucht wird
- THEN gibt es keine zusätzliche Anfrage

### Requirement: Karte anlegen
Das System MUSS beim Anlegen Karte, Übersetzungen, Druck, Preise, Roh-Antworten (Snapshots), Statusverlauf (aktiv) und Protokolleintrag `created` in einer Transaktion speichern, den Anlegenden zum Besitzer machen und ein optionales Kaufdatum übernehmen.
Quelle: README §Features, §Data model; Code server/services/cards.ts (create); Test cards.test.ts | Herkunft: Abgeleitet | Inventar: R-076, R-033 | MUSS=SHALL

#### Scenario: Anlegen
- GIVEN eine Karte wird gefunden
- WHEN sie angelegt wird
- THEN liegen alle Teile gespeichert vor und der Anlegende ist Besitzer

### Requirement: Anlegen: unbekannte Karte oder unbekanntes Spiel
Das System MUSS eine Karte, die es bei der Karten-Datenbank nicht gibt, mit 404 `upstream_card_not_found` und ein unbekanntes Spiel mit 400 `unknown_game` ablehnen und ein Spiel bei der ersten Nutzung registrieren.
Quelle: Code server/services/cards.ts, server/tcg/registry.ts; Test cards.test.ts (registers the game…, rejects an unknown card, game…) | Herkunft: Abgeleitet | Inventar: R-076 | MUSS=SHALL

#### Scenario: Unbekannte Karte
- GIVEN eine Kennung, die es nicht gibt
- WHEN angelegt wird
- THEN antwortet das System mit 404 `upstream_card_not_found`

#### Scenario: Erstes Mal
- GIVEN das Spiel war noch nie benutzt
- WHEN die erste Karte angelegt wird
- THEN wird das Spiel registriert und danach wiederverwendet
