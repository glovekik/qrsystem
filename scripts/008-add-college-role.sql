-- Update the users table to allow 'college' as a valid role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the updated constraint with 'college' included
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('VIP', 'VVIP', 'Core', 'volunteer', 'participants', 'college'));

-- Verify the constraint was updated
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';
