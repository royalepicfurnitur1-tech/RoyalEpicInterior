import { slugify, getProductSlug } from '../utils/productSlug';

export const SITE_URL = 'https://royalepicinterior.com';
export const BRAND_NAME = 'Royal Epic Interiors';

export interface ValidationReportItem {
  id: string;
  name: string;
  reason: string;
}

export interface MerchantFeedValidationReport {
  totalProductsFound: number;
  productsIncluded: number;
  productsExcluded: number;
  missingPrice: number;
  nonFixedPrice: number;
  missingImage: number;
  missingDescription: number;
  missingProductUrl: number;
  invalidUrl: number;
  duplicateIds: number;
  duplicateUrls: number;
  invalidData: number;
  excludedProducts: ValidationReportItem[];
  generatedAt: string;
  source: 'supabase';
}

export interface FeedGenerationResult {
  xml: string;
  report: MerchantFeedValidationReport;
}

// Google Product Taxonomy and Breadcrumb Hierarchy Mapping
export const GOOGLE_PRODUCT_CATEGORIES: Record<string, { googleCategory: string; productType: string }> = {
  'Dining Tables': {
    googleCategory: 'Furniture > Tables > Kitchen & Dining Room Tables',
    productType: 'Home & Living > Furniture > Dining Room Furniture > Dining Tables'
  },
  'Wooden Chairs & Dining Furniture': {
    googleCategory: 'Furniture > Chairs > Kitchen & Dining Room Chairs',
    productType: 'Home & Living > Furniture > Dining Room Furniture > Dining Chairs'
  },
  'Sofas': {
    googleCategory: 'Furniture > Sofas',
    productType: 'Home & Living > Furniture > Living Room Furniture > Sofas & Couches'
  },
  'TV Units': {
    googleCategory: 'Furniture > Entertainment Centers & TV Stands',
    productType: 'Home & Living > Furniture > Living Room Furniture > TV Consoles'
  },
  'Sliding Wardrobes': {
    googleCategory: 'Furniture > Armoires & Wardrobes',
    productType: 'Home & Living > Furniture > Bedroom Furniture > Sliding Wardrobes'
  },
  'wall  beds': {
    googleCategory: 'Furniture > Beds & Accessories > Beds & Bed Frames',
    productType: 'Home & Living > Furniture > Bedroom Furniture > Space-Saving Wall Beds'
  },
  'Wall Beds': {
    googleCategory: 'Furniture > Beds & Accessories > Beds & Bed Frames',
    productType: 'Home & Living > Furniture > Bedroom Furniture > Space-Saving Wall Beds'
  },
  'Living Room Luxury': {
    googleCategory: 'Furniture > Living Room Furniture',
    productType: 'Home & Living > Furniture > Living Room Furniture'
  },
  'Commercial Furniture': {
    googleCategory: 'Furniture > Office Furniture',
    productType: 'Office & Commercial > Office Furniture'
  },
  'Kitchen Equipment': {
    googleCategory: 'Business & Industrial > Food Service > Commercial Kitchen Equipment',
    productType: 'Kitchen & Commercial > Kitchen Equipment'
  },
  'Modular Kitchens': {
    googleCategory: 'Home & Garden > Kitchen & Dining',
    productType: 'Home & Living > Modular Kitchens'
  },
  'Doors': {
    googleCategory: 'Hardware > Building Consumables > Building Materials > Doors',
    productType: 'Building Materials > Doors > Entrance & Interior Doors'
  },
  'Main Entrance Doors': {
    googleCategory: 'Hardware > Building Consumables > Building Materials > Doors',
    productType: 'Building Materials > Doors > Main Entrance Doors'
  },
  'WPC Waterproof Doors': {
    googleCategory: 'Hardware > Building Consumables > Building Materials > Doors',
    productType: 'Building Materials > Doors > WPC Waterproof Doors'
  },
  'WPC Bathroom Doors': {
    googleCategory: 'Hardware > Building Consumables > Building Materials > Doors',
    productType: 'Building Materials > Doors > WPC Bathroom Doors'
  },
  'UPVC Windows & Doors': {
    googleCategory: 'Hardware > Building Consumables > Building Materials > Doors',
    productType: 'Building Materials > Doors > UPVC Sliding Doors'
  },
  'Aluminium Doors': {
    googleCategory: 'Hardware > Building Consumables > Building Materials > Doors',
    productType: 'Building Materials > Doors > Aluminium Doors'
  },
  'Door frames': {
    googleCategory: 'Hardware > Building Consumables > Building Materials > Door Frames',
    productType: 'Building Materials > Doors > Solid Wood Door Frames'
  },
  'Materials': {
    googleCategory: 'Hardware > Building Consumables > Building Materials',
    productType: 'Building Materials > Architectural Materials & Panels'
  },
  'Sound Proof and Acoustic materials': {
    googleCategory: 'Hardware > Building Consumables > Building Materials > Wall Panels',
    productType: 'Building Materials > Acoustic Materials & Soundproof Panels'
  },
  'Wall Decor': {
    googleCategory: 'Home & Garden > Decor > Wall Decor',
    productType: 'Home & Living > Decor > Wall Decor'
  }
};

