import React, { useState, useEffect } from 'react';
import { 
  CrmLead, 
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
  saveCrmLead, 
  isValidPhoneNumber, 
  normalizePhoneNumber,
  getCrmAuthHeaders
} from '../crmService';
import { 
  X, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock,
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  Tag,
  FileText,
  UserCheck
} from 'lucide-react';

interface CrmCreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (newLead: CrmLead) => void;
}

interface TelecallerUserOption {
  id: string;
  name: string;
  role: string;
}

export const CrmCreateLeadModal: React.FC<CrmCreateLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated
}) => {
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
  
  // Date and Time Pickers
  const [followupDate, setFollowupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [followupTime, setFollowupTime] = useState('11:00');

  const [usersList, setUsersList] = useState<TelecallerUserOption[]>([
    { id: 'crm_admin_primary', name: 'Royal Epic Admin', role: 'admin' },
    { id: 'crm_telecaller_1', name: 'Pooja (Senior Telecaller)', role: 'telecaller' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch current users for telecaller dropdown
      fetch('/api/crm/users', { headers: getCrmAuthHeaders() })
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.users) && d.users.length > 0) {
            setUsersList(d.users);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (alternatePhone) {
      const altDigits = alternatePhone.replace(/\D/g, '');
      if (altDigits.length < 10) {
        setError('Alternate mobile number must have at least 10 digits if provided.');
        return;
      }
    }

    setIsSubmitting(true);

    const assignedUser = usersList.find(u => u.id === assignedTo);

    const newLeadPayload: Partial<CrmLead> = {
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

    const res = await saveCrmLead(newLeadPayload);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to create lead');
    } else if (res.lead) {
      onLeadCreated(res.lead);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl text-white shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-white">Manual Lead Entry</h2>
              <div className="text-xs text-neutral-400 font-mono">Create and assign a customer lead record</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="bg-red-950/70 border border-red-700/80 p-3.5 rounded-xl text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs">{error}</div>
            </div>
          )}

          {/* Section 1: Customer Contact Details */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5 pb-1 border-b border-neutral-800">
              <Phone className="w-3.5 h-3.5" />
              <span>Customer Contact Info</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Customer Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Gowda"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Mobile Number (10 Digits) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98450 12345"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Alternate Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  placeholder="e.g. 98801 23456"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh@example.com"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Requirement & Source Categorisation */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5 pb-1 border-b border-neutral-800">
              <Tag className="w-3.5 h-3.5" />
              <span>Categorisation & Requirements</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Lead Source */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Lead Source <span className="text-amber-400">*</span>
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {source === 'Other' && (
                  <input
                    type="text"
                    required
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="Specify other lead source..."
                    className="w-full mt-2 px-3 py-1.5 bg-neutral-950 border border-amber-500/50 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Service Required */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Service Required <span className="text-amber-400">*</span>
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value as ServiceRequired)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  {SERVICES_REQUIRED.map((srv) => (
                    <option key={srv} value={srv}>{srv}</option>
                  ))}
                </select>
                {service === 'Other' && (
                  <input
                    type="text"
                    required
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    placeholder="Specify custom interior / door requirement..."
                    className="w-full mt-2 px-3 py-1.5 bg-neutral-950 border border-amber-500/50 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Customer Location */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Customer Location / Area
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Indiranagar, Whitefield, HSR Layout"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Project Address */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Project Address (Optional)
                </label>
                <input
                  type="text"
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  placeholder="Flat #, Apartment Name, Street"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Budget Range
                </label>
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

              {/* Lead Status */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Lead Status
                </label>
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
            </div>

            {/* Notes / Customer Requirements */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Customer Requirements / Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific design preferences, material expectations, unit size, handover timeline..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Telecaller Assignment & Follow-up */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5 pb-1 border-b border-neutral-800">
              <Calendar className="w-3.5 h-3.5" />
              <span>Assignment & Follow-up Schedule</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Assigned Telecaller
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => {
                    setAssignedTo(e.target.value);
                    const usr = usersList.find(u => u.id === e.target.value);
                    setAssignedToName(usr ? usr.name : '');
                  }}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Next Follow-up Time
                </label>
                <input
                  type="time"
                  value={followupTime}
                  onChange={(e) => setFollowupTime(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3 shrink-0">
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
                  <span>Saving Lead...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
