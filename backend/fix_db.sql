-- Add username column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users(username);

-- Add is_verified column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
