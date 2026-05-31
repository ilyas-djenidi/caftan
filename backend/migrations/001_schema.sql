-- ============================================================
--  CAFTAN DB SCHEMA  —  PostgreSQL 14+
--  Enhanced foreign keys, constraints, and performance indexes
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fuzzy text search

-- ─────────────────────────────────────────
-- ADMINS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT         UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  name          TEXT,
  role          TEXT         NOT NULL DEFAULT 'admin'
                               CHECK (role IN ('admin', 'superadmin')),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr        TEXT          NOT NULL,
  name_ar        TEXT,
  description_fr TEXT,
  description_ar TEXT,
  price          NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10,2)           CHECK (original_price >= 0),
  on_sale        BOOLEAN       NOT NULL DEFAULT FALSE,
  category       TEXT          NOT NULL
                                 CHECK (category IN ('caftans', 'sacs', 'accessoires')),
  subcategory    TEXT,
  tissu          TEXT,
  stock_count    INTEGER       NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  in_stock       BOOLEAN       NOT NULL DEFAULT TRUE,
  is_visible     BOOLEAN       NOT NULL DEFAULT TRUE,
  featured       BOOLEAN       NOT NULL DEFAULT FALSE,
  is_new         BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_sale_price CHECK (
    on_sale = FALSE OR (original_price IS NOT NULL AND original_price > price)
  )
);

-- Auto-sync in_stock from stock_count
CREATE OR REPLACE FUNCTION sync_in_stock() RETURNS TRIGGER AS $$
BEGIN
  NEW.in_stock := (NEW.stock_count > 0);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_in_stock ON products;
CREATE TRIGGER trg_sync_in_stock
  BEFORE INSERT OR UPDATE OF stock_count ON products
  FOR EACH ROW EXECUTE FUNCTION sync_in_stock();

-- ─────────────────────────────────────────
-- PRODUCT IMAGES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID         NOT NULL
                               REFERENCES products(id) ON DELETE CASCADE,
  image_url     TEXT         NOT NULL,
  is_primary    BOOLEAN      NOT NULL DEFAULT FALSE,
  display_order INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Enforce only one primary image per product
CREATE UNIQUE INDEX IF NOT EXISTS uidx_product_images_primary
  ON product_images(product_id) WHERE is_primary = TRUE;

-- ─────────────────────────────────────────
-- PRODUCT ATTRIBUTES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_attributes (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID  NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type       TEXT  NOT NULL,
  value      TEXT  NOT NULL
);

-- ─────────────────────────────────────────
-- PACKS (bundles)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packs (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr        TEXT          NOT NULL,
  name_ar        TEXT,
  description_fr TEXT,
  description_ar TEXT,
  price          NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10,2)           CHECK (original_price >= 0),
  image_url      TEXT,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  is_sold_out    BOOLEAN       NOT NULL DEFAULT FALSE,
  savings        NUMERIC(10,2),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PACK ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pack_items (
  id         UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id    UUID     NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  product_id UUID     NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INTEGER  NOT NULL DEFAULT 1 CHECK (quantity > 0),

  UNIQUE(pack_id, product_id)
);

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT          UNIQUE NOT NULL,
  customer_name    TEXT,
  first_name       TEXT,
  last_name        TEXT,
  phone            TEXT          NOT NULL,
  wilaya           TEXT          NOT NULL,
  commune          TEXT          NOT NULL,
  address          TEXT,
  shipping_address TEXT,
  notes            TEXT,
  total_price      NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  delivery_fee     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  delivery_type    TEXT          NOT NULL DEFAULT 'home'
                                   CHECK (delivery_type IN ('home', 'stopdesk')),
  promo_code       TEXT,
  discount_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  status           TEXT          NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  guepex_tracking    TEXT,
  guepex_tracking_id TEXT,
  guepex_status      TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_order_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_order_timestamp();

-- ─────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id         UUID          REFERENCES products(id) ON DELETE SET NULL,
  pack_id            UUID          REFERENCES packs(id)    ON DELETE SET NULL,
  product_name       TEXT          NOT NULL,
  product_image      TEXT,
  quantity           INTEGER       NOT NULL CHECK (quantity > 0),
  size               TEXT,
  color              TEXT,
  price_at_purchase  NUMERIC(10,2) NOT NULL CHECK (price_at_purchase >= 0),
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_item_ref CHECK (product_id IS NOT NULL OR pack_id IS NOT NULL)
);

