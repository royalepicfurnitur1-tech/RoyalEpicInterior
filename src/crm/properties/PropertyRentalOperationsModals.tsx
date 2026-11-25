import React from 'react';
import {
  PropertyRecord,
  PropertyTenantEnquiry,
  PropertySiteVisit,
  PropertyDeal,
  PropertyActivityLog,
  PropertyAvailabilityStatus,
  PROPERTY_AVAILABILITY_STATUSES,
  TENANT_CALL_OUTCOMES,
  TENANT_ENQUIRY_STATUSES,
  TenantEnquiryStatus,
  ALL_PROPERTY_TYPES,
  FURNISHING_STATUSES,
  NEGOTIATION_STATUSES,
  NegotiationStatus,
  PropertyPaymentReceiptData,
  INTERIOR_INTEREST_OPTIONS,
  INTERIOR_SERVICE_REQUIREMENTS,
  PropertyCrmStaffMember
} from './propertyTypes';
import {
  Phone,
  CheckCircle2,
  AlertTriangle,
  Download,
  Clock,
  FileText,
  IndianRupee,
  Sparkles,
  Building2,
  MapPin,
  UserCheck
} from 'lucide-react';

/* ============================================================================
   1. PROPERTY AVAILABILITY TRACKING MODAL (Section 4)
   ============================================================================ */
