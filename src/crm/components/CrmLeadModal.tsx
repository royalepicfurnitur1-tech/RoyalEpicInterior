import React, { useState, useEffect } from 'react';
import { 
  CrmLead, 
  CrmCallLog, 
  LeadStatus, 
  LeadTemperature, 
  LeadSource 
} from '../types';
import { 
  fetchCrmLeadCalls, 
  saveCrmLead, 
  deleteCrmLead, 
  isValidPhoneNumber, 
  normalizePhoneNumber 
} from '../crmService';
import { useCrmAuth } from '../CrmAuthContext';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Flame, 
  Clock, 
  Edit3, 
  Save, 
  Trash2, 
  PhoneCall, 
  CheckCircle, 
  AlertCircle,
  FileText,
  User,
  History
} from 'lucide-react';

interface CrmLeadModalProps {
  lead: CrmLead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
  onOpenLogCall: (lead: CrmLead) => void;
}

const STATUS_LIST: LeadStatus[] = [
  'New',
  'Contacted',
  'Follow-up',
  'No Answer',
  'Qualified',
  'Site Visit',
  'Quotation',
  'Converted',
  'Lost'
];

const TEMPERATURE_LIST: LeadTemperature[] = ['Hot', 'Warm', 'Cold'];

const SOURCE_LIST: LeadSource[] = [
  'Justdial',
  'IndiaMART',
  'Facebook',
  'Instagram',
  'Website',
  'Referral',
  'Walk-in',
  'Other'
];

