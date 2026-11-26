import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { extractUserFromReq, getActiveCrmStaffList, normalizePhone } from './crmRoutes';
import { sendLeadNotificationEmail } from './emailNotificationService';

export const loanCrmRouter = express.Router();
export const publicLoansRouter = express.Router();

// =============================================================================
// CONSTANTS & TYPES
// =============================================================================

export const LOAN_FINANCE_PURPOSES = [
  'Home Construction Finance',
  'Home Interior Finance',
  'Home Renovation Finance',
  'Property-Related Finance',
  'Other',
] as const;

export type LoanFinancePurpose = (typeof LOAN_FINANCE_PURPOSES)[number];

export const LOAN_APPROXIMATE_AMOUNTS = [
  'Below ₹5 Lakhs',
  '₹5–10 Lakhs',
  '₹10–25 Lakhs',
  '₹25–50 Lakhs',
  '₹50 Lakhs–₹1 Crore',
  'Above ₹1 Crore',
  'Not Sure Yet',
] as const;

export const LOAN_PREFERRED_CONTACT_TIMES = [
  'Morning',
  'Afternoon',
  'Evening',
  'Anytime',
] as const;

export const LOAN_ENQUIRY_SOURCES = [
  'Website Loans Page',
  'Homepage Loans Section',
  'Finance Service Card',
  'Callback Request',
  'CRM Manual Entry',
] as const;

export const LOAN_ENQUIRY_STATUSES = [
  'New',
  'Contact Pending',
  'Contacted',
  'Requirement Under Review',
  'Further Discussion',
  'Converted',
  'Not Proceeding',
  'Closed',
] as const;

export type LoanEnquiryStatus = (typeof LOAN_ENQUIRY_STATUSES)[number];

export const LOAN_CALL_OUTCOMES = [
  'Connected',
  'No Answer',
  'Call Back Requested',
  'Interested',
  'Not Interested',
  'Details Shared',
  'Follow-up Required',
] as const;

export type LoanCallOutcome = (typeof LOAN_CALL_OUTCOMES)[number];

export interface LoanEnquiryRecord {
  id: string;
  enquiry_reference: string;
  customer_name: string;
  mobile_number: string;
  normalized_phone: string;
  email: string | null;
  city: string | null;
  finance_purpose: string;
  approximate_amount: string | null;
  project_details: string | null;
  preferred_contact_time: string | null;
  enquiry_source: string;
  status: LoanEnquiryStatus;
  assigned_staff: string | null;
  assigned_staff_name: string | null;
  next_followup_at: string | null;
  last_contacted_at: string | null;
  internal_notes: string | null;
  consent_accepted: boolean;
  linked_previous_enquiry_id?: string | null;
  linked_previous_reference?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanCallLogRecord {
  id: string;
  loan_enquiry_id: string;
  staff_id: string;
  staff_name: string;
  call_status: LoanCallOutcome;
  call_notes: string | null;
  next_followup_at: string | null;
  created_at: string;
}

export interface LoanActivityRecord {
  id: string;
  loan_enquiry_id: string;
  staff_id: string | null;
  staff_name: string | null;
  action_type: string;
  description: string;
  created_at: string;
}

// =============================================================================
// SERVER-ONLY SUPABASE SERVICE-ROLE CONFIGURATION
// Reads SUPABASE_SERVICE_ROLE_KEY strictly from server-side process.env.
// Never uses VITE_ variables for the service role key and never logs or exposes it.
// =============================================================================

interface LoanSupabaseServiceConfig {
  url: string;
  serviceRoleKey: string | null;
  isConfigured: boolean;
  configError: string | null;
}

function decodeJwtRole(jwtToken: string): string | null {
  try {
    const parts = jwtToken.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    return typeof payload?.role === 'string' ? payload.role : null;
  } catch (_) {
    return null;
  }
}

export function getLoanServiceSupabaseConfig(): LoanSupabaseServiceConfig {
  const rawUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://lwrfoztfsyffgtybesia.supabase.co';
  const url = rawUrl.replace(/\/+$/, '');

  const rawServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (
    !rawServiceKey ||
    rawServiceKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY' ||
    rawServiceKey.startsWith('YOUR_') ||
    rawServiceKey.startsWith('<')
  ) {
    return {
      url,
      serviceRoleKey: null,
      isConfigured: false,
      configError: 'SUPABASE_SERVICE_ROLE_KEY is not configured in server environment.',
    };
  }

  const detectedRole = decodeJwtRole(rawServiceKey);
  if (detectedRole === 'anon') {
    return {
      url,
      serviceRoleKey: null,
      isConfigured: false,
      configError:
        'SUPABASE_SERVICE_ROLE_KEY is set to an anon role token instead of the service_role key.',
    };
  }

  const isSecretFormat = rawServiceKey.startsWith('sb_secret_');
  if (detectedRole !== 'service_role' && !isSecretFormat) {
    return {
      url,
      serviceRoleKey: null,
      isConfigured: false,
      configError:
        'SUPABASE_SERVICE_ROLE_KEY is not a valid Supabase service_role JWT or sb_secret_ key.',
    };
  }

  return {
    url,
    serviceRoleKey: rawServiceKey,
    isConfigured: true,
    configError: null,
  };
}

function getServiceRoleHeaders(serviceRoleKey: string, extraHeaders: Record<string, string> = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
}

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.argv[1]?.endsWith('.cjs')) ||
    (typeof __filename !== 'undefined' && __filename.endsWith('.cjs'))
  );
}

/**
 * Local development JSON fallback is ONLY permitted when:
 * 1. Running in non-production development mode (!isProductionRuntime()), AND
 * 2. SUPABASE_SERVICE_ROLE_KEY is not configured, AND
 * 3. ALLOW_LOCAL_LOANS_DEV_FALLBACK === 'true' is explicitly enabled.
 * In production or whenever SUPABASE_SERVICE_ROLE_KEY is configured, the backend
 * never falls back to local JSON files and never reports false success on DB failure.
 */
function isLocalDevFallbackAllowed(): boolean {
  if (isProductionRuntime()) return false;
  const cfg = getLoanServiceSupabaseConfig();
  if (cfg.isConfigured) return false;
  return process.env.ALLOW_LOCAL_LOANS_DEV_FALLBACK === 'true';
}

