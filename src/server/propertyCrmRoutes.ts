import express, { Request, Response, NextFunction } from 'express';
import { extractUserFromReq, normalizePhone, getIstDateString, ServerCrmUser } from './crmRoutes';

export const propertyCrmRouter = express.Router();

const getSupabaseCredentials = () => {
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://lwrfoztfsyffgtybesia.supabase.co';
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc';
  return { url: url.replace(/\/+$/, ''), key };
};

// -----------------------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE (Reuses existing Telecaller CRM staff session)
// All active authorised CRM staff (admin & telecaller) have full access.
// -----------------------------------------------------------------------------
function requirePropertyStaffAuth(req: Request, res: Response, next: NextFunction) {
  const user = extractUserFromReq(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Please log in to the Telecaller CRM.'
    });
  }
  (req as any).crmUser = user;
  next();
}

propertyCrmRouter.use(requirePropertyStaffAuth);

// -----------------------------------------------------------------------------
// AUTHORITATIVE SUPABASE DEDICATED TABLE ADAPTER
// Uses the 9 dedicated Supabase PostgreSQL tables exclusively:
//   1. public.property_leads
//   2. public.property_call_logs
//   3. public.properties
//   4. public.property_images
//   5. public.property_activities
//   6. public.property_tenant_enquiries
//   7. public.property_site_visits
//   8. public.property_deals
//   9. public.property_payments
// Never uses public.catalog_products, local JSON files, or localStorage.
// -----------------------------------------------------------------------------
type PropertyTableName =
  | 'property_leads'
  | 'property_call_logs'
  | 'properties'
  | 'property_images'
  | 'property_activities'
  | 'property_tenant_enquiries'
  | 'property_site_visits'
  | 'property_deals'
  | 'property_payments';

const DEDICATED_TABLE_COLUMNS: Record<PropertyTableName, readonly string[]> = {
  property_leads: [
    'id',
    'date_received',
    'sales_executive_name',
    'telecaller_id',
    'telecaller_name',
    'owner_name',
    'owner_mobile',
    'normalized_owner_mobile',
    'alternate_mobile',
    'location_locality',
    'property_category',
    'property_type',
    'expected_rent',
    'source',
    'initial_notes',
    'board_photo_url',
    'lead_status',
    'last_contact_at',
    'next_followup_date',
    'followup_notes',
    'owner_interested',
    'property_available',
    'details_collected',
    'property_id',
    'external_source_lead_id',
    'source_application',
    'original_sales_executive_id',
    'original_sales_executive_name',
    'original_submission_date',
    'is_archived',
    'created_by',
    'created_by_name',
    'updated_by',
    'updated_by_name',
    'created_at',
    'updated_at'
  ],
  property_call_logs: [
    'id',
    'lead_id',
    'property_id',
    'call_datetime',
    'call_outcome',
    'call_notes',
    'owner_interested',
    'property_available',
    'details_collected',
    'next_followup_date',
    'followup_notes',
    'logged_by',
    'logged_by_name',
    'created_at'
  ],
  properties: [
    'id',
    'lead_id',
    'property_title',
    'property_category',
    'property_type',
    'bhk_configuration',
    'full_address',
    'locality',
    'city',
    'pin_code',
    'expected_monthly_rent',
    'security_deposit',
    'maintenance_charges',
    'other_charges',
    'rent_negotiable',
    'deposit_negotiable',
    'built_up_area',
    'carpet_area',
    'furnishing_status',
    'bedrooms',
    'bathrooms',
    'balconies',
    'floor_number',
    'total_floors',
    'lift_available',
    'parking_availability',
    'available_from_date',
    'property_description',
    'amenities',
    'owner_full_name',
    'owner_primary_mobile',
    'owner_alternate_mobile',
    'owner_email',
    'preferred_contact_time',
    'relationship_to_property',
    'owner_identity_verified',
    'ownership_auth_confirmed',
    'availability_confirmed',
    'permission_to_advertise',
    'verification_notes',
    'verified_by',
    'verified_by_name',
    'verification_date',
    'listing_status',
    'approved_by',
    'approved_by_name',
    'approved_at',
    'rejected_by',
    'rejected_by_name',
    'rejected_at',
    'rejection_reason',
    'approval_history',
    'is_archived',
    'created_by',
    'created_by_name',
    'updated_by',
    'updated_by_name',
    'created_at',
    'updated_at'
  ],
  property_images: [
    'id',
    'property_id',
    'lead_id',
    'category',
    'file_name',
    'file_url',
    'storage_path',
    'is_private_document',
    'private_payload',
    'mime_type',
    'uploaded_by',
    'uploaded_by_name',
    'created_at'
  ],
  property_activities: [
    'id',
    'lead_id',
    'property_id',
    'entity_type',
    'entity_id',
    'action',
    'description',
    'previous_status',
    'new_status',
    'metadata',
    'performed_by',
    'performed_by_name',
    'created_at'
  ],
  property_tenant_enquiries: [
    'id',
    'enquiry_date',
    'tenant_name',
    'mobile_number',
    'normalized_mobile',
    'email',
    'interested_property_id',
    'interested_property_title',
    'preferred_location',
    'property_type',
    'budget',
    'requirements',
    'enquiry_source',
    'assigned_staff_id',
    'assigned_staff_name',
    'enquiry_status',
    'notes',
    'is_archived',
    'created_by',
    'created_by_name',
    'updated_by',
    'updated_by_name',
    'created_at',
    'updated_at'
  ],
  property_site_visits: [
    'id',
    'property_id',
    'property_title',
    'lead_id',
    'enquiry_id',
    'tenant_name',
    'tenant_contact',
    'owner_name',
    'scheduled_date',
    'scheduled_time',
    'assigned_staff_id',
    'assigned_staff_name',
    'visit_status',
    'visit_feedback',
    'owner_feedback',
    'next_action',
    'is_archived',
    'created_by',
    'created_by_name',
    'updated_by',
    'updated_by_name',
    'created_at',
    'updated_at'
  ],
  property_deals: [
    'id',
    'property_id',
    'property_title',
    'lead_id',
    'owner_name',
    'tenant_name',
    'tenant_mobile',
    'monthly_rent',
    'security_deposit',
    'agreement_date',
    'move_in_date',
    'placement_fee',
    'placement_fee_payer',
    'amount_due',
    'amount_received',
    'payment_date',
    'payment_mode',
    'transaction_reference',
    'payment_status',
    'notes',
    'is_archived',
    'created_by',
    'created_by_name',
    'updated_by',
    'updated_by_name',
    'created_at',
    'updated_at'
  ],
  property_payments: [
    'id',
    'deal_id',
    'property_id',
    'amount',
    'payment_date',
    'payment_mode',
    'transaction_reference',
    'payment_status',
    'notes',
    'recorded_by',
    'recorded_by_name',
    'created_at'
  ]
};

function parseNumericOrNull(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function encodeEnquiryMetadataInNotes(notes: string | undefined, extra?: Record<string, any>): string | undefined {
  const cleanNotes = (notes || '').replace(/\s*\[REP_META:[^\]]+\]/g, '').trim();
  const meta: Record<string, any> = {};
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') meta[k] = v;
    });
  }
  if (Object.keys(meta).length === 0) return cleanNotes || undefined;
  const tag = `[REP_META:${Buffer.from(JSON.stringify(meta)).toString('base64')}]`;
  return cleanNotes ? `${cleanNotes} ${tag}` : tag;
}

function decodeEnquiryMetadataFromNotes(notes: string | undefined | null): {
  cleanNotes: string;
  meta: Record<string, any>;
} {
  if (!notes) return { cleanNotes: '', meta: {} };
  const match = notes.match(/\[REP_META:([^\]]+)\]/);
  let meta: Record<string, any> = {};
  if (match && match[1]) {
    try {
      meta = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
    } catch (_) {}
  }
  const cleanNotes = notes.replace(/\s*\[REP_META:[^\]]+\]/g, '').trim();
  return { cleanNotes, meta };
}

function sanitizeRecordForDedicatedTable(table: PropertyTableName, raw: Record<string, any>): Record<string, any> {
  const rec = { ...raw };

  if (table === 'properties') {
    rec.built_up_area = parseNumericOrNull(rec.built_up_area);
    rec.carpet_area = parseNumericOrNull(rec.carpet_area);
  } else if (table === 'property_tenant_enquiries') {
    rec.notes = encodeEnquiryMetadataInNotes(rec.notes, {
      lead_id: rec.lead_id,
      move_in_date: rec.move_in_date,
      family_or_company_profile: rec.family_or_company_profile,
      budget_range: rec.budget_range
    });
  } else if (table === 'property_site_visits') {
    if (rec.tenant_feedback !== undefined && !rec.visit_feedback) {
      rec.visit_feedback = rec.tenant_feedback;
    }
  }

  const allowedCols = DEDICATED_TABLE_COLUMNS[table];
  const projected: Record<string, any> = {};
  for (const col of allowedCols) {
    if (rec[col] !== undefined) {
      projected[col] = rec[col];
    }
  }
  return projected;
}

