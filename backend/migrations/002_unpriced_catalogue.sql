-- Allow verified catalogue entries to be drafted before the business supplies a price.
-- Such products must remain unavailable until a real positive price is configured.
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_price_positive;
ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price IS NULL OR price > 0);
ALTER TABLE products ADD CONSTRAINT products_available_requires_price CHECK (NOT available OR price IS NOT NULL);
