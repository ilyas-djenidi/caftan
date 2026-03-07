-- Create the reviews table for customer feedback
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to reviews
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
CREATE POLICY "Allow public read access to reviews"
  ON public.reviews FOR SELECT
  USING (true);

-- Allow public insert access to reviews (anyone can leave a review)
DROP POLICY IF EXISTS "Allow public insert access to reviews" ON public.reviews;
CREATE POLICY "Allow public insert access to reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);
