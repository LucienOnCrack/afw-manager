-- catalog_extracted: parallel schema for GoCreate-extracted data
-- Mirrors the existing "catalog" schema exactly so the API can swap between them.

CREATE SCHEMA IF NOT EXISTS catalog_extracted;

-- 1. Item combinations
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_item_combinations (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL
);

-- 2. Item parts (which product parts belong to which item combo)
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_item_parts (
  item_id    INTEGER NOT NULL,
  part_id    INTEGER NOT NULL,
  part_name  TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, part_id, sort_order)
);

-- 3. Makes per product part
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_makes (
  id       INTEGER NOT NULL,
  part_id  INTEGER NOT NULL,
  name     TEXT NOT NULL,
  PRIMARY KEY (id, part_id)
);

-- 4. Models per product part
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_models (
  id       INTEGER NOT NULL,
  part_id  INTEGER NOT NULL,
  name     TEXT NOT NULL,
  PRIMARY KEY (id, part_id)
);

-- 5. Canvas options
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_canvas_options (
  value_id INTEGER PRIMARY KEY,
  label    TEXT NOT NULL
);

-- 6. Lining modes
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_lining_modes (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

-- 7. Button / trim options
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_buttons (
  trim_id    INTEGER PRIMARY KEY,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 8. Sales associates
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_sales_associates (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

-- 9. Fit advise per product part
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_fit_advise (
  id      INTEGER NOT NULL,
  part_id INTEGER NOT NULL,
  name    TEXT NOT NULL,
  PRIMARY KEY (id, part_id)
);

-- 10. Fits per product part
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_fits (
  id      INTEGER NOT NULL,
  part_id INTEGER NOT NULL,
  name    TEXT NOT NULL,
  PRIMARY KEY (id, part_id)
);

-- 11. Try-on sizes per product part
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_tryon_sizes (
  id         INTEGER NOT NULL,
  part_id    INTEGER NOT NULL,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, part_id)
);

-- 12. Design option categories per product part
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_option_categories (
  id            INTEGER NOT NULL,
  part_id       INTEGER NOT NULL,
  category_name TEXT NOT NULL,
  PRIMARY KEY (id, part_id)
);

-- 13. Design options (belongs to a category + part)
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_design_options (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL,
  part_id     INTEGER NOT NULL,
  option_id   INTEGER NOT NULL,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (category_id, part_id, option_id)
);

-- 14. Option values (belongs to a design option)
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_option_values (
  id               SERIAL PRIMARY KEY,
  design_option_id INTEGER NOT NULL REFERENCES catalog_extracted.gc_design_options(id) ON DELETE CASCADE,
  value_id         TEXT NOT NULL,
  label            TEXT NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0
);

-- 15. Fit tools per product part
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_fit_tools (
  id          SERIAL PRIMARY KEY,
  part_id     INTEGER NOT NULL,
  name        TEXT NOT NULL,
  section     TEXT NOT NULL DEFAULT '',
  input_type  TEXT NOT NULL DEFAULT 'numeric',
  min_val     NUMERIC,
  max_val     NUMERIC,
  step_val    NUMERIC,
  default_val TEXT,
  options     JSONB,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- 16. Branding positions per product part
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_branding_positions (
  id            SERIAL PRIMARY KEY,
  part_id       INTEGER NOT NULL,
  position_id   INTEGER NOT NULL,
  position_name TEXT NOT NULL,
  UNIQUE (part_id, position_id)
);

-- 17. Branding labels (belongs to a branding position)
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_branding_labels (
  id          SERIAL PRIMARY KEY,
  position_pk INTEGER NOT NULL REFERENCES catalog_extracted.gc_branding_positions(id) ON DELETE CASCADE,
  label_id    INTEGER NOT NULL,
  label_name  TEXT NOT NULL,
  UNIQUE (position_pk, label_id)
);

-- 18. Design option conflicts
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_design_conflicts (
  id                SERIAL PRIMARY KEY,
  part_id           INTEGER NOT NULL,
  option_a_id       INTEGER NOT NULL,
  option_a_name     TEXT NOT NULL,
  option_a_value_ids JSONB NOT NULL DEFAULT '[]',
  option_a_label    TEXT NOT NULL DEFAULT '',
  option_b_id       INTEGER NOT NULL,
  option_b_name     TEXT NOT NULL,
  option_b_value_ids JSONB NOT NULL DEFAULT '[]',
  option_b_label    TEXT NOT NULL DEFAULT '',
  message           TEXT NOT NULL DEFAULT ''
);

-- 19. Lining color map (keyword -> lining match)
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_lining_color_map (
  id             SERIAL PRIMARY KEY,
  color_keyword  TEXT NOT NULL,
  lining_group   INTEGER NOT NULL,
  lining_id      INTEGER NOT NULL,
  lining_code    TEXT NOT NULL,
  lining_name    TEXT NOT NULL,
  UNIQUE (color_keyword, lining_group)
);

-- 20. Combination visibility (which parts are shown for each item combo)
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_combination_visibility (
  item_id           INTEGER PRIMARY KEY,
  part_ids          JSONB NOT NULL DEFAULT '[]',
  show_extra_lining BOOLEAN NOT NULL DEFAULT false
);

-- Grants
GRANT USAGE ON SCHEMA catalog_extracted TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog_extracted TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA catalog_extracted TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA catalog_extracted TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA catalog_extracted
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog_extracted
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog_extracted
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

NOTIFY pgrst, 'reload schema';
