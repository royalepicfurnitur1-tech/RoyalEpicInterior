import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Filter, RefreshCw, Edit, Trash2, CheckCircle2, 
  Upload, Save, X, Eye, Layers, Check, AlertCircle, LayoutGrid,
  Table as TableIcon, Box, Image as ImageIcon, ArrowLeft, Tag,
  FolderPlus, Grid, ChevronRight, Hash, ShieldCheck, SlidersHorizontal,
  PlusCircle, Sparkles
} from 'lucide-react';
import { 
  CategoryItem, SubCategoryItem, AttributeGroupItem, ProductItem,
  getCategories, saveCategory, deleteCategory,
  getSubCategories, saveSubCategory, deleteSubCategory,
  getAttributes, saveAttribute, deleteAttribute,
  getAddonProducts, saveAddonProduct, deleteAddonProduct
} from '../services/productManagementService';

interface ProductManagementModuleProps {
  onBackToWebsite?: () => void;
}

export const ProductManagementModule: React.FC<ProductManagementModuleProps> = ({
  onBackToWebsite
}) => {
  // Navigation tabs within the module
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories' | 'subcategories' | 'attributes'>('products');

  // Data States
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);
  const [attributes, setAttributes] = useState<AttributeGroupItem[]>([]);
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

  // Attribute Modal State
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState<boolean>(false);
  const [editingAttribute, setEditingAttribute] = useState<Partial<AttributeGroupItem> | null>(null);
  const [newAttributeValueInput, setNewAttributeValueInput] = useState<string>('');
  const [isSavingAttribute, setIsSavingAttribute] = useState<boolean>(false);
  const [deletingAttributeId, setDeletingAttributeId] = useState<string | null>(null);

  // Gallery URL input temp state
  const [galleryUrlInput, setGalleryUrlInput] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load All Data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [catList, subList, attrList, prodList] = await Promise.all([
        getCategories(),
        getSubCategories(),
        getAttributes(),
        getAddonProducts()
      ]);
      setCategories(catList);
      setSubCategories(subList);
      setAttributes(attrList);
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
        p.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(p.selectedAttributes || {}).some((vals: any) => 
          Array.isArray(vals) && vals.some((v: any) => typeof v === 'string' && v.toLowerCase().includes(searchQuery.toLowerCase()))
        );

      const matchesCategory = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
      const matchesStatus = selectedStatusFilter === 'All' || p.status === selectedStatusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  // Subcategories available for selected category in product modal
  const availableSubCategories = useMemo(() => {
    if (!editingProduct?.category) return [];
    const parentCat = categories.find(c => c.name === editingProduct.category);
    if (!parentCat) return [];
    return subCategories.filter(s => s.categoryId === parentCat.id);
  }, [editingProduct?.category, categories, subCategories]);

  // Image Upload helper (converts to base64 for direct browser and cloud persistence)
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditingProduct(prev => prev ? { ...prev, coverImage: reader.result as string } : null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add gallery image url
  const handleAddGalleryUrl = () => {
    if (!galleryUrlInput.trim()) return;
    setEditingProduct(prev => {
      if (!prev) return null;
      const current = prev.galleryImages || [];
      return { ...prev, galleryImages: [...current, galleryUrlInput.trim()] };
    });
    setGalleryUrlInput('');
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const current = [...(prev.galleryImages || [])];
      current.splice(idx, 1);
      return { ...prev, galleryImages: current };
    });
  };

  // Toggle attribute selection for product
  const handleToggleProductAttribute = (groupName: string, val: string) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      const currentMap = { ...(prev.selectedAttributes || {}) };
      const currentVals = currentMap[groupName] ? [...currentMap[groupName]] : [];
      const index = currentVals.indexOf(val);
      if (index >= 0) {
        currentVals.splice(index, 1);
      } else {
        currentVals.push(val);
      }
      if (currentVals.length > 0) {
        currentMap[groupName] = currentVals;
      } else {
        delete currentMap[groupName];
      }
      return { ...prev, selectedAttributes: currentMap };
    });
  };

  // PRODUCT HANDLERS
  const handleOpenAddProduct = () => {
    setEditingProduct({
      name: '',
      category: categories[0]?.name || 'Modular Kitchens',
      subCategory: '',
      sku: `RE-${Math.floor(1000 + Math.random() * 9000)}`,
      price: 0,
      description: '',
      material: '',
      size: '',
      warranty: '10 Years Warranty',
      stock: 10,
      coverImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      galleryImages: [],
      selectedAttributes: {},
      status: 'Active'
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: ProductItem) => {
    setEditingProduct({ 
      ...prod,
      galleryImages: prod.galleryImages ? [...prod.galleryImages] : [],
      selectedAttributes: prod.selectedAttributes ? { ...prod.selectedAttributes } : {}
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.category) return;
    setIsSavingProduct(true);
    try {
      const res = await saveAddonProduct(editingProduct);
      if (res.success) {
        showNotification('success', `Product "${editingProduct.name}" saved.`);
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
        showNotification('success', 'Product deleted.');
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

  // ATTRIBUTE HANDLERS
  const handleOpenAddAttribute = () => {
    setEditingAttribute({
      name: '',
      values: []
    });
    setNewAttributeValueInput('');
    setIsAttributeModalOpen(true);
  };

  const handleOpenEditAttribute = (attr: AttributeGroupItem) => {
    setEditingAttribute({
      id: attr.id,
      name: attr.name,
      values: [...(attr.values || [])],
      createdAt: attr.createdAt
    });
    setNewAttributeValueInput('');
    setIsAttributeModalOpen(true);
  };

  const handleAddAttributeValue = () => {
    if (!newAttributeValueInput.trim() || !editingAttribute) return;
    const val = newAttributeValueInput.trim();
    const current = editingAttribute.values || [];
    if (!current.includes(val)) {
      setEditingAttribute({ ...editingAttribute, values: [...current, val] });
    }
    setNewAttributeValueInput('');
  };

  const handleRemoveAttributeValue = (valToRemove: string) => {
    if (!editingAttribute) return;
    setEditingAttribute({
      ...editingAttribute,
      values: (editingAttribute.values || []).filter(v => v !== valToRemove)
    });
  };

  const handleSaveAttributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttribute?.name) return;
    setIsSavingAttribute(true);
    try {
      const res = await saveAttribute(editingAttribute);
      if (res.success) {
        showNotification('success', `Attribute "${editingAttribute.name}" saved.`);
        setIsAttributeModalOpen(false);
        setEditingAttribute(null);
        await loadAllData();
      } else {
        showNotification('error', res.error || 'Failed to save attribute.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSavingAttribute(false);
    }
  };

  const handleDeleteAttributeSubmit = async (id: string) => {
    try {
      const res = await deleteAttribute(id);
      if (res.success) {
        showNotification('success', 'Attribute deleted.');
        setDeletingAttributeId(null);
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
              Product & Attribute Management
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

          {activeSubTab === 'attributes' && (
            <button
              onClick={handleOpenAddAttribute}
              className="px-4 py-2 bg-gradient-to-r from-gold to-amber-400 hover:from-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Attribute Group</span>
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
          <div className="flex flex-wrap items-center gap-2 p-1 bg-black/60 border border-white/10 rounded-2xl">
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
              onClick={() => setActiveSubTab('attributes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'attributes' ? 'bg-gold text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Product Attributes ({attributes.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('categories')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'categories' ? 'bg-gold text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
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

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{products.filter(p => p.status === 'Active').length} Active Products</span>
            </span>
            <span>•</span>
            <span>{attributes.length} Attribute Groups</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 1. PRODUCTS TAB */}
        {/* ============================================================ */}
        {activeSubTab === 'products' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-neutral-900/80 p-3.5 rounded-2xl border border-white/10">
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search products by Name, SKU, Category, Attribute, Material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-gold" />
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-xl border text-xs cursor-pointer ${
                    viewMode === 'table' ? 'bg-gold text-black border-gold' : 'bg-neutral-800 text-neutral-400 border-white/10'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl border text-xs cursor-pointer ${
                    viewMode === 'grid' ? 'bg-gold text-black border-gold' : 'bg-neutral-800 text-neutral-400 border-white/10'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Product List View (Table / Grid) */}
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-white/10 space-y-3">
                <Box className="w-10 h-10 text-neutral-600 mx-auto" />
                <h3 className="text-base font-bold text-neutral-300">No Products Found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  {searchQuery ? 'Try adjusting your search criteria or category filter.' : 'Click "+ Add Product" to add your first product with custom attributes.'}
                </p>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-gold hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add First Product</span>
                </button>
              </div>
            ) : viewMode === 'table' ? (
              /* TABLE VIEW */
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900/90 shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-black/60 border-b border-white/10 text-neutral-400 uppercase tracking-wider font-mono text-[11px]">
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4">Category & Sub Category</th>
                      <th className="py-3.5 px-4">Selected Attributes</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Stock</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.coverImage}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-neutral-800 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-white group-hover:text-gold transition-colors">{p.name}</div>
                              <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5 mt-0.5">
                                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 border border-white/10">{p.sku}</span>
                                {p.warranty && <span>• {p.warranty}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-white font-medium">{p.category}</div>
                          {p.subCategory && (
                            <div className="text-[11px] text-gold/80 flex items-center gap-1">
                              <ChevronRight className="w-3 h-3" />
                              <span>{p.subCategory}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          {p.selectedAttributes && Object.keys(p.selectedAttributes).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(p.selectedAttributes).map(([group, vals]) => (
                                Array.isArray(vals) && vals.map((v: string) => (
                                  <span 
                                    key={`${group}-${v}`} 
                                    className="px-2 py-0.5 rounded-md bg-neutral-800 border border-white/10 text-[10px] text-neutral-300 flex items-center gap-1"
                                  >
                                    <span className="text-gold font-bold">{group}:</span> {v}
                                  </span>
                                ))
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-[11px] italic">No attributes set</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                          ₹{p.price.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.stock > 5 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                          }`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'Active' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40' :
                            p.status === 'Draft' ? 'bg-neutral-800 text-neutral-400 border border-white/10' :
                            'bg-red-950 text-red-400 border border-red-500/30'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 cursor-pointer transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingProductId(p.id)}
                              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-500/30 cursor-pointer transition-colors"
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
            ) : (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((p) => (
                  <div 
                    key={p.id} 
                    className="bg-neutral-900/90 border border-white/10 rounded-2xl overflow-hidden hover:border-gold/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
                        <img 
                          src={p.coverImage} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-gold border border-gold/30">
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
                        
                        {/* Attributes Badges */}
                        {p.selectedAttributes && Object.keys(p.selectedAttributes).length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {Object.entries(p.selectedAttributes).slice(0, 3).map(([grp, vals]) => (
                              Array.isArray(vals) && vals.slice(0, 1).map((v: string) => (
                                <span key={`${grp}-${v}`} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-white/10">
                                  <span className="text-gold">{grp}:</span> {v}
                                </span>
                              ))
                            ))}
                            {Object.keys(p.selectedAttributes).length > 3 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                                +more
                              </span>
                            )}
                          </div>
                        )}

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

        {/* ============================================================ */}
        {/* 2. PRODUCT ATTRIBUTES TAB (NEW ADD-ON) */}
        {/* ============================================================ */}
        {activeSubTab === 'attributes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-gold" />
                  <span>Product Attribute Groups ({attributes.length})</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Manage attribute groups (Color, Texture, Finish, Material) and their selectable values for product uploads.
                </p>
              </div>
              <button
                onClick={handleOpenAddAttribute}
                className="px-4 py-2 bg-gradient-to-r from-gold to-amber-400 hover:from-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-gold/20 transition-all hover:scale-102"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add Attribute Group</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attributes.map((attr) => (
                <div 
                  key={attr.id} 
                  className="p-5 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-gold/40 transition-all flex flex-col justify-between space-y-4 shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-gold uppercase tracking-wider bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                        Attribute Group
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {attr.values?.length || 0} Selectable Options
                      </span>
                    </div>

                    <h4 className="text-base font-serif font-bold text-white flex items-center gap-2">
                      <span>{attr.name}</span>
                    </h4>

                    {/* Values Pills */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                        Configured Values:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {attr.values && attr.values.length > 0 ? (
                          attr.values.map((v, i) => (
                            <span 
                              key={i} 
                              className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/15 text-xs text-neutral-200 font-medium"
                            >
                              {v}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-500 italic">No values added yet.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleOpenEditAttribute(attr)}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Group & Values
                    </button>
                    <button
                      onClick={() => setDeletingAttributeId(attr.id)}
                      className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-500/20 cursor-pointer"
                      title="Delete Attribute Group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. CATEGORIES TAB */}
        {/* ============================================================ */}
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

        {/* ============================================================ */}
        {/* 4. SUBCATEGORIES TAB */}
        {/* ============================================================ */}
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
          <div className="bg-neutral-900 border border-gold/40 rounded-3xl p-6 sm:p-8 max-w-3xl w-full text-white shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 sticky top-0 bg-neutral-900 z-10">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-gold" />
                <h3 className="text-lg font-serif font-bold text-white">
                  {editingProduct.id ? 'Edit Product' : '+ Add New Product'}
                </h3>
              </div>
              <button 
                onClick={() => setIsProductModalOpen(false)} 
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-5 text-xs">
              {/* Product Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Imperial Solid Teak Hydraulic Bed"
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

              {/* ============================================================ */}
              {/* DYNAMIC PRODUCT ATTRIBUTES MULTI-SELECT SECTION */}
              {/* ============================================================ */}
              <div className="bg-black/60 border border-gold/40 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-gold" />
                    <label className="text-xs font-bold text-gold uppercase tracking-wider">
                      Product Attributes (Options / Variants)
                    </label>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Select values for Color, Texture, Finish, Material, etc.
                  </span>
                </div>

                {attributes.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">
                    No attribute groups found. Create attribute groups in the Attributes tab.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {attributes.map((group) => {
                      const selectedForGroup = editingProduct.selectedAttributes?.[group.name] || [];

                      return (
                        <div key={group.id} className="p-3 bg-neutral-900/80 rounded-xl border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                              {group.name}
                            </span>
                            <span className="text-[10px] font-mono text-gold/80">
                              {selectedForGroup.length} Selected
                            </span>
                          </div>

                          {/* Multi-select option buttons/pills */}
                          <div className="flex flex-wrap gap-1.5">
                            {group.values && group.values.length > 0 ? (
                              group.values.map((val, idx) => {
                                const isSelected = selectedForGroup.includes(val);
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleToggleProductAttribute(group.name, val)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isSelected
                                        ? 'bg-gold text-black font-bold shadow-md shadow-gold/20'
                                        : 'bg-black/60 text-neutral-300 border border-white/15 hover:border-white/40 hover:text-white'
                                    }`}
                                  >
                                    {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                                    <span>{val}</span>
                                  </button>
                                );
                              })
                            ) : (
                              <span className="text-xs text-neutral-500 italic">No values configured in group.</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">Material Details</label>
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
                      <Upload className="w-6 h-6 text-gold group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-xs font-bold text-white">Upload from Computer</span>
                      <span className="text-[10px] text-neutral-400">PNG, JPG, WEBP</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCoverImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-neutral-400 block">Or Paste Direct Image URL:</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={editingProduct.coverImage || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, coverImage: e.target.value })}
                      className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-2.5 text-xs text-white focus:outline-none"
                    />
                    {editingProduct.coverImage && (
                      <div className="flex items-center gap-2 pt-1">
                        <img 
                          src={editingProduct.coverImage} 
                          alt="Preview" 
                          className="w-10 h-10 rounded-lg object-cover border border-white/20 bg-neutral-800"
                        />
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Image Loaded
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                <label className="text-[11px] font-bold text-neutral-300 uppercase block">
                  Gallery Additional Images (URLs)
                </label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={galleryUrlInput}
                    onChange={(e) => setGalleryUrlInput(e.target.value)}
                    className="flex-1 bg-black/70 border border-white/15 focus:border-gold rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    + Add Image
                  </button>
                </div>

                {editingProduct.galleryImages && editingProduct.galleryImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {editingProduct.galleryImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-white/20">
                        <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute inset-0 bg-red-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10 justify-end sticky bottom-0 bg-neutral-900 py-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-400 hover:from-amber-400 text-black font-bold uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-gold/20"
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
      {/* MODAL: ADD / EDIT ATTRIBUTE GROUP (NEW ADD-ON) */}
      {/* ============================================================ */}
      {isAttributeModalOpen && editingAttribute && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-gold/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gold" />
                <h3 className="text-lg font-serif font-bold text-white">
                  {editingAttribute.id ? 'Edit Attribute Group' : '+ Add Attribute Group'}
                </h3>
              </div>
              <button onClick={() => setIsAttributeModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAttributeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Attribute Name * (e.g. Color, Texture, Finish, Material)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Color"
                  value={editingAttribute.name || ''}
                  onChange={(e) => setEditingAttribute({ ...editingAttribute, name: e.target.value })}
                  className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Add Attribute Values / Options
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Wooden Color, Teak Wood Color, Plain, Textured..."
                    value={newAttributeValueInput}
                    onChange={(e) => setNewAttributeValueInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAttributeValue();
                      }
                    }}
                    className="flex-1 bg-black/70 border border-white/15 focus:border-gold rounded-xl px-3 py-2.5 text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttributeValue}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 font-bold uppercase text-[11px] cursor-pointer"
                  >
                    + Add Value
                  </button>
                </div>
                <span className="text-[10px] text-neutral-500 block mt-1">Press Enter or click "+ Add Value" to add to the list.</span>
              </div>

              {/* Current Values Tags */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Configured Values ({editingAttribute.values?.length || 0}):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {editingAttribute.values && editingAttribute.values.length > 0 ? (
                    editingAttribute.values.map((val, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 border border-white/15 text-xs text-white flex items-center gap-2 group"
                      >
                        <span>{val}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttributeValue(val)}
                          className="text-neutral-400 hover:text-red-400 cursor-pointer"
                          title="Remove Value"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-500 italic">No values added yet. Type a value above and click Add.</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsAttributeModalOpen(false)} 
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingAttribute} 
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-amber-400 text-black font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-lg shadow-gold/20"
                >
                  <Save className="w-4 h-4" />
                  {isSavingAttribute ? 'Saving...' : 'Save Attribute Group'}
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
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-amber-400 text-black font-bold uppercase flex items-center gap-1.5 cursor-pointer"
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
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-amber-400 text-black font-bold uppercase flex items-center gap-1.5 cursor-pointer"
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
              <button onClick={() => setDeletingProductId(null)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteProductSubmit(deletingProductId)} className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold cursor-pointer">Confirm Delete</button>
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
              <button onClick={() => setDeletingCategoryId(null)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteCategorySubmit(deletingCategoryId)} className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold cursor-pointer">Confirm Delete</button>
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
              <button onClick={() => setDeletingSubCategoryId(null)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteSubCategorySubmit(deletingSubCategoryId)} className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold cursor-pointer">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {deletingAttributeId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full text-center text-white shadow-2xl">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h4 className="text-lg font-serif font-bold text-white mb-2">Delete Attribute Group?</h4>
            <p className="text-xs text-neutral-400 mb-6">Are you sure you want to delete this attribute group and all its options?</p>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => setDeletingAttributeId(null)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteAttributeSubmit(deletingAttributeId)} className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold cursor-pointer">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
