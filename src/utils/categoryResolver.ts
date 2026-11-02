import { Product } from '../types';

export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  sectionId?: string;
  sectionTitle?: string;
  matchProduct: (p: Product) => boolean;
}

function norm(value?: string): string {
  return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function isMisplacedNonLivingProduct(product: Product): boolean {
  const n = norm(product.name);
  const sub = norm(product.subCategory);
  return (
    n.includes('wardrobe') ||
    n.includes('pooja') ||
    n.includes('mandir') ||
    n.includes('bedroom') ||
    sub.includes('wardrobe') ||
    sub.includes('pooja') ||
    sub.includes('bedroom')
  );
}

// ---------------------------------------------------------------------------
// 1. EXACT 6 RESIDENTIAL INTERIOR SUBCATEGORIES
// ---------------------------------------------------------------------------
export const RESIDENTIAL_SUBCATEGORIES: CategoryDefinition[] = [
  {
    id: 'res-living-room',
    name: 'Living Room Interiors',
    slug: 'living-room',
    sectionId: 'serv-1',
    sectionTitle: 'Residential Interior Design',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);

      if (cat === 'living room interiors' || sub === 'living room interiors') return true;
      if (cat === 'sofas' || cat === 'tv units' || cat === 'luxury sofas & sectionals') return true;
      if (cat === 'living room luxury' && !isMisplacedNonLivingProduct(p)) return true;
      if (name.includes('living room') || name.includes('sofa') || name.includes('tv unit')) return true;
      return false;
    }
  },
  {
    id: 'res-modular-kitchen',
    name: 'Modular Kitchen',
    slug: 'modular-kitchen',
    sectionId: 'serv-1',
    sectionTitle: 'Residential Interior Design',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);

      if (cat === 'modular kitchen' || cat === 'modular kitchens' || sub.includes('modular kitchen')) return true;
      if (
        cat === 'kitchen equipment' &&
        (name.includes('kitchen counter') || name.includes('breakfast counter') || name.includes('modular kitchen'))
      ) {
        return true;
      }
      return false;
    }
  },
  {
    id: 'res-bedroom',
    name: 'Bedroom Interiors',
    slug: 'bedroom',
    sectionId: 'serv-1',
    sectionTitle: 'Residential Interior Design',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);

      if (
        cat === 'bedroom interiors' ||
        cat === 'master bedroom suites' ||
        cat === 'sliding wardrobes' ||
        cat === 'wall beds' ||
        cat === 'wall  beds' ||
        sub.includes('bedroom') ||
        sub.includes('wardrobe')
      ) {
        return true;
      }
      if (name.includes('bedroom') || name.includes('wardrobe') || name.includes('bunk bed') || name.includes('wall bed')) {
        return true;
      }
      return false;
    }
  },
  {
    id: 'res-bathroom',
    name: 'Bathroom Interiors',
    slug: 'bathroom',
    sectionId: 'serv-1',
    sectionTitle: 'Residential Interior Design',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);

      if (
        cat === 'bathroom interiors' ||
        cat === 'luxury bathrooms' ||
        cat === 'wpc bathroom doors' ||
        sub.includes('bathroom')
      ) {
        return true;
      }
      if (
        name.includes('bathroom') ||
        name.includes('shower partition') ||
        name.includes('wall hung toilet') ||
        name.includes('vanity')
      ) {
        return true;
      }
      return false;
    }
  },
  {
    id: 'res-pooja-room',
    name: 'Pooja Room Interiors',
    slug: 'pooja-room',
    sectionId: 'serv-1',
    sectionTitle: 'Residential Interior Design',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);
      const desc = norm(p.description);

      if (
        cat === 'pooja room' ||
        cat === 'pooja room interiors' ||
        cat === 'pooja units' ||
        sub.includes('pooja') ||
        sub.includes('mandir')
      ) {
        return true;
      }
      if (name.includes('pooja') || name.includes('mandir') || desc.includes('pooja room') || desc.includes('mandir')) {
        return true;
      }
      return false;
    }
  },
  {
    id: 'res-modular-interiors',
    name: 'Modular Interiors',
    slug: 'modular-interiors',
    sectionId: 'serv-1',
    sectionTitle: 'Residential Interior Design',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);
      const desc = norm(p.description);

      if (cat === 'modular interiors' || sub === 'modular interiors') return true;
      if (cat === 'modular kitchen' || cat === 'modular kitchens' || name.includes('kitchen')) return false;
      if (
        name.includes('modular') ||
        name.includes('module') ||
        sub.includes('modular') ||
        desc.includes('modular')
      ) {
        return true;
      }
      return false;
    }
  }
];

