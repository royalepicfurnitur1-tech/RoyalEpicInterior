export type LoanNavigationTab =
  | 'dashboard'
  | 'enquiries'
  | 'add'
  | 'followups'
  | 'reports';

export const LOAN_FINANCE_PURPOSES = [
  'Home Construction Finance',
  'Home Interior Finance',
  'Home Renovation Finance',
  'Property-Related Finance',
  'Other',
] as const;

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

export interface LoanCrmStaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoanEnquiry {
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

export interface LoanCallLog {
  id: string;
  loan_enquiry_id: string;
  staff_id: string;
  staff_name: string;
  call_status: LoanCallOutcome;
  call_notes: string | null;
  next_followup_at: string | null;
  created_at: string;
}

export interface LoanActivity {
  id: string;
  loan_enquiry_id: string;
  staff_id: string | null;
  staff_name: string | null;
  action_type: string;
  description: string;
  created_at: string;
}

export interface LoanDashboardMetrics {
  total_enquiries: number;
  new_enquiries: number;
  pending_contact: number;
  followups_due: number;
  overdue_followups: number;
  contacted: number;
  under_review: number;
  converted: number;
  closed: number;
}

export interface LoanDashboardData {
  success: boolean;
  metrics: LoanDashboardMetrics;
  breakdowns: {
    by_purpose: Record<string, number>;
    by_source: Record<string, number>;
    by_status: Record<string, number>;
  };
  recent_enquiries: LoanEnquiry[];
  recent_activities: LoanActivity[];
}
