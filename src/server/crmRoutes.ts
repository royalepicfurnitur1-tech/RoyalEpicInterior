import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const crmRouter = express.Router();

const DB_DIR = path.join(process.cwd(), 'data');
const CRM_LEADS_FILE = path.join(DB_DIR, 'crm_leads.json');
const CRM_LEADS_DELETED_FILE = path.join(DB_DIR, 'crm_leads_deleted.json');
const CRM_CALLS_FILE = path.join(DB_DIR, 'crm_calls.json');
const CRM_CALLS_ARCHIVED_FILE = path.join(DB_DIR, 'crm_calls_archived.json');
const CRM_USERS_FILE = path.join(DB_DIR, 'crm_users.json');
const CRM_AUDIT_FILE = path.join(DB_DIR, 'crm_audit.json');

if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (_) {}
}

export interface ServerCrmUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  password?: string;
  role: 'admin' | 'telecaller';
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface ServerCrmLead {
  id: string;
  customer_name: string;
  name?: string; // alias for backward compatibility
  phone: string;
  normalized_phone?: string;
  alternate_phone?: string;
  email?: string;
  source: string;
  custom_source?: string;
  interested_service: string;
  projectType?: string; // alias
  custom_service?: string;
  city?: string;
  location?: string; // alias
  project_address?: string;
  budget?: string;
  temperature?: 'Hot' | 'Warm' | 'Cold';
  status: string;
  notes?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  last_contact_at?: string;
  next_followup_at?: string;
  next_followup_date?: string;
  next_followup_time?: string;
  external_lead_id?: string;
  raw_payload?: Record<string, any>;
  created_by?: string;
  created_by_name?: string;
  last_updated_by?: string;
  last_updated_by_name?: string;
  created_at: string;
  createdAt?: string; // alias
  updated_at: string;
}

export interface ServerCrmCallLog {
  id: string;
  lead_id: string;
  call_date: string;
  outcome: string;
  notes?: string;
  followup_date?: string;
  logged_by?: string;
  logged_by_name?: string;
  duration_seconds?: number;
  created_at: string;
}

// -----------------------------------------------------------------------------
// PHONE NORMALIZATION
// -----------------------------------------------------------------------------
export function normalizePhone(p: string): string {
  if (!p) return '';
  const cleaned = p.replace(/[\s\-\(\)\.]/g, '');
  if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^0[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(cleaned)) return `+${cleaned}`;
  return cleaned;
}

// -----------------------------------------------------------------------------
// ASIA/KOLKATA (IST) DATE & TIME HELPERS
// Ensures all midnight / day boundaries are calculated strictly in IST (UTC+5:30)
// -----------------------------------------------------------------------------
export function getIstDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

export function getIstDayBoundaries(d: Date = new Date()): { startEpoch: number; endEpoch: number; dateStr: string } {
  const dateStr = getIstDateString(d); // YYYY-MM-DD
  const startEpoch = new Date(`${dateStr}T00:00:00+05:30`).getTime();
  const endEpoch = new Date(`${dateStr}T23:59:59.999+05:30`).getTime();
  return { startEpoch, endEpoch, dateStr };
}

// -----------------------------------------------------------------------------
// SUPABASE CLIENT & DUAL PERSISTENCE
// -----------------------------------------------------------------------------
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

