import React, { useState, useEffect } from 'react';
import { 
  CrmLead, 
  CrmCallLog, 
  LeadStatus, 
  LeadSource, 
  ServiceRequired, 
  BudgetRange,
  LEAD_SOURCES, 
  SERVICES_REQUIRED, 
  LEAD_STATUSES, 
  BUDGET_RANGES 
} from '../types';
import { 
  fetchCrmLeadCalls, 
  saveCrmLead, 
  deleteCrmLead, 
  normalizePhoneNumber,
  getCrmAuthHeaders 
} from '../crmService';
import { useCrmAuth } from '../CrmAuthContext';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  Edit3, 
  Save, 
  Trash2, 
  PhoneCall, 
  CheckCircle, 
  AlertCircle,
  FileText,
  User,
  History,
  Copy,
  Check,
  Building,
  Tag,
  CalendarClock
} from 'lucide-react';

interface CrmLeadModalProps {
  lead: CrmLead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
  onOpenLogCall: (lead: CrmLead) => void;
}

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [usersList, setUsersList] = useState<Array<{ id: string; name: string }>>([]);

  // Form Fields State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSource>('Justdial');
  const [customSource, setCustomSource] = useState('');
  const [service, setService] = useState<ServiceRequired>('Residential Interior');
  const [customService, setCustomService] = useState('');
  const [city, setCity] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [budget, setBudget] = useState<BudgetRange>('₹5–10 Lakh');
  const [status, setStatus] = useState<LeadStatus>('New Lead');
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('11:00');

  useEffect(() => {
    fetch('/api/crm/users', { headers: getCrmAuthHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.users)) {
          setUsersList(d.users);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (lead) {
      setName(lead.customer_name);
      setPhone(lead.phone);
      setAlternatePhone(lead.alternate_phone || '');
      setEmail(lead.email || '');
      setSource(lead.source);
      setCustomSource(lead.custom_source || '');
      setService(lead.interested_service);
      setCustomService(lead.custom_service || '');
      setCity(lead.city || '');
      setProjectAddress(lead.project_address || '');
      setBudget((lead.budget as BudgetRange) || '₹5–10 Lakh');
      setStatus(lead.status);
      setNotes(lead.notes || '');
      setAssignedTo(lead.assigned_to || '');

      if (lead.next_followup_at) {
        const d = new Date(lead.next_followup_at);
        setFollowupDate(d.toISOString().slice(0, 10));
        setFollowupTime(d.toTimeString().slice(0, 5));
      } else {
        setFollowupDate(lead.next_followup_date || '');
        setFollowupTime(lead.next_followup_time || '11:00');
      }

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

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Customer name is required.');
      return;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage('Valid 10-digit phone number is required.');
      return;
    }

    setIsSaving(true);
    const assignedUser = usersList.find(u => u.id === assignedTo);

    const updatedData: Partial<CrmLead> = {
      id: lead.id,
      customer_name: name.trim(),
      phone: normalizePhoneNumber(phone.trim()),
      alternate_phone: alternatePhone ? normalizePhoneNumber(alternatePhone.trim()) : undefined,
      email: email.trim() || undefined,
      source: source === 'Other' && customSource ? customSource.trim() : source,
      custom_source: source === 'Other' ? customSource.trim() : undefined,
      interested_service: service === 'Other' && customService ? customService.trim() : service,
      custom_service: service === 'Other' ? customService.trim() : undefined,
      city: city.trim() || undefined,
      project_address: projectAddress.trim() || undefined,
      budget,
      status,
      notes: notes.trim() || undefined,
      assigned_to: assignedTo || undefined,
      assigned_to_name: assignedUser ? assignedUser.name : undefined,
      next_followup_date: followupDate || undefined,
      next_followup_time: followupTime || undefined,
      next_followup_at: followupDate ? `${followupDate}T${followupTime || '11:00'}:00` : undefined
    };

    const res = await saveCrmLead(updatedData);
    setIsSaving(false);

    if (!res.success) {
      if (res.isDuplicate) {
        setErrorMessage('Another lead with this phone number already exists.');
      } else {
        setErrorMessage(res.error || 'Failed to update lead');
      }
    } else {
      setSuccessMessage('Lead updated successfully.');
      setIsEditing(false);
      onLeadUpdated();
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to permanently delete lead for "${lead.customer_name}"?`)) {
      return;
    }
    const res = await deleteCrmLead(lead.id);
    if (res.success) {
      onLeadUpdated();
      onClose();
    } else {
      setErrorMessage(res.error || 'Failed to delete lead');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      {/* Slide-over Drawer Panel */}
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-[#E2E8F0] z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#356AE6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {lead.customer_name?.slice(0, 2).toUpperCase() || 'LD'}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#172033] truncate">
                {lead.customer_name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                <span>{lead.phone}</span>
                <button
                  onClick={handleCopyPhone}
                  className="p-0.5 text-slate-400 hover:text-slate-700 transition"
                  title="Copy number"
                >
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Log Call Action */}
            <button
              onClick={() => onOpenLogCall(lead)}
              className="px-3 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Log Call</span>
            </button>

            {/* Quick Dial Link */}
            <a
              href={`tel:${lead.phone}`}
              className="p-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-100 text-emerald-600 transition"
              title="Dial phone"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>

            {/* Edit / View Mode Toggle */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-slate-200 text-[#172033] border-slate-300'
                  : 'bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50'
              }`}
              title={isEditing ? 'Cancel Edit' : 'Edit Lead'}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-[#172033] hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#172033]">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {isEditing ? (
            /* ========================================================================= */
            /* EDIT FORM MODE */
            /* ========================================================================= */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider pb-1 border-b border-[#E2E8F0]">
                  Edit Lead Details
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-[#E2E8F0] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Alternate Mobile</label>
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-[#E2E8F0] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Location / Area</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-[#E2E8F0] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Budget Range</label>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs"
                    >
                      {BUDGET_RANGES.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lead Source</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs"
                    >
                      {LEAD_SOURCES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Service Required</label>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs"
                    >
                      {SERVICES_REQUIRED.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs"
                    >
                      {LEAD_STATUSES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Telecaller</label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs"
                    >
                      <option value="">Unassigned</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Next Follow-up Date</label>
                    <input
                      type="date"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Next Follow-up Time</label>
                    <input
                      type="time"
                      value={followupTime}
                      onChange={(e) => setFollowupTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Project Address</label>
                    <input
                      type="text"
                      value={projectAddress}
                      onChange={(e) => setProjectAddress(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Notes</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Lead</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs flex items-center gap-1 shadow-xs disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ========================================================================= */
            /* READ-ONLY VIEW MODE (Organized into structured sections) */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* 1. STATUS & FOLLOW-UP CARD */}
              <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                      Current Lead Status
                    </span>
                    <div className="mt-1">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-[#E2E8F0] text-[#172033] shadow-2xs">
                        {lead.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                      Next Follow-up
                    </span>
                    <div className="mt-1 text-xs font-mono font-medium text-[#172033]">
                      {lead.next_followup_date ? (
                        <span>{lead.next_followup_date} {lead.next_followup_time ? `at ${lead.next_followup_time}` : ''}</span>
                      ) : (
                        <span className="text-slate-400">None Scheduled</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-slate-500">
                  <span>Assigned Telecaller: <strong className="text-[#172033]">{lead.assigned_to_name || 'Unassigned'}</strong></span>
                  <span>Registered: <strong className="text-[#172033]">{lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN') : '-'}</strong></span>
                </div>
              </div>

              {/* 2. CUSTOMER & ENQUIRY INFORMATION */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider pb-1 border-b border-[#E2E8F0]">
                  Client & Enquiry Information
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Mobile</span>
                    <span className="font-mono text-slate-800 font-medium">{lead.phone}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Alternate Mobile</span>
                    <span className="font-mono text-slate-800">{lead.alternate_phone || '-'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Service Required</span>
                    <span className="font-medium text-[#172033]">{lead.interested_service}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Lead Source</span>
                    <span className="text-slate-800">{lead.source}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Budget Range</span>
                    <span className="text-slate-800 font-medium">{lead.budget || 'Not Disclosed'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Customer Location / Area</span>
                    <span className="text-slate-800">{lead.city || '-'}</span>
                  </div>

                  {lead.project_address && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Project Address</span>
                      <span className="text-slate-800">{lead.project_address}</span>
                    </div>
                  )}

                  {lead.email && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Email</span>
                      <span className="text-slate-800 font-mono">{lead.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. INTERNAL NOTES & REQUIREMENTS */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider pb-1 border-b border-[#E2E8F0]">
                  Customer Requirements & Notes
                </h3>
                <div className="p-3 rounded-lg bg-slate-50 border border-[#E2E8F0] text-slate-700 leading-relaxed text-xs">
                  {lead.notes || <span className="text-slate-400 italic">No notes recorded yet.</span>}
                </div>
              </div>

              {/* 4. CALL HISTORY TIMELINE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Call History Timeline ({callLogs.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => onOpenLogCall(lead)}
                    className="text-xs font-semibold text-[#356AE6] hover:underline cursor-pointer"
                  >
                    + Log New Call
                  </button>
                </div>

                {loadingCalls ? (
                  <div className="py-4 text-center text-slate-400 text-xs">Loading call history...</div>
                ) : callLogs.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-50 text-center text-slate-400 text-xs">
                    No calls logged for this lead yet. Click "Log Call" above to record the first conversation.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {callLogs.map((log) => (
                      <div 
                        key={log.id}
                        className="p-3 rounded-lg bg-slate-50/80 border border-[#E2E8F0] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#172033] text-xs">
                            {log.outcome}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.call_date).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {log.notes && (
                          <p className="text-slate-600 text-xs leading-relaxed">
                            {log.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#E2E8F0]">
                          <span>Caller: {log.logged_by_name || 'Telecaller'}</span>
                          {log.followup_date && (
                            <span>Next: {new Date(log.followup_date).toLocaleDateString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
