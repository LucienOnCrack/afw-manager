CREATE TABLE IF NOT EXISTS orders (
  order_number             TEXT PRIMARY KEY,
  shop_order_number        TEXT,
  retail_price             NUMERIC,
  p_price                  NUMERIC,
  downpayment              NUMERIC,
  customer_id              TEXT,
  process_date             TEXT,
  order_type               TEXT,
  order_type_id            INTEGER,
  tailor                   TEXT,
  status                   TEXT,
  days_in_status           TEXT,
  fabric                   TEXT,
  lining                   TEXT,
  delivery_date            TEXT,
  updated_delivery_date    TEXT,
  latest_delivery_date     TEXT,
  shop_label               TEXT,
  created_by               TEXT,
  created_date             DATE,
  customer_name            TEXT,
  company                  TEXT,
  fabric_price_category    TEXT,
  p_price_discount         NUMERIC,
  total_p_price            NUMERIC,
  r_price_discount         NUMERIC,
  r_price_service_charge   NUMERIC,
  total_r_price            NUMERIC,
  outstanding_amount       NUMERIC,
  expected_delivery_date   TEXT,
  urgent_order             TEXT,
  shop_name                TEXT,
  occasion                 TEXT,
  synced_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_date ON orders (created_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_fabric ON orders (fabric);
CREATE INDEX IF NOT EXISTS idx_orders_shop_name ON orders (shop_name);
