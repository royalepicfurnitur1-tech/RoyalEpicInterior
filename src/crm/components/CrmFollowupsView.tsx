import React, { useState, useEffect } from 'react';
import { CrmLead } from '../types';
import { fetchCrmFollowups } from '../crmService';
import { 
  Clock, 
  AlertCircle, 
  Calendar, 
  Phone, 
  PhoneCall, 
  RefreshCw, 
  CheckCircle2, 
  MapPin,
  CalendarClock,
  Eye,
  User,
  Copy,
  Check
} from 'lucide-react';

interface CrmFollowupsViewProps {
  onSelectLead: (lead: CrmLead) => void;
  onQuickCall: (lead: CrmLead) => void;
  defaultTab?: 'today' | 'overdue' | 'upcoming' | 'completed';
}

export const CrmFollowupsView: React.FC<CrmFollowupsViewProps> = ({
  onSelectLead,
  onQuickCall,
  defaultTab = 'today'
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>(defaultTab);
  const [dueToday, setDueToday] = useState<CrmLead[]>([]);
  const [overdue, setOverdue] = useState<CrmLead[]>([]);
  const [upcoming, setUpcoming] = useState<CrmLead[]>([]);
  const [completed, setCompleted] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCrmFollowups();
      if (res.error) {
        setError(res.error);
      } else {
        setDueToday(res.dueToday || []);
        setOverdue(res.overdue || []);
        setUpcoming(res.upcoming || []);
        setCompleted(res.completed || []);
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

  const handleCopy = (phone: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentList = 
    activeTab === 'today' ? dueToday :
    activeTab === 'overdue' ? overdue :
    activeTab === 'upcoming' ? upcoming :
    completed;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              Follow-up Queues
            </h1>
            {overdue.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                {overdue.length} Overdue
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Timely callback schedule, site visit coordination, and design consultation tasks.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-slate-600 transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* 4 Tab Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-100 rounded-xl">
        {/* Tab 1: Today */}
        <button
          onClick={() => setActiveTab('today')}
          className={`py-2 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'today'
              ? 'bg-white text-[#172033] shadow-xs font-semibold'
              : 'text-slate-600 hover:text-[#172033]'
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
          <span>Today ({dueToday.length})</span>
        </button>

        {/* Tab 2: Overdue (Noticeable subtle priority without blinking animations) */}
        <button
          onClick={() => setActiveTab('overdue')}
          className={`py-2 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-white text-rose-700 shadow-xs font-semibold'
              : overdue.length > 0
              ? 'text-rose-600'
              : 'text-slate-600 hover:text-[#172033]'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Overdue ({overdue.length})</span>
        </button>

        {/* Tab 3: Upcoming */}
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-2 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-white text-[#172033] shadow-xs font-semibold'
              : 'text-slate-600 hover:text-[#172033]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Upcoming ({upcoming.length})</span>
        </button>

        {/* Tab 4: Completed */}
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-2 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-white text-[#172033] shadow-xs font-semibold'
              : 'text-slate-600 hover:text-[#172033]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Completed ({completed.length})</span>
        </button>
      </div>

      {/* Queue List Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#356AE6] mb-2" />
            <span className="text-xs">Loading follow-ups...</span>
          </div>
        ) : currentList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-slate-600">No leads in this queue</p>
            <p className="text-slate-400 mt-0.5">
              {activeTab === 'overdue' ? 'Great job! Zero overdue follow-up callbacks.' : 'All tasks for this view are currently up to date.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {currentList.map((lead) => (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className={`p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                  activeTab === 'overdue' ? 'bg-rose-50/30' : ''
                }`}
              >
                {/* Left: Customer & Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#172033]">
                      {lead.customer_name}
                    </span>
                    <span className="text-xs text-slate-600 font-mono">
                      {lead.phone}
                    </span>
                    <button
                      onClick={(e) => handleCopy(lead.phone, lead.id, e)}
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                      title="Copy phone"
                    >
                      {copiedId === lead.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {lead.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-700">{lead.interested_service}</span>
                    {lead.city && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {lead.city}
                        </span>
                      </>
                    )}
                    {lead.budget && (
                      <>
                        <span>·</span>
                        <span>Budget: {lead.budget}</span>
                      </>
                    )}
                    {lead.assigned_to_name && (
                      <>
                        <span>·</span>
                        <span>Assigned: {lead.assigned_to_name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Follow-up Timestamp & Actions */}
                <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right">
                    <div className="text-[11px] font-mono font-medium text-[#172033]">
                      {lead.next_followup_date || 'Date not set'}
                    </div>
                    {lead.next_followup_time && (
                      <div className="text-[10px] font-mono text-slate-500">
                        {lead.next_followup_time}
                      </div>
                    )}
                  </div>

                  <a
                    href={`tel:${lead.phone}`}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-emerald-600 transition"
                    title="Call customer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => onQuickCall(lead)}
                    className="px-3 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Log Call</span>
                  </button>

                  <button
                    onClick={() => onSelectLead(lead)}
                    className="p-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    title="View details"
                  >
                    <Eye className="w-3.5 h-3.5" />
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
