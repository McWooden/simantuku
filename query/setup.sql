-- setup.sql
-- Master setup file for Leave Management System (Sicerdas) Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



-- 2. Employees Table
-- The single source of truth for official employee data.
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
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
  is_pejabat_approved BOOLEAN DEFAULT false,
  request_date DATE DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_cuti_created_at ON cuti(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cuti_employee_id ON cuti(employee_id);
CREATE INDEX IF NOT EXISTS idx_cuti_atasan_id ON cuti(atasan_id);
CREATE INDEX IF NOT EXISTS idx_cuti_pejabat_id ON cuti(pejabat_id);
CREATE INDEX IF NOT EXISTS idx_cuti_status ON cuti(status);

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
-- ALTER TABLE cuti ADD COLUMN IF NOT EXISTS request_date DATE DEFAULT CURRENT_DATE;
-- ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_password_enabled BOOLEAN DEFAULT false;

-- ==========================================
-- STORAGE BUCKETS (Run in SQL Editor if needed)
-- ==========================================
-- insert into storage.buckets (id, name, public) values ('leave_attachments', 'leave_attachments', true) on conflict do nothing;
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'leave_attachments' );
-- CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'leave_attachments' AND auth.role() = 'authenticated' );

-- ==========================================
-- SERVER STATUS MONITORING WITH pg_cron
-- ==========================================

-- 1. Create table for server configuration / current state
CREATE TABLE IF NOT EXISTS public.server_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Seed initial current status if not exists
INSERT INTO public.server_config (key, value)
VALUES ('current_status', 'operational')
ON CONFLICT (key) DO NOTHING;

-- 2. Create table for server status logs (historical heartbeats)
CREATE TABLE IF NOT EXISTS public.server_status_logs (
    id SERIAL PRIMARY KEY,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('operational', 'maintenance', 'degraded'))
);

-- 3. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 4. Schedule a cron job to log status every hour
-- We schedule it every hour. If the server is offline/hibernating, no records will be inserted for those hours.
-- First unschedule to prevent duplicate jobs if rerun.
DO $$
BEGIN
    PERFORM cron.unschedule('server-heartbeat-check');
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if job doesn't exist
END $$;

SELECT cron.schedule(
    'server-heartbeat-check',
    '0 * * * *', -- Every hour (at minute 0)
    $$
    INSERT INTO public.server_status_logs (status)
    SELECT COALESCE(
        (SELECT value FROM public.server_config WHERE key = 'current_status'),
        'operational'
    );
    $$
);


-- ==========================================
-- MIGRATION FOR QUOTA CHAINING AND SNAPSHOTS
-- ==========================================

-- 1. Add fields to cuti table
ALTER TABLE public.cuti ADD COLUMN IF NOT EXISTS parent_cuti_id UUID REFERENCES public.cuti(id) ON DELETE SET NULL;
ALTER TABLE public.cuti ADD COLUMN IF NOT EXISTS n_reduced INTEGER DEFAULT 0;
ALTER TABLE public.cuti ADD COLUMN IF NOT EXISTS n1_reduced INTEGER DEFAULT 0;
ALTER TABLE public.cuti ADD COLUMN IF NOT EXISTS n2_reduced INTEGER DEFAULT 0;
ALTER TABLE public.cuti ADD COLUMN IF NOT EXISTS n_balance INTEGER;
ALTER TABLE public.cuti ADD COLUMN IF NOT EXISTS n1_balance INTEGER;
ALTER TABLE public.cuti ADD COLUMN IF NOT EXISTS n2_balance INTEGER;

