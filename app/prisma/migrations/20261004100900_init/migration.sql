-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('ACTIVE', 'SOLD', 'TRADED', 'GIFTED', 'LOST');

-- CreateEnum
CREATE TYPE "ImageSource" AS ENUM ('API', 'MANUAL');

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "external_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "game_specific_attributes" JSONB NOT NULL DEFAULT '{}',
    "manual_overrides" JSONB NOT NULL DEFAULT '{}',
    "assigned_player_id" INTEGER,
    "status" "CardStatus" NOT NULL DEFAULT 'ACTIVE',
    "purchase_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_fetched_at" TIMESTAMP(3),
    "last_modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified_by" TEXT,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_sets" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "set_code" TEXT NOT NULL,
    "set_name" TEXT NOT NULL,
    "rarity" TEXT,
    "edition" TEXT,

    CONSTRAINT "card_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "status" "CardStatus" NOT NULL,
    "date" DATE NOT NULL,
    "person_text" TEXT,
    "changed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_snapshots" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_json" JSONB NOT NULL,

    CONSTRAINT "api_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_images" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "source" "ImageSource" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" TEXT,

    CONSTRAINT "card_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "field" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "players_name_key" ON "players"("name");

-- CreateIndex
CREATE INDEX "cards_game_id_status_idx" ON "cards"("game_id", "status");

-- CreateIndex
CREATE INDEX "cards_assigned_player_id_idx" ON "cards"("assigned_player_id");

-- CreateIndex
CREATE INDEX "cards_external_id_idx" ON "cards"("external_id");

-- CreateIndex
CREATE INDEX "card_sets_card_id_idx" ON "card_sets"("card_id");

-- CreateIndex
CREATE INDEX "price_history_card_id_source_fetched_at_idx" ON "price_history"("card_id", "source", "fetched_at");

-- CreateIndex
CREATE INDEX "status_history_card_id_created_at_idx" ON "status_history"("card_id", "created_at");

-- CreateIndex
CREATE INDEX "api_snapshots_card_id_idx" ON "api_snapshots"("card_id");

-- CreateIndex
CREATE INDEX "card_images_card_id_idx" ON "card_images"("card_id");

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log"("entity", "entity_id");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_assigned_player_id_fkey" FOREIGN KEY ("assigned_player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_sets" ADD CONSTRAINT "card_sets_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_snapshots" ADD CONSTRAINT "api_snapshots_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_images" ADD CONSTRAINT "card_images_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
