# Übersicht Specification

## Purpose
Die Übersicht der Sammlung: Liste der Karten mit Spielwahl, Filtern, Suche, Sortierung, Summen und dem gemerkten Zustand. Blättern auf der Detailseite steht in `karten-blaettern`, Export in `export`, Preise in `preise`. Entscheide: [ADR 0014](../../../docs/adr/0014-uebersicht-im-speicher-filtern.md) (im Speicher filtern), [ADR 0020](../../../docs/adr/0020-gemerkter-zustand-in-cookies.md) (Cookies). Verlauf: H-04, H-10, H-16.

## Requirements

### Requirement: Spielwahl mit „Alle Spiele“ als Standard
Das System MUSS in der Übersicht ein Spiel oder alle Spiele zeigen (Chips „Alle Spiele“ und je Spiel), beim ersten Besuch alle, danach die letzte Wahl des Browsers (Cookie `cardkeeper-overview-game`); ein Spiel in der Adresse hat Vorrang, ein unbekanntes wird ignoriert, bei nur einem Spiel wird dieses gezeigt.
Quelle: Chat 2026-10-06 13:08 (2); README §Features; Test last-game.test.ts | Herkunft: User-Vorgabe | Inventar: R-003 | MUSS=SHALL

#### Scenario: Erster Besuch
- GIVEN kein Cookie
- WHEN die Übersicht geöffnet wird
- THEN zeigt sie alle Spiele

#### Scenario: Letzte Wahl
- GIVEN der Benutzer wählte Pokémon
- WHEN er die Übersicht neu öffnet
- THEN ist Pokémon gewählt

#### Scenario: Adresse
- GIVEN `?game=pokemon`
- WHEN die Übersicht geöffnet wird
- THEN gilt Pokémon, ohne die gemerkte Wahl zu ändern

### Requirement: Filter je Spiel
Das System MUSS Filter für Status und Besitzer und je Spiel eigene Filter bieten (Yu-Gi-Oh!: Kartentyp, Monstertyp, Attribut, Seltenheit, Level; Pokémon: Kategorie, Typ, Stufe, Seltenheit, Variante, KP) mit Auswahllisten aus der Sammlung; spielbezogene Filter werden beim Spielwechsel zurückgesetzt.
Quelle: Chat 2026-10-04 19:40 (7), 2026-10-05 18:57/18:58; README §Features; Test cards.test.ts (facets, filters) | Herkunft: User-Vorgabe | Inventar: R-004, R-006, R-087 | MUSS=SHALL

#### Scenario: Kartentyp
- GIVEN Karten mit verschiedenen Kartentypen
- WHEN nach „Normal Monster“ gefiltert wird
- THEN bleiben nur diese Karten

#### Scenario: Spielwechsel
- GIVEN ein Level-Filter ist gesetzt
- WHEN auf Pokémon gewechselt wird
- THEN ist der Level-Filter zurückgesetzt

### Requirement: Einheitliche Filterwerte unabhängig von der Sprache
Das System MUSS Kartentyp, Monstertyp, Attribut und die Pokémon-Werte (Kategorie, Typ, Stufe) für Filter und Sortierung stets in einer Schreibweise führen, nämlich aus der englischen Antwort, und in den Auswahllisten übersetzt anzeigen.
Quelle: Chat 2026-10-05 17:18; Assistent 2026-10-05 17:22; README §Pokémon; Test translations.test.ts | Herkunft: User-Vorgabe | Inventar: R-208 | MUSS=SHALL

#### Scenario: Deutsche Antwort
- GIVEN die deutsche Antwort nennt abweichende Werte
- WHEN eine Karte gespeichert wird
- THEN sind die gespeicherten Werte die englischen

### Requirement: Suche über Namen aller Sprachen, Codes und Sets
Das System MUSS die Suche der Übersicht gegen Kartennamen in allen gespeicherten Sprachen, die Kartenkennung (genau), den Set-Code und den Set-Namen laufen lassen, ohne Beachtung der Gross-/Kleinschreibung. [OFFEN Q-001] Annahme: Fehlerfall nicht reproduzierbar, Suche prüft alle Sprachen.
Quelle: Chat 2026-10-04 19:40, 2026-10-21 04:40; README §Features; Test cards.test.ts | Herkunft: User-Vorgabe | Inventar: R-010, R-086 | MUSS=SHALL

