# ADR 0006: Sprachabhängige Texte in einer Übersetzungstabelle, Attribute aus der englischen Antwort

- **Status:** Akzeptiert
- **Datum:** nicht dokumentiert (Abweichung vom Konzept, beschrieben im README)
- **Herkunft:** Abgeleitet (README §Data model; im Chat nicht als eigener Entscheid belegt).
- **Inventar:** D-012, D-013, R-208, R-109
- **Specs:** [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md), [`uebersicht`](../../openspec/specs/uebersicht/spec.md)

## Kontext

Karten gibt es in mehreren Sprachen (Yu-Gi-Oh!: Deutsch und Englisch, Pokémon zusätzlich Japanisch). Das Konzept kennt nur einen Namen und eine Beschreibung pro Karte. Der Benutzer verlangt, dass Kartentyp, Typ und Attribut „immer der gleiche Wert“ sind, unabhängig von der Sprache (Chat 2026-10-05 17:18).

## Entscheid

Sprachabhängige Texte stehen in `card_translations` (eine Zeile je Karte und Sprache); `cards.name` ist der Anzeigename in der bevorzugten Sprache (de, en, ja). Sprachunabhängige Attribute kommen aus der englischen Antwort. Die Roh-Antwort jeder Sprache wird als Snapshot abgelegt.

## Betrachtete Alternativen

nicht dokumentiert.

## Konsequenzen

- Namen, Texte und Attribute sind schreibgeschützt, es gibt keine manuellen Überschreibungen (`manual_overrides` entfällt).
- Die Suche durchsucht die Namen aller Sprachen (Spec `uebersicht`).
- Eine englische Kopie auf eine deutsche Anfrage wird nicht als Übersetzung gespeichert (Spec `spiele-adapter`).

## Quellen

- `README.md` §Data model
- Chat 2026-10-05 17:18 (R-208)
- `app/prisma/schema.prisma`, `app/shared/utils/languages.ts`
