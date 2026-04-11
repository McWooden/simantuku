-- Run this in your Supabase SQL Editor

-- 1. Create Employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(auth_id)
);

-- Note: We are keeping the profiles table as entirely separate just as a log,
-- but the single source of truth for the app is now "employees".

-- 2. Modify `cuti` table to use `employee_id`
-- Add the column
ALTER TABLE cuti ADD COLUMN employee_id UUID REFERENCES employees(id) ON DELETE CASCADE;

-- If you have existing data in cuti, you can manually map it or empty the table:
-- TRUNCATE TABLE cuti; 
-- Then we can drop the old userid constraint and column
-- ALTER TABLE cuti DROP COLUMN userid;

-- For now, if starting fresh:
ALTER TABLE cuti DROP CONSTRAINT IF EXISTS cuti_userid_fkey;
ALTER TABLE cuti DROP COLUMN IF EXISTS userid;

-- End of script
