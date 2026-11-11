-- ==============================================================================
-- ROYAL EPIC INTERIORS — PRODUCTION CRM SUPABASE V2 MIGRATION SCRIPT (FINAL)
-- File: supabase_crm_v2_migration.sql
-- Subdomain: https://tele.royalepicinterior.com/
-- Target Database: Supabase PostgreSQL (Project ID: lwrfoztfsyffgtybesia)
--
-- INSTRUCTIONS FOR DATABASE ADMINISTRATOR:
-- 1. Open the Supabase Dashboard: https://supabase.com/dashboard/project/lwrfoztfsyffgtybesia
-- 2. Navigate to SQL Editor (left navigation panel).
-- 3. Review, paste, and run this script.
--
-- ARCHITECTURAL & SECURITY GUARANTEES:
-- - 100% Non-destructive: Does NOT drop, truncate, or recreate leads_and_inquiries.
-- - Preserves all existing records, IDs, and raw_details JSONB data.
-- - Additive columns only (using ADD COLUMN IF NOT EXISTS with safe defaults).
-- - Anonymous public visitors can ONLY INSERT enquiries (zero SELECT, UPDATE, DELETE).
-- - CRM customer leads and call logs restricted strictly to the service_role.
-- - All CRM operations remain brokered behind authenticated Express backend routes.
-- - SECURITY DEFINER functions use explicit SET search_path = public, pg_temp.
-- - archive_crm_lead() prevents duplicate archive notes on repeated invocations.
-- - RPC execution restricted strictly to service_role (zero direct client-side execution).
-- - Zero physical DELETE statements executed on genuine customer records or call logs.
-- - Preserves all 4 public website enquiry forms (Hero, Contact, Quote, Services).
-- - 100% Idempotent and safely rerunnable (uses DROP POLICY IF EXISTS before CREATE POLICY).
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD CRM METADATA COLUMNS TO PUBLIC.LEADS_AND_INQUIRIES (IDEMPOTENT)
-- -----------------------------------------------------------------------------
ALTER TABLE public.leads_and_inquiries 
    ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
    ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'Warm',
    ADD COLUMN IF NOT EXISTS assigned_to TEXT,
    ADD COLUMN IF NOT EXISTS assigned_to_name TEXT,
    ADD COLUMN IF NOT EXISTS next_followup_time TEXT,
    ADD COLUMN IF NOT EXISTS project_address TEXT,
    ADD COLUMN IF NOT EXISTS custom_source TEXT,
    ADD COLUMN IF NOT EXISTS custom_service TEXT,
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_updated_by TEXT,
    ADD COLUMN IF NOT EXISTS last_updated_by_name TEXT;

-- -----------------------------------------------------------------------------
-- 2. CREATE INDEXES FOR FAST FILTERING (IDEMPOTENT)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON public.leads_and_inquiries(temperature);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads_and_inquiries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_is_deleted ON public.leads_and_inquiries(is_deleted);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads_and_inquiries(status);

-- -----------------------------------------------------------------------------
-- 3. PERSISTENT CALL LOGS TABLE IN SUPABASE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_call_logs (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES public.leads_and_inquiries(id) ON DELETE CASCADE,
    call_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    outcome TEXT NOT NULL,
    notes TEXT,
    followup_date TEXT,
    logged_by TEXT,
    logged_by_name TEXT,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON public.crm_call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON public.crm_call_logs(call_date DESC);

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) ON CRM_CALL_LOGS (STRICT SERVICE_ROLE ISOLATION)
-- -----------------------------------------------------------------------------
ALTER TABLE public.crm_call_logs ENABLE ROW LEVEL SECURITY;

-- Idempotent Cleanup: Clean any prior policies before recreating
DROP POLICY IF EXISTS "Allow public insert on crm_call_logs" ON public.crm_call_logs;
DROP POLICY IF EXISTS "Allow select on crm_call_logs" ON public.crm_call_logs;
DROP POLICY IF EXISTS "Allow authenticated insert on crm_call_logs" ON public.crm_call_logs;
DROP POLICY IF EXISTS "Allow authenticated select on crm_call_logs" ON public.crm_call_logs;
DROP POLICY IF EXISTS "Allow service_role full access on crm_call_logs" ON public.crm_call_logs;
DROP POLICY IF EXISTS "Service role full access on crm_call_logs" ON public.crm_call_logs;

-- CRITICAL SECURITY: Revoke all direct client-side access from public, anon, and authenticated roles.
-- Call logs must NEVER be readable or insertable via client-side PostgREST.
-- All CRM call-log queries and writes are mediated by the authenticated Express CRM backend.
REVOKE ALL ON TABLE public.crm_call_logs FROM anon;
REVOKE ALL ON TABLE public.crm_call_logs FROM public;
REVOKE ALL ON TABLE public.crm_call_logs FROM authenticated;

-- Grant table privileges exclusively to service_role (used by the authenticated Express backend)
GRANT ALL ON TABLE public.crm_call_logs TO service_role;

