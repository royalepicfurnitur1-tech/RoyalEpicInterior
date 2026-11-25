export type PropertySubTab =
  | 'dashboard'
  | 'leads'
  | 'add-lead'
  | 'followups'
  | 'listings'
  | 'enquiries'
  | 'site-visits'
  | 'deals'
  | 'reports';

export type PropertyModuleSection = PropertySubTab;

export const RESIDENTIAL_PROPERTY_TYPES = [
  '1 BHK',
  '2 BHK',
  '3 BHK',
  '4 BHK',
  'Independent House',
  'Villa',
  'Studio Apartment'
] as const;

export const COMMERCIAL_PROPERTY_TYPES = [
  'Office Space',
  'Retail Shop',
  'Showroom',
  'Commercial Building',
  'Co-working Space',
  'Other Commercial Property'
] as const;

export const ALL_PROPERTY_TYPES = [
  ...RESIDENTIAL_PROPERTY_TYPES,
  ...COMMERCIAL_PROPERTY_TYPES
] as const;

export type PropertyCategory = 'Residential' | 'Commercial';
export type PropertyTypeOption = (typeof ALL_PROPERTY_TYPES)[number] | string;

export const PROPERTY_LEAD_SOURCES = [
  'Sales Executive',
  'Direct Owner',
  'Referral',
  'Other'
] as const;

export type PropertyLeadSource = (typeof PROPERTY_LEAD_SOURCES)[number] | string;

export const PROPERTY_LEAD_STATUSES = [
  'New Lead',
  'First Call Pending',
  'Owner Contacted',
  'Interested',
  'Details Pending',
  'Follow-up Required',
  'Verification Pending',
  'Approved',
  'Rejected',
  'Not Available'
] as const;

export type PropertyLeadStatus = (typeof PROPERTY_LEAD_STATUSES)[number];

export const PROPERTY_CALL_OUTCOMES = [
  'Connected',
  'Not Answered',
  'Switched Off',
  'Busy',
  'Call Back Requested',
  'Owner Interested',
  'Not Interested',
  'Property Already Rented',
  'Wrong Number'
] as const;

export type PropertyCallOutcome = (typeof PROPERTY_CALL_OUTCOMES)[number];

export const TENANT_CALL_OUTCOMES = [
  'Connected - Interested',
  'Connected - Site Visit Requested',
  'Connected - Negotiating Rent',
  'Connected - Follow-up Needed',
  'Connected - Not Interested',
  'Not Answered',
  'Busy / Switched Off',
  'Call Back Requested',
  'Wrong Number'
] as const;

export type TenantCallOutcome = (typeof TENANT_CALL_OUTCOMES)[number] | string;

export const PROPERTY_AMENITIES = [
  'Lift',
  'Covered Parking',
  'Open Parking',
  'Security',
  'CCTV',
  'Power Backup',
  'Water Supply',
  'Gym',
  'Swimming Pool',
  'Clubhouse',
  'Garden',
  "Children's Play Area",
  'Air Conditioning',
  'Internet',
  'Other'
] as const;

export const PROPERTY_AMENITIES_LIST = PROPERTY_AMENITIES;

export const PROPERTY_IMAGE_CATEGORIES = [
  'Exterior Photos',
  'Living Room',
  'Bedrooms',
  'Kitchen',
  'Bathrooms',
  'Balcony',
  'Other Areas',
  'To-Let Board',
  'Additional Documents'
] as const;

export type PropertyImageCategory = (typeof PROPERTY_IMAGE_CATEGORIES)[number];

export const PROPERTY_LISTING_STATUSES = [
  'Draft',
  'Details Pending',
  'Verification Pending',
  'Approved',
  'Ready to Publish',
  'Published',
  'Unpublished',
  'Temporarily On Hold',
  'Rented',
  'Occupied',
  'Unavailable',
  'Rejected',
  'Archived'
] as const;

export type PropertyListingStatus = (typeof PROPERTY_LISTING_STATUSES)[number];

