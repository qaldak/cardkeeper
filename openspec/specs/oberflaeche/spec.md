# Oberfläche Specification

## Purpose
Übergreifende Merkmale der Oberfläche: Hell/Dunkel, Sprache, Seitentitel, Kopf- und Fusszeile, stabile Kopfzeile, Fehlerübersetzung und App-Symbole. Entscheide: [ADR 0006](../../../docs/adr/0006-texte-pro-sprache.md) (Texte pro Sprache), 0020 (gemerkter Zustand in Cookies). Verlauf: H-14.

## Requirements

### Requirement: Hell und Dunkel
Das System MUSS die Oberfläche in einem hellen und einem dunklen Erscheinungsbild anbieten; Standard ist „System“ (folgt dem Gerät, hell wenn das Gerät nichts meldet), ein Umschalter in der Kopfzeile (hell, dunkel, System) MUSS die Wahl im Browser merken.
Quelle: Chat 2026-10-07 16:46, 17:06 („System folgt dem Gerät, wenn nicht erkannt: hell. Einstellungen merken.“); README §Features | Herkunft: User-Vorgabe | Inventar: R-005 | MUSS=SHALL

#### Scenario: Gerät dunkel
- GIVEN das Gerät meldet dunkel und es wurde nichts gewählt
- WHEN die App geöffnet wird
- THEN erscheint sie dunkel

#### Scenario: Gewählt
- GIVEN der Benutzer wählt hell
- WHEN er lädt die Seite neu
- THEN bleibt es hell

### Requirement: Sprache der Oberfläche
Das System MUSS die Oberfläche in Deutsch und Englisch anbieten, Standard Deutsch, mit Sprachwahl in der Kopfzeile, die im Cookie `cardkeeper_locale` gemerkt wird; die URL MUSS ohne Sprachpräfix auskommen.
Quelle: Chat 2026-10-04 10:00 (Fragerunde „UI-Sprache“: „i18n Deutsch + Englisch“); Code app/nuxt.config.ts | Herkunft: User-Vorgabe | Inventar: R-034, R-105 | MUSS=SHALL

#### Scenario: Wechsel
- GIVEN die Oberfläche ist Deutsch
- WHEN Englisch gewählt wird
- THEN erscheinen alle Texte in Englisch

### Requirement: Vollständige Übersetzungen
Das System MUSS alle Übersetzungstexte in beiden Sprachen mit gleichen Platzhaltern führen.
Quelle: Code app/i18n/locales/*.json; Test app/tests/unit/locales.test.ts | Herkunft: Abgeleitet | Inventar: R-105 | MUSS=SHALL

#### Scenario: Schlüssel
- GIVEN ein Schlüssel nur in einer Sprache
- WHEN die Tests laufen
- THEN schlägt der Locales-Test fehl

### Requirement: Zahlen und Daten
Das System MUSS Zahlen und Daten nach `de-CH` (Deutsch) bzw. `en-GB` (Englisch) formatieren.
Quelle: Code app/app/composables/useFormat.ts | Herkunft: Abgeleitet | Inventar: R-105 | MUSS=SHALL

#### Scenario: Deutsch
- GIVEN die Oberfläche ist Deutsch
- WHEN ein Datum angezeigt wird
- THEN folgt es dem Format `de-CH`

### Requirement: Seitentitel und Fusszeile
Das System MUSS den Seitentitel als „Cardkeeper - <Seite>“ (z. B. „Cardkeeper - Übersicht“) setzen und in der Fusszeile „Cardkeeper v<Version>“ zeigen.
Quelle: Chat 2026-10-07 19:16 („Cardkeeper - {Seite}“); Code app/app/app.vue, layouts/default.vue | Herkunft: User-Vorgabe | Inventar: R-105 | MUSS=SHALL

#### Scenario: Übersicht
- GIVEN die Übersicht ist offen
- WHEN der Titel gelesen wird
- THEN lautet er „Cardkeeper - Übersicht“

### Requirement: Stabile Kopfzeile
Das System MUSS die Umschaltung „Karten“/„Benutzer“ beim Seitenwechsel an derselben Stelle lassen und das Suchfeld nur in der Kartenübersicht zeigen.
Quelle: Chat 2026-10-07 17:18 | Herkunft: User-Vorgabe | Inventar: R-211 | MUSS=SHALL

#### Scenario: Benutzerseite
- GIVEN die Seite „Benutzer“ ist offen
- WHEN die Kopfzeile erscheint
- THEN steht die Umschaltung am gleichen Ort und das Suchfeld fehlt

### Requirement: Kein Layout-Sprung
Das System MUSS verhindern, dass sich beim Öffnen von Dropdowns oder Dialogen der Seitenrand verschiebt.
Quelle: Chat 2026-10-07 17:40 | Herkunft: User-Vorgabe | Inventar: R-212 | MUSS=SHALL

#### Scenario: Dropdown
- GIVEN eine Seite mit Scrollbalken
- WHEN ein Dropdown geöffnet wird
- THEN bleibt der Seitenrand stehen

### Requirement: Fehlerübersetzung
Das System MUSS API-Fehler mit einem stabilen Code liefern, den die Oberfläche über `errors.<code>` übersetzt; unbekannte Codes MÜSSEN eine allgemeine Meldung zeigen, die Begrenzung der Karten-DB (`upstream_rate_limited`) einen eigenen Text.
Quelle: Chat 2026-10-10 21:15; Code app/server/lib/errors.ts, app/app/composables/useApiError.ts; Test api-errors.test.ts | Herkunft: Abgeleitet | Inventar: R-107 | MUSS=SHALL

#### Scenario: Unbekannter Code
- GIVEN die API liefert einen unbekannten Code
- WHEN der Fehler angezeigt wird
- THEN erscheint die allgemeine Meldung

### Requirement: Fehlerseite
Das System MUSS bei einem Fehler eine Fehlerseite mit Zurück-Knopf zeigen.
Quelle: Code app/app/error.vue | Herkunft: Abgeleitet | Inventar: R-105 | MUSS=SHALL

#### Scenario: Fehler
- GIVEN eine unbekannte Seite wird aufgerufen
- WHEN die Seite erscheint
- THEN gibt es einen Knopf zurück

### Requirement: App-Symbole
Das System MUSS ein Favicon (16/32/48), PNG-Symbole (16, 32) und ein Apple-Touch-Icon (180) ohne weissen Rahmen aus `public/` ausliefern, auch ohne Login.
Quelle: Chat 2026-10-09 18:28, 18:32, 18:33 | Herkunft: User-Vorgabe | Inventar: R-214 | MUSS=SHALL

#### Scenario: Ohne Login
- GIVEN der Benutzer ist nicht angemeldet
- WHEN `/favicon.ico` aufgerufen wird
- THEN wird das Symbol geliefert
