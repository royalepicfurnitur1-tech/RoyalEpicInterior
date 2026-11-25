import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface ArchitecturalCollectionsShowcaseProps {
  onNavigateToProducts: (categorySlug?: string) => void;
  onRequestQuote: (title: string) => void;
}

const FEATURED_COLLECTIONS = [
  {
    name: 'Modular Kitchens',
    slug: 'modular-kitchen',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    tag: 'German Soft-Close',
    subtitle: 'Island, L-shape & acrylic finishes'
  },
  {
    name: 'Living Room Luxury',
    slug: 'living-room',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    tag: 'Chesterfield & Velvet',
    subtitle: 'Custom sectionals, TV consoles & lounges'
  },
  {
    name: 'Main Entrance Doors',
    slug: 'doors',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    tag: 'Solid Teak & Brass',
    subtitle: 'Grand pivot & carved teakwood doors'
  },
  {
    name: 'Sliding Wardrobes',
    slug: 'bedroom',
    image: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=800&q=80',
    tag: 'Sensor LED Lighting',
    subtitle: 'Floor-to-ceiling walk-in modules'
  }
];

export const ArchitecturalCollectionsShowcase: React.FC<ArchitecturalCollectionsShowcaseProps> = ({
  onNavigateToProducts
}) => {
  return (
    <section className="pt-8 pb-11 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16 bg-[#A8A492] text-stone-900 relative overflow-hidden" id="shop">
      {/* Subtle Floating Architectural Geometric Accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 right-8 w-64 h-64 rounded-full border border-white/25 animate-arch-float"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 -left-14 w-44 h-44 border border-stone-900/10 rotate-12 animate-arch-float-reverse"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-7 pb-4 border-b border-stone-300/80"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-800 font-mono block mb-1.5">
              Explore by Space & Category
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
              Architectural Furniture & Material Collections
            </h2>
            <p className="text-sm text-stone-700 mt-1.5 leading-relaxed">
              Precision factory-crafted furniture, architectural door systems, and commercial equipment engineered for luxury residences and hotels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToProducts()}
              className="px-5 py-3 rounded-xl bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <span>View Full Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Concise Featured Collection Cards (Navigates directly to Products page filtered) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURED_COLLECTIONS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onNavigateToProducts(item.slug)}
              className="group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border border-stone-200/90 hover:border-amber-500 hover:shadow-xl hover:-translate-y-1.5 bg-white flex flex-col justify-between h-[280px]"
            >
              <div className="relative h-[190px] w-full overflow-hidden bg-stone-100">
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />
                <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold text-stone-900 uppercase tracking-wider font-mono shadow-sm">
                  {item.tag}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between gap-3 bg-white flex-1">
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-amber-800 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-stone-900 group-hover:text-white text-stone-600 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Turnkey Factory Direct Reassurance Strip */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 sm:mt-8 bg-white/90 backdrop-blur-sm border border-stone-200/90 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">
                85+ Factory-Direct Furniture & Material Catalogues
              </h4>
              <p className="text-xs text-stone-600">
                Explore sofas, dining tables, sliding wardrobes, TV consoles, WPC doors, and commercial equipment.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToProducts()}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            Explore Complete Inventory <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

      </div>
    </section>
  );
};