// Check if a specific table exists in Supabase
async function testSupabaseTable(tableName: string): Promise<boolean> {
  const { url, key } = getSupabaseCredentials();
  try {
    const res = await fetch(`${url}/rest/v1/${tableName}?select=*&limit=1`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Authoritative Supabase Cloud Persistence for CRM Leads
async function syncLeadToSupabase(lead: ServerCrmLead): Promise<{ success: boolean; table: string; error?: string; data?: any }> {
  const { url, key } = getSupabaseCredentials();
  const normPhone = normalizePhone(lead.phone);

  try {
    let dbStatus = 'new';
    const st = (lead.status || '').toLowerCase();
    if (st.includes('converted') || st.includes('closed')) dbStatus = 'converted';
    else if (st.includes('site visit')) dbStatus = 'site_visit_scheduled';
    else if (st.includes('quotation') || st.includes('boq')) dbStatus = 'boq_sent';
    else if (st.includes('contact')) dbStatus = 'contacted';
    else if (st.includes('archive') || st.includes('delete')) dbStatus = 'archived';

    // Comprehensive CRM metadata embedded in JSONB raw_details for complete fidelity
    const crmDetails = {
      customer_name: lead.customer_name,
      normalized_phone: normPhone,
      alternate_phone: lead.alternate_phone || null,
      custom_source: lead.custom_source || null,
      custom_service: lead.custom_service || null,
      project_address: lead.project_address || null,
      temperature: lead.temperature || 'Warm',
      crm_status: lead.status || 'New Lead',
      assigned_to: lead.assigned_to || null,
      assigned_to_name: lead.assigned_to_name || null,
      last_contact_at: lead.last_contact_at || null,
      next_followup_at: lead.next_followup_at || null,
      next_followup_date: lead.next_followup_date || null,
      next_followup_time: lead.next_followup_time || null,
      created_by: lead.created_by || null,
      created_by_name: lead.created_by_name || null,
      last_updated_by: lead.last_updated_by || null,
      last_updated_by_name: lead.last_updated_by_name || null,
      ...(lead.raw_payload || {})
    };

    const payload = {
      id: lead.id,
      full_name: lead.customer_name,
      phone: lead.phone,
      email: lead.email || null,
      city: lead.city || 'Bengaluru',
      service_type: lead.interested_service || 'Residential Interior',
      estimated_budget: lead.budget || null,
      project_scope: lead.notes || null,
      source: lead.source || 'CRM Lead',
      status: dbStatus,
      preferred_date: lead.next_followup_date || (lead.next_followup_at ? lead.next_followup_at.split('T')[0] : null),
      notes: lead.notes || null,
      raw_details: crmDetails,
      created_at: lead.created_at,
      updated_at: lead.updated_at || new Date().toISOString()
    };

    const res = await fetch(`${url}/rest/v1/leads_and_inquiries`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 201 || res.status === 200) {
      const inserted = await res.json().catch(() => null);
      return { success: true, table: 'leads_and_inquiries', data: inserted };
    } else {
      const errText = await res.text().catch(() => 'Unknown Supabase error');
      console.warn('âŒ [Supabase Sync] leads_and_inquiries write rejected:', res.status, errText);
      return { success: false, table: 'leads_and_inquiries', error: `HTTP ${res.status}: ${errText}` };
    }
  } catch (err: any) {
    console.error('âŒ [Supabase Sync] Network exception:', err?.message || err);
    return { success: false, table: 'leads_and_inquiries', error: err.message || 'Network error reaching Supabase' };
  }
}

interface SupabaseDeleteResult {
  success: boolean;
  deleted_count: number;
  method?: 'rpc' | 'hard_delete' | 'soft_delete_db';
  error?: string;
}

// Persistent server-side deletion: the lead row is KEPT in Supabase as a backup but flagged as
// archived/is_deleted. Every sync (including the one on server start after a deployment) skips
// flagged rows and re-adds their ids to the local tombstone list, so a deleted lead never returns.
async function deleteLeadFromSupabase(id: string): Promise<SupabaseDeleteResult> {
  const { url, key } = getSupabaseCredentials();
  const nowIso = new Date().toISOString();

  try {
    const patchRes = await fetch(`${url}/rest/v1/leads_and_inquiries?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'archived',
        raw_details: { is_deleted: true, deleted_at: nowIso },
        updated_at: nowIso
      })
    });

    if (patchRes.ok) {
      const patchedRows = await patchRes.json().catch(() => []);
      if (Array.isArray(patchedRows) && patchedRows.length >= 1) {
        console.log(`âœ… [Supabase Archive] Lead ${id} flagged archived/is_deleted in leads_and_inquiries (kept as backup).`);
        return { success: true, deleted_count: 1, method: 'soft_delete_db' };
      }
      // 200 with no rows: the lead does not exist in Supabase (e.g. CRM-only lead) - nothing can reappear from there
      console.log(`â„¹ï¸ [Supabase Archive] Lead ${id} has no row in leads_and_inquiries; nothing to archive.`);
      return { success: true, deleted_count: 0, method: 'soft_delete_db' };
    }
    const errText = await patchRes.text().catch(() => '');
    console.error(`âŒ [Supabase Archive] Could not archive lead ${id}: HTTP ${patchRes.status} ${errText}. Run supabase/migrations/fix_leads_table_grants.sql in Supabase.`);
    return { success: false, deleted_count: 0, error: `HTTP ${patchRes.status}: ${errText}` };
  } catch (err: any) {
    console.error('âŒ [Supabase Archive] Network error while archiving lead:', err?.message || err);
    return { success: false, deleted_count: 0, error: err?.message || 'Network error' };
  }
}

export interface SupabaseCallSyncResult {
  success: boolean;
  persisted_to_supabase: boolean;
  migration_pending?: boolean;
  status: 'synced_to_supabase' | 'table_pending_migration' | 'error' | 'network_error';
  error?: string;
}

async function syncCallLogToSupabase(call: ServerCrmCallLog): Promise<SupabaseCallSyncResult> {
  const { url, key } = getSupabaseCredentials();
  try {
    const res = await fetch(`${url}/rest/v1/crm_call_logs`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: call.id,
        lead_id: call.lead_id,
        call_date: call.call_date,
        outcome: call.outcome,
        notes: call.notes || null,
        followup_date: call.followup_date || null,
        logged_by: call.logged_by || null,
        logged_by_name: call.logged_by_name || null,
        duration_seconds: call.duration_seconds || 0,
        created_at: call.created_at
      })
    });

    if (res.ok || res.status === 201) {
      console.log(`âœ… [Supabase Calls] Successfully persisted call ${call.id} to public.crm_call_logs.`);
      return { success: true, persisted_to_supabase: true, status: 'synced_to_supabase' };
    }

    const errText = await res.text().catch(() => '');
    if (res.status === 404 || errText.includes('42P01') || errText.includes('PGRST205')) {
      return {
        success: false,
        persisted_to_supabase: false,
        migration_pending: true,
        status: 'table_pending_migration',
        error: "Table 'public.crm_call_logs' does not exist in Supabase yet. Call saved securely to server storage."
      };
    }

    console.warn(`âš ï¸ [Supabase Calls] PostgREST insert note (${res.status}):`, errText);
    return {
      success: false,
      persisted_to_supabase: false,
      status: 'error',
      error: errText
    };
  } catch (err: any) {
    return {
      success: false,
      persisted_to_supabase: false,
      status: 'network_error',
      error: err?.message || String(err)
    };
  }
}

// Background synchronization of calls from Supabase when table exists
let lastSupabaseCallSyncTimestamp = 0;
async function syncCallsFromSupabase(): Promise<{ synced: number; tableAvailable: boolean }> {
  // Throttle queries to once every 15 seconds
  if (Date.now() - lastSupabaseCallSyncTimestamp < 15000) {
    return { synced: 0, tableAvailable: false };
  }
  lastSupabaseCallSyncTimestamp = Date.now();

  const { url, key } = getSupabaseCredentials();
  try {
    const res = await fetch(`${url}/rest/v1/crm_call_logs?select=*&order=call_date.desc&limit=500`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    if (!res.ok) {
      return { synced: 0, tableAvailable: false };
    }

    const rows = await res.json().catch(() => []);
    if (!Array.isArray(rows) || rows.length === 0) {
      return { synced: 0, tableAvailable: true };
    }

    let newCount = 0;
    const existingCallIds = new Set(dbCrmCalls.map(c => c.id));
    for (const r of rows) {
      if (r && r.id && !existingCallIds.has(r.id)) {
        dbCrmCalls.push({
          id: r.id,
          lead_id: r.lead_id,
          call_date: r.call_date || r.created_at,
          outcome: r.outcome,
          notes: r.notes || undefined,
          followup_date: r.followup_date || undefined,
          logged_by: r.logged_by || undefined,
          logged_by_name: r.logged_by_name || undefined,
          duration_seconds: r.duration_seconds || 0,
          created_at: r.created_at || r.call_date
        });
        existingCallIds.add(r.id);
        newCount++;
      }
    }

    if (newCount > 0) {
      saveCalls();
      console.log(`âœ… [CRM Call Sync] Synced ${newCount} call logs from Supabase.`);
    }

    return { synced: newCount, tableAvailable: true };
  } catch {
    return { synced: 0, tableAvailable: false };
  }
}

// -----------------------------------------------------------------------------
// IN-MEMORY / DISK DATA STATE
// -----------------------------------------------------------------------------
export let dbCrmUsers: Record<string, ServerCrmUser> = {};
export let dbCrmLeads: Record<string, ServerCrmLead> = {};
export let dbCrmCalls: ServerCrmCallLog[] = [];
export let dbCrmAudit: any[] = [];
export let dbCrmDeletedLeadIds = new Set<string>();
export let dbCrmCallsArchived: any[] = [];

// Load initial state from local JSON files
try {
  if (fs.existsSync(CRM_USERS_FILE)) {
    dbCrmUsers = JSON.parse(fs.readFileSync(CRM_USERS_FILE, 'utf-8'));
  }
} catch (_) {}

try {
  if (fs.existsSync(CRM_LEADS_FILE)) {
    dbCrmLeads = JSON.parse(fs.readFileSync(CRM_LEADS_FILE, 'utf-8'));
  }
} catch (_) {}

try {
  if (fs.existsSync(CRM_LEADS_DELETED_FILE)) {
    const rawDel = JSON.parse(fs.readFileSync(CRM_LEADS_DELETED_FILE, 'utf-8'));
    if (Array.isArray(rawDel)) {
      dbCrmDeletedLeadIds = new Set(rawDel);
    }
  }
} catch (_) {}

try {
  if (fs.existsSync(CRM_CALLS_FILE)) {
    dbCrmCalls = JSON.parse(fs.readFileSync(CRM_CALLS_FILE, 'utf-8'));
  }
} catch (_) {}

try {
  if (fs.existsSync(CRM_CALLS_ARCHIVED_FILE)) {
    dbCrmCallsArchived = JSON.parse(fs.readFileSync(CRM_CALLS_ARCHIVED_FILE, 'utf-8'));
  }
} catch (_) {}

try {
  if (fs.existsSync(CRM_AUDIT_FILE)) {
    dbCrmAudit = JSON.parse(fs.readFileSync(CRM_AUDIT_FILE, 'utf-8'));
  }
} catch (_) {}

// Clean purge of Pooja and telecaller1 setup
if (dbCrmUsers['telecaller1@royalepicinterior.com']) {
  delete dbCrmUsers['telecaller1@royalepicinterior.com'];
}

// Seed default users
const adminUser: ServerCrmUser = {
  id: 'crm_admin_primary',
  email: 'admin@royalepicinterior.com',
  name: 'Royal Epic Admin',
  phone: '+91 99166 33338',
  password: 'Admin@RoyalEpic2026',
  role: 'admin',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const execAdminUser: ServerCrmUser = {
  id: 'crm_admin_executive',
  email: 'royalepicfurnitur1@gmail.com',
  name: 'Royal Epic Executive Admin',
  phone: '+91 99166 33338',
  password: 'Admin@RoyalEpic2026',
  role: 'admin',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const telecaller1User: ServerCrmUser = {
  id: 'crm_telecaller_1',
  email: 'telecaller1@gmail.com',
  name: 'Telecaller 1',
  phone: '+91 98450 11223',
  password: 'telecaller1@123',
  role: 'telecaller',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

if (!dbCrmUsers['admin@royalepicinterior.com']) {
  dbCrmUsers['admin@royalepicinterior.com'] = adminUser;
}
if (!dbCrmUsers['royalepicfurnitur1@gmail.com']) {
  dbCrmUsers['royalepicfurnitur1@gmail.com'] = execAdminUser;
}
if (!dbCrmUsers['telecaller1@gmail.com']) {
  dbCrmUsers['telecaller1@gmail.com'] = telecaller1User;
} else {
  dbCrmUsers['telecaller1@gmail.com'].password = 'telecaller1@123';
  dbCrmUsers['telecaller1@gmail.com'].role = 'telecaller';
  dbCrmUsers['telecaller1@gmail.com'].status = 'active';
  dbCrmUsers['telecaller1@gmail.com'].name = 'Telecaller 1';
}

saveUsers();

export function saveUsers() {
  try {
    fs.writeFileSync(CRM_USERS_FILE, JSON.stringify(dbCrmUsers, null, 2));
  } catch (_) {}
}

export function saveLeads() {
  try {
    fs.writeFileSync(CRM_LEADS_FILE, JSON.stringify(dbCrmLeads, null, 2));
  } catch (_) {}
}

export function saveDeletedLeadIds() {
  try {
    fs.writeFileSync(CRM_LEADS_DELETED_FILE, JSON.stringify(Array.from(dbCrmDeletedLeadIds), null, 2));
  } catch (_) {}
}

export function saveCalls() {
  try {
    fs.writeFileSync(CRM_CALLS_FILE, JSON.stringify(dbCrmCalls, null, 2));
  } catch (_) {}
}

export function saveArchivedCalls() {
  try {
    fs.writeFileSync(CRM_CALLS_ARCHIVED_FILE, JSON.stringify(dbCrmCallsArchived, null, 2));
  } catch (_) {}
}

export function saveAudit() {
  try {
    fs.writeFileSync(CRM_AUDIT_FILE, JSON.stringify(dbCrmAudit, null, 2));
  } catch (_) {}
}

// Helper to filter out past developer test / demo entries from syncing into production CRM
export function isDeveloperTestRecord(name?: string, phone?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  const testNames = [
    'test lead verification',
    'csv import verification',
    'audit test customer',
    'audit test',
    'diagnostic test customer',
    'temporary rls probe',
    'lead-probe',
    'probe',
    'tester1',
    'tester2',
    'tester2@gmail.com',
    'testermail1',
    'testnow',
    'website testing',
    'lead1',
    'lead2',
    'name1',
    'refe',
    'erre',
    'rttt',
    'test1',
    'anita deshmukh', // verification test after duplicate fix
    'suresh menon'     // testing direct supabase client fallback
  ];

  if (testNames.some(t => lower === t || lower.includes(t))) {
    return true;
  }

  // Filter out dummy/mock phones like 123478965, 741741741, 1111222233
  const cleanedPhone = (phone || '').replace(/\D/g, '');
  if (cleanedPhone === '123478965' || cleanedPhone === '741741741' || cleanedPhone === '1111222233' || cleanedPhone === '852852852' || cleanedPhone === '1231231231' || cleanedPhone === '9999900000') {
    return true;
  }

  return false;
}

// A lead is a 'website enquiry' if it was created by the public website ingestion pipeline
export function isWebsiteEnquiryLead(l: { created_by?: string; source?: string }): boolean {
  return l.created_by === 'system_website_enquiry' || l.source === 'Website Enquiry';
}

// Ingest a public website enquiry immediately into the Telecaller CRM
export function ingestPublicWebsiteLead(leadRecord: {
  id: string;
  full_name?: string;
  customer_name?: string;
  phone?: string;
  email?: string | null;
  city?: string | null;
  service_type?: string | null;
  estimated_budget?: string | null;
  project_scope?: string | null;
  source?: string | null;
  status?: string | null;
  preferred_date?: string | null;
  drawing_name?: string | null;
  notes?: string | null;
  raw_details?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}): ServerCrmLead | null {
  if (!leadRecord || !leadRecord.id) return null;

  // 1. Strict tombstone guard: Never restore a deliberately deleted lead
  if (dbCrmDeletedLeadIds.has(leadRecord.id)) {
    return null;
  }

  // 2. Strict archive guard: Never ingest archived or deleted rows
  if (leadRecord.status === 'archived' || leadRecord.raw_details?.is_deleted === true) {
    return null;
  }

  const rawPhone = leadRecord.phone || '';
  const normPhone = normalizePhone(rawPhone);
  const leadId = leadRecord.id;
  const custName = leadRecord.full_name || leadRecord.customer_name || 'Website Visitor';
  
  // NOTE: no "developer test" filtering here. Every public website enquiry must reach the CRM;
  // the previous substring/phone blocklist silently dropped real and test submissions.

  const rd = leadRecord.raw_details || {};

  const crmLead: ServerCrmLead = {
    id: leadId,
    customer_name: rd.customer_name || custName,
    name: rd.customer_name || custName,
    phone: rd.phone || rawPhone,
    normalized_phone: rd.normalized_phone || normPhone,
    alternate_phone: rd.alternate_phone || undefined,
    email: leadRecord.email || undefined,
    // All public-website submissions are grouped under one CRM source so they appear in the
    // 'Website Enquiries' view; the specific form name is kept in the notes below.
    source: 'Website Enquiry',
    custom_source: rd.custom_source || undefined,
    interested_service: leadRecord.service_type || 'Residential Interior',
    projectType: leadRecord.service_type || 'Residential Interior',
    custom_service: rd.custom_service || undefined,
    city: leadRecord.city || 'Bengaluru',
    location: leadRecord.city || 'Bengaluru',
    project_address: rd.project_address || undefined,
    budget: leadRecord.estimated_budget || 'To be discussed',
    temperature: rd.temperature || 'Hot',
    status: rd.crm_status || 'New Lead',
    notes: [
      leadRecord.source && leadRecord.source !== 'Website Enquiry' ? `Form: ${leadRecord.source}` : '',
      leadRecord.project_scope || '',
      leadRecord.drawing_name ? `Uploaded Drawing: ${leadRecord.drawing_name}` : '',
      leadRecord.preferred_date ? `Preferred Consultation Date: ${leadRecord.preferred_date}` : '',
      leadRecord.notes || ''
    ].filter(Boolean).join(' | ') || undefined,
    assigned_to: rd.assigned_to || undefined,
    assigned_to_name: rd.assigned_to_name || undefined,
    next_followup_at: rd.next_followup_at || leadRecord.preferred_date || undefined,
    next_followup_date: rd.next_followup_date || (leadRecord.preferred_date ? leadRecord.preferred_date.slice(0, 10) : undefined),
    next_followup_time: rd.next_followup_time || '10:00',
    created_by: rd.created_by || 'system_website_enquiry',
    created_by_name: rd.created_by_name || 'Website Public Enquiry',
    created_at: leadRecord.created_at || new Date().toISOString(),
    updated_at: leadRecord.updated_at || new Date().toISOString()
  };

  dbCrmLeads[crmLead.id] = crmLead;
  saveLeads();
  console.log(`âœ… [CRM Ingestion] Ingested website enquiry ${crmLead.id} for "${crmLead.customer_name}" (${crmLead.phone}) into Telecaller CRM.`);
  return crmLead;
}

// Background throttle timestamp and sync lock
let lastSupabaseSyncTimestamp = 0;
let isSupabaseSyncInProgress = false;

// Pull existing website public enquiries from Supabase leads_and_inquiries into Telecaller CRM
export async function syncLeadsFromSupabase(): Promise<number> {
  if (isSupabaseSyncInProgress) {
    return 0; // Concurrency guard: avoid interleaving sync operations
  }
  isSupabaseSyncInProgress = true;
  const { url, key } = getSupabaseCredentials();
  let syncedCount = 0;
  let tombstonesChanged = false;

  try {
    const res = await fetch(`${url}/rest/v1/leads_and_inquiries?select=*&order=created_at.desc&limit=1000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        rows.forEach((r: any) => {
          // 1. Archived/deleted in Supabase => permanently hide locally, even if a stale local
          //    copy came back from a deployment (restored data/crm_leads.json).
          if (r.status === 'archived' || r.raw_details?.is_deleted === true) {
            if (!dbCrmDeletedLeadIds.has(r.id)) {
              dbCrmDeletedLeadIds.add(r.id);
              tombstonesChanged = true;
            }
            if (dbCrmLeads[r.id]) {
              delete dbCrmLeads[r.id];
              tombstonesChanged = true;
            }
            return;
          }
          // 2. Strict tombstone check: If deleted by admin, never re-ingest
          if (dbCrmDeletedLeadIds.has(r.id)) {
            return;
          }
          // 3. (Developer-test name/phone filter intentionally removed: it silently dropped real
          //    enquiries. Unwanted leads are removed by deleting them in the CRM instead.)
          // 4. Ingest new leads
          if (!dbCrmLeads[r.id]) {
            ingestPublicWebsiteLead(r);
            syncedCount++;
          } else {
            // 5. Update local lead if Supabase has newer update timestamp
            const local = dbCrmLeads[r.id];
            const rUpdated = new Date(r.updated_at || r.created_at).getTime();
            const lUpdated = new Date(local.updated_at || local.created_at).getTime();
            if (rUpdated > lUpdated && r.raw_details) {
              const rd = r.raw_details;
              if (rd.temperature) local.temperature = rd.temperature;
              if (rd.assigned_to) local.assigned_to = rd.assigned_to;
              if (rd.assigned_to_name) local.assigned_to_name = rd.assigned_to_name;
              if (rd.next_followup_at) local.next_followup_at = rd.next_followup_at;
              if (rd.next_followup_date) local.next_followup_date = rd.next_followup_date;
              if (rd.next_followup_time) local.next_followup_time = rd.next_followup_time;
              if (rd.crm_status) local.status = rd.crm_status;
              local.updated_at = r.updated_at;
              syncedCount++;
            }
          }
        });
        if (tombstonesChanged) {
          saveDeletedLeadIds();
          saveLeads();
        }
        if (syncedCount > 0) {
          saveLeads();
          console.log(`âœ… [CRM Sync] Synchronized ${syncedCount} website enquiries with Telecaller CRM.`);
        }
      }
    }
  } catch (err: any) {
    console.warn('Supabase leads_and_inquiries sync note:', err?.message || err);
  } finally {
    isSupabaseSyncInProgress = false;
  }
  return syncedCount;
}

// Pull on startup
(async function initSupabaseSync() {
  await syncLeadsFromSupabase();
  lastSupabaseSyncTimestamp = Date.now();
})();

// Helper to format lead object with backward-compatible aliases
function formatLeadWithAliases(lead: ServerCrmLead) {
  const cName = lead.customer_name || (lead as any).name || 'Unknown Client';
  const cPhone = lead.phone || '';
  const cCity = lead.city || (lead as any).location || 'Bengaluru';
  const cService = lead.interested_service || (lead as any).projectType || 'Residential Interior';
  const cCreatedAt = lead.created_at || (lead as any).createdAt || new Date().toISOString();

  return {
    ...lead,
    customer_name: cName,
    name: cName, // backward compatibility
    phone: cPhone,
    normalized_phone: lead.normalized_phone || normalizePhone(cPhone),
    city: cCity,
    location: cCity, // backward compatibility
    interested_service: cService,
    projectType: cService, // backward compatibility
    created_at: cCreatedAt,
    createdAt: cCreatedAt // backward compatibility
  };
}

// -----------------------------------------------------------------------------
// AUTHENTICATION & SESSION EXTRACTION
// -----------------------------------------------------------------------------
export function extractUserFromReq(req: Request): ServerCrmUser | null {
  const authHeader = req.headers['authorization'];
  const userIdHeader = req.headers['x-crm-user-id'] as string;
  const adminSecret = req.headers['x-admin-secret'] as string;

  // Direct admin bypass for Admin Dashboard operations
  if (adminSecret === 'RoyalEpicAdmin2026' || req.headers['x-admin-access'] === 'true') {
    return dbCrmUsers['admin@royalepicinterior.com'] || dbCrmUsers['royalepicfurnitur1@gmail.com'] || Object.values(dbCrmUsers).find(u => u.role === 'admin') || null;
  }

  if (userIdHeader) {
    const found = Object.values(dbCrmUsers).find(u => u.id === userIdHeader);
    if (found && found.status === 'active') return found;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const found = Object.values(dbCrmUsers).find(u => token.includes(u.id) || token.includes(u.email));
    if (found && found.status === 'active') return found;
  }

  return null;
}

// -----------------------------------------------------------------------------
// AUTH ENDPOINTS
// -----------------------------------------------------------------------------
crmRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const normEmail = email.trim().toLowerCase();
    const user = dbCrmUsers[normEmail];

    if (!user) {
      return res.status(401).json({ success: false, error: 'No approved account found for this email address.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Your account has been suspended by an administrator.' });
    }

    if (user.password && user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid password. Please verify your credentials.' });
    }

    const token = `crm_${user.role}_${user.id}_${Date.now()}`;
    const safeUser = { ...user };
    delete safeUser.password;

    res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Login error' });
  }
});

