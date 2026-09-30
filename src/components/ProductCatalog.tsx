import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PRODUCTS_DATA, KITCHEN_EQUIPMENT_CATALOG } from '../data/mockData';
import { Product, KitchenEquipmentItem } from '../types';
import { getProductSlug, getCategorySlug, deduplicateProducts } from '../utils/productSlug';
import { fetchPublicReviews } from '../services/reviewService';
import { 
  Search, SlidersHorizontal, Heart, ShoppingBag, Eye, Box, 
  Rotate3d, Star, Sparkles, Check, FileText, Filter,
  ChefHat, Table, Grid, Printer, Download, Image as ImageIcon, X, ShieldCheck,
  ChevronLeft, ChevronRight, ArrowRight, Layers, Award, Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCategories, DEFAULT_CATEGORIES } from '../services/productManagementService';

interface ProductCatalogProps {
  products?: Product[];
  initialCategory?: string;
  initialSearch?: string;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistIds: string[];
  onRequestQuote: (productName: string) => void;
}

// Curated Visual Category Cards for the Material Depot-style category showcase
const VISUAL_CATEGORIES = [
  {
    name: 'Modular Kitchens',
    categoryKey: 'Modular Kitchens',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    tag: 'German Soft-Close',
    subtitle: 'Island, L-Shape & Acrylic Finishes',
    count: '15+ Layouts'
  },
  {
    name: 'Living Room Luxury',
    categoryKey: 'Living Room Luxury',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    tag: 'Chesterfield & Velvet',
    subtitle: 'Custom Sectionals & Lounges',
    count: '18+ Styles'
  },
  {
    name: 'Main Entrance Doors',
    categoryKey: 'Main Entrance Doors',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    tag: 'Solid Teak & Brass',
    subtitle: 'Grand Pivot & Carved Teak Doors',
    count: '12+ Models'
  },
  {
    name: 'Sliding Wardrobes',
    categoryKey: 'Sliding Wardrobes',
    image: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=800&q=80',
    tag: 'Sensor LED Lighting',
    subtitle: 'Floor-to-Ceiling Walk-In Closets',
    count: '10+ Designs'
  },
  {
    name: 'TV Console Units',
    categoryKey: 'TV Units',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    tag: 'Fluted Louvers & Stone',
    subtitle: 'Floating Entertainment Backdrops',
    count: '8+ Backdrops'
  },
  {
    name: 'Dining & Onyx Tables',
    categoryKey: 'Dining Tables',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    tag: 'Italian Marble & Metal',
    subtitle: 'Translucent Onyx & Teak Diners',
    count: '6+ Finishes'
  },
  {
    name: 'WPC Bathroom Doors',
    categoryKey: 'WPC Bathroom Doors',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    tag: '100% Waterproof',
    subtitle: 'Termite Proof & Lifetime Guarantee',
    count: '8+ Textures'
  },
  {
    name: 'Commercial Equipment',
    categoryKey: 'Kitchen Equipment',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    tag: '304 Stainless Steel',
    subtitle: 'Industrial Cooking Ranges & Exhausts',
    count: '40+ Commercial Units'
  }
];

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  initialCategory,
  initialSearch,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  onRequestQuote,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [priceMax, setPriceMax] = useState<number>(500000);
  const [viewMode, setViewMode] = useState<'grid' | 'equipment-table'>('grid');
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState<string>('All');
  const [previewImage, setPreviewImage] = useState<{ name: string; image: string; specification: string; priceRange: string } | null>(null);

  const trendingScrollRef = useRef<HTMLDivElement>(null);
  const catalogGridRef = useRef<HTMLDivElement>(null);

  // Live Calculated Ratings Map for Products: productId -> { rating: number, reviewsCount: number }
  const [productReviewsMap, setProductReviewsMap] = useState<Record<string, { rating: number; reviewsCount: number }>>({});

  useEffect(() => {
    const loadAllProductReviews = async () => {
      try {
        const res = await fetchPublicReviews();
        if (res.reviews && res.reviews.length > 0) {
          const map: Record<string, { totalRating: number; count: number }> = {};
          res.reviews.forEach(r => {
            if (r.product_id) {
              if (!map[r.product_id]) map[r.product_id] = { totalRating: 0, count: 0 };
              map[r.product_id].totalRating += (r.rating || 5);
              map[r.product_id].count += 1;
            }
          });
          const resultMap: Record<string, { rating: number; reviewsCount: number }> = {};
          Object.entries(map).forEach(([pid, stats]) => {
            resultMap[pid] = {
              rating: Number((stats.totalRating / stats.count).toFixed(1)),
              reviewsCount: stats.count
            };
          });
          setProductReviewsMap(resultMap);
        }
      } catch (_) {}
    };

    loadAllProductReviews();

    const handleUpdate = () => loadAllProductReviews();
    window.addEventListener('royalepic-reviews-updated', handleUpdate);
    return () => window.removeEventListener('royalepic-reviews-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (initialCategory && initialCategory !== selectedCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch !== undefined && initialSearch !== searchQuery) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const [supabaseCategories, setSupabaseCategories] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    getCategories()
      .then((cats) => {
        if (isMounted && cats && cats.length > 0) {
          setSupabaseCategories(cats.map(c => c.name));
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch categories in ProductCatalog:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const list = ['All'];
    const seen = new Set<string>(['All']);

    supabaseCategories.forEach((name) => {
      if (name && !seen.has(name)) {
        seen.add(name);
        list.push(name);
      }
    });

    if (products && products.length > 0) {
      products.forEach((p) => {
        if (p.category && !seen.has(p.category)) {
          seen.add(p.category);
          list.push(p.category);
        }
      });
    }

    if (list.length === 1) {
      DEFAULT_CATEGORIES.forEach((c) => {
        if (!seen.has(c.name)) {
          seen.add(c.name);
          list.push(c.name);
        }
      });
    }

    return list;
  }, [supabaseCategories, products]);

  const equipmentCategories = [
    'All',
    'Cooking Equipment',
    'Preparation & Fabrication',
    'Refrigeration & Cold Storage',
    'Food Processing Machinery',
    'Ventilation & Fresh Air',
    'Grilling & Tandoor',
    'South Indian & Fast Food',
    'Washing & Hygiene',
    'Bulk Cooking Vessels',
    'Service & Display Counters',
    'Storage & Trolleys',
  ];

  const allDeduplicatedProducts = useMemo(() => {
    const rawList = products && products.length > 0 ? products : PRODUCTS_DATA;
    return deduplicateProducts(rawList);
  }, [products]);

  // Featured Trending items for the Material Depot-style trending carousel
  const trendingProducts = useMemo(() => {
    return allDeduplicatedProducts
      .filter(p => p.isHot || p.rating >= 4.8)
      .slice(0, 10);
  }, [allDeduplicatedProducts]);

  const filteredProducts = useMemo(() => {
    return allDeduplicatedProducts.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategory === 'All' || 
        p.category === selectedCategory ||
        (selectedCategory === 'Sofas' && (
          p.category === 'Luxury Sofas & Sectionals' || 
          p.category === 'Living Room Luxury' || 
          p.name.toLowerCase().includes('sofa')
        )) ||
        (selectedCategory === 'Main Entrance Doors' && (
          p.category === 'Doors' || 
          p.name.toLowerCase().includes('main entrance door')
        )) ||
        (selectedCategory === 'WPC Bathroom Doors' && (
          p.category === 'WPC Waterproof Doors' || 
          p.category === 'WPC Bathroom Doors' || 
          p.name.toLowerCase().includes('wpc')
        ));
      const matchesPrice = p.price <= priceMax;

      return matchesSearch && matchesCategory && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0; // default featured
    });
  }, [searchQuery, selectedCategory, sortBy, priceMax, allDeduplicatedProducts]);

  const filteredEquipment = useMemo(() => {
    return KITCHEN_EQUIPMENT_CATALOG.filter((item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specification.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCat = equipmentCategoryFilter === 'All' || item.category === equipmentCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, equipmentCategoryFilter]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'Kitchen Equipment') {
      setViewMode('equipment-table');
    } else {
      setViewMode('grid');
    }
  };

  const handleVisualCategoryClick = (categoryKey: string) => {
    handleCategorySelect(categoryKey);
    setTimeout(() => {
      if (catalogGridRef.current) {
        catalogGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const scrollTrending = (direction: 'left' | 'right') => {
    if (trendingScrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      trendingScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 sm:py-28 bg-[#FBFBFA] text-stone-900 relative" id="shop">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ========================================================================= */}
        {/* SECTION 1: MATERIAL DEPOT-STYLE VISUAL CATEGORIES SHOWCASE                */}
        {/* Large visual cards with clear architectural spaces and clean typography   */}
        {/* ========================================================================= */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 font-mono block mb-2">
                Explore by Space & Category
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
                Architectural Furniture & Material Collections
              </h2>
            </div>
            <p className="text-sm text-stone-600 max-w-md leading-relaxed">
              Precision factory-crafted furniture, architectural door systems, and commercial equipment engineered for luxury residences and hotels.
            </p>
          </div>

          {/* Visual Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VISUAL_CATEGORIES.map((cat, idx) => {
              const isSelected = selectedCategory === cat.categoryKey;
              return (
                <div
                  key={idx}
                  onClick={() => handleVisualCategoryClick(cat.categoryKey)}
                  className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border ${
                    isSelected 
                      ? 'border-amber-500 shadow-xl ring-2 ring-amber-400/30' 
                      : 'border-stone-200/90 hover:border-amber-400/70 hover:shadow-xl'
                  } bg-white flex flex-col justify-between h-[320px]`}
                >
                  {/* Category Image */}
                  <div className="relative h-[210px] w-full overflow-hidden bg-stone-100">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
                    
                    {/* Badge */}
                    <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-bold text-stone-900 uppercase tracking-wider shadow-sm">
                      {cat.tag}
                    </span>

                    {/* Count */}
                    <span className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-mono font-medium text-amber-300">
                      {cat.count}
                    </span>
                  </div>

                  {/* Category Card Info */}
                  <div className="p-4 flex items-center justify-between gap-3 bg-white flex-1">
                    <div>
                      <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-amber-800 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                        {cat.subtitle}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-stone-900 group-hover:text-white text-stone-600 flex items-center justify-center shrink-0 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: TRENDING LUXURY COLLECTIONS (Horizontal Carousel)              */}
        {/* Distinctive Material Depot-style horizontal discovery stream              */}
        {/* ========================================================================= */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 font-mono block mb-1">
                Curated Bestsellers
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                Trending Luxury Pieces
              </h3>
            </div>

            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollTrending('left')}
                className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center text-stone-700 hover:text-black transition-colors shadow-sm cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollTrending('right')}
                className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center text-stone-700 hover:text-black transition-colors shadow-sm cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Horizontal Scrolling Track */}
          <div
            ref={trendingScrollRef}
            className="flex items-stretch gap-5 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x scroll-smooth"
          >
            {trendingProducts.map((p) => {
              const slug = getProductSlug(p);
              const isWishlisted = wishlistIds.includes(p.id);

              return (
                <div
                  key={`trending-${p.id}`}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-white rounded-3xl border border-stone-200/90 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group snap-start"
                >
                  {/* Image Frame */}
                  <div className="relative h-56 bg-stone-100 overflow-hidden">
                    <a
                      href={`/products/${slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectProduct(p);
                      }}
                      className="block w-full h-full"
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </a>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider shadow-sm font-mono">
                        Trending
                      </span>
                      {p.has3dViewer && (
                        <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold text-stone-900 flex items-center gap-1 shadow-sm">
                          <Box className="w-3 h-3 text-amber-700" /> 3D View
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={() => onToggleWishlist(p)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                        isWishlisted
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-white/80 text-stone-700 hover:text-red-500 hover:bg-white shadow-sm'
                      }`}
                      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                        <span className="uppercase text-[10px] font-bold tracking-wider text-amber-800 font-mono">
                          {p.category}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{p.rating || 4.9}</span>
                        </div>
                      </div>

                      <h4 className="font-serif font-bold text-stone-900 text-base line-clamp-1 group-hover:text-amber-800 transition-colors">
                        <a
                          href={`/products/${slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectProduct(p);
                          }}
                        >
                          {p.name}
                        </a>
                      </h4>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-stone-400 block font-mono">Factory Rate</span>
                        <span className="text-base font-bold text-stone-900 font-mono">
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <button
                        onClick={() => onRequestQuote(p.name)}
                        className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Inquire
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: REFINED PRODUCT CATALOG EXPLORER & FILTERS                      */}
        {/* High-legibility, spacious grid with instant category and price controls   */}
        {/* ========================================================================= */}
        <div ref={catalogGridRef} className="pt-6">
          
          {/* Header & View Mode Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 font-mono block mb-1">
                Complete Inventory
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                Explore Full Royal Epic Catalog
              </h3>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 border border-stone-200 rounded-2xl shadow-sm self-start md:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Grid className="w-4 h-4" /> Furniture & Doors Grid
              </button>
              <button
                onClick={() => setViewMode('equipment-table')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'equipment-table'
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ChefHat className="w-4 h-4 text-amber-500" /> Commercial Equipment Price List
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={viewMode === 'equipment-table' ? "Search equipment, ranges, fryers..." : "Search doors, kitchens, wardrobes, sofas, dining..."}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Controls based on View Mode */}
            {viewMode === 'grid' ? (
              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end text-xs">
                {/* Price Slider */}
                <div className="flex items-center gap-2 text-stone-700 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
                  <span className="text-[11px] font-medium text-stone-500">Max Budget:</span>
                  <span className="font-mono font-bold text-stone-900">₹{priceMax.toLocaleString('en-IN')}</span>
                  <input
                    type="range"
                    min={5000}
                    max={500000}
                    step={5000}
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-24 accent-amber-600 cursor-pointer ml-1"
                  />
                </div>

                {/* Sort By Dropdown */}
                <div className="flex items-center gap-2 text-stone-700">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-[11px] font-medium text-stone-500">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                  >
                    <option value="featured">Featured First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end text-xs">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-[11px] font-medium text-stone-500">Category:</span>
                  <select
                    value={equipmentCategoryFilter}
                    onChange={(e) => setEquipmentCategoryFilter(e.target.value)}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                  >
                    {equipmentCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Print Price List"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Catalog
                </button>
              </div>
            )}
          </div>

          {/* Horizontal Category Filter Pills */}
          {viewMode === 'grid' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white shadow-sm font-bold'
                      : 'bg-white border border-stone-200/90 text-stone-700 hover:text-stone-900 hover:border-stone-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* VIEW MODE 1: E-STORE GRID */}
          {viewMode === 'grid' && (
            filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 shadow-sm p-8">
                <Filter className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                <h4 className="text-xl font-serif font-bold text-stone-900 mb-2">No matching products found</h4>
                <p className="text-xs text-stone-500 mb-6 max-w-sm mx-auto">
                  Try adjusting your budget slider, clearing your search query, or selecting another category.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setPriceMax(500000);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-amber-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => {
                  const isWishlisted = wishlistIds.includes(product.id);
                  const slug = getProductSlug(product);

                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -6 }}
                      className="bg-white rounded-3xl border border-stone-200/90 hover:border-amber-400/80 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group relative"
                    >
                      {/* Product Image Frame */}
                      <div className="relative h-64 bg-stone-100 overflow-hidden">
                        <a
                          href={`/products/${slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectProduct(product);
                          }}
                          className="block w-full h-full"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        </a>

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                          {product.discount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm font-mono">
                              {product.discount}% OFF
                            </span>
                          )}
                          {product.has3dViewer && (
                            <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 text-stone-900 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                              <Box className="w-3 h-3 text-amber-700" /> 3D View
                            </span>
                          )}
                          {product.has360View && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                              <Rotate3d className="w-3 h-3 text-emerald-600" /> 360°
                            </span>
                          )}
                        </div>

                        {/* Wishlist Button */}
                        <button
                          onClick={() => onToggleWishlist(product)}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 cursor-pointer ${
                            isWishlisted
                              ? 'bg-red-500 text-white shadow-md'
                              : 'bg-white/80 text-stone-700 hover:text-red-500 hover:bg-white shadow-sm'
                          }`}
                          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>

                        {/* Quick View Hover Overlay */}
                        <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={`/products/${slug}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onSelectProduct(product);
                            }}
                            className="px-4 py-2 rounded-xl bg-white text-stone-900 hover:bg-amber-500 hover:text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> View Details
                          </a>
                        </div>
                      </div>

                      {/* Product Content Details */}
                      <div className="p-5 flex flex-col flex-1 justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5 text-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono">
                              {product.category}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>
                                {productReviewsMap[product.id]?.rating !== undefined 
                                  ? productReviewsMap[product.id].rating 
                                  : (product.rating || 4.9)}
                              </span>
                              <span className="text-[10px] text-stone-400 font-normal">
                                ({productReviewsMap[product.id]?.reviewsCount !== undefined 
                                  ? productReviewsMap[product.id].reviewsCount 
                                  : (product.reviewsCount || 12)})
                              </span>
                            </div>
                          </div>

                          <h4 className="text-base font-serif font-bold text-stone-900 mb-1.5 line-clamp-1 group-hover:text-amber-800 transition-colors">
                            <a
                              href={`/products/${slug}`}
                              onClick={(e) => {
                                e.preventDefault();
                                onSelectProduct(product);
                              }}
                            >
                              {product.name}
                            </a>
                          </h4>

                          <p className="text-xs text-stone-500 line-clamp-2 mb-4 leading-relaxed">
                            {product.description}
                          </p>
                        </div>

                        <div>
                          {/* Price Display */}
                          <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-lg font-bold text-stone-900 font-mono">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                            {product.originalPrice > product.price && (
                              <span className="text-xs text-stone-400 line-through font-mono">
                                ₹{product.originalPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => onAddToCart(product)}
                              className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-stone-700" /> Add
                            </button>
                            <button
                              onClick={() => onRequestQuote(product.name)}
                              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-400" /> Quote
                            </button>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )
          )}

          {/* VIEW MODE 2: RESTAURANT KITCHEN EQUIPMENT CATALOG TABLE */}
          {viewMode === 'equipment-table' && (
            <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-neutral-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1.5 font-mono">
                    <ChefHat className="w-4 h-4" /> Commercial Kitchen Equipment Catalog & Rates
                  </div>
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-white">
                    Heavy-Duty Commercial Kitchen Equipment Price Directory
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                    Official quotation catalog with verified Indian factory rates for 304 Grade Stainless Steel commercial kitchen setups.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-400 font-mono block">
                    Showing {filteredEquipment.length} Equipment Models
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-mono text-[11px]">
                      <th className="py-4 px-4 font-bold">Image</th>
                      <th className="py-4 px-4 font-bold min-w-[200px]">Product Name</th>
                      <th className="py-4 px-4 font-bold min-w-[260px]">Specification</th>
                      <th className="py-4 px-4 font-bold whitespace-nowrap">Unit</th>
                      <th className="py-4 px-4 font-bold whitespace-nowrap text-neutral-900">Price (₹)</th>
                      <th className="py-4 px-4 font-bold min-w-[150px]">Warranty</th>
                      <th className="py-4 px-4 font-bold text-right min-w-[130px]">Quotation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-800">
                    {filteredEquipment.map((item) => (
                      <tr 
                        key={item.id}
                        className="hover:bg-amber-50/50 transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setPreviewImage(item)}
                            className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 relative group/thumb cursor-pointer block"
                            title="Click to zoom image"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                              <ImageIcon className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-[10px] font-mono text-amber-700 block uppercase tracking-wider mb-0.5">
                            {item.category}
                          </span>
                          <h5 className="font-bold text-neutral-900 text-sm group-hover:text-amber-700 transition-colors">
                            {item.name}
                          </h5>
                        </td>

                        <td className="py-3 px-4 text-neutral-600 leading-relaxed">
                          {item.specification}
                        </td>

                        <td className="py-3 px-4 text-neutral-600 font-mono whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[11px]">
                            {item.unit}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-neutral-900 text-sm whitespace-nowrap">
                          {item.priceRange}
                        </td>

                        <td className="py-3 px-4 text-neutral-600">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            {item.warranty}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onRequestQuote(`${item.name} (${item.priceRange})`)}
                            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                          >
                            Quote
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredEquipment.length === 0 && (
                <div className="text-center py-16 text-neutral-500">
                  <ChefHat className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-neutral-800">No commercial equipment matched your filter.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setEquipmentCategoryFilter('All');
                    }}
                    className="mt-3 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold"
                  >
                    Clear Search Filter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* IMAGE PREVIEW MODAL */}
          <AnimatePresence>
            {previewImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                onClick={() => setPreviewImage(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:text-amber-400 z-10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="relative h-80 bg-neutral-100">
                    <img
                      src={previewImage.image}
                      alt={previewImage.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 bg-neutral-900/90 backdrop-blur-md px-3.5 py-1 rounded-full text-white font-mono font-bold text-sm">
                      {previewImage.priceRange}
                    </div>
                  </div>

                  <div className="p-6 sm:p-7">
                    <h3 className="text-xl font-serif font-bold text-neutral-900 mb-2">
                      {previewImage.name}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                      {previewImage.specification}
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const name = previewImage.name;
                          setPreviewImage(null);
                          onRequestQuote(`${name} (${previewImage.priceRange})`);
                        }}
                        className="flex-1 py-3 rounded-xl bg-neutral-900 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                      >
                        Get Instant Factory Quote
                      </button>
                      <button
                        onClick={() => setPreviewImage(null)}
                        className="px-5 py-3 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Turnkey Assurance Strip */}
          <div className="mt-16 bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-10 text-center shadow-sm">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold block mb-2">
              Factory Direct Guarantee
            </span>
            <h4 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mb-3">
              Royal Epic Interior & Furniture Manufacturing
            </h4>
            <p className="text-sm text-neutral-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Complete turnkey residential villas, hotel suites, luxury modular kitchens, and 304 SS commercial setups with 15-year waterproof guarantee.
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-neutral-700 font-medium">
              <span className="hover:text-amber-700 transition-colors">Restaurant Kitchen Setup</span>
              <span className="text-neutral-300">•</span>
              <span className="hover:text-amber-700 transition-colors">Cloud Kitchen Fabrication</span>
              <span className="text-neutral-300">•</span>
              <span className="hover:text-amber-700 transition-colors">Turnkey Residential Interiors</span>
              <span className="text-neutral-300">•</span>
              <span className="hover:text-amber-700 transition-colors">Solid Teak Wood Doors</span>
              <span className="text-neutral-300">•</span>
              <span className="hover:text-amber-700 transition-colors">Stainless Steel Fabrication</span>
              <span className="text-neutral-300">•</span>
              <span className="hover:text-amber-700 transition-colors">3D Room Visualizations</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
