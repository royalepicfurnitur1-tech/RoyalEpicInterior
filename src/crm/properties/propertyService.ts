import { getCrmAuthHeaders } from '../crmService';
import {
  PropertyLead,
  PropertyCallLog,
  PropertyRecord,
  PropertyImageRecord,
  PropertyImageCategory,
  PropertyActivityLog,
  PropertyTenantEnquiry,
  PropertySiteVisit,
  PropertyDeal,
  PropertyPaymentRecord,
  PropertyDashboardData,
  PropertyListingStatus,
  PropertyAvailabilityStatus,
  PropertyCrmStaffMember,
  PropertyPaymentReceiptData,
  NegotiationStatus
} from './propertyTypes';

async function handleApiResponse<T>(res: Response, defaultError: string): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMessage = data?.error || data?.message || defaultError;
    const err: any = new Error(errMessage);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data as T;
}

export async function fetchPropertyDashboard(
  startDate?: string,
  endDate?: string,
  assignedStaff?: string
): Promise<PropertyDashboardData> {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (assignedStaff && assignedStaff !== 'All') params.set('assignedStaff', assignedStaff);
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/crm/properties/dashboard${query}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse<PropertyDashboardData>(res, 'Failed to fetch Property Dashboard metrics.');
}

export async function fetchPropertyCrmStaff(): Promise<{ staff: PropertyCrmStaffMember[] }> {
  const res = await fetch('/api/crm/properties/staff', {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse<{ staff: PropertyCrmStaffMember[] }>(res, 'Failed to fetch CRM staff list.');
}

export async function fetchPropertyListingById(propertyId: string): Promise<{
  property: PropertyRecord;
  lead: PropertyLead | null;
  images: PropertyImageRecord[];
  enquiries: PropertyTenantEnquiry[];
  siteVisits: PropertySiteVisit[];
  deals: PropertyDeal[];
  activities: PropertyActivityLog[];
}> {
  const res = await fetch(`/api/crm/properties/listings/${encodeURIComponent(propertyId)}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse(res, 'Failed to fetch property listing detail.');
}

export async function updatePropertyAvailability(
  propertyId: string,
  payload: {
    availability_status: PropertyAvailabilityStatus;
    notes?: string;
    owner_confirmed?: boolean;
  }
): Promise<{ property: PropertyRecord }> {
  const res = await fetch(`/api/crm/properties/listings/${encodeURIComponent(propertyId)}/availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ property: PropertyRecord }>(
    res,
    'Failed to update property availability status.'
  );
}

export async function fetchPropertyLeads(filters: Record<string, string> = {}): Promise<{
  leads: PropertyLead[];
  total: number;
}> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== 'All') params.set(k, v);
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/crm/properties/leads${query}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse<{ leads: PropertyLead[]; total: number }>(res, 'Failed to fetch property leads.');
}

