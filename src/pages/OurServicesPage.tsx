import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  Home, 
  Building2, 
  Hotel, 
  Utensils, 
  Store, 
  Hammer, 
  Layers, 
  ShieldCheck, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Ruler, 
  Compass, 
  Factory, 
  MapPin, 
  Send,
  ExternalLink,
  Sliders,
  Maximize2
} from 'lucide-react';
import { submitLeadToSupabase } from '../lib/supabase';
import { updatePageHead } from '../utils/seoHelper';

interface OurServicesPageProps {
  onNavigate?: (path: string) => void;
  onRequestQuote?: (title: string) => void;
}

export const OurServicesPage: React.FC<OurServicesPageProps> = ({
  onNavigate = () => {},
  onRequestQuote = () => {}
}) => {
  // -------------------------------------------------------------
  // FORM STATE
  // -------------------------------------------------------------
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    projectType: 'Home Interior',
    projectLocation: '',
    projectSize: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // FAQ ACCORDION STATE
  // -------------------------------------------------------------
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // -------------------------------------------------------------
  // SEO & METADATA INGESTION
  // -------------------------------------------------------------
  useEffect(() => {
    updatePageHead({
      title: 'Turnkey Interior Designers & Contractors in Bangalore | Royal Epic',
      description: 'Royal Epic Interior & Furniture provides turnkey interior design and execution for homes, offices, PGs, restaurants and commercial spaces across Bangalore. Custom furniture, modular kitchens, wardrobes and complete interior solutions.',
      canonicalPath: '/our-services',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80',
      keywords: [
        'interior designers in Bangalore',
        'interior design Bangalore',
        'turnkey interior contractors Bangalore',
        'home interior designers Bangalore',
        'office interior designers Bangalore',
        'office interior contractors Bangalore',
        'PG interior design Bangalore',
        'restaurant interior design Bangalore',
        'commercial interior contractors Bangalore',
        'custom furniture Bangalore',
        'modular kitchen Bangalore',
        'wardrobe design Bangalore',
        'interior contractors in Bangalore',
        'turnkey interior design Bangalore'
      ],
      schemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'HomeAndConstructionBusiness',
          '@id': 'https://royalepicinterior.com/#organization',
          name: 'Royal Epic Interior & Furniture',
          url: 'https://royalepicinterior.com/our-services',
          telephone: '+91 99166 33338',
          email: 'enquiry@royalepicinterior.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra',
            addressLocality: 'Bengaluru',
            addressRegion: 'Karnataka',
            postalCode: '560077',
            addressCountry: 'IN'
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 13.0612,
            longitude: 77.6254
          },
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '09:30',
            closes: '20:00'
          },
          priceRange: '₹₹ - ₹₹₹₹'
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Turnkey Interior Design & Custom Manufacturing Services',
          serviceType: 'Turnkey Interior Design and Site Execution',
          provider: {
            '@type': 'HomeAndConstructionBusiness',
            name: 'Royal Epic Interior & Furniture',
            telephone: '+91 99166 33338',
            url: 'https://royalepicinterior.com'
          },
          areaServed: {
            '@type': 'City',
            name: 'Bengaluru'
          },
          description: 'Turnkey interior design, custom furniture manufacturing, modular kitchens, wardrobes, and site execution for homes, offices, PGs, restaurants, and commercial spaces across Bengaluru.'
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Do you provide turnkey interior execution?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Royal Epic provides end-to-end interior solutions covering design, planning, custom furniture and coordinated execution. Depending on the project scope, execution can include civil, electrical, ceiling, painting, furniture, partitions and related interior works.'
              }
            },
            {
              '@type': 'Question',
              name: 'Do you provide home interior design in Bangalore?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Royal Epic provides interior solutions for apartments, independent homes and villas, including kitchens, wardrobes, living spaces, bedrooms, lighting, ceilings and custom furniture.'
              }
            },
            {
              '@type': 'Question',
              name: 'Do you handle office interiors?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Office solutions can include workstations, cabins, reception areas, meeting rooms, partitions, storage, lighting and custom furniture.'
              }
            },
            {
              '@type': 'Question',
              name: 'Do you provide PG interior design?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Royal Epic provides PG and co-living interior and furniture solutions focused on practical layouts, room furniture, storage, common areas and durable finishes.'
              }
            },
            {
              '@type': 'Question',
              name: 'Do you design restaurant interiors?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Royal Epic provides restaurant and café interior solutions covering layout, furniture, feature elements, ceiling, lighting and related interior execution.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can you manufacture custom furniture?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Royal Epic provides custom furniture solutions designed around the dimensions, functional requirements, materials and finishes of the project.'
              }
            },
            {
              '@type': 'Question',
              name: 'Which areas of Bangalore do you serve?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Royal Epic serves interior requirements across Bengaluru, including HSR Layout, Koramangala, Indiranagar, Whitefield, Electronic City, Hebbal, Nagavara, Thanisandra, Yelahanka and other surrounding areas.'
              }
            },
            {
              '@type': 'Question',
              name: 'How do I start an interior project?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Contact the Royal Epic team with your project type, location and requirements. The team can then discuss the scope and next steps for consultation and site assessment.'
              }
            }
          ]
        }
      ]
    });
  }, []);

  // Smooth scroll handler
  const scrollToForm = () => {
    const el = document.getElementById('consultation-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onRequestQuote('Turnkey Interior Consultation');
    }
  };

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setSubmitError('Please provide your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const scopeSummary = [
        `Location: ${formData.projectLocation || 'Bengaluru'}`,
        formData.projectSize ? `Approx Size: ${formData.projectSize}` : '',
        formData.message ? `Requirements: ${formData.message}` : ''
      ].filter(Boolean).join(' | ');

      await submitLeadToSupabase({
        full_name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        city: formData.projectLocation.trim() || 'Bengaluru',
        service_type: formData.projectType,
        estimated_budget: 'Custom Turnkey Quote',
        project_scope: scopeSummary || 'Inquiry from Our Services landing page',
        source: 'Our Services Landing Page (Google Ads)',
        status: 'new'
      });

      setSubmitted(true);
    } catch (err: any) {
      console.warn('Lead submission warning:', err);
      // Even if offline/interrupted, acknowledge receipt to user
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 14 BENGALURU AREAS
  // -------------------------------------------------------------
  const bengaluruAreas = [
    'HSR Layout', 'Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City',
    'Hebbal', 'Nagavara', 'Thanisandra', 'Yelahanka', 'Hennur',
    'HBR Layout', 'Kalyan Nagar', 'Jakkur', 'Marathahalli', 'Bellandur',
    'Sarjapur Road', 'Jayanagar', 'JP Nagar', 'Bannerghatta Road', 'Rajajinagar',
    'Malleshwaram', 'RT Nagar', 'Banashankari'
  ];

  // -------------------------------------------------------------
  // 12 CORE SERVICES
  // -------------------------------------------------------------
  const servicesList = [
    {
      id: 'home-interiors',
      title: 'Home Interior Design',
      desc: 'Complete interior solutions for apartments, independent houses and villas, including living rooms, bedrooms, kitchens, wardrobes, TV units, ceilings, lighting and custom furniture.',
      link: '/home-interior-design-bangalore',
      ctaText: 'Explore Home Interiors',
      icon: Home
    },
    {
      id: 'luxury-villas',
      title: 'Luxury Home & Villa Interiors',
      desc: 'Thoughtfully planned interiors for larger residences and villas, combining space planning, custom furniture, premium finishes and coordinated execution.',
      link: '/luxury-home-interiors-bangalore',
      ctaText: 'Explore Villa Interiors',
      icon: Sparkles
    },
    {
      id: 'office-corporate',
      title: 'Office & Corporate Interiors',
      desc: 'Functional office interiors covering workstations, executive cabins, reception areas, meeting rooms, partitions, storage, lighting and related workspace requirements.',
      link: '/office-interior-design-bangalore',
      ctaText: 'Explore Office Interiors',
      icon: Building2
    },
    {
      id: 'pg-coliving',
      title: 'PG & Co-Living Interiors',
      desc: 'Practical, durable and space-efficient interior and furniture solutions for PGs and co-living spaces, including room furniture, storage, common areas and woodwork.',
      link: '#pg-coliving-section',
      ctaText: 'Explore PG Solutions',
      icon: Hotel
    },
    {
      id: 'restaurant-cafe',
      title: 'Restaurant & Café Interiors',
      desc: 'Interior planning and execution for restaurants, cafés and hospitality spaces, including dining areas, furniture, feature elements, ceilings, lighting and supporting requirements.',
      link: '/restaurant-interior-design',
      ctaText: 'Explore Hospitality Interiors',
      icon: Utensils
    },
    {
      id: 'commercial-retail',
      title: 'Commercial & Retail Interiors',
      desc: 'Interior solutions for commercial spaces, showrooms and retail environments, combining functional planning, display requirements, partitions and custom furniture.',
      link: '/commercial-interior-design-bangalore',
      ctaText: 'Explore Retail Interiors',
      icon: Store
    },
    {
      id: 'custom-furniture',
      title: 'Custom Furniture',
      desc: 'Custom furniture designed around project dimensions, room requirements and preferred materials and finishes.',
      link: '/custom-furniture-manufacturer',
      ctaText: 'Explore Custom Furniture',
      icon: Hammer
    },
    {
      id: 'modular-kitchens',
      title: 'Modular Kitchens',
      desc: 'Functional modular kitchen solutions designed around available space, storage requirements and daily use.',
      link: '/modular-kitchen-bangalore',
      ctaText: 'Explore Modular Kitchens',
      icon: Layers
    },
    {
      id: 'modular-wardrobes',
      title: 'Modular Wardrobes',
      desc: 'Customized wardrobe solutions for bedrooms and residential spaces with practical storage planning and suitable finishes.',
      link: '/modular-wardrobe-bangalore',
      ctaText: 'Explore Wardrobes',
      icon: Sliders
    },
    {
      id: 'wpc-doors',
      title: 'WPC Doors & Frames',
      desc: 'Durable WPC doors, frames and related applications for residential and commercial requirements.',
      link: '/products',
      ctaText: 'Explore WPC Products',
      icon: ShieldCheck
    },
    {
      id: 'false-ceiling',
      title: 'False Ceiling & Lighting',
      desc: 'Ceiling treatments and lighting solutions integrated into the overall interior design.',
      link: '/false-ceiling-design',
      ctaText: 'Explore False Ceilings',
      icon: Maximize2
    },
    {
      id: 'glass-woodwork',
      title: 'Glass Partitions & Interior Woodwork',
      desc: 'Glass partitions, woodwork and other custom interior elements for residential and commercial spaces.',
      link: '/turnkey-interior-contractors-bangalore',
      ctaText: 'Explore Interior Woodwork',
      icon: Ruler
    }
  ];

  // -------------------------------------------------------------
  // FAQ DATA
  // -------------------------------------------------------------
  const faqData = [
    {
      question: 'Do you provide turnkey interior execution?',
      answer: 'Yes. Royal Epic provides end-to-end interior solutions covering design, planning, custom furniture and coordinated execution. Depending on the project scope, execution can include civil, electrical, ceiling, painting, furniture, partitions and related interior works.'
    },
    {
      question: 'Do you provide home interior design in Bangalore?',
      answer: 'Yes. Royal Epic provides interior solutions for apartments, independent homes and villas, including kitchens, wardrobes, living spaces, bedrooms, lighting, ceilings and custom furniture.'
    },
    {
      question: 'Do you handle office interiors?',
      answer: 'Yes. Office solutions can include workstations, cabins, reception areas, meeting rooms, partitions, storage, lighting and custom furniture.'
    },
    {
      question: 'Do you provide PG interior design?',
      answer: 'Yes. Royal Epic provides PG and co-living interior and furniture solutions focused on practical layouts, room furniture, storage, common areas and durable finishes.'
    },
    {
      question: 'Do you design restaurant interiors?',
      answer: 'Yes. Royal Epic provides restaurant and café interior solutions covering layout, furniture, feature elements, ceiling, lighting and related interior execution.'
    },
    {
      question: 'Can you manufacture custom furniture?',
      answer: 'Yes. Royal Epic provides custom furniture solutions designed around the dimensions, functional requirements, materials and finishes of the project.'
    },
    {
      question: 'Which areas of Bangalore do you serve?',
      answer: 'Royal Epic serves interior requirements across Bengaluru, including HSR Layout, Koramangala, Indiranagar, Whitefield, Electronic City, Hebbal, Nagavara, Thanisandra, Yelahanka and other surrounding areas.'
    },
    {
      question: 'How do I start an interior project?',
      answer: 'Contact the Royal Epic team with your project type, location and requirements. The team can then discuss the scope and next steps for consultation and site assessment.'
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-stone-100 font-sans selection:bg-amber-600/30 selection:text-amber-200">
      
      {/* ============================================================== */}
      {/* SECTION 1: HERO */}
      {/* ============================================================== */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800">
        
        {/* Background Image with Architectural Overlay */}
        <div className="absolute inset-0 z-0 opacity-25">
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=80" 
            alt="Turnkey luxury interior design and craftsmanship in Bengaluru"
            className="w-full h-full object-cover object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
        </div>

        {/* Ambient Gold Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/60 border border-amber-600/30 text-amber-300 text-xs font-semibold tracking-wider uppercase mb-6 backdrop-blur-md">
            <Factory className="w-3.5 h-3.5 text-amber-400" />
            <span>Design • Manufacturing • Execution</span>
          </div>

          {/* H1 - Single Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.15] mb-6">
            Turnkey Interior Designers &amp; Contractors in Bangalore
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl font-medium text-amber-200/90 max-w-3xl mx-auto mb-4 tracking-wide">
            From Design &amp; 3D Planning to Custom Manufacturing and Complete Site Execution
          </p>

          {/* Body */}
          <p className="text-sm sm:text-base text-neutral-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Royal Epic Interior &amp; Furniture delivers end-to-end interior solutions for homes, offices, PGs, restaurants, retail spaces and commercial environments across Bengaluru.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-xl mx-auto">
            
            {/* Primary CTA */}
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm sm:text-base transition-all duration-200 shadow-lg shadow-amber-950/40 hover:scale-[1.02] cursor-pointer"
            >
              <span>Get Free Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/919916633338?text=Hello%20Royal%20Epic%2C%20I%20would%20like%20to%20inquire%20about%20interior%20services%20in%20Bangalore."
              target="_blank"
              rel="noopener noreferrer"
              data-conversion="whatsapp"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm sm:text-base transition-all duration-200 shadow-lg hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </a>

            {/* Phone Call CTA */}
            <a
              href="tel:+919916633338"
              data-conversion="phone"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700 text-neutral-100 font-semibold text-sm sm:text-base transition-all duration-200 hover:scale-[1.02]"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Call Now</span>
            </a>

          </div>

          {/* Verified Phone & City Tag */}
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" /> Thanisandra, Bengaluru
            </span>
            <span className="text-neutral-600">•</span>
            <span className="flex items-center gap-1.5 font-mono text-amber-300">
              <Phone className="w-3.5 h-3.5 text-amber-500" /> +91 99166 33338
            </span>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 2: TRUST / CAPABILITY STRIP */}
      {/* ============================================================== */}
      <section className="bg-neutral-950 border-b border-neutral-800/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/70">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Design &amp; Planning</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                3D concepts, space planning and material selection
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/70">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Custom Manufacturing</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Furniture and interior components made to project requirements
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/70">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Turnkey Execution</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Interior execution coordinated from one team
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/70">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Project Coordination</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                A single point of coordination through the project
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 3: WHAT WE DO */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              Integrated Architectural Approach
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-5">
              Complete Interior Solutions Under One Roof
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Royal Epic combines interior design, planning, custom furniture manufacturing and turnkey execution to simplify the process of creating and transforming interior spaces.
            </p>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-semibold text-amber-300">
                  Single Team Accountability Across All Stages
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Instead of dealing with disparate vendors, subcontractors, carpentry workshops, and material stores, clients can work with one dedicated team across every milestone:
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    'Architectural Design',
                    '3D Space Planning',
                    'Custom Furniture Making',
                    'On-Site Execution',
                    'Quality Finishing',
                    'Final Handover'
                  ].map((trade, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-neutral-200">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{trade}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 pt-2 italic">
                  Note: Project scopes are tailored around the specific requirements and architecture of each property.
                </p>
              </div>

              <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-4">
                <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
                  <Factory className="w-6 h-6 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">In-House Manufacturing Facility</h4>
                    <p className="text-xs text-neutral-400">Thanisandra, Bengaluru</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Having an active production workshop allows us to craft custom modular cabinetry, solid woodwork, WPC door panels, and designer furniture tailored precisely to your project dimensions.
                </p>
                <button
                  onClick={scrollToForm}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-300 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Request an On-Site Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 4: OUR INTERIOR SERVICES (12 Cards) */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950 border-t border-neutral-800/80">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              Comprehensive Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-4">
              Our Interior Design &amp; Execution Services
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              End-to-end design, manufacturing and turnkey execution for residential, commercial and hospitality spaces across Bengaluru.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesList.map((svc) => {
              const IconComp = svc.icon;
              return (
                <div 
                  key={svc.id}
                  className="group bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-600/50 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-600/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-105 transition-transform">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-white mb-2.5 group-hover:text-amber-300 transition-colors">
                      {svc.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6">
                      {svc.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                    {svc.link.startsWith('#') ? (
                      <a
                        href={svc.link}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5"
                      >
                        <span>{svc.ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => onNavigate(svc.link)}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 cursor-pointer text-left"
                      >
                        <span>{svc.ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 5: RESIDENTIAL INTERIORS */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900 border-t border-neutral-800" id="residential-section">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block">
              Homes, Apartments &amp; Villas
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Residential Interior Design in Bangalore
            </h2>
            <p className="text-base text-amber-200 font-medium">
              Your home should work for the way you live.
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Royal Epic provides residential interior solutions for apartments, independent homes and villas, combining space planning, furniture, storage, lighting and finishing into one coordinated interior.
            </p>

            {/* Bullets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {[
                'Living room interiors',
                'Bedroom interiors',
                'Modular kitchens',
                'Wardrobes',
                'TV units',
                'False ceilings',
                'Lighting',
                'Custom furniture',
                'Interior woodwork'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-neutral-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={scrollToForm}
                className="px-7 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
              >
                Plan My Home Interior
              </button>
              <button
                onClick={() => onNavigate('/home-interior-design-bangalore')}
                className="px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-medium text-sm transition-all cursor-pointer"
              >
                Explore Home Layouts
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80" 
                alt="Modern residential living room and home interior design concept"
                className="w-full h-80 sm:h-96 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-neutral-800 text-xs text-neutral-300">
                <span className="font-semibold text-amber-400 block mb-1">Design Reference • Residential Planning</span>
                Spacious open-concept living, integrated TV consoles and custom lighting.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 6: OFFICE & CORPORATE INTERIORS */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950 border-t border-neutral-800" id="office-section">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80" 
                alt="Corporate office workspace, glass partition and meeting room design"
                className="w-full h-80 sm:h-96 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-neutral-800 text-xs text-neutral-300">
                <span className="font-semibold text-amber-400 block mb-1">Design Reference • Corporate Workspace</span>
                Modular benching workstations, glass acoustic partitions &amp; executive cabins.
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block">
              Workplaces &amp; Commercial Offices
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Office &amp; Corporate Interior Design
            </h2>
            <p className="text-base text-neutral-200">
              Create a workspace that is practical, professional and aligned with the way your team works.
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              We design and execute workspaces that balance functional ergonomics, brand presence, acoustic considerations, and efficient floor-space utilization.
            </p>

            {/* Bullets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {[
                'Workstations',
                'Executive cabins',
                'Reception areas',
                'Conference rooms',
                'Glass partitions',
                'Storage',
                'Acoustic considerations',
                'Lighting',
                'Electrical planning',
                'Custom furniture'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-neutral-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={scrollToForm}
                className="px-7 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
              >
                Plan My Office
              </button>
              <button
                onClick={() => onNavigate('/office-interior-design-bangalore')}
                className="px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-medium text-sm transition-all cursor-pointer"
              >
                View Office Solutions
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 7: PG & CO-LIVING INTERIORS */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900 border-t border-neutral-800" id="pg-coliving-section">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              High-Utility Hostels &amp; Co-Living Facilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-4">
              PG &amp; Co-Living Interior Solutions
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Royal Epic also provides interior design, furniture and woodwork solutions for PG and co-living environments. We focus on maximizing room utility, robust durability, and comfortable resident experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="bg-neutral-950 p-6 sm:p-8 rounded-2xl border border-neutral-800 flex flex-col justify-between">
              <div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 inline-block mb-4">
                  <Hotel className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-3">Room &amp; Suite Optimization</h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
                  Space-efficient layouts engineered specifically for single, double, and triple-sharing rooms.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Efficient room layouts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Sturdy bed frames with storage</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Compact wardrobes &amp; lockers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Integrated study &amp; work desks</li>
                </ul>
              </div>
            </div>

            <div className="bg-neutral-950 p-6 sm:p-8 rounded-2xl border border-neutral-800 flex flex-col justify-between">
              <div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 inline-block mb-4">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-3">Common &amp; Dining Spaces</h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
                  Functional community lounges, recreation zones, and shared dining facilities.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Common lounges &amp; entertainment zones</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> High-capacity dining setups</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Utility &amp; pantry storage areas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Durable, easy-to-clean finishes</li>
                </ul>
              </div>
            </div>

            <div className="bg-neutral-950 p-6 sm:p-8 rounded-2xl border border-neutral-800 flex flex-col justify-between">
              <div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 inline-block mb-4">
                  <Factory className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-3">Direct Factory Batch Production</h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
                  Manufactured at our Thanisandra factory for consistent quality, durable edge banding, and reliable on-site assembly.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Heavy-duty hardware &amp; hinges</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Waterproof WPC bathroom doors</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Scratch-resistant laminate surfaces</li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  onClick={scrollToForm}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Consult on PG Interior Scope
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 8: RESTAURANT & CAFÉ INTERIORS */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950 border-t border-neutral-800" id="restaurant-section">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block">
              Hospitality &amp; Dining Venues
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Restaurant &amp; Café Interior Design
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              From layout planning to finishing, create a restaurant environment that balances customer experience, functionality and operational requirements.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                'Dining layouts & seating',
                'Custom dining furniture & booths',
                'Aesthetic feature walls & paneling',
                'Acoustic ceiling treatments',
                'Mood & ambient lighting',
                'Bar counter & service station design',
                'Commercial kitchen coordination',
                'Turnkey surface finishing'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-neutral-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={scrollToForm}
                className="px-7 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
              >
                Discuss Restaurant Interior
              </button>
              <button
                onClick={() => onNavigate('/restaurant-interior-design')}
                className="px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-medium text-sm transition-all cursor-pointer"
              >
                View Restaurant Services
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80" 
                alt="Restaurant and cafe dining interior ambiance and lighting"
                className="w-full h-80 sm:h-96 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-neutral-800 text-xs text-neutral-300">
                <span className="font-semibold text-amber-400 block mb-1">Design Reference • Hospitality Layout</span>
                Bespoke booth seating, pendant lighting arrays &amp; warm acoustic textures.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 9: COMMERCIAL & RETAIL INTERIORS */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900 border-t border-neutral-800" id="commercial-section">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80" 
                alt="Retail showroom display, commercial lighting, and customer space planning"
                className="w-full h-80 sm:h-96 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-neutral-800 text-xs text-neutral-300">
                <span className="font-semibold text-amber-400 block mb-1">Design Reference • Retail &amp; Showroom</span>
                Merchandise display units, entrance reception &amp; specialized track lighting.
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block">
              Showrooms, Boutiques &amp; Retail Stores
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Commercial &amp; Retail Interior Solutions
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              For showrooms, retail spaces and other commercial environments, Royal Epic combines space planning, custom furniture and coordinated execution.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                'Product display units & racks',
                'Reception & billing counters',
                'Customer-facing lounge areas',
                'Inventory & back-office storage',
                'Glass & aluminum partitions',
                'Directional retail lighting',
                'Branding & signage integration',
                'Custom commercial furniture'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-neutral-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={scrollToForm}
                className="px-7 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
              >
                Plan Retail Space
              </button>
              <button
                onClick={() => onNavigate('/commercial-interior-design-bangalore')}
                className="px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-medium text-sm transition-all cursor-pointer"
              >
                Explore Commercial Services
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 10: CUSTOM FURNITURE & MANUFACTURING */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              Bespoke Woodwork &amp; Cabinetry
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-4">
              Custom Furniture Manufacturing
            </h2>
            <p className="text-base sm:text-lg font-medium text-amber-300 mb-3">
              Furniture Designed Around Your Space
            </p>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Royal Epic combines interior planning with custom furniture manufacturing, allowing furniture and interior elements to be developed around the specific requirements of each project.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Ruler className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Exact Dimensions</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Made-to-measure wardrobes, kitchen modules, and consoles shaped to the millimetre of your room dimensions.
              </p>
            </div>

            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Selected Materials &amp; Finishes</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Choose from HDHMR, BWR marine ply, acrylics, high-gloss laminates, PU polish, fluted panels, and WPC components.
              </p>
            </div>

            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Factory className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Thanisandra Workshop</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Assembled, edge-banded, and quality-tested in our Bengaluru facility before delivery and clean installation.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 11: FACTORY-TO-FINISHED-INTERIOR */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              Our Core Differentiator
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-3">
              From Factory to Finished Interior
            </h2>
            <p className="text-base sm:text-lg font-medium text-amber-300 mb-4">
              One team from manufacturing to site execution.
            </p>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Instead of coordinating separately with multiple vendors, customers can work with an interior team that combines design, custom furniture manufacturing and project execution.
            </p>
          </div>

          {/* Process Timeline - Horizontal on Desktop, Vertical on Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 relative">
            {[
              { step: '01', title: 'Design', desc: 'Space layouts & styling concepts' },
              { step: '02', title: 'Planning', desc: 'Material specs & 3D visualizations' },
              { step: '03', title: 'Manufacturing', desc: 'Factory precision carpentry & doors' },
              { step: '04', title: 'Site Execution', desc: 'Civil, ceiling, wiring & fitting' },
              { step: '05', title: 'Finishing', desc: 'Polishing, cleaning & inspection' },
              { step: '06', title: 'Handover', desc: 'Walkthrough & finalized space' }
            ].map((st, i) => (
              <div 
                key={i}
                className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 relative flex flex-col justify-between group hover:border-amber-500/50 transition-all"
              >
                <div>
                  <span className="text-2xl font-serif font-bold text-amber-500/40 group-hover:text-amber-400 transition-colors block mb-2">
                    {st.step}
                  </span>
                  <h3 className="text-sm font-bold text-white mb-1.5">{st.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{st.desc}</p>
                </div>
                {i < 5 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-neutral-600">
                    <ArrowRight className="w-4 h-4 text-amber-500/60" />
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 12: HOW WE WORK (7 Steps) */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950 border-t border-neutral-800">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              Structured Project Management
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-4">
              Our Interior Design &amp; Execution Process
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              A transparent, step-by-step methodology ensuring clarity and coordination from day one.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                step: 'STEP 01',
                title: 'Consultation',
                desc: 'Understand the project, requirements, preferred style and scope.'
              },
              {
                step: 'STEP 02',
                title: 'Site Assessment',
                desc: 'Review the space, measurements and existing site conditions.'
              },
              {
                step: 'STEP 03',
                title: 'Design & Planning',
                desc: 'Develop layouts, design direction, materials and 3D visualization where applicable.'
              },
              {
                step: 'STEP 04',
                title: 'Scope & Estimation',
                desc: 'Discuss project requirements, scope and estimated costs.'
              },
              {
                step: 'STEP 05',
                title: 'Manufacturing',
                desc: 'Prepare custom furniture and relevant interior components in our facility.'
              },
              {
                step: 'STEP 06',
                title: 'Site Execution',
                desc: 'Coordinate installation and associated interior works on site.'
              },
              {
                step: 'STEP 07',
                title: 'Finishing & Handover',
                desc: 'Complete finishing, review the work and hand over the space.'
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-600/40 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <span className="px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-600/30 text-amber-400 font-mono text-xs font-bold shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white mb-0.5">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-neutral-400">{item.desc}</p>
                  </div>
                </div>
                <div className="hidden sm:block text-neutral-600">
                  <CheckCircle2 className="w-5 h-5 text-amber-500/70" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 13: PROJECT CATEGORIES / WORK SHOWCASE */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900 border-t border-neutral-800" id="showcase-section">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              Space Typologies
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-4">
              Spaces We Design &amp; Build
            </h2>
            <p className="text-sm sm:text-base text-neutral-300">
              Visual concepts and design directions across our key service areas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="group bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" 
                  alt="Modern residential interior concepts, living room furniture and space planning"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-neutral-700 text-[11px] font-mono text-amber-300">
                  Design Reference
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-white mb-1.5">Modern Homes</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Residential interior concepts, furniture and space planning for apartments, duplexes and villas.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/home-interior-design-bangalore')}
                  className="mt-4 pt-3 border-t border-neutral-800/80 text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Residential Concepts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80" 
                  alt="Corporate workspace interior design, office furniture and workstations"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-neutral-700 text-[11px] font-mono text-amber-300">
                  Design Reference
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-white mb-1.5">Corporate Workspaces</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Professional office interiors, workstations, boardrooms and custom office furniture.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/office-interior-design-bangalore')}
                  className="mt-4 pt-3 border-t border-neutral-800/80 text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Workspace Concepts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80" 
                  alt="PG and co-living room interior, space-efficient storage and bed furniture"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-neutral-700 text-[11px] font-mono text-amber-300">
                  Design Reference
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-white mb-1.5">PG &amp; Co-Living</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Space-efficient room layouts, durable storage systems, wardrobes and common-area solutions.
                  </p>
                </div>
                <button
                  onClick={scrollToForm}
                  className="mt-4 pt-3 border-t border-neutral-800/80 text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Discuss PG Requirements</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 4 */}
            <div className="group bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" 
                  alt="Restaurant, bar, and cafe interior design and dining layout"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-neutral-700 text-[11px] font-mono text-amber-300">
                  Design Reference
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-white mb-1.5">Restaurants &amp; Cafés</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Customer-facing dining interiors, ambiance lighting, booth seating and functional service bars.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/restaurant-interior-design')}
                  className="mt-4 pt-3 border-t border-neutral-800/80 text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Hospitality Concepts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 5 */}
            <div className="group bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80" 
                  alt="Commercial retail showroom, merchandise racks and boutique display"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-neutral-700 text-[11px] font-mono text-amber-300">
                  Design Reference
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-white mb-1.5">Commercial Spaces</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Retail stores, brand showrooms, reception counters and commercial display environments.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/commercial-interior-design-bangalore')}
                  className="mt-4 pt-3 border-t border-neutral-800/80 text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Retail Concepts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 6 */}
            <div className="group bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80" 
                  alt="Custom furniture manufactured for interior projects, sofas, tables and consoles"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-neutral-700 text-[11px] font-mono text-amber-300">
                  Design Reference
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-white mb-1.5">Custom Furniture</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Furniture designed and manufactured for project requirements with premium materials and finishes.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/custom-furniture-manufacturer')}
                  className="mt-4 pt-3 border-t border-neutral-800/80 text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Furniture Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Social / Portfolio Link Strip */}
          <div className="mt-12 p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">Looking for live project updates &amp; workshop videos?</h4>
              <p className="text-xs text-neutral-400">Explore our ongoing work, workshop walkthroughs and public portfolio.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('/portfolio')}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                View Portfolio
              </button>
              <a
                href="https://www.instagram.com/royal_epic_interiors"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-300 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <span>Instagram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 14: BENGALURU AREAS WE SERVE */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              Citywide Coverage
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-4">
              Interior Design &amp; Turnkey Execution Across Bengaluru
            </h2>
            <p className="text-sm sm:text-base text-neutral-300">
              Royal Epic serves residential and commercial interior requirements across Bengaluru.
            </p>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-10">
            <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-wider text-amber-400">
              <MapPin className="w-4 h-4" />
              <span>Areas We Serve</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {bengaluruAreas.map((area, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-300 flex items-center gap-2 hover:border-amber-600/40 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">{area}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
              <p>
                Have a site located in another Bengaluru locality or outer ring zone? Contact our team for consultation availability.
              </p>
              <button
                onClick={scrollToForm}
                className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Check Your Locality</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 15: WHY ROYAL EPIC */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              Our Value Proposition
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-4">
              Why Choose Royal Epic?
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              A disciplined, factory-backed execution framework built for reliability and design integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 inline-block mb-4">
                <Hammer className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">1. End-to-End Execution</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Design, manufacturing and execution coordinated under one team from initial consultation to final handover.
              </p>
            </div>

            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 inline-block mb-4">
                <Factory className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">2. Custom Manufacturing</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Furniture and interior elements tailored specifically to your project requirements and dimensions.
              </p>
            </div>

            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 inline-block mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">3. Residential &amp; Commercial Capability</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Experience across homes, offices, PGs, restaurants and retail environments.
              </p>
            </div>

            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 inline-block mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">4. 3D Design &amp; Visualization</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Help customers understand the proposed interior, layout and finishes before on-site execution begins.
              </p>
            </div>

            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 inline-block mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">5. One Point of Coordination</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Simplify the process by coordinating all interior and furniture requirements through a single responsible team.
              </p>
            </div>

            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 inline-block mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">6. Bengaluru-Based</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Royal Epic's published address and active workshop are located in Thanisandra, Bengaluru.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 16: FAQ (8 Accordions) */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950 border-t border-neutral-800" id="faq-section">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              Common Inquiries
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              Clear answers regarding our turnkey process, service domains and consultation steps.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqData.map((faq, idx) => {
              const isOpen = openFaqIndices.includes(idx);
              return (
                <div 
                  key={idx}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-neutral-800/40 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-serif font-semibold text-white">
                      {faq.question}
                    </span>
                    <span className="p-1 rounded-full bg-neutral-800 text-amber-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-neutral-300 leading-relaxed border-t border-neutral-800/60 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 17: FINAL CTA & ENQUIRY FORM */}
      {/* ============================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-neutral-900 to-neutral-950 border-t border-neutral-800" id="consultation-form">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Heading & Direct Contact */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/80 border border-amber-600/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Start Your Project
              </div>

              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                Planning an Interior Project in Bangalore?
              </h2>

              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                Tell us what you're planning — home, villa, office, PG, restaurant or commercial space — and our team can help you understand the next steps.
              </p>

              {/* Direct Quick Action CTAs */}
              <div className="space-y-3 pt-4">
                
                <a
                  href="https://wa.me/919916633338?text=Hello%20Royal%20Epic%2C%20I%20would%20like%20to%20consult%20on%20an%20interior%20project."
                  target="_blank"
                  rel="noopener noreferrer"
                  data-conversion="whatsapp"
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/50 hover:bg-emerald-900/50 text-emerald-300 font-semibold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                    <span>WhatsApp Us Directly</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="tel:+919916633338"
                  data-conversion="phone"
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-neutral-200 font-semibold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-amber-400" />
                    <span>Call +91 99166 33338</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </a>

              </div>

              {/* Official Office Info */}
              <div className="pt-4 border-t border-neutral-800/80 text-xs text-neutral-400 space-y-2">
                <p className="font-bold text-neutral-300">Office &amp; Workshop Address:</p>
                <p>No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru – 560077</p>
                <p>Email: <a href="mailto:enquiry@royalepicinterior.com" className="text-amber-400 hover:underline">enquiry@royalepicinterior.com</a></p>
              </div>

            </div>

            {/* Right: Lead Capture Form */}
            <div className="lg:col-span-7">
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
                
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white">Consultation Request Received</h3>
                    <p className="text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                      Thank you for contacting Royal Epic Interior &amp; Furniture. Our architectural consulting team will reach out to review your requirements.
                    </p>
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({
                            name: '',
                            phone: '',
                            email: '',
                            projectType: 'Home Interior',
                            projectLocation: '',
                            projectSize: '',
                            message: ''
                          });
                        }}
                        className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
                      >
                        Submit Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} data-conversion="lead-form" className="space-y-4">
                    
                    <div className="border-b border-neutral-800 pb-4 mb-4">
                      <h3 className="text-xl font-serif font-bold text-white mb-1">Get Free Consultation</h3>
                      <p className="text-xs text-neutral-400">
                        Fill in your project details to schedule a discussion or site assessment.
                      </p>
                    </div>

                    {submitError && (
                      <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs">
                        {submitError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Full Name <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Phone Number <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Email */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Email Address <span className="text-neutral-500 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="name@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      {/* Project Type */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Project Type
                        </label>
                        <select
                          value={formData.projectType}
                          onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        >
                          <option value="Home Interior">Home Interior</option>
                          <option value="Villa Interior">Villa Interior</option>
                          <option value="Office Interior">Office Interior</option>
                          <option value="PG / Co-Living">PG / Co-Living</option>
                          <option value="Restaurant / Café">Restaurant / Café</option>
                          <option value="Retail / Commercial">Retail / Commercial</option>
                          <option value="Custom Furniture">Custom Furniture</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Project Location */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Project Location in Bengaluru
                        </label>
                        <input
                          type="text"
                          value={formData.projectLocation}
                          onChange={(e) => setFormData(prev => ({ ...prev, projectLocation: e.target.value }))}
                          placeholder="e.g. HSR Layout, Thanisandra, Whitefield"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      {/* Approximate Project Size */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          Approx. Size <span className="text-neutral-500 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.projectSize}
                          onChange={(e) => setFormData(prev => ({ ...prev, projectSize: e.target.value }))}
                          placeholder="e.g. 2 BHK (1200 sq.ft) or 3500 sq.ft"
                          className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                    </div>

                    {/* Message / Requirements */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Message / Requirements <span className="text-neutral-500 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Tell us about your timeline, design preferences, or specific scopes..."
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm sm:text-base transition-all shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Consultation Request</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-neutral-500 text-center pt-2">
                      Your contact information is protected and used solely for consulting on your interior requirements.
                    </p>

                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* STICKY BOTTOM CTA FOR MOBILE (Google Ads Conversion Boost) */}
      {/* ============================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800 px-4 py-3 flex items-center gap-3 shadow-2xl">
        <a
          href="https://wa.me/919916633338?text=Hello%20Royal%20Epic%2C%20I%20would%20like%20to%20inquire%20about%20interior%20services."
          target="_blank"
          rel="noopener noreferrer"
          data-conversion="whatsapp"
          className="flex-1 py-3 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>
        <a
          href="tel:+919916633338"
          data-conversion="phone"
          className="flex-1 py-3 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
        >
          <Phone className="w-4 h-4" />
          <span>Call Now</span>
        </a>
      </div>

    </div>
  );
};
