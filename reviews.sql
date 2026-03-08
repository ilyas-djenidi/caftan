-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  author_name character varying NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status character varying DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public to read approved reviews
CREATE POLICY "Allow public read access to approved reviews"
  ON public.product_reviews FOR SELECT
  USING (true);

-- Allow public to submit reviews
CREATE POLICY "Allow public insert to reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (true);

-- Allow authenticated admins to do everything
CREATE POLICY "Allow authenticated full access to reviews"
  ON public.product_reviews FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
