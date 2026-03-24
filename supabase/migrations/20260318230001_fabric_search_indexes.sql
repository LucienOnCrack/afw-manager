-- Btree index with text_pattern_ops enables fast prefix LIKE queries (code LIKE 'E00%')
CREATE INDEX IF NOT EXISTS idx_fabrics_code_pattern
  ON fabrics (code text_pattern_ops);

-- Standard btree for ORDER BY code
CREATE INDEX IF NOT EXISTS idx_fabrics_code
  ON fabrics (code);

-- Composite partial index for the common search: in-stock fabrics sorted by code
CREATE INDEX IF NOT EXISTS idx_fabrics_code_stock
  ON fabrics (code text_pattern_ops) WHERE stock > 0;
