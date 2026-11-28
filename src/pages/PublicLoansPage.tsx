import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Phone,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Home,
  Sparkles,
  Hammer,
  Building2,
  UserCheck,
  Compass,
  HeartHandshake,
  Clock,
  MapPin,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const loansHeroImage = new URL(
  '../assets/images/loans_hero_architecture_1795675215978.jpg',
  import.meta.url
).href;
const loansConstructionImage = new URL(
  '../assets/images/loans_home_construction_1795675217988.jpg',
  import.meta.url
).href;
const loansInteriorsImage = new URL(
  '../assets/images/loans_home_interiors_1795675218977.jpg',
  import.meta.url
).href;
const loansRenovationImage = new URL(
  '../assets/images/loans_home_renovation_1795675221037.jpg',
  import.meta.url
).href;
const loansPropertyImage = new URL(
  '../assets/images/loans_property_finance_1795675220339.jpg',
  import.meta.url
).href;

export const FINANCE_PURPOSE_OPTIONS = [
  'Home Construction Finance',
  'Home Interior Finance',
  'Home Renovation Finance',
  'Property-Related Finance',
  'Other',
] as const;

export const APPROXIMATE_REQUIREMENT_OPTIONS = [
  'Below ₹5 Lakhs',
  '₹5–10 Lakhs',
  '₹10–25 Lakhs',
  '₹25–50 Lakhs',
  '₹50 Lakhs–₹1 Crore',
  'Above ₹1 Crore',
  'Not Sure Yet',
] as const;

export const PREFERRED_CONTACT_TIME_OPTIONS = [
  'Morning',
  'Afternoon',
  'Evening',
  'Anytime',
] as const;

interface FinanceServiceCardItem {
  id: string;
  purpose: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  icon: React.FC<{ className?: string }>;
}

const FINANCE_SERVICES: FinanceServiceCardItem[] = [
  {
    id: 'home-construction-finance',
    purpose: 'Home Construction Finance',
    title: 'Home Construction Finance',
    description:
      'Planning to build an independent house or residential property? Share your construction plans and approximate requirement with us, and our team will connect with you to discuss suitable finance options.',
    image: loansConstructionImage,
    imageAlt: 'Contemporary independent residential home construction architecture in Bengaluru',
    icon: Home,
  },
  {
    id: 'home-interior-finance',
    purpose: 'Home Interior Finance',
    title: 'Home Interior Finance',
    description:
      'Designing your new apartment, villa or independent home? Explore finance support for turnkey home interiors, modular kitchens, wardrobes, furniture and complete interior execution.',
    image: loansInteriorsImage,
    imageAlt: 'Bespoke luxury residential living and dining room interiors by Royal Epic',
    icon: Sparkles,
  },
  {
    id: 'home-renovation-finance',
    purpose: 'Home Renovation Finance',
    title: 'Home Renovation Finance',
    description:
      'Upgrading your existing home, remodelling key rooms or modernising your interiors? Submit an enquiry to explore finance options for home improvement and renovation work.',
    image: loansRenovationImage,
    imageAlt: 'Modern home renovation and bespoke oak joinery corridor',
    icon: Hammer,
  },
  {
    id: 'property-related-finance',
    purpose: 'Property-Related Finance',
    title: 'Property-Related Finance',
    description:
      'Looking for financial guidance related to a residential property requirement? Share your details and our team will review your enquiry and guide you appropriately.',
    image: loansPropertyImage,
    imageAlt: 'Elegant residential villa property exterior with landscaped pathway',
    icon: Building2,
  },
];

const WHY_ROYAL_EPIC_BENEFITS = [
  {
    title: 'Understand Your Requirements',
    description:
      'We take the time to understand your home construction, interior or property plans before discussing options.',
    icon: Compass,
  },
  {
    title: 'Personal Assistance',
    description:
      'Our team connects with you directly to review your requirement and guide you step by step.',
    icon: UserCheck,
  },
  {
    title: 'Relevant Options',
    description:
      'Instead of generic information, we focus on options that align with your actual project and budget.',
    icon: ShieldCheck,
  },
  {
    title: 'Support Beyond the Enquiry',
    description:
      'Because Royal Epic works across interiors, properties and home projects, we understand the practical needs of homeowners.',
    icon: HeartHandshake,
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: '1. Submit Your Enquiry',
    description: 'Fill in the enquiry form with your basic contact details and finance requirement.',
  },
  {
    step: '02',
    title: '2. Our Team Connects With You',
    description: 'A Royal Epic representative will call you to understand your requirement in detail.',
  },
  {
    step: '03',
    title: '3. Requirement Review',
    description: 'We review your project type, approximate budget and preferred timeline.',
  },
  {
    step: '04',
    title: '4. Personal Guidance',
    description: 'Our team guides you on the suitable next steps based on your requirement.',
  },
];

