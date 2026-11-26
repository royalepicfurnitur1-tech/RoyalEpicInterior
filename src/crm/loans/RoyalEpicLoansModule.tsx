import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  CalendarClock,
  BarChart3,
  Phone,
  Search,
  RefreshCw,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
  History,
  MapPin,
  Mail,
  ExternalLink,
  Filter,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  LoanNavigationTab,
  LoanEnquiry,
  LoanCallLog,
  LoanActivity,
  LoanDashboardData,
  LoanCrmStaffMember,
  LOAN_FINANCE_PURPOSES,
  LOAN_APPROXIMATE_AMOUNTS,
  LOAN_PREFERRED_CONTACT_TIMES,
  LOAN_ENQUIRY_SOURCES,
  LOAN_ENQUIRY_STATUSES,
  LOAN_CALL_OUTCOMES,
} from './loanTypes';
import {
  fetchLoanCrmStaff,
  fetchLoanDashboard,
  fetchLoanEnquiries,
  fetchLoanEnquiryDetail,
  createManualLoanEnquiry,
  updateLoanEnquiry,
  logLoanCall,
  fetchLoanFollowups,
} from './loanService';

interface RoyalEpicLoansModuleProps {
  activeSubTab: LoanNavigationTab;
  onChangeSubTab: (tab: LoanNavigationTab) => void;
  currentUser?: { id?: string; name?: string; role?: string } | null;
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'New':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'Contact Pending':
      return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    case 'Contacted':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'Requirement Under Review':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    case 'Further Discussion':
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    case 'Converted':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Not Proceeding':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    case 'Closed':
      return 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30';
    default:
      return 'bg-neutral-800 text-neutral-300 border-neutral-700';
  }
}

