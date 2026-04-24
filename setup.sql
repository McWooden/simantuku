-- setup.sql
-- Master setup file for Leave Management System (Simantuku) Supabase Schema

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
  auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(auth_id)
);

-- 3. Cuti Table (Leave Requests)
CREATE TABLE IF NOT EXISTS cuti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Tahunan', 'Sakit', 'Melahirkan', 'Penting')),
  dates DATE[] NOT NULL, -- Array of specific dates requested
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acc', 'ditolak')),
  note TEXT
);

-- 4. Leave Quota Table
-- Advanced bucket system tracking annual limits and carryover for employees.
CREATE TABLE IF NOT EXISTS leave_quota (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INT NOT NULL,
    total_days INT NOT NULL DEFAULT 12,
    used_days INT NOT NULL DEFAULT 0,
    is_capped BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    UNIQUE(employee_id, year)
);

-- 5. Leave Quota Breakdown Table
-- Logs the exact deductions across buckets for a single leave request (powers safe refunds).
CREATE TABLE IF NOT EXISTS leave_quota_breakdown (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_id UUID NOT NULL REFERENCES cuti(id) ON DELETE CASCADE,
    quota_year INT NOT NULL,
    days_deducted INT NOT NULL
);