// =============================================================================
// LOCAL DEVELOPMENT FALLBACK STORAGE (Used ONLY when isLocalDevFallbackAllowed() is true)
// =============================================================================

const DB_DIR = path.join(process.cwd(), 'data');
const LOAN_ENQUIRIES_FILE = path.join(DB_DIR, 'loan_enquiries.json');
const LOAN_CALL_LOGS_FILE = path.join(DB_DIR, 'loan_call_logs.json');
const LOAN_ACTIVITIES_FILE = path.join(DB_DIR, 'loan_activities.json');

function readJsonArray<T>(filePath: string): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn(`[LoansCRM] Error reading ${path.basename(filePath)}`);
  }
  return [];
}

function writeJsonArray<T>(filePath: string, data: T[]): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[LoansCRM] Error writing ${path.basename(filePath)}`);
  }
}

let devEnquiriesStore: LoanEnquiryRecord[] = readJsonArray<LoanEnquiryRecord>(LOAN_ENQUIRIES_FILE);
let devCallLogsStore: LoanCallLogRecord[] = readJsonArray<LoanCallLogRecord>(LOAN_CALL_LOGS_FILE);
let devActivitiesStore: LoanActivityRecord[] = readJsonArray<LoanActivityRecord>(LOAN_ACTIVITIES_FILE);

function saveDevStores(): void {
  writeJsonArray(LOAN_ENQUIRIES_FILE, devEnquiriesStore);
  writeJsonArray(LOAN_CALL_LOGS_FILE, devCallLogsStore);
  writeJsonArray(LOAN_ACTIVITIES_FILE, devActivitiesStore);
}

// =============================================================================
// SUPABASE SERVICE-ROLE DATA ACCESS LAYER
// =============================================================================

async function parseSupabaseError(res: globalThis.Response): Promise<{ code: string; message: string; status: number }> {
  let code = `HTTP_${res.status}`;
  let message = `Database operation failed with status ${res.status}`;
  try {
    const errJson: any = await res.json();
    if (errJson?.code) code = String(errJson.code);
    if (errJson?.message) message = String(errJson.message);
  } catch (_) {}
  return { code, message, status: res.status };
}

async function sbFetchAllEnquiries(): Promise<LoanEnquiryRecord[]> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      return [...devEnquiriesStore];
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const res = await fetch(
    `${cfg.url}/rest/v1/loan_enquiries?select=*&order=created_at.desc&limit=1000`,
    {
      headers: getServiceRoleHeaders(cfg.serviceRoleKey),
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    console.error(`[LoansCRM] Supabase loan_enquiries SELECT failed: code=${errInfo.code} status=${errInfo.status}`);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

async function sbFindEnquiriesByPhone(normalizedPhone: string): Promise<LoanEnquiryRecord[]> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      return devEnquiriesStore.filter((e) => e.normalized_phone === normalizedPhone);
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const res = await fetch(
    `${cfg.url}/rest/v1/loan_enquiries?normalized_phone=eq.${encodeURIComponent(normalizedPhone)}&select=*&order=created_at.desc`,
    {
      headers: getServiceRoleHeaders(cfg.serviceRoleKey),
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    console.error(`[LoansCRM] Supabase phone lookup failed: code=${errInfo.code} status=${errInfo.status}`);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

async function sbFindEnquiryByIdOrRef(idOrRef: string): Promise<LoanEnquiryRecord | null> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      return (
        devEnquiriesStore.find(
          (e) => e.id === idOrRef || e.enquiry_reference.toLowerCase() === idOrRef.toLowerCase()
        ) || null
      );
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrRef);
  const filterQuery = isUuid
    ? `id=eq.${encodeURIComponent(idOrRef)}`
    : `enquiry_reference=ilike.${encodeURIComponent(idOrRef)}`;

  const res = await fetch(`${cfg.url}/rest/v1/loan_enquiries?${filterQuery}&select=*&limit=1`, {
    headers: getServiceRoleHeaders(cfg.serviceRoleKey),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    console.error(`[LoansCRM] Supabase single enquiry lookup failed: code=${errInfo.code}`);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function sbCountTodayEnquiries(prefix: string): Promise<number> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      return devEnquiriesStore.filter((e) => e.enquiry_reference.startsWith(prefix)).length;
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const res = await fetch(
    `${cfg.url}/rest/v1/loan_enquiries?enquiry_reference=like.${encodeURIComponent(prefix)}*&select=id`,
    {
      headers: getServiceRoleHeaders(cfg.serviceRoleKey),
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) ? rows.length : 0;
}

async function sbInsertEnquiry(record: LoanEnquiryRecord): Promise<LoanEnquiryRecord> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      devEnquiriesStore.unshift(record);
      saveDevStores();
      return record;
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const dbPayload = {
    id: record.id,
    enquiry_reference: record.enquiry_reference,
    customer_name: record.customer_name,
    mobile_number: record.mobile_number,
    normalized_phone: record.normalized_phone,
    email: record.email,
    city: record.city,
    finance_purpose: record.finance_purpose,
    approximate_amount: record.approximate_amount,
    project_details: record.project_details,
    preferred_contact_time: record.preferred_contact_time,
    enquiry_source: record.enquiry_source,
    status: record.status,
    assigned_staff: record.assigned_staff,
    assigned_staff_name: record.assigned_staff_name,
    next_followup_at: record.next_followup_at,
    last_contacted_at: record.last_contacted_at,
    internal_notes: record.internal_notes,
    consent_accepted: record.consent_accepted,
    linked_previous_enquiry_id:
      record.linked_previous_enquiry_id && /^[0-9a-f-]{36}$/i.test(record.linked_previous_enquiry_id)
        ? record.linked_previous_enquiry_id
        : null,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };

  const res = await fetch(`${cfg.url}/rest/v1/loan_enquiries`, {
    method: 'POST',
    headers: getServiceRoleHeaders(cfg.serviceRoleKey, {
      Prefer: 'return=representation',
    }),
    body: JSON.stringify(dbPayload),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    console.error(`[LoansCRM] Supabase loan_enquiries INSERT failed: code=${errInfo.code} status=${errInfo.status}`);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : record;
}

async function sbUpdateEnquiry(
  id: string,
  patchFields: Record<string, any>
): Promise<LoanEnquiryRecord> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      const idx = devEnquiriesStore.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Loan enquiry not found.');
      devEnquiriesStore[idx] = { ...devEnquiriesStore[idx], ...patchFields };
      saveDevStores();
      return devEnquiriesStore[idx];
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const res = await fetch(`${cfg.url}/rest/v1/loan_enquiries?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getServiceRoleHeaders(cfg.serviceRoleKey, {
      Prefer: 'return=representation',
    }),
    body: JSON.stringify(patchFields),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    console.error(`[LoansCRM] Supabase loan_enquiries PATCH failed: code=${errInfo.code} status=${errInfo.status}`);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Loan enquiry record not found for update.');
  }
  return rows[0];
}

