-- SQL Script to setup Server Status Monitoring with pg_cron
-- Run this script in the Supabase SQL Editor

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
