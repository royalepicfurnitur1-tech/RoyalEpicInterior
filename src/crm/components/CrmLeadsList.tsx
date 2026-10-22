import React, { useState, useEffect } from 'react';
import { 
  CrmLead, 
  CrmFilterState, 
  LeadStatus, 
  LeadTemperature, 
  LeadSource 
} from '../types';
import { fetchCrmLeads } from '../crmService';
import { 
  Search, 
  Filter, 
  Phone, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Clock, 
  Calendar, 
  MapPin, 
  ArrowUpDown,
  RefreshCw,
  PhoneCall
} from 'lucide-react';

interface CrmLeadsListProps {
  onSelectLead: (lead: CrmLead) => void;
  onOpenCreateLead: () => void;
  onQuickCall: (lead: CrmLead) => void;
  initialFilters?: Partial<CrmFilterState>;
}

const STATUS_OPTIONS: Array<LeadStatus | 'All'> = [
  'All',
  'New',
  'Contacted',
  'Follow-up',
  'No Answer',
  'Qualified',
  'Site Visit',
  'Quotation',
  'Converted',
  'Lost'
];

const TEMPERATURE_OPTIONS: Array<LeadTemperature | 'All'> = [
  'All',
  'Hot',
  'Warm',
  'Cold'
];

const SOURCE_OPTIONS: Array<LeadSource | 'All'> = [
  'All',
  'Justdial',
  'IndiaMART',
  'Facebook',
  'Instagram',
  'Website',
  'Referral',
  'Walk-in',
  'Other'
];

export const CrmLeadsList: React.FC<CrmLeadsListProps> = ({
  onSelectLead,
  onOpenCreateLead,
  onQuickCall,
  initialFilters
}) => {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CrmFilterState>({
    search: initialFilters?.search || '',
    status: initialFilters?.status || 'All',
    temperature: initialFilters?.temperature || 'All',
    source: initialFilters?.source || 'All',
    sortBy: initialFilters?.sortBy || 'created_desc',
    page: 1,
    pageSize: 15
  });

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
  }, [filters.page, filters.pageSize, filters.status, filters.temperature, filters.source, filters.sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, page: 1 }));
      loadLeads();
    }, 350);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const totalPages = Math.ceil(totalLeads / filters.pageSize) || 1;

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return 'bg-cyan-950 text-cyan-400 border border-cyan-800/80';
      case 'Contacted':
        return 'bg-blue-950 text-blue-400 border border-blue-800/80';
      case 'Follow-up':
        return 'bg-amber-950 text-amber-400 border border-amber-800/80';
      case 'No Answer':
        return 'bg-neutral-800 text-neutral-400 border border-neutral-700';
      case 'Qualified':
        return 'bg-emerald-950 text-emerald-400 border border-emerald-800/80';
      case 'Site Visit':
        return 'bg-purple-950 text-purple-400 border border-purple-800/80';
      case 'Quotation':
        return 'bg-indigo-950 text-indigo-400 border border-indigo-800/80';
      case 'Converted':
        return 'bg-amber-400/20 text-amber-300 border border-amber-400 font-bold';
      case 'Lost':
        return 'bg-red-950 text-red-400 border border-red-800/80';
      default:
        return 'bg-neutral-800 text-neutral-300';
    }
  };

  const getTemperatureBadge = (temperature: LeadTemperature) => {
    switch (temperature) {
      case 'Hot':
        return 'text-red-400 bg-red-950/60 border-red-800/60';
      case 'Warm':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'Cold':
        return 'text-blue-400 bg-blue-950/60 border-blue-800/60';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & New Lead Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-serif font-bold text-white tracking-wide">
            Master Leads Directory
          </h1>
          <p className="text-xs text-neutral-400 font-mono">
            {totalLeads} total active prospect{totalLeads === 1 ? '' : 's'} in CRM
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadLeads}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreateLead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by customer name, phone number, service..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-950/80 border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-44">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 bg-neutral-950/80 border border-neutral-700/80 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 transition"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Temperature Filter */}
          <div className="w-full md:w-36">
            <select
              value={filters.temperature}
              onChange={(e) => setFilters(prev => ({ ...prev, temperature: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 bg-neutral-950/80 border border-neutral-700/80 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 transition"
            >
              <option value="All">All Temperatures</option>
              {TEMPERATURE_OPTIONS.filter(t => t !== 'All').map(t => (
                <option key={t} value={t}>{t} Priority</option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="w-full md:w-40">
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 bg-neutral-950/80 border border-neutral-700/80 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 transition"
            >
              <option value="All">All Sources</option>
              {SOURCE_OPTIONS.filter(src => src !== 'All').map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full md:w-44">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any, page: 1 }))}
              className="w-full px-3 py-2 bg-neutral-950/80 border border-neutral-700/80 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-400 transition"
            >
              <option value="created_desc">Newest Added</option>
              <option value="created_asc">Oldest Added</option>
              <option value="followup_asc">Next Follow-up Due</option>
              <option value="temperature_desc">Temperature (Hot First)</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 p-4 rounded-xl text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Leads Table Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-neutral-400">Loading prospects from CRM database...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center px-4">
            <p className="text-neutral-400 text-sm font-medium">No leads match your current criteria.</p>
            <p className="text-neutral-400 text-xs mt-1">Try adjusting the search query or filters.</p>
            <button
              onClick={() => setFilters({
                search: '',
                status: 'All',
                temperature: 'All',
                source: 'All',
                sortBy: 'created_desc',
                page: 1,
                pageSize: 15
              })}
              className="mt-4 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-mono text-neutral-300 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950/80 border-b border-neutral-800 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Service & Location</th>
                  <th className="py-3 px-4">Temperature</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Next Follow-up</th>
                  <th className="py-3 px-4 text-right">Quick Dial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="hover:bg-neutral-800/40 transition cursor-pointer group"
                  >
                    {/* Customer Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white group-hover:text-amber-400 transition">
                        {lead.customer_name}
                      </div>
                      <div className="font-mono text-[11px] text-neutral-400 mt-0.5">
                        {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="text-[10px] text-neutral-400 truncate max-w-[180px]">
                          {lead.email}
                        </div>
                      )}
                    </td>

                    {/* Service & City */}
                    <td className="py-3.5 px-4">
                      <div className="text-neutral-200 font-medium">
                        {lead.interested_service}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5 font-mono">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        <span>{lead.city || 'Bengaluru'}</span>
                        {lead.budget && (
                          <span className="text-amber-400/90 font-sans">• {lead.budget}</span>
                        )}
                      </div>
                    </td>

                    {/* Temperature */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase border ${getTemperatureBadge(lead.temperature)}`}>
                        <Flame className="w-3 h-3" />
                        <span>{lead.temperature}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono uppercase ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400">
                      {lead.source}
                    </td>

                    {/* Next Follow-up */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {lead.next_followup_at ? (
                        <div className="flex items-center gap-1 text-amber-300/90">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            {new Date(lead.next_followup_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">None scheduled</span>
                      )}
                    </td>

                    {/* Quick Call Action */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={() => onQuickCall(lead)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono transition"
                          title="Click to Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>

                        <button
                          onClick={() => onQuickCall(lead)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition cursor-pointer"
                          title="Log Interaction"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                          <span>Log</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalLeads > 0 && (
          <div className="py-3.5 px-4 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-400">
            <div>
              Showing {Math.min((filters.page - 1) * filters.pageSize + 1, totalLeads)} - {Math.min(filters.page * filters.pageSize, totalLeads)} of {totalLeads}
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
