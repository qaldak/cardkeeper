# Preise Specification

## Purpose
Preise der Karten: Speicherung je Marktplatz in dessen Währung, Preisverlauf und geplante Aktualisierung in kleinen Tranchen. Der Scheduler läuft im App-Prozess ([ADR 0007](../../../docs/adr/0007-preis-scheduler-im-app-prozess.md)). Umrechnung in eine Anzeigewährung: Spec waehrungsumrechnung ([ADR 0012](../../../docs/adr/0012-preise-in-quellwaehrung.md)).

## Requirements

### Requirement: Preise je Marktplatz in dessen Währung
Das System MUSS Preise pro Marktplatz in der Währung dieses Marktplatzes speichern (Cardmarket EUR; TCGplayer, eBay, Amazon, CoolStuffInc USD); Liste und Total MÜSSEN den Marktplatz der `PRICE_SOURCE` (Standard `cardmarket`) verwenden.
Quelle: Chat 2026-10-04 10:00 (Fragerunde „Quelle + Originalwährung“); README §Features, §Configuration; Code app/server/lib/config.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Quellwährung
- GIVEN eine Karte mit Cardmarket-Preis 0.09 EUR und TCGplayer-Preis 0.12 USD
- WHEN die Liste mit `PRICE_SOURCE=cardmarket` angezeigt wird
- THEN zeigt sie 0.09 in EUR

#### Scenario: Andere Quelle
- GIVEN `PRICE_SOURCE=tcgplayer`
- WHEN die Liste angezeigt wird
- THEN zeigt sie 0.12 in USD

### Requirement: Pokémon-Preise
Das System MUSS für Pokémon-Karten die Preise `cardmarket` (EUR), `cardmarket-holo` und `tcgplayer-<variante>` (USD) führen; Liste und Total MÜSSEN `PRICE_SOURCE` für beide Spiele nutzen.
Quelle: Chat 2026-10-10 22:36/22:38 („Pokémon bereits umgesetzt“); README §Pokémon | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Pokémon-Preis
- GIVEN eine Pokémon-Karte mit Cardmarket-Preis
- WHEN sie in der Übersicht erscheint
- THEN wird der Preis der `PRICE_SOURCE` zur Summe gerechnet

### Requirement: Preisverlauf auf der Detailseite
Das System MUSS jede geladene Preiszeile mit Zeitstempel aufbewahren und auf der Detailseite den Verlauf anzeigen.
Quelle: README §Features; Chat 2026-10-10 20:40 („aktuellen Preis dokumentieren, auch wenn er nicht ändert“) | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Verlauf
- GIVEN eine Karte mit zwei Preiszeilen
- WHEN die Detailseite geöffnet wird
- THEN erscheinen beide mit Datum

### Requirement: Jeder Reload erzeugt eine Preiszeile
Das System MUSS bei jedem Preis-Reload eine neue Preiszeile erzeugen, auch bei unverändertem Preis, und auf der Detailseite „Preise zuletzt geprüft am“ zeigen; manuell erfasste Kartendaten MÜSSEN dabei unverändert bleiben.
Quelle: Chat 2026-10-10 20:40 („manuell eingegebene Daten nicht überschrieben, nur die Preise“); README §Scheduled price reload | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Gleicher Preis
- GIVEN der Preis ist seit dem letzten Reload gleich
- WHEN die Karte neu geladen wird
- THEN entsteht trotzdem eine weitere Preiszeile

### Requirement: Fälligkeit der Karten
Das System MUSS eine aktive Karte als fällig behandeln, wenn ihre Preise älter als `PRICE_REFRESH_AFTER` sind (Zahl mit `h`, `d`, `w`, `mo`; Standard `1w`; `off` schaltet ab); die Einstellung SOLL optional sein.
Quelle: Chat 2026-10-10 20:58 („nicht zwingend konfigurieren… wieder deaktivieren“); README §Scheduled price reload; Code app/server/lib/config.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Aus
- GIVEN `PRICE_REFRESH_AFTER=off`
- WHEN der Scheduler prüft
- THEN wird keine Tranche gestartet

#### Scenario: Nicht fällig
- GIVEN eine Karte mit einem Tag alten Preisen und Standardeinstellung
- WHEN der Scheduler prüft
- THEN ist die Karte nicht fällig

