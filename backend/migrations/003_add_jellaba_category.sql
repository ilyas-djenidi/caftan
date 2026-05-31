-- Migration to add Jellaba category to products constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check CHECK (category IN ('caftans', 'sacs', 'accessoires', 'jellabas'));
