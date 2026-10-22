import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Phone, PhoneCall, PhoneForwarded, PhoneMissed, PhoneOff,
  Users, UserCheck, Shield, Mail, MapPin, Calendar, Clock,
  Search, Filter, Plus, RefreshCw, CheckCircle2, AlertCircle,
  ArrowRight, ArrowLeft, Download, Upload, FileText, ChevronRight,
  Eye, Edit3, Trash2, Building, Award, TrendingUp, LogOut,
  Lock, Key, Flame, Sparkles, Check, X, AlertTriangle, BarChart3,
  PieChart, Sliders, ArrowUpDown, ChevronDown, CheckSquare, ExternalLink
} from 'lucide-react';
import {
  crmService,
  CrmLead,
  CrmCallLog,
  CrmUserProfile,
  CrmDashboardStats,
  LeadSource,
  LeadTemperature,
  LeadStatus,
  CallOutcome,
  LEAD_SOURCES,
  LEAD_STATUSES,
  CALL_OUTCOMES,
  POPULAR_SERVICES,
  normalizePhoneNumber,
  isValidPhoneNumber,
  formatPhoneDisplay
} from '../../services/crmService';

interface TelecallerCrmPortalProps {
  onBackToWebsite?: () => void;
  onNavigateToAdmin?: () => void;
}

type TabType = 'dashboard' | 'leads' | 'followups' | 'import' | 'reports' | 'team';

