import { Product } from '../types';

export interface HomepageSubcategoryConfig {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  matchProduct: (product: Product) => boolean;
}

export interface HomepageSectionConfig {
  serviceId: string;
  serviceTitle: string;
  sectionSubtitle: string;
  categories: HomepageSubcategoryConfig[];
  configurationNote?: string;
}

function norm(value?: string): string {
  return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Helper to determine if a product in "Living Room Luxury" is actually a misplaced
 * Bedroom Door, Pooja Door, or Sliding Wardrobe rather than a Living Room item.
 */
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

/**
 * Exact 6 Residential Interior Design categories as specified for the homepage
 * interactive category navigation system.
 */
export const RESIDENTIAL_CATEGORIES: HomepageSubcategoryConfig[] = [
  {
    id: 'res-living-room',
    title: 'Living Room Interiors',
    subtitle: 'Bespoke sofas, floating TV consoles & complete living space designs',
    tag: 'Living Spaces',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);

      if (cat === 'living room interiors' || sub === 'living room interiors') {
        return true;
      }
      if (cat === 'sofas' || cat === 'tv units' || cat === 'luxury sofas & sectionals') {
        return true;
      }
      if (cat === 'living room luxury' && !isMisplacedNonLivingProduct(p)) {
        return true;
      }
      if (name.includes('living room')) {
        return true;
      }
      return false;
    }
  },
  {
    id: 'res-modular-kitchen',
    title: 'Modular Kitchen',
    subtitle: 'Island, L-shape & parallel modular kitchens and breakfast counters',
    tag: 'German Hardware',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);

      if (cat === 'modular kitchen' || cat === 'modular kitchens' || sub.includes('modular kitchen')) {
        return true;
      }
      // Include residential kitchen & breakfast counters stored under Kitchen Equipment
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
    title: 'Bedroom Interiors',
    subtitle: 'Master bedroom suites, sliding wardrobes & space-saving beds',
    tag: 'Master Suites',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);

      if (
        cat === 'bedroom interiors' ||
        cat === 'master bedroom suites' ||
        cat === 'sliding wardrobes' ||
        cat === 'wall beds' ||
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
    title: 'Bathroom Interiors',
    subtitle: 'Frameless shower partitions, wall-hung sanitaryware & bathroom fittings',
    tag: 'Waterproof & Spa Grade',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
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
    title: 'Pooja Room Interiors',
    subtitle: 'Carved teakwood mandir doors, sacred shrines & backlit CNC panels',
    tag: 'Sacred Spaces',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
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
    title: 'Modular Interiors',
    subtitle: 'Factory-engineered modular wardrobes, walk-in modules & storage units',
    tag: 'Factory Precision',
    image: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=800&q=80',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const sub = norm(p.subCategory);
      const name = norm(p.name);
      const desc = norm(p.description);

      if (cat === 'modular interiors' || sub === 'modular interiors') {
        return true;
      }
      // Exclude modular kitchens since Modular Kitchen has its own dedicated category card
      if (cat === 'modular kitchen' || cat === 'modular kitchens' || name.includes('kitchen')) {
        return false;
      }
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

/**
 * Subcategories for Commercial & Office Interior derived strictly from existing
 * service subservices and product categories in the project.
 */
export const COMMERCIAL_OFFICE_CATEGORIES: HomepageSubcategoryConfig[] = [
  {
    id: 'comm-acoustic',
    title: 'Acoustic & Soundproofing Solutions',
    subtitle: 'Perforated gypsum tiles, PET felt boards & sound-absorbing panels',
    tag: 'STC Rated Acoustics',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
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
    id: 'comm-partitions-doors',
    title: 'Glass & Aluminium Partition Doors',
    subtitle: 'Slim-profile aluminium frame glass doors, shutters & office partitions',
    tag: 'Architectural Systems',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
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
    id: 'comm-wall-panels-materials',
    title: 'Architectural Wall Panels & Laminates',
    subtitle: 'Charcoal & WPC louvers, HDHMR boards, commercial wallpapers & laminates',
    tag: 'Commercial Finishes',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      return cat === 'wall decor' || cat === 'materials';
    }
  },
  {
    id: 'comm-workstations-seating',
    title: 'Corporate Workstations & Executive Seating',
    subtitle: 'Ergonomic office chairs, conference desks & executive cabin furniture',
    tag: 'Corporate Ergonomics',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      const name = norm(p.name);
      const desc = norm(p.description);
      if (name.includes('office') || name.includes('executive') || name.includes('workstation')) {
        return true;
      }
      if (cat === 'commercial furniture' && (desc.includes('office') || desc.includes('executive') || desc.includes('workstation'))) {
        return true;
      }
      return false;
    }
  }
];

/**
 * Subcategories for Restaurant & Hotel Interior derived strictly from existing
 * hospitality service subservices and product categories in the project.
 */
