import { getSupabase } from '../lib/supabase';
import { Product } from '../types';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
}

export interface SubCategoryItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  sku: string;
  price: number;
  description: string;
  material: string;
  size: string;
  warranty: string;
  stock: number;
  coverImage: string;
  galleryImages: string[];
  status: 'Active' | 'Inactive' | 'Draft';
  createdAt?: string;
}

const CATEGORIES_KEY = 'royalepic_categories_store';
const SUBCATEGORIES_KEY = 'royalepic_subcategories_store';
const PRODUCTS_KEY = 'royalepic_addon_products_store';

// Default initial category seeds
export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Modular Kitchens', slug: 'modular-kitchens', description: 'Acrylic, Quartz & German fittings modular kitchens' },
  { id: 'cat-2', name: 'Living Room Luxury', slug: 'living-room-luxury', description: 'Italian marble, sofas, TV units & console tables' },
  { id: 'cat-3', name: 'Master Bedroom Suites', slug: 'master-bedroom-suites', description: 'Beds, headboards & sliding wardrobes' },
  { id: 'cat-4', name: 'WPC Waterproof Doors', slug: 'wpc-waterproof-doors', description: '100% waterproof bathroom & exterior doors' },
  { id: 'cat-5', name: 'Dining & Crockery', slug: 'dining-crockery', description: 'Marble dining tables and illuminated bar cabinets' }
];

export const DEFAULT_SUBCATEGORIES: SubCategoryItem[] = [
  { id: 'sub-1', categoryId: 'cat-1', name: 'Island Kitchens', slug: 'island-kitchens' },
  { id: 'sub-2', categoryId: 'cat-1', name: 'L-Shape Kitchens', slug: 'l-shape-kitchens' },
  { id: 'sub-3', categoryId: 'cat-1', name: 'Parallel Kitchens', slug: 'parallel-kitchens' },
  { id: 'sub-4', categoryId: 'cat-2', name: 'Chesterfield & Sectional Sofas', slug: 'sectional-sofas' },
  { id: 'sub-5', categoryId: 'cat-2', name: 'Wall Mounted TV Units', slug: 'tv-units' },
  { id: 'sub-6', categoryId: 'cat-3', name: 'King Size Hydraulic Beds', slug: 'hydraulic-beds' },
  { id: 'sub-7', categoryId: 'cat-3', name: 'Floor-to-Ceiling Wardrobes', slug: 'sliding-wardrobes' },
  { id: 'sub-8', categoryId: 'cat-4', name: 'Veneer Finish Flush Doors', slug: 'flush-doors' },
  { id: 'sub-9', categoryId: 'cat-5', name: '8-Seater Onyx Marble Tables', slug: 'onyx-dining' }
];

export const DEFAULT_ADDON_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-addon-1',
    name: 'Imperial Italian Acrylic Island Kitchen Suite',
    category: 'Modular Kitchens',
    subCategory: 'Island Kitchens',
    sku: 'RE-KIT-001',
    price: 345000,
    description: 'Factory-manufactured island kitchen with soft-close Blum servo-drive drawers, Calacatta quartz countertops, and built-in spice pullouts.',
    material: '18mm Marine Grade BWP Plywood + 2mm Anti-scratch Acrylic',
    size: '14ft x 10ft Custom Layout',
    warranty: '15 Years Waterproof & Hardware Warranty',
    stock: 8,
    coverImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-addon-2',
    name: 'Bespoke Onyx Marble 8-Seater Dining Set',
    category: 'Dining & Crockery',
    subCategory: '8-Seater Onyx Marble Tables',
    sku: 'RE-DIN-002',
    price: 210000,
    description: 'Imported translucent Brazilian onyx marble dining tabletop with brushed gold stainless steel geometric pedestal base.',
    material: 'Natural Onyx Stone + 304 PVD Coated Titanium Gold Steel',
    size: '8ft x 4ft Table + 8 Ergonomic Leather Chairs',
    warranty: '10 Years Structural Guarantee',
    stock: 4,
    coverImage: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-addon-3',
    name: 'Luxury WPC Waterproof Flush Door with Brass Inlays',
    category: 'WPC Waterproof Doors',
    subCategory: 'Veneer Finish Flush Doors',
    sku: 'RE-DOR-003',
    price: 24500,
    description: '100% Waterproof Wood Polymer Composite door with solid virgin density core, natural teak veneer and gold brass strips.',
    material: 'High Density Virgin WPC Core + Teak Veneer + Brass',
    size: '7ft x 3ft x 35mm (Standard & Custom Sizes)',
    warranty: 'Lifetime 100% Termite & Waterproof Guarantee',
    stock: 25,
    coverImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

