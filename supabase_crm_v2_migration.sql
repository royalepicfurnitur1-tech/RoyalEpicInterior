-- ==============================================================================
-- ROYAL EPIC INTERIORS — PRODUCTION CRM SUPABASE V2 MIGRATION SCRIPT (FINAL PRODUCTION)
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
-- - Direct SELECT, UPDATE, and DELETE completely denied to anon, public, and authenticated.
-- - Dynamic DO-block policy purge: Eliminates ALL pre-existing policies regardless of name.
-- - CRM customer leads and call logs restricted strictly to the service_role.
-- - All CRM operations remain brokered behind authenticated Express backend routes.
-- - Call-log foreign key enforces ON DELETE RESTRICT.
-- - archive_crm_lead() records Admin ID and Admin Name separately.
-- - archive_crm_lead() uses FOR UPDATE to prevent race conditions during concurrent archiving.
-- - archive_crm_lead() includes an idempotency guard preventing duplicate notes or overwrites.
-- - SECURITY DEFINER functions use explicit SET search_path = pg_catalog, pg_temp.
-- - RPC execution restricted strictly to service_role (zero direct client-side execution).
-- - Zero physical DELETE statements executed on genuine customer records or call logs.
-- - Preserves all 4 public website enquiry forms (Hero, Contact, Quote, Services).
-- - 100% Idempotent and safely rerunnable.
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
-- 3. PERSISTENT CALL LOGS TABLE IN SUPABASE (ON DELETE RESTRICT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_call_logs (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES public.leads_and_inquiries(id) ON DELETE RESTRICT,
    call_date TIMESTAMPTZ DEFAULT pg_catalog.now() NOT NULL,
    outcome TEXT NOT NULL,
    notes TEXT,
    followup_date TEXT,
    logged_by TEXT,
    logged_by_name TEXT,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT pg_catalog.now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON public.crm_call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON public.crm_call_logs(call_date DESC);

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY & PERMISSION AUDIT ON CRM_CALL_LOGS
-- -----------------------------------------------------------------------------
ALTER TABLE public.crm_call_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic Audit & Cleanup: Drop EVERY existing policy on crm_call_logs regardless of name
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'crm_call_logs'
    LOOP
        EXECUTE pg_catalog.format('DROP POLICY IF EXISTS %I ON public.crm_call_logs', pol.policyname);
    END LOOP;
END;
$$;

-- CRITICAL PRIVILEGE HARDENING:
-- Revoke all direct client-side privileges from public, anon, and authenticated roles.
-- Call logs must NEVER be readable, insertable, or modifiable via client-side PostgREST.
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
-- 5. SECURE SERVER-SIDE SOFT-ARCHIVE FUNCTION (CONCURRENCY-SAFE, ADMIN ATTRIBUTION)
-- -----------------------------------------------------------------------------
-- Clean up legacy alias and older function signatures if they existed
DROP FUNCTION IF EXISTS public.delete_crm_lead(TEXT);
DROP FUNCTION IF EXISTS public.archive_crm_lead(TEXT);
DROP FUNCTION IF EXISTS public.archive_crm_lead(TEXT, TEXT);

-- This function executes server-side soft-archiving:
-- - Hardened search_path explicitly configured to pg_catalog, pg_temp
-- - Qualified database objects (public.leads_and_inquiries)
-- - Records Admin ID (p_archived_by) and Admin Name (p_archived_by_name) separately
-- - Row-level exclusive lock (FOR UPDATE) prevents race conditions during concurrent archiving
-- - Idempotency guard prevents duplicate archive notes or timestamp overwrites
-- - Sets status = 'archived', is_deleted = TRUE, deleted_at = NOW()
-- - Preserves customer information and raw_details JSONB
-- - Preserves all related call history in crm_call_logs
-- - NEVER executes DELETE FROM leads_and_inquiries
-- - NEVER executes DELETE FROM crm_call_logs
CREATE OR REPLACE FUNCTION public.archive_crm_lead(
    p_lead_id TEXT,
    p_archived_by TEXT DEFAULT 'admin',
    p_archived_by_name TEXT DEFAULT 'Royal Epic Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_lead RECORD;
BEGIN
    -- 1. Verify lead exists and acquire exclusive row-level lock (FOR UPDATE)
    -- This guarantees concurrent archive requests queue sequentially without racing.
    SELECT id, full_name, phone, status, is_deleted, raw_details
    INTO v_lead
    FROM public.leads_and_inquiries
    WHERE id = p_lead_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', false,
            'archived', false,
            'error', 'Lead record not found in leads_and_inquiries'
        );
    END IF;

    -- 2. Idempotency Guard: If lead is already archived, return immediately.
    -- Prevents duplicate archive notes even if multiple calls execute concurrently.
    IF v_lead.is_deleted = TRUE OR v_lead.status = 'archived' THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'archived', true,
            'already_archived', true,
            'lead_id', p_lead_id,
            'customer_name', v_lead.full_name,
            'message', 'Lead is already archived in Supabase PostgreSQL.'
        );
    END IF;

    -- 3. Perform soft-archive (preserves row, IDs, raw_details, and call history)
    UPDATE public.leads_and_inquiries
    SET 
        status = 'archived',
        is_deleted = TRUE,
        deleted_at = pg_catalog.now(),
        updated_at = pg_catalog.now(),
        last_updated_by = p_archived_by,
        last_updated_by_name = p_archived_by_name,
        raw_details = pg_catalog.coalesce(raw_details, '{}'::pg_catalog.jsonb) || pg_catalog.jsonb_build_object(
            'is_deleted', true, 
            'deleted_at', pg_catalog.now(),
            'archived_by', p_archived_by,
            'archived_by_name', p_archived_by_name
        ),
        notes = pg_catalog.coalesce(notes, '') || E'\n[ARCHIVED BY ADMIN]: Archived by ' || p_archived_by_name || ' (' || p_archived_by || ') at ' || pg_catalog.now()::TEXT
    WHERE id = p_lead_id;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'archived', true,
        'lead_id', p_lead_id,
        'customer_name', v_lead.full_name,
        'phone', v_lead.phone,
        'archived_by', p_archived_by,
        'archived_by_name', p_archived_by_name,
        'message', 'Lead archived successfully in Supabase PostgreSQL.'
    );
