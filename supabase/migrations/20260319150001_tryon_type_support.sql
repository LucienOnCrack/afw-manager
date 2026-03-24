-- Add tryon_type support for denim/pants 3-level TryOn hierarchy
-- GoCreate Denim flow: Fit → TryOn Type → TryOn Size
-- Standard flow: Fit → TryOn Size (tryon_type is NULL)

ALTER TABLE catalog_extracted.gc_tryon_sizes
  ADD COLUMN IF NOT EXISTS tryon_type TEXT DEFAULT NULL;

-- Rebuild index to include tryon_type for efficient filtering
DROP INDEX IF EXISTS catalog_extracted.idx_tryon_part_fit;
CREATE INDEX idx_tryon_part_fit_type
  ON catalog_extracted.gc_tryon_sizes (part_id, fit_id, tryon_type);

NOTIFY pgrst, 'reload schema';
