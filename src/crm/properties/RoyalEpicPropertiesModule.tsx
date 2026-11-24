import React, { useState, useEffect } from 'react';
import {
  PropertyModuleSection,
  PropertyLead,
  PropertyRecord,
  PropertyCallLog,
  PropertyTenantEnquiry,
  PropertySiteVisit,
  PropertyDeal,
  PropertyDashboardData,
  PropertyCategory,
  PropertyLeadSource,
  PropertyLeadStatus,
  PropertyListingStatus,
  TenantEnquiryStatus,
  SiteVisitStatus,
  DealPaymentStatus,
  PROPERTY_LEAD_SOURCES,
  PROPERTY_LEAD_STATUSES,
  PROPERTY_LISTING_STATUSES,
  RESIDENTIAL_PROPERTY_TYPES,
  COMMERCIAL_PROPERTY_TYPES,
  ALL_PROPERTY_TYPES,
  TENANT_ENQUIRY_STATUSES,
  SITE_VISIT_STATUSES,
  DEAL_PAYMENT_STATUSES,
  PAYMENT_MODES
} from './propertyTypes';
import {
  fetchPropertyDashboard,
  fetchPropertyLeads,
  createPropertyLead,
  fetchPropertyFollowups,
  fetchPropertyListings,
  reviewPropertyListing,
  fetchTenantEnquiries,
  createTenantEnquiry,
  updateTenantEnquiry,
  fetchPropertySiteVisits,
  createPropertySiteVisit,
  updatePropertySiteVisit,
  fetchPropertyDeals,
  createPropertyDeal,
  updatePropertyDeal,
  recordDealPayment,
  uploadPropertyMedia
} from './propertyService';
import { PropertyLeadDetailModal } from './PropertyLeadDetailModal';
import {
  Building2,
  LayoutDashboard,
  Users,
  PlusCircle,
  CalendarClock,
  UserCheck,
  MapPin,
  IndianRupee,
  BarChart3,
  Search,
  Phone,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  ShieldCheck,
  FileText,
  Calendar,
  ArrowRight,
  Clock
} from 'lucide-react';

interface RoyalEpicPropertiesModuleProps {
  activeSection: PropertyModuleSection;
  onChangeSection: (section: PropertyModuleSection) => void;
  currentUserName: string;
}

