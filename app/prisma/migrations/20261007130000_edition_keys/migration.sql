-- The preset editions of a Yu-Gi-Oh! card are stored as keys (FIRST_EDITION, UNLIMITED, LIMITED_EDITION) so that their
-- label can follow the language. The column stays free text: every other value is left exactly as it is.
-- Only the three English spellings written so far are matched, case-insensitive and trimmed.
UPDATE "card_sets"
SET "edition" = CASE lower(btrim("edition"))
  WHEN '1st edition' THEN 'FIRST_EDITION'
  WHEN 'unlimited' THEN 'UNLIMITED'
  WHEN 'limited edition' THEN 'LIMITED_EDITION'
END
WHERE lower(btrim("edition")) IN ('1st edition', 'unlimited', 'limited edition');