export const CrmLeadModal: React.FC<CrmLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onOpenLogCall
}) => {
  const { isAdmin } = useCrmAuth();
  const [callLogs, setCallLogs] = useState<CrmCallLog[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Edit State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSource>('Website');
  const [service, setService] = useState('Turnkey Interior');
  const [city, setCity] = useState('Bengaluru');
  const [budget, setBudget] = useState('');
  const [temperature, setTemperature] = useState<LeadTemperature>('Warm');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [notes, setNotes] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');

  useEffect(() => {
    if (lead) {
      setName(lead.customer_name);
      setPhone(lead.phone);
      setEmail(lead.email || '');
      setSource(lead.source);
      setService(lead.interested_service);
      setCity(lead.city || 'Bengaluru');
      setBudget(lead.budget || '');
      setTemperature(lead.temperature);
      setStatus(lead.status);
      setNotes(lead.notes || '');
      setNextFollowup(lead.next_followup_at ? new Date(lead.next_followup_at).toISOString().slice(0, 16) : '');
      setIsEditing(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      loadCalls(lead.id);
    }
  }, [lead]);

  const loadCalls = async (leadId: string) => {
    setLoadingCalls(true);
    const res = await fetchCrmLeadCalls(leadId);
    setCallLogs(res.calls);
    setLoadingCalls(false);
  };

  if (!isOpen || !lead) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Customer name is required.');
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      setErrorMessage('Please enter a valid phone number (10 digits or international format).');
      return;
    }

    setIsSaving(true);
    const updatedPayload: Partial<CrmLead> = {
      id: lead.id,
      customer_name: name.trim(),
      phone: normalizePhoneNumber(phone.trim()),
      email: email.trim() || undefined,
      source,
      interested_service: service.trim(),
      city: city.trim(),
      budget: budget.trim() || undefined,
      temperature,
      status,
      notes: notes.trim() || undefined,
      next_followup_at: nextFollowup ? new Date(nextFollowup).toISOString() : undefined
    };

    const res = await saveCrmLead(updatedPayload);
    setIsSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update lead');
    } else {
      setSuccessMessage('Lead updated successfully.');
      setIsEditing(false);
      onLeadUpdated();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      setErrorMessage('Only administrators are authorized to delete CRM leads.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to permanently delete lead for "${lead.customer_name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    const res = await deleteCrmLead(lead.id);
    setIsDeleting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to delete lead');
    } else {
      onLeadUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-3xl text-neutral-100 shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {lead.id}
              </span>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                temperature === 'Hot' ? 'bg-red-950 text-red-400 border-red-800' :
                temperature === 'Warm' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                'bg-blue-950 text-blue-400 border-blue-800'
              }`}>
                {temperature} Priority
              </span>
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                {status}
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-white mt-1.5">
              {isEditing ? 'Editing Lead Profile' : lead.customer_name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-200 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMessage && (
            <div className="bg-red-950/50 border border-red-800 p-3 rounded-xl text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-950/50 border border-emerald-800 p-3 rounded-xl text-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Dial Action Card */}
          <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 p-4 rounded-xl border border-amber-800/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-mono text-sm font-bold text-white">{lead.phone}</div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  Last outreach: {lead.last_contact_at ? new Date(lead.last_contact_at).toLocaleString('en-IN') : 'No calls logged yet'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${lead.phone}`}
                onClick={() => onOpenLogCall(lead)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>

              <button
                onClick={() => onOpenLogCall(lead)}
                className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                <span>Log Outcome</span>
              </button>
            </div>
          </div>

          {/* Details / Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 bg-neutral-950/40 p-4 rounded-xl border border-neutral-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as LeadSource)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
                  >
                    {SOURCE_LIST.map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Interested Service</label>
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">City / Locality</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Estimated Budget</label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. ₹20 - 30 Lakhs"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Lead Temperature</label>
                  <select
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value as LeadTemperature)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
                  >
                    {TEMPERATURE_LIST.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Pipeline Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
                  >
                    {STATUS_LIST.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Next Follow-up Schedule</label>
                  <input
                    type="datetime-local"
                    value={nextFollowup}
                    onChange={(e) => setNextFollowup(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Customer Notes / Requirements</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Client requirements, apartment layout, preferred timber/marble style..."
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-mono text-neutral-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg font-mono transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/40 p-4 rounded-xl border border-neutral-800">
              <div>
                <div className="text-[10px] font-mono uppercase text-neutral-400">Interested Service</div>
                <div className="text-neutral-200 font-medium mt-0.5">{lead.interested_service}</div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-neutral-400">City / Location</div>
                <div className="text-neutral-200 font-medium mt-0.5">{lead.city || 'Bengaluru'}</div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-neutral-400">Estimated Budget</div>
                <div className="text-neutral-200 font-medium mt-0.5">{lead.budget || 'Custom Quote'}</div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-neutral-400">Acquisition Source</div>
                <div className="text-neutral-200 font-medium mt-0.5 font-mono">{lead.source}</div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-neutral-400">Next Follow-up Due</div>
                <div className="text-amber-300 font-medium mt-0.5 font-mono">
                  {lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleString('en-IN') : 'None scheduled'}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-neutral-400">Created At</div>
                <div className="text-neutral-400 font-mono text-[11px] mt-0.5">
                  {new Date(lead.created_at).toLocaleString('en-IN')}
                </div>
              </div>

              {lead.notes && (
                <div className="sm:col-span-2 pt-2 border-t border-neutral-800/80">
                  <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1">Customer Notes</div>
                  <div className="text-neutral-300 leading-relaxed bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
                    {lead.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Call History Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  Call & Follow-up History ({callLogs.length})
                </h3>
              </div>
              <button
                onClick={() => onOpenLogCall(lead)}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
              >
                <span>+ Log New Call</span>
              </button>
            </div>

            {loadingCalls ? (
              <div className="py-6 text-center text-neutral-400 font-mono text-xs">
                Loading call history...
              </div>
            ) : callLogs.length === 0 ? (
              <div className="py-6 text-center text-neutral-400 bg-neutral-950/30 rounded-xl border border-neutral-800/60">
                No calls recorded yet for this client. Click "Call Now" or "Log Outcome" after connecting.
              </div>
            ) : (
              <div className="space-y-2.5">
                {callLogs.map((call) => (
                  <div
                    key={call.id}
                    className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          call.outcome === 'Interested' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          call.outcome === 'Site Visit Requested' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                          call.outcome === 'Converted' ? 'bg-amber-400/20 text-amber-300 border border-amber-400' :
                          call.outcome === 'Call Back Requested' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                          call.outcome === 'No Answer' ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' :
                          'bg-red-950 text-red-400 border border-red-800'
                        }`}>
                          {call.outcome}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Logged by {call.logged_by_name || 'Telecaller'}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-neutral-400">
                        {new Date(call.call_date).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {call.notes && (
                      <div className="text-neutral-300 leading-relaxed bg-neutral-900/80 p-2 rounded border border-neutral-800/80">
                        {call.notes}
                      </div>
                    )}

                    {call.followup_date && (
                      <div className="text-[11px] font-mono text-amber-400/90 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Next scheduled: {new Date(call.followup_date).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-mono transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Lead (Admin Only)'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-white transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
