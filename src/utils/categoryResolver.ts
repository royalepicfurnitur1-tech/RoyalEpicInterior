import { Product } from '../types';

export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  aliases?: string[];
  sectionId?: string;
  sectionTitle?: string;
  matchProduct: (p: Product) => boolean;
}

function norm(value?: string): string {
  return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function slugify(text?: string | null): string {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function isMisplacedNonLivingProduct(product: Product): boolean {
  const n = norm(product.name);
  const sub = norm(product.subCategory);
  return (
    n.includes('wardrobe') ||
    n.includes('pooja') ||
    n.includes('mandir') ||
    n.includes('bedroom') ||
    n.includes('flush door') ||
    sub.includes('wardrobe') ||
    sub.includes('pooja') ||
    sub.includes('bedroom')
  );
}

function isWpcDoorProduct(p: Product): boolean {
  const cat = norm(p.category);
  const name = norm(p.name);
  // Exclude non-door bathroom fixtures (toilets, shower glass partitions, wall panels)
  if (name.includes('toilet') || name.includes('shower') || name.includes('wall panel') || name.includes('louver')) {
    return false;
  }
  if (cat === 'wpc waterproof doors') return true;
  if (cat === 'wpc bathroom doors' && name.includes('door')) return true;
  if (name.includes('wpc') && name.includes('door')) return true;
  return false;
}

function isMainEntranceDoorProduct(p: Product): boolean {
  const cat = norm(p.category);
  const name = norm(p.name);
  if (cat === 'main entrance doors') return true;
  if (name.includes('entrance door') || name.includes('main door') || name.includes('main entrance')) return true;
  return false;
}

function isWallBedProduct(p: Product): boolean {
  const cat = norm(p.category);
  const name = norm(p.name);
  return (
    cat === 'wall beds' ||
    name.includes('wall bed') ||
    name.includes('wall-mounted bed') ||
    name.includes('wall-mounted single bed') ||
    name.includes('wall-mounted iron bed') ||
    name.includes('wall-mounted bunk bed') ||
    name.includes('bunk bed') ||
    name.includes('bunker bed')
  );
}

function isWardrobeProduct(p: Product): boolean {
  const cat = norm(p.category);
  const sub = norm(p.subCategory);
  const name = norm(p.name);
  return cat === 'sliding wardrobes' || sub.includes('wardrobe') || name.includes('wardrobe');
}

function isKitchenProduct(p: Product): boolean {
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
  if (name.includes('modular kitchen') || name.includes('kitchen counter') || name.includes('breakfast counter')) {
    return true;
  }
  return false;
}

function isDiningTableProduct(p: Product): boolean {
  const cat = norm(p.category);
  const name = norm(p.name);
  return cat === 'dining tables' || name.includes('dining table');
}

function isWoodenDiningChairProduct(p: Product): boolean {
  const cat = norm(p.category);
  const name = norm(p.name);
  return (
    cat === 'wooden chairs & dining furniture' ||
    name.includes('dining chair') ||
    name.includes('wooden arm chair')
  );
}

function isGlassPartitionProduct(p: Product): boolean {
  const cat = norm(p.category);
  const name = norm(p.name);
  if (name.includes('wardrobe')) return false;
  return (
    cat === 'glass partitions' ||
    name.includes('glass partition') ||
    name.includes('shower partition') ||
    name.includes('glass door')
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
    aliases: ['living-room-interiors'],
    sectionId: 'serv-1',
    sectionTitle: 'Residential Interior Design',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);

      if (isMisplacedNonLivingProduct(p)) return false;
      if (cat === 'living room interiors' || sub === 'living room interiors') return true;
      if (cat === 'sofas' || cat === 'tv units' || cat === 'luxury sofas & sectionals') return true;
      if (cat === 'living room luxury') return true;
      if (name.includes('living room') || name.includes('sofa') || name.includes('tv unit') || name.includes('tv console')) return true;
      return false;
    }
  },
  {
    id: 'res-modular-kitchen',
    name: 'Modular Kitchen',
    slug: 'modular-kitchen',
    aliases: ['kitchens'],
    sectionId: 'serv-1',
    sectionTitle: 'Residential Interior Design',
    matchProduct: isKitchenProduct
  },
  {
    id: 'res-bedroom',
    name: 'Bedroom Interiors',
    slug: 'bedroom',
    aliases: ['bedroom-interiors'],
    sectionId: 'serv-1',
    sectionTitle: 'Residential Interior Design',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);

      if (
        cat === 'bedroom interiors' ||
        cat === 'master bedroom suites' ||
        isWardrobeProduct(p) ||
        isWallBedProduct(p) ||
        sub.includes('bedroom')
      ) {
        return true;
      }
      if (name.includes('bedroom')) return true;
      return false;
    }
  },
  {
    id: 'res-bathroom',
    name: 'Bathroom Interiors',
    slug: 'bathroom',
    aliases: ['bathroom-interiors', 'luxury-bathrooms'],
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
        isWpcDoorProduct(p) ||
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
    aliases: ['pooja-room-interiors', 'pooja-units', 'pooja-room-mandirs'],
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
      if (cat === 'modular kitchen' || cat === 'modular kitchens') return false;
      if (
        name.includes('modular') ||
        name.includes('module') ||
        sub.includes('modular') ||
        desc.includes('modular') ||
        isWardrobeProduct(p) ||
        cat === 'tv units'
      ) {
        return true;
      }
      return false;
    }
  }
];

