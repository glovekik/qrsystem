-- Simple fix: Drop the old constraint and add a new one with 'college'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that includes 'college'
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('VIP', 'VVIP', 'Core', 'volunteer', 'participants', 'college'));

-- Test that it works
SELECT 'Role constraint updated successfully!' as result;
