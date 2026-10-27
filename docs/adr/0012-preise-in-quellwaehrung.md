# ADR 0012: Preise in Quellwährung speichern, bei der Anzeige umrechnen; Kurse nur im Speicher

- **Status:** Akzeptiert
- **Datum:** 2026-10-04 und 2026-10-10
- **Herkunft:** User-Vorgabe (Fragerunde „Währung“ 2026-10-04 10:00 und Anforderung CHF 2026-10-10 22:14); Die Auslegungen „ohne `DISPLAY_CURRENCY` bleibt die Quellwährung“ und „bei Ausfall früherer Kurs, sonst Originalpreis“ bestätigte der Benutzer am 2026-10-23; die Umrechnung des Preisverlaufs mit dem heutigen Kurs ist ein Entscheid des Assistenten, nicht beanstandet.
- **Specs:** [`waehrungsumrechnung`](../../openspec/specs/waehrungsumrechnung/spec.md), [`preise`](../../openspec/specs/preise/spec.md)

## Kontext

Die Mockups zeigten Preise in CHF, YGOPRODeck liefert nur USD und EUR (Cardmarket, TCGplayer, eBay, Amazon). Am 2026-10-10 22:14 verlangte der Benutzer die zusätzliche Anzeige in CHF mit einem Tageskurs, bei Fehler nur den Originalwert, Kurs nicht in der Oberfläche.

## Entscheid

Preise bleiben in der Währung ihres Marktplatzes in der Datenbank. Eine optionale `DISPLAY_CURRENCY` zeigt sie zusätzlich umgerechnet. Die Kurse (EZB über Frankfurter) werden beim ersten Bedarf geholt, einmal je UTC-Tag im Speicher gehalten und für alle Benutzer geteilt. Bei Ausfall gilt der Kurs eines früheren Tages, sonst der Originalpreis; der Preisverlauf wird mit dem heutigen Kurs umgerechnet.

## Betrachtete Alternativen

- „EUR→CHF umrechnen“ (Fragerunde 2026-10-04, nicht gewählt).
- „Anzeigewährung per Env-Variable“ (Fragerunde 2026-10-04, nicht gewählt; später am 2026-10-10 zusätzlich zur Quellwährung doch eingeführt).
- Kurse in der Datenbank speichern: nicht dokumentiert.

## Konsequenzen

- Die Umrechnung ändert keine gespeicherten Preise.
- Ein Neustart leert den Kurs-Zwischenspeicher; der erste Aufruf holt wieder einen Kurs.

## Quellen

- Chat 2026-10-04 10:00 (Fragerunde „Währung“), 2026-10-10 22:14, 22:25, 22:36/22:38
- `README.md` §Features, §Data model
- `app/server/services/rates.ts`
