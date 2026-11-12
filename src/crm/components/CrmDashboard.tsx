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
  Clock, 
  CheckCircle2, 
  XCircle, 
  UserPlus, 
  RefreshCw, 
  Phone,
  PhoneCall,
  MapPin,
  AlertCircle,
  CalendarClock,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Inbox
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

  const totalFollowupsDue = (metrics?.followupsDue ?? (dueTodayLeads.length + overdueLeads.length));

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Action Bar */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Telecaller & Sales Console
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              Welcome, <strong className="text-[#172033] font-semibold">{user?.name}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            Pipeline & Daily Action Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Focus on today's pending follow-ups and newly assigned client inquiries. Click any card below to view matching records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-[#E2E8F0] transition cursor-pointer disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreateLead}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>Failed to load live metrics: {error}</span>
          <button onClick={loadDashboardData} className="underline text-rose-700 font-medium cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPACT KPI CARDS (6 Clickable Cards) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Leads */}
        <div 
          onClick={() => onNavigateTab('leads', { status: 'All', followup_filter: 'All' })}
          className="bg-white hover:bg-slate-50/80 border border-[#E2E8F0] hover:border-[#356AE6] p-4 rounded-xl transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Leads</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-[#356AE6] transition-colors" />
          </div>
          <div className="text-2xl font-bold text-[#172033] tabular-nums">
            {loading ? '-' : (metrics?.totalLeads ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-[#356AE6] transition-colors" />
          </div>
        </div>

        {/* KPI 2: New Leads */}
        <div 
          onClick={() => onNavigateTab('leads', { status: 'New Lead' })}
          className="bg-white hover:bg-slate-50/80 border border-[#E2E8F0] hover:border-[#356AE6] p-4 rounded-xl transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">New Leads</span>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 tabular-nums">
            {loading ? '-' : (metrics?.newLeads ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Pending initial call</span>
          </div>
        </div>

        {/* KPI 3: Interested Leads */}
        <div 
          onClick={() => onNavigateTab('leads', { status: 'Interested' })}
          className="bg-white hover:bg-slate-50/80 border border-[#E2E8F0] hover:border-[#356AE6] p-4 rounded-xl transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Interested</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums">
            {loading ? '-' : (metrics?.interestedLeads ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>High conversion intent</span>
          </div>
        </div>

        {/* KPI 4: Follow-ups Due */}
        <div 
          onClick={() => onNavigateTab('followups-today')}
          className="bg-white hover:bg-slate-50/80 border border-[#E2E8F0] hover:border-amber-400 p-4 rounded-xl transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Follow-ups Due</span>
            <CalendarClock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 tabular-nums">
            {loading ? '-' : totalFollowupsDue}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1 flex items-center gap-1 font-medium">
            <span>{dueTodayLeads.length} today · {overdueLeads.length} overdue</span>
          </div>
        </div>

        {/* KPI 5: Converted Leads */}
        <div 
          onClick={() => onNavigateTab('leads', { status: 'Converted' })}
          className="bg-white hover:bg-slate-50/80 border border-[#E2E8F0] hover:border-emerald-400 p-4 rounded-xl transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Converted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums">
            {loading ? '-' : (metrics?.convertedLeads ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Signed turnkey projects</span>
          </div>
        </div>

        {/* KPI 6: Lost Leads */}
        <div 
          onClick={() => onNavigateTab('leads', { status: 'Lost' })}
          className="bg-white hover:bg-slate-50/80 border border-[#E2E8F0] hover:border-slate-400 p-4 rounded-xl transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Lost / Dropped</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-500 tabular-nums">
            {loading ? '-' : (metrics?.lostLeads ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Archived records</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-COLUMN OPERATIONAL SECTION */}
      {/* Left: Today's & Overdue Follow-ups (Prioritized Action) */}
      {/* Right: Recent Lead Activity & Status Distribution */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 Cols): Task Execution Center */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Follow-ups (Alert section if any exist) */}
          {overdueLeads.length > 0 && (
            <div className="bg-white border border-rose-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 bg-rose-50/60 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <h2 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                    Overdue Follow-ups ({overdueLeads.length})
                  </h2>
                </div>
                <button
                  onClick={() => onNavigateTab('followups-overdue')}
                  className="text-xs font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {overdueLeads.slice(0, 4).map((lead) => (
                  <div 
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#172033] truncate">
                          {lead.customer_name}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                          Overdue
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{lead.interested_service}</span>
                        {lead.city && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {lead.city}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickCall(lead);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs flex items-center gap-1 shadow-xs transition"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Log Call</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Follow-ups */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Today's Follow-up Schedule ({dueTodayLeads.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('followups-today')}
                className="text-xs font-semibold text-[#356AE6] hover:text-[#2D5AC2] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View all schedule</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {dueTodayLeads.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <div className="text-xs font-medium text-slate-600">All follow-ups for today are clear!</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Check upcoming schedule or create new leads.</div>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {dueTodayLeads.slice(0, 5).map((lead) => (
                  <div 
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#172033] truncate">
                          {lead.customer_name}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{lead.interested_service}</span>
                        {lead.next_followup_time && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-slate-600 font-medium">
                              Time: {lead.next_followup_time}
                            </span>
                          </>
                        )}
                        {lead.city && (
                          <>
                            <span>·</span>
                            <span>{lead.city}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Call customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickCall(lead);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs flex items-center gap-1 shadow-xs transition"
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

        {/* RIGHT COLUMN (1 Col): Recent Inquiries & Status Summary */}
        <div className="space-y-6">
          {/* Recent Lead Activity */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Recent Lead Inquiries
              </h2>
              <button
                onClick={() => onNavigateTab('leads', { sortBy: 'created_desc' })}
                className="text-xs font-semibold text-[#356AE6] hover:text-[#2D5AC2] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentLeads.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No inquiries registered yet.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {recentLeads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-3 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#172033] truncate">
                        {lead.customer_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span className="truncate">{lead.interested_service}</span>
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {lead.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lead Pipeline Quick Status Summary */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Lead Status Summary
            </h2>
            <div className="space-y-2 text-xs">
              <div 
                onClick={() => onNavigateTab('leads', { status: 'New Lead' })}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <span className="text-slate-600">New Leads</span>
                <span className="font-semibold text-blue-600 tabular-nums">{metrics?.newLeads ?? 0}</span>
              </div>
              <div 
                onClick={() => onNavigateTab('leads', { status: 'Interested' })}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <span className="text-slate-600">Interested</span>
                <span className="font-semibold text-emerald-600 tabular-nums">{metrics?.interestedLeads ?? 0}</span>
              </div>
              <div 
                onClick={() => onNavigateTab('leads', { status: 'Converted' })}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <span className="text-slate-600">Converted</span>
                <span className="font-semibold text-emerald-600 tabular-nums">{metrics?.convertedLeads ?? 0}</span>
              </div>
              <div 
                onClick={() => onNavigateTab('leads', { status: 'Lost' })}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <span className="text-slate-600">Lost / Closed</span>
                <span className="font-semibold text-slate-500 tabular-nums">{metrics?.lostLeads ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
