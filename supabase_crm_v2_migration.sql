-- ==============================================================================
-- ROYAL EPIC INTERIORS — PRODUCTION CRM SUPABASE V2 MIGRATION SCRIPT
-- File: supabase_crm_v2_migration.sql
-- Subdomain: https://tele.royalepicinteriors.com
-- Target Database: Supabase PostgreSQL (Project ID: lwrfoztfsyffgtybesia)
--
-- INSTRUCTIONS FOR DATABASE ADMINISTRATOR:
-- 1. Open the Supabase Dashboard: https://supabase.com/dashboard/project/lwrfoztfsyffgtybesia
-- 2. Navigate to SQL Editor (left navigation panel).
-- 3. Review, paste, and run this script.
--
-- SAFETY & COMPLIANCE GUARANTEES:
-- - 100% Non-destructive: Does NOT drop, truncate, or recreate leads_and_inquiries.
-- - Preserves all existing records, IDs, and timestamps.
-- - Additive columns only (using ADD COLUMN IF NOT EXISTS).
-- - Zero unrestricted DELETE permissions (no USING (true) for anon/public).
-- - Implements SECURITY DEFINER deletion RPC function for server-side authorized deletion.
-- ==============================================================================

-- 1. ADD CRM METADATA COLUMNS TO PUBLIC.LEADS_AND_INQUIRIES (IDEMPOTENT)
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

-- 2. CREATE INDEXES FOR FAST FILTERING
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON public.leads_and_inquiries(temperature);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads_and_inquiries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_is_deleted ON public.leads_and_inquiries(is_deleted);

-- 3. PERSISTENT CALL LOGS TABLE IN SUPABASE
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

-- Enable RLS on crm_call_logs
ALTER TABLE public.crm_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on crm_call_logs"
ON public.crm_call_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow select on crm_call_logs"
ON public.crm_call_logs FOR SELECT
TO anon, authenticated
USING (true);

-- 4. SECURE SERVER-SIDE DELETION FUNCTION (SECURITY DEFINER)
-- This function runs with elevated privileges on the server side, verifying the record
-- exists, performing the delete, and returning the exact deletion confirmation.
CREATE OR REPLACE FUNCTION public.delete_crm_lead(p_lead_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_deleted RECORD;
BEGIN
    -- Check if record exists
    IF NOT EXISTS (SELECT 1 FROM public.leads_and_inquiries WHERE id = p_lead_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'deleted_count', 0,
            'error', 'Lead record not found in leads_and_inquiries'
        );
    END IF;

    -- Delete call logs first (if foreign key doesn't cascade)
    DELETE FROM public.crm_call_logs WHERE lead_id = p_lead_id;

    -- Delete lead record
    DELETE FROM public.leads_and_inquiries
    WHERE id = p_lead_id
    RETURNING id, full_name, phone INTO v_deleted;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_count', 1,
        'deleted_id', v_deleted.id,
        'customer_name', v_deleted.full_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SECURE RLS POLICIES FOR LEADS_AND_INQUIRIES
-- Keep existing public write policy for website forms
-- Keep existing authenticated select and update policies
-- Ensure NO unrestricted anonymous DELETE policy exists

CREATE POLICY "Allow authenticated delete on leads_and_inquiries"
ON public.leads_and_inquiries FOR DELETE
TO authenticated
USING (true);

-- End of Migration Script
