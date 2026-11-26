import { getCrmAuthHeaders } from '../crmService';
import {
  LoanCrmStaffMember,
  LoanDashboardData,
  LoanEnquiry,
  LoanCallLog,
  LoanActivity,
} from './loanTypes';

async function handleLoanApiResponse<T>(res: Response, defaultError: string): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMessage = data?.error || data?.message || defaultError;
    throw new Error(errMessage);
  }
  return data as T;
}

export async function fetchLoanCrmStaff(): Promise<{ staff: LoanCrmStaffMember[] }> {
  const res = await fetch('/api/crm/loans/staff', {
    headers: getCrmAuthHeaders(),
  });
  return handleLoanApiResponse<{ staff: LoanCrmStaffMember[] }>(res, 'Failed to fetch CRM staff list.');
}

export async function fetchLoanDashboard(): Promise<LoanDashboardData> {
  const res = await fetch('/api/crm/loans/dashboard', {
    headers: getCrmAuthHeaders(),
  });
  return handleLoanApiResponse<LoanDashboardData>(res, 'Failed to fetch Loans Dashboard metrics.');
}

export interface LoanEnquiryFilterParams {
  search?: string;
  status?: string;
  finance_purpose?: string;
  assigned_staff?: string;
  enquiry_source?: string;
  date_from?: string;
  date_to?: string;
}

export async function fetchLoanEnquiries(
  filters: LoanEnquiryFilterParams = {}
): Promise<{ success: boolean; count: number; enquiries: LoanEnquiry[] }> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status && filters.status !== 'All') params.set('status', filters.status);
  if (filters.finance_purpose && filters.finance_purpose !== 'All')
    params.set('finance_purpose', filters.finance_purpose);
  if (filters.assigned_staff && filters.assigned_staff !== 'All')
    params.set('assigned_staff', filters.assigned_staff);
  if (filters.enquiry_source && filters.enquiry_source !== 'All')
    params.set('enquiry_source', filters.enquiry_source);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/crm/loans/enquiries${qs}`, {
    headers: getCrmAuthHeaders(),
  });
  return handleLoanApiResponse<{ success: boolean; count: number; enquiries: LoanEnquiry[] }>(
    res,
    'Failed to fetch loan enquiries.'
  );
}

export async function fetchLoanEnquiryDetail(id: string): Promise<{
  success: boolean;
  enquiry: LoanEnquiry;
  call_logs: LoanCallLog[];
  activities: LoanActivity[];
  related_enquiries: Array<{
    id: string;
    enquiry_reference: string;
    finance_purpose: string;
    status: string;
    created_at: string;
  }>;
}> {
  const res = await fetch(`/api/crm/loans/enquiries/${encodeURIComponent(id)}`, {
    headers: getCrmAuthHeaders(),
  });
  return handleLoanApiResponse(res, 'Failed to fetch loan enquiry details.');
}

export async function createManualLoanEnquiry(payload: {
  customer_name: string;
  mobile_number: string;
  email?: string | null;
  city?: string | null;
  finance_purpose: string;
  approximate_amount?: string | null;
  project_details?: string | null;
  preferred_contact_time?: string;
  enquiry_source?: string;
  status?: string;
  assigned_staff?: string | null;
  next_followup_at?: string | null;
  internal_notes?: string | null;
}): Promise<{ success: boolean; enquiry: LoanEnquiry }> {
  const res = await fetch('/api/crm/loans/enquiries', {
    method: 'POST',
    headers: {
      ...getCrmAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleLoanApiResponse(res, 'Failed to create loan enquiry.');
}

export async function updateLoanEnquiry(
  id: string,
  payload: Partial<{
    status: string;
    assigned_staff: string | null;
    assigned_staff_name: string | null;
    next_followup_at: string | null;
    internal_notes: string | null;
    finance_purpose: string;
    approximate_amount: string | null;
    city: string | null;
    project_details: string | null;
    preferred_contact_time: string;
  }>
): Promise<{ success: boolean; enquiry: LoanEnquiry }> {
  const res = await fetch(`/api/crm/loans/enquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      ...getCrmAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleLoanApiResponse(res, 'Failed to update loan enquiry.');
}

export async function logLoanCall(
  id: string,
  payload: {
    call_status: string;
    call_notes?: string | null;
    next_followup_at?: string | null;
    status?: string | null;
  }
): Promise<{ success: boolean; call_log: LoanCallLog; enquiry: LoanEnquiry }> {
  const res = await fetch(`/api/crm/loans/enquiries/${encodeURIComponent(id)}/call-log`, {
    method: 'POST',
    headers: {
      ...getCrmAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleLoanApiResponse(res, 'Failed to log call.');
}

export async function fetchLoanFollowups(assignedStaff?: string): Promise<{
  success: boolean;
  overdue: LoanEnquiry[];
  today: LoanEnquiry[];
  upcoming: LoanEnquiry[];
  counts: {
    overdue: number;
    today: number;
    upcoming: number;
    total_due: number;
  };
}> {
  const qs =
    assignedStaff && assignedStaff !== 'All'
      ? `?assigned_staff=${encodeURIComponent(assignedStaff)}`
      : '';
  const res = await fetch(`/api/crm/loans/followups${qs}`, {
    headers: getCrmAuthHeaders(),
  });
  return handleLoanApiResponse(res, 'Failed to fetch loan follow-ups.');
}
