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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-serif font-bold text-white tracking-wide">
            Operational CRM & Telecalling Analytics
          </h1>
          <p className="text-xs text-neutral-400 font-mono">
            Pipeline performance, channel acquisition attribution, and telecalling conversion rates
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 font-mono focus:border-amber-400 focus:outline-none"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={365}>Last 12 Months</option>
          </select>

          <button
            onClick={loadReports}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 p-4 rounded-xl text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
            <span>Total Prospects</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {loading ? '-' : totalLeads}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-1">In selected {periodDays}-day window</div>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
            <span>Telecalling Interactions</span>
            <PhoneCall className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {loading ? '-' : (reportsData?.totalCalls ?? 0)}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-1">Logged call activities</div>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
            <span>Overall Conversion Rate</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400">
            {loading ? '-' : `${reportsData?.conversionRate ?? 0}%`}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-1">From initial lead to closed contract</div>
        </div>
      </div>

      {/* Visual Analytics Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leads by Acquisition Source */}
        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              <span>Leads by Channel Source</span>
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-400">Loading breakdown...</div>
          ) : reportsData?.bySource.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">No source data recorded.</div>
          ) : (
            <div className="space-y-3">
              {reportsData?.bySource.map(item => {
                const pct = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
                return (
                  <div key={item.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-200">{item.source}</span>
                      <span className="text-neutral-400">{item.count} leads ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leads by Status Pipeline */}
        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Pipeline Stage Distribution</span>
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-400">Loading pipeline...</div>
          ) : reportsData?.byStatus.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">No leads in pipeline.</div>
          ) : (
            <div className="space-y-3">
              {reportsData?.byStatus.map(item => {
                const pct = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-200">{item.status}</span>
                      <span className="text-neutral-400">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lead Temperature Breakdown */}
        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <span>Lead Temperature (Intent Priority)</span>
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {reportsData?.byTemperature.map(item => (
              <div key={item.temperature} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <div className={`text-[11px] font-mono uppercase font-bold ${
                  item.temperature === 'Hot' ? 'text-red-400' :
                  item.temperature === 'Warm' ? 'text-amber-400' :
                  'text-blue-400'
                }`}>
                  {item.temperature}
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                  {item.count}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  {totalLeads > 0 ? `${Math.round((item.count / totalLeads) * 100)}%` : '0%'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call Outcomes Breakdown */}
        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-purple-400" />
              <span>Telecall Outcomes</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {reportsData?.callsByOutcome.map(item => (
              <div key={item.outcome} className="flex items-center justify-between text-xs font-mono py-1 border-b border-neutral-800/40">
                <span className="text-neutral-300">{item.outcome}</span>
                <span className="text-white font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
