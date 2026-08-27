import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Sparkles, Filter, ChevronRight, Eye, Phone, MessageSquare, 
  ArrowRight, ShieldCheck, Award, Wrench, CheckCircle2, Trees, Landmark
} from 'lucide-react';
import { TRADITIONAL_HOME_GALLERY_DATA, TRADITIONAL_HOME_CATEGORIES, TraditionalHomeGalleryItem } from '../data/traditionalHomeGalleryData';
import { GalleryLightbox } from '../components/GalleryLightbox';

interface ChettinadKeralaTraditionalHomesProps {
  onNavigate?: (path: string) => void;
  onRequestQuote?: (title: string) => void;
}

export const ChettinadKeralaTraditionalHomes: React.FC<ChettinadKeralaTraditionalHomesProps> = ({
  onNavigate,
  onRequestQuote
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // SEO Page Head & Meta Updating
  useEffect(() => {
    document.title = 'Kerala & Chettinad Traditional Homes | Royal Epic Interiors';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Explore Kerala style home construction, Chettinad house design, Indian traditional homes, South Indian architecture, heritage homes and traditional interior design ideas.'
    );

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://royalepicinterior.com/chettinad-kerala-traditional-homes');

    // Structured Data for ImageGallery and CollectionPage
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'traditional-homes-gallery-schema';
    jsonLdScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      name: 'Chettinad & Kerala Traditional Home Gallery | Royal Epic Interiors',
      description: 'Explore Kerala style home construction, Chettinad house design, Indian traditional homes, South Indian architecture, heritage homes and traditional interior design ideas.',
      url: 'https://royalepicinterior.com/chettinad-kerala-traditional-homes',
      provider: {
        '@type': 'Organization',
        name: 'Royal Epic Interior & Furniture',
        url: 'https://royalepicinterior.com',
        telephone: '+919916633338'
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://royalepicinterior.com/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Gallery',
            item: 'https://royalepicinterior.com/completed-projects'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Chettinad & Kerala Traditional Home Gallery',
            item: 'https://royalepicinterior.com/chettinad-kerala-traditional-homes'
          }
        ]
      }
    });

    const oldScript = document.getElementById('traditional-homes-gallery-schema');
    if (oldScript) oldScript.remove();
    document.head.appendChild(jsonLdScript);

    return () => {
      const s = document.getElementById('traditional-homes-gallery-schema');
      if (s) s.remove();
    };
  }, []);

  // Filter items based on selected category & search
  const filteredItems = useMemo(() => {
    return TRADITIONAL_HOME_GALLERY_DATA.filter((item) => {
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchQuery = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { All: TRADITIONAL_HOME_GALLERY_DATA.length };
    TRADITIONAL_HOME_GALLERY_DATA.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + 1;
    });
    return map;
  }, []);

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 pb-20">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-neutral-500 overflow-x-auto whitespace-nowrap">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate?.('/');
            }}
            className="hover:text-amber-600 transition-colors cursor-pointer font-medium"
          >
            Home
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <a
            href="/completed-projects"
            onClick={(e) => {
              e.preventDefault();
              onNavigate?.('/completed-projects');
            }}
            className="hover:text-amber-600 transition-colors cursor-pointer font-medium"
          >
            Gallery
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="text-neutral-900 font-bold">Chettinad & Kerala Traditional Home Gallery</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-amber-500/20">
        {/* Subtle Ambient Gold Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[750px] h-[360px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-semibold uppercase tracking-widest">
            <Landmark className="w-3.5 h-3.5" /> South Indian Heritage & Traditional Architecture
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-tight">
            Chettinad & Kerala Traditional Home Gallery
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-3xl mx-auto leading-relaxed font-sans">
            Discover timeless South Indian traditional homes, authentic Kerala Nalukettu house construction, Chettinad mansion architecture, intricate carved teakwood entrance doors, coffered wooden ceilings, open courtyards, and temple-inspired heritage interiors designed and crafted with master precision.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-300">
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Solid Seasoned Burma & CP Teakwood
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Athangudi Tile & Red Oxide Mastery
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              <Wrench className="w-3.5 h-3.5 text-amber-400" /> Turnkey Heritage Villa Construction
            </span>
          </div>
        </div>
      </section>

      {/* Filter & Gallery Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20">
        {/* Filter Navigation Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200/80 p-4 sm:p-6 mb-10">
          <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-neutral-100 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-mono">
                Explore Traditional Spaces & Elements
              </h2>
              <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                {filteredItems.length} Architectural Photos
              </span>
            </div>

            {/* Quick Search */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search Nalukettu, Chettinad, doors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-[#faf8f5]"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300">
            {TRADITIONAL_HOME_CATEGORIES.map((category) => {
              const count = categoryCounts[category] || 0;
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-md'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 border border-neutral-200/60'
                  }`}
                >
                  <span>{category}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200 p-8 space-y-4">
            <Landmark className="w-12 h-12 text-neutral-400 mx-auto" />
            <h3 className="text-lg font-serif font-bold text-neutral-800">No Traditional Home Designs Found</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              No gallery images match your active filter or search query. Try choosing another category or clearing your search.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-amber-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleOpenLightbox(index)}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl border border-neutral-200 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                  <img
                    src={item.image}
                    alt={item.alt}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />

                  {/* Gradient Hover Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="w-full flex items-center justify-between text-white">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> View Architecture
                      </span>
                      <span className="text-[10px] font-mono bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded">
                        Full Details
                      </span>
                    </div>
                  </div>

                  {/* Badges Top Left & Right */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-amber-300 px-2 py-1 rounded-md border border-amber-400/30">
                      {item.category}
                    </span>
                    {item.isAiGenerated && (
                      <span className="text-[9px] font-bold bg-amber-950/80 backdrop-blur-md text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Concept
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-serif font-bold text-neutral-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span>Heritage Craftsmanship</span>
                    <span className="text-amber-600 font-bold group-hover:underline">Explore →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Turnkey Traditional Construction & Woodwork Capabilities Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-3xl p-8 sm:p-12 border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 block">
                Bespoke Heritage Villa Construction & Restorations
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white leading-tight">
                Planning to Build a Kerala Nalukettu or Chettinad Heritage Home?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                Royal Epic Interiors specializes in complete turnkey Indian traditional home construction: structural teak pillar fabrication, authentic Mangalore clay tile roof framing, hand-poured Athangudi tile flooring, red oxide polishing, carved pooja mandapams, and heritage courtyard engineering.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <button
                onClick={() => onRequestQuote?.('Chettinad & Kerala Heritage Villa Consultation')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Request Heritage Quote
              </button>

              <a
                href="tel:+919916633338"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-amber-400" /> Call +91 99166 33338
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          isOpen={lightboxIndex !== null}
          items={filteredItems}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onNavigate={(newIndex) => setLightboxIndex(newIndex)}
          onRequestQuote={onRequestQuote}
        />
      )}
    </div>
  );
};
