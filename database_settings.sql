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

-----------------------------------------------------------
-- STORAGE PERMISSIONS (For Seeding / Development)
-----------------------------------------------------------

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('caftan-images', 'caftan-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public uploads (INSERT)
DROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects;
CREATE POLICY "Allow Public Uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'caftan-images');

-- 3. Allow public updates (UPDATE)
DROP POLICY IF EXISTS "Allow Public Update" ON storage.objects;
CREATE POLICY "Allow Public Update"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'caftan-images');

-- 4. Allow public deletions (DELETE)
DROP POLICY IF EXISTS "Allow Public Delete" ON storage.objects;
CREATE POLICY "Allow Public Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'caftan-images');

-- 5. Allow public viewing (SELECT) - technically default for public buckets but good to be explicit
DROP POLICY IF EXISTS "Allow Public Select" ON storage.objects;
CREATE POLICY "Allow Public Select"
ON storage.objects FOR SELECT
USING (bucket_id = 'caftan-images');

-----------------------------------------------------------
-- PRODUCT DATA CLEANUP (As requested by user)
-----------------------------------------------------------

-- This will clear all products. Note: This might fail if you have orders linked to these products.
-- If it fails, you may need to delete from 'order_items' first.
TRUNCATE TABLE public.products RESTART IDENTITY CASCADE;

-----------------------------------------------------------
-- PRODUCT RLS POLICIES (Allow Seeding)
-----------------------------------------------------------

-- 1. Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for products" ON public.products;
CREATE POLICY "Allow all for products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- 2. Product Images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for product_images" ON public.product_images;
CREATE POLICY "Allow all for product_images" ON public.product_images FOR ALL USING (true) WITH CHECK (true);

-- 3. Product Attributes
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for product_attributes" ON public.product_attributes;
CREATE POLICY "Allow all for product_attributes" ON public.product_attributes FOR ALL USING (true) WITH CHECK (true);
