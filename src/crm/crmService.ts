import { 
  CrmLead, 
  CrmCallLog, 
  CrmDashboardMetrics, 
  CrmFilterState, 
  CrmUser, 
  LeadSource, 
  LeadStatus, 
  LeadTemperature, 
  CallOutcome 
} from './types';

// Helper to normalize phone numbers (e.g. "+91 98450-12345" -> "+919845012345" or "9845012345")
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned.slice(1)}`;
  }
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

// Validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Match standard Indian format +91 followed by 10 digits starting with 6-9
  if (/^\+91[6-9]\d{9}$/.test(normalized)) {
    return true;
  }
  // Match general international E.164 format (+ followed by 8 to 15 digits)
  if (/^\+[1-9]\d{7,14}$/.test(normalized)) {
    return true;
  }
  // Bare 10-digit number
  if (/^[6-9]\d{9}$/.test(normalized)) {
    return true;
  }
  return false;
}

// Check for duplicate phone number
export function findDuplicateLeadByPhone(leads: CrmLead[], phone: string, excludeId?: string): CrmLead | undefined {
  const normalizedTarget = normalizePhoneNumber(phone);
  return leads.find(l => {
    if (excludeId && l.id === excludeId) return false;
    return normalizePhoneNumber(l.phone) === normalizedTarget;
  });
}

// Get authorization headers from CRM session
export function getCrmAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('royal_epic_crm_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) {
          headers['Authorization'] = `Bearer ${parsed.token}`;
        }
        if (parsed?.user?.id) {
          headers['x-crm-user-id'] = parsed.user.id;
          headers['x-crm-user-role'] = parsed.user.role;
        }
      }
    }
  } catch (_) {}
  return headers;
}

// API CALLS
export async function fetchCrmLeads(filters?: Partial<CrmFilterState>): Promise<{
  leads: CrmLead[];
  total: number;
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status && filters.status !== 'All') params.set('status', filters.status);
    if (filters?.temperature && filters.temperature !== 'All') params.set('temperature', filters.temperature);
    if (filters?.source && filters.source !== 'All') params.set('source', filters.source);
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));

    const res = await fetch(`/api/crm/leads?${params.toString()}`, {
      headers: getCrmAuthHeaders()
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { leads: [], total: 0, error: errData.error || `HTTP error ${res.status}` };
    }

    const data = await res.json();
    return { leads: data.leads || [], total: data.total || 0 };
  } catch (err: any) {
    return { leads: [], total: 0, error: err.message || 'Failed to fetch leads' };
  }
}

export async function fetchCrmLeadById(id: string): Promise<{ lead?: CrmLead; error?: string }> {
  try {
    const res = await fetch(`/api/crm/leads/${encodeURIComponent(id)}`, {
      headers: getCrmAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.error || 'Failed to load lead' };
    }
    const data = await res.json();
    return { lead: data.lead };
  } catch (err: any) {
    return { error: err.message || 'Network error fetching lead' };
  }
}

export async function saveCrmLead(leadData: Partial<CrmLead>): Promise<{
  success: boolean;
  lead?: CrmLead;
  error?: string;
  isDuplicate?: boolean;
}> {
  try {
    const isEdit = Boolean(leadData.id);
    const url = isEdit ? `/api/crm/leads/${encodeURIComponent(leadData.id!)}` : '/api/crm/leads';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getCrmAuthHeaders(),
      body: JSON.stringify(leadData)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Failed to save lead',
        isDuplicate: Boolean(data.isDuplicate)
      };
    }

    return { success: true, lead: data.lead };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error saving lead' };
  }
}

export async function deleteCrmLead(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/crm/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getCrmAuthHeaders()
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to delete lead' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error deleting lead' };
  }
}

export async function fetchCrmLeadCalls(leadId: string): Promise<{
  calls: CrmCallLog[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}/calls`, {
      headers: getCrmAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { calls: [], error: err.error || 'Failed to load calls' };
    }
    const data = await res.json();
    return { calls: data.calls || [] };
  } catch (err: any) {
    return { calls: [], error: err.message || 'Network error fetching call logs' };
  }
}

