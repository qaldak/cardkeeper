-- Every Yu-Gi-Oh! edition that starts with "1st" or "1." ("1st Edition", "1. Auflage", "1.Auflage", ...) is the first
-- edition. Other values are not touched here: the app lists them in its log at every start, so that they can be fixed
-- with SQL.
UPDATE "card_sets" AS s
SET "edition" = 'FIRST_EDITION'
FROM "cards" AS c
JOIN "games" AS g ON g."id" = c."game_id"
WHERE c."id" = s."card_id"
  AND g."slug" = 'ygo'
  AND (lower(btrim(s."edition")) LIKE '1st%' OR lower(btrim(s."edition")) LIKE '1.%');