// ---------------------------------------------------------------------------
// 2. COMMERCIAL & OFFICE INTERIOR SUBCATEGORIES (From existing data)
// ---------------------------------------------------------------------------
export const COMMERCIAL_SUBCATEGORIES: CategoryDefinition[] = [
  {
    id: 'comm-acoustic',
    name: 'Acoustic & Soundproofing Solutions',
    slug: 'acoustic-soundproofing',
    sectionId: 'serv-2',
    sectionTitle: 'Commercial & Office Interior',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return (
        cat === 'sound proof and acoustic materials' ||
        name.includes('acoustic') ||
        name.includes('ecoustic') ||
        name.includes('sound absorbing')
      );
    }
  },
  {
    id: 'comm-partitions',
    name: 'Glass & Aluminium Partitions',
    slug: 'glass-aluminium-partitions',
    sectionId: 'serv-2',
    sectionTitle: 'Commercial & Office Interior',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      if (name.includes('wardrobe')) return false;
      return (
        cat === 'aluminium doors' ||
        cat === 'glass partitions' ||
        name.includes('aluminium') ||
        name.includes('glass partition')
      );
    }
  },
  {
    id: 'comm-wall-panels',
    name: 'Architectural Wall Panels & Materials',
    slug: 'wall-panels-materials',
    sectionId: 'serv-2',
    sectionTitle: 'Commercial & Office Interior',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      return cat === 'wall decor' || cat === 'materials';
    }
  },
  {
    id: 'comm-workstations',
    name: 'Corporate Workstations & Executive Seating',
    slug: 'corporate-workstations',
    sectionId: 'serv-2',
    sectionTitle: 'Commercial & Office Interior',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      const desc = norm(p.description);
      if (name.includes('office') || name.includes('workstation')) return true;
      if (cat === 'commercial furniture' && (desc.includes('office') || desc.includes('workstation'))) return true;
      return false;
    }
  }
];

// ---------------------------------------------------------------------------
// 3. RESTAURANT & HOTEL INTERIOR SUBCATEGORIES (From existing data)
// ---------------------------------------------------------------------------
export const RESTAURANT_SUBCATEGORIES: CategoryDefinition[] = [
  {
    id: 'hosp-booths-lounge',
    name: 'Restaurant Booths & Lounge Seating',
    slug: 'restaurant-booths-lounge',
    sectionId: 'serv-3',
    sectionTitle: 'Restaurant & Hotel Interior',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return (
        (cat === 'commercial furniture' &&
          (name.includes('restaurant') || name.includes('booth') || name.includes('banquette') || name.includes('lounge') || name.includes('bar'))) ||
        name.includes('restaurant booth') ||
        name.includes('lounge & bar')
      );
    }
  },
  {
    id: 'hosp-dining-tables',
    name: 'Dining Tables & Hospitality Surfaces',
    slug: 'dining-tables-hospitality',
    sectionId: 'serv-3',
    sectionTitle: 'Restaurant & Hotel Interior',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      return cat === 'dining tables' || cat === 'dining & crockery';
    }
  },
  {
    id: 'hosp-wooden-chairs',
    name: 'Wooden Dining Chairs & Armchairs',
    slug: 'wooden-dining-chairs',
    sectionId: 'serv-3',
    sectionTitle: 'Restaurant & Hotel Interior',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      return cat === 'wooden chairs & dining furniture';
    }
  },
  {
    id: 'hosp-kitchen-counters',
    name: 'Kitchen & Service Counters',
    slug: 'kitchen-service-counters',
    sectionId: 'serv-3',
    sectionTitle: 'Restaurant & Hotel Interior',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      return cat === 'kitchen equipment';
    }
  }
];

// Unified map for quick slug/name lookup
export const ALL_CURATED_CATEGORIES: CategoryDefinition[] = [
  ...RESIDENTIAL_SUBCATEGORIES,
  ...COMMERCIAL_SUBCATEGORIES,
  ...RESTAURANT_SUBCATEGORIES
];

/**
 * Resolves a category slug or query parameter to its canonical CategoryDefinition
 */
export function resolveCategoryDefinition(param?: string | null): CategoryDefinition | null {
  if (!param) return null;
  const clean = norm(param).replace(/^\?category=/, '').replace(/^category=/, '');
  if (!clean || clean === 'all') return null;

  // Direct slug match
  const bySlug = ALL_CURATED_CATEGORIES.find((c) => norm(c.slug) === clean);
  if (bySlug) return bySlug;

  // Direct name match
  const byName = ALL_CURATED_CATEGORIES.find((c) => norm(c.name) === clean);
  if (byName) return byName;

  // Fuzzy slug match (e.g. "living-room-interiors" matches "living-room")
  const byFuzzy = ALL_CURATED_CATEGORIES.find(
    (c) =>
      clean.includes(norm(c.slug)) ||
      norm(c.slug).includes(clean) ||
      clean.replace(/-/g, ' ') === norm(c.name)
  );
  if (byFuzzy) return byFuzzy;

  return null;
}

/**
 * Checks whether a given product matches a selected category key (slug, curated name, or standard database category)
 */
export function matchProductToSelectedCategory(product: Product, categoryKey: string): boolean {
  if (!categoryKey || categoryKey === 'All' || categoryKey.toLowerCase() === 'all') {
    return true;
  }

  // Check if it's one of our curated subcategories
  const def = resolveCategoryDefinition(categoryKey);
  if (def) {
    return def.matchProduct(product);
  }

  // Standard category match
  const cat = norm(product.category);
  const target = norm(categoryKey);

  if (cat === target) return true;

  if (target === 'sofas' && (cat.includes('sofa') || norm(product.name).includes('sofa'))) return true;
  if (target === 'dining tables' && (cat.includes('dining table') || norm(product.name).includes('dining table'))) return true;
  if (target === 'modular kitchens' && (cat.includes('kitchen') || norm(product.name).includes('kitchen'))) return true;
  if (target === 'sliding wardrobes' && (cat.includes('wardrobe') || norm(product.name).includes('wardrobe'))) return true;
  if (target === 'tv units' && (cat.includes('tv unit') || norm(product.name).includes('tv unit'))) return true;
  if (target === 'doors' && (cat.includes('door') || norm(product.name).includes('door'))) return true;
  if (target === 'wpc bathroom doors' && (cat.includes('wpc') || cat.includes('bathroom'))) return true;

  return false;
}

export function slugify(text: string): string {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
