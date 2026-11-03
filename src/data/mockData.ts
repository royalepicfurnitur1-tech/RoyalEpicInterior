import { Product, ServiceCategory, PortfolioProject, BlogPost, KitchenEquipmentItem } from '../types';

export const HERO_RING_ITEMS = [
  {
    id: 'ring-1',
    title: 'Luxury Modular Kitchen',
    category: 'Modular Kitchens',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    description: 'Italian acrylic & quartz finish island kitchens with German soft-close fittings.',
    badge: 'Trending 2026'
  },
  {
    id: 'ring-2',
    title: 'Royal Living Room',
    category: 'Residential Interior',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    description: 'Double-height ceiling designs with Italian marble, brass trims & custom velvet sofas.',
    badge: 'Bestseller'
  },
  {
    id: 'ring-3',
    title: 'Master Bedroom Suite',
    category: 'Residential Interior',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    description: 'Acoustic padded headboards, indirect cove lighting & integrated walk-in closets.',
    badge: 'Luxury Suite'
  },
  {
    id: 'ring-4',
    title: 'Corporate Office Interior',
    category: 'Commercial Interior',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    description: 'Ergonomic workstations, glass conference pods & acoustics panelling.',
    badge: 'Turnkey Solution'
  },
  {
    id: 'ring-5',
    title: 'Fine Dining Restaurant',
    category: 'Restaurant Interior',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    description: 'Mood lighting, bespoke brass furniture, and acoustic wall cladding for dining.',
    badge: 'Commercial'
  },
  {
    id: 'ring-6',
    title: 'Commercial Hotel Kitchen',
    category: 'Kitchen Equipment',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
    description: 'Heavy duty 304 SS cooking ranges, exhaust hoods & industrial dishwashers.',
    badge: '304 SS Grade'
  },
  {
    id: 'ring-7',
    title: 'Slim Glass Partition',
    category: 'Glass Partitions',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    description: 'Frameless acoustic glass partitions with gold anodized aluminum profiles.',
    badge: 'Architectural'
  },
  {
    id: 'ring-8',
    title: 'Luxury Walk-In Wardrobe',
    category: 'Sliding Wardrobes',
    image: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=1200&q=80',
    description: 'Tinted glass sliding doors with automated sensor LED strip channels.',
    badge: 'Custom Made'
  },
  {
    id: 'ring-9',
    title: 'Floating TV Console Unit',
    category: 'TV Units',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
    description: 'Fluted wooden louvers, Italian stone backdrop & concealed cable management.',
    badge: 'Modern Classic'
  },
  {
    id: 'ring-10',
    title: 'Royal Teak Main Door',
    category: 'Main Entrance Doors',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    description: 'Solid teakwood entrance doors with smart biometric locks & brass inlays.',
    badge: 'Handcrafted'
  },
  {
    id: 'ring-11',
    title: 'Italian Marble Dining Hall',
    category: 'Dining & Living',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    description: '10-seater Statuario marble dining table with brushed gold stainless steel pedestal.',
    badge: 'Signature Collection'
  },
  {
    id: 'ring-12',
    title: 'Velvet Home Cinema Lounge',
    category: 'Home Theater',
    image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?auto=format&fit=crop&w=1200&q=80',
    description: 'Motorized leather recliner seating with acoustic fabric panelling & starry night ceiling.',
    badge: 'Acoustic Suite'
  },
  {
    id: 'ring-13',
    title: 'Executive Boardroom Pod',
    category: 'Commercial Interior',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    description: 'Smart glass privacy walls, integrated conference AV desk & walnut veneer finishes.',
    badge: 'Corporate Standard'
  },
  {
    id: 'ring-14',
    title: 'Opulent Bathroom Vanity',
    category: 'Luxury Bathrooms',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    description: 'Double vessel gold sink basin, illuminated LED mirrors & brass wall fixtures.',
    badge: 'Spa Grade'
  },
  {
    id: 'ring-15',
    title: 'Modern Balcony Deck Lounge',
    category: 'Outdoor Living',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    description: 'Weatherproof teak deck tiles, vertical garden wall & glass balustrades.',
    badge: 'Outdoor Oasis'
  },
  {
    id: 'ring-16',
    title: 'Designer Wooden False Ceiling',
    category: 'Ceiling & Lighting',
    image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
    description: 'CNC carved wood lattice ceiling with warm magnetic track spotlight profiles.',
    badge: 'Architectural'
  },
  {
    id: 'ring-17',
    title: 'Boutique Store Display Counter',
    category: 'Retail & Commercial',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    description: 'Tempered ultra-clear glass jewelry cabinets with lockable velvet lined drawers.',
    badge: 'Retail Luxury'
  },
  {
    id: 'ring-18',
    title: 'Zen Garden Villa Interior',
    category: 'Residential Interior',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    description: 'Japanese minimalism with natural bamboo accents, water feature & floor cushions.',
    badge: 'Peace & Serenity'
  },
  {
    id: 'ring-19',
    title: 'Penthouse Sky Bar & Kitchenette',
    category: 'Bar Counters',
    image: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=80',
    description: 'Onyx backlit stone bar top, suspended brass wine racks & leather bar stools.',
    badge: 'Ultra Luxury'
  },
  {
    id: 'ring-20',
    title: 'Scandinavian Minimalist Bedroom',
    category: 'Residential Interior',
    image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
    description: 'Oakwood floating bed frame, neutral linen drapery & soft ambient floor lamps.',
    badge: 'Nordic Style'
  },
  {
    id: 'ring-21',
    title: 'Smart Appliance Bay Kitchen',
    category: 'Modular Kitchens',
    image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
    description: 'Integrated microwave oven tall unit, soft touch drawers & hidden pantry pullouts.',
    badge: 'Ergonomic'
  },
  {
    id: 'ring-22',
    title: 'Gold Anodized Glass Partition',
    category: 'Glass Partitions',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    description: 'Acoustic double glass doors with brushed gold aluminum framing for luxury suites.',
    badge: 'Premium Glass'
  },
  {
    id: 'ring-23',
    title: 'Custom Brass & Walnut Staircase',
    category: 'Architectural Woodwork',
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    description: 'Floating wooden treads with brass balusters and recessed LED step lights.',
    badge: 'Crafted Masterpiece'
  },
  {
    id: 'ring-24',
    title: 'Acoustic Recording Studio',
    category: 'Commercial Interior',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    description: 'Soundproof bass traps, wood diffuser wall panels & custom studio desk console.',
    badge: 'Soundproofed'
  },
  {
    id: 'ring-25',
    title: 'High-Gloss Acrylic Wardrobe',
    category: 'Sliding Wardrobes',
    image: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=1200&q=80',
    description: 'Reflective obsidian black doors with automated interior clothing lift racks.',
    badge: 'High Gloss'
  },
  {
    id: 'ring-26',
    title: 'Contemporary Fluted Wall Panels',
    category: 'Wall Decor',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    description: '3D vertical louvers with bronze mirror accents for living rooms & bed backdrops.',
    badge: '3D Wall Art'
  },
  {
    id: 'ring-27',
    title: 'Industrial Heavy Duty Cooking Line',
    category: 'Kitchen Equipment',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
    description: 'Full commercial grade stainless steel stove line, salamander & fryer counters.',
    badge: 'Commercial Grade'
  },
  {
    id: 'ring-28',
    title: 'Luxury Spa & Wellness Reception',
    category: 'Hospitality Interior',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    description: 'Travertine stone reception desk, ambient water curtain & natural teak louvers.',
    badge: 'Relaxation Luxe'
  },
  {
    id: 'ring-29',
    title: 'Heritage Wooden Mandir Shrine',
    category: 'Pooja Room',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    description: 'Intricately CNC carved teakwood pooja unit with brass bell highlights & backlit brass lattice.',
    badge: 'Custom Sacred'
  },
  {
    id: 'ring-30',
    title: 'Smart Automated Blinds & Curtains',
    category: 'Window Treatments',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    description: 'Somfy motorized blackout velvet drapery with voice-control Alexa/Google sync.',
    badge: 'Smart Automation'
  },
  {
    id: 'ring-31',
    title: 'Executive Corner Office Suite',
    category: 'Commercial Interior',
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
    description: 'Panoramic glass office with leather executive armchair & solid walnut desk.',
    badge: 'CEO Office'
  },
  {
    id: 'ring-32',
    title: 'Frameless Glass Partition Wall',
    category: 'Glass Partitions',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    description: 'Clear 12mm toughened glass panels with concealed floor springs & lock sets.',
    badge: 'Acoustic Glass'
  },
  {
    id: 'ring-33',
    title: 'Neoclassical Villa Living Room',
    category: 'Residential Interior',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    description: 'Ornate ceiling moldings, crystal chandelier & classic silk upholstered armchairs.',
    badge: 'Royal Classic'
  },
  {
    id: 'ring-34',
    title: 'Modern Island Breakfast Bar',
    category: 'Modular Kitchens',
    image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1200&q=80',
    description: 'Sintered stone waterfall edge island with integrated induction cooktop.',
    badge: 'Modern Dining'
  },
  {
    id: 'ring-35',
    title: 'Walk-In Closet with Center Island',
    category: 'Sliding Wardrobes',
    image: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=1200&q=80',
    description: 'Glass-top accessory drawer island, shoe display racks & soft velvet upholstery.',
    badge: 'Master Suite'
  },
  {
    id: 'ring-36',
    title: 'Minimalist Bookshelf & Reading Nook',
    category: 'Home Library',
    image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
    description: 'Floor-to-ceiling wooden bookshelves with built-in cozy window bench seating.',
    badge: 'Cozy Living'
  },
  {
    id: 'ring-37',
    title: 'Commercial Cafe & Espresso Bar',
    category: 'Hospitality Interior',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    description: 'Rustic brick wall cladding, brass coffee counter & ambient globe filament bulbs.',
    badge: 'Cafe Interior'
  },
  {
    id: 'ring-38',
    title: 'Hotel Suite Master Bed Panel',
    category: 'Hospitality Interior',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    description: 'Full height leatherette padded acoustic headboard with integrated nightstands.',
    badge: '5-Star Quality'
  },
  {
    id: 'ring-39',
    title: 'Smart LED Backlit Vanity Mirror',
    category: 'Luxury Bathrooms',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    description: 'Anti-fog touch button mirror with adjustable warm & cool CCT LED ring light.',
    badge: 'Smart Mirror'
  },
  {
    id: 'ring-40',
    title: 'Custom Curved Reception Desk',
    category: 'Commercial Interior',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    description: 'Thermoformed Solid Surface curved reception counter with RGB underglow LED.',
    badge: 'Custom Corporate'
  }
];