export const FURNISHING_STATUSES = [
  'Fully Furnished',
  'Semi Furnished',
  'Unfurnished'
] as const;

export type FurnishingStatusOption = (typeof FURNISHING_STATUSES)[number];

// PHASE 3: PROPERTY AVAILABILITY STATUSES
export const PROPERTY_AVAILABILITY_STATUSES = [
  'Available',
  'Temporarily On Hold',
  'Site Visit in Progress',
  'Negotiation in Progress',
  'Rented',
  'Unavailable'
] as const;

export type PropertyAvailabilityStatus = (typeof PROPERTY_AVAILABILITY_STATUSES)[number];

export interface AvailabilityHistoryEntry {
  action: string;
  status: PropertyAvailabilityStatus;
  previous_status?: string;
  owner_confirmed?: boolean;
  notes?: string;
  staff_id?: string;
  staff_name?: string;
  timestamp: string;
}

export interface PublicPropertyPhoto {
  id: string;
  category: string;
  file_name?: string;
  url: string;
  is_cover?: boolean;
  caption?: string;
}

export interface PublicPropertyListing {
  id: string;
  property_id: string;
  property_code: string;
  slug: string;
  property_title: string;
  property_category: PropertyCategory;
  property_type: string;
  bhk_configuration?: string;
  bhk_type: string;
  locality: string;
  city: string;
  pin_code?: string;
  pincode: string;
  approximate_location: string;
  expected_monthly_rent: number;
  monthly_rent: number;
  security_deposit: number;
  maintenance_charges: number;
  other_charges?: string;
  rent_negotiable: boolean | 'Yes' | 'No';
  deposit_negotiable: 'Yes' | 'No';
  built_up_area: number;
  carpet_area: number;
  area_unit: string;
  furnishing_status: string;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  floor_number: string;
  total_floors: string;
  lift_available: 'Yes' | 'No';
  parking_availability: string;
  available_from_date?: string;
  available_from: string;
  preferred_tenant_type: string;
  power_backup: string;
  water_supply: string;
  facing: string;
  property_age: string;
  availability_status: string;
  accepting_enquiries?: boolean;
  property_description?: string;
  description: string;
  amenities: string[];
  listing_status: PropertyListingStatus;
  featured_image: string;
  main_image: string;
  photos: PublicPropertyPhoto[];
  images: PublicPropertyPhoto[];
  created_at: string;
  published_at?: string;
  updated_at?: string;
}

export interface PublicTenantEnquiryPayload {
  property_id: string;
  full_name: string;
  mobile_number: string;
  email?: string;
  preferred_contact_time?: string;
  preferred_visit_date?: string;
  preferred_visit_time?: string;
  number_of_occupants?: string;
  additional_requirements?: string;
  consent_to_contact: boolean;
  website_url_honeypot?: string;
}

export const TENANT_ENQUIRY_STATUSES = [
  'New Enquiry',
  'Contacted',
  'Interested',
  'Site Visit Required',
  'Site Visit Scheduled',
  'Visited',
  'Negotiation',
  'Converted',
  'Deal Completed',
  'Not Interested',
  'Lost',
  'Closed'
] as const;

export type TenantEnquiryStatus = (typeof TENANT_ENQUIRY_STATUSES)[number];

export const TENANT_ENQUIRY_SOURCES = [
  'Website',
  'Direct Call',
  'WhatsApp',
  'Walk-in',
  'Referral',
  'Property Portal',
  'Other'
] as const;

export const NEGOTIATION_STATUSES = [
  'Not Started',
  'Negotiation in Progress',
  'Awaiting Owner Confirmation',
  'Awaiting Tenant Confirmation',
  'Agreed',
  'Failed'
] as const;

export type NegotiationStatus = (typeof NEGOTIATION_STATUSES)[number];

export interface NegotiationHistoryEntry {
  id: string;
  timestamp: string;
  staff_id?: string;
  staff_name?: string;
  negotiation_status: NegotiationStatus;
  original_expected_rent?: number;
  tenant_offered_rent?: number;
  owner_expected_rent?: number;
  final_agreed_rent?: number;
  original_deposit?: number;
  final_agreed_deposit?: number;
  maintenance_charges?: number;
  notes?: string;
}