/**
 * Escapes special characters for XML safely.
 * Strips ASCII control characters that are invalid in XML documents.
 */
export function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  const clean = unsafe.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Strips HTML tags and normalizes whitespace for clean XML text nodes.
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch raw products strictly from Supabase `products` table (the ONLY Production Source of Truth).
 * If Supabase is unavailable or fails, an error is thrown to signal a temporary service disruption (HTTP 503),
 * preventing stale or partial feeds from publishing to Google Merchant Center.
 */
async function fetchRawProducts(): Promise<{ rawList: any[]; source: 'supabase' }> {
  const url = 
    process.env.VITE_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    'https://lwrfoztfsyffgtybesia.supabase.co';
  const key = 
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc';

  const cleanUrl = url.replace(/\/+$/, '');
  let res: Response;
  try {
    res = await fetch(`${cleanUrl}/rest/v1/products?category=neq.__SYSTEM__&select=*&order=created_at.desc`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      signal: AbortSignal.timeout(8000)
    });
  } catch (err: any) {
    console.error('[MerchantFeed] Database network/timeout error while querying Supabase products:', err?.message || 'unknown error');
    throw new Error('Database service temporarily unreachable');
  }

  if (!res.ok) {
    console.error(`[MerchantFeed] Supabase products query failed with HTTP status ${res.status}`);
    throw new Error(`Database service responded with status ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    console.error('[MerchantFeed] Empty product dataset returned from Supabase products table');
    throw new Error('No product records retrieved from primary database');
  }

  return { rawList: data, source: 'supabase' };
}

/**
 * Generates the complete, validated Google Merchant Center RSS 2.0 XML feed.
 */
export async function generateMerchantFeedXml(): Promise<FeedGenerationResult> {
  const { rawList, source } = await fetchRawProducts();

  const report: MerchantFeedValidationReport = {
    totalProductsFound: rawList.length,
    productsIncluded: 0,
    productsExcluded: 0,
    missingPrice: 0,
    nonFixedPrice: 0,
    missingImage: 0,
    missingDescription: 0,
    missingProductUrl: 0,
    invalidUrl: 0,
    duplicateIds: 0,
    duplicateUrls: 0,
    invalidData: 0,
    excludedProducts: [],
    generatedAt: new Date().toISOString(),
    source
  };

  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const itemXmlList: string[] = [];

  for (const item of rawList) {
    const rawId = item.id !== undefined && item.id !== null ? String(item.id).trim() : '';
    const rawName = item.name !== undefined && item.name !== null ? sanitizeText(String(item.name)) : '';
    const rawDesc = item.description !== undefined && item.description !== null ? sanitizeText(String(item.description)) : '';
    const rawPrice = item.price !== undefined && item.price !== null ? Number(item.price) : NaN;
    const rawImage = item.image !== undefined && item.image !== null ? String(item.image).trim() : '';
    const category = item.category ? String(item.category).trim() : 'Furniture';

    // 1. Basic ID Check
    if (!rawId || rawId.startsWith('__')) {
      report.invalidData++;
      report.productsExcluded++;
      report.excludedProducts.push({ id: rawId || 'UNKNOWN', name: rawName, reason: 'Invalid or system internal identifier' });
      continue;
    }

    // 2. Duplicate ID Check
    if (seenIds.has(rawId)) {
      report.duplicateIds++;
      report.productsExcluded++;
      report.excludedProducts.push({ id: rawId, name: rawName, reason: `Duplicate product ID (${rawId})` });
      continue;
    }

    // 3. Name / Title Check
    if (!rawName || rawName.length < 3) {
      report.invalidData++;
      report.productsExcluded++;
      report.excludedProducts.push({ id: rawId, name: rawName, reason: 'Missing or invalid product title' });
      continue;
    }

    // 4. Description Check
    if (!rawDesc || rawDesc.length < 10) {
      report.missingDescription++;
      report.productsExcluded++;
      report.excludedProducts.push({ id: rawId, name: rawName, reason: 'Missing or insufficient product description' });
      continue;
    }

    // 5. Fixed Price Validation (Must be genuine fixed price, > 10 INR)
    if (isNaN(rawPrice)) {
      report.missingPrice++;
      report.productsExcluded++;
      report.excludedProducts.push({ id: rawId, name: rawName, reason: 'Missing price value' });
      continue;
    }

    if (rawPrice <= 10) {
      report.nonFixedPrice++;
      report.productsExcluded++;
      report.excludedProducts.push({ 
        id: rawId, 
        name: rawName, 
        reason: `Nominal / test placeholder price (${rawPrice} INR) - below commercial minimum` 
      });
      continue;
    }

    // 6. Image Link Validation
    if (!rawImage || !rawImage.startsWith('https://')) {
      report.missingImage++;
      report.productsExcluded++;
      report.excludedProducts.push({ id: rawId, name: rawName, reason: 'Missing or non-HTTPS product main image' });
      continue;
    }

    // 7. Canonical Product URL Resolution
    const slug = slugify(rawName) || getProductSlug(item);
    if (!slug) {
      report.missingProductUrl++;
      report.productsExcluded++;
      report.excludedProducts.push({ id: rawId, name: rawName, reason: 'Could not generate valid product URL slug' });
      continue;
    }

    const productUrl = `${SITE_URL}/products/${slug}`;
    if (seenUrls.has(productUrl)) {
      report.duplicateUrls++;
      report.productsExcluded++;
      report.excludedProducts.push({ id: rawId, name: rawName, reason: `Duplicate canonical product URL (${productUrl})` });
      continue;
    }

    // Register unique identity
    seenIds.add(rawId);
    seenUrls.add(productUrl);

    // Availability mapping (standard Google Merchant values: in_stock / out_of_stock)
    const availability = item.in_stock !== false ? 'in_stock' : 'out_of_stock';

    // Taxonomy and Product Type
    const taxonomy = GOOGLE_PRODUCT_CATEGORIES[category] || {
      googleCategory: 'Furniture',
      productType: `Home & Living > Furniture > ${category}`
    };

    // Material attribute if available in specifications
    const specs = typeof item.specifications === 'object' && item.specifications !== null ? item.specifications : {};
    const material = specs.material || item.material;

    // Check for SKU / MPN (Never invent GTINs or MPNs)
    const genuineSku = specs.sku || item.sku;

    // Additional Image Links (clean absolute HTTPS URLs)
    const additionalImages: string[] = [];
    if (Array.isArray(item.gallery_images)) {
      for (const img of item.gallery_images) {
        if (typeof img === 'string' && img.startsWith('https://') && img !== rawImage && !additionalImages.includes(img)) {
          additionalImages.push(img);
        }
      }
    } else if (Array.isArray(item.galleryImages)) {
      for (const img of item.galleryImages) {
        if (typeof img === 'string' && img.startsWith('https://') && img !== rawImage && !additionalImages.includes(img)) {
          additionalImages.push(img);
        }
      }
    }

    // Build XML Item
    const itemXmlParts: string[] = [
      '    <item>',
      `      <g:id>${escapeXml(rawId)}</g:id>`,
      `      <g:title>${escapeXml(rawName)}</g:title>`,
      `      <g:description>${escapeXml(rawDesc)}</g:description>`,
      `      <link>${escapeXml(productUrl)}</link>`,
      `      <g:image_link>${escapeXml(rawImage)}</g:image_link>`
    ];

    for (const addImg of additionalImages.slice(0, 10)) {
      itemXmlParts.push(`      <g:additional_image_link>${escapeXml(addImg)}</g:additional_image_link>`);
    }

    itemXmlParts.push(
      `      <g:availability>${availability}</g:availability>`,
      `      <g:price>${Math.round(rawPrice)} INR</g:price>`,
      `      <g:condition>new</g:condition>`,
      `      <g:brand>${escapeXml(BRAND_NAME)}</g:brand>`,
      `      <g:google_product_category>${escapeXml(taxonomy.googleCategory)}</g:google_product_category>`,
      `      <g:product_type>${escapeXml(taxonomy.productType)}</g:product_type>`
    );

    // Google Merchant Center identifier guidelines:
    // For custom architectural handcrafted furniture without manufacturer GTIN/barcodes,
    // explicitly specify <g:identifier_exists>no</g:identifier_exists>.
    itemXmlParts.push('      <g:identifier_exists>no</g:identifier_exists>');

    if (genuineSku && typeof genuineSku === 'string' && genuineSku.trim().length > 0) {
      itemXmlParts.push(`      <g:mpn>${escapeXml(genuineSku.trim())}</g:mpn>`);
    }

    if (material && typeof material === 'string' && material.trim().length > 0) {
      itemXmlParts.push(`      <g:material>${escapeXml(sanitizeText(material))}</g:material>`);
    }

    // Custom labels for Google Ads campaign segmentation
    const categorySlug = item.category_slug || slugify(category);
    if (categorySlug) {
      itemXmlParts.push(`      <g:custom_label_0>${escapeXml(categorySlug)}</g:custom_label_0>`);
    }
    itemXmlParts.push(`      <g:custom_label_1>${availability === 'in_stock' ? 'In Stock' : 'Made to Order'}</g:custom_label_1>`);
    if (item.has_3d_viewer) {
      itemXmlParts.push('      <g:custom_label_2>3D Showcase</g:custom_label_2>');
    } else if (item.is_hot) {
      itemXmlParts.push('      <g:custom_label_2>Hot Selling</g:custom_label_2>');
    }

    itemXmlParts.push('    </item>');
    itemXmlList.push(itemXmlParts.join('\n'));
    report.productsIncluded++;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Royal Epic Interior &amp; Furniture - Product Catalog</title>
    <link>${SITE_URL}</link>
    <description>Luxury handcrafted furniture, solid teak doors, modular kitchens, and custom interior solutions in Bengaluru, India.</description>
${itemXmlList.join('\n')}
  </channel>
</rss>`;

  return { xml, report };
}
