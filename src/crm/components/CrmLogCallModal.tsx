import React, { useState } from 'react';
import { 
  CrmLead, 
  CallOutcome, 
  LeadStatus, 
  LeadTemperature 
} from '../types';
import { recordCrmCall } from '../crmService';
import { 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Save, 
  Flame, 
  PhoneCall, 
  Calendar 
} from 'lucide-react';

interface CrmLogCallModalProps {
  lead: CrmLead | null;
  isOpen: boolean;
  onClose: () => void;
  onCallLogged: () => void;
}

const OUTCOMES: Array<{ value: CallOutcome; label: string; defaultStatus: LeadStatus; defaultTemp?: LeadTemperature }> = [
  { value: 'Interested', label: 'Interested (Follow-up scheduled)', defaultStatus: 'Follow-up', defaultTemp: 'Hot' },
  { value: 'Site Visit Requested', label: 'Site Visit Requested', defaultStatus: 'Site Visit', defaultTemp: 'Hot' },
  { value: 'Call Back Requested', label: 'Call Back Requested', defaultStatus: 'Follow-up', defaultTemp: 'Warm' },
  { value: 'No Answer', label: 'No Answer / Not Reachable', defaultStatus: 'No Answer', defaultTemp: 'Warm' },
  { value: 'Busy', label: 'Line Busy', defaultStatus: 'No Answer', defaultTemp: 'Warm' },
  { value: 'Converted', label: 'Converted / Deal Closed', defaultStatus: 'Converted', defaultTemp: 'Hot' },
  { value: 'Not Interested', label: 'Not Interested', defaultStatus: 'Lost', defaultTemp: 'Cold' },
  { value: 'Wrong Number', label: 'Wrong Number / Invalid', defaultStatus: 'Lost', defaultTemp: 'Cold' },
];

export const CrmLogCallModal: React.FC<CrmLogCallModalProps> = ({
  lead,
  isOpen,
  onClose,
  onCallLogged
}) => {
  if (!isOpen || !lead) return null;

  const [outcome, setOutcome] = useState<CallOutcome>('Interested');
  const [notes, setNotes] = useState('');
  const [followupDate, setFollowupDate] = useState(() => {
    // Default follow-up: tomorrow same time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [updateStatus, setUpdateStatus] = useState<LeadStatus>('Follow-up');
  const [updateTemperature, setUpdateTemperature] = useState<LeadTemperature>(lead.temperature);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOutcomeChange = (newOutcome: CallOutcome) => {
    setOutcome(newOutcome);
    const matched = OUTCOMES.find(o => o.value === newOutcome);
    if (matched) {
      setUpdateStatus(matched.defaultStatus);
      if (matched.defaultTemp) {
        setUpdateTemperature(matched.defaultTemp);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await recordCrmCall({
      lead_id: lead.id,
      outcome,
      notes: notes.trim() || undefined,
      followup_date: followupDate ? new Date(followupDate).toISOString() : undefined,
      update_lead_status: updateStatus,
      update_lead_temperature: updateTemperature
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg text-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-white">Log Call Outcome</h2>
              <div className="text-[11px] font-mono text-neutral-400">
                {lead.customer_name} ({lead.phone})
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="bg-red-950/60 border border-red-800 p-3 rounded-xl text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Click to Call Dial Reminder */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-neutral-400">Dial from device:</div>
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

          {/* Outcome Selector */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
              Call Outcome *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleOutcomeChange(o.value)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                    outcome === o.value
                      ? 'bg-amber-500/20 border-amber-500 text-white font-medium'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="truncate pr-1">{o.label}</span>
                  {outcome === o.value && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
              Discussion Notes / Customer Remarks
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Spoke with customer. Looking for 3BHK turnkey package with modular kitchen & TV unit. Requested site visit."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Follow-up Date & Time */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Next Follow-up Date & Time</span>
            </label>
            <input
              type="datetime-local"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Pipeline Updates */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
            <div>
              <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                Auto-Update Pipeline Status
              </label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value as LeadStatus)}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up">Follow-up</option>
                <option value="No Answer">No Answer</option>
                <option value="Qualified">Qualified</option>
                <option value="Site Visit">Site Visit</option>
                <option value="Quotation">Quotation</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400" />
                <span>Lead Temperature</span>
              </label>
              <select
                value={updateTemperature}
                onChange={(e) => setUpdateTemperature(e.target.value as LeadTemperature)}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
              >
                <option value="Hot">Hot (Immediate deal)</option>
                <option value="Warm">Warm (Interested)</option>
                <option value="Cold">Cold (Low responsiveness)</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-mono text-xs text-neutral-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving Call...' : 'Save Call & Update Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