async function sbSelectAll<T = any>(table: PropertyTableName): Promise<T[]> {
  const { url, key } = getSupabaseCredentials();
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const res = await fetch(`${url}/rest/v1/${table}?select=*&order=created_at.desc&limit=5000`, {
    method: 'GET',
    headers
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown Supabase error');
    throw new Error(`Supabase SELECT error on dedicated table ${table} (HTTP ${res.status}): ${errText}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

async function sbSelectById<T = any>(table: PropertyTableName, id: string): Promise<T | null> {
  const { url, key } = getSupabaseCredentials();
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const res = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    method: 'GET',
    headers
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown Supabase error');
    throw new Error(`Supabase SELECT by ID error on dedicated table ${table} (HTTP ${res.status}): ${errText}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? (rows[0] as T) : null;
}

async function sbUpsert<T extends { id: string }>(
  table: PropertyTableName,
  record: T,
  _foreignKeyHint?: string
): Promise<T> {
  const { url, key } = getSupabaseCredentials();
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation'
  };

  const payload = sanitizeRecordForDedicatedTable(table, record as Record<string, any>);
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown Supabase error');
    throw new Error(`Supabase WRITE error on dedicated table ${table} (HTTP ${res.status}): ${errText}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? (rows[0] as T) : (payload as T);
}

async function sbDeleteById(table: PropertyTableName, id: string): Promise<void> {
  const { url, key } = getSupabaseCredentials();
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=minimal'
  };

  const res = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown Supabase error');
    throw new Error(`Supabase DELETE error on dedicated table ${table} (HTTP ${res.status}): ${errText}`);
  }
}

// -----------------------------------------------------------------------------
// FUTURE WEBSITE INTEGRATION READINESS (Phase 2+)
// Returns ONLY verified, approved, and published properties with public media.
// Private owner documents and internal verification notes are strictly excluded.
// -----------------------------------------------------------------------------
export async function getApprovedPublishedPropertiesForWebsite() {
  const [allProps, allImages] = await Promise.all([
    sbSelectAll('properties'),
    sbSelectAll('property_images')
  ]);

  return allProps
    .filter((p: any) => {
      if (p.is_archived) return false;
      const isVerified =
        p.owner_identity_verified === 'Yes' &&
        (p.ownership_auth_confirmed === 'Yes' || p.ownership_confirmed === 'Yes') &&
        (p.availability_confirmed === 'Yes' || p.property_availability_confirmed === 'Yes') &&
        p.permission_to_advertise === 'Yes';
      const isPublishedOrApproved = ['Approved', 'Ready to Publish', 'Published'].includes(p.listing_status);
      return isVerified && isPublishedOrApproved;
    })
    .map((p: any) => {
      const publicPhotos = allImages
        .filter((img: any) => (img.property_id === p.id || img.lead_id === p.lead_id) && !img.is_private_document)
        .map((img: any) => ({
          id: img.id,
          category: img.category,
          file_name: img.file_name,
          url: img.file_url
        }));
      return {
        id: p.id,
        property_code: p.id,
        property_title: p.property_title,
        property_category: p.property_category,
        property_type: p.property_type,
        bhk_configuration: p.bhk_configuration,
        locality: p.locality,
        city: p.city,
        pin_code: p.pin_code,
        expected_monthly_rent: p.expected_monthly_rent,
        security_deposit: p.security_deposit,
        maintenance_charges: p.maintenance_charges,
        rent_negotiable: p.rent_negotiable,
        deposit_negotiable: p.deposit_negotiable,
        built_up_area: p.built_up_area,
        carpet_area: p.carpet_area,
        furnishing_status: p.furnishing_status,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        balconies: p.balconies,
        floor_number: p.floor_number,
        total_floors: p.total_floors,
        lift_available: p.lift_available,
        parking_availability: p.parking_availability,
        available_from_date: p.available_from_date,
        property_description: p.property_description,
        amenities: p.amenities || [],
        listing_status: p.listing_status,
        photos: publicPhotos,
        approved_at: p.approved_at,
        updated_at: p.updated_at
      };
    });
}

// -----------------------------------------------------------------------------
// ID GENERATORS & ACTIVITY LOGGING HELPER
// -----------------------------------------------------------------------------
function generateUniqueId(prefix: string): string {
  const now = new Date();
  const ym = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${ym}-${rand}`;
}

async function recordPropertyActivity(params: {
  lead_id?: string;
  property_id?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  previous_status?: string;
  new_status?: string;
  metadata?: Record<string, any>;
  user: ServerCrmUser;
}) {
  const activity = {
    id: generateUniqueId('REP-ACT'),
    lead_id: params.lead_id || undefined,
    property_id: params.property_id || undefined,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    action: params.action,
    description: params.description,
    previous_status: params.previous_status || undefined,
    new_status: params.new_status || undefined,
    metadata: params.metadata || {},
    performed_by: params.user.id,
    performed_by_name: params.user.name,
    created_at: new Date().toISOString()
  };
  await sbUpsert('property_activities', activity, params.lead_id || params.property_id);
  return formatActivityAliases(activity);
}

function formatLeadAliases(lead: any) {
  if (!lead) return lead;
  const rent = lead.approx_expected_rent ?? lead.expected_rent ?? 0;
  return {
    ...lead,
    lead_code: lead.lead_code || lead.id,
    property_location: lead.property_location || lead.location_locality || '',
    location_locality: lead.location_locality || lead.property_location || '',
    approx_expected_rent: rent,
    expected_rent: rent,
    last_contact_date: lead.last_contact_date || lead.last_contact_at || null,
    last_contact_at: lead.last_contact_at || lead.last_contact_date || null
  };
}

function formatCallAliases(call: any) {
  if (!call) return call;
  const dt = call.call_date_time || call.call_datetime || call.created_at;
  return {
    ...call,
    call_datetime: dt,
    call_date_time: dt,
    staff_name: call.staff_name || call.logged_by_name || 'Telecaller'
  };
}

function formatPropertyAliases(prop: any) {
  if (!prop) return prop;
  const ownership = prop.ownership_confirmed || prop.ownership_auth_confirmed || 'Pending';
  const avail = prop.property_availability_confirmed || prop.availability_confirmed || 'Pending';
  return {
    ...prop,
    property_code: prop.property_code || prop.id,
    full_property_address: prop.full_property_address || prop.full_address || '',
    full_address: prop.full_address || prop.full_property_address || '',
    primary_mobile: prop.primary_mobile || prop.owner_primary_mobile || '',
    owner_primary_mobile: prop.owner_primary_mobile || prop.primary_mobile || '',
    alternate_mobile: prop.alternate_mobile || prop.owner_alternate_mobile || '',
    owner_alternate_mobile: prop.owner_alternate_mobile || prop.alternate_mobile || '',
    email_address: prop.email_address || prop.owner_email || '',
    owner_email: prop.owner_email || prop.email_address || '',
    ownership_confirmed: ownership,
    ownership_auth_confirmed: ownership,
    property_availability_confirmed: avail,
    availability_confirmed: avail
  };
}

function formatImageAliases(img: any) {
  if (!img) return img;
  const clean = { ...img };
  delete clean.private_payload;
  return {
    ...clean,
    public_url: clean.is_private_document ? null : clean.public_url || clean.file_url || null
  };
}

function formatActivityAliases(act: any) {
  if (!act) return act;
  return {
    ...act,
    old_status: act.old_status || act.previous_status || null,
    previous_status: act.previous_status || act.old_status || null
  };
}

function formatEnquiryAliases(enq: any) {
  if (!enq) return enq;
  const { cleanNotes, meta } = decodeEnquiryMetadataFromNotes(enq.notes);
  const mob = enq.tenant_mobile || enq.mobile_number || '';
  const propId = enq.property_id ?? enq.interested_property_id ?? null;
  const propTitle = enq.property_title || enq.interested_property_title || '';
  const propType = enq.property_type_needed || enq.property_type || '2 BHK';
  const resolvedStatus = meta.ui_status || enq.enquiry_status || 'New Enquiry';
  return {
    ...enq,
    enquiry_code: enq.enquiry_code || enq.id,
    enquiry_status: resolvedStatus,
    notes: cleanNotes,
    lead_id: enq.lead_id || meta.lead_id || null,
    move_in_date: enq.move_in_date || meta.move_in_date || '',
    family_or_company_profile: enq.family_or_company_profile || meta.family_or_company_profile || '',
    tenant_mobile: mob,
    mobile_number: mob,
    tenant_email: enq.tenant_email || enq.email || '',
    email: enq.email || enq.tenant_email || '',
    property_id: propId,
    interested_property_id: propId,
    property_title: propTitle,
    interested_property_title: propTitle,
    property_type_needed: propType,
    property_type: propType,
    budget_range: enq.budget_range || meta.budget_range || (enq.budget ? String(enq.budget) : ''),
    assigned_telecaller: enq.assigned_telecaller || enq.assigned_staff_name || ''
  };
}

function formatVisitAliases(v: any) {
  if (!v) return v;
  const mob = v.tenant_mobile || v.tenant_contact || '';
  const vDate = v.visit_date || v.scheduled_date || '';
  const vTime = v.visit_time || v.scheduled_time || '';
  const enqId = v.tenant_enquiry_id ?? v.enquiry_id ?? null;
  const staff = v.assigned_staff || v.assigned_staff_name || '';
  const feedback = v.visit_feedback || v.tenant_feedback || '';
  return {
    ...v,
    visit_code: v.visit_code || v.id,
    tenant_mobile: mob,
    tenant_contact: mob,
    visit_date: vDate,
    scheduled_date: vDate,
    visit_time: vTime,
    scheduled_time: vTime,
    tenant_enquiry_id: enqId,
    enquiry_id: enqId,
    assigned_staff: staff,
    assigned_staff_name: staff,
    visit_feedback: feedback,
    tenant_feedback: feedback
  };
}

function formatDealAliases(d: any) {
  if (!d) return d;
  const rent = d.final_monthly_rent ?? d.monthly_rent ?? 0;
  const fee = d.placement_fee_expected ?? d.placement_fee ?? 0;
  const bal = d.balance_pending ?? d.pending_amount ?? Math.max(0, Number(fee) - Number(d.amount_received || 0));
  return {
    ...d,
    deal_code: d.deal_code || d.id,
    final_monthly_rent: rent,
    monthly_rent: rent,
    placement_fee_expected: fee,
    placement_fee: fee,
    balance_pending: bal,
    pending_amount: bal,
    deal_confirmed_date: d.deal_confirmed_date || d.agreement_date || '',
    handled_by: d.handled_by || d.created_by_name || ''
  };
}

// -----------------------------------------------------------------------------
// 1. PROPERTY DASHBOARD & REPORTS METRICS
// GET /api/crm/properties/dashboard
// -----------------------------------------------------------------------------
propertyCrmRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const startDate = ((req.query.startDate as string) || '').trim();
    const endDate = ((req.query.endDate as string) || '').trim();

    const [
      allLeadsRaw,
      allCalls,
      allPropertiesRaw,
      allEnquiriesRaw,
      allVisitsRaw,
      allDealsRaw
    ] = await Promise.all([
      sbSelectAll('property_leads'),
      sbSelectAll('property_call_logs'),
      sbSelectAll('properties'),
      sbSelectAll('property_tenant_enquiries'),
      sbSelectAll('property_site_visits'),
      sbSelectAll('property_deals')
    ]);

    const inDateRange = (dateStr?: string) => {
      if (!startDate && !endDate) return true;
      if (!dateStr) return false;
      const d = dateStr.slice(0, 10);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    const leads = allLeadsRaw.filter((l: any) => !l.is_archived && inDateRange(l.date_received || l.created_at));
    const calls = allCalls.filter((c: any) => inDateRange(c.call_datetime || c.created_at));
    const properties = allPropertiesRaw.filter((p: any) => !p.is_archived && inDateRange(p.created_at));
    const enquiries = allEnquiriesRaw.filter((e: any) => !e.is_archived && inDateRange(e.enquiry_date || e.created_at));
    const visits = allVisitsRaw.filter((v: any) => !v.is_archived && inDateRange(v.scheduled_date || v.created_at));
    const deals = allDealsRaw.filter((d: any) => !d.is_archived && inDateRange(d.agreement_date || d.created_at));

    const todayStr = getIstDateString();

    const newLeads = leads.filter((l: any) => l.lead_status === 'New Lead' || l.lead_status === 'First Call Pending').length;
    const followupsPending = leads.filter((l: any) => {
      if (['Approved', 'Rejected', 'Not Available'].includes(l.lead_status)) return false;
      return l.lead_status === 'Follow-up Required' || Boolean(l.next_followup_date && l.next_followup_date.slice(0, 10) <= todayStr);
    }).length;
    const ownerDetailsPending = leads.filter((l: any) =>
      l.lead_status === 'Details Pending' || l.details_collected === 'No' || l.details_collected === 'Partially'
    ).length;
    const verificationPending =
      leads.filter((l: any) => l.lead_status === 'Verification Pending').length +
      properties.filter((p: any) => p.listing_status === 'Verification Pending' && !leads.some((l: any) => l.id === p.lead_id && l.lead_status === 'Verification Pending')).length;

    const approvedProperties = properties.filter((p: any) =>
      ['Approved', 'Approved for Website', 'Ready to Publish', 'Published', 'Rented'].includes(p.listing_status)
    ).length;
    const publishedProperties = properties.filter((p: any) => p.listing_status === 'Published').length;
    const rejectedProperties =
      properties.filter((p: any) => p.listing_status === 'Rejected').length +
      leads.filter((l: any) => l.lead_status === 'Rejected' && !properties.some((p: any) => p.lead_id === l.id && p.listing_status === 'Rejected')).length;

    const siteVisitsScheduled = visits.filter((v: any) =>
      ['Scheduled', 'Confirmed', 'Rescheduled'].includes(v.visit_status)
    ).length;

    const validDeals = deals.filter((d: any) => d.payment_status !== 'Cancelled');
    const dealsCompleted = validDeals.length;
    const totalPlacementFeesCollected = validDeals.reduce((sum: number, d: any) => sum + (Number(d.amount_received) || 0), 0);
    const totalPlacementFeesDue = validDeals.reduce(
      (sum: number, d: any) => sum + Math.max(0, (Number(d.placement_fee) || 0) - (Number(d.amount_received) || 0)),
      0
    );

    // 1. Leads by Date
    const dateMap: Record<string, number> = {};
    leads.forEach((l: any) => {
      const d = (l.date_received || l.created_at || '').slice(0, 10);
      if (d) dateMap[d] = (dateMap[d] || 0) + 1;
    });
    const leadsByDate = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({ date, count }));

    // 2. Leads by Property Type
    const typeMap: Record<string, number> = {};
    leads.forEach((l: any) => {
      const t = l.property_type || 'Unspecified';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const leadsByPropertyType = Object.entries(typeMap)
      .map(([type, count]) => ({ type, propertyType: type, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Leads by Location
    const locMap: Record<string, number> = {};
    leads.forEach((l: any) => {
      const loc = (l.property_location || l.location_locality || 'Unspecified').trim();
      locMap[loc] = (locMap[loc] || 0) + 1;
    });
    const leadsByLocation = Object.entries(locMap)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);

    // 4. Lead Status Distribution
    const statusMap: Record<string, number> = {};
    leads.forEach((l: any) => {
      const st = l.lead_status || 'New Lead';
      statusMap[st] = (statusMap[st] || 0) + 1;
    });
    const leadStatusDistribution = Object.entries(statusMap)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // 5. Staff-wise Property Lead Activity
    const staffMap: Record<
      string,
      {
        staffName: string;
        leadsAssigned: number;
        leadsCount: number;
        callsLogged: number;
        callsCount: number;
        dealsClosed: number;
        approvedProperties: number;
      }
    > = {};
    const ensureStaff = (name?: string) => {
      const clean = (name || 'Unassigned').trim() || 'Unassigned';
      if (!staffMap[clean]) {
        staffMap[clean] = {
          staffName: clean,
          leadsAssigned: 0,
          leadsCount: 0,
          callsLogged: 0,
          callsCount: 0,
          dealsClosed: 0,
          approvedProperties: 0
        };
      }
      return staffMap[clean];
    };
    leads.forEach((l: any) => {
      const st = ensureStaff(l.telecaller_name || l.created_by_name);
      st.leadsAssigned += 1;
      st.leadsCount += 1;
    });
    calls.forEach((c: any) => {
      const st = ensureStaff(c.logged_by_name || c.staff_name);
      st.callsLogged += 1;
      st.callsCount += 1;
    });
    properties.forEach((p: any) => {
      if (['Approved', 'Ready to Publish', 'Published', 'Rented'].includes(p.listing_status)) {
        const st = ensureStaff(p.approved_by_name || p.verified_by_name || p.created_by_name);
        st.approvedProperties += 1;
      }
    });
    validDeals.forEach((d: any) => {
      ensureStaff(d.handled_by || d.created_by_name).dealsClosed += 1;
    });
    const staffActivity = Object.values(staffMap).sort(
      (a, b) => b.leadsAssigned + b.callsLogged - (a.leadsAssigned + a.callsLogged)
    );

    // 6. Monthly Completed Deals and Fees
    const monthMap: Record<string, { month: string; dealsCount: number; feesCollected: number; feesDue: number }> = {};
    validDeals.forEach((d: any) => {
      const m = (d.deal_confirmed_date || d.agreement_date || d.created_at || '').slice(0, 7) || 'Unknown';
      if (!monthMap[m]) {
        monthMap[m] = { month: m, dealsCount: 0, feesCollected: 0, feesDue: 0 };
      }
      monthMap[m].dealsCount += 1;
      const fee = Number(d.placement_fee_expected ?? d.placement_fee) || 0;
      const rec = Number(d.amount_received) || 0;
      monthMap[m].feesCollected += rec;
      monthMap[m].feesDue += Math.max(0, fee - rec);
    });
    const monthlyDealsAndFees = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // 7. Leads by Sales Executive
    const execMap: Record<string, { salesExecutive: string; count: number; leads: number; approved: number }> = {};
    leads.forEach((l: any) => {
      const ex = (l.sales_executive_name || 'Direct / Unspecified').trim() || 'Direct / Unspecified';
      if (!execMap[ex]) {
        execMap[ex] = { salesExecutive: ex, count: 0, leads: 0, approved: 0 };
      }
      execMap[ex].count += 1;
      execMap[ex].leads += 1;
      if (l.lead_status === 'Approved') {
        execMap[ex].approved += 1;
      }
    });
    const leadsBySalesExecutive = Object.values(execMap).sort((a, b) => b.count - a.count);

    // 8. Properties by Category
    const catMap: Record<string, number> = {};
    properties.forEach((p: any) => {
      const cat = p.property_category || 'Residential';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const propertiesByCategory = Object.entries(catMap).map(([category, count]) => ({ category, count }));

    const metricsPayload = {
      totalPropertyLeads: leads.length,
      newLeads,
      callsCompleted: calls.length,
      followupsPending,
      followUpsPending: followupsPending,
      ownerDetailsPending,
      verificationPending,
      approvedProperties,
      publishedProperties,
      rejectedProperties,
      tenantEnquiries: enquiries.length,
      siteVisitsScheduled,
      dealsCompleted,
      totalPlacementFeesCollected,
      totalPlacementFeesDue
    };

    const chartsPayload = {
      leadsByDate,
      leadsByPropertyType,
      leadsByLocation,
      leadStatusDistribution,
      staffActivity,
      monthlyDealsAndFees,
      leadsBySalesExecutive,
      propertiesByCategory
    };

    const reportsPayload = {
      pendingPlacementFees: totalPlacementFeesDue,
      rejectedProperties,
      leadsBySalesExecutive,
      leadsByTelecaller: staffActivity.map(s => ({
        telecaller: s.staffName,
        assignedLeads: s.leadsAssigned,
        callsLogged: s.callsLogged,
        approvedProperties: s.approvedProperties
      }))
    };

    res.json({
      success: true,
      metrics: metricsPayload,
      charts: chartsPayload,
      reports: reportsPayload,
      data: {
        metrics: metricsPayload,
        charts: chartsPayload,
        reports: reportsPayload
      }
    });
  } catch (err: any) {
    console.error('[Properties CRM] Dashboard metrics error:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error loading property dashboard' });
  }
});

// -----------------------------------------------------------------------------
// 2. PROPERTY LEADS CRUD
// GET /api/crm/properties/leads
// POST /api/crm/properties/leads
// GET /api/crm/properties/leads/:id
// PUT /api/crm/properties/leads/:id
// DELETE /api/crm/properties/leads/:id (Soft archive)
// -----------------------------------------------------------------------------
propertyCrmRouter.get('/leads', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const location = ((req.query.location as string) || '').toLowerCase().trim();
    const propertyType = (req.query.property_type as string) || '';
    const leadStatus = (req.query.lead_status as string) || '';
    const assignedStaff = ((req.query.assigned_staff as string) || '').toLowerCase().trim();
    const dateReceived = ((req.query.date_received as string) || '').trim();
    const followupFilter = ((req.query.followup_filter as string) || '').trim();

    const allLeads = await sbSelectAll('property_leads');
    let list = allLeads.filter((l: any) => !l.is_archived);

    if (search) {
      list = list.filter((l: any) => {
        return (
          (l.id || '').toLowerCase().includes(search) ||
          (l.owner_name || '').toLowerCase().includes(search) ||
          (l.owner_mobile || '').toLowerCase().includes(search) ||
          (l.alternate_mobile || '').toLowerCase().includes(search) ||
          (l.location_locality || '').toLowerCase().includes(search) ||
          (l.sales_executive_name || '').toLowerCase().includes(search) ||
          (l.external_source_lead_id || '').toLowerCase().includes(search)
        );
      });
    }

    if (location) {
      list = list.filter((l: any) => (l.location_locality || '').toLowerCase().includes(location));
    }

    if (propertyType && propertyType !== 'All') {
      list = list.filter((l: any) => l.property_type === propertyType || l.property_category === propertyType);
    }

    if (leadStatus && leadStatus !== 'All') {
      list = list.filter((l: any) => l.lead_status === leadStatus);
    }

    if (assignedStaff && assignedStaff !== 'all') {
      list = list.filter(
        (l: any) =>
          (l.telecaller_name || '').toLowerCase().includes(assignedStaff) ||
          (l.telecaller_id || '').toLowerCase() === assignedStaff ||
          (l.sales_executive_name || '').toLowerCase().includes(assignedStaff)
      );
    }

    if (dateReceived) {
      list = list.filter((l: any) => (l.date_received || '').slice(0, 10) === dateReceived);
    }

    const todayStr = getIstDateString();
    if (followupFilter === 'today') {
      list = list.filter((l: any) => l.next_followup_date && l.next_followup_date.slice(0, 10) === todayStr);
    } else if (followupFilter === 'overdue') {
      list = list.filter(
        (l: any) =>
          l.next_followup_date &&
          l.next_followup_date.slice(0, 10) < todayStr &&
          !['Approved', 'Rejected', 'Not Available'].includes(l.lead_status)
      );
    } else if (followupFilter === 'upcoming') {
      list = list.filter((l: any) => l.next_followup_date && l.next_followup_date.slice(0, 10) > todayStr);
    } else if (followupFilter === 'pending') {
      list = list.filter(
        (l: any) =>
          l.lead_status === 'Follow-up Required' ||
          Boolean(l.next_followup_date && !['Approved', 'Rejected', 'Not Available'].includes(l.lead_status))
      );
    }

    list.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    res.json({
      success: true,
      total: list.length,
      leads: list.map(formatLeadAliases)
    });
  } catch (err: any) {
    console.error('[Properties CRM] Error fetching property leads:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error loading property leads' });
  }
});

propertyCrmRouter.post('/leads', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const body = req.body || {};

    const ownerName = (body.owner_name || 'Property Owner').trim();
    const ownerMobile = (body.owner_mobile || '').trim();

    if (!ownerMobile) {
      return res.status(400).json({ success: false, error: 'Owner Mobile Number is required.' });
    }

    const digits = ownerMobile.replace(/\D/g, '');
    if (digits.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit Owner Mobile Number.'
      });
    }

    const normMobile = normalizePhone(ownerMobile);
    const locality = (body.property_location || body.location_locality || '').trim();
    const propType = (body.property_type || '').trim();
    const extLeadId = (body.external_source_lead_id || '').trim();

    // Prevent accidental duplicate submissions in Supabase
    const existingLeads = await sbSelectAll('property_leads');
    const activeLeads = existingLeads.filter((l: any) => !l.is_archived);

    if (extLeadId) {
      const dupExt = activeLeads.find(
        (l: any) => (l.external_source_lead_id || '').toLowerCase() === extLeadId.toLowerCase()
      );
      if (dupExt) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_EXTERNAL_LEAD_ID',
          isDuplicate: true,
          error: `A property lead with External Source Lead ID "${extLeadId}" already exists (Lead ID: ${dupExt.id}).`
        });
      }
    }

    const sameOwnerPhoneLead = activeLeads.find((l: any) => {
      const existingNorm = l.normalized_owner_mobile || normalizePhone(l.owner_mobile || '');
      if (existingNorm !== normMobile) return false;
      const sameLocality = (l.property_location || l.location_locality || '').trim().toLowerCase() === locality.toLowerCase();
      const sameType = (l.property_type || '').trim().toLowerCase() === propType.toLowerCase();
      const isRecent = Date.now() - new Date(l.created_at || 0).getTime() < 120000;
      return isRecent || (sameLocality && sameType) || !body.allowDuplicateOwnerMobile;
    });

    if (sameOwnerPhoneLead && !body.allowDuplicateOwnerMobile) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_OWNER_MOBILE',
        isDuplicate: true,
        existingLeadId: sameOwnerPhoneLead.id,
        error: `Duplicate detected: A property lead for owner "${sameOwnerPhoneLead.owner_name}" (${ownerMobile}) already exists (Lead ID: ${sameOwnerPhoneLead.id}).`
      });
    }

    const now = new Date().toISOString();
    const id = generateUniqueId('REP-LD');

    const residentialSet = new Set([
      '1 BHK',
      '2 BHK',
      '3 BHK',
      '4 BHK',
      'Independent House',
      'Villa',
      'Studio Apartment'
    ]);
    const category =
      body.property_category ||
      (propType && !residentialSet.has(propType) ? 'Commercial' : 'Residential');

    const expectedRentVal =
      body.approx_expected_rent !== undefined && body.approx_expected_rent !== '' && body.approx_expected_rent !== null
        ? Number(body.approx_expected_rent) || 0
        : body.expected_rent !== undefined && body.expected_rent !== ''
        ? Number(body.expected_rent) || 0
        : 0;

    let boardPhotoPublicUrl: string | undefined;
    let boardPhotoStoragePath: string | undefined;
    const rawBoardPhoto = (body.board_photo_url || body.to_let_board_photo || '').trim();
    if (rawBoardPhoto) {
      const uploadedBoard = await uploadPhotoToSupabaseStorage(
        rawBoardPhoto,
        'to-let-board.jpg',
        id
      );
      boardPhotoPublicUrl = uploadedBoard.publicUrl;
      boardPhotoStoragePath = uploadedBoard.storagePath;
    }

    const newLead = {
      id,
      lead_code: id,
      date_received: body.date_received || getIstDateString(),
      sales_executive_name: (body.sales_executive_name || '').trim() || undefined,
      telecaller_id: body.telecaller_id || user.id,
      telecaller_name: (body.telecaller_name || '').trim() || user.name,
      owner_name: ownerName,
      owner_mobile: normMobile,
      normalized_owner_mobile: normMobile,
      alternate_mobile: body.alternate_mobile ? normalizePhone(body.alternate_mobile) : undefined,
      location_locality: locality || undefined,
      property_location: locality || undefined,
      property_category: category,
      property_type: propType || undefined,
      expected_rent: expectedRentVal,
      approx_expected_rent: expectedRentVal,
      source: body.source || 'Sales Executive',
      initial_notes: (body.initial_notes || '').trim() || undefined,
      board_photo_url: boardPhotoPublicUrl,
      lead_status: body.lead_status || 'New Lead',
      last_contact_at: undefined,
      last_contact_date: undefined,
      next_followup_date: body.next_followup_date || undefined,
      followup_notes: (body.followup_notes || '').trim() || undefined,
      owner_interested: body.owner_interested || 'Not Sure',
      property_available: body.property_available || 'Not Confirmed',
      details_collected: body.details_collected || 'No',
      property_id: undefined,
      external_source_lead_id: extLeadId || undefined,
      source_application: (body.source_application || 'Manual Telecaller Entry').trim(),
      original_sales_executive_id: (body.original_sales_executive_id || '').trim() || undefined,
      original_sales_executive_name:
        (body.original_sales_executive_name || body.sales_executive_name || '').trim() || undefined,
      original_submission_date: body.original_submission_date || undefined,
      is_archived: false,
      created_by: user.id,
      created_by_name: user.name,
      updated_by: user.id,
      updated_by_name: user.name,
      created_at: now,
      updated_at: now
    };

    const savedLead = await sbUpsert('property_leads', newLead);

    if (boardPhotoPublicUrl) {
      await sbUpsert(
        'property_images',
        {
          id: generateUniqueId('REP-IMG'),
          lead_id: newLead.id,
          property_id: undefined,
          category: 'To-Let Board',
          file_name: 'To-Let Board / Initial Photo',
          file_url: boardPhotoPublicUrl,
          public_url: boardPhotoPublicUrl,
          storage_path: boardPhotoStoragePath,
          is_private_document: false,
          uploaded_by: user.id,
          uploaded_by_name: user.name,
          created_at: now
        },
        newLead.id
      );
    }

    await recordPropertyActivity({
      lead_id: newLead.id,
      entity_type: 'lead',
      entity_id: newLead.id,
      action: 'LEAD_CREATED',
      description: `Property lead created for owner ${newLead.owner_name} (${newLead.property_type || 'Property'} in ${newLead.location_locality || 'Bengaluru'}) via ${newLead.source}.`,
      new_status: newLead.lead_status,
      user
    });

    res.status(201).json({
      success: true,
      lead: formatLeadAliases(savedLead)
    });
  } catch (err: any) {
    console.error('[Properties CRM] Error creating property lead:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error saving property lead' });
  }
});

