import React, { useState, useEffect } from 'react';
import { CrmLead } from '../types';
import { fetchCrmFollowups } from '../crmService';
import { 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Phone, 
  PhoneCall, 
  RefreshCw, 
  CheckCircle2, 
  MapPin,
  CheckCircle,
  Eye,
  User
} from 'lucide-react';

interface CrmFollowupsViewProps {
  onSelectLead: (lead: CrmLead) => void;
  onQuickCall: (lead: CrmLead) => void;
}

export const CrmFollowupsView: React.FC<CrmFollowupsViewProps> = ({
  onSelectLead,
  onQuickCall
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [dueToday, setDueToday] = useState<CrmLead[]>([]);
  const [overdue, setOverdue] = useState<CrmLead[]>([]);
  const [upcoming, setUpcoming] = useState<CrmLead[]>([]);
  const [completed, setCompleted] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCrmFollowups();
      if (res.error) {
        setError(res.error);
      } else {
        setDueToday(res.dueToday);
        setOverdue(res.overdue);
        setUpcoming(res.upcoming);
        setCompleted(res.completed || []);
        // If overdue has leads and today has none, open overdue by default
        if (res.dueToday.length === 0 && res.overdue.length > 0) {
          setActiveTab('overdue');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading follow-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentList = 
    activeTab === 'today' ? dueToday :
    activeTab === 'overdue' ? overdue :
    activeTab === 'upcoming' ? upcoming :
    completed;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/80 p-4 rounded-2xl border border-neutral-800 shadow-md">
        <div>
          <h1 className="text-lg font-serif font-bold text-white tracking-wide flex items-center gap-2">
            <span>Follow-up Management</span>
            {overdue.length > 0 && (
              <span className="animate-pulse bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                {overdue.length} Overdue
              </span>
            )}
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Organized queues for timely callbacks, client site visits, and design consultations
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5 text-xs font-mono"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 p-3.5 rounded-xl text-xs text-red-200">
          {error}
        </div>
      )}

      {/* 4 Tab Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-md">
        {/* Tab 1: Today */}
        <button
          onClick={() => setActiveTab('today')}
          className={`py-2.5 px-3 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'today'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Today ({dueToday.length})</span>
        </button>

        {/* Tab 2: Overdue (Visually Prominent Alert) */}
        <button
          onClick={() => setActiveTab('overdue')}
          className={`py-2.5 px-3 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer relative ${
            activeTab === 'overdue'
              ? 'bg-red-950/80 text-red-300 border border-red-700 font-bold shadow-md shadow-red-950/50'
              : overdue.length > 0
              ? 'text-red-400 bg-red-950/30 border border-red-900/60 hover:bg-red-950/50'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>Overdue ({overdue.length})</span>
          {overdue.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute right-2.5 top-2.5" />
          )}
        </button>

        {/* Tab 3: Upcoming */}
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-2.5 px-3 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-neutral-800 text-white border border-neutral-700 font-bold shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>Upcoming ({upcoming.length})</span>
        </button>

        {/* Tab 4: Completed */}
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-2.5 px-3 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700 font-bold shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Completed ({completed.length})</span>
        </button>
      </div>

      {/* Main List Container */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl p-4 sm:p-5">
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-neutral-400">
            <div className="w-8 h-8 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <span>Loading follow-up queue...</span>
          </div>
        ) : currentList.length === 0 ? (
          <div className="py-20 text-center px-4">
            <CheckCircle2 className="w-10 h-10 text-neutral-600 mx-auto mb-2.5" />
            <p className="text-neutral-300 text-sm font-medium">No follow-ups in this queue</p>
            <p className="text-neutral-500 text-xs font-mono mt-1">
              {activeTab === 'overdue' ? 'Great job! There are no overdue client calls.' :
               activeTab === 'today' ? 'No calls scheduled for today yet.' :
               activeTab === 'upcoming' ? 'No future follow-ups scheduled.' :
               'No completed leads recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((lead) => (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  activeTab === 'overdue'
                    ? 'bg-red-950/20 border-red-900/60 hover:border-red-700/80'
                    : activeTab === 'today'
                    ? 'bg-neutral-950/70 border-amber-500/30 hover:border-amber-500/60'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Lead Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-semibold text-white text-sm hover:text-amber-400 transition">
                      {lead.customer_name}
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-medium">
                      {lead.phone}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-neutral-800 px-2 py-0.5 rounded text-neutral-300 border border-neutral-700">
                      {lead.source}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-neutral-850 px-2 py-0.5 rounded text-neutral-300 border border-neutral-750">
                      {lead.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-neutral-400 flex-wrap">
                    <span className="text-neutral-200 font-medium">{lead.interested_service}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-neutral-400" />
                      <span>{lead.city || 'Bengaluru'}</span>
                    </div>
                    {lead.budget && (
                      <>
                        <span>•</span>
                        <span className="text-amber-300 font-mono">{lead.budget}</span>
                      </>
                    )}
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-400" />
                      <span>{lead.assigned_to_name || lead.assigned_to || 'Unassigned'}</span>
                    </div>
                  </div>

                  {lead.notes && (
                    <p className="text-xs text-neutral-400 italic line-clamp-1 mt-1">
                      "{lead.notes}"
                    </p>
                  )}
                </div>

                {/* Follow-up Schedule & Quick Action Buttons */}
                <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right font-mono hidden sm:block">
                    <div className="text-[10px] uppercase text-neutral-400">Scheduled Time</div>
                    <div className="text-xs font-semibold text-amber-300">
                      {lead.next_followup_at
                        ? new Date(lead.next_followup_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : 'Unscheduled'}
                    </div>
                  </div>

                  <a
                    href={`tel:${lead.phone}`}
                    className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition cursor-pointer"
                    title="Direct Phone Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onQuickCall(lead)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Log Call</span>
                  </button>

                  <button
                    onClick={() => onSelectLead(lead)}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer border border-neutral-700"
                    title="View Full Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
