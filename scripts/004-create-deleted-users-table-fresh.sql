-- Create the deleted_users table from scratch
CREATE TABLE IF NOT EXISTS public.deleted_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_user_id UUID NOT NULL,
    user_data JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_by VARCHAR(255),
    deletion_reason TEXT,
    had_dispatch_records BOOLEAN DEFAULT FALSE,
    dispatch_records_data JSONB DEFAULT '[]'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deleted_users_deleted_at ON public.deleted_users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_users_original_id ON public.deleted_users(original_user_id);

-- Enable RLS
ALTER TABLE public.deleted_users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on deleted_users" 
ON public.deleted_users 
FOR ALL 
USING (true);

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'deleted_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
