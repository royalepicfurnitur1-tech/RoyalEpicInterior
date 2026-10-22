import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const crmRouter = express.Router();

const DB_DIR = path.join(process.cwd(), 'data');
const CRM_LEADS_FILE = path.join(DB_DIR, 'crm_leads.json');
const CRM_CALLS_FILE = path.join(DB_DIR, 'crm_calls.json');
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
  phone: string;
  email?: string;
  source: string;
  interested_service: string;
  city?: string;
  budget?: string;
  temperature: 'Hot' | 'Warm' | 'Cold';
  status: string;
  notes?: string;
  last_contact_at?: string;
  next_followup_at?: string;
  created_by?: string;
  created_by_name?: string;
  last_updated_by?: string;
  last_updated_by_name?: string;
  created_at: string;
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

// Phone normalization helper
function normalizePhone(p: string): string {
  if (!p) return '';
  const cleaned = p.replace(/[\s\-\(\)\.]/g, '');
  if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^0[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(cleaned)) return `+${cleaned}`;
  return cleaned;
}

// In-Memory state loaded from disk
let dbCrmUsers: Record<string, ServerCrmUser> = {};
let dbCrmLeads: Record<string, ServerCrmLead> = {};
let dbCrmCalls: ServerCrmCallLog[] = [];
let dbCrmAudit: any[] = [];

// Load initial state
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
  if (fs.existsSync(CRM_CALLS_FILE)) {
    dbCrmCalls = JSON.parse(fs.readFileSync(CRM_CALLS_FILE, 'utf-8'));
  }
} catch (_) {}

try {
  if (fs.existsSync(CRM_AUDIT_FILE)) {
    dbCrmAudit = JSON.parse(fs.readFileSync(CRM_AUDIT_FILE, 'utf-8'));
  }
} catch (_) {}