-- ─────────────────────────────────────────
-- PROMO CODES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT          UNIQUE NOT NULL,
  type       TEXT          NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value      NUMERIC(10,2) NOT NULL CHECK (value > 0),
  min_order  NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses   INTEGER,
  used_count INTEGER       NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active  BOOLEAN       NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_pct_max100 CHECK (type <> 'percentage' OR value <= 100)
);

-- ─────────────────────────────────────────
-- MESSAGES  (contact form)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT         NOT NULL,
  email     TEXT,
  phone     TEXT,
  subject   TEXT,
  message   TEXT         NOT NULL,
  status    TEXT         NOT NULL DEFAULT 'unread'
                           CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author_name TEXT         NOT NULL,
  rating      SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content     TEXT,
  status      TEXT         NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- HERO BANNERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hero_banners (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title_part1   TEXT,
  title_accent  TEXT,
  title_part2   TEXT,
  subtitle      TEXT,
  cta_text      TEXT,
  image_url     TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order    INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SHIPPING RATES  (per wilaya)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipping_rates (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  wilaya          TEXT          UNIQUE NOT NULL,
  zone            SMALLINT      NOT NULL DEFAULT 0,
  tarif_domicile  NUMERIC(10,2) NOT NULL DEFAULT 0,
  tarif_stopdesk  NUMERIC(10,2) NOT NULL DEFAULT 0,
  tarif_retour    NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SHIPMENTS  (Guepex parcels cache)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking          TEXT         UNIQUE NOT NULL,
  order_id          UUID         REFERENCES orders(id) ON DELETE SET NULL,
  order_number      TEXT,
  status            TEXT,
  wilaya            TEXT,
  ville             TEXT,
  destinataire_nom  TEXT,
  destinataire_phone TEXT,
  date_expedition   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SITE SETTINGS  (key-value store)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT         PRIMARY KEY,
  value      JSONB,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
--  PERFORMANCE INDEXES
-- ──────────────────────────────────────────────────────────

-- Products
CREATE INDEX IF NOT EXISTS idx_products_category          ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_visible           ON products(is_visible);
CREATE INDEX IF NOT EXISTS idx_products_featured          ON products(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_on_sale           ON products(on_sale)  WHERE on_sale  = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_cat_vis           ON products(category, is_visible);
CREATE INDEX IF NOT EXISTS idx_products_created_at        ON products(created_at DESC);
-- Full-text search index on French name + description
CREATE INDEX IF NOT EXISTS idx_products_fts ON products
  USING gin(to_tsvector('simple', name_fr || ' ' || COALESCE(name_ar, '') || ' ' || COALESCE(description_fr, '')));
-- Trigram index for ILIKE searches
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name_fr gin_trgm_ops);

-- Product images
CREATE INDEX IF NOT EXISTS idx_product_images_pid         ON product_images(product_id);

-- Product attributes
CREATE INDEX IF NOT EXISTS idx_product_attrs_pid          ON product_attributes(product_id);

-- Packs
CREATE INDEX IF NOT EXISTS idx_packs_active               ON packs(is_active);

-- Pack items
CREATE INDEX IF NOT EXISTS idx_pack_items_pack_id         ON pack_items(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_items_product_id      ON pack_items(product_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_status              ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at          ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number        ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_phone               ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_guepex_tracking     ON orders(guepex_tracking)
  WHERE guepex_tracking IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_guepex_status       ON orders(guepex_status)
  WHERE guepex_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status_created      ON orders(status, created_at DESC);

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id       ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id     ON order_items(product_id);

-- Promo codes
CREATE INDEX IF NOT EXISTS idx_promos_active              ON promo_codes(is_active, code);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_status            ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at        ON messages(created_at DESC);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id         ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status     ON reviews(product_id, status);

-- Hero banners
CREATE INDEX IF NOT EXISTS idx_hero_active_order          ON hero_banners(is_active, sort_order)
  WHERE is_active = TRUE;

-- Shipments
CREATE INDEX IF NOT EXISTS idx_shipments_order_id         ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking         ON shipments(tracking);
