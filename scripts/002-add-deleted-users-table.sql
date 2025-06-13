-- Drop table if it exists to recreate with proper structure
DROP TABLE IF EXISTS deleted_users;

-- Create deleted_users table to track deleted user records
CREATE TABLE deleted_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_user_id UUID NOT NULL,
    user_data JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_by VARCHAR(255),
    deletion_reason TEXT,
    had_dispatch_records BOOLEAN DEFAULT FALSE,
    dispatch_records_data JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_deleted_users_deleted_at ON deleted_users(deleted_at);
CREATE INDEX idx_deleted_users_original_id ON deleted_users(original_user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on deleted_users" ON deleted_users
FOR ALL USING (true);
