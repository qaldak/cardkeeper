-- Language dependent structured data per translation (used by Pokémon cards).
ALTER TABLE "card_translations" ADD COLUMN "details" JSONB;
