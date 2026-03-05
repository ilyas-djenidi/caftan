-- This script creates the missing 'site_settings' table for tracking visitor counts and storing hero configurations.
CREATE TABLE IF NOT EXISTS public.site_settings (
  key character varying NOT NULL,
  value jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);

-- Turn on row level security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid existence errors
DROP POLICY IF EXISTS "Allow public read access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow anon insert" ON public.site_settings;
DROP POLICY IF EXISTS "Allow anon update" ON public.site_settings;
DROP POLICY IF EXISTS "Allow authenticated all" ON public.site_settings;

-- Allow public read access (for anon users reading hero content and visitor tracker)
CREATE POLICY "Allow public read access to site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Allow public inserts (required for visitor tracker to insert first time)
CREATE POLICY "Allow anon insert"
  ON public.site_settings FOR INSERT
  WITH CHECK (true);

-- Allow public updates (required for visitor tracker to update visitor count)
CREATE POLICY "Allow anon update"
  ON public.site_settings FOR UPDATE
  USING (true);

-- Ensure a default visitor_count exists if not already present
INSERT INTO public.site_settings (key, value)
VALUES ('visitor_count', '{"count": 0}')
ON CONFLICT (key) DO NOTHING;