function formatDateTimeIst(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const RoyalEpicLoansModule: React.FC<RoyalEpicLoansModuleProps> = ({
  activeSubTab,
  onChangeSubTab,
  currentUser,
}) => {
  const [staffList, setStaffList] = useState<LoanCrmStaffMember[]>([]);
  const [dashboardData, setDashboardData] = useState<LoanDashboardData | null>(null);
  const [enquiries, setEnquiries] = useState<LoanEnquiry[]>([]);
  const [followupsData, setFollowupsData] = useState<{
    overdue: LoanEnquiry[];
    today: LoanEnquiry[];
    upcoming: LoanEnquiry[];
    counts: { overdue: number; today: number; upcoming: number; total_due: number };
  }>({
    overdue: [],
    today: [],
    upcoming: [],
    counts: { overdue: 0, today: 0, upcoming: 0, total_due: 0 },
  });

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters for Loan Enquiries list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPurpose, setFilterPurpose] = useState('All');
  const [filterStaff, setFilterStaff] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Selected Enquiry Detail Drawer
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{
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
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [internalNotesDraft, setInternalNotesDraft] = useState('');
  const [followupDraft, setFollowupDraft] = useState('');
  const [savingUpdate, setSavingUpdate] = useState(false);

  // Call Logger Form inside Detail Modal
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [callStatusDraft, setCallStatusDraft] = useState<string>('Connected');
  const [callNotesDraft, setCallNotesDraft] = useState('');
  const [callNextFollowupDraft, setCallNextFollowupDraft] = useState('');
  const [callNextStatusDraft, setCallNextStatusDraft] = useState('');
  const [savingCall, setSavingCall] = useState(false);

  // Manual Add Loan Enquiry Form State
  const [addName, setAddName] = useState('');
  const [addMobile, setAddMobile] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addCity, setAddCity] = useState('Bengaluru');
  const [addPurpose, setAddPurpose] = useState<string>('Home Interior Finance');
  const [addAmount, setAddAmount] = useState<string>('');
  const [addTime, setAddTime] = useState<string>('Anytime');
  const [addSource, setAddSource] = useState<string>('CRM Manual Entry');
  const [addStatus, setAddStatus] = useState<string>('New');
  const [addAssignedStaff, setAddAssignedStaff] = useState<string>(currentUser?.id || '');
  const [addFollowupAt, setAddFollowupAt] = useState<string>('');
  const [addProjectDetails, setAddProjectDetails] = useState('');
  const [addInternalNotes, setAddInternalNotes] = useState('');
  const [addingEnquiry, setAddingEnquiry] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, dashRes, enqRes, folRes] = await Promise.all([
        fetchLoanCrmStaff().catch(() => ({ staff: [] })),
        fetchLoanDashboard(),
        fetchLoanEnquiries({
          search: searchQuery,
          status: filterStatus,
          finance_purpose: filterPurpose,
          assigned_staff: filterStaff,
          enquiry_source: filterSource,
          date_from: filterDateFrom,
          date_to: filterDateTo,
        }),
        fetchLoanFollowups(filterStaff !== 'All' ? filterStaff : undefined),
      ]);
      setStaffList(staffRes.staff || []);
      setDashboardData(dashRes);
      setEnquiries(enqRes.enquiries || []);
      setFollowupsData(folRes);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load Royal Epic Loans data.');
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    filterStatus,
    filterPurpose,
    filterStaff,
    filterSource,
    filterDateFrom,
    filterDateTo,
  ]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, activeSubTab]);

  const openEnquiryDetail = async (id: string, openCallModalImmediately = false) => {
    setSelectedEnquiryId(id);
    setDetailLoading(true);
    setShowCallLogger(openCallModalImmediately);
    try {
      const detail = await fetchLoanEnquiryDetail(id);
      setSelectedDetail(detail);
      setInternalNotesDraft(detail.enquiry.internal_notes || '');
      if (detail.enquiry.next_followup_at) {
        const dt = new Date(detail.enquiry.next_followup_at);
        if (!isNaN(dt.getTime())) {
          const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setFollowupDraft(localIso);
        }
      } else {
        setFollowupDraft('');
      }
      setCallNextStatusDraft(detail.enquiry.status);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load enquiry detail.');
      setSelectedEnquiryId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleQuickStatusChange = async (enquiryId: string, nextStatus: string) => {
    setSavingUpdate(true);
    try {
      await updateLoanEnquiry(enquiryId, { status: nextStatus });
      showToast('success', `Status updated to "${nextStatus}".`);
      await loadAllData();
      if (selectedEnquiryId === enquiryId) {
        await openEnquiryDetail(enquiryId, showCallLogger);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update status.');
    } finally {
      setSavingUpdate(false);
    }
  };

  const handleQuickStaffAssign = async (enquiryId: string, staffId: string) => {
    setSavingUpdate(true);
    try {
      const matched = staffList.find((s) => s.id === staffId);
      await updateLoanEnquiry(enquiryId, {
        assigned_staff: staffId || null,
        assigned_staff_name: matched ? matched.name : null,
      });
      showToast('success', `Assigned staff updated to ${matched ? matched.name : 'Unassigned'}.`);
      await loadAllData();
      if (selectedEnquiryId === enquiryId) {
        await openEnquiryDetail(enquiryId, showCallLogger);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to assign staff.');
    } finally {
      setSavingUpdate(false);
    }
  };

  const handleSaveNotesAndFollowup = async () => {
    if (!selectedDetail) return;
    setSavingUpdate(true);
    try {
      await updateLoanEnquiry(selectedDetail.enquiry.id, {
        internal_notes: internalNotesDraft,
        next_followup_at: followupDraft ? new Date(followupDraft).toISOString() : null,
      });
      showToast('success', 'Enquiry notes and follow-up schedule saved.');
      await openEnquiryDetail(selectedDetail.enquiry.id, false);
      await loadAllData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save changes.');
    } finally {
      setSavingUpdate(false);
    }
  };

  const handleLogCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetail || savingCall) return;
    setSavingCall(true);
    try {
      await logLoanCall(selectedDetail.enquiry.id, {
        call_status: callStatusDraft,
        call_notes: callNotesDraft.trim() || null,
        next_followup_at: callNextFollowupDraft
          ? new Date(callNextFollowupDraft).toISOString()
          : undefined,
        status: callNextStatusDraft || undefined,
      });
      showToast('success', `Call outcome (${callStatusDraft}) recorded.`);
      setCallNotesDraft('');
      setCallNextFollowupDraft('');
      setShowCallLogger(false);
      await openEnquiryDetail(selectedDetail.enquiry.id, false);
      await loadAllData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to record call outcome.');
    } finally {
      setSavingCall(false);
    }
  };

  const handleAddManualEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingEnquiry) return;
    if (!addName.trim() || !addMobile.trim()) {
      showToast('error', 'Customer Name and Mobile Number are required.');
      return;
    }

    setAddingEnquiry(true);
    try {
      const res = await createManualLoanEnquiry({
        customer_name: addName.trim(),
        mobile_number: addMobile.trim(),
        email: addEmail.trim() || null,
        city: addCity.trim() || null,
        finance_purpose: addPurpose,
        approximate_amount: addAmount || null,
        preferred_contact_time: addTime,
        enquiry_source: addSource,
        status: addStatus,
        assigned_staff: addAssignedStaff || null,
        next_followup_at: addFollowupAt ? new Date(addFollowupAt).toISOString() : null,
        project_details: addProjectDetails.trim() || null,
        internal_notes: addInternalNotes.trim() || null,
      });
      showToast('success', `Loan enquiry ${res.enquiry.enquiry_reference} created.`);
      setAddName('');
      setAddMobile('');
      setAddEmail('');
      setAddProjectDetails('');
      setAddInternalNotes('');
      setAddFollowupAt('');
      onChangeSubTab('enquiries');
      await loadAllData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to create loan enquiry.');
    } finally {
      setAddingEnquiry(false);
    }
  };

  const metrics = dashboardData?.metrics || {
    total_enquiries: 0,
    new_enquiries: 0,
    pending_contact: 0,
    followups_due: 0,
    overdue_followups: 0,
    contacted: 0,
    under_review: 0,
    converted: 0,
    closed: 0,
  };

  const subNavItems: Array<{
    id: LoanNavigationTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Loans Dashboard', icon: LayoutDashboard },
    { id: 'enquiries', label: 'Loan Enquiries', icon: FileText, badge: metrics.total_enquiries },
    { id: 'add', label: 'Add Loan Enquiry', icon: PlusCircle },
    {
      id: 'followups',
      label: 'Follow-ups',
      icon: CalendarClock,
      badge: followupsData.counts.total_due,
    },
    { id: 'reports', label: 'Loan Enquiry Reports', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/40 text-rose-200'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Module Header & Sub-Navigation */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
              ROYAL EPIC LOANS CRM
            </span>
            <a
              href="/loans"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-amber-300 inline-flex items-center gap-1 transition-colors"
            >
              Public /loans Page <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white mt-1">
            Home Construction, Interior &amp; Renovation Finance Operations
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {subNavItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeSubTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      isActive
                        ? 'bg-neutral-950/20 text-neutral-950'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={loadAllData}
            title="Refresh Loans Data"
            className="p-2 rounded-xl bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: LOANS DASHBOARD
          ===================================================================== */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* 8 Required Dashboard Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              {
                label: 'Total Loan Enquiries',
                value: metrics.total_enquiries,
                accent: 'border-neutral-700 text-white',
                onClick: () => {
                  setFilterStatus('All');
                  onChangeSubTab('enquiries');
                },
              },
              {
                label: 'New Enquiries',
                value: metrics.new_enquiries,
                accent: 'border-amber-500/40 text-amber-300',
                onClick: () => {
                  setFilterStatus('New');
                  onChangeSubTab('enquiries');
                },
              },
              {
                label: 'Pending Contact',
                value: metrics.pending_contact,
                accent: 'border-orange-500/40 text-orange-300',
                onClick: () => {
                  setFilterStatus('Contact Pending');
                  onChangeSubTab('enquiries');
                },
              },
              {
                label: 'Follow-ups Due',
                value: metrics.followups_due,
                accent: 'border-rose-500/40 text-rose-300',
                onClick: () => onChangeSubTab('followups'),
              },
              {
                label: 'Contacted',
                value: metrics.contacted,
                accent: 'border-blue-500/40 text-blue-300',
                onClick: () => {
                  setFilterStatus('Contacted');
                  onChangeSubTab('enquiries');
                },
              },
              {
                label: 'Under Review',
                value: metrics.under_review,
                accent: 'border-indigo-500/40 text-indigo-300',
                onClick: () => {
                  setFilterStatus('Requirement Under Review');
                  onChangeSubTab('enquiries');
                },
              },
              {
                label: 'Converted',
                value: metrics.converted,
                accent: 'border-emerald-500/40 text-emerald-300',
                onClick: () => {
                  setFilterStatus('Converted');
                  onChangeSubTab('enquiries');
                },
              },
              {
                label: 'Closed',
                value: metrics.closed,
                accent: 'border-neutral-700 text-neutral-300',
                onClick: () => {
                  setFilterStatus('Closed');
                  onChangeSubTab('enquiries');
                },
              },
            ].map((card, i) => (
              <button
                key={i}
                type="button"
                onClick={card.onClick}
                className={`bg-neutral-900/90 border ${card.accent} rounded-2xl p-4 text-left hover:bg-neutral-800/70 transition-all cursor-pointer`}
              >
                <p className="text-[11px] text-neutral-400 font-medium leading-snug">
                  {card.label}
                </p>
                <p className="text-2xl font-bold mt-2 font-mono">{card.value}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Loan Enquiries Table */}
            <div className="lg:col-span-8 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recent Finance Enquiries
                </h2>
                <button
                  type="button"
                  onClick={() => onChangeSubTab('enquiries')}
                  className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  View All ({metrics.total_enquiries}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {enquiries.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-sm">
                  No finance enquiries yet. Website submissions from{' '}
                  <code className="text-amber-300">/loans</code> will appear here automatically.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px]">
                        <th className="py-2.5 pr-3">Reference</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Finance Purpose</th>
                        <th className="py-2.5 px-3">Approx. Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 pl-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/70">
                      {enquiries.slice(0, 8).map((enq) => (
                        <tr key={enq.id} className="hover:bg-neutral-800/40">
                          <td className="py-3 pr-3 font-mono text-amber-300 font-semibold">
                            {enq.enquiry_reference}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{enq.customer_name}</div>
                            <div className="text-neutral-400 font-mono text-[11px]">
                              {enq.mobile_number}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-neutral-200">{enq.finance_purpose}</td>
                          <td className="py-3 px-3 text-neutral-300">
                            {enq.approximate_amount || '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadgeColor(
                                enq.status
                              )}`}
                            >
                              {enq.status}
                            </span>
                          </td>
                          <td className="py-3 pl-3 text-right space-x-2">
                            <a
                              href={`tel:${enq.mobile_number}`}
                              onClick={() => openEnquiryDetail(enq.id, true)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 font-semibold"
                            >
                              <Phone className="w-3 h-3" /> Call
                            </a>
                            <button
                              type="button"
                              onClick={() => openEnquiryDetail(enq.id, false)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 font-semibold cursor-pointer"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Breakdown by Purpose & Recent Activity */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                  Enquiries by Finance Purpose
                </h3>
                <div className="space-y-3">
                  {LOAN_FINANCE_PURPOSES.map((purpose) => {
                    const count = dashboardData?.breakdowns?.by_purpose?.[purpose] || 0;
                    const pct =
                      metrics.total_enquiries > 0
                        ? Math.round((count / metrics.total_enquiries) * 100)
                        : 0;
                    return (
                      <div key={purpose}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-300">{purpose}</span>
                          <span className="font-mono text-amber-300 font-semibold">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Recent Loans Activity
                </h3>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {(dashboardData?.recent_activities || []).length === 0 ? (
                    <p className="text-xs text-neutral-500">No activity recorded yet.</p>
                  ) : (
                    (dashboardData?.recent_activities || []).map((act) => (
                      <div
                        key={act.id}
                        className="text-xs border-l-2 border-amber-500/50 pl-3 py-1 space-y-0.5"
                      >
                        <p className="text-neutral-200">{act.description}</p>
                        <p className="text-[10px] text-neutral-500">
                          {act.staff_name || 'System'} • {formatDateTimeIst(act.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: ALL LOAN ENQUIRIES LIST & FILTERS
          ===================================================================== */}
      {activeSubTab === 'enquiries' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-5">
          {/* Search and Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, mobile, REL- reference, city..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Statuses</option>
              {LOAN_ENQUIRY_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              value={filterPurpose}
              onChange={(e) => setFilterPurpose(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Finance Purposes</option>
              {LOAN_FINANCE_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Staff</option>
              <option value="unassigned">Unassigned Only</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Sources</option>
              {LOAN_ENQUIRY_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-neutral-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-neutral-400">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Date Range:</span>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white"
              />
              <span>to</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white"
              />
              {(searchQuery ||
                filterStatus !== 'All' ||
                filterPurpose !== 'All' ||
                filterStaff !== 'All' ||
                filterSource !== 'All' ||
                filterDateFrom ||
                filterDateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('All');
                    setFilterPurpose('All');
                    setFilterStaff('All');
                    setFilterSource('All');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                  }}
                  className="text-amber-400 hover:underline ml-2 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
            <div className="text-neutral-400">
              Showing <strong className="text-white">{enquiries.length}</strong> loan enquiries
            </div>
          </div>

          {/* Enquiries Table */}
          {enquiries.length === 0 ? (
            <div className="py-14 text-center text-neutral-400 text-sm">
              No loan enquiries match your current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px]">
                    <th className="py-3 pr-3">Enquiry ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Purpose &amp; Requirement</th>
                    <th className="py-3 px-3">City &amp; Source</th>
                    <th className="py-3 px-3">Assigned Staff</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Next Follow-up</th>
                    <th className="py-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/70">
                  {enquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-neutral-800/40">
                      <td className="py-3.5 pr-3">
                        <div className="font-mono font-bold text-amber-300">
                          {enq.enquiry_reference}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {formatDateTimeIst(enq.created_at)}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-white">{enq.customer_name}</div>
                        <div className="font-mono text-neutral-300 text-[11px]">
                          {enq.mobile_number}
                        </div>
                        {enq.email && (
                          <div className="text-[11px] text-neutral-400 truncate max-w-[160px]">
                            {enq.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-neutral-100">{enq.finance_purpose}</div>
                        <div className="text-[11px] text-amber-300/90">
                          {enq.approximate_amount || 'Amount Not Specified'}
                        </div>
                        {enq.preferred_contact_time && (
                          <div className="text-[10px] text-neutral-400">
                            Prefers: {enq.preferred_contact_time}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-neutral-200">{enq.city || 'Bengaluru'}</div>
                        <div className="text-[10px] text-neutral-400">{enq.enquiry_source}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <select
                          value={enq.assigned_staff || ''}
                          onChange={(e) => handleQuickStaffAssign(enq.id, e.target.value)}
                          disabled={savingUpdate}
                          className="px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-200"
                        >
                          <option value="">Unassigned</option>
                          {staffList.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-3">
                        <select
                          value={enq.status}
                          onChange={(e) => handleQuickStatusChange(enq.id, e.target.value)}
                          disabled={savingUpdate}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getStatusBadgeColor(
                            enq.status
                          )} bg-neutral-950`}
                        >
                          {LOAN_ENQUIRY_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-neutral-900 text-white">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-neutral-300">
                        {formatDateTimeIst(enq.next_followup_at)}
                      </td>
                      <td className="py-3.5 pl-3 text-right whitespace-nowrap space-x-1.5">
                        <a
                          href={`tel:${enq.mobile_number}`}
                          onClick={() => openEnquiryDetail(enq.id, true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 font-semibold"
                        >
                          <Phone className="w-3 h-3" /> Call &amp; Log
                        </a>
                        <button
                          type="button"
                          onClick={() => openEnquiryDetail(enq.id, false)}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 font-semibold cursor-pointer"
                        >
                          Details
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

      {/* =====================================================================
          VIEW 3: ADD MANUAL LOAN ENQUIRY
          ===================================================================== */}
      {activeSubTab === 'add' && (
        <div className="max-w-3xl bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-1">
            Add Manual Loan Enquiry (Phone / Walk-in)
          </h2>
          <p className="text-xs text-neutral-400 mb-6">
            Record a finance enquiry received directly by phone or at the Royal Epic Experience Centre.
          </p>

          <form onSubmit={handleAddManualEnquirySubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Customer Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={addMobile}
                  onChange={(e) => setAddMobile(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  City / Location
                </label>
                <input
                  type="text"
                  value={addCity}
                  onChange={(e) => setAddCity(e.target.value)}
                  placeholder="e.g. Whitefield, Bengaluru"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Finance Purpose <span className="text-rose-400">*</span>
                </label>
                <select
                  value={addPurpose}
                  onChange={(e) => setAddPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                >
                  {LOAN_FINANCE_PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Approximate Finance Requirement
                </label>
                <select
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                >
                  <option value="">Not Specified</option>
                  {LOAN_APPROXIMATE_AMOUNTS.map((amt) => (
                    <option key={amt} value={amt}>
                      {amt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Preferred Contact Time
                </label>
                <select
                  value={addTime}
                  onChange={(e) => setAddTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                >
                  {LOAN_PREFERRED_CONTACT_TIMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Enquiry Source
                </label>
                <select
                  value={addSource}
                  onChange={(e) => setAddSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                >
                  {LOAN_ENQUIRY_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Initial Status
                </label>
                <select
                  value={addStatus}
                  onChange={(e) => setAddStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                >
                  {LOAN_ENQUIRY_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Assigned Staff
                </label>
                <select
                  value={addAssignedStaff}
                  onChange={(e) => setAddAssignedStaff(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                >
                  <option value="">Unassigned</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Schedule Next Follow-up (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={addFollowupAt}
                  onChange={(e) => setAddFollowupAt(e.target.value)}
                  className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5">
                Customer Project Details
              </label>
              <textarea
                rows={3}
                value={addProjectDetails}
                onChange={(e) => setAddProjectDetails(e.target.value)}
                placeholder="Customer's home construction, interior or renovation requirements..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5">
                Internal Staff Notes
              </label>
              <textarea
                rows={2}
                value={addInternalNotes}
                onChange={(e) => setAddInternalNotes(e.target.value)}
                placeholder="Internal notes for the telecaller / finance assistance team..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={addingEnquiry}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer"
              >
                {addingEnquiry ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Loan Enquiry...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" /> Create Loan Enquiry
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          VIEW 4: FOLLOW-UPS (OVERDUE, TODAY, UPCOMING)
          ===================================================================== */}
      {activeSubTab === 'followups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            {
              title: `Overdue Follow-ups (${followupsData.overdue.length})`,
              items: followupsData.overdue,
              border: 'border-rose-500/40',
              headerColor: 'text-rose-300',
            },
            {
              title: `Today's Follow-ups (${followupsData.today.length})`,
              items: followupsData.today,
              border: 'border-amber-500/40',
              headerColor: 'text-amber-300',
            },
            {
              title: `Upcoming Follow-ups (${followupsData.upcoming.length})`,
              items: followupsData.upcoming,
              border: 'border-blue-500/40',
              headerColor: 'text-blue-300',
            },
          ].map((col, idx) => (
            <div
              key={idx}
              className={`bg-neutral-900/90 border ${col.border} rounded-2xl p-5 flex flex-col`}
            >
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${col.headerColor}`}>
                {col.title}
              </h3>
              {col.items.length === 0 ? (
                <p className="text-xs text-neutral-500 py-8 text-center">
                  No follow-ups in this bucket.
                </p>
              ) : (
                <div className="space-y-3">
                  {col.items.map((enq) => (
                    <div
                      key={enq.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-amber-300 font-bold">
                          {enq.enquiry_reference}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeColor(
                            enq.status
                          )}`}
                        >
                          {enq.status}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-white">{enq.customer_name}</div>
                        <div className="font-mono text-neutral-300 text-[11px]">
                          {enq.mobile_number} • {enq.finance_purpose}
                        </div>
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Due: {formatDateTimeIst(enq.next_followup_at)}
                      </div>
                      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-500">
                          Staff: {enq.assigned_staff_name || 'Unassigned'}
                        </span>
                        <div className="space-x-1.5">
                          <a
                            href={`tel:${enq.mobile_number}`}
                            onClick={() => openEnquiryDetail(enq.id, true)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 font-semibold text-[11px]"
                          >
                            <Phone className="w-3 h-3" /> Call
                          </a>
                          <button
                            type="button"
                            onClick={() => openEnquiryDetail(enq.id, false)}
                            className="px-2 py-1 rounded bg-neutral-800 text-neutral-200 font-semibold text-[11px] cursor-pointer"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          VIEW 5: LOAN ENQUIRY REPORTS
          ===================================================================== */}
      {activeSubTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status Distribution */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Pipeline Status Breakdown
            </h3>
            <div className="space-y-2.5 text-xs">
              {LOAN_ENQUIRY_STATUSES.map((st) => {
                const count = dashboardData?.breakdowns?.by_status?.[st] || 0;
                return (
                  <div
                    key={st}
                    className="flex items-center justify-between py-2 border-b border-neutral-800/70 last:border-0"
                  >
                    <span className="text-neutral-300">{st}</span>
                    <span className="font-mono font-bold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Finance Purpose Breakdown */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Finance Purpose Distribution
            </h3>
            <div className="space-y-2.5 text-xs">
              {LOAN_FINANCE_PURPOSES.map((purpose) => {
                const count = dashboardData?.breakdowns?.by_purpose?.[purpose] || 0;
                return (
                  <div
                    key={purpose}
                    className="flex items-center justify-between py-2 border-b border-neutral-800/70 last:border-0"
                  >
                    <span className="text-neutral-300">{purpose}</span>
                    <span className="font-mono font-bold text-amber-300">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enquiry Source Breakdown */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Enquiry Source Attribution
            </h3>
            <div className="space-y-2.5 text-xs">
              {LOAN_ENQUIRY_SOURCES.map((source) => {
                const count = dashboardData?.breakdowns?.by_source?.[source] || 0;
                return (
                  <div
                    key={source}
                    className="flex items-center justify-between py-2 border-b border-neutral-800/70 last:border-0"
                  >
                    <span className="text-neutral-300">{source}</span>
                    <span className="font-mono font-bold text-emerald-300">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ENQUIRY DETAIL & CALL LOGGING DRAWER / MODAL
          ===================================================================== */}
      {selectedEnquiryId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-end">
          <div className="w-full max-w-2xl h-full bg-neutral-950 border-l border-neutral-800 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-[11px] font-mono text-amber-400 font-bold">
                  {selectedDetail?.enquiry.enquiry_reference || 'Loading...'}
                </span>
                <h2 className="text-lg font-bold text-white">
                  {selectedDetail?.enquiry.customer_name || 'Loan Enquiry Detail'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEnquiryId(null);
                  setSelectedDetail(null);
                }}
                className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !selectedDetail ? (
              <div className="py-16 text-center text-neutral-400 text-sm flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span>Loading loan enquiry history...</span>
              </div>
            ) : (
              <>
                {/* Customer & Requirement Summary */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <a
                        href={`tel:${selectedDetail.enquiry.mobile_number}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {selectedDetail.enquiry.mobile_number}
                      </a>
                      {selectedDetail.enquiry.email && (
                        <span className="inline-flex items-center gap-1 text-neutral-300">
                          <Mail className="w-3.5 h-3.5 text-neutral-500" />
                          {selectedDetail.enquiry.email}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCallLogger((prev) => !prev)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold cursor-pointer"
                    >
                      {showCallLogger ? 'Hide Call Logger' : '+ Record Call Outcome'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800">
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">
                        Finance Purpose
                      </span>
                      <span className="text-white font-semibold">
                        {selectedDetail.enquiry.finance_purpose}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">
                        Approx. Requirement
                      </span>
                      <span className="text-amber-300 font-semibold">
                        {selectedDetail.enquiry.approximate_amount || 'Not Specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">
                        City / Location
                      </span>
                      <span className="text-neutral-200 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-500" />
                        {selectedDetail.enquiry.city || 'Bengaluru'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">
                        Preferred Contact Time
                      </span>
                      <span className="text-neutral-200">
                        {selectedDetail.enquiry.preferred_contact_time || 'Anytime'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">
                        Enquiry Source
                      </span>
                      <span className="text-neutral-200">
                        {selectedDetail.enquiry.enquiry_source}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">
                        Last Contacted
                      </span>
                      <span className="text-neutral-200">
                        {formatDateTimeIst(selectedDetail.enquiry.last_contacted_at)}
                      </span>
                    </div>
                  </div>

                  {selectedDetail.enquiry.project_details && (
                    <div className="pt-2 border-t border-neutral-800">
                      <span className="text-neutral-500 block text-[10px] uppercase mb-1">
                        Customer Project Details
                      </span>
                      <p className="text-neutral-200 leading-relaxed bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                        {selectedDetail.enquiry.project_details}
                      </p>
                    </div>
                  )}
                </div>

                {/* Call Logger Panel */}
                {showCallLogger && (
                  <form
                    onSubmit={handleLogCallSubmit}
                    className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 text-xs"
                  >
                    <h3 className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Record Customer Call Outcome
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-400 mb-1">Call Outcome *</label>
                        <select
                          value={callStatusDraft}
                          onChange={(e) => setCallStatusDraft(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                        >
                          {LOAN_CALL_OUTCOMES.map((out) => (
                            <option key={out} value={out}>
                              {out}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-400 mb-1">Update Enquiry Status</label>
                        <select
                          value={callNextStatusDraft}
                          onChange={(e) => setCallNextStatusDraft(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                        >
                          {LOAN_ENQUIRY_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-neutral-400 mb-1">
                          Next Follow-up Date &amp; Time (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={callNextFollowupDraft}
                          onChange={(e) => setCallNextFollowupDraft(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-neutral-400 mb-1">Call Discussion Notes</label>
                        <textarea
                          rows={3}
                          value={callNotesDraft}
                          onChange={(e) => setCallNotesDraft(e.target.value)}
                          placeholder="Summary of customer's construction/interior timeline, requirement discussion..."
                          className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCallLogger(false)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingCall}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold cursor-pointer"
                      >
                        {savingCall ? 'Saving Call...' : 'Save Call Log'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Status, Staff Assignment, Follow-up & Internal Notes */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-400 mb-1">Enquiry Status</label>
                      <select
                        value={selectedDetail.enquiry.status}
                        onChange={(e) =>
                          handleQuickStatusChange(selectedDetail.enquiry.id, e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                      >
                        {LOAN_ENQUIRY_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Assigned Staff
                      </label>
                      <select
                        value={selectedDetail.enquiry.assigned_staff || ''}
                        onChange={(e) =>
                          handleQuickStaffAssign(selectedDetail.enquiry.id, e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                      >
                        <option value="">Unassigned</option>
                        {staffList.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">
                      Scheduled Next Follow-up
                    </label>
                    <input
                      type="datetime-local"
                      value={followupDraft}
                      onChange={(e) => setFollowupDraft(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Internal Staff Notes</label>
                    <textarea
                      rows={3}
                      value={internalNotesDraft}
                      onChange={(e) => setInternalNotesDraft(e.target.value)}
                      placeholder="Add internal review notes..."
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveNotesAndFollowup}
                    disabled={savingUpdate}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold cursor-pointer"
                  >
                    {savingUpdate ? 'Saving...' : 'Save Notes & Follow-up Schedule'}
                  </button>
                </div>

                {/* Related Enquiries from Same Customer Phone */}
                {selectedDetail.related_enquiries.length > 0 && (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                      Other Finance Enquiries From This Customer
                    </h4>
                    {selectedDetail.related_enquiries.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between py-1.5 border-b border-neutral-800 last:border-0"
                      >
                        <div>
                          <span className="font-mono text-amber-200 font-semibold">
                            {rel.enquiry_reference}
                          </span>{' '}
                          • <span>{rel.finance_purpose}</span> ({rel.status})
                        </div>
                        <button
                          type="button"
                          onClick={() => openEnquiryDetail(rel.id, false)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Switch
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Call History */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 text-xs">
                  <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Call History (
                    {selectedDetail.call_logs.length})
                  </h3>
                  {selectedDetail.call_logs.length === 0 ? (
                    <p className="text-neutral-500">No calls logged yet for this enquiry.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedDetail.call_logs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-300">{log.call_status}</span>
                            <span className="text-[10px] text-neutral-500">
                              {log.staff_name} • {formatDateTimeIst(log.created_at)}
                            </span>
                          </div>
                          {log.call_notes && <p className="text-neutral-200">{log.call_notes}</p>}
                          {log.next_followup_at && (
                            <p className="text-[10px] text-amber-300">
                              Next Follow-up: {formatDateTimeIst(log.next_followup_at)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Complete Audit & Activity Timeline */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 text-xs">
                  <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" /> Activity Timeline (
                    {selectedDetail.activities.length})
                  </h3>
                  <div className="space-y-2.5">
                    {selectedDetail.activities.map((act) => (
                      <div
                        key={act.id}
                        className="border-l-2 border-neutral-700 pl-3 py-0.5 space-y-0.5"
                      >
                        <p className="text-neutral-200">{act.description}</p>
                        <p className="text-[10px] text-neutral-500">
                          {act.staff_name || 'System'} • {formatDateTimeIst(act.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
