# ADR 0005: Spielspezifische Attribute als JSONB

- **Status:** Akzeptiert
- **Datum:** 2026-10-03 (Konzept)
- **Herkunft:** User-Vorgabe (Konzept des Benutzers; vom Benutzer am 2026-10-23 bestätigt).
- **Specs:** [`datenhaltung`](../../openspec/specs/datenhaltung/spec.md), [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md)

## Kontext

Die Attribute unterscheiden sich je Spiel (ATK/DEF/Level bei Yu-Gi-Oh!, KP/Typen/Stufe bei Pokémon, Mana-Kosten bei Magic).

## Entscheid

Spielspezifische Werte stehen in `cards.game_specific_attributes` (JSONB); es gibt keine Spalten pro Spiel.

## Betrachtete Alternativen

nicht dokumentiert.

## Konsequenzen

- Kein Schemawechsel pro neuem Spiel (Konzept).
- Filterung und Sortierung nach diesen Werten geschieht im Speicher (siehe ADR 0014).
- Sprachabhängige Zusatzdaten (Pokémon) liegen in `card_translations.details` (README §Data model).

## Quellen

- `docs/KONZEPT.md` §Datenmodell
- `README.md` §Data model
- `app/prisma/schema.prisma`
