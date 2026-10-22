import React, { useEffect, useState } from 'react';
import { 
  CrmDashboardMetrics, 
  CrmLead, 
  CrmCallLog 
} from '../types';
import { 
  fetchCrmDashboardMetrics, 
  fetchCrmFollowups, 
  fetchCrmLeads 
} from '../crmService';
import { useCrmAuth } from '../CrmAuthContext';
import { 
  Users, 
  Flame, 
  PhoneCall, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Award, 
  UserPlus, 
  Calendar, 
  ArrowUpRight, 
  RefreshCw, 
  Phone,
  Sparkles
} from 'lucide-react';

interface CrmDashboardProps {
  onNavigateTab: (tab: string) => void;
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
      {/* Top Greeting & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 rounded-2xl border border-neutral-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {isAdmin ? 'Administrator Workspace' : 'Telecaller Cockpit'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Signed in as <strong className="text-white">{user?.name}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            Telecaller CRM Overview
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Live pipeline tracking, daily call schedule, and immediate customer follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition cursor-pointer disabled:opacity-50"
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
          <button onClick={loadDashboardData} className="underline text-red-400 font-mono text-[11px]">Retry</button>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div 
          onClick={() => onNavigateTab('leads')}
          className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-5 rounded-2xl transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Total Leads</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {loading ? '-' : (metrics?.totalLeads ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 font-mono flex items-center gap-1">
            <span>In CRM Database</span>
            <ArrowUpRight className="w-3 h-3 text-neutral-400 group-hover:text-amber-400" />
          </div>
        </div>

        {/* Hot Leads */}
        <div 
          onClick={() => onNavigateTab('leads')}
          className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-red-900/50 p-5 rounded-2xl transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-red-400">Hot Leads</span>
            <div className="w-8 h-8 rounded-lg bg-red-950/40 flex items-center justify-center text-red-400 border border-red-900/30">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-400 tracking-tight">
            {loading ? '-' : (metrics?.hotLeads ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 font-mono">
            High purchase intent
          </div>
        </div>

        {/* Calls Logged Today */}
        <div 
          onClick={() => onNavigateTab('calls')}
          className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-blue-900/50 p-5 rounded-2xl transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400">Calls Today</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/40 flex items-center justify-center text-blue-400 border border-blue-900/30">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-400 tracking-tight">
            {loading ? '-' : (metrics?.callsToday ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 font-mono">
            Recorded telecall interactions
          </div>
        </div>

        {/* Follow-ups Due Today */}
        <div 
          onClick={() => onNavigateTab('followups')}
          className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-900/50 p-5 rounded-2xl transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">Due Today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/40 flex items-center justify-center text-amber-400 border border-amber-900/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-400 tracking-tight">
            {loading ? '-' : (metrics?.followupsDueToday ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 font-mono">
            Scheduled client callbacks
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row (Overdue, New, Qualified, Converted) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overdue Alert Card */}
        <div 
          onClick={() => onNavigateTab('followups')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            (metrics?.overdueFollowups ?? 0) > 0 
              ? 'bg-red-950/20 border-red-800/80 hover:bg-red-950/30' 
              : 'bg-neutral-900/50 border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className={`w-3.5 h-3.5 ${
              (metrics?.overdueFollowups ?? 0) > 0 ? 'text-red-400' : 'text-neutral-400'
            }`} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Overdue Follow-ups</span>
          </div>
          <div className={`text-2xl font-bold ${
            (metrics?.overdueFollowups ?? 0) > 0 ? 'text-red-400' : 'text-neutral-400'
          }`}>
            {loading ? '-' : (metrics?.overdueFollowups ?? 0)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1 font-mono">Requires urgent dialing</div>
        </div>

        {/* New Leads */}
        <div 
          onClick={() => onNavigateTab('leads')}
          className="bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 p-4 rounded-xl transition cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">New Uncontacted</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {loading ? '-' : (metrics?.newLeads ?? 0)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1 font-mono">Awaiting first outreach</div>
        </div>

        {/* Qualified Leads */}
        <div 
          onClick={() => onNavigateTab('leads')}
          className="bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 p-4 rounded-xl transition cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Qualified Leads</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {loading ? '-' : (metrics?.qualifiedLeads ?? 0)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1 font-mono">Ready for designer site visit</div>
        </div>

        {/* Converted Leads */}
        <div 
          onClick={() => onNavigateTab('leads')}
          className="bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 p-4 rounded-xl transition cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Closed / Won</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {loading ? '-' : (metrics?.convertedLeads ?? 0)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1 font-mono">Turnkey contracts signed</div>
        </div>
      </div>

      {/* Main Two-Column Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Follow-ups Schedule (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                  Today's Call Schedule ({dueTodayLeads.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('followups')}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
              >
                <span>View All Follow-ups</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-neutral-400 text-xs font-mono">
                Loading scheduled follow-ups...
              </div>
            ) : dueTodayLeads.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-xs">
                No follow-ups due right now. You're all caught up for today!
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/60">
                {dueTodayLeads.slice(0, 5).map((lead) => (
                  <div 
                    key={lead.id}
                    className="py-3 flex items-center justify-between hover:bg-neutral-800/30 px-2 rounded-xl transition"
                  >
                    <div 
                      onClick={() => onSelectLead(lead)}
                      className="cursor-pointer flex-1 pr-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white hover:text-amber-400 transition">
                          {lead.customer_name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                          lead.temperature === 'Hot' ? 'bg-red-950 text-red-400 border border-red-800' :
                          lead.temperature === 'Warm' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}>
                          {lead.temperature}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5 truncate">
                        {lead.interested_service} • {lead.city || 'Bengaluru'} {lead.budget ? `• ${lead.budget}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickCall(lead);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-mono transition"
                        title="Click to Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{lead.phone}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Follow-ups Notice if present */}
          {overdueLeads.length > 0 && (
            <div className="bg-red-950/20 border border-red-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-400 text-sm font-bold font-mono uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Pending Overdue Follow-ups ({overdueLeads.length})</span>
                </div>
                <button
                  onClick={() => onNavigateTab('followups')}
                  className="text-xs text-red-400 hover:underline font-mono cursor-pointer"
                >
                  Dial Overdue Leads →
                </button>
              </div>
              <p className="text-xs text-neutral-400 mb-3">
                The following client callbacks missed their scheduled time window and require priority outreach:
              </p>
              <div className="space-y-2">
                {overdueLeads.slice(0, 3).map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-2.5 rounded-lg bg-neutral-900/80 border border-red-900/40 flex items-center justify-between text-xs cursor-pointer hover:border-red-700 transition"
                  >
                    <div>
                      <span className="font-semibold text-white mr-2">{lead.customer_name}</span>
                      <span className="text-neutral-400 font-mono text-[11px]">{lead.phone}</span>
                    </div>
                    <div className="text-red-400 font-mono text-[11px]">
                      Follow-up missed
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Inbound Leads & Quick Shortcuts */}
        <div className="space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                Recent Inbound Leads
              </h2>
              <button
                onClick={() => onNavigateTab('leads')}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 transition cursor-pointer"
              >
                All Leads →
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-neutral-400 text-xs font-mono">
                Loading recent leads...
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-xs">
                No leads recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLeads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-white">{lead.customer_name}</span>
                      <span className="text-[10px] font-mono text-neutral-400">{lead.source}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                      {lead.interested_service}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span>{lead.phone}</span>
                      <span className="text-amber-400/80">{lead.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
              Telecaller Operations
            </h3>
            <button
              onClick={() => onNavigateTab('followups')}
              className="w-full text-left py-2.5 px-3 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-200 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Scheduled Follow-ups</span>
              </div>
              <span className="font-mono text-[10px] text-amber-400">{metrics?.followupsDueToday ?? 0} Due</span>
            </button>

            <button
              onClick={() => onNavigateTab('leads')}
              className="w-full text-left py-2.5 px-3 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-200 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Open Master Leads Table</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {isAdmin && (
              <button
                onClick={() => onNavigateTab('import')}
                className="w-full text-left py-2.5 px-3 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-200 transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Batch CSV Import (Admin)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Excel/CSV</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('reports')}
              className="w-full text-left py-2.5 px-3 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-200 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span>Conversion & Call Analytics</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
