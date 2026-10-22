import { getSupabase } from '../lib/supabase';

export type CrmRole = 'admin' | 'telecaller';

export type LeadSource = 
  | 'Justdial' 
  | 'IndiaMART' 
  | 'Facebook' 
  | 'Instagram' 
  | 'Website' 
  | 'Referral' 
  | 'Walk-in' 
  | 'Direct' 
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

export interface CrmUserProfile {
  id: string;
  email: string;
  name: string;
  role: CrmRole;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

export interface CrmLead {
  id: string;
  name: string;
  phone: string;
  normalized_phone: string;
  email?: string;
  source: LeadSource;
  interested_service: string;
  city: string;
  budget?: string;
  temperature: LeadTemperature;
  status: LeadStatus;
  notes?: string;
  last_contact_at?: string;
  next_followup_date?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  call_count?: number;
}

export interface CrmCallLog {
  id: string;
  lead_id: string;
  call_datetime: string;
  outcome: CallOutcome;
  notes?: string;
  followup_datetime?: string;
  logged_by: string;
  created_at: string;
}

export interface CrmDashboardStats {
  totalLeads: number;
  newLeads: number;
  hotLeads: number;
  callsToday: number;
  followupsDueToday: number;
  followupsOverdue: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadsBySource: Record<string, number>;
  leadsByStatus: Record<string, number>;
  temperatureDistribution: { hot: number; warm: number; cold: number };
}

export interface CrmFilterParams {
  search?: string;
  status?: string;
  temperature?: string;
  source?: string;
  followupPeriod?: 'today' | 'overdue' | 'upcoming' | 'all';
  sortBy?: 'created_at' | 'next_followup_date' | 'name' | 'temperature';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const LEAD_SOURCES: LeadSource[] = [
  'Justdial',
  'IndiaMART',
  'Facebook',
  'Instagram',
  'Website',
  'Referral',
  'Walk-in',
  'Direct',
  'Other'
];

export const LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Follow-up',
  'No Answer',
  'Qualified',
  'Site Visit',
  'Quotation',
  'Converted',
  'Lost'
];

export const CALL_OUTCOMES: CallOutcome[] = [
  'Interested',
  'No Answer',
  'Busy',
  'Call Back Requested',
  'Not Interested',
  'Wrong Number',
  'Site Visit Requested',
  'Converted'
];

export const POPULAR_SERVICES = [
  'Turnkey Interior (Complete Home)',
  'Modular Kitchen',
  'Luxury Living Room & Italian Marble',
  'Master Bedroom & Wardrobes',
  'WPC Waterproof & Bathroom Doors',
  'Solid Teak Main Entrance Doors',
  'Commercial / Office Interiors',
  'Architectural Woodwork & Paneling'
];

/**
 * Standardize and clean phone numbers for accurate deduplication and dialing.
 * - Extracts only digits
 * - Strips leading +91 or 91 or 0 for standard 10-digit Indian mobile numbers
 * - Retains full digits for international numbers
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  // Remove all non-numeric characters except leading '+'
  const cleaned = raw.trim().replace(/[^\d+]/g, '');
  
  // Standard Indian 10-digit normalization
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.slice(2);
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return digitsOnly.slice(1);
  }
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }
  return digitsOnly || cleaned;
}

/**
 * Validates whether a phone number is reasonable.
 * Allows standard Indian 10-digit mobile numbers as well as international numbers (8 to 15 digits).
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return normalized.length >= 8 && normalized.length <= 15;
}

/**
 * Formats a phone number for UI display.
 */
export function formatPhoneDisplay(raw: string): string {
  const norm = normalizePhoneNumber(raw);
  if (norm.length === 10) {
    return `+91 ${norm.slice(0, 5)} ${norm.slice(5)}`;
  }
  return raw;
}

// Local storage session key
const CRM_SESSION_KEY = 'royal_epic_tele_crm_session';

export function getCrmStoredSession(): { token?: string; user?: CrmUserProfile } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CRM_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function saveCrmSession(user: CrmUserProfile, token?: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CRM_SESSION_KEY, JSON.stringify({ user, token: token || 'crm-session-valid' }));
  } catch (_) {}
}

export function clearCrmSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CRM_SESSION_KEY);
  } catch (_) {}
}

// Helper to attach authorization header
function getAuthHeaders(): HeadersInit {
  const session = getCrmStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (session?.user?.id) {
    headers['X-CRM-User-Id'] = session.user.id;
    headers['X-CRM-User-Email'] = session.user.email;
    headers['X-CRM-User-Role'] = session.user.role;
  }
  return headers;
}

/**
 * CRM API Service Client
 */
