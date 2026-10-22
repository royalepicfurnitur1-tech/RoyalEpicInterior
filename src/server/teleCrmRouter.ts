import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ServerCrmLead {
  id: string;
  name: string;
  phone: string;
  normalized_phone: string;
  email?: string;
  source: string;
  interested_service: string;
  city: string;
  budget?: string;
  temperature: 'Hot' | 'Warm' | 'Cold';
  status: 'New' | 'Contacted' | 'Follow-up' | 'No Answer' | 'Qualified' | 'Site Visit' | 'Quotation' | 'Converted' | 'Lost';
  notes?: string;
  last_contact_at?: string;
  next_followup_date?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ServerCrmCallLog {
  id: string;
  lead_id: string;
  call_datetime: string;
  outcome: string;
  notes?: string;
  followup_datetime?: string;
  logged_by: string;
  created_at: string;
}

export interface ServerCrmUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'telecaller';
  phone?: string;
  password_hash?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ServerCrmAuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  user_id?: string;
  user_email: string;
  details?: any;
  created_at: string;
}

const DB_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DB_DIR, "crm_leads.json");
const CALL_LOGS_FILE = path.join(DB_DIR, "crm_call_logs.json");
const USERS_FILE = path.join(DB_DIR, "crm_users.json");
const AUDIT_LOGS_FILE = path.join(DB_DIR, "crm_audit_logs.json");

if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (_) {}
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.warn(`[CRM Storage] Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[CRM Storage] Error writing ${filePath}:`, err);
  }
}

