# ADR 0019: Store card images locally in the volume, do not hotlink

- **Status:** Accepted
- **Date:** 2026-10-03 (concept); preview images: 2026-10-09
- **Origin:** User requirement (concept of the user, confirmed by the user on 2026-10-23); the image already at search and selection is a user requirement (User instruction 2026-10-09 20:52), the implementation through an own copy a decision of the assistant (20:58).
- **Specs:** [`images`](../../openspec/specs/images/spec.md), [`data-storage`](../../openspec/specs/data-storage/spec.md)

## Context

The concept keeps images in a local Docker volume (`/data/card-images/`), "no DB blob". On 2026-10-09 20:52 the user requested the card image already at search and selection, also for Yu-Gi-Oh!; YGOPRODeck forbids embedding ("do not hotlink", assistant 20:58).

## Decision

Images are downloaded once and stored in the volume `card-images`; the table `card_images` holds only relative paths. For Yu-Gi-Oh! preview images in the search there is an own copy (`/api/thumbnails/ygo/<passcode>`, at most 4 at a time). Pokémon images of the search come directly from TCGdex. Downloads happen only over HTTPS from the hosts declared by the adapter.

## Considered alternatives

- Images as a database blob (concept: excluded).
- Hotlinking the images from YGOPRODeck (rejected).

## Consequences

- The volume `card-images` has to be backed up (README §Backup).
- When a card is deleted, image files and directory are removed.

## Sources

- `docs/KONZEPT.md` §Datenmodell
- User instruction 2026-10-09 20:52, 20:58
- `README.md` (7f3d955) §Features, §Notes on the card API
- `app/server/services/thumbnails.ts`, `images.ts`