crmRouter.get('/auth/session', (req: Request, res: Response) => {
  const user = extractUserFromReq(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized or expired session.' });
  }
  const safeUser = { ...user };
  delete safeUser.password;
  res.json({ success: true, user: safeUser });
});

crmRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// LEADS ENDPOINTS
// -----------------------------------------------------------------------------

// GET /api/crm/leads
crmRouter.get('/leads', (req: Request, res: Response) => {
  try {
    // Non-blocking background sync with Supabase website leads (throttled every 15s)
    if (Date.now() - lastSupabaseSyncTimestamp > 15000) {
      lastSupabaseSyncTimestamp = Date.now();
      syncLeadsFromSupabase().catch(() => {});
    }

    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const status = (req.query.status as string) || '';
    const temperature = (req.query.temperature as string) || '';
    const source = (req.query.source as string) || '';
    const originFilter = ((req.query.origin as string) || '').toLowerCase();
    const service = (req.query.service as string) || '';
    const budget = (req.query.budget as string) || '';
    const location = ((req.query.location as string) || '').toLowerCase().trim();
    const assigned_to = (req.query.assigned_to as string) || '';
    const followup_filter = (req.query.followup_filter as string) || '';
    const followup_date = (req.query.followup_date as string) || '';
    const created_date = (req.query.created_date as string) || '';
    const sortBy = (req.query.sortBy as string) || 'created_desc';
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.max(Number(req.query.pageSize) || 15, 1);

    let list = Object.values(dbCrmLeads).filter(l => !dbCrmDeletedLeadIds.has(l.id));

    // 1. Search (Name, Phone, Alternate Phone, Email, Service, Location, Notes)
    if (search) {
      list = list.filter(l => {
        const cId = (l.id || '').toLowerCase();
        const cName = (l.customer_name || (l as any).name || '').toLowerCase();
        const cPhone = l.phone || '';
        const cAltPhone = l.alternate_phone || '';
        const cEmail = (l.email || '').toLowerCase();
        const cService = (l.interested_service || (l as any).projectType || '').toLowerCase();
        const cCustomService = (l.custom_service || '').toLowerCase();
        const cCity = (l.city || (l as any).location || '').toLowerCase();
        const cAddr = (l.project_address || '').toLowerCase();
        const cNotes = (l.notes || '').toLowerCase();

        return (
          cId.includes(search) ||
          cName.includes(search) ||
          cPhone.includes(search) ||
          cAltPhone.includes(search) ||
          cEmail.includes(search) ||
          cService.includes(search) ||
          cCustomService.includes(search) ||
          cCity.includes(search) ||
          cAddr.includes(search) ||
          cNotes.includes(search)
        );
      });
    }

    // 2. Status filter
    if (status && status !== 'All') {
      if (status === 'New Lead') {
        list = list.filter(l => l.status === 'New Lead' || l.status === 'New');
      } else if (status === 'Follow-up Required') {
        list = list.filter(l => l.status === 'Follow-up Required' || l.status === 'Follow-up');
      } else {
        list = list.filter(l => l.status === status);
      }
    }

    // 2b. Origin filter: only leads that came in through the public website forms
    if (originFilter === 'website') {
      list = list.filter(isWebsiteEnquiryLead);
    }

    // 3. Source filter
    if (source && source !== 'All') {
      list = list.filter(l => l.source === source);
    }

    // 4. Service filter
    if (service && service !== 'All') {
      list = list.filter(l => (l.interested_service || (l as any).projectType) === service);
    }

    // 5. Budget filter
    if (budget && budget !== 'All') {
      list = list.filter(l => l.budget === budget);
    }

    // 6. Location filter
    if (location) {
      list = list.filter(l => {
        const cCity = (l.city || (l as any).location || '').toLowerCase();
        const cAddr = (l.project_address || '').toLowerCase();
        return cCity.includes(location) || cAddr.includes(location);
      });
    }

    // 7. Assigned Telecaller
    if (assigned_to && assigned_to !== 'All') {
      if (assigned_to === 'unassigned') {
        list = list.filter(l => !l.assigned_to);
      } else {
        list = list.filter(l => l.assigned_to === assigned_to);
      }
    }

    // 8. Follow-up Filter using EXACT IST (Asia/Kolkata) boundaries
    const { startEpoch: istTodayStart, endEpoch: istTodayEnd } = getIstDayBoundaries();

    if (followup_filter && followup_filter !== 'All') {
      if (followup_filter === 'today') {
        list = list.filter(l => {
          if (!l.next_followup_at) return false;
          const t = new Date(l.next_followup_at).getTime();
          return t >= istTodayStart && t <= istTodayEnd;
        });
      } else if (followup_filter === 'overdue') {
        list = list.filter(l => {
          if (!l.next_followup_at || l.status === 'Converted' || l.status === 'Lost') return false;
          const t = new Date(l.next_followup_at).getTime();
          return t < istTodayStart;
        });
      } else if (followup_filter === 'upcoming') {
        list = list.filter(l => {
          if (!l.next_followup_at) return false;
          const t = new Date(l.next_followup_at).getTime();
          return t > istTodayEnd;
        });
      } else if (followup_filter === 'completed') {
        list = list.filter(l => l.status === 'Converted' || l.status === 'Site Visit Scheduled' || l.status === 'Quotation Sent');
      } else if (followup_filter === 'custom' && followup_date) {
        list = list.filter(l => l.next_followup_at && l.next_followup_at.startsWith(followup_date));
      }
    }

    // 9. Created Date Filter using IST boundaries
    if (created_date && created_date !== 'All') {
      if (created_date === 'today') {
        list = list.filter(l => new Date(l.created_at || (l as any).createdAt).getTime() >= istTodayStart);
      } else if (created_date === '7days') {
        const d7 = Date.now() - 7 * 86400000;
        list = list.filter(l => new Date(l.created_at || (l as any).createdAt).getTime() >= d7);
      } else if (created_date === '30days') {
        const d30 = Date.now() - 30 * 86400000;
        list = list.filter(l => new Date(l.created_at || (l as any).createdAt).getTime() >= d30);
      }
    }

    // 10. Temperature filter
    if (temperature && temperature !== 'All') {
      list = list.filter(l => l.temperature === temperature);
    }

    // Sort
    list.sort((a, b) => {
      const aCreated = new Date(a.created_at || (a as any).createdAt || 0).getTime();
      const bCreated = new Date(b.created_at || (b as any).createdAt || 0).getTime();

      if (sortBy === 'created_desc') return bCreated - aCreated;
      if (sortBy === 'created_asc') return aCreated - bCreated;

      if (sortBy === 'followup_asc') {
        if (!a.next_followup_at) return 1;
        if (!b.next_followup_at) return -1;
        return new Date(a.next_followup_at).getTime() - new Date(b.next_followup_at).getTime();
      }
      if (sortBy === 'followup_desc') {
        if (!a.next_followup_at) return 1;
        if (!b.next_followup_at) return -1;
        return new Date(b.next_followup_at).getTime() - new Date(a.next_followup_at).getTime();
      }
      if (sortBy === 'name_asc') {
        const aName = a.customer_name || (a as any).name || '';
        const bName = b.customer_name || (b as any).name || '';
        return aName.localeCompare(bName);
      }
      return 0;
    });

    const total = list.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = list.slice(startIndex, startIndex + pageSize).map(formatLeadWithAliases);

    res.json({
      success: true,
      leads: paginated,
      total,
      count: total, // backward compatibility
      page,
      pageSize
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching leads' });
  }
});

// GET /api/crm/leads/:id
crmRouter.get('/leads/:id', (req: Request, res: Response) => {
  const lead = dbCrmLeads[req.params.id];
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found.' });
  }
  res.json({ success: true, lead: formatLeadWithAliases(lead) });
});

// POST /api/crm/leads (Unified Manual Entry & Website Ingestion)
crmRouter.post('/leads', async (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    const body = req.body || {};

    const rawName = body.customer_name || body.name || '';
    const rawPhone = body.phone || '';
    const rawAltPhone = body.alternate_phone || '';
    const rawEmail = body.email || '';
    const rawSource = body.source || 'Website Enquiry';
    const rawCustomSource = body.custom_source || '';
    const rawService = body.interested_service || body.projectType || body.service || 'Residential Interior';
    const rawCustomService = body.custom_service || '';
    const rawCity = body.city || body.location || 'Bengaluru';
    const rawAddress = body.project_address || '';
    const rawBudget = body.budget || '';
    const rawTemp = body.temperature || 'Warm';
    const rawStatus = body.status || 'New Lead';
    
    // Notes can arrive as string, or as discoveredInfo/recommendations from AI consultant
    let rawNotes = body.notes || '';
    if (!rawNotes && body.discoveredInfo) {
      rawNotes = typeof body.discoveredInfo === 'object' ? JSON.stringify(body.discoveredInfo) : String(body.discoveredInfo);
    }
    if (!rawNotes && body.recommendations) {
      rawNotes = String(body.recommendations);
    }

    if (!rawName.trim() || !rawPhone.trim()) {
      return res.status(400).json({ success: false, error: 'Customer Name and Mobile Number are required.' });
    }

    const normPhone = normalizePhone(rawPhone);
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number.' });
    }

    // Duplicate Phone Number Check (Application-Level Enforcement)
    const existingLead = Object.values(dbCrmLeads).find(l => normalizePhone(l.phone) === normPhone);
    if (existingLead) {
      // If submitted from AI Consultant / Public website form, merge gracefully
      if (rawSource.includes('AI') || rawSource.includes('Website Form')) {
        existingLead.notes = `${existingLead.notes || ''}\n[Update ${new Date().toISOString().slice(0, 10)}]: ${rawNotes}`.trim();
        existingLead.updated_at = new Date().toISOString();
        dbCrmLeads[existingLead.id] = existingLead;
        saveLeads();
        syncLeadToSupabase(existingLead).catch(() => {});
        return res.json({
          success: true,
          leadId: existingLead.id,
          message: 'Existing lead updated with new consultation details.',
          lead: formatLeadWithAliases(existingLead)
        });
      }

      // For Telecaller manual entry: Enforce duplicate block
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        error: `A lead with mobile number ${rawPhone} already exists in CRM for "${existingLead.customer_name || (existingLead as any).name}" (ID: ${existingLead.id}).`
      });
    }

    let finalFollowupAt = body.next_followup_at || body.preferredDate;
    if (!finalFollowupAt && body.next_followup_date) {
      finalFollowupAt = `${body.next_followup_date}T${body.next_followup_time || '10:00'}:00`;
    }

    const now = new Date().toISOString();
    const id = body.id || `CRM-${now.slice(2, 7).replace('-', '')}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newLead: ServerCrmLead = {
      id,
      customer_name: rawName.trim(),
      phone: normPhone,
      normalized_phone: normPhone,
      alternate_phone: rawAltPhone ? normalizePhone(rawAltPhone) : undefined,
      email: rawEmail?.trim() || undefined,
      source: rawSource || 'Website Enquiry',
      custom_source: rawCustomSource?.trim() || undefined,
      interested_service: (rawSource === 'Other' && rawCustomSource) ? rawCustomSource : rawService.trim(),
      custom_service: rawCustomService?.trim() || undefined,
      city: rawCity?.trim() || 'Bengaluru',
      project_address: rawAddress?.trim() || undefined,
      budget: rawBudget?.trim() || undefined,
      temperature: rawTemp,
      status: rawStatus || 'New Lead',
      notes: rawNotes?.trim() || undefined,
      assigned_to: body.assigned_to || undefined,
      assigned_to_name: body.assigned_to_name || undefined,
      next_followup_at: finalFollowupAt || undefined,
      next_followup_date: body.next_followup_date || undefined,
      next_followup_time: body.next_followup_time || undefined,
      created_by: user?.id || 'system_website_enquiry',
      created_by_name: user?.name || 'Website Public Enquiry',
      created_at: now,
      updated_at: now
    };

    // 1. Save to local memory & disk JSON immediately (local-first)
    dbCrmLeads[id] = newLead;
    saveLeads();

    // 2. Record Audit Log
    dbCrmAudit.push({
      id: `AUDIT-${Date.now()}`,
      lead_id: id,
      action: 'CREATE',
      performed_by: user?.id || 'system',
      performed_by_name: user?.name || 'Public Web / CRM',
      details: { customer_name: rawName, phone: normPhone, source: rawSource, status: rawStatus },
      created_at: now
    });
    saveAudit();

    // 3. Fire-and-forget Supabase sync in background (does not block the response)
    syncLeadToSupabase(newLead).catch((err) => {
      console.warn('âš ï¸ [CRM Create] Background Supabase sync failed (lead already saved locally):', err?.message || err);
    });

    res.status(201).json({
      success: true,
      leadId: newLead.id,
      lead: formatLeadWithAliases(newLead),
      message: 'Lead successfully created in CRM.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating lead' });
  }
});

// PUT /api/crm/leads/:id (Full Lead Update)
crmRouter.put('/leads/:id', async (req: Request, res: Response) => {
  handleLeadUpdate(req, res);
});

// PATCH /api/crm/leads/:id (Partial Lead Update)
crmRouter.patch('/leads/:id', async (req: Request, res: Response) => {
  handleLeadUpdate(req, res);
});

async function handleLeadUpdate(req: Request, res: Response) {
  try {
    const user = extractUserFromReq(req);
    const lead = dbCrmLeads[req.params.id];
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found in CRM.' });
    }

    const body = req.body || {};

    if (body.phone) {
      const normPhone = normalizePhone(body.phone);
      // Check if duplicate with ANOTHER lead
      const duplicate = Object.values(dbCrmLeads).find(l => l.id !== lead.id && normalizePhone(l.phone) === normPhone);
      if (duplicate) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          error: `Another lead "${duplicate.customer_name || (duplicate as any).name}" already uses phone number ${body.phone}.`
        });
      }
      lead.phone = normPhone;
      lead.normalized_phone = normPhone;
    }

    if (body.customer_name || body.name) lead.customer_name = (body.customer_name || body.name).trim();
    if (body.alternate_phone !== undefined) lead.alternate_phone = body.alternate_phone ? normalizePhone(body.alternate_phone) : undefined;
    if (body.email !== undefined) lead.email = body.email?.trim() || undefined;
    if (body.source) lead.source = body.source;
    if (body.custom_source !== undefined) lead.custom_source = body.custom_source?.trim() || undefined;
    if (body.interested_service || body.projectType) lead.interested_service = (body.interested_service || body.projectType).trim();
    if (body.custom_service !== undefined) lead.custom_service = body.custom_service?.trim() || undefined;
    if (body.city !== undefined || body.location !== undefined) lead.city = (body.city || body.location).trim();
    if (body.project_address !== undefined) lead.project_address = body.project_address?.trim() || undefined;
    if (body.budget !== undefined) lead.budget = body.budget?.trim() || undefined;
    if (body.temperature) lead.temperature = body.temperature;
    if (body.status) lead.status = body.status;
    if (body.notes !== undefined) lead.notes = body.notes?.trim() || undefined;
    if (body.assigned_to !== undefined) lead.assigned_to = body.assigned_to || undefined;
    if (body.assigned_to_name !== undefined) lead.assigned_to_name = body.assigned_to_name || undefined;

    if (body.next_followup_at !== undefined) {
      lead.next_followup_at = body.next_followup_at || undefined;
    } else if (body.next_followup_date) {
      lead.next_followup_at = `${body.next_followup_date}T${body.next_followup_time || '10:00'}:00`;
    } else if (body.preferredDate) {
      lead.next_followup_at = body.preferredDate;
    }

    if (body.next_followup_date !== undefined) lead.next_followup_date = body.next_followup_date || undefined;
    if (body.next_followup_time !== undefined) lead.next_followup_time = body.next_followup_time || undefined;

    lead.last_updated_by = user?.id;
    lead.last_updated_by_name = user?.name;
    lead.updated_at = new Date().toISOString();

    // 1. Save to local memory & disk JSON immediately (local-first)
    dbCrmLeads[lead.id] = lead;
    saveLeads();

    // 2. Record Audit Log
    dbCrmAudit.push({
      id: `AUDIT-${Date.now()}`,
      lead_id: lead.id,
      action: 'UPDATE',
      performed_by: user?.id || 'system',
      performed_by_name: user?.name || 'CRM User',
      details: { updated_fields: Object.keys(body) },
      created_at: lead.updated_at
    });
    saveAudit();

    // 3. Fire-and-forget Supabase sync in background (does not block the response)
    syncLeadToSupabase(lead).catch((err) => {
      console.warn('âš ï¸ [CRM Update] Background Supabase sync failed (lead already saved locally):', err?.message || err);
    });

    res.json({ success: true, lead: formatLeadWithAliases(lead), message: 'Lead successfully updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error updating lead' });
  }
}

// DELETE /api/crm/leads/:id (Archive Lead - All active CRM users)
crmRouter.delete('/leads/:id', async (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Please log in to perform this action.'
      });
    }

    const leadId = req.params.id;
    const lead = dbCrmLeads[leadId];
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found in CRM.' });
    }

    // 1. Add to persistent tombstone set so it is never re-ingested
    dbCrmDeletedLeadIds.add(leadId);
    saveDeletedLeadIds();

    // 2. Remove lead from active in-memory store and JSON file immediately
    delete dbCrmLeads[leadId];
    saveLeads();

    // 3. Call History Retention: archive associated calls so history is not lost
    const associatedCalls = dbCrmCalls.filter(c => c.lead_id === leadId);
    if (associatedCalls.length > 0) {
      const existingArchivedIds = new Set(dbCrmCallsArchived.map(c => c.id));
      for (const call of associatedCalls) {
        if (!existingArchivedIds.has(call.id)) {
          dbCrmCallsArchived.push({
            ...call,
            archived_at: new Date().toISOString(),
            archive_reason: 'lead_archived',
            deleted_by: user.id
          });
          existingArchivedIds.add(call.id);
        }
      }
      saveArchivedCalls();
    }

    // 4. Audit log
    dbCrmAudit.push({
      id: `AUDIT-${Date.now()}`,
      lead_id: leadId,
      action: 'ARCHIVE',
      performed_by: user.id,
      performed_by_name: user.name,
      details: {
        archived_name: lead.customer_name,
        phone: lead.phone
      },
      created_at: new Date().toISOString()
    });
    saveAudit();

    // 5. Persist the deletion in Supabase (row kept as backup, flagged archived) so it survives deployments
    const sbResult = await deleteLeadFromSupabase(leadId).catch((err) => ({
      success: false, deleted_count: 0, error: err?.message || String(err)
    } as SupabaseDeleteResult));

    res.json({
      success: true,
      archived: true,
      deleted_count: 1,
      persisted_in_database: sbResult.success,
      message: sbResult.success
        ? 'Lead archived successfully.'
        : 'Lead removed from CRM, but could not be flagged in the database yet (see server logs).'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error archiving lead' });
  }
});

// -----------------------------------------------------------------------------
// CALL LOGS ENDPOINTS
// -----------------------------------------------------------------------------

// GET /api/crm/calls (All Calls)
crmRouter.get('/calls', async (_req: Request, res: Response) => {
  // Sync fresh calls from Supabase if table is available
  await syncCallsFromSupabase().catch(() => {});
  const calls = [...dbCrmCalls].sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime());
  res.json({ success: true, calls, total: calls.length });
});

// GET /api/crm/leads/:id/calls (Calls for specific lead)
crmRouter.get('/leads/:id/calls', async (req: Request, res: Response) => {
  const leadId = req.params.id;
  await syncCallsFromSupabase().catch(() => {});

  // Search active calls first, then archived calls if needed so history is never lost
  const activeCalls = dbCrmCalls.filter(c => c.lead_id === leadId);
  const archivedCalls = dbCrmCallsArchived.filter(c => c.lead_id === leadId);

  // Merge and deduplicate by call ID
  const seenIds = new Set<string>();
  const allLeadCalls: any[] = [];
  for (const c of [...activeCalls, ...archivedCalls]) {
    if (!seenIds.has(c.id)) {
      seenIds.add(c.id);
      allLeadCalls.push(c);
    }
  }

  allLeadCalls.sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime());
  res.json({ success: true, calls: allLeadCalls });
});

// POST /api/crm/calls (Log Call & Update Follow-up)
crmRouter.post('/calls', async (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    const { lead_id, outcome, notes, followup_date, update_lead_status, update_lead_temperature } = req.body;

    if (!lead_id || !outcome) {
      return res.status(400).json({ success: false, error: 'lead_id and outcome are required.' });
    }

    const lead = dbCrmLeads[lead_id];
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found.' });
    }

    const now = new Date().toISOString();
    const callLog: ServerCrmCallLog = {
      id: `CALL-${now.slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      lead_id,
      call_date: now,
      outcome,
      notes: notes?.trim() || undefined,
      followup_date: followup_date || undefined,
      logged_by: user?.id,
      logged_by_name: user?.name,
      created_at: now
    };

    // Deduplicate in memory / local store
    if (!dbCrmCalls.some(c => c.id === callLog.id)) {
      dbCrmCalls.push(callLog);
      saveCalls();
    }

    // Await validated sync to Supabase (does NOT send emails)
    const dbCallResult = await syncCallLogToSupabase(callLog);

    // Automatically update lead's metadata
    lead.last_contact_at = now;
    if (update_lead_status) lead.status = update_lead_status;
    if (update_lead_temperature) lead.temperature = update_lead_temperature;
    if (followup_date) lead.next_followup_at = followup_date;
    lead.last_updated_by = user?.id;
    lead.last_updated_by_name = user?.name;
    lead.updated_at = now;

    dbCrmLeads[lead_id] = lead;
    saveLeads();

    // Sync updated lead to Supabase
    syncLeadToSupabase(lead).catch(() => {});

    res.status(201).json({
      success: true,
      callLog,
      lead: formatLeadWithAliases(lead),
      storage: {
        local_storage: true,
        supabase_cloud: dbCallResult.persisted_to_supabase,
        migration_pending: dbCallResult.migration_pending || false,
        status_message: dbCallResult.persisted_to_supabase
          ? 'Call history persisted to Supabase and CRM storage.'
          : 'Call history saved securely to CRM server storage. Supabase crm_call_logs table pending migration.'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error recording call' });
  }
});

