import express, { Request, Response, NextFunction } from 'express';
import {
  extractUserFromReq,
  normalizePhone,
  getIstDateString,
  ServerCrmUser,
  getActiveCrmStaffList,
  createOrCheckInteriorCrmLeadFromPropertyDeal
} from './crmRoutes';
import { sendLeadNotificationEmail } from './emailNotificationService';

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
  const { cleanNotes, meta: existingMeta } = decodeEnquiryMetadataFromNotes(notes);
  const meta: Record<string, any> = { ...existingMeta };
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined) {
        if (v === null || v === '') {
          delete meta[k];
        } else {
          meta[k] = v;
        }
      }
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
      ui_status: rec.enquiry_status,
      lead_id: rec.lead_id,
      property_category: rec.property_category,
      bhk_requirement: rec.bhk_requirement,
      min_budget: rec.min_budget,
      max_budget: rec.max_budget,
      budget_range: rec.budget_range,
      furnishing_preference: rec.furnishing_preference,
      move_in_date: rec.move_in_date,
      parking_requirement: rec.parking_requirement,
      family_or_company_profile: rec.family_or_company_profile || rec.tenant_profile,
      tenant_profile: rec.tenant_profile || rec.family_or_company_profile,
      number_of_occupants: rec.number_of_occupants,
      additional_requirements: rec.additional_requirements,
      next_followup_date: rec.next_followup_date,
      followup_notes: rec.followup_notes,
      last_contact_date: rec.last_contact_date,
      preferred_contact_time: rec.preferred_contact_time,
      preferred_visit_date: rec.preferred_visit_date,
      preferred_visit_time: rec.preferred_visit_time,
      consent_to_contact: rec.consent_to_contact,
      call_history: rec.call_history,
      original_expected_rent: rec.original_expected_rent,
      tenant_offered_rent: rec.tenant_offered_rent,
      owner_expected_rent: rec.owner_expected_rent,
      final_agreed_rent: rec.final_agreed_rent,
      original_deposit: rec.original_deposit,
      final_agreed_deposit: rec.final_agreed_deposit,
      maintenance_charges: rec.maintenance_charges,
      negotiation_notes: rec.negotiation_notes,
      negotiation_status: rec.negotiation_status,
      negotiation_history: rec.negotiation_history
    });
  } else if (table === 'property_site_visits') {
    if (rec.tenant_feedback !== undefined && !rec.visit_feedback) {
      rec.visit_feedback = rec.tenant_feedback;
    }
    rec.next_action = encodeEnquiryMetadataInNotes(rec.next_action, {
      owner_mobile: rec.owner_mobile,
      followup_notes: rec.followup_notes,
      reschedule_reason: rec.reschedule_reason,
      cancel_reason: rec.cancel_reason,
      visit_number: rec.visit_number,
      visit_history: rec.visit_history
    });
  } else if (table === 'property_deals') {
    rec.notes = encodeEnquiryMetadataInNotes(rec.notes, {
      deal_status: rec.deal_status,
      tenant_enquiry_id: rec.tenant_enquiry_id || rec.enquiry_id,
      site_visit_id: rec.site_visit_id,
      owner_mobile: rec.owner_mobile,
      tenant_email: rec.tenant_email,
      maintenance_charges: rec.maintenance_charges,
      rental_duration: rec.rental_duration,
      final_negotiated_terms: rec.final_negotiated_terms,
      receipt_number: rec.receipt_number,
      handled_by: rec.handled_by,
      interior_interest: rec.interior_interest,
      interior_service_requirement: rec.interior_service_requirement,
      interior_followup_date: rec.interior_followup_date,
      interior_notes: rec.interior_notes,
      interior_contact_person: rec.interior_contact_person,
      linked_interior_lead_id: rec.linked_interior_lead_id
    });
  } else if (table === 'property_payments') {
    rec.notes = encodeEnquiryMetadataInNotes(rec.notes, {
      receipt_number: rec.receipt_number
    });
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
    // Graceful compatibility if live DB constraint on public.properties hasn't had optional ALTER TABLE applied for new Phase 2 status labels
    if (table === 'properties' && errText.includes('properties_listing_status_check')) {
      const requestedStatus = payload.listing_status;
      const compatStatusMap: Record<string, string> = {
        'Ready to Publish': 'Approved',
        'Unpublished': 'Approved',
        'Archived': 'Unavailable',
        'Occupied': 'Rented'
      };
      const fallbackDbStatus = compatStatusMap[requestedStatus] || 'Approved';
      const history = Array.isArray(payload.approval_history) ? [...payload.approval_history] : [];
      if (history.length > 0 && history[0]?.status === requestedStatus) {
        history[0] = { ...history[0], db_compat: true, status: requestedStatus };
      } else {
        history.unshift({
          action: `STATUS_${String(requestedStatus).toUpperCase().replace(/\s+/g, '_')}`,
          status: requestedStatus,
          db_compat: true,
          notes: `Status set to ${requestedStatus}`,
          timestamp: new Date().toISOString()
        });
      }
      const retryPayload = {
        ...payload,
        listing_status: fallbackDbStatus,
        is_archived: requestedStatus === 'Archived' ? true : Boolean(payload.is_archived),
        approval_history: history
      };
      const retryRes = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(retryPayload)
      });
      if (retryRes.ok) {
        const retryRows = await retryRes.json();
        const row = Array.isArray(retryRows) && retryRows.length > 0 ? retryRows[0] : retryPayload;
        return { ...row, listing_status: requestedStatus } as T;
      }
    }
    if (table === 'property_tenant_enquiries' && errText.includes('property_tenant_enquiries_enquiry_status_check')) {
      const requestedEnqStatus = payload.enquiry_status;
      const compatEnqMap: Record<string, string> = {
        'Site Visit Required': 'Interested',
        'Deal Completed': 'Converted',
        'Lost': 'Closed'
      };
      const fallbackEnqStatus = compatEnqMap[requestedEnqStatus] || 'Contacted';
      const retryPayload = {
        ...payload,
        enquiry_status: fallbackEnqStatus
      };
      const retryRes = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(retryPayload)
      });
      if (retryRes.ok) {
        const retryRows = await retryRes.json();
        const row = Array.isArray(retryRows) && retryRows.length > 0 ? retryRows[0] : retryPayload;
        return { ...row, enquiry_status: requestedEnqStatus } as T;
      }
    }
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
// PHASE 2: PUBLIC WEBSITE INTEGRATION HELPERS & STRICT PRIVACY FILTERING
// Returns ONLY verified, approved, and published properties with public media.
// Owner phone numbers, owner emails, full residential street addresses, private
// documents, and internal verification notes are NEVER exposed publicly.
// -----------------------------------------------------------------------------
function slugifySegment(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generatePublicPropertySlug(prop: any): string {
  const titleSlug = slugifySegment(prop.property_title || prop.property_type || 'rental-property');
  const localitySlug = slugifySegment(prop.locality || 'bengaluru');
  const idSlug = slugifySegment(prop.id || '');
  const baseSlug = titleSlug.includes(localitySlug) ? titleSlug : `${titleSlug}-${localitySlug}`;
  return idSlug ? `${baseSlug}-${idSlug}` : baseSlug;
}

export function isPropertyPubliclyVisible(rawProp: any): boolean {
  if (!rawProp) return false;
  const p = formatPropertyAliases(rawProp);
  if (p.is_archived || p.listing_status === 'Archived') return false;

  // Phase 3 Rule: Rented and Unavailable properties must disappear from public website listings
  if (
    p.availability_status === 'Rented' ||
    p.availability_status === 'Unavailable' ||
    ['Rented', 'Occupied', 'Unavailable', 'Rejected', 'Unpublished', 'Draft', 'Details Pending', 'Verification Pending'].includes(
      p.listing_status
    )
  ) {
    return false;
  }

  const isVerified =
    p.owner_identity_verified === 'Yes' &&
    p.ownership_auth_confirmed === 'Yes' &&
    p.availability_confirmed === 'Yes' &&
    p.permission_to_advertise === 'Yes';

  // Only properties explicitly marked 'Published' are displayed on the public website
  const isPublished = p.listing_status === 'Published';
  return isVerified && isPublished;
}

const DEFAULT_PROPERTY_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

export function toPublicPropertyListing(rawProp: any, allImages: any[]) {
  const p = formatPropertyAliases(rawProp);
  const publicPhotos = allImages
    .filter(
      (img: any) =>
        (img.property_id === p.id || (p.lead_id && img.lead_id === p.lead_id)) &&
        !img.is_private_document &&
        img.category !== 'Additional Documents' &&
        typeof img.file_url === 'string' &&
        !img.file_url.startsWith('/api/crm/')
    )
    .map((img: any) => ({
      id: img.id,
      category: img.category || 'Exterior Photos',
      file_name: img.file_name || 'Property Photo',
      url: img.public_url || img.file_url
    }))
    .filter((img: any) => Boolean(img.url));

  const featuredImage =
    publicPhotos.length > 0 ? publicPhotos[0].url : DEFAULT_PROPERTY_FALLBACK_IMAGE;

  const locality = (p.locality || 'Bengaluru').trim();
  const city = (p.city || 'Bengaluru').trim();
  const pinCode = (p.pin_code || '').trim();
  const approximateLocation = `${locality}${locality.toLowerCase() !== city.toLowerCase() ? `, ${city}` : ''}${pinCode ? ` - ${pinCode}` : ''}`;

  // Explicit allowlist of public-safe fields ONLY (never includes owner contact, full_address, or internal notes)
  const bhkVal = p.bhk_configuration || (p.property_type?.includes('BHK') ? p.property_type : 'N/A');
  const rentVal = Number(p.expected_monthly_rent) || 0;
  const descVal =
    p.property_description ||
    `Verified ${p.furnishing_status || ''} ${p.property_type || 'Property'} available for rent in ${locality}, ${city}. Managed by Royal Epic Properties.`;

  const resolvedAvailability = p.availability_status || 'Available';
  const acceptingEnquiries =
    resolvedAvailability !== 'Temporarily On Hold' &&
    resolvedAvailability !== 'Rented' &&
    resolvedAvailability !== 'Unavailable';

  return {
    id: p.id,
    property_id: p.id,
    property_code: p.property_code || p.id,
    slug: generatePublicPropertySlug(p),
    property_title: p.property_title || `${p.property_type || 'Rental Property'} in ${locality}`,
    property_category: (p.property_category || 'Residential') as 'Residential' | 'Commercial',
    property_type: p.property_type || '2 BHK',
    bhk_configuration: bhkVal,
    bhk_type: bhkVal,
    locality,
    city,
    pin_code: pinCode,
    pincode: pinCode,
    approximate_location: approximateLocation,
    expected_monthly_rent: rentVal,
    monthly_rent: rentVal,
    security_deposit: Number(p.security_deposit) || 0,
    maintenance_charges: Number(p.maintenance_charges) || 0,
    other_charges: p.other_charges || '',
    rent_negotiable: p.rent_negotiable !== 'No',
    deposit_negotiable: (p.deposit_negotiable === 'No' ? 'No' : 'Yes') as 'Yes' | 'No',
    built_up_area: Number(p.built_up_area) || 0,
    carpet_area: Number(p.carpet_area) || 0,
    area_unit: 'sq.ft',
    furnishing_status: (p.furnishing_status || 'Semi-Furnished') as any,
    bedrooms: Number(p.bedrooms) || 0,
    bathrooms: Number(p.bathrooms) || 0,
    balconies: Number(p.balconies) || 0,
    floor_number: p.floor_number || '',
    total_floors: p.total_floors || '',
    lift_available: (p.lift_available === 'Yes' ? 'Yes' : 'No') as 'Yes' | 'No',
    parking_availability: p.parking_availability || 'Available',
    available_from_date: p.available_from_date || 'Immediate',
    available_from: p.available_from_date || 'Immediate',
    preferred_tenant_type: 'Family / Working Professionals',
    power_backup: 'Available',
    water_supply: '24x7 Supply',
    facing: 'East',
    property_age: 'Well Maintained',
    availability_status: resolvedAvailability,
    accepting_enquiries: acceptingEnquiries,
    property_description: descVal,
    description: descVal,
    amenities: Array.isArray(p.amenities) ? p.amenities : [],
    listing_status: 'Published' as const,
    featured_image: featuredImage,
    main_image: featuredImage,
    photos: publicPhotos,
    images: publicPhotos,
    created_at: p.approved_at || p.created_at,
    published_at: p.approved_at || p.updated_at || p.created_at,
    updated_at: p.updated_at || p.created_at
  };
}

export async function getApprovedPublishedPropertiesForWebsite() {
  const [allProps, allImages] = await Promise.all([
    sbSelectAll('properties'),
    sbSelectAll('property_images')
  ]);

  return allProps
    .filter((p: any) => isPropertyPubliclyVisible(p))
    .sort(
      (a: any, b: any) =>
        new Date(b.approved_at || b.updated_at || b.created_at || 0).getTime() -
        new Date(a.approved_at || a.updated_at || a.created_at || 0).getTime()
    )
    .map((p: any) => toPublicPropertyListing(p, allImages));
}

export async function findPublicPropertyBySlugOrId(slugOrId: string) {
  if (!slugOrId) return null;
  const cleanTarget = decodeURIComponent(slugOrId)
    .toLowerCase()
    .trim()
    .replace(/^\/properties\//, '')
    .replace(/\/$/, '');

  const publishedList = await getApprovedPublishedPropertiesForWebsite();
  for (const item of publishedList) {
    if (item.slug.toLowerCase() === cleanTarget) return item;
    if (String(item.id).toLowerCase() === cleanTarget) return item;
    if (String(item.property_code).toLowerCase() === cleanTarget) return item;
    const idSlug = slugifySegment(item.id);
    if (idSlug && cleanTarget.endsWith(`-${idSlug}`)) return item;
    if (slugifySegment(item.property_title) === cleanTarget) return item;
  }
  return null;
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
  const rawHistory: any[] = Array.isArray(prop.approval_history) ? prop.approval_history : [];
  const latestListingHistory =
    rawHistory.find((h: any) => !h.is_availability_change && h.status) ||
    (rawHistory.length > 0 && rawHistory[0]?.listing_status_override
      ? { status: rawHistory[0].listing_status_override, db_compat: true }
      : null);

  const resolvedListingStatus =
    prop.is_archived
      ? 'Archived'
      : latestListingHistory &&
        latestListingHistory.status &&
        (latestListingHistory.db_compat ||
          ['Ready to Publish', 'Unpublished', 'Occupied', 'Archived'].includes(latestListingHistory.status))
      ? latestListingHistory.status
      : prop.listing_status;

  // Hydrate Phase 3 availability_history and availability_status from approval_history JSONB
  const availabilityHistory = rawHistory
    .filter((h: any) => Boolean(h && (h.is_availability_change || h.availability_status)))
    .map((h: any) => ({
      action: h.action || 'AVAILABILITY_UPDATED',
      status: h.availability_status || h.status || 'Available',
      previous_status: h.previous_status || undefined,
      owner_confirmed: Boolean(h.owner_confirmed),
      requires_owner_confirmation: Boolean(h.requires_owner_confirmation),
      notes: h.notes || '',
      staff_id: h.staff_id || '',
      staff_name: h.staff_name || 'Staff',
      timestamp: h.timestamp || prop.updated_at || prop.created_at
    }));

  const latestAvailEntry = availabilityHistory.length > 0 ? availabilityHistory[0] : null;
  const newestRawEntry = rawHistory.length > 0 ? rawHistory[0] : null;
  let resolvedAvailabilityStatus = prop.availability_status;
  if (!resolvedAvailabilityStatus) {
    if (newestRawEntry && (newestRawEntry.is_availability_change || newestRawEntry.availability_status)) {
      resolvedAvailabilityStatus = newestRawEntry.availability_status || newestRawEntry.status || 'Available';
    } else if (resolvedListingStatus === 'Rented' || resolvedListingStatus === 'Occupied') {
      resolvedAvailabilityStatus = 'Rented';
    } else if (resolvedListingStatus === 'Unavailable') {
      resolvedAvailabilityStatus = 'Unavailable';
    } else if (latestAvailEntry && latestAvailEntry.status) {
      resolvedAvailabilityStatus = latestAvailEntry.status;
    } else {
      resolvedAvailabilityStatus = 'Available';
    }
  }

  return {
    ...prop,
    listing_status: resolvedListingStatus,
    availability_status: resolvedAvailabilityStatus,
    requires_owner_confirmation: Boolean(latestAvailEntry?.requires_owner_confirmation),
    availability_updated_at: prop.availability_updated_at || latestAvailEntry?.timestamp || prop.updated_at,
    availability_updated_by: prop.availability_updated_by || latestAvailEntry?.staff_name || prop.updated_by_name,
    availability_notes: prop.availability_notes || latestAvailEntry?.notes || '',
    availability_history: Array.isArray(prop.availability_history)
      ? prop.availability_history
      : availabilityHistory,
    slug: generatePublicPropertySlug(prop),
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
  const profile =
    enq.family_or_company_profile ||
    enq.tenant_profile ||
    meta.family_or_company_profile ||
    meta.tenant_profile ||
    meta.number_of_occupants ||
    '';
  const minBudget =
    enq.min_budget !== undefined
      ? parseNumericOrNull(enq.min_budget)
      : parseNumericOrNull(meta.min_budget);
  const maxBudget =
    enq.max_budget !== undefined
      ? parseNumericOrNull(enq.max_budget)
      : parseNumericOrNull(meta.max_budget) ?? (enq.budget ? Number(enq.budget) : null);

  return {
    ...enq,
    enquiry_code: enq.enquiry_code || enq.id,
    enquiry_status: resolvedStatus,
    notes: cleanNotes,
    lead_id: enq.lead_id || meta.lead_id || null,
    property_category: enq.property_category || meta.property_category || 'Residential',
    bhk_requirement: enq.bhk_requirement || meta.bhk_requirement || (propType.includes('BHK') ? propType : ''),
    min_budget: minBudget,
    max_budget: maxBudget,
    furnishing_preference: enq.furnishing_preference || meta.furnishing_preference || 'Any',
    move_in_date: enq.move_in_date || meta.move_in_date || meta.preferred_visit_date || '',
    parking_requirement: enq.parking_requirement || meta.parking_requirement || 'Any',
    family_or_company_profile: profile,
    tenant_profile: profile,
    preferred_contact_time: enq.preferred_contact_time || meta.preferred_contact_time || '',
    preferred_visit_date: enq.preferred_visit_date || meta.preferred_visit_date || '',
    preferred_visit_time: enq.preferred_visit_time || meta.preferred_visit_time || '',
    number_of_occupants: enq.number_of_occupants || meta.number_of_occupants || '',
    additional_requirements:
      enq.additional_requirements || meta.additional_requirements || enq.requirements || '',
    requirements: enq.requirements || enq.additional_requirements || meta.additional_requirements || '',
    next_followup_date: enq.next_followup_date || meta.next_followup_date || '',
    followup_notes: enq.followup_notes || meta.followup_notes || '',
    last_contact_date: enq.last_contact_date || meta.last_contact_date || '',
    call_history: Array.isArray(enq.call_history)
      ? enq.call_history
      : Array.isArray(meta.call_history)
      ? meta.call_history
      : [],
    original_expected_rent:
      enq.original_expected_rent !== undefined
        ? parseNumericOrNull(enq.original_expected_rent)
        : parseNumericOrNull(meta.original_expected_rent),
    tenant_offered_rent:
      enq.tenant_offered_rent !== undefined
        ? parseNumericOrNull(enq.tenant_offered_rent)
        : parseNumericOrNull(meta.tenant_offered_rent),
    owner_expected_rent:
      enq.owner_expected_rent !== undefined
        ? parseNumericOrNull(enq.owner_expected_rent)
        : parseNumericOrNull(meta.owner_expected_rent),
    final_agreed_rent:
      enq.final_agreed_rent !== undefined
        ? parseNumericOrNull(enq.final_agreed_rent)
        : parseNumericOrNull(meta.final_agreed_rent),
    original_deposit:
      enq.original_deposit !== undefined
        ? parseNumericOrNull(enq.original_deposit)
        : parseNumericOrNull(meta.original_deposit),
    final_agreed_deposit:
      enq.final_agreed_deposit !== undefined
        ? parseNumericOrNull(enq.final_agreed_deposit)
        : parseNumericOrNull(meta.final_agreed_deposit),
    maintenance_charges:
      enq.maintenance_charges !== undefined
        ? parseNumericOrNull(enq.maintenance_charges)
        : parseNumericOrNull(meta.maintenance_charges),
    negotiation_notes: enq.negotiation_notes || meta.negotiation_notes || '',
    negotiation_status: enq.negotiation_status || meta.negotiation_status || 'Not Started',
    negotiation_history: Array.isArray(enq.negotiation_history)
      ? enq.negotiation_history
      : Array.isArray(meta.negotiation_history)
      ? meta.negotiation_history
      : [],
    consent_to_contact: enq.consent_to_contact ?? meta.consent_to_contact ?? true,
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
    budget_range:
      enq.budget_range ||
      meta.budget_range ||
      (minBudget && maxBudget
        ? `₹${minBudget.toLocaleString('en-IN')} - ₹${maxBudget.toLocaleString('en-IN')}`
        : enq.budget
        ? String(enq.budget)
        : ''),
    assigned_telecaller: enq.assigned_telecaller || enq.assigned_staff_name || ''
  };
}

function formatVisitAliases(v: any) {
  if (!v) return v;
  const { cleanNotes, meta } = decodeEnquiryMetadataFromNotes(v.next_action);
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
    owner_mobile: v.owner_mobile || meta.owner_mobile || '',
    visit_date: vDate,
    scheduled_date: vDate,
    visit_time: vTime,
    scheduled_time: vTime,
    tenant_enquiry_id: enqId,
    enquiry_id: enqId,
    assigned_staff: staff,
    assigned_staff_name: staff,
    visit_feedback: feedback,
    tenant_feedback: feedback,
    next_action: cleanNotes,
    followup_notes: v.followup_notes || meta.followup_notes || cleanNotes || '',
    reschedule_reason: v.reschedule_reason || meta.reschedule_reason || '',
    cancel_reason: v.cancel_reason || meta.cancel_reason || '',
    visit_number: Number(v.visit_number || meta.visit_number || 1),
    visit_history: Array.isArray(v.visit_history)
      ? v.visit_history
      : Array.isArray(meta.visit_history)
      ? meta.visit_history
      : []
  };
}

function formatPaymentAliases(p: any) {
  if (!p) return p;
  const { cleanNotes, meta } = decodeEnquiryMetadataFromNotes(p.notes);
  const fallbackReceipt = `RCPT-${String(p.id || '').replace(/^REP-PAY-/, '')}`;
  return {
    ...p,
    notes: cleanNotes,
    receipt_number: p.receipt_number || meta.receipt_number || fallbackReceipt
  };
}

function formatDealAliases(d: any) {
  if (!d) return d;
  const { cleanNotes, meta } = decodeEnquiryMetadataFromNotes(d.notes);
  const rent = d.final_monthly_rent ?? d.monthly_rent ?? 0;
  const fee = d.placement_fee_expected ?? d.placement_fee ?? 0;
  const bal = d.balance_pending ?? d.pending_amount ?? Math.max(0, Number(fee) - Number(d.amount_received || 0));
  const enqId = d.tenant_enquiry_id ?? d.enquiry_id ?? meta.tenant_enquiry_id ?? null;
  const fallbackReceipt = `RCPT-${String(d.id || '').replace(/^REP-DL-/, '')}`;
  return {
    ...d,
    notes: cleanNotes,
    deal_code: d.deal_code || d.id,
    deal_status: d.deal_status || meta.deal_status || (d.payment_status === 'Cancelled' ? 'Deal Cancelled' : 'Deal Confirmed'),
    tenant_enquiry_id: enqId,
    enquiry_id: enqId,
    site_visit_id: d.site_visit_id || meta.site_visit_id || null,
    owner_mobile: d.owner_mobile || meta.owner_mobile || '',
    tenant_email: d.tenant_email || meta.tenant_email || '',
    final_monthly_rent: rent,
    monthly_rent: rent,
    maintenance_charges:
      d.maintenance_charges !== undefined
        ? Number(d.maintenance_charges) || 0
        : Number(meta.maintenance_charges) || 0,
    rental_duration: d.rental_duration || meta.rental_duration || '11 Months',
    final_negotiated_terms: d.final_negotiated_terms || meta.final_negotiated_terms || '',
    placement_fee_expected: fee,
    placement_fee: fee,
    balance_pending: bal,
    pending_amount: bal,
    amount_due: bal,
    receipt_number: d.receipt_number || meta.receipt_number || fallbackReceipt,
    deal_confirmed_date: d.deal_confirmed_date || d.agreement_date || '',
    handled_by: d.handled_by || meta.handled_by || d.created_by_name || '',
    interior_interest: d.interior_interest || meta.interior_interest || 'No',
    interior_service_requirement: d.interior_service_requirement || meta.interior_service_requirement || '',
    interior_followup_date: d.interior_followup_date || meta.interior_followup_date || '',
    interior_notes: d.interior_notes || meta.interior_notes || '',
    interior_contact_person: d.interior_contact_person || meta.interior_contact_person || 'Tenant',
    linked_interior_lead_id: d.linked_interior_lead_id || meta.linked_interior_lead_id || null
  };
}

// -----------------------------------------------------------------------------
// 0. ACTIVE CRM STAFF LIST (For Enquiry / Visit / Lead Assignment & Filtering)
// GET /api/crm/properties/staff
// -----------------------------------------------------------------------------
propertyCrmRouter.get('/staff', (_req: Request, res: Response) => {
  try {
    const staff = getActiveCrmStaffList();
    res.json({
      success: true,
      staff
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Error loading CRM staff list' });
  }
});

// -----------------------------------------------------------------------------
// 1. PROPERTY DASHBOARD & REPORTS METRICS
// GET /api/crm/properties/dashboard
// -----------------------------------------------------------------------------
propertyCrmRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const startDate = ((req.query.startDate as string) || '').trim();
    const endDate = ((req.query.endDate as string) || '').trim();
    const staffFilter = ((req.query.staff as string) || '').toLowerCase().trim();

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

    const matchesStaff = (name?: string, id?: string) => {
      if (!staffFilter || staffFilter === 'all') return true;
      return (
        (name || '').toLowerCase().includes(staffFilter) ||
        (id || '').toLowerCase() === staffFilter
      );
    };

    const leads = allLeadsRaw
      .filter((l: any) => !l.is_archived && inDateRange(l.date_received || l.created_at))
      .filter((l: any) => matchesStaff(l.telecaller_name || l.created_by_name, l.telecaller_id));
    const calls = allCalls
      .filter((c: any) => inDateRange(c.call_datetime || c.created_at))
      .filter((c: any) => matchesStaff(c.logged_by_name, c.logged_by));
    const properties = allPropertiesRaw
      .filter((p: any) => !p.is_archived && inDateRange(p.created_at))
      .map(formatPropertyAliases)
      .filter((p: any) => matchesStaff(p.approved_by_name || p.verified_by_name || p.created_by_name, p.created_by));
    const enquiries = allEnquiriesRaw
      .filter((e: any) => !e.is_archived && inDateRange(e.enquiry_date || e.created_at))
      .map(formatEnquiryAliases)
      .filter((e: any) => matchesStaff(e.assigned_staff_name || e.assigned_telecaller, e.assigned_staff_id));
    const visits = allVisitsRaw
      .filter((v: any) => !v.is_archived && inDateRange(v.scheduled_date || v.created_at))
      .map(formatVisitAliases)
      .filter((v: any) => matchesStaff(v.assigned_staff_name, v.assigned_staff_id));
    const deals = allDealsRaw
      .filter((d: any) => !d.is_archived && inDateRange(d.agreement_date || d.created_at))
      .map(formatDealAliases)
      .filter((d: any) => matchesStaff(d.handled_by || d.created_by_name, d.created_by));

    const todayStr = getIstDateString();

    const newLeads = leads.filter((l: any) => l.lead_status === 'New Lead' || l.lead_status === 'First Call Pending').length;

    const leadFollowupsToday = leads.filter(
      (l: any) =>
        !['Approved', 'Rejected', 'Not Available'].includes(l.lead_status) &&
        Boolean(l.next_followup_date && l.next_followup_date.slice(0, 10) === todayStr)
    ).length;
    const leadFollowupsOverdue = leads.filter(
      (l: any) =>
        !['Approved', 'Rejected', 'Not Available'].includes(l.lead_status) &&
        Boolean(l.next_followup_date && l.next_followup_date.slice(0, 10) < todayStr)
    ).length;

    const enquiryFollowupsToday = enquiries.filter(
      (e: any) =>
        !['Converted', 'Deal Completed', 'Not Interested', 'Lost', 'Closed'].includes(e.enquiry_status) &&
        Boolean(e.next_followup_date && e.next_followup_date.slice(0, 10) === todayStr)
    ).length;
    const enquiryFollowupsOverdue = enquiries.filter(
      (e: any) =>
        !['Converted', 'Deal Completed', 'Not Interested', 'Lost', 'Closed'].includes(e.enquiry_status) &&
        Boolean(e.next_followup_date && e.next_followup_date.slice(0, 10) < todayStr)
    ).length;

    const followupsDueToday = leadFollowupsToday + enquiryFollowupsToday;
    const overdueFollowups = leadFollowupsOverdue + enquiryFollowupsOverdue;

    const followupsPending =
      leads.filter((l: any) => {
        if (['Approved', 'Rejected', 'Not Available'].includes(l.lead_status)) return false;
        return l.lead_status === 'Follow-up Required' || Boolean(l.next_followup_date && l.next_followup_date.slice(0, 10) <= todayStr);
      }).length +
      enquiries.filter((e: any) => {
        if (['Converted', 'Deal Completed', 'Not Interested', 'Lost', 'Closed'].includes(e.enquiry_status)) return false;
        return Boolean(e.next_followup_date && e.next_followup_date.slice(0, 10) <= todayStr);
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
    const publishedProperties = properties.filter((p: any) => isPropertyPubliclyVisible(p)).length;
    const rejectedProperties =
      properties.filter((p: any) => p.listing_status === 'Rejected').length +
      leads.filter((l: any) => l.lead_status === 'Rejected' && !properties.some((p: any) => p.lead_id === l.id && p.listing_status === 'Rejected')).length;

    // Phase 3 Rental Operations Metrics
    const newTenantEnquiries = enquiries.filter((e: any) => e.enquiry_status === 'New Enquiry').length;
    const unassignedEnquiries = enquiries.filter(
      (e: any) =>
        !e.assigned_staff_name ||
        ['unassigned', 'website queue', ''].includes(String(e.assigned_staff_name).toLowerCase().trim())
    ).length;

    const activeVisits = visits.filter((v: any) =>
      ['Scheduled', 'Confirmed', 'Rescheduled'].includes(v.visit_status)
    );
    const siteVisitsScheduled = activeVisits.length;
    const siteVisitsToday = activeVisits.filter(
      (v: any) => (v.scheduled_date || '').slice(0, 10) === todayStr
    ).length;
    const upcomingSiteVisits = activeVisits.filter(
      (v: any) => (v.scheduled_date || '').slice(0, 10) > todayStr
    ).length;

    const negotiationsInProgress =
      enquiries.filter(
        (e: any) =>
          e.enquiry_status === 'Negotiation' ||
          ['Negotiation in Progress', 'Awaiting Owner Confirmation', 'Awaiting Tenant Confirmation'].includes(
            e.negotiation_status
          )
      ).length ||
      properties.filter((p: any) => p.availability_status === 'Negotiation in Progress').length;

    const validDeals = deals.filter((d: any) => d.payment_status !== 'Cancelled' && d.deal_status !== 'Deal Cancelled');
    const dealsConfirmed = validDeals.filter((d: any) =>
      ['Deal Confirmed', 'Agreement in Progress', 'Agreement Completed', 'Tenant Moved In'].includes(
        d.deal_status || 'Deal Confirmed'
      )
    ).length;
    const dealsCompleted = validDeals.filter((d: any) =>
      ['Agreement Completed', 'Tenant Moved In'].includes(d.deal_status) || d.payment_status === 'Paid'
    ).length || validDeals.length;

    const propertiesOnHold = properties.filter(
      (p: any) => p.availability_status === 'Temporarily On Hold'
    ).length;
    const propertiesRented = properties.filter(
      (p: any) => p.availability_status === 'Rented' || p.listing_status === 'Rented' || p.listing_status === 'Occupied'
    ).length;
    const propertiesAvailable = properties.filter(
      (p: any) =>
        p.availability_status === 'Available' &&
        !['Rented', 'Occupied', 'Unavailable', 'Rejected', 'Archived'].includes(p.listing_status)
    ).length;

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

    // 5. Staff-wise Rental Operations & Lead Activity
    const staffMap: Record<
      string,
      {
        staffName: string;
        leadsAssigned: number;
        leadsCount: number;
        callsLogged: number;
        callsCount: number;
        enquiriesAssigned: number;
        enquiriesFollowedUp: number;
        siteVisitsConducted: number;
        negotiationsActive: number;
        dealsClosed: number;
        feesCollected: number;
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
          enquiriesAssigned: 0,
          enquiriesFollowedUp: 0,
          siteVisitsConducted: 0,
          negotiationsActive: 0,
          dealsClosed: 0,
          feesCollected: 0,
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
    enquiries.forEach((e: any) => {
      const st = ensureStaff(e.assigned_staff_name || e.assigned_telecaller);
      st.enquiriesAssigned += 1;
      const callHistoryLen = Array.isArray(e.call_history) ? e.call_history.length : 0;
      if (callHistoryLen > 0 || e.enquiry_status !== 'New Enquiry') {
        st.enquiriesFollowedUp += 1;
      }
      if (callHistoryLen > 0) {
        st.callsLogged += callHistoryLen;
        st.callsCount += callHistoryLen;
      }
      if (
        e.enquiry_status === 'Negotiation' ||
        ['Negotiation in Progress', 'Awaiting Owner Confirmation', 'Awaiting Tenant Confirmation'].includes(
          e.negotiation_status
        )
      ) {
        st.negotiationsActive += 1;
      }
    });
    visits.forEach((v: any) => {
      const st = ensureStaff(v.assigned_staff_name);
      st.siteVisitsConducted += 1;
    });
    properties.forEach((p: any) => {
      if (['Approved', 'Ready to Publish', 'Published', 'Rented'].includes(p.listing_status)) {
        const st = ensureStaff(p.approved_by_name || p.verified_by_name || p.created_by_name);
        st.approvedProperties += 1;
      }
    });
    validDeals.forEach((d: any) => {
      const st = ensureStaff(d.handled_by || d.created_by_name);
      st.dealsClosed += 1;
      st.feesCollected += Number(d.amount_received) || 0;
    });
    const staffActivity = Object.values(staffMap).sort(
      (a, b) =>
        b.leadsAssigned + b.enquiriesAssigned + b.callsLogged + b.dealsClosed -
        (a.leadsAssigned + a.enquiriesAssigned + a.callsLogged + a.dealsClosed)
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
      totalPlacementFeesDue,
      // Phase 3 Rental Operations Metrics
      newTenantEnquiries,
      unassignedEnquiries,
      followupsDueToday,
      overdueFollowups,
      siteVisitsToday,
      upcomingSiteVisits,
      negotiationsInProgress,
      dealsConfirmed,
      propertiesOnHold,
      propertiesRented,
      propertiesAvailable
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
        approvedProperties: s.approvedProperties,
        enquiriesAssigned: s.enquiriesAssigned,
        siteVisitsConducted: s.siteVisitsConducted,
        negotiationsActive: s.negotiationsActive,
        dealsClosed: s.dealsClosed,
        feesCollected: s.feesCollected
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
    const availabilityStatus = (req.query.availability_status as string) || '';
    const category = (req.query.property_category as string) || '';
    const locality = ((req.query.locality as string) || '').toLowerCase().trim();

    const [allPropsRaw, allImages] = await Promise.all([
      sbSelectAll('properties'),
      sbSelectAll('property_images')
    ]);

    const allProps = allPropsRaw.map(formatPropertyAliases);
    let list = allProps.filter((p: any) => (!p.is_archived && p.listing_status !== 'Archived') || status === 'Archived');

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

    if (availabilityStatus && availabilityStatus !== 'All') {
      list = list.filter((p: any) => p.availability_status === availabilityStatus);
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
          ...p,
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

propertyCrmRouter.get('/listings/:id', async (req: Request, res: Response) => {
  try {
    const propId = req.params.id;
    const [propRaw, allImages, allActivities] = await Promise.all([
      sbSelectById('properties', propId),
      sbSelectAll('property_images'),
      sbSelectAll('property_activities')
    ]);
    if (!propRaw) {
      return res.status(404).json({ success: false, error: 'Property listing not found.' });
    }
    const prop = formatPropertyAliases(propRaw);
    const images = allImages
      .filter((img: any) => img.property_id === prop.id || img.lead_id === prop.lead_id)
      .map(formatImageAliases);
    const activities = allActivities
      .filter((a: any) => a.property_id === prop.id || a.lead_id === prop.lead_id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(formatActivityAliases);

    res.json({
      success: true,
      property: {
        ...prop,
        images,
        activities
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error loading property detail' });
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
    const allPropsRaw = await sbSelectAll('properties');
    const existingPropRaw = allPropsRaw.find(
      (p: any) => p.lead_id === leadId || (lead.property_id && p.id === lead.property_id)
    );
    const existingProp = existingPropRaw ? formatPropertyAliases(existingPropRaw) : null;
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

    const rawExpectedRent =
      body.expected_monthly_rent !== undefined && body.expected_monthly_rent !== null
        ? body.expected_monthly_rent
        : body.monthly_rent;

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
      bhk_configuration: body.bhk_configuration ?? body.bhk_type ?? existingProp?.bhk_configuration ?? '',
      full_address: fullAddr,
      full_property_address: fullAddr,
      locality: body.locality ?? existingProp?.locality ?? lead.location_locality ?? '',
      city: body.city || existingProp?.city || 'Bengaluru',
      pin_code: body.pin_code ?? body.pincode ?? existingProp?.pin_code ?? '',
      expected_monthly_rent:
        rawExpectedRent !== undefined && rawExpectedRent !== null
          ? Number(rawExpectedRent) || 0
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
      rent_negotiable:
        body.rent_negotiable === false || body.rent_negotiable === 'No'
          ? 'No'
          : body.rent_negotiable === true || body.rent_negotiable === 'Yes'
          ? 'Yes'
          : existingProp?.rent_negotiable || 'Yes',
      deposit_negotiable: body.deposit_negotiable || existingProp?.deposit_negotiable || 'Yes',
      built_up_area:
        body.built_up_area !== undefined && body.built_up_area !== ''
          ? body.built_up_area
          : existingProp?.built_up_area,
      carpet_area:
        body.carpet_area !== undefined && body.carpet_area !== ''
          ? body.carpet_area
          : existingProp?.carpet_area,
      furnishing_status: (() => {
        const rawF = String(body.furnishing_status || existingProp?.furnishing_status || 'Semi Furnished').trim();
        if (/^semi[-\s]?furnished$/i.test(rawF)) return 'Semi Furnished';
        if (/^fully[-\s]?furnished$/i.test(rawF)) return 'Fully Furnished';
        if (/^unfurnished$/i.test(rawF)) return 'Unfurnished';
        return 'Semi Furnished';
      })(),
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
      available_from_date: body.available_from_date ?? body.available_from ?? existingProp?.available_from_date ?? '',
      property_description: body.property_description ?? body.description ?? existingProp?.property_description ?? '',
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
      is_archived: requestedListingStatus === 'Archived',
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
      }
    }

    if (!existingProp || existingProp.listing_status !== requestedListingStatus) {
      candidateProp.approval_history.unshift({
        action: ['Approved', 'Approved for Website', 'Ready to Publish', 'Published'].includes(requestedListingStatus)
          ? 'APPROVED'
          : 'STATUS_UPDATED',
        status: requestedListingStatus as any,
        notes: candidateProp.verification_notes || `Status set to ${requestedListingStatus}.`,
        staff_id: user.id,
        staff_name: user.name,
        timestamp: now
      });
    }

    const savedPropertyRaw = await sbUpsert('properties', candidateProp, leadId);
    const savedProperty = formatPropertyAliases(savedPropertyRaw);

    const verCheck = checkPropertyVerificationComplete(savedProperty);
    let nextLeadStatus = lead.lead_status;
    if (['Approved', 'Approved for Website', 'Ready to Publish', 'Published'].includes(savedProperty.listing_status)) {
      nextLeadStatus = 'Approved';
    } else if (savedProperty.listing_status === 'Rejected') {
      nextLeadStatus = 'Rejected';
    } else if (['Rented', 'Occupied', 'Unavailable', 'Archived'].includes(savedProperty.listing_status)) {
      nextLeadStatus = 'Not Available';
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
      property: savedProperty,
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
    const propRaw = await sbSelectById('properties', propId);
    if (!propRaw) {
      return res.status(404).json({ success: false, error: 'Property listing not found.' });
    }
    const prop = formatPropertyAliases(propRaw);

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
          : targetStatus === 'Unpublished'
          ? 'UNPUBLISHED'
          : targetStatus === 'Published'
          ? 'PUBLISHED'
          : ['Approved', 'Approved for Website', 'Ready to Publish'].includes(targetStatus)
          ? 'APPROVED'
          : 'STATUS_UPDATED',
      status: targetStatus,
      notes: notes || `Listing status changed from ${prevStatus} to ${targetStatus}.`,
      staff_id: user.id,
      staff_name: user.name,
      timestamp: now
    });

    const updatedProp = {
      ...propRaw,
      listing_status: targetStatus,
      is_archived: targetStatus === 'Archived',
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
        } else if (['Rented', 'Occupied', 'Unavailable', 'Archived'].includes(targetStatus)) {
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
// PHASE 3 SECTION 4: PROPERTY AVAILABILITY TRACKING
// POST /api/crm/properties/listings/:id/availability
// Allowed statuses:
//   - Available
//   - Temporarily On Hold
//   - Site Visit in Progress
//   - Negotiation in Progress
//   - Rented
//   - Unavailable
// Rules:
//   - Rented and Unavailable properties disappear from public website listings.
//   - Temporarily On Hold properties do not accept new public enquiries.
//   - Reactivating to Available from Rented / Unavailable / Temporarily On Hold
//     requires owner confirmation (owner_confirmed: true).
//   - Maintains full availability history with date, time, and staff attribution.
// -----------------------------------------------------------------------------
const handlePropertyAvailabilityUpdate = async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const propId = req.params.id;
    const propRaw = await sbSelectById('properties', propId);
    if (!propRaw) {
      return res.status(404).json({ success: false, error: 'Property listing not found.' });
    }
    const prop = formatPropertyAliases(propRaw);

    const body = req.body || {};
    const targetAvailability = (body.availability_status || '').trim();
    const notes = (body.notes || body.availability_notes || '').trim();
    const ownerConfirmed =
      body.owner_confirmed === true ||
      body.owner_confirmed === 'true' ||
      body.owner_confirmed === 'Yes';

    const allowedAvailability = [
      'Available',
      'Temporarily On Hold',
      'Site Visit in Progress',
      'Negotiation in Progress',
      'Rented',
      'Unavailable'
    ];
    if (!allowedAvailability.includes(targetAvailability)) {
      return res.status(400).json({
        success: false,
        error: `Invalid availability_status. Allowed values: ${allowedAvailability.join(', ')}.`
      });
    }

    const prevAvailability = prop.availability_status || 'Available';
    const prevListingStatus = prop.listing_status;
    const requiresOwnerConfirmationFromHistory = Boolean(prop.requires_owner_confirmation);

    // Rule: When a property becomes available again from Rented, Unavailable, Temporarily On Hold,
    // or after a cancelled deal, management must confirm with the owner before reactivating it.
    if (
      targetAvailability === 'Available' &&
      (['Rented', 'Unavailable', 'Temporarily On Hold'].includes(prevAvailability) ||
        requiresOwnerConfirmationFromHistory) &&
      !ownerConfirmed
    ) {
      return res.status(400).json({
        success: false,
        code: 'OWNER_CONFIRMATION_REQUIRED',
        requiresOwnerConfirmation: true,
        error: `Owner confirmation is required before reactivating this property from "${prevAvailability}" to "Available".`
      });
    }

    const now = new Date().toISOString();
    let nextListingStatus = prevListingStatus;
    if (targetAvailability === 'Rented') {
      nextListingStatus = 'Rented';
    } else if (targetAvailability === 'Unavailable') {
      nextListingStatus = 'Unavailable';
    } else if (
      ['Available', 'Temporarily On Hold', 'Site Visit in Progress', 'Negotiation in Progress'].includes(
        targetAvailability
      ) &&
      ['Rented', 'Occupied', 'Unavailable'].includes(prevListingStatus)
    ) {
      const verCheck = checkPropertyVerificationComplete(prop);
      if (verCheck.valid && body.republish !== false) {
        nextListingStatus = 'Published';
      } else {
        nextListingStatus = 'Approved';
      }
    }

    const history = Array.isArray(propRaw.approval_history) ? [...propRaw.approval_history] : [];
    history.unshift({
      is_availability_change: true,
      action:
        targetAvailability === 'Available' &&
        (['Rented', 'Unavailable', 'Temporarily On Hold'].includes(prevAvailability) ||
          requiresOwnerConfirmationFromHistory)
          ? 'AVAILABILITY_REACTIVATED'
          : `AVAILABILITY_${targetAvailability.toUpperCase().replace(/\s+/g, '_')}`,
      availability_status: targetAvailability,
      status: nextListingStatus,
      listing_status_override: nextListingStatus,
      previous_status: prevAvailability,
      owner_confirmed: ownerConfirmed,
      requires_owner_confirmation: false,
      notes:
        notes ||
        `Availability updated from "${prevAvailability}" to "${targetAvailability}"${
          ownerConfirmed ? ' (Owner confirmed)' : ''
        }.`,
      staff_id: user.id,
      staff_name: user.name,
      timestamp: now
    });

    const updatedPropRaw = {
      ...propRaw,
      listing_status: nextListingStatus,
      approval_history: history,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const savedPropRaw = await sbUpsert('properties', updatedPropRaw, prop.lead_id);
    const savedProp = formatPropertyAliases({
      ...savedPropRaw,
      availability_status: targetAvailability
    });

    if (prop.lead_id) {
      const lead = await sbSelectById('property_leads', prop.lead_id);
      if (lead) {
        let nextLeadStatus = lead.lead_status;
        if (targetAvailability === 'Rented' || targetAvailability === 'Unavailable') {
          nextLeadStatus = 'Not Available';
        } else if (targetAvailability === 'Available' && lead.lead_status === 'Not Available') {
          nextLeadStatus = 'Approved';
        }
        if (nextLeadStatus !== lead.lead_status) {
          await sbUpsert('property_leads', {
            ...lead,
            lead_status: nextLeadStatus,
            updated_by: user.id,
            updated_by_name: user.name,
            updated_at: now
          });
        }
      }
    }

    await recordPropertyActivity({
      lead_id: prop.lead_id,
      property_id: propId,
      entity_type: 'availability',
      entity_id: propId,
      action: `AVAILABILITY_${targetAvailability.toUpperCase().replace(/\s+/g, '_')}`,
      description: `Property "${prop.property_title}" availability changed from "${prevAvailability}" to "${targetAvailability}" by ${user.name}${
        ownerConfirmed ? ' (Confirmed with Owner)' : ''
      }.${notes ? ' Notes: ' + notes : ''}`,
      previous_status: prevAvailability,
      new_status: targetAvailability,
      metadata: {
        owner_confirmed: ownerConfirmed,
        listing_status: nextListingStatus
      },
      user
    });

    res.json({
      success: true,
      property: savedProp
    });
  } catch (err: any) {
    console.error('[Properties CRM] Error updating property availability:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Database error updating property availability' });
  }
};

propertyCrmRouter.post('/listings/:id/availability', handlePropertyAvailabilityUpdate);
propertyCrmRouter.put('/listings/:id/availability', handlePropertyAvailabilityUpdate);

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
// 6. TENANT ENQUIRIES, REQUIREMENTS, CALL LOGGING & RENT NEGOTIATION
// -----------------------------------------------------------------------------
propertyCrmRouter.get('/enquiries', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const status = (req.query.enquiry_status as string) || '';
    const source = (req.query.enquiry_source as string) || '';
    const assignedStaff = ((req.query.assigned_staff as string) || '').toLowerCase().trim();
    const followupFilter = ((req.query.followup_filter as string) || '').trim();
    const negotiationStatus = (req.query.negotiation_status as string) || '';

    const all = await sbSelectAll('property_tenant_enquiries');
    let list = all.filter((e: any) => !e.is_archived).map(formatEnquiryAliases);

    if (search) {
      list = list.filter(
        (e: any) =>
          (e.id || '').toLowerCase().includes(search) ||
          (e.tenant_name || '').toLowerCase().includes(search) ||
          (e.tenant_mobile || '').toLowerCase().includes(search) ||
          (e.tenant_email || '').toLowerCase().includes(search) ||
          (e.preferred_location || '').toLowerCase().includes(search) ||
          (e.property_id || '').toLowerCase().includes(search) ||
          (e.property_title || '').toLowerCase().includes(search) ||
          (e.assigned_staff_name || '').toLowerCase().includes(search)
      );
    }

    if (status && status !== 'All') {
      list = list.filter((e: any) => e.enquiry_status === status);
    }

    if (source && source !== 'All') {
      list = list.filter((e: any) => (e.enquiry_source || 'Direct Call') === source);
    }

    if (negotiationStatus && negotiationStatus !== 'All') {
      list = list.filter((e: any) => (e.negotiation_status || 'Not Started') === negotiationStatus);
    }

    if (assignedStaff && assignedStaff !== 'all') {
      if (assignedStaff === 'unassigned') {
        list = list.filter(
          (e: any) =>
            !e.assigned_staff_name ||
            ['unassigned', 'website queue', ''].includes(String(e.assigned_staff_name).toLowerCase().trim())
        );
      } else {
        list = list.filter(
          (e: any) =>
            (e.assigned_staff_name || '').toLowerCase().includes(assignedStaff) ||
            (e.assigned_staff_id || '').toLowerCase() === assignedStaff
        );
      }
    }

    const todayStr = getIstDateString();
    if (followupFilter === 'today') {
      list = list.filter((e: any) => e.next_followup_date && e.next_followup_date.slice(0, 10) === todayStr);
    } else if (followupFilter === 'overdue') {
      list = list.filter(
        (e: any) =>
          e.next_followup_date &&
          e.next_followup_date.slice(0, 10) < todayStr &&
          !['Converted', 'Deal Completed', 'Not Interested', 'Lost', 'Closed'].includes(e.enquiry_status)
      );
    } else if (followupFilter === 'upcoming') {
      list = list.filter((e: any) => e.next_followup_date && e.next_followup_date.slice(0, 10) > todayStr);
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

propertyCrmRouter.get('/enquiries/:id', async (req: Request, res: Response) => {
  try {
    const enqId = req.params.id;
    const [enqRaw, allProps, allVisits, allDeals, allActivities] = await Promise.all([
      sbSelectById('property_tenant_enquiries', enqId),
      sbSelectAll('properties'),
      sbSelectAll('property_site_visits'),
      sbSelectAll('property_deals'),
      sbSelectAll('property_activities')
    ]);
    if (!enqRaw || enqRaw.is_archived) {
      return res.status(404).json({ success: false, error: 'Tenant enquiry not found.' });
    }
    const enquiry = formatEnquiryAliases(enqRaw);
    const linkedPropertyRaw = enquiry.interested_property_id
      ? allProps.find((p: any) => p.id === enquiry.interested_property_id)
      : null;
    const linkedProperty = linkedPropertyRaw ? formatPropertyAliases(linkedPropertyRaw) : null;

    const siteVisits = allVisits
      .filter((v: any) => !v.is_archived && (v.enquiry_id === enqId || (enquiry.interested_property_id && v.property_id === enquiry.interested_property_id && v.tenant_name === enquiry.tenant_name)))
      .map(formatVisitAliases)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const deals = allDeals
      .map(formatDealAliases)
      .filter((d: any) => !d.is_archived && (d.tenant_enquiry_id === enqId || (enquiry.interested_property_id && d.property_id === enquiry.interested_property_id && d.tenant_name === enquiry.tenant_name)));

    const activities = allActivities
      .filter(
        (a: any) =>
          a.entity_id === enqId ||
          (a.metadata && a.metadata.enquiry_id === enqId) ||
          (enquiry.interested_property_id && a.property_id === enquiry.interested_property_id && a.entity_type === 'enquiry')
      )
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(formatActivityAliases);

    res.json({
      success: true,
      enquiry,
      property: linkedProperty,
      siteVisits,
      deals,
      activities
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error loading enquiry detail' });
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
    let propTitle = (body.property_title || body.interested_property_title || '').trim() || undefined;
    let linkedProp: any = null;
    if (propId) {
      const pRaw = await sbSelectById('properties', propId);
      if (pRaw) {
        linkedProp = formatPropertyAliases(pRaw);
        if (!propTitle) propTitle = linkedProp.property_title;
      }
    }
    const propType = body.property_type_needed || body.property_type || linkedProp?.property_type || '2 BHK';

    const existingAll = await sbSelectAll('property_tenant_enquiries');
    const recentDup = existingAll.find(
      (e: any) =>
        !e.is_archived &&
        (e.normalized_mobile || normalizePhone(e.mobile_number || e.tenant_mobile || '')) === normMobile &&
        (e.interested_property_id || e.property_id || '') === (propId || '') &&
        Date.now() - new Date(e.created_at || 0).getTime() < 60000
    );
    if (recentDup && !body.allowDuplicate) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        error: `Duplicate submission prevented: Enquiry ${recentDup.id} for "${tenantName}" was just created.`
      });
    }

    const now = new Date().toISOString();
    const enqId = generateUniqueId('REP-ENQ');
    const minBudget = parseNumericOrNull(body.min_budget);
    const maxBudget = parseNumericOrNull(body.max_budget);
    const rawBudget =
      body.budget !== undefined && body.budget !== ''
        ? Number(body.budget) || 0
        : maxBudget || minBudget || Number(linkedProp?.expected_monthly_rent) || 0;

    const profile = (body.family_or_company_profile || body.tenant_profile || '').trim() || undefined;
    const reqText = (body.additional_requirements || body.requirements || '').trim() || undefined;

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
      preferred_location: (body.preferred_location || linkedProp?.locality || '').trim() || undefined,
      property_category: body.property_category || linkedProp?.property_category || 'Residential',
      property_type: propType,
      property_type_needed: propType,
      bhk_requirement: body.bhk_requirement || (propType.includes('BHK') ? propType : linkedProp?.bhk_configuration || ''),
      min_budget: minBudget,
      max_budget: maxBudget,
      budget: rawBudget,
      budget_range:
        (body.budget_range ||
          (minBudget && maxBudget
            ? `₹${minBudget.toLocaleString('en-IN')} - ₹${maxBudget.toLocaleString('en-IN')}`
            : rawBudget
            ? `₹${rawBudget.toLocaleString('en-IN')}`
            : '')).trim() || undefined,
      furnishing_preference: body.furnishing_preference || 'Any',
      move_in_date: body.move_in_date || undefined,
      parking_requirement: body.parking_requirement || 'Any',
      family_or_company_profile: profile,
      tenant_profile: profile,
      number_of_occupants: (body.number_of_occupants || '').trim() || undefined,
      requirements: reqText,
      additional_requirements: reqText,
      enquiry_source: body.enquiry_source || 'Direct Call',
      assigned_staff_id: body.assigned_staff_id || user.id,
      assigned_staff_name: (body.assigned_telecaller || body.assigned_staff_name || '').trim() || user.name,
      assigned_telecaller: (body.assigned_telecaller || body.assigned_staff_name || '').trim() || user.name,
      enquiry_status: body.enquiry_status || 'New Enquiry',
      next_followup_date: body.next_followup_date || undefined,
      followup_notes: (body.followup_notes || '').trim() || undefined,
      original_expected_rent:
        parseNumericOrNull(body.original_expected_rent) ??
        (linkedProp ? Number(linkedProp.expected_monthly_rent) || null : null),
      original_deposit:
        parseNumericOrNull(body.original_deposit) ??
        (linkedProp ? Number(linkedProp.security_deposit) || null : null),
      maintenance_charges:
        parseNumericOrNull(body.maintenance_charges) ??
        (linkedProp ? Number(linkedProp.maintenance_charges) || null : null),
      negotiation_status: body.negotiation_status || 'Not Started',
      call_history: [],
      negotiation_history: [],
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
      description: `Tenant enquiry created for ${record.tenant_name} (${record.property_type || 'Any'} in ${record.preferred_location || 'Bengaluru'}) assigned to ${record.assigned_staff_name}.`,
      new_status: record.enquiry_status,
      metadata: { enquiry_id: record.id },
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
    let propTitle = body.property_title ?? body.interested_property_title ?? existing.interested_property_title;
    if (propId && propId !== existing.interested_property_id && !body.property_title) {
      const pRaw = await sbSelectById('properties', propId);
      if (pRaw) propTitle = pRaw.property_title;
    }
    const propType = body.property_type_needed ?? body.property_type ?? existing.property_type;

    const minBudget =
      body.min_budget !== undefined ? parseNumericOrNull(body.min_budget) : existing.min_budget;
    const maxBudget =
      body.max_budget !== undefined ? parseNumericOrNull(body.max_budget) : existing.max_budget;
    const rawBudget =
      body.budget !== undefined
        ? Number(body.budget) || 0
        : maxBudget || minBudget || Number(existing.budget) || 0;

    const profile =
      body.family_or_company_profile !== undefined
        ? body.family_or_company_profile
        : body.tenant_profile !== undefined
        ? body.tenant_profile
        : existing.family_or_company_profile;
    const reqText =
      body.additional_requirements !== undefined
        ? body.additional_requirements
        : body.requirements !== undefined
        ? body.requirements
        : existing.requirements;

    const assignedStaffName =
      body.assigned_telecaller ?? body.assigned_staff_name ?? existing.assigned_staff_name;

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
      property_category: body.property_category ?? existing.property_category,
      property_type: propType,
      property_type_needed: propType,
      bhk_requirement: body.bhk_requirement ?? existing.bhk_requirement,
      min_budget: minBudget,
      max_budget: maxBudget,
      budget: rawBudget,
      budget_range:
        body.budget_range ??
        (minBudget && maxBudget
          ? `₹${minBudget.toLocaleString('en-IN')} - ₹${maxBudget.toLocaleString('en-IN')}`
          : existing.budget_range),
      furnishing_preference: body.furnishing_preference ?? existing.furnishing_preference,
      move_in_date: body.move_in_date ?? existing.move_in_date,
      parking_requirement: body.parking_requirement ?? existing.parking_requirement,
      family_or_company_profile: profile,
      tenant_profile: profile,
      number_of_occupants: body.number_of_occupants ?? existing.number_of_occupants,
      requirements: reqText,
      additional_requirements: reqText,
      enquiry_source: body.enquiry_source ?? existing.enquiry_source,
      assigned_staff_id: body.assigned_staff_id ?? existing.assigned_staff_id,
      assigned_staff_name: assignedStaffName,
      assigned_telecaller: assignedStaffName,
      enquiry_status: body.enquiry_status || existing.enquiry_status,
      next_followup_date:
        body.next_followup_date !== undefined ? body.next_followup_date : existing.next_followup_date,
      followup_notes:
        body.followup_notes !== undefined ? body.followup_notes : existing.followup_notes,
      last_contact_date:
        body.last_contact_date !== undefined ? body.last_contact_date : existing.last_contact_date,
      original_expected_rent:
        body.original_expected_rent !== undefined
          ? parseNumericOrNull(body.original_expected_rent)
          : existing.original_expected_rent,
      tenant_offered_rent:
        body.tenant_offered_rent !== undefined
          ? parseNumericOrNull(body.tenant_offered_rent)
          : existing.tenant_offered_rent,
      owner_expected_rent:
        body.owner_expected_rent !== undefined
          ? parseNumericOrNull(body.owner_expected_rent)
          : existing.owner_expected_rent,
      final_agreed_rent:
        body.final_agreed_rent !== undefined
          ? parseNumericOrNull(body.final_agreed_rent)
          : existing.final_agreed_rent,
      original_deposit:
        body.original_deposit !== undefined
          ? parseNumericOrNull(body.original_deposit)
          : existing.original_deposit,
      final_agreed_deposit:
        body.final_agreed_deposit !== undefined
          ? parseNumericOrNull(body.final_agreed_deposit)
          : existing.final_agreed_deposit,
      maintenance_charges:
        body.maintenance_charges !== undefined
          ? parseNumericOrNull(body.maintenance_charges)
          : existing.maintenance_charges,
      negotiation_notes:
        body.negotiation_notes !== undefined ? body.negotiation_notes : existing.negotiation_notes,
      negotiation_status:
        body.negotiation_status !== undefined ? body.negotiation_status : existing.negotiation_status,
      notes: body.notes ?? existing.notes,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const saved = await sbUpsert('property_tenant_enquiries', updated, updated.interested_property_id || undefined);

    const assignmentChanged = assignedStaffName && assignedStaffName !== existing.assigned_staff_name;
    await recordPropertyActivity({
      property_id: updated.interested_property_id || undefined,
      entity_type: 'enquiry',
      entity_id: enqId,
      action: assignmentChanged ? 'TENANT_ENQUIRY_ASSIGNED' : 'TENANT_ENQUIRY_UPDATED',
      description: assignmentChanged
        ? `Tenant enquiry ${enqId} (${updated.tenant_name}) assigned to ${assignedStaffName} (Status: "${updated.enquiry_status}").`
        : `Tenant enquiry ${enqId} (${updated.tenant_name}) updated to status "${updated.enquiry_status}" by ${user.name}.`,
      previous_status: existing.enquiry_status,
      new_status: updated.enquiry_status,
      metadata: { enquiry_id: enqId, assigned_staff_name: assignedStaffName },
      user
    });

    res.json({ success: true, enquiry: formatEnquiryAliases(saved) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error updating tenant enquiry' });
  }
});

// Phase 3 Section 2: Call Tenants, Record Call Notes, Schedule Follow-ups & Update Status
propertyCrmRouter.post('/enquiries/:id/calls', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const enqId = req.params.id;
    const existingRaw = await sbSelectById('property_tenant_enquiries', enqId);
    if (!existingRaw || existingRaw.is_archived) {
      return res.status(404).json({ success: false, error: 'Tenant enquiry not found.' });
    }
    const existing = formatEnquiryAliases(existingRaw);

    const body = req.body || {};
    const callOutcome = (body.call_outcome || '').trim();
    if (!callOutcome) {
      return res.status(400).json({ success: false, error: 'Call Outcome is required.' });
    }

    const now = new Date().toISOString();
    const callEntry = {
      id: generateUniqueId('REP-TCL'),
      call_datetime: body.call_datetime || now,
      call_outcome: callOutcome,
      call_notes: (body.call_notes || '').trim(),
      next_followup_date: body.next_followup_date || undefined,
      followup_notes: (body.followup_notes || '').trim() || undefined,
      logged_by: user.id,
      logged_by_name: user.name
    };

    const callHistory = Array.isArray(existing.call_history) ? [...existing.call_history] : [];
    callHistory.unshift(callEntry);

    let nextStatus = body.enquiry_status || existing.enquiry_status;
    if (!body.enquiry_status) {
      if (callOutcome === 'Connected - Interested') nextStatus = 'Interested';
      else if (callOutcome === 'Connected - Site Visit Requested') nextStatus = 'Site Visit Required';
      else if (callOutcome === 'Connected - Negotiating Rent') nextStatus = 'Negotiation';
      else if (callOutcome === 'Connected - Not Interested' || callOutcome === 'Wrong Number')
        nextStatus = 'Not Interested';
      else if (existing.enquiry_status === 'New Enquiry') nextStatus = 'Contacted';
    }

    const assignedStaffName =
      body.assigned_staff_name ||
      (existing.assigned_staff_name && existing.assigned_staff_name !== 'Website Queue'
        ? existing.assigned_staff_name
        : user.name);

    const updated = {
      ...existing,
      enquiry_status: nextStatus,
      assigned_staff_id: body.assigned_staff_id || existing.assigned_staff_id || user.id,
      assigned_staff_name: assignedStaffName,
      assigned_telecaller: assignedStaffName,
      last_contact_date: callEntry.call_datetime,
      next_followup_date:
        body.next_followup_date !== undefined ? body.next_followup_date : existing.next_followup_date,
      followup_notes:
        body.followup_notes !== undefined ? body.followup_notes : existing.followup_notes,
      call_history: callHistory,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const saved = await sbUpsert('property_tenant_enquiries', updated, updated.interested_property_id || undefined);

    await recordPropertyActivity({
      property_id: updated.interested_property_id || undefined,
      entity_type: 'enquiry',
      entity_id: enqId,
      action: 'TENANT_CALL_LOGGED',
      description: `Tenant call logged for ${existing.tenant_name} (${callOutcome}) by ${user.name}.${
        callEntry.call_notes ? ' Notes: ' + callEntry.call_notes : ''
      }${callEntry.next_followup_date ? ' Next Follow-up: ' + callEntry.next_followup_date : ''}`,
      previous_status: existing.enquiry_status,
      new_status: nextStatus,
      metadata: { enquiry_id: enqId, call_id: callEntry.id },
      user
    });

    res.status(201).json({
      success: true,
      callLog: callEntry,
      enquiry: formatEnquiryAliases(saved)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error logging tenant call' });
  }
});

// Phase 3 Section 6: Rent Negotiation Management & History
propertyCrmRouter.post('/enquiries/:id/negotiation', async (req: Request, res: Response) => {
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

    const negStatus = body.negotiation_status || existing.negotiation_status || 'Negotiation in Progress';
    const origRent =
      body.original_expected_rent !== undefined
        ? parseNumericOrNull(body.original_expected_rent)
        : existing.original_expected_rent;
    const tenantRent =
      body.tenant_offered_rent !== undefined
        ? parseNumericOrNull(body.tenant_offered_rent)
        : existing.tenant_offered_rent;
    const ownerRent =
      body.owner_expected_rent !== undefined
        ? parseNumericOrNull(body.owner_expected_rent)
        : existing.owner_expected_rent;
    const finalRent =
      body.final_agreed_rent !== undefined
        ? parseNumericOrNull(body.final_agreed_rent)
        : existing.final_agreed_rent;
    const origDeposit =
      body.original_deposit !== undefined
        ? parseNumericOrNull(body.original_deposit)
        : existing.original_deposit;
    const finalDeposit =
      body.final_agreed_deposit !== undefined
        ? parseNumericOrNull(body.final_agreed_deposit)
        : existing.final_agreed_deposit;
    const maint =
      body.maintenance_charges !== undefined
        ? parseNumericOrNull(body.maintenance_charges)
        : existing.maintenance_charges;
    const negNotes =
      body.negotiation_notes !== undefined ? body.negotiation_notes.trim() : existing.negotiation_notes;

    const historyEntry = {
      id: generateUniqueId('REP-NEG'),
      timestamp: now,
      staff_id: user.id,
      staff_name: user.name,
      negotiation_status: negStatus,
      original_expected_rent: origRent ?? undefined,
      tenant_offered_rent: tenantRent ?? undefined,
      owner_expected_rent: ownerRent ?? undefined,
      final_agreed_rent: finalRent ?? undefined,
      original_deposit: origDeposit ?? undefined,
      final_agreed_deposit: finalDeposit ?? undefined,
      maintenance_charges: maint ?? undefined,
      notes: negNotes || `Negotiation status updated to ${negStatus}`
    };

    const negHistory = Array.isArray(existing.negotiation_history)
      ? [...existing.negotiation_history]
      : [];
    negHistory.unshift(historyEntry);

    let nextEnquiryStatus = body.enquiry_status || existing.enquiry_status;
    if (!body.enquiry_status) {
      if (['Negotiation in Progress', 'Awaiting Owner Confirmation', 'Awaiting Tenant Confirmation'].includes(negStatus)) {
        nextEnquiryStatus = 'Negotiation';
      } else if (negStatus === 'Agreed' && !['Converted', 'Deal Completed'].includes(existing.enquiry_status)) {
        nextEnquiryStatus = 'Negotiation';
      }
    }

    const updated = {
      ...existing,
      enquiry_status: nextEnquiryStatus,
      original_expected_rent: origRent,
      tenant_offered_rent: tenantRent,
      owner_expected_rent: ownerRent,
      final_agreed_rent: finalRent,
      original_deposit: origDeposit,
      final_agreed_deposit: finalDeposit,
      maintenance_charges: maint,
      negotiation_notes: negNotes,
      negotiation_status: negStatus,
      negotiation_history: negHistory,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const saved = await sbUpsert('property_tenant_enquiries', updated, updated.interested_property_id || undefined);

    // Optionally update linked property availability to 'Negotiation in Progress' when active negotiation starts
    if (
      updated.interested_property_id &&
      ['Negotiation in Progress', 'Awaiting Owner Confirmation', 'Awaiting Tenant Confirmation'].includes(negStatus)
    ) {
      const propRaw = await sbSelectById('properties', updated.interested_property_id);
      if (propRaw) {
        const prop = formatPropertyAliases(propRaw);
        if (['Available', 'Site Visit in Progress'].includes(prop.availability_status || 'Available')) {
          const pHist = Array.isArray(propRaw.approval_history) ? [...propRaw.approval_history] : [];
          pHist.unshift({
            is_availability_change: true,
            action: 'AVAILABILITY_NEGOTIATION_IN_PROGRESS',
            availability_status: 'Negotiation in Progress',
            status: prop.listing_status,
            previous_status: prop.availability_status || 'Available',
            notes: `Rent negotiation in progress with tenant ${existing.tenant_name} (${enqId}).`,
            staff_id: user.id,
            staff_name: user.name,
            timestamp: now
          });
          await sbUpsert(
            'properties',
            {
              ...propRaw,
              approval_history: pHist,
              updated_by: user.id,
              updated_by_name: user.name,
              updated_at: now
            },
            prop.lead_id
          );
        }
      }
    }

    await recordPropertyActivity({
      property_id: updated.interested_property_id || undefined,
      entity_type: 'negotiation',
      entity_id: enqId,
      action: 'RENT_NEGOTIATION_UPDATED',
      description: `Rent negotiation for ${existing.tenant_name} (${enqId}) updated to "${negStatus}" by ${user.name}. Offered: ₹${(
        tenantRent || 0
      ).toLocaleString('en-IN')}, Agreed: ₹${(finalRent || 0).toLocaleString('en-IN')}.`,
      previous_status: existing.negotiation_status || 'Not Started',
      new_status: negStatus,
      metadata: { enquiry_id: enqId, negotiation_entry: historyEntry },
      user
    });

    res.json({
      success: true,
      enquiry: formatEnquiryAliases(saved),
      negotiationEntry: historyEntry
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error updating rent negotiation' });
  }
});

// -----------------------------------------------------------------------------
// 7. SITE VISITS CRUD (Phase 3 Section 5: Multi-visit support, Confirm, Reschedule,
//    Cancel, Tenant Feedback, Owner Feedback, Follow-up Notes)
// -----------------------------------------------------------------------------
propertyCrmRouter.get('/site-visits', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const status = (req.query.visit_status as string) || '';
    const propertyId = (req.query.property_id as string) || '';
    const enquiryId = (req.query.enquiry_id as string) || '';
    const assignedStaff = ((req.query.assigned_staff as string) || '').toLowerCase().trim();

    const all = await sbSelectAll('property_site_visits');
    let list = all.filter((v: any) => !v.is_archived).map(formatVisitAliases);

    if (propertyId) {
      list = list.filter((v: any) => v.property_id === propertyId);
    }

    if (enquiryId) {
      list = list.filter((v: any) => v.enquiry_id === enquiryId || v.tenant_enquiry_id === enquiryId);
    }

    if (assignedStaff && assignedStaff !== 'all') {
      list = list.filter(
        (v: any) =>
          (v.assigned_staff_name || '').toLowerCase().includes(assignedStaff) ||
          (v.assigned_staff_id || '').toLowerCase() === assignedStaff
      );
    }

    if (search) {
      list = list.filter(
        (v: any) =>
          (v.id || '').toLowerCase().includes(search) ||
          (v.tenant_name || '').toLowerCase().includes(search) ||
          (v.tenant_mobile || '').toLowerCase().includes(search) ||
          (v.owner_name || '').toLowerCase().includes(search) ||
          (v.property_id || '').toLowerCase().includes(search) ||
          (v.property_title || '').toLowerCase().includes(search) ||
          (v.assigned_staff_name || '').toLowerCase().includes(search)
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

    // Lookup property to auto-fill property_title and owner_name if not supplied
    const [propRaw, existingVisitsRaw] = await Promise.all([
      sbSelectById('properties', body.property_id),
      sbSelectAll('property_site_visits')
    ]);
    const prop = propRaw ? formatPropertyAliases(propRaw) : null;
    const normContact = tenantContact ? normalizePhone(tenantContact) : '';

    // Support multiple visits for the same property and tenant — compute visit_number
    const priorVisitsForTenantAndProp = existingVisitsRaw.filter(
      (v: any) =>
        !v.is_archived &&
        v.property_id === body.property_id &&
        ((enqId && v.enquiry_id === enqId) ||
          (normContact && normalizePhone(v.tenant_contact || '') === normContact) ||
          (v.tenant_name || '').toLowerCase() === body.tenant_name.trim().toLowerCase())
    );
    const visitNumber = priorVisitsForTenantAndProp.length + 1;

    const now = new Date().toISOString();
    const visitId = generateUniqueId('REP-SV');
    const feedback = (body.tenant_feedback ?? body.visit_feedback ?? '').trim() || undefined;
    const followupNotes = (body.followup_notes ?? body.next_action ?? '').trim() || undefined;
    const initialStatus = body.visit_status || 'Scheduled';

    const visitHistory = [
      {
        timestamp: now,
        action: 'SCHEDULED',
        status: initialStatus,
        scheduled_date: visitDate,
        scheduled_time: visitTime,
        staff_name: user.name,
        notes: `Visit #${visitNumber} scheduled for ${visitDate} at ${visitTime} (Assigned: ${assignedStaff}).`
      }
    ];

    const record = {
      id: visitId,
      visit_code: visitId,
      property_id: body.property_id,
      property_title: (body.property_title || prop?.property_title || '').trim() || undefined,
      lead_id: body.lead_id || prop?.lead_id || undefined,
      enquiry_id: enqId,
      tenant_enquiry_id: enqId,
      tenant_name: body.tenant_name.trim(),
      tenant_contact: normContact,
      tenant_mobile: normContact,
      owner_name: (body.owner_name || prop?.owner_full_name || '').trim() || undefined,
      scheduled_date: visitDate,
      visit_date: visitDate,
      scheduled_time: visitTime,
      visit_time: visitTime,
      assigned_staff_id: body.assigned_staff_id || user.id,
      assigned_staff_name: assignedStaff,
      assigned_staff: assignedStaff,
      visit_status: initialStatus,
      visit_feedback: feedback,
      tenant_feedback: feedback,
      owner_feedback: (body.owner_feedback || '').trim() || undefined,
      next_action: followupNotes,
      followup_notes: followupNotes,
      visit_number: visitNumber,
      visit_history: visitHistory,
      is_archived: false,
      created_by: user.id,
      created_by_name: user.name,
      updated_by: user.id,
      updated_by_name: user.name,
      created_at: now,
      updated_at: now
    };

    const saved = await sbUpsert('property_site_visits', record, record.property_id);

    // Sync linked tenant enquiry status to 'Site Visit Scheduled' if applicable
    if (enqId) {
      const enqRaw = await sbSelectById('property_tenant_enquiries', enqId);
      if (enqRaw && !enqRaw.is_archived) {
        const enq = formatEnquiryAliases(enqRaw);
        if (['New Enquiry', 'Contacted', 'Interested', 'Site Visit Required'].includes(enq.enquiry_status)) {
          await sbUpsert(
            'property_tenant_enquiries',
            {
              ...enq,
              enquiry_status: 'Site Visit Scheduled',
              interested_property_id: enq.interested_property_id || record.property_id,
              interested_property_title: enq.interested_property_title || record.property_title,
              updated_by: user.id,
              updated_by_name: user.name,
              updated_at: now
            },
            record.property_id
          );
        }
      }
    }

    await recordPropertyActivity({
      lead_id: record.lead_id,
      property_id: record.property_id,
      entity_type: 'site_visit',
      entity_id: record.id,
      action: 'SITE_VISIT_SCHEDULED',
      description: `Site visit #${visitNumber} (${visitId}) scheduled for tenant ${record.tenant_name} at "${record.property_title || record.property_id}" on ${record.scheduled_date} ${record.scheduled_time} (Staff: ${assignedStaff}).`,
      new_status: record.visit_status,
      metadata: { enquiry_id: enqId, visit_number: visitNumber },
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
    const existingRaw = await sbSelectById('property_site_visits', visitId);
    if (!existingRaw || existingRaw.is_archived) {
      return res.status(404).json({ success: false, error: 'Site visit record not found.' });
    }
    const existing = formatVisitAliases(existingRaw);

    const body = req.body || {};
    const now = new Date().toISOString();
    const contactRaw = body.tenant_mobile || body.tenant_contact;
    const normContact = contactRaw ? normalizePhone(contactRaw) : existing.tenant_contact || existing.tenant_mobile;
    const vDate = body.visit_date ?? body.scheduled_date ?? existing.scheduled_date;
    const vTime = body.visit_time ?? body.scheduled_time ?? existing.scheduled_time;
    const staffName = body.assigned_staff ?? body.assigned_staff_name ?? existing.assigned_staff_name;
    const feedback = body.tenant_feedback ?? body.visit_feedback ?? existing.visit_feedback;
    const ownerFeedback = body.owner_feedback ?? existing.owner_feedback;
    const followupNotes = body.followup_notes ?? body.next_action ?? existing.followup_notes ?? existing.next_action;
    const nextStatus = body.visit_status || existing.visit_status;
    const rescheduleReason = body.reschedule_reason ?? existing.reschedule_reason;
    const cancelReason = body.cancel_reason ?? existing.cancel_reason;

    const visitHistory = Array.isArray(existing.visit_history) ? [...existing.visit_history] : [];
    if (
      nextStatus !== existing.visit_status ||
      vDate !== existing.scheduled_date ||
      vTime !== existing.scheduled_time ||
      feedback !== existing.tenant_feedback ||
      ownerFeedback !== existing.owner_feedback
    ) {
      visitHistory.unshift({
        timestamp: now,
        action: nextStatus.toUpperCase().replace(/\s+/g, '_'),
        status: nextStatus,
        scheduled_date: vDate,
        scheduled_time: vTime,
        staff_name: user.name,
        notes:
          (nextStatus === 'Rescheduled' && rescheduleReason
            ? `Rescheduled to ${vDate} ${vTime}: ${rescheduleReason}`
            : nextStatus === 'Cancelled' && cancelReason
            ? `Cancelled: ${cancelReason}`
            : feedback || ownerFeedback || followupNotes || `Status updated to ${nextStatus}`)
      });
    }

    const updated = {
      ...existing,
      visit_code: existing.visit_code || existing.id,
      property_id: body.property_id ?? existing.property_id,
      property_title: body.property_title ?? existing.property_title,
      enquiry_id: body.tenant_enquiry_id ?? body.enquiry_id ?? existing.enquiry_id,
      tenant_enquiry_id: body.tenant_enquiry_id ?? body.enquiry_id ?? existing.tenant_enquiry_id,
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
      visit_status: nextStatus,
      visit_feedback: feedback,
      tenant_feedback: feedback,
      owner_feedback: ownerFeedback,
      next_action: followupNotes,
      followup_notes: followupNotes,
      reschedule_reason: rescheduleReason,
      cancel_reason: cancelReason,
      visit_number: existing.visit_number || 1,
      visit_history: visitHistory,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const saved = await sbUpsert('property_site_visits', updated, updated.property_id);

    // Sync linked enquiry status when visit is Completed
    const linkedEnqId = updated.enquiry_id || updated.tenant_enquiry_id;
    if (linkedEnqId && nextStatus === 'Completed') {
      const enqRaw = await sbSelectById('property_tenant_enquiries', linkedEnqId);
      if (enqRaw && !enqRaw.is_archived) {
        const enq = formatEnquiryAliases(enqRaw);
        if (['New Enquiry', 'Contacted', 'Interested', 'Site Visit Required', 'Site Visit Scheduled'].includes(enq.enquiry_status)) {
          await sbUpsert(
            'property_tenant_enquiries',
            {
              ...enq,
              enquiry_status: 'Visited',
              updated_by: user.id,
              updated_by_name: user.name,
              updated_at: now
            },
            updated.property_id
          );
        }
      }
    }

    await recordPropertyActivity({
      lead_id: updated.lead_id,
      property_id: updated.property_id,
      entity_type: 'site_visit',
      entity_id: visitId,
      action: `SITE_VISIT_${nextStatus.toUpperCase().replace(/\s+/g, '_')}`,
      description: `Site visit ${visitId} (${updated.tenant_name}) updated to "${updated.visit_status}" (${vDate} ${vTime}) by ${user.name}.${
        feedback ? ' Tenant Feedback: ' + feedback : ''
      }${ownerFeedback ? ' Owner Feedback: ' + ownerFeedback : ''}`,
      previous_status: existing.visit_status,
      new_status: updated.visit_status,
      metadata: { enquiry_id: linkedEnqId },
      user
    });

    const formatted = formatVisitAliases(saved);
    res.json({ success: true, visit: formatted, siteVisit: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error updating site visit' });
  }
});

// -----------------------------------------------------------------------------
// 8. DEALS, PLACEMENT FEE TRACKING, PAYMENT RECEIPTS & INTERIOR CRM CONVERSION
// -----------------------------------------------------------------------------
propertyCrmRouter.get('/deals', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const status = (req.query.payment_status as string) || '';
    const dealStatus = (req.query.deal_status as string) || '';

    const [allDeals, allPaymentsRaw] = await Promise.all([
      sbSelectAll('property_deals'),
      sbSelectAll('property_payments')
    ]);

    const allPayments = allPaymentsRaw.map(formatPaymentAliases);
    let list = allDeals.filter((d: any) => !d.is_archived).map(formatDealAliases);

    if (search) {
      list = list.filter(
        (d: any) =>
          (d.id || '').toLowerCase().includes(search) ||
          (d.property_id || '').toLowerCase().includes(search) ||
          (d.property_title || '').toLowerCase().includes(search) ||
          (d.owner_name || '').toLowerCase().includes(search) ||
          (d.tenant_name || '').toLowerCase().includes(search) ||
          (d.tenant_mobile || '').toLowerCase().includes(search) ||
          (d.receipt_number || '').toLowerCase().includes(search) ||
          (d.transaction_reference || '').toLowerCase().includes(search)
      );
    }

    if (status && status !== 'All') {
      list = list.filter((d: any) => d.payment_status === status);
    }

    if (dealStatus && dealStatus !== 'All') {
      list = list.filter((d: any) => d.deal_status === dealStatus);
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

    const dealStatus = body.deal_status || 'Deal Confirmed';
    let paymentStatus = body.payment_status;
    if (dealStatus === 'Deal Cancelled' || paymentStatus === 'Cancelled') {
      paymentStatus = 'Cancelled';
    } else if (!paymentStatus) {
      if (amountReceived <= 0) paymentStatus = 'Pending';
      else if (amountReceived >= placementFee && placementFee > 0) paymentStatus = 'Paid';
      else paymentStatus = 'Partially Paid';
    }

    const now = new Date().toISOString();
    const dealId = generateUniqueId('REP-DL');
    const receiptNum = (body.receipt_number || '').trim() || `RCPT-${dealId.replace(/^REP-DL-/, '')}`;
    const confirmedDate = body.deal_confirmed_date || body.agreement_date || getIstDateString();
    const enqId = body.tenant_enquiry_id || body.enquiry_id || undefined;
    const visitId = body.site_visit_id || undefined;

    const dealRecord = {
      id: dealId,
      deal_code: dealId,
      property_id: body.property_id,
      property_title: (body.property_title || '').trim() || undefined,
      lead_id: body.lead_id || undefined,
      tenant_enquiry_id: enqId,
      enquiry_id: enqId,
      site_visit_id: visitId,
      owner_name: body.owner_name.trim(),
      owner_mobile: body.owner_mobile ? normalizePhone(body.owner_mobile) : undefined,
      tenant_name: body.tenant_name.trim(),
      tenant_mobile: body.tenant_mobile ? normalizePhone(body.tenant_mobile) : '',
      tenant_email: (body.tenant_email || '').trim() || undefined,
      monthly_rent: monthlyRent,
      final_monthly_rent: monthlyRent,
      security_deposit: Number(body.security_deposit) || 0,
      maintenance_charges: Number(body.maintenance_charges) || 0,
      agreement_date: confirmedDate,
      deal_confirmed_date: confirmedDate,
      move_in_date: body.move_in_date || undefined,
      rental_duration: (body.rental_duration || '11 Months').trim(),
      final_negotiated_terms: (body.final_negotiated_terms || '').trim() || undefined,
      deal_status: dealStatus,
      placement_fee: placementFee,
      placement_fee_expected: placementFee,
      placement_fee_payer: body.placement_fee_payer || 'Tenant',
      amount_due: amountDue,
      amount_received: amountReceived,
      payment_date: body.payment_date || (amountReceived > 0 ? getIstDateString() : undefined),
      payment_mode: (body.payment_mode || '').trim() || undefined,
      transaction_reference: (body.transaction_reference || '').trim() || undefined,
      receipt_number: receiptNum,
      payment_status: paymentStatus,
      handled_by: (body.handled_by || '').trim() || user.name,
      notes: (body.notes || '').trim() || undefined,
      interior_interest: body.interior_interest || 'No',
      interior_service_requirement: body.interior_service_requirement || undefined,
      interior_followup_date: body.interior_followup_date || undefined,
      interior_notes: (body.interior_notes || '').trim() || undefined,
      interior_contact_person: body.interior_contact_person || 'Tenant',
      linked_interior_lead_id: body.linked_interior_lead_id || undefined,
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
    if (amountReceived > 0 && paymentStatus !== 'Cancelled') {
      const payId = generateUniqueId('REP-PAY');
      const payReceipt = (body.receipt_number || '').trim() || `RCPT-${payId.replace(/^REP-PAY-/, '')}`;
      const initialPayment = {
        id: payId,
        receipt_number: payReceipt,
        deal_id: dealId,
        property_id: dealRecord.property_id,
        amount: amountReceived,
        payment_date: dealRecord.payment_date || getIstDateString(),
        payment_mode: dealRecord.payment_mode || 'UPI',
        transaction_reference: dealRecord.transaction_reference || undefined,
        payment_status: paymentStatus,
        notes: dealRecord.notes || 'Initial placement fee payment recorded with deal.',
        recorded_by: user.id,
        recorded_by_name: user.name,
        created_at: now
      };
      const savedPayment = await sbUpsert('property_payments', initialPayment, dealId);
      payments.push(formatPaymentAliases(savedPayment));
    }

    await syncPropertyAndEnquiryForDealLifecycle({
      dealId,
      propertyId: dealRecord.property_id,
      enquiryId: enqId,
      tenantName: dealRecord.tenant_name,
      dealStatus,
      monthlyRent,
      securityDeposit: dealRecord.security_deposit,
      user,
      isNewDeal: true
    });

    await recordPropertyActivity({
      lead_id: dealRecord.lead_id,
      property_id: dealRecord.property_id,
      entity_type: 'deal',
      entity_id: dealId,
      action: 'DEAL_CREATED',
      description: `Rental deal ${dealId} (${dealStatus}) created for "${dealRecord.property_title || dealRecord.property_id}" (Tenant: ${dealRecord.tenant_name}, Rent: ₹${dealRecord.monthly_rent.toLocaleString('en-IN')}, Placement Fee: ₹${placementFee.toLocaleString('en-IN')}, Received: ₹${amountReceived.toLocaleString('en-IN')}).`,
      new_status: dealStatus,
      metadata: { enquiry_id: enqId, site_visit_id: visitId },
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

async function syncPropertyAndEnquiryForDealLifecycle(params: {
  dealId: string;
  propertyId: string;
  enquiryId?: string;
  tenantName: string;
  dealStatus: string;
  monthlyRent: number;
  securityDeposit: number;
  user: ServerCrmUser;
  isNewDeal: boolean;
  previousDealStatus?: string;
}) {
  const {
    dealId,
    propertyId,
    enquiryId,
    tenantName,
    dealStatus,
    monthlyRent,
    securityDeposit,
    user,
    isNewDeal,
    previousDealStatus
  } = params;
  const now = new Date().toISOString();

  const propRaw = await sbSelectById('properties', propertyId);
  if (propRaw && !propRaw.is_archived) {
    const prop = formatPropertyAliases(propRaw);
    const prevAvailability = prop.availability_status || 'Available';
    const prevListingStatus = prop.listing_status;
    const history = Array.isArray(propRaw.approval_history) ? [...propRaw.approval_history] : [];

    if (dealStatus === 'Deal Pending') {
      // Rule 1: When a deal is created/updated with status Deal Pending, the property must NOT become Rented.
      history.unshift({
        is_availability_change: true,
        action: 'DEAL_PENDING',
        availability_status: prevAvailability,
        status: prevListingStatus,
        listing_status_override: prevListingStatus,
        previous_status: prevAvailability,
        owner_confirmed: false,
        requires_owner_confirmation: Boolean(prop.requires_owner_confirmation),
        notes: `Rental deal ${dealId} recorded as "Deal Pending" for tenant ${tenantName}. Property availability remains "${prevAvailability}" (not marked Rented).`,
        staff_id: user.id,
        staff_name: user.name,
        timestamp: now
      });
      await sbUpsert(
        'properties',
        {
          ...propRaw,
          approval_history: history,
          updated_by: user.id,
          updated_by_name: user.name,
          updated_at: now
        },
        prop.lead_id
      );
      await recordPropertyActivity({
        lead_id: prop.lead_id,
        property_id: propertyId,
        entity_type: 'availability',
        entity_id: propertyId,
        action: 'DEAL_PENDING_AVAILABILITY_UNCHANGED',
        description: `Deal ${dealId} is "Deal Pending" (Tenant: ${tenantName}). Property "${prop.property_title}" availability remains "${prevAvailability}" (not marked Rented).`,
        previous_status: prevAvailability,
        new_status: prevAvailability,
        metadata: { deal_id: dealId, deal_status: dealStatus },
        user
      });
    } else if (dealStatus === 'Deal Confirmed' || dealStatus === 'Agreement in Progress') {
      // Rule 2: When Deal Confirmed or Agreement in Progress, mark the property Temporarily On Hold.
      const targetAvailability = 'Temporarily On Hold';
      let nextListingStatus = prevListingStatus;
      if (['Rented', 'Occupied'].includes(prevListingStatus)) {
        const verCheck = checkPropertyVerificationComplete(prop);
        nextListingStatus = verCheck.valid ? 'Published' : 'Approved';
      }
      history.unshift({
        is_availability_change: true,
        action: 'AVAILABILITY_TEMPORARILY_ON_HOLD',
        availability_status: targetAvailability,
        status: nextListingStatus,
        listing_status_override: nextListingStatus,
        previous_status: prevAvailability,
        owner_confirmed: false,
        requires_owner_confirmation: false,
        notes: `Property marked "Temporarily On Hold" because rental deal ${dealId} with tenant ${tenantName} is "${dealStatus}".`,
        staff_id: user.id,
        staff_name: user.name,
        timestamp: now
      });
      await sbUpsert(
        'properties',
        {
          ...propRaw,
          listing_status: nextListingStatus,
          approval_history: history,
          updated_by: user.id,
          updated_by_name: user.name,
          updated_at: now
        },
        prop.lead_id
      );
      await recordPropertyActivity({
        lead_id: prop.lead_id,
        property_id: propertyId,
        entity_type: 'availability',
        entity_id: propertyId,
        action: 'AVAILABILITY_TEMPORARILY_ON_HOLD',
        description: `Property "${prop.property_title}" marked "Temporarily On Hold" for Deal ${dealId} (${dealStatus}, Tenant: ${tenantName}) by ${user.name}.`,
        previous_status: prevAvailability,
        new_status: targetAvailability,
        metadata: { deal_id: dealId, deal_status: dealStatus, listing_status: nextListingStatus },
        user
      });
    } else if (dealStatus === 'Agreement Completed' || dealStatus === 'Tenant Moved In') {
      // Rule 3 & 6: Only when Agreement Completed or Tenant Moved In should the property become Rented (and disappear from public website listings).
      const targetAvailability = 'Rented';
      const nextListingStatus = 'Rented';
      history.unshift({
        is_availability_change: true,
        action: 'RENTED',
        availability_status: targetAvailability,
        status: nextListingStatus,
        listing_status_override: nextListingStatus,
        previous_status: prevAvailability,
        owner_confirmed: false,
        requires_owner_confirmation: false,
        notes: `Property marked "Rented" as rental deal ${dealId} reached "${dealStatus}" with tenant ${tenantName}.`,
        staff_id: user.id,
        staff_name: user.name,
        timestamp: now
      });
      await sbUpsert(
        'properties',
        {
          ...propRaw,
          listing_status: nextListingStatus,
          approval_history: history,
          updated_by: user.id,
          updated_by_name: user.name,
          updated_at: now
        },
        prop.lead_id
      );
      if (prop.lead_id) {
        const lead = await sbSelectById('property_leads', prop.lead_id);
        if (lead && lead.lead_status !== 'Not Available') {
          await sbUpsert('property_leads', {
            ...lead,
            lead_status: 'Not Available',
            updated_by: user.id,
            updated_by_name: user.name,
            updated_at: now
          });
        }
      }
      await recordPropertyActivity({
        lead_id: prop.lead_id,
        property_id: propertyId,
        entity_type: 'availability',
        entity_id: propertyId,
        action: 'AVAILABILITY_RENTED',
        description: `Property "${prop.property_title}" marked "Rented" upon Deal ${dealId} reaching "${dealStatus}" (Tenant: ${tenantName}) by ${user.name}. Removed from public website listings.`,
        previous_status: prevAvailability,
        new_status: targetAvailability,
        metadata: { deal_id: dealId, deal_status: dealStatus, listing_status: nextListingStatus },
        user
      });
    } else if (dealStatus === 'Deal Cancelled') {
      // Rule 4 & 7: When a deal is cancelled, do NOT automatically mark the property Available, and do NOT accidentally reactivate properties.
      // Require staff to confirm that the owner has reconfirmed availability.
      const holdAvailability = ['Rented', 'Unavailable'].includes(prevAvailability)
        ? prevAvailability
        : 'Temporarily On Hold';
      history.unshift({
        is_availability_change: true,
        action: 'DEAL_CANCELLED_HOLD',
        availability_status: holdAvailability,
        status: prevListingStatus,
        listing_status_override: prevListingStatus,
        previous_status: prevAvailability,
        owner_confirmed: false,
        requires_owner_confirmation: true,
        notes: `Rental deal ${dealId} (${previousDealStatus || 'Deal'}) was cancelled. Property kept as "${holdAvailability}" — owner confirmation is required before reactivating to Available.`,
        staff_id: user.id,
        staff_name: user.name,
        timestamp: now
      });
      await sbUpsert(
        'properties',
        {
          ...propRaw,
          listing_status: prevListingStatus,
          approval_history: history,
          updated_by: user.id,
          updated_by_name: user.name,
          updated_at: now
        },
        prop.lead_id
      );
      await recordPropertyActivity({
        lead_id: prop.lead_id,
        property_id: propertyId,
        entity_type: 'availability',
        entity_id: propertyId,
        action: 'DEAL_CANCELLED_HOLD',
        description: `Deal ${dealId} cancelled by ${user.name}. Property "${prop.property_title}" remains "${holdAvailability}" (not reactivated to Available; requires owner confirmation).`,
        previous_status: prevAvailability,
        new_status: holdAvailability,
        metadata: {
          deal_id: dealId,
          deal_status: dealStatus,
          requires_owner_confirmation: true
        },
        user
      });
    }
  }

  // Sync linked tenant enquiry status where applicable
  if (enquiryId) {
    const enqRaw = await sbSelectById('property_tenant_enquiries', enquiryId);
    if (enqRaw && !enqRaw.is_archived) {
      const enq = formatEnquiryAliases(enqRaw);
      let nextEnqStatus = enq.enquiry_status;
      if (['Agreement Completed', 'Tenant Moved In'].includes(dealStatus)) {
        nextEnqStatus = 'Deal Completed';
      } else if (['Deal Confirmed', 'Agreement in Progress'].includes(dealStatus)) {
        nextEnqStatus = 'Converted';
      } else if (dealStatus === 'Deal Pending' && isNewDeal && enq.enquiry_status === 'New Enquiry') {
        nextEnqStatus = 'Negotiation';
      }
      await sbUpsert(
        'property_tenant_enquiries',
        {
          ...enq,
          enquiry_status: nextEnqStatus,
          negotiation_status: dealStatus === 'Deal Cancelled' ? enq.negotiation_status : 'Agreed',
          final_agreed_rent: monthlyRent || enq.final_agreed_rent,
          final_agreed_deposit: securityDeposit || enq.final_agreed_deposit,
          updated_by: user.id,
          updated_by_name: user.name,
          updated_at: now
        },
        propertyId
      );
    }
  }
}

propertyCrmRouter.put('/deals/:id', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const dealId = req.params.id;
    const existingRaw = await sbSelectById('property_deals', dealId);
    if (!existingRaw || existingRaw.is_archived) {
      return res.status(404).json({ success: false, error: 'Deal not found.' });
    }
    const existing = formatDealAliases(existingRaw);

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

    const dealStatus = body.deal_status || existing.deal_status || 'Deal Confirmed';
    let paymentStatus = body.payment_status || existing.payment_status;
    if (dealStatus === 'Deal Cancelled' || body.payment_status === 'Cancelled') {
      paymentStatus = 'Cancelled';
    } else if (paymentStatus !== 'Cancelled') {
      if (amountReceived <= 0) paymentStatus = 'Pending';
      else if (amountReceived >= placementFee && placementFee > 0) paymentStatus = 'Paid';
      else paymentStatus = 'Partially Paid';
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      deal_code: existing.deal_code || existing.id,
      tenant_enquiry_id: body.tenant_enquiry_id ?? body.enquiry_id ?? existing.tenant_enquiry_id,
      enquiry_id: body.tenant_enquiry_id ?? body.enquiry_id ?? existing.enquiry_id,
      site_visit_id: body.site_visit_id ?? existing.site_visit_id,
      owner_name: body.owner_name ?? existing.owner_name,
      owner_mobile: body.owner_mobile ? normalizePhone(body.owner_mobile) : existing.owner_mobile,
      tenant_name: body.tenant_name ?? existing.tenant_name,
      tenant_mobile: body.tenant_mobile ? normalizePhone(body.tenant_mobile) : existing.tenant_mobile,
      tenant_email: body.tenant_email ?? existing.tenant_email,
      monthly_rent: monthlyRent,
      final_monthly_rent: monthlyRent,
      security_deposit:
        body.security_deposit !== undefined ? Number(body.security_deposit) || 0 : existing.security_deposit,
      maintenance_charges:
        body.maintenance_charges !== undefined ? Number(body.maintenance_charges) || 0 : existing.maintenance_charges,
      agreement_date: body.deal_confirmed_date ?? body.agreement_date ?? existing.agreement_date,
      deal_confirmed_date: body.deal_confirmed_date ?? body.agreement_date ?? existing.deal_confirmed_date,
      move_in_date: body.move_in_date ?? existing.move_in_date,
      rental_duration: body.rental_duration ?? existing.rental_duration,
      final_negotiated_terms: body.final_negotiated_terms ?? existing.final_negotiated_terms,
      deal_status: dealStatus,
      placement_fee: placementFee,
      placement_fee_expected: placementFee,
      placement_fee_payer: body.placement_fee_payer ?? existing.placement_fee_payer,
      amount_due: amountDue,
      amount_received: amountReceived,
      payment_date: body.payment_date ?? existing.payment_date,
      payment_mode: body.payment_mode ?? existing.payment_mode,
      transaction_reference: body.transaction_reference ?? existing.transaction_reference,
      receipt_number: body.receipt_number ?? existing.receipt_number,
      payment_status: paymentStatus,
      handled_by: body.handled_by ?? existing.handled_by,
      notes: body.notes ?? existing.notes,
      interior_interest: body.interior_interest ?? existing.interior_interest,
      interior_service_requirement:
        body.interior_service_requirement ?? existing.interior_service_requirement,
      interior_followup_date: body.interior_followup_date ?? existing.interior_followup_date,
      interior_notes: body.interior_notes ?? existing.interior_notes,
      interior_contact_person: body.interior_contact_person ?? existing.interior_contact_person,
      linked_interior_lead_id: body.linked_interior_lead_id ?? existing.linked_interior_lead_id,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };

    const saved = await sbUpsert('property_deals', updated, updated.property_id);

    // Sync property availability and linked enquiry whenever deal status is updated
    if (body.deal_status !== undefined || dealStatus !== existing.deal_status) {
      await syncPropertyAndEnquiryForDealLifecycle({
        dealId,
        propertyId: updated.property_id,
        enquiryId: updated.tenant_enquiry_id || undefined,
        tenantName: updated.tenant_name,
        dealStatus,
        monthlyRent,
        securityDeposit: Number(updated.security_deposit) || 0,
        user,
        isNewDeal: false,
        previousDealStatus: existing.deal_status
      });
    }

    await recordPropertyActivity({
      lead_id: updated.lead_id,
      property_id: updated.property_id,
      entity_type: 'deal',
      entity_id: dealId,
      action: 'DEAL_UPDATED',
      description: `Deal ${dealId} updated by ${user.name} (Deal Status: ${dealStatus}, Payment Status: ${paymentStatus}, Received: ₹${amountReceived.toLocaleString('en-IN')}, Due: ₹${amountDue.toLocaleString('en-IN')}).`,
      previous_status: existing.deal_status,
      new_status: dealStatus,
      user
    });

    const allPayments = (await sbSelectAll('property_payments'))
      .filter((p: any) => p.deal_id === dealId)
      .map(formatPaymentAliases)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      deal: {
        ...formatDealAliases(saved),
        payments: allPayments
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error updating deal' });
  }
});

propertyCrmRouter.post('/deals/:id/payments', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const dealId = req.params.id;
    const dealRaw = await sbSelectById('property_deals', dealId);
    if (!dealRaw || dealRaw.is_archived) {
      return res.status(404).json({ success: false, error: 'Deal record not found.' });
    }
    const deal = formatDealAliases(dealRaw);

    const body = req.body || {};
    const amount = Number(body.amount) || 0;
    if (amount <= 0) {
      return res.status(400).json({ success: false, error: 'Payment amount must be greater than zero.' });
    }
    if (!body.payment_mode) {
      return res.status(400).json({ success: false, error: 'Payment Mode is required.' });
    }

    const now = new Date().toISOString();
    const payId = generateUniqueId('REP-PAY');
    const receiptNum = (body.receipt_number || '').trim() || `RCPT-${payId.replace(/^REP-PAY-/, '')}`;

    // Calculate total received across all active (non-cancelled) payments for this deal
    const existingPayments = (await sbSelectAll('property_payments'))
      .filter((p: any) => p.deal_id === dealId)
      .map(formatPaymentAliases);
    const activePriorSum = existingPayments
      .filter((p: any) => p.payment_status !== 'Cancelled')
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const baseReceived = existingPayments.length > 0 ? activePriorSum : Number(deal.amount_received) || 0;

    const requestedPayStatus = body.payment_status === 'Cancelled' ? 'Cancelled' : 'Paid';
    const newTotalReceived = requestedPayStatus === 'Cancelled' ? baseReceived : baseReceived + amount;
    const placementFee = Number(deal.placement_fee_expected ?? deal.placement_fee) || 0;
    const newAmountDue = Math.max(0, placementFee - newTotalReceived);
    const nextDealPayStatus =
      newTotalReceived <= 0
        ? 'Pending'
        : newTotalReceived >= placementFee && placementFee > 0
        ? 'Paid'
        : 'Partially Paid';

    const paymentRecord = {
      id: payId,
      receipt_number: receiptNum,
      deal_id: dealId,
      property_id: deal.property_id,
      amount,
      payment_date: body.payment_date || getIstDateString(),
      payment_mode: body.payment_mode,
      transaction_reference: (body.transaction_reference || '').trim() || undefined,
      payment_status: requestedPayStatus === 'Cancelled' ? 'Cancelled' : nextDealPayStatus,
      notes: (body.notes || '').trim() || undefined,
      recorded_by: user.id,
      recorded_by_name: user.name,
      created_at: now
    };

    const savedPaymentRaw = await sbUpsert('property_payments', paymentRecord, dealId);
    const savedPayment = formatPaymentAliases(savedPaymentRaw);

    const updatedDeal = {
      ...deal,
      amount_received: newTotalReceived,
      amount_due: newAmountDue,
      payment_date: paymentRecord.payment_date,
      payment_mode: paymentRecord.payment_mode,
      transaction_reference: paymentRecord.transaction_reference || deal.transaction_reference,
      receipt_number: receiptNum,
      payment_status: nextDealPayStatus,
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
      description: `Placement fee payment of ₹${amount.toLocaleString('en-IN')} (Receipt: ${receiptNum}) recorded via ${paymentRecord.payment_mode} for Deal ${dealId} by ${user.name}. Total Received: ₹${newTotalReceived.toLocaleString('en-IN')}, Balance Due: ₹${newAmountDue.toLocaleString('en-IN')}.`,
      previous_status: deal.payment_status,
      new_status: nextDealPayStatus,
      user
    });

    const allDealPayments = [savedPayment, ...existingPayments];

    res.status(201).json({
      success: true,
      payment: savedPayment,
      deal: {
        ...formatDealAliases(savedDeal),
        payments: allDealPayments
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error recording placement fee payment' });
  }
});

// Phase 3 Section 8: Update or Cancel an Individual Payment & Recalculate Deal Balance
propertyCrmRouter.put('/deals/:id/payments/:paymentId', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const { id: dealId, paymentId } = req.params;
    const [dealRaw, paymentRaw] = await Promise.all([
      sbSelectById('property_deals', dealId),
      sbSelectById('property_payments', paymentId)
    ]);
    if (!dealRaw || dealRaw.is_archived) {
      return res.status(404).json({ success: false, error: 'Deal not found.' });
    }
    if (!paymentRaw || paymentRaw.deal_id !== dealId) {
      return res.status(404).json({ success: false, error: 'Payment record not found for this deal.' });
    }

    const deal = formatDealAliases(dealRaw);
    const existingPay = formatPaymentAliases(paymentRaw);
    const body = req.body || {};
    const now = new Date().toISOString();

    const updatedPaymentObj = {
      ...existingPay,
      amount: body.amount !== undefined ? Number(body.amount) || 0 : Number(existingPay.amount) || 0,
      payment_date: body.payment_date ?? existingPay.payment_date,
      payment_mode: body.payment_mode ?? existingPay.payment_mode,
      transaction_reference: body.transaction_reference ?? existingPay.transaction_reference,
      receipt_number: body.receipt_number ?? existingPay.receipt_number,
      payment_status: body.payment_status || existingPay.payment_status,
      notes: body.notes ?? existingPay.notes
    };

    const savedPaymentRaw = await sbUpsert('property_payments', updatedPaymentObj, dealId);
    const savedPayment = formatPaymentAliases(savedPaymentRaw);

    const allPaymentsForDeal = (await sbSelectAll('property_payments'))
      .filter((p: any) => p.deal_id === dealId)
      .map(formatPaymentAliases)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const activeTotalReceived = allPaymentsForDeal
      .filter((p: any) => p.payment_status !== 'Cancelled')
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    const placementFee = Number(deal.placement_fee_expected ?? deal.placement_fee) || 0;
    const newAmountDue = Math.max(0, placementFee - activeTotalReceived);
    const nextDealPayStatus =
      deal.payment_status === 'Cancelled' && body.payment_status === 'Cancelled' && activeTotalReceived <= 0
        ? 'Cancelled'
        : activeTotalReceived <= 0
        ? 'Pending'
        : activeTotalReceived >= placementFee && placementFee > 0
        ? 'Paid'
        : 'Partially Paid';

    const updatedDeal = {
      ...deal,
      amount_received: activeTotalReceived,
      amount_due: newAmountDue,
      payment_status: nextDealPayStatus,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };
    const savedDeal = await sbUpsert('property_deals', updatedDeal, deal.property_id);

    await recordPropertyActivity({
      lead_id: deal.lead_id,
      property_id: deal.property_id,
      entity_type: 'payment',
      entity_id: paymentId,
      action: 'PAYMENT_UPDATED',
      description: `Payment ${paymentId} (${savedPayment.receipt_number}) updated to "${savedPayment.payment_status}" by ${user.name}. Recalculated Received: ₹${activeTotalReceived.toLocaleString('en-IN')}, Balance Due: ₹${newAmountDue.toLocaleString('en-IN')}.`,
      previous_status: existingPay.payment_status,
      new_status: savedPayment.payment_status,
      user
    });

    res.json({
      success: true,
      payment: savedPayment,
      deal: {
        ...formatDealAliases(savedDeal),
        payments: allPaymentsForDeal
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error updating payment' });
  }
});

// Phase 3 Section 8: Generate & Download Payment Receipt
propertyCrmRouter.get('/deals/:id/receipt', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const dealId = req.params.id;
    const paymentId = ((req.query.payment_id as string) || '').trim();

    const [dealRaw, allPaymentsRaw] = await Promise.all([
      sbSelectById('property_deals', dealId),
      sbSelectAll('property_payments')
    ]);
    if (!dealRaw || dealRaw.is_archived) {
      return res.status(404).json({ success: false, error: 'Deal not found.' });
    }
    const deal = formatDealAliases(dealRaw);
    const propRaw = deal.property_id ? await sbSelectById('properties', deal.property_id) : null;
    const prop = propRaw ? formatPropertyAliases(propRaw) : null;

    const dealPayments = allPaymentsRaw
      .filter((p: any) => p.deal_id === dealId)
      .map(formatPaymentAliases)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const targetPayment = paymentId
      ? dealPayments.find((p: any) => p.id === paymentId)
      : dealPayments.find((p: any) => p.payment_status !== 'Cancelled') || dealPayments[0];

    const totalFee = Number(deal.placement_fee_expected ?? deal.placement_fee) || 0;
    const activeSum = dealPayments
      .filter((p: any) => p.payment_status !== 'Cancelled')
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const totalReceived = dealPayments.length > 0 ? activeSum : Number(deal.amount_received) || 0;
    const balanceDue = Math.max(0, totalFee - totalReceived);

    const receiptData = {
      receipt_number: targetPayment?.receipt_number || deal.receipt_number || `RCPT-${deal.id.replace(/^REP-DL-/, '')}`,
      receipt_date: targetPayment?.payment_date || deal.payment_date || getIstDateString(),
      company_name: 'Royal Epic Properties',
      parent_brand: 'A division of Royal Epic Interiors',
      company_address: 'Bengaluru, Karnataka, India',
      company_phone: '+91 98800 00000',
      company_email: 'enquiry@royalepicinterior.com',
      deal_id: deal.id,
      deal_code: deal.deal_code || deal.id,
      deal_status: deal.deal_status || 'Deal Confirmed',
      property_id: deal.property_id,
      property_code: prop?.property_code || deal.property_id,
      property_title: deal.property_title || prop?.property_title || deal.property_id,
      property_locality: prop?.locality ? `${prop.locality}, ${prop.city || 'Bengaluru'}` : 'Bengaluru',
      owner_name: deal.owner_name,
      tenant_name: deal.tenant_name,
      tenant_mobile: deal.tenant_mobile || '',
      final_monthly_rent: Number(deal.final_monthly_rent ?? deal.monthly_rent) || 0,
      security_deposit: Number(deal.security_deposit) || 0,
      agreement_date: deal.agreement_date || '',
      move_in_date: deal.move_in_date || '',
      placement_fee_payer: deal.placement_fee_payer || 'Tenant',
      total_placement_fee: totalFee,
      total_amount_received: totalReceived,
      current_payment_amount: targetPayment ? Number(targetPayment.amount) || 0 : totalReceived,
      balance_due: balanceDue,
      payment_status: deal.payment_status,
      payment_mode: targetPayment?.payment_mode || deal.payment_mode || 'UPI',
      transaction_reference: targetPayment?.transaction_reference || deal.transaction_reference || 'N/A',
      notes: targetPayment?.notes || deal.notes || '',
      issued_by: targetPayment?.recorded_by_name || user.name,
      latest_payment: targetPayment
        ? {
            id: targetPayment.id,
            receipt_number: targetPayment.receipt_number,
            amount: Number(targetPayment.amount) || 0,
            payment_date: targetPayment.payment_date,
            payment_mode: targetPayment.payment_mode,
            transaction_reference: targetPayment.transaction_reference || 'N/A',
            notes: targetPayment.notes || '',
            recorded_by_name: targetPayment.recorded_by_name || user.name
          }
        : undefined,
      payments: dealPayments,
      generated_by: user.name,
      generated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      receipt: receiptData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Error generating payment receipt' });
  }
});

// Phase 3 Section 9: Interior Design Opportunity Conversion to Interior Leads CRM
propertyCrmRouter.post('/deals/:id/convert-interior', async (req: Request, res: Response) => {
  try {
    const user: ServerCrmUser = (req as any).crmUser;
    const dealId = req.params.id;
    const dealRaw = await sbSelectById('property_deals', dealId);
    if (!dealRaw || dealRaw.is_archived) {
      return res.status(404).json({ success: false, error: 'Deal record not found.' });
    }
    const deal = formatDealAliases(dealRaw);
    const body = req.body || {};

    if (deal.linked_interior_lead_id && !body.forceRelink) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        leadId: deal.linked_interior_lead_id,
        error: `This rental deal is already linked to Interior CRM Lead ${deal.linked_interior_lead_id}.`
      });
    }

    const propRaw = deal.property_id ? await sbSelectById('properties', deal.property_id) : null;
    const prop = propRaw ? formatPropertyAliases(propRaw) : null;

    const contactPerson = body.interior_contact_person || deal.interior_contact_person || 'Tenant';
    const customerName =
      (body.customer_name || '').trim() ||
      (contactPerson === 'Owner' ? deal.owner_name : deal.tenant_name);
    const customerPhone =
      (body.phone || '').trim() ||
      (contactPerson === 'Owner'
        ? deal.owner_mobile || prop?.owner_primary_mobile || ''
        : deal.tenant_mobile || '');
    const customerEmail =
      (body.email || '').trim() ||
      (contactPerson === 'Owner' ? prop?.owner_email || '' : deal.tenant_email || '');

    const serviceRequirement =
      body.interior_service_requirement ||
      deal.interior_service_requirement ||
      'Home Interior';
    const followupDate =
      body.interior_followup_date || deal.interior_followup_date || undefined;
    const interiorNotes =
      (body.interior_notes !== undefined ? body.interior_notes : deal.interior_notes || '').trim();

    if (!body.confirmed) {
      return res.status(400).json({
        success: false,
        requiresConfirmation: true,
        error: 'Please confirm before creating a new enquiry in the Interior Leads CRM.'
      });
    }

    const conversionResult = await createOrCheckInteriorCrmLeadFromPropertyDeal({
      customer_name: customerName,
      phone: customerPhone,
      email: customerEmail,
      interested_service: serviceRequirement,
      city: prop?.locality ? `${prop.locality}, Bengaluru` : 'Bengaluru',
      project_address: prop?.full_address || prop?.locality || undefined,
      budget: body.budget || 'To be discussed',
      next_followup_date: followupDate,
      notes: `Royal Epic Properties Deal Conversion (${deal.id} — ${
        deal.property_title || deal.property_id
      }). Contact Role: ${contactPerson}. Service Needed: ${serviceRequirement}.${
        interiorNotes ? ' Notes: ' + interiorNotes : ''
      }`,
      property_deal_id: deal.id,
      property_id: deal.property_id,
      user,
      linkExistingIfDuplicate: Boolean(body.linkExistingIfDuplicate)
    });

    if (!conversionResult.success) {
      return res.status(conversionResult.isDuplicate ? 409 : 400).json(conversionResult);
    }

    const now = new Date().toISOString();
    const updatedDeal = {
      ...deal,
      interior_interest: body.interior_interest || 'Yes',
      interior_service_requirement: serviceRequirement,
      interior_followup_date: followupDate,
      interior_notes: interiorNotes,
      interior_contact_person: contactPerson,
      linked_interior_lead_id: conversionResult.leadId,
      updated_by: user.id,
      updated_by_name: user.name,
      updated_at: now
    };
    const savedDeal = await sbUpsert('property_deals', updatedDeal, deal.property_id);

    await recordPropertyActivity({
      lead_id: deal.lead_id,
      property_id: deal.property_id,
      entity_type: 'deal',
      entity_id: deal.id,
      action: 'INTERIOR_LEAD_CONVERTED',
      description: `${
        conversionResult.linkedExisting ? 'Linked existing' : 'Created new'
      } Interior Leads CRM enquiry ${conversionResult.leadId} for ${customerName} (${contactPerson} — ${serviceRequirement}) from Property Deal ${deal.id} by ${user.name}.`,
      new_status: conversionResult.leadId,
      metadata: {
        interior_lead_id: conversionResult.leadId,
        service_requirement: serviceRequirement,
        contact_person: contactPerson
      },
      user
    });

    const allPayments = (await sbSelectAll('property_payments'))
      .filter((p: any) => p.deal_id === dealId)
      .map(formatPaymentAliases)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.status(201).json({
      success: true,
      linkedExisting: Boolean(conversionResult.linkedExisting),
      interiorLeadId: conversionResult.leadId,
      interiorLead: conversionResult.lead,
      deal: {
        ...formatDealAliases(savedDeal),
        payments: allPayments
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Error converting to Interior CRM enquiry' });
  }
});

// =============================================================================
// PHASE 2: PUBLIC WEBSITE PROPERTY API ROUTER (UNAUTHENTICATED PUBLIC READ + ENQUIRY)
// Mounted at /api/properties and /api/public/properties
// Strictly exposes ONLY verified, approved, and published properties.
// NEVER exposes owner phone numbers, owner email addresses, full residential street
// addresses, private owner documents, internal verification notes, or staff names/IDs.
// =============================================================================
export const publicPropertiesRouter = express.Router();

// Lightweight in-memory rate limiter for public enquiry submissions
const enquiryRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const ENQUIRY_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const ENQUIRY_MAX_PER_WINDOW = 20;

function stripHtmlAndScripts(input: any): string {
  if (input === undefined || input === null) return '';
  return String(input)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 1. GET /api/properties - Public property listing with filters, search & sorting
publicPropertiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const allPublished = await getApprovedPublishedPropertiesForWebsite();

    // Build filter facets from all currently published properties
    const localitySet = new Set<string>();
    const propertyTypeSet = new Set<string>();
    const bhkSet = new Set<string>();
    allPublished.forEach(p => {
      if (p.locality) localitySet.add(p.locality);
      if (p.property_type) propertyTypeSet.add(p.property_type);
      if (p.bhk_configuration) bhkSet.add(p.bhk_configuration);
    });

    let filtered = [...allPublished];

    const search = stripHtmlAndScripts(req.query.search).toLowerCase();
    const locality = stripHtmlAndScripts(req.query.locality).toLowerCase();
    const category = stripHtmlAndScripts(req.query.category);
    const propType = stripHtmlAndScripts(req.query.type || req.query.property_type);
    const bhk = stripHtmlAndScripts(req.query.bhk || req.query.bhk_configuration);
    const furnishing = stripHtmlAndScripts(req.query.furnishing || req.query.furnishing_status);
    const parking = stripHtmlAndScripts(req.query.parking || req.query.parking_availability).toLowerCase();
    const availability = stripHtmlAndScripts(req.query.availability).toLowerCase();
    const rawMinRent = req.query.minRent ?? req.query.min_rent;
    const rawMaxRent = req.query.maxRent ?? req.query.max_rent;
    const minRent = rawMinRent !== undefined && rawMinRent !== '' ? Number(rawMinRent) : null;
    const maxRent = rawMaxRent !== undefined && rawMaxRent !== '' ? Number(rawMaxRent) : null;
    const sort = stripHtmlAndScripts(req.query.sort) || 'recent';

    if (search) {
      filtered = filtered.filter(
        p =>
          p.property_title.toLowerCase().includes(search) ||
          p.locality.toLowerCase().includes(search) ||
          p.property_type.toLowerCase().includes(search) ||
          p.property_category.toLowerCase().includes(search) ||
          (p.bhk_configuration || '').toLowerCase().includes(search) ||
          (p.property_description || '').toLowerCase().includes(search) ||
          p.id.toLowerCase().includes(search) ||
          p.amenities.some((a: string) => a.toLowerCase().includes(search))
      );
    }

    if (locality && locality !== 'all') {
      filtered = filtered.filter(
        p =>
          p.locality.toLowerCase().includes(locality) ||
          p.approximate_location.toLowerCase().includes(locality)
      );
    }

    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.property_category.toLowerCase() === category.toLowerCase());
    }

    if (propType && propType !== 'All') {
      filtered = filtered.filter(p => p.property_type.toLowerCase() === propType.toLowerCase());
    }

    if (bhk && bhk !== 'All') {
      filtered = filtered.filter(
        p =>
          (p.bhk_configuration || '').toLowerCase() === bhk.toLowerCase() ||
          p.property_type.toLowerCase() === bhk.toLowerCase() ||
          (bhk.toLowerCase().includes('bhk') &&
            p.bedrooms !== null &&
            `${p.bedrooms} bhk` === bhk.toLowerCase())
      );
    }

    if (minRent !== null && Number.isFinite(minRent)) {
      filtered = filtered.filter(p => p.expected_monthly_rent >= minRent);
    }

    if (maxRent !== null && Number.isFinite(maxRent)) {
      filtered = filtered.filter(p => p.expected_monthly_rent <= maxRent);
    }

    if (furnishing && furnishing !== 'All') {
      const normF = furnishing.toLowerCase().replace(/[-\s]+/g, ' ');
      filtered = filtered.filter(
        p => p.furnishing_status.toLowerCase().replace(/[-\s]+/g, ' ') === normF
      );
    }

    if (parking && parking !== 'all') {
      if (parking === 'yes' || parking === 'available') {
        filtered = filtered.filter(
          p =>
            Boolean(p.parking_availability) &&
            !['no', 'none', 'not available'].includes(p.parking_availability.toLowerCase())
        );
      } else {
        filtered = filtered.filter(
          p =>
            (p.parking_availability || '').toLowerCase().includes(parking) ||
            p.amenities.some((a: string) => a.toLowerCase().includes(parking))
        );
      }
    }

    if (availability && availability !== 'all') {
      if (availability === 'immediate') {
        const todayStr = getIstDateString();
        filtered = filtered.filter(
          p =>
            !p.available_from_date ||
            p.available_from_date.toLowerCase() === 'immediate' ||
            p.available_from_date.slice(0, 10) <= todayStr
        );
      }
    }

    if (sort === 'rent_asc' || sort === 'low_to_high') {
      filtered.sort((a, b) => a.expected_monthly_rent - b.expected_monthly_rent);
    } else if (sort === 'rent_desc' || sort === 'high_to_low') {
      filtered.sort((a, b) => b.expected_monthly_rent - a.expected_monthly_rent);
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.published_at || b.updated_at || 0).getTime() -
          new Date(a.published_at || a.updated_at || 0).getTime()
      );
    }

    res.json({
      success: true,
      total: filtered.length,
      properties: filtered,
      facets: {
        localities: Array.from(localitySet).sort(),
        categories: ['Residential', 'Commercial'],
        propertyTypes: Array.from(propertyTypeSet).sort(),
        bhkConfigurations: Array.from(bhkSet).sort(),
        furnishingStatuses: ['Fully Furnished', 'Semi Furnished', 'Unfurnished']
      }
    });
  } catch (err: any) {
    console.error('[Public Properties API] Error loading public properties:', err?.message || err);
    res.status(500).json({
      success: false,
      error: 'Unable to load properties at the moment. Please try again shortly.'
    });
  }
});

// 2. POST /api/properties/enquiries - Public tenant enquiry submission
publicPropertiesRouter.post('/enquiries', async (req: Request, res: Response) => {
  try {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const nowMs = Date.now();
    const rateEntry = enquiryRateLimitMap.get(clientIp);
    if (rateEntry && nowMs < rateEntry.resetAt) {
      if (rateEntry.count >= ENQUIRY_MAX_PER_WINDOW) {
        return res.status(429).json({
          success: false,
          error: 'Too many enquiry requests from this device. Please wait a few minutes or call Royal Epic directly.'
        });
      }
      rateEntry.count += 1;
    } else {
      enquiryRateLimitMap.set(clientIp, { count: 1, resetAt: nowMs + ENQUIRY_RATE_WINDOW_MS });
    }

    const body = req.body || {};

    // Honeypot anti-bot check
    if (
      (body.website_url_honeypot && String(body.website_url_honeypot).trim() !== '') ||
      (body.website_url && String(body.website_url).trim() !== '')
    ) {
      return res.status(400).json({
        success: false,
        error: 'Spam submission rejected.'
      });
    }

    const fullName = stripHtmlAndScripts(body.full_name || body.tenant_name);
    const rawMobile = stripHtmlAndScripts(body.mobile_number || body.tenant_mobile);
    const rawEmail = stripHtmlAndScripts(body.email_address || body.email || body.tenant_email);
    const propertyIdOrSlug = stripHtmlAndScripts(body.property_id || body.interested_property_id);
    const preferredContactTime = stripHtmlAndScripts(body.preferred_contact_time);
    const preferredVisitDate = stripHtmlAndScripts(
      body.preferred_site_visit_date || body.preferred_visit_date || body.move_in_date
    );
    const preferredVisitTime = stripHtmlAndScripts(
      body.preferred_site_visit_time || body.preferred_visit_time
    );
    const numberOfOccupants = stripHtmlAndScripts(
      body.number_of_occupants || body.family_or_company_profile
    );
    const additionalRequirements = stripHtmlAndScripts(
      body.additional_requirements || body.requirements || body.message
    );
    const consentToContact =
      body.consent_to_contact === true ||
      body.consent_to_contact === 'true' ||
      body.consent === true ||
      body.consent === 'true';

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your Full Name.'
      });
    }

    if (!rawMobile) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your Mobile Number.'
      });
    }

    const digitsOnly = rawMobile.replace(/\D/g, '');
    const tenDigitMobile =
      digitsOnly.length === 12 && digitsOnly.startsWith('91')
        ? digitsOnly.slice(2)
        : digitsOnly.length === 11 && digitsOnly.startsWith('0')
        ? digitsOnly.slice(1)
        : digitsOnly;

    if (!/^[6-9]\d{9}$/.test(tenDigitMobile)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit Indian mobile number.'
      });
    }

    if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid Email Address.'
      });
    }

    if (!consentToContact) {
      return res.status(400).json({
        success: false,
        error: 'Please confirm your consent to be contacted by Royal Epic Properties.'
      });
    }

    if (!propertyIdOrSlug) {
      return res.status(400).json({
        success: false,
        error: 'Property selection is required for submitting an enquiry.'
      });
    }

    // Verify property exists and is currently published
    const matchedProperty = await findPublicPropertyBySlugOrId(propertyIdOrSlug);
    if (!matchedProperty) {
      return res.status(404).json({
        success: false,
        error: 'The selected property is no longer available for public enquiries.'
      });
    }

    // Phase 3 Rule: Temporarily On Hold properties should not accept new public enquiries
    if (
      matchedProperty.availability_status === 'Temporarily On Hold' ||
      matchedProperty.accepting_enquiries === false
    ) {
      return res.status(400).json({
        success: false,
        code: 'PROPERTY_ON_HOLD',
        propertyOnHold: true,
        error:
          'This property is temporarily on hold and is not accepting new public enquiries right now. Please explore other available properties or call Royal Epic Properties.'
      });
    }

    const normMobile = normalizePhone(tenDigitMobile);

    // Check for duplicate submission within last 2 minutes
    const existingEnquiries = await sbSelectAll('property_tenant_enquiries');
    const duplicateEnquiry = existingEnquiries.find(
      (e: any) =>
        !e.is_archived &&
        (e.normalized_mobile || normalizePhone(e.mobile_number || '')) === normMobile &&
        (e.interested_property_id || '') === matchedProperty.id &&
        Date.now() - new Date(e.created_at || 0).getTime() < 120000
    );

    if (duplicateEnquiry && !body.allowDuplicate) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        enquiryId: duplicateEnquiry.id,
        error: `We have already received your enquiry (Ref: ${duplicateEnquiry.id}) for "${matchedProperty.property_title}". Our property specialist will contact you shortly.`
      });
    }

    const now = new Date().toISOString();
    const enquiryId = generateUniqueId('REP-ENQ');

    const summaryParts: string[] = [];
    if (preferredContactTime) summaryParts.push(`Preferred Contact Time: ${preferredContactTime}`);
    if (preferredVisitDate) {
      summaryParts.push(
        `Preferred Site Visit: ${preferredVisitDate}${preferredVisitTime ? ` at ${preferredVisitTime}` : ''}`
      );
    } else if (preferredVisitTime) {
      summaryParts.push(`Preferred Site Visit Time: ${preferredVisitTime}`);
    }
    if (numberOfOccupants) summaryParts.push(`Occupants / Profile: ${numberOfOccupants}`);
    if (additionalRequirements) summaryParts.push(`Requirements: ${additionalRequirements}`);

    const combinedRequirements =
      additionalRequirements ||
      summaryParts.join(' | ') ||
      `Interested in ${matchedProperty.property_title} (${matchedProperty.id})`;

    const combinedNotes = [
      `Website Enquiry for ${matchedProperty.property_title} (${matchedProperty.id}).`,
      ...summaryParts,
      'Consent to be contacted: Confirmed (Yes).'
    ].join(' • ');

    const enquiryRecord = {
      id: enquiryId,
      enquiry_code: enquiryId,
      enquiry_date: getIstDateString(),
      tenant_name: fullName,
      mobile_number: normMobile,
      tenant_mobile: normMobile,
      normalized_mobile: normMobile,
      email: rawEmail || undefined,
      tenant_email: rawEmail || undefined,
      interested_property_id: matchedProperty.id,
      property_id: matchedProperty.id,
      interested_property_title: matchedProperty.property_title,
      property_title: matchedProperty.property_title,
      preferred_location: matchedProperty.locality || 'Bengaluru',
      property_type: matchedProperty.property_type || '2 BHK',
      property_type_needed: matchedProperty.property_type || '2 BHK',
      budget: Number(matchedProperty.expected_monthly_rent) || 0,
      budget_range: matchedProperty.expected_monthly_rent
        ? `₹${Number(matchedProperty.expected_monthly_rent).toLocaleString('en-IN')}`
        : undefined,
      move_in_date: preferredVisitDate || undefined,
      family_or_company_profile: numberOfOccupants || undefined,
      preferred_contact_time: preferredContactTime || undefined,
      preferred_visit_date: preferredVisitDate || undefined,
      preferred_visit_time: preferredVisitTime || undefined,
      number_of_occupants: numberOfOccupants || undefined,
      consent_to_contact: true,
      requirements: combinedRequirements,
      enquiry_source: 'Website',
      assigned_staff_id: undefined,
      assigned_staff_name: 'Website Queue',
      assigned_telecaller: 'Website Queue',
      enquiry_status: 'New Enquiry',
      notes: combinedNotes,
      is_archived: false,
      created_by: 'public_website',
      created_by_name: 'Royal Epic Website Visitor',
      updated_by: 'public_website',
      updated_by_name: 'Royal Epic Website Visitor',
      created_at: now,
      updated_at: now
    };

    const saved = await sbUpsert(
      'property_tenant_enquiries',
      enquiryRecord,
      matchedProperty.id
    );

    // Log activity in public.property_activities for CRM audit trail
    const activityRecord = {
      id: generateUniqueId('REP-ACT'),
      property_id: matchedProperty.id,
      entity_type: 'enquiry',
      entity_id: enquiryId,
      action: 'WEBSITE_TENANT_ENQUIRY_SUBMITTED',
      description: `Public website tenant enquiry ${enquiryId} submitted by ${fullName} (${normMobile}) for "${matchedProperty.property_title}".`,
      new_status: 'New Enquiry',
      metadata: {
        enquiry_source: 'Website',
        preferred_contact_time: preferredContactTime,
        preferred_visit_date: preferredVisitDate,
        preferred_visit_time: preferredVisitTime,
        number_of_occupants: numberOfOccupants
      },
      performed_by: 'public_website',
      performed_by_name: fullName,
      created_at: now
    };
    await sbUpsert('property_activities', activityRecord, matchedProperty.id).catch(() => {});

    // Trigger asynchronous Hostinger SMTP email notification to enquiry@royalepicinterior.com
    const formattedRent = Number(matchedProperty.expected_monthly_rent || 0) > 0
      ? `₹${Number(matchedProperty.expected_monthly_rent).toLocaleString('en-IN')} / month`
      : 'Price on Request';
    const scopeSummaryLines = [
      `Enquiry ID: ${saved.id}`,
      `Property ID: ${matchedProperty.id}`,
      `Property Title: ${matchedProperty.property_title}`,
      `Category & Type: ${matchedProperty.property_category || 'Residential'} — ${matchedProperty.property_type || ''}`,
      `Locality: ${matchedProperty.locality || 'Bengaluru'}, ${matchedProperty.city || 'Bengaluru'}`,
      preferredContactTime ? `Preferred Contact Time: ${preferredContactTime}` : '',
      preferredVisitDate ? `Preferred Site Visit Date: ${preferredVisitDate}` : '',
      preferredVisitTime ? `Preferred Site Visit Time: ${preferredVisitTime}` : '',
      numberOfOccupants ? `Occupants / Tenant Profile: ${numberOfOccupants}` : '',
      additionalRequirements ? `Message / Requirements: ${additionalRequirements}` : ''
    ].filter(Boolean);

    sendLeadNotificationEmail({
      id: saved.id,
      source: 'Royal Epic Properties - Website Tenant Enquiry',
      full_name: fullName,
      phone: normMobile,
      email: rawEmail || 'Not Provided',
      city: `${matchedProperty.locality || 'Bengaluru'}, Bengaluru`,
      service_type: `Property Rental Enquiry: ${matchedProperty.property_title} (${matchedProperty.id})`,
      estimated_budget: formattedRent,
      project_scope: scopeSummaryLines.join(' | '),
      created_at: now
    }).catch((mailErr) => {
      console.error('[Public Properties API] Email notification dispatch error:', mailErr);
    });

    res.status(201).json({
      success: true,
      enquiry_id: saved.id,
      enquiryId: saved.id,
      message:
        'Thank you! Your property enquiry has been received by Royal Epic Properties. Our property consultant will contact you shortly.',
      enquiry: {
        id: saved.id,
        enquiry_code: saved.id,
        enquiry_date: saved.enquiry_date,
        tenant_name: saved.tenant_name,
        interested_property_id: matchedProperty.id,
        interested_property_title: matchedProperty.property_title,
        enquiry_status: 'New Enquiry',
        enquiry_source: 'Website'
      }
    });
  } catch (err: any) {
    console.error('[Public Properties API] Error submitting tenant enquiry:', err?.message || err);
    res.status(500).json({
      success: false,
      error: 'Unable to submit your enquiry right now. Please try again or call +91 70261 19311.'
    });
  }
});

// 3. GET /api/properties/:slugOrId - Public single property detail by slug or ID
publicPropertiesRouter.get('/:slugOrId', async (req: Request, res: Response) => {
  try {
    const slugOrId = req.params.slugOrId;
    const property = await findPublicPropertyBySlugOrId(slugOrId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found or is no longer available for rent.'
      });
    }

    const allPublished = await getApprovedPublishedPropertiesForWebsite();
    const similarProperties = allPublished
      .filter(p => p.id !== property.id)
      .sort((a, b) => {
        const aScore =
          (a.locality.toLowerCase() === property.locality.toLowerCase() ? 2 : 0) +
          (a.property_category === property.property_category ? 1 : 0);
        const bScore =
          (b.locality.toLowerCase() === property.locality.toLowerCase() ? 2 : 0) +
          (b.property_category === property.property_category ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 3);

    res.json({
      success: true,
      property,
      similar_properties: similarProperties,
      similarProperties
    });
  } catch (err: any) {
    console.error('[Public Properties API] Error loading property detail:', err?.message || err);
    res.status(500).json({
      success: false,
      error: 'Unable to load property details right now.'
    });
  }
});