export const PRODUCTS_DATA: Product[] = [
  {
    id: 'prod-1',
    name: 'Royal Heritage Solid Teak Main Entrance Door',
    category: 'Main Entrance Doors',
    categorySlug: 'doors',
    price: 85000,
    originalPrice: 110000,
    discount: 22,
    rating: 4.9,
    reviewsCount: 48,
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1534349735944-2b3a6f7a268f?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Handcrafted solid Burmese teak wood entrance door with double frame, heavy duty brass hinges, digital smart lock compatibility, and weather-resistant PU clear coat finish.',
    specifications: {
      material: '100% Seasoned Burmese Teak Wood',
      size: '8ft x 4ft (Customizable up to 10ft)',
      finish: 'High Gloss Walnut PU Coating',
      warranty: '15 Years Termite Guarantee',
      brand: 'Royal Epic Architectural',
      origin: 'India / Myanmar'
    },
    features: [
      'Termite & Borer Proof Seasoned Wood',
      'Solid 45mm Thickness Solid Core',
      'Includes Multi-point Mortise Lock Set',
      'Precision Brass Strip Inlays'
    ],
    isHot: true,
    has3dViewer: true,
    has360View: true,
    inStock: true
  },
  {
    id: 'prod-2',
    name: 'Imperial Italian Quartz Island Modular Kitchen',
    category: 'Modular Kitchens',
    categorySlug: 'kitchens',
    price: 380000,
    originalPrice: 450000,
    discount: 15,
    rating: 5.0,
    reviewsCount: 62,
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Complete L-shape with center island kitchen featuring high gloss acrylic shutters, 18mm boiling water resistant BWR ply carcass, Hafele soft-close tandem drawers, and Calacatta quartz countertop.',
    specifications: {
      material: '18mm HDMR & Calacatta Quartz Stone',
      size: '12ft x 10ft + 6ft Island',
      finish: 'Mirror Finish High Gloss Acrylic',
      warranty: '20 Years Waterproof Guarantee',
      brand: 'Royal Epic Kitchen Studio',
      origin: 'Germany / India'
    },
    features: [
      'Blum Servo-Drive Automated Upper Cabinets',
      'Built-in Cutlery, Pantry & Corner Magic Carousel',
      'Includes 90cm Touch Auto-clean Chimney',
      'Under-cabinet Smart Warm LED Profiles'
    ],
    isHot: true,
    isNew: true,
    has3dViewer: true,
    has360View: true,
    inStock: true
  },
  {
    id: 'prod-3',
    name: 'Grand Chesterfield Velvet 7-Seater Sectional Sofa',
    category: 'Sofas',
    categorySlug: 'furniture',
    price: 145000,
    originalPrice: 185000,
    discount: 21,
    rating: 4.8,
    reviewsCount: 39,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Hand-tufted deep royal velvet sectional sofa constructed over seasoned neem wood frame, 40-density high-resilience foam, and polished champagne gold stainless steel legs.',
    specifications: {
      material: 'Stain-resistant Royal Velvet & Solid Wood Frame',
      size: '11ft x 7.5ft L-Shape',
      finish: 'Deep Emerald / Sapphire / Charcoal Velvet',
      warranty: '10 Years Frame Warranty',
      brand: 'Royal Epic Living',
      origin: 'India'
    },
    features: [
      'Deep Diamond Tufting with Crystal Buttons',
      'High Density Memory Foam Topper',
      'Includes 6 Matching Velvet Cushion Sets',
      'Scratch & Pet Friendly Fabric'
    ],
    has3dViewer: true,
    has360View: true,
    inStock: true
  },
  {
    id: 'prod-4',
    name: 'Tinted Glass Sensor LED Sliding Wardrobe',
    category: 'Sliding Wardrobes',
    categorySlug: 'wardrobes',
    price: 165000,
    originalPrice: 210000,
    discount: 21,
    rating: 4.9,
    reviewsCount: 29,
    image: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Floor-to-ceiling 3-door soft-closing sliding wardrobe with grey tinted toughened glass doors, gold aluminum slim profile frame, automatic infrared sensor drawers and tie/belt organizers.',
    specifications: {
      material: 'Toughened Fluted Glass & HDMR Wood',
      size: '8ft Width x 9.5ft Height x 2ft Depth',
      finish: 'Anodized Champagne Gold Profile',
      warranty: '10 Years Sliding Track Warranty',
      brand: 'Royal Epic Wardrobe Systems',
      origin: 'Italy'
    },
    features: [
      'Acoustic Soft-close Soft-stop Rollers',
      'Motion Sensor Internal Strip Lighting',
      'Digital Safe Drawer & Lockers Included',
      'Full Height Dresser Mirror Panel'
    ],
    isHot: true,
    has3dViewer: true,
    inStock: true
  },
  {
    id: 'prod-5',
    name: 'Minimalist Fluted Marble Floating TV Console',
    category: 'TV Units',
    categorySlug: 'furniture',
    price: 68000,
    originalPrice: 88000,
    discount: 22,
    rating: 4.7,
    reviewsCount: 31,
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Wall-mounted floating media console featuring charcoal fluted wood panelling, ceramic white marble top, integrated wireless phone charger pad and hidden wire management channels.',
    specifications: {
      material: 'Charcoal Fluted WPC Panel & Italian Sintered Stone',
      size: '7.5ft Length x 1.5ft Depth x 1.2ft Height',
      finish: 'Matte Charcoal & Polished Statuario',
      warranty: '7 Years Craftsmanship Warranty',
      brand: 'Royal Epic Media',
      origin: 'India'
    },
    features: [
      'Dual Soft-closing Drop Down Drawers',
      'Subwoofer & Soundbar Recessed Niche',
      'Hidden RGB Ambient Backlight Channels',
      'Supports TVs up to 85 Inches'
    ],
    inStock: true
  },
  {
    id: 'prod-6',
    name: 'Heavy Duty 304 Stainless Steel Commercial Cooking Range',
    category: 'Kitchen Equipment',
    categorySlug: 'commercial-equipment',
    price: 195000,
    originalPrice: 240000,
    discount: 18,
    rating: 4.9,
    reviewsCount: 22,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Industrial 4-burner commercial gas range with bottom baking oven, manufactured from food grade AISI 304 16-gauge stainless steel with brass high-pressure burners.',
    specifications: {
      material: '100% 304 Grade Stainless Steel (1.5mm Thickness)',
      size: '48" x 36" x 34"',
      finish: 'Brushed Satin Industrial Finish',
      warranty: '5 Years Commercial Duty Warranty',
      brand: 'Royal Epic Kitchen Tech',
      origin: 'India / Germany'
    },
    features: [
      'Heavy Duty Cast Iron Pan Supports',
      'Flame Failure Safety Shut-off System',
      'Integrated Under-counter Storage Rack',
      'High Thermal Efficiency Brass Jet Nozzles'
    ],
    isHot: true,
    inStock: true
  },
  {
    id: 'prod-7',
    name: 'Architectural Gold Aluminum Slim Glass Partition',
    category: 'Glass Partitions',
    categorySlug: 'partitions',
    price: 450, // per sq ft
    originalPrice: 600,
    discount: 25,
    rating: 4.8,
    reviewsCount: 54,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Frameless acoustic tempered 12mm glass wall system with ultra-slim anodized gold aluminum profiles. Designed for luxury homes, executive office suites, and hotel lobbies.',
    specifications: {
      material: '12mm Toughened Clear / Fluted Glass',
      size: 'Custom Size per Square Foot',
      finish: 'Anodized Gold / Matte Black / Bronze',
      warranty: '10 Years Structural Warranty',
      brand: 'Royal Epic Architectural Glass',
      origin: 'India'
    },
    features: [
      'Acoustic STC 42 dB Sound Proofing',
      'Dormakaba Floor Spring & Hydraulic Hinges',
      'Optional Smart Switchable Electrochromic Glass',
      'Zero Edge Seamless Corner Joints'
    ],
    inStock: true
  },
  {
    id: 'prod-8',
    name: 'Luxury WPC Waterproof Flush Door with Brass Inlays',
    category: 'WPC Bathroom Doors',
    categorySlug: 'doors',
    price: 24500,
    originalPrice: 32000,
    discount: 23,
    rating: 4.9,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1000&q=80'
    ],
    description: '100% Waterproof Wood Polymer Composite (WPC) door with high density core, walnut veneer overlay, precision brass strip accents and magnetic silent latch system.',
    specifications: {
      material: 'High Density Virgin WPC Core + Veneer Finish',
      size: '7ft x 3ft x 35mm',
      finish: 'Natural Walnut PU Gloss Coating',
      warranty: 'Lifetime Waterproof & Termite Guarantee',
      brand: 'Royal Epic Door Crafts',
      origin: 'India'
    },
    features: [
      'Zero Swelling / Zero Shrinkage in Moisture',
      'Fire Retardant Class-A Rating',
      'Includes Concealed Heavy Hinges & Handle',
      'Eco-friendly Lead Free Recyclable Material'
    ],
    isHot: true,
    inStock: true
  },
  {
    id: 'prod-9',
    name: 'Bespoke Onyx Marble 8-Seater Dining Table',
    category: 'Dining Tables',
    categorySlug: 'furniture',
    price: 210000,
    originalPrice: 260000,
    discount: 19,
    rating: 4.9,
    reviewsCount: 19,
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Translucent back-lit Honey Onyx natural marble top mounted on a sculpted geometric brass architectural base. Includes 8 velvet upholstered high-back chairs.',
    specifications: {
      material: 'Italian Translucent Onyx & Brass Pedestal Base',
      size: '8ft Length x 4ft Width x 2.5ft Height',
      finish: 'Polished Mirror Coat Onyx',
      warranty: '10 Years Stone Structural Warranty',
      brand: 'Royal Epic Living',
      origin: 'Italy / India'
    },
    features: [
      'Dimmable LED Backlight Panel under Marble',
      'Resin Sealer Protection against Acid & Wine Stains',
      'Ergonomic High Density Foam Chairs',
      'Handcrafted Sculptural Geometric Base'
    ],
    has3dViewer: true,
    inStock: true
  },
  {
    id: 'prod-10',
    name: 'Executive Ergonomic Leatherette Office Chair',
    category: 'Commercial Furniture',
    categorySlug: 'furniture',
    price: 32000,
    originalPrice: 42000,
    discount: 23,
    rating: 4.8,
    reviewsCount: 76,
    image: 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Synchronized tilt mechanism executive chair upholstered in breathable Italian grain leatherette, 4D adjustable armrests, lumbar support and polished chrome base.',
    specifications: {
      material: 'Nappa Leatherette & Die-Cast Aluminum Base',
      size: 'Standard Executive Adjustable Height',
      finish: 'Tan Brown / Obsidian Black',
      warranty: '5 Years Hydraulic Gas Lift Warranty',
      brand: 'Royal Epic Office Tech',
      origin: 'India'
    },
    features: [
      'Class-4 Heavy Duty Hydraulic Gas Lift',
      'Multi-position Lock Recline up to 135 Degrees',
      'Silent Nylon Caster Wheels',
      'Padded Neck Cushion & Lumbar Arch'
    ],
    inStock: true
  }
];

