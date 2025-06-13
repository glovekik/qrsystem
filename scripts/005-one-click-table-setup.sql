-- One-click table creation - just run this!
CREATE TABLE deleted_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  original_user_id uuid NOT NULL,
  user_data jsonb NOT NULL,
  deleted_at timestamptz DEFAULT now() NOT NULL,
  deleted_by varchar,
  deletion_reason text,
  had_dispatch_records boolean DEFAULT false NOT NULL,
  dispatch_records_data jsonb DEFAULT '[]'::jsonb NOT NULL
);

ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON deleted_users FOR ALL USING (true);

-- Verify it worked
SELECT 'Table created successfully! 🎉' as result;
