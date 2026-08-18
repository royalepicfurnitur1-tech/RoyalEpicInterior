import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Filter, RefreshCw, Edit, Trash2, CheckCircle2, 
  Upload, Save, X, Eye, Layers, Check, AlertCircle, LayoutGrid,
  Table as TableIcon, Box, Image as ImageIcon, ArrowLeft, Tag,
  FolderPlus, Grid, ChevronRight, Hash, ShieldCheck
} from 'lucide-react';
import { 
  CategoryItem, SubCategoryItem, ProductItem,
  getCategories, saveCategory, deleteCategory,
  getSubCategories, saveSubCategory, deleteSubCategory,
  getAddonProducts, saveAddonProduct, deleteAddonProduct
} from '../services/productManagementService';

interface ProductManagementModuleProps {
  onBackToWebsite?: () => void;
}

export const ProductManagementModule: React.FC<ProductManagementModuleProps> = ({
  onBackToWebsite
}) => {
  // Navigation tabs within the module
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories' | 'subcategories'>('products');

  // Data States
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductItem> | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryItem> | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // SubCategory Modal State
  const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState<boolean>(false);
  const [editingSubCategory, setEditingSubCategory] = useState<Partial<SubCategoryItem> | null>(null);
  const [isSavingSubCategory, setIsSavingSubCategory] = useState<boolean>(false);
  const [deletingSubCategoryId, setDeletingSubCategoryId] = useState<string | null>(null);

  // Gallery URL input temp state
  const [galleryUrlInput, setGalleryUrlInput] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load All Data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [catList, subList, prodList] = await Promise.all([
        getCategories(),
        getSubCategories(),
        getAddonProducts()
      ]);
      setCategories(catList);
      setSubCategories(subList);
      setProducts(prodList);
    } catch (e) {
      console.error('Failed to load product management data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.material.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
      const matchesStatus = selectedStatusFilter === 'All' || p.status === selectedStatusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  // Subcategories available for currently selected product category
  const availableSubCategories = useMemo(() => {
    if (!editingProduct?.category) return subCategories;
    const parentCat = categories.find(c => c.name === editingProduct.category);
    if (!parentCat) return subCategories;
    const matched = subCategories.filter(s => s.categoryId === parentCat.id);
    return matched.length > 0 ? matched : subCategories;
  }, [editingProduct?.category, categories, subCategories]);

  // PRODUCT HANDLERS
  const handleOpenAddProduct = () => {
    const defaultCat = categories[0]?.name || 'Modular Kitchens';
    const defaultParent = categories.find(c => c.name === defaultCat);
    const subList = defaultParent ? subCategories.filter(s => s.categoryId === defaultParent.id) : [];
    const defaultSub = subList[0]?.name || '';

    setEditingProduct({
      name: '',
      category: defaultCat,
      subCategory: defaultSub,
      sku: `RE-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      price: 45000,
      description: '',
      material: '18mm Marine Grade BWP Plywood',
      size: 'Custom Factory Dimensions',
      warranty: '10 Years Factory Guarantee',
      stock: 10,
      coverImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      galleryImages: [],
      status: 'Active'
    });
    setGalleryUrlInput('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: ProductItem) => {
    setEditingProduct({ ...prod, galleryImages: [...(prod.galleryImages || [])] });
    setGalleryUrlInput('');
    setIsProductModalOpen(true);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.category) {
      showNotification('error', 'Please enter Product Name and Category.');
      return;
    }
    setIsSavingProduct(true);
    try {
      const res = await saveAddonProduct(editingProduct);
      if (res.success) {
        showNotification('success', `Product "${editingProduct.name}" saved successfully.`);
        setIsProductModalOpen(false);
        setEditingProduct(null);
        await loadAllData();
      } else {
        showNotification('error', res.error || 'Failed to save product.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProductSubmit = async (id: string) => {
    try {
      const res = await deleteAddonProduct(id);
      if (res.success) {
        showNotification('success', 'Product deleted successfully.');
        setDeletingProductId(null);
        await loadAllData();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // CATEGORY HANDLERS
  const handleOpenAddCategory = () => {
    setEditingCategory({
      name: '',
      slug: '',
      description: ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory({ ...cat });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    setIsSavingCategory(true);
    try {
      const res = await saveCategory(editingCategory);
      if (res.success) {
        showNotification('success', `Category "${editingCategory.name}" saved.`);
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        await loadAllData();
      } else {
        showNotification('error', res.error || 'Failed to save category.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategorySubmit = async (id: string) => {
    try {
      const res = await deleteCategory(id);
      if (res.success) {
        showNotification('success', 'Category deleted.');
        setDeletingCategoryId(null);
        await loadAllData();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // SUBCATEGORY HANDLERS
  const handleOpenAddSubCategory = () => {
    setEditingSubCategory({
      categoryId: categories[0]?.id || 'cat-1',
      name: '',
      slug: '',
      description: ''
    });
    setIsSubCategoryModalOpen(true);
  };

  const handleOpenEditSubCategory = (sub: SubCategoryItem) => {
    setEditingSubCategory({ ...sub });
    setIsSubCategoryModalOpen(true);
  };

  const handleSaveSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubCategory?.name || !editingSubCategory?.categoryId) return;
    setIsSavingSubCategory(true);
    try {
      const res = await saveSubCategory(editingSubCategory);
      if (res.success) {
        showNotification('success', `Sub Category "${editingSubCategory.name}" saved.`);
        setIsSubCategoryModalOpen(false);
        setEditingSubCategory(null);
        await loadAllData();
      } else {
        showNotification('error', res.error || 'Failed to save sub category.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSavingSubCategory(false);
    }
  };

  const handleDeleteSubCategorySubmit = async (id: string) => {
    try {
      const res = await deleteSubCategory(id);
      if (res.success) {
        showNotification('success', 'Sub Category deleted.');
        setDeletingSubCategoryId(null);
        await loadAllData();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col selection:bg-gold selection:text-black">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToWebsite && (
            <button
              onClick={onBackToWebsite}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 cursor-pointer transition-colors"
              title="Back to Website"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                product.royalepic.com
              </span>
              <span className="text-xs text-neutral-400 font-mono">Product Management Module</span>
            </div>
            <h1 className="text-lg font-serif font-bold text-white tracking-wide">
              Product & Category Management
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10 cursor-pointer transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-gold' : ''}`} />
          </button>

          {activeSubTab === 'products' && (
            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 bg-gradient-to-r from-gold to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-black text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-gold/20 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Product</span>
            </button>
          )}

          {activeSubTab === 'categories' && (
            <button
              onClick={handleOpenAddCategory}
              className="px-4 py-2 bg-gold hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Category</span>
            </button>
          )}

          {activeSubTab === 'subcategories' && (
            <button
              onClick={handleOpenAddSubCategory}
              className="px-4 py-2 bg-gold hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Sub Category</span>
            </button>
          )}
        </div>
      </header>

      {/* Notification Banner */}
      {notification && (
        <div className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
          notification.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' : 'bg-red-950/80 text-red-300 border-red-500/30'
        }`}>
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Module Sub-Tabs Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 p-1 bg-black/60 border border-white/10 rounded-2xl">
            <button
              onClick={() => setActiveSubTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'products' ? 'bg-gold text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('categories')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'categories' ? 'bg-gold text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Categories ({categories.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('subcategories')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'subcategories' ? 'bg-gold text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Sub Categories ({subCategories.length})</span>
            </button>
          </div>

          {activeSubTab === 'products' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl border text-xs cursor-pointer ${
                  viewMode === 'table' ? 'bg-neutral-800 border-gold text-gold' : 'border-white/10 text-neutral-400'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl border text-xs cursor-pointer ${
                  viewMode === 'grid' ? 'bg-neutral-800 border-gold text-gold' : 'border-white/10 text-neutral-400'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 1. PRODUCTS TAB */}
        {activeSubTab === 'products' && (
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-neutral-900/60 p-3.5 rounded-2xl border border-white/10">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Product Name, SKU, Category, Material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-gold rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-gold rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-gold rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Products Content */}
            {isLoading ? (
              <div className="p-12 text-center text-neutral-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gold mb-2" />
                <p className="text-xs font-mono">Loading product items...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 rounded-2xl bg-neutral-900/40 border border-white/10 text-center space-y-3">
                <Package className="w-10 h-10 mx-auto text-neutral-600" />
                <p className="text-sm font-bold text-white">No Products Found</p>
                <p className="text-xs text-neutral-400">Try changing your search or filters, or add a new product.</p>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer hover:bg-amber-400"
                >
                  <Plus className="w-4 h-4" /> + Add First Product
                </button>
              </div>
            ) : viewMode === 'table' ? (
              <div className="bg-neutral-900/90 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-black/60 text-[11px] uppercase tracking-wider text-neutral-400 border-b border-white/10 font-mono">
                      <tr>
                        <th className="p-3.5">Product & SKU</th>
                        <th className="p-3.5">Category & Sub Category</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Stock</th>
                        <th className="p-3.5">Material & Specs</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Product Image & Name & SKU */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img 
                                src={p.coverImage || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80'} 
                                alt={p.name}
                                className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0 bg-neutral-950"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h4 className="font-bold text-white text-xs leading-snug">{p.name}</h4>
                                <span className="text-[10px] font-mono text-gold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/30 mt-0.5 inline-block">
                                  {p.sku || 'NO-SKU'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category & Sub Category */}
                          <td className="p-3.5">
                            <span className="font-bold text-white text-xs block">{p.category}</span>
                            <span className="text-[11px] text-neutral-400">{p.subCategory || '—'}</span>
                          </td>

                          {/* Price */}
                          <td className="p-3.5">
                            <span className="font-bold text-white font-mono text-sm">
                              ₹{p.price.toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Stock */}
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              p.stock > 5 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 
                              (p.stock > 0 ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-red-950 text-red-400 border border-red-500/30')
                            }`}>
                              {p.stock} Units
                            </span>
                          </td>

                          {/* Material & Specs */}
                          <td className="p-3.5 text-neutral-300">
                            <div className="text-[11px] truncate max-w-[180px]" title={p.material}>{p.material || 'Standard Plywood'}</div>
                            <div className="text-[10px] text-neutral-400">{p.size || 'Custom Size'} • {p.warranty || 'Factory Guarantee'}</div>
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              (p.status === 'Draft' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400 border border-white/10')
                            }`}>
                              {p.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/20 cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingProductId(p.id)}
                                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-500/20 cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="bg-neutral-900/90 rounded-2xl border border-white/10 overflow-hidden hover:border-gold/40 transition-all flex flex-col justify-between group shadow-lg">
                    <div>
                      <div className="relative h-44 w-full bg-neutral-950 overflow-hidden">
                        <img 
                          src={p.coverImage} 
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-gold font-bold border border-gold/40">
                            {p.sku}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            p.status === 'Active' ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-500/40' : 'bg-neutral-900/90 text-neutral-400'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="text-[10px] text-gold uppercase font-bold tracking-wider">
                          {p.category} {p.subCategory && `• ${p.subCategory}`}
                        </div>
                        <h4 className="font-bold text-white text-xs line-clamp-1">{p.name}</h4>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-bold text-white font-mono">₹{p.price.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-mono text-neutral-400">{p.stock} in stock</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenEditProduct(p)}
                        className="flex-1 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingProductId(p.id)}
                        className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-500/20 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. CATEGORIES TAB */}
        {activeSubTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Categories ({categories.length})</h3>
                <p className="text-xs text-neutral-400">Master product categories used across the catalog and website.</p>
              </div>
              <button
                onClick={handleOpenAddCategory}
                className="px-4 py-2 bg-gold hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const associatedSubCount = subCategories.filter(s => s.categoryId === cat.id).length;
                const associatedProdCount = products.filter(p => p.category === cat.name).length;

                return (
                  <div key={cat.id} className="p-5 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-gold/40 transition-all flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-gold uppercase">{cat.slug}</span>
                        <span className="text-[10px] font-mono text-neutral-400">{associatedProdCount} Products</span>
                      </div>
                      <h4 className="text-base font-serif font-bold text-white">{cat.name}</h4>
                      {cat.description && (
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{cat.description}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-neutral-400">
                        <Layers className="w-3.5 h-3.5 text-gold" />
                        <span>{associatedSubCount} Sub Categories attached</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingCategoryId(cat.id)}
                        className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-500/20 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. SUBCATEGORIES TAB */}
        {activeSubTab === 'subcategories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Sub Categories ({subCategories.length})</h3>
                <p className="text-xs text-neutral-400">Hierarchical sub-groupings linked directly to Parent Categories.</p>
              </div>
              <button
                onClick={handleOpenAddSubCategory}
                className="px-4 py-2 bg-gold hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add Sub Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subCategories.map((sub) => {
                const parentCat = categories.find(c => c.id === sub.categoryId);
                const associatedProdCount = products.filter(p => p.subCategory === sub.name).length;

                return (
                  <div key={sub.id} className="p-5 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-gold/40 transition-all flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                          {parentCat ? parentCat.name : 'Unassigned'}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">{associatedProdCount} Products</span>
                      </div>
                      <h4 className="text-base font-serif font-bold text-white mt-2">{sub.name}</h4>
                      <span className="text-[11px] font-mono text-neutral-500 block mt-0.5">Slug: {sub.slug}</span>
                      {sub.description && (
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{sub.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleOpenEditSubCategory(sub)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingSubCategoryId(sub.id)}
                        className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-500/20 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT PRODUCT */}
      {/* ============================================================ */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-gold/40 rounded-3xl p-6 sm:p-8 max-w-3xl w-full text-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono text-gold uppercase tracking-wider font-bold">Product Catalog CMS</span>
                <h3 className="text-xl font-serif font-bold text-white mt-0.5">
                  {editingProduct.id?.startsWith('prod-addon-') && !editingProduct.name ? '+ Add New Product' : `Edit Product: ${editingProduct.name || 'Untitled'}`}
                </h3>
              </div>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs">
              {/* Product Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Imperial Italian Acrylic Island Kitchen Suite"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="RE-KIT-001"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Category & Sub Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Category *</label>
                  <select
                    value={editingProduct.category || categories[0]?.name || ''}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const parent = categories.find(c => c.name === newCat);
                      const subList = parent ? subCategories.filter(s => s.categoryId === parent.id) : [];
                      setEditingProduct({ 
                        ...editingProduct, 
                        category: newCat,
                        subCategory: subList[0]?.name || ''
                      });
                    }}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Sub Category</label>
                  <select
                    value={editingProduct.subCategory || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subCategory: e.target.value })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                  >
                    <option value="">-- Select Sub Category --</option>
                    {availableSubCategories.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Stock & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="95000"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={editingProduct.stock ?? 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Status</label>
                  <select
                    value={editingProduct.status || 'Active'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed specifications, design elements, and ergonomics of the product..."
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              {/* Material, Size, Warranty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Material</label>
                  <input
                    type="text"
                    placeholder="e.g. 18mm BWP Marine Plywood + Acrylic"
                    value={editingProduct.material || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Size / Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 8ft x 4ft Table + 8 Chairs"
                    value={editingProduct.size || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, size: e.target.value })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Warranty</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Years Factory Guarantee"
                    value={editingProduct.warranty || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, warranty: e.target.value })}
                    className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Cover Image Upload & URL */}
              <div className="bg-black/50 border border-gold/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gold uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Cover Image (PNG / JPG / URL) *
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">Primary Product Image</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gold/40 hover:border-gold rounded-xl bg-gold/5 cursor-pointer text-center group transition-colors">
                      <Upload className="w-5 h-5 text-gold mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-gold">Upload Image File</span>
                      <span className="text-[10px] text-neutral-400">Direct PNG / JPG / WebP</span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditingProduct({
                                ...editingProduct,
                                coverImage: reader.result as string
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-neutral-400 block font-bold uppercase">Or Web Image URL</span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={editingProduct.coverImage || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, coverImage: e.target.value })}
                      className="w-full bg-black/80 border border-white/15 focus:border-gold rounded-xl p-2.5 text-xs text-white focus:outline-none"
                    />
                    {editingProduct.coverImage && (
                      <div className="flex items-center gap-2 pt-1">
                        <img 
                          src={editingProduct.coverImage} 
                          alt="Cover Preview" 
                          className="w-12 h-12 object-cover rounded-lg border border-gold/40" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] text-emerald-400 font-bold">✓ Cover Image Set</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                <label className="text-[11px] font-bold text-neutral-300 uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-gold" /> Gallery Images
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Paste gallery image URL..."
                    value={galleryUrlInput}
                    onChange={(e) => setGalleryUrlInput(e.target.value)}
                    className="flex-1 bg-black/80 border border-white/15 focus:border-gold rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (galleryUrlInput.trim()) {
                        setEditingProduct({
                          ...editingProduct,
                          galleryImages: [...(editingProduct.galleryImages || []), galleryUrlInput.trim()]
                        });
                        setGalleryUrlInput('');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold text-xs font-bold cursor-pointer"
                  >
                    + Add Image
                  </button>
                </div>

                {editingProduct.galleryImages && editingProduct.galleryImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {editingProduct.galleryImages.map((imgUrl, gIdx) => (
                      <div key={gIdx} className="relative group">
                        <img 
                          src={imgUrl} 
                          alt={`Gallery ${gIdx + 1}`} 
                          className="w-16 h-16 object-cover rounded-xl border border-white/15"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingProduct.galleryImages || []).filter((_, i) => i !== gIdx);
                            setEditingProduct({ ...editingProduct, galleryImages: updated });
                          }}
                          className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-600 text-white text-[10px] hover:bg-red-500 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsProductModalOpen(false)} 
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingProduct} 
                  className="px-6 py-2.5 rounded-xl bg-gold hover:bg-amber-400 text-black font-bold uppercase cursor-pointer transition-colors shadow-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSavingProduct ? 'Saving Product...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ============================================================ */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-gold/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-serif font-bold text-white">
                {editingCategory.id ? 'Edit Category' : '+ Add New Category'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCategorySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modular Kitchens"
                  value={editingCategory.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditingCategory({ 
                      ...editingCategory, 
                      name, 
                      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-') 
                    });
                  }}
                  className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Category Slug</label>
                <input
                  type="text"
                  placeholder="modular-kitchens"
                  value={editingCategory.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of this category..."
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsCategoryModalOpen(false)} 
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingCategory} 
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-amber-400 text-black font-bold uppercase flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSavingCategory ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT SUBCATEGORY */}
      {/* ============================================================ */}
      {isSubCategoryModalOpen && editingSubCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-gold/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-serif font-bold text-white">
                {editingSubCategory.id ? 'Edit Sub Category' : '+ Add New Sub Category'}
              </h3>
              <button onClick={() => setIsSubCategoryModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveSubCategorySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Parent Category *</label>
                <select
                  value={editingSubCategory.categoryId || categories[0]?.id || ''}
                  onChange={(e) => setEditingSubCategory({ ...editingSubCategory, categoryId: e.target.value })}
                  className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Sub Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Island Kitchens"
                  value={editingSubCategory.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditingSubCategory({ 
                      ...editingSubCategory, 
                      name, 
                      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-') 
                    });
                  }}
                  className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Slug</label>
                <input
                  type="text"
                  placeholder="island-kitchens"
                  value={editingSubCategory.slug || ''}
                  onChange={(e) => setEditingSubCategory({ ...editingSubCategory, slug: e.target.value })}
                  className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsSubCategoryModalOpen(false)} 
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingSubCategory} 
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-amber-400 text-black font-bold uppercase flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSavingSubCategory ? 'Saving...' : 'Save Sub Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION DIALOGS */}
      {/* ============================================================ */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full text-center text-white shadow-2xl">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h4 className="text-lg font-serif font-bold text-white mb-2">Delete Product?</h4>
            <p className="text-xs text-neutral-400 mb-6">Are you sure you want to delete this product item?</p>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => setDeletingProductId(null)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold">Cancel</button>
              <button onClick={() => handleDeleteProductSubmit(deletingProductId)} className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {deletingCategoryId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full text-center text-white shadow-2xl">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h4 className="text-lg font-serif font-bold text-white mb-2">Delete Category?</h4>
            <p className="text-xs text-neutral-400 mb-6">Are you sure you want to delete this category?</p>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => setDeletingCategoryId(null)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold">Cancel</button>
              <button onClick={() => handleDeleteCategorySubmit(deletingCategoryId)} className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {deletingSubCategoryId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full text-center text-white shadow-2xl">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h4 className="text-lg font-serif font-bold text-white mb-2">Delete Sub Category?</h4>
            <p className="text-xs text-neutral-400 mb-6">Are you sure you want to delete this sub category?</p>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => setDeletingSubCategoryId(null)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold">Cancel</button>
              <button onClick={() => handleDeleteSubCategorySubmit(deletingSubCategoryId)} className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
