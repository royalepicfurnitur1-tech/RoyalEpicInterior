export type CrmRole = 'admin' | 'telecaller';

export interface CrmUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: CrmRole;
  status: 'active' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}

// 1. Lead Source Options
export const LEAD_SOURCES = [
  'Justdial',
  'Google Search',
  'Google Ads',
  'Website Enquiry',
  'Instagram',
  'Facebook',
  'Referral',
  'Walk-in',
  'Other'
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number] | string;

// 2. Service Required Options
export const SERVICES_REQUIRED = [
  'Residential Interior',
  'Commercial Interior',
  'Office Interior',
  'Restaurant Interior',
  'Hotel Interior',
  'Jewellery Showroom Interior',
  'Cafe Interior',
  'Bakery Interior',
  'Modular Kitchen',
  'Wooden Doors',
  'WPC Doors',
  'Wooden Door Frames',
  'WPC Frames',
  'Custom Furniture',
  'Restaurant Tables',
  'Other'
] as const;

export type ServiceRequired = (typeof SERVICES_REQUIRED)[number] | string;

// 3. Lead Status Options
export const LEAD_STATUSES = [
  'New Lead',
  'Not Contacted',
  'Contacted',
  'Interested',
  'Follow-up Required',
  'Site Visit Scheduled',
  'Quotation Sent',
  'Negotiation',
  'Converted',
  'Not Interested',
  'Not Reachable',
  'Lost'
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number] | string;

// 4. Budget Options
export const BUDGET_RANGES = [
  'Below ₹50,000',
  '₹50,000–₹1 Lakh',
  '₹1–3 Lakh',
  '₹3–5 Lakh',
  '₹5–10 Lakh',
  '₹10–25 Lakh',
  '₹25–50 Lakh',
  'Above ₹50 Lakh',
  'Not Disclosed'
] as const;

export type BudgetRange = (typeof BUDGET_RANGES)[number] | string;

// 5. Call Outcome Options (9 exact options)
export const CALL_OUTCOMES = [
  'Connected - Interested',
  'Connected - Follow-up Required',
  'Connected - Site Visit Scheduled',
  'Connected - Quotation Requested',
  'Connected - Not Interested',
  'Busy / No Answer',
  'Switched Off / Not Reachable',
  'Wrong Number',
  'Call Back Later'
] as const;

export type CallOutcome = (typeof CALL_OUTCOMES)[number] | string;

export type LeadTemperature = 'Hot' | 'Warm' | 'Cold';

// Lead Entity
export interface CrmLead {
  id: string;
  customer_name: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  source: LeadSource;
  custom_source?: string;
  interested_service: ServiceRequired;
  custom_service?: string;
  city?: string; // Customer Location / Area
  project_address?: string; // Project Address
  budget?: BudgetRange;
  temperature?: LeadTemperature;
  status: LeadStatus;
  notes?: string; // Customer Requirements / Notes
  assigned_to?: string; // Assigned Telecaller ID
  assigned_to_name?: string; // Assigned Telecaller Name
  last_contact_at?: string;
  next_followup_at?: string; // ISO string with date & time
  next_followup_date?: string; // YYYY-MM-DD
  next_followup_time?: string; // HH:mm
  external_lead_id?: string;
  raw_payload?: Record<string, any>;
  created_by?: string;
  created_by_name?: string;
  last_updated_by?: string;
  last_updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

// Call Log Entity
export interface CrmCallLog {
  id: string;
  lead_id: string;
  call_date: string; // ISO string with call date & time
  outcome: CallOutcome;
  notes?: string; // Discussion Notes
  followup_date?: string; // Next Follow-up Date & Time (ISO)
  logged_by?: string;
  logged_by_name?: string;
  duration_seconds?: number;
  created_at: string;
}

// Audit Log Entity
export interface CrmAuditLog {
  id: string;
  lead_id?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CALL_LOG' | 'IMPORT';
  performed_by: string;
  performed_by_name?: string;
  details?: Record<string, any>;
  created_at: string;
}

// Dashboard Metrics Entity
export interface CrmDashboardMetrics {
  totalLeads: number;
  newLeads: number;
  interestedLeads: number;
  followupsDue: number;
  convertedLeads: number;
  lostLeads: number;
}

// Multi-Filter State
export interface CrmFilterState {
  search: string; // Customer name or mobile number
  source: string; // 'All' or specific source
  service: string; // 'All' or specific service
  status: string; // 'All' or specific status
  budget: string; // 'All' or specific budget
  location: string; // 'All' or location text
  assigned_to: string; // 'All' or telecaller id
  followup_filter: string; // 'All' | 'today' | 'overdue' | 'upcoming' | 'completed' | 'custom'
  followup_date?: string; // YYYY-MM-DD
  created_date: string; // 'All' | 'today' | '7days' | '30days'
  sortBy: 'created_desc' | 'created_asc' | 'followup_asc' | 'followup_desc' | 'name_asc';
  page: number;
  pageSize: number;
}

// Justdial Types (Preserved for compatibility)
export interface JustdialConfig {
  webhookSecret: string;
  isActive?: boolean;
  status?: 'NOT_CONNECTED' | 'PENDING_SETUP' | 'CONNECTED' | 'ERROR';
  lastTestedAt?: string;
  lastReceivedAt?: string;
  leadExpiryDays?: number;
  autoAssignTelecaller?: boolean;
  autoAssignTelecallerId?: string;
  defaultTelecallerId?: string;
  enableDuplicateDetection?: boolean;
}

export interface JustdialLog {
  id: string;
  timestamp?: string;
  receivedAt?: string;
  status: 'SUCCESS' | 'DUPLICATE' | 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR' | 'FAILED' | 'PROCESSED' | string;
  httpStatus?: number;
  customerName?: string;
  phone?: string;
  externalLeadId?: string;
  message?: string;
  payloadSummary?: string;
  leadId?: string;
  error?: string;
  ip?: string;
  rawPayload?: Record<string, any>;
}

export interface JustdialStats {
  totalReceived: number;
  totalSuccess?: number;
  totalProcessed?: number;
  totalDuplicates: number;
  totalErrors?: number;
  totalFailed?: number;
  lastReceivedAt?: string;
  status?: 'NOT_CONNECTED' | 'PENDING_SETUP' | 'CONNECTED' | 'ERROR';
}

