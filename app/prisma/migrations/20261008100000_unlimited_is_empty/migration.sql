-- "Unlimited" is not printed on a Yu-Gi-Oh! card: such a card has no edition. Where it was stored as a value (the text
-- "Unlimited" or the key UNLIMITED), the edition becomes empty. Every other value stays as it is.
UPDATE "card_sets"
SET "edition" = NULL
WHERE lower(btrim("edition")) IN ('unlimited');
