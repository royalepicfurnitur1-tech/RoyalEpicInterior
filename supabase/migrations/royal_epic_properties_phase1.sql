-- ==============================================================================
-- ROYAL EPIC PROPERTIES (PHASE 1) — TELECALLER CRM SUPABASE MIGRATION
-- File: supabase/migrations/royal_epic_properties_phase1.sql
-- Vertical: Royal Epic Properties (A vertical of Royal Epic Interiors)
--
-- SAFETY & NON-DESTRUCTIVE GUARANTEES:
-- 1. 100% additive & idempotent: Does NOT alter, rename, drop, or modify
--    `public.leads_and_inquiries`, `public.products`, `public.orders`,
--    `public.catalog_products`, or any existing Interior CRM tables.
-- 2. Provisions all 9 dedicated tables for the Royal Epic Properties module:
--    - public.property_leads
--    - public.property_call_logs
--    - public.properties
--    - public.property_images
--    - public.property_activities
--    - public.property_tenant_enquiries
--    - public.property_site_visits
--    - public.property_deals
--    - public.property_payments
-- 3. Configures Supabase Storage buckets (`property-media` public for listing photos,
--    `property-documents` strictly private for owner verification documents).
-- 4. Safe to run on both a fresh database and an existing database where the initial
--    Phase 1 tables were already created (uses CREATE TABLE IF NOT EXISTS and
--    non-destructive constraint/column upgrades).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROPERTY LEADS TABLE (public.property_leads)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_leads (
    id TEXT PRIMARY KEY,
    date_received DATE NOT NULL DEFAULT CURRENT_DATE,
    sales_executive_name TEXT,
    telecaller_id TEXT,
    telecaller_name TEXT,
    owner_name TEXT NOT NULL,
    owner_mobile TEXT NOT NULL,
    normalized_owner_mobile TEXT NOT NULL,
    alternate_mobile TEXT,
    location_locality TEXT,
    property_category TEXT DEFAULT 'Residential' CHECK (property_category IN ('Residential', 'Commercial')),
    property_type TEXT,
    expected_rent NUMERIC DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'Sales Executive' CHECK (source IN ('Sales Executive', 'Direct Owner', 'Referral', 'Other')),
    initial_notes TEXT,
    board_photo_url TEXT,
    lead_status TEXT NOT NULL DEFAULT 'New Lead' CHECK (
        lead_status IN (
            'New Lead',
            'First Call Pending',
            'Owner Contacted',
            'Interested',
            'Details Pending',
            'Follow-up Required',
            'Verification Pending',
            'Approved',
            'Rejected',
            'Not Available'
        )
    ),
    last_contact_at TIMESTAMPTZ,
    next_followup_date TEXT,
    followup_notes TEXT,
    owner_interested TEXT DEFAULT 'Not Sure' CHECK (owner_interested IN ('Yes', 'No', 'Not Sure')),
    property_available TEXT DEFAULT 'Not Confirmed' CHECK (property_available IN ('Yes', 'No', 'Not Confirmed')),
    details_collected TEXT DEFAULT 'No' CHECK (details_collected IN ('Yes', 'Partially', 'No')),
    property_id TEXT,
    -- Future Sales Executive App Integration Readiness Fields (Phase 2+)
    external_source_lead_id TEXT,
    source_application TEXT DEFAULT 'Manual Telecaller Entry',
    original_sales_executive_id TEXT,
    original_sales_executive_name TEXT,
    original_submission_date TIMESTAMPTZ,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT,
    created_by_name TEXT,
    updated_by TEXT,
    updated_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_leads_mobile ON public.property_leads(normalized_owner_mobile);
CREATE INDEX IF NOT EXISTS idx_property_leads_owner_name ON public.property_leads(owner_name);
CREATE INDEX IF NOT EXISTS idx_property_leads_locality ON public.property_leads(location_locality);
CREATE INDEX IF NOT EXISTS idx_property_leads_type ON public.property_leads(property_type);
CREATE INDEX IF NOT EXISTS idx_property_leads_status ON public.property_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_property_leads_telecaller ON public.property_leads(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_property_leads_sales_exec ON public.property_leads(sales_executive_name);
CREATE INDEX IF NOT EXISTS idx_property_leads_date_received ON public.property_leads(date_received DESC);
CREATE INDEX IF NOT EXISTS idx_property_leads_next_followup ON public.property_leads(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_property_leads_external_id ON public.property_leads(external_source_lead_id);

-- ------------------------------------------------------------------------------
-- 2. PROPERTY CALL LOGS TABLE (public.property_call_logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_call_logs (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES public.property_leads(id) ON DELETE CASCADE,
    property_id TEXT,
    call_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    call_outcome TEXT NOT NULL CHECK (
        call_outcome IN (
            'Connected',
            'Not Answered',
            'Switched Off',
            'Busy',
            'Call Back Requested',
            'Owner Interested',
            'Not Interested',
            'Property Already Rented',
            'Wrong Number'
        )
    ),
    call_notes TEXT,
    owner_interested TEXT NOT NULL DEFAULT 'Not Sure' CHECK (owner_interested IN ('Yes', 'No', 'Not Sure')),
    property_available TEXT NOT NULL DEFAULT 'Not Confirmed' CHECK (property_available IN ('Yes', 'No', 'Not Confirmed')),
    details_collected TEXT NOT NULL DEFAULT 'No' CHECK (details_collected IN ('Yes', 'Partially', 'No')),
    next_followup_date TEXT,
    followup_notes TEXT,
    logged_by TEXT,
    logged_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_call_logs_lead_id ON public.property_call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_property_call_logs_datetime ON public.property_call_logs(call_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_property_call_logs_outcome ON public.property_call_logs(call_outcome);

-- ------------------------------------------------------------------------------
-- 3. COMPLETE PROPERTIES & LISTINGS TABLE (public.properties)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY,
    lead_id TEXT UNIQUE NOT NULL REFERENCES public.property_leads(id) ON DELETE RESTRICT,
    property_title TEXT NOT NULL,
    property_category TEXT NOT NULL DEFAULT 'Residential' CHECK (property_category IN ('Residential', 'Commercial')),
    property_type TEXT NOT NULL,
    bhk_configuration TEXT,
    full_address TEXT,
    locality TEXT,
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    pin_code TEXT,
    expected_monthly_rent NUMERIC NOT NULL DEFAULT 0,
    security_deposit NUMERIC NOT NULL DEFAULT 0,
    maintenance_charges NUMERIC NOT NULL DEFAULT 0,
    other_charges TEXT,
    rent_negotiable TEXT NOT NULL DEFAULT 'Yes' CHECK (rent_negotiable IN ('Yes', 'No')),
    deposit_negotiable TEXT NOT NULL DEFAULT 'Yes' CHECK (deposit_negotiable IN ('Yes', 'No')),
    built_up_area NUMERIC,
    carpet_area NUMERIC,
    furnishing_status TEXT NOT NULL DEFAULT 'Semi Furnished' CHECK (furnishing_status IN ('Fully Furnished', 'Semi Furnished', 'Unfurnished')),
    bedrooms INT DEFAULT 0,
    bathrooms INT DEFAULT 0,
    balconies INT DEFAULT 0,
    floor_number TEXT,
    total_floors TEXT,
    lift_available TEXT DEFAULT 'No' CHECK (lift_available IN ('Yes', 'No')),
    parking_availability TEXT,
    available_from_date TEXT,
    property_description TEXT,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Owner Information
    owner_full_name TEXT NOT NULL,
    owner_primary_mobile TEXT NOT NULL,
    owner_alternate_mobile TEXT,
    owner_email TEXT,
    preferred_contact_time TEXT,
    relationship_to_property TEXT NOT NULL DEFAULT 'Owner' CHECK (relationship_to_property IN ('Owner', 'Authorised Representative', 'Other')),
    -- Verification
    owner_identity_verified TEXT NOT NULL DEFAULT 'Pending' CHECK (owner_identity_verified IN ('Yes', 'No', 'Pending')),
    ownership_auth_confirmed TEXT NOT NULL DEFAULT 'Pending' CHECK (ownership_auth_confirmed IN ('Yes', 'No', 'Pending')),
    availability_confirmed TEXT NOT NULL DEFAULT 'Pending' CHECK (availability_confirmed IN ('Yes', 'No', 'Pending')),
    permission_to_advertise TEXT NOT NULL DEFAULT 'Pending' CHECK (permission_to_advertise IN ('Yes', 'No', 'Pending')),
    verification_notes TEXT,
    verified_by TEXT,
    verified_by_name TEXT,
    verification_date TIMESTAMPTZ,
    -- Listing Status & Approval History
    listing_status TEXT NOT NULL DEFAULT 'Draft' CHECK (
        listing_status IN (
            'Draft',
            'Details Pending',
            'Verification Pending',
            'Approved',
            'Approved for Website',
            'Ready to Publish',
            'Published',
            'Unpublished',
            'Occupied',
            'Rented',
            'Unavailable',
            'Rejected',
            'Archived'
        )
    ),
    approved_by TEXT,
    approved_by_name TEXT,
    approved_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejected_by_name TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    approval_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT,
    created_by_name TEXT,
    updated_by TEXT,
    updated_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Non-destructive constraint upgrade if table already existed
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_listing_status_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_listing_status_check CHECK (
    listing_status IN (
        'Draft',
        'Details Pending',
        'Verification Pending',
        'Approved',
        'Approved for Website',
        'Ready to Publish',
        'Published',
        'Unpublished',
        'Occupied',
        'Rented',
        'Unavailable',
        'Rejected',
        'Archived'
    )
);

CREATE INDEX IF NOT EXISTS idx_properties_lead_id ON public.properties(lead_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_status ON public.properties(listing_status);
CREATE INDEX IF NOT EXISTS idx_properties_locality ON public.properties(locality);
CREATE INDEX IF NOT EXISTS idx_properties_category ON public.properties(property_category);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(property_type);

-- ------------------------------------------------------------------------------
-- 4. PROPERTY PHOTOS & DOCUMENTS TABLE (public.property_images)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_images (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES public.property_leads(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (
        category IN (
            'Exterior Photos',
            'Living Room',
            'Bedrooms',
            'Kitchen',
            'Bathrooms',
            'Balcony',
            'Other Areas',
            'To-Let Board',
            'Additional Documents'
        )
    ),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT,
    is_private_document BOOLEAN NOT NULL DEFAULT false,
    private_payload TEXT,
    mime_type TEXT,
    uploaded_by TEXT,
    uploaded_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_lead_id ON public.property_images(lead_id);
CREATE INDEX IF NOT EXISTS idx_property_images_category ON public.property_images(category);

-- ------------------------------------------------------------------------------
-- 5. PROPERTY ACTIVITY & AUDIT TRAIL TABLE (public.property_activities)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    property_id TEXT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    performed_by TEXT,
    performed_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_activities_lead_id ON public.property_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_property_activities_property_id ON public.property_activities(property_id);
CREATE INDEX IF NOT EXISTS idx_property_activities_created_at ON public.property_activities(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. TENANT ENQUIRIES TABLE (public.property_tenant_enquiries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_tenant_enquiries (
    id TEXT PRIMARY KEY,
    enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tenant_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    normalized_mobile TEXT NOT NULL,
    email TEXT,
    interested_property_id TEXT,
    interested_property_title TEXT,
    preferred_location TEXT,
    property_type TEXT,
    budget NUMERIC DEFAULT 0,
    requirements TEXT,
    enquiry_source TEXT DEFAULT 'Direct Call',
    assigned_staff_id TEXT,
    assigned_staff_name TEXT,
    enquiry_status TEXT NOT NULL DEFAULT 'New Enquiry' CHECK (
        enquiry_status IN (
            'New Enquiry',
            'Contacted',
            'Site Visit Scheduled',
            'Site Visit Required',
            'Visited',
            'Interested',
            'Not Interested',
            'Negotiation',
            'Converted',
            'Deal Completed',
            'Lost',
            'Closed'
        )
    ),
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT,
    created_by_name TEXT,
    updated_by TEXT,
    updated_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Non-destructive constraint upgrade if table already existed
ALTER TABLE public.property_tenant_enquiries DROP CONSTRAINT IF EXISTS property_tenant_enquiries_enquiry_status_check;
ALTER TABLE public.property_tenant_enquiries ADD CONSTRAINT property_tenant_enquiries_enquiry_status_check CHECK (
    enquiry_status IN (
        'New Enquiry',
        'Contacted',
        'Site Visit Scheduled',
        'Site Visit Required',
        'Visited',
        'Interested',
        'Not Interested',
        'Negotiation',
        'Converted',
        'Deal Completed',
        'Lost',
        'Closed'
    )
);

CREATE INDEX IF NOT EXISTS idx_tenant_enquiries_status ON public.property_tenant_enquiries(enquiry_status);
CREATE INDEX IF NOT EXISTS idx_tenant_enquiries_mobile ON public.property_tenant_enquiries(normalized_mobile);
CREATE INDEX IF NOT EXISTS idx_tenant_enquiries_property ON public.property_tenant_enquiries(interested_property_id);

-- ------------------------------------------------------------------------------
-- 7. SITE VISITS TABLE (public.property_site_visits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_site_visits (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    property_title TEXT,
    lead_id TEXT,
    enquiry_id TEXT,
    tenant_name TEXT NOT NULL,
    tenant_contact TEXT NOT NULL,
    owner_name TEXT,
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    assigned_staff_id TEXT,
    assigned_staff_name TEXT,
    visit_status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (
        visit_status IN (
            'Scheduled',
            'Confirmed',
            'Completed',
            'Rescheduled',
            'Cancelled',
            'No Show'
        )
    ),
    visit_feedback TEXT,
    owner_feedback TEXT,
    next_action TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT,
    created_by_name TEXT,
    updated_by TEXT,
    updated_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_site_visits_property ON public.property_site_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_property_site_visits_status ON public.property_site_visits(visit_status);
CREATE INDEX IF NOT EXISTS idx_property_site_visits_date ON public.property_site_visits(scheduled_date DESC);

-- ------------------------------------------------------------------------------
-- 8. RENTAL DEALS & PLACEMENT FEES TABLE (public.property_deals)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_deals (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    property_title TEXT,
    lead_id TEXT,
    owner_name TEXT NOT NULL,
    tenant_name TEXT NOT NULL,
    tenant_mobile TEXT NOT NULL,
    monthly_rent NUMERIC NOT NULL DEFAULT 0,
    security_deposit NUMERIC NOT NULL DEFAULT 0,
    agreement_date TEXT,
    move_in_date TEXT,
    placement_fee NUMERIC NOT NULL DEFAULT 0,
    placement_fee_payer TEXT NOT NULL DEFAULT 'Tenant',
    amount_due NUMERIC NOT NULL DEFAULT 0,
    amount_received NUMERIC NOT NULL DEFAULT 0,
    payment_date TEXT,
    payment_mode TEXT,
    transaction_reference TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (
        payment_status IN (
            'Pending',
            'Payment Pending',
            'Partially Paid',
            'Paid',
            'Cancelled'
        )
    ),
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT,
    created_by_name TEXT,
    updated_by TEXT,
    updated_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Non-destructive constraint upgrade if table already existed
ALTER TABLE public.property_deals DROP CONSTRAINT IF EXISTS property_deals_payment_status_check;
ALTER TABLE public.property_deals ADD CONSTRAINT property_deals_payment_status_check CHECK (
    payment_status IN (
        'Pending',
        'Payment Pending',
        'Partially Paid',
        'Paid',
        'Cancelled'
    )
);

CREATE INDEX IF NOT EXISTS idx_property_deals_property ON public.property_deals(property_id);
CREATE INDEX IF NOT EXISTS idx_property_deals_status ON public.property_deals(payment_status);
CREATE INDEX IF NOT EXISTS idx_property_deals_agreement_date ON public.property_deals(agreement_date DESC);

-- ------------------------------------------------------------------------------
-- 9. PLACEMENT FEE PAYMENT HISTORY TABLE (public.property_payments)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_payments (
    id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL REFERENCES public.property_deals(id) ON DELETE CASCADE,
    property_id TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_date TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    transaction_reference TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Paid',
    notes TEXT,
    recorded_by TEXT,
    recorded_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_payments_deal_id ON public.property_payments(deal_id);
CREATE INDEX IF NOT EXISTS idx_property_payments_date ON public.property_payments(payment_date DESC);

-- ------------------------------------------------------------------------------
-- 10. GRANTS & ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_leads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_call_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_activities TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_tenant_enquiries TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_site_visits TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_deals TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_payments TO anon, authenticated;

ALTER TABLE public.property_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_tenant_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_payments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'property_leads',
        'property_call_logs',
        'properties',
        'property_images',
        'property_activities',
        'property_tenant_enquiries',
        'property_site_visits',
        'property_deals',
        'property_payments'
    ]
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow CRM access on %I" ON public.%I;', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "Allow CRM access on %I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);',
            tbl, tbl
        );
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 11. SUPABASE STORAGE BUCKETS & POLICIES
-- `property-media`: Public bucket for property photos & To-Let boards
-- `property-documents`: Private bucket for owner verification documents
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('property-media', 'property-media', true),
    ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public read access for property-media" ON storage.objects;
CREATE POLICY "Public read access for property-media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'property-media');

DROP POLICY IF EXISTS "CRM upload access for property-media" ON storage.objects;
CREATE POLICY "CRM upload access for property-media"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'property-media');

DROP POLICY IF EXISTS "CRM update access for property-media" ON storage.objects;
CREATE POLICY "CRM update access for property-media"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'property-media');

DROP POLICY IF EXISTS "CRM delete access for property-media" ON storage.objects;
CREATE POLICY "CRM delete access for property-media"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'property-media');