export async function fetchPropertyLeadDetail(leadId: string): Promise<{
  lead: PropertyLead;
  property: PropertyRecord | null;
  calls: PropertyCallLog[];
  images: PropertyImageRecord[];
  activities: PropertyActivityLog[];
}> {
  const res = await fetch(`/api/crm/properties/leads/${encodeURIComponent(leadId)}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse(res, 'Failed to fetch property lead details.');
}

export async function createPropertyLead(
  payload: Partial<PropertyLead> & { allowDuplicateOwnerMobile?: boolean }
): Promise<{ lead: PropertyLead }> {
  const res = await fetch('/api/crm/properties/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ lead: PropertyLead }>(res, 'Failed to create property lead.');
}

export async function updatePropertyLead(
  leadId: string,
  payload: Partial<PropertyLead> & { status_note?: string }
): Promise<{ lead: PropertyLead }> {
  const res = await fetch(`/api/crm/properties/leads/${encodeURIComponent(leadId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ lead: PropertyLead }>(res, 'Failed to update property lead.');
}

export async function archivePropertyLead(leadId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/crm/properties/leads/${encodeURIComponent(leadId)}`, {
    method: 'DELETE',
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse<{ success: boolean }>(res, 'Failed to archive property lead.');
}

export async function logPropertyOwnerCall(
  leadId: string,
  payload: Partial<PropertyCallLog>
): Promise<{ callLog: PropertyCallLog; lead: PropertyLead }> {
  const res = await fetch(`/api/crm/properties/leads/${encodeURIComponent(leadId)}/calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ callLog: PropertyCallLog; lead: PropertyLead }>(
    res,
    'Failed to save owner call & follow-up.'
  );
}

export async function fetchPropertyFollowups(): Promise<{
  dueToday: PropertyLead[];
  overdue: PropertyLead[];
  upcoming: PropertyLead[];
  followUpRequired: PropertyLead[];
  recentCalls: PropertyCallLog[];
}> {
  const res = await fetch('/api/crm/properties/followups', {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse(res, 'Failed to fetch owner follow-ups.');
}

export async function fetchPropertyListings(filters: Record<string, string> = {}): Promise<{
  properties: (PropertyRecord & { images?: PropertyImageRecord[] })[];
  total: number;
}> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== 'All') params.set(k, v);
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/crm/properties/listings${query}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse(res, 'Failed to fetch property listings.');
}

export async function saveCompletePropertyDetails(
  leadId: string,
  payload: Partial<PropertyRecord>
): Promise<{ property: PropertyRecord; isNew: boolean }> {
  const res = await fetch(`/api/crm/properties/leads/${encodeURIComponent(leadId)}/property`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ property: PropertyRecord; isNew: boolean }>(
    res,
    'Failed to save complete property details.'
  );
}

export async function reviewPropertyListing(
  propertyId: string,
  listing_status: PropertyListingStatus,
  notes?: string
): Promise<{ property: PropertyRecord }> {
  const res = await fetch(`/api/crm/properties/listings/${encodeURIComponent(propertyId)}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify({ listing_status, notes })
  });
  return handleApiResponse<{ property: PropertyRecord }>(res, 'Failed to update property listing status.');
}

export async function uploadPropertyMedia(payload: {
  property_id?: string;
  lead_id?: string;
  category: PropertyImageCategory;
  file_name: string;
  file_data: string;
  mime_type?: string;
  is_private_document?: boolean;
}): Promise<{ image: PropertyImageRecord }> {
  const res = await fetch('/api/crm/properties/media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ image: PropertyImageRecord }>(res, 'Failed to upload property media.');
}

export async function deletePropertyMedia(imageId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/crm/properties/media/${encodeURIComponent(imageId)}`, {
    method: 'DELETE',
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse<{ success: boolean }>(res, 'Failed to delete property media.');
}

export async function fetchPrivateOwnerDocument(imageId: string): Promise<{
  id: string;
  file_name: string;
  mime_type: string;
  data_url: string;
}> {
  const res = await fetch(`/api/crm/properties/documents/${encodeURIComponent(imageId)}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse(res, 'Failed to fetch private owner document.');
}

export async function fetchTenantEnquiries(filters: Record<string, string> = {}): Promise<{
  enquiries: PropertyTenantEnquiry[];
  total: number;
}> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== 'All') params.set(k, v);
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/crm/properties/enquiries${query}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse(res, 'Failed to fetch tenant enquiries.');
}

export async function fetchTenantEnquiryDetail(id: string): Promise<{
  enquiry: PropertyTenantEnquiry;
  property: PropertyRecord | null;
  siteVisits: PropertySiteVisit[];
  deals: PropertyDeal[];
  activities: PropertyActivityLog[];
}> {
  const res = await fetch(`/api/crm/properties/enquiries/${encodeURIComponent(id)}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse(res, 'Failed to fetch complete tenant enquiry detail.');
}

export async function createTenantEnquiry(
  payload: Partial<PropertyTenantEnquiry>
): Promise<{ enquiry: PropertyTenantEnquiry }> {
  const res = await fetch('/api/crm/properties/enquiries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ enquiry: PropertyTenantEnquiry }>(res, 'Failed to create tenant enquiry.');
}

export async function updateTenantEnquiry(
  id: string,
  payload: Partial<PropertyTenantEnquiry>
): Promise<{ enquiry: PropertyTenantEnquiry }> {
  const res = await fetch(`/api/crm/properties/enquiries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ enquiry: PropertyTenantEnquiry }>(res, 'Failed to update tenant enquiry.');
}

export async function logTenantEnquiryCall(
  enquiryId: string,
  payload: {
    call_outcome: string;
    call_notes: string;
    next_followup_date?: string | null;
    enquiry_status?: string;
    staff_name?: string;
  }
): Promise<{ enquiry: PropertyTenantEnquiry; callLog: any }> {
  const res = await fetch(`/api/crm/properties/enquiries/${encodeURIComponent(enquiryId)}/calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse(res, 'Failed to log tenant call.');
}

export async function saveTenantEnquiryNegotiation(
  enquiryId: string,
  payload: {
    original_expected_rent?: number | null;
    tenant_offered_rent?: number | null;
    owner_expected_rent?: number | null;
    final_agreed_rent?: number | null;
    original_deposit?: number | null;
    final_agreed_deposit?: number | null;
    maintenance_charges?: number | null;
    negotiation_notes?: string;
    negotiation_status?: NegotiationStatus;
  }
): Promise<{ enquiry: PropertyTenantEnquiry }> {
  const res = await fetch(`/api/crm/properties/enquiries/${encodeURIComponent(enquiryId)}/negotiation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ enquiry: PropertyTenantEnquiry }>(
    res,
    'Failed to save rent negotiation update.'
  );
}

export async function fetchPropertySiteVisits(filters: Record<string, string> = {}): Promise<{
  visits: PropertySiteVisit[];
  total: number;
}> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== 'All') params.set(k, v);
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/crm/properties/site-visits${query}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse(res, 'Failed to fetch site visits.');
}

export async function createPropertySiteVisit(
  payload: Partial<PropertySiteVisit>
): Promise<{ visit: PropertySiteVisit }> {
  const res = await fetch('/api/crm/properties/site-visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ visit: PropertySiteVisit }>(res, 'Failed to schedule site visit.');
}

export async function updatePropertySiteVisit(
  id: string,
  payload: Partial<PropertySiteVisit>
): Promise<{ visit: PropertySiteVisit }> {
  const res = await fetch(`/api/crm/properties/site-visits/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ visit: PropertySiteVisit }>(res, 'Failed to update site visit.');
}

export async function fetchPropertyDeals(filters: Record<string, string> = {}): Promise<{
  deals: (PropertyDeal & { payments?: PropertyPaymentRecord[] })[];
  total: number;
}> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== 'All') params.set(k, v);
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/crm/properties/deals${query}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse(res, 'Failed to fetch deals & payments.');
}

export async function createPropertyDeal(
  payload: Partial<PropertyDeal>
): Promise<{ deal: PropertyDeal }> {
  const res = await fetch('/api/crm/properties/deals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ deal: PropertyDeal }>(res, 'Failed to create property deal.');
}

export async function updatePropertyDeal(
  id: string,
  payload: Partial<PropertyDeal>
): Promise<{ deal: PropertyDeal }> {
  const res = await fetch(`/api/crm/properties/deals/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ deal: PropertyDeal }>(res, 'Failed to update property deal.');
}

export async function recordDealPayment(
  dealId: string,
  payload: {
    amount: number;
    payment_date?: string;
    payment_mode: string;
    transaction_reference?: string;
    receipt_number?: string;
    payment_status?: 'Completed' | 'Pending' | 'Cancelled';
    notes?: string;
  }
): Promise<{ payment: PropertyPaymentRecord; deal: PropertyDeal }> {
  const res = await fetch(`/api/crm/properties/deals/${encodeURIComponent(dealId)}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCrmAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleApiResponse<{ payment: PropertyPaymentRecord; deal: PropertyDeal }>(
    res,
    'Failed to record deal payment.'
  );
}

export async function updateDealPaymentStatus(
  dealId: string,
  paymentId: string,
  payload: {
    payment_status?: 'Completed' | 'Pending' | 'Cancelled';
    notes?: string;
    transaction_reference?: string;
  }
): Promise<{ payment: PropertyPaymentRecord; deal: PropertyDeal }> {
  const res = await fetch(
    `/api/crm/properties/deals/${encodeURIComponent(dealId)}/payments/${encodeURIComponent(paymentId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getCrmAuthHeaders()
      },
      body: JSON.stringify(payload)
    }
  );
  return handleApiResponse(res, 'Failed to update payment status.');
}

export async function fetchDealReceipt(
  dealId: string,
  paymentId?: string
): Promise<{ receipt: PropertyPaymentReceiptData }> {
  const query = paymentId ? `?paymentId=${encodeURIComponent(paymentId)}` : '';
  const res = await fetch(`/api/crm/properties/deals/${encodeURIComponent(dealId)}/receipt${query}`, {
    headers: getCrmAuthHeaders()
  });
  return handleApiResponse<{ receipt: PropertyPaymentReceiptData }>(
    res,
    'Failed to generate payment receipt.'
  );
}

export async function convertDealToInteriorCrmLead(
  dealId: string,
  payload: {
    interested_in_interior?: string;
    interior_service_requirement?: string;
    interior_followup_date?: string;
    interior_notes?: string;
    assigned_staff?: string;
    confirm_create?: boolean;
  }
): Promise<{
  duplicate: boolean;
  created: boolean;
  existingLead?: any;
  lead?: any;
  message: string;
  deal: PropertyDeal;
}> {
  const res = await fetch(
    `/api/crm/properties/deals/${encodeURIComponent(dealId)}/convert-interior`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getCrmAuthHeaders()
      },
      body: JSON.stringify(payload)
    }
  );
  return handleApiResponse(res, 'Failed to create Interior CRM enquiry.');
}

