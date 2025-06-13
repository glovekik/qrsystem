-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on dispatch_log" ON dispatch_log;
DROP POLICY IF EXISTS "Allow all operations on deleted_users" ON deleted_users;

-- Create policies for users table
CREATE POLICY "Allow all operations on users" 
ON users 
FOR ALL 
USING (true);

-- Create policies for dispatch_log table
CREATE POLICY "Allow all operations on dispatch_log" 
ON dispatch_log 
FOR ALL 
USING (true);

-- Create policies for deleted_users table
CREATE POLICY "Allow all operations on deleted_users" 
ON deleted_users 
FOR ALL 
USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'dispatch_log', 'deleted_users');
