-- ====================================================================
-- Royal Epic Commercial & Home Interiors
-- Migration: Customer Reviews Management with Demo vs Real Separation
-- Safe schema update with is_demo column and RLS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  name TEXT,
  review_message TEXT NOT NULL,
  profile_image_url TEXT,
  rating NUMERIC(2, 1) DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 5.0),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 1,
  is_demo BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safe column add if table already exists
ALTER TABLE public.customer_reviews ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customer_reviews_active_order 
ON public.customer_reviews (is_active, display_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_demo 
ON public.customer_reviews (is_demo);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_status 
ON public.customer_reviews (status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (public visitors) can view active approved reviews on the homepage
DROP POLICY IF EXISTS "Allow public read active reviews" ON public.customer_reviews;
CREATE POLICY "Allow public read active reviews"
ON public.customer_reviews
FOR SELECT
USING (is_active = true OR status = 'approved');

-- 2. Allow authenticated users / admins full management capabilities
DROP POLICY IF EXISTS "Allow authenticated full access to reviews" ON public.customer_reviews;
CREATE POLICY "Allow authenticated full access to reviews"
ON public.customer_reviews
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Allow anon inserts/updates for development & preview environments
DROP POLICY IF EXISTS "Allow anon access for admin operations" ON public.customer_reviews;
CREATE POLICY "Allow anon access for admin operations"
ON public.customer_reviews
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_customer_reviews_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_reviews_modtime ON public.customer_reviews;
CREATE TRIGGER trg_customer_reviews_modtime
BEFORE UPDATE ON public.customer_reviews
FOR EACH ROW
EXECUTE FUNCTION update_customer_reviews_modtime();

-- Restore the original five demo review cards explicitly marked as is_demo = true
INSERT INTO public.customer_reviews (id, customer_name, name, review_message, profile_image_url, rating, is_active, display_order, is_demo, status)
VALUES
(
  'demo-slot-1',
  'Residential Client',
  'Residential Client',
  'The turnkey transformation of our apartment exceeded all expectations. Flawless modular kitchen engineering, bespoke living room fittings, and timely handover by Royal Epic.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  5.0,
  true,
  1,
  true,
  'approved'
),
(
  'demo-slot-2',
  'Villa Homeowner',
  'Villa Homeowner',
  'Exceptional craftsmanship on our custom Italian marble dining table and veneer wall paneling. Professional site supervision throughout the entire project.',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
  5.0,
  true,
  2,
  true,
  'approved'
),
(
  'demo-slot-3',
  'Corporate Office Lead',
  'Corporate Office Lead',
  'Frameless acoustic glass partitions and modern executive workstations delivered on schedule with spotless manufacturing finish. Highly recommend their commercial team.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
  5.0,
  true,
  3,
  true,
  'approved'
),
(
  'demo-slot-4',
  'Penthouse Owner',
  'Penthouse Owner',
  'From initial 3D visualization to final installation, the attention to detail in our master suite wardrobes and cove lighting channels was truly world-class.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  5.0,
  true,
  4,
  true,
  'approved'
),
(
  'demo-slot-5',
  'Hospitality Partner',
  'Hospitality Partner',
  'High-grade commercial kitchen stainless steel equipment and dining area woodwork executed seamlessly with robust build quality and dedicated customer service.',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
  5.0,
  true,
  5,
  true,
  'approved'
)
ON CONFLICT (id) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  review_message = EXCLUDED.review_message,
  rating = EXCLUDED.rating,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  is_demo = EXCLUDED.is_demo;
