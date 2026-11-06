import React, { useState } from 'react';
import { 
  CrmLead, 
  CallOutcome, 
  LeadStatus,
  CALL_OUTCOMES,
  LEAD_STATUSES
} from '../types';
import { recordCrmCall } from '../crmService';
import { 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Calendar,
  PhoneCall,
  FileText
} from 'lucide-react';

interface CrmLogCallModalProps {
  lead: CrmLead | null;
  isOpen: boolean;
  onClose: () => void;
  onCallLogged: () => void;
}

const OUTCOME_CONFIG: Record<string, { defaultStatus: LeadStatus; needsFollowup: boolean }> = {
  'Connected - Interested': { defaultStatus: 'Interested', needsFollowup: true },
  'Connected - Follow-up Required': { defaultStatus: 'Follow-up Required', needsFollowup: true },
  'Connected - Site Visit Scheduled': { defaultStatus: 'Site Visit Scheduled', needsFollowup: true },
  'Connected - Quotation Requested': { defaultStatus: 'Quotation Sent', needsFollowup: true },
  'Connected - Not Interested': { defaultStatus: 'Not Interested', needsFollowup: false },
  'Busy / No Answer': { defaultStatus: 'Not Reachable', needsFollowup: true },
  'Switched Off / Not Reachable': { defaultStatus: 'Not Reachable', needsFollowup: true },
  'Wrong Number': { defaultStatus: 'Lost', needsFollowup: false },
  'Call Back Later': { defaultStatus: 'Follow-up Required', needsFollowup: true }
};

export const CrmLogCallModal: React.FC<CrmLogCallModalProps> = ({
  lead,
  isOpen,
  onClose,
  onCallLogged
}) => {
  if (!isOpen || !lead) return null;

  const [outcome, setOutcome] = useState<CallOutcome>('Connected - Follow-up Required');
  const [callDateTime] = useState(() => new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }));
  const [notes, setNotes] = useState('');
  
  // Follow-up Date & Time
  const [followupDate, setFollowupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [followupTime, setFollowupTime] = useState('11:00');

  const [updateStatus, setUpdateStatus] = useState<LeadStatus>('Follow-up Required');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOutcomeChange = (newOutcome: CallOutcome) => {
    setOutcome(newOutcome);
    const cfg = OUTCOME_CONFIG[newOutcome];
    if (cfg) {
      setUpdateStatus(cfg.defaultStatus);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const cfg = OUTCOME_CONFIG[outcome];
    const followupIso = (cfg?.needsFollowup && followupDate) 
      ? `${followupDate}T${followupTime || '10:00'}:00` 
      : undefined;

    const res = await recordCrmCall({
      lead_id: lead.id,
      outcome,
      notes: notes.trim() || undefined,
      followup_date: followupIso,
      update_lead_status: updateStatus
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to record call');
    } else {
      onCallLogged();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg text-white shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-white">Log Call Interaction</h2>
              <div className="text-xs text-neutral-400 font-mono">
                {lead.customer_name} • {lead.phone}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="bg-red-950/70 border border-red-700 p-3 rounded-xl text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Dial Reminder Bar */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-neutral-400">Current Lead Phone:</div>
              <div className="font-mono text-sm text-amber-400 font-bold">{lead.phone}</div>
            </div>
            <a
              href={`tel:${lead.phone}`}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-xs flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Open Dialer</span>
            </a>
          </div>

          {/* Call Date & Time Display */}
          <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between text-neutral-300">
            <span className="text-[11px] font-mono uppercase text-neutral-400">Call Timestamp:</span>
            <span className="font-mono text-xs font-semibold text-white">{callDateTime}</span>
          </div>

          {/* Call Outcome Dropdown (Exact 9 options) */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Call Outcome <span className="text-amber-400">*</span>
            </label>
            <select
              value={outcome}
              onChange={(e) => handleOutcomeChange(e.target.value as CallOutcome)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              {CALL_OUTCOMES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Discussion Notes */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Discussion Notes / Customer Feedback
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary of discussion, budget discussed, site location confirmed, quotation timeline..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Next Follow-up Date and Time */}
          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800 space-y-3">
            <div className="text-[11px] font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Next Follow-up Schedule</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Date</label>
                <input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Time</label>
                <input
                  type="time"
                  value={followupTime}
                  onChange={(e) => setFollowupTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Update Lead Status */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Update Lead Pipeline Status
            </label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value as LeadStatus)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              {LEAD_STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                  <span>Saving Call Log...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Call Log</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