// ---------------------------------------------------------------------------
// 2. COMMERCIAL & OFFICE INTERIOR SUBCATEGORIES
// ---------------------------------------------------------------------------
export const COMMERCIAL_SUBCATEGORIES: CategoryDefinition[] = [
  {
    id: 'comm-acoustic',
    name: 'Acoustic & Soundproofing Solutions',
    slug: 'acoustic-soundproofing',
    aliases: ['acoustic-materials'],
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
    aliases: ['partitions'],
    sectionId: 'serv-2',
    sectionTitle: 'Commercial & Office Interior',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      if (name.includes('wardrobe')) return false;
      return (
        cat === 'aluminium doors' ||
        isGlassPartitionProduct(p) ||
        name.includes('aluminium')
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
      if (
        cat === 'commercial furniture' ||
        name.includes('office') ||
        name.includes('workstation') ||
        name.includes('executive') ||
        name.includes('arm chair') ||
        name.includes('conference') ||
        name.includes('lounge') ||
        name.includes('desk')
      ) {
        return true;
      }
      return false;
    }
  }
];

// ---------------------------------------------------------------------------
// 3. RESTAURANT & HOTEL INTERIOR SUBCATEGORIES
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
      return isDiningTableProduct(p) || cat === 'dining & crockery';
    }
  },
  {
    id: 'hosp-wooden-chairs',
    name: 'Wooden Dining Chairs & Armchairs',
    slug: 'wooden-dining-chairs',
    sectionId: 'serv-3',
    sectionTitle: 'Restaurant & Hotel Interior',
    matchProduct: isWoodenDiningChairProduct
  },
  {
    id: 'hosp-kitchen-counters',
    name: 'Kitchen & Service Counters',
    slug: 'kitchen-service-counters',
    sectionId: 'serv-3',
    sectionTitle: 'Restaurant & Hotel Interior',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return cat === 'kitchen equipment' || name.includes('kitchen counter') || name.includes('breakfast counter');
    }
  }
];

