# Spec Delta

## ADDED Requirements

### Requirement: Deck use is stored per card
The system SHALL store per card whether it is for the deck (`cards.deckable`, never empty, true by default) as the user's own data that "Update from API" does not change, and the migration SHALL set it to false for Yu-Gi-Oh! cards without external ID or of card type `Token` or `Skill Card`, and to true for all other cards.
Source: User instruction 2026-11-07 (flag `deckable`, migration of existing cards); YGOPRODeck API checked 2026-11-07 (card types Token, Skill Card) | Origin: user requirement

#### Scenario: Migration
- GIVEN existing cards: a normal Yu-Gi-Oh! card, a Yu-Gi-Oh! card without external ID, a Yu-Gi-Oh! token from the card database, and a Pokémon card
- WHEN the migration has run
- THEN only the first and the Pokémon card are for the deck

#### Scenario: New card of another game
- GIVEN a Pokémon card is added
- WHEN it is stored
- THEN it is for the deck and the flag has no effect
