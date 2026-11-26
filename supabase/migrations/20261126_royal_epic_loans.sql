-- =============================================================================
-- ROYAL EPIC LOANS – DEDICATED DATABASE SCHEMA & RLS POLICIES
-- Separate from Interior Leads (leads) and Properties (property_enquiries)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table: loan_enquiries
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
  assigned_staff UUID,
  assigned_staff_name TEXT,
  next_followup_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  internal_notes TEXT,
  consent_accepted BOOLEAN NOT NULL DEFAULT true,
  linked_previous_enquiry_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_enquiries_status ON public.loan_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_loan_enquiries_purpose ON public.loan_enquiries(finance_purpose);
CREATE INDEX IF NOT EXISTS idx_loan_enquiries_assigned_staff ON public.loan_enquiries(assigned_staff);
CREATE INDEX IF NOT EXISTS idx_loan_enquiries_normalized_phone ON public.loan_enquiries(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_loan_enquiries_next_followup ON public.loan_enquiries(next_followup_at);
CREATE INDEX IF NOT EXISTS idx_loan_enquiries_created_at ON public.loan_enquiries(created_at DESC);

-- 2. Table: loan_call_logs
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

-- 3. Table: loan_activities
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

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.loan_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_activities ENABLE ROW LEVEL SECURITY;

-- Prevent anonymous public read of private loan enquiries
DROP POLICY IF EXISTS "Staff can read loan_enquiries" ON public.loan_enquiries;
CREATE POLICY "Staff can read loan_enquiries"
  ON public.loan_enquiries
  FOR SELECT
  TO authenticated, service_role
  USING (true);

DROP POLICY IF EXISTS "Validated insert on loan_enquiries" ON public.loan_enquiries;
CREATE POLICY "Validated insert on loan_enquiries"
  ON public.loan_enquiries
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (
    length(trim(customer_name)) >= 2
    AND length(trim(mobile_number)) >= 10
    AND length(trim(finance_purpose)) >= 3
  );

DROP POLICY IF EXISTS "Staff can update loan_enquiries" ON public.loan_enquiries;
CREATE POLICY "Staff can update loan_enquiries"
  ON public.loan_enquiries
  FOR UPDATE
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage loan_call_logs" ON public.loan_call_logs;
CREATE POLICY "Staff can manage loan_call_logs"
  ON public.loan_call_logs
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage loan_activities" ON public.loan_activities;
CREATE POLICY "Staff can manage loan_activities"
  ON public.loan_activities
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);
