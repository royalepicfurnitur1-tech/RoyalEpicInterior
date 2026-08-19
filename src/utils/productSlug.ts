import { Product } from '../types';
import { PRODUCTS_DATA } from '../data/mockData';

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'main-entrance-doors': 'Main Entrance Doors',
  'wpc-bathroom-doors': 'WPC Bathroom Doors',
  'modular-kitchens': 'Modular Kitchens',
  'sliding-wardrobes': 'Sliding Wardrobes',
  'tv-units': 'TV Units',
  'sofas': 'Sofas',
  'dining-tables': 'Dining Tables',
  'commercial-furniture': 'Commercial Furniture',
  'kitchen-equipment': 'Kitchen Equipment',
  'glass-partitions': 'Glass Partitions',
  'doors': 'Main Entrance Doors',
  'kitchens': 'Modular Kitchens',
  'wardrobes': 'Sliding Wardrobes',
  'furniture': 'Sofas',
  'commercial-equipment': 'Kitchen Equipment',
  'partitions': 'Glass Partitions'
};

export function slugify(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function getProductSlug(product: { id?: string; name?: string; slug?: string } | null | undefined): string {
  if (!product) return '';
  if (product.slug && product.slug.trim().length > 0) {
    return slugify(product.slug);
  }
  const nameSlug = slugify(product.name || '');
  return nameSlug || `product-${product.id || 'item'}`;
}

export function getCategorySlug(categoryName: string | null | undefined): string {
  if (!categoryName) return 'furniture';
  const cleanCat = categoryName.trim().toLowerCase();
  const match = Object.entries(CATEGORY_SLUG_MAP).find(
    ([_, name]) => (name || '').toLowerCase() === cleanCat
  );
  if (match) return match[0];
  return slugify(categoryName) || 'furniture';
}

export function findCategoryBySlug(slug: string | null | undefined): string | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().trim();
  return CATEGORY_SLUG_MAP[clean];
}

export function findProductBySlug(products: Product[] | null | undefined, slug: string | null | undefined): Product | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();
  const list = Array.isArray(products) && products.length > 0 ? products : PRODUCTS_DATA;
  
  // 1. Direct slug or ID match
  const match = list.find((p) => {
    if (!p) return false;
    const pSlug = getProductSlug(p);
    return pSlug === cleanSlug || (p.id && p.id.toLowerCase() === cleanSlug);
  });

  if (match) return match;

  // 2. Fallback fuzzy check (matches if slug contains or starts with name key words)
  return list.find((p) => {
    if (!p || !p.name) return false;
    const candidateSlug = slugify(p.name);
    return candidateSlug === cleanSlug || candidateSlug.startsWith(cleanSlug) || cleanSlug.startsWith(candidateSlug);
  });
}

/**
 * Deduplicates product arrays by canonical ID, SKU, and slugified name.
 * Ensures the public catalog and search never display duplicate entries.
 */
export function deduplicateProducts(products: Product[] | null | undefined): Product[] {
  if (!Array.isArray(products) || products.length === 0) return [];

  const seenIds = new Set<string>();
  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();
  const result: Product[] = [];

  for (const product of products) {
    if (!product || !product.id) continue;

    const normalizedId = String(product.id).trim().toLowerCase();
    const normalizedSku = product.sku ? String(product.sku).trim().toLowerCase() : '';
    const normalizedSlug = getProductSlug(product).trim().toLowerCase();

    // Check if duplicate by ID, SKU or Title Slug
    const isDuplicateId = seenIds.has(normalizedId);
    const isDuplicateSku = normalizedSku ? seenSkus.has(normalizedSku) : false;
    const isDuplicateSlug = normalizedSlug ? seenSlugs.has(normalizedSlug) : false;

    if (isDuplicateId || isDuplicateSku || isDuplicateSlug) {
      continue;
    }

    seenIds.add(normalizedId);
    if (normalizedSku) seenSkus.add(normalizedSku);
    if (normalizedSlug) seenSlugs.add(normalizedSlug);

    result.push(product);
  }

  return result;
}
