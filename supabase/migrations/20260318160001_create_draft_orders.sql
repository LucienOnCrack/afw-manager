CREATE TABLE IF NOT EXISTS public.draft_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  wizard_state  JSONB NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  gocreate_id   INTEGER,
  order_number  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_draft_orders_created_by ON public.draft_orders (created_by);
CREATE INDEX IF NOT EXISTS idx_draft_orders_status ON public.draft_orders (status);
CREATE INDEX IF NOT EXISTS idx_draft_orders_updated_at ON public.draft_orders (updated_at DESC);

ALTER TABLE public.draft_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts"
  ON public.draft_orders FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own drafts"
  ON public.draft_orders FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own drafts"
  ON public.draft_orders FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own drafts"
  ON public.draft_orders FOR DELETE
  USING (auth.uid() = created_by);

CREATE OR REPLACE FUNCTION public.set_draft_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_draft_orders_updated_at
  BEFORE UPDATE ON public.draft_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_draft_orders_updated_at();