export interface EnquiryCallLogEntry {
  id: string;
  call_datetime: string;
  call_date_time?: string;
  call_outcome: string;
  call_notes?: string;
  next_followup_date?: string;
  followup_notes?: string;
  logged_by?: string;
  logged_by_name?: string;
  staff_name?: string;
}

export const SITE_VISIT_STATUSES = [
  'Scheduled',
  'Confirmed',
  'Completed',
  'Rescheduled',
  'Cancelled',
  'No Show'
] as const;

export type SiteVisitStatus = (typeof SITE_VISIT_STATUSES)[number];

export const DEAL_LIFECYCLE_STATUSES = [
  'Deal Pending',
  'Deal Confirmed',
  'Agreement in Progress',
  'Agreement Completed',
  'Tenant Moved In',
  'Deal Cancelled'
] as const;

export type DealLifecycleStatus = (typeof DEAL_LIFECYCLE_STATUSES)[number];

export const DEAL_PAYMENT_STATUSES = [
  'Pending',
  'Partially Paid',
  'Paid',
  'Cancelled'
] as const;

export type DealPaymentStatus = (typeof DEAL_PAYMENT_STATUSES)[number];

export const PAYMENT_MODES = [
  'UPI',
  'Bank Transfer',
  'NEFT / RTGS',
  'IMPS',
  'Cheque',
  'Cash',
  'Other'
] as const;

export const INTERIOR_INTEREST_OPTIONS = ['Yes', 'No', 'Follow-up'] as const;
export type InteriorInterestOption = (typeof INTERIOR_INTEREST_OPTIONS)[number];

export const INTERIOR_SERVICE_REQUIREMENTS = [
  'Home Interior',
  'Office Interior',
  'Renovation',
  'Modular Kitchen',
  'Other'
] as const;
export type InteriorServiceRequirement = (typeof INTERIOR_SERVICE_REQUIREMENTS)[number];

