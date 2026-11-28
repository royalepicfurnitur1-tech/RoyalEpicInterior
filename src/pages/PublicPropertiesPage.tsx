import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Home,
  Building2,
  BedDouble,
  Bath,
  Maximize2,
  Armchair,
  Car,
  SlidersHorizontal,
  RotateCcw,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Phone,
  MessageCircle,
  Filter,
  ChevronRight,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { PublicPropertyListing } from '../crm/properties/propertyTypes';

const luxuryLivingRoomHero = new URL(
  '../assets/images/luxury_living_room_hero_1795585853260.jpg',
  import.meta.url
).href;

interface PublicPropertiesPageProps {
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

export const PublicPropertiesPage: React.FC<PublicPropertiesPageProps> = ({
  onSelectProperty,
  onNavigateHome,
}) => {
  const initialHydrated: PublicPropertyListing[] = useMemo(() => {
    if (typeof window !== 'undefined' && Array.isArray((window as any).__INITIAL_PROPERTIES__)) {
      return (window as any).__INITIAL_PROPERTIES__;
    }
    return [];
  }, []);

  const [allProperties, setAllProperties] = useState<PublicPropertyListing[]>(initialHydrated);
  const [loading, setLoading] = useState<boolean>(initialHydrated.length === 0);
  const [error, setError] = useState<string>('');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocality, setSelectedLocality] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('All');
  const [selectedBhk, setSelectedBhk] = useState<string>('All');
  const [minRent, setMinRent] = useState<string>('');
  const [maxRent, setMaxRent] = useState<string>('');
  const [selectedFurnishing, setSelectedFurnishing] = useState<string>('All');
  const [selectedParking, setSelectedParking] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'rent_asc' | 'rent_desc'>('recent');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Sync SEO Title, Meta Description, Self-Canonical, OG & Twitter tags
  useEffect(() => {
    const origin = resolveHostOrigin();
    const canonicalUrl = `${origin}/properties`;
    const pageTitle = 'Rental Properties in Bangalore & Bengaluru | Royal Epic';
    const pageDesc =
      'Explore verified 1BHK, 2BHK & 3BHK flats, houses, villas and commercial spaces for rent in Bengaluru. Get assistance with property site visits.';
    const ogImage = `${origin}/images/royal-epic-properties-og.jpg`;

    document.title = pageTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageDesc);

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1');

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

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
    setOg('og:description', pageDesc);
    setOg('og:url', canonicalUrl);
    setOg('og:type', 'website');
    setOg('og:image', ogImage);

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
    setTwitter('twitter:description', pageDesc);
    setTwitter('twitter:url', canonicalUrl);
    setTwitter('twitter:image', ogImage);
  }, []);

  const fetchPublishedProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.properties)) {
        setAllProperties(data.properties);
      } else {
        setAllProperties([]);
      }
    } catch (err: any) {
      setError('Unable to load properties right now. Please refresh or contact Royal Epic Properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishedProperties();
  }, []);

  // Compute dynamic filter options from available published properties + standard Bengaluru options
  const localityOptions = useMemo(() => {
    const dynamic = Array.from(new Set(allProperties.map((p) => p.locality).filter(Boolean)));
    const defaults = [
      'Thanisandra',
      'Hebbal',
      'Whitefield',
      'Indiranagar',
      'Koramangala',
      'HSR Layout',
      'Yelahanka',
      'Sarjapur Road',
      'JP Nagar',
      'Marathahalli',
      'Bellandur',
      'Manyata Tech Park',
    ];
    return Array.from(new Set([...dynamic, ...defaults])).sort();
  }, [allProperties]);

  const propertyTypeOptions = useMemo(() => {
    const dynamic = Array.from(new Set(allProperties.map((p) => p.property_type).filter(Boolean)));
    const defaults = [
      'Apartment / Flat',
      'Independent House / Villa',
      'Builder Floor',
      'Penthouse / Studio',
      'Office Space',
      'Retail Shop / Showroom',
      'Commercial Building',
    ];
    return Array.from(new Set([...dynamic, ...defaults]));
  }, [allProperties]);

  const bhkOptions = ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK', 'Commercial / Open'];
  const furnishingOptions = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished', 'Bare Shell', 'Warm Shell'];

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedLocality('All');
    setSelectedCategory('All');
    setSelectedPropertyType('All');
    setSelectedBhk('All');
    setMinRent('');
    setMaxRent('');
    setSelectedFurnishing('All');
    setSelectedParking('All');
    setSelectedAvailability('All');
    setSortBy('recent');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedLocality !== 'All' ||
    selectedCategory !== 'All' ||
    selectedPropertyType !== 'All' ||
    selectedBhk !== 'All' ||
    minRent.trim() !== '' ||
    maxRent.trim() !== '' ||
    selectedFurnishing !== 'All' ||
    selectedParking !== 'All' ||
    selectedAvailability !== 'All';

  const filteredProperties = useMemo(() => {
    let list = [...allProperties];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.property_title.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.property_type.toLowerCase().includes(q) ||
          p.bhk_type.toLowerCase().includes(q) ||
          p.property_id.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (selectedLocality !== 'All') {
      const loc = selectedLocality.toLowerCase();
      list = list.filter((p) => p.locality.toLowerCase().includes(loc));
    }

    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.property_category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedPropertyType !== 'All') {
      list = list.filter((p) => p.property_type.toLowerCase() === selectedPropertyType.toLowerCase());
    }

    if (selectedBhk !== 'All') {
      list = list.filter((p) => p.bhk_type.toLowerCase() === selectedBhk.toLowerCase());
    }

    if (minRent.trim() !== '') {
      const minVal = Number(minRent);
      if (Number.isFinite(minVal) && minVal >= 0) {
        list = list.filter((p) => p.monthly_rent >= minVal);
      }
    }

    if (maxRent.trim() !== '') {
      const maxVal = Number(maxRent);
      if (Number.isFinite(maxVal) && maxVal > 0) {
        list = list.filter((p) => p.monthly_rent <= maxVal);
      }
    }

    if (selectedFurnishing !== 'All') {
      const normSelected = selectedFurnishing.toLowerCase().replace(/[-\s]+/g, ' ');
      list = list.filter(
        (p) => (p.furnishing_status || '').toLowerCase().replace(/[-\s]+/g, ' ') === normSelected
      );
    }

    if (selectedParking !== 'All') {
      if (selectedParking === 'Available') {
        list = list.filter(
          (p) => p.parking_availability && p.parking_availability.toLowerCase() !== 'none'
        );
      } else {
        list = list.filter((p) =>
          p.parking_availability.toLowerCase().includes(selectedParking.toLowerCase())
        );
      }
    }

    if (selectedAvailability !== 'All') {
      if (selectedAvailability === 'Immediate') {
        const todayIso = new Date().toISOString().split('T')[0];
        list = list.filter((p) => !p.available_from || p.available_from <= todayIso);
      } else if (selectedAvailability === 'Verified Available') {
        list = list.filter((p) => p.availability_status === 'Published');
      }
    }

    if (sortBy === 'rent_asc') {
      list.sort((a, b) => a.monthly_rent - b.monthly_rent);
    } else if (sortBy === 'rent_desc') {
      list.sort((a, b) => b.monthly_rent - a.monthly_rent);
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [
    allProperties,
    searchQuery,
    selectedLocality,
    selectedCategory,
    selectedPropertyType,
    selectedBhk,
    minRent,
    maxRent,
    selectedFurnishing,
    selectedParking,
    selectedAvailability,
    sortBy,
  ]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <a
              href="/"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (onNavigateHome) {
                  e.preventDefault();
                  onNavigateHome();
                }
              }}
              className="hover:text-amber-700 transition-colors font-medium"
            >
              Home
            </a>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-900 font-semibold">Royal Epic Properties</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              100% Verified Rental Listings
            </span>
            <span>•</span>
            <a
              href="tel:+917026119311"
              className="text-amber-800 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <Phone className="w-3 h-3" /> +91 70261 19311
            </a>
          </div>
        </div>
      </div>

      {/* Hero Section – Elegant Residential Interior (Option 2) */}
      <section className="relative bg-gradient-to-b from-[#F7F4EE] via-[#FAF8F5] to-[#FAF8F5] border-b border-[#E8E2D5] overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.10),transparent_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 md:pt-14 md:pb-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Side (~45% width on desktop: 5 of 12 cols) */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 text-[#9A7835] text-xs font-semibold uppercase tracking-[0.22em] mb-3.5">
                <span className="w-6 h-[1px] bg-[#C5A059]" />
                <span>RENTAL PROPERTIES IN BENGALURU</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-bold tracking-tight text-[#1A1D24] leading-[1.14] mb-4">
                Verified Rental Properties
                <span className="block text-[#B8924A] mt-1">in Bengaluru</span>
              </h1>

              <p className="text-stone-600 text-base sm:text-[17px] leading-relaxed mb-7">
                Explore verified 1BHK, 2BHK and 3BHK flats, independent houses, villas, offices and
                commercial spaces for rent across Bengaluru. Enjoy transparent rental details and
                accompanied site visits with the Royal Epic Properties advisory desk.
              </p>

              {/* Three Simple Trust Indicators with Clean Line Icons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3 pt-5 border-t border-[#E6DFD1]">
                <div className="flex items-center gap-2.5 text-xs sm:text-[13px] font-medium text-[#2A2D34]">
                  <div className="w-8 h-8 rounded-lg bg-[#F2ECE1] border border-[#E2D7C3] flex items-center justify-center shrink-0 text-[#9A7835]">
                    <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <span>Verified Properties</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs sm:text-[13px] font-medium text-[#2A2D34]">
                  <div className="w-8 h-8 rounded-lg bg-[#F2ECE1] border border-[#E2D7C3] flex items-center justify-center shrink-0 text-[#9A7835]">
                    <Compass className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <span>Assisted Site Visits</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs sm:text-[13px] font-medium text-[#2A2D34]">
                  <div className="w-8 h-8 rounded-lg bg-[#F2ECE1] border border-[#E2D7C3] flex items-center justify-center shrink-0 text-[#9A7835]">
                    <FileCheck2 className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <span>Transparent Process</span>
                </div>
              </div>
            </div>

            {/* Right Side (~55% width on desktop: 7 of 12 cols) */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl overflow-hidden bg-[#EAE3D5] border border-[#E2D9C8] shadow-[0_20px_50px_rgba(26,29,36,0.08)] aspect-[16/10]">
                <img
                  src={luxuryLivingRoomHero}
                  alt="Spacious contemporary luxury residential living room in Bengaluru by Royal Epic Properties"
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Search Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-[0_12px_36px_rgba(26,29,36,0.06)] border border-[#E6E0D4] p-5 sm:p-6">
          {/* Primary Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5 items-end">
            {/* Location */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                Location
              </label>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-stone-200/90 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-[#B8924A] focus:bg-white transition-colors"
              >
                <option value="All">All Bengaluru Localities</option>
                {localityOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Category */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                Property Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-stone-200/90 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-[#B8924A] focus:bg-white transition-colors"
              >
                <option value="All">All Categories</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                Property Type
              </label>
              <select
                value={selectedPropertyType}
                onChange={(e) => setSelectedPropertyType(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-stone-200/90 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-[#B8924A] focus:bg-white transition-colors"
              >
                <option value="All">All Property Types</option>
                {propertyTypeOptions.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>

            {/* BHK Configuration */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                BHK Configuration
              </label>
              <select
                value={selectedBhk}
                onChange={(e) => setSelectedBhk(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-stone-200/90 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-[#B8924A] focus:bg-white transition-colors"
              >
                <option value="All">Any BHK / Layout</option>
                {bhkOptions.map((bhk) => (
                  <option key={bhk} value={bhk}>
                    {bhk}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rent */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                Minimum Rent (₹)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                placeholder="Min ₹"
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-stone-200/90 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#B8924A] focus:bg-white transition-colors"
              />
            </div>

            {/* Maximum Rent */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                Maximum Rent (₹)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                placeholder="Max ₹"
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-stone-200/90 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#B8924A] focus:bg-white transition-colors"
              />
            </div>

            {/* Primary Search Button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  const listingsEl = document.getElementById('properties-listing-grid');
                  if (listingsEl) {
                    listingsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1D24] hover:bg-[#9A7835] text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>Search Properties</span>
              </button>
            </div>
          </div>

          {/* Toggle & Secondary Filter Controls */}
          <div className="mt-4 pt-3.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-[#9A7835] transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#9A7835]" />
              {showAdvancedFilters
                ? 'Hide More Filters'
                : 'More Filters (Keyword, Furnishing, Parking, Availability, Sort)'}
            </button>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#9A7835] bg-[#FAF6EE] hover:bg-[#F3EBDC] border border-[#E5D7BE] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              )}
              <span className="text-xs text-stone-500 font-medium">
                Showing <strong className="text-stone-900">{filteredProperties.length}</strong> verified{' '}
                {filteredProperties.length === 1 ? 'property' : 'properties'}
              </span>
            </div>
          </div>

          {/* Expanded Secondary Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Keyword Search */}
              <div className="lg:col-span-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                  Search Keyword or ID
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Title, locality, ID..."
                    className="w-full pl-8 pr-3 py-2 bg-[#FAF8F5] border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#B8924A] focus:bg-white"
                  />
                </div>
              </div>

              {/* Furnishing Status */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                  Furnishing Status
                </label>
                <select
                  value={selectedFurnishing}
                  onChange={(e) => setSelectedFurnishing(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-[#B8924A]"
                >
                  <option value="All">Any Furnishing</option>
                  {furnishingOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parking Availability */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                  Parking Availability
                </label>
                <select
                  value={selectedParking}
                  onChange={(e) => setSelectedParking(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-[#B8924A]"
                >
                  <option value="All">Any Parking</option>
                  <option value="Available">Parking Available</option>
                  <option value="Car">Car Parking</option>
                  <option value="Bike">Bike Parking</option>
                </select>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                  Availability
                </label>
                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-[#B8924A]"
                >
                  <option value="All">All Available</option>
                  <option value="Immediate">Ready to Move Immediately</option>
                  <option value="Verified Available">Verified Available</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-[#B8924A]"
                >
                  <option value="recent">Recently Added</option>
                  <option value="rent_asc">Rent: Low to High</option>
                  <option value="rent_desc">Rent: High to Low</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Promotional Trust Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7">
        <div className="bg-[#F5F0E6] border border-[#E5DEC9] rounded-2xl px-6 py-5 sm:px-8 sm:py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="max-w-2xl">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1A1D24] mb-1">
              Find the Right Space with Confidence
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              From verified property listings to assisted site visits, Royal Epic Properties makes
              your rental search in Bengaluru easier and more transparent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5 shrink-0">
            <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-[#2A2D34] bg-white/80 border border-[#E5DEC9] px-3.5 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-[#B8924A] shrink-0" />
              <span>Verified Rental Properties</span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-[#2A2D34] bg-white/80 border border-[#E5DEC9] px-3.5 py-2 rounded-xl">
              <MapPin className="w-4 h-4 text-[#B8924A] shrink-0" />
              <span>Assistance Across Bengaluru</span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-[#2A2D34] bg-white/80 border border-[#E5DEC9] px-3.5 py-2 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-[#B8924A] shrink-0" />
              <span>Support from Enquiry to Move-in</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Listings Grid */}
      <section id="properties-listing-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm animate-pulse"
              >
                <div className="h-56 bg-stone-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-stone-200 rounded w-1/3" />
                  <div className="h-6 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                  <div className="h-10 bg-stone-200 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-xl mx-auto">
            <p className="text-stone-800 font-semibold mb-2">{error}</p>
            <button
              type="button"
              onClick={fetchPublishedProperties}
              className="mt-2 px-5 py-2.5 rounded-xl bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center mx-auto mb-4 text-amber-800">
              <Filter className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-2">
              {hasActiveFilters
                ? 'No properties match your current filter selection'
                : 'New Verified Rental Listings Arriving Shortly'}
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
              {hasActiveFilters
                ? 'Try broadening your rent range, changing the locality or BHK filter, or reset all filters to view every available verified property in Bengaluru.'
                : 'Our property specialists are currently completing physical verification and photography for upcoming residential and commercial spaces in Bengaluru. Contact us directly and we will match you with available listings.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset All Filters
                </button>
              )}
              <a
                href="tel:+917026119311"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Royal Epic (+91 70261 19311)
              </a>
              <a
                href="https://wa.me/917026119311?text=Hi%20Royal%20Epic%20Properties%2C%20I%20am%20looking%20for%20a%20rental%20property%20in%20Bengaluru."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 text-sm font-semibold hover:bg-stone-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                WhatsApp Requirement
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProperties.map((prop) => {
              const keyAmenities = Array.isArray(prop.amenities) ? prop.amenities.slice(0, 4) : [];
              return (
                <article
                  key={prop.property_id}
                  onClick={() => onSelectProperty(prop.slug)}
                  className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 flex flex-col cursor-pointer"
                >
                    {/* Main Property Image */}
                  <a
                    href={`/properties/${prop.slug}`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectProperty(prop.slug);
                    }}
                    className="relative h-60 w-full bg-stone-100 overflow-hidden block"
                  >
                    <img
                      src={prop.main_image}
                      alt={`${prop.property_title} in ${prop.locality || 'Bengaluru'}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-900/85 backdrop-blur-sm text-white text-[11px] font-semibold tracking-wide">
                        {prop.property_category === 'Commercial' ? (
                          <Building2 className="w-3 h-3 text-amber-400" />
                        ) : (
                          <Home className="w-3 h-3 text-amber-400" />
                        )}
                        {prop.property_category} • {prop.property_type}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/95 text-white text-[11px] font-semibold shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Available
                      </span>
                    </div>

                    {/* Bottom Image Overlay: Locality & ID */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-100">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">
                          {prop.locality}, {prop.city || 'Bengaluru'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded text-stone-300">
                        {prop.property_id}
                      </span>
                    </div>
                  </a>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title */}
                      <h2 className="text-lg font-serif font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1 mb-2">
                        <a
                          href={`/properties/${prop.slug}`}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectProperty(prop.slug);
                          }}
                        >
                          {prop.property_title}
                        </a>
                      </h2>

                      {/* Monthly Rent & Security Deposit */}
                      <div className="flex items-baseline justify-between gap-2 pb-3.5 mb-3.5 border-b border-stone-100">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-semibold">
                            Monthly Rent
                          </span>
                          <span className="text-2xl font-bold text-amber-800">
                            ₹{Number(prop.monthly_rent || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-stone-500 font-medium"> / month</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-semibold">
                            Security Deposit
                          </span>
                          <span className="text-sm font-bold text-stone-800">
                            ₹{Number(prop.security_deposit || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Key Specs Grid: BHK, Built-up area, Furnishing, Parking */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs text-stone-600 mb-4">
                        <div className="flex items-center gap-2 bg-stone-50 px-2.5 py-2 rounded-lg border border-stone-100">
                          <BedDouble className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate font-medium">
                            {prop.bhk_type && prop.bhk_type !== 'N/A'
                              ? prop.bhk_type
                              : prop.property_type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 bg-stone-50 px-2.5 py-2 rounded-lg border border-stone-100">
                          <Maximize2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate font-medium">
                            {prop.built_up_area
                              ? `${prop.built_up_area} ${prop.area_unit || 'sq.ft'}`
                              : prop.carpet_area
                                ? `${prop.carpet_area} ${prop.area_unit || 'sq.ft'}`
                                : 'Standard Area'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 bg-stone-50 px-2.5 py-2 rounded-lg border border-stone-100">
                          <Armchair className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate font-medium">
                            {prop.furnishing_status || 'Semi-Furnished'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 bg-stone-50 px-2.5 py-2 rounded-lg border border-stone-100">
                          <Car className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate font-medium">
                            {prop.parking_availability || 'Parking'}
                          </span>
                        </div>
                      </div>

                      {/* Key Amenities */}
                      {keyAmenities.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1.5">
                            {keyAmenities.map((item) => (
                              <span
                                key={item}
                                className="text-[11px] px-2 py-0.5 bg-amber-50/70 text-amber-900 border border-amber-200/60 rounded font-medium"
                              >
                                {item}
                              </span>
                            ))}
                            {Array.isArray(prop.amenities) && prop.amenities.length > 4 && (
                              <span className="text-[11px] px-2 py-0.5 bg-stone-100 text-stone-600 rounded font-medium">
                                +{prop.amenities.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Action */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-stone-500 font-medium">
                        {prop.available_from
                          ? `Available: ${prop.available_from}`
                          : 'Ready for Immediate Move-in'}
                      </span>
                      <a
                        href={`/properties/${prop.slug}`}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                          e.preventDefault();
                          e.stopPropagation();
                          onSelectProperty(prop.slug);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white group-hover:bg-amber-700 text-xs font-semibold transition-colors"
                      >
                        View Details
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Bengaluru Rental Coverage & Property Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl border border-[#E6E0D4] p-6 sm:p-9 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A7835] block">
                LOCAL RENTAL ASSISTANCE IN BENGALURU
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1D24]">
                Residential &amp; Commercial Rentals Across Key Bengaluru Localities
              </h2>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                Royal Epic Properties helps families, working professionals and businesses find
                verified rental homes and commercial spaces across Bengaluru — including HSR Layout,
                Thanisandra, Hebbal, Yelahanka, Manyata Tech Park, Whitefield, Indiranagar,
                Koramangala, Sarjapur Road, Marathahalli, Bellandur and JP Nagar.
              </p>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                Every public listing on our website is reviewed by our Bengaluru property desk for
                availability, configuration, monthly rent, security deposit, furnishing status and
                amenities before being published. Owner contact details and private building numbers
                are kept confidential while our advisors coordinate smooth, accompanied site visits.
              </p>
            </div>

            <div className="lg:col-span-5 bg-[#FAF8F5] border border-[#E6DFD1] rounded-2xl p-5 sm:p-6 space-y-4">
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A1D24]">
                Explore Related Royal Epic Services
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Moving into a new home or commercial space in Bengaluru? Explore our interior design,
                furniture and finance assistance verticals:
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <a
                    href="/home-interior-design-bangalore"
                    className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200/90 hover:border-[#B8924A] text-stone-800 font-semibold transition-colors"
                  >
                    <span>Home Interior Design in Bengaluru</span>
                    <ArrowUpRight className="w-4 h-4 text-[#9A7835]" />
                  </a>
                </li>
                <li>
                  <a
                    href="/modular-kitchen-bangalore"
                    className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200/90 hover:border-[#B8924A] text-stone-800 font-semibold transition-colors"
                  >
                    <span>Modular Kitchen Design &amp; Wardrobes</span>
                    <ArrowUpRight className="w-4 h-4 text-[#9A7835]" />
                  </a>
                </li>
                <li>
                  <a
                    href="/loans"
                    className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200/90 hover:border-[#B8924A] text-stone-800 font-semibold transition-colors"
                  >
                    <span>Home Construction, Interior &amp; Renovation Finance Assistance</span>
                    <ArrowUpRight className="w-4 h-4 text-[#9A7835]" />
                  </a>
                </li>
                <li>
                  <a
                    href="/products"
                    className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200/90 hover:border-[#B8924A] text-stone-800 font-semibold transition-colors"
                  >
                    <span>Bespoke Furniture &amp; Decor Catalogue</span>
                    <ArrowUpRight className="w-4 h-4 text-[#9A7835]" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl border border-[#E6E0D4] p-6 sm:p-9 shadow-sm">
          <div className="max-w-3xl mb-6">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A7835] block mb-1.5">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1D24]">
              Renting a Verified Property in Bengaluru with Royal Epic
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
              <h3 className="text-base font-serif font-bold text-[#1A1D24] mb-1.5">
                How does Royal Epic Properties verify rental listings in Bengaluru?
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Every property published on Royal Epic Properties undergoes a 4-point verification check covering owner identity, ownership authorization, current vacancy status, and direct permission to advertise.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
              <h3 className="text-base font-serif font-bold text-[#1A1D24] mb-1.5">
                What types of rental properties are available on Royal Epic Properties?
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                We list verified residential properties—including 1 BHK, 2 BHK, and 3 BHK flats, independent houses, and gated villas—as well as commercial offices, retail shops, and showrooms across Bengaluru.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
              <h3 className="text-base font-serif font-bold text-[#1A1D24] mb-1.5">
                How do I schedule a site visit for a listed property?
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Open any available property listing and submit the site visit request form with your preferred date and time, or call our Bengaluru property desk at +91 70261 19311 for an accompanied visit.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
              <h3 className="text-base font-serif font-bold text-[#1A1D24] mb-1.5">
                Why are exact street addresses and owner phone numbers not displayed publicly?
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                To protect resident and homeowner privacy and prevent unsolicited spam calls, exact door numbers and owner contact details are kept confidential. Our property advisors coordinate all enquiries and accompanied visits directly.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] md:col-span-2">
              <h3 className="text-base font-serif font-bold text-[#1A1D24] mb-1.5">
                Can property owners in Bengaluru list their flat, villa, or commercial space for rent?
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Yes. Property owners in Bengaluru can contact Royal Epic Properties at +91 70261 19311 or submit their requirement to have our team verify, photograph, and showcase their property to genuine tenants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Assistance Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-[#181512] text-white rounded-2xl p-7 sm:p-10 border border-amber-500/25 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-widest block mb-1.5">
              Assisted Property Discovery in Bengaluru
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
              Looking for a specific locality, budget, or commercial floorplate?
            </h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Speak directly with the Royal Epic Properties advisory desk. We coordinate verified
              site visits, rental negotiations, and custom interior fit-outs across Bengaluru.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:+917026119311"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <Phone className="w-4 h-4" />
              Call +91 70261 19311
            </a>
            <a
              href="https://wa.me/917026119311?text=Hi%20Royal%20Epic%20Properties%2C%20I%20would%20like%20assistance%20finding%20a%20rental%20property%20in%20Bengaluru."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              WhatsApp Royal Epic
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicPropertiesPage;