// CATEGORY OPERATIONS
export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('categories').select('*').order('name');
      if (!error && data && data.length > 0) {
        const items: CategoryItem[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          slug: d.slug || d.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description: d.description || '',
          createdAt: d.created_at
        }));
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(items));
        return items;
      }
    }
  } catch (e) {
    console.warn('Supabase categories fetch notice:', e);
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CATEGORIES_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
  }
  return DEFAULT_CATEGORIES;
}

export async function saveCategory(cat: Partial<CategoryItem>): Promise<{ success: boolean; category?: CategoryItem; error?: string }> {
  try {
    const fullCat: CategoryItem = {
      id: cat.id || `cat-${Date.now()}`,
      name: cat.name?.trim() || 'New Category',
      slug: cat.slug || (cat.name || 'category').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: cat.description?.trim() || '',
      createdAt: cat.createdAt || new Date().toISOString()
    };

    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('categories').upsert({
          id: fullCat.id,
          name: fullCat.name,
          slug: fullCat.slug,
          description: fullCat.description
        });
      }
    } catch (e) {
      console.warn('Supabase category save notice:', e);
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CATEGORIES_KEY);
      let list: CategoryItem[] = cached ? JSON.parse(cached) : [...DEFAULT_CATEGORIES];
      const idx = list.findIndex(c => c.id === fullCat.id);
      if (idx >= 0) list[idx] = fullCat;
      else list.push(fullCat);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list));
    }

    return { success: true, category: fullCat };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('categories').delete().eq('id', id);
      }
    } catch (e) {
      console.warn('Supabase category delete notice:', e);
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CATEGORIES_KEY);
      let list: CategoryItem[] = cached ? JSON.parse(cached) : [...DEFAULT_CATEGORIES];
      list = list.filter(c => c.id !== id);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list));
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
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

// PRODUCT OPERATIONS
export async function getAddonProducts(): Promise<ProductItem[]> {
  try {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('addon_products').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const items: ProductItem[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          subCategory: d.sub_category || d.subCategory || '',
          sku: d.sku || '',
          price: Number(d.price) || 0,
          description: d.description || '',
          material: d.material || '',
          size: d.size || '',
          warranty: d.warranty || '',
          stock: Number(d.stock) || 0,
          coverImage: d.cover_image || d.coverImage || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
          galleryImages: Array.isArray(d.gallery_images) ? d.gallery_images : (d.galleryImages || []),
          status: (d.status as 'Active' | 'Inactive' | 'Draft') || 'Active',
          createdAt: d.created_at
        }));
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(items));
        return items;
      }
    }
  } catch (e) {
    console.warn('Supabase addon_products fetch notice:', e);
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(PRODUCTS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
  }
  return DEFAULT_ADDON_PRODUCTS;
}

export async function saveAddonProduct(prod: Partial<ProductItem>): Promise<{ success: boolean; product?: ProductItem; error?: string }> {
  try {
    const fullProd: ProductItem = {
      id: prod.id || `prod-addon-${Date.now()}`,
      name: prod.name?.trim() || 'New Product',
      category: prod.category || 'Modular Kitchens',
      subCategory: prod.subCategory || '',
      sku: prod.sku?.trim() || `RE-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      price: Number(prod.price) || 0,
      description: prod.description?.trim() || '',
      material: prod.material?.trim() || '',
      size: prod.size?.trim() || '',
      warranty: prod.warranty?.trim() || '10 Years Warranty',
      stock: Number(prod.stock) || 0,
      coverImage: prod.coverImage || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      galleryImages: Array.isArray(prod.galleryImages) ? prod.galleryImages : [],
      status: prod.status || 'Active',
      createdAt: prod.createdAt || new Date().toISOString()
    };

    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('addon_products').upsert({
          id: fullProd.id,
          name: fullProd.name,
          category: fullProd.category,
          sub_category: fullProd.subCategory,
          sku: fullProd.sku,
          price: fullProd.price,
          description: fullProd.description,
          material: fullProd.material,
          size: fullProd.size,
          warranty: fullProd.warranty,
          stock: fullProd.stock,
          cover_image: fullProd.coverImage,
          gallery_images: fullProd.galleryImages,
          status: fullProd.status,
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Supabase addon_products upsert notice:', e);
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(PRODUCTS_KEY);
      let list: ProductItem[] = cached ? JSON.parse(cached) : [...DEFAULT_ADDON_PRODUCTS];
      const idx = list.findIndex(p => p.id === fullProd.id);
      if (idx >= 0) list[idx] = fullProd;
      else list.unshift(fullProd);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
    }

    return { success: true, product: fullProd };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAddonProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.from('addon_products').delete().eq('id', id);
      }
    } catch (e) {
      console.warn('Supabase addon_products delete notice:', e);
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(PRODUCTS_KEY);
      let list: ProductItem[] = cached ? JSON.parse(cached) : [...DEFAULT_ADDON_PRODUCTS];
      list = list.filter(p => p.id !== id);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
