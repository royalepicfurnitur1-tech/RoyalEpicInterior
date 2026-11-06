import React, { useEffect, useState } from 'react';
import { 
  CrmDashboardMetrics, 
  CrmLead, 
  CrmFilterState 
} from '../types';
import { 
  fetchCrmDashboardMetrics, 
  fetchCrmFollowups, 
  fetchCrmLeads 
} from '../crmService';
import { useCrmAuth } from '../CrmAuthContext';
import { 
  Users, 
  Sparkles, 
  Flame, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  UserPlus, 
  Calendar, 
  ArrowUpRight, 
  RefreshCw, 
  Phone,
  PhoneCall,
  MapPin,
  AlertTriangle
} from 'lucide-react';

interface CrmDashboardProps {
  onNavigateTab: (tab: string, filters?: Partial<CrmFilterState>) => void;
  onOpenCreateLead: () => void;
  onSelectLead: (lead: CrmLead) => void;
  onQuickCall: (lead: CrmLead) => void;
}

export const CrmDashboard: React.FC<CrmDashboardProps> = ({
  onNavigateTab,
  onOpenCreateLead,
  onSelectLead,
  onQuickCall
}) => {
  const { user, isAdmin } = useCrmAuth();
  const [metrics, setMetrics] = useState<CrmDashboardMetrics | null>(null);
  const [dueTodayLeads, setDueTodayLeads] = useState<CrmLead[]>([]);
  const [overdueLeads, setOverdueLeads] = useState<CrmLead[]>([]);
  const [recentLeads, setRecentLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, followupsRes, recentRes] = await Promise.all([
        fetchCrmDashboardMetrics(),
        fetchCrmFollowups(),
        fetchCrmLeads({ sortBy: 'created_desc', page: 1, pageSize: 6 })
      ]);

      if (metricsRes.error) {
        setError(metricsRes.error);
      } else if (metricsRes.metrics) {
        setMetrics(metricsRes.metrics);
      }

      setDueTodayLeads(followupsRes.dueToday || []);
      setOverdueLeads(followupsRes.overdue || []);
      setRecentLeads(recentRes.leads || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 rounded-2xl border border-neutral-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {isAdmin ? 'Administrator Portal' : 'Telecaller Workspace'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Signed in as <strong className="text-white">{user?.name}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            Telecaller CRM Dashboard
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Royal Epic Commercial & Home Interiors • Click any KPI card below to filter the lead pipeline directly
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition cursor-pointer disabled:opacity-50"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreateLead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 p-4 rounded-xl text-xs text-red-200 flex items-center justify-between">
          <span>Failed to load live metrics: {error}</span>
          <button onClick={loadDashboardData} className="underline text-red-400 font-mono text-[11px] cursor-pointer">Retry</button>
        </div>
      )}

      {/* 6 SIMPLE KPI CARDS (Clicking card filters lead list directly) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Leads */}
        <div 
          onClick={() => onNavigateTab('leads', { status: 'All', followup_filter: 'All' })}
          className="bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 p-4 rounded-2xl transition cursor-pointer group flex flex-col justify-between shadow-md hover:scale-[1.02]"
          title="Click to view all leads"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Total Leads</span>
            <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {loading ? '-' : (metrics?.totalLeads ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-neutral-500 font-mono flex items-center justify-between group-hover:text-amber-400 transition">
            <span>View All</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 2: New Leads */}
        <div 
          onClick={() => onNavigateTab('leads', { status: 'New Lead' })}
          className="bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-cyan-500/40 p-4 rounded-2xl transition cursor-pointer group flex flex-col justify-between shadow-md hover:scale-[1.02]"
          title="Click to view new leads"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">New Leads</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-950/50 flex items-center justify-center text-cyan-400 border border-cyan-800/40">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400 tracking-tight">
            {loading ? '-' : (metrics?.newLeads ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-cyan-400/70 font-mono flex items-center justify-between group-hover:text-cyan-300 transition">
            <span>Filter New</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 3: Interested Leads */}
        <div 
          onClick={() => onNavigateTab('leads', { status: 'Interested' })}
          className="bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/40 p-4 rounded-2xl transition cursor-pointer group flex flex-col justify-between shadow-md hover:scale-[1.02]"
          title="Click to view interested leads"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Interested</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/50 flex items-center justify-center text-emerald-400 border border-emerald-800/40">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {loading ? '-' : (metrics?.interestedLeads ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-emerald-400/70 font-mono flex items-center justify-between group-hover:text-emerald-300 transition">
            <span>Filter Interested</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 4: Follow-ups Due */}
        <div 
          onClick={() => onNavigateTab('leads', { followup_filter: 'today' })}
          className={`p-4 rounded-2xl transition cursor-pointer group flex flex-col justify-between shadow-md hover:scale-[1.02] border ${
            (metrics?.followupsDue ?? 0) > 0
              ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
              : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
          }`}
          title="Click to view follow-ups due"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Follow-ups Due</span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/50 flex items-center justify-center text-amber-400 border border-amber-800/40">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300 tracking-tight">
            {loading ? '-' : (metrics?.followupsDue ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-amber-400/80 font-mono flex items-center justify-between group-hover:text-amber-300 transition">
            <span>Today / Overdue</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 5: Converted Leads */}
        <div 
          onClick={() => onNavigateTab('leads', { status: 'Converted' })}
          className="bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-400/50 p-4 rounded-2xl transition cursor-pointer group flex flex-col justify-between shadow-md hover:scale-[1.02]"
          title="Click to view converted leads"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Converted</span>
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 border border-amber-400/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {loading ? '-' : (metrics?.convertedLeads ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-amber-400/80 font-mono flex items-center justify-between group-hover:text-amber-300 transition">
            <span>Filter Converted</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 6: Lost Leads */}
        <div 
          onClick={() => onNavigateTab('leads', { status: 'Lost' })}
          className="bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-red-500/40 p-4 rounded-2xl transition cursor-pointer group flex flex-col justify-between shadow-md hover:scale-[1.02]"
          title="Click to view lost leads"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-400">Lost Leads</span>
            <div className="w-7 h-7 rounded-lg bg-red-950/50 flex items-center justify-center text-red-400 border border-red-800/40">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-400 tracking-tight">
            {loading ? '-' : (metrics?.lostLeads ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-red-400/70 font-mono flex items-center justify-between group-hover:text-red-300 transition">
            <span>Filter Lost</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Main Two-Column Content: Follow-ups Schedule & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Follow-ups Schedule (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                  Immediate Call Queue ({dueTodayLeads.length + overdueLeads.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('followups')}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
              >
                <span>Full Follow-up Tracker</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs font-mono text-neutral-400">
                Checking call queue...
              </div>
            ) : (dueTodayLeads.length === 0 && overdueLeads.length === 0) ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p>No follow-ups due right now. You are all caught up!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {/* Overdue Items First */}
                {overdueLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/60 hover:border-red-700 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{lead.customer_name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950 text-red-400 border border-red-800">
                          OVERDUE
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-2">
                        <span className="text-amber-400">{lead.phone}</span>
                        <span>•</span>
                        <span>{lead.interested_service}</span>
                        {lead.city && <span>• {lead.city}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onQuickCall(lead)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Log Call</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Today's Follow-ups */}
                {dueTodayLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-amber-500/40 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{lead.customer_name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                          TODAY
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-2">
                        <span className="text-amber-400">{lead.phone}</span>
                        <span>•</span>
                        <span>{lead.interested_service}</span>
                        {lead.city && <span>• {lead.city}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onQuickCall(lead)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Log Call</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recently Added Prospects */}
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                  Recently Added
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('leads')}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
              >
                <span>All Leads</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {recentLeads.slice(0, 5).map((l) => (
                <div
                  key={l.id}
                  onClick={() => onSelectLead(l)}
                  className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs hover:text-amber-400 transition">
                      {l.customer_name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                      {l.source}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono mt-1">
                    {l.phone} • {l.interested_service}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