propertyCrmRouter.get('/leads/:id', async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;
    const lead = await sbSelectById('property_leads', leadId);
    if (!lead || lead.is_archived) {
      return res.status(404).json({ success: false, error: 'Property lead not found.' });
    }

    const [allCalls, allProperties, allImages, allActivities] = await Promise.all([
      sbSelectAll('property_call_logs'),
      sbSelectAll('properties'),
      sbSelectAll('property_images'),
      sbSelectAll('property_activities')
    ]);

    const calls = allCalls
      .filter((c: any) => c.lead_id === leadId)
      .sort((a: any, b: any) => new Date(b.call_datetime || b.created_at).getTime() - new Date(a.call_datetime || a.created_at).getTime());

    const property =
      allProperties.find((p: any) => !p.is_archived && (p.lead_id === leadId || (lead.property_id && p.id === lead.property_id))) ||
      null;

    const images = allImages
      .filter((img: any) => img.lead_id === leadId || (property && img.property_id === property.id))
      .map((img: any) => {
        const clean = { ...img };
        delete clean.private_payload;
        return clean;
      });

    const activities = allActivities
      .filter((a: any) => a.lead_id === leadId || (property && a.property_id === property.id))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      lead: formatLeadAliases(lead),
      calls: calls.map(formatCallAliases),
      property: formatPropertyAliases(property),
      images: images.map(formatImageAliases),
      activities: activities.map(formatActivityAliases)
    });
  } catch (err: any) {
    console.error('[Properties CRM] Error fetching lead detail:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error loading property lead details' });
  }
});

