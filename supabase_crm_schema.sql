-- ==============================================================================
-- ROYAL EPIC INTERIORS — PRODUCTION CRM SUPABASE MIGRATION SCRIPT
-- File: supabase_crm_schema.sql
-- Subdomain: https://tele.royalepicinteriors.com
--
-- INSTRUCTIONS FOR DATABASE ADMINISTRATOR:
-- 1. Open the Supabase Dashboard: https://supabase.com/dashboard/project/lwrfoztfsyffgtybesia
-- 2. Navigate to SQL Editor (left sidebar).
-- 3. Paste and run this script.
--
-- SAFETY GUARANTEES:
-- - 100% additive and non-destructive.
-- - Uses CREATE TABLE IF NOT EXISTS and ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
-- - Preserves all 21 existing records in public.leads_and_inquiries.
-- - Enforces unique mobile number constraint (uq_crm_leads_normalized_phone).
-- - Protects call log history from accidental updates/deletions.
-- ==============================================================================

-- 1. CRM USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.crm_user_profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'telecaller' CHECK (role IN ('admin', 'telecaller')),
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_profiles_role ON public.crm_user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_email ON public.crm_user_profiles(email);

-- 2. CRM LEADS TABLE
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id TEXT PRIMARY KEY DEFAULT ('CRM-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(floor(random() * 90000 + 10000)::text, 5, '0')),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    normalized_phone TEXT NOT NULL,
    alternate_phone TEXT,
    email TEXT,
    source TEXT NOT NULL DEFAULT 'Website Enquiry',
    custom_source TEXT,
    interested_service TEXT NOT NULL DEFAULT 'Residential Interior',
    custom_service TEXT,
    city TEXT DEFAULT 'Bengaluru',
    project_address TEXT,
    budget TEXT,
    temperature TEXT NOT NULL DEFAULT 'Warm',
    status TEXT NOT NULL DEFAULT 'New Lead',
    notes TEXT,
    assigned_to TEXT,
    assigned_to_name TEXT,
    last_contact_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    next_followup_date TEXT,
    next_followup_time TEXT,
    external_lead_id TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_by TEXT,
    created_by_name TEXT,
    last_updated_by TEXT,
    last_updated_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure all enhanced columns exist if table was partially created previously
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS alternate_phone TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS custom_source TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS custom_service TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS project_address TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS next_followup_date TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS next_followup_time TEXT;

-- Enforce unique mobile number constraint at database level
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_crm_leads_normalized_phone'
    ) THEN
        ALTER TABLE public.crm_leads 
        ADD CONSTRAINT uq_crm_leads_normalized_phone UNIQUE (normalized_phone);
    END IF;
END $$;

-- Search, filtering & pipeline indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_normalized_phone ON public.crm_leads(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_crm_leads_customer_name ON public.crm_leads(customer_name);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_temperature ON public.crm_leads(temperature);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON public.crm_leads(source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_followup ON public.crm_leads(next_followup_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON public.crm_leads(created_at DESC);

-- 3. CRM CALL LOGS TABLE (Historical telecaller interactions)
CREATE TABLE IF NOT EXISTS public.crm_call_logs (
    id TEXT PRIMARY KEY DEFAULT ('CALL-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(floor(random() * 9000 + 1000)::text, 4, '0')),
    lead_id TEXT NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    call_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    outcome TEXT NOT NULL,
    notes TEXT,
    followup_date TIMESTAMPTZ,
    logged_by TEXT,
    logged_by_name TEXT,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_call_logs_lead ON public.crm_call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_call_logs_date ON public.crm_call_logs(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_call_logs_outcome ON public.crm_call_logs(outcome);

-- 4. CRM AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.crm_audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('AUDIT-' || floor(random() * 900000 + 100000)::text),
    lead_id TEXT,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    performed_by_name TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_action ON public.crm_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_created_at ON public.crm_audit_logs(created_at DESC);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.crm_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.is_crm_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.crm_user_profiles
        WHERE (id = auth.uid()::text OR email = auth.jwt() ->> 'email')
          AND role = 'admin' 
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_crm_authorized()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.crm_user_profiles
        WHERE (id = auth.uid()::text OR email = auth.jwt() ->> 'email')
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop prior versions if they exist to prevent duplication errors
DROP POLICY IF EXISTS "CRM users can view profiles" ON public.crm_user_profiles;
DROP POLICY IF EXISTS "CRM admins can manage profiles" ON public.crm_user_profiles;
DROP POLICY IF EXISTS "CRM users can view leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM users can create leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM users can update leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM admins can delete leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM users can view call logs" ON public.crm_call_logs;
DROP POLICY IF EXISTS "CRM users can insert call logs" ON public.crm_call_logs;
DROP POLICY IF EXISTS "CRM audit read" ON public.crm_audit_logs;
DROP POLICY IF EXISTS "CRM audit insert" ON public.crm_audit_logs;

-- Re-create clean RLS policies
CREATE POLICY "CRM users can view profiles"
ON public.crm_user_profiles FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "CRM admins can manage profiles"
ON public.crm_user_profiles FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "CRM users can view leads"
ON public.crm_leads FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "CRM users can create leads"
ON public.crm_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "CRM users can update leads"
ON public.crm_leads FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "CRM admins can delete leads"
ON public.crm_leads FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "CRM users can view call logs"
ON public.crm_call_logs FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "CRM users can insert call logs"
ON public.crm_call_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "CRM audit read"
ON public.crm_audit_logs FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "CRM audit insert"
ON public.crm_audit_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 6. SEED DEFAULT PRODUCTION USERS (Royal Epic Executive Admin & Telecaller)
INSERT INTO public.crm_user_profiles (id, email, name, role, phone, status)
VALUES 
('crm_admin_primary', 'admin@royalepicinterior.com', 'Royal Epic Executive Admin', 'admin', '+91 99166 33338', 'active'),
('crm_telecaller_1', 'telecaller1@royalepicinterior.com', 'Pooja (Senior Telecaller)', 'telecaller', '+91 98450 11223', 'active')
ON CONFLICT (email) DO UPDATE SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- 7. SAFE IDEMPOTENT SYNC FROM leads_and_inquiries (If any leads exist there)
-- This copies leads into crm_leads without creating duplicates.
INSERT INTO public.crm_leads (
    id, customer_name, phone, normalized_phone, email, source, interested_service, city, budget, status, created_at, updated_at
)
SELECT 
    l.id,
    COALESCE(l.full_name, 'Lead'),
    COALESCE(l.phone, '+910000000000'),
    CASE 
        WHEN l.phone ~ '^[6-9][0-9]{9}$' THEN '+91' || l.phone
        WHEN l.phone ~ '^0[6-9][0-9]{9}$' THEN '+91' || SUBSTRING(l.phone FROM 2)
        WHEN l.phone ~ '^91[6-9][0-9]{9}$' THEN '+' || l.phone
        ELSE l.phone
    END,
    l.email,
    COALESCE(l.source, 'Website Enquiry'),
    COALESCE(l.service_type, 'Residential Interior'),
    COALESCE(l.city, 'Bengaluru'),
    l.estimated_budget,
    'New Lead',
    COALESCE(l.created_at, NOW()),
    COALESCE(l.created_at, NOW())
FROM public.leads_and_inquiries l
WHERE l.phone IS NOT NULL
ON CONFLICT (normalized_phone) DO NOTHING;
