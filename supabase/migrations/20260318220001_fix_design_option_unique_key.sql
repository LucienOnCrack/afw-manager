-- Change unique constraint from (part_id, name) to (part_id, gc_select_id)
-- Different ateliers can use the same category name for different GoCreate dropdowns
-- (e.g. "Ties" = width in one atelier, "Ties" = length in another)
-- The gc_select_id is the true unique identifier per dropdown.
ALTER TABLE catalog_extracted.gc_design_options
  DROP CONSTRAINT IF EXISTS gc_design_options_part_id_name_key;

ALTER TABLE catalog_extracted.gc_design_options
  ADD CONSTRAINT gc_design_options_part_id_select_id_key UNIQUE (part_id, gc_select_id);