### Requirement: Tranchen
Das System MUSS fällige Karten in Tranchen von höchstens `PRICE_REFRESH_BATCH_SIZE` (Standard 300) laden, älteste Preise zuerst und Karten eines Sets zusammen; die nächste Tranche MUSS frühestens `PRICE_REFRESH_BATCH_EVERY` (Standard `1d`, mindestens `1h`) später beginnen.
Quelle: Chat 2026-10-10 21:10/21:15/21:19 (Standard 300); README §Scheduled price reload; Code app/server/lib/config.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Grosse Sammlung
- GIVEN 1000 fällige Karten und Standardwerte
- WHEN eine Tranche läuft
- THEN werden höchstens 300 Karten geladen, die ältesten zuerst

### Requirement: Pause zwischen Anfragen
Das System MUSS zwischen zwei Anfragen an eine Karten-DB `PRICE_REFRESH_DELAY_MS` warten (Standard 500, mindestens 100) und den Start mit einem kleineren Wert verweigern.
Quelle: README §Configuration, §Scheduled price reload; Code app/server/lib/config.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Zu kleiner Wert
- GIVEN `PRICE_REFRESH_DELAY_MS=50`
- WHEN die Anwendung startet
- THEN bricht sie mit einer Fehlermeldung ab

### Requirement: Begrenzung durch die Karten-DB
Das System MUSS die Tranche beenden, wenn eine Karten-DB weitere Anfragen verweigert; der Rest MUSS in der nächsten Tranche folgen, fehlgeschlagene Karten nach `PRICE_REFRESH_BATCH_EVERY` erneut, und das Limit MUSS dem Benutzer gemeldet werden.
Quelle: Chat 2026-10-10 21:15 („muss bis an den User gehen“); README §Scheduled price reload | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Limit
- GIVEN die Karten-DB antwortet mit einer Begrenzung
- WHEN eine Tranche läuft
- THEN stoppt sie und der Rest folgt in der nächsten

#### Scenario: Meldung
- GIVEN das Limit ist erreicht
- WHEN ein Benutzer sucht oder aktualisiert eine Karte
- THEN erscheint die Meldung, dass es später wieder versucht werden soll

### Requirement: Ausführung im App-Prozess
Das System MUSS 60 Sekunden nach dem Start und danach alle 10 Minuten prüfen, ob eine Tranche fällig ist, und diese im App-Prozess ausführen; der Zustand wird in der Datenbank aufgezeichnet.
Quelle: Chat 2026-10-10 20:40; Entscheid des Benutzers (2026-10-23: Plugin im App-Prozess gilt); Code app/server/plugins/price-refresh.ts; Test price-refresh.test.ts | Herkunft: User-Vorgabe | MUSS=SHALL

#### Scenario: Start
- GIVEN die Anwendung wurde gestartet
- WHEN 60 Sekunden vergangen sind
- THEN wird die erste Prüfung ausgeführt

### Requirement: Aufzeichnung der Läufe
Das System MUSS jede Tranche in `price_refresh_runs` mit dem Zustand running, done, rate_limited, failed oder interrupted aufzeichnen und nach 3 fehlgeschlagenen Anfragen in Folge `failed` setzen; Yu-Gi-Oh! lädt 20 Karten, TCGdex eine Karte pro Anfrage.
Quelle: Code app/server/services/prices.ts, app/server/tcg/*/adapter.ts; Test price-refresh.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Drei Fehler
- GIVEN drei Anfragen scheitern nacheinander
- WHEN die Tranche läuft
- THEN wird der Lauf als `failed` aufgezeichnet

### Requirement: „Geändert am“ bleibt unberührt
Das System MUSS beim Preis-Reload `prices_checked_at` per Roh-SQL setzen, damit „geändert am“ der Karte nicht verändert wird.
Quelle: Code app/server/services/prices.ts; Test price-refresh.test.ts | Herkunft: Abgeleitet | MUSS=SHALL

#### Scenario: Reload
- GIVEN eine Karte mit „geändert am“ vom Vortag
- WHEN ihre Preise neu geladen werden
- THEN bleibt „geändert am“ unverändert