export const crmService = {
  // Authentication
  async login(email: string, pass: string): Promise<{ success: boolean; user?: CrmUserProfile; error?: string }> {
    try {
      const res = await fetch('/api/telecrm/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid CRM credentials or account not approved.' };
      }
      saveCrmSession(data.user, data.token);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection to CRM service failed.' };
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/telecrm/auth/logout', { method: 'POST', headers: getAuthHeaders() });
    } catch (_) {}
    clearCrmSession();
  },

  async getCurrentUser(): Promise<CrmUserProfile | null> {
    try {
      const res = await fetch('/api/telecrm/auth/me', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          saveCrmSession(data.user);
          return data.user;
        }
      }
    } catch (_) {}
    const local = getCrmStoredSession();
    return local?.user || null;
  },

  getCurrentUserSync(): CrmUserProfile | null {
    const local = getCrmStoredSession();
    return local?.user || null;
  },

  // Leads
  async getLeads(filters: CrmFilterParams = {}): Promise<{ leads: CrmLead[]; total: number; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'All') params.set('status', filters.status);
      if (filters.temperature && filters.temperature !== 'All') params.set('temperature', filters.temperature);
      if (filters.source && filters.source !== 'All') params.set('source', filters.source);
      if (filters.followupPeriod && filters.followupPeriod !== 'all') params.set('followupPeriod', filters.followupPeriod);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));

      const res = await fetch(`/api/telecrm/leads?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Failed to fetch leads (${res.status})`);
      }
      const data = await res.json();
      return { leads: data.leads || [], total: data.total || 0 };
    } catch (err: any) {
      console.warn('CRM leads fetch error:', err.message);
      return { leads: [], total: 0, error: err.message };
    }
  },

  async getLeadById(id: string): Promise<{ lead: CrmLead; callLogs: CrmCallLog[] } | null> {
    try {
      const res = await fetch(`/api/telecrm/leads/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('Error fetching lead details:', err);
      return null;
    }
  },

  async createLead(leadData: Partial<CrmLead>): Promise<{ success: boolean; lead?: CrmLead; error?: string; isDuplicate?: boolean }> {
    try {
      const normalizedPhone = normalizePhoneNumber(leadData.phone || '');
      if (!normalizedPhone || !isValidPhoneNumber(normalizedPhone)) {
        return { success: false, error: 'Please enter a valid phone number (at least 10 digits).' };
      }

      const res = await fetch('/api/telecrm/leads', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...leadData,
          normalized_phone: normalizedPhone
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { 
          success: false, 
          error: data.error || 'Failed to create lead',
          isDuplicate: Boolean(data.isDuplicate)
        };
      }

      return { success: true, lead: data.lead };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error saving lead' };
    }
  },

  async updateLead(id: string, updates: Partial<CrmLead>): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    try {
      if (updates.phone) {
        updates.normalized_phone = normalizePhoneNumber(updates.phone);
      }
      const res = await fetch(`/api/telecrm/leads/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update lead' };
      }
      return { success: true, lead: data.lead };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating lead' };
    }
  },

  async deleteLead(id: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/telecrm/leads/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: reason || 'Deleted by admin via CRM portal' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Unauthorized: Only admins can delete leads.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete lead' };
    }
  },

  // Calls
  async logCall(
    leadId: string, 
    callData: { 
      outcome: CallOutcome; 
      notes?: string; 
      followup_datetime?: string;
      updateStatus?: LeadStatus;
      updateTemperature?: LeadTemperature;
    }
  ): Promise<{ success: boolean; callLog?: CrmCallLog; error?: string }> {
    try {
      const res = await fetch(`/api/telecrm/leads/${encodeURIComponent(leadId)}/calls`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(callData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to log call' };
      }
      return { success: true, callLog: data.callLog };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error logging call' };
    }
  },

  // Follow-ups
  async getFollowups(): Promise<{
    dueToday: CrmLead[];
    overdue: CrmLead[];
    upcoming: CrmLead[];
    error?: string;
  }> {
    try {
      const res = await fetch('/api/telecrm/followups', { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to fetch follow-ups');
      }
      return await res.json();
    } catch (err: any) {
      return { dueToday: [], overdue: [], upcoming: [], error: err.message };
    }
  },

  // Reports
  async getDashboardStats(): Promise<CrmDashboardStats> {
    try {
      const res = await fetch('/api/telecrm/reports', { headers: getAuthHeaders() });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to load CRM stats:', err);
    }
    return {
      totalLeads: 0,
      newLeads: 0,
      hotLeads: 0,
      callsToday: 0,
      followupsDueToday: 0,
      followupsOverdue: 0,
      qualifiedLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      leadsBySource: {},
      leadsByStatus: {},
      temperatureDistribution: { hot: 0, warm: 0, cold: 0 }
    };
  },

  // CSV Import (Admin only)
  async importLeadsFromCsv(
    leadsData: Array<Record<string, any>>
  ): Promise<{ 
    success: boolean; 
    total: number; 
    imported: number; 
    skippedDuplicates: number; 
    invalidRows: number; 
    errors: string[];
  }> {
    try {
      const res = await fetch('/api/telecrm/leads/import-csv', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rows: leadsData })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          total: leadsData.length,
          imported: 0,
          skippedDuplicates: 0,
          invalidRows: leadsData.length,
          errors: [data.error || 'CSV import failed']
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        total: leadsData.length,
        imported: 0,
        skippedDuplicates: 0,
        invalidRows: leadsData.length,
        errors: [err.message || 'Network error processing CSV']
      };
    }
  },

  // Users Management (Admin only)
  async getUsers(): Promise<CrmUserProfile[]> {
    try {
      const res = await fetch('/api/telecrm/users', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.users || [];
      }
    } catch (err) {
      console.warn('Failed to fetch CRM users:', err);
    }
    return [];
  },

  async createUser(userData: { email: string; name: string; role: CrmRole; phone?: string; password?: string }): Promise<{ success: boolean; user?: CrmUserProfile; error?: string }> {
    try {
      const res = await fetch('/api/telecrm/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to create user' };
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error creating user' };
    }
  },

  async updateUserRole(userId: string, role: CrmRole, status?: 'active' | 'inactive'): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/telecrm/users/${encodeURIComponent(userId)}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role, status })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update user' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating user' };
    }
  }
};
