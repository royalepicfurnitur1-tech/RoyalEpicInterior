import React, { useState, useEffect } from 'react';
import { 
  CrmLead, 
  CrmFilterState, 
  LeadStatus, 
  LeadSource, 
  ServiceRequired,
  BudgetRange,
  LEAD_SOURCES,
  SERVICES_REQUIRED,
  LEAD_STATUSES,
  BUDGET_RANGES
} from '../types';
import { 
  fetchCrmLeads, 
  deleteCrmLead, 
  downloadCrmLeadsCsv, 
  getCrmAuthHeaders 
} from '../crmService';
import { useCrmAuth } from '../CrmAuthContext';
import { 
  Search, 
  Filter, 
  Phone, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar, 
  MapPin, 
  ArrowUpDown,
  RefreshCw,
  PhoneCall,
  Download,
  Trash2,
  Eye,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  User
} from 'lucide-react';

interface CrmLeadsListProps {
  onSelectLead: (lead: CrmLead) => void;
  onOpenCreateLead: () => void;
  onQuickCall: (lead: CrmLead) => void;
  initialFilters?: Partial<CrmFilterState>;
}

export const CrmLeadsList: React.FC<CrmLeadsListProps> = ({
  onSelectLead,
  onOpenCreateLead,
  onQuickCall,
  initialFilters
}) => {
  const { isAdmin } = useCrmAuth();

  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [usersList, setUsersList] = useState<Array<{ id: string; name: string }>>([]);

  const [filters, setFilters] = useState<CrmFilterState>({
    search: initialFilters?.search || '',
    source: initialFilters?.source || 'All',
    service: initialFilters?.service || 'All',
    status: initialFilters?.status || 'All',
    budget: initialFilters?.budget || 'All',
    location: initialFilters?.location || '',
    assigned_to: initialFilters?.assigned_to || 'All',
    followup_filter: initialFilters?.followup_filter || 'All',
    followup_date: initialFilters?.followup_date || '',
    created_date: initialFilters?.created_date || 'All',
    sortBy: initialFilters?.sortBy || 'created_desc',
    page: 1,
    pageSize: 15
  });

  // Sync if initialFilters changes (e.g. from Dashboard KPI click)
  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({
        ...prev,
        ...initialFilters,
        page: 1
      }));
    }
  }, [initialFilters]);

  // Fetch users for assignment filter dropdown
  useEffect(() => {
    fetch('/api/crm/users', { headers: getCrmAuthHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.users)) {
          setUsersList(d.users);
        }
      })
      .catch(() => {});
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCrmLeads(filters);
      if (res.error) {
        setError(res.error);
      } else {
        setLeads(res.leads);
        setTotalLeads(res.total);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [
    filters.page, 
    filters.pageSize, 
    filters.status, 
    filters.source, 
    filters.service, 
    filters.budget, 
    filters.assigned_to, 
    filters.followup_filter, 
    filters.followup_date, 
    filters.created_date, 
    filters.sortBy
  ]);

  // Debounced search & location filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, page: 1 }));
      loadLeads();
    }, 350);
    return () => clearTimeout(timer);
  }, [filters.search, filters.location]);

  const totalPages = Math.ceil(totalLeads / filters.pageSize) || 1;

  const handleResetFilters = () => {
    setFilters({
      search: '',
      source: 'All',
      service: 'All',
      status: 'All',
      budget: 'All',
      location: '',
      assigned_to: 'All',
      followup_filter: 'All',
      followup_date: '',
      created_date: 'All',
      sortBy: 'created_desc',
      page: 1,
      pageSize: 15
    });
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleDeleteLead = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to permanently delete lead "${name}"? This action cannot be undone.`)) {
      const res = await deleteCrmLead(id);
      if (res.success) {
        loadLeads();
      } else {
        alert(res.error || 'Failed to delete lead');
      }
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    await downloadCrmLeadsCsv();
    setExportingCsv(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New Lead':
      case 'New':
        return 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80';
      case 'Contacted':
        return 'bg-blue-950/80 text-blue-400 border border-blue-800/80';
      case 'Follow-up Required':
      case 'Follow-up':
        return 'bg-amber-950/80 text-amber-400 border border-amber-800/80';
      case 'Interested':
        return 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-semibold';
      case 'Site Visit Scheduled':
        return 'bg-purple-950/80 text-purple-300 border border-purple-800/80';
      case 'Quotation Sent':
        return 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/80';
      case 'Negotiation':
        return 'bg-yellow-950/80 text-yellow-300 border border-yellow-800/80';
      case 'Converted':
        return 'bg-amber-400/20 text-amber-300 border border-amber-400 font-bold';
      case 'Not Interested':
      case 'Not Reachable':
      case 'Lost':
        return 'bg-red-950/80 text-red-400 border border-red-800/80';
      default:
        return 'bg-neutral-800 text-neutral-300 border border-neutral-700';
    }
  };

  // Check if follow-up is overdue or today
  const getFollowupHighlight = (dateStr?: string, status?: string) => {
    if (!dateStr || status === 'Converted' || status === 'Lost') return null;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;
    const target = new Date(dateStr).getTime();

    if (target < todayStart) {
      return { isOverdue: true, label: 'OVERDUE', color: 'text-red-400 bg-red-950/60 border border-red-800' };
    }
    if (target >= todayStart && target < todayEnd) {
      return { isToday: true, label: 'DUE TODAY', color: 'text-amber-300 bg-amber-950/60 border border-amber-700' };
    }
    return null;
  };

  const isFiltered = Boolean(
    filters.search || 
    filters.source !== 'All' || 
    filters.service !== 'All' || 
    filters.status !== 'All' || 
    filters.budget !== 'All' || 
    filters.location || 
    filters.assigned_to !== 'All' || 
    filters.followup_filter !== 'All' || 
    filters.created_date !== 'All'
  );

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/80 p-4 rounded-2xl border border-neutral-800 shadow-md">
        <div>
          <h1 className="text-lg font-serif font-bold text-white tracking-wide flex items-center gap-2">
            <span>Customer Leads</span>
            <span className="text-xs font-mono font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Showing {leads.length} of {totalLeads}
            </span>
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Manual lead records with quick dial and follow-up tracking
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-medium transition cursor-pointer border border-neutral-700"
            title="Download CSV of current leads"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{exportingCsv ? 'Exporting...' : 'Export to CSV'}</span>
          </button>

          <button
            onClick={onOpenCreateLead}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Filter Bar Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl space-y-3 shadow-md">
        {/* Row 1: Search, Source, Service, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search name or mobile..."
              className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Lead Source */}
          <div>
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All">All Sources ({LEAD_SOURCES.length})</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Service Required */}
          <div>
            <select
              value={filters.service}
              onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All">All Services ({SERVICES_REQUIRED.length})</option>
              {SERVICES_REQUIRED.map((srv) => (
                <option key={srv} value={srv}>{srv}</option>
              ))}
            </select>
          </div>

          {/* Lead Status */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All">All Statuses ({LEAD_STATUSES.length})</option>
              {LEAD_STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Budget, Location, Assigned Telecaller, Follow-up Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Budget Range */}
          <div>
            <select
              value={filters.budget}
              onChange={(e) => setFilters(prev => ({ ...prev, budget: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All">All Budgets ({BUDGET_RANGES.length})</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Location Area Text */}
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Filter by location/area..."
              className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Assigned Telecaller */}
          <div>
            <select
              value={filters.assigned_to}
              onChange={(e) => setFilters(prev => ({ ...prev, assigned_to: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All">All Telecallers</option>
              <option value="unassigned">Unassigned</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Follow-up Date Filter */}
          <div>
            <select
              value={filters.followup_filter}
              onChange={(e) => setFilters(prev => ({ ...prev, followup_filter: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All">All Follow-ups</option>
              <option value="today">Today's Follow-ups</option>
              <option value="overdue">Overdue Follow-ups</option>
              <option value="upcoming">Upcoming Follow-ups</option>
              <option value="completed">Completed / Milestones</option>
            </select>
          </div>
        </div>

        {/* Row 3: Created Date, Sort By, Page Size, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/80 text-xs font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Created Date */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-400">Created:</span>
              <select
                value={filters.created_date}
                onChange={(e) => setFilters(prev => ({ ...prev, created_date: e.target.value, page: 1 }))}
                className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="All">Any Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-400">Sort:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any, page: 1 }))}
                className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="created_desc">Created: Newest First</option>
                <option value="created_asc">Created: Oldest First</option>
                <option value="followup_asc">Follow-up: Earliest First</option>
                <option value="followup_desc">Follow-up: Latest First</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>

            {/* Page Size */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-400">Per page:</span>
              <select
                value={filters.pageSize}
                onChange={(e) => setFilters(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
                className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-mono transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-950/50 border border-red-800 p-3.5 rounded-xl text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Leads Table Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-neutral-400">Loading prospects from CRM database...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center px-4">
            <p className="text-neutral-300 text-sm font-medium">No leads match your current criteria.</p>
            <p className="text-neutral-500 text-xs mt-1">Try adjusting the search query or reset the filters.</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-mono text-neutral-200 transition cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-neutral-950/90 border-b border-neutral-800 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Service Required</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Budget Range</th>
                  <th className="py-3 px-4">Lead Status</th>
                  <th className="py-3 px-4">Next Follow-up</th>
                  <th className="py-3 px-4">Telecaller</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs">
                {leads.map((lead) => {
                  const followupHighlight = getFollowupHighlight(lead.next_followup_at, lead.status);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-neutral-800/40 transition cursor-pointer group"
                    >
                      {/* 1. Customer Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white group-hover:text-amber-400 transition flex items-center gap-1.5">
                          <span>{lead.customer_name}</span>
                        </div>
                        {lead.email && (
                          <div className="text-[10px] text-neutral-400 truncate max-w-[140px] font-mono">
                            {lead.email}
                          </div>
                        )}
                      </td>

                      {/* 2. Mobile Number (with Click to Call + Copy) */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${lead.phone}`}
                            className="font-mono text-xs text-amber-400 hover:underline hover:text-amber-300 font-medium"
                            title="Click to dial"
                          >
                            {lead.phone}
                          </a>
                          <button
                            onClick={(e) => handleCopyPhone(lead.phone, e)}
                            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
                            title="Copy phone"
                          >
                            {copiedPhone === lead.phone ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {lead.alternate_phone && (
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            Alt: {lead.alternate_phone}
                          </div>
                        )}
                      </td>

                      {/* 3. Lead Source */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-300">
                        <span className="bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700/60 text-neutral-300">
                          {lead.source}
                        </span>
                      </td>

                      {/* 4. Service Required */}
                      <td className="py-3.5 px-4">
                        <div className="text-neutral-200 font-medium max-w-[170px] truncate" title={lead.interested_service}>
                          {lead.interested_service}
                        </div>
                      </td>

                      {/* 5. Customer Location */}
                      <td className="py-3.5 px-4 text-neutral-300 text-[11px]">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate max-w-[110px]" title={lead.city || lead.project_address || 'Bengaluru'}>
                            {lead.city || 'Bengaluru'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Budget Range */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-300">
                        {lead.budget ? (
                          <span className="text-amber-300/90">{lead.budget}</span>
                        ) : (
                          <span className="text-neutral-400">Not Disclosed</span>
                        )}
                      </td>

                      {/* 7. Lead Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono uppercase whitespace-nowrap ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>

                      {/* 8. Next Follow-up (Highlighted if today or overdue) */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {lead.next_followup_at ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-neutral-200">
                              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>
                                {new Date(lead.next_followup_at).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                                {', '}
                                {new Date(lead.next_followup_at).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {followupHighlight && (
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${followupHighlight.color}`}>
                                {followupHighlight.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400">None set</span>
                        )}
                      </td>

                      {/* 9. Assigned Telecaller */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-300">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate max-w-[110px]" title={lead.assigned_to_name || lead.assigned_to || 'Unassigned'}>
                            {lead.assigned_to_name || lead.assigned_to || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* 10. Actions (View / Edit, Log Call, Delete [admin]) */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {/* Log Call */}
                          <button
                            onClick={() => onQuickCall(lead)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono transition cursor-pointer"
                            title="Log Call"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Log</span>
                          </button>

                          {/* View / Edit */}
                          <button
                            onClick={() => onSelectLead(lead)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                            title="View / Edit Lead"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Admin Only Delete */}
                          {isAdmin && (
                            <button
                              onClick={(e) => handleDeleteLead(lead.id, lead.customer_name, e)}
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition cursor-pointer"
                              title="Delete Lead (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalLeads > 0 && (
          <div className="py-3.5 px-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-400 flex-wrap gap-2">
            <div>
              Showing {Math.min((filters.page - 1) * filters.pageSize + 1, totalLeads)} - {Math.min(filters.page * filters.pageSize, totalLeads)} of {totalLeads} leads
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                className="p-1.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-white px-2">
                Page {filters.page} of {totalPages}
              </span>

              <button
                disabled={filters.page >= totalPages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                className="p-1.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