END;
$$;

-- Security Hardening: Revoke execution from public, anon, and authenticated roles
REVOKE ALL ON FUNCTION public.archive_crm_lead(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.archive_crm_lead(TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.archive_crm_lead(TEXT, TEXT, TEXT) FROM authenticated;

-- Grant execution strictly to service_role (authenticated Express backend)
GRANT EXECUTE ON FUNCTION public.archive_crm_lead(TEXT, TEXT, TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- 5B. SECURE ATOMIC UPDATE FUNCTION (SECURITY DEFINER WITH FOR UPDATE LOCK)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_crm_lead(
    p_lead_id TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_email TEXT DEFAULT NULL,
    p_city TEXT DEFAULT 'Bengaluru',
    p_service_type TEXT DEFAULT 'Residential Interior',
    p_estimated_budget TEXT DEFAULT NULL,
    p_project_scope TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'CRM Lead',
    p_status TEXT DEFAULT 'new',
    p_preferred_date TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_raw_details JSONB DEFAULT '{}'::JSONB,
    p_updated_by TEXT DEFAULT 'admin',
    p_updated_by_name TEXT DEFAULT 'Royal Epic Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_lead RECORD;
BEGIN
    SELECT id INTO v_lead
    FROM public.leads_and_inquiries
    WHERE id = p_lead_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Lead record not found in leads_and_inquiries');
    END IF;

    UPDATE public.leads_and_inquiries
    SET 
        full_name = p_full_name,
        phone = p_phone,
        email = p_email,
        city = p_city,
        service_type = p_service_type,
        estimated_budget = p_estimated_budget,
        project_scope = p_project_scope,
        source = p_source,
        status = p_status,
        preferred_date = p_preferred_date,
        notes = p_notes,
        raw_details = p_raw_details,
        last_updated_by = p_updated_by,
        last_updated_by_name = p_updated_by_name,
        updated_at = pg_catalog.now()
    WHERE id = p_lead_id;

    RETURN pg_catalog.jsonb_build_object('success', true, 'id', p_lead_id, 'updated_by', p_updated_by);
END;
$$;

-- Security Hardening: Revoke execution from public, anon, and authenticated roles
REVOKE ALL ON FUNCTION public.update_crm_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_crm_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.update_crm_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) FROM authenticated;

-- Grant execution strictly to service_role (authenticated Express backend)
GRANT EXECUTE ON FUNCTION public.update_crm_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- 6. RLS POLICIES & PERMISSION AUDIT ON LEADS_AND_INQUIRIES
-- -----------------------------------------------------------------------------
-- Ensure RLS is enabled on leads_and_inquiries
ALTER TABLE public.leads_and_inquiries ENABLE ROW LEVEL SECURITY;

-- Dynamic Audit & Cleanup: Drop EVERY existing policy on leads_and_inquiries regardless of name
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'leads_and_inquiries'
    LOOP
        EXECUTE pg_catalog.format('DROP POLICY IF EXISTS %I ON public.leads_and_inquiries', pol.policyname);
    END LOOP;
END;
$$;

-- PRIVILEGE HARDENING:
-- Deny SELECT, UPDATE, and DELETE from anon/public/authenticated (customer data privacy protected)
REVOKE ALL ON TABLE public.leads_and_inquiries FROM anon;
REVOKE ALL ON TABLE public.leads_and_inquiries FROM public;
REVOKE ALL ON TABLE public.leads_and_inquiries FROM authenticated;

-- Allow INSERT ONLY for anonymous and authenticated visitors (public website enquiry forms)
-- Absolutely NO SELECT, UPDATE, or DELETE privileges granted to anon or authenticated
GRANT INSERT ON TABLE public.leads_and_inquiries TO anon, authenticated;

-- Full table privileges granted exclusively to service_role (used by authenticated Express backend)
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

-- Explicitly ensure NO SELECT, UPDATE, or DELETE policy exists for anon, public, or authenticated.
-- Unauthorised queries directly to Supabase PostgREST return empty results (0 rows) or 403 Forbidden.

-- ==============================================================================
-- END OF FINAL PRODUCTION MIGRATION SCRIPT
-- ==============================================================================
