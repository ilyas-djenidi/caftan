-- ==============================================
-- DATABASE RESET SCRIPT (FOR CLIENT HANDOFF)
-- ==============================================

-- 1. CLEAR TRANSACTIONAL DATA (Customer data, Orders, Messages, Reviews)
-- This is highly recommended before handing over to a client.
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE product_reviews CASCADE;
DELETE FROM site_settings WHERE key = 'visitor_count';

-- ==============================================
-- 2. CLEAR CATALOG DATA (Products, Promos, Packs)
-- This safely removes all mock products and their variants, packs, and promos.
-- ==============================================

TRUNCATE TABLE product_attributes CASCADE;
TRUNCATE TABLE product_images CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE packs CASCADE;
TRUNCATE TABLE promo_codes CASCADE;

-- NOTICE: We are LEAVING the categories (Nos Collections) and hero_slides (Hero Section) intact as requested!
