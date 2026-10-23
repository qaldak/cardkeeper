# Währungsumrechnung Specification

## Purpose
Anzeige der Preise in einer konfigurierbaren Währung (z. B. CHF) zusätzlich zur Quellwährung, mit Tageskursen der Europäischen Zentralbank über Frankfurter. Entscheid: [ADR 0012](../../../docs/adr/0012-preise-in-quellwaehrung.md). Verlauf: H-01. Offene Fragen: Q-004, Q-005.

## Requirements

### Requirement: Anzeigewährung
Das System MUSS bei gesetzter Umgebungsvariable `DISPLAY_CURRENCY` (z. B. `CHF`) Preise und Total der Übersicht in dieser Währung zeigen und auf der Detailseite beide Werte (`CHF 0.08 (EUR 0.09)`); der Parameter SOLL optional sein.
Quelle: Chat 2026-10-10 22:14; README §Features, §Configuration; Code app/server/lib/config.ts | Herkunft: User-Vorgabe | Inventar: R-029 | MUSS=SHALL

#### Scenario: Detailseite
- GIVEN `DISPLAY_CURRENCY=CHF` und ein Preis von 0.09 EUR
- WHEN die Detailseite geöffnet wird
- THEN steht dort „CHF 0.08 (EUR 0.09)“

#### Scenario: Übersicht
- GIVEN `DISPLAY_CURRENCY=CHF`
- WHEN die Übersicht angezeigt wird
- THEN zeigen Karten und Total CHF

### Requirement: Ohne Anzeigewährung
Das System SOLL ohne `DISPLAY_CURRENCY` die Preise unverändert in der Quellwährung (EUR bzw. USD) zeigen und nicht umrechnen. [OFFEN Q-004] Annahme: Preise bleiben in der Quellwährung.
Quelle: Chat 2026-10-10 22:14 („Wenn nicht definiert, wird weiterhin EUR verwendet wie jetzt“), Auslegung Assistent 22:25; README §Features | Herkunft: Abgeleitet | Inventar: R-029 | MUSS=SHALL

#### Scenario: Nicht gesetzt
- GIVEN `DISPLAY_CURRENCY` ist nicht gesetzt
- WHEN ein USD-Preis angezeigt wird
- THEN bleibt er in USD

### Requirement: Gilt für beide Spiele
Das System MUSS die Umrechnung für Yu-Gi-Oh!- und Pokémon-Karten im gemeinsamen Service ausführen.
Quelle: Chat 2026-10-10 22:36/22:38; Code app/server/services/cards.ts, mappers.ts; Test pokemon.test.ts | Herkunft: User-Vorgabe | Inventar: R-029, R-097 | MUSS=SHALL

#### Scenario: Pokémon
- GIVEN `DISPLAY_CURRENCY=CHF` und eine Pokémon-Karte mit EUR-Preis
- WHEN die Übersicht erscheint
- THEN wird der Preis in CHF angezeigt

### Requirement: Wechselkurse
Das System MUSS einen Kurs je Währungspaar beim ersten Bedarf von Frankfurter holen und danach einmal je UTC-Tag im Speicher halten, gemeinsam für alle Benutzer; gleichzeitige Anfragen MÜSSEN sich einen Abruf teilen, Zeitlimit 5 s, Basis-URL `EXCHANGE_RATE_API_URL`.
Quelle: Chat 2026-10-10 22:14; Code app/server/services/rates.ts; Test rates.test.ts | Herkunft: User-Vorgabe | Inventar: R-029, R-096 | MUSS=SHALL

#### Scenario: Zweiter Aufruf
- GIVEN der Kurs EUR/CHF wurde heute geholt
- WHEN ein weiterer Benutzer die Übersicht öffnet
- THEN wird kein neuer Abruf gemacht

### Requirement: Ausfall des Kursdienstes
Das System MUSS nach einem Fehler 10 Minuten lang keine neue Anfrage stellen, bei Ausfall den Kurs eines früheren Tages verwenden und ohne solchen Kurs den Originalpreis ohne Umrechnung zeigen. [OFFEN Q-005] Annahme: Früherer Kurs, sonst Originalpreis.
Quelle: Chat 2026-10-10 22:14 („nur den Originalwert“), Auslegung Assistent 22:25; Code app/server/services/rates.ts | Herkunft: Abgeleitet | Inventar: R-096 | MUSS=SHALL

#### Scenario: Ausfall ohne Kurs
- GIVEN der Dienst ist nicht erreichbar und kein früherer Kurs bekannt
- WHEN ein Preis angezeigt wird
- THEN erscheint der Originalpreis

### Requirement: Totale und Preisverlauf
Das System MUSS Totale je Originalwährung umrechnen und in der Anzeigewährung zusammenfassen (Währungen ohne Kurs bleiben eigene Summanden) und den Preisverlauf mit dem heutigen Kurs umrechnen.
Quelle: Chat 2026-10-10 22:25 (Entscheid Assistent, nicht beanstandet); Code app/server/services/cards.ts, rates.ts | Herkunft: Abgeleitet | Inventar: R-097 | MUSS=SHALL

#### Scenario: Gemischte Währungen
- GIVEN Karten mit EUR- und USD-Preisen und Kurse bekannt
- WHEN das Total berechnet wird
- THEN erscheint eine Summe in der Anzeigewährung

### Requirement: Kurs nicht in der Oberfläche
Das System SOLL den verwendeten Kurs nicht anzeigen.
Quelle: Chat 2026-10-10 22:14 („Kurs nicht im UI“) | Herkunft: User-Vorgabe | Inventar: R-029 | MUSS=SHALL

#### Scenario: Detail
- GIVEN ein umgerechneter Preis
- WHEN die Detailseite erscheint
- THEN ist der Kurs nirgends zu sehen
