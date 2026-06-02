-- setup.sql
-- Master setup file for Leave Management System (Sicerdas) Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Authentication Log)
-- Used for logging auto-created logins before an Admin links them to an official Employee account.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))
);

-- 2. Employees Table
-- The single source of truth for official employee data.
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  start_date DATE,
  position TEXT,
  unit TEXT,
  nip TEXT UNIQUE,
  phone_number TEXT,
  is_superior BOOLEAN DEFAULT false,
  auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_password_enabled BOOLEAN DEFAULT false,
  UNIQUE(auth_id)
);

-- 3. Cuti Table (Leave Requests)
CREATE TABLE IF NOT EXISTS cuti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Tahunan', 'Sakit', 'Melahirkan', 'Penting', 'Besar', 'LuarTanggungan')),
  dates DATE[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acc', 'ditolak')),
  note TEXT,
  address TEXT,
  recipient_type TEXT,
  atasan_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  pejabat_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  attachment_url TEXT,
  is_atasan_approved BOOLEAN DEFAULT false,
  is_pejabat_approved BOOLEAN DEFAULT false
);
-- ==========================================
-- RUN THESE MIGRATIONS TO UPDATE EXISTING DB
-- ==========================================
-- ALTER TABLE cuti DROP CONSTRAINT cuti_category_check;
-- ALTER TABLE cuti ADD CONSTRAINT cuti_category_check CHECK (category IN ('Tahunan', 'Sakit', 'Melahirkan', 'Penting', 'Besar', 'LuarTanggungan'));
-- ALTER TABLE cuti ADD COLUMN IF NOT EXISTS address TEXT;
-- ALTER TABLE cuti ADD COLUMN IF NOT EXISTS recipient_type TEXT;
-- ALTER TABLE cuti ADD COLUMN IF NOT EXISTS atasan_id UUID REFERENCES employees(id) ON DELETE SET NULL;
-- ALTER TABLE cuti ADD COLUMN IF NOT EXISTS attachment_url TEXT;
-- ALTER TABLE cuti ADD COLUMN IF NOT EXISTS is_atasan_approved BOOLEAN DEFAULT false;
-- ALTER TABLE cuti ADD COLUMN IF NOT EXISTS is_pejabat_approved BOOLEAN DEFAULT false;
-- ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_password_enabled BOOLEAN DEFAULT false;

-- ==========================================
-- STORAGE BUCKETS (Run in SQL Editor if needed)
-- ==========================================
-- insert into storage.buckets (id, name, public) values ('leave_attachments', 'leave_attachments', true) on conflict do nothing;
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'leave_attachments' );
-- CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'leave_attachments' AND auth.role() = 'authenticated' );