const LOANS_FAQ_ITEMS = [
  {
    question: 'What types of finance enquiries can I submit through Royal Epic Loans?',
    answer:
      'You can submit enquiries related to home construction finance, home interior finance, home renovation finance and property-related finance requirements.',
  },
  {
    question: 'How do I get details about available finance options?',
    answer:
      'Simply submit your requirement using the enquiry form on this page. Our team will review your details and contact you personally to discuss suitable options.',
  },
  {
    question: 'Do I need to upload documents on the website?',
    answer:
      'No. You do not need to upload any financial or identity documents on the website. The online form only collects basic contact and requirement details so our team can get in touch with you.',
  },
  {
    question: 'Can I enquire about finance specifically for home interiors or modular kitchen work?',
    answer:
      'Yes. You can select Home Interior Finance or Home Renovation Finance in the enquiry form and briefly mention your interior requirements.',
  },
  {
    question: 'Can I submit an enquiry if I am still in the planning stage?',
    answer:
      'Yes. Even if you are still planning your construction or interior project and are unsure of the exact amount, you can select "Not Sure Yet" and our team will guide you during the call.',
  },
  {
    question: 'How soon will the Royal Epic team contact me after I submit an enquiry?',
    answer:
      'Our team reviews new enquiries promptly and will contact you during working hours, taking your preferred contact time into consideration wherever possible.',
  },
  {
    question: 'Is submitting a finance enquiry free of charge?',
    answer:
      'Yes. Submitting an enquiry through the Royal Epic Loans page is completely free and carries no obligation.',
  },
  {
    question: 'Does submitting an enquiry guarantee finance approval?',
    answer:
      "No. Submitting an enquiry allows our team to understand your requirement and guide you. All finance options are subject to eligibility, verification and the applicable finance provider's terms and approval.",
  },
];

interface PublicLoansPageProps {
  onNavigate?: (path: string) => void;
}

