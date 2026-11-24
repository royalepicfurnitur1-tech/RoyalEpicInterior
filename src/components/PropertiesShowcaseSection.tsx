import React, { useState, useEffect } from 'react';
import {
  Building2,
  Home,
  MapPin,
  ShieldCheck,
  ArrowRight,
  BedDouble,
  Maximize2,
  Armchair,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PublicPropertyListing } from '../crm/properties/propertyTypes';

interface PropertiesShowcaseSectionProps {
  onExploreProperties: () => void;
  onSelectProperty: (slug: string) => void;
}

export const PropertiesShowcaseSection: React.FC<PropertiesShowcaseSectionProps> = ({
  onExploreProperties,
  onSelectProperty,
}) => {
  const [featuredProperties, setFeaturedProperties] = useState<PublicPropertyListing[]>([]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/properties?sort=recent')
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data && data.success && Array.isArray(data.properties)) {
          setFeaturedProperties(data.properties.slice(0, 3));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      id="royal-epic-properties-showcase"
      className="py-16 md:py-20 bg-[#F9F6F0] border-t border-b border-stone-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-amber-600/30 bg-amber-500/10 text-amber-900 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              New Service Vertical • Bengaluru Rentals
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight mb-3">
              Royal Epic Properties –{' '}
              <span className="text-amber-800 italic font-normal">
                Find Your Next Space in Bengaluru
              </span>
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Discover identity-verified residential apartments, villas, offices, and retail spaces
              available for rent across Bengaluru—curated and managed with Royal Epic’s signature
              transparency and accompanied site visits.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onExploreProperties}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-amber-800 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <span>Explore Rental Properties</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Featured Properties Grid (if published listings exist) or Vertical Highlights */}
        {featuredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {featuredProperties.map((prop) => (
              <div
                key={prop.property_id}
                onClick={() => onSelectProperty(prop.slug)}
                className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all cursor-pointer flex flex-col"
              >
                <div className="relative h-52 bg-stone-100 overflow-hidden">
                  <img
                    src={prop.main_image}
                    alt={prop.property_title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-stone-900/85 text-white text-[11px] font-semibold">
                    {prop.property_category} • {prop.property_type}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold">
                    Verified
                  </span>
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-1 text-white text-xs font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{prop.locality}, Bengaluru</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-serif font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1 mb-2">
                      {prop.property_title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-stone-600 mb-3">
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-amber-700" />
                        {prop.bhk_type !== 'N/A' ? prop.bhk_type : prop.property_type}
                      </span>
                      {prop.built_up_area > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5 text-amber-700" />
                          {prop.built_up_area} {prop.area_unit || 'sq.ft'}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Armchair className="w-3.5 h-3.5 text-amber-700" />
                        {prop.furnishing_status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                        Monthly Rent
                      </span>
                      <span className="text-lg font-bold text-amber-800">
                        ₹{Number(prop.monthly_rent || 0).toLocaleString('en-IN')}
                        <span className="text-xs text-stone-500 font-normal">/mo</span>
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-stone-900 group-hover:text-amber-800">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-4">
                <Home className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-900 mb-1.5">
                Verified Residential Rentals
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Curated 1 BHK, 2 BHK, 3 BHK apartments, independent houses, and gated villas across
                prime Bengaluru neighbourhoods.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-900 mb-1.5">
                Commercial Offices &amp; Retail
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Ready-to-occupy office spaces, high-street showrooms, and retail spaces with optional
                turnkey interior fit-outs by Royal Epic.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-900 mb-1.5">
                100% Ownership &amp; Availability Checked
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Every property listed on Royal Epic Properties is verified by our team for owner
                identity, clear authorization, and live availability.
              </p>
            </div>
          </div>
        )}

        {/* Value Strip */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-200/70 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Zero Fake Listings
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Accompanied Site Visits
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Thanisandra • Hebbal • Whitefield • Indiranagar • HSR • Koramangala
            </span>
          </div>
          <button
            type="button"
            onClick={onExploreProperties}
            className="text-amber-800 font-semibold hover:underline"
          >
            Browse All Bengaluru Rental Properties →
          </button>
        </div>
      </div>
    </section>
  );
};

export default PropertiesShowcaseSection;