// Initial seed users if file is missing or empty
function getInitialUsers(): ServerCrmUser[] {
  const existing = readJsonFile<ServerCrmUser[]>(USERS_FILE, []);
  if (existing && existing.length > 0) return existing;

  const defaultUsers: ServerCrmUser[] = [
    {
      id: "usr-admin-01",
      email: "royalepicfurnitur1@gmail.com",
      name: "Royal Epic Primary Admin",
      role: "admin",
      phone: "+91 99166 33338",
      password_hash: hashPassword("Admin@123"),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "usr-admin-02",
      email: "admin@royalepicinterior.com",
      name: "CRM Operations Admin",
      role: "admin",
      phone: "+91 99166 33338",
      password_hash: hashPassword("RoyalEpic@2026"),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "usr-tele-01",
      email: "telecaller@royalepicinterior.com",
      name: "Senior Telecaller Agent",
      role: "telecaller",
      phone: "+91 98450 11223",
      password_hash: hashPassword("Caller@2026"),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "usr-tele-02",
      email: "priya.tele@royalepicinterior.com",
      name: "Priya Sharma (Telecaller)",
      role: "telecaller",
      phone: "+91 98450 44556",
      password_hash: hashPassword("Priya@2026"),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  writeJsonFile(USERS_FILE, defaultUsers);
  return defaultUsers;
}

// Initial seed leads if file is missing or empty
function getInitialLeads(): ServerCrmLead[] {
  const existing = readJsonFile<ServerCrmLead[]>(LEADS_FILE, []);
  if (existing && existing.length > 0) return existing;

  const now = new Date();
  const todayStr = now.toISOString();
  
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const defaultLeads: ServerCrmLead[] = [
    {
      id: "TELE-10001",
      name: "Vikramaditya Sharma",
      phone: "+91 98450 12345",
      normalized_phone: "9845012345",
      email: "vikram.sharma@example.com",
      source: "Justdial",
      interested_service: "3BHK Luxury Turnkey Interior",
      city: "Bengaluru (Hebbal)",
      budget: "₹25 Lakhs - ₹35 Lakhs",
      temperature: "Hot",
      status: "Site Visit",
      notes: "Client has villa possession next week. Requested site visit with senior interior designer.",
      last_contact_at: yesterday,
      next_followup_date: todayStr,
      created_by: "system_seed",
      created_at: yesterday,
      updated_at: yesterday
    },
    {
      id: "TELE-10002",
      name: "Dr. Meenakshi Sundaram",
      phone: "+91 99001 88765",
      normalized_phone: "9900188765",
      email: "meenakshi.s@gmail.com",
      source: "IndiaMART",
      interested_service: "Modular Kitchen & Wardrobes",
      city: "Bengaluru (Thanisandra)",
      budget: "₹12 Lakhs - ₹18 Lakhs",
      temperature: "Hot",
      status: "Quotation",
      notes: "Acrylic modular kitchen and 2 master bedroom sliding wardrobes. Sent initial estimate.",
      last_contact_at: todayStr,
      next_followup_date: tomorrow,
      created_by: "system_seed",
      created_at: yesterday,
      updated_at: todayStr
    },
    {
      id: "TELE-10003",
      name: "Rajeshwar Rao",
      phone: "+91 97402 33445",
      normalized_phone: "9740233445",
      email: "rajeshwar.rao@techcorp.in",
      source: "Facebook",
      interested_service: "Solid Teak Main Entrance Doors",
      city: "Bengaluru (Whitefield)",
      budget: "₹3 Lakhs - ₹5 Lakhs",
      temperature: "Warm",
      status: "Contacted",
      notes: "Inquired about grand pivot teak doors with digital lock fittings. Follow up on dimensions.",
      last_contact_at: yesterday,
      next_followup_date: todayStr,
      created_by: "system_seed",
      created_at: yesterday,
      updated_at: yesterday
    },
    {
      id: "TELE-10004",
      name: "Ananya Deshmukh",
      phone: "+91 98860 99881",
      normalized_phone: "9886099881",
      email: "ananya.d@gmail.com",
      source: "Website",
      interested_service: "WPC Waterproof & Bathroom Doors",
      city: "Bengaluru (Kanakapura Road)",
      budget: "₹2 Lakhs - ₹4 Lakhs",
      temperature: "Cold",
      status: "Follow-up",
      notes: "Needs 8 waterproof doors for apartment renovation. Called yesterday, asked to call back in afternoon.",
      last_contact_at: yesterday,
      next_followup_date: yesterday, // Overdue example
      created_by: "system_seed",
      created_at: yesterday,
      updated_at: yesterday
    },
    {
      id: "TELE-10005",
      name: "Karthik Narayanan",
      phone: "+91 94480 66778",
      normalized_phone: "9448066778",
      email: "karthik.n@outlook.com",
      source: "Referral",
      interested_service: "Turnkey Interior (Complete Home)",
      city: "Bengaluru (Sarjapur)",
      budget: "₹45 Lakhs - ₹60 Lakhs",
      temperature: "Hot",
      status: "Converted",
      notes: "Advance booking confirmed. BOQ signed off.",
      last_contact_at: todayStr,
      next_followup_date: undefined,
      created_by: "system_seed",
      created_at: yesterday,
      updated_at: todayStr
    }
  ];

  writeJsonFile(LEADS_FILE, defaultLeads);
  return defaultLeads;
}

function getInitialCallLogs(): ServerCrmCallLog[] {
  const existing = readJsonFile<ServerCrmCallLog[]>(CALL_LOGS_FILE, []);
  if (existing && existing.length > 0) return existing;

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const defaultLogs: ServerCrmCallLog[] = [
    {
      id: "CALL-10001",
      lead_id: "TELE-10001",
      call_datetime: yesterday,
      outcome: "Interested",
      notes: "Discussed 3BHK turnkey interior requirements. Client requested site visit.",
      followup_datetime: new Date().toISOString(),
      logged_by: "telecaller@royalepicinterior.com",
      created_at: yesterday
    },
    {
      id: "CALL-10002",
      lead_id: "TELE-10002",
      call_datetime: yesterday,
      outcome: "Site Visit Requested",
      notes: "Discussed acrylic finish kitchen. Scheduled preliminary BOQ call.",
      followup_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      logged_by: "priya.tele@royalepicinterior.com",
      created_at: yesterday
    }
  ];

  writeJsonFile(CALL_LOGS_FILE, defaultLogs);
  return defaultLogs;
}

// Helpers
function hashPassword(pass: string): string {
  return crypto.createHash("sha256").update(pass).digest("hex");
}

function normalizePhoneNumber(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  return digits || raw.trim();
}

function recordAuditLog(log: Omit<ServerCrmAuditLog, "id" | "created_at">): void {
  try {
    const logs = readJsonFile<ServerCrmAuditLog[]>(AUDIT_LOGS_FILE, []);
    const newEntry: ServerCrmAuditLog = {
      ...log,
      id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      created_at: new Date().toISOString()
    };
    logs.unshift(newEntry);
    if (logs.length > 1000) logs.pop(); // keep last 1000 audit records
    writeJsonFile(AUDIT_LOGS_FILE, logs);
  } catch (err) {
    console.warn("[CRM Audit] Error saving audit log:", err);
  }
}

// Authentication & Role Middleware
interface AuthenticatedRequest extends Request {
  crmUser?: ServerCrmUser;
}

function authenticateCrm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.headers["x-crm-user-id"] as string;
  const userEmail = req.headers["x-crm-user-email"] as string;
  const authHeader = req.headers.authorization;

  const users = getInitialUsers();

  // 1. Identify by explicit CRM user header or Bearer token
  let matchedUser: ServerCrmUser | undefined;
  if (userId) {
    matchedUser = users.find(u => u.id === userId && u.status === "active");
  } else if (userEmail) {
    matchedUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase() && u.status === "active");
  } else if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    // If token matches user id or email format
    matchedUser = users.find(u => (u.id === token || u.email === token) && u.status === "active");
  }

  // Fallback for root admin email royalepicfurnitur1@gmail.com
  if (!matchedUser && userEmail && userEmail.toLowerCase() === "royalepicfurnitur1@gmail.com") {
    matchedUser = {
      id: "usr-admin-root",
      email: "royalepicfurnitur1@gmail.com",
      name: "Royal Epic Primary Admin",
      role: "admin",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  if (!matchedUser) {
    // If not authenticated, allow read-only or reject based on endpoint
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please sign in to the Royal Epic Telecaller CRM."
    });
  }

  req.crmUser = matchedUser;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.crmUser) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  if (req.crmUser.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Admin privileges required. Telecallers do not have access to this action."
    });
  }
  next();
}

