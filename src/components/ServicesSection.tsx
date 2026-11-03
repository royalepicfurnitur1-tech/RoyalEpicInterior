import React, { useState, useRef } from 'react';
import { SERVICES_DATA } from '../data/mockData';
import {
  RESIDENTIAL_SUBCATEGORIES,
  COMMERCIAL_SUBCATEGORIES,
  RESTAURANT_SUBCATEGORIES,
  CategoryDefinition
} from '../utils/categoryResolver';
import { 
  Home, Building2, UtensilsCrossed, ChefHat, Flame, DoorClosed, 
  Check, ArrowRight, Sparkles, Layers,
  Compass, Award, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';

interface ServicesSectionProps {
  onRequestQuote: (serviceTitle: string) => void;
  onNavigateToCategory: (categorySlug: string) => void;
  showDirectory?: boolean;
}

const SECTION_DROPDOWN_MAP: Record<string, CategoryDefinition[]> = {
  'serv-1': RESIDENTIAL_SUBCATEGORIES,
  'serv-2': COMMERCIAL_SUBCATEGORIES,
  'serv-3': RESTAURANT_SUBCATEGORIES,
  'serv-4': [
    {
      id: 'kitch-1',
      name: 'Modular Kitchen Layouts',
      slug: 'modular-kitchen',
      matchProduct: () => true
    },
    {
      id: 'kitch-2',
      name: 'Kitchen & Breakfast Counters',
      slug: 'kitchen-service-counters',
      matchProduct: () => true
    }
  ],
  'serv-5': [
    {
      id: 'equip-1',
      name: 'Commercial Kitchen & Service Counters',
      slug: 'kitchen-service-counters',
      matchProduct: () => true
    }
  ],
  'serv-6': [
    {
      id: 'doors-1',
      name: 'Main Entrance Doors',
      slug: 'doors',
      matchProduct: () => true
    },
    {
      id: 'doors-2',
      name: 'WPC Waterproof Bathroom Doors',
      slug: 'bathroom',
      matchProduct: () => true
    }
  ]
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({ 
  onRequestQuote,
  onNavigateToCategory,
  showDirectory = false 
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollServices = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSubcategoryClick = (slug: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onNavigateToCategory(slug);
  };

  const iconMap: Record<string, React.ReactNode> = {
    Home: <Home className="w-5 h-5 text-amber-700" />,
    Building2: <Building2 className="w-5 h-5 text-amber-700" />,
    UtensilsCrossed: <UtensilsCrossed className="w-5 h-5 text-amber-700" />,
    ChefHat: <ChefHat className="w-5 h-5 text-amber-700" />,
    Flame: <Flame className="w-5 h-5 text-amber-700" />,
    DoorClosed: <DoorClosed className="w-5 h-5 text-amber-700" />,
  };

  const ALL_SERVICE_ITEMS = [
    { name: 'Residential Interior', category: 'residential', tag: '3D Layout Included', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=500&q=80' },
    { name: 'Commercial & Corporate Office', category: 'commercial', tag: 'Acoustic Soundproofing', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=500&q=80' },
    { name: 'Restaurant & Fine Dining', category: 'hospitality', tag: 'Ambiance Lighting', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80' },
    { name: 'Hotel & Boutique Suites', category: 'hospitality', tag: 'Turnkey Execution', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=500&q=80' },
    { name: 'Retail Showroom Interior', category: 'commercial', tag: 'Brand Displays', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=500&q=80' },
    { name: 'Luxury Modular Kitchen', category: 'kitchen', tag: 'German Hardware', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&q=80' },
    { name: 'Luxury & Sliding Wardrobes', category: 'residential', tag: 'Sensor LED Strips', image: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=500&q=80' },
    { name: 'TV Console & Entertainment Units', category: 'residential', tag: 'Fluted Louvers', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=500&q=80' },
    { name: 'Crockery Units & Bar Counters', category: 'residential', tag: 'Tinted Glass', image: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=500&q=80' },
    { name: 'Bedroom & Master Suite', category: 'residential', tag: 'Plush Headboards', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=500&q=80' },
    { name: 'Living Room Transformation', category: 'residential', tag: 'Italian Marble', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=80' },
    { name: 'Gypsum & Wooden False Ceiling', category: 'residential', tag: 'Cove Lighting', image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=500&q=80' },
    { name: 'Royal PU & Texture Painting', category: 'residential', tag: 'Metallic Finishes', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80' },
    { name: 'Electrical & Automation Services', category: 'services', tag: 'Smart Home Switches', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=500&q=80' },
    { name: 'Plumbing & Concealed Piping', category: 'services', tag: 'Kohler / Grohe Fittings', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80' },
    { name: 'ACP Cladding & Facade Design', category: 'architectural', tag: 'Weather Resistance', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=500&q=80' },
    { name: 'Frameless Glass Partitions', category: 'architectural', tag: 'Soundproof STC 42', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80' },
    { name: 'Aluminium Profile Partitions', category: 'architectural', tag: 'Anodized Gold', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=500&q=80' },
    { name: 'Exterior Glazing & Curtain Walls', category: 'architectural', tag: 'Structural Glass', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500&q=80' },
    { name: 'UPVC & WPC Soundproof Windows', category: 'architectural', tag: 'Thermal Insulation', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80' },
    { name: '100% Waterproof WPC Bathroom Doors', category: 'architectural', tag: 'Lifetime Guarantee', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80' },
    { name: 'Flush Doors & Solid Teak Frames', category: 'architectural', tag: 'High Density Core', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80' },
    { name: 'Solid Teak Main Entrance Doors', category: 'architectural', tag: 'Biometric Smart Lock', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80' },
    { name: 'Sofa Manufacturing & Upholstery', category: 'furniture', tag: 'High Density Foam', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=500&q=80' },
    { name: 'Restaurant Chairs & Booths', category: 'furniture', tag: 'Custom Velvet/Leather', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80' },
    { name: 'Hotel & Resort Furniture', category: 'furniture', tag: 'Teak & SS Frames', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&q=80' },
    { name: 'Commercial Kitchen Equipment Mfg', category: 'kitchen-equipment', tag: '304 SS Grade', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80' },
    { name: 'Cloud Kitchen Setup', category: 'kitchen-equipment', tag: 'High CFM Exhaust', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80' },
    { name: 'Restaurant Kitchen Setup', category: 'kitchen-equipment', tag: 'Heavy Gas Ranges', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80' },
    { name: 'Hotel & Banquet Kitchen Setup', category: 'kitchen-equipment', tag: 'Industrial Dishwashers', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80' },
    { name: 'Turnkey Interior Projects', category: 'turnkey', tag: 'Single Contact Ownership', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80' },
  ];

  const filteredServices = selectedFilter === 'all' 
    ? ALL_SERVICE_ITEMS 
    : ALL_SERVICE_ITEMS.filter(s => s.category === selectedFilter);

  return (
    <section className="py-20 sm:py-24 bg-[#A8A492] text-stone-900 relative overflow-hidden" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Architectural Trust Pillars Bar */}
        <div className="mb-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-start gap-4 hover:border-amber-400/60 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60">
              <Building2 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">Direct Factory Pricing</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                In-house manufacturing in Bangalore. Zero middlemen commissions.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-start gap-4 hover:border-amber-400/60 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60">
              <Compass className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">3D Photoreal Renders</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Walk through your space in VR before cutting a single board.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-start gap-4 hover:border-amber-400/60 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60">
              <Award className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">10-Year Warranty</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                German Hettich/Hafele hardware & 100% waterproof WPC core.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-start gap-4 hover:border-amber-400/60 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">45-Day Handover</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Guaranteed project completion with penalty-backed milestone tracking.
              </p>
            </div>
          </div>
        </div>
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 font-mono block mb-2">
              Comprehensive Manufacturing & Design
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
              Architectural & Interior Services
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-stone-600 max-w-sm hidden sm:block leading-relaxed">
              Click any interior division below to view subcategories and explore products directly on our Products page.
            </p>
            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => scrollServices('left')}
                className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-colors shadow-sm cursor-pointer"
                title="Scroll Left"
                aria-label="Scroll services left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollServices('right')}
                className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-colors shadow-sm cursor-pointer"
                title="Scroll Right"
                aria-label="Scroll services right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Major Service Category Cards with Clean Text-Based Dropdowns */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scroll-smooth no-scrollbar mb-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {SERVICES_DATA.map((service) => {
            const subcategories = SECTION_DROPDOWN_MAP[service.id] || [];

            return (
              <div
                key={service.id}
                className="min-w-[300px] sm:min-w-[360px] md:min-w-[380px] max-w-[380px] shrink-0 snap-start bg-white rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 group border border-stone-200/90 hover:border-amber-400/70 hover:shadow-lg"
              >
                <div>
                  {/* Image Banner Header */}
                  <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-stone-100">
                    <img
                      src={service.image}
                      alt={service.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                    
                    <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-white/95 backdrop-blur-md text-amber-700 shadow-sm border border-stone-200/60">
                      {iconMap[service.iconName] || <Sparkles className="w-5 h-5 text-amber-700" />}
                    </div>

                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-stone-900 bg-white/95 px-3 py-1 rounded-full font-mono shadow-sm">
                      ISO Certified
                    </span>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-serif font-bold text-white group-hover:text-amber-300 transition-colors drop-shadow-sm">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-xs text-stone-600 mb-4 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Clickable Subcategories List */}
                    {subcategories.length > 0 ? (
                      <div className="space-y-1.5 mb-2 bg-stone-50/90 p-3 rounded-2xl border border-stone-200/80">
                        <div className="flex items-center justify-between mb-1.5 px-1">
                          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-800 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-700" />
                            Subcategories ({subcategories.length}):
                          </span>
                          <span className="text-[10px] text-stone-400 font-medium">
                            Click to explore
                          </span>
                        </div>

                        <ul className="space-y-1 text-xs">
                          {subcategories.map((sub) => (
                            <li key={sub.id}>
                              <button
                                type="button"
                                onClick={(e) => handleSubcategoryClick(sub.slug, e)}
                                className="w-full text-left py-1.5 px-2.5 rounded-xl text-stone-700 hover:text-amber-800 hover:bg-white font-medium border border-transparent hover:border-amber-200 hover:shadow-xs transition-all flex items-center justify-between group/link cursor-pointer"
                              >
                                <span className="truncate">{sub.name}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover/link:text-amber-700 group-hover/link:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-1.5 mb-2 bg-stone-50/80 p-3 rounded-2xl border border-stone-100">
                        {service.subservices.slice(0, 3).map((sub, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-stone-700">
                            <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span className="truncate font-medium">{sub}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Bar */}
                <div className="px-6 pb-6 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => onRequestQuote(service.title)}
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 group/btn"
                  >
                    <span>Request Quote</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Directory Grid (Only shown if showDirectory is true) */}
        {showDirectory && (
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-10 shadow-sm mt-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-stone-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-700 font-mono block mb-1">
                  Specialized Directory
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-700" /> Complete Architectural & Interior Directory
                </h3>
                <p className="text-xs text-stone-500 mt-1">Browse turnkey manufacturing divisions and specialized fit-out modules</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/70">
                {[
                  { id: 'all', label: 'All Services' },
                  { id: 'residential', label: 'Residential' },
                  { id: 'commercial', label: 'Commercial' },
                  { id: 'hospitality', label: 'Hospitality' },
                  { id: 'kitchen', label: 'Kitchen & SS' },
                  { id: 'architectural', label: 'Doors & Windows' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedFilter === tab.id
                        ? 'bg-white text-stone-900 shadow-sm font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Directory Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/80 hover:border-amber-400/80 flex items-center gap-3.5 group transition-all hover:bg-white hover:shadow-md"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-stone-200 relative bg-stone-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <span className="text-xs font-bold text-stone-900 truncate group-hover:text-amber-800 transition-colors">
                      {item.name}
                    </span>

                    <div className="flex items-center justify-between gap-1.5 mt-2">
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-lg bg-white text-stone-600 border border-stone-200/80 truncate max-w-[130px]">
                        {item.tag}
                      </span>
                      <button
                        onClick={() => onRequestQuote(item.name)}
                        className="p-1.5 rounded-lg bg-stone-900 text-white hover:bg-amber-600 transition-colors cursor-pointer shrink-0 shadow-sm"
                        title="Request Quotation"
                        aria-label={`Request quotation for ${item.name}`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