-- Service Role Policy (used exclusively by the server-side Express backend)
CREATE POLICY "Service role full access on crm_call_logs"
ON public.crm_call_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 5. SECURE SERVER-SIDE SOFT-ARCHIVE FUNCTIONS (SECURITY DEFINER WITH SEARCH_PATH)
-- -----------------------------------------------------------------------------
-- This function executes server-side soft-archiving:
-- - Safe search_path explicitly configured to public, pg_temp
-- - Qualified database objects (public.leads_and_inquiries)
-- - Prevents duplicate archive notes on repeated invocations
-- - Sets status = 'archived', is_deleted = TRUE, deleted_at = NOW()
-- - Preserves customer information and raw_details JSONB
-- - Preserves all related call history in crm_call_logs
-- - NEVER executes DELETE FROM leads_and_inquiries
-- - NEVER executes DELETE FROM crm_call_logs
CREATE OR REPLACE FUNCTION public.archive_crm_lead(
    p_lead_id TEXT,
    p_archived_by TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_lead RECORD;
BEGIN
    -- Verify lead exists in public.leads_and_inquiries
    SELECT id, full_name, phone, status, is_deleted, raw_details
    INTO v_lead
    FROM public.leads_and_inquiries
    WHERE id = p_lead_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'archived', false,
            'error', 'Lead record not found in leads_and_inquiries'
        );
    END IF;

    -- Idempotency check: If lead is already archived, do not append duplicate archive notes
    IF v_lead.is_deleted = TRUE OR v_lead.status = 'archived' THEN
        RETURN jsonb_build_object(
            'success', true,
            'archived', true,
            'already_archived', true,
            'lead_id', p_lead_id,
            'customer_name', v_lead.full_name,
            'message', 'Lead is already archived in Supabase PostgreSQL.'
        );
    END IF;

    -- Perform soft-archive (preserves row, IDs, raw_details, and call history)
    UPDATE public.leads_and_inquiries
    SET 
        status = 'archived',
        is_deleted = TRUE,
        deleted_at = NOW(),
        updated_at = NOW(),
        last_updated_by = p_archived_by,
        raw_details = COALESCE(raw_details, '{}'::JSONB) || jsonb_build_object(
            'is_deleted', true, 
            'deleted_at', NOW(),
            'archived_by', p_archived_by
        ),
        notes = COALESCE(notes, '') || E'\n[ARCHIVED BY ADMIN]: Archived at ' || NOW()::TEXT
    WHERE id = p_lead_id;

    RETURN jsonb_build_object(
        'success', true,
        'archived', true,
        'lead_id', p_lead_id,
        'customer_name', v_lead.full_name,
        'phone', v_lead.phone,
        'message', 'Lead archived successfully in Supabase PostgreSQL.'
    );
END;
$$;

-- Backward-compatible alias: If legacy backend invokes delete_crm_lead, it routes safely to archive_crm_lead
CREATE OR REPLACE FUNCTION public.delete_crm_lead(p_lead_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.archive_crm_lead(p_lead_id, 'admin');
END;
$$;

-- CRITICAL SECURITY: Revoke execution privileges from public, anon, and authenticated roles.
-- Ordinary telecallers and public web users CANNOT invoke this RPC directly via client APIs.
REVOKE EXECUTE ON FUNCTION public.archive_crm_lead(TEXT, TEXT) FROM public;
REVOKE EXECUTE ON FUNCTION public.archive_crm_lead(TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.archive_crm_lead(TEXT, TEXT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_crm_lead(TEXT) FROM public;
REVOKE EXECUTE ON FUNCTION public.delete_crm_lead(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_crm_lead(TEXT) FROM authenticated;

-- Grant execution strictly to service_role (Express backend admin verification required)
GRANT EXECUTE ON FUNCTION public.archive_crm_lead(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_crm_lead(TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- 6. RLS POLICIES FOR LEADS_AND_INQUIRIES (STRICT WRITE-ONLY FOR PUBLIC FORMS)
-- -----------------------------------------------------------------------------
-- Ensure RLS is enabled on leads_and_inquiries
ALTER TABLE public.leads_and_inquiries ENABLE ROW LEVEL SECURITY;

-- Idempotent cleanup of all leads_and_inquiries policies
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Authenticated users can select leads" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Allow authenticated delete on leads_and_inquiries" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Allow public insert on leads_and_inquiries" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Allow authenticated select on leads_and_inquiries" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Allow authenticated update on leads_and_inquiries" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Allow public read on leads_and_inquiries" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Public website forms can insert leads" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Service role full access on leads_and_inquiries" ON public.leads_and_inquiries;

-- CRITICAL PRIVILEGE HARDENING:
-- Anonymous web visitors can ONLY INSERT new enquiries (write-only).
-- Anonymous users and arbitrary authenticated users CANNOT SELECT, UPDATE, or DELETE customer records.
REVOKE SELECT, UPDATE, DELETE ON TABLE public.leads_and_inquiries FROM anon;
REVOKE SELECT, UPDATE, DELETE ON TABLE public.leads_and_inquiries FROM public;
REVOKE SELECT, UPDATE, DELETE ON TABLE public.leads_and_inquiries FROM authenticated;

GRANT INSERT ON TABLE public.leads_and_inquiries TO anon, authenticated;
GRANT ALL ON TABLE public.leads_and_inquiries TO service_role;

-- 1. Preserve public website form submissions (Contact Form, Quote Modal, Hero Consultation, Services)
-- Anonymous visitors can INSERT new enquiry rows only (WRITE-ONLY)
CREATE POLICY "Public can insert leads"
ON public.leads_and_inquiries 
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Service role (used exclusively by the authenticated Express backend) has full access
CREATE POLICY "Service role full access on leads_and_inquiries"
ON public.leads_and_inquiries 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Explicitly ensure NO raw DELETE policy exists on leads_and_inquiries.
-- Deletion is strictly managed through server-side soft-archiving (archive_crm_lead).

-- ==============================================================================
-- END OF CORRECTED MIGRATION SCRIPT
-- ==============================================================================
