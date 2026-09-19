import { createClient } from '@supabase/supabase-js';
import { Product } from '../types';
import { PRODUCTS_DATA } from '../data/mockData';
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

// Helper to convert database snake_case row to frontend Product interface
export function mapRowToProduct(row: any): Product {
  const specs = typeof row.specifications === 'object' && row.specifications !== null ? row.specifications : {};
  return {
    id: String(row.id),
    name: row.name || 'Untitled Product',
    sku: specs.sku || row.sku || `RE-SKU-${row.id}`,
    category: row.category || 'Living Room Luxury',
    categorySlug: row.category_slug || (row.category || 'furniture').toLowerCase().replace(/[^a-z0-9]/g, '-'),
    subCategory: specs.subCategory || row.sub_category || row.subCategory || '',
    price: Number(row.price || 0),
    originalPrice: row.original_price ? Number(row.original_price) : Math.round(Number(row.price || 0) * 1.2),
    discount: Number(row.discount || 0),
    discountPrice: specs.discountPrice || Number(row.price || 0),
    taxGst: specs.taxGst ? Number(specs.taxGst) : 18,
    stockQuantity: specs.stockQuantity !== undefined ? Number(specs.stockQuantity) : (row.in_stock ? 10 : 0),
    rating: Number(row.rating || 4.9),
    reviewsCount: Number(row.reviews_count || 12),
    image: row.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    galleryImages: Array.isArray(row.gallery_images) && row.gallery_images.length > 0 ? row.gallery_images : (row.image ? [row.image] : []),
    shortDescription: specs.shortDescription || row.description?.slice(0, 120),
    description: row.description || 'Custom crafted luxury interior piece by Royal Epic Interior.',
    dimensions: specs.dimensions || specs.size || 'Custom Factory Dimensions',
    material: specs.material || 'Solid Teak / HDHMR Plywood Core',
    finish: specs.finish || 'Italian PU Matte / Satin',
    specifications: {
      material: specs.material || 'Solid Teak / HDHMR Plywood Core',
      size: specs.dimensions || specs.size || 'Custom Factory Dimensions',
      finish: specs.finish || 'Italian PU Matte / Satin',
      warranty: specs.warranty || '10 Years Factory Guarantee',
      brand: specs.brand || 'Royal Epic Interior',
      origin: specs.origin || 'Bengaluru Factory',
      ...specs
    },
    features: Array.isArray(row.features) && row.features.length > 0 
      ? row.features 
      : ['100% Termite Resistant', 'German Soft-Close Hardware', 'Factory Finish Guarantee'],
    attributes: specs.attributes,
    variations: specs.variations || [],
    isHot: Boolean(row.is_hot),
    isNew: Boolean(row.is_new),
    has3dViewer: Boolean(row.has_3d_viewer),
    inStock: row.in_stock !== false,
    status: specs.status || (row.in_stock !== false ? 'Active' : 'Inactive'),
    brochureUrl: row.brochure_url || undefined
  };
}

/**
 * Helper to convert frontend Product to database row strictly matching
 * the live Supabase `products` table columns:
 * [id, name, category, category_slug, price, original_price, discount,
 *  rating, reviews_count, image, gallery_images, description,
 *  specifications, features, is_hot, is_new, has_3d_viewer, in_stock,
 *  brochure_url, updated_at]
 *
 * Additional attributes, SKU, status, stockQuantity, dimensions, material,
 * finish, etc. are safely embedded in the `specifications` JSONB column.
 */
