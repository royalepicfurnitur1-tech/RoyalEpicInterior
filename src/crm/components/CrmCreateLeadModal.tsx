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
  UserCheck,
  Building,
  User
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
  
  // Date and Time Pickers
  const [followupDate, setFollowupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [followupTime, setFollowupTime] = useState('11:00');

  const [usersList, setUsersList] = useState<TelecallerUserOption[]>([]);
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
            // Default to first active telecaller or admin
            if (!assignedTo) {
              const tele = d.users.find((u: any) => u.role === 'telecaller') || d.users[0];
              if (tele) {
                setAssignedTo(tele.id);
              }
            }
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
      assigned_to_name: assignedUser?.name || undefined,
      next_followup_date: followupDate || undefined,
      next_followup_time: followupTime || undefined,
      next_followup_at: followupDate ? `${followupDate}T${followupTime || '11:00'}:00` : undefined
    };

    const res = await saveCrmLead(newLeadPayload);
    setIsSubmitting(false);

    if (!res.success) {
      if (res.isDuplicate) {
        setError('A lead with this mobile number already exists in the system.');
      } else {
        setError(res.error || 'Failed to create lead. Please verify inputs.');
      }
      return;
    }

    if (res.lead) {
      onLeadCreated(res.lead);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-xl w-full max-w-2xl text-[#172033] shadow-xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#356AE6] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Add New Lead</h2>
              <p className="text-[11px] text-slate-500">Record a new manual inquiry into the CRM pipeline</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-[#172033] hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: CUSTOMER DETAILS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E2E8F0]">
              <User className="w-3.5 h-3.5 text-[#356AE6]" />
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Customer Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9845012345"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Alternate Mobile (Optional)
                </label>
                <input
                  type="tel"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  placeholder="e.g. 9845098765"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Customer Location / Area
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. HSR Layout, Whitefield"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Project / Site Address (Optional)
                </label>
                <input
                  type="text"
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  placeholder="e.g. Prestige Ferns, Flat 402, Bengaluru"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: ENQUIRY DETAILS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E2E8F0]">
              <Tag className="w-3.5 h-3.5 text-[#356AE6]" />
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Enquiry Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Lead Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] focus:outline-none transition-colors"
                >
                  {LEAD_SOURCES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {source === 'Other' && (
                  <input
                    type="text"
                    required
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="Specify other source"
                    className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Service Required
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] focus:outline-none transition-colors"
                >
                  {SERVICES_REQUIRED.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {service === 'Other' && (
                  <input
                    type="text"
                    required
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    placeholder="Specify other service"
                    className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Budget Range
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] focus:outline-none transition-colors"
                >
                  {BUDGET_RANGES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: LEAD MANAGEMENT */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E2E8F0]">
              <UserCheck className="w-3.5 h-3.5 text-[#356AE6]" />
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Lead Management
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] focus:outline-none transition-colors"
                >
                  {LEAD_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Assigned Telecaller
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] focus:outline-none transition-colors"
                >
                  <option value="">Unassigned</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] font-mono focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Follow-up Time
                </label>
                <input
                  type="time"
                  value={followupTime}
                  onChange={(e) => setFollowupTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] font-mono focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: REQUIREMENTS & NOTES */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E2E8F0]">
              <FileText className="w-3.5 h-3.5 text-[#356AE6]" />
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Requirements & Notes
              </h3>
            </div>

            <div>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Client requirements, floor plan dimensions, preferred wood/modular finishes, design aesthetics..."
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none resize-none transition-colors"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving Lead...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Lead to CRM</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
