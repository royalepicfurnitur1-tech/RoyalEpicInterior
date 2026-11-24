import React, { useState, useEffect } from 'react';
import {
  PropertyLead,
  PropertyRecord,
  PropertyCallLog,
  PropertyImageRecord,
  PropertyActivityLog,
  PropertyLeadStatus,
  PropertyCallOutcome,
  PropertyCategory,
  PropertyImageCategory,
  PROPERTY_LEAD_STATUSES,
  PROPERTY_CALL_OUTCOMES,
  RESIDENTIAL_PROPERTY_TYPES,
  COMMERCIAL_PROPERTY_TYPES,
  PROPERTY_AMENITIES,
  PROPERTY_IMAGE_CATEGORIES
} from './propertyTypes';
import {
  fetchPropertyLeadDetail,
  updatePropertyLead,
  logPropertyOwnerCall,
  saveCompletePropertyDetails,
  uploadPropertyMedia,
  deletePropertyMedia,
  fetchPrivateOwnerDocument
} from './propertyService';
import {
  X,
  Phone,
  Building2,
  ShieldCheck,
  Image as ImageIcon,
  History,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Trash2,
  Eye,
  Upload,
  Save,
  Calendar,
  MapPin,
  User,
  IndianRupee,
  FileText
} from 'lucide-react';

interface PropertyLeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  initialTab?: 'overview' | 'calling' | 'property' | 'media' | 'history';
  currentUserName: string;
  onClose: () => void;
  onUpdated: () => void;
}

