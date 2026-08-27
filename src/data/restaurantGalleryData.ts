export interface RestaurantGalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  description?: string;
  isAiGenerated: boolean;
  tags?: string[];
}

export const RESTAURANT_CATEGORIES = [
  'All',
  'Modern Restaurant Interiors',
  'Luxury Restaurant Interiors',
  'Contemporary Restaurant Interiors',
  'Fine Dining Interiors',
  'Cafe Interiors',
  'Premium Cafe Interiors',
  'South Indian Restaurant Interiors',
  'Indian Restaurant Interiors',
  'Traditional Restaurant Interiors',
  'Luxury Dining Interiors',
  'Casual Dining Interiors',
  'Food Court Interiors',
  'Boutique Restaurant Interiors',
  'Theme Restaurant Interiors',
  'Bar & Restaurant Interiors',
  'Small Restaurant Interiors',
  'Large Restaurant Interiors'
] as const;

export const RESTAURANT_GALLERY_DATA: RestaurantGalleryItem[] = [
  {
    id: 'rest-001',
    title: 'Warm Ambient Fine Dining Hall',
    category: 'Fine Dining Interiors',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury fine dining restaurant interior with ambient warm ceiling lighting and bespoke dining tables',
    description: 'Bespoke walnut wood tables, brass chandelier lighting, and acoustic fabric wall panelling.',
    isAiGenerated: false,
    tags: ['Fine Dining', 'Luxury', 'Warm Lighting', 'Acoustic Cladding']
  },
  {
    id: 'rest-002',
    title: 'Contemporary Botanical Bistro & Bar',
    category: 'Contemporary Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Contemporary restaurant interior featuring biophilic green plants, marble bar counters, and modern seating',
    description: 'Biophilic greenery integration with Italian marble bar tops and brushed gold pendant fixtures.',
    isAiGenerated: false,
    tags: ['Contemporary', 'Biophilic', 'Bar Counter', 'Marble']
  },
  {
    id: 'rest-003',
    title: 'High-End Luxury Lounge & Dining',
    category: 'Luxury Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury restaurant interior design with velvet booth seating and architectural lighting',
    description: 'Curved emerald velvet banquettes, fluted timber dividers, and custom bronze accents.',
    isAiGenerated: false,
    tags: ['Luxury', 'Lounge', 'Velvet Booths', 'Custom Lighting']
  },
  {
    id: 'rest-004',
    title: 'Minimalist Scandinavian Artisan Cafe',
    category: 'Cafe Interiors',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    alt: 'Minimalist cafe interior design with light oak wood tables and white walls',
    description: 'Light oak custom furnishings, terrazzo countertops, and expansive natural daylighting.',
    isAiGenerated: false,
    tags: ['Cafe', 'Minimalist', 'Oak Wood', 'Terrazzo']
  },
  {
    id: 'rest-005',
    title: 'Heritage South Indian Brass & Teak Restaurant',
    category: 'South Indian Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1200&q=80',
    alt: 'South Indian traditional restaurant interior featuring teak woodwork and brass hanging lamps',
    description: 'Solid teak furniture, antique brass urlis, Chettinad style pillar accents, and warm terracotta tile flooring.',
    isAiGenerated: true,
    tags: ['South Indian', 'Teak Wood', 'Brass Lamps', 'Traditional']
  },
  {
    id: 'rest-006',
    title: 'Grand Velvet & Gold Banquet Hall',
    category: 'Large Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    alt: 'Spacious large restaurant hall interior with high ceilings and round banquet dining tables',
    description: 'Double-height ceiling design with crystal chandeliers, acoustic baffle ceiling, and multi-tier seating.',
    isAiGenerated: false,
    tags: ['Large Dining', 'High Ceiling', 'Chandelier', 'Banquet']
  },
  {
    id: 'rest-007',
    title: 'Cozy Boutique Corner Cafe & Patisserie',
    category: 'Small Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    alt: 'Cozy small boutique cafe interior with compact wooden seating and espresso bar',
    description: 'Space-saving banquet seating, integrated display pastry counter, and warm pendant spotlights.',
    isAiGenerated: false,
    tags: ['Small Space', 'Boutique', 'Cafe', 'Display Counter']
  },
  {
    id: 'rest-008',
    title: 'Art Deco Cocktail Bar & Dining Suite',
    category: 'Bar & Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Art deco bar and restaurant interior with backlit liquor shelves and brass barstools',
    description: 'Backlit onyx stone bar back, brass geometric shelving, and deep indigo leather stools.',
    isAiGenerated: false,
    tags: ['Bar & Dining', 'Art Deco', 'Backlit Onyx', 'Leather Stools']
  },
  {
    id: 'rest-009',
    title: 'Royal Indian Imperial Thali Dining Hall',
    category: 'Indian Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=1200&q=80',
    alt: 'Royal Indian traditional restaurant interior with arched jharokha screens and carved wooden furniture',
    description: 'Carved teakwood jharokha partitions, rich jewel-toned upholstery, and customized royal brass service stations.',
    isAiGenerated: true,
    tags: ['Indian Dining', 'Jharokha', 'Teakwood', 'Royal Theme']
  },
  {
    id: 'rest-010',
    title: 'Industrial Chic Urban Gastro Pub',
    category: 'Modern Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern industrial restaurant interior with exposed brickwork and black steel lighting rigs',
    description: 'Exposed brick finish, matte black powder-coated steel joinery, and reclaimed teak dining tabletops.',
    isAiGenerated: false,
    tags: ['Modern', 'Industrial', 'Brick Cladding', 'Steel Joinery']
  },
  {
    id: 'rest-011',
    title: 'Gourmet Rooftop Glasshouse Restaurant',
    category: 'Luxury Dining Interiors',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury rooftop restaurant glasshouse with panoramic city views and romantic lighting',
    description: 'Frameless glass curtain walls, motorized thermal louver ceilings, and weatherproof luxury lounge furniture.',
    isAiGenerated: false,
    tags: ['Luxury Dining', 'Rooftop', 'Glasshouse', 'Panoramic']
  },
  {
    id: 'rest-012',
    title: 'Chic European Espresso & Dessert Bar',
    category: 'Premium Cafe Interiors',
    image: 'https://images.unsplash.com/photo-1445116572660-23842988c843?auto=format&fit=crop&w=1200&q=80',
    alt: 'Premium cafe interior with brass detailing, fluted glass partitions, and custom bakery displays',
    description: 'Herringbone timber floorboards, fluted reeded glass screens, and integrated refrigeration showcases.',
    isAiGenerated: false,
    tags: ['Premium Cafe', 'European Style', 'Herringbone', 'Fluted Glass']
  },
  {
    id: 'rest-013',
    title: 'Authentic Kerala Spice Garden Restaurant',
    category: 'South Indian Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala traditional restaurant interior with wooden ceiling rafters and brass bell decor',
    description: 'Exposed teakwood roof trusses, Athangudi handmade floor tiles, and authentic brass oil lamp displays.',
    isAiGenerated: true,
    tags: ['South Indian', 'Kerala Style', 'Athangudi Tiles', 'Teak Trusses']
  },
  {
    id: 'rest-014',
    title: 'Modern Japanese Teppanyaki & Sushi Counter',
    category: 'Theme Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Theme Japanese restaurant interior with natural light wood sushi bar and acoustic slatted screens',
    description: 'Hinoki cypress inspired counter joinery, charcoal acoustic felt walls, and concealed linear LED channels.',
    isAiGenerated: false,
    tags: ['Theme Restaurant', 'Japanese', 'Slatted Wood', 'Sushi Counter']
  },
  {
    id: 'rest-015',
    title: 'Contemporary Mall Food Court Hub',
    category: 'Food Court Interiors',
    image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern commercial food court interior with durable high-traffic seating and bright signage',
    description: 'Heavy-duty 304 SS fixtures, antimicrobial laminate table tops, and zoned acoustic ceiling baffles.',
    isAiGenerated: false,
    tags: ['Food Court', 'High Traffic', 'Durable Joinery', 'Stainless Steel']
  },
  {
    id: 'rest-016',
    title: 'Private VIP Dining Cellar Room',
    category: 'Boutique Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
    alt: 'Boutique private VIP dining room with temperature-controlled wine walls and marble dining table',
    description: 'Custom glass climate-controlled wine cellars, acoustic leather panelled walls, and private service pantries.',
    isAiGenerated: false,
    tags: ['Boutique', 'VIP Dining', 'Wine Display', 'Leather Panelling']
  },
  {
    id: 'rest-017',
    title: 'Casual Family Dining & Pizzeria Hall',
    category: 'Casual Dining Interiors',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    alt: 'Casual dining restaurant interior with open kitchen and wood-fired pizza oven',
    description: 'Open theatre kitchen line, solid oak communal tables, and stain-resistant commercial leatherette seating.',
    isAiGenerated: false,
    tags: ['Casual Dining', 'Open Kitchen', 'Family Seating', 'Oak Wood']
  },
  {
    id: 'rest-018',
    title: 'Chettinad Heritage Courtyard Restaurant',
    category: 'Traditional Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Chettinad restaurant interior with central skylight courtyard and carved wooden pillars',
    description: 'Authentic Burma teak carved pillars, handmade Athangudi geometric tiles, and brass hanging oil lamps.',
    isAiGenerated: true,
    tags: ['Traditional', 'Chettinad', 'Carved Pillars', 'Courtyard']
  },
  {
    id: 'rest-019',
    title: 'Sleek Monochromatic Fine Dining Room',
    category: 'Modern Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern monochromatic restaurant interior with sleek black furniture and architectural spotlighting',
    description: 'Matte black fluted surfaces, smoke-tinted glass accents, and precision focused 2700K optical downlights.',
    isAiGenerated: false,
    tags: ['Modern', 'Monochromatic', 'Fluted Details', 'Architectural']
  },
  {
    id: 'rest-020',
    title: 'Lush Botanical Greenhouse Cafe',
    category: 'Cafe Interiors',
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
    alt: 'Greenhouse cafe interior with hanging ferns, rattan furniture, and skylights',
    description: 'Natural rattan armchairs, skylight glazing, automated misting systems, and custom brass espresso bar.',
    isAiGenerated: false,
    tags: ['Cafe', 'Greenhouse', 'Rattan', 'Skylight']
  },
  {
    id: 'rest-021',
    title: 'Grand Indian Palace Themed Restaurant',
    category: 'Indian Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    alt: 'Palace-inspired Indian restaurant with arched ceilings and gold leaf detailing',
    description: 'Handcrafted gold leaf stucco mouldings, custom velvet upholstered high-back chairs, and heritage arches.',
    isAiGenerated: true,
    tags: ['Indian Palace', 'Gold Leaf', 'High Back Chairs', 'Heritage']
  },
  {
    id: 'rest-022',
    title: 'Retro Mid-Century Modern Diner & Bar',
    category: 'Theme Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80',
    alt: 'Mid-century modern theme restaurant with curved booth seating and retro timber ceiling',
    description: 'Ribbed walnut panel walls, curved channel-tufted mustard booths, and terrazzo tiled cocktail bar.',
    isAiGenerated: false,
    tags: ['Theme Restaurant', 'Mid-Century', 'Walnut Wood', 'Tufted Booths']
  },
  {
    id: 'rest-023',
    title: 'Luxury Speakeasy Lounge & Grill',
    category: 'Bar & Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80',
    alt: 'Speakeasy lounge and grill interior with dark wood cladding and luxury leather armchairs',
    description: 'Concealed entrance doorways, dark oak wall panelling, brass bar footrails, and acoustic ceiling baffles.',
    isAiGenerated: false,
    tags: ['Speakeasy', 'Luxury Lounge', 'Dark Oak', 'Leather']
  },
  {
    id: 'rest-024',
    title: 'Contemporary Coastal Seafood Bistro',
    category: 'Contemporary Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Contemporary coastal restaurant interior with light timber slats, blue accents, and open views',
    description: 'Bleached ash wood joinery, sea-foam blue acoustic fabric upholstery, and mother-of-pearl wall inlays.',
    isAiGenerated: false,
    tags: ['Contemporary', 'Coastal Bistro', 'Ash Wood', 'Light Palette']
  },
  {
    id: 'rest-025',
    title: 'Boutique Patisserie & Dessert Salon',
    category: 'Boutique Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury boutique dessert salon interior with pink marble and brass display vitrines',
    description: 'Rose-tinted Italian marble counters, precision refrigerated glass vitrines, and French brass bistro chairs.',
    isAiGenerated: false,
    tags: ['Boutique', 'Dessert Salon', 'Rose Marble', 'Vitrines']
  },
  {
    id: 'rest-026',
    title: 'High-Volume Fast Casual Food Hall',
    category: 'Food Court Interiors',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=80',
    alt: 'High-volume commercial food hall with multi-counter ordering stalls and communal bench seating',
    description: 'Epoxy terrazzo flooring, modular stainless steel pickup counters, and integrated digital menu boards.',
    isAiGenerated: false,
    tags: ['Food Hall', 'Fast Casual', 'Digital Menu', 'Terrazzo']
  },
  {
    id: 'rest-027',
    title: 'Micro Artisan Coffee Roastery & Cafe',
    category: 'Small Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?auto=format&fit=crop&w=1200&q=80',
    alt: 'Small artisan coffee roastery with exposed roasting machine, concrete counters, and warm lighting',
    description: 'Cast concrete espresso bar, raw steel shelving, live bean display glass tubes, and acoustic cork walls.',
    isAiGenerated: false,
    tags: ['Small Cafe', 'Artisan Coffee', 'Concrete Bar', 'Raw Steel']
  },
  {
    id: 'rest-028',
    title: 'Luxury Michelin-Caliber Chef Table Suite',
    category: 'Luxury Dining Interiors',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury chef table dining room with interactive kitchen view and black granite surfaces',
    description: 'Black absolute granite single-slab dining counter, induction cooktop integration, and magnetic track lights.',
    isAiGenerated: false,
    tags: ['Luxury Dining', 'Chef Table', 'Black Granite', 'Exclusive']
  },
  {
    id: 'rest-029',
    title: 'Traditional Mughal Dawat Dining Hall',
    category: 'Traditional Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=1200&q=80',
    alt: 'Mughal themed traditional Indian restaurant with intricate jaali screens and low-seating diwans',
    description: 'Laser-cut CNC brass jaali partitions, silk brocade bolster cushions, and handcrafted walnut low tables.',
    isAiGenerated: true,
    tags: ['Traditional', 'Mughal Theme', 'Jaali Screens', 'Brocade']
  },
  {
    id: 'rest-030',
    title: 'Scandinavian All-Day Brunch Restaurant',
    category: 'Cafe Interiors',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    alt: 'Scandinavian light filled brunch cafe with birch wood tables and hanging pendant lights',
    description: 'Nordic birch ply wall louvers, custom bench seating with linen upholstery, and natural clay pendant lamps.',
    isAiGenerated: false,
    tags: ['Cafe', 'Scandinavian', 'Birch Wood', 'Daylight']
  },
  {
    id: 'rest-031',
    title: 'Modern Craft Brewery & Taproom',
    category: 'Bar & Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern brewery taproom with copper brewing tanks visible through glass and long communal benches',
    description: 'Polished copper fermentation tanks view, solid oak long-table seating, and industrial epoxy flooring.',
    isAiGenerated: false,
    tags: ['Bar & Dining', 'Taproom', 'Copper Tanks', 'Communal Seating']
  },
  {
    id: 'rest-032',
    title: 'Kerala Coastal Seafood Specialty House',
    category: 'South Indian Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala seafood specialty restaurant with coir rope wall installations and rosewood furnishings',
    description: 'Natural coir wall weaving, hand-rubbed Indian rosewood tables, and Kerala snake boat wooden motifs.',
    isAiGenerated: true,
    tags: ['South Indian', 'Kerala Coastal', 'Rosewood', 'Coir Craft']
  },
  {
    id: 'rest-033',
    title: 'Luxury Pan-Asian Dim Sum Teahouse',
    category: 'Fine Dining Interiors',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    alt: 'Pan-Asian luxury restaurant interior with dark timber screens and red silk lanterns',
    description: 'Black lacquer joinery, crimson silk light lanterns, and custom lazy-susan quartz dining tables.',
    isAiGenerated: false,
    tags: ['Fine Dining', 'Pan-Asian', 'Lacquer Joinery', 'Quartz Tables']
  },
  {
    id: 'rest-034',
    title: 'Chic Parisian Outdoor Terrace & Cafe',
    category: 'Premium Cafe Interiors',
    image: 'https://images.unsplash.com/photo-1445116572660-23842988c843?auto=format&fit=crop&w=1200&q=80',
    alt: 'Parisian style outdoor covered cafe terrace with cast iron tables and striped awnings',
    description: 'Cast aluminium outdoor bistro tables, custom water-resistant striped awnings, and brass planters.',
    isAiGenerated: false,
    tags: ['Premium Cafe', 'Parisian', 'Terrace', 'Bistro Tables']
  },
  {
    id: 'rest-035',
    title: 'High-Energy Contemporary Sports Bar & Grill',
    category: 'Casual Dining Interiors',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    alt: 'High-energy sports bar interior with multi-screen video walls and durable high-top booths',
    description: 'Integrated 4K video matrix walls, heavy-duty leatherette high-top booths, and soundproofing acoustic baffles.',
    isAiGenerated: false,
    tags: ['Casual Dining', 'Sports Bar', 'Video Walls', 'High-Tops']
  },
  {
    id: 'rest-036',
    title: 'Grand Heritage Chettinad Wedding Banquet Hall',
    category: 'Large Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    alt: 'Grand Chettinad banquet dining hall with carved teakwood pillars and brass chandelier ceiling',
    description: 'Massive teak wood pillars, 500+ guest seating capacity, and integrated buffet counters in 304 SS & granite.',
    isAiGenerated: true,
    tags: ['Large Dining', 'Chettinad Banquet', 'Teak Pillars', 'Grand Hall']
  },
  {
    id: 'rest-037',
    title: 'Boutique Wine & Tapas Tasting Parlour',
    category: 'Boutique Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
    alt: 'Boutique tapas tasting parlour with oak barrels, intimate seating, and warm copper lighting',
    description: 'Reclaimed French oak barrel tables, hammered copper downlights, and custom sommelier presentation station.',
    isAiGenerated: false,
    tags: ['Boutique', 'Tapas Bar', 'Copper Lights', 'Intimate']
  },
  {
    id: 'rest-038',
    title: 'Modern Organic Farm-to-Table Eatery',
    category: 'Modern Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Farm-to-table modern restaurant interior with live-edge wooden tables and clay wall finishes',
    description: 'Live-edge reclaimed acacia wood dining tables, lime plaster breathable wall finishes, and hemp pendant shades.',
    isAiGenerated: false,
    tags: ['Modern', 'Farm-to-Table', 'Live Edge Wood', 'Lime Plaster']
  },
  {
    id: 'rest-039',
    title: 'Cozy Express Noodle Bar & Kitchen',
    category: 'Small Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    alt: 'Small noodle bar interior with counter stools along the open kitchen line',
    description: 'Compact 400 sq.ft layout with 18 barstools, stainless steel underbar stations, and back-lit menu displays.',
    isAiGenerated: false,
    tags: ['Small Space', 'Noodle Bar', 'Compact Layout', 'High Turnaround']
  },
  {
    id: 'rest-040',
    title: 'Luxury Mediterranean Oceanside Trattoria',
    category: 'Luxury Dining Interiors',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury Mediterranean restaurant with white stucco arches and olive green leather seating',
    description: 'Hand-troweled Greek stucco arches, olive green leather banquette booths, and custom ceramic mosaic table inlays.',
    isAiGenerated: false,
    tags: ['Luxury Dining', 'Mediterranean', 'Stucco Arches', 'Mosaics']
  },
  {
    id: 'rest-041',
    title: 'Traditional Karnataka Udupi Heritage Bhavan',
    category: 'South Indian Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Udupi South Indian vegetarian restaurant interior with teak tables and brass bells',
    description: 'Heavy solid teakwood dining tables with high gloss food-grade polyurethane finish, brass partition grills, and temple bells.',
    isAiGenerated: true,
    tags: ['South Indian', 'Udupi Bhavan', 'Solid Teak', 'Brass Grills']
  },
  {
    id: 'rest-042',
    title: 'Contemporary Airport Transit Executive Lounge & Cafe',
    category: 'Food Court Interiors',
    image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=1200&q=80',
    alt: 'Executive airport food lounge with individual charging pods and buffet counters',
    description: 'Integrated USB-C power pods at each seat, quartz island buffet line, and sound-absorbing acoustic micro-perforated wood.',
    isAiGenerated: false,
    tags: ['Food Court', 'Executive Lounge', 'Power Pods', 'Quartz Buffet']
  },
  {
    id: 'rest-043',
    title: 'Theme Jungle Biophilic Treehouse Restaurant',
    category: 'Theme Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
    alt: 'Jungle themed restaurant interior with natural tree trunk columns and ambient canopy lighting',
    description: 'Sculpted natural tree trunk columns, hanging canopy foliage with fiber-optic starlight effects, and bamboo railings.',
    isAiGenerated: true,
    tags: ['Theme Restaurant', 'Jungle Biophilic', 'Treehouse', 'Fiber Optic']
  },
  {
    id: 'rest-044',
    title: 'Luxury 360-Degree Revolving Sky Restaurant',
    category: 'Luxury Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury revolving sky dining restaurant with plush navy seating and floor-to-ceiling glass',
    description: 'Custom motorized rotating floor platform, midnight navy velvet seating, and anti-reflective glass curtain walls.',
    isAiGenerated: false,
    tags: ['Luxury', 'Sky Restaurant', 'Velvet Seating', 'Revolving Floor']
  },
  {
    id: 'rest-045',
    title: 'Contemporary Artisanal Gelato & Waffle Parlour',
    category: 'Premium Cafe Interiors',
    image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80',
    alt: 'Contemporary gelato parlour interior with curved pastel counters and brass sconce lighting',
    description: 'Curved terrazzo gelato scooping bar, Italian pozzetti display containers, and custom pastel banquettes.',
    isAiGenerated: false,
    tags: ['Premium Cafe', 'Gelato Parlour', 'Terrazzo Bar', 'Pastel Banquettes']
  },
  {
    id: 'rest-046',
    title: 'Fine Dining Steakhouse with Open Charcoal Hearth',
    category: 'Fine Dining Interiors',
    image: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury steakhouse restaurant with open wood-fire hearth and dark leather booths',
    description: 'Stainless steel custom exhaust hood with fire-rated glass shield, dark oxblood leather booths, and charred oak wall slats.',
    isAiGenerated: false,
    tags: ['Fine Dining', 'Steakhouse', 'Charcoal Hearth', 'Oxblood Leather']
  },
  {
    id: 'rest-047',
    title: 'Modern Indian Fusion Lounge & Dining',
    category: 'Indian Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern Indian fusion restaurant interior with geometric copper screens and saffron velvet chairs',
    description: 'Geometric laser-cut copper ceiling canopies, saffron velvet wingback chairs, and terrazzo floor with brass inlays.',
    isAiGenerated: true,
    tags: ['Indian Fusion', 'Copper Canopies', 'Saffron Velvet', 'Brass Inlay']
  },
  {
    id: 'rest-048',
    title: 'Cozy University Campus Book Cafe',
    category: 'Cafe Interiors',
    image: 'https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?auto=format&fit=crop&w=1200&q=80',
    alt: 'Book cafe interior with floor-to-ceiling wooden bookshelves and comfortable reading armchairs',
    description: 'Floor-to-ceiling solid rubberwood bookshelves, reading nook booths with dimmable lamps, and silent acoustic flooring.',
    isAiGenerated: false,
    tags: ['Cafe', 'Book Cafe', 'Bookshelves', 'Reading Nooks']
  },
  {
    id: 'rest-049',
    title: 'Casual Highway Drive-Thru & Diner',
    category: 'Casual Dining Interiors',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern highway diner interior with easy-clean vinyl booths and stainless steel service lines',
    description: 'Commercial anti-bacterial laminate tabletops, heavy-gauge steel framing, and self-ordering touchscreen kiosks.',
    isAiGenerated: false,
    tags: ['Casual Dining', 'Highway Diner', 'Easy Clean', 'Touchscreen Kiosks']
  },
  {
    id: 'rest-050',
    title: 'Grand Corporate Tech Park Food Plaza',
    category: 'Large Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=1200&q=80',
    alt: 'Spacious tech park cafeteria with multi-station food islands and modern ergonomic seating',
    description: '1000+ seat food plaza layout, acoustic micro-perforated ceiling panels, and zoning dividers with live indoor plants.',
    isAiGenerated: false,
    tags: ['Large Dining', 'Tech Park Plaza', 'Acoustic Ceilings', 'Zoning Dividers']
  },
  {
    id: 'rest-051',
    title: 'Luxury French Riviera Champagne & Oyster Bar',
    category: 'Bar & Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury champagne bar interior with pearl white marble and ice wells integrated into the counter',
    description: 'Calacatta gold marble bar counter with built-in cold ice display wells, mirror-polished brass, and mother-of-pearl tiles.',
    isAiGenerated: false,
    tags: ['Bar & Dining', 'Champagne Bar', 'Calacatta Marble', 'Ice Display']
  },
  {
    id: 'rest-052',
    title: 'Contemporary Vegetarian Thali Experience Restaurant',
    category: 'South Indian Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=1200&q=80',
    alt: 'Contemporary South Indian vegetarian restaurant with clean oak lines and brass cutlery display',
    description: 'Ergonomic bench seating with concealed purse hooks, brass decorative water ewers, and antibacterial quartz tabletops.',
    isAiGenerated: true,
    tags: ['South Indian', 'Thali Restaurant', 'Quartz Tabletops', 'Ergonomic']
  },
  {
    id: 'rest-053',
    title: 'Chic Japanese Ramen & Gyoza Bar',
    category: 'Small Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Japanese ramen bar with light wood counter, noren fabric curtains, and overhead lantern lighting',
    description: 'Custom light ash wood ramen counter, traditional linen noren curtains, and concealed under-counter bag storage.',
    isAiGenerated: false,
    tags: ['Small Space', 'Ramen Bar', 'Ash Wood', 'Noren Curtains']
  },
  {
    id: 'rest-054',
    title: 'Boutique Moroccan Shisha & Tea Lounge',
    category: 'Theme Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    alt: 'Moroccan theme restaurant lounge with hand-painted ceramic zellij tiles and brass filigree lanterns',
    description: 'Handcrafted Moroccan zellij tiles, low plush velvet divans, carved cedarwood arches, and pierced copper lanterns.',
    isAiGenerated: true,
    tags: ['Theme Restaurant', 'Moroccan Lounge', 'Zellij Tiles', 'Cedarwood']
  },
  {
    id: 'rest-055',
    title: 'Modern Minimalist Sushi Omakase Room',
    category: 'Fine Dining Interiors',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
    alt: 'Minimalist Japanese omakase sushi room with natural solid wood counter and indirect wall glow',
    description: 'Seamless 300-year-old Japanese cypress counter look, tatami acoustic wall mats, and zero-glare recessed optical downlights.',
    isAiGenerated: false,
    tags: ['Fine Dining', 'Omakase', 'Minimalist', 'Optical Lighting']
  },
  {
    id: 'rest-056',
    title: 'Luxury Boutique French Bakery & Cafe',
    category: 'Premium Cafe Interiors',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury French bakery with marble counter and illuminated bread showcase shelves',
    description: 'Carrara marble sales counter, custom warm-LED illuminated oak bread display ladder, and brass pastry cloches.',
    isAiGenerated: false,
    tags: ['Premium Cafe', 'French Bakery', 'Carrara Marble', 'Showcase Shelves']
  },
  {
    id: 'rest-057',
    title: 'Contemporary Pan-Indian Thali & Kebab Hub',
    category: 'Indian Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=1200&q=80',
    alt: 'Contemporary Indian kebab restaurant with live clay tandoor display behind glass',
    description: 'Glass-enclosed copper tandoor display station, dark teakwood furniture with brass rivets, and terracotta pendant lamps.',
    isAiGenerated: true,
    tags: ['Indian Dining', 'Live Tandoor', 'Copper Cladding', 'Teakwood']
  },
  {
    id: 'rest-058',
    title: 'Casual Mexican Cantina & Taqueria',
    category: 'Casual Dining Interiors',
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Casual Mexican restaurant interior with vibrant talavera tiles and distressed wooden tables',
    description: 'Handmade colorful Talavera ceramic wall tiles, distressed pine wood tables, and festive festoon lighting.',
    isAiGenerated: false,
    tags: ['Casual Dining', 'Mexican Cantina', 'Ceramic Tiles', 'Distressed Pine']
  },
  {
    id: 'rest-059',
    title: 'Luxury Waterfront Seafood Pavilion',
    category: 'Luxury Dining Interiors',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury waterfront restaurant pavilion with floor-to-ceiling glass and nautical teak detailing',
    description: 'Marine-grade teakwood decking, marine 316 stainless steel railings, and acoustic fabric stretched ceilings.',
    isAiGenerated: false,
    tags: ['Luxury Dining', 'Waterfront', 'Marine Teak', 'Stretched Ceiling']
  },
  {
    id: 'rest-060',
    title: 'Modern Craft Cocktail & Tapas Bar Lounge',
    category: 'Bar & Restaurant Interiors',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern cocktail bar with illuminated brass bottle risers and emerald velvet bar stools',
    description: 'Illuminated brass tiered bottle riser, seamless poured terrazzo bar front, and acoustic velvet drapery.',
    isAiGenerated: false,
    tags: ['Bar & Dining', 'Cocktail Bar', 'Brass Risers', 'Terrazzo']
  }
];