#### Scenario: Englischer Titel
- GIVEN eine Karte „Dunkler Magier“ / „Dark Magician“
- WHEN „Dark Magician“ gesucht wird
- THEN wird die Karte gefunden

#### Scenario: Set
- GIVEN der Set-Name „Legend of Blue Eyes“
- WHEN gesucht wird
- THEN werden die Karten dieses Sets gefunden

### Requirement: Suche zusammen mit den Filtern
Das System MUSS die Suche mit allen anderen Filtern kombinieren (alle Bedingungen gelten zugleich), mit ß/ss-Varianten arbeiten und die Eingabe erst nach einer kurzen Pause anwenden.
Quelle: Chat 2026-10-21 04:40 (Filter mitberücksichtigt), 2026-10-09 20:41; Code app/app/pages/index.vue; Test cards.test.ts (applies the other filters…) | Herkunft: User-Vorgabe | Inventar: R-010, R-026 | MUSS=SHALL

#### Scenario: Mit Filter
- GIVEN ein Besitzerfilter ist gesetzt
- WHEN gesucht wird
- THEN gelten Suche und Filter zusammen

#### Scenario: ß/ss
- GIVEN die Karte heisst „weißer Drache“ in der Sammlung
- WHEN „weisser“ gesucht wird
- THEN wird sie gefunden

### Requirement: Sortierauswahl
Das System MUSS nach Zuletzt hinzugefügt (Standard, neueste zuerst), Name, Level (Yu-Gi-Oh!/alle Spiele), KP (Pokémon/alle Spiele), Kaufdatum und Preis (letzter Preis der `PRICE_SOURCE`) auf- und absteigend sortieren, über alle Seiten, mit der Sortierung in der Adresse.
Quelle: Chat 2026-10-05 17:18, 18:57; README §Features; Code shared/utils/sorting.ts; Tests cards.test.ts, card-sort.test.ts | Herkunft: User-Vorgabe | Inventar: R-011 | MUSS=SHALL

#### Scenario: Standard
- GIVEN keine Sortierung gewählt
- WHEN die Übersicht erscheint
- THEN stehen die neuesten Karten zuerst

#### Scenario: Seitenübergreifend
- GIVEN mehr Karten als eine Seite
- WHEN nach Preis sortiert wird
- THEN gilt die Reihenfolge über alle Seiten

### Requirement: Karten ohne Wert zuletzt
Das System MUSS Karten ohne Wert für die gewählte Sortierung (kein Level, kein Kaufdatum, kein Preis) in beiden Richtungen am Ende zeigen.
Quelle: Chat 2026-10-05 17:22; Code server/lib/card-sort.ts; Test card-sort.test.ts | Herkunft: User-Vorgabe | Inventar: R-011, R-085 | MUSS=SHALL

#### Scenario: Ohne Level
- GIVEN eine Zauberkarte ohne Level
- WHEN nach Level auf- oder absteigend sortiert wird
- THEN steht sie am Ende

### Requirement: Sortierreihenfolge im Detail
Das System MUSS Namen deutsch und ohne Beachtung der Gross-/Kleinschreibung sortieren („Ärger“ bei „A“, „Karte 2“ vor „Karte 10“) und bei Gleichstand nach Name, dann nach ID ordnen.
Quelle: Chat 2026-10-05 17:22; Code server/lib/card-sort.ts; Test card-sort.test.ts | Herkunft: Abgeleitet | Inventar: R-085 | MUSS=SHALL

#### Scenario: Zahlen
- GIVEN Karten „Karte 2“ und „Karte 10“
- WHEN nach Name sortiert wird
- THEN steht „Karte 2“ vor „Karte 10“

### Requirement: Seiten und Zusammenfassung
Das System MUSS die Karten in Seiten (Standard 48, höchstens 200) liefern und eine Zusammenfassung über alle Treffer führen: Anzahl, Anzahl aktiver Karten und Gesamtwert der aktiven Karten je Währung (letzter Preis der `PRICE_SOURCE`).
Quelle: README §Features; Code server/lib/schemas.ts, server/services/cards.ts; Test cards.test.ts | Herkunft: Abgeleitet | Inventar: R-012, R-084 | MUSS=SHALL

#### Scenario: Summe
- GIVEN drei aktive Karten mit Preisen und eine verkaufte
- WHEN die Zusammenfassung berechnet wird
- THEN zählt der Gesamtwert nur die drei aktiven Karten

