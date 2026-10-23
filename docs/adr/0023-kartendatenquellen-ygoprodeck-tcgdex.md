# ADR 0023: Kartendaten von YGOPRODeck (Yu-Gi-Oh!) und TCGdex (Pokémon)

- **Status:** Akzeptiert
- **Datum:** 2026-10-03 (YGOPRODeck, Konzept); 2026-10-05 (TCGdex)
- **Herkunft:** YGOPRODeck: Abgeleitet (Konzept des Benutzers, Q-007). TCGdex: User-Vorgabe (Chat 2026-10-05 18:57).
- **Inventar:** D-036, D-044, R-001, R-057
- **Specs:** [`spiele-adapter`](../../openspec/specs/spiele-adapter/spec.md)

## Kontext

Das Konzept nennt den YGO-Adapter (YGOPRODeck) als ersten und als spätere Kandidaten die Pokémon TCG API (pokemontcg.io) und Scryfall für Magic. Am 2026-10-05 18:57 verlangte der Benutzer Pokémon und gab TCGdex mit Recherche-Text vor: kostenlos, kein API-Key, REST.

## Entscheid

Yu-Gi-Oh!-Daten kommen von YGOPRODeck, Pokémon-Daten von TCGdex (Deutsch, Englisch und eine eigene Datenbank für Japanisch). Die Basis-URLs lassen sich über `YGOPRODECK_API_URL` und `TCGDEX_API_URL` im Container-Umfeld überschreiben.

## Betrachtete Alternativen

- Pokémon TCG API (pokemontcg.io) und Scryfall (Konzept als spätere Kandidaten genannt; die Wahl für Pokémon fiel auf TCGdex).

## Konsequenzen

- Beide Dienste haben Begrenzungen; die App meldet sie dem Benutzer (Spec `spiele-adapter`, `preise`).
- Magic ist nicht umgesetzt.
- Die Basis-URLs werden nur aus dem Container-Umfeld gelesen; `docker-compose.yml` reicht sie nicht aus `.env` weiter, die Entwicklungsdatei nur `YGOPRODECK_API_URL` (K-007, README §Configuration).

## Quellen

- `docs/KONZEPT.md` §Multi-TCG-Konzept
- Chat 2026-10-05 18:57
- `README.md` §Pokémon, §Notes on the card API
- `app/server/tcg/ygo/adapter.ts`, `app/server/tcg/tcgdex/adapter.ts`