// ---------------------------------------------------------------------------
// 4. PRODUCT CATALOG & REGISTRY CATEGORIES (All URL slugs & filter pills)
// ---------------------------------------------------------------------------
export const CATALOG_PRODUCT_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'cat-main-entrance-doors',
    name: 'Main Entrance Doors',
    slug: 'main-entrance-doors',
    aliases: ['entrance-doors', 'teak-entrance-doors'],
    matchProduct: isMainEntranceDoorProduct
  },
  {
    id: 'cat-wpc-bathroom-doors',
    name: 'WPC Bathroom Doors',
    slug: 'wpc-bathroom-doors',
    aliases: ['bathroom-doors'],
    matchProduct: isWpcDoorProduct
  },
  {
    id: 'cat-wpc-waterproof-doors',
    name: 'WPC Waterproof Doors',
    slug: 'wpc-waterproof-doors',
    aliases: ['wpc-doors'],
    matchProduct: isWpcDoorProduct
  },
  {
    id: 'cat-doors',
    name: 'Doors',
    slug: 'doors',
    aliases: ['all-doors', 'interior-doors'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      if (cat === 'door frames' || name.includes('door frame')) return false;
      if (name.includes('toilet') || name.includes('shower partition') || name.includes('wardrobe')) return false;
      return (
        cat === 'doors' ||
        cat === 'main entrance doors' ||
        cat === 'wpc waterproof doors' ||
        cat === 'aluminium doors' ||
        isMainEntranceDoorProduct(p) ||
        isWpcDoorProduct(p) ||
        name.includes('door')
      );
    }
  },
  {
    id: 'cat-door-frames',
    name: 'Door Frames',
    slug: 'door-frames',
    aliases: ['door-frame', 'wooden-door-frames'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return cat === 'door frames' || name.includes('door frame');
    }
  },
  {
    id: 'cat-aluminium-doors',
    name: 'Aluminium Doors',
    slug: 'aluminium-doors',
    aliases: ['aluminum-doors'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      if (name.includes('wardrobe')) return false;
      return cat === 'aluminium doors' || (name.includes('aluminium') && name.includes('door'));
    }
  },
  {
    id: 'cat-upvc-windows-doors',
    name: 'UPVC Windows & Doors',
    slug: 'upvc-windows-doors',
    aliases: ['upvc-windows---doors', 'upvc-windows', 'upvc-doors'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return cat === 'upvc windows & doors' || name.includes('upvc');
    }
  },
  {
    id: 'cat-glass-partitions',
    name: 'Glass Partitions',
    slug: 'glass-partitions',
    aliases: ['shower-partitions'],
    matchProduct: isGlassPartitionProduct
  },
  {
    id: 'cat-modular-kitchens',
    name: 'Modular Kitchens',
    slug: 'modular-kitchens',
    aliases: ['kitchens'],
    matchProduct: isKitchenProduct
  },
  {
    id: 'cat-kitchen-equipment',
    name: 'Kitchen Equipment',
    slug: 'kitchen-equipment',
    aliases: ['commercial-kitchen-equipment', 'commercial-equipment'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return (
        cat === 'kitchen equipment' ||
        name.includes('kitchen counter') ||
        name.includes('breakfast counter') ||
        name.includes('cooking range') ||
        name.includes('commercial kitchen')
      );
    }
  },
  {
    id: 'cat-living-room-luxury',
    name: 'Living Room Luxury',
    slug: 'living-room-luxury',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      if (isMisplacedNonLivingProduct(p)) return false;
      return (
        cat === 'living room luxury' ||
        cat === 'living room interiors' ||
        cat === 'sofas' ||
        cat === 'tv units' ||
        name.includes('living room') ||
        name.includes('sofa') ||
        name.includes('tv unit') ||
        name.includes('tv console')
      );
    }
  },
  {
    id: 'cat-sofas',
    name: 'Sofas',
    slug: 'sofas',
    aliases: ['luxury-sofas', 'sectional-sofas'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return cat === 'sofas' || cat.includes('sofa') || name.includes('sofa');
    }
  },
  {
    id: 'cat-tv-units',
    name: 'TV Units',
    slug: 'tv-units',
    aliases: ['tv-console-units', 'tv-consoles'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return cat === 'tv units' || name.includes('tv unit') || name.includes('tv console');
    }
  },
  {
    id: 'cat-sliding-wardrobes',
    name: 'Sliding Wardrobes',
    slug: 'sliding-wardrobes',
    aliases: ['wardrobes', 'modular-wardrobes'],
    matchProduct: isWardrobeProduct
  },
  {
    id: 'cat-master-bedroom-suites',
    name: 'Master Bedroom Suites',
    slug: 'master-bedroom-suites',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return (
        cat === 'master bedroom suites' ||
        cat === 'bedroom interiors' ||
        isWallBedProduct(p) ||
        isWardrobeProduct(p) ||
        name.includes('bedroom')
      );
    }
  },
  {
    id: 'cat-wall-beds',
    name: 'Wall Beds',
    slug: 'wall-beds',
    aliases: ['wall--beds', 'foldable-beds', 'bunk-beds'],
    matchProduct: isWallBedProduct
  },
  {
    id: 'cat-dining-tables',
    name: 'Dining Tables',
    slug: 'dining-tables',
    aliases: ['onyx-dining-tables'],
    matchProduct: isDiningTableProduct
  },
  {
    id: 'cat-wooden-chairs-dining',
    name: 'Wooden Chairs & Dining Furniture',
    slug: 'wooden-chairs-dining-furniture',
    aliases: ['wooden-chairs---dining-furniture', 'wooden-chairs'],
    matchProduct: isWoodenDiningChairProduct
  },
  {
    id: 'cat-dining-crockery',
    name: 'Dining & Crockery',
    slug: 'dining-crockery',
    aliases: ['dining-and-crockery', 'dining'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return (
        cat === 'dining & crockery' ||
        isDiningTableProduct(p) ||
        isWoodenDiningChairProduct(p) ||
        name.includes('crockery') ||
        name.includes('dining')
      );
    }
  },
  {
    id: 'cat-commercial-furniture',
    name: 'Commercial Furniture',
    slug: 'commercial-furniture',
    aliases: ['restaurant-furniture', 'office-furniture'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return (
        cat === 'commercial furniture' ||
        name.includes('restaurant booth') ||
        name.includes('banquette') ||
        name.includes('lounge & bar') ||
        name.includes('office chair') ||
        name.includes('workstation')
      );
    }
  },
  {
    id: 'cat-materials',
    name: 'Materials',
    slug: 'materials',
    aliases: ['plywood-laminates', 'interior-materials'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return (
        cat === 'materials' ||
        name.includes('plywood') ||
        name.includes('laminate sheet') ||
        name.includes('hdhmr') ||
        name.includes('louvers')
      );
    }
  },
  {
    id: 'cat-wall-decor',
    name: 'Wall Decor',
    slug: 'wall-decor',
    aliases: ['wallpapers', 'wall-panels'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      return (
        cat === 'wall decor' ||
        name.includes('wallpaper') ||
        name.includes('artificial greenery') ||
        name.includes('wpc wall panel')
      );
    }
  },
  {
    id: 'cat-soundproof-acoustic',
    name: 'Sound Proof and Acoustic Materials',
    slug: 'sound-proof-and-acoustic-materials',
    aliases: ['sound-proof-acoustic', 'acoustic-panels'],
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
    id: 'cat-furniture',
    name: 'Furniture',
    slug: 'furniture',
    aliases: ['all-furniture'],
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      return (
        cat === 'sofas' ||
        cat === 'dining tables' ||
        cat === 'wooden chairs & dining furniture' ||
        cat === 'commercial furniture' ||
        cat === 'tv units' ||
        isWallBedProduct(p) ||
        (cat === 'living room luxury' && !isMisplacedNonLivingProduct(p))
      );
    }
  }
];