export const RoyalEpicPropertiesModule: React.FC<RoyalEpicPropertiesModuleProps> = ({
  activeSection,
  onChangeSection,
  currentUserName
}) => {
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Dashboard & Reports data
  const [dashboardData, setDashboardData] = useState<PropertyDashboardData | null>(null);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Leads state
  const [leads, setLeads] = useState<PropertyLead[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('All');
  const [leadTypeFilter, setLeadTypeFilter] = useState('All');
  const [leadStaffFilter, setLeadStaffFilter] = useState('');
  const [leadDateFilter, setLeadDateFilter] = useState('');

  // Selected Lead Workspace Modal
  const [workspaceLeadId, setWorkspaceLeadId] = useState<string | null>(null);
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState<
    'overview' | 'calling' | 'property' | 'media' | 'history'
  >('overview');

  // Add Property Lead Form State
  const [submittingLead, setSubmittingLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    date_received: new Date().toISOString().slice(0, 10),
    sales_executive_name: '',
    telecaller_name: currentUserName,
    owner_name: '',
    owner_mobile: '',
    alternate_mobile: '',
    property_location: '',
    property_category: 'Residential' as PropertyCategory,
    property_type: '2 BHK',
    approx_expected_rent: '',
    source: 'Sales Executive' as PropertyLeadSource,
    initial_notes: '',
    board_photo_url: '',
    external_source_lead_id: '',
    source_application: 'Manual Entry',
    original_sales_executive_id: '',
    original_submission_date: '',
    allowDuplicateOwnerMobile: false
  });
  const [boardPhotoData, setBoardPhotoData] = useState<{ name: string; dataUrl: string; mime: string } | null>(null);

  // Follow-ups state
  const [followupsData, setFollowupsData] = useState<{
    dueToday: PropertyLead[];
    overdue: PropertyLead[];
    upcoming: PropertyLead[];
    followUpRequired: PropertyLead[];
    recentCalls: PropertyCallLog[];
  }>({
    dueToday: [],
    overdue: [],
    upcoming: [],
    followUpRequired: [],
    recentCalls: []
  });
  const [followupTab, setFollowupTab] = useState<'today' | 'overdue' | 'upcoming' | 'required' | 'calls'>('today');

  // Listings state
  const [listings, setListings] = useState<PropertyRecord[]>([]);
  const [listingStatusFilter, setListingStatusFilter] = useState('All');
  const [listingSearch, setListingSearch] = useState('');
  const [reviewModalProp, setReviewModalProp] = useState<PropertyRecord | null>(null);
  const [reviewTargetStatus, setReviewTargetStatus] = useState<PropertyListingStatus>('Approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Tenant Enquiries state
  const [enquiries, setEnquiries] = useState<PropertyTenantEnquiry[]>([]);
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('All');
  const [enquirySearch, setEnquirySearch] = useState('');
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<PropertyTenantEnquiry | null>(null);
  const [enquiryForm, setEnquiryForm] = useState<Partial<PropertyTenantEnquiry>>({});
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

  // Site Visits state
  const [siteVisits, setSiteVisits] = useState<PropertySiteVisit[]>([]);
  const [visitStatusFilter, setVisitStatusFilter] = useState('All');
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<PropertySiteVisit | null>(null);
  const [visitForm, setVisitForm] = useState<Partial<PropertySiteVisit>>({});
  const [submittingVisit, setSubmittingVisit] = useState(false);

  // Deals & Payments state
  const [deals, setDeals] = useState<PropertyDeal[]>([]);
  const [dealStatusFilter, setDealStatusFilter] = useState('All');
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<PropertyDeal | null>(null);
  const [dealForm, setDealForm] = useState<Partial<PropertyDeal>>({});
  const [submittingDeal, setSubmittingDeal] = useState(false);

  const [paymentModalDeal, setPaymentModalDeal] = useState<PropertyDeal | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: 'UPI',
    transaction_reference: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setErrorBanner(null);
    setTimeout(() => setSuccessBanner(null), 4500);
  };

  const loadSectionData = async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      if (activeSection === 'dashboard' || activeSection === 'reports') {
        const dash = await fetchPropertyDashboard(
          activeSection === 'reports' ? reportStartDate : undefined,
          activeSection === 'reports' ? reportEndDate : undefined
        );
        setDashboardData(dash);
      }
      if (activeSection === 'leads' || activeSection === 'dashboard') {
        const res = await fetchPropertyLeads({
          search: leadSearch,
          lead_status: leadStatusFilter,
          property_type: leadTypeFilter,
          assigned_staff: leadStaffFilter,
          date_received: leadDateFilter
        });
        setLeads(res.leads || []);
      }
      if (activeSection === 'followups') {
        const fw = await fetchPropertyFollowups();
        setFollowupsData(fw);
      }
      if (
        activeSection === 'listings' ||
        activeSection === 'enquiries' ||
        activeSection === 'site-visits' ||
        activeSection === 'deals'
      ) {
        const lst = await fetchPropertyListings({
          listing_status: activeSection === 'listings' ? listingStatusFilter : 'All',
          search: activeSection === 'listings' ? listingSearch : ''
        });
        setListings(lst.properties || []);
      }
      if (activeSection === 'enquiries' || activeSection === 'site-visits' || activeSection === 'deals') {
        const enq = await fetchTenantEnquiries({
          enquiry_status: activeSection === 'enquiries' ? enquiryStatusFilter : 'All',
          search: activeSection === 'enquiries' ? enquirySearch : ''
        });
        setEnquiries(enq.enquiries || []);
      }
      if (activeSection === 'site-visits') {
        const sv = await fetchPropertySiteVisits({
          visit_status: visitStatusFilter
        });
        setSiteVisits(sv.visits || []);
      }
      if (activeSection === 'deals') {
        const dl = await fetchPropertyDeals({
          payment_status: dealStatusFilter
        });
        setDeals(dl.deals || []);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to load data from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSectionData();
  }, [
    activeSection,
    leadStatusFilter,
    leadTypeFilter,
    listingStatusFilter,
    enquiryStatusFilter,
    visitStatusFilter,
    dealStatusFilter
  ]);

  const handleBoardPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBoardPhotoData({
          name: file.name,
          dataUrl: reader.result,
          mime: file.type || 'image/jpeg'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingLead) return;
    setSubmittingLead(true);
    setErrorBanner(null);
    try {
      const payload: any = {
        ...newLeadForm,
        approx_expected_rent: newLeadForm.approx_expected_rent
          ? Number(newLeadForm.approx_expected_rent)
          : null
      };
      const res = await createPropertyLead(payload);
      if (boardPhotoData) {
        await uploadPropertyMedia({
          lead_id: res.lead.id,
          category: 'Exterior Photos',
          file_name: boardPhotoData.name,
          file_data: boardPhotoData.dataUrl,
          mime_type: boardPhotoData.mime,
          is_private_document: false
        });
      }
      showSuccess(`Property Lead ${res.lead.lead_code} saved to Supabase.`);
      setNewLeadForm({
        date_received: new Date().toISOString().slice(0, 10),
        sales_executive_name: '',
        telecaller_name: currentUserName,
        owner_name: '',
        owner_mobile: '',
        alternate_mobile: '',
        property_location: '',
        property_category: 'Residential',
        property_type: '2 BHK',
        approx_expected_rent: '',
        source: 'Sales Executive',
        initial_notes: '',
        board_photo_url: '',
        external_source_lead_id: '',
        source_application: 'Manual Entry',
        original_sales_executive_id: '',
        original_submission_date: '',
        allowDuplicateOwnerMobile: false
      });
      setBoardPhotoData(null);
      onChangeSection('leads');
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to create property lead.');
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleReviewListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalProp || submittingReview) return;
    setSubmittingReview(true);
    setErrorBanner(null);
    try {
      const res = await reviewPropertyListing(reviewModalProp.id, reviewTargetStatus, reviewNotes);
      showSuccess(
        `Listing ${res.property.property_code} updated to "${res.property.listing_status}".`
      );
      setReviewModalProp(null);
      setReviewNotes('');
      await loadSectionData();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to update property listing approval.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSaveEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingEnquiry) return;
    setSubmittingEnquiry(true);
    setErrorBanner(null);
    try {
      if (editingEnquiry) {
        const res = await updateTenantEnquiry(editingEnquiry.id, enquiryForm);
        showSuccess(`Tenant Enquiry ${res.enquiry.enquiry_code} updated.`);
      } else {
        const res = await createTenantEnquiry(enquiryForm);
        showSuccess(`Tenant Enquiry ${res.enquiry.enquiry_code} created.`);
      }
      setEnquiryModalOpen(false);
      setEditingEnquiry(null);
      await loadSectionData();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to save tenant enquiry.');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const handleSaveSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingVisit) return;
    setSubmittingVisit(true);
    setErrorBanner(null);
    try {
      if (editingVisit) {
        const res = await updatePropertySiteVisit(editingVisit.id, visitForm);
        showSuccess(`Site Visit ${res.visit.visit_code} updated.`);
      } else {
        const res = await createPropertySiteVisit(visitForm);
        showSuccess(`Site Visit ${res.visit.visit_code} scheduled.`);
      }
      setVisitModalOpen(false);
      setEditingVisit(null);
      await loadSectionData();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to save site visit.');
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingDeal) return;
    setSubmittingDeal(true);
    setErrorBanner(null);
    try {
      if (editingDeal) {
        const res = await updatePropertyDeal(editingDeal.id, dealForm);
        showSuccess(`Deal ${res.deal.deal_code} updated.`);
      } else {
        const res = await createPropertyDeal(dealForm);
        showSuccess(`Deal ${res.deal.deal_code} created.`);
      }
      setDealModalOpen(false);
      setEditingDeal(null);
      await loadSectionData();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to save deal.');
    } finally {
      setSubmittingDeal(false);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalDeal || submittingPayment) return;
    setSubmittingPayment(true);
    setErrorBanner(null);
    try {
      const res = await recordDealPayment(paymentModalDeal.id, {
        amount: Number(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_mode: paymentForm.payment_mode,
        transaction_reference: paymentForm.transaction_reference,
        notes: paymentForm.notes
      });
      showSuccess(
        `Payment of ₹${Number(paymentForm.amount).toLocaleString('en-IN')} recorded. Deal status: ${res.deal.payment_status}.`
      );
      setPaymentModalDeal(null);
      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().slice(0, 10),
        payment_mode: 'UPI',
        transaction_reference: '',
        notes: ''
      });
      await loadSectionData();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to record payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleExportReportsCsv = () => {
    if (!dashboardData) return;
    const rows: string[][] = [
      ['Royal Epic Properties - CRM Summary Report'],
      ['Generated At', new Date().toISOString()],
      ['Date Range', `${reportStartDate || 'All Time'} to ${reportEndDate || 'Present'}`],
      [],
      ['KPI Metric', 'Value'],
      ['Total Property Leads', String(dashboardData.metrics.totalPropertyLeads)],
      ['New Leads', String(dashboardData.metrics.newLeads)],
      ['Calls Completed', String(dashboardData.metrics.callsCompleted)],
      ['Follow-ups Pending', String(dashboardData.metrics.followUpsPending)],
      ['Owner Details Pending', String(dashboardData.metrics.ownerDetailsPending)],
      ['Verification Pending', String(dashboardData.metrics.verificationPending)],
      ['Approved Properties', String(dashboardData.metrics.approvedProperties)],
      ['Published Properties', String(dashboardData.metrics.publishedProperties)],
      ['Tenant Enquiries', String(dashboardData.metrics.tenantEnquiries)],
      ['Site Visits Scheduled', String(dashboardData.metrics.siteVisitsScheduled)],
      ['Deals Completed', String(dashboardData.metrics.dealsCompleted)],
      ['Total Placement Fees Collected (INR)', String(dashboardData.metrics.totalPlacementFeesCollected)],
      ['Pending Placement Fees (INR)', String(dashboardData.reports.pendingPlacementFees)],
      [],
      ['Sales Executive Performance', 'Leads Submitted', 'Approved Properties'],
      ...dashboardData.reports.leadsBySalesExecutive.map(r => [
        r.salesExecutive,
        String(r.leads),
        String(r.approved)
      ]),
      [],
      ['Telecaller Performance', 'Assigned Leads', 'Calls Logged', 'Approved Properties'],
      ...dashboardData.reports.leadsByTelecaller.map(r => [
        r.telecaller,
        String(r.assignedLeads),
        String(r.callsLogged),
        String(r.approvedProperties)
      ]),
      [],
      ['Leads by Property Type', 'Count'],
      ...dashboardData.charts.leadsByPropertyType.map(r => [r.propertyType, String(r.count)]),
      [],
      ['Leads by Location', 'Count'],
      ...dashboardData.charts.leadsByLocation.map(r => [r.location, String(r.count)])
    ];

    const csvContent = rows
      .map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `royal-epic-properties-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems: { id: PropertyModuleSection; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Property Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Property Leads', icon: Users },
    { id: 'add-lead', label: 'Add Property Lead', icon: PlusCircle },
    { id: 'followups', label: 'Owner Follow-ups', icon: CalendarClock },
    { id: 'listings', label: 'Property Listings', icon: Building2 },
    { id: 'enquiries', label: 'Tenant Enquiries', icon: UserCheck },
    { id: 'site-visits', label: 'Site Visits', icon: MapPin },
    { id: 'deals', label: 'Deals & Payments', icon: IndianRupee },
    { id: 'reports', label: 'Property Reports', icon: BarChart3 }
  ];

  const availableAddTypes =
    newLeadForm.property_category === 'Commercial'
      ? COMMERCIAL_PROPERTY_TYPES
      : RESIDENTIAL_PROPERTY_TYPES;

  return (
    <div className="space-y-5">
      {/* Brand Banner & Module Navigation Bar */}
      <div className="bg-[#FAF8F5] border border-[#E5DEC9] rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-[#3D2E18] via-[#5C4728] to-[#3D2E18] px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B48E55] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              REP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Royal Epic Properties
                </h2>
                <span className="px-2 py-0.5 rounded bg-white/15 text-amber-200 text-[10px] font-semibold uppercase tracking-wider">
                  Phase 1 CRM Module
                </span>
              </div>
              <p className="text-xs text-amber-100/85">
                A vertical of Royal Epic Interiors • Property Lead Verification, Listings, Tenant Visits & Placement Deals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeSection('add-lead')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#B48E55] hover:bg-[#9E7A43] text-white text-xs font-semibold transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Property Lead</span>
            </button>
            <button
              onClick={loadSectionData}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 9 Section Sub-navigation */}
        <div className="bg-[#F3EFE6] px-3 py-2 border-t border-[#E5DEC9] flex items-center gap-1 overflow-x-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-[#3D2E18] text-white shadow-xs'
                    : 'text-[#5C4728] hover:bg-[#E5DEC9]/60 hover:text-[#3D2E18]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Alerts */}
      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="font-bold text-rose-700">✕</button>
        </div>
      )}

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 1: PROPERTY DASHBOARD */}
      {/* ===================================================================== */}
      {activeSection === 'dashboard' && dashboardData && (
        <div className="space-y-5">
          {/* 12 Real-time KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {[
              { label: 'Total Property Leads', value: dashboardData.metrics.totalPropertyLeads, section: 'leads' },
              { label: 'New Leads', value: dashboardData.metrics.newLeads, section: 'leads' },
              { label: 'Calls Completed', value: dashboardData.metrics.callsCompleted, section: 'followups' },
              { label: 'Follow-ups Pending', value: dashboardData.metrics.followUpsPending, section: 'followups' },
              { label: 'Owner Details Pending', value: dashboardData.metrics.ownerDetailsPending, section: 'leads' },
              { label: 'Verification Pending', value: dashboardData.metrics.verificationPending, section: 'listings' },
              { label: 'Approved Properties', value: dashboardData.metrics.approvedProperties, section: 'listings' },
              { label: 'Published Properties', value: dashboardData.metrics.publishedProperties, section: 'listings' },
              { label: 'Tenant Enquiries', value: dashboardData.metrics.tenantEnquiries, section: 'enquiries' },
              { label: 'Site Visits Scheduled', value: dashboardData.metrics.siteVisitsScheduled, section: 'site-visits' },
              { label: 'Deals Completed', value: dashboardData.metrics.dealsCompleted, section: 'deals' },
              {
                label: 'Placement Fees Collected',
                value: `₹${dashboardData.metrics.totalPlacementFeesCollected.toLocaleString('en-IN')}`,
                section: 'deals',
                highlight: true
              }
            ].map((kpi, idx) => (
              <div
                key={idx}
                onClick={() => onChangeSection(kpi.section as PropertyModuleSection)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  kpi.highlight
                    ? 'bg-[#3D2E18] text-white border-[#3D2E18]'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#3D2E18] border-[#E5DEC9]'
                }`}
              >
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    kpi.highlight ? 'text-amber-200' : 'text-[#6E5A3E]'
                  }`}
                >
                  {kpi.label}
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1.5">
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>

          {/* 6 Charts & Summaries Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Lead Status Distribution */}
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                Lead Status Distribution
              </h3>
              {dashboardData.charts.leadStatusDistribution.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No property leads recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {dashboardData.charts.leadStatusDistribution.map(item => {
                    const max = Math.max(1, dashboardData.metrics.totalPropertyLeads);
                    const pct = Math.round((item.count / max) * 100);
                    return (
                      <div key={item.status} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium text-[#3D2E18]">
                          <span>{item.status}</span>
                          <span className="font-mono font-semibold">{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#F3EFE6] overflow-hidden">
                          <div
                            className="h-full bg-[#8C6B38] rounded-full"
                            style={{ width: `${Math.max(6, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Leads by Property Type */}
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                Leads by Property Type
              </h3>
              {dashboardData.charts.leadsByPropertyType.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No property type data yet.</p>
              ) : (
                <div className="space-y-2">
                  {dashboardData.charts.leadsByPropertyType.map(item => (
                    <div
                      key={item.propertyType}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#EFEAD8] text-xs"
                    >
                      <span className="font-medium text-[#3D2E18]">{item.propertyType}</span>
                      <span className="px-2 py-0.5 rounded bg-[#3D2E18] text-white font-mono text-[11px] font-semibold">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Leads by Location */}
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                Leads by Locality / Location
              </h3>
              {dashboardData.charts.leadsByLocation.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No location breakdown yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {dashboardData.charts.leadsByLocation.map(item => (
                    <div
                      key={item.location}
                      className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EFEAD8] flex items-center justify-between text-xs"
                    >
                      <span className="truncate font-medium text-[#3D2E18]">{item.location}</span>
                      <span className="font-mono font-bold text-[#8C6B38] ml-2">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Staff-wise Property Lead Activity */}
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                Staff-wise Property Lead Activity
              </h3>
              {dashboardData.charts.staffActivity.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No staff activity recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#EFEAD8] text-[#6E5A3E]">
                        <th className="py-2">Staff Member</th>
                        <th className="py-2 text-right">Leads Handled</th>
                        <th className="py-2 text-right">Calls Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.charts.staffActivity.map(st => (
                        <tr key={st.staffName} className="border-b border-[#FAF8F5]">
                          <td className="py-2 font-semibold text-[#3D2E18]">{st.staffName}</td>
                          <td className="py-2 text-right font-mono">{st.leadsCount}</td>
                          <td className="py-2 text-right font-mono">{st.callsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 5. Leads Received by Date */}
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                Leads Received by Date
              </h3>
              {dashboardData.charts.leadsByDate.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No daily lead data yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {dashboardData.charts.leadsByDate.map(d => (
                    <div
                      key={d.date}
                      className="flex items-center justify-between px-3 py-1.5 rounded bg-[#FAF8F5] text-xs"
                    >
                      <span className="font-mono text-[#5C4728]">{d.date}</span>
                      <span className="font-mono font-bold text-[#3D2E18]">{d.count} leads</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Monthly Completed Deals & Fees */}
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                Monthly Completed Deals & Placement Fees
              </h3>
              {dashboardData.charts.monthlyDealsAndFees.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No deals recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#EFEAD8] text-[#6E5A3E]">
                        <th className="py-2">Month</th>
                        <th className="py-2 text-right">Deals Closed</th>
                        <th className="py-2 text-right">Fees Collected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.charts.monthlyDealsAndFees.map(m => (
                        <tr key={m.month} className="border-b border-[#FAF8F5]">
                          <td className="py-2 font-mono font-semibold text-[#3D2E18]">{m.month}</td>
                          <td className="py-2 text-right font-mono">{m.dealsCount}</td>
                          <td className="py-2 text-right font-mono font-bold text-emerald-700">
                            ₹{m.feesCollected.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: PROPERTY LEADS */}
      {/* ===================================================================== */}
      {activeSection === 'leads' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={leadSearch}
                onChange={e => setLeadSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadSectionData()}
                placeholder="Search Owner Name, Mobile, Lead ID, Location..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              />
            </div>

            <select
              value={leadStatusFilter}
              onChange={e => setLeadStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
            >
              <option value="All">All Lead Statuses</option>
              {PROPERTY_LEAD_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <select
              value={leadTypeFilter}
              onChange={e => setLeadTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
            >
              <option value="All">All Property Types</option>
              {ALL_PROPERTY_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <input
              type="text"
              value={leadStaffFilter}
              onChange={e => setLeadStaffFilter(e.target.value)}
              placeholder="Filter by Staff Name..."
              className="px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
            />

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={leadDateFilter}
                onChange={e => setLeadDateFilter(e.target.value)}
                className="flex-1 px-2.5 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              />
              <button
                onClick={loadSectionData}
                className="px-3 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>

          {/* Property Leads Table */}
          <div className="bg-white border border-[#E5DEC9] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F3EFE6] text-[#5C4728] uppercase text-[11px] font-bold border-b border-[#E5DEC9]">
                  <tr>
                    <th className="py-3 px-3.5">Lead ID</th>
                    <th className="py-3 px-3.5">Owner Name</th>
                    <th className="py-3 px-3.5">Mobile Number</th>
                    <th className="py-3 px-3.5">Location</th>
                    <th className="py-3 px-3.5">Property Type</th>
                    <th className="py-3 px-3.5 text-right">Expected Rent</th>
                    <th className="py-3 px-3.5">Sales Exec</th>
                    <th className="py-3 px-3.5">Telecaller</th>
                    <th className="py-3 px-3.5">Lead Status</th>
                    <th className="py-3 px-3.5">Last Contact</th>
                    <th className="py-3 px-3.5">Next Follow-up</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAD8]">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-[#6E5A3E]">
                        No property leads found. Click "Add Property Lead" to enter leads collected by Sales Executives.
                      </td>
                    </tr>
                  ) : (
                    leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-[#FAF8F5] transition">
                        <td className="py-3 px-3.5 font-mono font-bold text-[#5C4728]">
                          {lead.lead_code}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-[#3D2E18]">
                          {lead.owner_name || '—'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[#3D2E18]">
                          {lead.owner_mobile}
                        </td>
                        <td className="py-3 px-3.5 text-[#5C4728]">
                          {lead.property_location || '—'}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded bg-[#F3EFE6] text-[#3D2E18] font-medium">
                            {lead.property_type}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-semibold text-[#3D2E18]">
                          {lead.approx_expected_rent
                            ? `₹${Number(lead.approx_expected_rent).toLocaleString('en-IN')}`
                            : '—'}
                        </td>
                        <td className="py-3 px-3.5 text-[#5C4728]">
                          {lead.sales_executive_name || '—'}
                        </td>
                        <td className="py-3 px-3.5 text-[#5C4728]">
                          {lead.telecaller_name || '—'}
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                              lead.lead_status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : lead.lead_status === 'Rejected' || lead.lead_status === 'Not Available'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {lead.lead_status}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500">
                          {lead.last_contact_date ? lead.last_contact_date.slice(0, 10) : '—'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-[#8C6B38] font-semibold">
                          {lead.next_followup_date ? lead.next_followup_date.slice(0, 10) : '—'}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => {
                              setWorkspaceLeadId(lead.id);
                              setWorkspaceInitialTab('calling');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#8C6B38] hover:bg-[#5C4728] text-white text-[11px] font-semibold cursor-pointer"
                            title="Call & Follow-up"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </button>
                          <button
                            onClick={() => {
                              setWorkspaceLeadId(lead.id);
                              setWorkspaceInitialTab('property');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F3EFE6] hover:bg-[#E5DEC9] text-[#3D2E18] text-[11px] font-semibold cursor-pointer"
                            title="Complete Property Details & Verification"
                          >
                            <Building2 className="w-3 h-3" />
                            <span>Property</span>
                          </button>
                          <button
                            onClick={() => {
                              setWorkspaceLeadId(lead.id);
                              setWorkspaceInitialTab('overview');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3D2E18] text-white text-[11px] font-semibold cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Open</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 3: ADD PROPERTY LEAD */}
      {/* ===================================================================== */}
      {activeSection === 'add-lead' && (
        <form
          onSubmit={handleCreateLeadSubmit}
          className="bg-white border border-[#E5DEC9] rounded-2xl p-5 sm:p-6 space-y-6 max-w-4xl mx-auto"
        >
          <div className="border-b border-[#EFEAD8] pb-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-[#3D2E18]">
                Manual Property Lead Entry (From Sales Executives)
              </h3>
              <p className="text-xs text-[#6E5A3E]">
                Partial details are allowed during initial entry. Complete property specifications can be filled after contacting the owner.
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-[#F3EFE6] text-[#5C4728] font-mono text-xs font-semibold">
              Property Lead ID: Auto-Generated Unique (REP-L-...)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Date Received
              </label>
              <input
                type="date"
                value={newLeadForm.date_received}
                onChange={e => setNewLeadForm({ ...newLeadForm, date_received: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Sales Executive Name
              </label>
              <input
                type="text"
                value={newLeadForm.sales_executive_name}
                onChange={e => setNewLeadForm({ ...newLeadForm, sales_executive_name: e.target.value })}
                placeholder="Name of Field Sales Executive"
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Telecaller Name
              </label>
              <input
                type="text"
                value={newLeadForm.telecaller_name}
                onChange={e => setNewLeadForm({ ...newLeadForm, telecaller_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Owner Name
              </label>
              <input
                type="text"
                value={newLeadForm.owner_name}
                onChange={e => setNewLeadForm({ ...newLeadForm, owner_name: e.target.value })}
                placeholder="Property Owner Name (or To-Let Owner)"
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Owner Mobile Number *
              </label>
              <input
                type="text"
                required
                value={newLeadForm.owner_mobile}
                onChange={e => setNewLeadForm({ ...newLeadForm, owner_mobile: e.target.value })}
                placeholder="10-digit Mobile Number"
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Alternate Mobile Number
              </label>
              <input
                type="text"
                value={newLeadForm.alternate_mobile}
                onChange={e => setNewLeadForm({ ...newLeadForm, alternate_mobile: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Property Location / Locality
              </label>
              <input
                type="text"
                value={newLeadForm.property_location}
                onChange={e => setNewLeadForm({ ...newLeadForm, property_location: e.target.value })}
                placeholder="e.g., Indiranagar, HSR Layout, Whitefield"
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Property Category
              </label>
              <select
                value={newLeadForm.property_category}
                onChange={e => {
                  const cat = e.target.value as PropertyCategory;
                  setNewLeadForm({
                    ...newLeadForm,
                    property_category: cat,
                    property_type:
                      cat === 'Commercial'
                        ? COMMERCIAL_PROPERTY_TYPES[0]
                        : RESIDENTIAL_PROPERTY_TYPES[1]
                  });
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Property Type
              </label>
              <select
                value={newLeadForm.property_type}
                onChange={e => setNewLeadForm({ ...newLeadForm, property_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              >
                {availableAddTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Approximate Expected Rent (₹/month)
              </label>
              <input
                type="number"
                value={newLeadForm.approx_expected_rent}
                onChange={e => setNewLeadForm({ ...newLeadForm, approx_expected_rent: e.target.value })}
                placeholder="Optional at initial entry"
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Lead Source
              </label>
              <select
                value={newLeadForm.source}
                onChange={e =>
                  setNewLeadForm({ ...newLeadForm, source: e.target.value as PropertyLeadSource })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              >
                {PROPERTY_LEAD_SOURCES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                To-Let Board / Property Photo (If Available)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBoardPhotoSelect}
                className="w-full text-xs text-[#3D2E18] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F3EFE6] file:text-[#3D2E18]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Initial Notes
            </label>
            <textarea
              rows={3}
              value={newLeadForm.initial_notes}
              onChange={e => setNewLeadForm({ ...newLeadForm, initial_notes: e.target.value })}
              placeholder="Landmark, board details, or remarks shared by the sales executive..."
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
            />
          </div>

          {/* Section 16: Future Integration Preparation Fields */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5C4728]">
              Future Sales Executive App Integration Metadata (Optional)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6E5A3E] mb-1">
                  External Source Lead ID
                </label>
                <input
                  type="text"
                  value={newLeadForm.external_source_lead_id}
                  onChange={e =>
                    setNewLeadForm({ ...newLeadForm, external_source_lead_id: e.target.value })
                  }
                  placeholder="e.g. SE-APP-1042"
                  className="w-full px-2.5 py-1.5 rounded border border-[#D8CEB8] bg-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6E5A3E] mb-1">
                  Source Application
                </label>
                <input
                  type="text"
                  value={newLeadForm.source_application}
                  onChange={e =>
                    setNewLeadForm({ ...newLeadForm, source_application: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-[#D8CEB8] bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6E5A3E] mb-1">
                  Original Sales Executive ID
                </label>
                <input
                  type="text"
                  value={newLeadForm.original_sales_executive_id}
                  onChange={e =>
                    setNewLeadForm({ ...newLeadForm, original_sales_executive_id: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-[#D8CEB8] bg-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6E5A3E] mb-1">
                  Original Submission Date
                </label>
                <input
                  type="date"
                  value={newLeadForm.original_submission_date}
                  onChange={e =>
                    setNewLeadForm({ ...newLeadForm, original_submission_date: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-[#D8CEB8] bg-white text-xs"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-[#5C4728] pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={newLeadForm.allowDuplicateOwnerMobile}
                onChange={e =>
                  setNewLeadForm({ ...newLeadForm, allowDuplicateOwnerMobile: e.target.checked })
                }
              />
              <span>
                Owner has multiple properties (Allow creating another property lead with the same owner mobile number)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onChangeSection('leads')}
              className="px-4 py-2.5 rounded-lg border border-[#D8CEB8] text-xs font-semibold text-[#5C4728] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingLead}
              className="px-6 py-2.5 rounded-lg bg-[#3D2E18] hover:bg-[#5C4728] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {submittingLead ? 'Saving to Supabase...' : 'Create Property Lead'}
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* SECTION 4: OWNER FOLLOW-UPS */}
      {/* ===================================================================== */}
      {activeSection === 'followups' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'today', label: `Due Today (${followupsData.dueToday.length})` },
              { id: 'overdue', label: `Overdue (${followupsData.overdue.length})` },
              { id: 'upcoming', label: `Upcoming (${followupsData.upcoming.length})` },
              { id: 'required', label: `Follow-up Required (${followupsData.followUpRequired.length})` },
              { id: 'calls', label: `Recent Owner Call Logs (${followupsData.recentCalls.length})` }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFollowupTab(t.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  followupTab === t.id
                    ? 'bg-[#3D2E18] text-white'
                    : 'bg-white border border-[#E5DEC9] text-[#5C4728]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {followupTab === 'calls' ? (
            <div className="bg-white border border-[#E5DEC9] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F3EFE6] text-[#5C4728] uppercase text-[11px] font-bold border-b border-[#E5DEC9]">
                  <tr>
                    <th className="py-3 px-4">Call Date & Time</th>
                    <th className="py-3 px-4">Call Outcome</th>
                    <th className="py-3 px-4">Interested</th>
                    <th className="py-3 px-4">Available</th>
                    <th className="py-3 px-4">Details Collected</th>
                    <th className="py-3 px-4">Call Notes</th>
                    <th className="py-3 px-4">Next Follow-up</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAD8]">
                  {followupsData.recentCalls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[#6E5A3E]">
                        No owner calls logged yet.
                      </td>
                    </tr>
                  ) : (
                    followupsData.recentCalls.map(c => (
                      <tr key={c.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-3 px-4 font-mono">
                          {new Date(c.call_date_time).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#3D2E18]">{c.call_outcome}</td>
                        <td className="py-3 px-4">{c.owner_interested}</td>
                        <td className="py-3 px-4">{c.property_available}</td>
                        <td className="py-3 px-4">{c.details_collected}</td>
                        <td className="py-3 px-4 max-w-xs truncate">{c.call_notes || '—'}</td>
                        <td className="py-3 px-4 font-mono text-[#8C6B38]">
                          {c.next_followup_date || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setWorkspaceLeadId(c.lead_id);
                              setWorkspaceInitialTab('calling');
                            }}
                            className="px-2.5 py-1 rounded bg-[#3D2E18] text-white text-[11px] font-semibold cursor-pointer"
                          >
                            Open Lead
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-[#E5DEC9] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F3EFE6] text-[#5C4728] uppercase text-[11px] font-bold border-b border-[#E5DEC9]">
                  <tr>
                    <th className="py-3 px-4">Lead ID</th>
                    <th className="py-3 px-4">Owner Name</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Location & Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Next Follow-up Date</th>
                    <th className="py-3 px-4">Follow-up Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAD8]">
                  {(followupTab === 'today'
                    ? followupsData.dueToday
                    : followupTab === 'overdue'
                    ? followupsData.overdue
                    : followupTab === 'upcoming'
                    ? followupsData.upcoming
                    : followupsData.followUpRequired
                  ).map(lead => (
                    <tr key={lead.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-4 font-mono font-bold text-[#5C4728]">
                        {lead.lead_code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#3D2E18]">{lead.owner_name}</td>
                      <td className="py-3 px-4 font-mono">{lead.owner_mobile}</td>
                      <td className="py-3 px-4">
                        {lead.property_location} • {lead.property_type}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#8C6B38]">{lead.lead_status}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#3D2E18]">
                        {lead.next_followup_date ? lead.next_followup_date.slice(0, 10) : 'Pending'}
                      </td>
                      <td className="py-3 px-4 text-[#6E5A3E]">
                        {lead.followup_notes || lead.initial_notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setWorkspaceLeadId(lead.id);
                            setWorkspaceInitialTab('calling');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#8C6B38] text-white text-xs font-semibold cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Log Owner Call</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 5: PROPERTY LISTINGS & APPROVAL MANAGEMENT */}
      {/* ===================================================================== */}
      {activeSection === 'listings' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={listingSearch}
                  onChange={e => setListingSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadSectionData()}
                  placeholder="Search Property Code, Title, Owner, Locality..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <select
                value={listingStatusFilter}
                onChange={e => setListingStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
              >
                <option value="All">All Listing Statuses</option>
                {PROPERTY_LISTING_STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-[#6E5A3E] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#8C6B38]" />
              <span>Approval requires complete verification & owner advertising permission</span>
            </div>
          </div>

          <div className="bg-white border border-[#E5DEC9] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F3EFE6] text-[#5C4728] uppercase text-[11px] font-bold border-b border-[#E5DEC9]">
                  <tr>
                    <th className="py-3 px-4">Property Code</th>
                    <th className="py-3 px-4">Property Title & Locality</th>
                    <th className="py-3 px-4">Category / Type</th>
                    <th className="py-3 px-4 text-right">Monthly Rent</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Verification Gate</th>
                    <th className="py-3 px-4">Listing Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAD8]">
                  {listings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#6E5A3E]">
                        No complete property records created yet. Open any Property Lead and save "Complete Property Details" to create a listing record.
                      </td>
                    </tr>
                  ) : (
                    listings.map(prop => {
                      const verified =
                        prop.owner_identity_verified === 'Yes' &&
                        prop.ownership_confirmed === 'Yes' &&
                        prop.property_availability_confirmed === 'Yes' &&
                        prop.permission_to_advertise === 'Yes';

                      return (
                        <tr key={prop.id} className="hover:bg-[#FAF8F5]">
                          <td className="py-3 px-4 font-mono font-bold text-[#5C4728]">
                            {prop.property_code}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#3D2E18]">{prop.property_title}</div>
                            <div className="text-[11px] text-[#6E5A3E]">
                              {prop.locality}, {prop.city}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {prop.property_category} • {prop.property_type}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-[#3D2E18]">
                            {prop.expected_monthly_rent
                              ? `₹${Number(prop.expected_monthly_rent).toLocaleString('en-IN')}`
                              : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-[#3D2E18]">{prop.owner_full_name}</div>
                            <div className="font-mono text-[11px] text-slate-500">
                              {prop.primary_mobile}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                verified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {verified ? 'Verified & Permitted' : 'Verification Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded bg-[#3D2E18] text-white text-[11px] font-semibold">
                              {prop.listing_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => {
                                setWorkspaceLeadId(prop.lead_id);
                                setWorkspaceInitialTab('property');
                              }}
                              className="px-2.5 py-1 rounded bg-[#F3EFE6] hover:bg-[#E5DEC9] text-[#3D2E18] text-[11px] font-semibold cursor-pointer"
                            >
                              Edit Details
                            </button>
                            <button
                              onClick={() => {
                                setReviewModalProp(prop);
                                setReviewTargetStatus(prop.listing_status);
                                setReviewNotes('');
                              }}
                              className="px-2.5 py-1 rounded bg-[#8C6B38] hover:bg-[#5C4728] text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Review / Approve
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 6: TENANT ENQUIRIES */}
      {/* ===================================================================== */}
      {activeSection === 'enquiries' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={enquirySearch}
                onChange={e => setEnquirySearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadSectionData()}
                placeholder="Search Tenant Name, Mobile, Enquiry ID, Location..."
                className="w-full max-w-sm px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              />
              <select
                value={enquiryStatusFilter}
                onChange={e => setEnquiryStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              >
                <option value="All">All Enquiry Statuses</option>
                {TENANT_ENQUIRY_STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingEnquiry(null);
                setEnquiryForm({
                  enquiry_date: new Date().toISOString().slice(0, 10),
                  tenant_name: '',
                  tenant_mobile: '',
                  tenant_email: '',
                  property_id: listings[0]?.id || '',
                  preferred_location: '',
                  property_type_needed: '2 BHK',
                  budget_range: '',
                  move_in_date: '',
                  family_or_company_profile: '',
                  assigned_telecaller: currentUserName,
                  enquiry_status: 'New Enquiry',
                  notes: ''
                });
                setEnquiryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Tenant Enquiry</span>
            </button>
          </div>

          <div className="bg-white border border-[#E5DEC9] rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F3EFE6] text-[#5C4728] uppercase text-[11px] font-bold border-b border-[#E5DEC9]">
                <tr>
                  <th className="py-3 px-4">Enquiry ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Tenant Name & Mobile</th>
                  <th className="py-3 px-4">Linked Property</th>
                  <th className="py-3 px-4">Preferred Location & Type</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Telecaller</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAD8]">
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#6E5A3E]">
                      No tenant enquiries recorded yet.
                    </td>
                  </tr>
                ) : (
                  enquiries.map(enq => (
                    <tr key={enq.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-4 font-mono font-bold text-[#5C4728]">
                        {enq.enquiry_code}
                      </td>
                      <td className="py-3 px-4 font-mono">{enq.enquiry_date}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#3D2E18]">{enq.tenant_name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{enq.tenant_mobile}</div>
                      </td>
                      <td className="py-3 px-4 text-[#5C4728]">
                        {enq.property_title || 'General Requirement'}
                      </td>
                      <td className="py-3 px-4">
                        {enq.preferred_location} • {enq.property_type_needed}
                      </td>
                      <td className="py-3 px-4 font-mono">{enq.budget_range || '—'}</td>
                      <td className="py-3 px-4">{enq.assigned_telecaller}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-[11px]">
                          {enq.enquiry_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingEnquiry(enq);
                            setEnquiryForm({ ...enq });
                            setEnquiryModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-[#3D2E18] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Edit / Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 7: SITE VISITS */}
      {/* ===================================================================== */}
      {activeSection === 'site-visits' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 flex items-center justify-between gap-3">
            <select
              value={visitStatusFilter}
              onChange={e => setVisitStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
            >
              <option value="All">All Site Visit Statuses</option>
              {SITE_VISIT_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setEditingVisit(null);
                setVisitForm({
                  property_id: listings[0]?.id || '',
                  tenant_enquiry_id: enquiries[0]?.id || '',
                  tenant_name: enquiries[0]?.tenant_name || '',
                  tenant_mobile: enquiries[0]?.tenant_mobile || '',
                  visit_date: new Date().toISOString().slice(0, 10),
                  visit_time: '11:00 AM',
                  assigned_staff: currentUserName,
                  visit_status: 'Scheduled',
                  visit_feedback: '',
                  owner_feedback: '',
                  next_action: ''
                });
                setVisitModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Schedule Site Visit</span>
            </button>
          </div>

          <div className="bg-white border border-[#E5DEC9] rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F3EFE6] text-[#5C4728] uppercase text-[11px] font-bold border-b border-[#E5DEC9]">
                <tr>
                  <th className="py-3 px-4">Visit ID</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Staff</th>
                  <th className="py-3 px-4">Visit Status</th>
                  <th className="py-3 px-4">Tenant / Owner Feedback</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAD8]">
                {siteVisits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#6E5A3E]">
                      No site visits scheduled yet.
                    </td>
                  </tr>
                ) : (
                  siteVisits.map(v => (
                    <tr key={v.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-4 font-mono font-bold text-[#5C4728]">
                        {v.visit_code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#3D2E18]">
                        {v.property_title || v.property_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#3D2E18]">{v.tenant_name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{v.tenant_mobile}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {v.visit_date} • {v.visit_time}
                      </td>
                      <td className="py-3 px-4">{v.assigned_staff}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#F3EFE6] text-[#3D2E18] font-semibold">
                          {v.visit_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        {v.visit_feedback || v.owner_feedback || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingVisit(v);
                            setVisitForm({ ...v });
                            setVisitModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-[#3D2E18] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Update Visit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 8: DEALS & PLACEMENT FEE PAYMENTS */}
      {/* ===================================================================== */}
      {activeSection === 'deals' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 flex items-center justify-between gap-3">
            <select
              value={dealStatusFilter}
              onChange={e => setDealStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
            >
              <option value="All">All Payment Statuses</option>
              {DEAL_PAYMENT_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <button
              onClick={() => {
                const firstProp = listings[0];
                setEditingDeal(null);
                setDealForm({
                  property_id: firstProp?.id || '',
                  owner_name: firstProp?.owner_full_name || '',
                  tenant_name: enquiries[0]?.tenant_name || '',
                  final_monthly_rent: firstProp?.expected_monthly_rent || 25000,
                  security_deposit: firstProp?.security_deposit || 100000,
                  deal_confirmed_date: new Date().toISOString().slice(0, 10),
                  agreement_date: new Date().toISOString().slice(0, 10),
                  move_in_date: new Date().toISOString().slice(0, 10),
                  placement_fee_expected: firstProp?.expected_monthly_rent || 25000,
                  amount_received: 0,
                  payment_mode: 'UPI',
                  payment_date: new Date().toISOString().slice(0, 10),
                  transaction_reference: '',
                  handled_by: currentUserName,
                  notes: ''
                });
                setDealModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Completed Deal</span>
            </button>
          </div>

          <div className="bg-white border border-[#E5DEC9] rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F3EFE6] text-[#5C4728] uppercase text-[11px] font-bold border-b border-[#E5DEC9]">
                <tr>
                  <th className="py-3 px-4">Deal ID</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Owner / Tenant</th>
                  <th className="py-3 px-4 text-right">Final Rent</th>
                  <th className="py-3 px-4 text-right">Fee Expected</th>
                  <th className="py-3 px-4 text-right">Received</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAD8]">
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#6E5A3E]">
                      No rental deals recorded yet.
                    </td>
                  </tr>
                ) : (
                  deals.map(d => (
                    <tr key={d.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-4 font-mono font-bold text-[#5C4728]">
                        {d.deal_code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#3D2E18]">
                        {d.property_title || d.property_id}
                      </td>
                      <td className="py-3 px-4">
                        <div>Owner: <strong>{d.owner_name}</strong></div>
                        <div>Tenant: <strong>{d.tenant_name}</strong></div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        ₹{Number(d.final_monthly_rent || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ₹{Number(d.placement_fee_expected || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{Number(d.amount_received || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                        ₹{Number(d.amount_due || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            d.payment_status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.payment_status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {d.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => setPaymentModalDeal(d)}
                          className="px-2.5 py-1 rounded bg-[#8C6B38] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          + Payment
                        </button>
                        <button
                          onClick={() => {
                            setEditingDeal(d);
                            setDealForm({ ...d });
                            setDealModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-[#3D2E18] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 9: PROPERTY REPORTS */}
      {/* ===================================================================== */}
      {activeSection === 'reports' && dashboardData && (
        <div className="space-y-5">
          {/* Date Filters & CSV Export */}
          <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-[11px] font-semibold text-[#6E5A3E] mb-0.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={e => setReportStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6E5A3E] mb-0.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={e => setReportEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>
              <button
                onClick={loadSectionData}
                className="mt-4 px-4 py-1.5 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer"
              >
                Apply Date Filter
              </button>
            </div>

            <button
              onClick={handleExportReportsCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8C6B38] hover:bg-[#5C4728] text-white text-xs font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Property Report (CSV)</span>
            </button>
          </div>

          {/* Financial & Operational Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4">
              <div className="text-[11px] font-semibold uppercase text-[#6E5A3E]">
                Total Leads Received
              </div>
              <div className="text-2xl font-bold font-mono text-[#3D2E18] mt-1">
                {dashboardData.metrics.totalPropertyLeads}
              </div>
            </div>
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4">
              <div className="text-[11px] font-semibold uppercase text-[#6E5A3E]">
                Approved / Rejected
              </div>
              <div className="text-2xl font-bold font-mono text-[#3D2E18] mt-1">
                {dashboardData.metrics.approvedProperties} / {dashboardData.reports.rejectedProperties}
              </div>
            </div>
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4">
              <div className="text-[11px] font-semibold uppercase text-[#6E5A3E]">
                Placement Fees Collected
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                ₹{dashboardData.metrics.totalPlacementFeesCollected.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4">
              <div className="text-[11px] font-semibold uppercase text-[#6E5A3E]">
                Pending Placement Fees
              </div>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
                ₹{dashboardData.reports.pendingPlacementFees.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leads by Sales Executive */}
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                Leads by Sales Executive
              </h3>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#EFEAD8] text-[#6E5A3E]">
                    <th className="py-2">Sales Executive</th>
                    <th className="py-2 text-right">Leads Submitted</th>
                    <th className="py-2 text-right">Approved Listings</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.reports.leadsBySalesExecutive.map(r => (
                    <tr key={r.salesExecutive} className="border-b border-[#FAF8F5]">
                      <td className="py-2 font-semibold text-[#3D2E18]">{r.salesExecutive}</td>
                      <td className="py-2 text-right font-mono">{r.leads}</td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-700">
                        {r.approved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Leads & Calls by Telecaller */}
            <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                Leads & Calls by Telecaller
              </h3>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#EFEAD8] text-[#6E5A3E]">
                    <th className="py-2">Telecaller</th>
                    <th className="py-2 text-right">Assigned Leads</th>
                    <th className="py-2 text-right">Calls Completed</th>
                    <th className="py-2 text-right">Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.reports.leadsByTelecaller.map(r => (
                    <tr key={r.telecaller} className="border-b border-[#FAF8F5]">
                      <td className="py-2 font-semibold text-[#3D2E18]">{r.telecaller}</td>
                      <td className="py-2 text-right font-mono">{r.assignedLeads}</td>
                      <td className="py-2 text-right font-mono">{r.callsLogged}</td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-700">
                        {r.approvedProperties}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODALS: LEAD WORKSPACE, LISTING REVIEW, ENQUIRY, VISIT, DEAL, PAYMENT */}
      {/* ===================================================================== */}
      <PropertyLeadDetailModal
        leadId={workspaceLeadId}
        isOpen={Boolean(workspaceLeadId)}
        initialTab={workspaceInitialTab}
        currentUserName={currentUserName}
        onClose={() => setWorkspaceLeadId(null)}
        onUpdated={loadSectionData}
      />

      {/* Listing Approval & Review Modal */}
      {reviewModalProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <form
            onSubmit={handleReviewListingSubmit}
            className="bg-white border border-[#E5DEC9] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#3D2E18]">
                  Review & Approve Property Listing ({reviewModalProp.property_code})
                </h3>
                <p className="text-xs text-[#6E5A3E]">{reviewModalProp.property_title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalProp(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] text-xs space-y-1.5">
              <div className="font-bold text-[#5C4728]">Verification Checklist Status:</div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>Owner Identity: <strong>{reviewModalProp.owner_identity_verified}</strong></div>
                <div>Ownership Confirmed: <strong>{reviewModalProp.ownership_confirmed}</strong></div>
                <div>Availability Confirmed: <strong>{reviewModalProp.property_availability_confirmed}</strong></div>
                <div>Permission to Advertise: <strong>{reviewModalProp.permission_to_advertise}</strong></div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                New Listing Status
              </label>
              <select
                value={reviewTargetStatus}
                onChange={e => setReviewTargetStatus(e.target.value as PropertyListingStatus)}
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
              >
                {PROPERTY_LISTING_STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Review / Approval / Rejection Notes
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Enter approval remarks or reason for rejection/hold..."
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              />
            </div>

            {Array.isArray(reviewModalProp.approval_history) &&
              reviewModalProp.approval_history.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto border-t border-[#EFEAD8] pt-2">
                  <div className="text-[11px] font-bold uppercase text-[#6E5A3E]">
                    Approval Audit History
                  </div>
                  {reviewModalProp.approval_history.map((h, i) => (
                    <div key={i} className="text-[11px] bg-[#FAF8F5] p-2 rounded border border-[#EFEAD8]">
                      <strong>{h.action}</strong> by {h.staff_name} on{' '}
                      {new Date(h.timestamp).toLocaleString()}
                      {h.notes ? ` — ${h.notes}` : ''}
                    </div>
                  ))}
                </div>
              )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalProp(null)}
                className="px-4 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {submittingReview ? 'Saving...' : 'Confirm Status Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tenant Enquiry Create/Edit Modal */}
      {enquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <form
            onSubmit={handleSaveEnquiry}
            className="bg-white border border-[#E5DEC9] rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-3">
              <h3 className="text-sm font-bold text-[#3D2E18]">
                {editingEnquiry ? `Edit Tenant Enquiry (${editingEnquiry.enquiry_code})` : 'Add Tenant Enquiry'}
              </h3>
              <button type="button" onClick={() => setEnquiryModalOpen(false)}>✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  required
                  value={enquiryForm.tenant_name || ''}
                  onChange={e => setEnquiryForm({ ...enquiryForm, tenant_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Tenant Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={enquiryForm.tenant_mobile || ''}
                  onChange={e => setEnquiryForm({ ...enquiryForm, tenant_mobile: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={enquiryForm.tenant_email || ''}
                  onChange={e => setEnquiryForm({ ...enquiryForm, tenant_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Property Interested In
                </label>
                <select
                  value={enquiryForm.property_id || ''}
                  onChange={e => {
                    const p = listings.find(x => x.id === e.target.value);
                    setEnquiryForm({
                      ...enquiryForm,
                      property_id: e.target.value || null,
                      property_title: p?.property_title || ''
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                >
                  <option value="">General Requirement (Any Matching Property)</option>
                  {listings.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.property_code} — {p.property_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Preferred Location
                </label>
                <input
                  type="text"
                  value={enquiryForm.preferred_location || ''}
                  onChange={e => setEnquiryForm({ ...enquiryForm, preferred_location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Property Type Needed
                </label>
                <select
                  value={enquiryForm.property_type_needed || '2 BHK'}
                  onChange={e => setEnquiryForm({ ...enquiryForm, property_type_needed: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                >
                  {ALL_PROPERTY_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Budget Range
                </label>
                <input
                  type="text"
                  value={enquiryForm.budget_range || ''}
                  onChange={e => setEnquiryForm({ ...enquiryForm, budget_range: e.target.value })}
                  placeholder="e.g., ₹25,000 - ₹35,000"
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Move-in Date
                </label>
                <input
                  type="date"
                  value={enquiryForm.move_in_date ? enquiryForm.move_in_date.slice(0, 10) : ''}
                  onChange={e => setEnquiryForm({ ...enquiryForm, move_in_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Family / Bachelor / Company Profile
                </label>
                <input
                  type="text"
                  value={enquiryForm.family_or_company_profile || ''}
                  onChange={e =>
                    setEnquiryForm({ ...enquiryForm, family_or_company_profile: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Enquiry Status
                </label>
                <select
                  value={enquiryForm.enquiry_status || 'New Enquiry'}
                  onChange={e =>
                    setEnquiryForm({
                      ...enquiryForm,
                      enquiry_status: e.target.value as TenantEnquiryStatus
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
                >
                  {TENANT_ENQUIRY_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={enquiryForm.notes || ''}
                onChange={e => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEnquiryModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingEnquiry}
                className="px-5 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer"
              >
                {submittingEnquiry ? 'Saving...' : 'Save Tenant Enquiry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Site Visit Schedule / Edit Modal */}
      {visitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <form
            onSubmit={handleSaveSiteVisit}
            className="bg-white border border-[#E5DEC9] rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-3">
              <h3 className="text-sm font-bold text-[#3D2E18]">
                {editingVisit ? `Update Site Visit (${editingVisit.visit_code})` : 'Schedule Property Site Visit'}
              </h3>
              <button type="button" onClick={() => setVisitModalOpen(false)}>✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Property *
                </label>
                <select
                  required
                  value={visitForm.property_id || ''}
                  onChange={e => {
                    const p = listings.find(x => x.id === e.target.value);
                    setVisitForm({
                      ...visitForm,
                      property_id: e.target.value,
                      property_title: p?.property_title || ''
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                >
                  <option value="">Select Property</option>
                  {listings.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.property_code} — {p.property_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Linked Tenant Enquiry
                </label>
                <select
                  value={visitForm.tenant_enquiry_id || ''}
                  onChange={e => {
                    const enq = enquiries.find(x => x.id === e.target.value);
                    setVisitForm({
                      ...visitForm,
                      tenant_enquiry_id: e.target.value || null,
                      tenant_name: enq?.tenant_name || visitForm.tenant_name || '',
                      tenant_mobile: enq?.tenant_mobile || visitForm.tenant_mobile || ''
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                >
                  <option value="">Manual Tenant Entry</option>
                  {enquiries.map(enq => (
                    <option key={enq.id} value={enq.id}>
                      {enq.enquiry_code} — {enq.tenant_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  required
                  value={visitForm.tenant_name || ''}
                  onChange={e => setVisitForm({ ...visitForm, tenant_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Tenant Mobile
                </label>
                <input
                  type="text"
                  value={visitForm.tenant_mobile || ''}
                  onChange={e => setVisitForm({ ...visitForm, tenant_mobile: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Visit Date *
                </label>
                <input
                  type="date"
                  required
                  value={visitForm.visit_date ? visitForm.visit_date.slice(0, 10) : ''}
                  onChange={e => setVisitForm({ ...visitForm, visit_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Visit Time
                </label>
                <input
                  type="text"
                  value={visitForm.visit_time || ''}
                  onChange={e => setVisitForm({ ...visitForm, visit_time: e.target.value })}
                  placeholder="11:30 AM"
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Assigned Staff
                </label>
                <input
                  type="text"
                  value={visitForm.assigned_staff || ''}
                  onChange={e => setVisitForm({ ...visitForm, assigned_staff: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Visit Status
                </label>
                <select
                  value={visitForm.visit_status || 'Scheduled'}
                  onChange={e =>
                    setVisitForm({ ...visitForm, visit_status: e.target.value as SiteVisitStatus })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
                >
                  {SITE_VISIT_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Tenant Visit Feedback
                </label>
                <input
                  type="text"
                  value={visitForm.visit_feedback || ''}
                  onChange={e => setVisitForm({ ...visitForm, visit_feedback: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Owner Feedback
                </label>
                <input
                  type="text"
                  value={visitForm.owner_feedback || ''}
                  onChange={e => setVisitForm({ ...visitForm, owner_feedback: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVisitModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingVisit}
                className="px-5 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer"
              >
                {submittingVisit ? 'Saving...' : 'Save Site Visit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create / Edit Deal Modal */}
      {dealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <form
            onSubmit={handleSaveDeal}
            className="bg-white border border-[#E5DEC9] rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-3">
              <h3 className="text-sm font-bold text-[#3D2E18]">
                {editingDeal ? `Edit Rental Deal (${editingDeal.deal_code})` : 'Create Completed Rental Deal'}
              </h3>
              <button type="button" onClick={() => setDealModalOpen(false)}>✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Property *
                </label>
                <select
                  required
                  value={dealForm.property_id || ''}
                  onChange={e => {
                    const p = listings.find(x => x.id === e.target.value);
                    setDealForm({
                      ...dealForm,
                      property_id: e.target.value,
                      property_title: p?.property_title || '',
                      owner_name: p?.owner_full_name || dealForm.owner_name || ''
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                >
                  <option value="">Select Property</option>
                  {listings.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.property_code} — {p.property_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Owner Name *
                </label>
                <input
                  type="text"
                  required
                  value={dealForm.owner_name || ''}
                  onChange={e => setDealForm({ ...dealForm, owner_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  required
                  value={dealForm.tenant_name || ''}
                  onChange={e => setDealForm({ ...dealForm, tenant_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Final Monthly Rent (₹)
                </label>
                <input
                  type="number"
                  value={dealForm.final_monthly_rent ?? ''}
                  onChange={e =>
                    setDealForm({ ...dealForm, final_monthly_rent: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Placement Fee Expected (₹)
                </label>
                <input
                  type="number"
                  value={dealForm.placement_fee_expected ?? ''}
                  onChange={e =>
                    setDealForm({ ...dealForm, placement_fee_expected: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                />
              </div>

              {!editingDeal && (
                <div>
                  <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                    Initial Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    value={dealForm.amount_received ?? 0}
                    onChange={e =>
                      setDealForm({ ...dealForm, amount_received: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Deal Confirmed Date
                </label>
                <input
                  type="date"
                  value={dealForm.deal_confirmed_date ? dealForm.deal_confirmed_date.slice(0, 10) : ''}
                  onChange={e => setDealForm({ ...dealForm, deal_confirmed_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Handled By
                </label>
                <input
                  type="text"
                  value={dealForm.handled_by || ''}
                  onChange={e => setDealForm({ ...dealForm, handled_by: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDealModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingDeal}
                className="px-5 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer"
              >
                {submittingDeal ? 'Saving...' : 'Save Deal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Placement Fee Payment Modal */}
      {paymentModalDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <form
            onSubmit={handleRecordPaymentSubmit}
            className="bg-white border border-[#E5DEC9] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#3D2E18]">
                  Record Placement Fee Payment ({paymentModalDeal.deal_code})
                </h3>
                <p className="text-xs text-[#6E5A3E]">
                  Balance Due: ₹{Number(paymentModalDeal.amount_due || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button type="button" onClick={() => setPaymentModalDeal(null)}>✕</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Payment Amount Received (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={paymentForm.amount}
                onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentForm.payment_mode}
                  onChange={e => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                >
                  {PAYMENT_MODES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                Transaction Reference / UTR
              </label>
              <input
                type="text"
                value={paymentForm.transaction_reference}
                onChange={e =>
                  setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalDeal(null)}
                className="px-4 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="px-5 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer"
              >
                {submittingPayment ? 'Recording...' : 'Save Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
