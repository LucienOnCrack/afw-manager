-- Deduplicate gc_option_values: keep lowest id per (design_option_id, label)
DELETE FROM catalog_extracted.gc_option_values
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY design_option_id, label ORDER BY id) AS rn
    FROM catalog_extracted.gc_option_values
  ) ranked
  WHERE rn > 1
);

-- Deduplicate gc_branding_labels: keep lowest id per (position_fk, label_name)
DELETE FROM catalog_extracted.gc_branding_labels
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY position_fk, label_name ORDER BY id) AS rn
    FROM catalog_extracted.gc_branding_labels
  ) ranked
  WHERE rn > 1
);

-- Re-sequence sort_order in gc_option_values to close gaps
WITH renumbered AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY design_option_id ORDER BY sort_order, id) - 1 AS new_sort
  FROM catalog_extracted.gc_option_values
)
UPDATE catalog_extracted.gc_option_values ov
SET sort_order = r.new_sort
FROM renumbered r
WHERE ov.id = r.id AND ov.sort_order != r.new_sort;

-- Prevent future duplicates (IF NOT EXISTS to handle re-runs)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_option_values_option_label') THEN
    ALTER TABLE catalog_extracted.gc_option_values
      ADD CONSTRAINT uq_option_values_option_label UNIQUE (design_option_id, label);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_branding_labels_position_name') THEN
    ALTER TABLE catalog_extracted.gc_branding_labels
      ADD CONSTRAINT uq_branding_labels_position_name UNIQUE (position_fk, label_name);
  END IF;
END $$;
