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
  archiveCrmLead, 
  deleteCrmLead, 
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
  Trash2, 
  Archive, 
  Eye, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertCircle, 
  User,
  X,
  Edit2
} from 'lucide-react';

interface CrmLeadsListProps {
  onSelectLead: (lead: CrmLead) => void;
  onOpenCreateLead: () => void;
  onQuickCall: (lead: CrmLead) => void;
  initialFilters?: Partial<CrmFilterState>;
  /** 'website' = show only enquiries submitted through the public website forms */
  origin?: 'website';
}

export const CrmLeadsList: React.FC<CrmLeadsListProps> = ({
  onSelectLead,
  onOpenCreateLead,
  onQuickCall,
  initialFilters,
  origin
}) => {
  const { isAdmin } = useCrmAuth();

  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<Array<{ id: string; name: string }>>([]);
  const [showFiltersBar, setShowFiltersBar] = useState(true);

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

  // Sync if initialFilters changes
  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({
        ...prev,
        ...initialFilters,
        page: 1
      }));
    }
  }, [initialFilters]);

  // Fetch users for assignment dropdown
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
      const res = await fetchCrmLeads(origin ? { ...filters, origin } : filters);
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
    filters.search,
    filters.source,
    filters.service,
    filters.status,
    filters.budget,
    filters.location,
    filters.assigned_to,
    filters.followup_filter,
    filters.followup_date,
    filters.created_date,
    filters.sortBy,
    filters.page,
    filters.pageSize,
    origin
  ]);

  const handleCopyPhone = (phoneNum: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phoneNum);
    setCopiedPhone(id);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleArchiveLead = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete lead for "${name}"? This cannot be undone.`)) {
      return;
    }
    const res = await archiveCrmLead(id);
    if (res.success) {
      loadLeads();
    } else {
      alert(res.error || 'Failed to delete lead');
    }
  };

  const clearAllFilters = () => {
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

  // Check which filters are active
  const activeFilterChips: Array<{ key: keyof CrmFilterState; label: string; value: string }> = [];
  if (filters.search) activeFilterChips.push({ key: 'search', label: 'Search', value: filters.search });
  if (filters.source !== 'All') activeFilterChips.push({ key: 'source', label: 'Source', value: filters.source });
  if (filters.service !== 'All') activeFilterChips.push({ key: 'service', label: 'Service', value: filters.service });
  if (filters.status !== 'All') activeFilterChips.push({ key: 'status', label: 'Status', value: filters.status });
  if (filters.budget !== 'All') activeFilterChips.push({ key: 'budget', label: 'Budget', value: filters.budget });
  if (filters.location) activeFilterChips.push({ key: 'location', label: 'Location', value: filters.location });
  if (filters.assigned_to !== 'All') {
    const u = usersList.find(x => x.id === filters.assigned_to);
    activeFilterChips.push({ key: 'assigned_to', label: 'Assigned', value: u ? u.name : filters.assigned_to });
  }
  if (filters.followup_filter !== 'All') activeFilterChips.push({ key: 'followup_filter', label: 'Follow-up', value: filters.followup_filter });
  if (filters.created_date !== 'All') activeFilterChips.push({ key: 'created_date', label: 'Created', value: filters.created_date });

  const removeFilterChip = (key: keyof CrmFilterState) => {
    setFilters(prev => ({
      ...prev,
      [key]: key === 'search' || key === 'location' || key === 'followup_date' ? '' : 'All',
      page: 1
    }));
  };

  const totalPages = Math.ceil(totalLeads / filters.pageSize) || 1;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'New Lead':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Interested':
      case 'Converted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Site Visit Scheduled':
      case 'Quotation Sent':
      case 'Negotiation':
      case 'Follow-up Required':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Lost':
      case 'Not Interested':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              {origin === 'website' ? 'Website Enquiries' : 'All Leads'}
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({totalLeads} total)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {origin === 'website'
              ? 'Enquiries submitted through the website forms appear here instantly, newest first.'
              : 'Search, filter, assign and review customer inquiries across all sales channels.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Quick Search Field in Toolbar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              placeholder="Search name or phone..."
              className="w-full pl-9 pr-7 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none transition-colors"
            />
            {filters.search && (
              <button 
                onClick={() => setFilters(prev => ({ ...prev, search: '', page: 1 }))}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFiltersBar(!showFiltersBar)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showFiltersBar || activeFilterChips.length > 0
                ? 'bg-slate-100 text-[#172033] border-slate-300'
                : 'bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterChips.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#356AE6] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterChips.length}
              </span>
            )}
          </button>

          <button
            onClick={onOpenCreateLead}
            className="px-3.5 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ORGANISED FILTER TOOLBAR (Multiple Filters Supported) */}
      {/* ========================================================================= */}
      {showFiltersBar && (
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {/* Filter 1: Lead Source */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Source
              </label>
              <select
                value={filters.source}
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value, page: 1 }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:border-[#356AE6] focus:outline-none"
              >
                <option value="All">All Sources</option>
                {LEAD_SOURCES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Filter 2: Service Required */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Service
              </label>
              <select
                value={filters.service}
                onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value, page: 1 }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:border-[#356AE6] focus:outline-none"
              >
                <option value="All">All Services</option>
                {SERVICES_REQUIRED.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Filter 3: Lead Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:border-[#356AE6] focus:outline-none"
              >
                <option value="All">All Statuses</option>
                {LEAD_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Filter 4: Budget */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Budget
              </label>
              <select
                value={filters.budget}
                onChange={(e) => setFilters(prev => ({ ...prev, budget: e.target.value, page: 1 }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:border-[#356AE6] focus:outline-none"
              >
                <option value="All">All Budgets</option>
                {BUDGET_RANGES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Filter 5: Location */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value, page: 1 }))}
                placeholder="Area (e.g. HSR)"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:border-[#356AE6] focus:outline-none"
              />
            </div>

            {/* Filter 6: Assigned Telecaller */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Telecaller
              </label>
              <select
                value={filters.assigned_to}
                onChange={(e) => setFilters(prev => ({ ...prev, assigned_to: e.target.value, page: 1 }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:border-[#356AE6] focus:outline-none"
              >
                <option value="All">All Telecallers</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Filter 7: Follow-up Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Follow-up
              </label>
              <select
                value={filters.followup_filter}
                onChange={(e) => setFilters(prev => ({ ...prev, followup_filter: e.target.value, page: 1 }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:border-[#356AE6] focus:outline-none"
              >
                <option value="All">All Timings</option>
                <option value="today">Today Due</option>
                <option value="overdue">Overdue</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Filter 8: Created Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Created
              </label>
              <select
                value={filters.created_date}
                onChange={(e) => setFilters(prev => ({ ...prev, created_date: e.target.value, page: 1 }))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:border-[#356AE6] focus:outline-none"
              >
                <option value="All">Any Date</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips & Clear All */}
          {activeFilterChips.length > 0 && (
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">Active filters:</span>
                {activeFilterChips.map(chip => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs border border-slate-200"
                  >
                    <span className="font-semibold">{chip.label}:</span>
                    <span>{chip.value}</span>
                    <button
                      onClick={() => removeFilterChip(chip.key)}
                      className="text-slate-400 hover:text-slate-700 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <button
                onClick={clearAllFilters}
                className="text-xs text-[#356AE6] hover:text-[#2D5AC2] font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All Filters</span>
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>Failed to load leads: {error}</span>
          <button onClick={loadLeads} className="underline text-rose-700 font-medium cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PROFESSIONAL COMPACT DATA TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Customer Name</th>
                <th className="py-3 px-4 font-semibold">Mobile Number</th>
                <th className="py-3 px-3 font-semibold">Source</th>
                <th className="py-3 px-3 font-semibold">Service</th>
                <th className="py-3 px-3 font-semibold">Location</th>
                <th className="py-3 px-3 font-semibold">Budget</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Next Follow-up</th>
                <th className="py-3 px-3 font-semibold">Assigned</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#356AE6]" />
                      <span className="text-xs">Loading leads database...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <p className="text-sm font-medium text-slate-600">No leads found</p>
                      <p className="text-xs text-slate-400">No records match your active search and filter criteria.</p>
                      {activeFilterChips.length > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-2 text-xs font-semibold text-[#356AE6] hover:underline"
                        >
                          Reset filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isCopied = copiedPhone === lead.id;
                  return (
                    <tr 
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      {/* 1. Customer Name */}
                      <td className="py-3 px-4 font-medium text-[#172033] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#172033] group-hover:text-[#356AE6] transition-colors">
                            {lead.customer_name}
                          </span>
                        </div>
                      </td>

                      {/* 2. Mobile Number */}
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <span>{lead.phone}</span>
                          <button
                            onClick={(e) => handleCopyPhone(lead.phone, lead.id, e)}
                            className="p-1 text-slate-400 hover:text-[#172033] rounded hover:bg-slate-100 transition"
                            title="Copy number"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* 3. Source */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {lead.source}
                        </span>
                      </td>

                      {/* 4. Service */}
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap max-w-[150px] truncate" title={lead.interested_service}>
                        {lead.interested_service}
                      </td>

                      {/* 5. Location */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {lead.city || <span className="text-slate-300">-</span>}
                      </td>

                      {/* 6. Budget */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-medium">
                        {lead.budget || <span className="text-slate-300">-</span>}
                      </td>

                      {/* 7. Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadgeClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>

                      {/* 8. Next Follow-up */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {lead.next_followup_date ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{lead.next_followup_date}</span>
                            {lead.next_followup_time && (
                              <span className="text-slate-400">({lead.next_followup_time})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">Not scheduled</span>
                        )}
                      </td>

                      {/* 9. Assigned Telecaller */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {lead.assigned_to_name || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* One-click Phone Dialing */}
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* Quick Log Call */}
                          <button
                            onClick={() => onQuickCall(lead)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#356AE6] hover:bg-blue-50 transition cursor-pointer"
                            title="Log Call Interaction"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Lead Details */}
                          <button
                            onClick={() => onSelectLead(lead)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#356AE6] hover:bg-blue-50 transition cursor-pointer"
                            title="Edit Lead Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Lead (All users) */}
                          <button
                            onClick={(e) => handleArchiveLead(lead.id, lead.customer_name, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Bar */}
        <div className="p-3.5 border-t border-[#E2E8F0] bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-[#172033]">{leads.length}</strong> of{' '}
            <strong className="text-[#172033]">{totalLeads}</strong> leads
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              Page {filters.page} of {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={filters.page <= 1}
                className="p-1 rounded bg-white border border-[#E2E8F0] hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                disabled={filters.page >= totalPages}
                className="p-1 rounded bg-white border border-[#E2E8F0] hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