propertyCrmRouter.put('/leads/:id', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const leadId = req.params.id;
    const existing = await sbSelectById('property_leads', leadId);
    if (!existing || existing.is_archived) {
      return res.status(404).json({ success: false, error: 'Property lead not found.' });
    }

    const body = req.body || {};
    const prevStatus = existing.lead_status;
    const nextStatus = body.lead_status || existing.lead_status;

    if (nextStatus === 'Approved' && prevStatus !== 'Approved') {
      const allProps = await sbSelectAll('properties');
      const linkedProp = allProps.find((p: any) => !p.is_archived && (p.lead_id === leadId || p.id === existing.property_id));
      if (!linkedProp) {
        return res.status(400).json({
          success: false,
          code: 'VERIFICATION_INCOMPLETE',
          error: 'Cannot approve lead before Complete Property Details and Owner Verification are saved.'
        });
      }
      const check = checkPropertyVerificationComplete(linkedProp);
      if (!check.valid) {
        return res.status(400).json({
          success: false,
          code: 'VERIFICATION_INCOMPLETE',
          error: `Approval blocked: ${check.missing.join('; ')}.`
        });
      }
    }

    const now = new Date().toISOString();
    const normMobile = body.owner_mobile ? normalizePhone(body.owner_mobile) : existing.normalized_owner_mobile;
    const nextLoc = body.property_location ?? body.location_locality ?? existing.location_locality;
    const nextRent =
      body.approx_expected_rent !== undefined
        ? Number(body.approx_expected_rent) || 0
        : body.expected_rent !== undefined
        ? Number(body.expected_rent) || 0
        : existing.expected_rent;

    const updatedLead = {
      ...existing,
      lead_code: existing.lead_code || existing.id,
      date_received: body.date_received ?? existing.date_received,
      sales_executive_name: body.sales_executive_name ?? existing.sales_executive_name,
      telecaller_id: body.telecaller_id ?? existing.telecaller_id,
      telecaller_name: body.telecaller_name ?? existing.telecaller_name,
      owner_name: body.owner_name ? body.owner_name.trim() : existing.owner_name,
      owner_mobile: normMobile,
      normalized_owner_mobile: normMobile,
      alternate_mobile:
        body.alternate_mobile !== undefined
          ? body.alternate_mobile
            ? normalizePhone(body.alternate_mobile)
            : undefined
          : existing.alternate_mobile,
      location_locality: nextLoc,
      property_location: nextLoc,
      property_category: body.property_category ?? existing.property_category,
      property_type: body.property_type ?? existing.property_type,
      expected_rent: nextRent,
      approx_expected_rent: nextRent,
      source: body.source ?? existing.source,
      initial_notes: body.initial_notes ?? existing.initial_notes,
      board_photo_url: body.board_photo_url ?? existing.board_photo_url,
      lead_status: nextStatus,
      next_followup_date:
        body.next_followup_date !== undefined ? body.next_followup_date : existing.next_followup_date,
      followup_notes: body.followup_notes !== undefined ? body.followup_notes : existing.followup_notes,
      owner_interested: body.owner_interested ?? existing.owner_interested,
      property_available: body.property_available ?? existing.property_available,
      details_collected: body.details_collected ?? existing.details_collected,
      external_source_lead_id: body.external_source_lead_id ?? existing.external_source_lead_id,
      source_application: body.source_application ?? existing.source_application,
      original_sales_executive_id: body.original_sales_executive_id ?? existing.original_sales_executive_id,
      original_sales_executive_name: body.original_sales_executive_name ?? existing.original_sales_executive_name,
      original_submission_date: body.original_submission_date ?? existing.original_submission_date,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const saved = await sbUpsert('property_leads', updatedLead);

    const statusNote = body.status_note ? ` Note: ${body.status_note}` : '';
    await recordPropertyActivity({
      lead_id: leadId,
      property_id: updatedLead.property_id,
      entity_type: 'lead',
      entity_id: leadId,
      action: prevStatus !== nextStatus ? 'STATUS_CHANGED' : 'LEAD_UPDATED',
      description:
        prevStatus !== nextStatus
          ? `Lead status changed from "${prevStatus}" to "${nextStatus}".${statusNote}`
          : `Lead details updated by ${user.name}.${statusNote}`,
      previous_status: prevStatus,
      new_status: nextStatus,
      user
    });

    res.json({ success: true, lead: formatLeadAliases(saved) });
  } catch (err: any) {
    console.error('[Properties CRM] Error updating property lead:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error updating property lead' });
  }
});

propertyCrmRouter.delete('/leads/:id', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const leadId = req.params.id;
    const existing = await sbSelectById('property_leads', leadId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Property lead not found.' });
    }

    const archived = {
      ...existing,
      is_archived: true,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: new Date().toISOString()
    };
    await sbUpsert('property_leads', archived);

    await recordPropertyActivity({
      lead_id: leadId,
      property_id: existing.property_id,
      entity_type: 'lead',
      entity_id: leadId,
      action: 'LEAD_ARCHIVED',
      description: `Property lead ${leadId} archived by ${user.name}.`,
      previous_status: existing.lead_status,
      new_status: 'Archived',
      user
    });

    res.json({ success: true, message: 'Property lead archived.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error archiving property lead' });
  }
});

// -----------------------------------------------------------------------------
// 3. OWNER CALLING & FOLLOW-UPS
// POST /api/crm/properties/leads/:id/calls
// GET /api/crm/properties/followups
// -----------------------------------------------------------------------------
propertyCrmRouter.post('/leads/:id/calls', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const leadId = req.params.id;
    const lead = await sbSelectById('property_leads', leadId);
    if (!lead || lead.is_archived) {
      return res.status(404).json({ success: false, error: 'Property lead not found.' });
    }

    const body = req.body || {};
    const callOutcome = (body.call_outcome || '').trim();
    if (!callOutcome) {
      return res.status(400).json({ success: false, error: 'Call Outcome is required.' });
    }

    const now = new Date().toISOString();
    const callDt = body.call_date_time || body.call_datetime || now;
    const callLog = {
      id: generateUniqueId('REP-CL'),
      lead_id: leadId,
      property_id: lead.property_id || undefined,
      call_datetime: callDt,
      call_date_time: callDt,
      call_outcome: callOutcome,
      call_notes: (body.call_notes || '').trim() || undefined,
      owner_interested: body.owner_interested || 'Not Sure',
      property_available: body.property_available || 'Not Confirmed',
      details_collected: body.details_collected || 'No',
      next_followup_date: body.next_followup_date || undefined,
      followup_notes: (body.followup_notes || '').trim() || undefined,
      logged_by: user.id,
      logged_by_name: user.name,
      staff_name: user.name,
      created_at: now
    };

    const savedCall = await sbUpsert('property_call_logs', callLog, leadId);

    // Derive updated lead status if requested or based on call outcome
    let nextLeadStatus = body.lead_status || lead.lead_status;
    if (!body.lead_status) {
      if (callOutcome === 'Property Already Rented' || callLog.property_available === 'No') {
        nextLeadStatus = 'Not Available';
      } else if (callOutcome === 'Not Interested' || callLog.owner_interested === 'No') {
        nextLeadStatus = 'Rejected';
      } else if (callOutcome === 'Owner Interested' || callLog.owner_interested === 'Yes') {
        nextLeadStatus = callLog.details_collected === 'Yes' ? 'Verification Pending' : 'Details Pending';
      } else if (callOutcome === 'Connected') {
        nextLeadStatus = 'Owner Contacted';
      } else if (['Not Answered', 'Switched Off', 'Busy', 'Call Back Requested'].includes(callOutcome)) {
        nextLeadStatus = 'Follow-up Required';
      }
    }

    const updatedLead = {
      ...lead,
      lead_status: nextLeadStatus,
      last_contact_at: callLog.call_datetime,
      last_contact_date: callLog.call_datetime,
      next_followup_date:
        body.next_followup_date !== undefined ? body.next_followup_date : lead.next_followup_date,
      followup_notes:
        body.followup_notes !== undefined ? body.followup_notes : lead.followup_notes,
      owner_interested: callLog.owner_interested,
      property_available: callLog.property_available,
      details_collected: callLog.details_collected,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const savedLead = await sbUpsert('property_leads', updatedLead);

    await recordPropertyActivity({
      lead_id: leadId,
      property_id: lead.property_id,
      entity_type: 'call',
      entity_id: savedCall.id,
      action: 'CALL_LOGGED',
      description: `Owner call logged (${callOutcome}) by ${user.name}. Interested: ${callLog.owner_interested}, Available: ${callLog.property_available}, Details Collected: ${callLog.details_collected}.${callLog.call_notes ? ' Notes: ' + callLog.call_notes : ''}`,
      previous_status: lead.lead_status,
      new_status: nextLeadStatus,
      user
    });

    res.status(201).json({
      success: true,
      callLog: formatCallAliases(savedCall),
      lead: formatLeadAliases(savedLead)
    });
  } catch (err: any) {
    console.error('[Properties CRM] Error logging owner call:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error saving call record' });
  }
});

