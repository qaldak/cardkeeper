-- Players become users who can log in, and the assignment of a card becomes its owner.
-- Names, contacts and the assignment of every card are kept. The new password hash stays NULL: a user without a hash
-- logs in with the initial password and has to choose a new one.

ALTER TABLE "players" RENAME TO "users";
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
ALTER TABLE "users" RENAME CONSTRAINT "players_pkey" TO "users_pkey";
ALTER INDEX "players_name_key" RENAME TO "users_name_key";
ALTER SEQUENCE "players_id_seq" RENAME TO "users_id_seq";

ALTER TABLE "cards" RENAME COLUMN "assigned_player_id" TO "owner_user_id";
ALTER TABLE "cards" RENAME CONSTRAINT "cards_assigned_player_id_fkey" TO "cards_owner_user_id_fkey";
ALTER INDEX "cards_assigned_player_id_idx" RENAME TO "cards_owner_user_id_idx";
