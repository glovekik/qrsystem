-- Create users table to store all user information
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('VIP', 'VVIP', 'Core', 'volunteer', 'participants')),
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('college_student', 'college_faculty', 'other')),
    college_id VARCHAR(100),
    qr_code_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dispatch_log table to track dispatch status
CREATE TABLE IF NOT EXISTS dispatch_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dispatched_by VARCHAR(255),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_qr_code ON users(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_dispatch_user_id ON dispatch_log(user_id);
