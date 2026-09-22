import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Check, X, AlertCircle, Loader2, Tag, 
  Sparkles, Layers, Edit2, Trash2, ShieldAlert
} from 'lucide-react';
import { 
  CategoryItem, 
  getCategories, 
  saveCategory, 
  deleteCategory 
} from '../services/productManagementService';

interface CategorySelectorFieldProps {
  value: string;
  onChange: (categoryName: string, categorySlug: string) => void;
  label?: string;
  required?: boolean;
  onCategoriesChanged?: (categories: CategoryItem[]) => void;
  className?: string;
}

export const CategorySelectorField: React.FC<CategorySelectorFieldProps> = ({
  value,
  onChange,
  label = 'Category *',
  required = true,
  onCategoriesChanged,
  className = ''
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Inline Creator State
  const [isCreatingInline, setIsCreatingInline] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryDesc, setNewCategoryDesc] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [creatorSuccess, setCreatorSuccess] = useState<string | null>(null);

  // Quick Category Manager Modal
  const [isManagerOpen, setIsManagerOpen] = useState<boolean>(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState<string>('');
  const [managerError, setManagerError] = useState<string | null>(null);
  const [managerSuccess, setManagerSuccess] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getCategories();
      setCategories(list);
      if (onCategoriesChanged) {
        onCategoriesChanged(list);
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setIsLoading(false);
    }
  }, [onCategoriesChanged]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle select dropdown change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    if (selectedVal === '__CREATE_NEW__') {
      setIsCreatingInline(true);
      setCreatorError(null);
      setCreatorSuccess(null);
      return;
    }

    const matched = categories.find(c => c.name === selectedVal);
    const slug = matched ? matched.slug : selectedVal.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    onChange(selectedVal, slug);
  };

  // Create new category inline without leaving the product form
  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setCreatorError('Please enter a category name.');
      return;
    }

    setIsSubmitting(true);
    setCreatorError(null);
    setCreatorSuccess(null);

    try {
      const res = await saveCategory({
        name: trimmedName,
        description: newCategoryDesc.trim()
      });

      if (!res.success || !res.category) {
        setCreatorError(res.error || 'Failed to create category in database.');
        setIsSubmitting(false);
        return;
      }

      // Automatically select the newly created category for the current product
      onChange(res.category.name, res.category.slug);
      setCreatorSuccess(`Category "${res.category.name}" created and applied!`);
      
      // Refresh list
      await fetchCategories();

      // Reset and close after brief feedback
      setTimeout(() => {
        setIsCreatingInline(false);
        setNewCategoryName('');
        setNewCategoryDesc('');
        setCreatorSuccess(null);
      }, 900);
    } catch (err: any) {
      setCreatorError(err.message || 'Unexpected error creating category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit category name with cascade update
  const handleSaveEditCategory = async (cat: CategoryItem) => {
    if (!editNameInput.trim()) return;
    setIsActionLoading(true);
    setManagerError(null);
    setManagerSuccess(null);

    try {
      const res = await saveCategory({
        id: cat.id,
        name: editNameInput.trim(),
        description: cat.description
      }, cat.name);

      if (!res.success || !res.category) {
        setManagerError(res.error || 'Failed to update category.');
        setIsActionLoading(false);
        return;
      }

      // If the current product was using this category, update parent form
      if (value === cat.name) {
        onChange(res.category.name, res.category.slug);
      }

      setManagerSuccess(`Category renamed to "${res.category.name}" and all assigned products updated!`);
      setEditingCatId(null);
      setEditNameInput('');
      await fetchCategories();
    } catch (err: any) {
      setManagerError(err.message || 'Failed to edit category.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Protected deletion of category
  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    setIsActionLoading(true);
    setManagerError(null);
    setManagerSuccess(null);

    try {
      const res = await deleteCategory(cat.id);
      if (!res.success) {
        setManagerError(res.error || 'Failed to delete category.');
        setIsActionLoading(false);
        return;
      }

      setManagerSuccess(`Category "${cat.name}" deleted successfully.`);
      await fetchCategories();
      
      // If deleted category was selected, fallback to first available
      if (value === cat.name) {
        const remaining = categories.filter(c => c.id !== cat.id);
        if (remaining.length > 0) {
          onChange(remaining[0].name, remaining[0].slug);
        }
      }
    } catch (err: any) {
      setManagerError(err.message || 'Failed to delete category.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Quick Actions */}
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {!isCreatingInline && (
            <button
              type="button"
              onClick={() => {
                setIsCreatingInline(true);
                setCreatorError(null);
                setCreatorSuccess(null);
              }}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsManagerOpen(true);
              setManagerError(null);
              setManagerSuccess(null);
            }}
            className="text-[10px] text-neutral-400 hover:text-neutral-200 underline cursor-pointer transition-colors"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Main Select Dropdown */}
      <div className="relative">
        <select
          value={value || ''}
          onChange={handleSelectChange}
          required={required}
          disabled={isLoading}
          className="w-full bg-black/80 border border-white/20 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-xl p-3 text-white text-sm focus:outline-none transition-all disabled:opacity-50"
        >
          {categories.length === 0 && (
            <option value={value || 'Living Room Luxury'}>
              {value || 'Loading categories...'}
            </option>
          )}
          
          {/* Ensure current value is in the options even if not yet loaded */}
          {value && !categories.some(c => c.name === value) && (
            <option value={value}>{value}</option>
          )}

          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name} {cat.productCount !== undefined && cat.productCount > 0 ? `(${cat.productCount})` : ''}
            </option>
          ))}

          <option disabled>──────────</option>
          <option value="__CREATE_NEW__" className="text-amber-400 font-bold">
            + Create New Category...
          </option>
        </select>

        {isLoading && (
          <div className="absolute right-3 top-3.5 pointer-events-none">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Inline Quick Category Creator */}
      {isCreatingInline && (
        <div className="p-3.5 bg-neutral-900/95 border border-amber-400/40 rounded-xl space-y-2.5 animate-fadeIn shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Create Custom Category
            </span>
            <button
              type="button"
              onClick={() => {
                setIsCreatingInline(false);
                setCreatorError(null);
                setCreatorSuccess(null);
              }}
              className="text-neutral-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Commercial Office Partitions"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
                className="w-full bg-black/90 border border-white/20 focus:border-amber-400 rounded-lg p-2 text-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Optional short description / notes"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-lg p-2 text-neutral-300 text-xs focus:outline-none"
              />
            </div>
          </div>

          {creatorError && (
            <div className="text-[11px] text-red-400 bg-red-950/60 border border-red-800/40 p-2 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{creatorError}</span>
            </div>
          )}

          {creatorSuccess && (
            <div className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 p-2 rounded-lg flex items-center gap-1.5 font-bold">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{creatorSuccess}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreatingInline(false)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || !newCategoryName.trim()}
              onClick={() => handleCreateCategory()}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Create & Apply</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Quick Category Manager Modal (Rename & Protected Delete) */}
      {isManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-950 border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-serif font-bold text-white text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" /> Supabase Categories
                </h3>
                <p className="text-xs text-neutral-400">
                  Renaming a category cascades across all assigned products. Deleting is protected if products exist.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManagerOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {managerError && (
              <div className="text-xs text-red-300 bg-red-950/80 border border-red-800 p-2.5 rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{managerError}</span>
              </div>
            )}

            {managerSuccess && (
              <div className="text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl flex items-center gap-2 font-bold">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{managerSuccess}</span>
              </div>
            )}

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {categories.map((cat) => {
                const isEditing = editingCatId === cat.id;
                const hasProducts = Boolean(cat.productCount && cat.productCount > 0);

                return (
                  <div
                    key={cat.id}
                    className="p-3 bg-neutral-900 border border-white/10 rounded-xl flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editNameInput}
                          onChange={(e) => setEditNameInput(e.target.value)}
                          className="flex-1 bg-black border border-amber-400 rounded-lg p-1.5 text-white text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isActionLoading || !editNameInput.trim()}
                          onClick={() => handleSaveEditCategory(cat)}
                          className="px-2.5 py-1 bg-amber-500 text-black text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(null);
                            setEditNameInput('');
                          }}
                          className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">
                              {cat.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-white/5">
                              {cat.productCount || 0} products
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono block truncate">
                            slug: {cat.slug}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditNameInput(cat.name);
                              setManagerError(null);
                              setManagerSuccess(null);
                            }}
                            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 rounded-lg cursor-pointer transition-colors"
                            title="Rename Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleDeleteCategory(cat)}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              hasProducts
                                ? 'text-neutral-600 hover:text-neutral-500 cursor-not-allowed'
                                : 'hover:bg-red-950 text-neutral-400 hover:text-red-400'
                            }`}
                            title={hasProducts ? 'Cannot delete: Products are assigned to this category' : 'Delete Category'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManagerOpen(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