export function mapProductToRow(product: Partial<Product>): any {
  const existingSpecs = typeof product.specifications === 'object' && product.specifications !== null 
    ? product.specifications 
    : {};

  const specs = {
    ...existingSpecs,
    sku: product.sku || existingSpecs.sku,
    material: product.material || existingSpecs.material || 'Solid Burma Teak Core',
    finish: product.finish || existingSpecs.finish || 'Italian PU Matte',
    dimensions: product.dimensions || existingSpecs.dimensions || existingSpecs.size || 'Custom Dimensions',
    warranty: existingSpecs.warranty || '10 Years Factory Guarantee',
    brand: existingSpecs.brand || 'Royal Epic Interior',
    origin: existingSpecs.origin || 'Bengaluru Factory',
    status: product.status || (product.inStock === false ? 'Inactive' : 'Active'),
    taxGst: product.taxGst || existingSpecs.taxGst || 18,
    stockQuantity: product.stockQuantity !== undefined ? product.stockQuantity : (existingSpecs.stockQuantity !== undefined ? existingSpecs.stockQuantity : 10),
    subCategory: product.subCategory || existingSpecs.subCategory,
    attributes: product.attributes || existingSpecs.attributes,
    variations: product.variations || existingSpecs.variations
  };

  return {
    id: String(product.id),
    name: product.name || 'Untitled Product',
    category: product.category || 'Living Room Luxury',
    category_slug: product.categorySlug || (product.category || 'furniture').toLowerCase().replace(/[^a-z0-9]/g, '-'),
    price: Number(product.price || 0),
    original_price: product.originalPrice ? Number(product.originalPrice) : Math.round(Number(product.price || 0) * 1.2),
    discount: Number(product.discount || 0),
    rating: Number(product.rating || 4.9),
    reviews_count: Number(product.reviewsCount || 12),
    image: product.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    gallery_images: Array.isArray(product.galleryImages) && product.galleryImages.length > 0 
      ? product.galleryImages 
      : [product.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'],
    description: product.description || 'Factory-made luxury furniture piece by Royal Epic Interior.',
    specifications: specs,
    features: Array.isArray(product.features) && product.features.length > 0 
      ? product.features 
      : ['100% Termite Resistant', 'Factory Finish Guarantee'],
    is_hot: Boolean(product.isHot),
    is_new: Boolean(product.isNew),
    has_3d_viewer: Boolean(product.has3dViewer),
    in_stock: product.inStock !== false,
    brochure_url: product.brochureUrl || null,
    updated_at: new Date().toISOString()
  };
}

/**
 * Fetch all products from the single Supabase `products` source of truth.
 */
export async function getProducts(): Promise<{ products: Product[]; source: 'supabase' | 'default'; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getProducts error, falling back to default catalog:', error.message);
      return { products: deduplicateProducts(PRODUCTS_DATA), source: 'default', error: error.message };
    }

    if (data && data.length > 0) {
      const liveProducts = data.map(mapRowToProduct);
      return { products: deduplicateProducts(liveProducts), source: 'supabase' };
    }

    // If Supabase table is completely empty, fallback to catalog
    return { products: deduplicateProducts(PRODUCTS_DATA), source: 'default' };
  } catch (err: any) {
    console.error('getProducts exception:', err);
    return { products: deduplicateProducts(PRODUCTS_DATA), source: 'default', error: err.message };
  }
}

/**
 * Save or Update a Product directly to Supabase products table.
 * Never silently report success on failure; never use browser-only fallback.
 */
export async function saveProduct(product: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const id = product.id || `prod-${Date.now()}`;
    const productWithId = { ...product, id };
    const row = mapProductToRow(productWithId);

    // Upsert directly into Supabase products table
    const { data, error } = await supabase
      .from('products')
      .upsert(row)
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error.message);
      return { 
        success: false, 
        error: `Database save error: ${error.message}` 
      };
    }

    const savedProduct = mapRowToProduct(data || row);
    return { success: true, product: savedProduct };
  } catch (err: any) {
    console.error('saveProduct exception:', err);
    return { success: false, error: err.message || 'Unknown database save exception' };
  }
}

/**
 * Delete a Product by ID permanently from Supabase products table.
 */
export async function deleteProductById(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('deleteProductById exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sync / Seed default catalog to Supabase products table using the valid schema.
 */
export async function seedProductsToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const productsToSeed = PRODUCTS_DATA.map(p => mapProductToRow(p));

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

