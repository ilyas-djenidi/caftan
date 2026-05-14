-- ================================================
-- CAFTAN PROJECT - FULL SCHEMA FOR NEW PROJECT
-- Run this in the NEW project's SQL Editor
-- ================================================

-- ENUMS
CREATE TYPE public.message_subject AS ENUM ('General Inquiry','Order Issue','Product Question','Return Request','Other');
CREATE TYPE public.message_status AS ENUM ('unread','read','replied');
CREATE TYPE public.review_status AS ENUM ('pending','approved','rejected');

-- PRODUCTS
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name_fr text NOT NULL,
  name_ar text,
  category text,
  subcategory text,
  description_fr text,
  description_ar text,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  on_sale boolean NOT NULL DEFAULT false,
  tissu text,
  featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  in_stock boolean NOT NULL DEFAULT true,
  stock_count integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- PRODUCT IMAGES
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT product_images_pkey PRIMARY KEY (id)
);

-- PRODUCT ATTRIBUTES
CREATE TABLE public.product_attributes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  type text,
  value text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT product_attributes_pkey PRIMARY KEY (id)
);

-- PACKS
CREATE TABLE public.packs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_fr text NOT NULL,
  name_ar text,
  description_fr text,
  description_ar text,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  is_active boolean DEFAULT true,
  is_sold_out boolean DEFAULT false,
  savings numeric,
  image_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT packs_pkey PRIMARY KEY (id)
);

-- PACK ITEMS
CREATE TABLE public.pack_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pack_id uuid REFERENCES public.packs(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  CONSTRAINT pack_items_pkey PRIMARY KEY (id)
);

-- ORDERS
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text,
  user_id uuid,
  customer_name text,
  customer_phone text,
  first_name text,
  last_name text,
  phone text,
  wilaya text,
  commune text,
  address text,
  shipping_address text,
  notes text,
  total_price numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  guepex_tracking text,
  guepex_tracking_id text,
  guepex_status text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid,
  pack_id uuid,
  product_name text,
  product_image text,
  quantity integer NOT NULL DEFAULT 1,
  size text,
  color text,
  price_at_purchase numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id)
);

-- MESSAGES
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject public.message_subject DEFAULT 'General Inquiry',
  message text NOT NULL,
  status public.message_status DEFAULT 'unread',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);

-- REVIEWS
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  status public.review_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id)
);

-- HERO BANNERS
CREATE TABLE public.hero_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_part1 text,
  title_accent text,
  title_part2 text,
  subtitle text,
  cta_text text,
  image_url text,
  is_active boolean DEFAULT true,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT hero_banners_pkey PRIMARY KEY (id)
);

-- SITE SETTINGS
CREATE TABLE public.site_settings (
  key varchar NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);

-- PROMO CODES
CREATE TABLE public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text DEFAULT 'percentage',
  value numeric NOT NULL DEFAULT 0,
  min_order numeric DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT promo_codes_pkey PRIMARY KEY (id)
);

-- SHIPPING RATES
CREATE TABLE public.shipping_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wilaya text NOT NULL,
  home_price numeric DEFAULT 0,
  desk_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT shipping_rates_pkey PRIMARY KEY (id)
);

-- SHIPMENTS
CREATE TABLE public.shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number text,
  status text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT shipments_pkey PRIMARY KEY (id)
);

-- ================================================
-- RLS POLICIES (open - for admin app)
-- ================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_products" ON public.products FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_product_images" ON public.product_images FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_product_attributes" ON public.product_attributes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_packs" ON public.packs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pack_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_pack_items" ON public.pack_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_hero_banners" ON public.hero_banners FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_promo_codes" ON public.promo_codes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_shipping_rates" ON public.shipping_rates FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_shipments" ON public.shipments FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- STORAGE BUCKET
-- ================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('caftan-images', 'caftan-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete" ON storage.objects;

CREATE POLICY "storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'caftan-images');
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'caftan-images');
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE USING (bucket_id = 'caftan-images');
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE USING (bucket_id = 'caftan-images');

-- DONE!
SELECT 'Schema created successfully!' as result;
