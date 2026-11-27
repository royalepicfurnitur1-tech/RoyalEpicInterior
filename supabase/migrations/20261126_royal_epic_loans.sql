-- =============================================================================
-- ROYAL EPIC LOANS – PRODUCTION DATABASE SCHEMA & SERVICE-ROLE RLS MIGRATION
-- File: supabase/migrations/20261126_royal_epic_loans.sql
-- Target Project ID: lwrfoztfsyffgtybesia
-- Direct SQL Editor URL: https://supabase.com/dashboard/project/lwrfoztfsyffgtybesia/sql/new
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Table: public.loan_enquiries
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  normalized_phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  finance_purpose TEXT NOT NULL,
  approximate_amount TEXT,
  project_details TEXT,
  preferred_contact_time TEXT DEFAULT 'Anytime',
  enquiry_source TEXT NOT NULL DEFAULT 'Website Loans Page',
  status TEXT NOT NULL DEFAULT 'New',
  assigned_staff TEXT,
  assigned_staff_name TEXT,
  next_followup_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  internal_notes TEXT,
  consent_accepted BOOLEAN NOT NULL DEFAULT true,
  linked_previous_enquiry_id UUID REFERENCES public.loan_enquiries(id) ON DELETE SET NULL,
  linked_previous_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drop any legacy policies or FK constraints before ensuring column types
DROP POLICY IF EXISTS "Public can insert loan_enquiries" ON public.loan_enquiries;
DROP POLICY IF EXISTS "Authenticated staff can read loan_enquiries" ON public.loan_enquiries;
DROP POLICY IF EXISTS "Authenticated staff can update loan_enquiries" ON public.loan_enquiries;
DROP POLICY IF EXISTS "Service role has full access to loan_enquiries" ON public.loan_enquiries;
DROP POLICY IF EXISTS "Staff can read loan_enquiries" ON public.loan_enquiries;
DROP POLICY IF EXISTS "Validated insert on loan_enquiries" ON public.loan_enquiries;
DROP POLICY IF EXISTS "Staff can update loan_enquiries" ON public.loan_enquiries;
DROP POLICY IF EXISTS "Allow CRM access on loan_enquiries" ON public.loan_enquiries;
DROP POLICY IF EXISTS "service_role_full_access_loan_enquiries" ON public.loan_enquiries;
DROP POLICY IF EXISTS "service_role_manage_loan_enquiries" ON public.loan_enquiries;

ALTER TABLE public.loan_enquiries DROP CONSTRAINT IF EXISTS loan_enquiries_assigned_staff_fkey;
ALTER TABLE public.loan_enquiries ADD COLUMN IF NOT EXISTS linked_previous_reference TEXT;
ALTER TABLE public.loan_enquiries ALTER COLUMN assigned_staff TYPE TEXT USING assigned_staff::TEXT;

CREATE INDEX IF NOT EXISTS idx_loan_enquiries_status ON public.loan_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_loan_enquiries_purpose ON public.loan_enquiries(finance_purpose);
CREATE INDEX IF NOT EXISTS idx_loan_enquiries_assigned_staff ON public.loan_enquiries(assigned_staff);
CREATE INDEX IF NOT EXISTS idx_loan_enquiries_normalized_phone ON public.loan_enquiries(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_loan_enquiries_next_followup ON public.loan_enquiries(next_followup_at);
CREATE INDEX IF NOT EXISTS idx_loan_enquiries_created_at ON public.loan_enquiries(created_at DESC);

-- -----------------------------------------------------------------------------
-- 2. Table: public.loan_call_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_enquiry_id UUID NOT NULL REFERENCES public.loan_enquiries(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL,
  staff_name TEXT,
  call_status TEXT NOT NULL,
  call_notes TEXT,
  next_followup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_call_logs_enquiry_id ON public.loan_call_logs(loan_enquiry_id);
CREATE INDEX IF NOT EXISTS idx_loan_call_logs_created_at ON public.loan_call_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- 3. Table: public.loan_activities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_enquiry_id UUID NOT NULL REFERENCES public.loan_enquiries(id) ON DELETE CASCADE,
  staff_id TEXT,
  staff_name TEXT,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_activities_enquiry_id ON public.loan_activities(loan_enquiry_id);
CREATE INDEX IF NOT EXISTS idx_loan_activities_created_at ON public.loan_activities(created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Enable Row Level Security (RLS) on All Three Tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.loan_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_activities ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5. Grant Privileges to anon, authenticated, and service_role (Matches Properties CRM)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.loan_enquiries TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.loan_call_logs TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.loan_activities TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 6. Clean Up Legacy Policies & Enable CRM Access Policies (anon, authenticated, service_role)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow CRM access on loan_enquiries" ON public.loan_enquiries;
CREATE POLICY "Allow CRM access on loan_enquiries"
  ON public.loan_enquiries
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated staff can read loan_call_logs" ON public.loan_call_logs;
DROP POLICY IF EXISTS "Authenticated staff can insert loan_call_logs" ON public.loan_call_logs;
DROP POLICY IF EXISTS "Service role has full access to loan_call_logs" ON public.loan_call_logs;
DROP POLICY IF EXISTS "Staff can manage loan_call_logs" ON public.loan_call_logs;
DROP POLICY IF EXISTS "Allow CRM access on loan_call_logs" ON public.loan_call_logs;
DROP POLICY IF EXISTS "service_role_full_access_loan_call_logs" ON public.loan_call_logs;
DROP POLICY IF EXISTS "service_role_manage_loan_call_logs" ON public.loan_call_logs;

CREATE POLICY "Allow CRM access on loan_call_logs"
  ON public.loan_call_logs
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated staff can read loan_activities" ON public.loan_activities;
DROP POLICY IF EXISTS "Authenticated staff can insert loan_activities" ON public.loan_activities;
DROP POLICY IF EXISTS "Service role has full access to loan_activities" ON public.loan_activities;
DROP POLICY IF EXISTS "Staff can manage loan_activities" ON public.loan_activities;
DROP POLICY IF EXISTS "Allow CRM access on loan_activities" ON public.loan_activities;
DROP POLICY IF EXISTS "service_role_full_access_loan_activities" ON public.loan_activities;
DROP POLICY IF EXISTS "service_role_manage_loan_activities" ON public.loan_activities;

CREATE POLICY "Allow CRM access on loan_activities"
  ON public.loan_activities
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 7. Reload PostgREST Schema Cache & Return Verification Output
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  rowsecurity AS rls_enabled,
  has_table_privilege('anon', 'public.' || tablename, 'SELECT') AS anon_can_select,
  has_table_privilege('service_role', 'public.' || tablename, 'SELECT') AS service_role_can_select
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('loan_enquiries', 'loan_call_logs', 'loan_activities')
ORDER BY tablename;