async function sbInsertCallLog(log: LoanCallLogRecord): Promise<LoanCallLogRecord> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      devCallLogsStore.unshift(log);
      saveDevStores();
      return log;
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const res = await fetch(`${cfg.url}/rest/v1/loan_call_logs`, {
    method: 'POST',
    headers: getServiceRoleHeaders(cfg.serviceRoleKey, {
      Prefer: 'return=representation',
    }),
    body: JSON.stringify(log),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    console.error(`[LoansCRM] Supabase loan_call_logs INSERT failed: code=${errInfo.code} status=${errInfo.status}`);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : log;
}

async function sbFetchCallLogsForEnquiry(enquiryId: string): Promise<LoanCallLogRecord[]> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      return devCallLogsStore
        .filter((c) => c.loan_enquiry_id === enquiryId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const res = await fetch(
    `${cfg.url}/rest/v1/loan_call_logs?loan_enquiry_id=eq.${encodeURIComponent(enquiryId)}&select=*&order=created_at.desc`,
    {
      headers: getServiceRoleHeaders(cfg.serviceRoleKey),
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    console.error(`[LoansCRM] Supabase loan_call_logs SELECT failed: code=${errInfo.code}`);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

async function sbInsertActivity(activity: LoanActivityRecord): Promise<LoanActivityRecord> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      devActivitiesStore.unshift(activity);
      saveDevStores();
      return activity;
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const res = await fetch(`${cfg.url}/rest/v1/loan_activities`, {
    method: 'POST',
    headers: getServiceRoleHeaders(cfg.serviceRoleKey, {
      Prefer: 'return=representation',
    }),
    body: JSON.stringify(activity),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    console.error(`[LoansCRM] Supabase loan_activities INSERT failed: code=${errInfo.code} status=${errInfo.status}`);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : activity;
}

async function sbFetchActivitiesForEnquiry(enquiryId: string): Promise<LoanActivityRecord[]> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      return devActivitiesStore
        .filter((a) => a.loan_enquiry_id === enquiryId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const res = await fetch(
    `${cfg.url}/rest/v1/loan_activities?loan_enquiry_id=eq.${encodeURIComponent(enquiryId)}&select=*&order=created_at.desc`,
    {
      headers: getServiceRoleHeaders(cfg.serviceRoleKey),
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    console.error(`[LoansCRM] Supabase loan_activities SELECT failed: code=${errInfo.code}`);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

async function sbFetchRecentActivities(limit = 12): Promise<LoanActivityRecord[]> {
  const cfg = getLoanServiceSupabaseConfig();
  if (!cfg.isConfigured || !cfg.serviceRoleKey) {
    if (isLocalDevFallbackAllowed()) {
      return devActivitiesStore.slice(0, limit);
    }
    throw new Error(cfg.configError || 'SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const res = await fetch(
    `${cfg.url}/rest/v1/loan_activities?select=*&order=created_at.desc&limit=${limit}`,
    {
      headers: getServiceRoleHeaders(cfg.serviceRoleKey),
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) {
    const errInfo = await parseSupabaseError(res);
    throw new Error(`Database error (${errInfo.code}): ${errInfo.message}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

// =============================================================================
// HELPERS: VALIDATION, SANITISATION & REFERENCE GENERATION
// =============================================================================

function sanitizeText(val: unknown, maxLength = 500): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>?/gm, '') // strip HTML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function isValidPhone(rawPhone: string): boolean {
  const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '');
  if (/^(\+91|91|0)?[6-9]\d{9}$/.test(cleaned)) return true;
  if (/^\+?[1-9]\d{9,14}$/.test(cleaned)) return true;
  return false;
}

function isValidEmail(rawEmail: string): boolean {
  if (!rawEmail) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawEmail.trim());
}

async function generateEnquiryReference(): Promise<string> {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `REL-${yyyy}${mm}${dd}-`;
  const existingTodayCount = await sbCountTodayEnquiries(prefix);
  const seq = String(existingTodayCount + 1).padStart(4, '0');
  const rand = Math.floor(10 + Math.random() * 89);
  const candidate = `${prefix}${seq}`;
  const existing = await sbFindEnquiryByIdOrRef(candidate).catch(() => null);
  if (existing) {
    return `${candidate}${rand}`;
  }
  return candidate;
}

// In-memory rate limiter for public form submissions
const ipSubmissionBuckets = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 15;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipSubmissionBuckets.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    ipSubmissionBuckets.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  ipSubmissionBuckets.set(ip, timestamps);
  return true;
}

function getIstDateString(isoStr?: string | null): string {
  const d = isoStr ? new Date(isoStr) : new Date();
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

// =============================================================================
// STAFF AUTH MIDDLEWARE FOR CRM ROUTES
// =============================================================================

function requireLoanStaffAuth(req: Request, res: Response, next: NextFunction) {
  const user = extractUserFromReq(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to the Telecaller CRM.',
    });
  }
  (req as any).crmUser = user;
  next();
}

// =============================================================================
// PUBLIC WEBSITE ENDPOINT: POST /api/loans/enquiry
// Strictly limited to validating input and creating a new loan enquiry.
// Never falls back silently to local JSON in production or when Supabase fails.
// =============================================================================

publicLoansRouter.post('/enquiry', async (req: Request, res: Response) => {
  try {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a few minutes before submitting another enquiry.',
      });
    }

    const body = req.body || {};

    // Reject any attempt to send sensitive financial identity fields
    const forbiddenKeys = [
      'aadhaar',
      'pan',
      'pan_number',
      'aadhaar_number',
      'bank_account',
      'otp',
      'credit_card',
      'salary_slip',
    ];
    for (const key of Object.keys(body)) {
      if (forbiddenKeys.includes(key.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Sensitive financial or identity numbers are not accepted via the online enquiry form.',
        });
      }
    }

    const customerName = sanitizeText(body.customer_name || body.full_name || body.name, 120);
    const mobileNumber = sanitizeText(body.mobile_number || body.phone || body.mobile, 24);
    const emailRaw = sanitizeText(body.email, 160);
    const city = sanitizeText(body.city || body.location, 120) || null;
    const financePurpose = sanitizeText(body.finance_purpose || body.purpose, 100);
    const approximateAmount = sanitizeText(body.approximate_amount || body.amount_range, 80) || null;
    const projectDetails = sanitizeText(body.project_details || body.details || body.message, 1500) || null;
    const preferredContactTime = sanitizeText(body.preferred_contact_time || 'Anytime', 40) || 'Anytime';
    const rawSource = sanitizeText(body.enquiry_source || body.source, 80);
    const consentAccepted = body.consent === true || body.consent_accepted === true || body.consent === 'true';

    // Validate Required Fields
    if (!customerName || customerName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your full name (at least 2 characters).',
      });
    }

    if (!mobileNumber || !isValidPhone(mobileNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number.',
      });
    }

    if (emailRaw && !isValidEmail(emailRaw)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      });
    }

    if (!financePurpose || !(LOAN_FINANCE_PURPOSES as readonly string[]).includes(financePurpose)) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid Finance Purpose.',
      });
    }

    if (!consentAccepted) {
      return res.status(400).json({
        success: false,
        error: 'Please accept the consent checkbox to proceed with your finance enquiry.',
      });
    }

    // Verify server-side Supabase service-role configuration before claiming persistence
    const sbConfig = getLoanServiceSupabaseConfig();
    if (!sbConfig.isConfigured && !isLocalDevFallbackAllowed()) {
      console.error(`[LoansCRM] Cannot persist public loan enquiry: ${sbConfig.configError}`);
      return res.status(503).json({
        success: false,
        error:
          'Our finance enquiry database is currently undergoing maintenance. Please call +91 70261 19311 or try again shortly.',
      });
    }

    const normalizedPhone = normalizePhone(mobileNumber);
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // Look up prior enquiries for this phone number in Supabase
    const priorForPhone = await sbFindEnquiriesByPhone(normalizedPhone);

    // Accidental rapid double-click guard (same phone + same purpose + same details within 45 seconds)
    const rapidDuplicate = priorForPhone.find(
      (e) =>
        e.finance_purpose === financePurpose &&
        (e.project_details || '') === (projectDetails || '') &&
        nowMs - new Date(e.created_at).getTime() < 45 * 1000
    );

    if (rapidDuplicate) {
      return res.status(200).json({
        success: true,
        deduplicated: true,
        enquiry_reference: rapidDuplicate.enquiry_reference,
        message:
          'Thank you for contacting Royal Epic Loans. Your enquiry has been received. Our team will review your requirements and get in touch with you.',
      });
    }

    const previousEnquiry = priorForPhone.length > 0 ? priorForPhone[0] : null;
    const enquirySource = (LOAN_ENQUIRY_SOURCES as readonly string[]).includes(rawSource)
      ? rawSource
      : 'Website Loans Page';

    const enquiryId = crypto.randomUUID();
    const enquiryReference = await generateEnquiryReference();

    const internalNoteInit = previousEnquiry
      ? `Repeat customer enquiry linked to earlier reference ${previousEnquiry.enquiry_reference} (${previousEnquiry.finance_purpose}, status: ${previousEnquiry.status}).`
      : null;

    const newEnquiry: LoanEnquiryRecord = {
      id: enquiryId,
      enquiry_reference: enquiryReference,
      customer_name: customerName,
      mobile_number: mobileNumber,
      normalized_phone: normalizedPhone,
      email: emailRaw || null,
      city,
      finance_purpose: financePurpose,
      approximate_amount: approximateAmount,
      project_details: projectDetails,
      preferred_contact_time: preferredContactTime,
      enquiry_source: enquirySource,
      status: 'New',
      assigned_staff: previousEnquiry?.assigned_staff || null,
      assigned_staff_name: previousEnquiry?.assigned_staff_name || null,
      next_followup_at: null,
      last_contacted_at: null,
      internal_notes: internalNoteInit,
      consent_accepted: true,
      linked_previous_enquiry_id: previousEnquiry ? previousEnquiry.id : null,
      linked_previous_reference: previousEnquiry ? previousEnquiry.enquiry_reference : null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Persist directly to Supabase PostgreSQL (throws if Supabase fails)
    await sbInsertEnquiry(newEnquiry);

    const creationActivity: LoanActivityRecord = {
      id: crypto.randomUUID(),
      loan_enquiry_id: enquiryId,
      staff_id: null,
      staff_name: 'Website Visitor',
      action_type: 'ENQUIRY_CREATED',
      description: previousEnquiry
        ? `Finance enquiry ${enquiryReference} submitted via ${enquirySource} for ${financePurpose}. Linked to prior enquiry ${previousEnquiry.enquiry_reference}.`
        : `Finance enquiry ${enquiryReference} submitted via ${enquirySource} for ${financePurpose}.`,
      created_at: nowIso,
    };

    await sbInsertActivity(creationActivity);

    if (previousEnquiry) {
      const linkActivityOnPrevious: LoanActivityRecord = {
        id: crypto.randomUUID(),
        loan_enquiry_id: previousEnquiry.id,
        staff_id: null,
        staff_name: 'System',
        action_type: 'REPEAT_ENQUIRY_LINKED',
        description: `Customer submitted a new finance enquiry ${enquiryReference} (${financePurpose}).`,
        created_at: nowIso,
      };
      await sbInsertActivity(linkActivityOnPrevious);
    }

    // Dispatch email notification asynchronously (decoupled from DB persistence so SMTP issues never lose records)
    sendLeadNotificationEmail({
      id: enquiryReference,
      full_name: customerName,
      phone: mobileNumber,
      email: emailRaw || undefined,
      city: city || 'Bengaluru',
      service_type: `Royal Epic Loans – ${financePurpose}`,
      estimated_budget: approximateAmount || 'Not Specified',
      project_scope: `${projectDetails ? `${projectDetails} | ` : ''}Preferred Contact Time: ${preferredContactTime}`,
      source: `Royal Epic Loans (${enquirySource})`,
      created_at: nowIso,
    }).catch((err) => {
      console.warn('[LoansCRM] Email notification dispatch note:', err?.message || 'SMTP skipped');
    });

    return res.status(201).json({
      success: true,
      enquiry_reference: enquiryReference,
      message:
        'Thank you for contacting Royal Epic Loans. Your enquiry has been received. Our team will review your requirements and get in touch with you.',
    });
  } catch (err: any) {
    console.error('[PublicLoansRouter] Database failure while saving finance enquiry:', err?.message || 'Unknown error');
    return res.status(503).json({
      success: false,
      error:
        'We encountered a temporary issue saving your enquiry. Your details have been preserved — please try again shortly or call +91 70261 19311.',
    });
  }
});

// =============================================================================
// PROTECTED TELECALLER CRM LOANS ENDPOINTS (/api/crm/loans/*)
// Requires valid Telecaller CRM staff session.
// =============================================================================

loanCrmRouter.use(requireLoanStaffAuth);

// 0. GET /api/crm/loans/db-status (Safe server-side diagnostic for staff; never exposes keys)
loanCrmRouter.get('/db-status', async (_req: Request, res: Response) => {
  const cfg = getLoanServiceSupabaseConfig();
  const tableStates: Record<string, { accessible: boolean; error: string | null }> = {
    loan_enquiries: { accessible: false, error: null },
    loan_call_logs: { accessible: false, error: null },
    loan_activities: { accessible: false, error: null },
  };

  if (cfg.isConfigured && cfg.serviceRoleKey) {
    for (const tableName of ['loan_enquiries', 'loan_call_logs', 'loan_activities'] as const) {
      try {
        const checkRes = await fetch(`${cfg.url}/rest/v1/${tableName}?select=id&limit=1`, {
          headers: getServiceRoleHeaders(cfg.serviceRoleKey),
          signal: AbortSignal.timeout(5000),
        });
        if (checkRes.ok) {
          tableStates[tableName] = { accessible: true, error: null };
        } else {
          const errInfo = await parseSupabaseError(checkRes);
          tableStates[tableName] = {
            accessible: false,
            error: `${errInfo.code}: ${errInfo.message}`,
          };
        }
      } catch (e: any) {
        tableStates[tableName] = {
          accessible: false,
          error: e?.message || 'Connection error',
        };
      }
    }
  }

  const allTablesAccessible =
    tableStates.loan_enquiries.accessible &&
    tableStates.loan_call_logs.accessible &&
    tableStates.loan_activities.accessible;

  return res.json({
    success: true,
    supabase_project_url: cfg.url,
    service_role_key_configured: cfg.isConfigured,
    service_role_jwt_verified: cfg.isConfigured,
    config_error: cfg.configError,
    tables_accessible: allTablesAccessible,
    tables: tableStates,
    table_check_error:
      tableStates.loan_enquiries.error ||
      tableStates.loan_call_logs.error ||
      tableStates.loan_activities.error ||
      null,
    local_dev_fallback_active: isLocalDevFallbackAllowed(),
    local_json_pending_migration_counts: {
      loan_enquiries: readJsonArray(LOAN_ENQUIRIES_FILE).length,
      loan_call_logs: readJsonArray(LOAN_CALL_LOGS_FILE).length,
      loan_activities: readJsonArray(LOAN_ACTIVITIES_FILE).length,
    },
  });
});

// 1. GET /api/crm/loans/staff
loanCrmRouter.get('/staff', (_req: Request, res: Response) => {
  const staff = getActiveCrmStaffList();
  return res.json({ success: true, staff });
});

// 2. GET /api/crm/loans/dashboard
loanCrmRouter.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [allEnquiries, recentActivities] = await Promise.all([
      sbFetchAllEnquiries(),
      sbFetchRecentActivities(12),
    ]);

    const todayIst = getIstDateString();
    const totalEnquiries = allEnquiries.length;

    let newEnquiries = 0;
    let pendingContact = 0;
    let followupsDue = 0;
    let overdueFollowups = 0;
    let contacted = 0;
    let underReview = 0;
    let converted = 0;
    let closed = 0;

    const byPurpose: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const purpose of LOAN_FINANCE_PURPOSES) byPurpose[purpose] = 0;
    for (const status of LOAN_ENQUIRY_STATUSES) byStatus[status] = 0;

    for (const enq of allEnquiries) {
      byPurpose[enq.finance_purpose] = (byPurpose[enq.finance_purpose] || 0) + 1;
      bySource[enq.enquiry_source] = (bySource[enq.enquiry_source] || 0) + 1;
      byStatus[enq.status] = (byStatus[enq.status] || 0) + 1;

      if (enq.status === 'New') newEnquiries++;
      if (enq.status === 'New' || enq.status === 'Contact Pending') pendingContact++;
      if (enq.status === 'Contacted') contacted++;
      if (enq.status === 'Requirement Under Review' || enq.status === 'Further Discussion') underReview++;
      if (enq.status === 'Converted') converted++;
      if (enq.status === 'Closed' || enq.status === 'Not Proceeding') closed++;

      const isActive =
        enq.status !== 'Closed' && enq.status !== 'Not Proceeding' && enq.status !== 'Converted';
      if (isActive && enq.next_followup_at) {
        const followupDateIst = getIstDateString(enq.next_followup_at);
        if (followupDateIst && followupDateIst <= todayIst) {
          followupsDue++;
          if (followupDateIst < todayIst) {
            overdueFollowups++;
          }
        }
      }
    }

    return res.json({
      success: true,
      metrics: {
        total_enquiries: totalEnquiries,
        new_enquiries: newEnquiries,
        pending_contact: pendingContact,
        followups_due: followupsDue,
        overdue_followups: overdueFollowups,
        contacted,
        under_review: underReview,
        converted,
        closed,
      },
      breakdowns: {
        by_purpose: byPurpose,
        by_source: bySource,
        by_status: byStatus,
      },
      recent_enquiries: allEnquiries.slice(0, 8),
      recent_activities: recentActivities,
    });
  } catch (err: any) {
    console.error('[LoansCRM] Dashboard error:', err?.message || 'Database error');
    return res.status(503).json({
      success: false,
      error: err?.message || 'Unable to load Loans Dashboard from Supabase.',
    });
  }
});

// 3. GET /api/crm/loans/enquiries
loanCrmRouter.get('/enquiries', async (req: Request, res: Response) => {
  try {
    const allEnquiries = await sbFetchAllEnquiries();

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const purpose = typeof req.query.finance_purpose === 'string' ? req.query.finance_purpose.trim() : '';
    const assignedStaff = typeof req.query.assigned_staff === 'string' ? req.query.assigned_staff.trim() : '';
    const source = typeof req.query.enquiry_source === 'string' ? req.query.enquiry_source.trim() : '';
    const dateFrom = typeof req.query.date_from === 'string' ? req.query.date_from.trim() : '';
    const dateTo = typeof req.query.date_to === 'string' ? req.query.date_to.trim() : '';

    let filtered = [...allEnquiries];

    if (status && status !== 'All') {
      filtered = filtered.filter((e) => e.status === status);
    }
    if (purpose && purpose !== 'All') {
      filtered = filtered.filter((e) => e.finance_purpose === purpose);
    }
    if (assignedStaff && assignedStaff !== 'All') {
      if (assignedStaff === 'unassigned') {
        filtered = filtered.filter((e) => !e.assigned_staff);
      } else {
        filtered = filtered.filter((e) => e.assigned_staff === assignedStaff);
      }
    }
    if (source && source !== 'All') {
      filtered = filtered.filter((e) => e.enquiry_source === source);
    }
    if (dateFrom) {
      filtered = filtered.filter((e) => getIstDateString(e.created_at) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((e) => getIstDateString(e.created_at) <= dateTo);
    }
    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.customer_name.toLowerCase().includes(search) ||
          e.mobile_number.toLowerCase().includes(search) ||
          e.normalized_phone.toLowerCase().includes(search) ||
          e.enquiry_reference.toLowerCase().includes(search) ||
          (e.city && e.city.toLowerCase().includes(search)) ||
          (e.email && e.email.toLowerCase().includes(search)) ||
          e.finance_purpose.toLowerCase().includes(search)
      );
    }

    return res.json({
      success: true,
      count: filtered.length,
      enquiries: filtered,
    });
  } catch (err: any) {
    console.error('[LoansCRM] Enquiries list error:', err?.message || 'Database error');
    return res.status(503).json({
      success: false,
      error: err?.message || 'Unable to fetch loan enquiries from Supabase.',
    });
  }
});

// 4. POST /api/crm/loans/enquiries (Manual CRM Entry)
loanCrmRouter.post('/enquiries', async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const body = req.body || {};

    const customerName = sanitizeText(body.customer_name, 120);
    const mobileNumber = sanitizeText(body.mobile_number, 24);
    const emailRaw = sanitizeText(body.email, 160);
    const city = sanitizeText(body.city, 120) || null;
    const financePurpose = sanitizeText(body.finance_purpose, 100);
    const approximateAmount = sanitizeText(body.approximate_amount, 80) || null;
    const projectDetails = sanitizeText(body.project_details, 1500) || null;
    const preferredContactTime = sanitizeText(body.preferred_contact_time || 'Anytime', 40) || 'Anytime';
    const enquirySource = sanitizeText(body.enquiry_source || 'CRM Manual Entry', 80) || 'CRM Manual Entry';
    const statusRaw = sanitizeText(body.status || 'New', 60);
    const assignedStaffId = sanitizeText(body.assigned_staff, 80) || crmUser?.id || null;
    const nextFollowupAt = body.next_followup_at ? new Date(body.next_followup_at).toISOString() : null;
    const internalNotes = sanitizeText(body.internal_notes, 2000) || null;

    if (!customerName || customerName.length < 2) {
      return res.status(400).json({ success: false, error: 'Customer name is required.' });
    }
    if (!mobileNumber || !isValidPhone(mobileNumber)) {
      return res.status(400).json({ success: false, error: 'Valid 10-digit mobile number is required.' });
    }
    if (emailRaw && !isValidEmail(emailRaw)) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }
    if (!financePurpose || !(LOAN_FINANCE_PURPOSES as readonly string[]).includes(financePurpose)) {
      return res.status(400).json({ success: false, error: 'Valid Finance Purpose is required.' });
    }

    const status: LoanEnquiryStatus = (LOAN_ENQUIRY_STATUSES as readonly string[]).includes(statusRaw)
      ? (statusRaw as LoanEnquiryStatus)
      : 'New';

    const staffList = getActiveCrmStaffList();
    const matchedStaff = staffList.find((s) => s.id === assignedStaffId);
    const assignedStaffName = matchedStaff ? matchedStaff.name : crmUser?.name || null;

    const normalizedPhone = normalizePhone(mobileNumber);
    const priorForPhone = await sbFindEnquiriesByPhone(normalizedPhone);
    const previousEnquiry = priorForPhone.length > 0 ? priorForPhone[0] : null;

    const nowIso = new Date().toISOString();
    const enquiryId = crypto.randomUUID();
    const enquiryReference = await generateEnquiryReference();

    const newEnquiry: LoanEnquiryRecord = {
      id: enquiryId,
      enquiry_reference: enquiryReference,
      customer_name: customerName,
      mobile_number: mobileNumber,
      normalized_phone: normalizedPhone,
      email: emailRaw || null,
      city,
      finance_purpose: financePurpose,
      approximate_amount: approximateAmount,
      project_details: projectDetails,
      preferred_contact_time: preferredContactTime,
      enquiry_source: enquirySource,
      status,
      assigned_staff: assignedStaffId,
      assigned_staff_name: assignedStaffName,
      next_followup_at: nextFollowupAt,
      last_contacted_at: null,
      internal_notes: internalNotes,
      consent_accepted: true,
      linked_previous_enquiry_id: previousEnquiry ? previousEnquiry.id : null,
      linked_previous_reference: previousEnquiry ? previousEnquiry.enquiry_reference : null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const inserted = await sbInsertEnquiry(newEnquiry);

    const activity: LoanActivityRecord = {
      id: crypto.randomUUID(),
      loan_enquiry_id: enquiryId,
      staff_id: crmUser?.id || null,
      staff_name: crmUser?.name || 'CRM Staff',
      action_type: 'ENQUIRY_CREATED_MANUAL',
      description: `Loan enquiry ${enquiryReference} created manually by ${crmUser?.name || 'Staff'} (${financePurpose}).`,
      created_at: nowIso,
    };

    await sbInsertActivity(activity);

    return res.status(201).json({
      success: true,
      enquiry: inserted,
    });
  } catch (err: any) {
    console.error('[LoansCRM] Manual enquiry creation error:', err?.message || 'Database error');
    return res.status(503).json({
      success: false,
      error: err?.message || 'Failed to create loan enquiry in Supabase.',
    });
  }
});

// 5. GET /api/crm/loans/enquiries/:id
loanCrmRouter.get('/enquiries/:id', async (req: Request, res: Response) => {
  try {
    const idOrRef = req.params.id;
    const enquiry = await sbFindEnquiryByIdOrRef(idOrRef);

    if (!enquiry) {
      return res.status(404).json({ success: false, error: 'Loan enquiry not found.' });
    }

    const [callLogs, activities, samePhoneEnquiries] = await Promise.all([
      sbFetchCallLogsForEnquiry(enquiry.id),
      sbFetchActivitiesForEnquiry(enquiry.id),
      sbFindEnquiriesByPhone(enquiry.normalized_phone),
    ]);

    const relatedEnquiries = samePhoneEnquiries
      .filter((e) => e.id !== enquiry.id)
      .map((e) => ({
        id: e.id,
        enquiry_reference: e.enquiry_reference,
        finance_purpose: e.finance_purpose,
        status: e.status,
        created_at: e.created_at,
      }));

    return res.json({
      success: true,
      enquiry,
      call_logs: callLogs,
      activities,
      related_enquiries: relatedEnquiries,
    });
  } catch (err: any) {
    console.error('[LoansCRM] Enquiry detail error:', err?.message || 'Database error');
    return res.status(503).json({
      success: false,
      error: err?.message || 'Unable to load loan enquiry detail from Supabase.',
    });
  }
});

// 6. PATCH /api/crm/loans/enquiries/:id
loanCrmRouter.patch('/enquiries/:id', async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const idOrRef = req.params.id;
    const enquiry = await sbFindEnquiryByIdOrRef(idOrRef);

    if (!enquiry) {
      return res.status(404).json({ success: false, error: 'Loan enquiry not found.' });
    }

    const body = req.body || {};
    const nowIso = new Date().toISOString();
    const changes: string[] = [];
    const patchPayload: Record<string, any> = {};

    if (body.status !== undefined) {
      const nextStatus = sanitizeText(body.status, 60);
      if (!(LOAN_ENQUIRY_STATUSES as readonly string[]).includes(nextStatus)) {
        return res.status(400).json({ success: false, error: 'Invalid loan enquiry status.' });
      }
      if (enquiry.status !== nextStatus) {
        changes.push(`Status changed from "${enquiry.status}" to "${nextStatus}"`);
        patchPayload.status = nextStatus;
      }
    }

    if (body.assigned_staff !== undefined) {
      const nextStaffId = body.assigned_staff ? sanitizeText(body.assigned_staff, 80) : null;
      if (enquiry.assigned_staff !== nextStaffId) {
        const staffList = getActiveCrmStaffList();
        const matched = staffList.find((s) => s.id === nextStaffId);
        const nextStaffName = matched
          ? matched.name
          : nextStaffId
            ? sanitizeText(body.assigned_staff_name, 80) || nextStaffId
            : null;
        changes.push(`Assigned staff updated to "${nextStaffName || 'Unassigned'}"`);
        patchPayload.assigned_staff = nextStaffId;
        patchPayload.assigned_staff_name = nextStaffName;
      }
    }

    if (body.next_followup_at !== undefined) {
      const nextFollowup = body.next_followup_at ? new Date(body.next_followup_at).toISOString() : null;
      if (enquiry.next_followup_at !== nextFollowup) {
        changes.push(
          nextFollowup
            ? `Follow-up scheduled for ${new Date(nextFollowup).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
            : 'Follow-up date cleared'
        );
        patchPayload.next_followup_at = nextFollowup;
      }
    }

    if (body.internal_notes !== undefined) {
      const nextNotes = sanitizeText(body.internal_notes, 3000) || null;
      if (enquiry.internal_notes !== nextNotes) {
        changes.push('Internal notes updated');
        patchPayload.internal_notes = nextNotes;
      }
    }

    if (body.finance_purpose !== undefined) {
      const nextPurpose = sanitizeText(body.finance_purpose, 100);
      if (
        (LOAN_FINANCE_PURPOSES as readonly string[]).includes(nextPurpose) &&
        enquiry.finance_purpose !== nextPurpose
      ) {
        changes.push(`Finance purpose updated to "${nextPurpose}"`);
        patchPayload.finance_purpose = nextPurpose;
      }
    }

    if (body.approximate_amount !== undefined) {
      const nextAmt = sanitizeText(body.approximate_amount, 80) || null;
      if (enquiry.approximate_amount !== nextAmt) {
        changes.push(`Approximate requirement updated to "${nextAmt || 'Not Specified'}"`);
        patchPayload.approximate_amount = nextAmt;
      }
    }

    if (body.city !== undefined) {
      const nextCity = sanitizeText(body.city, 120) || null;
      if (enquiry.city !== nextCity) {
        patchPayload.city = nextCity;
        changes.push(`City / location updated to "${nextCity || 'N/A'}"`);
      }
    }

    if (body.project_details !== undefined) {
      const nextDetails = sanitizeText(body.project_details, 1500) || null;
      if (enquiry.project_details !== nextDetails) {
        patchPayload.project_details = nextDetails;
        changes.push('Project details updated');
      }
    }

    if (body.preferred_contact_time !== undefined) {
      const nextTime = sanitizeText(body.preferred_contact_time, 40) || 'Anytime';
      if (enquiry.preferred_contact_time !== nextTime) {
        patchPayload.preferred_contact_time = nextTime;
        changes.push(`Preferred contact time updated to "${nextTime}"`);
      }
    }

    let updatedEnquiry = enquiry;
    if (changes.length > 0) {
      patchPayload.updated_at = nowIso;
      updatedEnquiry = await sbUpdateEnquiry(enquiry.id, patchPayload);

      const activity: LoanActivityRecord = {
        id: crypto.randomUUID(),
        loan_enquiry_id: enquiry.id,
        staff_id: crmUser?.id || null,
        staff_name: crmUser?.name || 'CRM Staff',
        action_type: 'ENQUIRY_UPDATED',
        description: changes.join(' • '),
        created_at: nowIso,
      };
      await sbInsertActivity(activity);
    }

    return res.json({
      success: true,
      enquiry: updatedEnquiry,
    });
  } catch (err: any) {
    console.error('[LoansCRM] Update enquiry error:', err?.message || 'Database error');
    return res.status(503).json({
      success: false,
      error: err?.message || 'Failed to update loan enquiry in Supabase.',
    });
  }
});

// 7. POST /api/crm/loans/enquiries/:id/call-log
loanCrmRouter.post('/enquiries/:id/call-log', async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const idOrRef = req.params.id;
    const enquiry = await sbFindEnquiryByIdOrRef(idOrRef);

    if (!enquiry) {
      return res.status(404).json({ success: false, error: 'Loan enquiry not found.' });
    }

    const body = req.body || {};
    const callStatusRaw = sanitizeText(body.call_status || body.outcome, 60);
    const callNotes = sanitizeText(body.call_notes || body.notes, 2000) || null;
    const nextFollowupAt = body.next_followup_at ? new Date(body.next_followup_at).toISOString() : null;
    const nextStatusRaw = body.status ? sanitizeText(body.status, 60) : null;

    if (!callStatusRaw || !(LOAN_CALL_OUTCOMES as readonly string[]).includes(callStatusRaw)) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid call outcome.',
      });
    }

    const nowIso = new Date().toISOString();
    const callLog: LoanCallLogRecord = {
      id: crypto.randomUUID(),
      loan_enquiry_id: enquiry.id,
      staff_id: crmUser?.id || 'staff',
      staff_name: crmUser?.name || 'CRM Staff',
      call_status: callStatusRaw as LoanCallOutcome,
      call_notes: callNotes,
      next_followup_at: nextFollowupAt,
      created_at: nowIso,
    };

    await sbInsertCallLog(callLog);

    const patchFields: Record<string, any> = {
      last_contacted_at: nowIso,
      updated_at: nowIso,
    };

    if (nextFollowupAt !== null) {
      patchFields.next_followup_at = nextFollowupAt;
    }

    if (nextStatusRaw && (LOAN_ENQUIRY_STATUSES as readonly string[]).includes(nextStatusRaw)) {
      patchFields.status = nextStatusRaw;
    } else if (enquiry.status === 'New' || enquiry.status === 'Contact Pending') {
      if (callStatusRaw === 'No Answer') {
        patchFields.status = 'Contact Pending';
      } else if (callStatusRaw === 'Not Interested') {
        patchFields.status = 'Not Proceeding';
      } else {
        patchFields.status = 'Contacted';
      }
    }

    if (!enquiry.assigned_staff && crmUser?.id) {
      patchFields.assigned_staff = crmUser.id;
      patchFields.assigned_staff_name = crmUser.name;
    }

    const updatedEnquiry = await sbUpdateEnquiry(enquiry.id, patchFields);

    const activity: LoanActivityRecord = {
      id: crypto.randomUUID(),
      loan_enquiry_id: enquiry.id,
      staff_id: crmUser?.id || null,
      staff_name: crmUser?.name || 'CRM Staff',
      action_type: 'CALL_LOGGED',
      description: `Call logged (${callStatusRaw})${callNotes ? `: "${callNotes}"` : ''}${
        nextFollowupAt
          ? ` • Follow-up scheduled for ${new Date(nextFollowupAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
          : ''
      }`,
      created_at: nowIso,
    };

    await sbInsertActivity(activity);

    return res.status(201).json({
      success: true,
      call_log: callLog,
      enquiry: updatedEnquiry,
    });
  } catch (err: any) {
    console.error('[LoansCRM] Call log error:', err?.message || 'Database error');
    return res.status(503).json({
      success: false,
      error: err?.message || 'Failed to record call log in Supabase.',
    });
  }
});

// 8. GET /api/crm/loans/followups
loanCrmRouter.get('/followups', async (req: Request, res: Response) => {
  try {
    const allEnquiries = await sbFetchAllEnquiries();
    const assignedStaff = typeof req.query.assigned_staff === 'string' ? req.query.assigned_staff.trim() : '';
    const todayIst = getIstDateString();

    const activeEnquiries = allEnquiries.filter((e) => {
      if (!e.next_followup_at) return false;
      if (e.status === 'Closed' || e.status === 'Not Proceeding') return false;
      if (assignedStaff && assignedStaff !== 'All' && e.assigned_staff !== assignedStaff) return false;
      return true;
    });

    const overdue: LoanEnquiryRecord[] = [];
    const today: LoanEnquiryRecord[] = [];
    const upcoming: LoanEnquiryRecord[] = [];

    for (const enq of activeEnquiries) {
      const fDateIst = getIstDateString(enq.next_followup_at);
      if (!fDateIst) continue;
      if (fDateIst < todayIst) {
        overdue.push(enq);
      } else if (fDateIst === todayIst) {
        today.push(enq);
      } else {
        upcoming.push(enq);
      }
    }

    const sortAsc = (a: LoanEnquiryRecord, b: LoanEnquiryRecord) =>
      new Date(a.next_followup_at || 0).getTime() - new Date(b.next_followup_at || 0).getTime();

    overdue.sort(sortAsc);
    today.sort(sortAsc);
    upcoming.sort(sortAsc);

    return res.json({
      success: true,
      overdue,
      today,
      upcoming,
      counts: {
        overdue: overdue.length,
        today: today.length,
        upcoming: upcoming.length,
        total_due: overdue.length + today.length,
      },
    });
  } catch (err: any) {
    console.error('[LoansCRM] Follow-ups error:', err?.message || 'Database error');
    return res.status(503).json({
      success: false,
      error: err?.message || 'Unable to load follow-ups from Supabase.',
    });
  }
});
