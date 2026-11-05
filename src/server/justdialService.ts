import fs from 'fs';
import path from 'path';
import { 
  dbCrmLeads, 
  dbCrmCalls, 
  dbCrmAudit, 
  saveLeads, 
  saveCalls, 
  saveAudit, 
  normalizePhone, 
  ServerCrmLead, 
  ServerCrmCallLog 
} from './crmRoutes';
import { JustdialConfig, JustdialLog, JustdialStats } from '../crm/types';

const DB_DIR = path.join(process.cwd(), 'data');
const JUSTDIAL_CONFIG_FILE = path.join(DB_DIR, 'justdial_config.json');
const JUSTDIAL_LOGS_FILE = path.join(DB_DIR, 'justdial_logs.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (_) {}
}

const DEFAULT_CONFIG: JustdialConfig = {
  webhookSecret: 're_jd_live_sec_2026',
  isActive: true,
  status: 'PENDING_SETUP',
  lastTestedAt: undefined,
  lastReceivedAt: undefined
};

let cachedConfig: JustdialConfig = { ...DEFAULT_CONFIG };
let cachedLogs: JustdialLog[] = [];

// Initialize config from disk
try {
  if (fs.existsSync(JUSTDIAL_CONFIG_FILE)) {
    const raw = fs.readFileSync(JUSTDIAL_CONFIG_FILE, 'utf-8');
    cachedConfig = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } else {
    fs.writeFileSync(JUSTDIAL_CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
} catch (e) {
  console.warn('[JustdialService] Error loading config:', e);
}

// Initialize logs from disk
try {
  if (fs.existsSync(JUSTDIAL_LOGS_FILE)) {
    const raw = fs.readFileSync(JUSTDIAL_LOGS_FILE, 'utf-8');
    cachedLogs = JSON.parse(raw);
  }
} catch (e) {
  console.warn('[JustdialService] Error loading logs:', e);
}

function persistConfig() {
  try {
    fs.writeFileSync(JUSTDIAL_CONFIG_FILE, JSON.stringify(cachedConfig, null, 2));
  } catch (e) {
    console.warn('[JustdialService] Error saving config:', e);
  }
}

function persistLogs() {
  try {
    // Keep last 250 logs to prevent unbounded file growth
    if (cachedLogs.length > 250) {
      cachedLogs = cachedLogs.slice(0, 250);
    }
    fs.writeFileSync(JUSTDIAL_LOGS_FILE, JSON.stringify(cachedLogs, null, 2));
  } catch (e) {
    console.warn('[JustdialService] Error saving logs:', e);
  }
}

function appendLog(log: Omit<JustdialLog, 'id' | 'timestamp'>): JustdialLog {
  const newLog: JustdialLog = {
    id: `JD-LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  cachedLogs.unshift(newLog);
  persistLogs();
  return newLog;
}

export function getJustdialConfig(maskSecret = true): JustdialConfig & { maskedSecret?: string } {
  const clone = { ...cachedConfig };
  if (maskSecret && clone.webhookSecret) {
    const sec = clone.webhookSecret;
    if (sec.length > 8) {
      return {
        ...clone,
        webhookSecret: `${sec.slice(0, 4)}••••••••${sec.slice(-3)}`
      };
    }
    return {
      ...clone,
      webhookSecret: '••••••••'
    };
  }
  return clone;
}

export function updateJustdialConfig(updates: Partial<JustdialConfig>): JustdialConfig {
  if (updates.webhookSecret !== undefined) {
    const trimmed = String(updates.webhookSecret).trim();
    if (trimmed && !trimmed.includes('••••')) {
      cachedConfig.webhookSecret = trimmed;
    }
  }
  if (updates.isActive !== undefined) {
    cachedConfig.isActive = Boolean(updates.isActive);
  }
  if (updates.autoAssignTelecallerId !== undefined) {
    cachedConfig.autoAssignTelecallerId = updates.autoAssignTelecallerId;
  }
  persistConfig();
  return getJustdialConfig(false);
}

export function getJustdialLogs(limit = 50): JustdialLog[] {
  return cachedLogs.slice(0, limit);
}

export function clearJustdialLogs(): void {
  cachedLogs = [];
  persistLogs();
}

export function getJustdialStats(): JustdialStats {
  const totalReceived = cachedLogs.length;
  const totalSuccess = cachedLogs.filter(l => l.status === 'SUCCESS').length;
  const totalDuplicates = cachedLogs.filter(l => l.status === 'DUPLICATE').length;
  const totalErrors = cachedLogs.filter(l => l.status === 'AUTH_ERROR' || l.status === 'VALIDATION_ERROR' || l.status === 'INTERNAL_ERROR').length;

  let computedStatus: 'NOT_CONNECTED' | 'PENDING_SETUP' | 'CONNECTED' | 'ERROR' = 'PENDING_SETUP';
  if (!cachedConfig.webhookSecret || cachedConfig.webhookSecret.trim() === '') {
    computedStatus = 'NOT_CONNECTED';
  } else if (totalSuccess > 0) {
    computedStatus = 'CONNECTED';
  } else if (totalErrors > 0 && totalSuccess === 0) {
    computedStatus = 'ERROR';
  } else {
    computedStatus = 'PENDING_SETUP';
  }

  // Sync to config
  cachedConfig.status = computedStatus;

  return {
    totalReceived,
    totalSuccess,
    totalDuplicates,
    totalErrors,
    lastReceivedAt: cachedConfig.lastReceivedAt,
    status: computedStatus
  };
}

/**
 * Normalizes varied casing and key names from Justdial Webhook payloads.
 */
function extractJustdialFields(payload: Record<string, any>) {
  if (!payload || typeof payload !== 'object') {
    return {
      externalLeadId: '',
      customerName: '',
      phone: '',
      alternatePhone: '',
      email: '',
      category: '',
      city: '',
      budget: '',
      notes: '',
      timestamp: ''
    };
  }

  const findVal = (keys: string[]): string => {
    for (const k of keys) {
      if (payload[k] !== undefined && payload[k] !== null && String(payload[k]).trim() !== '') {
        return String(payload[k]).trim();
      }
      // Also check lower case match in payload keys
      const lowerKey = k.toLowerCase();
      const matched = Object.keys(payload).find(pk => pk.toLowerCase() === lowerKey);
      if (matched && payload[matched] !== undefined && payload[matched] !== null && String(payload[matched]).trim() !== '') {
        return String(payload[matched]).trim();
      }
    }
    return '';
  };

  const externalLeadId = findVal(['leadid', 'lead_id', 'leadId', 'id', 'lead_no', 'callid', 'enquiry_id', 'inquiry_id']);
  const customerName = findVal(['name', 'customer_name', 'caller_name', 'lead_name', 'contact_person', 'client_name', 'caller']);
  const phone = findVal(['mobile', 'phone', 'caller_mobile', 'contact_no', 'phoneno', 'mobile_no', 'cell', 'caller_phone']);
  const alternatePhone = findVal(['alternate_mobile', 'alt_mobile', 'alternate_phone', 'alt_phone', 'alternate_no', 'alt_number']);
  const email = findVal(['email', 'caller_email', 'email_id', 'mail']);
  const category = findVal(['category', 'category_name', 'service', 'interested_service', 'keyword', 'search_keyword', 'subcategory', 'requirement_type']);
  const city = findVal(['city', 'area', 'branch', 'locality', 'pincode', 'address', 'location']);
  const budget = findVal(['budget', 'quote', 'value', 'budget_estimate', 'approx_budget']);
  const notes = findVal(['requirement', 'notes', 'query', 'remark', 'remarks', 'description', 'comments', 'enquiry_detail']);
  const timestamp = findVal(['date', 'time', 'lead_date', 'created_date', 'timestamp', 'datetime']);

  return {
    externalLeadId,
    customerName,
    phone,
    alternatePhone,
    email,
    category,
    city,
    budget,
    notes,
    timestamp
  };
}

/**
 * Validates inbound webhook secret token.
 */
function verifySecretToken(reqHeaders: Record<string, any>, reqQuery: Record<string, any>, reqBody: Record<string, any>): boolean {
  const configuredSecret = cachedConfig.webhookSecret ? cachedConfig.webhookSecret.trim() : '';

  // If no secret configured yet, reject for security
  if (!configuredSecret) {
    return false;
  }

  // 1. Check custom headers
  const headerToken = 
    reqHeaders['x-justdial-token'] || 
    reqHeaders['x-webhook-token'] || 
    reqHeaders['x-api-key'] || 
    reqHeaders['x-justdial-secret'];
  if (headerToken && String(headerToken).trim() === configuredSecret) {
    return true;
  }

  // 2. Check Authorization Bearer header
  const authHeader = reqHeaders['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer === configuredSecret) {
      return true;
    }
  }

  // 3. Check query parameters
  const queryToken = reqQuery['token'] || reqQuery['secret'] || reqQuery['key'] || reqQuery['auth'];
  if (queryToken && String(queryToken).trim() === configuredSecret) {
    return true;
  }

  // 4. Check body token field if sent by vendor
  if (reqBody && typeof reqBody === 'object') {
    const bodyToken = reqBody['token'] || reqBody['secret'] || reqBody['api_key'] || reqBody['webhook_token'];
    if (bodyToken && String(bodyToken).trim() === configuredSecret) {
      return true;
    }
  }

  return false;
}

/**
 * Ingests an inbound Justdial Webhook request.
 */
export async function processJustdialWebhook(
  payload: any, 
  headers: Record<string, any> = {}, 
  query: Record<string, any> = {}, 
  ip?: string
): Promise<{ status: number; body: any }> {
  // Check if integration is enabled
  if (!cachedConfig.isActive) {
    appendLog({
      ip,
      status: 'INTERNAL_ERROR',
      httpStatus: 503,
      message: 'Justdial integration is currently disabled in CRM settings.',
      rawPayload: payload
    });
    return {
      status: 503,
      body: { success: false, error: 'Justdial webhook integration is currently paused.' }
    };
  }

  // 1. Authenticate Token
  const isAuthValid = verifySecretToken(headers, query, payload);
  if (!isAuthValid) {
    appendLog({
      ip,
      status: 'AUTH_ERROR',
      httpStatus: 401,
      message: 'Unauthorized: Invalid or missing secret token in header, query, or payload.',
      rawPayload: payload
    });
    return {
      status: 401,
      body: { 
        success: false, 
        error: 'Unauthorized: Invalid or missing webhook secret token. Provide x-justdial-token header or ?token= query parameter.' 
      }
    };
  }

  // 2. Extract & Validate Fields
  const extracted = extractJustdialFields(payload);
  const {
    externalLeadId,
    customerName,
    phone,
    alternatePhone,
    email,
    category,
    city,
    budget,
    notes,
    timestamp
  } = extracted;

  // Basic validation
  if (!phone || (!customerName && !phone)) {
    appendLog({
      ip,
      externalLeadId,
      customerName,
      phone,
      status: 'VALIDATION_ERROR',
      httpStatus: 400,
      message: 'Payload missing required phone number or customer identifier.',
      rawPayload: payload
    });
    return {
      status: 400,
      body: { 
        success: false, 
        error: 'Bad Request: Required customer phone or contact identifier missing in payload.' 
      }
    };
  }

  const normPhone = normalizePhone(phone);
  const normAltPhone = alternatePhone ? normalizePhone(alternatePhone) : undefined;
  const effectiveName = customerName || `Justdial Inquirer (${normPhone.slice(-4)})`;
  const effectiveCategory = category || 'Turnkey Home & Commercial Interior';
  const effectiveCity = city || 'Bengaluru';
  const effectiveBudget = budget || '₹15 - 35 Lakhs';

  // 3. Deduplication Check
  const now = new Date().toISOString();

  // (A) Check by external Justdial lead ID (Idempotency)
  if (externalLeadId) {
    const existingById = Object.values(dbCrmLeads).find(l => l.external_lead_id === externalLeadId);
    if (existingById) {
      appendLog({
        ip,
        externalLeadId,
        customerName: existingById.customer_name,
        phone: existingById.phone,
        status: 'DUPLICATE',
        httpStatus: 200,
        message: `Idempotent duplicate: Lead with external Justdial ID "${externalLeadId}" already recorded (CRM ID: ${existingById.id}).`,
        rawPayload: payload
      });
      return {
        status: 200,
        body: {
          success: true,
          message: 'Lead already received and recorded (idempotent)',
          lead_id: existingById.id,
          external_lead_id: externalLeadId,
          is_duplicate: true
        }
      };
    }
  }

  // (B) Check by normalized mobile phone
  const existingByPhone = Object.values(dbCrmLeads).find(l => normalizePhone(l.phone) === normPhone);
  if (existingByPhone) {
    // Append re-inquiry note and log a call record
    const inquiryNote = `\n[Justdial Re-inquiry on ${new Date().toLocaleString('en-IN')}: Service "${effectiveCategory}", Area "${effectiveCity}"${notes ? ` - ${notes}` : ''}]`;
    existingByPhone.notes = (existingByPhone.notes || '') + inquiryNote;
    existingByPhone.last_contact_at = now;
    existingByPhone.updated_at = now;
    if (existingByPhone.status === 'Lost' || existingByPhone.status === 'No Answer') {
      existingByPhone.status = 'New';
    }
    existingByPhone.temperature = 'Hot'; // Elevated intent on repeated outreach
    if (externalLeadId && !existingByPhone.external_lead_id) {
      existingByPhone.external_lead_id = externalLeadId;
    }
    dbCrmLeads[existingByPhone.id] = existingByPhone;
    saveLeads();

    // Add call log record for the re-inquiry
    const callLog: ServerCrmCallLog = {
      id: `CALL-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      lead_id: existingByPhone.id,
      call_date: now,
      outcome: 'Interested',
      notes: `Automated Justdial re-inquiry captured for ${effectiveCategory}.`,
      logged_by: 'system_justdial_webhook',
      logged_by_name: 'Justdial Webhook Engine',
      created_at: now
    };
    dbCrmCalls.push(callLog);
    saveCalls();

    cachedConfig.lastReceivedAt = now;
    cachedConfig.status = 'CONNECTED';
    persistConfig();

    appendLog({
      ip,
      externalLeadId,
      customerName: existingByPhone.customer_name,
      phone: normPhone,
      status: 'DUPLICATE',
      httpStatus: 200,
      message: `Existing client recognized by mobile: Re-inquiry appended to CRM ID ${existingByPhone.id}.`,
      rawPayload: payload
    });

    return {
      status: 200,
      body: {
        success: true,
        message: 'Existing client recognized: re-inquiry appended to lead history',
        lead_id: existingByPhone.id,
        is_duplicate: true,
        lead: existingByPhone
      }
    };
  }

  // 4. Create New Lead
  const leadId = `CRM-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(10000 + Math.random() * 90000)}`;
  const constructedNotes = [
    notes ? `Requirement: ${notes}` : '',
    timestamp ? `Justdial Time: ${timestamp}` : '',
    externalLeadId ? `Justdial Ref: #${externalLeadId}` : '',
    alternatePhone ? `Alt Phone: ${alternatePhone}` : ''
  ].filter(Boolean).join(' | ') || 'Direct Justdial Lead Ingestion';

  const newLead: ServerCrmLead = {
    id: leadId,
    customer_name: effectiveName,
    phone: normPhone,
    alternate_phone: normAltPhone,
    email: email || undefined,
    source: 'Justdial',
    interested_service: effectiveCategory,
    city: effectiveCity,
    budget: effectiveBudget,
    temperature: 'Warm',
    status: 'New',
    notes: constructedNotes,
    external_lead_id: externalLeadId || undefined,
    raw_payload: payload,
    created_by: 'system_justdial_webhook',
    created_by_name: 'Justdial Webhook Engine',
    created_at: now,
    updated_at: now
  };

  dbCrmLeads[leadId] = newLead;
  saveLeads();

  // Audit entry
  dbCrmAudit.push({
    id: `AUDIT-${Date.now()}`,
    lead_id: leadId,
    action: 'CREATE',
    performed_by: 'system_justdial_webhook',
    performed_by_name: 'Justdial Ingestion Webhook',
    details: { customer_name: effectiveName, phone: normPhone, externalLeadId },
    created_at: now
  });
  saveAudit();

  // Update integration status
  cachedConfig.lastReceivedAt = now;
  cachedConfig.status = 'CONNECTED';
  persistConfig();

  appendLog({
    ip,
    externalLeadId,
    customerName: effectiveName,
    phone: normPhone,
    status: 'SUCCESS',
    httpStatus: 201,
    message: `Justdial lead successfully ingested and created as "${effectiveName}" (ID: ${leadId}).`,
    rawPayload: payload
  });

  return {
    status: 201,
    body: {
      success: true,
      message: 'Justdial lead ingested successfully into Royal Epic CRM',
      lead_id: leadId,
      lead: newLead
    }
  };
}

/**
 * Triggers a realistic simulated test lead from Justdial.
 */
export async function simulateTestLead(): Promise<{ status: number; body: any }> {
  const testExternalId = `JD-TEST-${Date.now().toString().slice(-6)}`;
  const samplePhones = ['9880199887', '9916644221', '9741288334', '9845077665', '9632155443'];
  const sampleNames = ['Suresh Gowda', 'Arjun Nambiar', 'Sunita Hegde', 'Chandrashekhar Murthy', 'Pooja Srinivas'];
  const sampleAreas = ['Bengaluru (Hebbal)', 'Bengaluru (Thanisandra)', 'Bengaluru (Whitefield)', 'Bengaluru (Koramangala)', 'Bengaluru (Yelahanka)'];
  const sampleRequirements = [
    'Complete 3BHK interior execution with modular acrylic kitchen & walk-in closet.',
    '4BHK luxury duplex villa interior, Italian marble living room flooring and Burma teak pooja door.',
    'Corporate office fit-out with acoustic glass partitions and executive director cabins.',
    'Waterproof WPC designer bathroom doors and sliding wardrobes for apartment renovation.',
    'Contemporary open-concept living, false ceiling with cove lighting and custom crockery unit.'
  ];

  const pickIdx = Math.floor(Math.random() * sampleNames.length);

  const testPayload = {
    leadid: testExternalId,
    name: sampleNames[pickIdx],
    mobile: samplePhones[pickIdx],
    alternate_mobile: '+91 80 2345 6789',
    email: `${sampleNames[pickIdx].toLowerCase().replace(/\s+/g, '.')}@example.com`,
    category: 'Turnkey Architectural Interior',
    city: sampleAreas[pickIdx],
    budget: '₹28 - 45 Lakhs',
    requirement: sampleRequirements[pickIdx],
    date: new Date().toISOString(),
    is_simulated_test: true
  };

  const headers = {
    'x-justdial-token': cachedConfig.webhookSecret
  };

  cachedConfig.lastTestedAt = new Date().toISOString();
  persistConfig();

  return await processJustdialWebhook(testPayload, headers, {}, '127.0.0.1 (Internal Simulation)');
}
