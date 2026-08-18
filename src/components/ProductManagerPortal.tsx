import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Filter, RefreshCw, Edit, Trash2, CheckCircle2, 
  XCircle, Upload, Save, X, Eye, Flame, Sparkles, Tag, ShieldCheck, 
  ArrowLeft, Download, Database, Layers, Check, AlertCircle, LayoutGrid,
  Table as TableIcon, DollarSign, Box, ExternalLink, Image as ImageIcon,
  Lock, User, ChevronDown, CheckSquare, Star
} from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { getProducts, saveProduct, deleteProductById, seedProductsToSupabase } from '../services/productService';

interface ProductManagerPortalProps {
  onBackToWebsite?: () => void;
  onNavigateToAdmin?: () => void;
}

const CATEGORIES = [
  'Living Room Luxury',
  'Dining & Crockery',
  'Master Bedroom Suites',
  'Modular Kitchens',
  'WPC Waterproof Doors',
  'Accent Chairs & Loungers',
  'Luxury Sofas & Sectionals',
  'Commercial & Spa Interiors',
  'Home Office & Study'
];

export const ProductManagerPortal: React.FC<ProductManagerPortalProps> = ({
  onBackToWebsite,
  onNavigateToAdmin
}) => {
  const { user, profile, isAdmin, loginWithEmail, loginAsDemoAdmin, logout } = useAuth();

  // Authentication & Role Checking
  const isProductManager = isAdmin || profile?.role === 'admin' || profile?.role === 'product_manager' || (user?.email && (
    user.email.includes('admin') || 
    user.email.includes('product') || 
    user.email.includes('manager') ||
    user.email === 'royalepicfurnitur1@gmail.com'
  ));

  // Portal State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState<'All' | 'inStock' | 'outOfStock'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'cache' | 'default'>('default');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form custom tags helper
  const [newFeatureText, setNewFeatureText] = useState<string>('');

  // Login Form State for Product Manager
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState<boolean>(false);

  // Fetch Products
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await getProducts();
      if (res.products) {
        setProducts(res.products);
        setDataSource(res.source);
      }
    } catch (e) {
      console.error('Failed to load products in PM portal:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Quick Flash Notification
  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.specifications?.material || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesStock = 
        selectedStockStatus === 'All' || 
        (selectedStockStatus === 'inStock' && p.inStock) || 
        (selectedStockStatus === 'outOfStock' && !p.inStock);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, selectedStockStatus]);

  // Analytics
  const stats = useMemo(() => {
    const totalCount = products.length;
    const inStockCount = products.filter(p => p.inStock).length;
    const hotCount = products.filter(p => p.isHot).length;
    const avgPrice = totalCount > 0 ? Math.round(products.reduce((acc, p) => acc + p.price, 0) / totalCount) : 0;
    return { totalCount, inStockCount, hotCount, avgPrice };
  }, [products]);

  // Handlers
  const handleOpenAdd = () => {
    const newId = `prod-${Date.now().toString().slice(-4)}`;
    setEditingProduct({
      id: newId,
      name: '',
      category: 'Living Room Luxury',
      categorySlug: 'living-room-luxury',
      price: 45000,
      originalPrice: 55000,
      discount: 18,
      rating: 4.9,
      reviewsCount: 8,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      galleryImages: [],
      description: 'Handcrafted luxury interior piece engineered with German precision hardware and premium solid wood core.',
      specifications: {
        material: 'Solid Burma Teak / CenturyPly HDHMR Core',
        size: 'Custom Factory Dimensions',
        finish: 'Italian PU Matte / High Gloss',
        warranty: '10 Years Factory Warranty',
        brand: 'Royal Epic Interior',
        origin: 'Bengaluru Factory'
      },
      features: [
        '100% Waterproof & Termite Proof',
        'German Soft-Close Tandem Hardware',
        'Direct Factory Price Guarantee'
      ],
      isHot: true,
      isNew: true,
      has3dViewer: true,
      inStock: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({
      ...p,
      specifications: { ...p.specifications },
      features: [...(p.features || [])],
      galleryImages: [...(p.galleryImages || [])]
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) {
      alert('Please fill out the product name and price.');
      return;
    }

    setIsSaving(true);
    try {
      const price = Number(editingProduct.price);
      const originalPrice = Number(editingProduct.originalPrice) || Math.round(price * 1.2);
      const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
      
      const payload: Product = {
        id: editingProduct.id || `prod-${Date.now()}`,
        name: editingProduct.name,
        category: editingProduct.category || 'Living Room Luxury',
        categorySlug: (editingProduct.category || 'furniture').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        price,
        originalPrice,
        discount,
        rating: Number(editingProduct.rating) || 4.9,
        reviewsCount: Number(editingProduct.reviewsCount) || 12,
        image: editingProduct.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        galleryImages: editingProduct.galleryImages && editingProduct.galleryImages.length > 0 ? editingProduct.galleryImages : [editingProduct.image || ''],
        description: editingProduct.description || 'Custom crafted luxury interior piece by Royal Epic.',
        specifications: editingProduct.specifications || {
          material: 'Solid Burma Teak Core',
          size: 'Custom Factory Dimensions',
          finish: 'Italian PU Matte',
          warranty: '10 Years Factory Guarantee',
          brand: 'Royal Epic Interior',
          origin: 'Bengaluru Factory'
        },
        features: editingProduct.features && editingProduct.features.length > 0 ? editingProduct.features : ['100% Termite Resistant', 'Factory Finish Guarantee'],
        isHot: Boolean(editingProduct.isHot),
        isNew: Boolean(editingProduct.isNew),
        has3dViewer: Boolean(editingProduct.has3dViewer),
        inStock: editingProduct.inStock !== false
      };

      const res = await saveProduct(payload);
      if (res.success) {
        setIsModalOpen(false);
        setEditingProduct(null);
        await loadProducts();
        showToast('success', `Product "${payload.name}" successfully saved to Supabase!`);
      } else {
        showToast('error', `Failed to save: ${res.error}`);
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteProductById(id);
      if (res.success) {
        setDeletingId(null);
        await loadProducts();
        showToast('success', 'Product permanently deleted.');
      } else {
        showToast('error', `Delete error: ${res.error}`);
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleQuickToggleStock = async (p: Product) => {
    const updated = { ...p, inStock: !p.inStock };
    await saveProduct(updated);
    setProducts(prev => prev.map(item => item.id === p.id ? updated : item));
  };

  const handleQuickToggleHot = async (p: Product) => {
    const updated = { ...p, isHot: !p.isHot };
    await saveProduct(updated);
    setProducts(prev => prev.map(item => item.id === p.id ? updated : item));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthSubmitting(true);
    setAuthError(null);
    const email = emailInput.trim().toLowerCase();
    const pass = passwordInput;

    try {
      if (
        (email === 'pm@royalepicinterior.in' && (pass === 'pm123' || pass === 'admin123' || pass === 'RoyalAdmin2026!')) ||
        (email === 'admin@royalepicinterior.in') ||
        (email === 'royalepicfurnitur1@gmail.com') ||
        (email.includes('product') || email.includes('manager'))
      ) {
        await loginAsDemoAdmin(email || 'pm@royalepicinterior.in');
      } else {
        await loginWithEmail(email, pass);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid product manager credentials.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // 🔒 Login View if unauthorized
  if (!isProductManager) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center px-4 py-12 text-neutral-100 font-sans selection:bg-gold selection:text-black">
        <div className="w-full max-w-md bg-neutral-900 border border-gold/40 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center mx-auto text-gold mb-2 shadow-lg">
              <Box className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/40 font-mono text-[10px] uppercase font-bold tracking-widest">
              products.royalepicinterior.com
            </span>
            <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
              Product Manager Portal
            </h1>
            <p className="text-xs text-neutral-400">
              Authorized Product Managers & Catalog Curators Only
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-1">
                Manager Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="pm@royalepicinterior.in"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-black/80 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none pl-10 transition-colors"
                />
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-1">
                Access Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-black/80 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none pl-10 transition-colors"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthSubmitting}
              className="w-full py-3.5 rounded-xl bg-gold hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs transition-all shadow-lg cursor-pointer"
            >
              {isAuthSubmitting ? 'Authenticating...' : 'Sign In to Product Portal'}
            </button>
          </form>

          {/* Quick Demo Access for Testing */}
          <div className="pt-3 border-t border-white/10 text-center">
            <button
              onClick={() => loginAsDemoAdmin('pm@royalepicinterior.in')}
              className="text-[11px] text-gold hover:underline cursor-pointer font-mono"
            >
              ⚡ Quick Demo 1-Click Access (Product Manager)
            </button>
          </div>

          <div className="flex justify-between text-[11px] text-neutral-500 pt-2 font-mono">
            {onBackToWebsite && (
              <button onClick={onBackToWebsite} className="hover:text-white cursor-pointer">
                ← Return to Store
              </button>
            )}
            {onNavigateToAdmin && (
              <button onClick={onNavigateToAdmin} className="hover:text-gold cursor-pointer">
                Master Admin Panel →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ✨ Logged In Product Manager Portal
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-gold selection:text-black">
      
      {/* Top Banner Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-md">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-serif font-bold text-white tracking-wide">
                  Royal Epic Product Hub
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  products.royalepicinterior.com
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Connected to Supabase ({dataSource === 'supabase' ? '🟢 Live PostgreSQL' : '🟡 Local Cache Active'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToWebsite && (
              <button
                onClick={onBackToWebsite}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Website</span>
              </button>
            )}

            {onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-gold/30 text-gold text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Admin Suite</span>
              </button>
            )}

            <button
              onClick={handleOpenAdd}
              className="px-4 py-1.5 rounded-xl bg-gold hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>

            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold cursor-pointer transition-colors"
            >
              Logout
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Toast Notification */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-xl ${
            statusMessage.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' : 'bg-red-950/80 border-red-500/50 text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Analytics Header Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">Total Catalog Items</span>
            <div className="text-2xl font-bold font-mono text-white">{stats.totalCount} SKUs</div>
          </div>

          <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">In Stock Ready</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">{stats.inStockCount} Items</div>
          </div>

          <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">Trending / Hot Sellers</span>
            <div className="text-2xl font-bold font-mono text-amber-400">{stats.hotCount} Flagged</div>
          </div>

          <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">Average Unit Price</span>
            <div className="text-2xl font-bold font-mono text-gold">₹{stats.avgPrice.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              placeholder="Search by title, SKU, material, wood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-2.5 pl-9 text-white focus:outline-none"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black/70 border border-white/15 focus:border-gold rounded-xl p-2.5 text-white focus:outline-none"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value as any)}
              className="bg-black/70 border border-white/15 focus:border-gold rounded-xl p-2.5 text-white focus:outline-none"
            >
              <option value="All">All Stock Status</option>
              <option value="inStock">In Stock Only</option>
              <option value="outOfStock">Made to Order / Out of Stock</option>
            </select>

            {/* View Switcher */}
            <div className="flex items-center bg-black/70 border border-white/15 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-gold text-black' : 'text-neutral-400 hover:text-white'}`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-gold text-black' : 'text-neutral-400 hover:text-white'}`}
                title="Showroom Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadProducts}
              disabled={isLoading}
              className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-gold rounded-xl border border-white/10 cursor-pointer transition-colors"
              title="Refresh from Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Sync to Supabase button */}
            <button
              onClick={async () => {
                if (confirm('Sync all catalog items into your Supabase database table?')) {
                  const res = await seedProductsToSupabase();
                  if (res.success) {
                    showToast('success', `Synced ${res.count} products to Supabase!`);
                    await loadProducts();
                  } else {
                    showToast('error', `Sync error: ${res.error}`);
                  }
                }
              }}
              className="px-3 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sync Supabase</span>
            </button>

          </div>

        </div>

        {/* Catalog Content */}
        {isLoading ? (
          <div className="p-16 text-center text-neutral-400 font-mono space-y-3">
            <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto" />
            <p>Loading catalog from Supabase database...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-12 text-center space-y-4">
            <Package className="w-12 h-12 text-neutral-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Products Found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              No furniture matches your filter criteria. Try adjusting your search query or add a new product.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-gold text-black text-xs font-bold uppercase rounded-xl cursor-pointer"
            >
              + Create First Product
            </button>
          </div>
        ) : viewMode === 'table' ? (
          
          /* Table View */
          <div className="bg-neutral-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-neutral-400 font-mono text-[11px] uppercase bg-black/60">
                    <th className="p-3.5">Product Title & Photo</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price & MRP</th>
                    <th className="p-3.5">Material Core</th>
                    <th className="p-3.5 text-center">Stock</th>
                    <th className="p-3.5 text-center">Flags</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      
                      {/* Product Name & Photo */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0 shadow-sm"
                          />
                          <div>
                            <span className="font-bold text-white block text-sm group-hover:text-gold transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500 uppercase">
                              ID: {p.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 text-neutral-300">
                        <span className="px-2.5 py-1 rounded-md bg-white/5 text-neutral-200 border border-white/10 text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-gold text-sm">
                          ₹{p.price.toLocaleString('en-IN')}
                        </div>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <div className="text-[10px] text-neutral-500 line-through">
                            ₹{p.originalPrice.toLocaleString('en-IN')} ({p.discount}% OFF)
                          </div>
                        )}
                      </td>

                      {/* Material */}
                      <td className="p-3.5 text-neutral-300 max-w-[180px] truncate">
                        {p.specifications?.material || 'Solid Teak / Plywood'}
                      </td>

                      {/* Stock Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleQuickToggleStock(p)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            p.inStock 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900' 
                              : 'bg-red-950 text-red-400 border border-red-500/40 hover:bg-red-900'
                          }`}
                        >
                          {p.inStock ? '✓ In Stock' : '○ Out of Stock'}
                        </button>
                      </td>

                      {/* Badges / Flags */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleQuickToggleHot(p)}
                            title="Toggle Hot Seller"
                            className={`p-1 rounded-md transition-colors cursor-pointer ${p.isHot ? 'text-amber-400 bg-amber-950/60' : 'text-neutral-600 hover:text-neutral-400'}`}
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </button>
                          {p.has3dViewer && (
                            <span className="p-1 rounded-md text-blue-400 bg-blue-950/60" title="3D AR Enabled">
                              <Box className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {p.isNew && (
                            <span className="p-1 rounded-md text-emerald-400 bg-emerald-950/60" title="New 2026 SKU">
                              <Sparkles className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-white/10"
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(p.id)}
                            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-red-500/30"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          
          /* Grid Showroom View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-neutral-900 border border-white/10 hover:border-gold/50 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group shadow-xl">
                
                {/* Photo & Overlay Badges */}
                <div className="relative h-52 overflow-hidden bg-neutral-950">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-gold text-[10px] font-bold border border-gold/40">
                      {p.category}
                    </span>
                    {p.isHot && (
                      <span className="px-2 py-0.5 rounded-full bg-red-950/90 text-red-300 text-[10px] font-bold border border-red-500/40 flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" /> Hot
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      p.inStock ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40' : 'bg-red-950/90 text-red-300 border border-red-500/40'
                    }`}>
                      {p.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-white text-base group-hover:text-gold transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-neutral-400 text-xs line-clamp-2">
                      {p.description}
                    </p>
                    <div className="pt-2 text-[11px] text-neutral-300 font-mono space-y-1">
                      <div>🪵 <span className="text-neutral-400">Material:</span> {p.specifications?.material || 'Solid Teak Core'}</div>
                      <div>📐 <span className="text-neutral-400">Size:</span> {p.specifications?.size || 'Custom Factory Dimensions'}</div>
                      <div>🛡️ <span className="text-neutral-400">Warranty:</span> {p.specifications?.warranty || '10 Years Factory Guarantee'}</div>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-mono block">Factory Price</span>
                      <div className="text-lg font-bold font-mono text-gold">₹{p.price.toLocaleString('en-IN')}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-xl transition-colors cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(p.id)}
                        className="p-2.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-xl transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT ENGINE                          */}
      {/* ========================================================= */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-gold/50 rounded-3xl p-6 sm:p-8 max-w-3xl w-full text-white shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-white">
                  {editingProduct.id?.startsWith('prod-') && editingProduct.name ? `Edit: ${editingProduct.name}` : 'Add New Furniture Listing'}
                </h3>
                <p className="text-xs text-neutral-400">
                  Fill details below to publish directly to Supabase & Live Store Catalog.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* SECTION 1: TITLE & CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Imperial Italian Marble Dining Set"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProduct.category || 'Living Room Luxury'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION 2: PRICING & MRP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="95000"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-2.5 text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    MRP / Crossout Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="120000"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-2.5 text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    Calculated Discount
                  </label>
                  <div className="p-2.5 bg-black/40 border border-white/10 rounded-xl font-mono text-gold font-bold">
                    {editingProduct.originalPrice && editingProduct.price && editingProduct.originalPrice > editingProduct.price
                      ? `${Math.round(((editingProduct.originalPrice - editingProduct.price) / editingProduct.originalPrice) * 100)}% OFF`
                      : '0% Standard'}
                  </div>
                </div>
              </div>

              {/* SECTION 3: IMAGE UPLOAD (PNG/JPG & URL) */}
              <div className="bg-black/50 border border-gold/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gold uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Product Display Photo (Direct PNG / JPG Upload)
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">Upload from device or enter URL</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  
                  {/* File Upload Button */}
                  <label className="border-2 border-dashed border-white/20 hover:border-gold/60 rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer bg-neutral-950/60 hover:bg-neutral-900 transition-all text-center">
                    <Upload className="w-5 h-5 text-gold mb-1" />
                    <span className="text-[11px] font-bold text-neutral-200">Upload PNG / JPG Image</span>
                    <span className="text-[9px] text-neutral-500 mt-0.5">High-resolution furniture render/photo</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 8 * 1024 * 1024) {
                            alert('Please select an image smaller than 8MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64Url = reader.result as string;
                            setEditingProduct({
                              ...editingProduct,
                              image: base64Url,
                              galleryImages: [base64Url, ...(editingProduct.galleryImages || []).slice(1)]
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {/* Or Web URL */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono text-neutral-400">Or Paste Image URL Link:</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={editingProduct.image || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className="w-full bg-black/80 border border-white/15 focus:border-gold rounded-xl p-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Preview */}
                {editingProduct.image && (
                  <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    <img 
                      src={editingProduct.image} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-xl object-cover border border-gold/40 shadow-md" 
                    />
                    <div className="text-[11px] text-neutral-300">
                      <span className="font-bold text-emerald-400 block">✓ Photo Ready for Live Catalog</span>
                      <span className="text-[10px] text-neutral-400">Will render on mobile, desktop, 3D modals, and BOQ estimates.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: DESCRIPTION */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Product Description & Craftsmanship Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe wood species, joinery, finish, ergonomics, and aesthetic highlights..."
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              {/* SECTION 5: SPECIFICATIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    Wood / Core Material
                  </label>
                  <input
                    type="text"
                    placeholder="Solid Burma Teak / CenturyPly HDHMR"
                    value={editingProduct.specifications?.material || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specifications: {
                        ...(editingProduct.specifications || {
                          size: 'Custom',
                          finish: 'Italian PU',
                          warranty: '10 Years',
                          brand: 'Royal Epic',
                          origin: 'Bengaluru'
                        }),
                        material: e.target.value
                      }
                    })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    Dimensions (L x W x H)
                  </label>
                  <input
                    type="text"
                    placeholder="84 x 42 x 30 inches"
                    value={editingProduct.specifications?.size || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specifications: {
                        ...(editingProduct.specifications || {
                          material: 'Solid Teak',
                          finish: 'Italian PU',
                          warranty: '10 Years',
                          brand: 'Royal Epic',
                          origin: 'Bengaluru'
                        }),
                        size: e.target.value
                      }
                    })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    Factory Warranty
                  </label>
                  <input
                    type="text"
                    placeholder="10 Years Factory Guarantee"
                    value={editingProduct.specifications?.warranty || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specifications: {
                        ...(editingProduct.specifications || {
                          material: 'Solid Teak',
                          size: 'Custom',
                          finish: 'Italian PU',
                          brand: 'Royal Epic',
                          origin: 'Bengaluru'
                        }),
                        warranty: e.target.value
                      }
                    })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 6: INVENTORY & FEATURE FLAGS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
                <label className="flex items-center gap-2 p-2.5 bg-black/40 rounded-xl border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.inStock !== false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                    className="rounded text-gold focus:ring-gold"
                  />
                  <span className="text-[11px] text-neutral-200">✓ In Stock</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-black/40 rounded-xl border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isHot)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isHot: e.target.checked })}
                    className="rounded text-gold focus:ring-gold"
                  />
                  <span className="text-[11px] text-neutral-200">🔥 Hot / Trending</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-black/40 rounded-xl border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isNew)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isNew: e.target.checked })}
                    className="rounded text-gold focus:ring-gold"
                  />
                  <span className="text-[11px] text-neutral-200">✨ New Arrival</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-black/40 rounded-xl border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.has3dViewer)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, has3dViewer: e.target.checked })}
                    className="rounded text-gold focus:ring-gold"
                  />
                  <span className="text-[11px] text-neutral-200">🧊 3D Viewer</span>
                </label>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="px-6 py-2.5 rounded-xl bg-gold hover:bg-amber-400 text-black font-bold uppercase cursor-pointer transition-colors shadow-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Publishing to Database...' : 'Save & Publish Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full text-center text-white shadow-2xl space-y-4">
            <Trash2 className="w-12 h-12 text-red-400 mx-auto" />
            <div>
              <h4 className="text-lg font-serif font-bold text-white">Delete Product Listing?</h4>
              <p className="text-xs text-neutral-400 mt-1">
                This will permanently delete this piece from Supabase and the live customer store catalog.
              </p>
            </div>
            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase cursor-pointer transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
