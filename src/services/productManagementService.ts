import { getSupabase } from '../lib/supabase';
import { Product, ProductVariation } from '../types';

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

// Default initial category seeds
export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Modular Kitchens', slug: 'modular-kitchens', description: 'Acrylic, Quartz & German fittings modular kitchens' },
  { id: 'cat-2', name: 'Living Room Luxury', slug: 'living-room-luxury', description: 'Italian marble, sofas, TV units & console tables' },
  { id: 'cat-3', name: 'Master Bedroom Suites', slug: 'master-bedroom-suites', description: 'Beds, headboards & sliding wardrobes' },
  { id: 'cat-4', name: 'WPC Waterproof Doors', slug: 'wpc-waterproof-doors', description: '100% waterproof bathroom & exterior doors' },
  { id: 'cat-5', name: 'Dining & Crockery', slug: 'dining-crockery', description: 'Marble dining tables and illuminated bar cabinets' },
  { id: 'cat-6', name: 'Doors', slug: 'doors', description: 'Premium main doors, pooja doors & veneer flush doors' }
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
  { id: 'sub-9', categoryId: 'cat-5', name: '8-Seater Onyx Marble Tables', slug: 'onyx-dining' },
  { id: 'sub-10', categoryId: 'cat-6', name: 'Main Doors', slug: 'main-doors' },
  { id: 'sub-11', categoryId: 'cat-6', name: 'Pooja Room Doors', slug: 'pooja-doors' },
  { id: 'sub-12', categoryId: 'cat-6', name: 'Internal Flush Doors', slug: 'internal-flush-doors' }
];

// Default Attribute Groups
export const DEFAULT_ATTRIBUTES: AttributeGroupItem[] = [
  {
    id: 'attr-1',
    name: 'Size',
    values: ['7x3 ft', '7x3.5 ft', '8x4 ft', '6x3 ft', 'Standard 14ft x 10ft', 'Custom Size']
  },
  {
    id: 'attr-2',
    name: 'Colour',
    values: ['Walnut Brown', 'Teak Wood Color', 'Wooden Natural', 'Smoked Ash', 'Pearl White', 'Matte Charcoal', 'Classic Honey']
  },
  {
    id: 'attr-3',
    name: 'Material',
    values: ['100% Solid Burma Teak', 'Indian Sheesham', 'American Walnut', '18mm BWP Marine Plywood', 'High-Density Virgin WPC', 'Italian Marble + SS']
  },
  {
    id: 'attr-4',
    name: 'Finish',
    values: ['Walnut Matte', 'PU Matte', 'High Gloss Polyester', 'Open Grain Satin', 'Anti-Scratch Acrylic', 'Suede Finish']
  }
];

export const DEFAULT_ADDON_PRODUCTS: ProductItem[] = [];


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
          discountPrice: d.discount_price ? Number(d.discount_price) : (d.discountPrice ? Number(d.discountPrice) : undefined),
          taxGst: d.tax_gst ? Number(d.tax_gst) : (d.taxGst ? Number(d.taxGst) : 18),
          shortDescription: d.short_description || d.shortDescription || '',
          description: d.description || '',
          material: d.material || '',
          finish: d.finish || '',
          size: d.size || '',
          dimensions: d.dimensions || '',
          warranty: d.warranty || '',
          stock: Number(d.stock) || 0,
          coverImage: d.cover_image || d.coverImage || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
          galleryImages: Array.isArray(d.gallery_images) ? d.gallery_images : (d.galleryImages || []),
          selectedAttributes: d.selected_attributes || d.selectedAttributes || {},
          variations: d.variations || [],
          specifications: d.specifications || {},
          status: (d.status as 'Active' | 'Inactive' | 'Draft') || 'Active',
          createdAt: d.created_at,
          updatedAt: d.updated_at
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Exclude legacy mock seed duplicate items
          const cleaned = parsed.filter((p: any) => 
            p && p.id && !['prod-addon-door-1', 'prod-addon-1', 'prod-addon-2'].includes(p.id)
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
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
      discountPrice: prod.discountPrice !== undefined ? Number(prod.discountPrice) : undefined,
      taxGst: prod.taxGst !== undefined ? Number(prod.taxGst) : 18,
      shortDescription: prod.shortDescription?.trim() || '',
      description: prod.description?.trim() || '',
      material: prod.material?.trim() || '',
      finish: prod.finish?.trim() || '',
      size: prod.size?.trim() || '',
      dimensions: prod.dimensions?.trim() || '',
      warranty: prod.warranty?.trim() || '10 Years Warranty',
      stock: Number(prod.stock) || 0,
      coverImage: prod.coverImage || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      galleryImages: Array.isArray(prod.galleryImages) && prod.galleryImages.length > 0 ? prod.galleryImages : [prod.coverImage || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80'],
      selectedAttributes: prod.selectedAttributes || {},
      variations: Array.isArray(prod.variations) ? prod.variations : [],
      specifications: prod.specifications || {},
      status: prod.status || 'Active',
      createdAt: prod.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
          discount_price: fullProd.discountPrice,
          tax_gst: fullProd.taxGst,
          short_description: fullProd.shortDescription,
          description: fullProd.description,
          material: fullProd.material,
          finish: fullProd.finish,
          size: fullProd.size,
          dimensions: fullProd.dimensions,
          warranty: fullProd.warranty,
          stock: fullProd.stock,
          cover_image: fullProd.coverImage,
          gallery_images: fullProd.galleryImages,
          selected_attributes: fullProd.selectedAttributes,
          variations: fullProd.variations,
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
