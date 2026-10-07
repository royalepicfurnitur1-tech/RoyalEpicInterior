-- ==============================================================================
-- MANUAL SUPABASE MIGRATION — NOT AUTOMATICALLY EXECUTED
-- 
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/lwrfoztfsyffgtybesia/sql)
-- to create the tables for 'portfolio_projects' and 'customer_reviews'.
-- ==============================================================================

-- 1. PORTFOLIO PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Residential',
    location TEXT DEFAULT 'Bengaluru',
    area_sqft NUMERIC DEFAULT 3000,
    completion_time TEXT DEFAULT '8 Weeks',
    before_image TEXT,
    after_image TEXT,
    client_name TEXT DEFAULT 'Valued Client',
    client_review TEXT,
    client_rating NUMERIC DEFAULT 5.0,
    has_3d_walkthrough BOOLEAN DEFAULT false,
    gallery JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for portfolio_projects
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to portfolio projects
CREATE POLICY "Public Read Portfolio Projects" 
ON public.portfolio_projects 
FOR SELECT 
USING (true);

-- Allow authenticated/service role full access
CREATE POLICY "Admin Full Access Portfolio Projects" 
ON public.portfolio_projects 
FOR ALL 
USING (true)
WITH CHECK (true);


-- 2. CUSTOMER REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.customer_reviews (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title TEXT NOT NULL,
    review_message TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT,
    project_type TEXT DEFAULT 'Custom Interior & Furniture Work',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for customer_reviews
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to approved reviews only
CREATE POLICY "Public Read Approved Reviews" 
ON public.customer_reviews 
FOR SELECT 
USING (status = 'approved');

-- Allow public submission of new reviews (must start as pending)
CREATE POLICY "Public Insert Pending Reviews" 
ON public.customer_reviews 
FOR INSERT 
WITH CHECK (status = 'pending');

-- Allow admin / service role full access
CREATE POLICY "Admin Full Access Customer Reviews" 
ON public.customer_reviews 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 3. HERITAGE HOME ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.heritage_home_items (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    section_number NUMERIC DEFAULT 1,
    title TEXT NOT NULL,
    subtitle TEXT,
    full_description TEXT,
    category TEXT,
    sub_category TEXT,
    image TEXT,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    alt TEXT,
    design_style TEXT,
    architectural_features TEXT,
    interior_character TEXT,
    suitable_for TEXT,
    highlights JSONB DEFAULT '[]'::jsonb,
    key_elements JSONB DEFAULT '[]'::jsonb,
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for heritage_home_items
ALTER TABLE public.heritage_home_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public Read Heritage Home Items" 
ON public.heritage_home_items 
FOR SELECT 
USING (true);

-- Allow admin / service role full access
CREATE POLICY "Admin Full Access Heritage Home Items" 
ON public.heritage_home_items 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON public.customer_reviews(status);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_product_id ON public.customer_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_category ON public.portfolio_projects(category);
CREATE INDEX IF NOT EXISTS idx_heritage_home_items_slug ON public.heritage_home_items(slug);
