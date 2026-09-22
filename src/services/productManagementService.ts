import { getSupabase } from '../lib/supabase';
import { Product, ProductVariation } from '../types';
import { getProducts, saveProduct, deleteProductById } from './productService';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  productCount?: number;
}

export interface SubCategoryItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
}

export interface AttributeGroupItem {
  id: string;
  name: string; // e.g. "Color", "Texture", "Finish", "Material", "Size"
  values: string[]; // e.g. ["Wooden Color", "Teak Wood Color", "Plain", "Textured"]
  createdAt?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  sku: string;
  price: number;
  discountPrice?: number;
  taxGst?: number;
  shortDescription?: string;
  description: string;
  material: string;
  finish?: string;
  size: string;
  dimensions?: string;
  warranty: string;
  stock: number;
  coverImage: string;
  galleryImages: string[];
  selectedAttributes?: Record<string, string[]>; // { "Color": ["Wooden Color", "Teak Wood Color"], "Texture": ["Plain"] }
  variations?: ProductVariation[];
  specifications?: Record<string, string>;
  status: 'Active' | 'Inactive' | 'Draft';
  createdAt?: string;
  updatedAt?: string;
}

const CATEGORIES_KEY = 'royalepic_categories_store';
const SUBCATEGORIES_KEY = 'royalepic_subcategories_store';
const ATTRIBUTES_KEY = 'royalepic_attributes_store';
const PRODUCTS_KEY = 'royalepic_addon_products_store';

// Default initial category seeds (covering all standard catalog categories)
export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Modular Kitchens', slug: 'modular-kitchens', description: 'Acrylic, Quartz & German fittings modular kitchens' },
  { id: 'cat-2', name: 'Living Room Luxury', slug: 'living-room-luxury', description: 'Italian marble, sofas, TV units & console tables' },
  { id: 'cat-3', name: 'Master Bedroom Suites', slug: 'master-bedroom-suites', description: 'Beds, headboards & sliding wardrobes' },
  { id: 'cat-4', name: 'WPC Waterproof Doors', slug: 'wpc-waterproof-doors', description: '100% waterproof bathroom & exterior doors' },
  { id: 'cat-5', name: 'Dining & Crockery', slug: 'dining-crockery', description: 'Marble dining tables and illuminated bar cabinets' },
  { id: 'cat-6', name: 'Doors', slug: 'doors', description: 'Premium main doors, pooja doors & veneer flush doors' },
  { id: 'cat-7', name: 'Sliding Wardrobes', slug: 'sliding-wardrobes', description: 'Floor to ceiling sliding wardrobes' },
  { id: 'cat-8', name: 'Kitchen Equipment', slug: 'kitchen-equipment', description: 'Commercial and luxury kitchen equipment' },
  { id: 'cat-9', name: 'Dining Tables', slug: 'dining-tables', description: 'Bespoke marble and solid wood dining tables' },
  { id: 'cat-10', name: 'WPC Bathroom Doors', slug: 'wpc-bathroom-doors', description: '100% waterproof and termite proof bathroom doors' },
  { id: 'cat-11', name: 'Main Entrance Doors', slug: 'main-entrance-doors', description: 'Burma teak and grand pivot entrance doors' },
  { id: 'cat-12', name: 'Sofas', slug: 'sofas', description: 'Luxury sectionals and chesterfield sofas' },
  { id: 'cat-13', name: 'TV Units', slug: 'tv-units', description: 'Wall mounted Italian marble and acoustic fluted TV consoles' },
  { id: 'cat-14', name: 'Commercial Furniture', slug: 'commercial-furniture', description: 'Executive desks, conference tables and spa furniture' },
  { id: 'cat-15', name: 'Glass Partitions', slug: 'glass-partitions', description: 'Acoustic slim-profile aluminum & glass partitions' }
];

