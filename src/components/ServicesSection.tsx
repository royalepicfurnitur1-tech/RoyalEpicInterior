import React, { useState } from 'react';
import { SERVICES_DATA } from '../data/mockData';
import { ServiceCategory } from '../types';
import { 
  Home, Building2, UtensilsCrossed, ChefHat, Flame, DoorClosed, 
  Check, ArrowRight, ShieldCheck, Sparkles, Wrench, Layers
} from 'lucide-react';
import { motion } from 'motion/react';

interface ServicesSectionProps {
  onRequestQuote: (serviceTitle: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onRequestQuote }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeModalService, setActiveModalService] = useState<ServiceCategory | null>(null);

  const iconMap: Record<string, React.ReactNode> = {
    Home: <Home className="w-6 h-6 text-gold" />,
    Building2: <Building2 className="w-6 h-6 text-gold" />,
    UtensilsCrossed: <UtensilsCrossed className="w-6 h-6 text-gold" />,
    ChefHat: <ChefHat className="w-6 h-6 text-gold" />,
    Flame: <Flame className="w-6 h-6 text-gold" />,
    DoorClosed: <DoorClosed className="w-6 h-6 text-gold" />,
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
    <section className="py-20 bg-neutral-950 text-white relative overflow-hidden" id="services">
      {/* Background Accent Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-3">
            <Wrench className="w-3.5 h-3.5" /> Comprehensive Manufacturing & Design
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            Royal Architectural & Interior Services
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            From luxury residential villas to heavy industrial commercial kitchens, we deliver precision manufacturing, bespoke 3D interior design, and turnkey project execution.
          </p>
        </div>

        {/* Major Service Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {SERVICES_DATA.map((service) => (
            <motion.div
              key={service.id}
              whileHover={{ y: -8 }}
              className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-gold/50 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all group"
            >
              <div>
                {/* Image Banner Header */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                  
                  <div className="absolute top-3 left-3 p-2.5 rounded-xl bg-black/70 border border-gold/40 backdrop-blur-md text-gold shadow-lg">
                    {iconMap[service.iconName] || <Sparkles className="w-5 h-5 text-gold" />}
                  </div>

                  <span className="absolute top-3 right-3 text-[10px] uppercase font-bold text-black bg-gold/90 px-2.5 py-1 rounded-full font-mono shadow-md">
                    ISO Certified
                  </span>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold transition-colors drop-shadow-md">
                      {service.title}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-xs text-neutral-400 mb-4 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Subservice checklist */}
                  <div className="space-y-1.5 mb-2">
                    {service.subservices.slice(0, 4).map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span className="truncate">{sub}</span>
                      </div>
                    ))}
                    {service.subservices.length > 4 && (
                      <p className="text-[11px] text-gold font-medium pl-5">
                        +{service.subservices.length - 4} More Specialty Offerings
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => setActiveModalService(service)}
                  className="text-xs font-bold text-gold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Full Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRequestQuote(service.title)}
                  className="px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold text-gold hover:text-black border border-gold/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Quote
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filterable Service Directory Grid */}
        <div className="bg-neutral-900/60 border border-gold/20 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-gold" /> All Specialized Services Directory
              </h3>
              <p className="text-xs text-neutral-400">Filter through our 30+ specialty architectural and interior divisions</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedFilter === tab.id
                      ? 'bg-gold text-black shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Items Grid with Images in Every Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-2xl bg-black/50 border border-white/10 hover:border-gold/50 flex items-center gap-3 group transition-all hover:bg-black/70 hover:shadow-lg"
              >
                {/* Service Column Image Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gold/30 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>

                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <span className="text-xs font-bold text-neutral-100 truncate group-hover:text-gold transition-colors">
                    {item.name}
                  </span>

                  <div className="flex items-center justify-between gap-1 mt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gold border border-gold/20 truncate max-w-[120px]">
                      {item.tag}
                    </span>
                    <button
                      onClick={() => onRequestQuote(item.name)}
                      className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold hover:text-black transition-colors cursor-pointer shrink-0"
                      title="Request Quotation"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Service Modal Popup */}
      {activeModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-gold/40 rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-serif font-bold text-white">
                {activeModalService.title}
              </h3>
              <button
                onClick={() => setActiveModalService(null)}
                className="text-neutral-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <img
              src={activeModalService.image}
              alt={activeModalService.title}
              referrerPolicy="no-referrer"
              className="w-full h-56 object-cover rounded-xl mb-6 border border-white/10"
            />

            <p className="text-sm text-neutral-300 leading-relaxed mb-6">
              {activeModalService.description}
            </p>

            <h4 className="text-sm font-bold text-gold uppercase tracking-wider mb-3">
              Included Services & Standards:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
              {activeModalService.subservices.map((sub, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-neutral-200 bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                  <span>{sub}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setActiveModalService(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-neutral-300 text-xs font-bold uppercase hover:bg-white/20 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const title = activeModalService.title;
                  setActiveModalService(null);
                  onRequestQuote(title);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg"
              >
                Request Free Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