propertyCrmRouter.get('/followups', async (_req: Request, res: Response) => {
  try {
    const [allLeads, allCalls] = await Promise.all([
      sbSelectAll('property_leads'),
      sbSelectAll('property_call_logs')
    ]);
    const activeLeads = allLeads.filter((l: any) => !l.is_archived).map(formatLeadAliases);
    const todayStr = getIstDateString();

    const dueToday = activeLeads.filter(
      (l: any) =>
        l.next_followup_date &&
        l.next_followup_date.slice(0, 10) === todayStr &&
        !['Approved', 'Rejected', 'Not Available'].includes(l.lead_status)
    );
    const overdue = activeLeads.filter(
      (l: any) =>
        l.next_followup_date &&
        l.next_followup_date.slice(0, 10) < todayStr &&
        !['Approved', 'Rejected', 'Not Available'].includes(l.lead_status)
    );
    const upcoming = activeLeads.filter(
      (l: any) =>
        l.next_followup_date &&
        l.next_followup_date.slice(0, 10) > todayStr &&
        !['Approved', 'Rejected', 'Not Available'].includes(l.lead_status)
    );
    const followUpRequired = activeLeads.filter(
      (l: any) => l.lead_status === 'Follow-up Required' || l.lead_status === 'First Call Pending'
    );

    const recentCalls = allCalls
      .slice()
      .sort((a: any, b: any) => new Date(b.call_datetime || b.created_at).getTime() - new Date(a.call_datetime || a.created_at).getTime())
      .slice(0, 100)
      .map(formatCallAliases);

    res.json({
      success: true,
      dueToday,
      overdue,
      upcoming,
      followUpRequired,
      recentCalls
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error loading follow-ups' });
  }
});

// -----------------------------------------------------------------------------
// 4. COMPLETE PROPERTY DETAILS, VERIFICATION & LISTINGS MANAGEMENT
// GET /api/crm/properties/listings
// GET /api/crm/properties/listings/:id
// POST /api/crm/properties/leads/:leadId/property (Upsert 1-to-1 property for lead)
// POST /api/crm/properties/listings/:id/review (Approve / Reject / Status change with verification gate)
// -----------------------------------------------------------------------------
function checkPropertyVerificationComplete(prop: any): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  const ownership = prop.ownership_confirmed || prop.ownership_auth_confirmed;
  const avail = prop.property_availability_confirmed || prop.availability_confirmed;
  if (prop.owner_identity_verified !== 'Yes') missing.push('Owner Identity Verified must be "Yes"');
  if (ownership !== 'Yes') missing.push('Ownership or Authorisation Confirmed must be "Yes"');
  if (avail !== 'Yes') missing.push('Property Availability Confirmed must be "Yes"');
  if (prop.permission_to_advertise !== 'Yes') {
    missing.push('Owner explicit Permission to Advertise must be "Yes"');
  }
  return { valid: missing.length === 0, missing };
}

propertyCrmRouter.get('/listings', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const status = (req.query.listing_status as string) || '';
    const category = (req.query.property_category as string) || '';
    const locality = ((req.query.locality as string) || '').toLowerCase().trim();

    const [allProps, allImages] = await Promise.all([
      sbSelectAll('properties'),
      sbSelectAll('property_images')
    ]);

    let list = allProps.filter((p: any) => !p.is_archived || status === 'Archived');

    if (search) {
      list = list.filter(
        (p: any) =>
          (p.id || '').toLowerCase().includes(search) ||
          (p.lead_id || '').toLowerCase().includes(search) ||
          (p.property_title || '').toLowerCase().includes(search) ||
          (p.owner_full_name || '').toLowerCase().includes(search) ||
          (p.owner_primary_mobile || p.primary_mobile || '').toLowerCase().includes(search) ||
          (p.locality || '').toLowerCase().includes(search) ||
          (p.property_type || '').toLowerCase().includes(search)
      );
    }

    if (status && status !== 'All') {
      list = list.filter((p: any) => p.listing_status === status);
    }

    if (category && category !== 'All') {
      list = list.filter((p: any) => p.property_category === category);
    }

    if (locality) {
      list = list.filter((p: any) => (p.locality || '').toLowerCase().includes(locality));
    }

    const enriched = list
      .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .map((p: any) => {
        const propImages = allImages
          .filter((img: any) => img.property_id === p.id || img.lead_id === p.lead_id)
          .map(formatImageAliases);
        return {
          ...formatPropertyAliases(p),
          images: propImages
        };
      });

    res.json({
      success: true,
      total: enriched.length,
      properties: enriched
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error loading property listings' });
  }
});

propertyCrmRouter.post('/leads/:leadId/property', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const leadId = req.params.leadId;
    const lead = await sbSelectById('property_leads', leadId);
    if (!lead || lead.is_archived) {
      return res.status(404).json({ success: false, error: 'Associated property lead not found.' });
    }

    const body = req.body || {};
    const allProps = await sbSelectAll('properties');
    const existingProp = allProps.find(
      (p: any) => !p.is_archived && (p.lead_id === leadId || (lead.property_id && p.id === lead.property_id))
    );
    const isNew = !existingProp;

    const now = new Date().toISOString();
    const propId = existingProp ? existingProp.id : generateUniqueId('REP-PR');

    const requestedListingStatus = body.listing_status || existingProp?.listing_status || 'Details Pending';

    const fullAddr = body.full_property_address ?? body.full_address ?? existingProp?.full_address ?? '';
    const primaryMobRaw = body.primary_mobile || body.owner_primary_mobile;
    const primaryMob = primaryMobRaw
      ? normalizePhone(primaryMobRaw)
      : existingProp?.owner_primary_mobile || lead.owner_mobile;
    const altMobRaw = body.alternate_mobile !== undefined ? body.alternate_mobile : body.owner_alternate_mobile;
    const altMob =
      altMobRaw !== undefined
        ? altMobRaw
          ? normalizePhone(altMobRaw)
          : undefined
        : existingProp?.owner_alternate_mobile || lead.alternate_mobile;
    const ownerEmail = body.email_address ?? body.owner_email ?? existingProp?.owner_email ?? '';

    const ownershipVal =
      body.ownership_confirmed ||
      body.ownership_auth_confirmed ||
      existingProp?.ownership_confirmed ||
      existingProp?.ownership_auth_confirmed ||
      'Pending';
    const availVal =
      body.property_availability_confirmed ||
      body.availability_confirmed ||
      existingProp?.property_availability_confirmed ||
      existingProp?.availability_confirmed ||
      'Pending';

    const candidateProp = {
      id: propId,
      property_code: propId,
      lead_id: leadId,
      property_title:
        (body.property_title || '').trim() ||
        existingProp?.property_title ||
        `${body.property_type || lead.property_type || 'Property'} in ${body.locality || lead.location_locality || 'Bengaluru'}`,
      property_category: body.property_category || existingProp?.property_category || lead.property_category || 'Residential',
      property_type: body.property_type || existingProp?.property_type || lead.property_type || '2 BHK',
      bhk_configuration: body.bhk_configuration ?? existingProp?.bhk_configuration ?? '',
      full_address: fullAddr,
      full_property_address: fullAddr,
      locality: body.locality ?? existingProp?.locality ?? lead.location_locality ?? '',
      city: body.city || existingProp?.city || 'Bengaluru',
      pin_code: body.pin_code ?? existingProp?.pin_code ?? '',
      expected_monthly_rent:
        body.expected_monthly_rent !== undefined && body.expected_monthly_rent !== null
          ? Number(body.expected_monthly_rent) || 0
          : existingProp?.expected_monthly_rent ?? (Number(lead.expected_rent) || 0),
      security_deposit:
        body.security_deposit !== undefined && body.security_deposit !== null
          ? Number(body.security_deposit) || 0
          : existingProp?.security_deposit ?? 0,
      maintenance_charges:
        body.maintenance_charges !== undefined && body.maintenance_charges !== null
          ? Number(body.maintenance_charges) || 0
          : existingProp?.maintenance_charges ?? 0,
      other_charges: body.other_charges ?? existingProp?.other_charges ?? '',
      rent_negotiable: body.rent_negotiable || existingProp?.rent_negotiable || 'Yes',
      deposit_negotiable: body.deposit_negotiable || existingProp?.deposit_negotiable || 'Yes',
      built_up_area:
        body.built_up_area !== undefined && body.built_up_area !== ''
          ? body.built_up_area
          : existingProp?.built_up_area,
      carpet_area:
        body.carpet_area !== undefined && body.carpet_area !== ''
          ? body.carpet_area
          : existingProp?.carpet_area,
      furnishing_status: body.furnishing_status || existingProp?.furnishing_status || 'Semi Furnished',
      bedrooms:
        body.bedrooms !== undefined && body.bedrooms !== '' && body.bedrooms !== null
          ? Number(body.bedrooms)
          : existingProp?.bedrooms ?? 0,
      bathrooms:
        body.bathrooms !== undefined && body.bathrooms !== '' && body.bathrooms !== null
          ? Number(body.bathrooms)
          : existingProp?.bathrooms ?? 0,
      balconies:
        body.balconies !== undefined && body.balconies !== '' && body.balconies !== null
          ? Number(body.balconies)
          : existingProp?.balconies ?? 0,
      floor_number: body.floor_number ?? existingProp?.floor_number ?? '',
      total_floors: body.total_floors ?? existingProp?.total_floors ?? '',
      lift_available: body.lift_available || existingProp?.lift_available || 'No',
      parking_availability: body.parking_availability ?? existingProp?.parking_availability ?? '',
      available_from_date: body.available_from_date ?? existingProp?.available_from_date ?? '',
      property_description: body.property_description ?? existingProp?.property_description ?? '',
      amenities: Array.isArray(body.amenities) ? body.amenities : existingProp?.amenities || [],
      owner_full_name: (body.owner_full_name || '').trim() || existingProp?.owner_full_name || lead.owner_name,
      owner_primary_mobile: primaryMob,
      primary_mobile: primaryMob,
      owner_alternate_mobile: altMob,
      alternate_mobile: altMob,
      owner_email: ownerEmail,
      email_address: ownerEmail,
      preferred_contact_time: body.preferred_contact_time ?? existingProp?.preferred_contact_time ?? '',
      relationship_to_property:
        body.relationship_to_property || existingProp?.relationship_to_property || 'Owner',
      owner_identity_verified:
        body.owner_identity_verified || existingProp?.owner_identity_verified || 'Pending',
      ownership_auth_confirmed: ownershipVal,
      ownership_confirmed: ownershipVal,
      availability_confirmed: availVal,
      property_availability_confirmed: availVal,
      permission_to_advertise:
        body.permission_to_advertise || existingProp?.permission_to_advertise || 'Pending',
      verification_notes: body.verification_notes ?? existingProp?.verification_notes ?? '',
      verified_by: body.verified_by || existingProp?.verified_by || user.name,
      verified_by_name:
        (body.verified_by_name || body.verified_by || '').trim() || existingProp?.verified_by_name || user.name,
      verification_date: body.verification_date || existingProp?.verification_date || now,
      listing_status: requestedListingStatus,
      approved_by: existingProp?.approved_by,
      approved_by_name: existingProp?.approved_by_name,
      approved_at: existingProp?.approved_at,
      rejected_by: existingProp?.rejected_by,
      rejected_by_name: existingProp?.rejected_by_name,
      rejected_at: existingProp?.rejected_at,
      rejection_reason: existingProp?.rejection_reason,
      approval_history: Array.isArray(existingProp?.approval_history) ? [...existingProp.approval_history] : [],
      is_archived: false,
      created_by: existingProp?.created_by || user.id,
      created_by_name: existingProp?.created_by_name || user.name,
      updated_by: user.id,
      updated_by_name: user.name,
      created_at: existingProp?.created_at || now,
      updated_at: now
    };

    if (['Approved', 'Approved for Website', 'Ready to Publish', 'Published'].includes(requestedListingStatus)) {
      const check = checkPropertyVerificationComplete(candidateProp);
      if (!check.valid) {
        return res.status(400).json({
          success: false,
          code: 'VERIFICATION_INCOMPLETE',
          verificationIncomplete: true,
          missingFields: check.missing,
          error: `Cannot set status to "${requestedListingStatus}". ${check.missing.join('; ')}.`
        });
      }
      if (!candidateProp.approved_at) {
        candidateProp.approved_by = user.id;
        candidateProp.approved_by_name = user.name;
        candidateProp.approved_at = now;
        candidateProp.approval_history.unshift({
          action: 'APPROVED',
          status: requestedListingStatus as any,
          notes: candidateProp.verification_notes || 'Verified and approved.',
          staff_id: user.id,
          staff_name: user.name,
          timestamp: now
        });
      }
    }

    const savedProperty = await sbUpsert('properties', candidateProp, leadId);

    const verCheck = checkPropertyVerificationComplete(savedProperty);
    let nextLeadStatus = lead.lead_status;
    if (['Approved', 'Approved for Website', 'Ready to Publish', 'Published'].includes(savedProperty.listing_status)) {
      nextLeadStatus = 'Approved';
    } else if (savedProperty.listing_status === 'Rejected') {
      nextLeadStatus = 'Rejected';
    } else if (verCheck.valid || savedProperty.listing_status === 'Verification Pending') {
      nextLeadStatus = 'Verification Pending';
    } else if (['New Lead', 'First Call Pending', 'Owner Contacted', 'Interested'].includes(lead.lead_status)) {
      nextLeadStatus = 'Verification Pending';
    }

    const updatedLead = {
      ...lead,
      property_id: savedProperty.id,
      owner_name: savedProperty.owner_full_name || lead.owner_name,
      location_locality: savedProperty.locality || lead.location_locality,
      property_location: savedProperty.locality || lead.property_location || lead.location_locality,
      property_category: savedProperty.property_category || lead.property_category,
      property_type: savedProperty.property_type || lead.property_type,
      expected_rent: savedProperty.expected_monthly_rent || lead.expected_rent,
      approx_expected_rent: savedProperty.expected_monthly_rent || lead.approx_expected_rent || lead.expected_rent,
      details_collected: 'Yes' as const,
      lead_status: nextLeadStatus,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };
    const savedLead = await sbUpsert('property_leads', updatedLead);

    const allImages = await sbSelectAll('property_images');
    for (const img of allImages) {
      if (img.lead_id === leadId && !img.property_id) {
        await sbUpsert('property_images', { ...img, property_id: savedProperty.id }, savedProperty.id);
      }
    }

    await recordPropertyActivity({
      lead_id: leadId,
      property_id: savedProperty.id,
      entity_type: 'property',
      entity_id: savedProperty.id,
      action: existingProp ? 'PROPERTY_UPDATED' : 'PROPERTY_COMPLETED',
      description: `${existingProp ? 'Updated' : 'Completed'} full property record "${savedProperty.property_title}" (Status: ${savedProperty.listing_status}).`,
      previous_status: existingProp?.listing_status,
      new_status: savedProperty.listing_status,
      user
    });

    res.json({
      success: true,
      isNew,
      property: formatPropertyAliases(savedProperty),
      lead: formatLeadAliases(savedLead)
    });
  } catch (err: any) {
    console.error('[Properties CRM] Error saving complete property details:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error saving property details' });
  }
});

