-- Texts move into a per-language table, manual overrides of API data are removed (name, description
-- and attributes are no longer editable; only set code and edition are).

-- CreateTable
CREATE TABLE "card_translations" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "language" VARCHAR(5) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_translations_card_id_language_key" ON "card_translations"("card_id", "language");

-- AddForeignKey
ALTER TABLE "card_translations" ADD CONSTRAINT "card_translations_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep the existing data: every card gets one translation in the language it was stored in.
INSERT INTO "card_translations" ("card_id", "language", "name", "description", "fetched_at")
SELECT "id", "language", "name", "description", COALESCE("last_fetched_at", "created_at")
FROM "cards";

-- Snapshots remember the language of the response.
ALTER TABLE "api_snapshots" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
UPDATE "api_snapshots" AS s SET "language" = c."language" FROM "cards" AS c WHERE c."id" = s."card_id";

-- Cards that were edited by hand count as user modified.
ALTER TABLE "cards" ADD COLUMN "user_modified_at" TIMESTAMP(3);
UPDATE "cards" SET "user_modified_at" = "last_modified_at" WHERE "manual_overrides" <> '{}'::jsonb;

ALTER TABLE "cards"
    DROP COLUMN "description",
    DROP COLUMN "language",
    DROP COLUMN "manual_overrides";

-- A printing can be entered by hand with just a set code.
ALTER TABLE "card_sets" ALTER COLUMN "set_name" DROP NOT NULL;