// Seed default users if empty
if (Object.keys(dbCrmUsers).length === 0) {
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

  const telecallerUser: ServerCrmUser = {
    id: 'crm_telecaller_1',
    email: 'telecaller1@royalepicinterior.com',
    name: 'Pooja (Senior Telecaller)',
    phone: '+91 98450 11223',
    password: 'Tele@RoyalEpic2026',
    role: 'telecaller',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbCrmUsers[adminUser.email] = adminUser;
  dbCrmUsers[telecallerUser.email] = telecallerUser;
  saveUsers();
}

// Seed default sample leads if empty
if (Object.keys(dbCrmLeads).length === 0) {
  const now = Date.now();
  const sampleLeads: ServerCrmLead[] = [
    {
      id: 'CRM-2601-10001',
      customer_name: 'Vikramaditya Sharma',
      phone: '+919845012345',
      email: 'vikram.sharma@example.com',
      source: 'IndiaMART',
      interested_service: '3BHK Luxury Turnkey Interior',
      city: 'Bengaluru (Hebbal)',
      budget: '₹25 - 35 Lakhs',
      temperature: 'Hot',
      status: 'Follow-up',
      notes: 'Client wants Italian marble living room and Burma teak pooja door. Follow up on design render approval.',
      last_contact_at: new Date(now - 2 * 3600 * 1000).toISOString(),
      next_followup_at: new Date(now + 4 * 3600 * 1000).toISOString(),
      created_by: 'crm_admin_primary',
      created_by_name: 'Royal Epic Admin',
      created_at: new Date(now - 86400000 * 2).toISOString(),
      updated_at: new Date(now - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 'CRM-2601-10002',
      customer_name: 'Dr. Meenakshi Sundaram',
      phone: '+919900188765',
      email: 'meenakshi.s@gmail.com',
      source: 'Justdial',
      interested_service: 'Modular Kitchen & Sliding Wardrobes',
      city: 'Bengaluru (Thanisandra)',
      budget: '₹12 - 18 Lakhs',
      temperature: 'Hot',
      status: 'Site Visit',
      notes: 'Site visit requested for Thanisandra villa. Keys with security.',
      last_contact_at: new Date(now - 86400000).toISOString(),
      next_followup_at: new Date(now + 86400000).toISOString(),
      created_by: 'crm_telecaller_1',
      created_by_name: 'Pooja',
      created_at: new Date(now - 86400000 * 3).toISOString(),
      updated_at: new Date(now - 86400000).toISOString()
    },
    {
      id: 'CRM-2601-10003',
      customer_name: 'Ananya Deshmukh',
      phone: '+919886033421',
      email: 'ananya.d@techcorp.in',
      source: 'Facebook',
      interested_service: 'Full Home Turnkey Interior',
      city: 'Bengaluru (Whitefield)',
      budget: '₹30 - 45 Lakhs',
      temperature: 'Warm',
      status: 'Quotation',
      notes: 'Shared preliminary BOQ for 4BHK apartment. Awaiting client review.',
      last_contact_at: new Date(now - 86400000 * 3).toISOString(),
      next_followup_at: new Date(now - 86400000).toISOString(), // Overdue
      created_by: 'crm_telecaller_1',
      created_by_name: 'Pooja',
      created_at: new Date(now - 86400000 * 5).toISOString(),
      updated_at: new Date(now - 86400000 * 3).toISOString()
    },
    {
      id: 'CRM-2601-10004',
      customer_name: 'Rajesh K. Varma',
      phone: '+919448077123',
      email: 'rajesh.varma@varmaestate.com',
      source: 'Website',
      interested_service: 'Commercial Office Fit-Out',
      city: 'Bengaluru (Koramangala)',
      budget: '₹50 Lakhs+',
      temperature: 'Hot',
      status: 'Qualified',
      notes: '5000 sq.ft commercial space. Needs acoustic glass partitions and executive furniture.',
      last_contact_at: new Date(now - 4 * 3600 * 1000).toISOString(),
      next_followup_at: new Date(now + 86400000 * 2).toISOString(),
      created_by: 'crm_admin_primary',
      created_by_name: 'Royal Epic Admin',
      created_at: new Date(now - 86400000).toISOString(),
      updated_at: new Date(now - 4 * 3600 * 1000).toISOString()
    },
    {
      id: 'CRM-2601-10005',
      customer_name: 'Kavita Chawla',
      phone: '+919731244556',
      email: 'kavita.c@gmail.com',
      source: 'Instagram',
      interested_service: 'WPC Waterproof Bathroom Doors',
      city: 'Bengaluru (Yelahanka)',
      budget: '₹2 - 4 Lakhs',
      temperature: 'Cold',
      status: 'No Answer',
      notes: 'Tried calling twice; phone rang without answer. Sent WhatsApp overview.',
      last_contact_at: new Date(now - 86400000).toISOString(),
      next_followup_at: new Date(now + 3 * 3600 * 1000).toISOString(),
      created_by: 'crm_telecaller_1',
      created_by_name: 'Pooja',
      created_at: new Date(now - 86400000 * 2).toISOString(),
      updated_at: new Date(now - 86400000).toISOString()
    }
  ];

  sampleLeads.forEach(l => {
    dbCrmLeads[l.id] = l;
  });
  saveLeads();
}

function saveUsers() {
  try {
    fs.writeFileSync(CRM_USERS_FILE, JSON.stringify(dbCrmUsers, null, 2));
  } catch (_) {}
}

function saveLeads() {
  try {
    fs.writeFileSync(CRM_LEADS_FILE, JSON.stringify(dbCrmLeads, null, 2));
  } catch (_) {}
}

function saveCalls() {
  try {
    fs.writeFileSync(CRM_CALLS_FILE, JSON.stringify(dbCrmCalls, null, 2));
  } catch (_) {}
}

function saveAudit() {
  try {
    fs.writeFileSync(CRM_AUDIT_FILE, JSON.stringify(dbCrmAudit, null, 2));
  } catch (_) {}
}

// Authentication & Session Extraction Middleware
function extractUserFromReq(req: Request): ServerCrmUser | null {
  const authHeader = req.headers['authorization'];
  const userIdHeader = req.headers['x-crm-user-id'] as string;

  if (userIdHeader) {
    const found = Object.values(dbCrmUsers).find(u => u.id === userIdHeader);
    if (found && found.status === 'active') return found;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    // In our implementation, token is either a demo token or user id based
    const found = Object.values(dbCrmUsers).find(u => token.includes(u.id) || token.includes(u.email));
    if (found && found.status === 'active') return found;
  }

  // Default fallback for development/demo ease
  return Object.values(dbCrmUsers).find(u => u.role === 'admin') || null;
}

// =========================================================================
// AUTH ENDPOINTS
// =========================================================================

// POST /api/crm/auth/login
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

    // Verify password if set
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

// GET /api/crm/auth/session
crmRouter.get('/auth/session', (req: Request, res: Response) => {
  const user = extractUserFromReq(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized or expired session.' });
  }
  const safeUser = { ...user };
  delete safeUser.password;
  res.json({ success: true, user: safeUser });
});

// POST /api/crm/auth/logout
crmRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// POST /api/crm/auth/init-first-admin
crmRouter.post('/auth/init-first-admin', (req: Request, res: Response) => {
  try {
    const { email, name, password, phone } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    const normEmail = email.trim().toLowerCase();
    const existing = dbCrmUsers[normEmail];
    if (existing) {
      existing.role = 'admin';
      existing.name = name.trim();
      existing.password = password;
      if (phone) existing.phone = phone.trim();
      saveUsers();
      const safe = { ...existing };
      delete safe.password;
      return res.json({ success: true, user: safe, token: `crm_admin_${existing.id}_${Date.now()}` });
    }

    const newAdmin: ServerCrmUser = {
      id: `crm_admin_${Date.now()}`,
      email: normEmail,
      name: name.trim(),
      phone: phone?.trim() || '',
      password,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbCrmUsers[normEmail] = newAdmin;
    saveUsers();

    const safe = { ...newAdmin };
    delete safe.password;
    res.json({ success: true, user: safe, token: `crm_admin_${newAdmin.id}_${Date.now()}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to initialize admin' });
  }
});

// =========================================================================
// LEADS ENDPOINTS
// =========================================================================

// GET /api/crm/leads
crmRouter.get('/leads', (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const status = (req.query.status as string) || '';
    const temperature = (req.query.temperature as string) || '';
    const source = (req.query.source as string) || '';
    const sortBy = (req.query.sortBy as string) || 'created_desc';
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.max(Number(req.query.pageSize) || 15, 1);

    let list = Object.values(dbCrmLeads);

    // Filter by search
    if (search) {
      list = list.filter(l => 
        l.customer_name.toLowerCase().includes(search) ||
        l.phone.includes(search) ||
        (l.email && l.email.toLowerCase().includes(search)) ||
        l.interested_service.toLowerCase().includes(search) ||
        (l.city && l.city.toLowerCase().includes(search))
      );
    }

    // Filter by status
    if (status && status !== 'All') {
      list = list.filter(l => l.status === status);
    }

    // Filter by temperature
    if (temperature && temperature !== 'All') {
      list = list.filter(l => l.temperature === temperature);
    }

    // Filter by source
    if (source && source !== 'All') {
      list = list.filter(l => l.source === source);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'created_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'followup_asc') {
        if (!a.next_followup_at) return 1;
        if (!b.next_followup_at) return -1;
        return new Date(a.next_followup_at).getTime() - new Date(b.next_followup_at).getTime();
      }
      if (sortBy === 'temperature_desc') {
        const order: Record<string, number> = { 'Hot': 3, 'Warm': 2, 'Cold': 1 };
        return (order[b.temperature] || 0) - (order[a.temperature] || 0);
      }
      if (sortBy === 'name_asc') {
        return a.customer_name.localeCompare(b.customer_name);
      }
      return 0;
    });

    const total = list.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = list.slice(startIndex, startIndex + pageSize);

    res.json({ success: true, leads: paginated, total, page, pageSize });
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
  res.json({ success: true, lead });
});

// POST /api/crm/leads (Create Lead)
crmRouter.post('/leads', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    const { 
      customer_name, 
      phone, 
      email, 
      source = 'Website', 
      interested_service = 'Turnkey Interior',
      city = 'Bengaluru',
      budget,
      temperature = 'Warm',
      status = 'New',
      notes,
      next_followup_at
    } = req.body;

    if (!customer_name || !phone) {
      return res.status(400).json({ success: false, error: 'Customer name and phone number are required.' });
    }

    const normPhone = normalizePhone(phone);

    // Duplicate Phone Check
    const existingLead = Object.values(dbCrmLeads).find(l => normalizePhone(l.phone) === normPhone);
    if (existingLead) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        error: `A lead with phone number ${phone} already exists in CRM for "${existingLead.customer_name}" (ID: ${existingLead.id}).`
      });
    }

    const now = new Date().toISOString();
    const id = `CRM-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newLead: ServerCrmLead = {
      id,
      customer_name: customer_name.trim(),
      phone: normPhone,
      email: email?.trim() || undefined,
      source,
      interested_service: interested_service.trim(),
      city: city.trim(),
      budget: budget?.trim() || undefined,
      temperature,
      status,
      notes: notes?.trim() || undefined,
      next_followup_at: next_followup_at || undefined,
      created_by: user?.id,
      created_by_name: user?.name,
      created_at: now,
      updated_at: now
    };

    dbCrmLeads[id] = newLead;
    saveLeads();

    // Audit Log
    dbCrmAudit.push({
      id: `AUDIT-${Date.now()}`,
      lead_id: id,
      action: 'CREATE',
      performed_by: user?.id || 'unknown',
      performed_by_name: user?.name || 'unknown',
      details: { customer_name, phone: normPhone },
      created_at: now
    });
    saveAudit();

    res.status(201).json({ success: true, lead: newLead });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating lead' });
  }
});

// PUT /api/crm/leads/:id (Update Lead)
crmRouter.put('/leads/:id', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    const lead = dbCrmLeads[req.params.id];
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found.' });
    }

    const {
      customer_name,
      phone,
      email,
      source,
      interested_service,
      city,
      budget,
      temperature,
      status,
      notes,
      next_followup_at
    } = req.body;

    if (phone) {
      const normPhone = normalizePhone(phone);
      // Check if duplicate with ANOTHER lead
      const duplicate = Object.values(dbCrmLeads).find(l => l.id !== lead.id && normalizePhone(l.phone) === normPhone);
      if (duplicate) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          error: `Another lead "${duplicate.customer_name}" already uses phone number ${phone}.`
        });
      }
      lead.phone = normPhone;
    }

    if (customer_name) lead.customer_name = customer_name.trim();
    if (email !== undefined) lead.email = email?.trim() || undefined;
    if (source) lead.source = source;
    if (interested_service) lead.interested_service = interested_service.trim();
    if (city !== undefined) lead.city = city.trim();
    if (budget !== undefined) lead.budget = budget?.trim() || undefined;
    if (temperature) lead.temperature = temperature;
    if (status) lead.status = status;
    if (notes !== undefined) lead.notes = notes?.trim() || undefined;
    if (next_followup_at !== undefined) lead.next_followup_at = next_followup_at || undefined;

    lead.last_updated_by = user?.id;
    lead.last_updated_by_name = user?.name;
    lead.updated_at = new Date().toISOString();

    dbCrmLeads[lead.id] = lead;
    saveLeads();

    res.json({ success: true, lead });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error updating lead' });
  }
});