export async function recordCrmCall(callPayload: {
  lead_id: string;
  outcome: CallOutcome;
  notes?: string;
  followup_date?: string;
  update_lead_status?: LeadStatus;
  update_lead_temperature?: LeadTemperature;
}): Promise<{ success: boolean; callLog?: CrmCallLog; error?: string }> {
  try {
    const res = await fetch('/api/crm/calls', {
      method: 'POST',
      headers: getCrmAuthHeaders(),
      body: JSON.stringify(callPayload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to record call' };
    }

    return { success: true, callLog: data.callLog };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error recording call' };
  }
}

export async function fetchCrmFollowups(): Promise<{
  dueToday: CrmLead[];
  overdue: CrmLead[];
  upcoming: CrmLead[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/crm/followups', {
      headers: getCrmAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { dueToday: [], overdue: [], upcoming: [], error: err.error || 'Failed to fetch followups' };
    }
    const data = await res.json();
    return {
      dueToday: data.dueToday || [],
      overdue: data.overdue || [],
      upcoming: data.upcoming || []
    };
  } catch (err: any) {
    return { dueToday: [], overdue: [], upcoming: [], error: err.message || 'Network error fetching followups' };
  }
}

export async function fetchCrmDashboardMetrics(): Promise<{
  metrics?: CrmDashboardMetrics;
  error?: string;
}> {
  try {
    const res = await fetch('/api/crm/dashboard-metrics', {
      headers: getCrmAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.error || 'Failed to load metrics' };
    }
    const data = await res.json();
    return { metrics: data.metrics };
  } catch (err: any) {
    return { error: err.message || 'Network error loading metrics' };
  }
}

export async function fetchCrmReports(periodDays: number = 30): Promise<{
  reports?: {
    bySource: Array<{ source: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    byTemperature: Array<{ temperature: string; count: number }>;
    callsByOutcome: Array<{ outcome: string; count: number }>;
    totalCalls: number;
    conversionRate: number;
  };
  error?: string;
}> {
  try {
    const res = await fetch(`/api/crm/reports?days=${periodDays}`, {
      headers: getCrmAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.error || 'Failed to load reports' };
    }
    const data = await res.json();
    return { reports: data.reports };
  } catch (err: any) {
    return { error: err.message || 'Network error loading reports' };
  }
}

export async function importCrmCsv(leads: Array<Partial<CrmLead>>): Promise<{
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; reason: string }>;
  error?: string;
}> {
  try {
    const res = await fetch('/api/crm/import-csv', {
      method: 'POST',
      headers: getCrmAuthHeaders(),
      body: JSON.stringify({ leads })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errors: data.errors || [],
        error: data.error || 'Failed to import CSV'
      };
    }
    return {
      success: true,
      importedCount: data.importedCount || 0,
      skippedCount: data.skippedCount || 0,
      errors: data.errors || []
    };
  } catch (err: any) {
    return {
      success: false,
      importedCount: 0,
      skippedCount: 0,
      errors: [],
      error: err.message || 'Network error during CSV import'
    };
  }
}

export async function fetchCrmUsers(): Promise<{ users: CrmUser[]; error?: string }> {
  try {
    const res = await fetch('/api/crm/users', {
      headers: getCrmAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { users: [], error: err.error || 'Failed to fetch CRM users' };
    }
    const data = await res.json();
    return { users: data.users || [] };
  } catch (err: any) {
    return { users: [], error: err.message || 'Network error fetching users' };
  }
}

export async function updateCrmUserRole(userId: string, role: 'admin' | 'telecaller'): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/crm/users/role', {
      method: 'POST',
      headers: getCrmAuthHeaders(),
      body: JSON.stringify({ userId, role })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update user role' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating user role' };
  }
}
