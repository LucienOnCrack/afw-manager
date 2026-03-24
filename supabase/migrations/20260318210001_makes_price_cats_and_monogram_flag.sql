-- Add make_price_categories to gc_makes (nullable TEXT; null = available for all fabrics)
ALTER TABLE catalog_extracted.gc_makes
  ADD COLUMN IF NOT EXISTS make_price_categories TEXT;

-- Add is_monogram flag to gc_option_categories
ALTER TABLE catalog_extracted.gc_option_categories
  ADD COLUMN IF NOT EXISTS is_monogram BOOLEAN NOT NULL DEFAULT FALSE;
