-- ============================================================================
-- catalog_extracted v4 — full schema matching API shape
-- ============================================================================
-- ALL data comes EXCLUSIVELY from GoCreate extraction.
-- NEVER import from the manual catalog schema.
--
-- Data sources:
--   Primary Info wizard (37 combos)         → item_combinations, item_parts, models, lining_modes, sales_associates
--   /ShopSettings/GetProductLineMakeAndFits  → product_parts, product_lines, makes, fits
--   /ShopSettings/GetDesignOptions (×149)    → design_options, option_values, combo_option_availability
--   /ShopSettings/GetFitTools (×46)          → fit_tools
--   Wizard Step 1 HTML                       → canvas_options, buttons, combination_visibility
--   TryOn size extraction                    → tryon_sizes
--   Order data + browser                     → branding_positions, branding_labels
--   GoCreate JS analysis                     → localized_messages, design_conflicts
--   Customer HTML form parsing               → customer_fields, dropdowns
-- ============================================================================

DROP SCHEMA IF EXISTS catalog_extracted CASCADE;
CREATE SCHEMA catalog_extracted;

-- ──────────────────────────────────────────────────────────────────────
-- 1. Product parts — every garment/accessory type
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_product_parts (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL,
  slug  TEXT NOT NULL DEFAULT ''
);

-- ──────────────────────────────────────────────────────────────────────
-- 2. Product lines (ateliers)
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_product_lines (
  atelier_id  INTEGER PRIMARY KEY,
  name        TEXT NOT NULL
);

