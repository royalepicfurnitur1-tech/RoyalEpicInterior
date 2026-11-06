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
  isValidPhoneNumber, 
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
  Building
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
  const [isDeleting, setIsDeleting] = useState(false);
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
  const [assignedToName, setAssignedToName] = useState('');
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
      setAssignedToName(lead.assigned_to_name || '');

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
      setErrorMessage('Please provide a valid 10-digit mobile number.');
      return;
    }

    setIsSaving(true);
    const assignedUser = usersList.find(u => u.id === assignedTo);

    const updatedPayload: Partial<CrmLead> = {
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
      assigned_to_name: assignedUser ? assignedUser.name : (assignedToName || undefined),
      next_followup_date: followupDate || undefined,
      next_followup_time: followupTime || undefined,
      next_followup_at: followupDate ? `${followupDate}T${followupTime || '10:00'}:00` : undefined
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
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to permanently delete lead for "${lead.customer_name}"?`)) {
      setIsDeleting(true);
      const res = await deleteCrmLead(lead.id);
      setIsDeleting(false);
      if (res.success) {
        onLeadUpdated();
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to delete lead');
      }
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'New Lead':
      case 'New':
        return 'bg-cyan-950/80 text-cyan-400 border border-cyan-800';
      case 'Contacted':
        return 'bg-blue-950/80 text-blue-400 border border-blue-800';
      case 'Follow-up Required':
      case 'Follow-up':
        return 'bg-amber-950/80 text-amber-400 border border-amber-800';
      case 'Interested':
        return 'bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-semibold';
      case 'Site Visit Scheduled':
        return 'bg-purple-950/80 text-purple-300 border border-purple-800';
      case 'Quotation Sent':
        return 'bg-indigo-950/80 text-indigo-300 border border-indigo-800';
      case 'Converted':
        return 'bg-amber-400/20 text-amber-300 border border-amber-400 font-bold';
      case 'Lost':
      case 'Not Interested':
        return 'bg-red-950/80 text-red-400 border border-red-800';
      default:
        return 'bg-neutral-800 text-neutral-300 border border-neutral-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-4xl text-white shadow-2xl overflow-hidden my-4 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-white">{lead.customer_name}</h2>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${getStatusBadge(lead.status)}`}>
                  {lead.status}
                </span>
              </div>
              <div className="text-xs text-neutral-400 font-mono flex items-center gap-2 mt-0.5">
                <span>ID: {lead.id}</span>
                <span>•</span>
                <span>Added: {new Date(lead.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLogCall(lead)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-500/20"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Log Call</span>
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer border border-neutral-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Lead'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {errorMessage && (
            <div className="bg-red-950/70 border border-red-700 p-3 rounded-xl text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-950/70 border border-emerald-700 p-3 rounded-xl text-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Dial Card */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-neutral-400">Primary Mobile Number</div>
                <div className="text-sm font-mono font-bold text-amber-400 flex items-center gap-2">
                  <span>{lead.phone}</span>
                  <button
                    onClick={handleCopyPhone}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
                    title="Copy Phone"
                  >
                    {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${lead.phone}`}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-500/20"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Directly</span>
              </a>
              <a
                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/40 font-mono text-xs flex items-center gap-1.5 transition"
              >
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Main Layout: Details vs History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Lead Attributes / Edit Form */}
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5 pb-1 border-b border-neutral-800">
                <FileText className="w-4 h-4" />
                <span>Lead Specifications</span>
              </div>

              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Mobile *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Alternate Mobile</label>
                      <input
                        type="tel"
                        value={alternatePhone}
                        onChange={(e) => setAlternatePhone(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Source</label>
                      <select
                        value={source}
                        onChange={(e) => setSource(e.target.value as LeadSource)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        {LEAD_SOURCES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Service Required</label>
                      <select
                        value={service}
                        onChange={(e) => setService(e.target.value as ServiceRequired)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        {SERVICES_REQUIRED.map((srv) => (
                          <option key={srv} value={srv}>{srv}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Customer Location</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Budget Range</label>
                      <select
                        value={budget}
                        onChange={(e) => setBudget(e.target.value as BudgetRange)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        {BUDGET_RANGES.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Project Address</label>
                    <input
                      type="text"
                      value={projectAddress}
                      onChange={(e) => setProjectAddress(e.target.value)}
                      placeholder="e.g. Sobha City, Thanisandra Main Rd"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Pipeline Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as LeadStatus)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        {LEAD_STATUSES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Assigned Telecaller</label>
                      <select
                        value={assignedTo}
                        onChange={(e) => {
                          setAssignedTo(e.target.value);
                          const u = usersList.find(usr => usr.id === e.target.value);
                          setAssignedToName(u ? u.name : '');
                        }}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {usersList.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Follow-up Date</label>
                      <input
                        type="date"
                        value={followupDate}
                        onChange={(e) => setFollowupDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Follow-up Time</label>
                      <input
                        type="time"
                        value={followupTime}
                        onChange={(e) => setFollowupTime(e.target.value)}
                        className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Customer Requirements / Notes</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-neutral-400">Lead Source</div>
                      <div className="text-xs font-medium text-white mt-0.5">{lead.source}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-neutral-400">Service Required</div>
                      <div className="text-xs font-medium text-amber-300 mt-0.5">{lead.interested_service}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-neutral-400">Customer Location</div>
                      <div className="text-xs font-medium text-white mt-0.5">{lead.city || 'Bengaluru'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-neutral-400">Budget Range</div>
                      <div className="text-xs font-medium text-white mt-0.5">{lead.budget || 'Not Disclosed'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-neutral-400">Assigned Telecaller</div>
                      <div className="text-xs font-medium text-white mt-0.5">{lead.assigned_to_name || lead.assigned_to || 'Unassigned'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-neutral-400">Next Follow-up</div>
                      <div className="text-xs font-medium text-amber-400 mt-0.5">
                        {lead.next_followup_at
                          ? new Date(lead.next_followup_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })
                          : 'None set'}
                      </div>
                    </div>
                  </div>

                  {lead.project_address && (
                    <div className="pt-2 border-t border-neutral-800">
                      <div className="text-[10px] font-mono uppercase text-neutral-400">Project Address</div>
                      <div className="text-xs text-neutral-200 mt-0.5">{lead.project_address}</div>
                    </div>
                  )}

                  {lead.notes && (
                    <div className="pt-2 border-t border-neutral-800">
                      <div className="text-[10px] font-mono uppercase text-neutral-400">Customer Notes</div>
                      <p className="text-xs text-neutral-300 whitespace-pre-wrap mt-0.5 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                        {lead.notes}
                      </p>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="pt-3 border-t border-neutral-800 flex justify-end">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isDeleting ? 'Deleting...' : 'Delete Lead'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Interaction Call History (Non-destructive) */}
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center justify-between pb-1 border-b border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  <span>Call History ({callLogs.length})</span>
                </div>
                <button
                  onClick={() => onOpenLogCall(lead)}
                  className="text-[11px] font-mono text-blue-400 hover:text-blue-300 transition cursor-pointer"
                >
                  + Add Call
                </button>
              </div>

              {loadingCalls ? (
                <div className="py-12 text-center text-neutral-400 font-mono text-xs">
                  Loading call history...
                </div>
              ) : callLogs.length === 0 ? (
                <div className="py-12 text-center bg-neutral-950/40 rounded-2xl border border-dashed border-neutral-800 p-6">
                  <PhoneCall className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-400 text-xs">No call interactions logged yet.</p>
                  <button
                    onClick={() => onOpenLogCall(lead)}
                    className="mt-3 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-mono text-neutral-200 transition cursor-pointer"
                  >
                    Log First Interaction
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {callLogs.map((c) => (
                    <div
                      key={c.id}
                      className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {c.outcome}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400">
                          {new Date(c.call_date).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>

                      {c.notes && (
                        <p className="text-xs text-neutral-300 whitespace-pre-wrap bg-neutral-900/60 p-2 rounded-lg border border-neutral-850">
                          {c.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
                        <span>Logged by: {c.logged_by_name || 'Telecaller'}</span>
                        {c.followup_date && (
                          <span className="text-amber-400">
                            Follow-up: {new Date(c.followup_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
