-- Allow anyone (including anon) to manage shipments
-- This matches the existing policies for products and orders in this project
-- Run this in the Supabase SQL Editor

DROP POLICY IF EXISTS "Allow all for authenticated users" ON shipments;
DROP POLICY IF EXISTS "Allow all for shipments" ON shipments;

CREATE POLICY "Allow all for shipments" 
ON shipments FOR ALL 
USING (true) 
WITH CHECK (true);

-- Also fix shipping_rates for consistency if needed (though optional)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON shipping_rates;
DROP POLICY IF EXISTS "Allow all for shipping_rates" ON shipping_rates;
CREATE POLICY "Allow all for shipping_rates" ON shipping_rates FOR ALL USING (true) WITH CHECK (true);
