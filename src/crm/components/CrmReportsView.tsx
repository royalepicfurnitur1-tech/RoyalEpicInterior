import React, { useState, useEffect } from 'react';
import { fetchCrmReports } from '../crmService';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Award, 
  PhoneCall, 
  Users, 
  Calendar, 
  RefreshCw 
} from 'lucide-react';

export const CrmReportsView: React.FC = () => {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [reportsData, setReportsData] = useState<{
    bySource: Array<{ source: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    byTemperature: Array<{ temperature: string; count: number }>;
    callsByOutcome: Array<{ outcome: string; count: number }>;
    totalCalls: number;
    conversionRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCrmReports(periodDays);
      if (res.error) {
        setError(res.error);
      } else if (res.reports) {
        setReportsData(res.reports);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [periodDays]);

  const totalLeads = reportsData?.byStatus.reduce((acc, s) => acc + s.count, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            Operational CRM & Performance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Conversion metrics, source channel acquisition, and telecalling call outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:border-[#356AE6] focus:outline-none"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={365}>Last 12 Months</option>
          </select>

          <button
            onClick={loadReports}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-slate-600 transition cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium uppercase tracking-wider text-[11px]">Total Prospects</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-[#172033] tabular-nums">
            {loading ? '-' : totalLeads}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">In selected {periodDays}-day window</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium uppercase tracking-wider text-[11px]">Telecalling Interactions</span>
            <PhoneCall className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-600 tabular-nums">
            {loading ? '-' : (reportsData?.totalCalls ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Logged call activities</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium uppercase tracking-wider text-[11px]">Conversion Rate</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-600 tabular-nums">
            {loading ? '-' : `${reportsData?.conversionRate ?? 0}%`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">From initial lead to closed project</div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leads by Acquisition Source */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#356AE6]" />
              <span>Leads by Acquisition Source</span>
            </h3>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading breakdown...</div>
          ) : reportsData?.bySource.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No source data recorded.</div>
          ) : (
            <div className="space-y-3">
              {reportsData?.bySource.map(item => {
                const pct = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
                return (
                  <div key={item.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.source}</span>
                      <span className="text-slate-500 tabular-nums">{item.count} leads ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#356AE6] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pipeline Stage Distribution */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Pipeline Stage Distribution</span>
            </h3>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading pipeline...</div>
          ) : reportsData?.byStatus.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No leads in pipeline.</div>
          ) : (
            <div className="space-y-3">
              {reportsData?.byStatus.map(item => {
                const pct = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.status}</span>
                      <span className="text-slate-500 tabular-nums">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Call Outcomes Breakdown */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl space-y-4 shadow-xs md:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-blue-500" />
              <span>Telecall Outcomes Breakdown</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportsData?.callsByOutcome.map(item => (
              <div key={item.outcome} className="p-3 rounded-lg bg-slate-50 border border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-slate-700 truncate pr-2">{item.outcome}</span>
                <span className="font-bold text-[#172033] font-mono tabular-nums shrink-0">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
