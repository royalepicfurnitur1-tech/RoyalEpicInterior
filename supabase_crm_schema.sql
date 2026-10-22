-- ==============================================================================
-- ROYAL EPIC INTERIORS — TELECALLER CRM PRODUCTION DATABASE SCHEMA
-- Subdomain: https://tele.royalepicinteriors.com/
-- Additive, reversible migration for CRM Leads, Call Logs, and User Profiles
-- ==============================================================================

-- 1. CRM USER PROFILES & ROLES TABLE
-- Maps authenticated users to CRM roles: 'admin' or 'telecaller'
CREATE TABLE IF NOT EXISTS public.crm_user_profiles (
    id TEXT PRIMARY KEY, -- Matches auth.users id or unique user ID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'telecaller' CHECK (role IN ('admin', 'telecaller')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_users_role ON public.crm_user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_crm_users_email ON public.crm_user_profiles(email);

-- 2. CRM LEADS TABLE
-- Dedicated CRM leads with temperature, pipeline status, and follow-up tracking
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id TEXT PRIMARY KEY DEFAULT ('CRM-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(floor(random() * 90000 + 10000)::text, 5, '0')),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    source TEXT NOT NULL DEFAULT 'Website' CHECK (source IN ('Justdial', 'IndiaMART', 'Facebook', 'Instagram', 'Website', 'Referral', 'Walk-in', 'Other')),
    interested_service TEXT NOT NULL DEFAULT 'Turnkey Interior',
    city TEXT DEFAULT 'Bengaluru',
    budget TEXT,
    temperature TEXT NOT NULL DEFAULT 'Warm' CHECK (temperature IN ('Hot', 'Warm', 'Cold')),
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Follow-up', 'No Answer', 'Qualified', 'Site Visit', 'Quotation', 'Converted', 'Lost')),
    notes TEXT,
    last_contact_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    created_by TEXT,
    created_by_name TEXT,
    last_updated_by TEXT,
    last_updated_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes for CRM Leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_phone ON public.crm_leads(phone);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_temperature ON public.crm_leads(temperature);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON public.crm_leads(source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_followup ON public.crm_leads(next_followup_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON public.crm_leads(created_at DESC);

-- 3. CRM CALL LOGS TABLE
-- Persistent history of every telecalling interaction
CREATE TABLE IF NOT EXISTS public.crm_call_logs (
    id TEXT PRIMARY KEY DEFAULT ('CALL-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(floor(random() * 9000 + 1000)::text, 4, '0')),
    lead_id TEXT NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    call_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    outcome TEXT NOT NULL CHECK (outcome IN (
        'Interested', 
        'No Answer', 
        'Busy', 
        'Call Back Requested', 
        'Not Interested', 
        'Wrong Number', 
        'Site Visit Requested', 
        'Converted'
    )),
    notes TEXT,
    followup_date TIMESTAMPTZ,
    logged_by TEXT,
    logged_by_name TEXT,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_call_logs_lead ON public.crm_call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_call_logs_date ON public.crm_call_logs(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_call_logs_outcome ON public.crm_call_logs(outcome);
CREATE INDEX IF NOT EXISTS idx_crm_call_logs_user ON public.crm_call_logs(logged_by);

-- 4. CRM AUDIT LOGS TABLE
-- Tracks deletion, critical lead updates, and CSV imports
CREATE TABLE IF NOT EXISTS public.crm_audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('AUDIT-' || floor(random() * 900000 + 100000)::text),
    lead_id TEXT,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'CALL_LOG', 'IMPORT'
    performed_by TEXT NOT NULL,
    performed_by_name TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_action ON public.crm_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_created_at ON public.crm_audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.crm_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is CRM admin
CREATE OR REPLACE FUNCTION public.is_crm_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.crm_user_profiles
        WHERE id = auth.uid()::text AND role = 'admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is CRM telecaller or admin
CREATE OR REPLACE FUNCTION public.is_crm_authorized()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.crm_user_profiles
        WHERE id = auth.uid()::text AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- POLICIES FOR crm_user_profiles ---
-- Authenticated users can view their own profile
CREATE POLICY "CRM users can view their own profile"
ON public.crm_user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid()::text OR public.is_crm_admin());

-- Only CRM Admin can insert, update or delete user profiles
CREATE POLICY "Admins can manage CRM user profiles"
ON public.crm_user_profiles FOR ALL
TO authenticated
USING (public.is_crm_admin())
WITH CHECK (public.is_crm_admin());

-- --- POLICIES FOR crm_leads ---
-- Both Admin and Telecaller can view all leads (operational requirement)
CREATE POLICY "Authorized CRM users can view all leads"
ON public.crm_leads FOR SELECT
TO authenticated
USING (public.is_crm_authorized());

-- Both Admin and Telecaller can insert new leads
CREATE POLICY "Authorized CRM users can create leads"
ON public.crm_leads FOR INSERT
TO authenticated
WITH CHECK (public.is_crm_authorized());

-- Both Admin and Telecaller can update leads (status, notes, temperature, followups)
CREATE POLICY "Authorized CRM users can update leads"
ON public.crm_leads FOR UPDATE
TO authenticated
USING (public.is_crm_authorized())
WITH CHECK (public.is_crm_authorized());

-- Strictly ADMIN ONLY: delete leads
CREATE POLICY "Only Admins can delete CRM leads"
ON public.crm_leads FOR DELETE
TO authenticated
USING (public.is_crm_admin());

-- --- POLICIES FOR crm_call_logs ---
-- Authorized CRM users can view all call logs
CREATE POLICY "Authorized CRM users can view call logs"
ON public.crm_call_logs FOR SELECT
TO authenticated
USING (public.is_crm_authorized());

-- Authorized CRM users can create call logs
CREATE POLICY "Authorized CRM users can log calls"
ON public.crm_call_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_crm_authorized());

-- Call logs are immutable for telecallers; only admin can modify in exception
CREATE POLICY "Only Admins can update or delete call logs"
ON public.crm_call_logs FOR UPDATE
TO authenticated
USING (public.is_crm_admin());

CREATE POLICY "Only Admins can delete call logs"
ON public.crm_call_logs FOR DELETE
TO authenticated
USING (public.is_crm_admin());

-- --- POLICIES FOR crm_audit_logs ---
-- Audit logs can be viewed only by admin
CREATE POLICY "Admins can view audit logs"
ON public.crm_audit_logs FOR SELECT
TO authenticated
USING (public.is_crm_admin());

-- Audit logs can be inserted by authorized operations
CREATE POLICY "Authorized CRM operations can record audit logs"
ON public.crm_audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_crm_authorized());

-- ==============================================================================
-- INITIAL SEEDING DATA FOR DEMO & TESTING
-- ==============================================================================

INSERT INTO public.crm_leads (
    id, customer_name, phone, email, source, interested_service, city, budget, temperature, status, notes, last_contact_at, next_followup_at
) VALUES 
('CRM-2601-10001', 'Vikramaditya Sharma', '+91 98450 12345', 'vikram.sharma@example.com', 'IndiaMART', '3BHK Luxury Turnkey Interior', 'Bengaluru (Hebbal)', '₹25 - 35 Lakhs', 'Hot', 'Follow-up', 'Client wants Italian marble living room and Burma teak pooja door. Follow up on design render approval.', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '4 hours'),
('CRM-2601-10002', 'Dr. Meenakshi Sundaram', '+91 99001 88765', 'meenakshi.s@gmail.com', 'Justdial', 'Modular Kitchen & Sliding Wardrobes', 'Bengaluru (Thanisandra)', '₹12 - 18 Lakhs', 'Hot', 'Site Visit', 'Site visit requested for Rachenahalli villa. Keys with security.', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day'),
('CRM-2601-10003', 'Ananya Deshmukh', '+91 98860 33421', 'ananya.d@techcorp.in', 'Facebook', 'Full Home Turnkey Interior', 'Bengaluru (Whitefield)', '₹30 - 45 Lakhs', 'Warm', 'Quotation', 'Shared preliminary BOQ for 4BHK apartment. Awaiting client review.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('CRM-2601-10004', 'Rajesh K. Varma', '+91 94480 77123', 'rajesh.varma@varmaestate.com', 'Website', 'Commercial Office Fit-Out', 'Bengaluru (Koramangala)', '₹50 Lakhs+', 'Hot', 'Qualified', '5000 sq.ft commercial space. Needs acoustic glass partitions and executive furniture.', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '2 days'),
('CRM-2601-10005', 'Kavita Chawla', '+91 97312 44556', 'kavita.c@gmail.com', 'Instagram', 'WPC Waterproof Bathroom Doors', 'Bengaluru (Yelahanka)', '₹2 - 4 Lakhs', 'Cold', 'No Answer', 'Tried calling twice; phone rang without answer. Sent WhatsApp overview.', NOW() - INTERVAL '1 day', NOW() + INTERVAL '3 hours'),
('CRM-2601-10006', 'Suresh Menon', '+91 99451 99882', 'suresh.m@gmail.com', 'Referral', 'Master Bedroom & Living Suite', 'Bengaluru (Indiranagar)', '₹15 - 20 Lakhs', 'Warm', 'Contacted', 'Referred by Mr. Sharma. Interested in bespoke veneer wardrobes.', NOW() - INTERVAL '5 hours', NOW() + INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.crm_call_logs (
    id, lead_id, call_date, outcome, notes, followup_date, logged_by, logged_by_name
) VALUES
('CALL-260101-1001', 'CRM-2601-10001', NOW() - INTERVAL '2 hours', 'Interested', 'Spoke with Vikramaditya. Very interested in Burma teak finish. Scheduled design call.', NOW() + INTERVAL '4 hours', 'crm_telecaller_1', 'Pooja (Telecaller)'),
('CALL-260101-1002', 'CRM-2601-10002', NOW() - INTERVAL '1 day', 'Site Visit Requested', 'Doctor confirmed site visit for tomorrow 11:30 AM at Thanisandra villa.', NOW() + INTERVAL '1 day', 'crm_telecaller_1', 'Pooja (Telecaller)'),
('CALL-260101-1003', 'CRM-2601-10005', NOW() - INTERVAL '1 day', 'No Answer', 'No answer. Will retry today afternoon.', NOW() + INTERVAL '3 hours', 'crm_telecaller_2', 'Sunil (Telecaller)')
ON CONFLICT (id) DO NOTHING;