export const RESTAURANT_HOTEL_CATEGORIES: HomepageSubcategoryConfig[] = [
  {
    id: 'hosp-booths-lounge',
    title: 'Restaurant Booths & Lounge Seating',
    subtitle: 'Custom banquette seating, bar lounges & hospitality upholstery',
    tag: 'Hospitality Seating',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
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
    title: 'Dining Tables & Hospitality Surfaces',
    subtitle: 'Statement marble, cylinder-frame & metal-base dining tables',
    tag: 'Fine Dining',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      return cat === 'dining tables' || cat === 'dining & crockery';
    }
  },
  {
    id: 'hosp-wooden-chairs',
    title: 'Wooden Dining Chairs & Armchairs',
    subtitle: 'Solid hardwood cane-back, cross-back & slat-back dining chairs',
    tag: 'Solid Hardwood',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      return cat === 'wooden chairs & dining furniture';
    }
  },
  {
    id: 'hosp-kitchen-counters',
    title: 'Kitchen & Service Counters',
    subtitle: 'Commercial kitchen equipment, service counters & breakfast bars',
    tag: 'Service & Prep',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    matchProduct: (p: Product) => {
      const cat = norm(p.category);
      return cat === 'kitchen equipment';
    }
  }
];

/**
 * Additional expandable configurations for the remaining service cards in SERVICES_DATA
 * so every card in the homepage services strip supports consistent inline expansion.
 */
export const ADDITIONAL_SERVICE_CATEGORIES: Record<string, HomepageSubcategoryConfig[]> = {
  'serv-4': [
    RESIDENTIAL_CATEGORIES[1] // Modular Kitchen
  ],
  'serv-5': [
    RESTAURANT_HOTEL_CATEGORIES[3] // Kitchen & Service Counters
  ],
  'serv-6': [
    {
      id: 'arch-entrance-doors',
      title: 'Main Entrance & Interior Doors',
      subtitle: 'Solid teakwood main doors, carved WPC doors & membrane interior doors',
      tag: 'Burma Teak & WPC',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      matchProduct: (p: Product) => {
        const cat = norm(p.category);
        return cat === 'doors' || cat === 'main entrance doors';
      }
    },
    {
      id: 'arch-wpc-doors',
      title: '100% Waterproof WPC Doors',
      subtitle: 'Digital printed, grooved & marble-finish waterproof WPC doors',
      tag: 'Lifetime Waterproof',
      image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
      matchProduct: (p: Product) => {
        const cat = norm(p.category);
        return cat === 'wpc waterproof doors';
      }
    },
    {
      id: 'arch-upvc-windows',
      title: 'UPVC Soundproof Windows & Doors',
      subtitle: 'Sliding, openable & ventilator UPVC systems with thermal insulation',
      tag: 'Soundproof UPVC',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      matchProduct: (p: Product) => {
        const cat = norm(p.category);
        return cat === 'upvc windows & doors';
      }
    },
    {
      id: 'arch-door-frames',
      title: 'Solid Wooden Door Frames & Aluminium Doors',
      subtitle: 'Burma teak, mahogany, pine & Assam wood frames and aluminium doors',
      tag: 'Structural Frames',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      matchProduct: (p: Product) => {
        const cat = norm(p.category);
        return cat === 'door frames' || cat === 'aluminium doors';
      }
    }
  ]
};

export const HOMEPAGE_EXPANDABLE_SECTIONS: Record<string, HomepageSectionConfig> = {
  'serv-1': {
    serviceId: 'serv-1',
    serviceTitle: 'Residential Interior Design',
    sectionSubtitle: 'Select a residential interior category below to explore matching factory-crafted products inline.',
    categories: RESIDENTIAL_CATEGORIES
  },
  'serv-2': {
    serviceId: 'serv-2',
    serviceTitle: 'Commercial & Office Interior',
    sectionSubtitle: 'Explore existing commercial and office interior categories and acoustic architectural solutions.',
    categories: COMMERCIAL_OFFICE_CATEGORIES,
    configurationNote: 'Additional specialized corporate office categories can be configured as inventory expands.'
  },
  'serv-3': {
    serviceId: 'serv-3',
    serviceTitle: 'Restaurant & Hotel Interior',
    sectionSubtitle: 'Browse hospitality furniture, restaurant booth seating, dining tables, and service counter solutions.',
    categories: RESTAURANT_HOTEL_CATEGORIES,
    configurationNote: 'Additional hotel and fine-dining subcategories can be configured as inventory expands.'
  },
  'serv-4': {
    serviceId: 'serv-4',
    serviceTitle: 'Modular Kitchen Studio',
    sectionSubtitle: 'Explore modular kitchen layouts, island setups, and breakfast counter units.',
    categories: ADDITIONAL_SERVICE_CATEGORIES['serv-4']
  },
  'serv-5': {
    serviceId: 'serv-5',
    serviceTitle: 'Commercial Kitchen Equipment Manufacturing',
    sectionSubtitle: 'Explore commercial kitchen counters and heavy-duty food-grade equipment.',
    categories: ADDITIONAL_SERVICE_CATEGORIES['serv-5']
  },
  'serv-6': {
    serviceId: 'serv-6',
    serviceTitle: 'Architectural Doors & Windows',
    sectionSubtitle: 'Explore solid teak entrance doors, 100% waterproof WPC doors, UPVC windows, and wooden door frames.',
    categories: ADDITIONAL_SERVICE_CATEGORIES['serv-6']
  }
};

export function getProductsForSubcategory(
  products: Product[],
  subcategory: HomepageSubcategoryConfig
): Product[] {
  if (!Array.isArray(products) || products.length === 0) return [];
  return products.filter((p) => {
    if (!p || p.status === 'Inactive' || p.status === 'Draft') return false;
    return subcategory.matchProduct(p);
  });
}
