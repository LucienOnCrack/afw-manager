-- Add catalog schema to PostgREST exposed schemas
-- Run this in your Supabase SQL Editor

-- Expose the catalog schema to PostgREST
NOTIFY pgrst, 'reload schema';

-- Grant usage on catalog schema
GRANT USAGE ON SCHEMA catalog TO anon, authenticated, service_role;

-- Grant SELECT on all tables in catalog schema
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA catalog TO service_role;

-- Grant usage and select on all sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA catalog TO service_role;

-- Make these grants apply to future tables too
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog 
  GRANT SELECT ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA catalog 
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA catalog 
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- You'll also need to add "catalog" to the exposed schemas in your Supabase dashboard:
-- Settings -> API -> Schema -> Add "catalog" to the list
