import { Product } from '../types';

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

export function slugify(text: string): string {
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

export function getProductSlug(product: { id: string; name: string; slug?: string }): string {
  if (product.slug && product.slug.trim().length > 0) {
    return slugify(product.slug);
  }
  const nameSlug = slugify(product.name);
  return nameSlug || `product-${product.id}`;
}

export function getCategorySlug(categoryName: string): string {
  const match = Object.entries(CATEGORY_SLUG_MAP).find(
    ([_, name]) => name.toLowerCase() === categoryName.toLowerCase()
  );
  if (match) return match[0];
  return slugify(categoryName);
}

export function findCategoryBySlug(slug: string): string | undefined {
  const clean = slug.toLowerCase().trim();
  return CATEGORY_SLUG_MAP[clean];
}

export function findProductBySlug(products: Product[], slug: string): Product | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();
  
  // 1. Direct slug or derived slug match
  const match = products.find((p) => {
    const pSlug = getProductSlug(p);
    return pSlug === cleanSlug || p.id.toLowerCase() === cleanSlug;
  });

  if (match) return match;

  // 2. Fallback fuzzy check (matches if slug contains or starts with name key words)
  return products.find((p) => {
    const candidateSlug = slugify(p.name);
    return candidateSlug.startsWith(cleanSlug) || cleanSlug.startsWith(candidateSlug);
  });
}
