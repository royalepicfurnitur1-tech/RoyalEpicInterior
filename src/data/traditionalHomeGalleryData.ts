export interface TraditionalHomeGalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  description: string;
  isAiGenerated: boolean;
  tags: string[];
}

export const TRADITIONAL_HOME_CATEGORIES = [
  'All',
  'Kerala Style Homes',
  'Kerala Traditional Homes',
  'Chettinad Homes',
  'Chettinad Architecture',
  'South Indian Traditional Homes',
  'Indian Traditional Homes',
  'Nalukettu Homes',
  'Kerala Heritage Homes',
  'Traditional Kerala Interiors',
  'Chettinad Interiors',
  'Heritage Living Rooms',
  'Traditional Bedrooms',
  'Traditional Kitchens',
  'Traditional Dining Areas',
  'Central Courtyards',
  'Wooden Ceilings',
  'Traditional Wooden Doors',
  'Carved Wooden Architecture',
  'Heritage Villas',
  'Luxury Traditional Homes',
  'Temple-Inspired Interiors',
  'Traditional Pooja Rooms',
  'Traditional Verandahs',
  'Courtyard Homes'
] as const;

export const TRADITIONAL_HOME_GALLERY_DATA: TraditionalHomeGalleryItem[] = [
  {
    id: 'trad-001',
    title: 'Kerala Traditional Nalukettu Courtyard Home',
    category: 'Nalukettu Homes',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala traditional Nalukettu house design with central open courtyard, wooden pillars, and tiled sloped roof',
    description: 'Authentic Kerala Nalukettu house construction featuring a central Nadumuttam courtyard with rainwater harvesting, teakwood columns, and red terracotta clay roof tiles.',
    isAiGenerated: true,
    tags: ['Nalukettu Homes', 'Central Courtyard', 'Kerala Architecture', 'Nadumuttam']
  },
  {
    id: 'trad-002',
    title: 'Chettinad Heritage Mansion with Burma Teak Pillars',
    category: 'Chettinad Homes',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad heritage house design with Burma teak carved pillars, Athangudi floor tiles, and grand entrance hall',
    description: 'Grand Chettinad style house featuring imported Burma teak pillars, polished egg-white plaster walls, and hand-cast geometric Athangudi floral floor tiles.',
    isAiGenerated: true,
    tags: ['Chettinad Homes', 'Burma Teak', 'Athangudi Tiles', 'Heritage Architecture']
  },
  {
    id: 'trad-003',
    title: 'Intricate Carved Teakwood Main Entrance Door',
    category: 'Traditional Wooden Doors',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional South Indian carved wooden door with brass studs and intricate temple motifs',
    description: 'Solid CP Teak double-leaf main door crafted with traditional Ashtalakshmi carvings, heavy cast brass ornamental handles, and protective brass corner plates.',
    isAiGenerated: false,
    tags: ['Traditional Wooden Doors', 'Carved Doors', 'Teakwood', 'Brass Hardware']
  },
  {
    id: 'trad-004',
    title: 'Heritage Living Room with Charupadi Seating & Wooden Rafters',
    category: 'Heritage Living Rooms',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Heritage living room interior with wooden Charupadi bench seating, carved rafters, and brass decor',
    description: 'Traditional Kerala living room interior design featuring built-in Charupadi wooden verandah benches, exposed Anjili wood rafters, and antique brass urli centerpiece.',
    isAiGenerated: true,
    tags: ['Heritage Living Rooms', 'Charupadi', 'Kerala Interiors', 'Wooden Rafters']
  },
  {
    id: 'trad-005',
    title: 'Traditional South Indian Pooja Room with Carved Teak Mandapam',
    category: 'Traditional Pooja Rooms',
    image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional South Indian pooja room design with carved teakwood mandapam and brass bells',
    description: 'Sacred temple style pooja room architecture with hand-carved Gopuram roof finial in solid teak, brass hanging temple bells, and backlit onyx marble backdrop.',
    isAiGenerated: true,
    tags: ['Traditional Pooja Rooms', 'Temple-Inspired', 'Pooja Mandapam', 'Teakwood']
  },
  {
    id: 'trad-006',
    title: 'Kerala Style Verandah with Terracotta Tile Flooring',
    category: 'Traditional Verandahs',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala traditional verandah porch design with wooden pillars and terracotta clay floor tiles',
    description: 'Spacious Kerala style home verandah featuring round turned teak pillars, natural baked clay terracotta flooring, and sweeping views of lush landscape gardens.',
    isAiGenerated: true,
    tags: ['Traditional Verandahs', 'Kerala Style Homes', 'Terracotta Flooring', 'Porch Design']
  },
  {
    id: 'trad-007',
    title: 'Ornate Carved Wooden Ceiling in Rosewood & Teak',
    category: 'Wooden Ceilings',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional wooden ceiling design with coffered floral carvings and warm ambient concealed lighting',
    description: 'Intricate coffered wooden ceiling design crafted from seasoned Indian rosewood and teak, accented with lotus floral medallions and indirect warm gold lighting.',
    isAiGenerated: true,
    tags: ['Wooden Ceilings', 'Carved Architecture', 'Coffered Ceiling', 'Rosewood']
  },
  {
    id: 'trad-008',
    title: 'Chettinad Style Open Courtyard with Marble Pillars',
    category: 'Central Courtyards',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad courtyard house with Italian marble pillars and open skylight',
    description: 'Chettinad traditional courtyard house design featuring single-piece granite and marble columns supporting a two-tier interior balcony around the sunlit courtyard.',
    isAiGenerated: true,
    tags: ['Central Courtyards', 'Chettinad Architecture', 'Courtyard Homes', 'Marble Columns']
  },
  {
    id: 'trad-009',
    title: 'Kerala Heritage Villa with Sloping Mangalore Tile Roof',
    category: 'Heritage Villas',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala style house construction with multi-gabled Mangalore clay tile roof and wooden gables',
    description: 'Modern luxury heritage villa combining traditional Kerala architecture with contemporary comforts: gabled rooflines, wooden louvered dormers, and stone masonry.',
    isAiGenerated: true,
    tags: ['Heritage Villas', 'Kerala Style House Construction', 'Mangalore Tiles', 'Gabled Roof']
  },
  {
    id: 'trad-010',
    title: 'Traditional Wooden Four-Poster Heritage Bedroom Suite',
    category: 'Traditional Bedrooms',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Indian bedroom interior with carved wooden four-poster bed and brass lamps',
    description: 'Authentic South Indian heritage bedroom design with a hand-carved four-poster canopy bed in solid teak, antique bedside chests, and handloom cotton drapery.',
    isAiGenerated: true,
    tags: ['Traditional Bedrooms', 'Four-Poster Bed', 'Heritage Bedroom', 'Teakwood']
  },
  {
    id: 'trad-011',
    title: 'Traditional South Indian Dining Room with Attangudi Flooring',
    category: 'Traditional Dining Areas',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional South Indian dining area with heavy teak dining table and Athangudi tile floor',
    description: '10-seater solid teak dining table with cane-woven heritage dining chairs, antique brass hanging pendants, and hand-crafted multi-colored Athangudi tiles.',
    isAiGenerated: true,
    tags: ['Traditional Dining Areas', 'Athangudi Tiles', 'Teak Dining', 'South Indian Interiors']
  },
  {
    id: 'trad-012',
    title: 'Kerala Heritage Kitchen with Modern Brass & Wood Accents',
    category: 'Traditional Kitchens',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Kerala kitchen design with solid wooden cabinets and brass hardware',
    description: 'Harmonious fusion of Kerala traditional house interior with modular functionality: natural teak cabinet shutters, granite worktops, and brass pull handles.',
    isAiGenerated: true,
    tags: ['Traditional Kitchens', 'Kerala Style Interiors', 'Teak Cabinets', 'Brass Hardware']
  },
  {
    id: 'trad-013',
    title: 'Chettinad Palace Style Carved Wooden Corridor',
    category: 'Chettinad Architecture',
    image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad traditional home corridor with carved wooden brackets and colonnaded walkway',
    description: 'Colonnaded heritage corridor with massive carved timber brackets (Bodigai), antique wall sconces, and polished terracotta floor finishes.',
    isAiGenerated: true,
    tags: ['Chettinad Architecture', 'Carved Wooden Architecture', 'Colonnade', 'Bodigai']
  },
  {
    id: 'trad-014',
    title: 'Temple-Inspired Brass Jaali Partition & Foyer',
    category: 'Temple-Inspired Interiors',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    alt: 'Temple-inspired interior design with brass jaali lattice partition and stone carved idols',
    description: 'Foyer entrance featuring intricate geometric brass jaali screen inspired by South Indian temple architecture, natural granite water body, and floating lotus flowers.',
    isAiGenerated: true,
    tags: ['Temple-Inspired Interiors', 'Brass Jaali', 'Stone Carvings', 'South Indian Architecture']
  },
  {
    id: 'trad-015',
    title: 'Luxury Kerala Traditional Home with Infinity Plunge Pool',
    category: 'Luxury Traditional Homes',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury Kerala style home design with private pool and timber deck overlooking tropical trees',
    description: 'Modern luxury traditional home construction featuring authentic timber architecture, outdoor wooden sundeck, and a private stone infinity pool.',
    isAiGenerated: true,
    tags: ['Luxury Traditional Homes', 'Kerala Home Construction', 'Timber Architecture', 'Plunge Pool']
  },
  {
    id: 'trad-016',
    title: 'Ettukettu Double-Courtyard Kerala Heritage Home',
    category: 'Nalukettu Homes',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Ettukettu Kerala traditional home with dual courtyards and intricate wooden carvings',
    description: 'Rare Ettukettu (eight-block double-courtyard) traditional home design engineered for passive natural cross-ventilation, thermal comfort, and historic grandeur.',
    isAiGenerated: true,
    tags: ['Nalukettu Homes', 'Ettukettu', 'Courtyard House', 'Natural Ventilation']
  },
  {
    id: 'trad-017',
    title: 'South Indian Heritage Verandah with Swings (Oonjal)',
    category: 'Traditional Verandahs',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional South Indian verandah with solid teakwood swing Oonjal suspended by brass chains',
    description: 'Solid carved teakwood Oonjal plank suspended by heavy ornamental brass peacock link chains on a traditional terracotta tiled front porch.',
    isAiGenerated: false,
    tags: ['Traditional Verandahs', 'Oonjal Swing', 'Brass Chains', 'South Indian Homes']
  },
  {
    id: 'trad-018',
    title: 'Chettinad Antique Carved Wooden Archway',
    category: 'Carved Wooden Architecture',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad antique carved wooden archway framing a grand residential hallway',
    description: 'Salvaged and restored century-old Chettinad timber archway with floral relief carvings, supporting structural lintels, and rich natural beeswax polish.',
    isAiGenerated: true,
    tags: ['Carved Wooden Architecture', 'Chettinad Style Interiors', 'Timber Archway', 'Restored Wood']
  },
  {
    id: 'trad-019',
    title: 'Kerala Style Gabled Roof House with Laterite Stone Cladding',
    category: 'Kerala Style Homes',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala traditional house design with exposed red laterite stone walls and wooden balconies',
    description: 'Authentic Kerala house construction utilizing locally quarried natural red laterite stone blocks with exposed mortar grooves, teak louvers, and clay roofing.',
    isAiGenerated: true,
    tags: ['Kerala Style Homes', 'Laterite Stone', 'Kerala Traditional House Design', 'Clay Roof']
  },
  {
    id: 'trad-020',
    title: 'Chettinad Heritage Bedroom with Antique Four-Poster Bed',
    category: 'Chettinad Interiors',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad traditional bedroom interior with high ceilings and antique wooden furniture',
    description: '14-foot ceiling bedroom suite in Chettinad mansion style with antique Burma teak almirahs, lime plaster walls, and hand-cut Athangudi borders.',
    isAiGenerated: true,
    tags: ['Chettinad Interiors', 'Traditional Bedrooms', 'Burma Teak Almirah', 'High Ceilings']
  },
  {
    id: 'trad-021',
    title: 'Traditional Wooden Truss Ceiling with Brass Lanterns',
    category: 'Wooden Ceilings',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional wooden truss ceiling with hand-cut king post rafters and brass lanterns',
    description: 'Heavy structural timber roof trusses with hand-mortised joints, finished in antique walnut stain and illuminated by hanging brass oil lanterns.',
    isAiGenerated: true,
    tags: ['Wooden Ceilings', 'Traditional Architecture', 'Timber Trusses', 'Brass Lanterns']
  },
  {
    id: 'trad-022',
    title: 'Traditional Kerala Dining Room with Built-in Wooden Storage',
    category: 'Traditional Kerala Interiors',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Kerala interior design for dining hall with wooden cupboards and brass crockery display',
    description: 'Custom Anjili wood built-in crockery credenza with fluted glass panes, solid wood dining suite, and warm traditional ambience.',
    isAiGenerated: true,
    tags: ['Traditional Kerala Interiors', 'Traditional Dining Areas', 'Wooden Credenza', 'Anjili Wood']
  },
  {
    id: 'trad-023',
    title: 'Bespoke Solid Teakwood Pooja Mandap with Intricate Jaali Work',
    category: 'Traditional Pooja Rooms',
    image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=1200&q=80',
    alt: 'Bespoke teakwood pooja mandap with CNC laser-cut jaali panels and warm brass lighting',
    description: 'Custom handcrafted pooja shrine with solid teak construction, motorized brass bell mechanism, and velvet-lined storage drawers for pooja samagri.',
    isAiGenerated: true,
    tags: ['Traditional Pooja Rooms', 'Pooja Mandap', 'Teakwood Shrine', 'Temple Style']
  },
  {
    id: 'trad-024',
    title: 'South Indian Courtyard with Sunken Seating & Tulsi Thara',
    category: 'Central Courtyards',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    alt: 'South Indian traditional courtyard with central stone Tulsi Thara and granite water features',
    description: 'Hand-carved granite stone Tulsi Thara placed at the geometric center of an open courtyard surrounded by smooth river pebbles and wooden Charupadi benches.',
    isAiGenerated: true,
    tags: ['Central Courtyards', 'Tulsi Thara', 'Courtyard Homes', 'South Indian Architecture']
  },
  {
    id: 'trad-025',
    title: 'Heritage Villa Living Hall with Antique Teak Sofas',
    category: 'Heritage Living Rooms',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Heritage villa living room with antique teakwood sofa set and silk cushions',
    description: 'Restored antique planter chairs, heavy teak three-seater sofa with cane mesh backs, and silk brocade bolster cushions in rich saffron and rust.',
    isAiGenerated: true,
    tags: ['Heritage Living Rooms', 'Planter Chairs', 'Cane Weaving', 'Teak Sofa']
  },
  {
    id: 'trad-026',
    title: 'Chettinad Teakwood Main Entrance with Carved Yali Motifs',
    category: 'Traditional Wooden Doors',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad traditional wooden door with carved Yali mythical motifs and brass studs',
    description: 'Grand 5-inch thick Burma teak door frame with mythical Yali guardian carvings, brass decorative rivets, and heavy interlocking iron security bar.',
    isAiGenerated: true,
    tags: ['Traditional Wooden Doors', 'Chettinad Architecture', 'Yali Carvings', 'Burma Teak']
  },
  {
    id: 'trad-027',
    title: 'Kerala Heritage Home with Traditional Machan Attic Lounge',
    category: 'Kerala Heritage Homes',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala heritage home design with upper wooden machan attic and sloped roof rafters',
    description: 'Upper timber attic level (Thattinpuram) transformed into a serene reading and meditation lounge with natural wood flooring and louvered dormer airflow.',
    isAiGenerated: true,
    tags: ['Kerala Heritage Homes', 'Thattinpuram', 'Attic Lounge', 'Kerala Traditional Architecture']
  },
  {
    id: 'trad-028',
    title: 'Indian Heritage Villa with Hand-Crafted Stone Jharokha Balcony',
    category: 'Indian Traditional Homes',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Indian traditional house design with carved stone jharokha balcony and arched verandah',
    description: 'Exquisite sandstone jharokha cantilevered balcony overlooking lush landscape gardens, combining North and South Indian traditional architectural elements.',
    isAiGenerated: true,
    tags: ['Indian Traditional Homes', 'Jharokha', 'Stone Carvings', 'Heritage Villa']
  },
  {
    id: 'trad-029',
    title: 'Traditional Kerala Kitchen with Wood-Fired Hearth & Modern Chimney',
    category: 'Traditional Kitchens',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala traditional kitchen interior with solid wood cabinets and brass spice rack',
    description: 'Adukkala-inspired kitchen design with concealed modern induction & silent exhaust chimney, copper cookware wall hanging racks, and dark granite counters.',
    isAiGenerated: true,
    tags: ['Traditional Kitchens', 'Adukkala', 'Copper Cookware', 'Kerala Interiors']
  },
  {
    id: 'trad-030',
    title: 'Chettinad Dining Hall with Century-Old Marble Table & Teak Chairs',
    category: 'Chettinad Interiors',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad dining room with Belgian glass mirrors and heavy teakwood dining table',
    description: 'Chettinad mansion dining hall adorned with vintage Belgian beveled mirrors, hand-carved high-back dining chairs, and authentic Athangudi patterned floor tiles.',
    isAiGenerated: true,
    tags: ['Chettinad Interiors', 'Traditional Dining Areas', 'Belgian Mirrors', 'High-Back Chairs']
  },
  {
    id: 'trad-031',
    title: 'Temple-Style Carved Stone & Wood Meditation Room',
    category: 'Temple-Inspired Interiors',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    alt: 'Temple-inspired meditation room with granite floor and carved timber mandapa',
    description: 'Quiet spiritual sanctum with flamed black granite floor, hand-chiseled stone lamp niches, and acoustic teak ceiling panelling.',
    isAiGenerated: true,
    tags: ['Temple-Inspired Interiors', 'Meditation Room', 'Flamed Granite', 'Stone Niches']
  },
  {
    id: 'trad-032',
    title: 'Kerala Style Courtyard House with Indoor Water Lotus Pond',
    category: 'Courtyard Homes',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala courtyard home with natural lotus pond and wooden walkways',
    description: 'Central open-to-sky water feature planted with royal blue water lilies, surrounded by rough-cut sadarahalli granite paving and teakwood perimeter benches.',
    isAiGenerated: true,
    tags: ['Courtyard Homes', 'Central Courtyards', 'Lotus Pond', 'Kerala Courtyard House']
  },
  {
    id: 'trad-033',
    title: 'Hand-Carved South Indian Wooden Pillars with Elephant Base',
    category: 'Carved Wooden Architecture',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
    alt: 'Hand-carved wooden pillar with traditional Gaja elephant base and floral capital',
    description: 'Structural weight-bearing pillars sculpted from matured Indian rosewood featuring carved elephant bases, fluted central shafts, and ornate floral capitals.',
    isAiGenerated: true,
    tags: ['Carved Wooden Architecture', 'Wooden Pillars', 'Rosewood', 'Gaja Motif']
  },
  {
    id: 'trad-034',
    title: 'Luxury Heritage Villa with Colonnaded Outdoor Verandah',
    category: 'Luxury Traditional Homes',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury heritage villa with grand colonnaded verandah overlooking private courtyard',
    description: 'Expansive wrap-around verandah (Poomukham) featuring 24 turned teak columns, polished oxide red flooring, and custom wicker lounge sets.',
    isAiGenerated: true,
    tags: ['Luxury Traditional Homes', 'Poomukham', 'Wrap-around Verandah', 'Red Oxide']
  },
  {
    id: 'trad-035',
    title: 'Kerala Traditional Master Bedroom with Red Oxide Flooring',
    category: 'Traditional Kerala Interiors',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala traditional bedroom with authentic mirror-polished red oxide floor and wooden bed',
    description: 'Traditional handcrafted red oxide floor with mirror-like smooth natural finish, complemented by solid teakwood furniture and soft brass bedside lighting.',
    isAiGenerated: true,
    tags: ['Traditional Kerala Interiors', 'Red Oxide Floor', 'Traditional Bedrooms', 'Teak Furniture']
  },
  {
    id: 'trad-036',
    title: 'Chettinad Heritage Mansion Façade with Stucco Sculptures',
    category: 'Chettinad Architecture',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad heritage house exterior façade with ornate stucco relief sculptures and parapet towers',
    description: 'Classic Chettinad multi-tiered façade adorned with lime-stucco mythological figurines, cast-iron balustrades, and multi-colored stained glass transom windows.',
    isAiGenerated: true,
    tags: ['Chettinad Architecture', 'Chettinad House Design', 'Stucco Sculptures', 'Stained Glass']
  },
  {
    id: 'trad-037',
    title: 'Nalukettu Traditional Home with Wooden Charupadi Verandah Seating',
    category: 'Nalukettu Homes',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Nalukettu home verandah with wooden Charupadi railing and sloped tile eaves',
    description: 'Authentic Kerala Nalukettu entrance verandah with continuous curved wooden Charupadi seating bench, allowing gentle breezes while preserving indoor privacy.',
    isAiGenerated: true,
    tags: ['Nalukettu Homes', 'Charupadi Seating', 'Kerala Nalukettu House', 'Wooden Railing']
  },
  {
    id: 'trad-038',
    title: 'Traditional Wooden Sliding Window Shutters (Kilikoodu)',
    category: 'Carved Wooden Architecture',
    image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Kerala wooden window shutters Kilikoodu with sliding louvered panels',
    description: 'Handmade Anjili timber window assemblies with sliding interlocking louver slats (Kilikoodu), eliminating the need for glass while ensuring complete natural ventilation.',
    isAiGenerated: true,
    tags: ['Carved Wooden Architecture', 'Kilikoodu Windows', 'Kerala Traditional Architecture', 'Louvered Shutters']
  },
  {
    id: 'trad-039',
    title: 'Indian Traditional Heritage Living Room with Brass Urli & Tanjore Paintings',
    category: 'Heritage Living Rooms',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Indian living room with gold leaf Tanjore art paintings and brass urli water bowl',
    description: 'Gold-foil embossed Tanjore paintings set against raw silk panelled walls, accompanied by a 4-foot antique brass Urli with floating marigolds and rose petals.',
    isAiGenerated: true,
    tags: ['Heritage Living Rooms', 'Tanjore Paintings', 'Brass Urli', 'Indian Traditional Interiors']
  },
  {
    id: 'trad-040',
    title: 'Solid Teak Double Door with Brass Sun & Moon Medallions',
    category: 'Traditional Wooden Doors',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Solid teakwood entrance door with ornate cast brass sun and moon central medallions',
    description: 'Heavy teak main entrance door set with hand-beaten brass Surya (Sun) and Chandra (Moon) central medallions, brass ring knockers, and threshold Torana carvings.',
    isAiGenerated: true,
    tags: ['Traditional Wooden Doors', 'Sun & Moon Medallions', 'Brass Knockers', 'Teakwood Doors']
  },
  {
    id: 'trad-041',
    title: 'Kerala Style Eco-Villa with Mud Plaster & Reclaimed Teakwood',
    category: 'Kerala Style Homes',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala eco-friendly home construction with mud plaster walls and reclaimed teakwood',
    description: 'Sustainable Kerala traditional home construction combining stabilized earth block walls, reclaimed century-old teak trusses, and passive solar shading.',
    isAiGenerated: true,
    tags: ['Kerala Style Homes', 'Eco Villa', 'Sustainable Construction', 'Reclaimed Teak']
  },
  {
    id: 'trad-042',
    title: 'Chettinad Mansion Inner Hall with Polished Athangudi Border Tiles',
    category: 'Chettinad Interiors',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad mansion interior with intricate floral Athangudi cement tile floor pattern',
    description: 'Vibrant cobalt blue and terracotta red Athangudi tile carpet layout bordered by polished black cuddapah stone, framed by carved teak interior doorways.',
    isAiGenerated: true,
    tags: ['Chettinad Interiors', 'Athangudi Tiles', 'Cuddapah Stone', 'Floral Tiles']
  },
  {
    id: 'trad-043',
    title: 'Traditional Wooden Coffered Ceiling with Chandelier Brass Lamps',
    category: 'Wooden Ceilings',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
    alt: 'Intricate wooden coffered ceiling with brass hanging Deepam lamps and gold trim',
    description: 'Multi-tiered coffered false ceiling executed in solid seasoned teak wood, featuring inverted lotus bosses and integrated warm 2400K architectural cove lighting.',
    isAiGenerated: true,
    tags: ['Wooden Ceilings', 'Coffered Ceiling', 'Lotus Carvings', 'Warm Lighting']
  },
  {
    id: 'trad-044',
    title: 'South Indian Heritage Dining Room with Cast-Iron Pillar Accents',
    category: 'Traditional Dining Areas',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    alt: 'South Indian heritage dining space with Victorian cast-iron pillars and teakwood table',
    description: 'Fusion of colonial South Indian architecture featuring restored Birmingham cast-iron columns, solid rosewood dining chairs, and warm terracotta floor tiles.',
    isAiGenerated: true,
    tags: ['Traditional Dining Areas', 'Colonial South Indian', 'Cast-Iron Pillars', 'Rosewood']
  },
  {
    id: 'trad-045',
    title: 'Traditional Kerala Pooja Room with Brass Diyas & Carved Teak Shutter Doors',
    category: 'Traditional Pooja Rooms',
    image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Kerala pooja room with carved bell-inset wooden doors and brass diyas',
    description: 'Custom pooja door with solid brass bells inset into lattice wooden cutouts, chiming softly upon every opening and closing for an authentic temple atmosphere.',
    isAiGenerated: true,
    tags: ['Traditional Pooja Rooms', 'Bell Inset Doors', 'Brass Diyas', 'Temple Interiors']
  },
  {
    id: 'trad-046',
    title: 'Courtyard Home with Water Channel & Natural Slate Stone Paving',
    category: 'Courtyard Homes',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    alt: 'Courtyard house design with linear water channel and natural slate stone flooring',
    description: 'Modern courtyard home with linear water cascade, rough-split Indian multi-slate stone flooring, and lush indoor monstera and bamboo landscaping.',
    isAiGenerated: true,
    tags: ['Courtyard Homes', 'Water Channel', 'Slate Stone', 'Courtyard Architecture']
  },
  {
    id: 'trad-047',
    title: 'Heritage Villa Front Porch with Antique Wooden Rocking Chairs',
    category: 'Traditional Verandahs',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    alt: 'Heritage villa front porch with antique wooden rocking chairs and terracotta roof tiles',
    description: 'Bespoke hand-bent teakwood rocking chairs with cane woven seats on an open verandah overlooking a tranquil tropical garden.',
    isAiGenerated: true,
    tags: ['Traditional Verandahs', 'Rocking Chairs', 'Cane Weaving', 'Verandah Design']
  },
  {
    id: 'trad-048',
    title: 'Traditional Kerala Tharavadu Living Room with Brass Clad Chests',
    category: 'Heritage Living Rooms',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala Tharavadu heritage living room with antique brass-studded wooden storage chest Nettoor Petti',
    description: 'Showcasing the legendary Kerala Nettoor Petti jewelry chest with ornamental brass hinges, antique planter chairs, and rich teak wood wainscoting.',
    isAiGenerated: true,
    tags: ['Heritage Living Rooms', 'Tharavadu', 'Nettoor Petti', 'Teak Wainscoting']
  },
  {
    id: 'trad-049',
    title: 'Carved Teakwood Temple Mandapam with Brass Kalasam Finial',
    category: 'Temple-Inspired Interiors',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    alt: 'Temple-inspired carved wooden mandapam with solid brass Kalasam rooftop finial',
    description: 'Miniature temple architecture crafted for luxury residential sanctuaries, complete with multi-tiered carved wooden Shikharas and mirror-polished brass Kalasam.',
    isAiGenerated: true,
    tags: ['Temple-Inspired Interiors', 'Mandapam', 'Kalasam Finial', 'Temple Architecture']
  },
  {
    id: 'trad-050',
    title: 'Chettinad Heritage Villa Exterior with Grand Carved Portico',
    category: 'Chettinad Homes',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad heritage villa exterior with majestic portico and ornamental wooden pillars',
    description: 'Grand vehicle portico supported by twin pairs of fluted granite columns leading to a magnificent carved timber double entrance door.',
    isAiGenerated: true,
    tags: ['Chettinad Homes', 'Portico', 'Granite Columns', 'Chettinad House Design']
  },
  {
    id: 'trad-051',
    title: 'Kerala Heritage Home with Traditional Wooden Staircase & Balusters',
    category: 'Kerala Heritage Homes',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala heritage home wooden staircase with carved balusters and solid teak treads',
    description: 'Masterpiece solid teak staircase featuring hand-turned spindle balusters, carved newel post with brass cap, and integrated storage drawers beneath.',
    isAiGenerated: true,
    tags: ['Kerala Heritage Homes', 'Wooden Staircase', 'Teak Treads', 'Turned Balusters']
  },
  {
    id: 'trad-052',
    title: 'Solid Rosewood Four-Poster Bed with Hand-Embroidered Silk Canopy',
    category: 'Traditional Bedrooms',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Indian bedroom suite with solid rosewood four-poster bed and silk canopy',
    description: 'Regal master suite featuring an Indian rosewood four-poster canopy bed draped in hand-spun cream silk, accompanied by brass filigree bedside pendant lamps.',
    isAiGenerated: true,
    tags: ['Traditional Bedrooms', 'Rosewood Bed', 'Silk Canopy', 'Master Suite']
  },
  {
    id: 'trad-053',
    title: 'South Indian Traditional Open Courtyard with Red Oxide Border',
    category: 'Central Courtyards',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    alt: 'South Indian courtyard with central rain drain, terracotta tiles, and red oxide walkways',
    description: 'Classical courtyard with sloped copper flashing drain for monsoon rains, smooth red oxide perimeter walkway, and four corner brass hanging oil lamps.',
    isAiGenerated: true,
    tags: ['Central Courtyards', 'Red Oxide', 'Monsoon Drain', 'South Indian Architecture']
  },
  {
    id: 'trad-054',
    title: 'Handcrafted Wooden Jali Partition Screen with Floral Relief',
    category: 'Carved Wooden Architecture',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
    alt: 'Handcrafted teakwood jaali room divider screen with floral lattice relief',
    description: 'Freestanding architectural room divider panel carved from seasoned teakwood with double-sided floral geometric open fretwork for soft filtered light.',
    isAiGenerated: true,
    tags: ['Carved Wooden Architecture', 'Jaali Screen', 'Room Divider', 'Fretwork']
  },
  {
    id: 'trad-055',
    title: 'Kerala Style Sloped Roof Villa with Wooden Louvers & Balconies',
    category: 'Kerala Style Homes',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala style house construction with wooden louvered balcony and sloped clay tile roof',
    description: 'Modern two-story Kerala traditional house construction with deep overhanging eaves for heavy tropical rainfall protection and operable timber window louvers.',
    isAiGenerated: true,
    tags: ['Kerala Style Homes', 'Overhanging Eaves', 'Timber Louvers', 'Kerala House Construction']
  },
  {
    id: 'trad-056',
    title: 'Traditional Brass-Inlaid Teak Dining Table & Benches',
    category: 'Traditional Dining Areas',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional dining area with brass-inlaid teakwood table and matching long wooden benches',
    description: 'Rustic yet refined 8-foot communal dining table with intricate floral brass wire inlays along the perimeter, paired with solid plank teak benches.',
    isAiGenerated: true,
    tags: ['Traditional Dining Areas', 'Brass Inlay', 'Teak Bench', 'Communal Dining']
  },
  {
    id: 'trad-057',
    title: 'Traditional Wooden Rafter Ceiling with Brass Chandelier Bosses',
    category: 'Wooden Ceilings',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional wooden exposed rafter ceiling with brass bosses and warm ambient light',
    description: 'Exposed structural Anjili rafters featuring hand-turned wooden brackets, polished brass connection plates, and warm golden illumination.',
    isAiGenerated: true,
    tags: ['Wooden Ceilings', 'Anjili Rafters', 'Brass Connection Plates', 'Traditional Ceilings']
  },
  {
    id: 'trad-058',
    title: 'Authentic Chettinad Kitchen with Brass & Bronze Urulis & Spice Cabinets',
    category: 'Traditional Kitchens',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad traditional kitchen design with brass urulis and wooden spice cabinets',
    description: 'Heritage kitchen space fitted with modular solid wood cabinets finished in dark honey stain, open brass cookware display shelving, and black granite work surfaces.',
    isAiGenerated: true,
    tags: ['Traditional Kitchens', 'Chettinad Interiors', 'Brass Uruli', 'Dark Honey Stain']
  },
  {
    id: 'trad-059',
    title: 'Luxury Heritage Villa Bedroom with Antique Wardrobes & Carved Headboard',
    category: 'Luxury Traditional Homes',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury heritage bedroom with carved wooden headboard and antique armoires',
    description: 'High-end traditional master bedroom with a 7-foot carved teak headboard, matching double almirahs with brass fittings, and pure linen furnishings.',
    isAiGenerated: true,
    tags: ['Luxury Traditional Homes', 'Carved Headboard', 'Teak Almirah', 'Traditional Bedrooms']
  },
  {
    id: 'trad-060',
    title: 'Traditional South Indian Nalukettu Courtyard with Copper Downspouts',
    category: 'Nalukettu Homes',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala Nalukettu house courtyard with hand-hammered copper rainwater downspouts',
    description: 'Rainwater harvesting courtyard in a Kerala Nalukettu house featuring handcrafted heavy copper rain chains (Kusari) guiding rainfall into a sunken granite collection cistern.',
    isAiGenerated: true,
    tags: ['Nalukettu Homes', 'Copper Rain Chains', 'Rainwater Harvesting', 'Granite Cistern']
  },
  {
    id: 'trad-061',
    title: 'Chettinad Carved Wooden Window Screen with Brass Latches',
    category: 'Chettinad Architecture',
    image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad carved wooden window frame with traditional heavy brass drop latches',
    description: 'Restored Chettinad timber window frame with floral relief work on jambs and lintels, finished with antique patina brass drop handles and security bolts.',
    isAiGenerated: true,
    tags: ['Chettinad Architecture', 'Carved Windows', 'Brass Latches', 'Chettinad Style House']
  },
  {
    id: 'trad-062',
    title: 'Indian Traditional Heritage Living Room with Cane Planters & Brass Lamps',
    category: 'Indian Traditional Homes',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Indian traditional living room with woven cane furniture and brass hanging Samayams',
    description: 'Airy traditional living room featuring natural hand-woven cane armchairs, brass Samayam floor lamps, and natural cotton dhurrie floor rugs.',
    isAiGenerated: true,
    tags: ['Indian Traditional Homes', 'Cane Furniture', 'Brass Samayam', 'Dhurrie Rugs']
  },
  {
    id: 'trad-063',
    title: 'Traditional Kerala Style Portico with Carved Gable Woodwork (Mukhappu)',
    category: 'Kerala Style Homes',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala traditional house gable design Mukhappu with carved wooden bargeboards',
    description: 'Iconic Kerala Mukhappu (carved gable end) featuring intricate wooden fretwork for cross-ventilation of the roof space, adorned with auspicious brass motifs.',
    isAiGenerated: true,
    tags: ['Kerala Style Homes', 'Mukhappu', 'Carved Gable', 'Kerala Architecture']
  },
  {
    id: 'trad-064',
    title: 'Solid Burma Teak Pooja Altar with Hanging Brass Bells',
    category: 'Traditional Pooja Rooms',
    image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=1200&q=80',
    alt: 'Pooja room altar with solid Burma teak construction and hanging brass ghantas',
    description: 'Sacred domestic altar design with 36 tuned solid brass ghanta bells, step tiers for deity vigrahas, and concealed warm LED illumination.',
    isAiGenerated: true,
    tags: ['Traditional Pooja Rooms', 'Brass Ghantas', 'Burma Teak', 'Pooja Altar']
  },
  {
    id: 'trad-065',
    title: 'South Indian Heritage Verandah with Terracotta Tile Inset & Wooden Pillars',
    category: 'Traditional Verandahs',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    alt: 'South Indian verandah with handmade terracotta floor tiles and turned wooden pillars',
    description: 'Deep shade verandah designed to buffer tropical heat, featuring 12-inch handmade terracotta tiles bordered with smooth yellow oxide and turned teak pillars.',
    isAiGenerated: true,
    tags: ['Traditional Verandahs', 'Yellow Oxide', 'Terracotta Tiles', 'Deep Shade Verandah']
  },
  {
    id: 'trad-066',
    title: 'Traditional Wooden Ceiling with Diamond Coffered Pattern & Teak Mouldings',
    category: 'Wooden Ceilings',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
    alt: 'Diamond pattern coffered wooden ceiling with teak mouldings and indirect glow',
    description: 'Custom diamond-geometry coffered timber ceiling crafted from seasoned teak wood with step-down perimeter cornices and warm ambient perimeter strip lighting.',
    isAiGenerated: true,
    tags: ['Wooden Ceilings', 'Diamond Coffered', 'Teak Mouldings', 'Perimeter Cornice']
  },
  {
    id: 'trad-067',
    title: 'Chettinad Heritage Mansion Central Hall with Marble & Teak Dining Suite',
    category: 'Chettinad Interiors',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad grand hall dining suite with white Italian marble and Burma teak wood',
    description: 'Grand reception hall dining arrangement featuring a single-slab white Makrana marble tabletop supported by heavy hand-carved teak trestle legs.',
    isAiGenerated: true,
    tags: ['Chettinad Interiors', 'Makrana Marble', 'Trestle Legs', 'Traditional Dining']
  },
  {
    id: 'trad-068',
    title: 'Traditional South Indian Courtyard with Stone Water Fountain & Brass Urli',
    category: 'Central Courtyards',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    alt: 'South Indian courtyard with hand-carved granite water fountain and floating flowers',
    description: 'Tranquil internal courtyard centered around a hand-carved multi-tiered stone fountain, creating natural evaporative cooling throughout the living areas.',
    isAiGenerated: true,
    tags: ['Central Courtyards', 'Stone Fountain', 'Evaporative Cooling', 'Courtyard Homes']
  },
  {
    id: 'trad-069',
    title: 'Luxury Kerala Traditional Home with Private Ayurvedic Spa Pavilion',
    category: 'Luxury Traditional Homes',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury Kerala traditional home with detached Ayurvedic spa massage pavilion',
    description: 'Detached wellness pavilion executed in traditional Kerala wooden architecture, fitted with a solid medicinal neem wood Droni massage table and steam chamber.',
    isAiGenerated: true,
    tags: ['Luxury Traditional Homes', 'Ayurvedic Pavilion', 'Neem Wood Droni', 'Kerala Architecture']
  },
  {
    id: 'trad-070',
    title: 'Carved Teakwood Main Entrance Door with Gajalakshmi Header Arch',
    category: 'Traditional Wooden Doors',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional wooden entrance door with Gajalakshmi carved lintel arch and brass studs',
    description: 'Auspicious Gajalakshmi relief carving atop a 4-inch seasoned teak door frame, flanked by dual carved side lites and heavy solid brass bolt hardware.',
    isAiGenerated: true,
    tags: ['Traditional Wooden Doors', 'Gajalakshmi Lintel', 'Teak Door Frame', 'Brass Hardware']
  },
  {
    id: 'trad-071',
    title: 'Kerala Heritage Home with Traditional Padipura Entrance Gatehouse',
    category: 'Kerala Heritage Homes',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala traditional Padipura entrance gatehouse with clay tile roof and wooden door',
    description: 'Classic Kerala Padipura (arched entrance gatehouse) with clay tiled roof, heavy double-leaf teak gates, and built-in stone sitting platforms for visitors.',
    isAiGenerated: true,
    tags: ['Kerala Heritage Homes', 'Padipura Gatehouse', 'Kerala Traditional Architecture', 'Entrance Gate']
  },
  {
    id: 'trad-072',
    title: 'Traditional Kerala Kitchen with Teak Cabinetry & Brass Pot Racks',
    category: 'Traditional Kerala Interiors',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Kerala interior design for kitchen with teak cupboards and brass uruli pots',
    description: 'Factory-crafted moisture-resistant marine ply carcass with solid teak framed shutters, polished brass handles, and heavy-duty quartz countertops.',
    isAiGenerated: true,
    tags: ['Traditional Kerala Interiors', 'Traditional Kitchens', 'Marine Ply', 'Solid Teak Shutters']
  },
  {
    id: 'trad-073',
    title: 'Indian Traditional Heritage Living Room with Carved Wooden Swing & Settees',
    category: 'Heritage Living Rooms',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Heritage living room with central carved swing Jhoola and velvet upholstered settees',
    description: 'Regal living room arranged around a carved Gujarati/South Indian wooden Jhoola swing, surrounded by low diwan seating and brass floor lanterns.',
    isAiGenerated: true,
    tags: ['Heritage Living Rooms', 'Jhoola Swing', 'Diwan Seating', 'Indian Heritage Homes']
  },
  {
    id: 'trad-074',
    title: 'Chettinad Mansion Bedroom with Antique Teak Dressing Table & Belgian Mirror',
    category: 'Chettinad Interiors',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Chettinad traditional bedroom with antique teakwood vanity dressing table and beveled mirror',
    description: 'Handcrafted vanity station with curved cabriole legs, brass drawer pulls, original beveled glass mirror, and lime plaster interior walls.',
    isAiGenerated: true,
    tags: ['Chettinad Interiors', 'Dressing Table', 'Belgian Mirror', 'Traditional Bedrooms']
  },
  {
    id: 'trad-075',
    title: 'Nalukettu Traditional Home with Open Rainwater Courtyard & Granite Steps',
    category: 'Nalukettu Homes',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kerala Nalukettu home central courtyard with single-slab granite steps and timber columns',
    description: 'Four monumental single-piece granite steps descending into the open courtyard, surrounded by eight carved Anjili pillars holding the upper attic gallery.',
    isAiGenerated: true,
    tags: ['Nalukettu Homes', 'Granite Steps', 'Anjili Pillars', 'Courtyard Gallery']
  },
  {
    id: 'trad-076',
    title: 'Traditional Temple-Style Brass Oil Lamp Chandelier (Thookkuvilakku)',
    category: 'Temple-Inspired Interiors',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional Kerala brass hanging lamp Thookkuvilakku in grand foyer entrance',
    description: '6-foot multi-tiered Kerala brass Thookkuvilakku hanging lamp suspended from structural teak rafters, serving as a regal focal point for the main entrance hall.',
    isAiGenerated: true,
    tags: ['Temple-Inspired Interiors', 'Thookkuvilakku', 'Brass Chandelier', 'Heritage Foyer']
  },
  {
    id: 'trad-077',
    title: 'Traditional South Indian Dining Room with Cane-Backed Rosewood Chairs',
    category: 'Traditional Dining Areas',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
    alt: 'South Indian traditional dining room with rosewood dining table and cane-woven chairs',
    description: '12-seater dining setting with hand-rubbed oil finished Indian rosewood table, hand-knotted natural cane backrests, and brass tableware settings.',
    isAiGenerated: true,
    tags: ['Traditional Dining Areas', 'Rosewood Table', 'Cane Backrests', 'Traditional Interiors']
  },
  {
    id: 'trad-078',
    title: 'Kerala Style Courtyard House with Wooden Louvered Screen Wall',
    category: 'Courtyard Homes',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    alt: 'Courtyard home with continuous wooden louvered wall for breeze and privacy',
    description: 'Full-height teakwood louver screen wall dividing the inner private courtyard from the public guest foyer, allowing breeze circulation while blocking outside view.',
    isAiGenerated: true,
    tags: ['Courtyard Homes', 'Louver Screen', 'Teak Louvers', 'Kerala Courtyard House']
  },
  {
    id: 'trad-079',
    title: 'Solid Teak Carved Pooja Door with Brass Bells & Ashtalakshmi Inset',
    category: 'Traditional Pooja Rooms',
    image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=1200&q=80',
    alt: 'Carved teakwood pooja door with brass bell insets and Ashtalakshmi relief panels',
    description: 'Exquisite double-door pooja mandap entrance with eight carved Ashtalakshmi panels, solid cast brass chiming bells, and traditional brass latches.',
    isAiGenerated: true,
    tags: ['Traditional Pooja Rooms', 'Ashtalakshmi', 'Brass Bells', 'Carved Pooja Door']
  },
  {
    id: 'trad-080',
    title: 'Luxury Heritage Villa with Gabled Roofs & Infinity Courtyard Pool',
    category: 'Luxury Traditional Homes',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Luxury heritage villa with traditional Kerala gabled roof design and central pool',
    description: 'Masterpiece luxury traditional home construction marrying authentic South Indian woodwork, red terracotta tile roofs, and modern high-specification interior luxury.',
    isAiGenerated: true,
    tags: ['Luxury Traditional Homes', 'Heritage Villa Design', 'Kerala Style Home Design', 'Traditional Architecture']
  }
];
