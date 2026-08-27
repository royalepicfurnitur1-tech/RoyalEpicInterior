import React, { useState } from 'react';
import { 
  Crown, Phone, MessageCircle, ArrowRight, CheckCircle2, 
  Layers, Ruler, Palette, Home, Shield, Compass, Hammer,
  Check, ChevronRight, Eye, Building
} from 'lucide-react';
import { GalleryLightbox } from '../components/GalleryLightbox';
import { getHeritageHomes, HeritageHomeItem } from '../services/heritageHomeService';

interface HeritageHomesProps {
  onNavigate?: (path: string) => void;
  onRequestQuote?: (serviceTitle: string) => void;
}


export const HeritageHomes: React.FC<HeritageHomesProps> = ({ onNavigate, onRequestQuote }) => {
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState<number | null>(null);
  const [sectionsData, setSectionsData] = React.useState<HeritageHomeItem[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      const data = await getHeritageHomes();
      // Filter only published ones for public view
      setSectionsData(data.filter(item => item.published !== false).sort((a, b) => a.sectionNumber - b.sectionNumber));
    };
    loadData();
  }, []);

  const HERITAGE_SERVICES = [
    {
      title: 'Heritage Home Design',
      desc: 'Complete architectural design for grand heritage houses, combining historic South Indian vernacular principles with contemporary structural engineering.',
      icon: <Home className="w-6 h-6 text-amber-600" />,
      features: ['Custom elevation styling', 'Vernacular facade details', 'Historic proportion studies']
    },
    {
      title: 'Traditional Home Design',
      desc: 'Bespoke traditional residential architecture tailored for modern families, featuring sloped roofs, open verandas, and natural ventilation.',
      icon: <Building className="w-6 h-6 text-amber-600" />,
      features: ['Modern-traditional floorplans', 'Cross-ventilation engineering', 'Eco-friendly materials']
    },
    {
      title: 'Architectural Planning',
      desc: 'Comprehensive master site layouts, 100% Vastu Vidya & Thachushasthra compliance, sun-path analysis, and natural climate-responsive planning.',
      icon: <Compass className="w-6 h-6 text-amber-600" />,
      features: ['Vastu Vidya alignment', 'Sun-path optimization', 'Zoning & circulation flow']
    },
    {
      title: 'Interior Design',
      desc: 'Curated traditional interior fitouts encompassing bespoke teakwood furniture, Athangudi tile palettes, brass fixtures, and heritage lighting schemes.',
      icon: <Palette className="w-6 h-6 text-amber-600" />,
      features: ['Curated material selections', 'Atmospheric lighting design', 'Heirloom styling']
    },
    {
      title: '2D/3D Design & Walkthroughs',
      desc: 'Ultra-realistic 3D exterior elevations, 360-degree virtual interior walkthroughs, and precise 2D architectural construction working drawings.',
      icon: <Eye className="w-6 h-6 text-amber-600" />,
      features: ['Photorealistic 3D renders', 'Virtual 360 walkthroughs', 'Structural 2D CAD drawings']
    },
    {
      title: 'Renovation & Restoration',
      desc: 'Expert restoration and modernization of ancestral homes, heritage mansions, deteriorating wooden rafters, and antique tile flooring.',
      icon: <Hammer className="w-6 h-6 text-amber-600" />,
      features: ['Structural timber reinforcement', 'Egg-white plaster restoration', 'Authentic material matching']
    },
    {
      title: 'Courtyard Planning',
      desc: 'Precision engineering for central open-to-sky Nadumuttam and Aangan courtyards with integrated rainwater harvesting and passive cooling.',
      icon: <Layers className="w-6 h-6 text-amber-600" />,
      features: ['Rainwater drainage channels', 'Microclimate temperature drop', 'Tulsi Thara placement']
    },
    {
      title: 'Traditional Pooja Rooms',
      desc: 'Sanctified temple-inspired pooja mandapam design with hand-carved solid Burma/CP teakwood, Gopuram finials, brass bells, and Vastu zoning.',
      icon: <Crown className="w-6 h-6 text-amber-600" />,
      features: ['Hand-carved Gopuram tops', 'Acoustic brass bells', 'Backlit onyx sanctums']
    },
    {
      title: 'Wooden Architecture & Pillars',
      desc: 'In-house manufacturing of solid teak turned pillars, carved lotus brackets, timber ceilings, traditional wooden doors, and Charupadi benches.',
      icon: <Ruler className="w-6 h-6 text-amber-600" />,
      features: ['Burma & CP Teakwood', 'Master artisan carvings', 'Lifetime termite protection']
    },
    {
      title: 'Turnkey Execution',
      desc: 'End-to-end single-point construction and interior execution from ground excavation to final brass polish with guaranteed on-time delivery.',
      icon: <Shield className="w-6 h-6 text-amber-600" />,
      features: ['Single-contract ownership', 'Strict milestone timeline', '10-year structural warranty']
    }
  ];

  const lightboxItems = sectionsData.map(item => ({
    id: item.id,
    image: item.image,
    title: item.title,
    category: item.subtitle,
    description: `${item.designStyle} — ${item.architecturalFeatures}`,
    alt: item.alt,
    tags: item.keyElements
  }));

  const handleConsultation = (title: string) => {
    if (onRequestQuote) {
      onRequestQuote(`Heritage Home Design: ${title}`);
    } else if (onNavigate) {
      onNavigate('/get-free-quote');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-[#fcfbf7] text-neutral-900 min-h-screen selection:bg-amber-500 selection:text-black">
      
      {/* Schema.org Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Heritage Homes & Traditional House Design",
            "provider": {
              "@type": "Organization",
              "name": "Royal Epic Interiors",
              "url": "https://royalepicinterior.com"
            },
            "serviceType": "Traditional House Design and Heritage Home Construction",
            "description": "Explore heritage homes, traditional house design, Kerala style, Chettinad, Nalukettu, courtyard homes and traditional interiors by Royal Epic Interiors.",
            "areaServed": ["Bengaluru", "Karnataka", "Kerala", "Tamil Nadu", "South India"],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Heritage & Traditional Architectural Services",
              "itemListElement": HERITAGE_SERVICES.map((s, idx) => ({
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": s.title,
                  "description": s.desc
                },
                "position": idx + 1
              }))
            }
          })
        }}
      />

      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 bg-gradient-to-b from-[#1b1510] via-[#241a12] to-[#120d09] text-white overflow-hidden">
        {/* Background decorative textures */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-6 font-medium">
            <a 
              href="/" 
              onClick={(e) => { e.preventDefault(); onNavigate?.('/'); }}
              className="hover:text-amber-400 transition-colors"
            >
              Home
            </a>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <a 
              href="/our-services" 
              onClick={(e) => { e.preventDefault(); onNavigate?.('/our-services'); }}
              className="hover:text-amber-400 transition-colors"
            >
              Services
            </a>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <span className="text-amber-400 font-semibold">Heritage Homes</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Premier South Indian Architectural Studio</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.15]">
                Heritage Homes & <br />
                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Traditional House Design
                </span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-300 max-w-2xl font-light leading-relaxed">
                Experience the soulful majesty of authentic Indian vernacular architecture. From Kerala Nalukettu courtyard residences and Chettinad palatial mansions to hand-carved teakwood pillars and artisanal Athangudi tile floors, Royal Epic Interiors designs and builds luxury traditional homes with timeless craftsmanship and modern living comforts.
              </p>

              {/* Key Metric Badges */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/10 max-w-lg">
                <div>
                  <p className="text-2xl font-bold text-amber-400 font-serif">100%</p>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Vastu Vidya Aligned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400 font-serif">Solid Teak</p>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider">In-House Woodcraft</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400 font-serif">Turnkey</p>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Foundation to Finish</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => handleConsultation('Heritage Home General Inquiry')}
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-neutral-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span>Book Heritage Consultation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="https://wa.me/919900000000?text=Hi%20Royal%20Epic%20Interiors,%20I%20am%20interested%20in%20Heritage%20Homes%20and%20Traditional%20House%20Design"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/15 font-medium text-sm transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Architect</span>
                </a>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 group">
                <img
                  src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
                  alt="Kerala traditional Nalukettu heritage home with central courtyard and teak pillars"
                  className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                      Masterpiece Heritage Project
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                      Turnkey Villa
                    </span>
                  </div>
                  <p className="text-sm font-serif font-bold text-white">
                    Kerala Nalukettu Courtyard Villa with Burma Teakwood Architecture
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Jump Ribbon */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="p-3 rounded-2xl bg-neutral-900/90 backdrop-blur-md border border-white/10 overflow-x-auto scrollbar-none flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 whitespace-nowrap px-3">
              Explore Styles:
            </span>
            {[
              { label: 'All 14 Architectural Styles', target: 'heritage-homes' },
              { label: 'Kerala Nalukettu', target: 'nalukettu-homes' },
              { label: 'Chettinad Mansions', target: 'chettinad-style-homes' },
              { label: 'Central Courtyards', target: 'traditional-courtyard-homes' },
              { label: 'Wooden Architecture', target: 'wooden-pillars-wooden-architecture' },
              { label: 'Clay Tile Roofs', target: 'clay-tile-roof-homes' },
              { label: 'Athangudi Tiles', target: 'athangudi-tile-interiors' },
              { label: 'Pooja Sanctums', target: 'traditional-hindu-interiors-pooja-rooms' },
              { label: 'Our Services', target: 'our-heritage-services' }
            ].map((jump, idx) => (
              <button
                key={idx}
                onClick={() => scrollToSection(jump.target)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-xs font-medium text-neutral-300 whitespace-nowrap transition-colors cursor-pointer border border-transparent hover:border-amber-500/30"
              >
                {jump.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ARCHITECTURAL SECTIONS 2 to 15 */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3.5 py-1.5 rounded-full border border-amber-200">
            Architectural Heritage Portfolio
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-neutral-900">
            Authentic South Indian & Vernacular Styles
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            Every heritage style we craft is deeply researched and engineered to balance timeless South Indian architectural traditions with contemporary structural durability and modern luxury.
          </p>
        </div>

        {/* The 14 Architectural Showcases */}
        <div className="space-y-24">
          {sectionsData.map((item, index) => {
            const isEven = index % 2 === 0;
            return (
              <article
                key={item.id}
                id={item.id}
                className="scroll-mt-28 group rounded-3xl bg-white border border-neutral-200/80 shadow-xl overflow-hidden hover:border-amber-400/50 transition-all duration-300"
              >
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}>
                  
                  {/* Left/Right: High-Resolution Realistic Image */}
                  <div className={`lg:col-span-6 ${isEven ? 'lg:order-1' : 'lg:order-2'} relative overflow-hidden bg-neutral-100`}>
                    <div 
                      className="relative h-[360px] sm:h-[440px] lg:h-[500px] overflow-hidden cursor-pointer"
                      onClick={() => setSelectedLightboxIndex(index)}
                    >
                      <img
                        src={item.image}
                        alt={item.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Zoom Badge */}
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 border border-white/20">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Click to Enlarge</span>
                      </div>

                      {/* Section Index Marker */}
                      <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-mono font-bold text-xs shadow-md">
                        Style {String(item.sectionNumber).padStart(2, '0')} / 14
                      </div>
                    </div>
                  </div>

                  {/* Right/Left: Structured Content & Description */}
                  <div className={`lg:col-span-6 p-6 sm:p-8 lg:p-10 ${isEven ? 'lg:order-2' : 'lg:order-1'} space-y-6`}>
                    
                    {/* Header */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 font-mono block mb-1">
                        {item.subtitle}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
                        {item.title}
                      </h3>
                    </div>

                    {/* Structured Specifications Required */}
                    <div className="space-y-4 text-sm text-neutral-700">
                      
                      {/* Design Style */}
                      <div className="p-3.5 rounded-xl bg-[#fbf9f4] border border-amber-200/60">
                        <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wider text-amber-800 mb-0.5">
                          ✦ Design Style
                        </span>
                        <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                          {item.designStyle}
                        </p>
                      </div>

                      {/* Main Architectural Features */}
                      <div>
                        <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                          Architectural Features
                        </span>
                        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                          {item.architecturalFeatures}
                        </p>
                      </div>

                      {/* Interior Character */}
                      <div>
                        <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                          Interior Character & Ambiance
                        </span>
                        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                          {item.interiorCharacter}
                        </p>
                      </div>

                      {/* Suitable For */}
                      <div className="pt-2 border-t border-neutral-200">
                        <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wider text-amber-900 mb-1">
                          Ideal For / Suitable Customers
                        </span>
                        <p className="text-xs sm:text-sm text-neutral-700 font-medium leading-relaxed">
                          {item.suitableFor}
                        </p>
                      </div>
                    </div>

                    {/* Architectural Feature Tags */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {item.keyElements.map((el, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 font-medium border border-neutral-200"
                        >
                          {el}
                        </span>
                      ))}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={() => handleConsultation(item.title)}
                        className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer"
                      >
                        <span>Plan This Style</span>
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      </button>

                      <button
                        onClick={() => setSelectedLightboxIndex(index)}
                        className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-medium text-xs transition-colors cursor-pointer"
                      >
                        View High-Res Photo
                      </button>
                    </div>

                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 16. OUR HERITAGE HOME SERVICES SECTION */}
      <section id="our-heritage-services" className="py-20 lg:py-28 bg-[#1a140e] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/15 px-3.5 py-1.5 rounded-full border border-amber-500/30">
              End-to-End Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
              Our Heritage Home Services
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 font-light">
              From master Vastu architectural planning and photorealistic 3D renders to solid teakwood factory fabrication and complete turnkey site execution, Royal Epic Interiors provides single-point craftsmanship.
            </p>
          </div>

          {/* 10 Required Heritage Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {HERITAGE_SERVICES.map((srv, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-amber-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {srv.icon}
                  </div>

                  <div>
                    <h3 className="text-lg font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed font-light">
                      {srv.desc}
                    </p>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-white/10 text-[11px] text-neutral-400">
                    {srv.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 mt-4 border-t border-white/5">
                  <button
                    onClick={() => handleConsultation(srv.title)}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 group/btn cursor-pointer"
                  >
                    <span>Request Quotation</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Guarantee Banner */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border border-amber-500/30 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-3 space-y-2">
              <h4 className="text-lg sm:text-xl font-serif font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                The Royal Epic Heritage Craftsmanship Guarantee
              </h4>
              <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                All our traditional woodwork is crafted using genuine, seasoned Burma or CP Teakwood with anti-termite treatment and 10-year warranty. Turnkey projects include dedicated project managers and milestone-based progress tracking.
              </p>
            </div>
            <div className="flex md:justify-end">
              <button
                onClick={() => handleConsultation('Heritage Turnkey Guarantee')}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                Inquire Turnkey Rates
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 17. CONTACT & ENQUIRY CTA SECTION */}
      <section className="py-20 lg:py-28 bg-[#f5f1e8] border-t border-neutral-300/60 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-4 h-4 text-amber-700" />
            <span>Ready to Build Your Dream Heritage Home?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-neutral-900 tracking-tight">
            Consult with Our Principal Heritage Architects
          </h2>

          <p className="text-base text-neutral-700 max-w-2xl mx-auto font-light leading-relaxed">
            Whether you are planning a new Kerala style Nalukettu villa, a Chettinad heritage mansion, or seeking to restore an ancestral home, our team provides complete architectural blueprints, 3D walkthroughs, and turnkey construction.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleConsultation('Main Heritage Consultation Form')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-neutral-950 font-bold text-sm tracking-wider uppercase shadow-xl hover:shadow-amber-500/25 hover:brightness-110 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Get Free Heritage Estimation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="tel:+919900000000"
              className="px-7 py-4 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-900 font-bold text-sm tracking-wide transition-all shadow-sm flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-amber-700" />
              <span>Call +91 99000 00000</span>
            </a>

            <a
              href="https://wa.me/919900000000?text=Hi%20Royal%20Epic%20Interiors,%20I%20would%20like%20a%20Heritage%20Home%20Design%20quote"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm tracking-wide transition-all shadow-sm flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          <div className="pt-8 border-t border-neutral-300/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-600">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
              <span>Complimentary Site Visit in South India</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
              <span>Transparent Itemized BOQ Estimates</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
              <span>100% On-Time Project Handover</span>
            </div>
          </div>

        </div>
      </section>

      {/* Lightbox for High-Res Image Inspection */}
      {selectedLightboxIndex !== null && (
        <GalleryLightbox
          isOpen={selectedLightboxIndex !== null}
          items={lightboxItems}
          currentIndex={selectedLightboxIndex}
          onClose={() => setSelectedLightboxIndex(null)}
          onNavigate={(index) => setSelectedLightboxIndex(index)}
          onRequestQuote={(title) => handleConsultation(title)}
        />
      )}

    </div>
  );
};
