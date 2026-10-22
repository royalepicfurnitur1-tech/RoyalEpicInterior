import React, { useState } from 'react';
import { 
  CrmLead, 
  LeadStatus, 
  LeadTemperature, 
  LeadSource 
} from '../types';
import { 
  saveCrmLead, 
  isValidPhoneNumber, 
  normalizePhoneNumber 
} from '../crmService';
import { 
  X, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin, 
  Flame, 
  Calendar, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

interface CrmCreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (newLead: CrmLead) => void;
}

const SOURCES: LeadSource[] = [
  'Justdial',
  'IndiaMART',
  'Facebook',
  'Instagram',
  'Website',
  'Referral',
  'Walk-in',
  'Other'
];

export const CrmCreateLeadModal: React.FC<CrmCreateLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSource>('Justdial');
  const [service, setService] = useState('Turnkey Interior Design');
  const [city, setCity] = useState('Bengaluru');
  const [budget, setBudget] = useState('₹20 - 35 Lakhs');
  const [temperature, setTemperature] = useState<LeadTemperature>('Warm');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [notes, setNotes] = useState('');
  const [followupDate, setFollowupDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 4);
    return d.toISOString().slice(0, 16);
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide the customer name.');
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      setError('Please provide a valid phone number (10-digit Indian mobile or international format).');
      return;
    }

    setIsSubmitting(true);
    const newLeadPayload: Partial<CrmLead> = {
      customer_name: name.trim(),
      phone: normalizePhoneNumber(phone.trim()),
      email: email.trim() || undefined,
      source,
      interested_service: service.trim(),
      city: city.trim() || 'Bengaluru',
      budget: budget.trim() || undefined,
      temperature,
      status,
      notes: notes.trim() || undefined,
      next_followup_at: followupDate ? new Date(followupDate).toISOString() : undefined
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-xl text-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-white">Create New Lead</h2>
              <div className="text-[11px] font-mono text-neutral-400">Add client to Telecaller CRM database</div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suresh Kumar"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@gmail.com"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Interested Service</label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. 3BHK Turnkey Interior, Modular Kitchen"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">City / Locality</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru (Thanisandra)"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Estimated Budget</label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. ₹15 - 25 Lakhs"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>Lead Temperature</span>
              </label>
              <select
                value={temperature}
                onChange={(e) => setTemperature(e.target.value as LeadTemperature)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
              >
                <option value="Hot">Hot (Immediate buyer)</option>
                <option value="Warm">Warm (Active consideration)</option>
                <option value="Cold">Cold (Exploring)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Initial Follow-up Schedule</span>
            </label>
            <input
              type="datetime-local"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Initial Customer Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Apartment possession date, room measurements, requirements..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

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
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Creating...' : 'Create Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
