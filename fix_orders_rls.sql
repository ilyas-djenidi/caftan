-- ==========================================
-- FIX: Orders & Order Items RLS Policies
-- ==========================================
-- This script enables Row Level Security (RLS) policies 
-- to allow the website to create orders and the admin 
-- dashboard to manage them.

-- 1. Enable RLS on the tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing policies (optional but safe)
DROP POLICY IF EXISTS "Allow public insert to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow authenticated full access to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated full access to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow anon reading orders" ON public.orders;

-- 3. CUSTOMER POLICIES: Allow anyone (anon) to place an order
CREATE POLICY "Allow public insert to orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert to order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- 4. ADMIN POLICIES: Allow authenticated admins to see and manage everything
-- Note: If you use the anon key for the admin dash, we add "OR true" for SELECT for troubleshooting,
-- but usually 'authenticated' is the way to go.
CREATE POLICY "Allow authenticated full access to orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to order_items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. TEMPORARY: If your admin dashboard is using the ANON key, 
-- you need this policy to see the orders:
CREATE POLICY "Allow anon reading orders"
  ON public.orders FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon reading items"
  ON public.order_items FOR SELECT
  TO anon
  USING (true);

-- NOTICE: After running this, try placing a new order from your website.
