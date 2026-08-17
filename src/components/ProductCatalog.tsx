import React, { useState, useMemo } from 'react';
import { PRODUCTS_DATA, KITCHEN_EQUIPMENT_CATALOG } from '../data/mockData';
import { Product, KitchenEquipmentItem } from '../types';
import { 
  Search, SlidersHorizontal, Heart, ShoppingBag, Eye, Box, 
  Rotate3d, Star, Sparkles, Check, FileText, Filter,
  ChefHat, Table, Grid, Printer, Download, Image as ImageIcon, X, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCatalogProps {
  products?: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistIds: string[];
  onRequestQuote: (productName: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  onRequestQuote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [priceMax, setPriceMax] = useState<number>(500000);
  const [viewMode, setViewMode] = useState<'grid' | 'equipment-table'>('grid');
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState<string>('All');
  const [previewImage, setPreviewImage] = useState<{ name: string; image: string; specification: string; priceRange: string } | null>(null);

  const categories = [
    'All',
    'Main Entrance Doors',
    'WPC Bathroom Doors',
    'Modular Kitchens',
    'Sliding Wardrobes',
    'TV Units',
    'Sofas',
    'Dining Tables',
    'Commercial Furniture',
    'Kitchen Equipment',
    'Glass Partitions',
  ];

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

  const filteredProducts = useMemo(() => {
    const list = products && products.length > 0 ? products : PRODUCTS_DATA;
    return list.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesPrice = p.price <= priceMax;

      return matchesSearch && matchesCategory && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // default
    });
  }, [searchQuery, selectedCategory, sortBy, priceMax]);

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
    }
  };

  return (
    <section className="py-20 bg-neutral-950 text-white relative" id="shop">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-3">
              <ShoppingBag className="w-3.5 h-3.5" /> Direct Factory Manufacturing & E-Commerce
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
              Royal Product Catalog & Equipment Directory
            </h2>
            <p className="text-neutral-400 text-sm mt-2">
              Browse 3D interior products or explore our complete commercial restaurant kitchen equipment catalog with realistic Indian market prices.
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-white/15 p-1.5 rounded-2xl shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-gold text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" /> E-Store Grid
            </button>
            <button
              onClick={() => setViewMode('equipment-table')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'equipment-table'
                  ? 'bg-gold text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4" /> Kitchen Equipment Price List ({KITCHEN_EQUIPMENT_CATALOG.length})
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 mb-10 flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={viewMode === 'equipment-table' ? "Search equipment, ranges, mixers, fryers..." : "Search doors, kitchens, wardrobes, sofas, equipment..."}
              className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold transition-all"
            />
          </div>

          {/* Controls based on view mode */}
          {viewMode === 'grid' ? (
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center gap-2 text-xs text-neutral-300 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
                <span>Max Price:</span>
                <span className="font-mono text-gold font-bold">₹{priceMax.toLocaleString('en-IN')}</span>
                <input
                  type="range"
                  min={500}
                  max={500000}
                  step={5000}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-24 accent-gold cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gold" />
                <span>Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <Filter className="w-3.5 h-3.5 text-gold" />
                <span>Filter Category:</span>
                <select
                  value={equipmentCategoryFilter}
                  onChange={(e) => setEquipmentCategoryFilter(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
                >
                  {equipmentCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-gold hover:text-black text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                title="Print Price List"
              >
                <Printer className="w-3.5 h-3.5" /> Print Catalog
              </button>
            </div>
          )}
        </div>

        {/* Category Pills Bar */}
        {viewMode === 'grid' ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                    : 'bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white hover:border-gold/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {equipmentCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setEquipmentCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  equipmentCategoryFilter === cat
                    ? 'bg-gold text-black font-bold'
                    : 'bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white hover:border-gold/30'
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
            <div className="text-center py-20 bg-neutral-900/40 rounded-3xl border border-white/10">
              <Filter className="w-12 h-12 text-gold/40 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold text-white mb-2">No matching products found</h3>
              <p className="text-xs text-neutral-400 mb-6">Try clearing filters or search terms.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setPriceMax(500000);
                }}
                className="px-5 py-2.5 rounded-xl bg-gold text-black text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const isWishlisted = wishlistIds.includes(product.id);

                return (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -6 }}
                    className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-gold/50 hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] transition-all group relative"
                  >
                    {/* Image & Badges Overlay */}
                    <div className="relative h-64 overflow-hidden bg-black/60">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        {product.discount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                            {product.discount}% OFF
                          </span>
                        )}
                        {product.has3dViewer && (
                          <span className="px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-gold/50 text-gold text-[10px] font-bold flex items-center gap-1 shadow">
                            <Box className="w-3 h-3" /> 3D Viewer
                          </span>
                        )}
                        {product.has360View && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-bold flex items-center gap-1 shadow">
                            <Rotate3d className="w-3 h-3" /> 360° View
                          </span>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button
                        onClick={() => onToggleWishlist(product)}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 cursor-pointer ${
                          isWishlisted
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'bg-black/60 text-white hover:text-red-400'
                        }`}
                        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      {/* Quick View Hover Trigger Overlay */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => onSelectProduct(product)}
                          className="px-4 py-2 rounded-xl bg-gold text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> 3D Quick View
                        </button>
                      </div>
                    </div>

                    {/* Product Details Content */}
                    <div className="p-5 flex flex-col flex-1 justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gold font-mono">
                            {product.category}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{product.rating}</span>
                            <span className="text-[10px] text-neutral-500 font-normal">
                              ({product.reviewsCount})
                            </span>
                          </div>
                        </div>

                        <h3
                          onClick={() => onSelectProduct(product)}
                          className="text-sm font-serif font-bold text-white mb-2 line-clamp-2 hover:text-gold transition-colors cursor-pointer"
                        >
                          {product.name}
                        </h3>

                        <p className="text-xs text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div>
                        {/* Price Tag */}
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-lg font-bold text-white font-mono">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="text-xs text-neutral-500 line-through font-mono">
                              ₹{product.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onAddToCart(product)}
                            className="w-full py-2 rounded-xl bg-white/10 hover:bg-gold hover:text-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" /> Add
                          </button>
                          <button
                            onClick={() => onRequestQuote(product.name)}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> Quote
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
          <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Table Header Banner */}
            <div className="bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 border-b border-white/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest mb-1">
                  <ChefHat className="w-4 h-4" /> Commercial Kitchen Equipment Catalog & Rates
                </div>
                <h3 className="text-xl font-serif font-bold text-white">
                  Heavy-Duty Commercial Kitchen Equipment Price Directory
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Official quotation table with realistic Indian market rates for 304 Grade Stainless Steel equipment.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-neutral-400 font-mono">
                  Showing {filteredEquipment.length} Equipment Models
                </span>
              </div>
            </div>

            {/* Responsive Table Wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950/90 border-b border-white/10 text-neutral-300 uppercase tracking-wider font-mono text-[11px]">
                    <th className="py-4 px-4 font-bold">Image</th>
                    <th className="py-4 px-4 font-bold min-w-[200px]">Product Name</th>
                    <th className="py-4 px-4 font-bold min-w-[280px]">Specification</th>
                    <th className="py-4 px-4 font-bold whitespace-nowrap">Unit</th>
                    <th className="py-4 px-4 font-bold whitespace-nowrap text-gold">Price (₹)</th>
                    <th className="py-4 px-4 font-bold min-w-[160px]">Warranty</th>
                    <th className="py-4 px-4 font-bold text-right min-w-[130px]">Quotation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEquipment.map((item, idx) => (
                    <tr 
                      key={item.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setPreviewImage(item)}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-white/15 bg-black/60 relative group/thumb cursor-pointer block"
                          title="Click to zoom image"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                            <ImageIcon className="w-3.5 h-3.5 text-gold" />
                          </div>
                        </button>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono text-gold/80 block uppercase tracking-wider mb-0.5">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-white text-sm group-hover:text-gold transition-colors">
                          {item.name}
                        </h4>
                      </td>

                      {/* Specification */}
                      <td className="py-3 px-4 text-neutral-300 leading-relaxed font-normal">
                        {item.specification}
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 text-neutral-300 font-mono whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[11px]">
                          {item.unit}
                        </span>
                      </td>

                      {/* Price Range */}
                      <td className="py-3 px-4 font-mono font-bold text-gold text-sm whitespace-nowrap">
                        {item.priceRange}
                      </td>

                      {/* Warranty */}
                      <td className="py-3 px-4 text-neutral-300">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                          {item.warranty}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onRequestQuote(`${item.name} (${item.priceRange})`)}
                          className="px-3 py-1.5 rounded-lg bg-gold hover:bg-amber-400 text-black font-bold text-xs shadow hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Request Quote
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEquipment.length === 0 && (
              <div className="text-center py-16 text-neutral-400">
                <ChefHat className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-sm font-semibold">No commercial equipment matched your filter.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setEquipmentCategoryFilter('All');
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-gold text-black text-xs font-bold"
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
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setPreviewImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-white hover:text-gold z-10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative h-80 bg-black">
                  <img
                    src={previewImage.image}
                    alt={previewImage.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-gold font-mono font-bold text-sm border border-gold/40">
                    {previewImage.priceRange}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-white mb-2">
                    {previewImage.name}
                  </h3>
                  <p className="text-sm text-neutral-300 mb-6">
                    {previewImage.specification}
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const name = previewImage.name;
                        setPreviewImage(null);
                        onRequestQuote(`${name} (${previewImage.priceRange})`);
                      }}
                      className="flex-1 py-3 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-colors cursor-pointer"
                    >
                      Get Instant Factory Quote
                    </button>
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="px-5 py-3 rounded-xl bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REQUESTED FOOTER BLOCK */}
        <div className="mt-20 pt-10 border-t border-white/15 text-center bg-gradient-to-b from-transparent to-black/40 p-8 rounded-3xl">
          <h3 className="text-2xl font-serif font-bold text-gold tracking-wide mb-3">
            Royal Epic Interior & Furniture
          </h3>
          <p className="text-xs text-neutral-400 font-mono uppercase tracking-widest mb-6">
            Complete Turnkey Hospitality, Residential & Commercial Interior Manufacturing
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-neutral-200 font-medium max-w-4xl mx-auto leading-relaxed">
            <span className="hover:text-gold transition-colors">Complete Restaurant Kitchen Setup</span>
            <span className="text-gold/50">•</span>
            <span className="hover:text-gold transition-colors">Cloud Kitchen Setup</span>
            <span className="text-gold/50">•</span>
            <span className="hover:text-gold transition-colors">Hotel Kitchen Equipment</span>
            <span className="text-gold/50">•</span>
            <span className="hover:text-gold transition-colors">Restaurant Furniture Manufacturing</span>
            <span className="text-gold/50">•</span>
            <span className="hover:text-gold transition-colors">Stainless Steel Fabrication</span>
            <span className="text-gold/50">•</span>
            <span className="hover:text-gold transition-colors">Custom Kitchen Design & Installation</span>
          </div>
        </div>

      </div>
    </section>
  );
};

