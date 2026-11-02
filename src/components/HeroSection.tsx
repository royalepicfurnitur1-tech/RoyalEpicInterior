import React, { useState } from 'react';
import { User, Phone, MapPin, ChevronDown, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { submitLeadToSupabase } from '../lib/supabase';

// =========================================================================
// HERO CONTENT CONFIGURATION
// All copy and initial settings are centralized here for easy future updates.
// =========================================================================
export const HERO_CONFIG = {
  // Clean luxury living-room photograph containing NO text, logos, buttons, or forms.
  // Easily replaceable anytime by updating this URL or passing customBackgroundImage.
  backgroundImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=85&w=2400&auto=format&fit=crop',
  fallbackImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=85&w=2400&auto=format&fit=crop',
  
  // Left side brand message
  eyebrow: 'PREMIUM INTERIORS & FURNITURE',
  headline: 'Designing Elegant Spaces for Modern Living',
  supportingText: 'Bespoke Furniture, Doors & Complete Interior Solutions for Homes and Businesses.',
  
  // Right side consultation card copy
  cardTitle: 'Get a Free Consultation',
  cardSubtitle: 'Share your details and our team will get in touch with you.',
  reassuranceText: 'Your details are safe with us.',
  
  // Cities available for selection
  cities: [
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Mumbai',
    'Pune',
    'Delhi NCR',
    'Kochi',
    'Coimbatore',
    'Mysuru'
  ]
};

interface HeroSectionProps {
  onRequestQuote?: (title: string) => void;
  onNavigateToCatalog?: () => void;
  customBackgroundImage?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onRequestQuote,
  customBackgroundImage
}) => {
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(HERO_CONFIG.cities[0]);
  
  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Background image state with clean photography and fallback
  const initialBg = customBackgroundImage || HERO_CONFIG.backgroundImage;
  const [bgSrc, setBgSrc] = useState(initialBg);

  React.useEffect(() => {
    if (customBackgroundImage) {
      setBgSrc(customBackgroundImage);
    }
  }, [customBackgroundImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    // Phone validation: Indian standard or international (min 10 digits)
    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitLeadToSupabase({
        full_name: trimmedName,
        phone: trimmedPhone,
        city: city || 'Bengaluru',
        service_type: 'Free Design Consultation',
        estimated_budget: 'To be discussed during callback',
        project_scope: `Homepage Hero Consultation Callback Request for ${city}`,
        source: 'Homepage Hero Consultation Card',
        status: 'new'
      });

      if (result && result.success !== false) {
        setIsSuccess(true);
      } else {
        // Even if network has hiccup, lead is preserved in localStorage via submitLeadToSupabase fallback
        setIsSuccess(true);
      }
    } catch (err: any) {
      console.warn('Consultation submission notice:', err);
      // Lead is still saved via fallback
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setPhone('');
    setCity(HERO_CONFIG.cities[0]);
    setIsSuccess(false);
    setErrorMessage(null);
  };

  return (
    <section 
      className="relative min-h-[640px] md:min-h-[720px] lg:min-h-[800px] w-full flex items-center justify-center overflow-hidden bg-neutral-950 text-white"
      aria-label="Royal Epic Interiors Hero"
    >
      {/* Background Image Container */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: `url('${bgSrc}')` }}
      >
        <img 
          src={bgSrc} 
          alt="Luxury living room interior" 
          className="hidden" 
          onError={() => {
            if (bgSrc !== HERO_CONFIG.fallbackImage) {
              setBgSrc(HERO_CONFIG.fallbackImage);
            }
          }}
        />
      </div>

      {/* Subtle Dark Overlays for optimal readability & contrast */}
      {/* 1. Base dark tint */}
      <div className="absolute inset-0 bg-black/40" />
      {/* 2. Left-weighted gradient to ensure typography is ultra crisp */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-neutral-950/40 lg:to-transparent" />
      {/* 3. Subtle bottom vignette connecting smoothly to the next section */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-neutral-950/40 pointer-events-none" />

      {/* Main Content Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: BRAND MESSAGE                                */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-start text-left">
            
            {/* Eyebrow with Champagne Gold Accent Line */}
            <div className="inline-flex items-center gap-3 mb-4 sm:mb-6">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-neutral-200">
                {HERO_CONFIG.eyebrow}
              </span>
              <span className="w-10 sm:w-14 h-[2px] bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
            </div>

            {/* Headline (Playfair Display serif italic) */}
            <h1 className="font-serif italic font-normal text-3xl sm:text-5xl lg:text-6xl xl:text-[68px] leading-[1.12] tracking-tight text-white mb-5 sm:mb-6 drop-shadow-sm max-w-2xl">
              {HERO_CONFIG.headline}
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg lg:text-xl text-neutral-200/95 font-sans font-normal leading-relaxed max-w-xl mb-8">
              {HERO_CONFIG.supportingText}
            </p>

            {/* Subtle Quick Trust Badges */}
            <div className="hidden sm:flex items-center gap-6 text-xs text-neutral-300 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Turnkey Architecture</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>In-House Factory Precision</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Pan-India Delivery</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: MINIMAL CONSULTATION CARD                   */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] bg-[#FAF9F5] text-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200/80 backdrop-blur-md transition-all">
              
              {!isSuccess ? (
                <>
                  {/* Card Header */}
                  <div className="mb-6">
                    <h2 className="font-serif font-bold text-2xl sm:text-[28px] text-neutral-950 tracking-tight leading-snug">
                      {HERO_CONFIG.cardTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 leading-relaxed">
                      {HERO_CONFIG.cardSubtitle}
                    </p>
                  </div>

                  {/* Consultation Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error Notice */}
                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Field 1: Name */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        disabled={isSubmitting}
                        required
                        className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600 transition-all shadow-xs"
                      />
                    </div>

                    {/* Field 2: Phone */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone Number"
                        disabled={isSubmitting}
                        required
                        className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600 transition-all shadow-xs"
                      />
                    </div>

                    {/* Field 3: City Dropdown */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <select
                        name="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-10 py-3 sm:py-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600 transition-all shadow-xs appearance-none cursor-pointer"
                      >
                        {HERO_CONFIG.cities.map((c) => (
                          <option key={c} value={c} className="text-neutral-900">
                            {c}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-neutral-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-[#C29645] to-[#9E732E] hover:from-[#B5893A] hover:to-[#8F6423] text-white font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer group"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Connecting with Architect...</span>
                        </>
                      ) : (
                        <>
                          <span>Get Callback</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>

                    {/* Reassurance Line */}
                    <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-neutral-500 font-sans">
                      <ShieldCheck className="w-4 h-4 text-neutral-400" />
                      <span>{HERO_CONFIG.reassuranceText}</span>
                    </div>
                  </form>
                </>
              ) : (
                /* Success Feedback State */
                <div className="text-center py-6 sm:py-8 animate-fadeIn">
                  <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-neutral-900 mb-2">
                    Callback Requested!
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
                    Thank you, <strong className="text-neutral-900">{name}</strong>. Our interior design team for <strong className="text-neutral-900">{city}</strong> will contact you shortly on <span className="font-mono text-neutral-900 font-semibold">{phone}</span>.
                  </p>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900 mb-6">
                    We look forward to transforming your space into something truly extraordinary.
                  </div>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 uppercase tracking-wider underline cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