/**
 * Creates and exports the complete Express Router for the Telecaller CRM API.
 */
export function createTeleCrmRouter(): express.Router {
  const router = express.Router();
  router.use(express.json({ limit: "20mb" }));

  // Ensure initial data seeded
  getInitialUsers();
  getInitialLeads();
  getInitialCallLogs();

  // ---------------------------------------------------------------------------
  // AUTHENTICATION ROUTES
  // ---------------------------------------------------------------------------

  // Login
  router.post("/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required" });
      }

      const users = readJsonFile<ServerCrmUser[]>(USERS_FILE, []);
      const cleanEmail = email.trim().toLowerCase();
      const user = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        // Special initial admin bypass if logging in with primary project owner email
        if (cleanEmail === "royalepicfurnitur1@gmail.com") {
          const rootAdmin: ServerCrmUser = {
            id: "usr-admin-root",
            email: "royalepicfurnitur1@gmail.com",
            name: "Royal Epic Primary Admin",
            role: "admin",
            phone: "+91 99166 33338",
            password_hash: hashPassword(password),
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          users.push(rootAdmin);
          writeJsonFile(USERS_FILE, users);
          return res.json({
            success: true,
            user: { id: rootAdmin.id, email: rootAdmin.email, name: rootAdmin.name, role: rootAdmin.role, phone: rootAdmin.phone, status: rootAdmin.status },
            token: rootAdmin.id
          });
        }
        return res.status(401).json({ success: false, error: "Invalid email or password. Only approved CRM accounts can sign in." });
      }

      if (user.status !== "active") {
        return res.status(403).json({ success: false, error: "Your CRM account has been deactivated. Please contact an admin." });
      }

      const incomingHash = hashPassword(password);
      if (user.password_hash && user.password_hash !== incomingHash) {
        return res.status(401).json({ success: false, error: "Invalid email or password." });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          status: user.status
        },
        token: user.id
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Login failed" });
    }
  });

  // Logout
  router.post("/auth/logout", (req, res) => {
    res.json({ success: true, message: "Signed out successfully" });
  });

  // Current User (Me)
  router.get("/auth/me", authenticateCrm, (req: AuthenticatedRequest, res) => {
    const user = req.crmUser!;
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        status: user.status
      }
    });
  });

  // ---------------------------------------------------------------------------
  // LEADS MANAGEMENT ROUTES
  // ---------------------------------------------------------------------------

  // GET /leads (List with search, filters, pagination)
  router.get("/leads", authenticateCrm, (req: AuthenticatedRequest, res) => {
    try {
      const {
        search,
        status,
        temperature,
        source,
        followupPeriod,
        sortBy = "created_at",
        sortOrder = "desc",
        page = "1",
        limit = "50"
      } = req.query as Record<string, string>;

      let leads = readJsonFile<ServerCrmLead[]>(LEADS_FILE, []);
      const callLogs = readJsonFile<ServerCrmCallLog[]>(CALL_LOGS_FILE, []);

      // Calculate call counts per lead
      const callCountMap: Record<string, number> = {};
      callLogs.forEach(c => {
        callCountMap[c.lead_id] = (callCountMap[c.lead_id] || 0) + 1;
      });

      // Filter: Search
      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        const normQuery = normalizePhoneNumber(query);
        leads = leads.filter(l => 
          l.name.toLowerCase().includes(query) ||
          l.phone.includes(query) ||
          (normQuery && l.normalized_phone.includes(normQuery)) ||
          (l.email && l.email.toLowerCase().includes(query)) ||
          (l.city && l.city.toLowerCase().includes(query)) ||
          (l.notes && l.notes.toLowerCase().includes(query)) ||
          (l.interested_service && l.interested_service.toLowerCase().includes(query))
        );
      }

      // Filter: Status
      if (status && status !== "All") {
        leads = leads.filter(l => l.status.toLowerCase() === status.toLowerCase());
      }

      // Filter: Temperature
      if (temperature && temperature !== "All") {
        leads = leads.filter(l => l.temperature.toLowerCase() === temperature.toLowerCase());
      }

      // Filter: Source
      if (source && source !== "All") {
        leads = leads.filter(l => l.source.toLowerCase() === source.toLowerCase());
      }

      // Filter: Followup Period
      if (followupPeriod && followupPeriod !== "all") {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const todayEnd = todayStart + 24 * 60 * 60 * 1000;

        if (followupPeriod === "today") {
          leads = leads.filter(l => {
            if (!l.next_followup_date) return false;
            const fTime = new Date(l.next_followup_date).getTime();
            return fTime >= todayStart && fTime < todayEnd;
          });
        } else if (followupPeriod === "overdue") {
          leads = leads.filter(l => {
            if (!l.next_followup_date) return false;
            if (l.status === "Converted" || l.status === "Lost") return false;
            const fTime = new Date(l.next_followup_date).getTime();
            return fTime < todayStart;
          });
        } else if (followupPeriod === "upcoming") {
          leads = leads.filter(l => {
            if (!l.next_followup_date) return false;
            const fTime = new Date(l.next_followup_date).getTime();
            return fTime >= todayEnd;
          });
        }
      }

      // Sort
      leads.sort((a, b) => {
        let valA: any = a[sortBy as keyof ServerCrmLead] || "";
        let valB: any = b[sortBy as keyof ServerCrmLead] || "";

        if (sortBy === "created_at" || sortBy === "next_followup_date" || sortBy === "last_contact_at") {
          valA = valA ? new Date(valA).getTime() : (sortOrder === "asc" ? Infinity : -Infinity);
          valB = valB ? new Date(valB).getTime() : (sortOrder === "asc" ? Infinity : -Infinity);
        } else if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      const total = leads.length;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      const startIndex = (pageNum - 1) * limitNum;
      const paginated = leads.slice(startIndex, startIndex + limitNum).map(l => ({
        ...l,
        call_count: callCountMap[l.id] || 0
      }));

      return res.json({
        success: true,
        leads: paginated,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /leads/:id (Lead details with call history)
  router.get("/leads/:id", authenticateCrm, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const leads = readJsonFile<ServerCrmLead[]>(LEADS_FILE, []);
      const lead = leads.find(l => l.id === id);

      if (!lead) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }

      const allCalls = readJsonFile<ServerCrmCallLog[]>(CALL_LOGS_FILE, []);
      const leadCalls = allCalls
        .filter(c => c.lead_id === id)
        .sort((a, b) => new Date(b.call_datetime).getTime() - new Date(a.call_datetime).getTime());

      return res.json({
        success: true,
        lead: {
          ...lead,
          call_count: leadCalls.length
        },
        callLogs: leadCalls
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /leads (Create new lead with duplicate check)
  router.post("/leads", authenticateCrm, (req: AuthenticatedRequest, res) => {
    try {
      const {
        name,
        phone,
        email,
        source = "Other",
        interested_service = "General Interior Consultation",
        city = "Bengaluru",
        budget,
        temperature = "Warm",
        status = "New",
        notes,
        next_followup_date
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: "Customer name is required" });
      }
      if (!phone || !phone.trim()) {
        return res.status(400).json({ success: false, error: "Customer phone number is required" });
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      if (normalizedPhone.length < 8) {
        return res.status(400).json({ success: false, error: "Please provide a valid phone number (at least 10 digits for Indian mobiles)." });
      }

      const leads = readJsonFile<ServerCrmLead[]>(LEADS_FILE, []);

      // Duplicate detection by normalized phone
      const duplicateLead = leads.find(l => l.normalized_phone === normalizedPhone);
      if (duplicateLead) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          error: `Duplicate lead found! A lead already exists with phone "${phone}" (Lead: ${duplicateLead.name}, ID: ${duplicateLead.id}, Status: ${duplicateLead.status}).`,
          duplicateLead
        });
      }

      const now = new Date().toISOString();
      const newLead: ServerCrmLead = {
        id: `TELE-${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`,
        name: name.trim(),
        phone: phone.trim(),
        normalized_phone: normalizedPhone,
        email: email ? email.trim() : undefined,
        source,
        interested_service,
        city: city.trim(),
        budget: budget ? budget.trim() : undefined,
        temperature,
        status,
        notes: notes ? notes.trim() : undefined,
        next_followup_date: next_followup_date || undefined,
        created_by: req.crmUser?.email || "telecaller",
        updated_by: req.crmUser?.email || "telecaller",
        created_at: now,
        updated_at: now
      };

      leads.unshift(newLead);
      writeJsonFile(LEADS_FILE, leads);

      recordAuditLog({
        action: "CREATE_LEAD",
        entity_type: "lead",
        entity_id: newLead.id,
        user_id: req.crmUser?.id,
        user_email: req.crmUser?.email || "unknown",
        details: { name: newLead.name, phone: newLead.phone, source: newLead.source }
      });

      return res.status(201).json({ success: true, lead: newLead });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT /leads/:id (Update lead details)
  router.put("/leads/:id", authenticateCrm, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const leads = readJsonFile<ServerCrmLead[]>(LEADS_FILE, []);
      const index = leads.findIndex(l => l.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }

      const current = leads[index];

      // If phone changed, check duplicate against other leads
      if (updates.phone && updates.phone !== current.phone) {
        const newNorm = normalizePhoneNumber(updates.phone);
        const dup = leads.find(l => l.id !== id && l.normalized_phone === newNorm);
        if (dup) {
          return res.status(409).json({
            success: false,
            isDuplicate: true,
            error: `Another lead (${dup.name}, ID: ${dup.id}) already exists with phone number ${updates.phone}.`
          });
        }
        current.phone = updates.phone.trim();
        current.normalized_phone = newNorm;
      }

      if (updates.name !== undefined) current.name = updates.name.trim();
      if (updates.email !== undefined) current.email = updates.email ? updates.email.trim() : undefined;
      if (updates.source !== undefined) current.source = updates.source;
      if (updates.interested_service !== undefined) current.interested_service = updates.interested_service;
      if (updates.city !== undefined) current.city = updates.city;
      if (updates.budget !== undefined) current.budget = updates.budget;
      if (updates.temperature !== undefined) current.temperature = updates.temperature;
      if (updates.status !== undefined) current.status = updates.status;
      if (updates.notes !== undefined) current.notes = updates.notes;
      if (updates.next_followup_date !== undefined) current.next_followup_date = updates.next_followup_date;

      current.updated_by = req.crmUser?.email || "telecaller";
      current.updated_at = new Date().toISOString();

      leads[index] = current;
      writeJsonFile(LEADS_FILE, leads);

      return res.json({ success: true, lead: current });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /leads/:id (ADMIN ONLY)
  router.delete("/leads/:id", authenticateCrm, requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { reason = "Deleted via CRM admin interface" } = req.body;

      let leads = readJsonFile<ServerCrmLead[]>(LEADS_FILE, []);
      const targetLead = leads.find(l => l.id === id);

      if (!targetLead) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }

      leads = leads.filter(l => l.id !== id);
      writeJsonFile(LEADS_FILE, leads);

      // Cascade remove call logs
      let calls = readJsonFile<ServerCrmCallLog[]>(CALL_LOGS_FILE, []);
      calls = calls.filter(c => c.lead_id !== id);
      writeJsonFile(CALL_LOGS_FILE, calls);

      // Record audit log
      recordAuditLog({
        action: "DELETE_LEAD",
        entity_type: "lead",
        entity_id: id,
        user_id: req.crmUser?.id,
        user_email: req.crmUser?.email || "admin",
        details: {
          lead_name: targetLead.name,
          phone: targetLead.phone,
          status: targetLead.status,
          reason
        }
      });

      return res.json({ success: true, message: `Lead ${id} deleted successfully.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // CALL LOGS & WORKFLOWS
  // ---------------------------------------------------------------------------

  // POST /leads/:id/calls (Log a call)
  router.post("/leads/:id/calls", authenticateCrm, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const {
        outcome,
        notes,
        followup_datetime,
        updateStatus,
        updateTemperature
      } = req.body;

      if (!outcome) {
        return res.status(400).json({ success: false, error: "Call outcome is required" });
      }

      const leads = readJsonFile<ServerCrmLead[]>(LEADS_FILE, []);
      const leadIndex = leads.findIndex(l => l.id === id);

      if (leadIndex === -1) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }

      const now = new Date().toISOString();
      const callLogs = readJsonFile<ServerCrmCallLog[]>(CALL_LOGS_FILE, []);

      const newCallLog: ServerCrmCallLog = {
        id: `CALL-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`,
        lead_id: id,
        call_datetime: now,
        outcome,
        notes: notes ? notes.trim() : undefined,
        followup_datetime: followup_datetime || undefined,
        logged_by: req.crmUser?.email || "telecaller",
        created_at: now
      };

      callLogs.unshift(newCallLog);
      writeJsonFile(CALL_LOGS_FILE, callLogs);

      // Update lead state
      const lead = leads[leadIndex];
      lead.last_contact_at = now;
      if (followup_datetime) lead.next_followup_date = followup_datetime;
      if (updateStatus) lead.status = updateStatus;
      if (updateTemperature) lead.temperature = updateTemperature;
      if (notes && notes.trim()) {
        const callNoteHeader = `[Call on ${new Date().toLocaleDateString('en-IN')}: ${outcome}]`;
        lead.notes = lead.notes ? `${callNoteHeader} ${notes}\n\n${lead.notes}` : `${callNoteHeader} ${notes}`;
      }
      lead.updated_by = req.crmUser?.email || "telecaller";
      lead.updated_at = now;

      leads[leadIndex] = lead;
      writeJsonFile(LEADS_FILE, leads);

      return res.status(201).json({ success: true, callLog: newCallLog, lead });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /followups (Due today, overdue, upcoming)
  router.get("/followups", authenticateCrm, (req, res) => {
    try {
      const leads = readJsonFile<ServerCrmLead[]>(LEADS_FILE, []);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;

      const dueToday: ServerCrmLead[] = [];
      const overdue: ServerCrmLead[] = [];
      const upcoming: ServerCrmLead[] = [];

      leads.forEach(l => {
        if (!l.next_followup_date) return;
        if (l.status === "Converted" || l.status === "Lost") return;

        const fTime = new Date(l.next_followup_date).getTime();
        if (fTime < todayStart) {
          overdue.push(l);
        } else if (fTime >= todayStart && fTime < todayEnd) {
          dueToday.push(l);
        } else {
          upcoming.push(l);
        }
      });

      // Sort by urgency
      dueToday.sort((a, b) => new Date(a.next_followup_date!).getTime() - new Date(b.next_followup_date!).getTime());
      overdue.sort((a, b) => new Date(a.next_followup_date!).getTime() - new Date(b.next_followup_date!).getTime());
      upcoming.sort((a, b) => new Date(a.next_followup_date!).getTime() - new Date(b.next_followup_date!).getTime());

      return res.json({ success: true, dueToday, overdue, upcoming });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // CSV IMPORT (ADMIN ONLY)
  // ---------------------------------------------------------------------------
  router.post("/leads/import-csv", authenticateCrm, requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, error: "No CSV rows provided for import" });
      }

      const leads = readJsonFile<ServerCrmLead[]>(LEADS_FILE, []);
      const existingNormalizedSet = new Set(leads.map(l => l.normalized_phone));
      const batchNormalizedSet = new Set<string>();

      let imported = 0;
      let skippedDuplicates = 0;
      let invalidRows = 0;
      const errors: string[] = [];
      const newLeads: ServerCrmLead[] = [];

      rows.forEach((row: any, idx: number) => {
        const rowNum = idx + 1;
        const name = (row.name || row.Name || row["Customer Name"] || row["Full Name"] || "").toString().trim();
        const rawPhone = (row.phone || row.Phone || row["Phone Number"] || row["Mobile"] || "").toString().trim();

        if (!name) {
          invalidRows++;
          errors.push(`Row ${rowNum}: Missing customer name.`);
          return;
        }

        if (!rawPhone) {
          invalidRows++;
          errors.push(`Row ${rowNum}: Missing phone number for "${name}".`);
          return;
        }

        const normalizedPhone = normalizePhoneNumber(rawPhone);
        if (normalizedPhone.length < 8) {
          invalidRows++;
          errors.push(`Row ${rowNum}: Invalid phone number "${rawPhone}" for "${name}".`);
          return;
        }

        // Duplicate check against existing DB
        if (existingNormalizedSet.has(normalizedPhone)) {
          skippedDuplicates++;
          return;
        }

        // Duplicate check within current CSV batch
        if (batchNormalizedSet.has(normalizedPhone)) {
          skippedDuplicates++;
          return;
        }

        batchNormalizedSet.add(normalizedPhone);

        const email = (row.email || row.Email || "").toString().trim();
        const rawSource = (row.source || row.Source || "Other").toString().trim();
        const service = (row.service || row.interested_service || row["Interested Service"] || "General Interior Consultation").toString().trim();
        const city = (row.city || row.City || "Bengaluru").toString().trim();
        const budget = (row.budget || row.Budget || "").toString().trim();
        const rawTemp = (row.temperature || row.Temperature || "Warm").toString().trim();
        const rawStatus = (row.status || row.Status || "New").toString().trim();
        const notes = (row.notes || row.Notes || "").toString().trim();

        const temperature = (['Hot', 'Warm', 'Cold'].includes(rawTemp) ? rawTemp : 'Warm') as any;
        const status = ([
          'New', 'Contacted', 'Follow-up', 'No Answer', 
          'Qualified', 'Site Visit', 'Quotation', 'Converted', 'Lost'
        ].includes(rawStatus) ? rawStatus : 'New') as any;

        const now = new Date().toISOString();
        const lead: ServerCrmLead = {
          id: `TELE-${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`,
          name,
          phone: rawPhone,
          normalized_phone: normalizedPhone,
          email: email || undefined,
          source: rawSource || 'Other',
          interested_service: service,
          city,
          budget: budget || undefined,
          temperature,
          status,
          notes: notes || undefined,
          created_by: req.crmUser?.email || "csv_import",
          updated_by: req.crmUser?.email || "csv_import",
          created_at: now,
          updated_at: now
        };

        newLeads.push(lead);
        existingNormalizedSet.add(normalizedPhone);
        imported++;
      });

      if (newLeads.length > 0) {
        leads.unshift(...newLeads);
        writeJsonFile(LEADS_FILE, leads);

        recordAuditLog({
          action: "CSV_IMPORT",
          entity_type: "lead",
          user_id: req.crmUser?.id,
          user_email: req.crmUser?.email || "admin",
          details: {
            total_rows: rows.length,
            imported,
            skipped_duplicates: skippedDuplicates,
            invalid_rows: invalidRows
          }
        });
      }

      return res.json({
        success: true,
        total: rows.length,
        imported,
        skippedDuplicates,
        invalidRows,
        errors: errors.slice(0, 20) // send first 20 errors
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // REPORTS & ANALYTICS
  // ---------------------------------------------------------------------------
  router.get("/reports", authenticateCrm, (req, res) => {
    try {
      const leads = readJsonFile<ServerCrmLead[]>(LEADS_FILE, []);
      const callLogs = readJsonFile<ServerCrmCallLog[]>(CALL_LOGS_FILE, []);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;

      let newLeads = 0;
      let hotLeads = 0;
      let followupsDueToday = 0;
      let followupsOverdue = 0;
      let qualifiedLeads = 0;
      let convertedLeads = 0;

      const leadsBySource: Record<string, number> = {};
      const leadsByStatus: Record<string, number> = {};
      const temperatureDistribution = { hot: 0, warm: 0, cold: 0 };

      leads.forEach(l => {
        // Status counts
        leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;
        if (l.status === "New") newLeads++;
        if (l.status === "Qualified") qualifiedLeads++;
        if (l.status === "Converted") convertedLeads++;

        // Source counts
        leadsBySource[l.source] = (leadsBySource[l.source] || 0) + 1;

        // Temperature counts
        if (l.temperature === "Hot") {
          hotLeads++;
          temperatureDistribution.hot++;
        } else if (l.temperature === "Warm") {
          temperatureDistribution.warm++;
        } else if (l.temperature === "Cold") {
          temperatureDistribution.cold++;
        }

        // Follow-ups
        if (l.next_followup_date && l.status !== "Converted" && l.status !== "Lost") {
          const fTime = new Date(l.next_followup_date).getTime();
          if (fTime >= todayStart && fTime < todayEnd) {
            followupsDueToday++;
          } else if (fTime < todayStart) {
            followupsOverdue++;
          }
        }
      });

      // Calls logged today
      const callsToday = callLogs.filter(c => {
        const cTime = new Date(c.call_datetime).getTime();
        return cTime >= todayStart && cTime < todayEnd;
      }).length;

      const totalLeads = leads.length;
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      return res.json({
        totalLeads,
        newLeads,
        hotLeads,
        callsToday,
        followupsDueToday,
        followupsOverdue,
        qualifiedLeads,
        convertedLeads,
        conversionRate,
        leadsBySource,
        leadsByStatus,
        temperatureDistribution
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // USER & TEAM MANAGEMENT (ADMIN ONLY)
  // ---------------------------------------------------------------------------
  router.get("/users", authenticateCrm, requireAdmin, (req, res) => {
    try {
      const users = readJsonFile<ServerCrmUser[]>(USERS_FILE, []).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        phone: u.phone,
        status: u.status,
        created_at: u.created_at,
        updated_at: u.updated_at
      }));
      return res.json({ success: true, users });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/users", authenticateCrm, requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { email, name, role, phone, password = "Password@123" } = req.body;
      if (!email || !name) {
        return res.status(400).json({ success: false, error: "Email and name are required." });
      }

      const users = readJsonFile<ServerCrmUser[]>(USERS_FILE, []);
      const cleanEmail = email.trim().toLowerCase();

      if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
        return res.status(409).json({ success: false, error: `User with email "${email}" already exists.` });
      }

      const now = new Date().toISOString();
      const newUser: ServerCrmUser = {
        id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        email: cleanEmail,
        name: name.trim(),
        role: role === "admin" ? "admin" : "telecaller",
        phone: phone ? phone.trim() : undefined,
        password_hash: hashPassword(password),
        status: "active",
        created_at: now,
        updated_at: now
      };

      users.push(newUser);
      writeJsonFile(USERS_FILE, users);

      recordAuditLog({
        action: "CREATE_USER",
        entity_type: "user",
        entity_id: newUser.id,
        user_id: req.crmUser?.id,
        user_email: req.crmUser?.email || "admin",
        details: { email: newUser.email, name: newUser.name, role: newUser.role }
      });

      return res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          status: newUser.status
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.put("/users/:id/role", authenticateCrm, requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { role, status } = req.body;

      const users = readJsonFile<ServerCrmUser[]>(USERS_FILE, []);
      const targetUser = users.find(u => u.id === id);

      if (!targetUser) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      // Safeguard: Do not deactivate or demote the last active admin
      if ((status === "inactive" || role === "telecaller") && targetUser.role === "admin") {
        const activeAdmins = users.filter(u => u.role === "admin" && u.status === "active" && u.id !== id);
        if (activeAdmins.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Cannot demote or deactivate the only active Administrator."
          });
        }
      }

      if (role && (role === "admin" || role === "telecaller")) {
        targetUser.role = role;
      }
      if (status && (status === "active" || status === "inactive")) {
        targetUser.status = status;
      }
      targetUser.updated_at = new Date().toISOString();

      writeJsonFile(USERS_FILE, users);

      recordAuditLog({
        action: "UPDATE_USER_ROLE",
        entity_type: "user",
        entity_id: targetUser.id,
        user_id: req.crmUser?.id,
        user_email: req.crmUser?.email || "admin",
        details: { target_email: targetUser.email, role: targetUser.role, status: targetUser.status }
      });

      return res.json({ success: true, user: targetUser });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
