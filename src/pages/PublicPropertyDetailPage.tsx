import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Home,
  Building2,
  BedDouble,
  Bath,
  Maximize2,
  Armchair,
  Car,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Users,
  Send,
  X,
  Expand,
  Layers,
  Compass,
  FileCheck2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { PublicPropertyListing } from '../crm/properties/propertyTypes';

interface PublicPropertyDetailPageProps {
  propertySlug: string;
  onBackToList: () => void;
  onSelectProperty: (slug: string) => void;
  onNavigateHome?: () => void;
}

const resolveHostOrigin = (): string => {
  if (typeof window === 'undefined') return 'https://royalepicinterior.com';
  const host = (window.location.hostname || '').toLowerCase();
  if (host.includes('royalepicinterior.in') || (host.endsWith('.in') && host.includes('royalepic'))) {
    return 'https://royalepicinterior.in';
  }
  if (host.includes('royalepicinterior.com') || (host.endsWith('.com') && host.includes('royalepic'))) {
    return 'https://royalepicinterior.com';
  }
  return window.location.origin || 'https://royalepicinterior.com';
};

export const PublicPropertyDetailPage: React.FC<PublicPropertyDetailPageProps> = ({
  propertySlug,
  onBackToList,
  onSelectProperty,
  onNavigateHome,
}) => {
  const initialDetail: PublicPropertyListing | null = (() => {
    if (typeof window !== 'undefined' && (window as any).__INITIAL_PROPERTY_DETAIL__) {
      const hydrated = (window as any).__INITIAL_PROPERTY_DETAIL__;
      if (hydrated && (hydrated.slug === propertySlug || hydrated.property_id === propertySlug)) {
        return hydrated;
      }
    }
    return null;
  })();

  const [property, setProperty] = useState<PublicPropertyListing | null>(initialDetail);
  const [similarProperties, setSimilarProperties] = useState<PublicPropertyListing[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialDetail);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Gallery & Lightbox states
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  // Tenant Enquiry Form Ref & States
  const enquiryFormRef = useRef<HTMLDivElement | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [preferredContactTime, setPreferredContactTime] = useState<string>('Anytime (10 AM - 7 PM)');
  const [preferredVisitDate, setPreferredVisitDate] = useState<string>('');
  const [preferredVisitTime, setPreferredVisitTime] = useState<string>('11:00 AM - 1:00 PM');
  const [numberOfOccupants, setNumberOfOccupants] = useState<string>('Family (3-4 Members)');
  const [additionalRequirements, setAdditionalRequirements] = useState<string>('');
  const [consentGiven, setConsentGiven] = useState<boolean>(true);
  const [websiteUrlHoneypot, setWebsiteUrlHoneypot] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    enquiry_id: string;
    message: string;
    property_title: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);
    setActivePhotoIndex(0);
    setSubmissionSuccess(null);
    setFormError('');

    fetch(`/api/properties/${encodeURIComponent(propertySlug)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Not found');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data && data.success && data.property) {
          setProperty(data.property);
          setSimilarProperties(Array.isArray(data.similar_properties) ? data.similar_properties : []);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setNotFound(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propertySlug]);

  // Update SEO Title, Meta Description, Self-Canonical & JSON-LD when property loads
  useEffect(() => {
    if (!property) return;
    const origin = resolveHostOrigin();
    const canonicalUrl = `${origin}/properties/${property.slug}`;
    const bhkOrType =
      property.bhk_type && property.bhk_type !== 'N/A'
        ? `${property.bhk_type} ${property.property_type}`
        : property.property_type;
    const locality = property.locality || 'Bengaluru';
    const pageTitle = `${property.property_title || `${bhkOrType} for Rent`} in ${locality}, Bengaluru | Royal Epic Properties`;
    const rentFormatted = Number(property.monthly_rent || 0).toLocaleString('en-IN');
    const pageDesc =
      property.description?.slice(0, 220) ||
      `Verified ${bhkOrType} available for rent in ${locality}, Bengaluru. Monthly rent: ₹${rentFormatted}. Furnishing: ${property.furnishing_status}. Request a site visit with Royal Epic Properties.`;

    document.title = pageTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageDesc);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    const setOg = (propName: string, val: string) => {
      let tag = document.querySelector(`meta[property="${propName}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', propName);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', val);
    };
    setOg('og:title', pageTitle);
    setOg('og:description', pageDesc);
    setOg('og:url', canonicalUrl);
    setOg('og:image', property.main_image);
  }, [property]);

  const scrollToEnquiryForm = (prefillVisitRequest: boolean = false) => {
    if (prefillVisitRequest && !preferredVisitDate) {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      setPreferredVisitDate(tomorrow);
    }
    enquiryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    setFormError('');

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter your full name.');
      return;
    }

    const digits = mobileNumber.replace(/\D/g, '');
    const normalizedPhone =
      digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (emailAddress.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!consentGiven) {
      setFormError('Please check the consent box so Royal Epic Properties can contact you.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/properties/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: cleanName,
          mobile_number: normalizedPhone,
          email_address: emailAddress.trim(),
          preferred_contact_time: preferredContactTime,
          interested_property_id: property.property_id,
          interested_property_title: property.property_title,
          preferred_site_visit_date: preferredVisitDate,
          preferred_site_visit_time: preferredVisitTime,
          number_of_occupants: numberOfOccupants,
          additional_requirements: additionalRequirements.trim(),
          consent: consentGiven,
          website_url: websiteUrlHoneypot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Could not submit your enquiry. Please try again.');
      } else {
        setSubmissionSuccess({
          enquiry_id: data.enquiry_id,
          message:
            data.message ||
            'Thank you! Your property enquiry has been received. Our Royal Epic Properties advisor will contact you shortly.',
          property_title: property.property_title,
        });
      }
    } catch (err: any) {
      setFormError('Network error while submitting your enquiry. Please try again or call +91 70261 19311.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-6 bg-stone-200 rounded w-64" />
          <div className="h-96 bg-stone-200 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-80 bg-stone-200 rounded-2xl" />
            <div className="h-80 bg-stone-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-stone-200 p-10 max-w-lg w-full text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-800">
            <Home className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">
            Property No Longer Available
          </h1>
          <p className="text-stone-600 text-sm leading-relaxed mb-6">
            This property may have been rented out, unpublished, or the link has changed. Explore
            other active verified rental properties across Bengaluru.
          </p>
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Available Properties
          </button>
        </div>
      </div>
    );
  }

  const galleryPhotos =
    Array.isArray(property.images) && property.images.length > 0
      ? property.images
      : [
          {
            id: 'primary',
            url: property.main_image,
            category: 'Cover Image',
            is_cover: true,
          },
        ];

  const currentPhoto = galleryPhotos[activePhotoIndex] || galleryPhotos[0];
  const whatsappMessage = encodeURIComponent(
    `Hello Royal Epic Properties, I am interested in "${property.property_title}" (Property ID: ${property.property_id}) in ${property.locality}, Bengaluru (Monthly Rent: ₹${Number(property.monthly_rent || 0).toLocaleString('en-IN')}). Please share site visit availability.`
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 pb-20">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="hover:text-amber-700 transition-colors font-medium"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            <button
              type="button"
              onClick={onBackToList}
              className="hover:text-amber-700 transition-colors font-medium"
            >
              Properties
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-900 font-semibold truncate max-w-xs sm:max-w-md">
              {property.property_title}
            </span>
          </div>

          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-1.5 text-amber-800 font-semibold hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Properties
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Property Header & Pricing Summary */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-stone-900 text-white text-xs font-semibold">
                  {property.property_category === 'Commercial' ? (
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Home className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {property.property_category} • {property.property_type}
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Royal Epic Verified Listing
                </span>

                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-mono text-xs font-semibold">
                  ID: {property.property_id}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-900 mb-2">
                {property.property_title}
              </h1>

              <p className="inline-flex items-center gap-1.5 text-stone-600 text-sm sm:text-base font-medium">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                {property.approximate_location}
                {property.pincode ? ` - ${property.pincode}` : ''}
              </p>
            </div>

            {/* Pricing Box & Quick CTA */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-stone-100 shrink-0">
              <div className="lg:text-right">
                <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold block">
                  Monthly Rent
                </span>
                <div className="text-3xl sm:text-4xl font-bold text-amber-800">
                  ₹{Number(property.monthly_rent || 0).toLocaleString('en-IN')}
                  <span className="text-sm text-stone-500 font-normal"> / month</span>
                </div>
                <div className="text-xs text-stone-600 mt-1 flex flex-wrap lg:justify-end gap-x-3 gap-y-1">
                  <span>
                    Security Deposit:{' '}
                    <strong className="text-stone-900">
                      ₹{Number(property.security_deposit || 0).toLocaleString('en-IN')}
                    </strong>
                  </span>
                  {property.maintenance_charges > 0 && (
                    <span>
                      • Maintenance:{' '}
                      <strong className="text-stone-900">
                        ₹{Number(property.maintenance_charges).toLocaleString('en-IN')}/mo
                      </strong>
                    </span>
                  )}
                  {property.rent_negotiable && (
                    <span className="text-emerald-700 font-semibold">• Rent Negotiable</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => scrollToEnquiryForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm"
                >
                  Enquire Now
                </button>
                <button
                  type="button"
                  onClick={() => scrollToEnquiryForm(true)}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  Request a Site Visit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery Section */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-6 shadow-sm mb-8">
          <div className="relative rounded-xl overflow-hidden bg-stone-950 h-[300px] sm:h-[440px] lg:h-[500px]">
            <img
              src={currentPhoto.url}
              alt={`${property.property_title} - ${currentPhoto.category || 'Photo'}`}
              onClick={() => setLightboxOpen(true)}
              className="w-full h-full object-cover cursor-zoom-in"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

            {/* Photo Category & Counter Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-xs font-semibold">
                {currentPhoto.category || 'Property View'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/60 text-stone-200 text-xs font-mono">
                {activePhotoIndex + 1} / {galleryPhotos.length}
              </span>
            </div>

            {/* Fullscreen Lightbox Trigger */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-black/75 hover:bg-black text-white text-xs font-semibold transition-colors"
            >
              <Expand className="w-3.5 h-3.5" />
              View Full Size
            </button>

            {/* Prev / Next Controls */}
            {galleryPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === 0 ? galleryPhotos.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === galleryPhotos.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Navigation Strip */}
          {galleryPhotos.length > 1 && (
            <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
              {galleryPhotos.map((photo, idx) => (
                <button
                  key={photo.id || idx}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative h-16 sm:h-20 w-24 sm:w-28 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activePhotoIndex
                      ? 'border-amber-600 ring-2 ring-amber-500/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.category || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Two-Column Detail & Enquiry Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Overview, Specs, Amenities, Description, Approximate Location */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Key Specifications Grid */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-serif font-bold text-stone-900 mb-5">
                Property Overview &amp; Specifications
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Configuration
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <BedDouble className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      {property.bhk_type && property.bhk_type !== 'N/A'
                        ? property.bhk_type
                        : property.property_type}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Built-up Area
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Maximize2 className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      {property.built_up_area
                        ? `${property.built_up_area} ${property.area_unit || 'sq.ft'}`
                        : 'Verified Area'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Carpet Area
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Maximize2 className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      {property.carpet_area
                        ? `${property.carpet_area} ${property.area_unit || 'sq.ft'}`
                        : property.built_up_area
                          ? `${property.built_up_area} ${property.area_unit || 'sq.ft'}`
                          : 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Furnishing Status
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Armchair className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{property.furnishing_status || 'Semi-Furnished'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Bedrooms / Bathrooms
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Bath className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      {property.bedrooms} Bed • {property.bathrooms} Bath
                      {property.balconies > 0 ? ` • ${property.balconies} Balcony` : ''}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Floor &amp; Lift
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Layers className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Floor {property.floor_number || 'G'} of {property.total_floors || 'G+4'} •
                      Lift: {property.lift_available || 'Yes'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Parking Availability
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Car className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{property.parking_availability || 'Available'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Facing &amp; Age
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Compass className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      {property.facing || 'East'}
                      {property.property_age ? ` • ${property.property_age}` : ''}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-1">
                    Preferred Tenant / Move-In
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Users className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      {property.preferred_tenant_type || 'Any'} •{' '}
                      {property.available_from || 'Immediate'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Description */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-serif font-bold text-stone-900 mb-3">
                About This Property
              </h2>
              <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {property.description ||
                  `Well-maintained ${property.bhk_type !== 'N/A' ? property.bhk_type : ''} ${property.property_type} available for rent in ${property.locality}, Bengaluru. This property has been verified by Royal Epic Properties for ownership, availability, and clear rental terms. Contact our team to schedule an accompanied site visit.`}
              </p>
            </div>

            {/* Amenities Section */}
            {Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-serif font-bold text-stone-900 mb-4">
                  Amenities &amp; Features
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-stone-800 text-xs sm:text-sm font-semibold"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approximate Location & Privacy Assurance Section */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900 mb-1">
                    Approximate Location
                  </h2>
                  <p className="text-stone-600 text-sm">
                    Locality: <strong className="text-stone-900">{property.locality}</strong>,{' '}
                    {property.city || 'Bengaluru'}
                    {property.pincode ? ` (${property.pincode})` : ''}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  {property.locality}, Bengaluru
                </span>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs sm:text-sm text-stone-600 flex items-start gap-3">
                <FileCheck2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block mb-0.5">
                    Owner Privacy &amp; Accompanied Site Visits
                  </strong>
                  To protect resident privacy, exact building/door numbers and owner contact details
                  are not displayed publicly. Submit an enquiry or request a site visit below, and a
                  Royal Epic Properties advisor will coordinate a convenient accompanied visit.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Actions & Public Tenant Enquiry Form */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6" ref={enquiryFormRef}>
            {/* Instant Contact Action Card */}
            <div className="bg-[#161310] text-white rounded-2xl p-6 border border-amber-500/25 shadow-md">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Royal Epic Properties Desk
              </div>
              <h3 className="text-lg font-serif font-bold text-white mb-1.5">
                Quick Assistance &amp; Site Visits
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed mb-4">
                Connect directly with our Bengaluru property advisory team quoting Property ID{' '}
                <strong className="text-amber-300 font-mono">{property.property_id}</strong>.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="tel:+917026119311"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Royal Epic
                </a>
                <a
                  href={`https://wa.me/917026119311?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp Royal Epic
                </a>
              </div>
            </div>

            {/* Public Tenant Enquiry Form Card */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-7 shadow-sm">
              <h2 className="text-xl font-serif font-bold text-stone-900 mb-1">
                Enquire / Schedule a Site Visit
              </h2>
              <p className="text-xs text-stone-500 mb-5">
                Fill in your details below. Your enquiry is linked directly to{' '}
                <strong className="text-stone-800">{property.property_id}</strong>.
              </p>

              {property.availability_status === 'Temporarily On Hold' ||
              (property as any).accepting_enquiries === false ? (
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2.5">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
                    Temporarily On Hold
                  </div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    Not Accepting New Enquiries Right Now
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    This property is currently on hold while an active tenant application is being processed. Please explore our other verified properties or contact our rental desk for similar options.
                  </p>
                </div>
              ) : submissionSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-stone-900">
                    Enquiry Received!
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                    {submissionSuccess.message}
                  </p>
                  <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs text-stone-700 font-mono">
                    Reference ID: <strong>{submissionSuccess.enquiry_id}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setAdditionalRequirements('');
                    }}
                    className="text-xs font-semibold text-amber-800 hover:underline pt-2"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  {/* Honeypot field hidden from human visitors */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={websiteUrlHoneypot}
                      onChange={(e) => setWebsiteUrlHoneypot(e.target.value)}
                    />
                  </div>

                  {/* Interested Property (Auto-filled) */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      Interested Property
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${property.property_title} (${property.property_id})`}
                      className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 cursor-not-allowed"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Mobile Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Email Address <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  {/* Preferred Contact Time */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Preferred Contact Time
                    </label>
                    <select
                      value={preferredContactTime}
                      onChange={(e) => setPreferredContactTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-amber-600 focus:bg-white"
                    >
                      <option value="Anytime (10 AM - 7 PM)">Anytime (10 AM - 7 PM)</option>
                      <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                      <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                      <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                    </select>
                  </div>

                  {/* Preferred Site Visit Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                        <Calendar className="w-3 h-3 inline mr-1 text-amber-700" />
                        Preferred Visit Date
                      </label>
                      <input
                        type="date"
                        value={preferredVisitDate}
                        onChange={(e) => setPreferredVisitDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:border-amber-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                        <Clock className="w-3 h-3 inline mr-1 text-amber-700" />
                        Preferred Visit Time
                      </label>
                      <select
                        value={preferredVisitTime}
                        onChange={(e) => setPreferredVisitTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:border-amber-600 focus:bg-white"
                      >
                        <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                        <option value="11:00 AM - 1:00 PM">11:00 AM - 1:00 PM</option>
                        <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                        <option value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</option>
                        <option value="Weekend Visit">Weekend Visit</option>
                      </select>
                    </div>
                  </div>

                  {/* Number of Occupants */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Number of Occupants / Profile
                    </label>
                    <select
                      value={numberOfOccupants}
                      onChange={(e) => setNumberOfOccupants(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-amber-600 focus:bg-white"
                    >
                      <option value="Family (2-3 Members)">Family (2-3 Members)</option>
                      <option value="Family (3-4 Members)">Family (3-4 Members)</option>
                      <option value="Family (5+ Members)">Family (5+ Members)</option>
                      <option value="Working Professionals (1-2)">Working Professionals (1-2)</option>
                      <option value="Working Professionals (3-4)">Working Professionals (3-4)</option>
                      <option value="Corporate / Commercial Lease">Corporate / Commercial Lease</option>
                    </select>
                  </div>

                  {/* Additional Requirements */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Additional Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={additionalRequirements}
                      onChange={(e) => setAdditionalRequirements(e.target.value)}
                      placeholder="Move-in timeline, furnishing preferences, or specific questions..."
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>

                  {/* Consent Checkbox */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-0.5 rounded border-stone-300 text-amber-700 focus:ring-amber-600"
                    />
                    <span className="text-xs text-stone-600 leading-relaxed">
                      I consent to be contacted by Royal Epic Properties via phone, WhatsApp, or
                      email regarding this property enquiry and site visit coordination.
                    </span>
                  </label>

                  {formError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting Enquiry...' : 'Submit Property Enquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Similar Properties Section */}
        {similarProperties.length > 0 && (
          <div className="mt-14 pt-10 border-t border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 block">
                  Explore More in Bengaluru
                </span>
                <h2 className="text-2xl font-serif font-bold text-stone-900">
                  Similar Verified Properties
                </h2>
              </div>
              <button
                type="button"
                onClick={onBackToList}
                className="text-xs sm:text-sm font-semibold text-amber-800 hover:underline"
              >
                View All Properties →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProperties.map((sim) => (
                <div
                  key={sim.property_id}
                  onClick={() => onSelectProperty(sim.slug)}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all cursor-pointer flex flex-col"
                >
                  <div className="h-48 bg-stone-100 relative overflow-hidden">
                    <img
                      src={sim.main_image}
                      alt={sim.property_title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded bg-black/70 text-white text-[11px] font-medium">
                      {sim.locality}, Bengaluru
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-stone-900 text-base line-clamp-1 mb-1">
                        {sim.property_title}
                      </h3>
                      <p className="text-xs text-stone-500 mb-2">
                        {sim.bhk_type !== 'N/A' ? `${sim.bhk_type} • ` : ''}
                        {sim.property_type} • {sim.furnishing_status}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <span className="text-base font-bold text-amber-800">
                        ₹{Number(sim.monthly_rent || 0).toLocaleString('en-IN')}/mo
                      </span>
                      <span className="text-xs font-semibold text-stone-800">View Details →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full-Size Photo Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="max-w-5xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-white mb-3">
              <div>
                <span className="text-sm font-semibold">{property.property_title}</span>
                <span className="text-xs text-stone-400 ml-3">
                  {currentPhoto.category || 'Photo'} ({activePhotoIndex + 1} of{' '}
                  {galleryPhotos.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden flex items-center justify-center max-h-[78vh]">
              <img
                src={currentPhoto.url}
                alt={property.property_title}
                className="max-h-[75vh] w-auto object-contain"
              />
              {galleryPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((prev) =>
                        prev === 0 ? galleryPhotos.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((prev) =>
                        prev === galleryPhotos.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicPropertyDetailPage;