export const DEFAULT_SUBCATEGORIES: SubCategoryItem[] = [
  { id: 'sub-1', categoryId: 'cat-4', name: 'Island Modular Kitchen', slug: 'island-modular-kitchen', description: 'Center-island layout with granite / quartz counters' },
  { id: 'sub-2', categoryId: 'cat-4', name: 'L-Shaped Modular Kitchen', slug: 'l-shaped-modular-kitchen', description: 'Corner maximizing ergonomic layout' },
  { id: 'sub-3', categoryId: 'cat-4', name: 'Parallel Galley Kitchen', slug: 'parallel-galley-kitchen', description: 'Dual parallel counter layout' },
  { id: 'sub-4', categoryId: 'cat-1', name: 'Sectional Sofas', slug: 'sectional-sofas', description: 'L-shape and U-shape sectionals' },
  { id: 'sub-5', categoryId: 'cat-1', name: 'Chesterfield Sofas', slug: 'chesterfield-sofas', description: 'Deep tufted leather and velvet' },
  { id: 'sub-6', categoryId: 'cat-3', name: 'King Size Beds', slug: 'king-size-beds', description: 'Bespoke upholstered and teak beds' },
  { id: 'sub-7', categoryId: 'cat-3', name: 'Walk-In Wardrobes', slug: 'walk-in-wardrobes', description: 'Floor to ceiling custom glass wardrobes' }
];

export const DEFAULT_ATTRIBUTES: AttributeGroupItem[] = [
  { id: 'attr-1', name: 'Finish', values: ['Italian PU Matte', 'High Gloss Acrylic', 'Natural Teak Polish', 'Textured Veneer', 'Metallic Champagne'] },
  { id: 'attr-2', name: 'Wood Material', values: ['Solid Burma Teak', 'Marine Grade Birch Ply', 'White Ash Wood', 'Steam Beech', 'WPC Core'] },
  { id: 'attr-3', name: 'Hardware', values: ['Blum Soft-Close (Austria)', 'Hettich Sensys (Germany)', 'Hafele Heavy Duty (Germany)'] },
  { id: 'attr-4', name: 'Fabric / Leather', values: ['Italian Semi-Aniline Leather', 'Belgian Velvet', 'Linen Blend', 'Hydrophobic Boucle'] }
];

export const DEFAULT_ADDON_PRODUCTS: ProductItem[] = [];

export const SYSTEM_CATEGORY_REGISTRY_ID = '__category_registry__';