export const SERVICES_DATA: ServiceCategory[] = [
  {
    id: 'serv-1',
    title: 'Residential Interior Design',
    iconName: 'Home',
    description: 'End-to-end luxury home transformations including living rooms, bedrooms, lighting, false ceilings, and custom furniture.',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    subservices: [
      'Living Room Interior Design',
      'Master & Kids Bedroom Interior',
      'Luxury Wardrobes & Walk-ins',
      'Designer TV & Entertainment Units',
      'Crockery Units & Bar Counters',
      'Gypsum & Wooden False Ceiling',
      'Luxury Texture & PU Painting',
      'Smart Electrical & Plumbing Layouts'
    ]
  },
  {
    id: 'serv-2',
    title: 'Commercial & Office Interior',
    iconName: 'Building2',
    description: 'Futuristic corporate offices, executive suites, conference halls, and retail showrooms optimized for brand impact.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    subservices: [
      'Corporate Office Workstation Setup',
      'Executive Cabins & Conference Rooms',
      'Retail Showroom Interior & Display Displays',
      'Acoustic Panelling & Sound Proofing',
      'Glass & Aluminum Profile Partitions',
      'Storage Cabinets & Bookshelves',
      'ACP Cladding & Exterior Glazing'
    ]
  },
  {
    id: 'serv-3',
    title: 'Restaurant & Hotel Interior',
    iconName: 'UtensilsCrossed',
    description: 'Bespoke ambiance creation, mood lighting, plush dining seating, and hospitality layout engineering.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    subservices: [
      'Fine Dining Restaurant Ambiance',
      'Boutique Hotel Suite Interior',
      'Custom Restaurant Furniture & Booths',
      'Stainless Steel & Wooden Dining Chairs',
      'Reception Desks & Bar Counters',
      'Acoustic Ceiling & Lighting Effects'
    ]
  },
  {
    id: 'serv-4',
    title: 'Modular Kitchen Studio',
    iconName: 'ChefHat',
    description: 'German precision modular kitchens featuring island layouts, acrylic shutters, quartz counters, and smart drawers.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    subservices: [
      'L-Shape & U-Shape Kitchen Layouts',
      'Island & Parallel Kitchen Designs',
      'High Gloss Acrylic & Veneer Finish',
      'Hafele & Blum Soft-close Accessories',
      'Calacatta Quartz & Granite Countertops',
      'Built-in Chimneys, Hobs & Appliances'
    ]
  },
  {
    id: 'serv-5',
    title: 'Commercial Kitchen Equipment Manufacturing',
    iconName: 'Flame',
    description: 'In-house manufacturing of 304 food-grade stainless steel kitchen equipment for cloud kitchens, hotels & restaurants.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    subservices: [
      'Commercial Gas Ranges & Burners',
      'Industrial Exhaust Hoods & Ducting',
      'Under-counter Refrigeration Units',
      'Heavy Duty Stainless Steel Tables & Sinks',
      'Cloud Kitchen Turnkey Setup',
      'Hotel & Banquet Kitchen Layouts'
    ]
  },
  {
    id: 'serv-6',
    title: 'Architectural Doors & Windows',
    iconName: 'DoorClosed',
    description: 'Premium main entrance doors, 100% waterproof WPC bathroom doors, UPVC & WPC windows, and flush door frames.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    subservices: [
      'Solid Teak Main Entrance Doors',
      '100% Waterproof WPC Bathroom Doors',
      'High Density Flush Doors & Frames',
      'Soundproof UPVC Windows',
      'Thermal Insulated WPC Windows',
      'Anodized Aluminum Sliding Systems'
    ]
  }
];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'port-1',
    title: 'Sobha City 4BHK Turnkey Luxury Residence',
    category: 'Residential',
    location: 'Sobha City, Thanisandra, Bengaluru',
    areaSqFt: 3850,
    completionTime: '10 Weeks',
    beforeImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    clientName: 'Sanjay & Meera Hegde',
    clientReview: 'Royal Epic transformed our raw shell at Sobha City into an immaculate home. The teakwood fluted wall paneling, Italian marble flooring, and modular kitchen exceeded our expectations!',
    clientRating: 5.0,
    has3dWalkthrough: true,
    gallery: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 'port-2',
    title: 'Manyata Tech Park Corporate Headquarters',
    category: 'Commercial',
    location: 'Manyata Embassy Business Park, Nagawara, Bengaluru',
    areaSqFt: 14200,
    completionTime: '14 Weeks',
    beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
    clientName: 'Arjun Nambiar, Director of Facilities',
    clientReview: 'The acoustic frameless glass cabins, bespoke cafeteria seating, and ergonomic workstations were handed over on time with spotless manufacturing finish.',
    clientRating: 5.0,
    has3dWalkthrough: true,
    gallery: [
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 'port-3',
    title: 'Lavelle Road Artisanal Bistro & Banquet Kitchen',
    category: 'Hospitality',
    location: 'Lavelle Road, Central Bengaluru',
    areaSqFt: 6200,
    completionTime: '9 Weeks',
    beforeImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    clientName: 'Chef Sanjeev Oberoi, Partner',
    clientReview: 'Royal Epic manufactured and installed our commercial kitchen exhaust ducting, stainless steel lines, and fine-dining warm timber decor. Flawless execution.',
    clientRating: 4.9,
    has3dWalkthrough: true,
    gallery: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 'port-4',
    title: 'Prestige Golfshire Luxury Villa Modular Kitchen & Suites',
    category: 'Modular Kitchen',
    location: 'Prestige Golfshire, Nandi Hills Road, Bengaluru',
    areaSqFt: 4600,
    completionTime: '8 Weeks',
    beforeImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1200&q=80',
    clientName: 'K. V. Reddy, Villa Owner',
    clientReview: 'The acrylic modular island kitchen with quartz waterfall edges and floor-to-ceiling lacquered glass wardrobes look breathtaking. Superb craftsmanship.',
    clientRating: 5.0,
    gallery: [
      'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ]
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'Architectural Turnkey Interiors: The Disciplined Path from Raw Blueprint to Finished Key',
    slug: 'turnkey-interior-projects-guide',
    excerpt: 'How single-source architectural accountability, computer-controlled factory joinery, and sequenced civil engineering eliminate cost overruns and construction friction.',
    content: `Turnkey architectural execution represents the benchmark for homeowners and commercial operators who demand uncompromising craftsmanship without the chaos of managing disparate sub-contractors. At Royal Epic Interior & Furniture, our turnkey practice consolidates spatial planning, structural civil preparations, custom furniture manufacturing, MEP engineering, and finishing under a single unified contract.

### The Five Pillars of Royal Epic Turnkey Execution

1. **Integrated 3D Modeling & Itemized BOQ**: Every square foot is detailed with comprehensive bill-of-quantities before on-site mobilization, locking in material specifications, hardware brands, and completion schedules.
2. **In-House CNC Factory Joinery**: Automated German CNC machinery shapes boiling-water-resistant HDHMR and solid hardwoods to millimeter accuracy at our Bengaluru facility, ensuring precision edge-banding and acoustic alignment.
3. **Sequenced Civil & MEP Engineering**: Concealed plumbing lines, low-voltage lighting channels, and gypsum ceiling grids are engineered concurrently to eliminate rework.
4. **Controlled Fit-Out Assembly**: Pre-fabricated wardrobe carcasses, architectural door frames, and modular kitchen units are dry-fitted in the factory prior to careful on-site assembly by master carpenters.
5. **Standardized ISO Quality Audit**: Comprehensive multi-point inspection examining surface flatness, hinge tolerances, water-resistance seals, and paint uniformity prior to final key delivery.

By commanding both precision manufacturing and on-site engineering, turnkey delivery reduces project timelines by up to 30% while guaranteeing single-source structural accountability.`,
    author: 'Project Director, Royal Epic',
    date: 'July 24, 2026',
    category: 'Turnkey Architecture',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blog-7',
    title: 'The Anatomy of an Enduring Modular Kitchen: Ergonomics, Carcass Engineering & Hardware',
    slug: 'modular-kitchen-cost-bangalore',
    excerpt: 'An architect’s guide to selecting high-density core substrates, Blum and Hafele motion systems, seamless quartz worktops, and ventilation ducting for Indian culinary environments.',
    content: `The modern kitchen is both a high-performance culinary workspace and the architectural hearth of the residence. In high-traffic Indian homes, kitchen design demands materials that easily withstand intense heat, daily turmeric stains, and heavy moisture.

### Crucial Engineering Elements in Modular Kitchen Design

- **Substrate Science (BWR vs. HDHMR vs. SS 304)**: For sink wet zones, marine-grade boiling-water-resistant plywood or 304 food-grade stainless steel carcasses prevent moisture swelling. For dry overhead cabinets, high-density moisture-resistant (HDHMR) core boards provide razor-sharp screw-holding strength.
- **Hardware & Motion Systems**: Soft-close tandem drawers rated for 50kg loads from Blum and Hafele ensure silent, effortless operation over decades of daily use.
- **Zero-Pore Countertops**: 20mm engineered quartz and Italian sintered stone deliver non-porous resistance against citrus acids and high-temperature cooking vessels.
- **Exhaust & Fresh Air Balancing**: High-CFM baffle-filter chimneys paired with dedicated linear fresh-air intakes maintain clean indoor air quality during heavy spice tempering.`,
    author: 'Senior Modular Systems Architect',
    date: 'July 22, 2026',
    category: 'Modular Kitchens',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blog-3',
    title: 'Residential Harmony: Layering Texture, Natural Stone & Lighting in Modern Living Spaces',
    slug: 'home-interior-decorating-guide',
    excerpt: 'Exploring the subtle interplay of fluted wall panels, book-matched marble consoles, acoustic ceilings, and multi-tier lighting palettes to foster serene residential retreats.',
    content: `Elevated residential interiors transcend transient decorative fads. They are shaped by spatial proportion, natural textures, and a deliberate rhythm of light and shadow.

### Fundamental Principles of Refined Residential Architecture

- **The Singular Visual Anchor**: Every master bedroom and formal salon requires an unambiguous focal point—such as a floor-to-ceiling book-matched Statuario marble media wall accented with recessed bronze channels or a bespoke fluted timber panel.
- **Three-Tier Lighting Architecture**: Replacing single glaring ceiling lights with diffuse 2700K perimeter cove lighting, narrow-beam architectural spots for art display, and low-glare reading sconces creates an inviting evening atmosphere.
- **Full-Height Custom Storage**: Floor-to-ceiling wardrobes featuring integrated vertical LED strips and acoustic soft-stop sliding tracks keep spaces uncluttered and tranquil.
- **Material Restraint**: Limiting the core tactile palette to three authentic elements—such as natural oak veneer, brushed champagne metal, and textured bouclé fabric—creates visual calm throughout the home.`,
    author: 'Principal Residential Decorator',
    date: 'July 15, 2026',
    category: 'Residential Interior',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blog-5',
    title: 'Modern Workspace Architecture: Acoustic Privacy, Agile Pods & Frameless Glass Partitions',
    slug: 'corporate-office-workspace-planning',
    excerpt: 'How spatial zoning, STC-rated acoustic glass partitions, and ergonomic workstations foster collaborative vitality while preserving individual deep-work zones.',
    content: `Contemporary commercial interiors must effortlessly accommodate two distinct workflows: energetic cross-team collaboration and distraction-free deep cognitive focus. 

### Strategic Workspace Architecture Principles

- **Acoustic Glass Partitions (STC 42 Rating)**: Frameless acoustic double-glazed glass enclosures flood interior floorplates with daylight while keeping executive boardrooms and HR suites completely soundproof.
- **Ergonomic Workstation Engineering**: Modular desks equipped with concealed wire management raceways, adjustable monitor mounts, and synchronous tilt seating enhance employee well-being and productivity.
- **Biophilic & Quiet Focus Pods**: Sound-dampened single-person phone booths and plant-lined breakout lounges provide quiet retreats for confidential conversations and micro-rests.
- **Brand Storytelling in Reception Hubs**: CNC-machined architectural timber screens and indirect backlit metallic signage establish an immediate sense of enterprise solidity and purpose.`,
    author: 'Commercial Workplace Strategist',
    date: 'July 05, 2026',
    category: 'Commercial Office',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blog-4',
    title: 'Sensory Hospitality Design: Spatial Cadence, Acoustic Comfort & Fine Dining Ambiance',
    slug: 'restaurant-interior-design-trends',
    excerpt: 'Balancing intimate guest atmosphere with rigorous back-of-house workflow through custom booth ergonomics, acoustic timber baffles, and commercial kitchen planning.',
    content: `Hospitality interior design is an intricate choreography between guest sensory immersion and industrial kitchen efficiency. A truly successful venue looks effortless from the dining floor while functioning with military discipline behind the pass.

### Key Tenets of High-Performance Restaurant Architecture

- **Intimate Booth Seating & Spatial Cadence**: Custom banquette seating crafted with high-resilience foam and stain-resistant commercial textiles delivers privacy while optimizing dining seat capacity.
- **Acoustic Ceiling Architecture**: Micro-perforated timber ceiling baffles and fabric-wrapped acoustic panels absorb clatter and reverberation, ensuring comfortable conversation across dining tables.
- **Backlit Service & Bar Counters**: Solid onyx bar fronts illuminated with diffused LED panels paired with 304-grade stainless steel speed rails maximize bartender speed and hospitality theatre.
- **Integrated Commercial Kitchen Layouts**: Clear division between the hot cooking line, preparation stations, and dishwashing zones prevents cross-contamination and ensures continuous guest service.`,
    author: 'Hospitality Interior Lead',
    date: 'July 10, 2026',
    category: 'Hospitality & Dining',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blog-6',
    title: 'Architectural Doorways & Millwork: 100% Waterproof WPC and Seasoned Teak Craftsmanship',
    slug: 'interior-design-trends-2026',
    excerpt: 'Evaluating solid seasoned teak wood entrance portals alongside virgin wood polymer composite (WPC) doors engineered for lifetime moisture and termite resistance.',
    content: `Doorways are the defining architectural thresholds of any luxury structure. Modern residences require a thoughtful specification strategy that balances ceremonial grandeur at the main entrance with absolute moisture immunity in private utility spaces.

### Material Selection for Enduring Architectural Doors

- **Ceremonial Teak Main Portals**: Solid Burma and CP teak wood, kiln-seasoned to an optimal 10-12% moisture level, resists warping and provides centuries of structural grace when finished with high-solids PU clear coatings.
- **100% Waterproof WPC Bathroom Doors**: In high-humidity bathrooms and utility areas, high-density virgin Wood Polymer Composite (WPC) core doors eliminate swelling, rot, and termite vulnerability forever.
- **Concealed 3D Adjustable Hinges**: Architectural flush hinges recessed inside door leaves preserve clean vertical profiles without protruding barrel knuckles.
- **Acoustic Drop-Down Seals**: Automated bottom drop seals actuate upon door closure, ensuring draft prevention, thermal insulation, and sound attenuation between rooms.`,
    author: 'Chief Architect, Royal Epic',
    date: 'June 28, 2026',
    category: 'Architectural Woodwork',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'blog-2',
    title: 'Sanctuary Architecture: Designing High-End Wellness Spas & Holistic Salons',
    slug: 'beauty-spa-interior-design',
    excerpt: 'Creating restorative commercial sanctuaries through acoustic isolation, indirect 2700K lighting, waterproof cabinetry, and biophilic natural materials.',
    content: `A luxury spa or aesthetic salon must immediately calm the nervous system upon entry. Achieving this requires meticulous sensory architecture: eliminating sharp reverberant sound, harsh glare, and visible utility clutter.

### Core Architecture for Luxury Wellness Spaces

- **Acoustic Decoupling**: Independent drywall partitions insulated with high-density rockwool ensure complete acoustic separation between private massage chambers and consultation suites.
- **Concealed Low-Glare Lighting**: Soft indirect illumination recessed along floor coves and ceiling perimeter troughs gently illuminates paths without blinding guests resting on treatment beds.
- **Non-Porous Moisture-Resistant Millwork**: Cabinets and treatment vanity counters built from moisture-impervious WPC cores and solid surfaces withstand therapeutic oils, hot steam, and continuous sanitization.
- **Biophilic Natural Surfaces**: Unvarnished natural stone, fluted teak louvers, and living greenery evoke a soothing organic connection with the natural world.`,
    author: 'Senior Commercial Interior Architect',
    date: 'June 20, 2026',
    category: 'Wellness & Spa',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80'
  }
];

