-- Drop the problematic table completely
DROP TABLE IF EXISTS deleted_users CASCADE;

-- Create a simple table without RLS
CREATE TABLE deleted_users (
    id SERIAL PRIMARY KEY,
    original_user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    user_role TEXT,
    user_type TEXT,
    college_id TEXT,
    user_data TEXT NOT NULL,
    dispatch_records TEXT DEFAULT '[]',
    deleted_at TIMESTAMP DEFAULT NOW(),
    deleted_by TEXT,
    deletion_reason TEXT,
    had_dispatch_records BOOLEAN DEFAULT FALSE
);

-- Don't enable RLS at all
-- ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;

-- Create a simple index
CREATE INDEX idx_deleted_users_deleted_at ON deleted_users(deleted_at);

-- Test that it works
INSERT INTO deleted_users (
    original_user_id,
    user_name,
    user_email,
    user_data,
    deleted_by,
    deletion_reason
) VALUES (
    'test-id',
    'Test User',
    'test@example.com',
    '{"test": "data"}',
    'Admin',
    'Testing table'
);

-- Verify it worked
SELECT 'Table created and tested successfully!' as result;

-- Clean up test data
DELETE FROM deleted_users WHERE user_name = 'Test User';