// Helper to save categories registry into Supabase products table
async function saveCategoriesRegistry(categories: CategoryItem[]): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = getSupabase();
    if (!sb) return { success: false, error: 'Supabase client is unavailable.' };

    const cleanList = categories.map(({ id, name, slug, description, createdAt, updatedAt }) => ({
      id,
      name: name.trim(),
      slug: slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      description: description || '',
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString()
    }));

    const { error } = await sb
      .from('products')
      .upsert({
        id: SYSTEM_CATEGORY_REGISTRY_ID,
        name: '__CATEGORY_REGISTRY__',
        category: '__SYSTEM__',
        category_slug: '__system_categories__',
        price: 0,
        in_stock: false,
        image: 'https://lwrfoztfsyffgtybesia.supabase.co/storage/v1/object/public/products/system-meta.png',
        specifications: {
          isSystemRegistry: true,
          categories: cleanList,
          updatedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('saveCategoriesRegistry error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// CATEGORY OPERATIONS: Single Source of Truth backed by Supabase
export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const sb = getSupabase();
    if (!sb) {
      return DEFAULT_CATEGORIES;
    }

    // Parallel fetch: category registry row and active product categories
    const [regRes, prodsRes] = await Promise.all([
      sb
        .from('products')
        .select('specifications')
        .eq('id', SYSTEM_CATEGORY_REGISTRY_ID)
        .maybeSingle(),
      sb
        .from('products')
        .select('category,category_slug')
        .neq('category', '__SYSTEM__')
    ]);

    // Build real-time product count map per category
    const productCountMap: Record<string, number> = {};
    if (prodsRes.data && Array.isArray(prodsRes.data)) {
      prodsRes.data.forEach((p: any) => {
        if (p.category && typeof p.category === 'string') {
          const key = p.category.trim().toLowerCase();
          productCountMap[key] = (productCountMap[key] || 0) + 1;
        }
      });
    }

    let list: CategoryItem[] = [];

    if (regRes.data?.specifications?.categories && Array.isArray(regRes.data.specifications.categories) && regRes.data.specifications.categories.length > 0) {
      list = [...regRes.data.specifications.categories];
    } else {
      list = [...DEFAULT_CATEGORIES];
      await saveCategoriesRegistry(list);
    }

    // Ensure any category already present on active products in Supabase is registered
    if (prodsRes.data && Array.isArray(prodsRes.data)) {
      const existingNames = new Set(list.map(c => c.name.trim().toLowerCase()));
      let hasNew = false;

      prodsRes.data.forEach((p: any) => {
        if (p.category && typeof p.category === 'string') {
          const raw = p.category.trim();
          const lower = raw.toLowerCase();
          if (!existingNames.has(lower)) {
            existingNames.add(lower);
            const slug = p.category_slug || lower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            list.push({
              id: `cat-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
              name: raw,
              slug,
              description: '',
              createdAt: new Date().toISOString()
            });
            hasNew = true;
          }
        }
      });

      if (hasNew) {
        await saveCategoriesRegistry(list);
      }
    }

    // Attach accurate product counts
    const mapped = list.map(c => ({
      ...c,
      productCount: productCountMap[c.name.trim().toLowerCase()] || 0
    }));

    // Sort alphabetically by category name
    mapped.sort((a, b) => a.name.localeCompare(b.name));
    return mapped;
  } catch (e) {
    console.warn('getCategories exception, returning defaults:', e);
    return DEFAULT_CATEGORIES;
  }
}

export async function saveCategory(
  cat: Partial<CategoryItem>,
  oldCategoryName?: string
): Promise<{ success: boolean; category?: CategoryItem; error?: string }> {
  try {
    const rawName = cat.name?.trim();
    if (!rawName) {
      return { success: false, error: 'Category name is required.' };
    }

    const sb = getSupabase();
    if (!sb) {
      return { success: false, error: 'Supabase client is not available.' };
    }

    // Fetch existing categories from Supabase (bypassing local caches)
    const currentCategories = await getCategories();

    // Prevent duplicate category names (case-insensitive)
    const lowerName = rawName.toLowerCase();
    const duplicate = currentCategories.find(c =>
      c.name.trim().toLowerCase() === lowerName && (!cat.id || c.id !== cat.id)
    );

    if (duplicate) {
      return { success: false, error: `Category "${rawName}" already exists.` };
    }

    // Generate stable slug
    const generatedSlug = cat.slug?.trim() || lowerName.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const targetId = cat.id || `cat-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const fullCat: CategoryItem = {
      id: targetId,
      name: rawName,
      slug: generatedSlug,
      description: cat.description?.trim() || '',
      createdAt: cat.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If editing existing category and name changed, cascade update to all assigned products in Supabase
    const originalName = (oldCategoryName || (cat.id ? currentCategories.find(c => c.id === cat.id)?.name : undefined))?.trim();
    if (originalName && originalName.toLowerCase() !== lowerName) {
      const { error: cascadeError } = await sb
        .from('products')
        .update({
          category: rawName,
          category_slug: generatedSlug,
          updated_at: new Date().toISOString()
        })
        .eq('category', originalName);

      if (cascadeError) {
        console.error('Failed to cascade category rename to products:', cascadeError);
        return { success: false, error: `Failed to update assigned products: ${cascadeError.message}` };
      }
    }

    // Update categories list
    const updatedList = [...currentCategories];
    const existingIndex = updatedList.findIndex(c => c.id === targetId || (originalName && c.name.trim().toLowerCase() === originalName.toLowerCase()));
    if (existingIndex >= 0) {
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...fullCat };
    } else {
      updatedList.push(fullCat);
    }

    const regResult = await saveCategoriesRegistry(updatedList);
    if (!regResult.success) {
      return { success: false, error: regResult.error || 'Failed to persist category to Supabase.' };
    }

    return { success: true, category: fullCat };
  } catch (err: any) {
    console.error('saveCategory error:', err);
    return { success: false, error: err.message || 'Failed to save category.' };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = getSupabase();
    if (!sb) {
      return { success: false, error: 'Supabase client is not available.' };
    }

    const currentCategories = await getCategories();
    const targetCat = currentCategories.find(c => c.id === id);
    if (!targetCat) {
      return { success: false, error: 'Category not found.' };
    }

    // Protected deletion: Check if any products are assigned to this category in Supabase
    const { count, error: countError } = await sb
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category', targetCat.name)
      .neq('category', '__SYSTEM__');

    if (countError) {
      return { success: false, error: `Failed to verify product assignments: ${countError.message}` };
    }

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot delete category "${targetCat.name}" because ${count} product(s) are currently assigned to it. Please reassign or delete these products first.`
      };
    }

    // Safe to delete: remove from registry
    const filteredList = currentCategories.filter(c => c.id !== id);
    const regResult = await saveCategoriesRegistry(filteredList);
    if (!regResult.success) {
      return { success: false, error: regResult.error || 'Failed to update category registry in Supabase.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('deleteCategory error:', err);
    return { success: false, error: err.message || 'Failed to delete category.' };
  }
}

// SUBCATEGORY OPERATIONS
export async function getSubCategories(): Promise<SubCategoryItem[]> {
  try {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('subcategories').select('*').order('name');
      if (!error && data && data.length > 0) {
        const items: SubCategoryItem[] = data.map((d: any) => ({
          id: d.id,
          categoryId: d.category_id || d.categoryId,
          name: d.name,
          slug: d.slug || d.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description: d.description || '',
          createdAt: d.created_at
        }));
        localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(items));
        return items;
      }
    }
  } catch (e) {
    console.warn('Supabase subcategories fetch notice:', e);
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(SUBCATEGORIES_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
  }
  return DEFAULT_SUBCATEGORIES;
}

export async function saveSubCategory(sub: Partial<SubCategoryItem>): Promise<{ success: boolean; subCategory?: SubCategoryItem; error?: string }> {
  try {
    const fullSub: SubCategoryItem = {
      id: sub.id || `sub-${Date.now()}`,
      categoryId: sub.categoryId || 'cat-1',
      name: sub.name?.trim() || 'New Sub Category',
      slug: sub.slug || (sub.name || 'subcategory').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: sub.description?.trim() || '',
      createdAt: sub.createdAt || new Date().toISOString()
    };

    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('subcategories').upsert({
          id: fullSub.id,
          category_id: fullSub.categoryId,
          name: fullSub.name,
          slug: fullSub.slug,
          description: fullSub.description
        });
      }
    } catch (e) {
      console.warn('Supabase subcategory save notice:', e);
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(SUBCATEGORIES_KEY);
      let list: SubCategoryItem[] = cached ? JSON.parse(cached) : [...DEFAULT_SUBCATEGORIES];
      const idx = list.findIndex(s => s.id === fullSub.id);
      if (idx >= 0) list[idx] = fullSub;
      else list.push(fullSub);
      localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(list));
    }

    return { success: true, subCategory: fullSub };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteSubCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('subcategories').delete().eq('id', id);
      }
    } catch (e) {
      console.warn('Supabase subcategory delete notice:', e);
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(SUBCATEGORIES_KEY);
      let list: SubCategoryItem[] = cached ? JSON.parse(cached) : [...DEFAULT_SUBCATEGORIES];
      list = list.filter(s => s.id !== id);
      localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(list));
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ATTRIBUTE OPERATIONS
export async function getAttributes(): Promise<AttributeGroupItem[]> {
  try {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('product_attributes').select('*').order('name');
      if (!error && data && data.length > 0) {
        const items: AttributeGroupItem[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          values: Array.isArray(d.values) ? d.values : (typeof d.values === 'string' ? JSON.parse(d.values) : []),
          createdAt: d.created_at
        }));
        localStorage.setItem(ATTRIBUTES_KEY, JSON.stringify(items));
        return items;
      }
    }
  } catch (e) {
    console.warn('Supabase attributes fetch notice:', e);
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(ATTRIBUTES_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
  }
  return DEFAULT_ATTRIBUTES;
}

export async function saveAttribute(attr: Partial<AttributeGroupItem>): Promise<{ success: boolean; attribute?: AttributeGroupItem; error?: string }> {
  try {
    const fullAttr: AttributeGroupItem = {
      id: attr.id || `attr-${Date.now()}`,
      name: attr.name?.trim() || 'New Attribute',
      values: Array.isArray(attr.values) ? attr.values.filter(v => v && v.trim()) : [],
      createdAt: attr.createdAt || new Date().toISOString()
    };

    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('product_attributes').upsert({
          id: fullAttr.id,
          name: fullAttr.name,
          values: fullAttr.values
        });
      }
    } catch (e) {
      console.warn('Supabase attribute save notice:', e);
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(ATTRIBUTES_KEY);
      let list: AttributeGroupItem[] = cached ? JSON.parse(cached) : [...DEFAULT_ATTRIBUTES];
      const idx = list.findIndex(a => a.id === fullAttr.id);
      if (idx >= 0) list[idx] = fullAttr;
      else list.push(fullAttr);
      localStorage.setItem(ATTRIBUTES_KEY, JSON.stringify(list));
    }

    return { success: true, attribute: fullAttr };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAttribute(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('product_attributes').delete().eq('id', id);
      }
    } catch (e) {
      console.warn('Supabase attribute delete notice:', e);
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(ATTRIBUTES_KEY);
      let list: AttributeGroupItem[] = cached ? JSON.parse(cached) : [...DEFAULT_ATTRIBUTES];
      list = list.filter(a => a.id !== id);
      localStorage.setItem(ATTRIBUTES_KEY, JSON.stringify(list));
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Helper to convert frontend Product to ProductItem
export function productToProductItem(p: Product): ProductItem {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    subCategory: p.subCategory || '',
    sku: p.sku || `RE-SKU-${p.id}`,
    price: p.price,
    discountPrice: p.discountPrice,
    taxGst: p.taxGst || 18,
    shortDescription: p.shortDescription || '',
    description: p.description || '',
    material: p.material || (p.specifications?.material || ''),
    finish: p.finish || (p.specifications?.finish || ''),
    size: p.dimensions || (p.specifications?.size || ''),
    dimensions: p.dimensions || (p.specifications?.size || ''),
    warranty: p.specifications?.warranty || '10 Years Warranty',
    stock: p.stockQuantity !== undefined ? p.stockQuantity : (p.inStock ? 10 : 0),
    coverImage: p.image,
    galleryImages: Array.isArray(p.galleryImages) && p.galleryImages.length > 0 ? p.galleryImages : [p.image],
    selectedAttributes: (p.attributes as Record<string, string[]>) || {},
    variations: p.variations || [],
    specifications: (p.specifications as Record<string, string>) || {},
    status: (p.status as 'Active' | 'Inactive' | 'Draft') || (p.inStock ? 'Active' : 'Inactive'),
    createdAt: (p as any).created_at,
    updatedAt: (p as any).updated_at
  };
}

// PRODUCT OPERATIONS: Unified directly with canonical Supabase products table
export async function getAddonProducts(): Promise<ProductItem[]> {
  try {
    const res = await getProducts();
    if (res && res.products && res.products.length > 0) {
      return res.products.map(productToProductItem);
    }
  } catch (e) {
    console.warn('Error fetching unified products for product management module:', e);
  }
  return DEFAULT_ADDON_PRODUCTS;
}

export async function saveAddonProduct(prod: Partial<ProductItem>): Promise<{ success: boolean; product?: ProductItem; error?: string }> {
  try {
    const id = prod.id || `prod-${Date.now()}`;
    const productPayload: Partial<Product> = {
      id,
      name: prod.name?.trim() || 'New Product',
      category: prod.category || 'Modular Kitchens',
      subCategory: prod.subCategory || '',
      sku: prod.sku?.trim() || `RE-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      price: Number(prod.price) || 0,
      discountPrice: prod.discountPrice !== undefined ? Number(prod.discountPrice) : undefined,
      taxGst: prod.taxGst !== undefined ? Number(prod.taxGst) : 18,
      shortDescription: prod.shortDescription?.trim() || '',
      description: prod.description?.trim() || '',
      material: prod.material?.trim() || '',
      finish: prod.finish?.trim() || '',
      dimensions: prod.dimensions?.trim() || prod.size?.trim() || '',
      stockQuantity: prod.stock !== undefined ? Number(prod.stock) : 10,
      image: prod.coverImage || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      galleryImages: Array.isArray(prod.galleryImages) && prod.galleryImages.length > 0 
        ? prod.galleryImages 
        : [prod.coverImage || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80'],
      attributes: prod.selectedAttributes,
      variations: prod.variations,
      specifications: {
        ...(prod.specifications || {}),
        material: prod.material || '',
        finish: prod.finish || '',
        size: prod.size || prod.dimensions || '',
        warranty: prod.warranty || '10 Years Warranty',
        sku: prod.sku || ''
      },
      status: prod.status || 'Active',
      inStock: prod.status !== 'Inactive' && (prod.stock === undefined || prod.stock > 0)
    };

    const res = await saveProduct(productPayload);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to save product to database' };
    }

    const savedItem = productToProductItem(res.product || (productPayload as Product));
    return { success: true, product: savedItem };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAddonProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await deleteProductById(id);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to delete product from database' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
