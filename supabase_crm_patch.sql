-- ==============================================================================
-- ROYAL EPIC INTERIORS — CRM PERMISSIONS & SECURITY LOCKDOWN PATCH
-- Subdomain: https://tele.royalepicinterior.com/
-- Target Database: Supabase PostgreSQL (Project ID: lwrfoztfsyffgtybesia)
--
-- PURPOSE:
-- 1. Revokes UPDATE and DELETE on leads_and_inquiries from anon, public, and authenticated.
-- 2. Drops any permissive UPDATE policies on leads_and_inquiries.
-- 3. Grants INSERT-only to anon and authenticated for public website forms (WRITE-ONLY).
-- 4. Restricts leads_and_inquiries and crm_call_logs exclusively to service_role.
-- 5. Defines update_crm_lead() and archive_crm_lead() SECURITY DEFINER functions with row locking.
-- 6. Restricts EXECUTE on both RPC functions exclusively to service_role.
-- ==============================================================================

-- 1. Drop old / insecure policies on leads_and_inquiries
DROP POLICY IF EXISTS "Allow update on leads_and_inquiries" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads_and_inquiries;
DROP POLICY IF EXISTS "Service role full access on leads_and_inquiries" ON public.leads_and_inquiries;

-- 2. Revoke all privileges from untrusted roles on leads_and_inquiries
REVOKE ALL ON TABLE public.leads_and_inquiries FROM anon;
REVOKE ALL ON TABLE public.leads_and_inquiries FROM public;
REVOKE ALL ON TABLE public.leads_and_inquiries FROM authenticated;

-- 3. Grant INSERT-only to anon and authenticated for website inquiry forms
GRANT INSERT ON TABLE public.leads_and_inquiries TO anon, authenticated;

-- 4. Grant full privileges to service_role (used exclusively by Express backend)
GRANT ALL ON TABLE public.leads_and_inquiries TO service_role;

-- 5. Re-create locked-down RLS policies on leads_and_inquiries
ALTER TABLE public.leads_and_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert leads"
ON public.leads_and_inquiries 
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Service role full access on leads_and_inquiries"
ON public.leads_and_inquiries 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Call logs lockdown (service_role only)
DROP POLICY IF EXISTS "Service role full access on crm_call_logs" ON public.crm_call_logs;
REVOKE ALL ON TABLE public.crm_call_logs FROM anon;
REVOKE ALL ON TABLE public.crm_call_logs FROM public;
REVOKE ALL ON TABLE public.crm_call_logs FROM authenticated;
GRANT ALL ON TABLE public.crm_call_logs TO service_role;

CREATE POLICY "Service role full access on crm_call_logs"
ON public.crm_call_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Secure archive_crm_lead RPC (Concurrency-safe with FOR UPDATE lock)
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

-- Revoke execute from public/anon/authenticated; Grant strictly to service_role
REVOKE ALL ON FUNCTION public.archive_crm_lead(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.archive_crm_lead(TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.archive_crm_lead(TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.archive_crm_lead(TEXT, TEXT, TEXT) TO service_role;

-- 8. Secure update_crm_lead RPC (Concurrency-safe with FOR UPDATE lock)
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

-- Revoke execute from public/anon/authenticated; Grant strictly to service_role
REVOKE ALL ON FUNCTION public.update_crm_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_crm_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.update_crm_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_crm_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) TO service_role;
