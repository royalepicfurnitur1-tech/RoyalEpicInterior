-- ==============================================================================
-- ROYAL EPIC INTERIOR & FURNITURE - SUPABASE POSTGRESQL SCHEMA
-- Execute this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. LEADS & INQUIRIES TABLE
-- Captures consultation bookings, cost estimator requests, contact submissions, and AI leads
CREATE TABLE IF NOT EXISTS public.leads_and_inquiries (
    id TEXT PRIMARY KEY DEFAULT ('LEAD-' || floor(random() * 900000 + 100000)::text),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT DEFAULT 'Bengaluru',
    service_type TEXT DEFAULT 'Turnkey Interior Consultation',
    estimated_budget TEXT DEFAULT 'Custom Quote',
    project_scope TEXT,
    source TEXT DEFAULT 'Website Form',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'site_visit_scheduled', 'boq_sent', 'converted', 'archived')),
    preferred_date TEXT,
    drawing_name TEXT,
    notes TEXT,
    raw_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lead search and status filtering
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads_and_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads_and_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads_and_inquiries(phone);

-- 2. CATALOG PRODUCTS TABLE
-- Stores luxury furniture catalog items, materials, 3D flags, and pricing
CREATE TABLE IF NOT EXISTS public.catalog_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_slug TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    original_price NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    rating NUMERIC DEFAULT 4.9,
    reviews_count INT DEFAULT 12,
    image TEXT NOT NULL,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    is_hot BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT true,
    has_3d_viewer BOOLEAN DEFAULT false,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.catalog_products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.catalog_products(created_at DESC);

-- 3. CLIENT PROJECTS TABLE
-- Real-time tracking of ongoing residential & commercial interior sites
CREATE TABLE IF NOT EXISTS public.client_projects (
    id TEXT PRIMARY KEY DEFAULT ('PRJ-' || floor(random() * 90000 + 10000)::text),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    project_name TEXT NOT NULL,
    location TEXT DEFAULT 'Bengaluru',
    stage TEXT DEFAULT 'design' CHECK (stage IN ('design', 'civil_prep', 'woodwork', 'polishing', 'dispatch', 'installation', 'completed')),
    completion_percentage INT DEFAULT 10,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    target_date DATE,
    lead_architect TEXT DEFAULT 'Royal Epic Design Studio',
    updates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_phone ON public.client_projects(client_phone);

-- 4. INVOICES & BOQ ESTIMATES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY DEFAULT ('INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || floor(random() * 9000 + 1000)::text),
    invoice_number TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    gst_rate NUMERIC DEFAULT 18,
    gst_amount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.leads_and_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous visitors to submit leads (write-only)
CREATE POLICY "Public can insert leads" 
ON public.leads_and_inquiries 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Allow authenticated users / admins to read and update leads
CREATE POLICY "Authenticated users can select leads" 
ON public.leads_and_inquiries 
FOR SELECT 
TO authenticated, anon 
USING (true);

CREATE POLICY "Authenticated users can update leads" 
ON public.leads_and_inquiries 
FOR UPDATE 
TO authenticated, anon 
USING (true);

-- Allow public read access to catalog products
CREATE POLICY "Public can view products" 
ON public.catalog_products 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Allow authenticated users to manage products
CREATE POLICY "Full access to products for authenticated users" 
ON public.catalog_products 
FOR ALL 
TO authenticated, anon 
USING (true);

-- Allow public access for client projects view
CREATE POLICY "Public can view projects" 
ON public.client_projects 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Manage projects for authenticated users" 
ON public.client_projects 
FOR ALL 
TO authenticated, anon 
USING (true);

-- Allow public access for invoices
CREATE POLICY "Public can view invoices" 
ON public.invoices 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Manage invoices for authenticated users" 
ON public.invoices 
FOR ALL 
TO authenticated, anon 
USING (true);

-- ==============================================================================
-- INITIAL SAMPLE DATA SEEDING (OPTIONAL)
-- ==============================================================================

INSERT INTO public.leads_and_inquiries (id, full_name, phone, email, city, service_type, estimated_budget, status, source)
VALUES 
('LEAD-1001', 'Vikramaditya Sharma', '+91 98450 12345', 'vikram.sharma@example.com', 'Bengaluru (Hebbal)', '3BHK Luxury Turnkey Interior', '₹25 Lakhs - ₹35 Lakhs', 'site_visit_scheduled', 'AI Voice Consultant'),
('LEAD-1002', 'Dr. Meenakshi Sundaram', '+91 99001 88765', 'meenakshi.s@gmail.com', 'Bengaluru (Thanisandra)', 'Modular Kitchen & Wardrobes', '₹12 Lakhs - ₹18 Lakhs', 'new', 'Quote Calculator')
ON CONFLICT (id) DO NOTHING;

-- 5. ORDERS TABLE (Customer Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'Order Placed',
    payment_status TEXT DEFAULT 'Pending',
    delivery_address JSONB DEFAULT '{}'::jsonb,
    expected_delivery_date TEXT,
    courier_name TEXT,
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 6. PROFILES TABLE (User profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can select their own orders" ON public.orders FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE TO authenticated, anon USING (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles select" ON public.profiles FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Public profiles insert" ON public.profiles FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Public profiles update" ON public.profiles FOR UPDATE TO authenticated, anon USING (true);
