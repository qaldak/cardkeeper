# Set-Import Specification

## Purpose
Alle Karten eines Sets in einem Durchgang hinzufügen (Wizard), für Yu-Gi-Oh! und Pokémon. Nur unklare Karten verlangen eine Entscheidung. Einzelkarten stehen in `kartenerfassung`.

## Requirements

### Requirement: Wizard „Ganzes Set“
Das System MUSS beim Erfassen den Reiter „Ganzes Set“ anbieten (Yu-Gi-Oh!: neben „Einzelne Karte“; Pokémon: neben „Nach Set und Nummer“ und „Nach Name oder ID“) mit den Schritten Set wählen, Karten prüfen, Hinzufügen.
Quelle: Chat 2026-10-10 12:56, 19:56; README §Features; Code app/app/components/SetImportWizard.vue | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Set suchen
- GIVEN die Set-Liste (neueste zuerst)
- WHEN der Benutzer „Albaz“ eingibt
- THEN erscheint „Structure Deck: Albaz Strike“ mit Code, Kartenzahl und Datum

### Requirement: Yu-Gi-Oh!: Sprache bestimmt den Set-Code
Das System MUSS beim Yu-Gi-Oh!-Wizard die Sprache der Karten (Deutsch, Englisch, Japanisch) wählen lassen, in der die Set-Codes gespeichert werden (z. B. `SDAZ-DE001`), und die Codes in dieser Sprache in der Tabelle zeigen.
Quelle: Chat 2026-10-10 12:56; README §Features; Code shared/utils/set-import.ts (importBody) | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Deutsche Codes
- GIVEN Set SDAZ, Sprache Deutsch
- WHEN die Karten geprüft werden
- THEN zeigt die Tabelle `SDAZ-DE001` und speichert diesen Code

### Requirement: Edition einmal für das Set, pro Karte änderbar
Das System MUSS beim Yu-Gi-Oh!-Wizard die Edition (1. Auflage, Limitierte Auflage, keine = Unlimited) einmal für das ganze Set wählen lassen und pro Karte änderbar speichern.
Quelle: Chat 2026-10-10 12:56 („pro Karte gespeichert“); README §Features | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Set-Edition
- GIVEN „1. Auflage“ für das Set
- WHEN ein Karte auf „Limitierte Auflage“ gesetzt wird
- THEN bekommt diese Karte die Limitierte Auflage und die anderen die 1. Auflage

### Requirement: Klar oder unklar
Das System MUSS eine Zeile als klar behandeln, wenn die Karte genau einen Druck im Set hat oder die für das ganze Set gewählte Pokémon-Variante genau einmal vorkommt, und als Konflikt, wenn mehrere Drucke bleiben (Yu-Gi-Oh!: Code in mehreren Seltenheiten oder mehrere Codes).
Quelle: README §Features; Code shared/utils/set-import.ts; Test set-import.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Einziger Druck
- GIVEN eine Karte mit einem Druck
- WHEN das Set geladen wird
- THEN ist ihr Druck gewählt

#### Scenario: Mehrere Seltenheiten
- GIVEN ein Code in zwei Seltenheiten
- WHEN das Set geladen wird
- THEN ist die Karte ein Konflikt, und der Benutzer muss wählen

### Requirement: Nur Konflikte standardmässig sichtbar
Das System MUSS nach der Set-Wahl standardmässig nur die Konflikt-Karten (gelb markiert) zeigen, die Zahl der eindeutigen Karten zusammenfassen, und die vollständige Liste zum Abwählen einzelner Karten aufklappbar machen; eine entschiedene Karte darf nicht aus der Liste verschwinden.
Quelle: Chat 2026-10-10 13:24; README §Features; Test set-import.test.ts (visibleRows) | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Ohne Konflikt
- GIVEN ein Set ohne Konflikte
- WHEN es geladen wird
- THEN steht „Alle Karten sind eindeutig“ und Hinzufügen ist sofort möglich