interface PropertyAvailabilityModalProps {
  property: PropertyRecord | null;
  targetStatus: PropertyAvailabilityStatus;
  setTargetStatus: (status: PropertyAvailabilityStatus) => void;
  notes: string;
  setNotes: (notes: string) => void;
  ownerConfirmed: boolean;
  setOwnerConfirmed: (confirmed: boolean) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PropertyAvailabilityModal: React.FC<PropertyAvailabilityModalProps> = ({
  property,
  targetStatus,
  setTargetStatus,
  notes,
  setNotes,
  ownerConfirmed,
  setOwnerConfirmed,
  submitting,
  onClose,
  onSubmit
}) => {
  if (!property) return null;
  const currentAvail = property.availability_status || 'Available';
  const requiresOwnerConfirmation =
    targetStatus === 'Available' &&
    (currentAvail === 'Rented' ||
      currentAvail === 'Unavailable' ||
      currentAvail === 'Temporarily On Hold' ||
      Boolean((property as any).requires_owner_confirmation) ||
      property.listing_status === 'Rented' ||
      property.listing_status === 'Occupied' ||
      property.listing_status === 'Unavailable' ||
      property.listing_status === 'Temporarily On Hold');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white border border-[#E5DEC9] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#3D2E18]">
              Property Availability Tracking ({property.property_code})
            </h3>
            <p className="text-xs text-[#6E5A3E]">{property.property_title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] text-xs space-y-1">
          <div>
            Current Availability:{' '}
            <strong className="text-[#3D2E18]">{currentAvail}</strong>
          </div>
          <div>
            Website Listing Status:{' '}
            <strong className="text-[#5C4728]">{property.listing_status}</strong>
          </div>
          <p className="text-[11px] text-[#6E5A3E] pt-1">
            • <strong>Rented</strong> & <strong>Unavailable</strong> properties automatically disappear from public website listings.<br />
            • <strong>Temporarily On Hold</strong> properties remain visible as On Hold and do not accept new public enquiries.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
            Update Availability Status *
          </label>
          <select
            value={targetStatus}
            onChange={e => setTargetStatus(e.target.value as PropertyAvailabilityStatus)}
            className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
          >
            {PROPERTY_AVAILABILITY_STATUSES.map(st => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {requiresOwnerConfirmation && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Owner Re-Confirmation Required</span>
            </div>
            <label className="flex items-start gap-2 text-xs text-amber-950 cursor-pointer">
              <input
                type="checkbox"
                checked={ownerConfirmed}
                onChange={e => setOwnerConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I have confirmed directly with the property owner ({property.owner_full_name} • {property.primary_mobile}) that this property is vacant and available for rent again.
              </span>
            </label>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
            Availability Change Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Record reason for status change, tenant visit reference, or owner confirmation remarks..."
            className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
          />
        </div>

        {Array.isArray(property.availability_history) && property.availability_history.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto border-t border-[#EFEAD8] pt-2">
            <div className="text-[11px] font-bold uppercase text-[#6E5A3E]">
              Availability Change History
            </div>
            {property.availability_history.map((h, i) => (
              <div
                key={i}
                className="text-[11px] bg-[#FAF8F5] p-2 rounded border border-[#EFEAD8]"
              >
                <div className="font-semibold text-[#3D2E18]">
                  {h.previous_status ? `${h.previous_status} → ` : ''}
                  <span className="text-[#8C6B38]">{h.status}</span>
                </div>
                <div className="text-[10px] text-[#6E5A3E]">
                  By {h.staff_name} • {new Date(h.timestamp).toLocaleString()}
                  {h.owner_confirmed ? ' • Owner Confirmed' : ''}
                </div>
                {h.notes && <div className="text-[11px] text-slate-700 mt-0.5">{h.notes}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || (requiresOwnerConfirmation && !ownerConfirmed)}
            className="px-5 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Save Availability Status'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ============================================================================
   2. TENANT CALL & FOLLOW-UP MODAL (Section 2)
   ============================================================================ */
interface TenantCallModalProps {
  enquiry: PropertyTenantEnquiry | null;
  callForm: {
    call_outcome: string;
    call_notes: string;
    next_followup_date: string;
    enquiry_status: TenantEnquiryStatus;
  };
  setCallForm: React.Dispatch<
    React.SetStateAction<{
      call_outcome: string;
      call_notes: string;
      next_followup_date: string;
      enquiry_status: TenantEnquiryStatus;
    }>
  >;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TenantCallModal: React.FC<TenantCallModalProps> = ({
  enquiry,
  callForm,
  setCallForm,
  submitting,
  onClose,
  onSubmit
}) => {
  if (!enquiry) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white border border-[#E5DEC9] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#3D2E18]">
              Call Tenant & Record Follow-up ({enquiry.enquiry_code})
            </h3>
            <p className="text-xs text-[#6E5A3E]">
              {enquiry.tenant_name} • <span className="font-mono font-bold">{enquiry.tenant_mobile}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Call Outcome *
            </label>
            <select
              value={callForm.call_outcome}
              onChange={e => setCallForm({ ...callForm, call_outcome: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
            >
              {TENANT_CALL_OUTCOMES.map(o => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Update Enquiry Status
            </label>
            <select
              value={callForm.enquiry_status}
              onChange={e =>
                setCallForm({
                  ...callForm,
                  enquiry_status: e.target.value as TenantEnquiryStatus
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
            >
              {TENANT_ENQUIRY_STATUSES.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
            Next Follow-up Date
          </label>
          <input
            type="date"
            value={callForm.next_followup_date}
            onChange={e => setCallForm({ ...callForm, next_followup_date: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
            Call Notes & Discussion Summary *
          </label>
          <textarea
            rows={3}
            required
            value={callForm.call_notes}
            onChange={e => setCallForm({ ...callForm, call_notes: e.target.value })}
            placeholder="Record tenant discussion, visit availability, budget feedback..."
            className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
          />
        </div>

        {Array.isArray(enquiry.call_history) && enquiry.call_history.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto border-t border-[#EFEAD8] pt-2">
            <div className="text-[11px] font-bold uppercase text-[#6E5A3E]">
              Previous Tenant Call Logs ({enquiry.call_history.length})
            </div>
            {enquiry.call_history.map((c, idx) => (
              <div
                key={c.id || idx}
                className="text-[11px] bg-[#FAF8F5] p-2 rounded border border-[#EFEAD8]"
              >
                <div className="flex justify-between font-semibold text-[#3D2E18]">
                  <span>{c.call_outcome}</span>
                  <span className="font-mono text-[10px] text-[#6E5A3E]">
                    {new Date(c.call_date_time).toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-700 mt-0.5">{c.call_notes}</div>
                <div className="text-[10px] text-[#8C6B38] mt-0.5">
                  Staff: {c.staff_name}
                  {c.next_followup_date ? ` • Next Follow-up: ${c.next_followup_date}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Saving Call...' : 'Save Tenant Call Log'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ============================================================================
   3. RENT NEGOTIATION MODAL (Section 6)
   ============================================================================ */
interface RentNegotiationModalProps {
  enquiry: PropertyTenantEnquiry | null;
  negForm: {
    original_expected_rent: string;
    tenant_offered_rent: string;
    owner_expected_rent: string;
    final_agreed_rent: string;
    original_deposit: string;
    final_agreed_deposit: string;
    maintenance_charges: string;
    negotiation_notes: string;
    negotiation_status: NegotiationStatus;
  };
  setNegForm: React.Dispatch<
    React.SetStateAction<{
      original_expected_rent: string;
      tenant_offered_rent: string;
      owner_expected_rent: string;
      final_agreed_rent: string;
      original_deposit: string;
      final_agreed_deposit: string;
      maintenance_charges: string;
      negotiation_notes: string;
      negotiation_status: NegotiationStatus;
    }>
  >;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RentNegotiationModal: React.FC<RentNegotiationModalProps> = ({
  enquiry,
  negForm,
  setNegForm,
  submitting,
  onClose,
  onSubmit
}) => {
  if (!enquiry) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white border border-[#E5DEC9] rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#3D2E18]">
              Rent & Deposit Negotiation Tracker ({enquiry.enquiry_code})
            </h3>
            <p className="text-xs text-[#6E5A3E]">
              Tenant: <strong>{enquiry.tenant_name}</strong> • Property:{' '}
              <strong>{enquiry.property_title || enquiry.property_code || 'General'}</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Original Expected Rent (₹)
            </label>
            <input
              type="number"
              value={negForm.original_expected_rent}
              onChange={e => setNegForm({ ...negForm, original_expected_rent: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Tenant Offered Rent (₹)
            </label>
            <input
              type="number"
              value={negForm.tenant_offered_rent}
              onChange={e => setNegForm({ ...negForm, tenant_offered_rent: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Owner Counter / Expected Rent (₹)
            </label>
            <input
              type="number"
              value={negForm.owner_expected_rent}
              onChange={e => setNegForm({ ...negForm, owner_expected_rent: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-800 mb-1">
              Final Agreed Rent (₹)
            </label>
            <input
              type="number"
              value={negForm.final_agreed_rent}
              onChange={e => setNegForm({ ...negForm, final_agreed_rent: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-emerald-400 bg-emerald-50/40 text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Original Deposit (₹)
            </label>
            <input
              type="number"
              value={negForm.original_deposit}
              onChange={e => setNegForm({ ...negForm, original_deposit: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-800 mb-1">
              Final Agreed Deposit (₹)
            </label>
            <input
              type="number"
              value={negForm.final_agreed_deposit}
              onChange={e => setNegForm({ ...negForm, final_agreed_deposit: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-emerald-400 bg-emerald-50/40 text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Maintenance Charges (₹/month)
            </label>
            <input
              type="number"
              value={negForm.maintenance_charges}
              onChange={e => setNegForm({ ...negForm, maintenance_charges: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Negotiation Status *
            </label>
            <select
              value={negForm.negotiation_status}
              onChange={e =>
                setNegForm({
                  ...negForm,
                  negotiation_status: e.target.value as NegotiationStatus
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
            >
              {NEGOTIATION_STATUSES.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
            Negotiation Notes & Conditions
          </label>
          <textarea
            rows={3}
            value={negForm.negotiation_notes}
            onChange={e => setNegForm({ ...negForm, negotiation_notes: e.target.value })}
            placeholder="Record painting/cleaning requests, lock-in period, annual escalation terms..."
            className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
          />
        </div>

        {Array.isArray(enquiry.negotiation_history) && enquiry.negotiation_history.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto border-t border-[#EFEAD8] pt-2">
            <div className="text-[11px] font-bold uppercase text-[#6E5A3E]">
              Negotiation History Log ({enquiry.negotiation_history.length})
            </div>
            {enquiry.negotiation_history.map((h, i) => (
              <div
                key={i}
                className="text-[11px] bg-[#FAF8F5] p-2 rounded border border-[#EFEAD8]"
              >
                <div className="flex justify-between font-semibold text-[#3D2E18]">
                  <span>{h.negotiation_status}</span>
                  <span className="font-mono text-[10px] text-[#6E5A3E]">
                    {h.staff_name} • {new Date(h.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#5C4728] mt-0.5">
                  Tenant Offer: ₹{Number(h.tenant_offered_rent || 0).toLocaleString('en-IN')} | Owner Counter: ₹
                  {Number(h.owner_expected_rent || 0).toLocaleString('en-IN')} | Final Agreed: ₹
                  {Number(h.final_agreed_rent || 0).toLocaleString('en-IN')}
                </div>
                {h.notes && <div className="text-slate-700 mt-0.5">{h.notes}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Negotiation Update'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ============================================================================
   4. COMPLETE ENQUIRY HISTORY & WORKSPACE MODAL (Section 2)
   ============================================================================ */
interface EnquiryHistoryDetailModalProps {
  detail: {
    enquiry: PropertyTenantEnquiry;
    property: PropertyRecord | null;
    siteVisits: PropertySiteVisit[];
    deals: PropertyDeal[];
    activities: PropertyActivityLog[];
  } | null;
  onClose: () => void;
  onOpenProperty: (property: PropertyRecord) => void;
}

export const EnquiryHistoryDetailModal: React.FC<EnquiryHistoryDetailModalProps> = ({
  detail,
  onClose,
  onOpenProperty
}) => {
  if (!detail) return null;
  const { enquiry, property, siteVisits, deals, activities } = detail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-3xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#3D2E18]">
              Complete Tenant Enquiry History ({enquiry.enquiry_code})
            </h3>
            <p className="text-xs text-[#6E5A3E]">
              {enquiry.tenant_name} • {enquiry.tenant_mobile} • Status:{' '}
              <strong>{enquiry.enquiry_status}</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        {/* Linked Property Summary */}
        {property && (
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] flex items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-bold text-[#3D2E18]">
                Associated Property: {property.property_code} — {property.property_title}
              </div>
              <div className="text-[#6E5A3E]">
                {property.locality}, {property.city} • Rent: ₹
                {Number(property.expected_monthly_rent || 0).toLocaleString('en-IN')} • Availability:{' '}
                <strong>{property.availability_status || 'Available'}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenProperty(property)}
              className="px-3 py-1.5 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              Open Property Record
            </button>
          </div>
        )}

        {/* Tenant Requirements Snapshot */}
        <div className="p-3.5 rounded-xl bg-white border border-[#EFEAD8] space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#5C4728]">
            Tenant Requirements Profile
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[#6E5A3E]">Category / Type:</span>{' '}
              <strong>
                {enquiry.property_category || 'Residential'} • {enquiry.property_type_needed}
              </strong>
            </div>
            <div>
              <span className="text-[#6E5A3E]">BHK Req:</span>{' '}
              <strong>{enquiry.bhk_requirement || enquiry.property_type_needed || '—'}</strong>
            </div>
            <div>
              <span className="text-[#6E5A3E]">Budget:</span>{' '}
              <strong>
                {enquiry.minimum_budget || enquiry.maximum_budget
                  ? `₹${Number(enquiry.minimum_budget || 0).toLocaleString('en-IN')} - ₹${Number(
                      enquiry.maximum_budget || 0
                    ).toLocaleString('en-IN')}`
                  : enquiry.budget_range || '—'}
              </strong>
            </div>
            <div>
              <span className="text-[#6E5A3E]">Furnishing:</span>{' '}
              <strong>{enquiry.furnishing_preference || 'Any'}</strong>
            </div>
            <div>
              <span className="text-[#6E5A3E]">Parking:</span>{' '}
              <strong>{enquiry.parking_requirement || '—'}</strong>
            </div>
            <div>
              <span className="text-[#6E5A3E]">Profile:</span>{' '}
              <strong>{enquiry.family_or_company_profile || '—'}</strong>
            </div>
            <div>
              <span className="text-[#6E5A3E]">Occupants:</span>{' '}
              <strong>{enquiry.number_of_occupants ?? '—'}</strong>
            </div>
            <div>
              <span className="text-[#6E5A3E]">Move-in Date:</span>{' '}
              <strong>{enquiry.move_in_date || '—'}</strong>
            </div>
          </div>
          {enquiry.additional_requirements && (
            <div className="text-xs text-[#3D2E18] pt-1">
              <span className="text-[#6E5A3E]">Additional Requirements:</span>{' '}
              {enquiry.additional_requirements}
            </div>
          )}
        </div>

        {/* Call History */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#5C4728]">
            Tenant Call Logs ({enquiry.call_history?.length || 0})
          </div>
          {!enquiry.call_history || enquiry.call_history.length === 0 ? (
            <p className="text-xs text-slate-400">No tenant calls logged yet.</p>
          ) : (
            <div className="space-y-1.5">
              {enquiry.call_history.map((c, i) => (
                <div
                  key={c.id || i}
                  className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EFEAD8] text-xs"
                >
                  <div className="flex justify-between font-semibold text-[#3D2E18]">
                    <span>{c.call_outcome}</span>
                    <span className="font-mono text-[11px] text-[#6E5A3E]">
                      {c.staff_name} • {new Date(c.call_date_time).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-700 mt-0.5">{c.call_notes}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Site Visits for this Enquiry */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#5C4728]">
            Linked Site Visits ({siteVisits.length})
          </div>
          {siteVisits.length === 0 ? (
            <p className="text-xs text-slate-400">No site visits scheduled for this enquiry yet.</p>
          ) : (
            <div className="space-y-1.5">
              {siteVisits.map(v => (
                <div
                  key={v.id}
                  className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EFEAD8] text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-mono font-bold text-[#5C4728]">{v.visit_code}</span> (Visit #
                    {v.visit_number || 1}) • {v.visit_date} {v.visit_time} • Staff: {v.assigned_staff}
                    {(v.visit_feedback || v.owner_feedback) && (
                      <div className="text-[11px] text-[#6E5A3E] mt-0.5">
                        Tenant Feedback: {v.visit_feedback || '—'} | Owner Feedback:{' '}
                        {v.owner_feedback || '—'}
                      </div>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#3D2E18] text-white text-[11px] font-semibold">
                    {v.visit_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deals for this Enquiry */}
        {deals.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5C4728]">
              Linked Rental Deals ({deals.length})
            </div>
            {deals.map(d => (
              <div
                key={d.id}
                className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex justify-between items-center"
              >
                <div>
                  <strong className="font-mono">{d.deal_code}</strong> • Final Rent: ₹
                  {Number(d.final_monthly_rent || 0).toLocaleString('en-IN')} • Placement Fee: ₹
                  {Number(d.placement_fee_expected || 0).toLocaleString('en-IN')}
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[11px] font-semibold">
                  {d.deal_status || 'Deal Confirmed'} ({d.payment_status})
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Activity Timeline */}
        {activities.length > 0 && (
          <div className="space-y-1.5 border-t border-[#EFEAD8] pt-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5C4728]">
              Audit & Activity Timeline
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {activities.map(act => (
                <div
                  key={act.id}
                  className="text-[11px] p-2 rounded bg-[#FAF8F5] border border-[#EFEAD8]"
                >
                  <strong>{act.action_type}</strong>: {act.description}
                  <div className="text-[10px] text-[#6E5A3E]">
                    {act.staff_name} • {new Date(act.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   5. PLACEMENT FEE RECEIPT MODAL & DOWNLOADER (Section 8)
   ============================================================================ */
interface PaymentReceiptModalProps {
  receipt: PropertyPaymentReceiptData | null;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handleDownloadReceiptHtml = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Payment Receipt - ${receipt.receipt_number}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; background: #FAF8F5; color: #2B2112; padding: 36px; }
    .card { max-width: 720px; margin: 0 auto; background: #FFFFFF; border: 2px solid #C8B696; border-radius: 14px; padding: 32px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E5DEC9; padding-bottom: 18px; margin-bottom: 22px; }
    .brand { font-size: 22px; font-weight: bold; color: #3D2E18; }
    .sub { font-size: 12px; color: #6E5A3E; margin-top: 4px; }
    .badge { background: #3D2E18; color: #FFF; padding: 6px 12px; border-radius: 6px; font-family: monospace; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #EFEAD8; text-align: left; }
    th { color: #6E5A3E; font-size: 12px; text-transform: uppercase; }
    .totals { background: #FAF8F5; border: 1px solid #E5DEC9; border-radius: 10px; padding: 16px; margin-top: 18px; }
    .footer { margin-top: 28px; font-size: 12px; color: #6E5A3E; text-align: center; border-top: 1px solid #EFEAD8; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="brand">${receipt.company_name}</div>
        <div class="sub">${receipt.parent_brand}</div>
        <div class="sub">${receipt.company_address} • ${receipt.company_phone} • ${receipt.company_email}</div>
      </div>
      <div>
        <div class="badge">RECEIPT: ${receipt.receipt_number}</div>
        <div class="sub" style="text-align:right;margin-top:6px;">Date: ${receipt.receipt_date}</div>
      </div>
    </div>
    <table>
      <tr><th>Deal ID</th><td>${receipt.deal_code}</td><th>Property ID</th><td>${receipt.property_code}</td></tr>
      <tr><th>Received From (Tenant)</th><td><strong>${receipt.tenant_name}</strong> (${receipt.tenant_mobile || '—'})</td><th>Property Owner</th><td>${receipt.owner_name}</td></tr>
      <tr><th>Property Details</th><td colspan="3">${receipt.property_title} (${receipt.property_locality || 'Bengaluru'})</td></tr>
      <tr><th>Payment Mode</th><td>${receipt.payment_mode}</td><th>Transaction Ref</th><td>${receipt.transaction_reference || '—'}</td></tr>
    </table>
    <div class="totals">
      <table>
        <tr><th>Total Placement Fee</th><td style="text-align:right;font-family:monospace;">INR ${Number(receipt.total_placement_fee || 0).toLocaleString('en-IN')}</td></tr>
        <tr><th>Current Payment Received</th><td style="text-align:right;font-family:monospace;font-weight:bold;color:#047857;">INR ${Number(receipt.current_payment_amount || 0).toLocaleString('en-IN')}</td></tr>
        <tr><th>Total Cumulative Received</th><td style="text-align:right;font-family:monospace;">INR ${Number(receipt.total_amount_received || 0).toLocaleString('en-IN')}</td></tr>
        <tr><th>Balance Due</th><td style="text-align:right;font-family:monospace;font-weight:bold;color:#B91C1C;">INR ${Number(receipt.balance_due || 0).toLocaleString('en-IN')}</td></tr>
        <tr><th>Payment Status</th><td style="text-align:right;font-weight:bold;">${receipt.payment_status}</td></tr>
      </table>
    </div>
    ${receipt.notes ? `<p style="font-size:13px;color:#3D2E18;"><strong>Notes:</strong> ${receipt.notes}</p>` : ''}
    <div class="footer">
      Issued by ${receipt.issued_by} • Royal Epic Properties (A vertical of Royal Epic Interiors) • Computer Generated Receipt
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receipt.receipt_number}-${receipt.deal_code}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-[#E5DEC9] pb-4">
          <div>
            <div className="text-base font-bold text-[#3D2E18]">{receipt.company_name}</div>
            <div className="text-xs text-[#8C6B38] font-semibold">{receipt.parent_brand}</div>
            <div className="text-[11px] text-[#6E5A3E] mt-0.5">
              {receipt.company_address} • {receipt.company_phone}
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded bg-[#3D2E18] text-white font-mono text-xs font-bold">
              {receipt.receipt_number}
            </span>
            <div className="text-[11px] text-[#6E5A3E] mt-1 font-mono">
              Date: {receipt.receipt_date}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EFEAD8]">
          <div>
            <span className="text-[#6E5A3E] block">Received From (Tenant):</span>
            <strong className="text-[#3D2E18]">{receipt.tenant_name}</strong>
            {receipt.tenant_mobile && (
              <span className="block font-mono text-[11px] text-slate-500">
                {receipt.tenant_mobile}
              </span>
            )}
          </div>
          <div>
            <span className="text-[#6E5A3E] block">Deal & Property Code:</span>
            <strong className="font-mono text-[#3D2E18]">
              {receipt.deal_code} / {receipt.property_code}
            </strong>
          </div>
          <div className="col-span-2">
            <span className="text-[#6E5A3E] block">Property:</span>
            <strong className="text-[#3D2E18]">{receipt.property_title}</strong> (Owner:{' '}
            {receipt.owner_name})
          </div>
          <div>
            <span className="text-[#6E5A3E] block">Payment Mode:</span>
            <strong>{receipt.payment_mode}</strong>
          </div>
          <div>
            <span className="text-[#6E5A3E] block">Transaction Ref:</span>
            <strong className="font-mono">{receipt.transaction_reference || '—'}</strong>
          </div>
        </div>

        <div className="border border-[#E5DEC9] rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#6E5A3E]">Total Placement Fee Expected:</span>
            <span className="font-mono font-semibold">
              ₹{Number(receipt.total_placement_fee || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-emerald-800 font-bold text-sm border-t border-[#EFEAD8] pt-2">
            <span>Receipt Payment Amount:</span>
            <span className="font-mono">
              ₹{Number(receipt.current_payment_amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6E5A3E]">Total Cumulative Received:</span>
            <span className="font-mono font-semibold text-emerald-700">
              ₹{Number(receipt.total_amount_received || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#EFEAD8] pt-2">
            <span className="text-[#6E5A3E] font-semibold">Remaining Balance Due:</span>
            <span className="font-mono font-bold text-rose-700">
              ₹{Number(receipt.balance_due || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-[#6E5A3E]">Issued by: {receipt.issued_by}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadReceiptHtml}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8C6B38] hover:bg-[#5C4728] text-white text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Receipt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   6. INTERIOR SERVICE CONVERSION MODAL (Section 9)
   ============================================================================ */
interface InteriorConversionModalProps {
  deal: PropertyDeal | null;
  form: {
    interested_in_interior: string;
    interior_service_requirement: string;
    interior_followup_date: string;
    interior_notes: string;
    assigned_staff: string;
    confirm_create: boolean;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      interested_in_interior: string;
      interior_service_requirement: string;
      interior_followup_date: string;
      interior_notes: string;
      assigned_staff: string;
      confirm_create: boolean;
    }>
  >;
  staffList: PropertyCrmStaffMember[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const InteriorConversionModal: React.FC<InteriorConversionModalProps> = ({
  deal,
  form,
  setForm,
  staffList,
  submitting,
  onClose,
  onSubmit
}) => {
  if (!deal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white border border-[#E5DEC9] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8C6B38]" />
            <div>
              <h3 className="text-sm font-bold text-[#3D2E18]">
                Interior Design Opportunity ({deal.deal_code})
              </h3>
              <p className="text-xs text-[#6E5A3E]">
                Tenant: {deal.tenant_name} • Property: {deal.property_title}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        {deal.interior_crm_lead_id && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <strong>Already Linked to Interior Leads CRM:</strong> Lead ID{' '}
            <span className="font-mono font-bold">{deal.interior_crm_lead_id}</span>. Duplicate lead creation is automatically prevented.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Interested in Interior Services
            </label>
            <select
              value={form.interested_in_interior}
              onChange={e => setForm({ ...form, interested_in_interior: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
            >
              {INTERIOR_INTEREST_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Service Requirement
            </label>
            <select
              value={form.interior_service_requirement}
              onChange={e => setForm({ ...form, interior_service_requirement: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
            >
              {INTERIOR_SERVICE_REQUIREMENTS.map(req => (
                <option key={req} value={req}>
                  {req}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Interior Follow-up Date
            </label>
            <input
              type="date"
              value={form.interior_followup_date}
              onChange={e => setForm({ ...form, interior_followup_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
              Assign Interior Telecaller
            </label>
            <input
              type="text"
              list="interior-crm-staff-list"
              value={form.assigned_staff}
              onChange={e => setForm({ ...form, assigned_staff: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
            />
            <datalist id="interior-crm-staff-list">
              {staffList.map(s => (
                <option key={s.id} value={s.fullName} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
            Interior Requirement Notes
          </label>
          <textarea
            rows={3}
            value={form.interior_notes}
            onChange={e => setForm({ ...form, interior_notes: e.target.value })}
            placeholder="Wardrobes, modular kitchen setup, office workstations, or renovation notes..."
            className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
          />
        </div>

        {(form.interested_in_interior === 'Yes' || form.interested_in_interior === 'Follow-up') &&
          !deal.interior_crm_lead_id && (
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] space-y-2">
              <label className="flex items-start gap-2 text-xs text-[#3D2E18] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.confirm_create}
                  onChange={e => setForm({ ...form, confirm_create: e.target.checked })}
                  className="mt-0.5"
                />
                <span>
                  <strong>Confirm Interior Lead Creation:</strong> Create a linked enquiry inside the Royal Epic Interior Leads CRM for{' '}
                  <strong>{deal.tenant_name}</strong> ({deal.tenant_mobile || 'Tenant'}).
                </span>
              </label>
            </div>
          )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-[#3D2E18] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? 'Processing...'
              : form.confirm_create && !deal.interior_crm_lead_id
              ? 'Save & Create Interior CRM Lead'
              : 'Save Interior Opportunity'}
          </button>
        </div>
      </form>
    </div>
  );
};
