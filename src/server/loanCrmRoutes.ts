import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSupabaseConfig } from './productHtmlRenderer';
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
// PERSISTENT FILE STORAGE + SUPABASE HYBRID SYNC
// =============================================================================

const DB_DIR = path.join(process.cwd(), 'data');
const LOAN_ENQUIRIES_FILE = path.join(DB_DIR, 'loan_enquiries.json');
const LOAN_CALL_LOGS_FILE = path.join(DB_DIR, 'loan_call_logs.json');
const LOAN_ACTIVITIES_FILE = path.join(DB_DIR, 'loan_activities.json');

if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (_) {}
}

function readJsonArray<T>(filePath: string): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn(`[LoansCRM] Error reading ${path.basename(filePath)}:`, err);
  }
  return [];
}

function writeJsonArray<T>(filePath: string, data: T[]): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[LoansCRM] Error writing ${path.basename(filePath)}:`, err);
  }
}

let loanEnquiriesStore: LoanEnquiryRecord[] = readJsonArray<LoanEnquiryRecord>(LOAN_ENQUIRIES_FILE);
let loanCallLogsStore: LoanCallLogRecord[] = readJsonArray<LoanCallLogRecord>(LOAN_CALL_LOGS_FILE);
let loanActivitiesStore: LoanActivityRecord[] = readJsonArray<LoanActivityRecord>(LOAN_ACTIVITIES_FILE);

function saveLoanStores(): void {
  writeJsonArray(LOAN_ENQUIRIES_FILE, loanEnquiriesStore);
  writeJsonArray(LOAN_CALL_LOGS_FILE, loanCallLogsStore);
  writeJsonArray(LOAN_ACTIVITIES_FILE, loanActivitiesStore);
}

// Supabase sync helpers (gracefully handles PGRST205 if migration is pending manual execution)
async function syncEnquiryToSupabase(record: LoanEnquiryRecord, isUpdate = false): Promise<boolean> {
  try {
    const { url, key } = getSupabaseConfig();
    const payload = {
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
      assigned_staff: record.assigned_staff && /^[0-9a-f-]{36}$/i.test(record.assigned_staff) ? record.assigned_staff : null,
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

    const endpoint = isUpdate
      ? `${url}/rest/v1/loan_enquiries?id=eq.${encodeURIComponent(record.id)}`
      : `${url}/rest/v1/loan_enquiries`;

    const res = await fetch(endpoint, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: isUpdate ? 'return=minimal' : 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (_) {
    return false;
  }
}

async function syncCallLogToSupabase(log: LoanCallLogRecord): Promise<boolean> {
  try {
    const { url, key } = getSupabaseConfig();
    const res = await fetch(`${url}/rest/v1/loan_call_logs`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(log),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

async function syncActivityToSupabase(activity: LoanActivityRecord): Promise<boolean> {
  try {
    const { url, key } = getSupabaseConfig();
    const res = await fetch(`${url}/rest/v1/loan_activities`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(activity),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

async function pullEnquiriesFromSupabaseIfAvailable(): Promise<void> {
  try {
    const { url, key } = getSupabaseConfig();
    const res = await fetch(`${url}/rest/v1/loan_enquiries?select=*&order=created_at.desc&limit=500`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const byId = new Map<string, LoanEnquiryRecord>();
        for (const existing of loanEnquiriesStore) {
          byId.set(existing.id, existing);
        }
        let changed = false;
        for (const r of rows) {
          if (!r || !r.id) continue;
          const local = byId.get(r.id);
          if (!local || new Date(r.updated_at || 0).getTime() > new Date(local.updated_at || 0).getTime()) {
            byId.set(r.id, {
              ...local,
              ...r,
              assigned_staff: local?.assigned_staff || r.assigned_staff || null,
            });
            changed = true;
          }
        }
        if (changed) {
          loanEnquiriesStore = Array.from(byId.values()).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          writeJsonArray(LOAN_ENQUIRIES_FILE, loanEnquiriesStore);
        }
      }
    }
  } catch (_) {}
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
  // Valid 10-digit Indian mobile (with or without +91 / 0) or international E.164 (10-15 digits)
  if (/^(\+91|91|0)?[6-9]\d{9}$/.test(cleaned)) return true;
  if (/^\+?[1-9]\d{9,14}$/.test(cleaned)) return true;
  return false;
}

function isValidEmail(rawEmail: string): boolean {
  if (!rawEmail) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawEmail.trim());
}

function generateEnquiryReference(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const existingTodayCount = loanEnquiriesStore.filter((e) =>
    e.enquiry_reference.startsWith(`REL-${yyyy}${mm}${dd}-`)
  ).length;
  const seq = String(existingTodayCount + 1).padStart(4, '0');
  const rand = Math.floor(10 + Math.random() * 89);
  const candidate = `REL-${yyyy}${mm}${dd}-${seq}`;
  if (loanEnquiriesStore.some((e) => e.enquiry_reference === candidate)) {
    return `${candidate}${rand}`;
  }
  return candidate;
}

// In-memory rate limiter for public form submissions (per IP: max 8 submissions per 10 minutes)
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

// Helper for IST date boundaries
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
    const forbiddenKeys = ['aadhaar', 'pan', 'pan_number', 'aadhaar_number', 'bank_account', 'otp', 'credit_card', 'salary_slip'];
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

    const normalizedPhone = normalizePhone(mobileNumber);
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // Accidental rapid double-click guard (same phone + same purpose + same details within 45 seconds)
    const rapidDuplicate = loanEnquiriesStore.find(
      (e) =>
        e.normalized_phone === normalizedPhone &&
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

    // Check if this customer has prior loan enquiries (preserve both records and link history)
    const previousEnquiry = loanEnquiriesStore.find((e) => e.normalized_phone === normalizedPhone);

    const enquirySource = (LOAN_ENQUIRY_SOURCES as readonly string[]).includes(rawSource)
      ? rawSource
      : 'Website Loans Page';

    const enquiryId = crypto.randomUUID();
    const enquiryReference = generateEnquiryReference();

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

    loanEnquiriesStore.unshift(newEnquiry);
    loanActivitiesStore.unshift(creationActivity);

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
      loanActivitiesStore.unshift(linkActivityOnPrevious);
      syncActivityToSupabase(linkActivityOnPrevious).catch(() => {});
    }

    saveLoanStores();

    // Sync to Supabase asynchronously
    syncEnquiryToSupabase(newEnquiry, false).catch(() => {});
    syncActivityToSupabase(creationActivity).catch(() => {});

    // Dispatch email notification to enquiry@royalepicinterior.com
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
      console.warn('[LoansCRM] Email notification dispatch note:', err?.message || err);
    });

    return res.status(201).json({
      success: true,
      enquiry_reference: enquiryReference,
      message:
        'Thank you for contacting Royal Epic Loans. Your enquiry has been received. Our team will review your requirements and get in touch with you.',
    });
  } catch (err: any) {
    console.error('[PublicLoansRouter] Error processing finance enquiry:', err?.message || err);
    return res.status(500).json({
      success: false,
      error: 'We encountered a temporary issue submitting your enquiry. Please try again or call +91 70261 19311.',
    });
  }
});

// =============================================================================
// PROTECTED TELECALLER CRM LOANS ENDPOINTS (/api/crm/loans/*)
// =============================================================================

loanCrmRouter.use(requireLoanStaffAuth);

// 1. GET /api/crm/loans/staff
loanCrmRouter.get('/staff', (_req: Request, res: Response) => {
  const staff = getActiveCrmStaffList();
  return res.json({ success: true, staff });
});

// 2. GET /api/crm/loans/dashboard
loanCrmRouter.get('/dashboard', async (_req: Request, res: Response) => {
  await pullEnquiriesFromSupabaseIfAvailable();

  const todayIst = getIstDateString();
  const totalEnquiries = loanEnquiriesStore.length;

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

  for (const enq of loanEnquiriesStore) {
    byPurpose[enq.finance_purpose] = (byPurpose[enq.finance_purpose] || 0) + 1;
    bySource[enq.enquiry_source] = (bySource[enq.enquiry_source] || 0) + 1;
    byStatus[enq.status] = (byStatus[enq.status] || 0) + 1;

    if (enq.status === 'New') newEnquiries++;
    if (enq.status === 'New' || enq.status === 'Contact Pending') pendingContact++;
    if (enq.status === 'Contacted') contacted++;
    if (enq.status === 'Requirement Under Review' || enq.status === 'Further Discussion') underReview++;
    if (enq.status === 'Converted') converted++;
    if (enq.status === 'Closed' || enq.status === 'Not Proceeding') closed++;

    const isActive = enq.status !== 'Closed' && enq.status !== 'Not Proceeding' && enq.status !== 'Converted';
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

  const recentEnquiries = loanEnquiriesStore.slice(0, 8);
  const recentActivities = loanActivitiesStore.slice(0, 12);

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
    recent_enquiries: recentEnquiries,
    recent_activities: recentActivities,
  });
});

// 3. GET /api/crm/loans/enquiries
loanCrmRouter.get('/enquiries', async (req: Request, res: Response) => {
  await pullEnquiriesFromSupabaseIfAvailable();

  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const purpose = typeof req.query.finance_purpose === 'string' ? req.query.finance_purpose.trim() : '';
  const assignedStaff = typeof req.query.assigned_staff === 'string' ? req.query.assigned_staff.trim() : '';
  const source = typeof req.query.enquiry_source === 'string' ? req.query.enquiry_source.trim() : '';
  const dateFrom = typeof req.query.date_from === 'string' ? req.query.date_from.trim() : '';
  const dateTo = typeof req.query.date_to === 'string' ? req.query.date_to.trim() : '';

  let filtered = [...loanEnquiriesStore];

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
    const previousEnquiry = loanEnquiriesStore.find((e) => e.normalized_phone === normalizedPhone);

    const nowIso = new Date().toISOString();
    const enquiryId = crypto.randomUUID();
    const enquiryReference = generateEnquiryReference();

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

    const activity: LoanActivityRecord = {
      id: crypto.randomUUID(),
      loan_enquiry_id: enquiryId,
      staff_id: crmUser?.id || null,
      staff_name: crmUser?.name || 'CRM Staff',
      action_type: 'ENQUIRY_CREATED_MANUAL',
      description: `Loan enquiry ${enquiryReference} created manually by ${crmUser?.name || 'Staff'} (${financePurpose}).`,
      created_at: nowIso,
    };

    loanEnquiriesStore.unshift(newEnquiry);
    loanActivitiesStore.unshift(activity);
    saveLoanStores();

    syncEnquiryToSupabase(newEnquiry, false).catch(() => {});
    syncActivityToSupabase(activity).catch(() => {});

    return res.status(201).json({
      success: true,
      enquiry: newEnquiry,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to create loan enquiry.',
    });
  }
});

// 5. GET /api/crm/loans/enquiries/:id
loanCrmRouter.get('/enquiries/:id', (req: Request, res: Response) => {
  const idOrRef = req.params.id;
  const enquiry = loanEnquiriesStore.find(
    (e) => e.id === idOrRef || e.enquiry_reference.toLowerCase() === idOrRef.toLowerCase()
  );

  if (!enquiry) {
    return res.status(404).json({ success: false, error: 'Loan enquiry not found.' });
  }

  const callLogs = loanCallLogsStore
    .filter((c) => c.loan_enquiry_id === enquiry.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const activities = loanActivitiesStore
    .filter((a) => a.loan_enquiry_id === enquiry.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Also check if there are related enquiries from the same phone number
  const relatedEnquiries = loanEnquiriesStore
    .filter((e) => e.normalized_phone === enquiry.normalized_phone && e.id !== enquiry.id)
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
});

// 6. PATCH /api/crm/loans/enquiries/:id
loanCrmRouter.patch('/enquiries/:id', async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const idOrRef = req.params.id;
    const enquiry = loanEnquiriesStore.find(
      (e) => e.id === idOrRef || e.enquiry_reference.toLowerCase() === idOrRef.toLowerCase()
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, error: 'Loan enquiry not found.' });
    }

    const body = req.body || {};
    const nowIso = new Date().toISOString();
    const changes: string[] = [];

    if (body.status !== undefined) {
      const nextStatus = sanitizeText(body.status, 60);
      if (!(LOAN_ENQUIRY_STATUSES as readonly string[]).includes(nextStatus)) {
        return res.status(400).json({ success: false, error: 'Invalid loan enquiry status.' });
      }
      if (enquiry.status !== nextStatus) {
        changes.push(`Status changed from "${enquiry.status}" to "${nextStatus}"`);
        enquiry.status = nextStatus as LoanEnquiryStatus;
      }
    }

    if (body.assigned_staff !== undefined) {
      const nextStaffId = body.assigned_staff ? sanitizeText(body.assigned_staff, 80) : null;
      if (enquiry.assigned_staff !== nextStaffId) {
        const staffList = getActiveCrmStaffList();
        const matched = staffList.find((s) => s.id === nextStaffId);
        const nextStaffName = matched ? matched.name : nextStaffId ? sanitizeText(body.assigned_staff_name, 80) || nextStaffId : null;
        changes.push(`Assigned staff updated to "${nextStaffName || 'Unassigned'}"`);
        enquiry.assigned_staff = nextStaffId;
        enquiry.assigned_staff_name = nextStaffName;
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
        enquiry.next_followup_at = nextFollowup;
      }
    }

    if (body.internal_notes !== undefined) {
      const nextNotes = sanitizeText(body.internal_notes, 3000) || null;
      if (enquiry.internal_notes !== nextNotes) {
        changes.push('Internal notes updated');
        enquiry.internal_notes = nextNotes;
      }
    }

    if (body.finance_purpose !== undefined) {
      const nextPurpose = sanitizeText(body.finance_purpose, 100);
      if ((LOAN_FINANCE_PURPOSES as readonly string[]).includes(nextPurpose) && enquiry.finance_purpose !== nextPurpose) {
        changes.push(`Finance purpose updated to "${nextPurpose}"`);
        enquiry.finance_purpose = nextPurpose;
      }
    }

    if (body.approximate_amount !== undefined) {
      const nextAmt = sanitizeText(body.approximate_amount, 80) || null;
      if (enquiry.approximate_amount !== nextAmt) {
        changes.push(`Approximate requirement updated to "${nextAmt || 'Not Specified'}"`);
        enquiry.approximate_amount = nextAmt;
      }
    }

    if (body.city !== undefined) {
      const nextCity = sanitizeText(body.city, 120) || null;
      if (enquiry.city !== nextCity) {
        enquiry.city = nextCity;
        changes.push(`City / location updated to "${nextCity || 'N/A'}"`);
      }
    }

    if (body.project_details !== undefined) {
      const nextDetails = sanitizeText(body.project_details, 1500) || null;
      if (enquiry.project_details !== nextDetails) {
        enquiry.project_details = nextDetails;
        changes.push('Project details updated');
      }
    }

    if (body.preferred_contact_time !== undefined) {
      const nextTime = sanitizeText(body.preferred_contact_time, 40) || 'Anytime';
      if (enquiry.preferred_contact_time !== nextTime) {
        enquiry.preferred_contact_time = nextTime;
        changes.push(`Preferred contact time updated to "${nextTime}"`);
      }
    }

    if (changes.length > 0) {
      enquiry.updated_at = nowIso;
      const activity: LoanActivityRecord = {
        id: crypto.randomUUID(),
        loan_enquiry_id: enquiry.id,
        staff_id: crmUser?.id || null,
        staff_name: crmUser?.name || 'CRM Staff',
        action_type: 'ENQUIRY_UPDATED',
        description: changes.join(' • '),
        created_at: nowIso,
      };
      loanActivitiesStore.unshift(activity);
      saveLoanStores();

      syncEnquiryToSupabase(enquiry, true).catch(() => {});
      syncActivityToSupabase(activity).catch(() => {});
    }

    return res.json({
      success: true,
      enquiry,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to update loan enquiry.',
    });
  }
});

// 7. POST /api/crm/loans/enquiries/:id/call-log
loanCrmRouter.post('/enquiries/:id/call-log', async (req: Request, res: Response) => {
  try {
    const crmUser = (req as any).crmUser;
    const idOrRef = req.params.id;
    const enquiry = loanEnquiriesStore.find(
      (e) => e.id === idOrRef || e.enquiry_reference.toLowerCase() === idOrRef.toLowerCase()
    );

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

    enquiry.last_contacted_at = nowIso;
    if (nextFollowupAt !== null) {
      enquiry.next_followup_at = nextFollowupAt;
    }

    // Auto-advance status or apply explicit status
    if (nextStatusRaw && (LOAN_ENQUIRY_STATUSES as readonly string[]).includes(nextStatusRaw)) {
      enquiry.status = nextStatusRaw as LoanEnquiryStatus;
    } else if (enquiry.status === 'New' || enquiry.status === 'Contact Pending') {
      if (callStatusRaw === 'No Answer') {
        enquiry.status = 'Contact Pending';
      } else if (callStatusRaw === 'Not Interested') {
        enquiry.status = 'Not Proceeding';
      } else {
        enquiry.status = 'Contacted';
      }
    }

    if (!enquiry.assigned_staff && crmUser?.id) {
      enquiry.assigned_staff = crmUser.id;
      enquiry.assigned_staff_name = crmUser.name;
    }

    enquiry.updated_at = nowIso;

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

    loanCallLogsStore.unshift(callLog);
    loanActivitiesStore.unshift(activity);
    saveLoanStores();

    syncCallLogToSupabase(callLog).catch(() => {});
    syncEnquiryToSupabase(enquiry, true).catch(() => {});
    syncActivityToSupabase(activity).catch(() => {});

    return res.status(201).json({
      success: true,
      call_log: callLog,
      enquiry,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to record call log.',
    });
  }
});

// 8. GET /api/crm/loans/followups
loanCrmRouter.get('/followups', async (req: Request, res: Response) => {
  await pullEnquiriesFromSupabaseIfAvailable();

  const assignedStaff = typeof req.query.assigned_staff === 'string' ? req.query.assigned_staff.trim() : '';
  const todayIst = getIstDateString();

  const activeEnquiries = loanEnquiriesStore.filter((e) => {
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
});