export const TelecallerCrmPortal: React.FC<TelecallerCrmPortalProps> = ({
  onBackToWebsite,
  onNavigateToAdmin
}) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<CrmUserProfile | null>(() => crmService.getCurrentUserSync?.() || null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active portal tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Dashboard Stats
  const [stats, setStats] = useState<CrmDashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Leads state
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tempFilter, setTempFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [followupPeriodFilter, setFollowupPeriodFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'next_followup_date' | 'name' | 'temperature'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 50;

  // Selected lead for detail slide-over
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadData, setSelectedLeadData] = useState<{ lead: CrmLead; callLogs: CrmCallLog[] } | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Log Call Modal state
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
  const [callLeadTarget, setCallLeadTarget] = useState<CrmLead | null>(null);
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Interested');
  const [callNotes, setCallNotes] = useState('');
  const [callFollowupDate, setCallFollowupDate] = useState('');
  const [callUpdateStatus, setCallUpdateStatus] = useState<LeadStatus | ''>('');
  const [callUpdateTemp, setCallUpdateTemp] = useState<LeadTemperature | ''>('');
  const [isSavingCall, setIsSavingCall] = useState(false);

  // Add / Edit Lead Modal state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Website' as LeadSource,
    interested_service: 'Modular Kitchen',
    city: 'Bengaluru',
    budget: '',
    temperature: 'Warm' as LeadTemperature,
    status: 'New' as LeadStatus,
    notes: '',
    next_followup_date: ''
  });
  const [leadFormError, setLeadFormError] = useState('');
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Delete Lead Confirmation Modal (Admin only)
  const [leadToDelete, setLeadToDelete] = useState<CrmLead | null>(null);
  const [isDeletingLead, setIsDeletingLead] = useState(false);

  // Follow-ups dedicated tab state
  const [followupSubTab, setFollowupSubTab] = useState<'dueToday' | 'overdue' | 'upcoming'>('dueToday');
  const [followupsData, setFollowupsData] = useState<{ dueToday: CrmLead[]; overdue: CrmLead[]; upcoming: CrmLead[] }>({
    dueToday: [],
    overdue: [],
    upcoming: []
  });
  const [isFollowupsLoading, setIsFollowupsLoading] = useState(false);

  // CSV Import state (Admin only)
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState<{
    total: number;
    imported: number;
    skippedDuplicates: number;
    invalidRows: number;
    errors: string[];
  } | null>(null);

  // Team & Users state (Admin only)
  const [teamUsers, setTeamUsers] = useState<CrmUserProfile[]>([]);
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    name: '',
    role: 'telecaller' as 'admin' | 'telecaller',
    phone: '',
    password: ''
  });
  const [newUserError, setNewUserError] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Global Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isAdmin = currentUser?.role === 'admin';

  // 1. Check current session on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);
      const user = await crmService.getCurrentUser();
      setCurrentUser(user);
      setIsAuthLoading(false);
    };
    initAuth();
  }, []);

  // 2. Fetch Leads & Stats when authenticated and active tab changes
  const loadLeads = async () => {
    setIsLeadsLoading(true);
    const result = await crmService.getLeads({
      search: searchQuery,
      status: statusFilter,
      temperature: tempFilter,
      source: sourceFilter,
      followupPeriod: followupPeriodFilter,
      sortBy,
      sortOrder,
      page,
      limit
    });
    setLeads(result.leads);
    setTotalLeadsCount(result.total);
    setIsLeadsLoading(false);
  };

  const loadStats = async () => {
    setIsStatsLoading(true);
    const data = await crmService.getDashboardStats();
    setStats(data);
    setIsStatsLoading(false);
  };

  const loadFollowups = async () => {
    setIsFollowupsLoading(true);
    const data = await crmService.getFollowups();
    setFollowupsData({
      dueToday: data.dueToday || [],
      overdue: data.overdue || [],
      upcoming: data.upcoming || []
    });
    setIsFollowupsLoading(false);
  };

  const loadTeam = async () => {
    if (!isAdmin) return;
    setIsTeamLoading(true);
    const users = await crmService.getUsers();
    setTeamUsers(users);
    setIsTeamLoading(false);
  };

  useEffect(() => {
    if (!currentUser) return;
    if (activeTab === 'dashboard') {
      loadStats();
      loadLeads();
    } else if (activeTab === 'leads') {
      loadLeads();
    } else if (activeTab === 'followups') {
      loadFollowups();
    } else if (activeTab === 'reports') {
      loadStats();
    } else if (activeTab === 'team') {
      loadTeam();
    }
  }, [currentUser, activeTab, statusFilter, tempFilter, sourceFilter, followupPeriodFilter, sortBy, sortOrder, page]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const result = await crmService.login(loginEmail, loginPassword);
    setIsLoggingIn(false);

    if (result.success && result.user) {
      setCurrentUser(result.user);
      showToast('success', `Welcome back, ${result.user.name} (${result.user.role.toUpperCase()})`);
    } else {
      setLoginError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleLogout = async () => {
    await crmService.logout();
    setCurrentUser(null);
    showToast('success', 'Logged out of Telecaller CRM.');
  };

  // Open Lead Details
  const handleOpenLeadDetails = async (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsDetailLoading(true);
    const data = await crmService.getLeadById(leadId);
    setSelectedLeadData(data);
    setIsDetailLoading(false);
  };

  // Open Log Call Modal
  const handleOpenLogCall = (lead: CrmLead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCallLeadTarget(lead);
    setCallOutcome('Interested');
    setCallNotes('');
    setCallFollowupDate('');
    setCallUpdateStatus(lead.status);
    setCallUpdateTemp(lead.temperature);
    setIsLogCallModalOpen(true);
  };

  // Submit Call Log
  const handleSubmitCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callLeadTarget) return;

    setIsSavingCall(true);
    const res = await crmService.logCall(callLeadTarget.id, {
      outcome: callOutcome,
      notes: callNotes,
      followup_datetime: callFollowupDate || undefined,
      updateStatus: (callUpdateStatus as LeadStatus) || undefined,
      updateTemperature: (callUpdateTemp as LeadTemperature) || undefined
    });
    setIsSavingCall(false);

    if (res.success) {
      showToast('success', `Call logged for ${callLeadTarget.name}`);
      setIsLogCallModalOpen(false);
      // Refresh current views
      loadLeads();
      if (activeTab === 'dashboard') loadStats();
      if (activeTab === 'followups') loadFollowups();
      if (selectedLeadId === callLeadTarget.id) {
        handleOpenLeadDetails(callLeadTarget.id);
      }
    } else {
      showToast('error', res.error || 'Failed to log call');
    }
  };

  // Open Add / Edit Lead
  const handleOpenAddLead = () => {
    setEditingLead(null);
    setLeadForm({
      name: '',
      phone: '',
      email: '',
      source: 'Website',
      interested_service: 'Turnkey Interior (Complete Home)',
      city: 'Bengaluru',
      budget: '',
      temperature: 'Warm',
      status: 'New',
      notes: '',
      next_followup_date: ''
    });
    setLeadFormError('');
    setDuplicateWarning(null);
    setIsLeadModalOpen(true);
  };

  const handleOpenEditLead = (lead: CrmLead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingLead(lead);
    setLeadForm({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || '',
      source: lead.source,
      interested_service: lead.interested_service,
      city: lead.city,
      budget: lead.budget || '',
      temperature: lead.temperature,
      status: lead.status,
      notes: lead.notes || '',
      next_followup_date: lead.next_followup_date ? lead.next_followup_date.slice(0, 16) : ''
    });
    setLeadFormError('');
    setDuplicateWarning(null);
    setIsLeadModalOpen(true);
  };

  // Check duplicate phone on blur
  const handlePhoneBlur = () => {
    const raw = leadForm.phone;
    if (!raw) return;
    const norm = normalizePhoneNumber(raw);
    const match = leads.find(l => l.normalized_phone === norm && (!editingLead || l.id !== editingLead.id));
    if (match) {
      setDuplicateWarning(`Warning: Phone number already belongs to "${match.name}" (ID: ${match.id}, Status: ${match.status})`);
    } else {
      setDuplicateWarning(null);
    }
  };

  // Save Lead Form
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadFormError('');

    if (!leadForm.name.trim()) {
      setLeadFormError('Customer name is required.');
      return;
    }
    if (!isValidPhoneNumber(leadForm.phone)) {
      setLeadFormError('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setIsSavingLead(true);

    if (editingLead) {
      // Update
      const res = await crmService.updateLead(editingLead.id, {
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email || undefined,
        source: leadForm.source,
        interested_service: leadForm.interested_service,
        city: leadForm.city,
        budget: leadForm.budget || undefined,
        temperature: leadForm.temperature,
        status: leadForm.status,
        notes: leadForm.notes || undefined,
        next_followup_date: leadForm.next_followup_date || undefined
      });
      setIsSavingLead(false);

      if (res.success) {
        showToast('success', `Lead "${leadForm.name}" updated successfully.`);
        setIsLeadModalOpen(false);
        loadLeads();
        if (selectedLeadId === editingLead.id) handleOpenLeadDetails(editingLead.id);
      } else {
        setLeadFormError(res.error || 'Failed to update lead.');
      }
    } else {
      // Create new
      const res = await crmService.createLead({
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email || undefined,
        source: leadForm.source,
        interested_service: leadForm.interested_service,
        city: leadForm.city,
        budget: leadForm.budget || undefined,
        temperature: leadForm.temperature,
        status: leadForm.status,
        notes: leadForm.notes || undefined,
        next_followup_date: leadForm.next_followup_date || undefined
      });
      setIsSavingLead(false);

      if (res.success) {
        showToast('success', `New lead "${leadForm.name}" created successfully.`);
        setIsLeadModalOpen(false);
        loadLeads();
        if (activeTab === 'dashboard') loadStats();
      } else {
        setLeadFormError(res.error || 'Failed to create lead.');
      }
    }
  };

  // Delete Lead (Admin Only)
  const handleDeleteLeadConfirm = async () => {
    if (!leadToDelete) return;
    setIsDeletingLead(true);
    const res = await crmService.deleteLead(leadToDelete.id);
    setIsDeletingLead(false);

    if (res.success) {
      showToast('success', `Lead "${leadToDelete.name}" deleted.`);
      setLeadToDelete(null);
      if (selectedLeadId === leadToDelete.id) {
        setSelectedLeadId(null);
        setSelectedLeadData(null);
      }
      loadLeads();
      if (activeTab === 'dashboard') loadStats();
    } else {
      showToast('error', res.error || 'Failed to delete lead.');
    }
  };

  // CSV File Handler
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsedRows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Basic CSV parsing splitting by commas outside quotes
        const line = lines[i];
        const values: string[] = [];
        let inQuotes = false;
        let current = '';
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const rowObj: Record<string, string> = {};
        headers.forEach((h, index) => {
          rowObj[h] = values[index] ? values[index].replace(/^"|"$/g, '').trim() : '';
        });
        parsedRows.push(rowObj);
      }

      setCsvPreviewRows(parsedRows.slice(0, 10)); // preview first 10
      (window as any).__full_parsed_csv_rows__ = parsedRows;
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = async () => {
    const fullRows = (window as any).__full_parsed_csv_rows__ || csvPreviewRows;
    if (!fullRows || fullRows.length === 0) {
      showToast('error', 'No rows found in uploaded CSV.');
      return;
    }

    setIsImportingCsv(true);
    const result = await crmService.importLeadsFromCsv(fullRows);
    setIsImportingCsv(false);
    setCsvImportResult(result);

    if (result.success) {
      showToast('success', `Imported ${result.imported} leads! (${result.skippedDuplicates} duplicates skipped).`);
      loadLeads();
      loadStats();
    } else {
      showToast('error', 'CSV import completed with issues.');
    }
  };

  // Add Team Member (Admin Only)
  const handleSaveNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewUserError('');
    if (!newUserForm.email || !newUserForm.name) {
      setNewUserError('Email and Name are required.');
      return;
    }
    setIsSavingUser(true);
    const res = await crmService.createUser(newUserForm);
    setIsSavingUser(false);

    if (res.success) {
      showToast('success', `User ${newUserForm.name} added as ${newUserForm.role}.`);
      setIsAddUserModalOpen(false);
      setNewUserForm({ email: '', name: '', role: 'telecaller', phone: '', password: '' });
      loadTeam();
    } else {
      setNewUserError(res.error || 'Failed to create user.');
    }
  };

  // Toggle user role or status
  const handleToggleUserStatus = async (user: CrmUserProfile) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const res = await crmService.updateUserRole(user.id, user.role, nextStatus);
    if (res.success) {
      showToast('success', `User ${user.name} marked as ${nextStatus}.`);
      loadTeam();
    } else {
      showToast('error', res.error || 'Failed to update user.');
    }
  };

  // Color badge helpers
  const getTempBadge = (temp: LeadTemperature) => {
    switch (temp) {
      case 'Hot':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30"><Flame className="w-3 h-3 text-rose-400" /> Hot</span>;
      case 'Warm':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"><Sparkles className="w-3 h-3 text-amber-400" /> Warm</span>;
      case 'Cold':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">Cold</span>;
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">New</span>;
      case 'Contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Contacted</span>;
      case 'Follow-up':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">Follow-up</span>;
      case 'Site Visit':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">Site Visit</span>;
      case 'Quotation':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Quotation</span>;
      case 'Qualified':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Qualified</span>;
      case 'Converted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">Converted</span>;
      case 'No Answer':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">No Answer</span>;
      case 'Lost':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-600/30 text-neutral-400 border border-neutral-600/30">Lost</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300">{status}</span>;
    }
  };

  // ---------------------------------------------------------------------------
  // 1. UNAUTHENTICATED LOGIN SCREEN
  // ---------------------------------------------------------------------------
  if (!currentUser && !isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#070A12] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
        {/* Ambient background glows */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-[#0D121F] border border-[#232D42] rounded-2xl shadow-2xl p-8 relative z-10">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#B38728] via-[#FBF5B7] to-[#DAA520] p-[2px] shadow-lg mb-4">
              <div className="w-full h-full bg-[#070A12] rounded-2xl flex items-center justify-center">
                <PhoneCall className="w-7 h-7 text-[#D4AF37]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              Royal Epic Interiors
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
              Telecaller CRM Workspace
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Subdomain: <code className="text-neutral-300 font-mono">tele.royalepicinteriors.com</code>
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="admin@royalepicinterior.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#141B2D] border border-[#232D42] rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#141B2D] border border-[#232D42] rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-gradient-to-r from-[#B38728] via-[#D4AF37] to-[#AA771C] text-neutral-950 font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Sign In to CRM</span>
                </>
              )}
            </button>
          </form>

          {/* Quick preset credentials helper */}
          <div className="mt-8 pt-6 border-t border-[#232D42]/60 text-xs">
            <p className="text-neutral-400 font-semibold mb-2">Pre-Configured System Accounts:</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('royalepicfurnitur1@gmail.com');
                  setLoginPassword('Admin@123');
                }}
                className="p-2 bg-[#141B2D] hover:bg-[#1C263F] border border-[#232D42] rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-[#D4AF37]">Primary Admin</div>
                <div className="text-neutral-400 truncate">royalepicfurnitur1@...</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('telecaller@royalepicinterior.com');
                  setLoginPassword('Caller@2026');
                }}
                className="p-2 bg-[#141B2D] hover:bg-[#1C263F] border border-[#232D42] rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-cyan-400">Telecaller Agent</div>
                <div className="text-neutral-400 truncate">telecaller@royalepic...</div>
              </button>
            </div>
          </div>

          {onBackToWebsite && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onBackToWebsite}
                className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Royal Epic Public Website
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATED CRM INTERFACE
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#070A12] text-white flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' 
            : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-[#0D121F] border-b border-[#232D42] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#B38728] via-[#FBF5B7] to-[#DAA520] p-[1.5px] shadow">
                <div className="w-full h-full bg-[#070A12] rounded-xl flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 text-[#D4AF37]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white tracking-tight">Royal Epic Interiors</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                    Telecaller CRM
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                  tele.royalepicinteriors.com
                </span>
              </div>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddLead}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D4AF37] text-neutral-950 text-xs font-bold rounded-lg shadow hover:brightness-110 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Lead</span>
              </button>

              <div className="h-6 w-px bg-[#232D42] hidden sm:block" />

              <div className="flex items-center gap-2 text-right">
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-white">{currentUser?.name}</div>
                  <div className="text-[10px] font-mono text-neutral-400">{currentUser?.email}</div>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                  isAdmin 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}>
                  {currentUser?.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 text-neutral-400 hover:text-white hover:bg-[#172033] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-4 border-t border-[#232D42]/60 overflow-x-auto py-2 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-[#1C263F] text-[#D4AF37] border border-[#D4AF37]/30 shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-[#141B2D]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'leads'
                  ? 'bg-[#1C263F] text-[#D4AF37] border border-[#D4AF37]/30 shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-[#141B2D]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Leads</span>
              {totalLeadsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                  {totalLeadsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('followups')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'followups'
                  ? 'bg-[#1C263F] text-[#D4AF37] border border-[#D4AF37]/30 shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-[#141B2D]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Follow-ups</span>
              {stats && stats.followupsDueToday > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono border border-rose-500/40">
                  {stats.followupsDueToday}
                </span>
              )}
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('import')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'import'
                    ? 'bg-[#1C263F] text-[#D4AF37] border border-[#D4AF37]/30 shadow'
                    : 'text-neutral-400 hover:text-white hover:bg-[#141B2D]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>CSV Import</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-[#1C263F] text-[#D4AF37] border border-[#D4AF37]/30 shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-[#141B2D]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('team')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'team'
                    ? 'bg-[#1C263F] text-[#D4AF37] border border-[#D4AF37]/30 shadow'
                    : 'text-neutral-400 hover:text-white hover:bg-[#141B2D]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Team & Users</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* =================================================================== */}
        {/* TAB 1: DASHBOARD                                                   */}
        {/* =================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-4 shadow">
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                  <span>Total CRM Leads</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">
                  {stats ? stats.totalLeads : <span className="animate-pulse">--</span>}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">Verified Inquiries</div>
              </div>

              <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-4 shadow">
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                  <span>Hot Leads</span>
                  <Flame className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-rose-400 font-mono">
                  {stats ? stats.hotLeads : <span className="animate-pulse">--</span>}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">High conversion intent</div>
              </div>

              <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-4 shadow">
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                  <span>Calls Logged Today</span>
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {stats ? stats.callsToday : <span className="animate-pulse">--</span>}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">Daily telecalling activity</div>
              </div>

              <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-4 shadow">
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                  <span>Follow-ups Due Today</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  {stats ? stats.followupsDueToday : <span className="animate-pulse">--</span>}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  {stats && stats.followupsOverdue > 0 ? (
                    <span className="text-rose-400 font-semibold">{stats.followupsOverdue} overdue</span>
                  ) : (
                    'No overdue calls'
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Action Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Priority Action Queue */}
              <div className="lg:col-span-2 bg-[#0D121F] border border-[#232D42] rounded-xl p-5 shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <PhoneForwarded className="w-4 h-4 text-[#D4AF37]" />
                      Today's Telecaller Action Queue
                    </h2>
                    <p className="text-xs text-neutral-400">
                      High priority and due follow-up calls requiring action today
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('followups')}
                    className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {leads.slice(0, 5).map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => handleOpenLeadDetails(lead.id)}
                      className="p-3 bg-[#141B2D] hover:bg-[#1A233A] border border-[#232D42] rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-white truncate">{lead.name}</span>
                          {getTempBadge(lead.temperature)}
                          {getStatusBadge(lead.status)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-400 truncate">
                          <span className="flex items-center gap-1 font-mono text-neutral-300">
                            <Phone className="w-3 h-3 text-[#D4AF37]" />
                            {formatPhoneDisplay(lead.phone)}
                          </span>
                          <span className="hidden sm:inline truncate">{lead.interested_service}</span>
                          <span className="hidden md:inline text-neutral-500">• {lead.city}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Direct Click to Call */}
                        <a
                          href={`tel:${normalizePhoneNumber(lead.phone)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                          title="Call immediately from mobile dialer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Call</span>
                        </a>

                        {/* Log Outcome Button */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenLogCall(lead, e)}
                          className="px-2.5 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-neutral-950 border border-[#D4AF37]/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Log Call</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {leads.length === 0 && !isLeadsLoading && (
                    <div className="text-center py-8 text-neutral-400 text-xs">
                      No active leads found in queue. Click "New Lead" to add one.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Quick Shortcuts & Summary */}
              <div className="space-y-4">
                <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-5 shadow">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleOpenAddLead}
                      className="w-full py-2.5 px-3 bg-[#D4AF37] hover:brightness-110 text-neutral-950 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add New Lead
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('followups');
                        setFollowupSubTab('dueToday');
                      }}
                      className="w-full py-2.5 px-3 bg-[#141B2D] hover:bg-[#1C263F] border border-[#232D42] text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Today's Follow-ups
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px]">
                        {stats?.followupsDueToday || 0}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('leads');
                        setTempFilter('Hot');
                      }}
                      className="w-full py-2.5 px-3 bg-[#141B2D] hover:bg-[#1C263F] border border-[#232D42] text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-400" />
                        Hot Inquiries
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px]">
                        {stats?.hotLeads || 0}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Lead Temperature Distribution Card */}
                {stats && (
                  <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-5 shadow">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">
                      Temperature Breakdown
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-rose-400">
                          <Flame className="w-3.5 h-3.5" /> Hot Leads
                        </span>
                        <span className="font-mono font-bold">{stats.temperatureDistribution.hot}</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-1.5">
                        <div
                          className="bg-rose-500 h-1.5 rounded-full"
                          style={{ width: `${stats.totalLeads > 0 ? (stats.temperatureDistribution.hot / stats.totalLeads) * 100 : 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <Sparkles className="w-3.5 h-3.5" /> Warm Leads
                        </span>
                        <span className="font-mono font-bold">{stats.temperatureDistribution.warm}</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-1.5">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full"
                          style={{ width: `${stats.totalLeads > 0 ? (stats.temperatureDistribution.warm / stats.totalLeads) * 100 : 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          Cold Leads
                        </span>
                        <span className="font-mono font-bold">{stats.temperatureDistribution.cold}</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-1.5">
                        <div
                          className="bg-slate-500 h-1.5 rounded-full"
                          style={{ width: `${stats.totalLeads > 0 ? (stats.temperatureDistribution.cold / stats.totalLeads) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: ALL LEADS DIRECTORY                                         */}
        {/* =================================================================== */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-4 shadow space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by customer name, phone, email, notes or service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadLeads()}
                    className="w-full pl-10 pr-4 py-2 bg-[#141B2D] border border-[#232D42] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={loadLeads}
                    className="px-3.5 py-2 bg-[#1C263F] hover:bg-[#253252] border border-[#232D42] text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer text-white"
                  >
                    <Search className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Search</span>
                  </button>
                  <button
                    onClick={handleOpenAddLead}
                    className="px-3.5 py-2 bg-[#D4AF37] hover:brightness-110 text-neutral-950 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lead</span>
                  </button>
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#232D42]/60 text-xs">
                <span className="text-neutral-400 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
                  <Filter className="w-3 h-3 text-[#D4AF37]" /> Filters:
                </span>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1 bg-[#141B2D] border border-[#232D42] rounded-md text-xs text-neutral-300 focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="All">All Statuses</option>
                  {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Temperature Filter */}
                <select
                  value={tempFilter}
                  onChange={(e) => setTempFilter(e.target.value)}
                  className="px-2.5 py-1 bg-[#141B2D] border border-[#232D42] rounded-md text-xs text-neutral-300 focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="All">All Temperatures</option>
                  <option value="Hot">🔥 Hot</option>
                  <option value="Warm">✨ Warm</option>
                  <option value="Cold">❄️ Cold</option>
                </select>

                {/* Source Filter */}
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-2.5 py-1 bg-[#141B2D] border border-[#232D42] rounded-md text-xs text-neutral-300 focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="All">All Sources</option>
                  {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Follow-up Period */}
                <select
                  value={followupPeriodFilter}
                  onChange={(e) => setFollowupPeriodFilter(e.target.value as any)}
                  className="px-2.5 py-1 bg-[#141B2D] border border-[#232D42] rounded-md text-xs text-neutral-300 focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="all">Any Follow-up</option>
                  <option value="today">Due Today</option>
                  <option value="overdue">Overdue</option>
                  <option value="upcoming">Upcoming</option>
                </select>

                {/* Sort By */}
                <div className="ml-auto flex items-center gap-1 text-[11px] text-neutral-400">
                  <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1 bg-[#141B2D] border border-[#232D42] rounded-md text-xs text-neutral-300"
                  >
                    <option value="created_at">Newest First</option>
                    <option value="next_followup_date">Follow-up Date</option>
                    <option value="name">Customer Name</option>
                    <option value="temperature">Priority / Temp</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-[#0D121F] border border-[#232D42] rounded-xl overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141B2D] text-neutral-400 uppercase tracking-wider font-semibold border-b border-[#232D42]">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Service & Budget</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Priority & Status</th>
                      <th className="py-3 px-4">Next Follow-up</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232D42]/60">
                    {leads.map(lead => (
                      <tr
                        key={lead.id}
                        onClick={() => handleOpenLeadDetails(lead.id)}
                        className="hover:bg-[#141B2D]/80 transition-colors cursor-pointer group"
                      >
                        {/* Customer */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                            {lead.name}
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-neutral-500" />
                            {formatPhoneDisplay(lead.phone)}
                          </div>
                          {lead.city && (
                            <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {lead.city}
                            </div>
                          )}
                        </td>

                        {/* Service & Budget */}
                        <td className="py-3 px-4">
                          <div className="text-neutral-200 font-medium truncate max-w-[200px]">
                            {lead.interested_service}
                          </div>
                          {lead.budget && (
                            <div className="text-neutral-400 text-[11px]">
                              Budget: <span className="text-[#D4AF37]">{lead.budget}</span>
                            </div>
                          )}
                        </td>

                        {/* Source */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px] font-medium border border-neutral-700">
                            {lead.source}
                          </span>
                        </td>

                        {/* Priority & Status */}
                        <td className="py-3 px-4 space-y-1">
                          <div>{getTempBadge(lead.temperature)}</div>
                          <div>{getStatusBadge(lead.status)}</div>
                        </td>

                        {/* Next Followup */}
                        <td className="py-3 px-4">
                          {lead.next_followup_date ? (
                            <div className="text-[11px]">
                              <div className="font-semibold text-neutral-200">
                                {new Date(lead.next_followup_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-neutral-400 text-[10px]">
                                {new Date(lead.next_followup_date).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-[11px]">Not scheduled</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Click to call link */}
                            <a
                              href={`tel:${normalizePhoneNumber(lead.phone)}`}
                              className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg transition-colors"
                              title="Click to dial"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>

                            {/* Log Call */}
                            <button
                              onClick={(e) => handleOpenLogCall(lead, e)}
                              className="p-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-neutral-950 border border-[#D4AF37]/30 rounded-lg transition-colors cursor-pointer"
                              title="Record call outcome"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={(e) => handleOpenEditLead(lead, e)}
                              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Edit lead details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete (Admin only) */}
                            {isAdmin && (
                              <button
                                onClick={() => setLeadToDelete(lead)}
                                className="p-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                                title="Delete lead (Admin only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {leads.length === 0 && !isLeadsLoading && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-neutral-400 text-xs">
                          No leads matched the current search or filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: FOLLOW-UPS DASHBOARD                                         */}
        {/* =================================================================== */}
        {activeTab === 'followups' && (
          <div className="space-y-4">
            {/* Sub-tabs header */}
            <div className="flex items-center justify-between bg-[#0D121F] border border-[#232D42] rounded-xl p-3 shadow">
              <div className="flex space-x-2">
                <button
                  onClick={() => setFollowupSubTab('dueToday')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    followupSubTab === 'dueToday'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                      : 'text-neutral-400 hover:text-white hover:bg-[#141B2D]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Due Today</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 font-mono text-[11px]">
                    {followupsData.dueToday.length}
                  </span>
                </button>

                <button
                  onClick={() => setFollowupSubTab('overdue')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    followupSubTab === 'overdue'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
                      : 'text-neutral-400 hover:text-white hover:bg-[#141B2D]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Overdue</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-200 font-mono text-[11px]">
                    {followupsData.overdue.length}
                  </span>
                </button>

                <button
                  onClick={() => setFollowupSubTab('upcoming')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    followupSubTab === 'upcoming'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow'
                      : 'text-neutral-400 hover:text-white hover:bg-[#141B2D]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Upcoming</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-200 font-mono text-[11px]">
                    {followupsData.upcoming.length}
                  </span>
                </button>
              </div>

              <button
                onClick={loadFollowups}
                className="p-2 bg-[#141B2D] hover:bg-[#1C263F] border border-[#232D42] text-neutral-300 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                title="Refresh follow-ups"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFollowupsLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Follow-up Cards List */}
            <div className="space-y-3">
              {followupsData[followupSubTab].map(lead => (
                <div
                  key={lead.id}
                  onClick={() => handleOpenLeadDetails(lead.id)}
                  className="bg-[#0D121F] hover:bg-[#141B2D] border border-[#232D42] rounded-xl p-4 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-base text-white group-hover:text-[#D4AF37] transition-colors">
                        {lead.name}
                      </span>
                      {getTempBadge(lead.temperature)}
                      {getStatusBadge(lead.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-neutral-400">
                      <div className="flex items-center gap-1.5 text-neutral-300 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {formatPhoneDisplay(lead.phone)}
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-neutral-500" />
                        {lead.interested_service}
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Scheduled: {lead.next_followup_date ? new Date(lead.next_followup_date).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </div>
                    </div>

                    {lead.notes && (
                      <p className="mt-2 text-xs text-neutral-400 line-clamp-1 italic bg-[#141B2D] p-1.5 rounded border border-[#232D42]/60">
                        "{lead.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${normalizePhoneNumber(lead.phone)}`}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                      title="Call now from phone"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Now</span>
                    </a>

                    <button
                      onClick={(e) => handleOpenLogCall(lead, e)}
                      className="px-3 py-2 bg-[#D4AF37] hover:brightness-110 text-neutral-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Log Outcome</span>
                    </button>
                  </div>
                </div>
              ))}

              {followupsData[followupSubTab].length === 0 && !isFollowupsLoading && (
                <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-12 text-center text-neutral-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-white">No follow-ups in this queue</p>
                  <p className="mt-1">All scheduled calls for this section are up to date.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: CSV IMPORT (ADMIN ONLY)                                      */}
        {/* =================================================================== */}
        {activeTab === 'import' && isAdmin && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#D4AF37]" />
                    Bulk Lead Import (CSV)
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Import leads from Justdial, IndiaMART, Facebook Leads, or Excel exports.
                  </p>
                </div>

                {/* Sample CSV Download */}
                <button
                  type="button"
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8,Name,Phone,Email,Source,Service,City,Budget,Temperature,Status,Notes\n" +
                      "Vikram Sharma,9845012345,vikram@example.com,Justdial,Modular Kitchen,Bengaluru,₹15 Lakhs,Hot,New,Wants modern acrylic finish\n" +
                      "Priya Rao,9886011223,priya@example.com,IndiaMART,Turnkey Interior,Bengaluru,₹35 Lakhs,Warm,New,Villa in Hebbal";
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "royal_epic_leads_sample.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-1.5 bg-[#141B2D] hover:bg-[#1C263F] border border-[#232D42] text-xs font-semibold rounded-lg text-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Upload Zone */}
              <div className="border-2 border-dashed border-[#232D42] hover:border-[#D4AF37]/60 rounded-xl p-8 text-center transition-colors">
                <FileText className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-white mb-1">
                  Choose a CSV file to upload
                </p>
                <p className="text-xs text-neutral-400 mb-4">
                  Supported columns: <code className="text-neutral-300">Name, Phone, Email, Source, Service, City, Budget, Temperature, Status, Notes</code>
                </p>

                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-neutral-950 text-xs font-bold rounded-lg cursor-pointer hover:brightness-110 shadow"
                >
                  <Upload className="w-4 h-4" />
                  <span>Browse CSV File</span>
                </label>
              </div>

              {/* Preview and Validation */}
              {csvPreviewRows.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      File Preview ({csvPreviewRows.length} sample rows shown)
                    </h3>
                    <button
                      onClick={handleConfirmCsvImport}
                      disabled={isImportingCsv}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
                    >
                      {isImportingCsv ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Confirm & Import Leads</span>
                    </button>
                  </div>

                  <div className="border border-[#232D42] rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#141B2D] text-neutral-400 uppercase text-[10px]">
                        <tr>
                          {Object.keys(csvPreviewRows[0] || {}).map(k => (
                            <th key={k} className="py-2 px-3">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#232D42]">
                        {csvPreviewRows.map((row, i) => (
                          <tr key={i} className="hover:bg-[#141B2D]/50 text-neutral-300">
                            {Object.values(row).map((val: any, vi) => (
                              <td key={vi} className="py-2 px-3 truncate max-w-[150px]">{String(val || '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Results Summary */}
              {csvImportResult && (
                <div className="mt-6 p-4 bg-[#141B2D] border border-[#232D42] rounded-xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    CSV Import Complete
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-center font-mono">
                    <div className="bg-[#0D121F] p-2 rounded border border-[#232D42]">
                      <div className="text-neutral-400 text-[10px]">Total Rows</div>
                      <div className="font-bold text-white">{csvImportResult.total}</div>
                    </div>
                    <div className="bg-[#0D121F] p-2 rounded border border-emerald-500/30">
                      <div className="text-emerald-400 text-[10px]">Imported</div>
                      <div className="font-bold text-emerald-300">{csvImportResult.imported}</div>
                    </div>
                    <div className="bg-[#0D121F] p-2 rounded border border-amber-500/30">
                      <div className="text-amber-400 text-[10px]">Duplicates Skipped</div>
                      <div className="font-bold text-amber-300">{csvImportResult.skippedDuplicates}</div>
                    </div>
                    <div className="bg-[#0D121F] p-2 rounded border border-rose-500/30">
                      <div className="text-rose-400 text-[10px]">Invalid Rows</div>
                      <div className="font-bold text-rose-300">{csvImportResult.invalidRows}</div>
                    </div>
                  </div>

                  {csvImportResult.errors.length > 0 && (
                    <div className="text-xs text-rose-300 space-y-1 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 max-h-40 overflow-y-auto">
                      <div className="font-semibold text-rose-400">Row Errors:</div>
                      {csvImportResult.errors.map((err, i) => <div key={i}>• {err}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: REPORTS & METRICS                                           */}
        {/* =================================================================== */}
        {activeTab === 'reports' && stats && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
                  Telecalling Analytics & Conversion Reports
                </h2>
                <p className="text-xs text-neutral-400">
                  Real-time conversion metrics, lead sources and pipeline volume
                </p>
              </div>

              {/* Export CSV button (Admin Only) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const csvRows = [
                      ["ID", "Name", "Phone", "Email", "Source", "Service", "City", "Budget", "Temperature", "Status", "Created At"],
                      ...leads.map(l => [
                        l.id,
                        `"${l.name}"`,
                        l.phone,
                        l.email || "",
                        l.source,
                        `"${l.interested_service}"`,
                        l.city,
                        l.budget || "",
                        l.temperature,
                        l.status,
                        l.created_at
                      ])
                    ];
                    const csvString = csvRows.map(r => r.join(",")).join("\n");
                    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvString);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `royal_epic_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3.5 py-2 bg-[#141B2D] hover:bg-[#1C263F] border border-[#232D42] text-xs font-semibold rounded-lg text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Export All Leads (CSV)</span>
                </button>
              )}
            </div>

            {/* KPI Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-4 shadow">
                <div className="text-xs text-neutral-400">Conversion Rate</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                  {stats.conversionRate}%
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">{stats.convertedLeads} converted of {stats.totalLeads} total</div>
              </div>

              <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-4 shadow">
                <div className="text-xs text-neutral-400">Qualified Pipeline</div>
                <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">
                  {stats.qualifiedLeads}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">Site visit / BOQ stage</div>
              </div>

              <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-4 shadow">
                <div className="text-xs text-neutral-400">New Inquiries</div>
                <div className="text-2xl font-bold text-blue-400 font-mono mt-1">
                  {stats.newLeads}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">Pending initial call</div>
              </div>

              <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-4 shadow">
                <div className="text-xs text-neutral-400">Calls Logged Today</div>
                <div className="text-2xl font-bold text-[#D4AF37] font-mono mt-1">
                  {stats.callsToday}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">Active telecalling shifts</div>
              </div>
            </div>

            {/* Source and Status Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Source */}
              <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-5 shadow">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#D4AF37]" /> Leads by Marketing Source
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.leadsBySource).map(([src, count]) => {
                    const pct = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
                    return (
                      <div key={src} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="text-neutral-300">{src}</span>
                          <span className="text-neutral-400 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div className="bg-[#D4AF37] h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Status */}
              <div className="bg-[#0D121F] border border-[#232D42] rounded-xl p-5 shadow">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#D4AF37]" /> Conversion Funnel Statuses
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.leadsByStatus).map(([st, count]) => {
                    const pct = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
                    return (
                      <div key={st} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="text-neutral-300">{st}</span>
                          <span className="text-neutral-400 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 6: TEAM & USERS (ADMIN ONLY)                                    */}
        {/* =================================================================== */}
        {activeTab === 'team' && isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#D4AF37]" />
                  Telecaller Staff & Role Management
                </h2>
                <p className="text-xs text-neutral-400">
                  Manage CRM user accounts, passwords, and telecaller permissions
                </p>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-3.5 py-2 bg-[#D4AF37] hover:brightness-110 text-neutral-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>

            <div className="bg-[#0D121F] border border-[#232D42] rounded-xl overflow-hidden shadow">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141B2D] text-neutral-400 uppercase tracking-wider font-semibold border-b border-[#232D42]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232D42]/60">
                  {teamUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[#141B2D]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-300">
                        {u.phone ? formatPhoneDisplay(u.phone) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-neutral-700 text-neutral-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors cursor-pointer"
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL: LOG CALL OUTCOME                                            */}
      {/* =================================================================== */}
      {isLogCallModalOpen && callLeadTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D121F] border border-[#232D42] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232D42]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-[#D4AF37]" />
                  Log Call Outcome
                </h3>
                <p className="text-xs text-neutral-400">
                  Lead: <span className="text-white font-semibold">{callLeadTarget.name}</span> ({formatPhoneDisplay(callLeadTarget.phone)})
                </p>
              </div>
              <button
                onClick={() => setIsLogCallModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCallLog} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Call Outcome *
                </label>
                <select
                  required
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value as CallOutcome)}
                  className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {CALL_OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Call Notes / Customer Discussion
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize customer feedback, requirements, objections, or measurements discussed..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Update Status
                  </label>
                  <select
                    value={callUpdateStatus}
                    onChange={(e) => setCallUpdateStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Update Temperature
                  </label>
                  <select
                    value={callUpdateTemp}
                    onChange={(e) => setCallUpdateTemp(e.target.value as LeadTemperature)}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Hot">🔥 Hot</option>
                    <option value="Warm">✨ Warm</option>
                    <option value="Cold">❄️ Cold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Schedule Next Follow-up (Date & Time)
                </label>
                <input
                  type="datetime-local"
                  value={callFollowupDate}
                  onChange={(e) => setCallFollowupDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#232D42]">
                <button
                  type="button"
                  onClick={() => setIsLogCallModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCall}
                  className="px-5 py-2 bg-[#D4AF37] hover:brightness-110 text-neutral-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
                >
                  {isSavingCall ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Call Outcome</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT LEAD                                              */}
      {/* =================================================================== */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D121F] border border-[#232D42] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#232D42]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#D4AF37]" />
                {editingLead ? 'Edit Lead Details' : 'Create New Lead'}
              </h3>
              <button
                onClick={() => setIsLeadModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {leadFormError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{leadFormError}</span>
              </div>
            )}

            {duplicateWarning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <form onSubmit={handleSaveLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Sharma"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98450 12345"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    onBlur={handlePhoneBlur}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="Bengaluru (Thanisandra)"
                    value={leadForm.city}
                    onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Lead Source
                  </label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value as LeadSource })}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Interested Service
                  </label>
                  <select
                    value={leadForm.interested_service}
                    onChange={(e) => setLeadForm({ ...leadForm, interested_service: e.target.value })}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {POPULAR_SERVICES.map(srv => <option key={srv} value={srv}>{srv}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Budget
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹15 - ₹25 Lakhs"
                    value={leadForm.budget}
                    onChange={(e) => setLeadForm({ ...leadForm, budget: e.target.value })}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Temperature
                  </label>
                  <select
                    value={leadForm.temperature}
                    onChange={(e) => setLeadForm({ ...leadForm, temperature: e.target.value as LeadTemperature })}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Hot">🔥 Hot</option>
                    <option value="Warm">✨ Warm</option>
                    <option value="Cold">❄️ Cold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as LeadStatus })}
                    className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Customer Notes & Requirements
                </label>
                <textarea
                  rows={2}
                  placeholder="Property dimensions, possession date, interior theme requested..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Next Follow-up Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={leadForm.next_followup_date}
                  onChange={(e) => setLeadForm({ ...leadForm, next_followup_date: e.target.value })}
                  className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#232D42]">
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLead}
                  className="px-5 py-2 bg-[#D4AF37] hover:brightness-110 text-neutral-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
                >
                  {isSavingLead ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingLead ? 'Update Lead' : 'Save Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SLIDE-OVER: LEAD DETAILS & CALL HISTORY                            */}
      {/* =================================================================== */}
      {selectedLeadId && selectedLeadData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end">
          <div className="bg-[#0D121F] border-l border-[#232D42] max-w-xl w-full h-full flex flex-col shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="p-6 bg-[#141B2D] border-b border-[#232D42] flex items-center justify-between sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-white">{selectedLeadData.lead.name}</h2>
                  {getTempBadge(selectedLeadData.lead.temperature)}
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  ID: {selectedLeadData.lead.id} • Added: {new Date(selectedLeadData.lead.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedLeadId(null);
                  setSelectedLeadData(null);
                }}
                className="p-2 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Quick Actions Bar */}
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${normalizePhoneNumber(selectedLeadData.lead.phone)}`}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {formatPhoneDisplay(selectedLeadData.lead.phone)}</span>
                </a>
                <button
                  onClick={() => handleOpenLogCall(selectedLeadData.lead)}
                  className="flex-1 py-2 px-3 bg-[#D4AF37] hover:brightness-110 text-neutral-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Log Call Outcome</span>
                </button>
              </div>

              {/* Customer Info Card */}
              <div className="bg-[#141B2D] border border-[#232D42] rounded-xl p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Status</span>
                    <div className="mt-0.5">{getStatusBadge(selectedLeadData.lead.status)}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Source</span>
                    <span className="font-semibold text-neutral-200">{selectedLeadData.lead.source}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Interested Service</span>
                    <span className="font-semibold text-white">{selectedLeadData.lead.interested_service}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Location</span>
                    <span className="font-semibold text-neutral-200">{selectedLeadData.lead.city}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Budget</span>
                    <span className="font-semibold text-[#D4AF37]">{selectedLeadData.lead.budget || 'Custom Quote'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Next Follow-up</span>
                    <span className="font-semibold text-amber-300">
                      {selectedLeadData.lead.next_followup_date
                        ? new Date(selectedLeadData.lead.next_followup_date).toLocaleString()
                        : 'Not set'}
                    </span>
                  </div>
                </div>

                {selectedLeadData.lead.notes && (
                  <div className="pt-2 border-t border-[#232D42]/60">
                    <span className="text-neutral-500 uppercase tracking-wider text-[10px] block mb-1">Notes</span>
                    <p className="text-neutral-300 whitespace-pre-wrap">{selectedLeadData.lead.notes}</p>
                  </div>
                )}
              </div>

              {/* Call History Timeline */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Call Log History ({selectedLeadData.callLogs.length})
                </h3>

                <div className="space-y-3">
                  {selectedLeadData.callLogs.map(log => (
                    <div key={log.id} className="bg-[#141B2D] border border-[#232D42] rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white px-2 py-0.5 rounded bg-neutral-800 text-[11px]">
                          {log.outcome}
                        </span>
                        <span className="text-neutral-400 font-mono text-[11px]">
                          {new Date(log.call_datetime).toLocaleString()}
                        </span>
                      </div>

                      {log.notes && (
                        <p className="text-neutral-300 pt-1 text-[11px]">
                          {log.notes}
                        </p>
                      )}

                      <div className="text-[10px] text-neutral-500 flex items-center justify-between pt-1 border-t border-[#232D42]/40">
                        <span>Logged by: {log.logged_by}</span>
                        {log.followup_datetime && (
                          <span className="text-amber-400">
                            Follow-up: {new Date(log.followup_datetime).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {selectedLeadData.callLogs.length === 0 && (
                    <div className="text-center py-6 text-neutral-500 text-xs bg-[#141B2D]/50 rounded-xl border border-[#232D42]">
                      No calls logged yet for this lead. Click "Log Call Outcome" above to record the first call.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DELETE LEAD CONFIRMATION (ADMIN ONLY)                       */}
      {/* =================================================================== */}
      {leadToDelete && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D121F] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete CRM Lead?</h3>
                <p className="text-xs text-neutral-400">This action will be permanently recorded in audit logs.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300">
              Are you sure you want to delete lead <strong className="text-white">"{leadToDelete.name}"</strong> ({formatPhoneDisplay(leadToDelete.phone)})? All associated call logs will also be removed.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#232D42]">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLeadConfirm}
                disabled={isDeletingLead}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
              >
                {isDeletingLead ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD USER (ADMIN ONLY)                                       */}
      {/* =================================================================== */}
      {isAddUserModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D121F] border border-[#232D42] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232D42]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#D4AF37]" />
                Add Telecaller or Admin
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newUserError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {newUserError}
              </div>
            )}

            <form onSubmit={handleSaveNewUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="priya@royalepicinterior.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98450 11223"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  User Role *
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="telecaller">Telecaller (View leads, log calls, schedule follow-ups)</option>
                  <option value="admin">Administrator (Full CRM access, user management, CSV import, delete)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  placeholder="Leave blank for default (Password@123)"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-[#141B2D] border border-[#232D42] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#232D42]">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-5 py-2 bg-[#D4AF37] hover:brightness-110 text-neutral-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
                >
                  {isSavingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
