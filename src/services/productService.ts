import { createClient } from '@supabase/supabase-js';
import { Product } from '../types';
import { PRODUCTS_DATA } from '../data/mockData';
import { getAddonProducts, ProductItem } from './productManagementService';
import { deduplicateProducts } from '../utils/productSlug';

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

// Convert ProductItem from Admin Product Management into public Product
export function mapProductItemToProduct(item: ProductItem): Product {
  const originalPrice = item.discountPrice && item.discountPrice < item.price 
    ? item.price 
    : Math.round(item.price * 1.2);
  const effectivePrice = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;
  const discountPercent = originalPrice > effectivePrice 
    ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
    : 0;

  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category,
    categorySlug: (item.category || 'furniture').toLowerCase().replace(/[^a-z0-9]/g, '-'),
    subCategory: item.subCategory,
    price: effectivePrice,
    originalPrice: originalPrice,
    discount: discountPercent,
    discountPrice: item.discountPrice,
    taxGst: item.taxGst || 18,
    stockQuantity: item.stock,
    rating: 4.9,
    reviewsCount: 14,
    image: item.coverImage,
    galleryImages: item.galleryImages && item.galleryImages.length > 0 ? item.galleryImages : [item.coverImage],
    shortDescription: item.shortDescription || item.description?.slice(0, 120),
    description: item.description,
    dimensions: item.dimensions || item.size,
    material: item.material,
    finish: item.finish,
    specifications: {
      material: item.material || 'Solid Teak / HDHMR Core',
      size: item.size || item.dimensions || 'Standard',
      finish: item.finish || 'Italian PU Matte / Satin',
      warranty: item.warranty || '15 Years Guarantee',
      brand: 'Royal Epic Interior',
      origin: 'Bengaluru Factory'
    },
    features: [
      '100% Termite Resistant & Marine Grade',
      'German Soft-Close Hardware Included',
      'Direct Factory Pricing & 15-Yr Warranty'
    ],
    attributes: item.selectedAttributes,
    variations: item.variations || [],
    isHot: true,
    isNew: true,
    inStock: item.stock > 0 && item.status !== 'Inactive',
    status: item.status
  };
}

// Helper to convert database snake_case row to frontend Product interface
export function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    categorySlug: row.category_slug || (row.category || 'furniture').toLowerCase().replace(/[^a-z0-9]/g, '-'),
    subCategory: row.sub_category || row.subCategory,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : Number(row.price) * 1.2,
    discount: Number(row.discount || 0),
    discountPrice: row.discount_price ? Number(row.discount_price) : undefined,
    taxGst: row.tax_gst ? Number(row.tax_gst) : 18,
    stockQuantity: row.stock ? Number(row.stock) : 10,
    rating: Number(row.rating || 4.9),
    reviewsCount: Number(row.reviews_count || 12),
    image: row.image,
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : (row.image ? [row.image] : []),
    shortDescription: row.short_description || row.description?.slice(0, 120),
    description: row.description || 'Custom crafted luxury interior piece by Royal Epic Interior.',
    dimensions: row.dimensions || row.size,
    material: row.material,
    finish: row.finish,
    specifications: typeof row.specifications === 'object' && row.specifications !== null 
      ? row.specifications 
      : {
          material: row.material || 'Solid Teak / HDHMR Plywood Core',
          size: row.size || 'Custom Factory Dimensions',
          finish: row.finish || 'Italian PU Matte / High Gloss',
          warranty: '10 Years Factory Guarantee',
          brand: 'Royal Epic Interior',
          origin: 'Bengaluru Factory'
        },
    features: Array.isArray(row.features) 
      ? row.features 
      : ['100% Termite Resistant', 'German Soft-Close Hardware', 'Factory Finish Guarantee'],
    attributes: row.attributes || row.selected_attributes,
    variations: row.variations || [],
    isHot: Boolean(row.is_hot),
    isNew: Boolean(row.is_new),
    has3dViewer: Boolean(row.has_3d_viewer),
    inStock: row.in_stock !== false,
    status: row.status || 'Active',
    brochureUrl: row.brochure_url || undefined
  };
}

// Helper to convert frontend Product to database row
export function mapProductToRow(product: Partial<Product>): any {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    category_slug: product.categorySlug || (product.category || 'furniture').toLowerCase().replace(/[^a-z0-9]/g, '-'),
    sub_category: product.subCategory,
    price: Number(product.price),
    original_price: product.originalPrice ? Number(product.originalPrice) : Math.round(Number(product.price) * 1.2),
    discount: Number(product.discount || 0),
    discount_price: product.discountPrice,
    tax_gst: product.taxGst || 18,
    stock: product.stockQuantity || 10,
    rating: Number(product.rating || 4.9),
    reviews_count: Number(product.reviewsCount || 12),
    image: product.image,
    gallery_images: product.galleryImages || (product.image ? [product.image] : []),
    short_description: product.shortDescription,
    description: product.description || '',
    dimensions: product.dimensions,
    material: product.material,
    finish: product.finish,
    specifications: product.specifications || {},
    features: product.features || [],
    attributes: product.attributes,
    variations: product.variations,
    is_hot: Boolean(product.isHot),
    is_new: Boolean(product.isNew),
    has_3d_viewer: Boolean(product.has3dViewer),
    in_stock: product.inStock !== false,
    status: product.status || 'Active',
    brochure_url: product.brochureUrl || null,
    updated_at: new Date().toISOString()
  };
}

/**
 * Fetch all products:
 * Merges Catalog Products with Admin Addon Products
 */
export async function getProducts(): Promise<{ products: Product[]; source: 'supabase' | 'cache' | 'default'; error?: string }> {
  try {
    // 1. Fetch addon products created by Admin
    let addonProducts: Product[] = [];
    try {
      const addons = await getAddonProducts();
      addonProducts = addons
        .filter(a => a.status !== 'Inactive')
        .map(mapProductItemToProduct);
    } catch (e) {
      console.warn("Could not fetch addon products:", e);
    }

    // 2. Fetch base products
    let baseProducts: Product[] = PRODUCTS_DATA;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      baseProducts = data.map(mapRowToProduct);
    } else {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            baseProducts = parsed;
          }
        } catch {}
      }
    }

    // Merge and deduplicate by canonical ID, SKU, and slug (addon products take priority)
    const rawMerged = [
      ...addonProducts,
      ...baseProducts
    ];
    const merged = deduplicateProducts(rawMerged);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
    } catch {}

    return { products: merged, source: 'supabase' };
  } catch (err: any) {
    console.error('getProducts exception:', err);
    return { products: deduplicateProducts(PRODUCTS_DATA), source: 'default', error: err.message };
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

export async function seedProductsToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const productsToSeed = PRODUCTS_DATA.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      image_url: p.image,
      stock: p.stockQuantity ?? 10,
      in_stock: p.inStock ?? true,
      description: p.description || p.shortDescription || '',
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('products')
      .upsert(productsToSeed, { onConflict: 'id' });

    if (error) {
      return { success: false, count: 0, error: error.message };
    }
    return { success: true, count: productsToSeed.length };
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

