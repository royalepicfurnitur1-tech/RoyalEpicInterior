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

export type LeadSource =
  | 'Justdial'
  | 'IndiaMART'
  | 'Facebook'
  | 'Instagram'
  | 'Website'
  | 'Referral'
  | 'Walk-in'
  | 'Other';

export type LeadTemperature = 'Hot' | 'Warm' | 'Cold';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Follow-up'
  | 'No Answer'
  | 'Qualified'
  | 'Site Visit'
  | 'Quotation'
  | 'Converted'
  | 'Lost';

export type CallOutcome =
  | 'Interested'
  | 'No Answer'
  | 'Busy'
  | 'Call Back Requested'
  | 'Not Interested'
  | 'Wrong Number'
  | 'Site Visit Requested'
  | 'Converted';

export interface CrmLead {
  id: string;
  customer_name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  interested_service: string;
  city?: string;
  budget?: string;
  temperature: LeadTemperature;
  status: LeadStatus;
  notes?: string;
  last_contact_at?: string;
  next_followup_at?: string;
  external_lead_id?: string;
  alternate_phone?: string;
  raw_payload?: Record<string, any>;
  created_by?: string;
  created_by_name?: string;
  last_updated_by?: string;
  last_updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface JustdialConfig {
  webhookSecret: string;
  isActive: boolean;
  autoAssignTelecallerId?: string;
  lastTestedAt?: string;
  lastReceivedAt?: string;
  status: 'NOT_CONNECTED' | 'PENDING_SETUP' | 'CONNECTED' | 'ERROR';
}

export interface JustdialLog {
  id: string;
  timestamp: string;
  ip?: string;
  externalLeadId?: string;
  customerName?: string;
  phone?: string;
  status: 'SUCCESS' | 'DUPLICATE' | 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR';
  httpStatus: number;
  message: string;
  rawPayload?: any;
}

export interface JustdialStats {
  totalReceived: number;
  totalSuccess: number;
  totalDuplicates: number;
  totalErrors: number;
  lastReceivedAt?: string;
  status: 'NOT_CONNECTED' | 'PENDING_SETUP' | 'CONNECTED' | 'ERROR';
}

export interface CrmCallLog {
  id: string;
  lead_id: string;
  call_date: string;
  outcome: CallOutcome;
  notes?: string;
  followup_date?: string;
  logged_by?: string;
  logged_by_name?: string;
  duration_seconds?: number;
  created_at: string;
}

export interface CrmAuditLog {
  id: string;
  lead_id?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CALL_LOG' | 'IMPORT';
  performed_by: string;
  performed_by_name?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface CrmDashboardMetrics {
  totalLeads: number;
  newLeads: number;
  hotLeads: number;
  callsToday: number;
  followupsDueToday: number;
  overdueFollowups: number;
  qualifiedLeads: number;
  convertedLeads: number;
}

export interface CrmFilterState {
  search: string;
  status: string; // 'All' or specific LeadStatus
  temperature: string; // 'All' or LeadTemperature
  source: string; // 'All' or LeadSource
  sortBy: 'created_desc' | 'created_asc' | 'followup_asc' | 'temperature_desc' | 'name_asc';
  page: number;
  pageSize: number;
}