propertyCrmRouter.post('/listings/:id/review', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const propId = req.params.id;
    const prop = await sbSelectById('properties', propId);
    if (!prop || prop.is_archived) {
      return res.status(404).json({ success: false, error: 'Property listing not found.' });
    }

    const body = req.body || {};
    const targetStatus = body.listing_status;
    const notes = (body.notes || '').trim();

    if (!targetStatus) {
      return res.status(400).json({ success: false, error: 'Target listing_status is required.' });
    }

    if (['Approved', 'Approved for Website', 'Ready to Publish', 'Published'].includes(targetStatus)) {
      const check = checkPropertyVerificationComplete(prop);
      if (!check.valid) {
        return res.status(400).json({
          success: false,
          code: 'VERIFICATION_INCOMPLETE',
          verificationIncomplete: true,
          missingFields: check.missing,
          error: `Approval denied: ${check.missing.join('; ')}.`
        });
      }
    }

    const now = new Date().toISOString();
    const prevStatus = prop.listing_status;
    const history = Array.isArray(prop.approval_history) ? [...prop.approval_history] : [];
    history.unshift({
      action:
        targetStatus === 'Rejected'
          ? 'REJECTED'
          : ['Approved', 'Approved for Website', 'Ready to Publish', 'Published'].includes(targetStatus)
          ? 'APPROVED'
          : 'STATUS_UPDATED',
      status: targetStatus,
      notes: notes || `Listing status changed from ${prevStatus} to ${targetStatus}.`,
      staff_id: user.id,
      staff_name: user.name,
      timestamp: now
    });

    const updatedProp = {
      ...prop,
      listing_status: targetStatus,
      approved_by: ['Approved', 'Approved for Website', 'Ready to Publish', 'Published'].includes(targetStatus) ? user.id : prop.approved_by,
      approved_by_name: ['Approved', 'Approved for Website', 'Ready to Publish', 'Published'].includes(targetStatus)
        ? user.name
        : prop.approved_by_name,
      approved_at: ['Approved', 'Approved for Website', 'Ready to Publish', 'Published'].includes(targetStatus)
        ? prop.approved_at || now
        : prop.approved_at,
      rejected_by: targetStatus === 'Rejected' ? user.id : prop.rejected_by,
      rejected_by_name: targetStatus === 'Rejected' ? user.name : prop.rejected_by_name,
      rejected_at: targetStatus === 'Rejected' ? now : prop.rejected_at,
      rejection_reason: targetStatus === 'Rejected' ? notes || prop.rejection_reason : prop.rejection_reason,
      approval_history: history,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const savedProp = await sbUpsert('properties', updatedProp, prop.lead_id);

    if (prop.lead_id) {
      const lead = await sbSelectById('property_leads', prop.lead_id);
      if (lead) {
        let nextLeadStatus = lead.lead_status;
        if (['Approved', 'Approved for Website', 'Ready to Publish', 'Published'].includes(targetStatus)) {
          nextLeadStatus = 'Approved';
        } else if (targetStatus === 'Rejected') {
          nextLeadStatus = 'Rejected';
        } else if (targetStatus === 'Rented' || targetStatus === 'Unavailable') {
          nextLeadStatus = 'Not Available';
        }
        await sbUpsert('property_leads', {
          ...lead,
          lead_status: nextLeadStatus,
          updated_by: user.id,
          updated_by_name: user.name,
          updated_at: now
        });
      }
    }

    await recordPropertyActivity({
      lead_id: prop.lead_id,
      property_id: propId,
      entity_type: 'approval',
      entity_id: propId,
      action: `LISTING_${targetStatus.toUpperCase().replace(/\s+/g, '_')}`,
      description: `Property "${prop.property_title}" marked as "${targetStatus}" by ${user.name}.${notes ? ' Notes: ' + notes : ''}`,
      previous_status: prevStatus,
      new_status: targetStatus,
      user
    });

    res.json({
      success: true,
      property: formatPropertyAliases(savedProp)
    });
  } catch (err: any) {
    console.error('[Properties CRM] Error reviewing property listing:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error updating listing status' });
  }
});