-- 2. Stored Procedure for Pessimistic Locking & Chaining Request Approval
CREATE OR REPLACE FUNCTION public.approve_leave_request(p_leave_id UUID)
RETURNS VOID AS $$
DECLARE
  v_emp_id UUID;
  v_category TEXT;
  v_dates DATE[];
  v_status TEXT;
  v_n_reduced INTEGER;
  v_n1_reduced INTEGER;
  v_n2_reduced INTEGER;
  v_start_date DATE;
  v_start_year INTEGER;
  v_current_year INTEGER;
  v_parent_id UUID;
  v_parent_n INTEGER;
  v_parent_n1 INTEGER;
  v_parent_n2 INTEGER;
  v_n INTEGER;
  v_n1 INTEGER;
  v_n2 INTEGER;
  v_new_n INTEGER;
  v_new_n1 INTEGER;
  v_new_n2 INTEGER;
BEGIN
  -- 1. Fetch leave request details
  SELECT employee_id, category, dates, status, n_reduced, n1_reduced, n2_reduced
  FROM public.cuti
  WHERE id = p_leave_id
  INTO v_emp_id, v_category, v_dates, v_status, v_n_reduced, v_n1_reduced, v_n2_reduced;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave request not found';
  END IF;

  -- If already approved, do nothing (idempotency check)
  IF v_status = 'acc' THEN
    RETURN;
  END IF;

  -- 2. Pessimistic lock on employee row to serialize calculations for this employee
  PERFORM id FROM public.employees WHERE id = v_emp_id FOR UPDATE;

  -- Fetch employee start date to calculate tenure
  SELECT start_date FROM public.employees WHERE id = v_emp_id INTO v_start_date;
  v_start_year := COALESCE(EXTRACT(YEAR FROM v_start_date), EXTRACT(YEAR FROM NOW()));
  v_current_year := EXTRACT(YEAR FROM v_dates[1]);

  -- 3. Find latest approved parent request in the chain
  SELECT id, n_balance, n1_balance, n2_balance
  FROM public.cuti
  WHERE employee_id = v_emp_id AND status = 'acc'
  ORDER BY created_at DESC, id DESC
  LIMIT 1
  INTO v_parent_id, v_parent_n, v_parent_n1, v_parent_n2;

  -- 4. Calculate starting balances
  IF v_parent_id IS NOT NULL THEN
    v_n := v_parent_n;
    v_n1 := v_parent_n1;
    v_n2 := v_parent_n2;
  ELSE
    -- Default initial balance
    v_n := 12;
    v_n1 := CASE WHEN v_current_year - 1 >= v_start_year THEN 6 ELSE 0 END;
    v_n2 := CASE WHEN v_current_year - 2 >= v_start_year THEN 6 ELSE 0 END;
  END IF;

  -- 5. Calculate new snapshot balances
  IF v_category = 'Tahunan' THEN
    v_new_n := v_n - COALESCE(v_n_reduced, 0);
    v_new_n1 := v_n1 - COALESCE(v_n1_reduced, 0);
    v_new_n2 := v_n2 - COALESCE(v_n2_reduced, 0);

    IF v_new_n < 0 OR v_new_n1 < 0 OR v_new_n2 < 0 THEN
      RAISE EXCEPTION 'Insufficient leave quota for this allocation: N=%, N1=%, N2=%', v_new_n, v_new_n1, v_new_n2;
    END IF;
  ELSE
    v_n_reduced := 0;
    v_n1_reduced := 0;
    v_n2_reduced := 0;
    v_new_n := v_n;
    v_new_n1 := v_n1;
    v_new_n2 := v_n2;
  END IF;

  -- 6. Update the record to 'acc', link parent, and save balances
  UPDATE public.cuti
  SET status = 'acc',
      is_atasan_approved = true,
      is_pejabat_approved = true,
      parent_cuti_id = v_parent_id,
      n_reduced = v_n_reduced,
      n1_reduced = v_n1_reduced,
      n2_reduced = v_n2_reduced,
      n_balance = v_new_n,
      n1_balance = v_new_n1,
      n2_balance = v_new_n2
  WHERE id = p_leave_id;
END;
$$ LANGUAGE plpgsql;