export const KITCHEN_EQUIPMENT_CATALOG: KitchenEquipmentItem[] = [
  {
    id: 'ke-1',
    name: 'Stainless Steel Work Table',
    specification: 'Heavy-Duty 304 Grade Stainless Steel, 1.2mm sheet, bottom under-shelf, bullet feet',
    unit: 'Piece',
    priceRange: '₹8,500 – ₹22,000',
    priceMin: 8500,
    priceMax: 22000,
    warranty: '2 Years Manufacturer Warranty',
    category: 'Preparation & Fabrication',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-2',
    name: 'SS Sink Single Bowl',
    specification: 'Commercial 304 SS Single Bowl Sink with drain board & splashback, cross bracing',
    unit: 'Piece',
    priceRange: '₹7,500 – ₹15,000',
    priceMin: 7500,
    priceMax: 15000,
    warranty: '2 Years Manufacturer Warranty',
    category: 'Washing & Hygiene',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-3',
    name: 'SS Sink Double Bowl',
    specification: 'Dual Compartment 304 SS Sink with double drainer & heavy-duty waste couplings',
    unit: 'Piece',
    priceRange: '₹12,000 – ₹25,000',
    priceMin: 12000,
    priceMax: 25000,
    warranty: '2 Years Manufacturer Warranty',
    category: 'Washing & Hygiene',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-4',
    name: 'Commercial Gas Range (2 Burner)',
    specification: 'Heavy-duty cast iron high pressure burners, SS frame, pilot light ignition',
    unit: 'Unit',
    priceRange: '₹18,000 – ₹35,000',
    priceMin: 18000,
    priceMax: 35000,
    warranty: '1 Year Onsite Warranty',
    category: 'Cooking Equipment',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-5',
    name: 'Commercial Gas Range (4 Burner)',
    specification: 'High capacity 4 burner range with lower storage shelf / oven, flame failure safety',
    unit: 'Unit',
    priceRange: '₹35,000 – ₹65,000',
    priceMin: 35000,
    priceMax: 65000,
    warranty: '1 Year Onsite Warranty',
    category: 'Cooking Equipment',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-6',
    name: 'Chinese Wok Range',
    specification: 'High velocity jet burner with water cooling wash channel & knee valve controls',
    unit: 'Unit',
    priceRange: '₹28,000 – ₹60,000',
    priceMin: 28000,
    priceMax: 60000,
    warranty: '1 Year Warranty',
    category: 'Cooking Equipment',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-7',
    name: 'Dosa Plate',
    specification: 'Machined 16mm thick mild steel / SS plate, uniform gas/electric thermal heating',
    unit: 'Unit',
    priceRange: '₹22,000 – ₹55,000',
    priceMin: 22000,
    priceMax: 55000,
    warranty: '1 Year Warranty',
    category: 'South Indian & Fast Food',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-8',
    name: 'Deep Fat Fryer',
    specification: 'Twin basket electric/gas fryer with auto-thermostat cutoff & oil drain tap',
    unit: 'Unit',
    priceRange: '₹15,000 – ₹40,000',
    priceMin: 15000,
    priceMax: 40000,
    warranty: '1 Year Warranty',
    category: 'Snacks & Fast Food',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-9',
    name: 'Shawarma Machine',
    specification: 'Motorized vertical rotating meat spit with ceramic gas heaters & grease tray',
    unit: 'Unit',
    priceRange: '₹18,000 – ₹45,000',
    priceMin: 18000,
    priceMax: 45000,
    warranty: '1 Year Warranty',
    category: 'Grilling & Tandoor',
    image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-10',
    name: 'Charcoal BBQ Grill',
    specification: 'Refractory brick insulated 304 SS body with height adjustable skewing grate',
    unit: 'Unit',
    priceRange: '₹18,000 – ₹50,000',
    priceMin: 18000,
    priceMax: 50000,
    warranty: '1 Year Warranty',
    category: 'Grilling & Tandoor',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-11',
    name: 'Salamander Grill',
    specification: 'Overhead radiant heat gas/electric salamander for melting cheese & grilling',
    unit: 'Unit',
    priceRange: '₹22,000 – ₹55,000',
    priceMin: 22000,
    priceMax: 55000,
    warranty: '1 Year Warranty',
    category: 'Grilling & Tandoor',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-12',
    name: 'Steam Cooking Unit',
    specification: 'Commercial tilting jacketed steam kettle for bulk rice, lentil & gravy prep',
    unit: 'Unit',
    priceRange: '₹35,000 – ₹90,000',
    priceMin: 35000,
    priceMax: 90000,
    warranty: '2 Years Warranty',
    category: 'Bulk Cooking Vessels',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-13',
    name: 'Rice Boiler',
    specification: 'Heavy steam pressure rice cooking vessel with automatic water feed control',
    unit: 'Unit',
    priceRange: '₹18,000 – ₹45,000',
    priceMin: 18000,
    priceMax: 45000,
    warranty: '1 Year Warranty',
    category: 'Bulk Cooking Vessels',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-14',
    name: 'Idli Steamer',
    specification: '54 / 108 idli capacity SS steamer chamber with steam safety pressure valve',
    unit: 'Unit',
    priceRange: '₹22,000 – ₹70,000',
    priceMin: 22000,
    priceMax: 70000,
    warranty: '1 Year Warranty',
    category: 'South Indian & Fast Food',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-15',
    name: 'Chapati Plate',
    specification: 'Combined chapati hot plate & puffing burner with heavy iron surface',
    unit: 'Unit',
    priceRange: '₹20,000 – ₹55,000',
    priceMin: 20000,
    priceMax: 55000,
    warranty: '1 Year Warranty',
    category: 'Indian Kitchen',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-16',
    name: 'Exhaust Hood',
    specification: 'SS 304 baffle filter grease trap hood with LED spotlights & oil collector',
    unit: 'Running Feet / Unit',
    priceRange: '₹18,000 – ₹80,000',
    priceMin: 18000,
    priceMax: 80000,
    warranty: '2 Years Warranty',
    category: 'Ventilation & Fresh Air',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-17',
    name: 'Fresh Air System',
    specification: 'Centrifugal blower unit with air washer system & fresh air supply louvers',
    unit: 'Unit',
    priceRange: '₹35,000 – ₹1,20,000',
    priceMin: 35000,
    priceMax: 120000,
    warranty: '2 Years Warranty',
    category: 'Ventilation & Fresh Air',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-18',
    name: 'Ducting Work',
    specification: 'Galvanized Iron (GI) / SS 304 leakproof kitchen exhaust ducting fabrication',
    unit: 'Per Sq. Ft.',
    priceRange: '₹350 – ₹700 per sq.ft.',
    priceMin: 350,
    priceMax: 700,
    warranty: '2 Years Guarantee',
    category: 'Ventilation & Fresh Air',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-19',
    name: 'Commercial Refrigerator',
    specification: 'Vertical 2/4 door SS chiller (+2°C to +8°C), digital thermostat, Eco R134a',
    unit: 'Unit',
    priceRange: '₹35,000 – ₹1,50,000',
    priceMin: 35000,
    priceMax: 150000,
    warranty: '2 Years Compressor Warranty',
    category: 'Refrigeration & Cold Storage',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-20',
    name: 'Deep Freezer',
    specification: 'Heavy commercial chest freezer (-18°C), tropicalized condenser & lockable lid',
    unit: 'Unit',
    priceRange: '₹25,000 – ₹75,000',
    priceMin: 25000,
    priceMax: 75000,
    warranty: '3 Years Compressor Warranty',
    category: 'Refrigeration & Cold Storage',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-21',
    name: 'Cold Room',
    specification: 'Modular PUF panel insulated walk-in chiller & freezer room with Danfoss compressor',
    unit: 'Complete Setup',
    priceRange: '₹2,50,000 – ₹8,00,000',
    priceMin: 250000,
    priceMax: 800000,
    warranty: '3 Years Warranty',
    category: 'Refrigeration & Cold Storage',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-22',
    name: 'Planetary Mixer',
    specification: '10L to 40L capacity dough & batter mixer with whisk, hook & beater attachments',
    unit: 'Unit',
    priceRange: '₹22,000 – ₹1,20,000',
    priceMin: 22000,
    priceMax: 120000,
    warranty: '1 Year Warranty',
    category: 'Food Processing Machinery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-23',
    name: 'Spiral Mixer',
    specification: 'Commercial bakery dough kneader 20kg–100kg with dual speed timer motor',
    unit: 'Unit',
    priceRange: '₹45,000 – ₹2,50,000',
    priceMin: 45000,
    priceMax: 250000,
    warranty: '1 Year Warranty',
    category: 'Food Processing Machinery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-24',
    name: 'Vegetable Cutting Machine',
    specification: 'Multi-blade commercial dicer, slicer, shredder & grater with safety cutoff',
    unit: 'Unit',
    priceRange: '₹15,000 – ₹45,000',
    priceMin: 15000,
    priceMax: 45000,
    warranty: '1 Year Warranty',
    category: 'Food Processing Machinery',
    image: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-25',
    name: 'Potato Peeler',
    specification: '5kg to 20kg batch carborundum abrasive drum peeler with water spray inlet',
    unit: 'Unit',
    priceRange: '₹18,000 – ₹50,000',
    priceMin: 18000,
    priceMax: 50000,
    warranty: '1 Year Warranty',
    category: 'Food Processing Machinery',
    image: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-26',
    name: 'Dishwasher',
    specification: 'Hood type / conveyor commercial SS rack dishwasher with high-temp sanitizing booster',
    unit: 'Unit',
    priceRange: '₹80,000 – ₹4,00,000',
    priceMin: 80000,
    priceMax: 400000,
    warranty: '2 Years Warranty',
    category: 'Washing & Hygiene',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-27',
    name: 'SS Storage Rack',
    specification: '4-tier heavy load 304 SS dunnage & storage shelving rack for dry stores',
    unit: 'Unit',
    priceRange: '₹6,000 – ₹20,000',
    priceMin: 6000,
    priceMax: 20000,
    warranty: '2 Years Warranty',
    category: 'Storage & Trolleys',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-28',
    name: 'SS Wall Shelf',
    specification: 'Wall mounted 304 SS tubular / solid utility shelf with heavy brackets',
    unit: 'Unit',
    priceRange: '₹3,500 – ₹12,000',
    priceMin: 3500,
    priceMax: 12000,
    warranty: '2 Years Warranty',
    category: 'Storage & Trolleys',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-29',
    name: 'Bain Marie Counter',
    specification: 'Hot food warming display counter with GN 1/1 containers & glass top guard',
    unit: 'Unit',
    priceRange: '₹20,000 – ₹75,000',
    priceMin: 20000,
    priceMax: 75000,
    warranty: '1 Year Warranty',
    category: 'Service & Display Counters',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ke-30',
    name: 'Display Counter',
    specification: 'Curved glass heated / refrigerated food showcase counter with LED illumination',
    unit: 'Unit',
    priceRange: '₹35,000 – ₹2,00,000',
    priceMin: 35000,
    priceMax: 200000,
    warranty: '1 Year Warranty',
    category: 'Service & Display Counters',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
  }
];
