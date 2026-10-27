# ADR 0004: Adapter-Pattern mit Registry pro Kartenspiel

- **Status:** Akzeptiert
- **Datum:** 2026-10-03 (Konzept); Erweiterung um Pokémon: 2026-10-05
- **Herkunft:** User-Vorgabe (Konzept des Benutzers; vom Benutzer am 2026-10-23 bestätigt). Das zweite Spiel Pokémon wurde vom Benutzer verlangt (Chat 2026-10-05 18:57).
- **Specs:** [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md)

## Kontext

Das Konzept will weitere Spiele „ohne Eingriff ins Kernschema oder die UI“ aufnehmen können; die erste Version war nur für Yu-Gi-Oh!, Pokémon kam am 2026-10-05 dazu.

## Entscheid

Jedes Spiel erhält einen Adapter mit einheitlicher Schnittstelle (`fetchCardById`, `fetchCardByName`, `searchCards`, `mapToCommonSchema`), ein Registry wählt ihn anhand des Spiels. Das Verhalten des Drucks pro Spiel steht in `shared/utils/game-config.ts`.

## Betrachtete Alternativen

nicht dokumentiert.

## Konsequenzen

- Ein neues Spiel braucht keine Schemaänderung und keine Änderung der Kerndienste (README §Adding a game).
- Karten-DB-Fehler werden einheitlich gemeldet (Spec `spiele-adapter`).

## Quellen

- `docs/KONZEPT.md` §Multi-TCG-Konzept
- `README.md` §Adding a game, §Pokémon
- Chat 2026-10-05 18:57
- `app/server/tcg/types.ts`, `registry.ts`