-- 3. PostgreSQL Trigger Function and AFTER DELETE trigger for chain healing
CREATE OR REPLACE FUNCTION public.heal_cuti_chain_after_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_child_id UUID;
  v_current_id UUID;
  v_parent_id UUID;
  v_emp_id UUID;
  v_start_date DATE;
  v_start_year INTEGER;
  v_current_year INTEGER;
  v_category TEXT;
  v_dates DATE[];
  v_n_reduced INTEGER;
  v_n1_reduced INTEGER;
  v_n2_reduced INTEGER;
  v_parent_n INTEGER;
  v_parent_n1 INTEGER;
  v_parent_n2 INTEGER;
  v_new_n INTEGER;
  v_new_n1 INTEGER;
  v_new_n2 INTEGER;
BEGIN
  -- Only heal the chain if the deleted request was approved
  IF OLD.status <> 'acc' THEN
    RETURN OLD;
  END IF;

  v_emp_id := OLD.employee_id;
  v_parent_id := OLD.parent_cuti_id;

  -- Find the child record pointing to the deleted record
  SELECT id FROM public.cuti WHERE parent_cuti_id = OLD.id INTO v_child_id;

  IF v_child_id IS NOT NULL THEN
    -- Link the child to the deleted record's parent
    UPDATE public.cuti SET parent_cuti_id = v_parent_id WHERE id = v_child_id;

    -- Recalculate balances downstream starting from the child
    v_current_id := v_child_id;
    WHILE v_current_id IS NOT NULL LOOP
      -- Fetch current record details
      SELECT category, dates, n_reduced, n1_reduced, n2_reduced, parent_cuti_id
      FROM public.cuti
      WHERE id = v_current_id
      INTO v_category, v_dates, v_n_reduced, v_n1_reduced, v_n2_reduced, v_parent_id;

      -- Fetch parent balances
      IF v_parent_id IS NOT NULL THEN
        SELECT n_balance, n1_balance, n2_balance
        FROM public.cuti
        WHERE id = v_parent_id
        INTO v_parent_n, v_parent_n1, v_parent_n2;
      ELSE
        -- Default initial calculation if parent is null
        SELECT start_date FROM public.employees WHERE id = v_emp_id INTO v_start_date;
        v_start_year := COALESCE(EXTRACT(YEAR FROM v_start_date), EXTRACT(YEAR FROM NOW()));
        v_current_year := EXTRACT(YEAR FROM v_dates[1]);

        v_parent_n := 12;
        v_parent_n1 := CASE WHEN v_current_year - 1 >= v_start_year THEN 6 ELSE 0 END;
        v_parent_n2 := CASE WHEN v_current_year - 2 >= v_start_year THEN 6 ELSE 0 END;
      END IF;

      -- Calculate new balances
      IF v_category = 'Tahunan' THEN
        v_new_n := v_parent_n - COALESCE(v_n_reduced, 0);
        v_new_n1 := v_parent_n1 - COALESCE(v_n1_reduced, 0);
        v_new_n2 := v_parent_n2 - COALESCE(v_n2_reduced, 0);
      ELSE
        v_new_n := v_parent_n;
        v_new_n1 := v_parent_n1;
        v_new_n2 := v_parent_n2;
      END IF;

      -- Update the current record's balances
      UPDATE public.cuti
      SET n_balance = v_new_n,
          n1_balance = v_new_n1,
          n2_balance = v_new_n2
      WHERE id = v_current_id;

      -- Find next child downstream
      SELECT id FROM public.cuti WHERE parent_cuti_id = v_current_id INTO v_current_id;
    END LOOP;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Bind trigger
CREATE OR REPLACE TRIGGER trg_heal_cuti_chain
AFTER DELETE ON public.cuti
FOR EACH ROW
EXECUTE FUNCTION public.heal_cuti_chain_after_delete();

-- Enable Supabase Realtime for cuti table updates
-- ALTER PUBLICATION supabase_realtime ADD TABLE cuti;

