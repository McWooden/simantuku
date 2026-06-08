-- =========================================================================
-- HOW TO MANAGE ROLES (manager, admin, user) IN SUPABASE
-- =========================================================================
-- Execute these SQL queries in your Supabase Dashboard SQL Editor.

-- WHY ONLY THE "employees" TABLE?
-- The application queries the "employees" table for session authorizations, 
-- permissions, sidebar/navbar visibility, and page redirection. Changing 
-- a role here controls their actual active permissions.

-- STEP 1: Update Check Constraints
-- In PostgreSQL, check constraints restrict the allowed values for the "role" column. 
-- By default, it only allows ('admin', 'user'). We must drop and recreate them to include 'manager'.

-- 1. Drop existing CHECK constraint on employees table
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;

-- 2. Re-create CHECK constraint including the 'manager' role
ALTER TABLE employees ADD CONSTRAINT employees_role_check CHECK (role IN ('admin', 'user', 'manager'));


-- STEP 2: Upgrade Target Employee's Role to 'manager'
-- Replace 'MASUKKAN_NIP_PEGAWAI' with the actual NIP (Nomor Induk Pegawai) of the user.

UPDATE employees 
SET role = 'manager' 
WHERE nip = 'MASUKKAN_NIP_PEGAWAI';


-- STEP 3: Downgrade or Change Employee's Role to 'admin' or 'user'
-- Replace 'MASUKKAN_NIP_PEGAWAI' with the actual NIP (Nomor Induk Pegawai) of the user.

-- Option A: Set role to 'admin'
UPDATE employees 
SET role = 'admin' 
WHERE nip = 'MASUKKAN_NIP_PEGAWAI';

-- Option B: Set role to 'user'
UPDATE employees 
SET role = 'user' 
WHERE nip = 'MASUKKAN_NIP_PEGAWAI';