export const PublicLoansPage: React.FC<PublicLoansPageProps> = ({ onNavigate }) => {
  const formSectionRef = useRef<HTMLElement | null>(null);
  const servicesSectionRef = useRef<HTMLElement | null>(null);
  const fullNameInputRef = useRef<HTMLInputElement | null>(null);

  // Enquiry Form State
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [financePurpose, setFinancePurpose] = useState<string>('Home Interior Finance');
  const [approximateAmount, setApproximateAmount] = useState<string>('');
  const [city, setCity] = useState('Bengaluru');
  const [projectDetails, setProjectDetails] = useState('');
  const [preferredContactTime, setPreferredContactTime] = useState<string>('Anytime');
  const [consent, setConsent] = useState(false);
  const [enquirySource, setEnquirySource] = useState<string>('Website Loans Page');

  // Form Submission & Validation State
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Track Analytics Helper
  const trackLoansEvent = (eventName: string, params: Record<string, any> = {}) => {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, {
          event_category: 'Royal Epic Loans',
          ...params,
        });
      }
    } catch (_) {}
  };

  // Host-aware SEO & Canonical tag synchronization
  useEffect(() => {
    const pageTitle = 'Home Interior & Construction Finance Assistance | Royal Epic';
    const metaDesc =
      'Explore home construction, interior and renovation finance enquiry assistance in Bengaluru. Share your requirements with Royal Epic for personal guidance.';
    document.title = pageTitle;

    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://royalepicinterior.com';
    const selfCanonicalUrl = `${origin}/loans`;
    const ogImageUrl = `${origin}/images/royal-epic-loans-og.jpg`;

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', selfCanonicalUrl);

    let descEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descEl) {
      descEl = document.createElement('meta');
      descEl.setAttribute('name', 'description');
      document.head.appendChild(descEl);
    }
    descEl.setAttribute('content', metaDesc);

    let robotsEl = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsEl) {
      robotsEl = document.createElement('meta');
      robotsEl.setAttribute('name', 'robots');
      document.head.appendChild(robotsEl);
    }
    robotsEl.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1');

    const setOg = (prop: string, val: string) => {
      let tag = document.querySelector(`meta[property="${prop}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', prop);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', val);
    };
    setOg('og:title', pageTitle);
    setOg('og:description', metaDesc);
    setOg('og:url', selfCanonicalUrl);
    setOg('og:type', 'website');
    setOg('og:image', ogImageUrl);

    const setTwitter = (name: string, val: string) => {
      let tag =
        document.querySelector(`meta[name="${name}"]`) ||
        document.querySelector(`meta[property="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', val);
    };
    setTwitter('twitter:title', pageTitle);
    setTwitter('twitter:description', metaDesc);
    setTwitter('twitter:url', selfCanonicalUrl);
    setTwitter('twitter:image', ogImageUrl);

    trackLoansEvent('loans_page_view', { page_location: selfCanonicalUrl });
  }, []);

  const scrollToEnquiryForm = (preselectedPurpose?: string, sourceOverride?: string) => {
    if (preselectedPurpose) {
      setFinancePurpose(preselectedPurpose);
    }
    if (sourceOverride) {
      setEnquirySource(sourceOverride);
    }
    if (submittedSuccess) {
      setSubmittedSuccess(false);
    }
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        fullNameInputRef.current?.focus();
      }, 450);
    }
  };

  const scrollToServicesSection = () => {
    trackLoansEvent('loans_hero_explore_click');
    if (servicesSectionRef.current) {
      servicesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRequestCallbackClick = () => {
    trackLoansEvent('loans_callback_cta_click');
    scrollToEnquiryForm(undefined, 'Callback Request');
  };

  const handleServiceCardClick = (purpose: string) => {
    trackLoansEvent('loans_service_card_cta_click', { finance_purpose: purpose });
    scrollToEnquiryForm(purpose, 'Finance Service Card');
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedName = fullName.trim();
    const trimmedMobile = mobileNumber.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      errors.fullName = 'Please enter your full name.';
    }

    const cleanedPhone = trimmedMobile.replace(/[\s\-\(\)\.]/g, '');
    const isValidIndianOrIntl =
      /^(\+91|91|0)?[6-9]\d{9}$/.test(cleanedPhone) || /^\+?[1-9]\d{9,14}$/.test(cleanedPhone);
    if (!trimmedMobile || !isValidIndianOrIntl) {
      errors.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!financePurpose) {
      errors.financePurpose = 'Please select a finance purpose.';
    }

    if (!consent) {
      errors.consent = 'Please confirm your consent to be contacted regarding your finance enquiry.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitError(null);
    if (!validateForm()) {
      trackLoansEvent('loans_enquiry_validation_error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/loans/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: fullName.trim(),
          mobile_number: mobileNumber.trim(),
          email: email.trim() || null,
          finance_purpose: financePurpose,
          approximate_amount: approximateAmount || null,
          city: city.trim() || null,
          project_details: projectDetails.trim() || null,
          preferred_contact_time: preferredContactTime || 'Anytime',
          enquiry_source: enquirySource,
          consent: consent,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setSubmitError(
          data.error ||
            'Unable to submit your enquiry right now. Your details have been preserved — please try again.'
        );
        trackLoansEvent('loans_enquiry_submit_failure', {
          reason: data.error || 'server_error',
        });
        setSubmitting(false);
        return;
      }

      trackLoansEvent('loans_enquiry_submit_success', {
        finance_purpose: financePurpose,
        enquiry_source: enquirySource,
      });

      setSubmittedReference(data.enquiry_reference || null);
      setSubmittedSuccess(true);
      setFieldErrors({});
      setSubmitError(null);

      // Clear sensitive inputs after confirmed success
      setFullName('');
      setMobileNumber('');
      setEmail('');
      setProjectDetails('');
      setApproximateAmount('');
      setConsent(false);
    } catch (_) {
      setSubmitError(
        'Network connection error. Your form details are preserved — please try submitting again.'
      );
      trackLoansEvent('loans_enquiry_submit_failure', { reason: 'network_error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C2331]">
      {/* =====================================================================
          SECTION A – HERO SECTION
          ===================================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F7F2E9] to-[#F3EDE2] border-b border-[#E5DEC9] pt-8 pb-14 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Editorial Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2.5">
                <span className="w-7 h-[1.5px] bg-[#C5A059]" />
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#8C6D3B] font-mono">
                  ROYAL EPIC LOANS
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-bold text-[#1C2331] leading-[1.16] tracking-tight">
                Home Construction, Interior &amp; Renovation Finance Assistance in Bengaluru
              </h1>

              <p className="text-sm sm:text-base font-serif font-semibold text-[#8C6D3B]">
                Your Dream Home. The Right Financial Direction.
              </p>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
                Whether you are constructing a new home, designing complete interiors or planning a home upgrade, Royal Epic helps you explore suitable finance options tailored to your goals. Share your requirements with us and our team will personally guide you.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={scrollToServicesSection}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-[#1C2331] hover:bg-[#273145] text-[#FAF7F2] font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Explore Finance Options
                  <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                </button>
                <button
                  type="button"
                  onClick={handleRequestCallbackClick}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/90 hover:bg-white text-[#1C2331] border border-[#D6C7B2] font-semibold text-sm rounded-xl transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-[#8C6D3B]" />
                  Request a Callback
                </button>
              </div>

              {/* Small Disclaimer Note */}
              <p className="text-xs text-stone-500 leading-relaxed pt-2 border-t border-[#E5DEC9]/80 max-w-lg">
                Finance enquiries are subject to eligibility, verification and the applicable finance provider&apos;s terms and approval.
              </p>
            </div>

            {/* Right Architectural Visual */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-[#E5DEC9] shadow-lg bg-stone-200 aspect-[16/10]">
                <img
                  src={loansHeroImage}
                  alt="Luxurious warm sunlit modern Indian home and interior space by Royal Epic"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C2331]/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-[#FAF7F2]/95 backdrop-blur-md border border-[#E5DEC9] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-[#8C6D3B] font-semibold">
                      Personal Enquiry Guidance
                    </p>
                    <p className="text-sm font-serif font-bold text-[#1C2331] mt-0.5">
                      Construction • Turnkey Interiors • Home Renovation • Property Finance
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => scrollToEnquiryForm(undefined, 'Website Loans Page')}
                    className="text-xs font-semibold text-[#8C6D3B] hover:text-[#1C2331] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    Share Requirements
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION B – INTRODUCTION SECTION
          ===================================================================== */}
      <section className="py-14 sm:py-18 bg-[#FAF7F2] border-b border-[#EAE3D5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6D3B] mb-2.5 font-mono">
            THOUGHTFUL FINANCIAL PLANNING
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1C2331] mb-6 leading-tight">
            Financial Support for Your Home and Lifestyle Goals
          </h2>
          <div className="space-y-4 text-stone-600 text-base sm:text-[17px] leading-relaxed text-left sm:text-center">
            <p>
              Building or transforming a home is one of life&apos;s most important investments. From independent house construction to bespoke interiors, modular kitchens and complete home renovations, the right financial planning makes it easier to move forward with confidence.
            </p>
            <p>
              Through Royal Epic Loans, you can submit your finance enquiry directly to our team. We review your requirement, understand your project scope and connect with you personally to discuss the most suitable way forward.
            </p>
            <p>
              Every home and every customer requirement is different — that is why we take a personal, enquiry-first approach rather than a one-size-fits-all process.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION C – FINANCE SERVICES WE ASSIST WITH
          ===================================================================== */}
      <section
        ref={servicesSectionRef}
        id="finance-services"
        className="py-14 sm:py-20 bg-[#F4EFE6] border-b border-[#E5DEC9]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10 sm:mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6D3B] mb-2 font-mono">
              TAILORED ENQUIRY CATEGORIES
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1C2331] leading-tight">
              Finance Services We Assist With
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2.5 leading-relaxed">
              Select the category that best matches your upcoming home construction, interior design, renovation or property requirement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {FINANCE_SERVICES.map((service) => {
              const IconComponent = service.icon;
              return (
                <div
                  key={service.id}
                  className="group bg-[#FAF7F2] border border-[#E5DEC9] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="relative aspect-[16/10] bg-stone-200 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.imageAlt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-[#FAF7F2]/95 backdrop-blur-sm border border-[#E5DEC9] rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
                      <IconComponent className="w-3.5 h-3.5 text-[#8C6D3B]" />
                      <span className="text-[11px] font-mono font-semibold text-[#1C2331]">
                        {service.title}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1C2331] mb-2.5">
                        {service.title}
                      </h3>
                      <p className="text-sm sm:text-[15px] text-stone-600 leading-relaxed mb-6">
                        {service.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#EAE3D5] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleServiceCardClick(service.purpose)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#1C2331] hover:text-[#8C6D3B] transition-colors cursor-pointer"
                      >
                        Enquire for {service.title}
                        <ArrowRight className="w-4 h-4 text-[#8C6D3B]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION D – WHY CONNECT WITH ROYAL EPIC?
          ===================================================================== */}
      <section className="py-14 sm:py-20 bg-[#FAF7F2] border-b border-[#EAE3D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10 sm:mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6D3B] mb-2 font-mono">
              WHY CONNECT WITH ROYAL EPIC?
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1C2331] leading-tight">
              A More Personal Approach to Your Finance Enquiry
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_ROYAL_EPIC_BENEFITS.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#E5DEC9] rounded-2xl p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-[#F4EFE6] border border-[#E5DEC9] flex items-center justify-center mb-5">
                      <IconComp className="w-5 h-5 text-[#8C6D3B]" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-[#1C2331] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION E – HOW IT WORKS
          ===================================================================== */}
      <section className="py-14 sm:py-18 bg-[#1C2331] text-[#FAF7F2] border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10 sm:mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#C5A059] mb-2 font-mono">
              SIMPLE 4-STEP PROCESS
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white leading-tight">
              How Your Finance Enquiry Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <div
                key={item.step}
                className="bg-[#252E40] border border-stone-700/80 rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block text-xs font-mono font-bold text-[#C5A059] tracking-widest mb-3">
                    STEP {item.step}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-white mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION F – FINANCE ENQUIRY FORM
          ===================================================================== */}
      <section
        ref={formSectionRef}
        id="finance-enquiry-form"
        className="py-14 sm:py-20 bg-[#F4EFE6] border-b border-[#E5DEC9]"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FAF7F2] border border-[#DFD5C5] rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm">
            <div className="max-w-2xl mb-8">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6D3B] mb-2 font-mono">
                ROYAL EPIC LOANS ENQUIRY
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C2331] mb-2">
                Let&apos;s Understand Your Requirements
              </h2>
              <p className="text-stone-600 text-sm sm:text-base">
                Share a few details and our team will get in touch with you.
              </p>
            </div>

            {submittedSuccess ? (
              <div
                role="status"
                aria-live="polite"
                className="bg-emerald-950/5 border border-emerald-800/30 rounded-2xl p-6 sm:p-8 text-left space-y-4"
              >
                <div className="flex items-start gap-3.5">
                  <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif font-bold text-[#1C2331]">
                      Enquiry Received
                    </h3>
                    <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
                      Thank you for contacting Royal Epic Loans. Your enquiry has been received. Our team will review your requirements and get in touch with you.
                    </p>
                    {submittedReference && (
                      <p className="text-xs font-mono text-stone-600 pt-1">
                        Enquiry Reference: <strong className="text-[#1C2331]">{submittedReference}</strong>
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-emerald-800/15 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedSuccess(false);
                      setSubmittedReference(null);
                    }}
                    className="text-xs font-semibold text-[#8C6D3B] hover:text-[#1C2331] underline cursor-pointer"
                  >
                    Submit another finance enquiry
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('/')}
                      className="text-xs font-semibold text-stone-600 hover:text-[#1C2331] cursor-pointer"
                    >
                      Return to Royal Epic Homepage
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitEnquiry} noValidate className="space-y-6">
                {submitError && (
                  <div
                    role="alert"
                    className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* 1. Full Name (Required) */}
                  <div>
                    <label
                      htmlFor="loan-full-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                    >
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      ref={fullNameInputRef}
                      id="loan-full-name"
                      name="customer_name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) {
                          setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                        }
                      }}
                      placeholder="Enter your full name"
                      className={`w-full px-4 py-3 rounded-xl bg-white border ${
                        fieldErrors.fullName ? 'border-red-500' : 'border-[#D6C7B2]'
                      } text-sm text-[#1C2331] focus:outline-none focus:ring-2 focus:ring-[#C5A059]`}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>

                  {/* 2. Mobile Number (Required) */}
                  <div>
                    <label
                      htmlFor="loan-mobile-number"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                    >
                      Mobile Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="loan-mobile-number"
                      name="mobile_number"
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value);
                        if (fieldErrors.mobileNumber) {
                          setFieldErrors((prev) => ({ ...prev, mobileNumber: '' }));
                        }
                      }}
                      placeholder="e.g. 98450 12345"
                      className={`w-full px-4 py-3 rounded-xl bg-white border ${
                        fieldErrors.mobileNumber ? 'border-red-500' : 'border-[#D6C7B2]'
                      } text-sm text-[#1C2331] focus:outline-none focus:ring-2 focus:ring-[#C5A059]`}
                    />
                    {fieldErrors.mobileNumber && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.mobileNumber}</p>
                    )}
                  </div>

                  {/* 3. Email Address (Optional) */}
                  <div>
                    <label
                      htmlFor="loan-email"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                    >
                      Email Address <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="loan-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: '' }));
                        }
                      }}
                      placeholder="you@example.com"
                      className={`w-full px-4 py-3 rounded-xl bg-white border ${
                        fieldErrors.email ? 'border-red-500' : 'border-[#D6C7B2]'
                      } text-sm text-[#1C2331] focus:outline-none focus:ring-2 focus:ring-[#C5A059]`}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* 4. Finance Purpose (Required) */}
                  <div>
                    <label
                      htmlFor="loan-finance-purpose"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                    >
                      Finance Purpose <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="loan-finance-purpose"
                      name="finance_purpose"
                      required
                      value={financePurpose}
                      onChange={(e) => {
                        setFinancePurpose(e.target.value);
                        if (fieldErrors.financePurpose) {
                          setFieldErrors((prev) => ({ ...prev, financePurpose: '' }));
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#D6C7B2] text-sm text-[#1C2331] focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    >
                      {FINANCE_PURPOSE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.financePurpose && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.financePurpose}</p>
                    )}
                  </div>

                  {/* 5. Approximate Finance Requirement (Optional) */}
                  <div>
                    <label
                      htmlFor="loan-approximate-amount"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                    >
                      Approximate Finance Requirement{' '}
                      <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      id="loan-approximate-amount"
                      name="approximate_amount"
                      value={approximateAmount}
                      onChange={(e) => setApproximateAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#D6C7B2] text-sm text-[#1C2331] focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    >
                      <option value="">Select approximate range</option>
                      {APPROXIMATE_REQUIREMENT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 6. City / Location (Optional) */}
                  <div>
                    <label
                      htmlFor="loan-city"
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                    >
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#8C6D3B]" />
                        City / Location
                      </span>{' '}
                      <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="loan-city"
                      name="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Thanisandra, Bengaluru"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#D6C7B2] text-sm text-[#1C2331] focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    />
                  </div>
                </div>

                {/* 7. Preferred Time to Contact (Optional) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#8C6D3B]" />
                      Preferred Time to Contact
                    </span>{' '}
                    <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PREFERRED_CONTACT_TIME_OPTIONS.map((timeOption) => (
                      <button
                        key={timeOption}
                        type="button"
                        onClick={() => setPreferredContactTime(timeOption)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          preferredContactTime === timeOption
                            ? 'bg-[#1C2331] text-white border-[#1C2331]'
                            : 'bg-white text-stone-700 border-[#D6C7B2] hover:border-[#8C6D3B]'
                        }`}
                      >
                        {timeOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. Project Details (Optional) */}
                <div>
                  <label
                    htmlFor="loan-project-details"
                    className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                  >
                    Project Details <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="loan-project-details"
                    name="project_details"
                    rows={3}
                    value={projectDetails}
                    onChange={(e) => setProjectDetails(e.target.value)}
                    placeholder="Briefly describe your home, construction or interior requirements..."
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#D6C7B2] text-sm text-[#1C2331] focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>

                {/* 9. Consent Checkbox (Required) */}
                <div className="pt-1">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        if (fieldErrors.consent) {
                          setFieldErrors((prev) => ({ ...prev, consent: '' }));
                        }
                      }}
                      className="mt-1 w-4 h-4 rounded border-stone-400 text-[#1C2331] focus:ring-[#C5A059]"
                    />
                    <span className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                      I agree to be contacted by Royal Epic regarding my finance enquiry and acknowledge the{' '}
                      <a
                        href="/privacy-policy"
                        onClick={(e) => {
                          if (onNavigate) {
                            e.preventDefault();
                            onNavigate('/privacy-policy');
                          }
                        }}
                        className="underline font-semibold text-[#1C2331] hover:text-[#8C6D3B]"
                      >
                        Privacy Policy
                      </a>
                      . <span className="text-red-600">*</span>
                    </span>
                  </label>
                  {fieldErrors.consent && (
                    <p className="text-xs text-red-600 mt-1.5">{fieldErrors.consent}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#1C2331] hover:bg-[#273145] disabled:opacity-60 text-[#FAF7F2] font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                        Submitting Finance Enquiry...
                      </>
                    ) : (
                      <>
                        Submit Finance Enquiry
                        <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                      </>
                    )}
                  </button>
                </div>

                {/* Concise Disclaimer Below Form */}
                <p className="text-[11px] text-stone-500 leading-relaxed pt-2 border-t border-[#E5DEC9]">
                  Note: We never ask for Aadhaar, PAN, bank account numbers, salary slips, credit card details or OTPs on this online form. Submitting a finance enquiry is free of charge and subject to eligibility, verification and the applicable finance provider&apos;s terms and approval.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION G – FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION)
          ===================================================================== */}
      <section className="py-14 sm:py-20 bg-[#FAF7F2] border-b border-[#EAE3D5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6D3B] mb-2 font-mono">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1C2331]">
              Common Questions About Royal Epic Loans
            </h2>
          </div>

          <div className="space-y-3.5">
            {LOANS_FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              const panelId = `loans-faq-panel-${idx}`;
              const buttonId = `loans-faq-btn-${idx}`;
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#E5DEC9] rounded-2xl overflow-hidden transition-colors"
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-serif font-bold text-[#1C2331]">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8C6D3B] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </h3>
                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-6 pb-5 pt-1 text-sm text-stone-600 leading-relaxed border-t border-[#F4EFE6]"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION G2 – RELATED ROYAL EPIC SERVICES & PLANNING GUIDES
          ===================================================================== */}
      <section className="py-12 sm:py-16 bg-white border-b border-[#EAE3D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-8">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6D3B] mb-2 font-mono">
              COMPLETE HOME ECOSYSTEM IN BENGALURU
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C2331]">
              Explore Related Royal Epic Services &amp; Planning Guides
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2 leading-relaxed">
              Planning a construction, interior fit-out, or property requirement in Bengaluru? Explore our interior design, property rental and budgeting resources:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <a
              href="/turnkey-interior-contractors-bangalore"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/turnkey-interior-contractors-bangalore');
                }
              }}
              className="group p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DEC9] hover:border-[#8C6D3B] transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-serif font-bold text-[#1C2331] group-hover:text-[#8C6D3B] transition-colors mb-1.5">
                  Turnkey Interior Contractors in Bengaluru
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-3">
                  End-to-end civil, electrical, false ceiling, modular kitchen and wardrobe execution under a single project timeline.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6D3B]">
                Explore Turnkey Execution <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>

            <a
              href="/home-interior-design-bangalore"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/home-interior-design-bangalore');
                }
              }}
              className="group p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DEC9] hover:border-[#8C6D3B] transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-serif font-bold text-[#1C2331] group-hover:text-[#8C6D3B] transition-colors mb-1.5">
                  Home Interior Design in Bengaluru
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-3">
                  Bespoke 2BHK, 3BHK, villa and independent residential interior design crafted at our Thanisandra studio.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6D3B]">
                Explore Home Interiors <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>

            <a
              href="/modular-kitchen-bangalore"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/modular-kitchen-bangalore');
                }
              }}
              className="group p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DEC9] hover:border-[#8C6D3B] transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-serif font-bold text-[#1C2331] group-hover:text-[#8C6D3B] transition-colors mb-1.5">
                  Modular Kitchen Design in Bengaluru
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-3">
                  Custom BWR marine plywood, HDHMR and Acrylic/PU modular kitchens engineered for Indian cooking workflows.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6D3B]">
                Explore Modular Kitchens <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>

            <a
              href="/properties"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/properties');
                }
              }}
              className="group p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DEC9] hover:border-[#8C6D3B] transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-serif font-bold text-[#1C2331] group-hover:text-[#8C6D3B] transition-colors mb-1.5">
                  Verified Rental Properties in Bengaluru
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-3">
                  Browse verified 1BHK, 2BHK &amp; 3BHK apartments, houses, villas and commercial spaces for rent across Bengaluru.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6D3B]">
                Browse Rental Listings <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>

            <a
              href="/blog/how-to-read-interior-design-quotation"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/blog/how-to-read-interior-design-quotation');
                }
              }}
              className="group p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DEC9] hover:border-[#8C6D3B] transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-serif font-bold text-[#1C2331] group-hover:text-[#8C6D3B] transition-colors mb-1.5">
                  How to Read an Interior Design Quotation (BOQ)
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-3">
                  Learn how to evaluate material specifications, hardware grades and payment milestones before planning your interior budget.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6D3B]">
                Read Budgeting Guide <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>

            <a
              href="/blog/2bhk-3bhk-home-interior-planning-checklist"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/blog/2bhk-3bhk-home-interior-planning-checklist');
                }
              }}
              className="group p-5 rounded-2xl bg-[#FAF7F2] border border-[#E5DEC9] hover:border-[#8C6D3B] transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-serif font-bold text-[#1C2331] group-hover:text-[#8C6D3B] transition-colors mb-1.5">
                  2BHK &amp; 3BHK Home Interior Planning Checklist
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-3">
                  A room-by-room guide to space planning, electrical points, cabinetry budgeting and execution sequencing in Bengaluru.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6D3B]">
                Read Planning Checklist <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION H – FINAL CALL TO ACTION
          ===================================================================== */}
      <section className="py-14 sm:py-18 bg-[#F4EFE6] border-b border-[#E5DEC9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1C2331] mb-3">
            Your Home Plans Deserve a Thoughtful Start.
          </h2>
          <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto mb-7 leading-relaxed">
            Tell us what you are planning, and our team will connect with you to guide you through the next steps.
          </p>
          <button
            type="button"
            onClick={() => {
              trackLoansEvent('loans_final_cta_click');
              scrollToEnquiryForm(undefined, 'Website Loans Page');
            }}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#1C2331] hover:bg-[#273145] text-[#FAF7F2] font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Enquire About Finance
            <ArrowRight className="w-4 h-4 text-[#C5A059]" />
          </button>
        </div>
      </section>

      {/* =====================================================================
          SECTION I – FINANCE DISCLAIMER & PRIVACY NOTICE
          ===================================================================== */}
      <section className="py-10 bg-[#EFE9DD] text-stone-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-xs leading-relaxed">
          <div>
            <h3 className="font-bold text-[#1C2331] uppercase tracking-wider text-[11px] font-mono mb-1">
              Finance Enquiry Disclaimer
            </h3>
            <p>
              Royal Epic Loans is a customer enquiry and assistance service provided by Royal Epic. Submitting an enquiry on this page does not constitute a sanction, offer or guarantee of finance. All finance options are subject to customer eligibility, document verification and the terms, conditions and approval of the applicable finance provider.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-[#1C2331] uppercase tracking-wider text-[11px] font-mono mb-1">
              Privacy Notice
            </h3>
            <p>
              The information submitted through this form is used solely by Royal Epic to review your finance enquiry and contact you regarding your requirement.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