// -----------------------------------------------------------------------------
// 5. PROPERTY PHOTOS & PRIVATE DOCUMENTS
// POST /api/crm/properties/media
// DELETE /api/crm/properties/media/:imageId
// GET /api/crm/properties/documents/:imageId (Authenticated private document viewer)
// -----------------------------------------------------------------------------
async function uploadPhotoToSupabaseStorage(
  base64OrUrl: string,
  fileName: string,
  recordId: string
): Promise<{ publicUrl: string; storagePath?: string }> {
  if (base64OrUrl.startsWith('http://') || base64OrUrl.startsWith('https://')) {
    return { publicUrl: base64OrUrl };
  }

  const match = base64OrUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid file data URL format.');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = (fileName.split('.').pop() || mimeType.split('/')[1] || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `royal-epic-properties/${recordId}/${Date.now()}-${safeName || `photo.${ext}`}`;

  const { url, key } = getSupabaseCredentials();
  const bucket = 'property-media';

  const uploadRes = await fetch(`${url}/storage/v1/object/${bucket}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': mimeType,
      'x-upsert': 'true'
    },
    body: buffer
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => 'Unknown storage error');
    throw new Error(`Supabase Storage upload to "${bucket}" failed (HTTP ${uploadRes.status}): ${errText}`);
  }

  return {
    publicUrl: `${url}/storage/v1/object/public/${bucket}/${objectPath}`,
    storagePath: `${bucket}/${objectPath}`
  };
}

propertyCrmRouter.post('/media', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const body = req.body || {};
    const { property_id, lead_id, category, file_name, file_data, mime_type } = body;

    if (!property_id && !lead_id) {
      return res.status(400).json({ success: false, error: 'Either property_id or lead_id is required.' });
    }
    if (!category) {
      return res.status(400).json({ success: false, error: 'Photo/Document category is required.' });
    }
    if (!file_data) {
      return res.status(400).json({ success: false, error: 'File content or URL is required.' });
    }

    const id = generateUniqueId('REP-IMG');
    const now = new Date().toISOString();
    const isPrivateDoc = category === 'Additional Documents' || Boolean(body.is_private_document);

    let fileUrl = '';
    let storagePath: string | undefined;
    let privatePayload: string | undefined;

    if (isPrivateDoc) {
      // NEVER expose private owner documents via a public storage URL!
      // Store payload inside the authenticated database record and serve only via authenticated CRM route.
      privatePayload = file_data;
      fileUrl = `/api/crm/properties/documents/${id}`;
    } else {
      const uploaded = await uploadPhotoToSupabaseStorage(
        file_data,
        file_name || 'property-photo.jpg',
        property_id || lead_id
      );
      fileUrl = uploaded.publicUrl;
      storagePath = uploaded.storagePath;
    }

    const imageRecord = {
      id,
      property_id: property_id || undefined,
      lead_id: lead_id || undefined,
      category,
      file_name: (file_name || `${category} File`).trim(),
      file_url: fileUrl,
      public_url: isPrivateDoc ? null : fileUrl,
      storage_path: storagePath,
      is_private_document: isPrivateDoc,
      private_payload: privatePayload,
      mime_type: mime_type || 'image/jpeg',
      uploaded_by: user.id,
      uploaded_by_name: user.name,
      created_at: now
    };

    const saved = await sbUpsert('property_images', imageRecord, property_id || lead_id);
    const safeResponse = formatImageAliases(saved);

    await recordPropertyActivity({
      lead_id: lead_id || undefined,
      property_id: property_id || undefined,
      entity_type: 'image',
      entity_id: id,
      action: isPrivateDoc ? 'PRIVATE_DOCUMENT_UPLOADED' : 'PHOTO_UPLOADED',
      description: `${isPrivateDoc ? 'Private owner document' : 'Property photo'} "${imageRecord.file_name}" uploaded under "${category}" by ${user.name}.`,
      user
    });

    res.status(201).json({
      success: true,
      image: safeResponse
    });
  } catch (err: any) {
    console.error('[Properties CRM] Error uploading property media:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error saving property media' });
  }
});

// Authenticated endpoint to view private owner documents (Never exposed publicly)
propertyCrmRouter.get('/documents/:imageId', async (req: Request, res: Response) => {
  try {
    const img = await sbSelectById('property_images', req.params.imageId);
    if (!img) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }
    const docPayload = {
      id: img.id,
      file_name: img.file_name,
      category: img.category,
      mime_type: img.mime_type || 'image/jpeg',
      data_url: img.private_payload || img.file_url,
      uploaded_by_name: img.uploaded_by_name,
      created_at: img.created_at
    };
    res.json({
      success: true,
      ...docPayload,
      document: docPayload
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Error retrieving private document' });
  }
});

propertyCrmRouter.delete('/media/:imageId', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const imgId = req.params.imageId;
    const existing = await sbSelectById('property_images', imgId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Image or document not found.' });
    }

    if (existing.storage_path && !existing.is_private_document) {
      const { url, key } = getSupabaseCredentials();
      await fetch(`${url}/storage/v1/object/${existing.storage_path}`, {
        method: 'DELETE',
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      }).catch(() => {});
    }

    await sbDeleteById('property_images', imgId);

    await recordPropertyActivity({
      lead_id: existing.lead_id,
      property_id: existing.property_id,
      entity_type: 'image',
      entity_id: imgId,
      action: 'MEDIA_REMOVED',
      description: `Removed ${existing.is_private_document ? 'private document' : 'photo'} "${existing.file_name}" (${existing.category}) by ${user.name}.`,
      user
    });

    res.json({ success: true, message: 'Media removed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error deleting media' });
  }
});

// -----------------------------------------------------------------------------
// 6. TENANT ENQUIRIES CRUD
// -----------------------------------------------------------------------------
propertyCrmRouter.get('/enquiries', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const status = (req.query.enquiry_status as string) || '';

    const all = await sbSelectAll('property_tenant_enquiries');
    let list = all.filter((e: any) => !e.is_archived).map(formatEnquiryAliases);

    if (search) {
      list = list.filter(
        (e: any) =>
          (e.id || '').toLowerCase().includes(search) ||
          (e.tenant_name || '').toLowerCase().includes(search) ||
          (e.tenant_mobile || '').toLowerCase().includes(search) ||
          (e.preferred_location || '').toLowerCase().includes(search) ||
          (e.property_title || '').toLowerCase().includes(search)
      );
    }

    if (status && status !== 'All') {
      list = list.filter((e: any) => e.enquiry_status === status);
    }

    list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      total: list.length,
      enquiries: list
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error loading tenant enquiries' });
  }
});

propertyCrmRouter.post('/enquiries', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const body = req.body || {};
    const tenantName = (body.tenant_name || '').trim();
    const mobile = (body.tenant_mobile || body.mobile_number || '').trim();

    if (!tenantName || !mobile) {
      return res.status(400).json({ success: false, error: 'Tenant Name and Mobile Number are required.' });
    }
    if (mobile.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Tenant Mobile Number.' });
    }

    const normMobile = normalizePhone(mobile);
    const propId = body.property_id || body.interested_property_id || undefined;
    const propTitle = (body.property_title || body.interested_property_title || '').trim() || undefined;
    const propType = body.property_type_needed || body.property_type || '2 BHK';

    const existingAll = await sbSelectAll('property_tenant_enquiries');
    const recentDup = existingAll.find(
      (e: any) =>
        !e.is_archived &&
        (e.normalized_mobile || normalizePhone(e.mobile_number || e.tenant_mobile || '')) === normMobile &&
        (e.interested_property_id || e.property_id || '') === (propId || '') &&
        Date.now() - new Date(e.created_at || 0).getTime() < 60000
    );
    if (recentDup) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        error: `Duplicate submission prevented: Enquiry ${recentDup.id} for "${tenantName}" was just created.`
      });
    }

    const now = new Date().toISOString();
    const enqId = generateUniqueId('REP-ENQ');
    const record = {
      id: enqId,
      enquiry_code: enqId,
      enquiry_date: body.enquiry_date || getIstDateString(),
      tenant_name: tenantName,
      mobile_number: normMobile,
      tenant_mobile: normMobile,
      normalized_mobile: normMobile,
      email: (body.tenant_email || body.email || '').trim() || undefined,
      tenant_email: (body.tenant_email || body.email || '').trim() || undefined,
      interested_property_id: propId,
      property_id: propId,
      interested_property_title: propTitle,
      property_title: propTitle,
      preferred_location: (body.preferred_location || '').trim() || undefined,
      property_type: propType,
      property_type_needed: propType,
      budget: body.budget !== undefined && body.budget !== '' ? Number(body.budget) || 0 : 0,
      budget_range: (body.budget_range || (body.budget ? String(body.budget) : '')).trim() || undefined,
      move_in_date: body.move_in_date || undefined,
      family_or_company_profile: (body.family_or_company_profile || '').trim() || undefined,
      requirements: (body.requirements || '').trim() || undefined,
      enquiry_source: body.enquiry_source || 'Direct Call',
      assigned_staff_id: body.assigned_staff_id || user.id,
      assigned_staff_name: (body.assigned_telecaller || body.assigned_staff_name || '').trim() || user.name,
      assigned_telecaller: (body.assigned_telecaller || body.assigned_staff_name || '').trim() || user.name,
      enquiry_status: body.enquiry_status || 'New Enquiry',
      notes: (body.notes || '').trim() || undefined,
      is_archived: false,
      created_by: user.id,
      created_by_name: user.name,
      updated_by: user.id,
      updated_by_name: user.name,
      created_at: now,
      updated_at: now
    };

    const saved = await sbUpsert('property_tenant_enquiries', record, record.interested_property_id);

    await recordPropertyActivity({
      property_id: record.interested_property_id,
      entity_type: 'enquiry',
      entity_id: record.id,
      action: 'TENANT_ENQUIRY_CREATED',
      description: `Tenant enquiry created for ${record.tenant_name} (${record.property_type || 'Any'} in ${record.preferred_location || 'Bengaluru'}).`,
      new_status: record.enquiry_status,
      user
    });

    res.status(201).json({ success: true, enquiry: formatEnquiryAliases(saved) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error saving tenant enquiry' });
  }
});

propertyCrmRouter.put('/enquiries/:id', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const enqId = req.params.id;
    const existingRaw = await sbSelectById('property_tenant_enquiries', enqId);
    if (!existingRaw || existingRaw.is_archived) {
      return res.status(404).json({ success: false, error: 'Tenant enquiry not found.' });
    }
    const existing = formatEnquiryAliases(existingRaw);

    const body = req.body || {};
    const now = new Date().toISOString();
    const mobRaw = body.tenant_mobile || body.mobile_number;
    const normMob = mobRaw ? normalizePhone(mobRaw) : existing.mobile_number || existing.tenant_mobile;
    const propId = body.property_id !== undefined ? body.property_id : body.interested_property_id ?? existing.interested_property_id;
    const propTitle = body.property_title ?? body.interested_property_title ?? existing.interested_property_title;
    const propType = body.property_type_needed ?? body.property_type ?? existing.property_type;

    const updated = {
      ...existing,
      enquiry_code: existing.enquiry_code || existing.id,
      enquiry_date: body.enquiry_date ?? existing.enquiry_date,
      tenant_name: body.tenant_name ? body.tenant_name.trim() : existing.tenant_name,
      mobile_number: normMob,
      tenant_mobile: normMob,
      normalized_mobile: normMob,
      email: body.tenant_email ?? body.email ?? existing.email,
      tenant_email: body.tenant_email ?? body.email ?? existing.tenant_email,
      interested_property_id: propId,
      property_id: propId,
      interested_property_title: propTitle,
      property_title: propTitle,
      preferred_location: body.preferred_location ?? existing.preferred_location,
      property_type: propType,
      property_type_needed: propType,
      budget: body.budget !== undefined ? Number(body.budget) || 0 : existing.budget,
      budget_range: body.budget_range ?? existing.budget_range,
      move_in_date: body.move_in_date ?? existing.move_in_date,
      family_or_company_profile: body.family_or_company_profile ?? existing.family_or_company_profile,
      requirements: body.requirements ?? existing.requirements,
      enquiry_source: body.enquiry_source ?? existing.enquiry_source,
      assigned_staff_id: body.assigned_staff_id ?? existing.assigned_staff_id,
      assigned_staff_name: body.assigned_telecaller ?? body.assigned_staff_name ?? existing.assigned_staff_name,
      assigned_telecaller: body.assigned_telecaller ?? body.assigned_staff_name ?? existing.assigned_telecaller,
      enquiry_status: body.enquiry_status || existing.enquiry_status,
      notes: body.notes ?? existing.notes,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const saved = await sbUpsert('property_tenant_enquiries', updated, updated.interested_property_id || undefined);

    await recordPropertyActivity({
      property_id: updated.interested_property_id || undefined,
      entity_type: 'enquiry',
      entity_id: enqId,
      action: 'TENANT_ENQUIRY_UPDATED',
      description: `Tenant enquiry ${enqId} (${updated.tenant_name}) updated to status "${updated.enquiry_status}".`,
      previous_status: existing.enquiry_status,
      new_status: updated.enquiry_status,
      user
    });

    res.json({ success: true, enquiry: formatEnquiryAliases(saved) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error updating tenant enquiry' });
  }
});

// -----------------------------------------------------------------------------
// 7. SITE VISITS CRUD
// -----------------------------------------------------------------------------
propertyCrmRouter.get('/site-visits', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const status = (req.query.visit_status as string) || '';
    const propertyId = (req.query.property_id as string) || '';

    const all = await sbSelectAll('property_site_visits');
    let list = all.filter((v: any) => !v.is_archived).map(formatVisitAliases);

    if (propertyId) {
      list = list.filter((v: any) => v.property_id === propertyId);
    }

    if (search) {
      list = list.filter(
        (v: any) =>
          (v.id || '').toLowerCase().includes(search) ||
          (v.tenant_name || '').toLowerCase().includes(search) ||
          (v.tenant_mobile || '').toLowerCase().includes(search) ||
          (v.owner_name || '').toLowerCase().includes(search) ||
          (v.property_title || '').toLowerCase().includes(search)
      );
    }

    if (status && status !== 'All') {
      list = list.filter((v: any) => v.visit_status === status);
    }

    list.sort((a: any, b: any) => {
      const da = `${a.scheduled_date || ''}T${a.scheduled_time || '00:00'}`;
      const db = `${b.scheduled_date || ''}T${b.scheduled_time || '00:00'}`;
      return db.localeCompare(da);
    });

    res.json({
      success: true,
      total: list.length,
      visits: list,
      siteVisits: list
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error loading site visits' });
  }
});

propertyCrmRouter.post('/site-visits', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const body = req.body || {};

    const tenantContact = (body.tenant_mobile || body.tenant_contact || '').trim();
    const visitDate = body.visit_date || body.scheduled_date || getIstDateString();
    const visitTime = body.visit_time || body.scheduled_time || '11:00 AM';
    const enqId = body.tenant_enquiry_id || body.enquiry_id || undefined;
    const assignedStaff = (body.assigned_staff || body.assigned_staff_name || '').trim() || user.name;

    if (!body.property_id) {
      return res.status(400).json({ success: false, error: 'Property selection is required for scheduling a site visit.' });
    }
    if (!body.tenant_name) {
      return res.status(400).json({ success: false, error: 'Tenant Name is required.' });
    }

    const now = new Date().toISOString();
    const visitId = generateUniqueId('REP-SV');
    const normContact = tenantContact ? normalizePhone(tenantContact) : '';
    const feedback = (body.tenant_feedback ?? body.visit_feedback ?? '').trim() || undefined;
    const record = {
      id: visitId,
      visit_code: visitId,
      property_id: body.property_id,
      property_title: (body.property_title || '').trim() || undefined,
      lead_id: body.lead_id || undefined,
      enquiry_id: enqId,
      tenant_enquiry_id: enqId,
      tenant_name: body.tenant_name.trim(),
      tenant_contact: normContact,
      tenant_mobile: normContact,
      owner_name: (body.owner_name || '').trim() || undefined,
      scheduled_date: visitDate,
      visit_date: visitDate,
      scheduled_time: visitTime,
      visit_time: visitTime,
      assigned_staff_id: body.assigned_staff_id || user.id,
      assigned_staff_name: assignedStaff,
      assigned_staff: assignedStaff,
      visit_status: body.visit_status || 'Scheduled',
      visit_feedback: feedback,
      tenant_feedback: feedback,
      owner_feedback: (body.owner_feedback || '').trim() || undefined,
      next_action: (body.next_action || '').trim() || undefined,
      is_archived: false,
      created_by: user.id,
      created_by_name: user.name,
      updated_by: user.id,
      updated_by_name: user.name,
      created_at: now,
      updated_at: now
    };

    const saved = await sbUpsert('property_site_visits', record, record.property_id);

    await recordPropertyActivity({
      lead_id: record.lead_id,
      property_id: record.property_id,
      entity_type: 'site_visit',
      entity_id: record.id,
      action: 'SITE_VISIT_SCHEDULED',
      description: `Site visit scheduled for tenant ${record.tenant_name} at "${record.property_title || record.property_id}" on ${record.scheduled_date} ${record.scheduled_time}.`,
      new_status: record.visit_status,
      user
    });

    const formatted = formatVisitAliases(saved);
    res.status(201).json({ success: true, visit: formatted, siteVisit: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error saving site visit' });
  }
});

propertyCrmRouter.put('/site-visits/:id', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const visitId = req.params.id;
    const existing = await sbSelectById('property_site_visits', visitId);
    if (!existing || existing.is_archived) {
      return res.status(404).json({ success: false, error: 'Site visit record not found.' });
    }

    const body = req.body || {};
    const now = new Date().toISOString();
    const contactRaw = body.tenant_mobile || body.tenant_contact;
    const normContact = contactRaw ? normalizePhone(contactRaw) : existing.tenant_contact || existing.tenant_mobile;
    const vDate = body.visit_date ?? body.scheduled_date ?? existing.scheduled_date;
    const vTime = body.visit_time ?? body.scheduled_time ?? existing.scheduled_time;
    const staffName = body.assigned_staff ?? body.assigned_staff_name ?? existing.assigned_staff_name;
    const feedback = body.tenant_feedback ?? body.visit_feedback ?? existing.visit_feedback;

    const updated = {
      ...existing,
      visit_code: existing.visit_code || existing.id,
      property_id: body.property_id ?? existing.property_id,
      property_title: body.property_title ?? existing.property_title,
      tenant_name: body.tenant_name ? body.tenant_name.trim() : existing.tenant_name,
      tenant_contact: normContact,
      tenant_mobile: normContact,
      owner_name: body.owner_name ?? existing.owner_name,
      scheduled_date: vDate,
      visit_date: vDate,
      scheduled_time: vTime,
      visit_time: vTime,
      assigned_staff_id: body.assigned_staff_id ?? existing.assigned_staff_id,
      assigned_staff_name: staffName,
      assigned_staff: staffName,
      visit_status: body.visit_status || existing.visit_status,
      visit_feedback: feedback,
      tenant_feedback: feedback,
      owner_feedback: body.owner_feedback ?? existing.owner_feedback,
      next_action: body.next_action ?? existing.next_action,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const saved = await sbUpsert('property_site_visits', updated, updated.property_id);

    await recordPropertyActivity({
      lead_id: updated.lead_id,
      property_id: updated.property_id,
      entity_type: 'site_visit',
      entity_id: visitId,
      action: 'SITE_VISIT_UPDATED',
      description: `Site visit ${visitId} (${updated.tenant_name}) updated to "${updated.visit_status}".`,
      previous_status: existing.visit_status,
      new_status: updated.visit_status,
      user
    });

    const formatted = formatVisitAliases(saved);
    res.json({ success: true, visit: formatted, siteVisit: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error updating site visit' });
  }
});

// -----------------------------------------------------------------------------
// 8. DEALS & PLACEMENT FEE TRACKING + PAYMENT HISTORY
// -----------------------------------------------------------------------------
propertyCrmRouter.get('/deals', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const status = (req.query.payment_status as string) || '';

    const [allDeals, allPayments] = await Promise.all([
      sbSelectAll('property_deals'),
      sbSelectAll('property_payments')
    ]);

    let list = allDeals.filter((d: any) => !d.is_archived).map(formatDealAliases);

    if (search) {
      list = list.filter(
        (d: any) =>
          (d.id || '').toLowerCase().includes(search) ||
          (d.property_title || '').toLowerCase().includes(search) ||
          (d.owner_name || '').toLowerCase().includes(search) ||
          (d.tenant_name || '').toLowerCase().includes(search) ||
          (d.tenant_mobile || '').toLowerCase().includes(search) ||
          (d.transaction_reference || '').toLowerCase().includes(search)
      );
    }

    if (status && status !== 'All') {
      list = list.filter((d: any) => d.payment_status === status);
    }

    const enriched = list
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((d: any) => ({
        ...d,
        payments: allPayments
          .filter((p: any) => p.deal_id === d.id)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }));

    res.json({
      success: true,
      total: enriched.length,
      deals: enriched
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error loading deals & payments' });
  }
});

propertyCrmRouter.post('/deals', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const body = req.body || {};

    if (!body.property_id) {
      return res.status(400).json({ success: false, error: 'Property selection is required.' });
    }
    if (!body.owner_name || !body.tenant_name) {
      return res.status(400).json({
        success: false,
        error: 'Owner Name and Tenant Name are required.'
      });
    }

    const placementFee = Number(body.placement_fee_expected ?? body.placement_fee) || 0;
    const monthlyRent = Number(body.final_monthly_rent ?? body.monthly_rent) || 0;
    const amountReceived = Number(body.amount_received) || 0;
    const amountDue = Math.max(0, placementFee - amountReceived);

    let paymentStatus = body.payment_status;
    if (!paymentStatus) {
      if (amountReceived <= 0) paymentStatus = 'Pending';
      else if (amountReceived >= placementFee && placementFee > 0) paymentStatus = 'Paid';
      else paymentStatus = 'Partially Paid';
    }

    const now = new Date().toISOString();
    const dealId = generateUniqueId('REP-DL');
    const confirmedDate = body.deal_confirmed_date || body.agreement_date || getIstDateString();

    const dealRecord = {
      id: dealId,
      deal_code: dealId,
      property_id: body.property_id,
      property_title: (body.property_title || '').trim() || undefined,
      lead_id: body.lead_id || undefined,
      owner_name: body.owner_name.trim(),
      tenant_name: body.tenant_name.trim(),
      tenant_mobile: body.tenant_mobile ? normalizePhone(body.tenant_mobile) : '',
      monthly_rent: monthlyRent,
      final_monthly_rent: monthlyRent,
      security_deposit: Number(body.security_deposit) || 0,
      agreement_date: confirmedDate,
      deal_confirmed_date: confirmedDate,
      move_in_date: body.move_in_date || undefined,
      placement_fee: placementFee,
      placement_fee_expected: placementFee,
      placement_fee_payer: body.placement_fee_payer || 'Tenant',
      amount_due: amountDue,
      amount_received: amountReceived,
      payment_date: body.payment_date || (amountReceived > 0 ? getIstDateString() : undefined),
      payment_mode: (body.payment_mode || '').trim() || undefined,
      transaction_reference: (body.transaction_reference || '').trim() || undefined,
      payment_status: paymentStatus,
      handled_by: (body.handled_by || '').trim() || user.name,
      notes: (body.notes || '').trim() || undefined,
      is_archived: false,
      created_by: user.id,
      created_by_name: user.name,
      updated_by: user.id,
      updated_by_name: user.name,
      created_at: now,
      updated_at: now
    };

    const savedDeal = await sbUpsert('property_deals', dealRecord, dealRecord.property_id);

    const payments: any[] = [];
    if (amountReceived > 0) {
      const initialPayment = {
        id: generateUniqueId('REP-PAY'),
        deal_id: dealId,
        property_id: dealRecord.property_id,
        amount: amountReceived,
        payment_date: dealRecord.payment_date || getIstDateString(),
        payment_mode: dealRecord.payment_mode || 'UPI / Bank Transfer',
        transaction_reference: dealRecord.transaction_reference || undefined,
        payment_status: paymentStatus,
        notes: dealRecord.notes || 'Initial placement fee payment recorded with deal.',
        recorded_by: user.id,
        recorded_by_name: user.name,
        created_at: now
      };
      const savedPayment = await sbUpsert('property_payments', initialPayment, dealId);
      payments.push(savedPayment);
    }

    if (paymentStatus !== 'Cancelled') {
      const prop = await sbSelectById('properties', dealRecord.property_id);
      if (prop && !prop.is_archived && prop.listing_status !== 'Rented') {
        const history = Array.isArray(prop.approval_history) ? [...prop.approval_history] : [];
        history.unshift({
          action: 'RENTED',
          status: 'Rented',
          notes: `Rental deal ${dealId} closed with tenant ${dealRecord.tenant_name}.`,
          staff_id: user.id,
          staff_name: user.name,
          timestamp: now
        });
        await sbUpsert(
          'properties',
          {
            ...prop,
            listing_status: 'Rented',
            approval_history: history,
            updated_by: user.id,
            updated_by_name: user.name,
            updated_at: now
          },
          prop.lead_id
        );
      }
    }

    await recordPropertyActivity({
      lead_id: dealRecord.lead_id,
      property_id: dealRecord.property_id,
      entity_type: 'deal',
      entity_id: dealId,
      action: 'DEAL_CREATED',
      description: `Rental deal ${dealId} created for "${dealRecord.property_title || dealRecord.property_id}" (Tenant: ${dealRecord.tenant_name}, Rent: ₹${dealRecord.monthly_rent.toLocaleString('en-IN')}, Placement Fee: ₹${placementFee.toLocaleString('en-IN')}, Received: ₹${amountReceived.toLocaleString('en-IN')}).`,
      new_status: paymentStatus,
      user
    });

    res.status(201).json({
      success: true,
      deal: {
        ...formatDealAliases(savedDeal),
        payments
      }
    });
  } catch (err: any) {
    console.error('[Properties CRM] Error creating deal:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error saving rental deal' });
  }
});

propertyCrmRouter.put('/deals/:id', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const dealId = req.params.id;
    const existing = await sbSelectById('property_deals', dealId);
    if (!existing || existing.is_archived) {
      return res.status(404).json({ success: false, error: 'Deal not found.' });
    }

    const body = req.body || {};
    const placementFee =
      body.placement_fee_expected !== undefined
        ? Number(body.placement_fee_expected) || 0
        : body.placement_fee !== undefined
        ? Number(body.placement_fee) || 0
        : Number(existing.placement_fee_expected ?? existing.placement_fee) || 0;
    const monthlyRent =
      body.final_monthly_rent !== undefined
        ? Number(body.final_monthly_rent) || 0
        : body.monthly_rent !== undefined
        ? Number(body.monthly_rent) || 0
        : Number(existing.final_monthly_rent ?? existing.monthly_rent) || 0;
    const amountReceived =
      body.amount_received !== undefined ? Number(body.amount_received) || 0 : Number(existing.amount_received) || 0;
    const amountDue = Math.max(0, placementFee - amountReceived);

    let paymentStatus = body.payment_status || existing.payment_status;
    if (paymentStatus !== 'Cancelled') {
      if (amountReceived <= 0) paymentStatus = 'Pending';
      else if (amountReceived >= placementFee && placementFee > 0) paymentStatus = 'Paid';
      else paymentStatus = 'Partially Paid';
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      deal_code: existing.deal_code || existing.id,
      owner_name: body.owner_name ?? existing.owner_name,
      tenant_name: body.tenant_name ?? existing.tenant_name,
      tenant_mobile: body.tenant_mobile ? normalizePhone(body.tenant_mobile) : existing.tenant_mobile,
      monthly_rent: monthlyRent,
      final_monthly_rent: monthlyRent,
      security_deposit:
        body.security_deposit !== undefined ? Number(body.security_deposit) || 0 : existing.security_deposit,
      agreement_date: body.deal_confirmed_date ?? body.agreement_date ?? existing.agreement_date,
      deal_confirmed_date: body.deal_confirmed_date ?? body.agreement_date ?? existing.deal_confirmed_date,
      move_in_date: body.move_in_date ?? existing.move_in_date,
      placement_fee: placementFee,
      placement_fee_expected: placementFee,
      placement_fee_payer: body.placement_fee_payer ?? existing.placement_fee_payer,
      amount_due: amountDue,
      amount_received: amountReceived,
      payment_date: body.payment_date ?? existing.payment_date,
      payment_mode: body.payment_mode ?? existing.payment_mode,
      transaction_reference: body.transaction_reference ?? existing.transaction_reference,
      payment_status: paymentStatus,
      handled_by: body.handled_by ?? existing.handled_by,
      notes: body.notes ?? existing.notes,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const saved = await sbUpsert('property_deals', updated, updated.property_id);

    await recordPropertyActivity({
      lead_id: updated.lead_id,
      property_id: updated.property_id,
      entity_type: 'deal',
      entity_id: dealId,
      action: 'DEAL_UPDATED',
      description: `Deal ${dealId} updated by ${user.name} (Payment Status: ${paymentStatus}, Received: ₹${amountReceived.toLocaleString('en-IN')}, Due: ₹${amountDue.toLocaleString('en-IN')}).`,
      previous_status: existing.payment_status,
      new_status: paymentStatus,
      user
    });

    res.json({ success: true, deal: formatDealAliases(saved) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error updating deal' });
  }
});

propertyCrmRouter.post('/deals/:id/payments', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const dealId = req.params.id;
    const deal = await sbSelectById('property_deals', dealId);
    if (!deal || deal.is_archived) {
      return res.status(404).json({ success: false, error: 'Deal record not found.' });
    }

    const body = req.body || {};
    const amount = Number(body.amount) || 0;
    if (amount <= 0) {
      return res.status(400).json({ success: false, error: 'Payment amount must be greater than zero.' });
    }
    if (!body.payment_mode) {
      return res.status(400).json({ success: false, error: 'Payment Mode is required.' });
    }

    const now = new Date().toISOString();
    const newTotalReceived = (Number(deal.amount_received) || 0) + amount;
    const placementFee = Number(deal.placement_fee_expected ?? deal.placement_fee) || 0;
    const newAmountDue = Math.max(0, placementFee - newTotalReceived);
    const nextStatus =
      newTotalReceived >= placementFee && placementFee > 0 ? 'Paid' : 'Partially Paid';

    const paymentRecord = {
      id: generateUniqueId('REP-PAY'),
      deal_id: dealId,
      property_id: deal.property_id,
      amount,
      payment_date: body.payment_date || getIstDateString(),
      payment_mode: body.payment_mode,
      transaction_reference: (body.transaction_reference || '').trim() || undefined,
      payment_status: nextStatus,
      notes: (body.notes || '').trim() || undefined,
      recorded_by: user.id,
      recorded_by_name: user.name,
      created_at: now
    };

    const savedPayment = await sbUpsert('property_payments', paymentRecord, dealId);

    const updatedDeal = {
      ...deal,
      amount_received: newTotalReceived,
      amount_due: newAmountDue,
      payment_date: paymentRecord.payment_date,
      payment_mode: paymentRecord.payment_mode,
      transaction_reference: paymentRecord.transaction_reference || deal.transaction_reference,
      payment_status: nextStatus,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const savedDeal = await sbUpsert('property_deals', updatedDeal, deal.property_id);

    await recordPropertyActivity({
      lead_id: deal.lead_id,
      property_id: deal.property_id,
      entity_type: 'payment',
      entity_id: savedPayment.id,
      action: 'PAYMENT_RECORDED',
      description: `Placement fee payment of ₹${amount.toLocaleString('en-IN')} recorded via ${paymentRecord.payment_mode} for Deal ${dealId} by ${user.name}.`,
      previous_status: deal.payment_status,
      new_status: nextStatus,
      user
    });

    res.status(201).json({
      success: true,
      payment: savedPayment,
      deal: formatDealAliases(savedDeal)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error recording placement fee payment' });
  }
});
