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
  FileText,
  User
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

  const cfg = OUTCOME_CONFIG[outcome];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-xl w-full max-w-lg text-[#172033] shadow-xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#356AE6] text-white flex items-center justify-center shadow-xs">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Log Call Interaction</h2>
              <div className="text-xs text-slate-500 font-mono">
                {lead.customer_name} • {lead.phone}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-[#172033] hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Direct Dial Reminder Bar */}
          <div className="bg-slate-50 p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Customer Mobile:</div>
              <div className="font-mono text-sm font-bold text-[#172033]">{lead.phone}</div>
            </div>
            <a
              href={`tel:${lead.phone}`}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Dial Now</span>
            </a>
          </div>

          {/* Outcome Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Call Outcome *
            </label>
            <select
              value={outcome}
              onChange={(e) => handleOutcomeChange(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] focus:outline-none"
            >
              {CALL_OUTCOMES.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Updated Status Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Update Lead Status
            </label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] focus:outline-none"
            >
              {LEAD_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Discussion Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Discussion Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did the client say? Specific interior requirements, floor plan discussed, site visit schedule, quotation details..."
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none resize-none"
            />
          </div>

          {/* Next Follow-up Section (Shown if outcome warrants followup) */}
          {cfg?.needsFollowup && (
            <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Next Follow-up Scheduling</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Time</label>
                  <input
                    type="time"
                    value={followupTime}
                    onChange={(e) => setFollowupTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Call Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