CREATE TABLE catalog_extracted.gc_product_line_parts (
  atelier_id  INTEGER NOT NULL REFERENCES catalog_extracted.gc_product_lines(atelier_id) ON DELETE CASCADE,
  part_id     INTEGER NOT NULL REFERENCES catalog_extracted.gc_product_parts(id) ON DELETE CASCADE,
  PRIMARY KEY (atelier_id, part_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- 3. Item combinations — "2-piece suit", "Shirt", "Sneaker", etc.
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_item_combinations (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL
);

-- ──────────────────────────────────────────────────────────────────────
-- 4. Item parts — which product parts belong to each combination
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_item_parts (
  id          SERIAL PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES catalog_extracted.gc_item_combinations(id) ON DELETE CASCADE,
  part_id     INTEGER NOT NULL,
  part_name   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (item_id, part_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- 5. Models (Sub Product Parts / SPP) per product part
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_models (
  id       INTEGER NOT NULL,
  part_id  INTEGER NOT NULL,
  name     TEXT NOT NULL,
  PRIMARY KEY (id, part_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- 6. Makes & fits per part
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_makes (
  id       INTEGER NOT NULL,
  part_id  INTEGER NOT NULL REFERENCES catalog_extracted.gc_product_parts(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  PRIMARY KEY (id, part_id)
);

CREATE TABLE catalog_extracted.gc_fits (
  id       INTEGER NOT NULL,
  part_id  INTEGER NOT NULL REFERENCES catalog_extracted.gc_product_parts(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  PRIMARY KEY (id, part_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- 7. Canvas options
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_canvas_options (
  value_id  INTEGER PRIMARY KEY,
  label     TEXT NOT NULL
);

-- ──────────────────────────────────────────────────────────────────────
-- 8. Lining modes
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_lining_modes (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL
);

-- ──────────────────────────────────────────────────────────────────────
-- 9. Buttons / Trims
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_buttons (
  trim_id     INTEGER PRIMARY KEY,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ──────────────────────────────────────────────────────────────────────
-- 10. Sales associates
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_sales_associates (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL
);

-- ──────────────────────────────────────────────────────────────────────
-- 11. Fit advise per part
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_fit_advise (
  id       INTEGER NOT NULL,
  part_id  INTEGER NOT NULL,
  name     TEXT NOT NULL,
  PRIMARY KEY (id, part_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- 12. Try-on sizes per part
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_tryon_sizes (
  id          SERIAL PRIMARY KEY,
  part_id     INTEGER NOT NULL,
  fit_id      INTEGER NOT NULL DEFAULT 0,
  label       TEXT NOT NULL,
  value       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_tryon_part_fit ON catalog_extracted.gc_tryon_sizes (part_id, fit_id);

-- ──────────────────────────────────────────────────────────────────────
-- 13. Design option categories
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_option_categories (
  id             SERIAL PRIMARY KEY,
  part_id        INTEGER NOT NULL,
  category_name  TEXT NOT NULL,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (part_id, category_name)
);

-- ──────────────────────────────────────────────────────────────────────
-- 14. Design options — master list per part
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_design_options (
  id            SERIAL PRIMARY KEY,
  part_id       INTEGER NOT NULL,
  category_id   INTEGER REFERENCES catalog_extracted.gc_option_categories(id) ON DELETE SET NULL,
  gc_select_id  TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (part_id, name)
);

-- ──────────────────────────────────────────────────────────────────────
-- 15. Option values
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_option_values (
  id                SERIAL PRIMARY KEY,
  design_option_id  INTEGER NOT NULL REFERENCES catalog_extracted.gc_design_options(id) ON DELETE CASCADE,
  value_id          TEXT NOT NULL,
  label             TEXT NOT NULL,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  UNIQUE (design_option_id, value_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- 16. Combo option availability — which values are valid per make/fit/atelier
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_combo_option_availability (
  id                  SERIAL PRIMARY KEY,
  part_id             INTEGER NOT NULL,
  make_id             INTEGER NOT NULL,
  fit_id              INTEGER NOT NULL,
  atelier_id          INTEGER NOT NULL DEFAULT 1,
  design_option_id    INTEGER NOT NULL REFERENCES catalog_extracted.gc_design_options(id) ON DELETE CASCADE,
  available_value_ids JSONB NOT NULL DEFAULT '[]',
  UNIQUE (part_id, make_id, fit_id, atelier_id, design_option_id)
);

CREATE INDEX idx_combo_avail_lookup
  ON catalog_extracted.gc_combo_option_availability (part_id, make_id, fit_id, atelier_id);

-- ──────────────────────────────────────────────────────────────────────
-- 17. Fit tools per part × fit
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_fit_tools (
  id          SERIAL PRIMARY KEY,
  part_id     INTEGER NOT NULL REFERENCES catalog_extracted.gc_product_parts(id) ON DELETE CASCADE,
  fit_id      INTEGER NOT NULL DEFAULT 0,
  name        TEXT NOT NULL,
  input_type  TEXT NOT NULL DEFAULT 'numeric',
  min_val     NUMERIC,
  max_val     NUMERIC,
  step_val    NUMERIC,
  default_val TEXT DEFAULT '0',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (part_id, fit_id, name)
);

-- ──────────────────────────────────────────────────────────────────────
-- 18. Branding positions and labels per part
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_branding_positions (
  id             SERIAL PRIMARY KEY,
  part_id        INTEGER NOT NULL,
  position_id    INTEGER NOT NULL,
  position_name  TEXT NOT NULL,
  UNIQUE (part_id, position_id)
);

CREATE TABLE catalog_extracted.gc_branding_labels (
  id           SERIAL PRIMARY KEY,
  position_fk  INTEGER NOT NULL REFERENCES catalog_extracted.gc_branding_positions(id) ON DELETE CASCADE,
  label_id     INTEGER NOT NULL,
  label_name   TEXT NOT NULL,
  UNIQUE (position_fk, label_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- 19. Design option conflicts
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_design_conflicts (
  id               SERIAL PRIMARY KEY,
  part_id          INTEGER NOT NULL,
  option_a_id      INTEGER,
  option_a_name    TEXT NOT NULL DEFAULT '',
  option_a_value_ids JSONB NOT NULL DEFAULT '[]',
  option_a_label   TEXT NOT NULL DEFAULT '',
  option_b_id      INTEGER,
  option_b_name    TEXT NOT NULL DEFAULT '',
  option_b_value_ids JSONB NOT NULL DEFAULT '[]',
  option_b_label   TEXT NOT NULL DEFAULT '',
  message          TEXT NOT NULL DEFAULT ''
);

-- ──────────────────────────────────────────────────────────────────────
-- 20. Lining color map
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_lining_color_map (
  id             SERIAL PRIMARY KEY,
  color_keyword  TEXT NOT NULL,
  lining_group   INTEGER NOT NULL,
  lining_id      INTEGER NOT NULL,
  lining_code    TEXT NOT NULL,
  lining_name    TEXT NOT NULL,
  UNIQUE (color_keyword, lining_group)
);

-- ──────────────────────────────────────────────────────────────────────
-- 21. Combination visibility — which parts per combo, extra lining flag
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_combination_visibility (
  item_id            INTEGER PRIMARY KEY REFERENCES catalog_extracted.gc_item_combinations(id) ON DELETE CASCADE,
  part_ids           JSONB NOT NULL DEFAULT '[]',
  show_extra_lining  BOOLEAN NOT NULL DEFAULT false
);

-- ──────────────────────────────────────────────────────────────────────
-- 22. Item type categories — wizard top-level groupings
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_item_type_categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE catalog_extracted.gc_item_type_category_parts (
  category_id INTEGER NOT NULL REFERENCES catalog_extracted.gc_item_type_categories(id) ON DELETE CASCADE,
  part_id     INTEGER NOT NULL REFERENCES catalog_extracted.gc_product_parts(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, part_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- 23. Customer form fields & dropdowns
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_customer_fields (
  id          SERIAL PRIMARY KEY,
  field_name  TEXT NOT NULL UNIQUE,
  field_type  TEXT NOT NULL DEFAULT 'text',
  section     TEXT NOT NULL DEFAULT 'general'
);

CREATE TABLE catalog_extracted.gc_customer_dropdowns (
  id              SERIAL PRIMARY KEY,
  dropdown_name   TEXT NOT NULL UNIQUE,
  label           TEXT NOT NULL DEFAULT ''
);

CREATE TABLE catalog_extracted.gc_customer_dropdown_options (
  id           SERIAL PRIMARY KEY,
  dropdown_id  INTEGER NOT NULL REFERENCES catalog_extracted.gc_customer_dropdowns(id) ON DELETE CASCADE,
  value        TEXT NOT NULL,
  label        TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- ──────────────────────────────────────────────────────────────────────
-- 24. Localized messages
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE catalog_extracted.gc_localized_messages (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);

-- ──────────────────────────────────────────────────────────────────────
-- Permissions
-- ──────────────────────────────────────────────────────────────────────
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

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, catalog, catalog_extracted';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