export interface PropertyLead {
  id: string;
  lead_code?: string;
  date_received: string;
  sales_executive_name?: string;
  telecaller_id?: string;
  telecaller_name?: string;
  owner_name: string;
  owner_mobile: string;
  normalized_owner_mobile?: string;
  alternate_mobile?: string;
  location_locality?: string;
  property_location?: string;
  property_category: PropertyCategory;
  property_type?: string;
  expected_rent?: number;
  approx_expected_rent?: number | null;
  source: PropertyLeadSource;
  initial_notes?: string;
  board_photo_url?: string;
  lead_status: PropertyLeadStatus;
  last_contact_at?: string;
  last_contact_date?: string;
  next_followup_date?: string;
  followup_notes?: string;
  owner_interested?: 'Yes' | 'No' | 'Not Sure';
  property_available?: 'Yes' | 'No' | 'Not Confirmed';
  details_collected?: 'Yes' | 'Partially' | 'No';
  property_id?: string;
  external_source_lead_id?: string;
  source_application?: string;
  original_sales_executive_id?: string;
  original_sales_executive_name?: string;
  original_submission_date?: string;
  is_archived?: boolean;
  created_by?: string;
  created_by_name?: string;
  updated_by?: string;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyCallLog {
  id: string;
  lead_id: string;
  property_id?: string;
  call_datetime: string;
  call_date_time?: string;
  call_outcome: PropertyCallOutcome;
  call_notes?: string;
  owner_interested: 'Yes' | 'No' | 'Not Sure';
  property_available: 'Yes' | 'No' | 'Not Confirmed';
  details_collected: 'Yes' | 'Partially' | 'No';
  next_followup_date?: string;
  followup_notes?: string;
  logged_by?: string;
  logged_by_name?: string;
  staff_name?: string;
  created_at: string;
}

export interface ApprovalHistoryEntry {
  action: string;
  status: PropertyListingStatus | string;
  availability_status?: PropertyAvailabilityStatus;
  previous_status?: string;
  owner_confirmed?: boolean;
  notes?: string;
  staff_id?: string;
  staff_name?: string;
  timestamp: string;
}

export interface PropertyRecord {
  id: string;
  property_code?: string;
  slug?: string;
  lead_id: string;
  property_title: string;
  property_category: PropertyCategory;
  property_type: string;
  bhk_configuration?: string;
  full_address?: string;
  full_property_address?: string;
  locality?: string;
  city: string;
  pin_code?: string;
  expected_monthly_rent: number | null;
  security_deposit: number | null;
  maintenance_charges: number | null;
  other_charges?: string;
  rent_negotiable: 'Yes' | 'No';
  deposit_negotiable: 'Yes' | 'No';
  built_up_area?: number | string;
  carpet_area?: number | string;
  furnishing_status: 'Fully Furnished' | 'Semi Furnished' | 'Unfurnished';
  bedrooms?: number | null;
  bathrooms?: number | null;
  balconies?: number | null;
  floor_number?: string;
  total_floors?: string;
  lift_available: 'Yes' | 'No';
  parking_availability?: string;
  available_from_date?: string;
  property_description?: string;
  amenities: string[];
  owner_full_name: string;
  owner_primary_mobile?: string;
  primary_mobile?: string;
  owner_alternate_mobile?: string;
  alternate_mobile?: string;
  owner_email?: string;
  email_address?: string;
  preferred_contact_time?: string;
  relationship_to_property: 'Owner' | 'Authorised Representative' | 'Other';
  owner_identity_verified: 'Yes' | 'No' | 'Pending';
  ownership_auth_confirmed?: 'Yes' | 'No' | 'Pending';
  ownership_confirmed?: 'Yes' | 'No' | 'Pending';
  availability_confirmed?: 'Yes' | 'No' | 'Pending';
  property_availability_confirmed?: 'Yes' | 'No' | 'Pending';
  permission_to_advertise: 'Yes' | 'No' | 'Pending';
  verification_notes?: string;
  verified_by?: string;
  verified_by_name?: string;
  verification_date?: string;
  listing_status: PropertyListingStatus;
  availability_status?: PropertyAvailabilityStatus;
  availability_updated_at?: string;
  availability_updated_by?: string;
  availability_notes?: string;
  availability_history?: AvailabilityHistoryEntry[];
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_by_name?: string;
  rejected_at?: string;
  rejection_reason?: string;
  approval_history: ApprovalHistoryEntry[];
  is_archived?: boolean;
  created_by?: string;
  created_by_name?: string;
  updated_by?: string;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyImageRecord {
  id: string;
  property_id?: string;
  lead_id?: string;
  category: PropertyImageCategory;
  file_name: string;
  file_url: string;
  public_url?: string | null;
  storage_path?: string;
  is_private_document: boolean;
  mime_type?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  created_at: string;
}

export interface PropertyActivityLog {
  id: string;
  lead_id?: string;
  property_id?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  action_type?: string;
  description: string;
  previous_status?: string;
  old_status?: string;
  new_status?: string;
  metadata?: Record<string, any>;
  performed_by?: string;
  performed_by_name?: string;
  staff_name?: string;
  created_at: string;
}

export interface PropertyTenantEnquiry {
  id: string;
  enquiry_code?: string;
  enquiry_date: string;
  tenant_name: string;
  mobile_number?: string;
  tenant_mobile?: string;
  normalized_mobile?: string;
  email?: string;
  tenant_email?: string;
  interested_property_id?: string | null;
  property_id?: string | null;
  property_code?: string;
  interested_property_title?: string;
  property_title?: string;
  preferred_location?: string;
  // Section 3: Tenant Requirements
  property_category?: PropertyCategory;
  property_type?: string;
  property_type_needed?: string;
  bhk_requirement?: string;
  min_budget?: number | null;
  max_budget?: number | null;
  minimum_budget?: number | null;
  maximum_budget?: number | null;
  budget?: number;
  budget_range?: string;
  furnishing_preference?: string;
  move_in_date?: string;
  parking_requirement?: string;
  family_or_company_profile?: string;
  tenant_profile?: string;
  number_of_occupants?: string | number;
  requirements?: string;
  additional_requirements?: string;
  // Assignment, Follow-up & Calls
  enquiry_source?: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  assigned_staff?: string;
  assigned_telecaller?: string;
  enquiry_status: TenantEnquiryStatus;
  next_followup_date?: string;
  followup_notes?: string;
  last_contact_date?: string;
  preferred_contact_time?: string;
  preferred_visit_date?: string;
  preferred_visit_time?: string;
  call_history?: EnquiryCallLogEntry[];
  // Section 6: Rent Negotiation
  original_expected_rent?: number | null;
  tenant_offered_rent?: number | null;
  owner_expected_rent?: number | null;
  final_agreed_rent?: number | null;
  original_deposit?: number | null;
  final_agreed_deposit?: number | null;
  maintenance_charges?: number | null;
  negotiation_notes?: string;
  negotiation_status?: NegotiationStatus;
  negotiation_history?: NegotiationHistoryEntry[];
  notes?: string;
  is_archived?: boolean;
  created_by?: string;
  created_by_name?: string;
  updated_by?: string;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SiteVisitHistoryEntry {
  timestamp: string;
  action: string;
  status: SiteVisitStatus;
  scheduled_date?: string;
  scheduled_time?: string;
  staff_name?: string;
  notes?: string;
}

export interface PropertySiteVisit {
  id: string;
  visit_code?: string;
  property_id: string;
  property_code?: string;
  property_title?: string;
  lead_id?: string;
  enquiry_id?: string | null;
  tenant_enquiry_id?: string | null;
  tenant_name: string;
  tenant_contact?: string;
  tenant_mobile?: string;
  owner_name?: string;
  owner_mobile?: string;
  scheduled_date?: string;
  visit_date?: string;
  scheduled_time?: string;
  visit_time?: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  assigned_staff?: string;
  visit_status: SiteVisitStatus;
  visit_feedback?: string;
  tenant_feedback?: string;
  owner_feedback?: string;
  followup_notes?: string;
  next_action?: string;
  reschedule_reason?: string;
  cancel_reason?: string;
  visit_number?: number;
  visit_history?: SiteVisitHistoryEntry[];
  is_archived?: boolean;
  created_by?: string;
  created_by_name?: string;
  updated_by?: string;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyDeal {
  id: string;
  deal_code?: string;
  property_id: string;
  property_code?: string;
  property_title?: string;
  lead_id?: string;
  tenant_enquiry_id?: string | null;
  enquiry_id?: string | null;
  site_visit_id?: string | null;
  owner_name: string;
  owner_mobile?: string;
  tenant_name: string;
  tenant_mobile?: string;
  tenant_email?: string;
  monthly_rent?: number;
  final_monthly_rent?: number;
  security_deposit: number;
  maintenance_charges?: number;
  deal_confirmed_date?: string;
  agreement_date?: string;
  move_in_date?: string;
  rental_duration?: string;
  final_negotiated_terms?: string;
  deal_status?: DealLifecycleStatus;
  placement_fee?: number;
  placement_fee_expected?: number;
  placement_fee_payer?: string;
  amount_due: number;
  balance_pending?: number;
  amount_received: number;
  payment_date?: string;
  payment_mode?: string;
  transaction_reference?: string;
  receipt_number?: string;
  payment_status: DealPaymentStatus;
  handled_by?: string;
  notes?: string;
  // Section 9: Interior Design Opportunity
  interior_interest?: InteriorInterestOption;
  interested_in_interior?: InteriorInterestOption | string;
  interior_service_requirement?: InteriorServiceRequirement | string;
  interior_followup_date?: string;
  interior_notes?: string;
  interior_contact_person?: 'Tenant' | 'Owner';
  linked_interior_lead_id?: string | null;
  interior_crm_lead_id?: string | null;
  payments?: PropertyPaymentRecord[];
  is_archived?: boolean;
  created_by?: string;
  created_by_name?: string;
  updated_by?: string;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyPaymentRecord {
  id: string;
  receipt_number?: string;
  deal_id: string;
  property_id?: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  transaction_reference?: string;
  payment_status: string;
  notes?: string;
  recorded_by?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface PropertyPaymentReceiptData {
  receipt_number: string;
  receipt_date: string;
  deal_id: string;
  deal_code: string;
  deal_status: string;
  property_id: string;
  property_code?: string;
  property_title: string;
  property_locality: string;
  owner_name: string;
  tenant_name: string;
  tenant_mobile: string;
  final_monthly_rent: number;
  security_deposit: number;
  agreement_date: string;
  move_in_date: string;
  placement_fee_payer: string;
  total_placement_fee: number;
  total_amount_received: number;
  current_payment_amount?: number;
  balance_due: number;
  payment_status: string;
  payment_mode?: string;
  transaction_reference?: string;
  notes?: string;
  issued_by?: string;
  company_name?: string;
  parent_brand?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  latest_payment?: {
    id: string;
    receipt_number: string;
    amount: number;
    payment_date: string;
    payment_mode: string;
    transaction_reference: string;
    notes: string;
    recorded_by_name: string;
  };
  payments: PropertyPaymentRecord[];
  generated_by: string;
  generated_at: string;
}

export interface PropertyCrmStaffMember {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: string;
}

export interface PropertyDashboardData {
  metrics: {
    totalPropertyLeads: number;
    newLeads: number;
    callsCompleted: number;
    followupsPending: number;
    followUpsPending: number;
    ownerDetailsPending: number;
    verificationPending: number;
    approvedProperties: number;
    publishedProperties: number;
    tenantEnquiries: number;
    siteVisitsScheduled: number;
    dealsCompleted: number;
    totalPlacementFeesCollected: number;
    totalPlacementFeesDue: number;
    placementFeesCollected?: number;
    placementFeesPending?: number;
    rejectedProperties: number;
    // Phase 3 Rental Operations Metrics
    newTenantEnquiries: number;
    unassignedEnquiries: number;
    followupsDueToday: number;
    followUpsDueToday?: number;
    overdueFollowups: number;
    overdueFollowUps?: number;
    siteVisitsToday: number;
    upcomingSiteVisits: number;
    negotiationsInProgress: number;
    dealsConfirmed: number;
    propertiesOnHold: number;
    propertiesRented: number;
    propertiesAvailable: number;
  };
  charts: {
    leadsByDate: Array<{ date: string; count: number }>;
    leadsByPropertyType: Array<{ type: string; propertyType: string; count: number }>;
    leadsByLocation: Array<{ location: string; count: number }>;
    leadStatusDistribution: Array<{ status: string; count: number }>;
    staffActivity: Array<{
      staffName: string;
      leadsAssigned: number;
      leadsCount: number;
      callsLogged: number;
      callsCount: number;
      enquiriesAssigned?: number;
      enquiriesFollowedUp?: number;
      siteVisitsConducted?: number;
      siteVisitsHandled?: number;
      negotiationsActive?: number;
      dealsClosed: number;
      feesCollected?: number;
      approvedProperties?: number;
    }>;
    monthlyDealsAndFees: Array<{ month: string; dealsCount: number; feesCollected: number; feesDue: number }>;
    leadsBySalesExecutive: Array<{ salesExecutive: string; count: number }>;
    propertiesByCategory: Array<{ category: string; count: number }>;
  };
  reports: {
    pendingPlacementFees: number;
    rejectedProperties: number;
    leadsBySalesExecutive: Array<{ salesExecutive: string; leads: number; approved: number }>;
    leadsByTelecaller: Array<{
      telecaller: string;
      assignedLeads: number;
      callsLogged: number;
      approvedProperties: number;
      enquiriesAssigned?: number;
      siteVisitsConducted?: number;
      siteVisitsHandled?: number;
      negotiationsActive?: number;
      dealsClosed?: number;
      feesCollected?: number;
    }>;
  };
}
