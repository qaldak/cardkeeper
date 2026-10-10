-- The scheduled reload of the prices: when the prices of a card were last asked for, and a record of every tranche.
-- Cards that exist already count as checked when their latest price (or, without one, their last fetch or creation) was
-- recorded, so that the first tranche starts with the oldest prices.
ALTER TABLE "cards" ADD COLUMN "prices_checked_at" TIMESTAMP(3);

UPDATE "cards" AS c
SET "prices_checked_at" = COALESCE(
  (SELECT max(p."fetched_at") FROM "price_history" AS p WHERE p."card_id" = c."id"),
  c."last_fetched_at",
  c."created_at"
);

CREATE TABLE "price_refresh_runs" (
    "id" SERIAL NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "cards_due" INTEGER NOT NULL DEFAULT 0,
    "cards_updated" INTEGER NOT NULL DEFAULT 0,
    "cards_failed" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,

    CONSTRAINT "price_refresh_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_refresh_runs_started_at_idx" ON "price_refresh_runs"("started_at");