// DELETE /api/crm/leads/:id (Strictly Admin-Only)
crmRouter.delete('/leads/:id', (req: Request, res: Response) => {
  try {
    const user = extractUserFromReq(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only administrators are authorized to permanently delete CRM leads.'
      });
    }

    const lead = dbCrmLeads[req.params.id];
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found.' });
    }

    delete dbCrmLeads[req.params.id];
    saveLeads();

    // Audit log
    dbCrmAudit.push({
      id: `AUDIT-${Date.now()}`,
      lead_id: req.params.id,
      action: 'DELETE',
      performed_by: user.id,
      performed_by_name: user.name,
      details: { deleted_name: lead.customer_name, phone: lead.phone },
      created_at: new Date().toISOString()
    });
    saveAudit();

    res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error deleting lead' });
  }
});

// =========================================================================
// CALL LOGS ENDPOINTS
// =========================================================================

// GET /api/crm/leads/:id/calls
crmRouter.get('/leads/:id/calls', (req: Request, res: Response) => {
  const calls = dbCrmCalls
    .filter(c => c.lead_id === req.params.id)
    .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime());
  res.json({ success: true, calls });
});

// POST /api/crm/calls (Log Interaction & Update Follow-up)
crmRouter.post('/calls', (req: Request, res: Response) => {
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
      id: `CALL-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      lead_id,
      call_date: now,
      outcome,
      notes: notes?.trim() || undefined,
      followup_date: followup_date || undefined,
      logged_by: user?.id,
      logged_by_name: user?.name,
      created_at: now
    };

    dbCrmCalls.push(callLog);
    saveCalls();

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

    res.status(201).json({ success: true, callLog, lead });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error recording call' });
  }
});

// =========================================================================
// FOLLOW-UPS ENDPOINT
// =========================================================================

// GET /api/crm/followups
crmRouter.get('/followups', (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    const all = Object.values(dbCrmLeads).filter(l => l.next_followup_at && l.status !== 'Converted' && l.status !== 'Lost');

    const dueToday: ServerCrmLead[] = [];
    const overdue: ServerCrmLead[] = [];
    const upcoming: ServerCrmLead[] = [];

    all.forEach(l => {
      const fTime = new Date(l.next_followup_at!).getTime();
      if (fTime < todayStart) {
        overdue.push(l);
      } else if (fTime >= todayStart && fTime < todayEnd) {
        dueToday.push(l);
      } else {
        upcoming.push(l);
      }
    });

    // Sort overdue by most overdue first
    overdue.sort((a, b) => new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime());
    // Sort due today by earliest time
    dueToday.sort((a, b) => new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime());
    // Sort upcoming by earliest
    upcoming.sort((a, b) => new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime());

    res.json({ success: true, dueToday, overdue, upcoming });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching followups' });
  }
});

// =========================================================================
// DASHBOARD METRICS ENDPOINT
// =========================================================================

// GET /api/crm/dashboard-metrics
crmRouter.get('/dashboard-metrics', (_req: Request, res: Response) => {
  try {
    const leads = Object.values(dbCrmLeads);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'New').length;
    const hotLeads = leads.filter(l => l.temperature === 'Hot').length;
    const qualifiedLeads = leads.filter(l => l.status === 'Qualified' || l.status === 'Site Visit').length;
    const convertedLeads = leads.filter(l => l.status === 'Converted').length;

    // Follow-ups
    const followupsDueToday = leads.filter(l => {
      if (!l.next_followup_at || l.status === 'Converted' || l.status === 'Lost') return false;
      const t = new Date(l.next_followup_at).getTime();
      return t >= todayStart && t < todayEnd;
    }).length;

    const overdueFollowups = leads.filter(l => {
      if (!l.next_followup_at || l.status === 'Converted' || l.status === 'Lost') return false;
      const t = new Date(l.next_followup_at).getTime();
      return t < todayStart;
    }).length;

    // Calls Today
    const callsToday = dbCrmCalls.filter(c => {
      const t = new Date(c.call_date).getTime();
      return t >= todayStart && t < todayEnd;
    }).length;

    res.json({
      success: true,
      metrics: {
        totalLeads,
        newLeads,
        hotLeads,
        callsToday,
        followupsDueToday,
        overdueFollowups,
        qualifiedLeads,
        convertedLeads
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error compiling metrics' });
  }
});

// =========================================================================
// REPORTS ENDPOINT
// =========================================================================

// GET /api/crm/reports
crmRouter.get('/reports', (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 30;
    const cutoff = Date.now() - days * 86400000;

    const leads = Object.values(dbCrmLeads).filter(l => new Date(l.created_at).getTime() >= cutoff);
    const calls = dbCrmCalls.filter(c => new Date(c.call_date).getTime() >= cutoff);

    // By Source
    const sourceMap: Record<string, number> = {};
    leads.forEach(l => {
      sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
    });
    const bySource = Object.entries(sourceMap).map(([source, count]) => ({ source, count }));

    // By Status
    const statusMap: Record<string, number> = {};
    leads.forEach(l => {
      statusMap[l.status] = (statusMap[l.status] || 0) + 1;
    });
    const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // By Temperature
    const tempMap: Record<string, number> = { 'Hot': 0, 'Warm': 0, 'Cold': 0 };
    leads.forEach(l => {
      tempMap[l.temperature] = (tempMap[l.temperature] || 0) + 1;
    });
    const byTemperature = Object.entries(tempMap).map(([temperature, count]) => ({ temperature, count }));

    // Calls by Outcome
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

// =========================================================================
// CSV IMPORT ENDPOINT (Admin Only)
// =========================================================================

// POST /api/crm/import-csv
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
      if (!row.customer_name || !row.phone) {
        skippedCount++;
        errors.push({ row: idx + 1, reason: 'Name or phone is missing' });
        return;
      }

      const norm = normalizePhone(row.phone);
      if (existingPhones.has(norm)) {
        skippedCount++;
        errors.push({ row: idx + 1, reason: `Phone ${norm} already exists in CRM` });
        return;
      }

      const id = `CRM-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(10000 + Math.random() * 90000)}`;
      const lead: ServerCrmLead = {
        id,
        customer_name: String(row.customer_name).trim(),
        phone: norm,
        email: row.email ? String(row.email).trim() : undefined,
        source: row.source || 'Website',
        interested_service: row.interested_service || 'Turnkey Interior',
        city: row.city || 'Bengaluru',
        budget: row.budget || undefined,
        temperature: row.temperature || 'Warm',
        status: row.status || 'New',
        notes: row.notes || undefined,
        created_by: user.id,
        created_by_name: user.name,
        created_at: now,
        updated_at: now
      };

      dbCrmLeads[id] = lead;
      existingPhones.add(norm);
      importedCount++;
    });

    saveLeads();

    // Audit Log
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

// =========================================================================
// USER & ROLE MANAGEMENT ENDPOINTS (Admin Only)
// =========================================================================

// GET /api/crm/users
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

// POST /api/crm/users/role
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

// POST /api/crm/users/create
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
