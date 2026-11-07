-- Whether a card may be used in a deck. New cards are for the deck unless the application says otherwise.
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "deckable" BOOLEAN NOT NULL DEFAULT true;

-- Existing Yu-Gi-Oh! cards that cannot be in a deck: cards entered by hand (no external ID; the manual entry exists
-- since release 0.26.0) and the card types Token and Skill Card of the card database. Every other card stays true.
UPDATE "cards"
SET "deckable" = false
WHERE "game_id" IN (SELECT "id" FROM "games" WHERE "slug" = 'ygo')
  AND ("external_id" IS NULL OR "game_specific_attributes"->>'type' IN ('Token', 'Skill Card'));
