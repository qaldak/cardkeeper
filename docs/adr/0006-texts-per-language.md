# ADR 0006: Language-dependent texts in a translation table, attributes from the English answer

- **Status:** Accepted
- **Date:** Not documented (deviation from the concept, described in the README)
- **Origin:** Derived (README §Data model; not documented as a separate decision in the user instructions).
- **Specs:** [`data-storage`](../../openspec/specs/data-storage/spec.md), [`game-adapters`](../../openspec/specs/game-adapters/spec.md), [`overview`](../../openspec/specs/overview/spec.md)

## Context

Cards exist in several languages (Yu-Gi-Oh!: German and English, Pokémon additionally Japanese). The concept knows only one name and one description per card. The user demands that card type, type and attribute are "always the same value", regardless of the language (User instruction 2026-10-05 17:18).

## Decision

Language-dependent texts are stored in `card_translations` (one row per card and language); `cards.name` is the display name in the preferred language (de, en, ja). Language-independent attributes come from the English answer. The raw answer of every language is stored as a snapshot.

## Considered alternatives

Not documented.

## Consequences

- Names, texts and attributes are read-only, there are no manual overrides (`manual_overrides` is dropped).
- The search covers the names of all languages (spec `overview`).
- An English copy on a German request is not stored as a translation (spec `game-adapters`).

## Sources

- `README.md` §Data model
- User instruction 2026-10-05 17:18
- `app/prisma/schema.prisma`, `app/shared/utils/languages.ts`