#### Scenario: Abwählen
- GIVEN die vollständige Liste ist geöffnet
- WHEN der Benutzer Karten abwählt
- THEN werden diese nicht hinzugefügt

### Requirement: Hinzufügen erst ohne offene Wahl
Das System MUSS das Hinzufügen erst erlauben, wenn für alle hinzuzufügenden Karten ein Druck feststeht.
Quelle: README §Features; Code shared/utils/set-import.ts (needsChoice); Test set-import.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Offene Wahl
- GIVEN eine Konflikt-Karte ist nicht entschieden
- WHEN der Benutzer hinzufügen will
- THEN ist „Hinzufügen“ nicht möglich

### Requirement: Hinzufügen mit denselben Prüfungen, drei gleichzeitig
Das System MUSS die Karten einzeln mit denselben Prüfungen wie eine Einzelkarte hinzufügen, höchstens drei gleichzeitig (Limit der Karten-Datenbank), den Fortschritt anzeigen, fehlgeschlagene Karten auflisten und einen erneuten Versuch erlauben; jede Karte wird einmal hinzugefügt, es gibt keine Menge.
Quelle: Chat 2026-10-10 12:56, 19:56; README §Features | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Fehler
- GIVEN eine Karte schlägt fehl
- WHEN alle hinzugefügt wurden
- THEN steht sie in der Fehlerliste und kann erneut versucht werden

### Requirement: Yu-Gi-Oh! und Pokémon senden verschiedene Angaben
Das System MUSS für Pokémon nur Karten-ID und Variante, für Yu-Gi-Oh! Set-Code, Seltenheit, Edition und gedruckten Code in der Sprache des Sets an `POST /api/cards` senden.
Quelle: Code shared/utils/set-import.ts (importBody); Test set-import.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Pokémon
- GIVEN eine klare Pokémon-Zeile
- WHEN sie hinzugefügt wird
- THEN enthält der Aufruf `externalId` und die Variante als `edition`

### Requirement: Pokémon: Variante ist das Unklare
Das System MUSS beim Pokémon-Wizard die Sprache der Set-Liste wählen lassen, die Variante als unklaren Punkt behandeln (eine Variante für das ganze Set wählbar, sie gilt für jede Karte, die sie genau einmal hat) und alle Sprachen einer Karte wie bei einer Einzelkarte speichern.
Quelle: Chat 2026-10-10 19:56; README §Features | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Eine Variante für alle
- GIVEN Variante „reverse“ für das Set
- WHEN Karten mit dieser Variante geprüft werden
- THEN sind sie klar, die übrigen Konflikte

### Requirement: Pokémon: Varianten werden pro Karte geladen
Das System MUSS beim Öffnen eines Pokémon-Sets die Varianten pro Karte einzeln (höchstens vier gleichzeitig) laden und einige Stunden zwischenspeichern; eine nicht ladbare Karte bleibt weg, ein Limit der Karten-Datenbank wird gemeldet.
Quelle: README §Features; Code server/tcg/tcgdex/adapter.ts (listCardPrints), server/services/catalog.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Grosses Set
- GIVEN ein Set mit vielen Karten
- WHEN es geöffnet wird
- THEN dauert das Laden, danach ist es aus dem Zwischenspeicher

### Requirement: Schrittanzeige ohne Buttons
Das System MUSS die Schritte des Wizards als nicht klickbare Fortschrittsanzeige zeigen (nummerierte Kreise, Haken für Erledigtes, aktueller Schritt hervorgehoben), nicht als Schaltflächen.
Quelle: Chat 2026-10-10 18:42, 19:56 („so okay“); Code app/app/components/SetImportWizard.vue | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Anzeige
- GIVEN der Wizard ist im zweiten Schritt
- WHEN er angezeigt wird
- THEN zeigt Schritt 1 einen Haken, Schritt 2 hervorgehoben, Schritt 3 blass, ohne Klickverhalten