// -----------------------------------------------------------------------------
// FOLLOW-UPS ENDPOINT (Strict IST boundaries)
// -----------------------------------------------------------------------------
crmRouter.get('/followups', (_req: Request, res: Response) => {
  try {
    const { startEpoch: istTodayStart, endEpoch: istTodayEnd } = getIstDayBoundaries();

    const allLeads = Object.values(dbCrmLeads);
    const activeFollowups = allLeads.filter(l => l.next_followup_at && l.status !== 'Converted' && l.status !== 'Lost');

    const dueToday: any[] = [];
    const overdue: any[] = [];
    const upcoming: any[] = [];
    const completed: any[] = [];

    activeFollowups.forEach(l => {
      const fTime = new Date(l.next_followup_at!).getTime();
      const formatted = formatLeadWithAliases(l);
      if (fTime < istTodayStart) {
        overdue.push(formatted);
      } else if (fTime >= istTodayStart && fTime <= istTodayEnd) {
        dueToday.push(formatted);
      } else {
        upcoming.push(formatted);
      }
    });

    // Completed follow-ups
    allLeads.forEach(l => {
      if (l.status === 'Converted' || l.status === 'Site Visit Scheduled' || l.status === 'Quotation Sent') {
        completed.push(formatLeadWithAliases(l));
      }
    });

    overdue.sort((a, b) => new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime());
    dueToday.sort((a, b) => new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime());
    upcoming.sort((a, b) => new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime());
    completed.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    res.json({ success: true, dueToday, overdue, upcoming, completed: completed.slice(0, 50) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching followups' });
  }
});

// -----------------------------------------------------------------------------
// DASHBOARD METRICS ENDPOINT (Strict IST boundaries)
// -----------------------------------------------------------------------------
crmRouter.get('/dashboard-metrics', (_req: Request, res: Response) => {
  try {
    const leads = Object.values(dbCrmLeads);
    const { startEpoch: istTodayStart, endEpoch: istTodayEnd } = getIstDayBoundaries();

    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'New Lead' || l.status === 'New').length;
    const interestedLeads = leads.filter(l => 
      l.status === 'Interested' || 
      l.temperature === 'Hot' ||
      l.status === 'Site Visit Scheduled' ||
      l.status === 'Quotation Sent' ||
      l.status === 'Negotiation'
    ).length;

    // Follow-ups Due: Overdue + Due Today in IST
    const followupsDue = leads.filter(l => {
      if (!l.next_followup_at || l.status === 'Converted' || l.status === 'Lost') return false;
      const t = new Date(l.next_followup_at).getTime();
      return t <= istTodayEnd;
    }).length;

    const followupsDueToday = leads.filter(l => {
      if (!l.next_followup_at || l.status === 'Converted' || l.status === 'Lost') return false;
      const t = new Date(l.next_followup_at).getTime();
      return t >= istTodayStart && t <= istTodayEnd;
    }).length;

    const overdueFollowups = leads.filter(l => {
      if (!l.next_followup_at || l.status === 'Converted' || l.status === 'Lost') return false;
      const t = new Date(l.next_followup_at).getTime();
      return t < istTodayStart;
    }).length;

    const convertedLeads = leads.filter(l => l.status === 'Converted').length;
    const lostLeads = leads.filter(l => 
      l.status === 'Lost' || 
      l.status === 'Not Interested' || 
      l.status === 'Not Reachable'
    ).length;

    // Calls Today in IST
    const callsToday = dbCrmCalls.filter(c => {
      const t = new Date(c.call_date).getTime();
      return t >= istTodayStart && t <= istTodayEnd;
    }).length;

    res.json({
      success: true,
      metrics: {
        totalLeads,
        newLeads,
        interestedLeads,
        followupsDue,
        convertedLeads,
        lostLeads,
        callsToday,
        followupsDueToday,
        overdueFollowups
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error compiling metrics' });
  }
});

// -----------------------------------------------------------------------------
// CSV EXPORT ENDPOINT (DISABLED BY SYSTEM POLICY)
// -----------------------------------------------------------------------------
crmRouter.get('/export-csv', (_req: Request, res: Response) => {
  return res.status(403).json({
    success: false,
    error: 'Lead data export has been disabled by system policy.'
  });
});

// -----------------------------------------------------------------------------
// REPORTS ENDPOINT
// -----------------------------------------------------------------------------
crmRouter.get('/reports', (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 30;
    const cutoff = Date.now() - days * 86400000;

    const leads = Object.values(dbCrmLeads).filter(l => new Date(l.created_at || (l as any).createdAt).getTime() >= cutoff);
    const calls = dbCrmCalls.filter(c => new Date(c.call_date).getTime() >= cutoff);

    const sourceMap: Record<string, number> = {};
    leads.forEach(l => {
      sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
    });
    const bySource = Object.entries(sourceMap).map(([source, count]) => ({ source, count }));

    const statusMap: Record<string, number> = {};
    leads.forEach(l => {
      statusMap[l.status] = (statusMap[l.status] || 0) + 1;
    });
    const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    const tempMap: Record<string, number> = { 'Hot': 0, 'Warm': 0, 'Cold': 0 };
    leads.forEach(l => {
      if (l.temperature && tempMap[l.temperature] !== undefined) {
        tempMap[l.temperature] = (tempMap[l.temperature] || 0) + 1;
      }
    });
    const byTemperature = Object.entries(tempMap).map(([temperature, count]) => ({ temperature, count }));

    const outcomeMap: Record<string, number> = {};
    calls.forEach(c => {
      outcomeMap[c.outcome] = (outcomeMap[c.outcome] || 0) + 1;
    });
    const callsByOutcome = Object.entries(outcomeMap).map(([outcome, count]) => ({ outcome, count }));

    const converted = leads.filter(l => l.status === 'Converted').length;
    const conversionRate = leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;

    res.json({
      success: true,
      reports: {
        bySource,
        byStatus,
        byTemperature,
        callsByOutcome,
        totalCalls: calls.length,
        conversionRate
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error generating reports' });
  }
});

// -----------------------------------------------------------------------------
// CSV IMPORT ENDPOINT (Admin Only)
// -----------------------------------------------------------------------------
crmRouter.post('/import-csv', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Only administrators can import leads via CSV.' });
    }

    const { leads: incomingLeads } = req.body;
    if (!Array.isArray(incomingLeads) || incomingLeads.length === 0) {
      return res.status(400).json({ success: false, error: 'No lead rows provided.' });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    const existingPhones = new Set(Object.values(dbCrmLeads).map(l => normalizePhone(l.phone)));
    const now = new Date().toISOString();

    incomingLeads.forEach((row: any, idx: number) => {
      const name = row.customer_name || row.name;
      const phone = row.phone;
      if (!name || !phone) {
        skippedCount++;
        errors.push({ row: idx + 1, reason: 'Name or phone is missing' });
        return;
      }

      const norm = normalizePhone(phone);
      if (existingPhones.has(norm)) {
        skippedCount++;
        errors.push({ row: idx + 1, reason: `Phone ${norm} already exists in CRM` });
        return;
      }

      const id = `CRM-${now.slice(2, 7).replace('-', '')}-${Math.floor(10000 + Math.random() * 90000)}`;
      const lead: ServerCrmLead = {
        id,
        customer_name: String(name).trim(),
        phone: norm,
        normalized_phone: norm,
        email: row.email ? String(row.email).trim() : undefined,
        source: row.source || 'Website',
        interested_service: row.interested_service || row.projectType || 'Turnkey Interior',
        city: row.city || row.location || 'Bengaluru',
        budget: row.budget || undefined,
        temperature: row.temperature || 'Warm',
        status: row.status || 'New Lead',
        notes: row.notes || undefined,
        external_lead_id: row.external_lead_id ? String(row.external_lead_id).trim() : undefined,
        alternate_phone: row.alternate_phone ? normalizePhone(String(row.alternate_phone)) : undefined,
        created_by: user.id,
        created_by_name: user.name,
        created_at: now,
        updated_at: now
      };

      dbCrmLeads[id] = lead;
      existingPhones.add(norm);
      importedCount++;

      syncLeadToSupabase(lead).catch(() => {});
    });

    saveLeads();

    dbCrmAudit.push({
      id: `AUDIT-${Date.now()}`,
      action: 'IMPORT',
      performed_by: user.id,
      performed_by_name: user.name,
      details: { importedCount, skippedCount },
      created_at: now
    });
    saveAudit();

    res.json({ success: true, importedCount, skippedCount, errors });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to import CSV' });
  }
});

// -----------------------------------------------------------------------------
// USER MANAGEMENT ENDPOINTS (Admin Only)
// -----------------------------------------------------------------------------
crmRouter.get('/users', (req: Request, res: Response) => {
  const user = extractUserFromReq(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
  }

  const safeUsers = Object.values(dbCrmUsers).map(u => {
    const c = { ...u };
    delete c.password;
    return c;
  });

  res.json({ success: true, users: safeUsers });
});

crmRouter.post('/users/role', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    const { userId, role } = req.body;
    if (!userId || !role || (role !== 'admin' && role !== 'telecaller')) {
      return res.status(400).json({ success: false, error: 'Valid userId and role are required.' });
    }

    const target = Object.values(dbCrmUsers).find(u => u.id === userId);
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    target.role = role;
    target.updatedAt = new Date().toISOString();
    saveUsers();

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error updating user role' });
  }
});

crmRouter.post('/users/create', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    const { name, email, password, phone, role = 'telecaller' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    const normEmail = email.trim().toLowerCase();
    if (dbCrmUsers[normEmail]) {
      return res.status(409).json({ success: false, error: 'User with this email already exists.' });
    }

    const newUser: ServerCrmUser = {
      id: `crm_usr_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      email: normEmail,
      name: name.trim(),
      phone: phone?.trim() || '',
      password,
      role: role === 'admin' ? 'admin' : 'telecaller',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbCrmUsers[normEmail] = newUser;
    saveUsers();

    const safe = { ...newUser };
    delete safe.password;
    res.status(201).json({ success: true, user: safe });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating user' });
  }
});

crmRouter.delete('/users/:id', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    const { id } = req.params;
    const targetKey = Object.keys(dbCrmUsers).find(email => dbCrmUsers[email].id === id || email.toLowerCase() === id.toLowerCase());
    if (!targetKey) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (dbCrmUsers[targetKey].id === 'crm_admin_primary') {
      return res.status(400).json({ success: false, error: 'Cannot delete primary root administrator account.' });
    }

    const deletedName = dbCrmUsers[targetKey].name;
    delete dbCrmUsers[targetKey];
    saveUsers();

    res.json({ success: true, message: `User "${deletedName}" has been removed.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error deleting user' });
  }
});

crmRouter.post('/users/password', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    const { userId, newPassword } = req.body;
    if (!userId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Valid userId and new password (min 6 chars) required.' });
    }

    const target = Object.values(dbCrmUsers).find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    target.password = newPassword;
    target.updatedAt = new Date().toISOString();
    saveUsers();

    res.json({ success: true, message: `Password for ${target.name} has been updated.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error resetting password' });
  }
});

crmRouter.post('/users/status', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    const { userId, status } = req.body;
    if (!userId || !status || (status !== 'active' && status !== 'suspended')) {
      return res.status(400).json({ success: false, error: 'Valid userId and status (active/suspended) required.' });
    }

    const target = Object.values(dbCrmUsers).find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    target.status = status;
    target.updatedAt = new Date().toISOString();
    saveUsers();

    res.json({ success: true, message: `User status set to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error updating status' });
  }
});
// POST /api/crm/migrate-to-supabase
// One-click idempotent migration of local leads into Supabase PostgreSQL
// -----------------------------------------------------------------------------
crmRouter.post('/migrate-to-supabase', async (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin authentication required to trigger migration.' });
    }

    const leads = Object.values(dbCrmLeads);
    const calls = dbCrmCalls;
    let leadsSuccess = 0;
    let leadsFailed = 0;
    let callsSuccess = 0;
    let callsFailed = 0;

    for (const lead of leads) {
      const result = await syncLeadToSupabase(lead);
      if (result.success) leadsSuccess++;
      else leadsFailed++;
    }

    for (const call of calls) {
      const ok = await syncCallLogToSupabase(call);
      if (ok) callsSuccess++;
      else callsFailed++;
    }

    res.json({
      success: true,
      message: 'Supabase migration execution complete.',
      stats: {
        totalLeads: leads.length,
        leadsMigrated: leadsSuccess,
        leadsFailed,
        totalCalls: calls.length,
        callsMigrated: callsSuccess,
        callsFailed
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Migration error' });
  }
});
