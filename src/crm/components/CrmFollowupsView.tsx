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
  Flame, 
  MapPin 
} from 'lucide-react';

interface CrmFollowupsViewProps {
  onSelectLead: (lead: CrmLead) => void;
  onQuickCall: (lead: CrmLead) => void;
}

export const CrmFollowupsView: React.FC<CrmFollowupsViewProps> = ({
  onSelectLead,
  onQuickCall
}) => {
  const [activeTab, setActiveTab] = useState<'due' | 'overdue' | 'upcoming'>('due');
  const [dueToday, setDueToday] = useState<CrmLead[]>([]);
  const [overdue, setOverdue] = useState<CrmLead[]>([]);
  const [upcoming, setUpcoming] = useState<CrmLead[]>([]);
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
        // If overdue has items and dueToday is empty, open overdue by default
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
    activeTab === 'due' ? dueToday :
    activeTab === 'overdue' ? overdue :
    upcoming;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-serif font-bold text-white tracking-wide">
            Scheduled Follow-ups Tracker
          </h1>
          <p className="text-xs text-neutral-400 font-mono">
            Direct queue for client callbacks, appointment reminders, and design follow-ups
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer self-start sm:self-auto"
          title="Refresh Follow-ups"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 p-4 rounded-xl text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('due')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'due'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Due Today ({dueToday.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-red-950/60 text-red-300 border border-red-800 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span>Overdue ({overdue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-neutral-800 text-white border border-neutral-700 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>Upcoming ({upcoming.length})</span>
        </button>
      </div>

      {/* Main List */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl p-4">
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-neutral-400">
            Loading follow-up queue...
          </div>
        ) : currentList.length === 0 ? (
          <div className="py-20 text-center px-4">
            <CheckCircle2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-neutral-300 text-sm font-medium">
              No {activeTab === 'due' ? 'follow-ups due today' : activeTab === 'overdue' ? 'overdue callbacks' : 'upcoming follow-ups'}.
            </p>
            <p className="text-neutral-500 text-xs mt-1">
              {activeTab === 'overdue' ? 'Great job! Zero missed client appointments.' : 'All customer callbacks are up to date.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((lead) => (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  activeTab === 'overdue'
                    ? 'bg-red-950/10 border-red-900/50 hover:border-red-700'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white hover:text-amber-400 transition">
                      {lead.customer_name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                      lead.temperature === 'Hot' ? 'bg-red-950 text-red-400 border border-red-800' :
                      lead.temperature === 'Warm' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}>
                      {lead.temperature}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono bg-neutral-800 px-2 py-0.5 rounded">
                      {lead.status}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Source: {lead.source}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-300">
                    {lead.interested_service} {lead.city ? `• ${lead.city}` : ''} {lead.budget ? `• ${lead.budget}` : ''}
                  </div>

                  {lead.notes && (
                    <div className="text-[11px] text-neutral-400 bg-neutral-900/80 p-2 rounded-lg border border-neutral-800/80 max-w-xl">
                      {lead.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400 pt-1">
                    <div className="flex items-center gap-1 text-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Scheduled: {lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleString('en-IN') : 'N/A'}
                      </span>
                    </div>

                    {lead.last_contact_at && (
                      <span className="text-neutral-400">
                        Last called: {new Date(lead.last_contact_at).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={() => onQuickCall(lead)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-500/10"
                    title="Click to Dial"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Dial {lead.phone}</span>
                  </a>

                  <button
                    onClick={() => onQuickCall(lead)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                    <span>Log Outcome</span>
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
