-- Additional tables for 100% GoCreate order creation replication
-- Applied to both catalog and catalog_extracted schemas

DO $$ BEGIN

-- ────────────────────────────────────────────────────────────
-- 1. Product lines (ateliers) and their part mappings
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_product_lines (
  atelier_id    INTEGER PRIMARY KEY,
  name          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_extracted.gc_product_line_parts (
  atelier_id  INTEGER NOT NULL REFERENCES catalog_extracted.gc_product_lines(atelier_id) ON DELETE CASCADE,
  part_id     INTEGER NOT NULL,
  PRIMARY KEY (atelier_id, part_id)
);

-- ────────────────────────────────────────────────────────────
-- 2. Make/fit-specific design option overrides
--    Stores the full set of options for each make/fit/atelier combo
--    so the wizard can swap options when make or fit changes
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_design_option_combos (
  id          SERIAL PRIMARY KEY,
  part_id     INTEGER NOT NULL,
  make_id     INTEGER NOT NULL,
  fit_id      INTEGER NOT NULL,
  atelier_id  INTEGER NOT NULL DEFAULT 1,
  option_name TEXT NOT NULL,
  select_id   TEXT NOT NULL,
  UNIQUE (part_id, make_id, fit_id, atelier_id, option_name)
);

CREATE TABLE IF NOT EXISTS catalog_extracted.gc_design_option_combo_values (
  id        SERIAL PRIMARY KEY,
  combo_id  INTEGER NOT NULL REFERENCES catalog_extracted.gc_design_option_combos(id) ON DELETE CASCADE,
  value_id  TEXT NOT NULL,
  label     TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ────────────────────────────────────────────────────────────
-- 3. Customer form fields and body type options
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_customer_fields (
  id         SERIAL PRIMARY KEY,
  field_name TEXT NOT NULL UNIQUE,
  field_type TEXT NOT NULL DEFAULT 'text',
  section    TEXT NOT NULL DEFAULT 'general'
);

CREATE TABLE IF NOT EXISTS catalog_extracted.gc_customer_dropdowns (
  id            SERIAL PRIMARY KEY,
  dropdown_name TEXT NOT NULL UNIQUE,
  label         TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS catalog_extracted.gc_customer_dropdown_options (
  id          SERIAL PRIMARY KEY,
  dropdown_id INTEGER NOT NULL REFERENCES catalog_extracted.gc_customer_dropdowns(id) ON DELETE CASCADE,
  value       TEXT NOT NULL,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ────────────────────────────────────────────────────────────
-- 4. Localized messages (UI text, validation, errors)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_localized_messages (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 5. Item type categories (wizard top-level groups)
--    Maps the GoCreate "Please select item type" screen
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog_extracted.gc_item_type_categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalog_extracted.gc_item_type_category_parts (
  category_id INTEGER NOT NULL REFERENCES catalog_extracted.gc_item_type_categories(id) ON DELETE CASCADE,
  part_id     INTEGER NOT NULL,
  PRIMARY KEY (category_id, part_id)
);

-- ────────────────────────────────────────────────────────────
-- Mirror tables in catalog schema too
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog.gc_product_lines (
  atelier_id    INTEGER PRIMARY KEY,
  name          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog.gc_product_line_parts (
  atelier_id  INTEGER NOT NULL REFERENCES catalog.gc_product_lines(atelier_id) ON DELETE CASCADE,
  part_id     INTEGER NOT NULL,
  PRIMARY KEY (atelier_id, part_id)
);

CREATE TABLE IF NOT EXISTS catalog.gc_design_option_combos (
  id          SERIAL PRIMARY KEY,
  part_id     INTEGER NOT NULL,
  make_id     INTEGER NOT NULL,
  fit_id      INTEGER NOT NULL,
  atelier_id  INTEGER NOT NULL DEFAULT 1,
  option_name TEXT NOT NULL,
  select_id   TEXT NOT NULL,
  UNIQUE (part_id, make_id, fit_id, atelier_id, option_name)
);

CREATE TABLE IF NOT EXISTS catalog.gc_design_option_combo_values (
  id        SERIAL PRIMARY KEY,
  combo_id  INTEGER NOT NULL REFERENCES catalog.gc_design_option_combos(id) ON DELETE CASCADE,
  value_id  TEXT NOT NULL,
  label     TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalog.gc_customer_fields (
  id         SERIAL PRIMARY KEY,
  field_name TEXT NOT NULL UNIQUE,
  field_type TEXT NOT NULL DEFAULT 'text',
  section    TEXT NOT NULL DEFAULT 'general'
);

CREATE TABLE IF NOT EXISTS catalog.gc_customer_dropdowns (
  id            SERIAL PRIMARY KEY,
  dropdown_name TEXT NOT NULL UNIQUE,
  label         TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS catalog.gc_customer_dropdown_options (
  id          SERIAL PRIMARY KEY,
  dropdown_id INTEGER NOT NULL REFERENCES catalog.gc_customer_dropdowns(id) ON DELETE CASCADE,
  value       TEXT NOT NULL,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalog.gc_localized_messages (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog.gc_item_type_categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalog.gc_item_type_category_parts (
  category_id INTEGER NOT NULL REFERENCES catalog.gc_item_type_categories(id) ON DELETE CASCADE,
  part_id     INTEGER NOT NULL,
  PRIMARY KEY (category_id, part_id)
);

END $$;

-- Grants for new tables
GRANT SELECT ON ALL TABLES IN SCHEMA catalog_extracted TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA catalog_extracted TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA catalog_extracted TO service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA catalog TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA catalog TO service_role;

NOTIFY pgrst, 'reload schema';
