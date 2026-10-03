import path from 'path';
import fs from 'fs';
import { slugify } from '../utils/productSlug';

export const SITE_URL = 'https://royalepicinterior.com';

// In-memory cache for live Supabase products to optimize response times
let cachedProducts: any[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export const getSupabaseConfig = () => {
  const url = 
    process.env.VITE_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    'https://lwrfoztfsyffgtybesia.supabase.co';
  const key = 
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc';
  return { url: url.replace(/\/+$/, ''), key };
};

/**
 * Fetch live products from Supabase with lightweight in-memory caching.
 */
export async function getLiveCatalogProducts(): Promise<any[]> {
  const now = Date.now();
  if (cachedProducts.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedProducts;
  }

  try {
    const { url, key } = getSupabaseConfig();
    const res = await fetch(`${url}/rest/v1/products?category=neq.__SYSTEM__&select=*&order=created_at.desc`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedProducts = data;
        cacheTimestamp = now;
        return cachedProducts;
      }
    }
  } catch (err: any) {
    console.warn('[ProductSSR] Failed to fetch live products from Supabase:', err?.message || err);
  }

  return cachedProducts;
}

/**
 * Find product by slug from the live product list.
 */
export function findProductInCatalog(products: any[], targetSlug: string): any | null {
  if (!targetSlug || !Array.isArray(products)) return null;
  const cleanTarget = targetSlug.toLowerCase().trim().replace(/^\/products\//, '').replace(/\/$/, '');

  for (const p of products) {
    if (!p) continue;
    const nameSlug = slugify(p.name || '');
    if (nameSlug === cleanTarget) return p;

    // Check with category prefix or custom slug
    const customSlug = p.category_slug ? `${p.category_slug}-${nameSlug}` : '';
    if (customSlug && customSlug === cleanTarget) return p;

    // Check direct ID match
    if (String(p.id).toLowerCase() === cleanTarget) return p;
  }

  return null;
}

function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render product-specific HTML with SEO tags, Product JSON-LD, and pre-rendered initial content.
 */
export function injectProductIntoHtml(templateHtml: string, product: any, slug: string): string {
  const name = product.name || 'Bespoke Luxury Furniture';
  const cleanName = escapeHtml(name);
  const rawDesc = (product.description || 'Handcrafted luxury architectural furniture and turnkey interior design by Royal Epic Interior Bengaluru.')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cleanDesc = escapeHtml(rawDesc.slice(0, 250));
  const fullDesc = escapeHtml(rawDesc);
  const price = Math.round(Number(product.price) || 0);
  const formattedPrice = `₹${price.toLocaleString('en-IN')}`;
  const image = product.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
  const canonicalUrl = `${SITE_URL}/products/${slug}`;
  const isAvailable = product.in_stock !== false;
  const availabilitySchema = isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const sku = (typeof product.specifications === 'object' && product.specifications?.sku) || product.sku || `RE-SKU-${product.id}`;

  let html = templateHtml;

  // 1. Replace <title>
  const titleTag = `<title>${cleanName} | Royal Epic Interior &amp; Furniture Bengaluru</title>`;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, titleTag);

  // 2. Replace Canonical URL (Ensure it points to the product URL, NOT homepage)
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(/<link rel="canonical"[\s\S]*?\/>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  // 3. Inject Open Graph, Twitter & Product Meta Tags
  const productMetaTags = `
    <!-- Product Specific SEO & Social Tags -->
    <meta name="description" content="${cleanDesc}" />
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${cleanName} | Royal Epic Interior" />
    <meta property="og:description" content="${cleanDesc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="product:price:amount" content="${price}" />
    <meta property="product:price:currency" content="INR" />
    <meta property="product:availability" content="${isAvailable ? 'in stock' : 'out of stock'}" />
    <meta name="twitter:title" content="${cleanName}" />
    <meta name="twitter:description" content="${cleanDesc}" />
    <meta name="twitter:image" content="${image}" />
  `;
  html = html.replace('</head>', `${productMetaTags}\n  </head>`);

  // 4. Inject Schema.org Product JSON-LD
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': name,
    'image': [image],
    'description': rawDesc,
    'sku': sku,
    'brand': {
      '@type': 'Brand',
      'name': 'Royal Epic Interiors'
    },
    'offers': {
      '@type': 'Offer',
      'url': canonicalUrl,
      'priceCurrency': 'INR',
      'price': price,
      'availability': availabilitySchema,
      'itemCondition': 'https://schema.org/NewCondition'
    }
  };

  const jsonLdScript = `\n    <!-- Schema.org Product Structured Data for Google Merchant Center -->\n    <script type="application/ld+json">\n${JSON.stringify(productJsonLd, null, 2)}\n    </script>\n  `;
  html = html.replace('</head>', `${jsonLdScript}</head>`);

  // 5. Inject window.__INITIAL_PRODUCT__ for instant client hydration without 404 flash
  const initialProductScript = `<script>window.__INITIAL_PRODUCT__ = ${JSON.stringify(product)};</script>`;
  html = html.replace('</head>', `  ${initialProductScript}\n  </head>`);

  // 6. Pre-render semantic product HTML inside <div id="root">
  const preRenderedContent = `
    <div id="root">
      <main class="min-h-screen bg-white text-neutral-900" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Breadcrumbs -->
        <nav style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 12px 24px; font-size: 13px; color: #6b7280;">
          <div style="max-width: 1280px; margin: 0 auto; display: flex; gap: 8px; align-items: center;">
            <a href="/" style="color: #4b5563; text-decoration: none;">Home</a> &gt; 
            <a href="/products" style="color: #4b5563; text-decoration: none;">Products</a> &gt; 
            <span style="color: #111827; font-weight: 600;">${cleanName}</span>
          </div>
        </nav>

        <!-- Product Presentation -->
        <div style="max-width: 1280px; margin: 0 auto; padding: 32px 24px;">
          <div style="display: flex; gap: 40px; flex-wrap: wrap;">
            <!-- Main Product Image -->
            <div style="flex: 1 1 500px; max-width: 600px;">
              <img 
                src="${image}" 
                alt="${cleanName}" 
                style="width: 100%; height: auto; border-radius: 16px; object-fit: cover; box-shadow: 0 4px 20px rgba(0,0,0,0.08);"
              />
            </div>

            <!-- Product Summary Details -->
            <div style="flex: 1 1 400px; display: flex; flex-direction: column;">
              <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #b45309; margin-bottom: 8px;">
                ${escapeHtml(product.category || 'Luxury Furniture')}
              </span>
              <h1 style="font-size: 32px; font-weight: 700; color: #111827; margin: 0 0 16px 0; line-height: 1.2;">
                ${cleanName}
              </h1>

              <!-- Price & Availability Block -->
              <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
                <div style="font-size: 28px; font-weight: 700; color: #b45309;">
                  ${formattedPrice} <span style="font-size: 16px; font-weight: normal; color: #6b7280;">INR</span>
                </div>
                <div style="margin-top: 8px; font-size: 14px; font-weight: 600; color: ${isAvailable ? '#15803d' : '#b91c1c'};">
                  ● ${isAvailable ? 'In Stock — Available for Dispatch & Installation' : 'Made to Order'}
                </div>
              </div>

              <!-- Product Description -->
              <div style="margin-bottom: 24px;">
                <h2 style="font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 8px;">Product Overview</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0;">
                  ${fullDesc}
                </p>
              </div>

              <!-- Key Specifications -->
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; font-size: 13px; color: #4b5563; line-height: 1.8;">
                <p style="margin: 0;"><strong>Brand:</strong> Royal Epic Interiors</p>
                <p style="margin: 0;"><strong>SKU:</strong> ${escapeHtml(sku)}</p>
                <p style="margin: 0;"><strong>Condition:</strong> Brand New (Factory Manufactured)</p>
                <p style="margin: 0;"><strong>Warranty:</strong> 10-Year Factory Guarantee on Solid Wood &amp; Hardware</p>
                <p style="margin: 0;"><strong>Delivery:</strong> Pan-India White-Glove Surface Logistics</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  html = html.replace('<div id="root"></div>', preRenderedContent);

  return html;
}

/**
 * Render policy-specific HTML with SEO tags and pre-rendered initial content.
 */
export function injectPolicyIntoHtml(templateHtml: string, policyType: 'privacy' | 'terms' | 'shipping' | 'refund', pathName: string): string {
  const titles = {
    privacy: 'Privacy Policy | Royal Epic Interior & Furniture Bengaluru',
    terms: 'Terms & Conditions | Royal Epic Interior & Furniture Bengaluru',
    shipping: 'Shipping & Delivery Policy | Royal Epic Interior & Furniture Bengaluru',
    refund: 'Refund & Return Policy | Royal Epic Interior & Furniture Bengaluru'
  };

  const descriptions = {
    privacy: 'Learn how Royal Epic Interior protects customer data, order details, and privacy for all purchases and interior design consultations.',
    terms: 'Terms and conditions governing orders, bespoke furniture craftsmanship, warranty coverage, and services at Royal Epic Interior.',
    shipping: 'Transparent delivery rates, shipping zones, white-glove setup, and transit timelines for Royal Epic furniture orders across India.',
    refund: 'Clear 7-day return policy, transit replacement guarantee, and refund procedures for Royal Epic Interior catalog products.'
  };

  const canonicalUrl = `${SITE_URL}${pathName}`;
  const title = titles[policyType] || titles.privacy;
  const desc = descriptions[policyType] || descriptions.privacy;

  let html = templateHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);

  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(/<link rel="canonical"[\s\S]*?\/>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  const metaTags = `
    <meta name="description" content="${desc}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:url" content="${canonicalUrl}" />
  `;
  html = html.replace('</head>', `${metaTags}\n  </head>`);

  return html;
}
