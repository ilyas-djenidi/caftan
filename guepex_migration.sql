-- Guepex Delivery Integration — Orders Table Migration v2
-- Run in Supabase SQL Editor → SQL Editor → New Query
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guepex_tracking  text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guepex_status    text DEFAULT 'non_expedie';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type    text DEFAULT 'home';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_wilaya  text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_commune text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee     integer DEFAULT 0;