#### Scenario: Mehrere Seiten
- GIVEN mehr Treffer als eine Seite
- WHEN Seite 2 angefragt wird
- THEN deckt die Zusammenfassung weiter alle Treffer ab

### Requirement: Besitzerfilter ist standardmässig die eigene Person
Das System MUSS ohne Besitzer in der Adresse die Karten des angemeldeten Benutzers zeigen; „Alle Besitzer“ steht als `owner=all` in der Adresse, `owner=none` zeigt Karten ohne Besitzer.
Quelle: Chat 2026-10-20 09:09; README §Features; Code shared/utils/overview-query.ts; Test overview-query.test.ts | Herkunft: User-Vorgabe | Inventar: R-007, R-089 | MUSS=SHALL

#### Scenario: Nach dem Login
- GIVEN Anna meldet sich an
- WHEN sie die Übersicht öffnet
- THEN sieht sie nur ihre Karten

#### Scenario: Alle
- GIVEN `?owner=all`
- WHEN die Übersicht erscheint
- THEN sieht sie alle Karten

### Requirement: Filter und Sortierung bleiben erhalten
Das System MUSS Filter, Sortierung und Seite der Übersicht in einem Sitzungs-Cookie `cardkeeper-overview-query` merken und bei jedem Aufruf von `/` ohne Parameter wiederherstellen, bis zum nächsten Login oder Logout; danach gelten die Standardfilter.
Quelle: Chat 2026-10-20 09:09; README §Features; Code app/app/middleware/overview-query.global.ts, app/app/composables/useAuth.ts | Herkunft: User-Vorgabe | Inventar: R-008, R-089 | MUSS=SHALL

#### Scenario: Zurück zur Übersicht
- GIVEN ein Benutzer filterte und öffnete eine Karte
- WHEN er „Zur Übersicht“ oder den Menüpunkt wählt
- THEN zeigt die Übersicht dieselben Filter

#### Scenario: Neue Anmeldung
- GIVEN ein Benutzer meldet sich ab und anmeldet
- WHEN er die Übersicht öffnet
- THEN gelten wieder die Standardfilter

### Requirement: Filter zurücksetzen
Das System MUSS „Filter zurücksetzen“ alle Filter entfernen und dabei Spiel und Sortierung behalten, den Besitzerfilter aber auf „Alle Besitzer“ setzen.
Quelle: Chat 2026-10-20 09:09 (Auslegung des Assistenten); Code app/app/pages/index.vue (resetFilters); Test overview-query.test.ts | Herkunft: Abgeleitet | Inventar: R-006, R-007 | MUSS=SHALL

#### Scenario: Zurücksetzen
- GIVEN Besitzer- und Statusfilter und Sortierung gesetzt
- WHEN „Filter zurücksetzen“ geklickt wird
- THEN ist nur noch Spiel und Sortierung erhalten und „Alle Besitzer“ gewählt

### Requirement: Kacheln der Übersicht
Das System MUSS jede Karte als Kachel mit Bild (oder Platzhalter), Name, Set-Code und Preis, Status-Zeichen und Besitzer zeigen, bei „Alle Spiele“ zusätzlich den Spielnamen, und bei leerer Auswahl mit Filtern „Keine Treffer“, ohne Filter eine Aufforderung, die erste Karte hinzuzufügen.
Quelle: README §Features; Code app/app/components/CardTile.vue, app/app/pages/index.vue | Herkunft: Abgeleitet | Inventar: R-006 | MUSS=SHALL

#### Scenario: Leere Sammlung
- GIVEN keine Karten und keine Filter
- WHEN die Übersicht erscheint
- THEN gibt es einen Knopf „Karte hinzufügen“

### Requirement: Benutzerseite
Das System MUSS eine Seite „Benutzer“ mit allen Benutzern und der Zahl ihrer Karten anbieten, verlinkt auf die Übersicht mit dem Besitzerfilter dieses Benutzers; der eigene Name ist gekennzeichnet.
Quelle: Code app/app/pages/users.vue, server/api/users.get.ts; Test users.test.ts (list) | Herkunft: Abgeleitet | Inventar: R-006 | MUSS=SHALL

#### Scenario: Karten von Max
- GIVEN Max besitzt 3 Karten
- WHEN auf „3 Karten“ geklickt wird
- THEN zeigt die Übersicht dessen Karten (alle Spiele)