// Unified maps for quick slug/name lookup
export const ALL_CURATED_CATEGORIES: CategoryDefinition[] = [
  ...RESIDENTIAL_SUBCATEGORIES,
  ...COMMERCIAL_SUBCATEGORIES,
  ...RESTAURANT_SUBCATEGORIES
];

export const ALL_CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  ...CATALOG_PRODUCT_CATEGORIES,
  ...ALL_CURATED_CATEGORIES
];

/**
 * Resolves ANY category slug, URL query parameter, or display name to its canonical CategoryDefinition.
 * Prioritizes exact slug / alias / name matches before fuzzy matching so specific categories
 * like "wpc-bathroom-doors" or "materials" never get shadowed by broader categories.
 */
export function resolveCategoryDefinition(param?: string | null): CategoryDefinition | null {
  if (!param) return null;
  let decoded = param;
  try {
    decoded = decodeURIComponent(param);
  } catch (_) {}

  const cleanRaw = norm(decoded).replace(/^\?category=/, '').replace(/^category=/, '');
  if (!cleanRaw || cleanRaw === 'all') return null;

  const cleanSlug = slugify(cleanRaw);

  // 1. Exact slug or alias match across ALL definitions
  const byExactSlug = ALL_CATEGORY_DEFINITIONS.find(
    (c) =>
      norm(c.slug) === cleanRaw ||
      slugify(c.slug) === cleanSlug ||
      (c.aliases || []).some((a) => norm(a) === cleanRaw || slugify(a) === cleanSlug)
  );
  if (byExactSlug) return byExactSlug;

  // 2. Exact display name match
  const byExactName = ALL_CATEGORY_DEFINITIONS.find(
    (c) => norm(c.name) === cleanRaw || slugify(c.name) === cleanSlug
  );
  if (byExactName) return byExactName;

  // 3. Safe fuzzy fallback on curated categories
  const byFuzzy = ALL_CATEGORY_DEFINITIONS.find(
    (c) =>
      (cleanSlug.length >= 4 && cleanSlug.includes(slugify(c.slug))) ||
      (slugify(c.slug).length >= 4 && slugify(c.slug).includes(cleanSlug))
  );
  if (byFuzzy) return byFuzzy;

  return null;
}

/**
 * Compares two category keys (display name or URL slug) for equivalence
 * so filter pills and category cards highlight reliably whether selected via URL or click.
 */
export function isSameCategory(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const normA = norm(a);
  const normB = norm(b);
  if (normA === normB) return true;
  if (slugify(normA) === slugify(normB)) return true;

  const defA = resolveCategoryDefinition(a);
  const defB = resolveCategoryDefinition(b);
  if (defA && defB) {
    return defA.id === defB.id || defA.slug === defB.slug;
  }
  return false;
}

/**
 * Checks whether a given product matches a selected category key (slug, curated name, or standard database category).
 */
export function matchProductToSelectedCategory(product: Product, categoryKey: string): boolean {
  if (!categoryKey || categoryKey === 'All' || norm(categoryKey) === 'all') {
    return true;
  }

  // 1. Check canonical CategoryDefinition (covers all 38+ residential, commercial, hospitality & catalog categories)
  const def = resolveCategoryDefinition(categoryKey);
  if (def) {
    return def.matchProduct(product);
  }

  // 2. Dynamic / future admin-created category match (supports both display name and hyphenated URL slug)
  const catNorm = norm(product.category);
  const targetNorm = norm(categoryKey);
  const catSlug = slugify(product.category);
  const productSlugField = slugify(product.categorySlug);
  const targetSlug = slugify(categoryKey);

  if (catNorm === targetNorm) return true;
  if (targetSlug && (catSlug === targetSlug || productSlugField === targetSlug)) return true;

  return false;
}
