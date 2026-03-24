-- Add field_config to item type categories for per-category primary info field visibility.
-- Computed at import time from GoCreate primary info extraction + order evidence.
ALTER TABLE catalog_extracted.gc_item_type_categories
  ADD COLUMN IF NOT EXISTS field_config JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN catalog_extracted.gc_item_type_categories.field_config IS
  'Per-category field visibility flags: showCanvas, showLiningMode, showLining, showButtons. Computed from GoCreate primary info extraction.';
