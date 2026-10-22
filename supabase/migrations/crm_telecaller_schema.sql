-- ==============================================================================
-- ROYAL EPIC INTERIORS — TELECALLER CRM DATABASE SCHEMA & RLS MIGRATION
-- Migration: crm_telecaller_schema.sql
-- Subdomain: https://tele.royalepicinteriors.com
--
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- This migration is strictly additive and does not modify any existing website tables.
-- ==============================================================================

-- 1. CRM USER PROFILES & ROLES TABLE
CREATE TABLE IF NOT EXISTS public.crm_user_profiles (
    id TEXT PRIMARY KEY, -- Matches auth.users.id or local unique ID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'telecaller')),
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_profiles_role ON public.crm_user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_crm_profiles_status ON public.crm_user_profiles(status);

-- 2. CRM LEADS TABLE
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id TEXT PRIMARY KEY DEFAULT ('TELE-' || floor(random() * 900000 + 100000)::text),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    normalized_phone TEXT NOT NULL,
    email TEXT,
    source TEXT NOT NULL DEFAULT 'Other' CHECK (source IN (
        'Justdial', 'IndiaMART', 'Facebook', 'Instagram', 
        'Website', 'Referral', 'Walk-in', 'Direct', 'Other'
    )),
    interested_service TEXT NOT NULL DEFAULT 'General Interior Consultation',
    city TEXT DEFAULT 'Bengaluru',
    budget TEXT,
    temperature TEXT NOT NULL DEFAULT 'Warm' CHECK (temperature IN ('Hot', 'Warm', 'Cold')),
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN (
        'New', 'Contacted', 'Follow-up', 'No Answer', 
        'Qualified', 'Site Visit', 'Quotation', 'Converted', 'Lost'
    )),
    notes TEXT,
    last_contact_at TIMESTAMPTZ,
    next_followup_date TIMESTAMPTZ,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Optimize search and dashboard filters
CREATE INDEX IF NOT EXISTS idx_crm_leads_normalized_phone ON public.crm_leads(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_temperature ON public.crm_leads(temperature);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON public.crm_leads(source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_followup ON public.crm_leads(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON public.crm_leads(created_at DESC);

-- 3. CRM CALL LOGS TABLE (Permanent historical records)
CREATE TABLE IF NOT EXISTS public.crm_call_logs (
    id TEXT PRIMARY KEY DEFAULT ('CALL-' || floor(random() * 9000000 + 1000000)::text),
    lead_id TEXT NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    call_datetime TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN (
        'Interested', 'No Answer', 'Busy', 'Call Back Requested', 
        'Not Interested', 'Wrong Number', 'Site Visit Requested', 'Converted'
    )),
    notes TEXT,
    followup_datetime TIMESTAMPTZ,
    logged_by TEXT NOT NULL, -- user email or id
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_call_logs_lead_id ON public.crm_call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_call_logs_datetime ON public.crm_call_logs(call_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_crm_call_logs_logged_by ON public.crm_call_logs(logged_by);

-- 4. CRM AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.crm_audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('AUD-' || floor(random() * 9000000 + 1000000)::text),
    action TEXT NOT NULL, -- e.g. 'DELETE_LEAD', 'CSV_IMPORT', 'ROLE_CHANGE', 'USER_CREATE'
    entity_type TEXT NOT NULL, -- e.g. 'lead', 'user', 'call_log'
    entity_id TEXT,
    user_id TEXT,
    user_email TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_created_at ON public.crm_audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.crm_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.crm_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.crm_user_profiles
    WHERE id = auth.uid()::text AND role = 'admin' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current authenticated user is active in CRM
CREATE OR REPLACE FUNCTION public.crm_is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.crm_user_profiles
    WHERE id = auth.uid()::text AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRM User Profiles Policies
CREATE POLICY "CRM active users can view user profiles"
ON public.crm_user_profiles FOR SELECT
TO authenticated
USING (public.crm_is_active_user());

CREATE POLICY "CRM admins can insert user profiles"
ON public.crm_user_profiles FOR INSERT
TO authenticated
WITH CHECK (public.crm_is_admin());

CREATE POLICY "CRM admins can update user profiles"
ON public.crm_user_profiles FOR UPDATE
TO authenticated
USING (public.crm_is_admin());

-- CRM Leads Policies
-- Both admin and telecaller can view all leads
CREATE POLICY "CRM active users can view all leads"
ON public.crm_leads FOR SELECT
TO authenticated
USING (public.crm_is_active_user());

-- Both admin and telecaller can insert leads
CREATE POLICY "CRM active users can insert leads"
ON public.crm_leads FOR INSERT
TO authenticated
WITH CHECK (public.crm_is_active_user());

-- Both admin and telecaller can update leads
CREATE POLICY "CRM active users can update leads"
ON public.crm_leads FOR UPDATE
TO authenticated
USING (public.crm_is_active_user());

-- ONLY ADMIN can delete leads
CREATE POLICY "CRM admins only can delete leads"
ON public.crm_leads FOR DELETE
TO authenticated
USING (public.crm_is_admin());

-- CRM Call Logs Policies
-- Both admin and telecaller can view all call logs
CREATE POLICY "CRM active users can view call logs"
ON public.crm_call_logs FOR SELECT
TO authenticated
USING (public.crm_is_active_user());

-- Both admin and telecaller can insert call logs
CREATE POLICY "CRM active users can insert call logs"
ON public.crm_call_logs FOR INSERT
TO authenticated
WITH CHECK (public.crm_is_active_user());

-- Call logs are permanent historical records: NO updates or deletes allowed
CREATE POLICY "Call logs cannot be modified"
ON public.crm_call_logs FOR UPDATE
TO authenticated
USING (false);

-- CRM Audit Logs Policies
CREATE POLICY "CRM admins can view audit logs"
ON public.crm_audit_logs FOR SELECT
TO authenticated
USING (public.crm_is_admin());

CREATE POLICY "CRM system can insert audit logs"
ON public.crm_audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Seed initial admin if not present
INSERT INTO public.crm_user_profiles (id, email, name, role, status)
VALUES 
('admin-root-01', 'royalepicfurnitur1@gmail.com', 'Royal Epic Executive Admin', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'active';