export const PropertyLeadDetailModal: React.FC<PropertyLeadDetailModalProps> = ({
  leadId,
  isOpen,
  initialTab = 'overview',
  currentUserName,
  onClose,
  onUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'calling' | 'property' | 'media' | 'history'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [lead, setLead] = useState<PropertyLead | null>(null);
  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [calls, setCalls] = useState<PropertyCallLog[]>([]);
  const [images, setImages] = useState<PropertyImageRecord[]>([]);
  const [activities, setActivities] = useState<PropertyActivityLog[]>([]);

  // Overview / Lead form state
  const [leadForm, setLeadForm] = useState<Partial<PropertyLead> & { status_note?: string }>({});

  // Call & Follow-up form state
  const [callForm, setCallForm] = useState({
    call_date_time: new Date().toISOString().slice(0, 16),
    call_outcome: 'Connected' as PropertyCallOutcome,
    call_notes: '',
    owner_interested: 'Yes' as 'Yes' | 'No' | 'Not Sure',
    property_available: 'Yes' as 'Yes' | 'No' | 'Not Confirmed',
    details_collected: 'Partially' as 'Yes' | 'Partially' | 'No',
    next_followup_date: '',
    followup_notes: '',
    lead_status: '' as PropertyLeadStatus | ''
  });

  // Complete Property Details & Verification form state
  const [propForm, setPropForm] = useState<Partial<PropertyRecord>>({});

  // Media upload state
  const [mediaCategory, setMediaCategory] = useState<PropertyImageCategory>('Exterior Photos');
  const [mediaFileName, setMediaFileName] = useState('');
  const [mediaDataUrl, setMediaDataUrl] = useState('');
  const [mediaMimeType, setMediaMimeType] = useState('image/jpeg');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; mime: string } | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, leadId]);

  const loadLeadWorkspace = async () => {
    if (!leadId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchPropertyLeadDetail(leadId);
      setLead(data.lead);
      setProperty(data.property);
      setCalls(data.calls || []);
      setImages(data.images || []);
      setActivities(data.activities || []);

      setLeadForm({
        ...data.lead,
        status_note: ''
      });

      const baseProp: Partial<PropertyRecord> = data.property
        ? { ...data.property }
        : {
            property_title: `${data.lead.property_type || 'Property'} in ${data.lead.property_location || 'Bengaluru'}`,
            property_category: data.lead.property_category || 'Residential',
            property_type: data.lead.property_type || '2 BHK',
            bhk_configuration: data.lead.property_category === 'Residential' ? data.lead.property_type : '',
            full_property_address: data.lead.property_location || '',
            locality: data.lead.property_location || '',
            city: 'Bengaluru',
            pin_code: '',
            expected_monthly_rent: data.lead.approx_expected_rent ?? null,
            security_deposit: null,
            maintenance_charges: null,
            other_charges: '',
            rent_negotiable: 'Yes',
            deposit_negotiable: 'Yes',
            built_up_area: '',
            carpet_area: '',
            furnishing_status: 'Semi Furnished',
            bedrooms: null,
            bathrooms: null,
            balconies: null,
            floor_number: '',
            total_floors: '',
            lift_available: 'Yes',
            parking_availability: 'Covered Parking',
            available_from_date: new Date().toISOString().slice(0, 10),
            property_description: data.lead.initial_notes || '',
            amenities: [],
            owner_full_name: data.lead.owner_name || '',
            primary_mobile: data.lead.owner_mobile || '',
            alternate_mobile: data.lead.alternate_mobile || '',
            email_address: '',
            preferred_contact_time: '10:00 AM - 7:00 PM',
            relationship_to_property: 'Owner',
            owner_identity_verified: 'Pending',
            ownership_confirmed: 'Pending',
            property_availability_confirmed: 'Pending',
            permission_to_advertise: 'Pending',
            verification_notes: '',
            verified_by: currentUserName,
            verification_date: new Date().toISOString().slice(0, 10),
            listing_status: 'Draft'
          };
      setPropForm(baseProp);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to load property lead workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && leadId) {
      loadLeadWorkspace();
    }
  }, [isOpen, leadId]);

  if (!isOpen || !leadId) return null;

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSaveLeadOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !lead) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await updatePropertyLead(lead.id, leadForm);
      notifySuccess('Property lead details and workflow status saved to database.');
      await loadLeadWorkspace();
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update property lead.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !lead) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        ...callForm,
        call_date_time: callForm.call_date_time
          ? new Date(callForm.call_date_time).toISOString()
          : new Date().toISOString()
      };
      if (!payload.lead_status) delete payload.lead_status;
      await logPropertyOwnerCall(lead.id, payload);
      notifySuccess('Owner call & follow-up saved permanently.');
      setCallForm({
        ...callForm,
        call_date_time: new Date().toISOString().slice(0, 16),
        call_notes: '',
        followup_notes: '',
        lead_status: ''
      });
      await loadLeadWorkspace();
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save owner call record.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAmenity = (amenity: string) => {
    const current = Array.isArray(propForm.amenities) ? propForm.amenities : [];
    const next = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    setPropForm({ ...propForm, amenities: next });
  };

  const handleSavePropertyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !lead) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await saveCompletePropertyDetails(lead.id, propForm);
      notifySuccess(
        res.isNew
          ? `Complete property record (${res.property.property_code}) created and linked to lead.`
          : `Complete property details & verification (${res.property.property_code}) updated.`
      );
      await loadLeadWorkspace();
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save complete property details.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFileName(file.name);
    setMediaMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingMedia || !lead) return;
    if (!mediaDataUrl) {
      setErrorMsg('Please select a file or enter an image URL before uploading.');
      return;
    }
    setUploadingMedia(true);
    setErrorMsg(null);
    try {
      await uploadPropertyMedia({
        lead_id: lead.id,
        property_id: property?.id || lead.property_id || undefined,
        category: mediaCategory,
        file_name: mediaFileName || `${mediaCategory.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        file_data: mediaDataUrl,
        mime_type: mediaMimeType,
        is_private_document: mediaCategory === 'Additional Documents'
      });
      notifySuccess(
        mediaCategory === 'Additional Documents'
          ? 'Private owner document stored securely (restricted from public access).'
          : `${mediaCategory} uploaded and linked to property record.`
      );
      setMediaFileName('');
      setMediaDataUrl('');
      await loadLeadWorkspace();
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload media.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = async (imageId: string) => {
    setErrorMsg(null);
    try {
      await deletePropertyMedia(imageId);
      notifySuccess('Media item removed.');
      await loadLeadWorkspace();
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove media item.');
    }
  };

  const handleViewPrivateDocument = async (img: PropertyImageRecord) => {
    setErrorMsg(null);
    try {
      const doc = await fetchPrivateOwnerDocument(img.id);
      setPreviewDoc({
        title: `${img.category} — ${doc.file_name}`,
        url: doc.data_url,
        mime: doc.mime_type
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to open private owner document.');
    }
  };

  const isVerificationComplete =
    propForm.owner_identity_verified === 'Yes' &&
    propForm.ownership_confirmed === 'Yes' &&
    propForm.property_availability_confirmed === 'Yes' &&
    propForm.permission_to_advertise === 'Yes';

  const availableTypes =
    (leadForm.property_category || 'Residential') === 'Commercial'
      ? COMMERCIAL_PROPERTY_TYPES
      : RESIDENTIAL_PROPERTY_TYPES;

  const propAvailableTypes =
    (propForm.property_category || 'Residential') === 'Commercial'
      ? COMMERCIAL_PROPERTY_TYPES
      : RESIDENTIAL_PROPERTY_TYPES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#E5DEC9] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#3D2E18] text-white px-5 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-[#B48E55] text-white font-mono text-xs font-semibold">
                {lead?.lead_code || 'Loading...'}
              </span>
              {property?.property_code && (
                <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-300/40 text-amber-200 font-mono text-xs">
                  Listing: {property.property_code} ({property.listing_status})
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded bg-white/15 text-amber-100 text-xs font-medium">
                {lead?.lead_status}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1 truncate">
              {lead?.owner_name || 'Property Owner'} • {lead?.owner_mobile} • {lead?.property_location || 'Location Pending'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close Workspace"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="bg-[#F3EFE6] border-b border-[#E5DEC9] px-5 flex items-center gap-1 overflow-x-auto shrink-0">
          {[
            { id: 'overview', label: '1. Lead Overview & Status', icon: User },
            { id: 'calling', label: `2. Owner Calling & Follow-up (${calls.length})`, icon: Phone },
            { id: 'property', label: '3. Complete Property Details & Verification', icon: Building2 },
            { id: 'media', label: `4. Photos & Private Docs (${images.length})`, icon: ImageIcon },
            { id: 'history', label: `5. Activity History (${activities.length})`, icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'border-[#8C6B38] text-[#3D2E18] bg-[#FAF8F5]'
                    : 'border-transparent text-[#6E5A3E] hover:text-[#3D2E18]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status banners */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-600 font-bold">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#6E5A3E]">
              Loading complete property lead record from Supabase...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & STATUS */}
              {activeTab === 'overview' && lead && (
                <form onSubmit={handleSaveLeadOverview} className="space-y-5">
                  <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728]">
                        Lead Workflow Status & Assignment
                      </h3>
                      <span className="text-[11px] text-[#6E5A3E]">
                        Received: {lead.date_received}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Lead Status *
                        </label>
                        <select
                          value={leadForm.lead_status || 'New Lead'}
                          onChange={e =>
                            setLeadForm({ ...leadForm, lead_status: e.target.value as PropertyLeadStatus })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs text-[#3D2E18] font-semibold"
                        >
                          {PROPERTY_LEAD_STATUSES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Sales Executive Name
                        </label>
                        <input
                          type="text"
                          value={leadForm.sales_executive_name || ''}
                          onChange={e => setLeadForm({ ...leadForm, sales_executive_name: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs text-[#3D2E18]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Assigned Telecaller
                        </label>
                        <input
                          type="text"
                          value={leadForm.telecaller_name || ''}
                          onChange={e => setLeadForm({ ...leadForm, telecaller_name: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs text-[#3D2E18]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                        Status Update Note (Recorded in Activity Trail)
                      </label>
                      <input
                        type="text"
                        value={leadForm.status_note || ''}
                        onChange={e => setLeadForm({ ...leadForm, status_note: e.target.value })}
                        placeholder="Add note explaining status update or owner remark..."
                        className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs text-[#3D2E18]"
                      />
                    </div>
                  </div>

                  {/* Basic Owner & Property Lead Info */}
                  <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2.5">
                      Basic Property Owner & Lead Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Owner Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={leadForm.owner_name || ''}
                          onChange={e => setLeadForm({ ...leadForm, owner_name: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Owner Mobile Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={leadForm.owner_mobile || ''}
                          onChange={e => setLeadForm({ ...leadForm, owner_mobile: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Alternate Mobile Number
                        </label>
                        <input
                          type="text"
                          value={leadForm.alternate_mobile || ''}
                          onChange={e => setLeadForm({ ...leadForm, alternate_mobile: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Property Location / Locality
                        </label>
                        <input
                          type="text"
                          value={leadForm.property_location || ''}
                          onChange={e => setLeadForm({ ...leadForm, property_location: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Property Category
                        </label>
                        <select
                          value={leadForm.property_category || 'Residential'}
                          onChange={e => {
                            const cat = e.target.value as PropertyCategory;
                            const firstType =
                              cat === 'Commercial'
                                ? COMMERCIAL_PROPERTY_TYPES[0]
                                : RESIDENTIAL_PROPERTY_TYPES[0];
                            setLeadForm({
                              ...leadForm,
                              property_category: cat,
                              property_type: firstType
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs"
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Property Type
                        </label>
                        <select
                          value={leadForm.property_type || availableTypes[0]}
                          onChange={e => setLeadForm({ ...leadForm, property_type: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs"
                        >
                          {availableTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Approximate Expected Rent (₹/month)
                        </label>
                        <input
                          type="number"
                          value={leadForm.approx_expected_rent ?? ''}
                          onChange={e =>
                            setLeadForm({
                              ...leadForm,
                              approx_expected_rent: e.target.value ? Number(e.target.value) : null
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Next Follow-up Date
                        </label>
                        <input
                          type="date"
                          value={leadForm.next_followup_date ? leadForm.next_followup_date.slice(0, 10) : ''}
                          onChange={e => setLeadForm({ ...leadForm, next_followup_date: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          External Source Lead ID (Future Sync Ready)
                        </label>
                        <input
                          type="text"
                          value={leadForm.external_source_lead_id || ''}
                          onChange={e =>
                            setLeadForm({ ...leadForm, external_source_lead_id: e.target.value })
                          }
                          placeholder="Optional Sales Exec App ID"
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                        Initial Notes
                      </label>
                      <textarea
                        rows={3}
                        value={leadForm.initial_notes || ''}
                        onChange={e => setLeadForm({ ...leadForm, initial_notes: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5C4728] hover:bg-[#3D2E18] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving to Supabase...' : 'Save Lead Overview'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: OWNER CALLING AND FOLLOW-UP */}
              {activeTab === 'calling' && lead && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Log New Call Form */}
                  <form
                    onSubmit={handleSaveCallLog}
                    className="lg:col-span-5 bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3.5 h-fit"
                  >
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                      Record Owner Call & Follow-up
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                        Call Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={callForm.call_date_time}
                        onChange={e => setCallForm({ ...callForm, call_date_time: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                        Call Outcome *
                      </label>
                      <select
                        value={callForm.call_outcome}
                        onChange={e =>
                          setCallForm({ ...callForm, call_outcome: e.target.value as PropertyCallOutcome })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold text-[#3D2E18]"
                      >
                        {PROPERTY_CALL_OUTCOMES.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#3D2E18] mb-1">
                          Owner Interested
                        </label>
                        <select
                          value={callForm.owner_interested}
                          onChange={e =>
                            setCallForm({ ...callForm, owner_interested: e.target.value as any })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Not Sure">Not Sure</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#3D2E18] mb-1">
                          Property Available
                        </label>
                        <select
                          value={callForm.property_available}
                          onChange={e =>
                            setCallForm({ ...callForm, property_available: e.target.value as any })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Not Confirmed">Not Confirmed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#3D2E18] mb-1">
                          Details Collected
                        </label>
                        <select
                          value={callForm.details_collected}
                          onChange={e =>
                            setCallForm({ ...callForm, details_collected: e.target.value as any })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          <option value="Yes">Yes</option>
                          <option value="Partially">Partially</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                        Call Notes
                      </label>
                      <textarea
                        rows={2}
                        value={callForm.call_notes}
                        onChange={e => setCallForm({ ...callForm, call_notes: e.target.value })}
                        placeholder="Summary of conversation with property owner..."
                        className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          Update Lead Status (Optional)
                        </label>
                        <select
                          value={callForm.lead_status}
                          onChange={e =>
                            setCallForm({ ...callForm, lead_status: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          <option value="">Auto-determine from call</option>
                          {PROPERTY_LEAD_STATUSES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                        Follow-up Notes
                      </label>
                      <input
                        type="text"
                        value={callForm.followup_notes}
                        onChange={e => setCallForm({ ...callForm, followup_notes: e.target.value })}
                        placeholder="Action required on next follow-up..."
                        className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-2.5 rounded-lg bg-[#8C6B38] hover:bg-[#5C4728] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {saving ? 'Saving Call Record...' : 'Save Owner Call & Schedule Follow-up'}
                    </button>
                  </form>

                  {/* Right: Call History List */}
                  <div className="lg:col-span-7 bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                      Permanent Owner Call Records ({calls.length})
                    </h3>

                    {calls.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#6E5A3E]">
                        No owner calls logged yet for this property lead.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {calls.map(c => (
                          <div
                            key={c.id}
                            className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-md bg-[#3D2E18] text-white font-semibold">
                                  {c.call_outcome}
                                </span>
                                <span className="text-[#6E5A3E] font-mono text-[11px]">
                                  {new Date(c.call_date_time).toLocaleString()}
                                </span>
                              </div>
                              <span className="text-[11px] font-medium text-[#5C4728]">
                                Staff: {c.staff_name || 'Telecaller'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-[#EFEAD8] text-[11px]">
                              <div>
                                <span className="text-slate-500">Interested:</span>{' '}
                                <strong className="text-[#3D2E18]">{c.owner_interested}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500">Available:</span>{' '}
                                <strong className="text-[#3D2E18]">{c.property_available}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500">Details:</span>{' '}
                                <strong className="text-[#3D2E18]">{c.details_collected}</strong>
                              </div>
                            </div>

                            {c.call_notes && (
                              <p className="text-[#3D2E18] leading-relaxed">{c.call_notes}</p>
                            )}

                            {(c.next_followup_date || c.followup_notes) && (
                              <div className="text-[11px] text-[#8C6B38] bg-amber-50/70 px-2.5 py-1.5 rounded border border-amber-200/70">
                                <strong>Next Follow-up:</strong> {c.next_followup_date || 'Not set'}{' '}
                                {c.followup_notes ? `— ${c.followup_notes}` : ''}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: COMPLETE PROPERTY DETAILS & VERIFICATION */}
              {activeTab === 'property' && lead && (
                <form onSubmit={handleSavePropertyDetails} className="space-y-5">
                  {/* 1. Property Information */}
                  <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728]">
                        Complete Property Information
                      </h3>
                      {property?.property_code && (
                        <span className="text-xs font-mono font-semibold text-[#8C6B38]">
                          Property Record: {property.property_code}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Property Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={propForm.property_title || ''}
                          onChange={e => setPropForm({ ...propForm, property_title: e.target.value })}
                          placeholder="e.g., Spacious 3 BHK Semi-Furnished Apartment in Indiranagar"
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Property Category
                        </label>
                        <select
                          value={propForm.property_category || 'Residential'}
                          onChange={e =>
                            setPropForm({
                              ...propForm,
                              property_category: e.target.value as PropertyCategory
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Property Type
                        </label>
                        <select
                          value={propForm.property_type || propAvailableTypes[0]}
                          onChange={e => setPropForm({ ...propForm, property_type: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          {propAvailableTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          BHK Configuration
                        </label>
                        <input
                          type="text"
                          value={propForm.bhk_configuration || ''}
                          onChange={e => setPropForm({ ...propForm, bhk_configuration: e.target.value })}
                          placeholder="e.g., 2 BHK / 3 BHK / Commercial Hall"
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Furnishing Status
                        </label>
                        <select
                          value={propForm.furnishing_status || 'Semi Furnished'}
                          onChange={e =>
                            setPropForm({ ...propForm, furnishing_status: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          <option value="Fully Furnished">Fully Furnished</option>
                          <option value="Semi Furnished">Semi Furnished</option>
                          <option value="Unfurnished">Unfurnished</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Full Property Address
                        </label>
                        <input
                          type="text"
                          value={propForm.full_property_address || ''}
                          onChange={e => setPropForm({ ...propForm, full_property_address: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Locality
                        </label>
                        <input
                          type="text"
                          value={propForm.locality || ''}
                          onChange={e => setPropForm({ ...propForm, locality: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={propForm.city || 'Bengaluru'}
                          onChange={e => setPropForm({ ...propForm, city: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          PIN Code
                        </label>
                        <input
                          type="text"
                          value={propForm.pin_code || ''}
                          onChange={e => setPropForm({ ...propForm, pin_code: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Expected Monthly Rent (₹)
                        </label>
                        <input
                          type="number"
                          value={propForm.expected_monthly_rent ?? ''}
                          onChange={e =>
                            setPropForm({
                              ...propForm,
                              expected_monthly_rent: e.target.value ? Number(e.target.value) : null
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Security Deposit (₹)
                        </label>
                        <input
                          type="number"
                          value={propForm.security_deposit ?? ''}
                          onChange={e =>
                            setPropForm({
                              ...propForm,
                              security_deposit: e.target.value ? Number(e.target.value) : null
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Maintenance Charges (₹)
                        </label>
                        <input
                          type="number"
                          value={propForm.maintenance_charges ?? ''}
                          onChange={e =>
                            setPropForm({
                              ...propForm,
                              maintenance_charges: e.target.value ? Number(e.target.value) : null
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Other Charges
                        </label>
                        <input
                          type="text"
                          value={propForm.other_charges || ''}
                          onChange={e => setPropForm({ ...propForm, other_charges: e.target.value })}
                          placeholder="Water / Electricity extra"
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Rent Negotiable
                        </label>
                        <select
                          value={propForm.rent_negotiable || 'Yes'}
                          onChange={e => setPropForm({ ...propForm, rent_negotiable: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Deposit Negotiable
                        </label>
                        <select
                          value={propForm.deposit_negotiable || 'Yes'}
                          onChange={e =>
                            setPropForm({ ...propForm, deposit_negotiable: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Built-up Area (sq.ft)
                        </label>
                        <input
                          type="text"
                          value={propForm.built_up_area || ''}
                          onChange={e => setPropForm({ ...propForm, built_up_area: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Carpet Area (sq.ft)
                        </label>
                        <input
                          type="text"
                          value={propForm.carpet_area || ''}
                          onChange={e => setPropForm({ ...propForm, carpet_area: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Bedrooms / Bathrooms / Balconies
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <input
                            type="number"
                            placeholder="Beds"
                            value={propForm.bedrooms ?? ''}
                            onChange={e =>
                              setPropForm({
                                ...propForm,
                                bedrooms: e.target.value ? Number(e.target.value) : null
                              })
                            }
                            className="px-2 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                          />
                          <input
                            type="number"
                            placeholder="Baths"
                            value={propForm.bathrooms ?? ''}
                            onChange={e =>
                              setPropForm({
                                ...propForm,
                                bathrooms: e.target.value ? Number(e.target.value) : null
                              })
                            }
                            className="px-2 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                          />
                          <input
                            type="number"
                            placeholder="Balc"
                            value={propForm.balconies ?? ''}
                            onChange={e =>
                              setPropForm({
                                ...propForm,
                                balconies: e.target.value ? Number(e.target.value) : null
                              })
                            }
                            className="px-2 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Floor Number / Total Floors
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Floor"
                            value={propForm.floor_number || ''}
                            onChange={e => setPropForm({ ...propForm, floor_number: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Total"
                            value={propForm.total_floors || ''}
                            onChange={e => setPropForm({ ...propForm, total_floors: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Lift Available
                        </label>
                        <select
                          value={propForm.lift_available || 'Yes'}
                          onChange={e => setPropForm({ ...propForm, lift_available: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Parking Availability
                        </label>
                        <input
                          type="text"
                          value={propForm.parking_availability || ''}
                          onChange={e => setPropForm({ ...propForm, parking_availability: e.target.value })}
                          placeholder="1 Covered Car + Bike Parking"
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Available From Date
                        </label>
                        <input
                          type="date"
                          value={propForm.available_from_date ? propForm.available_from_date.slice(0, 10) : ''}
                          onChange={e => setPropForm({ ...propForm, available_from_date: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                        Property Description
                      </label>
                      <textarea
                        rows={2}
                        value={propForm.property_description || ''}
                        onChange={e => setPropForm({ ...propForm, property_description: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                      />
                    </div>
                  </div>

                  {/* 2. Amenities Multi-Select */}
                  <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                      Property Amenities (Multi-Select)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {PROPERTY_AMENITIES.map(amenity => {
                        const checked = (propForm.amenities || []).includes(amenity);
                        return (
                          <label
                            key={amenity}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition ${
                              checked
                                ? 'bg-[#3D2E18] text-white border-[#3D2E18] font-semibold'
                                : 'bg-[#FAF8F5] text-[#3D2E18] border-[#E5DEC9] hover:border-[#B48E55]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleAmenity(amenity)}
                              className="sr-only"
                            />
                            <span>{amenity}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Complete Owner Information */}
                  <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                      Owner Contact & Relationship Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Owner Full Name
                        </label>
                        <input
                          type="text"
                          value={propForm.owner_full_name || ''}
                          onChange={e => setPropForm({ ...propForm, owner_full_name: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Primary Mobile Number
                        </label>
                        <input
                          type="text"
                          value={propForm.primary_mobile || ''}
                          onChange={e => setPropForm({ ...propForm, primary_mobile: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Alternate Mobile Number
                        </label>
                        <input
                          type="text"
                          value={propForm.alternate_mobile || ''}
                          onChange={e => setPropForm({ ...propForm, alternate_mobile: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={propForm.email_address || ''}
                          onChange={e => setPropForm({ ...propForm, email_address: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Preferred Contact Time
                        </label>
                        <input
                          type="text"
                          value={propForm.preferred_contact_time || ''}
                          onChange={e => setPropForm({ ...propForm, preferred_contact_time: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Relationship to Property
                        </label>
                        <select
                          value={propForm.relationship_to_property || 'Owner'}
                          onChange={e =>
                            setPropForm({ ...propForm, relationship_to_property: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        >
                          <option value="Owner">Owner</option>
                          <option value="Authorised Representative">Authorised Representative</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 4. Verification & Advertising Permission Gate */}
                  <div className="bg-white border-2 border-[#B48E55] rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#EFEAD8] pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#8C6B38]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#3D2E18]">
                          Mandatory Property Verification & Permission Gate
                        </h3>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                          isVerificationComplete
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isVerificationComplete
                          ? 'Eligible for Approval'
                          : 'Verification Incomplete — Cannot Approve Yet'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Owner Identity Verified
                        </label>
                        <select
                          value={propForm.owner_identity_verified || 'Pending'}
                          onChange={e =>
                            setPropForm({ ...propForm, owner_identity_verified: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Ownership / Auth Confirmed
                        </label>
                        <select
                          value={propForm.ownership_confirmed || 'Pending'}
                          onChange={e =>
                            setPropForm({ ...propForm, ownership_confirmed: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Property Availability Confirmed
                        </label>
                        <select
                          value={propForm.property_availability_confirmed || 'Pending'}
                          onChange={e =>
                            setPropForm({
                              ...propForm,
                              property_availability_confirmed: e.target.value as any
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Permission to Advertise *
                        </label>
                        <select
                          value={propForm.permission_to_advertise || 'Pending'}
                          onChange={e =>
                            setPropForm({ ...propForm, permission_to_advertise: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Verified By
                        </label>
                        <input
                          type="text"
                          value={propForm.verified_by || currentUserName}
                          onChange={e => setPropForm({ ...propForm, verified_by: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Verification Date
                        </label>
                        <input
                          type="date"
                          value={propForm.verification_date ? propForm.verification_date.slice(0, 10) : ''}
                          onChange={e => setPropForm({ ...propForm, verification_date: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Verification Notes
                        </label>
                        <input
                          type="text"
                          value={propForm.verification_notes || ''}
                          onChange={e => setPropForm({ ...propForm, verification_notes: e.target.value })}
                          placeholder="Verification reference or owner confirmation note"
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5C4728] hover:bg-[#3D2E18] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {saving
                          ? 'Saving Complete Property Record...'
                          : 'Save Complete Property Details & Verification'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: PHOTOS & PRIVATE DOCUMENTS */}
              {activeTab === 'media' && lead && (
                <div className="space-y-5">
                  <form
                    onSubmit={handleUploadMedia}
                    className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#EFEAD8] pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728]">
                        Upload Property Photos & Owner Verification Documents
                      </h3>
                      <span className="text-[11px] text-[#6E5A3E] flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-[#8C6B38]" />
                        Additional Documents are stored privately (not publicly exposed)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Photo / Document Category
                        </label>
                        <select
                          value={mediaCategory}
                          onChange={e => setMediaCategory(e.target.value as PropertyImageCategory)}
                          className="w-full px-3 py-2 rounded-lg border border-[#D8CEB8] text-xs font-semibold"
                        >
                          {PROPERTY_IMAGE_CATEGORIES.map(c => (
                            <option key={c} value={c}>
                              {c === 'Additional Documents' ? 'Additional Documents (Private Owner Doc)' : c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3D2E18] mb-1">
                          Select Image or Document File
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileSelect}
                          className="w-full text-xs text-[#3D2E18] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F3EFE6] file:text-[#3D2E18] hover:file:bg-[#E5DEC9]"
                        />
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={uploadingMedia}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#8C6B38] hover:bg-[#5C4728] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{uploadingMedia ? 'Uploading...' : 'Upload to Property Record'}</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Gallery Grid */}
                  <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                      Associated Property Photos & Private Documents ({images.length})
                    </h3>

                    {images.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#6E5A3E]">
                        No photos or documents uploaded for this property yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map(img => (
                          <div
                            key={img.id}
                            className="border border-[#E5DEC9] rounded-xl overflow-hidden bg-[#FAF8F5] flex flex-col justify-between"
                          >
                            {img.is_private_document ? (
                              <div className="h-40 bg-[#3D2E18]/5 flex flex-col items-center justify-center p-4 text-center">
                                <Lock className="w-8 h-8 text-[#8C6B38] mb-2" />
                                <span className="text-xs font-bold text-[#3D2E18]">
                                  Private Owner Document
                                </span>
                                <span className="text-[11px] text-[#6E5A3E] mt-0.5 truncate max-w-full">
                                  {img.file_name}
                                </span>
                              </div>
                            ) : (
                              <div className="h-40 bg-slate-100 relative overflow-hidden">
                                <img
                                  src={img.public_url || ''}
                                  alt={img.category}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            <div className="p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 rounded bg-[#F3EFE6] text-[#5C4728] text-[11px] font-semibold">
                                  {img.category}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(img.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-xs font-medium text-[#3D2E18] truncate">
                                {img.file_name}
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-[#EFEAD8]">
                                {img.is_private_document ? (
                                  <button
                                    type="button"
                                    onClick={() => handleViewPrivateDocument(img)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6B38] hover:text-[#3D2E18] cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Authorized</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewDoc({
                                        title: `${img.category} — ${img.file_name}`,
                                        url: img.public_url || '',
                                        mime: img.mime_type || 'image/jpeg'
                                      })
                                    }
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6B38] hover:text-[#3D2E18] cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Preview</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleRemoveMedia(img.id)}
                                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: ACTIVITY HISTORY */}
              {activeTab === 'history' && (
                <div className="bg-white border border-[#E5DEC9] rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4728] border-b border-[#EFEAD8] pb-2">
                    Complete Audit & Activity History ({activities.length})
                  </h3>

                  {activities.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#6E5A3E]">
                      No activity history recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activities.map(act => (
                        <div
                          key={act.id}
                          className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5DEC9] flex items-start justify-between gap-4 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold text-[#3D2E18]">{act.description}</div>
                            {(act.old_status || act.new_status) && (
                              <div className="text-[11px] text-[#8C6B38]">
                                Status: {act.old_status || 'None'} → <strong>{act.new_status}</strong>
                              </div>
                            )}
                            <div className="text-[11px] text-[#6E5A3E]">
                              By: {act.performed_by_name || 'CRM Staff'}
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 shrink-0">
                            {new Date(act.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview Modal for Photos or Private Documents */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-[#3D2E18] text-white flex items-center justify-between">
              <span className="text-xs font-bold truncate">{previewDoc.title}</span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-100">
              {previewDoc.mime.includes('pdf') ? (
                <iframe src={previewDoc.url} title={previewDoc.title} className="w-full h-[65vh]" />
              ) : (
                <img src={previewDoc.url} alt={previewDoc.title} className="max-h-[68vh] object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
