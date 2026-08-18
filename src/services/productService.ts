import { createClient } from '@supabase/supabase-js';
import { Product } from '../types';
import { PRODUCTS_DATA } from '../data/mockData';

// Supabase Connection Credentials (with fallbacks)
const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const SUPABASE_URL = 
  metaEnv.VITE_SUPABASE_URL || 
  'https://lwrfoztfsyffgtybesia.supabase.co';

const SUPABASE_ANON_KEY = 
  metaEnv.VITE_SUPABASE_ANON_KEY || 
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCAL_STORAGE_KEY = 'royal_epic_products_cache';

// Helper to convert database snake_case row to frontend Product interface
export function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categorySlug: row.category_slug || (row.category || 'furniture').toLowerCase().replace(/[^a-z0-9]/g, '-'),
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : Number(row.price) * 1.2,
    discount: Number(row.discount || 0),
    rating: Number(row.rating || 4.9),
    reviewsCount: Number(row.reviews_count || 12),
    image: row.image,
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : (row.image ? [row.image] : []),
    description: row.description || 'Custom crafted luxury interior piece by Royal Epic Interior.',
    specifications: typeof row.specifications === 'object' && row.specifications !== null 
      ? row.specifications 
      : {
          material: 'Solid Teak / HDHMR Plywood Core',
          size: 'Custom Factory Dimensions',
          finish: 'Italian PU Matte / High Gloss',
          warranty: '10 Years Factory Guarantee',
          brand: 'Royal Epic Interior',
          origin: 'Bengaluru Factory'
        },
    features: Array.isArray(row.features) 
      ? row.features 
      : ['100% Termite Resistant', 'German Soft-Close Hardware', 'Factory Finish Guarantee'],
    isHot: Boolean(row.is_hot),
    isNew: Boolean(row.is_new),
    has3dViewer: Boolean(row.has_3d_viewer),
    inStock: row.in_stock !== false,
    brochureUrl: row.brochure_url || undefined
  };
}

// Helper to convert frontend Product to database row
export function mapProductToRow(product: Partial<Product>): any {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    category_slug: product.categorySlug || (product.category || 'furniture').toLowerCase().replace(/[^a-z0-9]/g, '-'),
    price: Number(product.price),
    original_price: product.originalPrice ? Number(product.originalPrice) : Math.round(Number(product.price) * 1.2),
    discount: Number(product.discount || 0),
    rating: Number(product.rating || 4.9),
    reviews_count: Number(product.reviewsCount || 12),
    image: product.image,
    gallery_images: product.galleryImages || (product.image ? [product.image] : []),
    description: product.description || '',
    specifications: product.specifications || {},
    features: product.features || [],
    is_hot: Boolean(product.isHot),
    is_new: Boolean(product.isNew),
    has_3d_viewer: Boolean(product.has3dViewer),
    in_stock: product.inStock !== false,
    brochure_url: product.brochureUrl || null,
    updated_at: new Date().toISOString()
  };
}

/**
 * Fetch all products:
 * 1. Attempts Supabase query first.
 * 2. Falls back to localStorage cache if network fails.
 * 3. Falls back to default PRODUCTS_DATA.
 */
export async function getProducts(): Promise<{ products: Product[]; source: 'supabase' | 'cache' | 'default'; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase products fetch warning:', error.message);
      // If table does not exist or network failed, fallback to local storage
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return { products: parsed, source: 'cache', error: error.message };
          }
        } catch {}
      }
      return { products: PRODUCTS_DATA, source: 'default', error: error.message };
    }

    if (data && data.length > 0) {
      const mapped = data.map(mapRowToProduct);
      // Cache locally for offline resiliency
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
      } catch {}
      return { products: mapped, source: 'supabase' };
    }

    // If Supabase table is empty, check localStorage or default
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { products: parsed, source: 'cache' };
        }
      } catch {}
    }

    return { products: PRODUCTS_DATA, source: 'default' };
  } catch (err: any) {
    console.error('getProducts exception:', err);
    return { products: PRODUCTS_DATA, source: 'default', error: err.message };
  }
}

/**
 * Save or Update a Product
 */
export async function saveProduct(product: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const id = product.id || `prod-${Date.now()}`;
    const productWithId = { ...product, id };
    const row = mapProductToRow(productWithId);

    // Upsert into Supabase
    const { data, error } = await supabase
      .from('products')
      .upsert(row)
      .select()
      .single();

    if (error) {
      console.warn('Supabase upsert error:', error.message);
      // Fallback: update local storage directly
      updateLocalCache(productWithId as Product);
      return { 
        success: true, 
        product: productWithId as Product, 
        error: `Saved to local cache (${error.message})` 
      };
    }

    const savedProduct = mapRowToProduct(data || row);
    updateLocalCache(savedProduct);
    return { success: true, product: savedProduct };
  } catch (err: any) {
    console.error('saveProduct exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a Product by ID
 */
export async function deleteProductById(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    // Remove from local cache regardless
    removeLocalCache(id);

    if (error) {
      console.warn('Supabase delete warning:', error.message);
      return { success: true, error: `Removed locally (${error.message})` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('deleteProductById exception:', err);
    removeLocalCache(id);
    return { success: false, error: err.message };
  }
}

/**
 * Seed initial mock products to Supabase in 1-click
 */
export async function seedProductsToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const rows = PRODUCTS_DATA.map(mapProductToRow);
    const { error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    // Refresh local cache
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(PRODUCTS_DATA));
    return { success: true, count: rows.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
  }
}

// Local storage helper utilities
function updateLocalCache(product: Product) {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    let items: Product[] = cached ? JSON.parse(cached) : [...PRODUCTS_DATA];
    const index = items.findIndex(p => p.id === product.id);
    if (index >= 0) {
      items[index] = product;
    } else {
      items.unshift(product);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function removeLocalCache(id: string) {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    let items: Product[] = cached ? JSON.parse(cached) : [...PRODUCTS_DATA];
    items = items.filter(p => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}
