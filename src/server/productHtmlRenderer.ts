import path from 'path';
import fs from 'fs';
import { slugify } from '../utils/productSlug';
import { PRODUCTS_DATA } from '../data/mockData';

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
 * Falls back to PRODUCTS_DATA if Supabase is temporarily unreachable.
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

  // Safe fallback to default catalog to ensure SSR & sitemap never return empty lists
  return cachedProducts.length > 0 ? cachedProducts : PRODUCTS_DATA;
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
  const priceType = product.price_type || product.priceType || (typeof product.specifications === 'object' && (product.specifications?.priceType || product.specifications?.price_type)) || 'fixed';
  const formattedPrice = priceType === 'per_sq_ft' ? `₹${price.toLocaleString('en-IN')} / sq. ft.` : `₹${price.toLocaleString('en-IN')}`;
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
                <p style="margin: 0;"><strong>Warranty:</strong> 15-Year Warranty on Solid Wood &amp; Hardware</p>
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

  const policyData: Record<'privacy' | 'terms' | 'shipping' | 'refund', {
    title: string;
    badge: string;
    sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>;
  }> = {
    privacy: {
      title: 'Privacy Policy',
      badge: 'Customer Data Protection & Confidentiality',
      sections: [
        {
          heading: '1. Commitment to Privacy',
          paragraphs: [
            'Royal Epic Interior & Furniture Ltd. ("Royal Epic", "we", "us", or "our") operates https://royalepicinterior.com. We are committed to protecting the personal information and privacy of our customers, clients, and website visitors.',
            'This Privacy Policy outlines how we collect, use, store, and safeguard your data when you browse our catalog, make an online purchase, request an interior consultation, or interact with our services.'
          ]
        },
        {
          heading: '2. Information We Collect',
          paragraphs: [
            'We collect information only when necessary to provide our bespoke furniture manufacturing, delivery, installation, and architectural interior services:'
          ],
          bullets: [
            'Contact Information: Name, delivery address, billing address, phone number, and email address.',
            'Order & Transaction Records: Products purchased, variations selected, order value, payment status, and delivery instructions. Note: We do NOT store credit/debit card numbers or UPI PINs; all payments are processed securely via RBI-licensed payment gateways (such as Razorpay).',
            'Consultation Details: Site blueprints, room measurements, style preferences, and project budget.',
            'Technical Information: IP address, browser type, device information, and anonymous usage statistics to optimize site performance.'
          ]
        },
        {
          heading: '3. How We Use Your Information',
          paragraphs: [
            'Your personal data is strictly utilized for legitimate business operations:'
          ],
          bullets: [
            'Fulfilling furniture orders, processing payments, arranging factory dispatch, and coordinating installation.',
            'Sending transactional notifications, tax invoices, order tracking updates, and warranty certificates.',
            'Responding to consultation enquiries, customer service requests, and website feedback.',
            'Preventing fraudulent transactions and ensuring compliance with applicable Indian commercial laws.'
          ]
        },
        {
          heading: '4. Data Sharing & Third Parties',
          paragraphs: [
            'Royal Epic Interior does NOT sell, rent, trade, or monetize your personal information to third parties. We share data strictly with trusted service partners on a need-to-know basis:',
            'Delivery Partners: Transport providers (e.g., direct company fleet, Blue Dart, SafeExpress) receive your delivery address and phone number solely for delivery fulfillment.',
            'Payment Gateway: Encrypted transaction requests sent to Razorpay for secure checkout verification.',
            'Legal Compliance: Information disclosed only when required by law, subpoena, or lawful government directive.'
          ]
        },
        {
          heading: '5. Data Security & Retention',
          paragraphs: [
            'All communication between your browser and royalepicinterior.com is encrypted using 256-bit Secure Socket Layer (SSL/TLS). Customer records are stored in secure databases with role-based access control.',
            'We retain personal records for as long as necessary to maintain factory warranty coverage, process returns, and comply with statutory tax and accounting retention requirements.'
          ]
        },
        {
          heading: '6. Your Rights & Contact Information',
          paragraphs: [
            'You have the right to review, update, or request the deletion of your personal contact records at any time. For privacy inquiries, please contact our Data Protection Officer at enquiry@royalepicinterior.com or call +91 70261 19311.'
          ]
        }
      ]
    },
    terms: {
      title: 'Terms & Conditions',
      badge: 'User Agreement & Commercial Terms',
      sections: [
        {
          heading: '1. Agreement to Terms',
          paragraphs: [
            'By accessing or using https://royalepicinterior.com, placing an order, or commissioning an interior turnkey project, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use the website.',
            'These terms apply to all visitors, registered users, and commercial clients of Royal Epic Interior & Furniture Ltd.'
          ]
        },
        {
          heading: '2. Product Specifications & Custom Craftsmanship',
          paragraphs: [
            'Royal Epic manufactures luxury furniture, doors, modular kitchens, and architectural woodwork. Because our items utilize authentic natural materials—including natural Italian marble, granite, onyx, solid Burma teak, and natural wood veneers—minor variations in grain texture, natural veining, and organic color shading are inherent characteristics of luxury craftsmanship and are not considered manufacturing defects.',
            'Digital representations, 3D showcases, and catalog photographs are calibrated to represent materials accurately, but slight visual variances may occur depending on screen display settings.'
          ]
        },
        {
          heading: '3. Pricing, GST & Payment Terms',
          paragraphs: [
            'All prices are listed in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST) unless explicitly noted otherwise.',
            'We accept online payments via Credit/Debit Cards, UPI, Net Banking, and Bank Transfer via our certified payment partner Razorpay.',
            'Prices are subject to revision without prior notice, but any confirmed order with completed payment or formal advance deposit will be honored at the contracted rate.'
          ]
        },
        {
          heading: '4. Turnkey Consultations & Site Measurements',
          paragraphs: [
            'For bespoke built-in units (such as modular kitchens and sliding wardrobes), factory manufacturing begins strictly after formal site measurement verification by our technical engineers and customer sign-off on 2D/3D layout drawings.'
          ]
        },
        {
          heading: '5. Factory Warranty & Guarantee',
          paragraphs: [
            'Royal Epic provides a 15-Year Warranty covering structural wood integrity, anti-termite treatment, and mechanical hardware (such as soft-close drawer slides and hydraulic hinges) under normal residential use.',
            'Warranties do not cover damage caused by unauthorized dismantling, external water flooding, fire, chemical corrosion, or deliberate misuse.'
          ]
        },
        {
          heading: '6. Jurisdiction & Dispute Resolution',
          paragraphs: [
            'These Terms are governed by the laws of the Republic of India. Any legal dispute arising in connection with orders or services shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.'
          ]
        }
      ]
    },
    shipping: {
      title: 'Shipping & Delivery Policy',
      badge: 'Logistics, Transit & White-Glove Setup',
      sections: [
        {
          heading: '1. Delivery Coverage',
          paragraphs: [
            'Royal Epic Interior & Furniture delivers across all pin codes in Bengaluru and Karnataka via our dedicated company logistics fleet, and delivers nationwide across India in partnership with specialized surface freight logistics carriers (such as Blue Dart, SafeExpress, and V-Trans).'
          ]
        },
        {
          heading: '2. Shipping Rates & White-Glove Setup',
          paragraphs: [
            'We believe in transparent, upfront delivery pricing without hidden surcharges:'
          ],
          bullets: [
            'Bengaluru Urban & Rural: FREE Standard Delivery on orders above ₹10,000. Orders under ₹10,000 carry a nominal flat delivery charge of ₹499.',
            'Karnataka State: Standard surface freight calculated transparently at checkout based on package weight and pin code.',
            'Rest of India: Real-time courier rates calculated at checkout. White-glove crating and bubble-wrap edge protection are included at no additional cost.'
          ]
        },
        {
          heading: '3. Processing & Delivery Timelines',
          paragraphs: [
            'Delivery timelines vary depending on whether the item is in-stock or custom-manufactured:'
          ],
          bullets: [
            'In-Stock Catalog Items (Chairs, Accent Tables, Pre-finished Panels): Dispatched within 24-48 hours. Delivery takes 2-5 business days within South India, and 5-8 business days for other states.',
            'Custom Handcrafted Furniture (Onyx Marble Dining Tables, Sofas, Wall Beds): Built to order in our Thanisandra factory. Production takes 10-18 business days, followed by 3-5 days transit.',
            'Modular Kitchens & Full Wardrobes: Manufacturing and site assembly scheduled according to the contracted project milestone timeline (typically 2-4 weeks).'
          ]
        },
        {
          heading: '4. White-Glove Delivery & Installation',
          paragraphs: [
            'For orders within Bengaluru and surrounding districts, our specialized delivery team brings the furniture into your room of choice, uncrates the protective wrapping, and completes professional assembly and leveling at no extra cost.'
          ]
        },
        {
          heading: '5. Order Tracking & Transit Insurance',
          paragraphs: [
            'Once your order leaves our Rachenahalli factory, you will receive an SMS and email notification with your tracking number and logistics link. You can track your shipment live at any time at https://royalepicinterior.com/track-order.',
            'Every shipment is 100% insured against transit damage. If damage occurs, contact our support team at +91 70261 19311 within 48 hours for immediate replacement.'
          ]
        }
      ]
    },
    refund: {
      title: 'Refund & Return Policy',
      badge: 'Customer Satisfaction Guarantee',
      sections: [
        {
          heading: '1. 7-Day Return Window for Catalog Products',
          paragraphs: [
            'We want you to be completely satisfied with your Royal Epic purchase. For standard catalog furniture items (including dining chairs, center tables, wall decor, and pre-packaged accessories), we offer a 7-day return and exchange policy from the date of confirmed delivery.',
            'To be eligible for a return, the item must be unused, in its original condition, with all factory labels, accessories, and protective packaging intact.'
          ]
        },
        {
          heading: '2. Damaged, Defective or Incorrect Items (Immediate Replacement)',
          paragraphs: [
            'Quality is the hallmark of our factory. If you receive an item that is damaged during transit, defective in workmanship, or incorrect compared to your order confirmation:'
          ],
          bullets: [
            'Notify us within 48 hours of delivery by calling +91 70261 19311 or emailing enquiry@royalepicinterior.com with clear photos of the issue.',
            'We will arrange a priority free pickup and dispatch a brand-new factory replacement at zero additional expense to you.',
            'If a replacement is not available or desired, you will receive a 100% full refund including any delivery charges paid.'
          ]
        },
        {
          heading: '3. Custom & Bespoke Orders Policy',
          paragraphs: [
            'For custom-made architectural elements, personalized dining tables with custom-cut marble, bespoke modular kitchens, and custom-upholstered sofas manufactured to non-standard customer dimensions:',
            'Because these items are manufactured to your unique specifications, returns based solely on change of mind are not accepted after factory fabrication has commenced.',
            'However, our 15-Year Warranty applies in full: any structural defect, hardware malfunction, or transit damage is repaired or replaced free of charge.'
          ]
        },
        {
          heading: '4. How to Initiate a Return',
          paragraphs: [
            'Initiating a return is simple and straightforward:'
          ],
          bullets: [
            'Step 1: Contact our support team via email (enquiry@royalepicinterior.com) or WhatsApp/Phone (+91 70261 19311) with your Order ID and reason for return.',
            'Step 2: Our logistics team will schedule a doorstep inspection and pickup from your delivery address.',
            'Step 3: Once inspected at our factory warehouse, your refund will be processed immediately.'
          ]
        },
        {
          heading: '5. Refund Method & Processing Timelines',
          paragraphs: [
            'Approved refunds are credited directly to the original payment method used during checkout (Credit/Debit Card, Net Banking, or UPI).',
            'Refunds are initiated within 2 business days of warehouse receipt. Depending on your issuing bank, the credit will reflect in your account within 5 to 7 business days.',
            'For payments made via Direct Bank Transfer or Cash on Delivery, refunds are remitted via IMPS/NEFT to the customer’s verified bank account.'
          ]
        }
      ]
    }
  };

  const canonicalUrl = `${SITE_URL}${pathName}`;
  const title = titles[policyType] || titles.privacy;
  const desc = descriptions[policyType] || descriptions.privacy;
  const policy = policyData[policyType] || policyData.privacy;

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

  // Pre-render semantic Policy HTML inside <div id="root">
  const sectionsHtml = policy.sections.map(sec => `
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 10px 0;">${escapeHtml(sec.heading)}</h2>
      ${sec.paragraphs.map(p => `<p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 10px 0;">${escapeHtml(p)}</p>`).join('')}
      ${sec.bullets ? `<ul style="margin: 8px 0 16px 20px; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">${sec.bullets.map(b => `<li style="margin-bottom: 6px;">${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const preRenderedPolicy = `
    <div id="root">
      <main style="min-height: 100vh; background-color: #ffffff; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Breadcrumbs -->
        <nav style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 12px 24px; font-size: 13px; color: #6b7280;">
          <div style="max-width: 900px; margin: 0 auto; display: flex; gap: 8px; align-items: center;">
            <a href="/" style="color: #4b5563; text-decoration: none;">Home</a> &gt; 
            <a href="/products" style="color: #4b5563; text-decoration: none;">Store</a> &gt; 
            <span style="color: #111827; font-weight: 600;">${escapeHtml(policy.title)}</span>
          </div>
        </nav>

        <!-- Policy Header -->
        <div style="max-width: 900px; margin: 0 auto; padding: 36px 24px 20px;">
          <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #b45309; display: block; margin-bottom: 8px;">
            ${escapeHtml(policy.badge)}
          </span>
          <h1 style="font-size: 32px; font-weight: 800; color: #111827; margin: 0 0 8px 0;">${escapeHtml(policy.title)}</h1>
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px 0;">Last Updated: October 2026 • Royal Epic Interior &amp; Furniture Bengaluru</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-bottom: 32px;" />

          <!-- Policy Body -->
          ${sectionsHtml}

          <!-- Business Contact Information -->
          <div style="margin-top: 40px; padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 14px; color: #374151; line-height: 1.8;">
            <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">Official Business Information</h3>
            <p style="margin: 0;"><strong>Company:</strong> Royal Epic Commercial &amp; Home Interiors</p>
            <p style="margin: 0;"><strong>Factory &amp; Studio Address:</strong> No. 10, Royal EPIC Interiors, 2nd, Thanisandra Main Road, Near Railway Bridge, Sinthan Nagar, Rachenahalli, Nagawara, Bengaluru, Karnataka 560045</p>
            <p style="margin: 0;"><strong>Official Phone:</strong> +91 70261 19311</p>
            <p style="margin: 0;"><strong>Email Support:</strong> enquiry@royalepicinterior.com</p>
          </div>

          <!-- Footer Navigation Links -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 20px; font-size: 13px; flex-wrap: wrap;">
            <a href="/privacy-policy" style="color: #4b5563; text-decoration: underline;">Privacy Policy</a>
            <a href="/terms-and-conditions" style="color: #4b5563; text-decoration: underline;">Terms &amp; Conditions</a>
            <a href="/shipping-policy" style="color: #4b5563; text-decoration: underline;">Shipping Policy</a>
            <a href="/refund-policy" style="color: #4b5563; text-decoration: underline;">Refund &amp; Return Policy</a>
            <a href="/products" style="color: #b45309; text-decoration: underline;">Browse Product Catalog</a>
          </div>
        </div>
      </main>
    </div>
  `;

  html = html.replace('<div id="root"></div>', preRenderedPolicy);

  return html;
}

/**
 * Render basic initial HTML for the homepage (/) to ensure non-JS crawlers see genuine business content.
 */
export function injectHomepageIntoHtml(templateHtml: string, products: any[]): string {
  const featured = Array.isArray(products) ? products.slice(0, 8) : [];

  const featuredHtml = featured.map(p => {
    const slug = slugify(p.name || '') || String(p.id);
    const price = Math.round(Number(p.price) || 0);
    const priceType = p.price_type || p.priceType || (typeof p.specifications === 'object' && (p.specifications?.priceType || p.specifications?.price_type)) || 'fixed';
    const priceDisplay = priceType === 'per_sq_ft' ? `₹${price.toLocaleString('en-IN')} / sq. ft.` : `₹${price.toLocaleString('en-IN')}`;
    const img = p.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column;">
        <a href="/products/${slug}" style="text-decoration: none; color: inherit;">
          <img src="${img}" alt="${escapeHtml(p.name)}" style="width: 100%; height: 200px; object-fit: cover;" loading="lazy" />
          <div style="padding: 16px;">
            <span style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase;">${escapeHtml(p.category || 'Luxury Furniture')}</span>
            <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 4px 0 8px 0; line-height: 1.3;">${escapeHtml(p.name)}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
              <span style="font-size: 16px; font-weight: 700; color: #b45309;">${priceDisplay} INR</span>
              <span style="font-size: 12px; color: #15803d; font-weight: 600;">● In Stock</span>
            </div>
          </div>
        </a>
      </div>
    `;
  }).join('');

  const preRenderedHome = `
    <div id="root">
      <main style="min-height: 100vh; background-color: #ffffff; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Top Announcement & Header -->
        <header style="border-bottom: 1px solid #e5e7eb; padding: 16px 24px; background: #ffffff;">
          <div style="max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <a href="/" style="text-decoration: none; font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.02em;">
                ROYAL EPIC <span style="color: #b45309; font-weight: 400;">INTERIOR &amp; FURNITURE</span>
              </a>
              <p style="font-size: 12px; color: #6b7280; margin: 2px 0 0 0;">Luxury Turnkey Interiors &amp; Bespoke Furniture Factory Bengaluru</p>
            </div>
            <nav style="display: flex; gap: 20px; font-size: 14px; font-weight: 500;">
              <a href="/" style="color: #111827; text-decoration: none; font-weight: 700;">Home</a>
              <a href="/products" style="color: #4b5563; text-decoration: none;">Products</a>
              <a href="/our-services" style="color: #4b5563; text-decoration: none;">Services</a>
              <a href="/portfolio" style="color: #4b5563; text-decoration: none;">Portfolio</a>
              <a href="/about-us" style="color: #4b5563; text-decoration: none;">About</a>
              <a href="/contact-us" style="color: #4b5563; text-decoration: none;">Contact</a>
            </nav>
          </div>
        </header>

        <!-- Hero Section -->
        <section style="background: #0f0d0b; color: #ffffff; border-bottom: 1px solid #27221d; padding: 56px 24px;">
          <div style="max-width: 1280px; margin: 0 auto;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em; color: #d4af37; display: block; margin-bottom: 12px;">
              PREMIUM INTERIORS &amp; FURNITURE
            </span>
            <h1 style="font-size: 42px; font-weight: 500; font-style: italic; font-family: 'Playfair Display', Georgia, serif; color: #ffffff; margin: 0 0 16px 0; line-height: 1.15;">
              Designing Elegant Spaces for Modern Living
            </h1>
            <p style="font-size: 18px; line-height: 1.6; color: #d1d5db; max-width: 800px; margin: 0 0 24px 0;">
              Bespoke Furniture, Doors &amp; Complete Interior Solutions for Homes and Businesses.
            </p>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <a href="/products" style="background: linear-gradient(to right, #c29645, #9e732e); color: #ffffff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">
                Get Callback &bull; Free Consultation
              </a>
              <a href="/contact-us" style="background: #1f1b18; color: #ffffff; border: 1px solid #443c34; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">
                Consult an Architect (+91 70261 19311)
              </a>
            </div>
          </div>
        </section>

        <!-- Core Categories Navigation -->
        <section style="padding: 40px 24px; background: #ffffff;">
          <div style="max-width: 1280px; margin: 0 auto;">
            <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 20px 0;">Product Categories</h2>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px;">
              <a href="/products/dining-tables" style="padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 13px; color: #374151; text-decoration: none; background: #f9fafb;">Dining Tables</a>
              <a href="/products/modular-kitchens" style="padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 13px; color: #374151; text-decoration: none; background: #f9fafb;">Modular Kitchens</a>
              <a href="/products/sliding-wardrobes" style="padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 13px; color: #374151; text-decoration: none; background: #f9fafb;">Sliding Wardrobes</a>
              <a href="/products/sofas" style="padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 13px; color: #374151; text-decoration: none; background: #f9fafb;">Sofas &amp; Couches</a>
              <a href="/products/tv-units" style="padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 13px; color: #374151; text-decoration: none; background: #f9fafb;">TV Entertainment Units</a>
              <a href="/products/main-entrance-doors" style="padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 13px; color: #374151; text-decoration: none; background: #f9fafb;">Main Entrance Doors</a>
              <a href="/products/wpc-bathroom-doors" style="padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 13px; color: #374151; text-decoration: none; background: #f9fafb;">WPC Waterproof Doors</a>
              <a href="/products/commercial-furniture" style="padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 13px; color: #374151; text-decoration: none; background: #f9fafb;">Commercial &amp; Office Furniture</a>
            </div>

            <!-- Featured Products Grid -->
            <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 20px 0;">Featured Handcrafted Furniture</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px;">
              ${featuredHtml}
            </div>
          </div>
        </section>

        <!-- Business Identity & Trust Footer -->
        <footer style="background: #111827; color: #9ca3af; padding: 48px 24px 24px; border-top: 1px solid #1f2937;">
          <div style="max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 32px; font-size: 13px;">
            <div>
              <h4 style="color: #ffffff; font-size: 15px; margin: 0 0 12px 0;">Royal Epic Commercial &amp; Home Interiors</h4>
              <p style="line-height: 1.6; margin: 0 0 8px 0;">Factory &amp; Studio: No. 10, Royal EPIC Interiors, 2nd, Thanisandra Main Road, Near Railway Bridge, Sinthan Nagar, Rachenahalli, Nagawara, Bengaluru, Karnataka 560045</p>
              <p style="margin: 0 0 4px 0;">Phone: <strong style="color: #ffffff;">+91 70261 19311</strong></p>
              <p style="margin: 0;">Email: <strong style="color: #ffffff;">enquiry@royalepicinterior.com</strong></p>
            </div>
            <div>
              <h4 style="color: #ffffff; font-size: 15px; margin: 0 0 12px 0;">Customer Legal &amp; Policies</h4>
              <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
                <li><a href="/privacy-policy" style="color: #9ca3af; text-decoration: none;">Privacy Policy</a></li>
                <li><a href="/terms-and-conditions" style="color: #9ca3af; text-decoration: none;">Terms &amp; Conditions</a></li>
                <li><a href="/shipping-policy" style="color: #9ca3af; text-decoration: none;">Shipping &amp; Delivery Policy</a></li>
                <li><a href="/refund-policy" style="color: #9ca3af; text-decoration: none;">Refund &amp; Return Policy</a></li>
                <li><a href="/track-order" style="color: #9ca3af; text-decoration: none;">Live Order Tracking</a></li>
              </ul>
            </div>
            <div>
              <h4 style="color: #ffffff; font-size: 15px; margin: 0 0 12px 0;">Factory Guarantees</h4>
              <p style="line-height: 1.6; margin: 0 0 8px 0;">● 15-Year Warranty on Solid Wood &amp; Hardware</p>
              <p style="line-height: 1.6; margin: 0 0 8px 0;">● Free White-Glove Installation Across Bengaluru</p>
              <p style="line-height: 1.6; margin: 0;">● Safe Transit Insurance on All Pan-India Freight</p>
            </div>
          </div>
          <div style="max-width: 1280px; margin: 32px auto 0; padding-top: 24px; border-top: 1px solid #1f2937; text-align: center; font-size: 12px;">
            &copy; 2026 Royal Epic Interior &amp; Furniture Ltd. All rights reserved. Registered in Bengaluru, India.
          </div>
        </footer>
      </main>
    </div>
  `;

  return templateHtml.replace('<div id="root"></div>', preRenderedHome);
}

/**
 * Render basic initial HTML for the catalog index (/products) with exact canonical tag.
 */
export function injectCatalogIntoHtml(templateHtml: string, products: any[]): string {
  const catalogCanonical = `${SITE_URL}/products`;
  const catalogTitle = 'Product Catalog | Luxury Handcrafted Furniture &amp; Architectural Doors | Royal Epic Interior Bengaluru';
  const catalogDesc = 'Explore Royal Epic Interior\'s handcrafted furniture catalog in Bengaluru. Factory-direct dining tables, modular kitchens, sliding wardrobes, sofas, and WPC waterproof doors.';

  let html = templateHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${catalogTitle}</title>`);

  const canonicalTag = `<link rel="canonical" href="${catalogCanonical}" />`;
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(/<link rel="canonical"[\s\S]*?\/>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  const metaTags = `
    <meta name="description" content="${catalogDesc}" />
    <meta property="og:title" content="${catalogTitle}" />
    <meta property="og:description" content="${catalogDesc}" />
    <meta property="og:url" content="${catalogCanonical}" />
  `;
  html = html.replace('</head>', `${metaTags}\n  </head>`);

  const productCards = Array.isArray(products) ? products.slice(0, 36).map(p => {
    const slug = slugify(p.name || '') || String(p.id);
    const price = Math.round(Number(p.price) || 0);
    const priceType = p.price_type || p.priceType || (typeof p.specifications === 'object' && (p.specifications?.priceType || p.specifications?.price_type)) || 'fixed';
    const priceDisplay = priceType === 'per_sq_ft' ? `₹${price.toLocaleString('en-IN')} / sq. ft.` : `₹${price.toLocaleString('en-IN')}`;
    const img = p.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column;">
        <a href="/products/${slug}" style="text-decoration: none; color: inherit;">
          <img src="${img}" alt="${escapeHtml(p.name)}" style="width: 100%; height: 220px; object-fit: cover;" loading="lazy" />
          <div style="padding: 16px;">
            <span style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase;">${escapeHtml(p.category || 'Luxury Furniture')}</span>
            <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 4px 0 8px 0; line-height: 1.3;">${escapeHtml(p.name)}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
              <span style="font-size: 16px; font-weight: 700; color: #b45309;">${priceDisplay} INR</span>
              <span style="font-size: 12px; color: #15803d; font-weight: 600;">● In Stock</span>
            </div>
          </div>
        </a>
      </div>
    `;
  }).join('') : '';

  const preRenderedCatalog = `
    <div id="root">
      <main style="min-height: 100vh; background-color: #ffffff; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Breadcrumbs -->
        <nav style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 12px 24px; font-size: 13px; color: #6b7280;">
          <div style="max-width: 1280px; margin: 0 auto; display: flex; gap: 8px; align-items: center;">
            <a href="/" style="color: #4b5563; text-decoration: none;">Home</a> &gt; 
            <span style="color: #111827; font-weight: 600;">Products</span>
          </div>
        </nav>

        <!-- Catalog Header -->
        <div style="max-width: 1280px; margin: 0 auto; padding: 36px 24px 20px;">
          <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #b45309; display: block; margin-bottom: 8px;">
            Live Production Catalog • 85+ Architectural Products
          </span>
          <h1 style="font-size: 32px; font-weight: 800; color: #111827; margin: 0 0 12px 0;">
            Luxury Handcrafted Furniture &amp; Architectural Woodwork Catalog
          </h1>
          <p style="font-size: 15px; line-height: 1.6; color: #4b5563; max-width: 800px; margin: 0 0 28px 0;">
            Browse our complete collection of bespoke dining tables, designer sofas, modular sliding wardrobes, TV entertainment consoles, acoustic panels, and solid WPC waterproof doors manufactured in Bengaluru. All products are backed by our 15-Year Warranty.
          </p>

          <!-- Category Filter Quick Links -->
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
            <a href="/products" style="padding: 6px 14px; border: 1px solid #b45309; background: #b45309; color: #ffffff; border-radius: 20px; font-size: 12px; font-weight: 600; text-decoration: none;">All Products</a>
            <a href="/products/dining-tables" style="padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 12px; color: #374151; text-decoration: none; background: #f9fafb;">Dining Tables</a>
            <a href="/products/modular-kitchens" style="padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 12px; color: #374151; text-decoration: none; background: #f9fafb;">Modular Kitchens</a>
            <a href="/products/sliding-wardrobes" style="padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 12px; color: #374151; text-decoration: none; background: #f9fafb;">Sliding Wardrobes</a>
            <a href="/products/sofas" style="padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 12px; color: #374151; text-decoration: none; background: #f9fafb;">Sofas</a>
            <a href="/products/tv-units" style="padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 12px; color: #374151; text-decoration: none; background: #f9fafb;">TV Units</a>
            <a href="/products/main-entrance-doors" style="padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 12px; color: #374151; text-decoration: none; background: #f9fafb;">Main Entrance Doors</a>
            <a href="/products/wpc-bathroom-doors" style="padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 12px; color: #374151; text-decoration: none; background: #f9fafb;">WPC Waterproof Doors</a>
          </div>

          <!-- Product Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; margin-bottom: 48px;">
            ${productCards}
          </div>

          <!-- Footer Information -->
          <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 13px; color: #4b5563; line-height: 1.8;">
            <p style="margin: 0;"><strong>Custom Requirements?</strong> Need bespoke dimensions, rare Italian marble, or customized upholstery? Visit our studio at Rachenahalli, Thanisandra, Bengaluru or call <strong>+91 70261 19311</strong> for architectural consultations.</p>
          </div>
        </div>
      </main>
    </div>
  `;

  return html.replace('<div id="root"></div>', preRenderedCatalog);
}

/**
 * Render complete SEO landing page HTML with accurate meta tags, canonical URL, Open Graph,
 * Schema.org JSON-LD, and pre-rendered semantic HTML for search crawlers.
 * Respects dynamic host origin so .in and .com domains maintain self-referencing canonicals.
 */
export function injectSeoPageIntoHtml(
  templateHtml: string,
  pageData: any,
  slug: string,
  hostOrigin: string = 'https://royalepicinterior.com'
): string {
  const cleanTitle = escapeHtml(pageData.title);
  const cleanDesc = escapeHtml(pageData.metaDescription);
  const cleanKeywords = escapeHtml(pageData.keywords?.join(', ') || '');
  const cleanH1 = escapeHtml(pageData.h1);
  const cleanSubtitle = escapeHtml(pageData.subtitle);
  const canonicalUrl = `${hostOrigin}${pageData.slug === '/' ? '' : pageData.slug}`;
  const heroImage = pageData.heroImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

  let html = templateHtml;

  // 1. Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${cleanTitle}</title>`);

  // 2. Replace or update <meta name="description">
  const metaDescTag = `<meta name="description" content="${cleanDesc}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDescTag);
  } else {
    html = html.replace('</head>', `  ${metaDescTag}\n  </head>`);
  }

  // 3. Replace or update <meta name="keywords">
  const metaKeywordsTag = `<meta name="keywords" content="${cleanKeywords}" />`;
  if (/<meta\s+name=["']keywords["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']keywords["'][^>]*>/i, metaKeywordsTag);
  } else {
    html = html.replace('</head>', `  ${metaKeywordsTag}\n  </head>`);
  }

  // 4. Replace or update Canonical URL (Dynamic self-referencing canonical matching request host)
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  // 5. Replace or update Open Graph & Twitter Cards
  const ogTitle = `<meta property="og:title" content="${cleanTitle}" />`;
  const ogDesc = `<meta property="og:description" content="${cleanDesc}" />`;
  const ogUrl = `<meta property="og:url" content="${canonicalUrl}" />`;
  const ogImage = `<meta property="og:image" content="${heroImage}" />`;
  const ogType = `<meta property="og:type" content="website" />`;

  const twTitle = `<meta name="twitter:title" content="${cleanTitle}" />`;
  const twDesc = `<meta name="twitter:description" content="${cleanDesc}" />`;
  const twImage = `<meta name="twitter:image" content="${heroImage}" />`;

  html = html
    .replace(/<meta\s+property=["']og:title["'][^>]*>/i, ogTitle)
    .replace(/<meta\s+property=["']og:description["'][^>]*>/i, ogDesc)
    .replace(/<meta\s+property=["']og:url["'][^>]*>/i, ogUrl)
    .replace(/<meta\s+property=["']og:image["'][^>]*>/i, ogImage)
    .replace(/<meta\s+property=["']og:type["'][^>]*>/i, ogType)
    .replace(/<meta\s+name=["']twitter:title["'][^>]*>/i, twTitle)
    .replace(/<meta\s+name=["']twitter:description["'][^>]*>/i, twDesc)
    .replace(/<meta\s+name=["']twitter:image["'][^>]*>/i, twImage);

  // 6. Localize Schema.org JSON-LD to the current origin
  let localizedSchema = pageData.schema;
  try {
    localizedSchema = JSON.parse(
      JSON.stringify(pageData.schema)
        .replace(/https:\/\/royalepicinterior\.com/g, hostOrigin)
        .replace(/https:\/\/royalepicfurniture\.com/g, hostOrigin)
    );
  } catch (_) {}

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": (pageData.breadcrumbs || []).map((b: any, idx: number) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": b.name,
      "item": `${hostOrigin}${b.url === '/' ? '' : b.url}`
    }))
  };

  const faqSchema = (pageData.faqs && pageData.faqs.length > 0) ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": pageData.faqs.map((f: any) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  } : null;

  const schemasToInject = [localizedSchema, breadcrumbsSchema, faqSchema].filter(Boolean);
  const jsonLdTag = `\n    <!-- Schema.org JSON-LD for SEO Landing Page -->\n    <script type="application/ld+json" id="seo-schema-script">\n${JSON.stringify(schemasToInject, null, 2)}\n    </script>\n  `;
  html = html.replace('</head>', `${jsonLdTag}</head>`);

  // 7. Inject Semantic Pre-Rendered HTML inside <div id="root"> for non-JS search crawlers
  const sectionsHtml = (pageData.contentSections || []).map((s: any) => `
    <section style="margin-bottom: 32px;">
      <h2 style="font-size: 22px; font-weight: 700; color: #171717; margin-bottom: 12px; border-left: 4px solid #b45309; padding-left: 12px;">${escapeHtml(s.title)}</h2>
      <p style="font-size: 15px; line-height: 1.7; color: #404040; margin-bottom: 12px;">${escapeHtml(s.description)}</p>
      ${s.highlights && s.highlights.length > 0 ? `
        <ul style="list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px;">
          ${s.highlights.map((h: string) => `<li style="background: #f5f5f5; padding: 10px 14px; border-radius: 8px; font-size: 13px; color: #262626; border: 1px solid #e5e5e5;">✓ ${escapeHtml(h)}</li>`).join('')}
        </ul>
      ` : ''}
    </section>
  `).join('');

  const faqsHtml = (pageData.faqs || []).map((f: any) => `
    <div style="border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 12px; padding: 16px; background: #ffffff;">
      <h3 style="font-size: 16px; font-weight: 600; color: #171717; margin: 0 0 8px 0;">${escapeHtml(f.question)}</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #525252; margin: 0;">${escapeHtml(f.answer)}</p>
    </div>
  `).join('');

  const preRenderedPage = `
    <div id="root">
      <main style="min-height: 100vh; background-color: #ffffff; color: #171717; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Breadcrumb Nav -->
        <nav style="background: #f5f5f5; border-bottom: 1px solid #e5e5e5; padding: 12px 24px; font-size: 13px; color: #737373;">
          <div style="max-width: 1280px; margin: 0 auto; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            ${(pageData.breadcrumbs || []).map((b: any, idx: number) => `
              ${idx > 0 ? '&gt;' : ''}
              <a href="${b.url}" style="color: #404040; text-decoration: none;">${escapeHtml(b.name)}</a>
            `).join('')}
          </div>
        </nav>

        <!-- Hero Header -->
        <header style="background: #171717; color: #ffffff; padding: 60px 24px; border-bottom: 1px solid #262626;">
          <div style="max-width: 1280px; margin: 0 auto;">
            <span style="display: inline-block; padding: 4px 12px; background: rgba(180, 83, 9, 0.2); color: #d97706; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px;">
              Royal Epic Interior • Bengaluru Commercial Division
            </span>
            <h1 style="font-size: 36px; font-weight: 800; line-height: 1.2; margin: 0 0 16px 0; color: #ffffff;">${cleanH1}</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #d4d4d4; max-width: 800px; margin: 0 0 24px 0;">${cleanSubtitle}</p>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <a href="tel:+917026119311" style="padding: 12px 24px; background: #b45309; color: #ffffff; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 14px;">Call Senior Designer (+91 70261 19311)</a>
              <a href="/get-free-quote" style="padding: 12px 24px; background: #262626; color: #ffffff; font-weight: 600; text-decoration: none; border-radius: 8px; font-size: 14px; border: 1px solid #404040;">Get Free BOQ Quote</a>
            </div>
          </div>
        </header>

        <!-- Content Body -->
        <div style="max-width: 1280px; margin: 0 auto; padding: 48px 24px;">
          ${sectionsHtml}

          ${pageData.faqs && pageData.faqs.length > 0 ? `
            <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #e5e5e5;">
              <h2 style="font-size: 24px; font-weight: 700; color: #171717; margin-bottom: 24px;">Frequently Asked Questions</h2>
              ${faqsHtml}
            </div>
          ` : ''}

          <!-- Business Footer Card -->
          <div style="margin-top: 48px; padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 13px; color: #4b5563; line-height: 1.8;">
            <p style="margin: 0;"><strong>Company:</strong> Royal Epic Commercial &amp; Home Interiors</p>
            <p style="margin: 0;"><strong>Factory &amp; Studio:</strong> No. 10, Royal EPIC Interiors, 2nd, Thanisandra Main Road, Near Railway Bridge, Sinthan Nagar, Rachenahalli, Nagawara, Bengaluru, Karnataka 560045</p>
            <p style="margin: 0;"><strong>Direct Contacts:</strong> +91 70261 19311 • enquiry@royalepicinterior.com</p>
          </div>
        </div>
      </main>
    </div>
  `;

  return html.replace('<div id="root"></div>', preRenderedPage);
}

/**
 * Helper to update Open Graph and Twitter meta tags in-place without duplicating tags,
 * and localize global index.html JSON-LD domain references to the active request origin.
 */
function applyCleanSocialMetaAndOrigin(
  inputHtml: string,
  params: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogImage: string;
    ogType?: string;
    effectiveOrigin: string;
  }
): string {
  const { title, description, canonicalUrl, ogImage, ogType = 'website', effectiveOrigin } = params;
  const cleanTitle = escapeHtml(title);
  const cleanDesc = escapeHtml(description);
  const cleanUrl = escapeHtml(canonicalUrl);
  const cleanImg = escapeHtml(ogImage);

  let html = inputHtml
    .replace(/<meta\s+property=["']og:title["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["']og:description["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["']og:url["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["']og:image["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["']og:type["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:title["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:description["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:url["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:image["'][^>]*>\s*/gi, '');

  const socialBlock = `
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:title" content="${cleanTitle}" />
    <meta property="og:description" content="${cleanDesc}" />
    <meta property="og:url" content="${cleanUrl}" />
    <meta property="og:image" content="${cleanImg}" />
    <meta name="twitter:title" content="${cleanTitle}" />
    <meta name="twitter:description" content="${cleanDesc}" />
    <meta name="twitter:url" content="${cleanUrl}" />
    <meta name="twitter:image" content="${cleanImg}" />`;

  html = html.replace('</head>', `${socialBlock}\n  </head>`);

  // Localize global index.html JSON-LD references so .in and .com have consistent host-aware schema URLs
  if (effectiveOrigin && effectiveOrigin !== 'https://royalepicinterior.com') {
    html = html.replace(/https:\/\/royalepicinterior\.com/g, effectiveOrigin);
  }

  return html;
}

/**
 * Helper to build clean, non-duplicative SEO Title and Meta Description for individual property pages
 * strictly from verified public property fields.
 */
export function buildPropertyDetailSeoMeta(property: any): {
  pageTitle: string;
  cleanDesc: string;
  headingSubtitle: string;
} {
  const rawTitle = String(property?.property_title || '').trim();
  const locality = String(property?.locality || 'Bengaluru').trim();
  const city = String(property?.city || 'Bengaluru').trim();
  const bhkType =
    property?.bhk_type && property.bhk_type !== 'N/A' ? String(property.bhk_type).trim() : '';
  const propType = String(property?.property_type || 'Property').trim();
  const bhkOrType =
    bhkType && !propType.toLowerCase().includes(bhkType.toLowerCase())
      ? `${bhkType} ${propType}`
      : propType;

  // Escape regex special chars for safe locality deduplication
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Remove trailing "in <locality>" or "in <city>" from rawTitle to prevent "in HSR Layout in HSR Layout"
  let baseTitle = rawTitle
    .replace(new RegExp(`\\s+in\\s+${esc(locality)}(?:,\\s*${esc(city)})?$`, 'i'), '')
    .replace(new RegExp(`\\s+in\\s+${esc(city)}$`, 'i'), '')
    .trim();

  if (!baseTitle) {
    baseTitle = bhkOrType || 'Rental Property';
  }

  // Add "Flat" if baseTitle is just "1 BHK" / "2 BHK" / "3 BHK" and category is Residential
  if (/^\d+\s*(?:BHK|RK)$/i.test(baseTitle) && property?.property_category !== 'Commercial') {
    baseTitle = `${baseTitle} Flat`;
  }

  const hasForRent = /\bfor\s+rent\b/i.test(baseTitle);
  const titleWithIntent = hasForRent ? baseTitle : `${baseTitle} for Rent`;

  const locationPhrase =
    locality.toLowerCase() === city.toLowerCase() ? city : `${locality}, ${city}`;

  const pageTitle = `${titleWithIntent} in ${locationPhrase} | Royal Epic Properties`;

  // Build unique meta description from genuine fields
  const rentNum = Number(property?.monthly_rent || property?.expected_monthly_rent || 0);
  const rentPhrase = rentNum > 0 ? ` at ₹${rentNum.toLocaleString('en-IN')}/month` : '';
  const furnishing =
    property?.furnishing_status && String(property.furnishing_status).trim()
      ? `${String(property.furnishing_status).trim()} `
      : '';
  const areaNum = Number(property?.built_up_area || property?.carpet_area || 0);
  const areaPhrase =
    areaNum > 0 ? ` (${areaNum} ${property?.area_unit || 'sq.ft'})` : '';
  const amenitiesList = Array.isArray(property?.amenities)
    ? property.amenities.filter(Boolean).slice(0, 3)
    : [];
  const amenitiesPhrase =
    amenitiesList.length > 0 ? ` Includes ${amenitiesList.join(', ')}.` : '';

  const customDesc = String(property?.description || property?.property_description || '').trim();
  const isGenericDefaultDesc =
    !customDesc ||
    /^Verified\s+.*available\s+for\s+rent\s+in\s+.*Managed\s+by\s+Royal\s+Epic\s+Properties\.?$/i.test(
      customDesc
    );

  const generatedDesc = `Verified ${furnishing}${baseTitle.toLowerCase().includes('for rent') ? baseTitle : `${baseTitle} for rent`}${areaPhrase} in ${locationPhrase}${rentPhrase}.${amenitiesPhrase} Schedule an assisted site visit with Royal Epic Properties.`;

  const cleanDesc = (isGenericDefaultDesc ? generatedDesc : `${customDesc}${rentPhrase ? ` Monthly rent:${rentPhrase.replace(' at', '')}.` : ''}${amenitiesPhrase}`)
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

  const headingSubtitle = `${furnishing ? `${furnishing}• ` : ''}${locationPhrase}${rentNum > 0 ? ` • ₹${rentNum.toLocaleString('en-IN')}/month` : ''}`;

  return { pageTitle, cleanDesc, headingSubtitle };
}

export const PROPERTIES_PAGE_FAQS = [
  {
    question: 'How does Royal Epic Properties verify rental listings in Bengaluru?',
    answer:
      'Every property published on Royal Epic Properties undergoes a 4-point verification check covering owner identity, ownership authorization, current vacancy status, and direct permission to advertise.',
  },
  {
    question: 'What types of rental properties are available on Royal Epic Properties?',
    answer:
      'We list verified residential properties—including 1 BHK, 2 BHK, and 3 BHK flats, independent houses, and gated villas—as well as commercial offices, retail shops, and showrooms across Bengaluru.',
  },
  {
    question: 'How do I schedule a site visit for a listed property?',
    answer:
      'Open any available property listing and submit the site visit request form with your preferred date and time, or call our Bengaluru property desk at +91 70261 19311 for an accompanied visit.',
  },
  {
    question: 'Why are exact street addresses and owner phone numbers not displayed publicly?',
    answer:
      'To protect resident and homeowner privacy and prevent unsolicited spam calls, exact door numbers and owner contact details are kept confidential. Our property advisors coordinate all enquiries and accompanied visits directly.',
  },
  {
    question: 'Can property owners in Bengaluru list their flat, villa, or commercial space for rent?',
    answer:
      'Yes. Property owners in Bengaluru can contact Royal Epic Properties at +91 70261 19311 or submit their requirement to have our team verify, photograph, and showcase their property to genuine tenants.',
  },
];

/**
 * Render public property listing index (/properties) HTML with host-aware self-canonical URL,
 * Open Graph & Twitter meta tags, Schema.org structured data, and semantic SSR HTML inside #root.
 */
export function injectPropertiesListIntoHtml(
  templateHtml: string,
  properties: any[],
  hostOrigin: string = SITE_URL
): string {
  const effectiveOrigin = (hostOrigin || SITE_URL).replace(/\/+$/, '');
  const canonicalUrl = `${effectiveOrigin}/properties`;
  const pageTitle = 'Rental Properties in Bangalore & Bengaluru | Royal Epic';
  const pageDesc =
    'Explore verified 1BHK, 2BHK & 3BHK flats, houses, villas and commercial spaces for rent in Bengaluru. Get assistance with property site visits.';
  const ogImage =
    (Array.isArray(properties) && properties[0]?.main_image) ||
    `${effectiveOrigin}/images/royal-epic-properties-og.jpg`;

  let html = templateHtml;

  // 1. <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);

  // 2. <meta name="description">
  const metaDescTag = `<meta name="description" content="${escapeHtml(pageDesc)}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDescTag);
  } else {
    html = html.replace('</head>', `  ${metaDescTag}\n  </head>`);
  }

  // 3. Host-aware self-canonical URL
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  // 4. Open Graph & Twitter tags (in-place replacement, no duplicates)
  html = applyCleanSocialMetaAndOrigin(html, {
    title: pageTitle,
    description: pageDesc,
    canonicalUrl,
    ogImage,
    ogType: 'website',
    effectiveOrigin,
  });

  // 5. Schema.org Structured Data (CollectionPage + ItemList + BreadcrumbList + FAQPage)
  const validProperties = Array.isArray(properties) ? properties : [];
  const listItems = validProperties.slice(0, 30).map((p, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    url: `${effectiveOrigin}/properties/${p.slug}`,
    name: p.property_title,
  }));

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: pageTitle,
      description: pageDesc,
      url: canonicalUrl,
      provider: {
        '@type': 'RealEstateAgent',
        name: 'Royal Epic Properties (A Division of Royal Epic Interiors)',
        url: canonicalUrl,
        image: ogImage,
        telephone: '+91-7026119311',
        areaServed: {
          '@type': 'City',
          name: 'Bengaluru',
        },
      },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: listItems.length,
        itemListElement: listItems,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${effectiveOrigin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Properties',
          item: canonicalUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: PROPERTIES_PAGE_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ];

  const jsonLdScript = `\n    <!-- Royal Epic Properties Structured Data -->\n    <script type="application/ld+json" id="properties-list-schema">\n${JSON.stringify(structuredData, null, 2)}\n    </script>\n  `;
  html = html.replace('</head>', `${jsonLdScript}</head>`);

  // 6. Hydrate initial properties payload for instant render
  const initialScript = `<script>window.__INITIAL_PROPERTIES__ = ${JSON.stringify(validProperties)};</script>`;
  html = html.replace('</head>', `  ${initialScript}\n  </head>`);

  // 7. Semantic Pre-rendered HTML inside <div id="root"> for search engine crawlers
  const propertyCardsHtml =
    validProperties.length > 0
      ? validProperties
          .map((p) => {
            const rentNum = Number(p.monthly_rent || 0);
            const rentText = rentNum > 0 ? `₹${rentNum.toLocaleString('en-IN')}/month` : 'Rent on Request';
            const propUrl = `/properties/${escapeHtml(String(p.slug || ''))}`;
            const locText = `${escapeHtml(p.locality || 'Bengaluru')}, ${escapeHtml(p.city || 'Bengaluru')}`;
            const amenitiesText =
              Array.isArray(p.amenities) && p.amenities.length > 0
                ? `<p style="font-size: 12px; color: #57534e; margin: 6px 0 0 0;">Amenities: ${escapeHtml(p.amenities.slice(0, 4).join(', '))}</p>`
                : '';
            return `
              <article style="border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column;">
                <a href="${propUrl}" style="display: block; text-decoration: none; color: inherit;">
                  <img src="${escapeHtml(p.main_image || ogImage)}" alt="${escapeHtml(p.property_title || 'Rental Property')} in ${locText}" loading="lazy" style="width: 100%; height: 220px; object-fit: cover; display: block;" />
                </a>
                <div style="padding: 20px;">
                  <span style="font-size: 11px; font-weight: 600; color: #9a7835; text-transform: uppercase;">${escapeHtml(p.property_category || 'Residential')} • ${escapeHtml(p.property_type || '2 BHK')}</span>
                  <h3 style="font-size: 18px; font-weight: 700; margin: 6px 0 8px 0;">
                    <a href="${propUrl}" style="color: #1c1917; text-decoration: none;">${escapeHtml(p.property_title || 'Rental Property')}</a>
                  </h3>
                  <p style="font-size: 13px; color: #57534e; margin: 0 0 8px 0;">Location: ${locText} • ${escapeHtml(p.furnishing_status || 'Semi-Furnished')}</p>
                  <p style="font-size: 16px; font-weight: 700; color: #b45309; margin: 0 0 10px 0;">Monthly Rent: ${escapeHtml(rentText)}</p>
                  ${amenitiesText}
                  <div style="margin-top: 14px;">
                    <a href="${propUrl}" style="display: inline-block; padding: 8px 16px; background: #1c1917; color: #ffffff; border-radius: 10px; font-size: 12px; font-weight: 600; text-decoration: none;">View Details</a>
                  </div>
                </div>
              </article>
            `;
          })
          .join('')
      : `<p style="font-size: 14px; color: #57534e;">Contact the Royal Epic Properties Bengaluru desk at +91 70261 19311 for currently available verified rental homes and commercial spaces.</p>`;

  const faqsHtml = PROPERTIES_PAGE_FAQS.map(
    (f) => `
      <div style="border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin-bottom: 12px; background: #ffffff;">
        <h3 style="font-size: 16px; font-weight: 700; color: #1c1917; margin: 0 0 6px 0;">${escapeHtml(f.question)}</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin: 0;">${escapeHtml(f.answer)}</p>
      </div>
    `
  ).join('');

  const preRenderedBody = `
    <div id="root">
      <main style="min-height: 100vh; background-color: #FAF8F5; color: #1c1917; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <nav aria-label="Breadcrumb" style="background: #ffffff; border-bottom: 1px solid #e7e5e4; padding: 12px 24px; font-size: 13px;">
          <div style="max-width: 1280px; margin: 0 auto;">
            <a href="/" style="color: #57534e; text-decoration: none;">Home</a> &gt;
            <span style="color: #1c1917; font-weight: 600;">Royal Epic Properties</span>
          </div>
        </nav>

        <section style="max-width: 1280px; margin: 0 auto; padding: 40px 24px;">
          <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #9A7835; display: block; margin-bottom: 8px;">Rental Properties in Bengaluru &amp; Bangalore</span>
          <h1 style="font-size: 36px; font-weight: 800; color: #1A1D24; margin: 0 0 16px 0;">Verified Rental Properties in Bengaluru</h1>
          <p style="font-size: 16px; line-height: 1.7; color: #57534e; max-width: 840px; margin: 0 0 28px 0;">
            Explore identity-verified 1 BHK, 2 BHK, and 3 BHK flats, independent houses, gated villas, commercial offices, and retail spaces available for rent across Bengaluru. Every listing on Royal Epic Properties is checked for ownership authorization and active availability, with accompanied site visits coordinated by our Bengaluru team.
          </p>

          <h2 style="font-size: 24px; font-weight: 700; color: #1c1917; margin: 0 0 20px 0;">Available Verified Rental Listings in Bengaluru</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; margin-bottom: 48px;">
            ${propertyCardsHtml}
          </div>

          <section style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 28px; margin-bottom: 40px;">
            <h2 style="font-size: 22px; font-weight: 700; color: #1c1917; margin: 0 0 12px 0;">Flats, Houses, Villas &amp; Commercial Spaces for Rent Across Bengaluru</h2>
            <p style="font-size: 14px; line-height: 1.7; color: #57534e; margin: 0 0 12px 0;">
              Whether you are searching for a semi-furnished family flat, a furnished apartment near major technology corridors, an independent house, or a commercial office floorplate, Royal Epic Properties provides transparent rental terms and personal site visit assistance across North, East, and South Bengaluru—including Thanisandra, Hebbal, Yelahanka, HSR Layout, Whitefield, Indiranagar, Koramangala, Sarjapur Road, Marathahalli, Bellandur, and JP Nagar.
            </p>
            <p style="font-size: 14px; line-height: 1.7; color: #57534e; margin: 0;">
              Moving into a new home or upgrading a property? Explore <a href="/loans" style="color: #9A7835; font-weight: 600;">Royal Epic Loans for Home &amp; Interior Finance Assistance</a>, <a href="/home-interior-design-bangalore" style="color: #9A7835; font-weight: 600;">Home Interior Design in Bengaluru</a>, <a href="/modular-kitchen-bangalore" style="color: #9A7835; font-weight: 600;">Factory Modular Kitchens</a>, and <a href="/products" style="color: #9A7835; font-weight: 600;">Custom Handcrafted Furniture</a>.
            </p>
          </section>

          <section style="margin-bottom: 40px;">
            <h2 style="font-size: 22px; font-weight: 700; color: #1c1917; margin: 0 0 16px 0;">Frequently Asked Questions — Renting with Royal Epic Properties</h2>
            ${faqsHtml}
          </section>
        </section>
      </main>
    </div>
  `;

  return html.replace('<div id="root"></div>', preRenderedBody);
}

/**
 * Render public single property detail (/properties/:propertySlug) HTML with host-aware
 * self-canonical URL, Open Graph & Twitter meta tags, Schema.org RealEstateListing structured data,
 * and semantic SSR HTML inside #root.
 * Never includes private owner contact data or full street addresses.
 */
export function injectPropertyDetailIntoHtml(
  templateHtml: string,
  property: any,
  hostOrigin: string = SITE_URL,
  similarProperties: any[] = []
): string {
  const effectiveOrigin = (hostOrigin || SITE_URL).replace(/\/+$/, '');
  const slug = property.slug || property.property_id;
  const canonicalUrl = `${effectiveOrigin}/properties/${slug}`;
  const locality = property.locality || 'Bengaluru';
  const city = property.city || 'Bengaluru';

  const { pageTitle, cleanDesc } = buildPropertyDetailSeoMeta(property);

  const ogImage =
    property.main_image ||
    `${effectiveOrigin}/images/royal-epic-properties-og.jpg`;

  let html = templateHtml;

  // 1. <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);

  // 2. <meta name="description">
  const metaDescTag = `<meta name="description" content="${escapeHtml(cleanDesc)}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDescTag);
  } else {
    html = html.replace('</head>', `  ${metaDescTag}\n  </head>`);
  }

  // 3. Host-aware self-canonical URL
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  // 4. Open Graph & Twitter tags (in-place replacement, no duplicates)
  html = applyCleanSocialMetaAndOrigin(html, {
    title: pageTitle,
    description: cleanDesc,
    canonicalUrl,
    ogImage,
    ogType: 'website',
    effectiveOrigin,
  });

  // 5. Schema.org RealEstateListing + BreadcrumbList (strictly approximate location only, no owner details)
  const rentNum = Number(property.monthly_rent || 0);
  const listingSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.property_title,
    description: cleanDesc,
    url: canonicalUrl,
    identifier: property.property_id,
    image:
      Array.isArray(property.images) && property.images.length > 0
        ? property.images.map((img: any) => img.url)
        : [ogImage],
    datePosted: property.created_at,
    contentLocation: {
      '@type': 'Place',
      name: `${locality}, ${city}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: locality,
        addressRegion: `${city}, Karnataka`,
        ...(property.pincode ? { postalCode: property.pincode } : {}),
        addressCountry: 'IN',
      },
    },
  };

  if (rentNum > 0) {
    listingSchema.offers = {
      '@type': 'Offer',
      price: rentNum,
      priceCurrency: 'INR',
      availability:
        property.availability_status === 'Temporarily On Hold'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/InStock',
      url: canonicalUrl,
    };
  }

  const structuredData = [
    listingSchema,
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${effectiveOrigin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Properties',
          item: `${effectiveOrigin}/properties`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: property.property_title,
          item: canonicalUrl,
        },
      ],
    },
  ];

  const jsonLdScript = `\n    <!-- Royal Epic Properties Detail Structured Data -->\n    <script type="application/ld+json" id="property-detail-schema">\n${JSON.stringify(structuredData, null, 2)}\n    </script>\n  `;
  html = html.replace('</head>', `${jsonLdScript}</head>`);

  // 6. Hydrate initial property detail payload
  const initialScript = `<script>window.__INITIAL_PROPERTY_DETAIL__ = ${JSON.stringify(property)};</script>`;
  html = html.replace('</head>', `  ${initialScript}\n  </head>`);

  // 7. Semantic Pre-rendered HTML inside <div id="root"> for search engine crawlers
  const configText =
    property.bhk_type && property.bhk_type !== 'N/A'
      ? `${property.bhk_type} (${property.property_type || 'Residential'})`
      : property.property_type || 'Property';
  const publicAmenities = Array.isArray(property.amenities) ? property.amenities.filter(Boolean) : [];
  const similarList = Array.isArray(similarProperties) ? similarProperties.slice(0, 3) : [];

  const similarHtml =
    similarList.length > 0
      ? `
        <section style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #e7e5e4;">
          <h2 style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 16px 0;">Similar Verified Properties in Bengaluru</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
            ${similarList
              .map(
                (sim) => `
              <article style="border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; background: #ffffff;">
                <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 6px 0;">
                  <a href="/properties/${escapeHtml(sim.slug)}" style="color: #1c1917; text-decoration: none;">${escapeHtml(sim.property_title)}</a>
                </h3>
                <p style="font-size: 13px; color: #57534e; margin: 0 0 8px 0;">${escapeHtml(sim.locality || 'Bengaluru')}, ${escapeHtml(sim.city || 'Bengaluru')} • ${escapeHtml(sim.furnishing_status || 'Semi-Furnished')}</p>
                ${Number(sim.monthly_rent) > 0 ? `<p style="font-size: 15px; font-weight: 700; color: #b45309; margin: 0 0 10px 0;">₹${Number(sim.monthly_rent).toLocaleString('en-IN')}/month</p>` : ''}
                <a href="/properties/${escapeHtml(sim.slug)}" style="font-size: 12px; font-weight: 600; color: #9a7835; text-decoration: underline;">View Property Details →</a>
              </article>
            `
              )
              .join('')}
          </div>
        </section>
      `
      : '';

  const preRenderedDetail = `
    <div id="root">
      <main style="min-height: 100vh; background-color: #FAF8F5; color: #1c1917; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <nav aria-label="Breadcrumb" style="background: #ffffff; border-bottom: 1px solid #e7e5e4; padding: 12px 24px; font-size: 13px;">
          <div style="max-width: 1280px; margin: 0 auto;">
            <a href="/" style="color: #57534e; text-decoration: none;">Home</a> &gt;
            <a href="/properties" style="color: #57534e; text-decoration: none;">Properties</a> &gt;
            <span style="color: #1c1917; font-weight: 600;">${escapeHtml(property.property_title)}</span>
          </div>
        </nav>

        <article style="max-width: 1280px; margin: 0 auto; padding: 36px 24px;">
          <header style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
            <span style="font-size: 12px; font-weight: 700; color: #9a7835; text-transform: uppercase;">${escapeHtml(property.property_category || 'Residential')} • ${escapeHtml(configText)}</span>
            <h1 style="font-size: 32px; font-weight: 800; color: #1c1917; margin: 8px 0 8px 0;">${escapeHtml(property.property_title)}</h1>
            <p style="font-size: 15px; color: #57534e; margin: 0 0 16px 0;">Approximate Location: ${escapeHtml(locality)}, ${escapeHtml(city)}${property.pincode ? ` - ${escapeHtml(property.pincode)}` : ''}</p>
            ${rentNum > 0 ? `<p style="font-size: 24px; font-weight: 800; color: #b45309; margin: 0;">Monthly Rent: ₹${rentNum.toLocaleString('en-IN')} / month</p>` : ''}
            ${Number(property.security_deposit) > 0 ? `<p style="font-size: 14px; color: #57534e; margin: 6px 0 0 0;">Security Deposit: ₹${Number(property.security_deposit).toLocaleString('en-IN')}</p>` : ''}
          </header>

          <div style="margin-bottom: 24px;">
            <img src="${escapeHtml(ogImage)}" alt="${escapeHtml(property.property_title)} for rent in ${escapeHtml(locality)}, ${escapeHtml(city)}" style="width: 100%; max-height: 480px; object-fit: cover; border-radius: 16px; display: block;" />
          </div>

          <section style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
            <h2 style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 12px 0;">Property Overview &amp; Specifications</h2>
            <ul style="list-style: none; padding: 0; margin: 0 0 20px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 14px; color: #44403c;">
              <li><strong>Configuration:</strong> ${escapeHtml(configText)}</li>
              <li><strong>Furnishing Status:</strong> ${escapeHtml(property.furnishing_status || 'Semi-Furnished')}</li>
              <li><strong>Locality:</strong> ${escapeHtml(locality)}, ${escapeHtml(city)}</li>
              ${Number(property.built_up_area) > 0 ? `<li><strong>Built-up Area:</strong> ${Number(property.built_up_area)} ${escapeHtml(property.area_unit || 'sq.ft')}</li>` : ''}
              ${property.parking_availability ? `<li><strong>Parking:</strong> ${escapeHtml(property.parking_availability)}</li>` : ''}
              ${property.available_from ? `<li><strong>Available From:</strong> ${escapeHtml(property.available_from)}</li>` : ''}
            </ul>

            <h2 style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 10px 0;">About This Property</h2>
            <p style="font-size: 15px; line-height: 1.7; color: #44403c; margin: 0;">${escapeHtml(property.description || cleanDesc)}</p>
          </section>

          ${
            publicAmenities.length > 0
              ? `
            <section style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 12px 0;">Amenities &amp; Features</h2>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #44403c; line-height: 1.8;">
                ${publicAmenities.map((a: string) => `<li>${escapeHtml(a)}</li>`).join('')}
              </ul>
            </section>
          `
              : ''
          }

          <div style="margin-top: 24px;">
            <a href="/properties" style="display: inline-block; padding: 10px 20px; background: #1c1917; color: #ffffff; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none;">← Browse All Verified Properties in Bengaluru</a>
          </div>

          ${similarHtml}
        </article>
      </main>
    </div>
  `;

  return html.replace('<div id="root"></div>', preRenderedDetail);
}

/**
 * Render HTTP 404/410 Not Found HTML for non-existent, unpublished, rented, or removed property URLs.
 * Sets <meta name="robots" content="noindex, follow" />, canonical to /properties (never self-referencing to a missing slug),
 * and pre-renders a helpful explanation with a crawlable link back to /properties.
 */
export function injectPropertyNotFoundIntoHtml(
  templateHtml: string,
  hostOrigin: string = SITE_URL
): string {
  const effectiveOrigin = (hostOrigin || SITE_URL).replace(/\/+$/, '');
  const propertiesHubUrl = `${effectiveOrigin}/properties`;
  const pageTitle = 'Property No Longer Available | Royal Epic Properties';
  const pageDesc =
    'This property listing is no longer available or the link has changed. Explore currently available verified rental properties in Bengaluru with Royal Epic Properties.';
  const ogImage = `${effectiveOrigin}/images/royal-epic-properties-og.jpg`;

  let html = templateHtml;

  // 1. <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);

  // 2. <meta name="description">
  const metaDescTag = `<meta name="description" content="${escapeHtml(pageDesc)}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDescTag);
  } else {
    html = html.replace('</head>', `  ${metaDescTag}\n  </head>`);
  }

  // 3. <meta name="robots" content="noindex, follow" /> (Prevent Soft-404 indexing)
  const robotsNoIndexTag = `<meta name="robots" content="noindex, follow" />`;
  if (/<meta\s+name=["']robots["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']robots["'][^>]*>/i, robotsNoIndexTag);
  } else {
    html = html.replace('</head>', `  ${robotsNoIndexTag}\n  </head>`);
  }

  // 4. Canonical points to /properties hub, NEVER self-referencing a non-existent property URL
  const canonicalTag = `<link rel="canonical" href="${propertiesHubUrl}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  // 5. Clean Open Graph & Twitter metadata
  html = applyCleanSocialMetaAndOrigin(html, {
    title: pageTitle,
    description: pageDesc,
    canonicalUrl: propertiesHubUrl,
    ogImage,
    ogType: 'website',
    effectiveOrigin,
  });

  // 6. Semantic pre-rendered not-found message with crawlable link to /properties
  const notFoundBody = `
    <div id="root">
      <main style="min-height: 80vh; background-color: #FAF8F5; color: #1c1917; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; padding: 48px 24px;">
        <div style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 40px; max-width: 540px; width: 100%; text-align: center;">
          <h1 style="font-size: 26px; font-weight: 800; color: #1c1917; margin: 0 0 12px 0;">Property No Longer Available</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #57534e; margin: 0 0 24px 0;">
            This property may have been rented out, unpublished, or the link has changed. Explore our active verified residential and commercial rental properties across Bengaluru.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <a href="/properties" style="display: inline-block; padding: 12px 24px; background: #b45309; color: #ffffff; border-radius: 12px; font-size: 14px; font-weight: 600; text-decoration: none;">Browse Available Properties</a>
            <a href="/" style="display: inline-block; padding: 12px 24px; background: #f5f5f4; color: #1c1917; border-radius: 12px; font-size: 14px; font-weight: 600; text-decoration: none;">Return to Homepage</a>
          </div>
        </div>
      </main>
    </div>
  `;

  return html.replace('<div id="root"></div>', notFoundBody);
}

const LOANS_SSR_FAQS = [
  {
    question: 'What types of finance enquiries can I submit through Royal Epic Loans?',
    answer:
      'You can submit enquiries related to home construction finance, home interior finance, home renovation finance and property-related finance requirements.',
  },
  {
    question: 'How do I get details about available finance options?',
    answer:
      'Simply submit your requirement using the enquiry form on this page. Our team will review your details and contact you personally to discuss suitable options.',
  },
  {
    question: 'Do I need to upload documents on the website?',
    answer:
      'No. You do not need to upload any financial or identity documents on the website. The online form only collects basic contact and requirement details so our team can get in touch with you.',
  },
  {
    question: 'Can I enquire about finance specifically for home interiors or modular kitchen work?',
    answer:
      'Yes. You can select Home Interior Finance or Home Renovation Finance in the enquiry form and briefly mention your interior requirements.',
  },
  {
    question: 'Can I submit an enquiry if I am still in the planning stage?',
    answer:
      'Yes. Even if you are still planning your construction or interior project and are unsure of the exact amount, you can select "Not Sure Yet" and our team will guide you during the call.',
  },
  {
    question: 'How soon will the Royal Epic team contact me after I submit an enquiry?',
    answer:
      'Our team reviews new enquiries promptly and will contact you during working hours, taking your preferred contact time into consideration wherever possible.',
  },
  {
    question: 'Is submitting a finance enquiry free of charge?',
    answer:
      'Yes. Submitting an enquiry through the Royal Epic Loans page is completely free and carries no obligation.',
  },
  {
    question: 'Does submitting an enquiry guarantee finance approval?',
    answer:
      "No. Submitting an enquiry allows our team to understand your requirement and guide you. All finance options are subject to eligibility, verification and the applicable finance provider's terms and approval.",
  },
];

/**
 * Render public Royal Epic Loans page (/loans) HTML with host-aware self-canonical URL,
 * Open Graph & Twitter meta tags, accurate Schema.org WebPage + Service + BreadcrumbList + FAQPage structured data,
 * and semantic SSR HTML inside #root.
 * Never claims Royal Epic is a bank or direct lender.
 */
export function injectLoansPageIntoHtml(
  templateHtml: string,
  hostOrigin: string = SITE_URL
): string {
  const effectiveOrigin = (hostOrigin || SITE_URL).replace(/\/+$/, '');
  const canonicalUrl = `${effectiveOrigin}/loans`;
  const pageTitle = 'Home Interior & Construction Finance Assistance | Royal Epic';
  const metaDesc =
    'Explore home construction, interior and renovation finance enquiry assistance in Bengaluru. Share your requirements with Royal Epic for personal guidance.';
  const ogImage = `${effectiveOrigin}/images/royal-epic-loans-og.jpg`;

  let html = templateHtml;

  // 1. <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);

  // 2. <meta name="description">
  const metaDescTag = `<meta name="description" content="${escapeHtml(metaDesc)}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDescTag);
  } else {
    html = html.replace('</head>', `  ${metaDescTag}\n  </head>`);
  }

  // 3. Host-aware self-canonical URL
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  // 4. Open Graph & Twitter tags (in-place replacement, no duplicates)
  html = applyCleanSocialMetaAndOrigin(html, {
    title: pageTitle,
    description: metaDesc,
    canonicalUrl,
    ogImage,
    ogType: 'website',
    effectiveOrigin,
  });

  // 5. Accurate Schema.org WebPage, Service, BreadcrumbList & FAQPage structured data
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: metaDesc,
      url: canonicalUrl,
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: ogImage,
      },
      mainEntity: {
        '@type': 'Service',
        name: 'Royal Epic Loans – Home Construction, Interior & Renovation Finance Enquiry Assistance',
        description:
          'Personal enquiry guidance in Bengaluru for customers exploring finance options for home construction, home interiors, renovation and property-related requirements.',
        image: ogImage,
        serviceType: [
          'Home Construction Finance Enquiry Assistance',
          'Home Interior Finance Enquiry Assistance',
          'Home Renovation Finance Enquiry Assistance',
          'Property-Related Finance Guidance',
        ],
        provider: {
          '@type': 'Organization',
          name: 'Royal Epic Interiors',
          url: `${effectiveOrigin}/`,
          telephone: '+91-7026119311',
        },
        areaServed: {
          '@type': 'City',
          name: 'Bengaluru',
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${effectiveOrigin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Loans',
          item: canonicalUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: LOANS_SSR_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ];

  const jsonLdScript = `\n    <!-- Royal Epic Loans Structured Data -->\n    <script type="application/ld+json" id="loans-page-schema">\n${JSON.stringify(structuredData, null, 2)}\n    </script>\n  `;
  html = html.replace('</head>', `${jsonLdScript}</head>`);

  // 6. Semantic Pre-rendered HTML inside <div id="root"> for search engine crawlers
  const preRenderedLoans = `
    <div id="root">
      <main style="min-height: 100vh; background-color: #FAF7F2; color: #1C2331; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <nav aria-label="Breadcrumb" style="background: #ffffff; border-bottom: 1px solid #E5DEC9; padding: 12px 24px; font-size: 13px;">
          <div style="max-width: 1280px; margin: 0 auto;">
            <a href="/" style="color: #57534e; text-decoration: none;">Home</a> &gt;
            <span style="color: #1C2331; font-weight: 600;">Royal Epic Loans</span>
          </div>
        </nav>

        <section style="max-width: 1280px; margin: 0 auto; padding: 48px 24px;">
          <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #8C6D3B; display: block; margin-bottom: 10px;">Royal Epic Loans • Your Dream Home. The Right Financial Direction.</span>
          <h1 style="font-size: 36px; font-weight: 800; color: #1C2331; margin: 0 0 16px 0;">Home Construction, Interior &amp; Renovation Finance Assistance in Bengaluru</h1>
          <p style="font-size: 16px; line-height: 1.7; color: #57534e; max-width: 840px; margin: 0 0 24px 0;">
            Whether you are constructing a new home, designing complete interiors or planning a home upgrade in Bengaluru, Royal Epic helps you explore suitable finance options tailored to your goals. Share your requirements with us and our team will personally guide you.
          </p>

          <h2 style="font-size: 24px; font-weight: 700; color: #1C2331; margin: 32px 0 16px 0;">Finance Services We Assist With</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 40px;">
            <article style="background: #ffffff; border: 1px solid #E5DEC9; border-radius: 16px; padding: 24px;">
              <h3 style="font-size: 18px; font-weight: 700; color: #1C2331; margin: 0 0 8px 0;">Home Construction Finance</h3>
              <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin: 0;">Planning to build an independent house or residential property? Share your construction plans and approximate requirement with us, and our team will connect with you to discuss suitable finance options.</p>
            </article>
            <article style="background: #ffffff; border: 1px solid #E5DEC9; border-radius: 16px; padding: 24px;">
              <h3 style="font-size: 18px; font-weight: 700; color: #1C2331; margin: 0 0 8px 0;">Home Interior Finance</h3>
              <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin: 0;">Designing your new apartment, villa or independent home? Explore finance support for turnkey home interiors, modular kitchens, wardrobes, furniture and complete interior execution.</p>
            </article>
            <article style="background: #ffffff; border: 1px solid #E5DEC9; border-radius: 16px; padding: 24px;">
              <h3 style="font-size: 18px; font-weight: 700; color: #1C2331; margin: 0 0 8px 0;">Home Renovation Finance</h3>
              <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin: 0;">Upgrading your existing home, remodelling key rooms or modernising your interiors? Submit an enquiry to explore finance options for home improvement and renovation work.</p>
            </article>
            <article style="background: #ffffff; border: 1px solid #E5DEC9; border-radius: 16px; padding: 24px;">
              <h3 style="font-size: 18px; font-weight: 700; color: #1C2331; margin: 0 0 8px 0;">Property-Related Finance</h3>
              <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin: 0;">Looking for financial guidance related to a residential property requirement? Share your details and our team will review your enquiry and guide you appropriately.</p>
            </article>
          </div>

          <h2 style="font-size: 24px; font-weight: 700; color: #1C2331; margin: 0 0 16px 0;">How Your Finance Enquiry Works</h2>
          <ol style="font-size: 14px; line-height: 1.8; color: #57534e; margin: 0 0 36px 0; padding-left: 20px;">
            <li><strong>Submit Your Enquiry:</strong> Fill in the enquiry form with your basic contact details and finance requirement.</li>
            <li><strong>Our Team Connects With You:</strong> A Royal Epic representative will call you to understand your requirement in detail.</li>
            <li><strong>Requirement Review:</strong> We review your project type, approximate budget and preferred timeline.</li>
            <li><strong>Personal Guidance:</strong> Our team guides you on the suitable next steps based on your requirement.</li>
          </ol>

          <section style="background: #ffffff; border: 1px solid #E5DEC9; border-radius: 16px; padding: 24px; margin-bottom: 36px;">
            <h2 style="font-size: 20px; font-weight: 700; color: #1C2331; margin: 0 0 12px 0;">Explore Related Royal Epic Services &amp; Planning Guides</h2>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
              <li><a href="/turnkey-interior-contractors-bangalore" style="color: #8C6D3B; font-weight: 600;">Turnkey Interior Contractors in Bengaluru</a></li>
              <li><a href="/home-interior-design-bangalore" style="color: #8C6D3B; font-weight: 600;">Home Interior Design Services Bengaluru</a></li>
              <li><a href="/modular-kitchen-bangalore" style="color: #8C6D3B; font-weight: 600;">Factory Modular Kitchen Design in Bengaluru</a></li>
              <li><a href="/services/heritage-homes" style="color: #8C6D3B; font-weight: 600;">Heritage Homes &amp; Traditional Architecture</a></li>
              <li><a href="/properties" style="color: #8C6D3B; font-weight: 600;">Royal Epic Properties — Verified Rental Listings in Bengaluru</a></li>
              <li><a href="/blog/how-to-read-interior-design-quotation" style="color: #8C6D3B; font-weight: 600;">How to Read an Interior Design Quotation &amp; BOQ Before Booking</a></li>
              <li><a href="/blog/2bhk-3bhk-home-interior-planning-checklist" style="color: #8C6D3B; font-weight: 600;">Complete Home Interior Planning Checklist for 2BHK &amp; 3BHK Homeowners</a></li>
            </ul>
          </section>

          <section style="margin-bottom: 32px;">
            <h2 style="font-size: 22px; font-weight: 700; color: #1C2331; margin: 0 0 16px 0;">Frequently Asked Questions About Royal Epic Loans</h2>
            ${LOANS_SSR_FAQS.map(
              (f) => `
              <div style="border: 1px solid #E5DEC9; border-radius: 12px; padding: 16px; margin-bottom: 12px; background: #ffffff;">
                <h3 style="font-size: 16px; font-weight: 700; color: #1C2331; margin: 0 0 6px 0;">${escapeHtml(f.question)}</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin: 0;">${escapeHtml(f.answer)}</p>
              </div>
            `
            ).join('')}
          </section>

          <p style="font-size: 12px; color: #78716c; line-height: 1.6; border-top: 1px solid #E5DEC9; padding-top: 16px;">
            <strong>Finance Enquiry Disclaimer:</strong> Royal Epic Loans is a customer enquiry and assistance service provided by Royal Epic. Submitting an enquiry on this page does not constitute a sanction, offer or guarantee of finance. All finance options are subject to customer eligibility, document verification and the terms, conditions and approval of the applicable finance provider.
          </p>
        </section>
      </main>
    </div>
  `;

  return html.replace('<div id="root"></div>', preRenderedLoans);
}

/**
 * Injects SEO metadata, host-aware self-referencing canonical, Blog + BreadcrumbList JSON-LD,
 * and pre-rendered HTML for the Design Journal main listing page (/blog).
 */
export function injectBlogListIntoHtml(
  templateHtml: string,
  posts: any[],
  siteOrigin?: string
): string {
  const effectiveOrigin = (siteOrigin || SITE_URL).replace(/\/+$/, '');
  const canonicalUrl = `${effectiveOrigin}/blog`;
  const pageTitle = 'Design Journal & Interior Design Guides | Royal Epic Interiors';
  const metaDesc =
    'Read practical guides on home interiors, modular kitchens, materials, wardrobes, false ceilings, pricing and planning by Royal Epic Interiors in Bengaluru.';
  const ogImage = `${effectiveOrigin}/images/indian-luxury-living-room.jpg`;

  let html = templateHtml;

  // 1. <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);

  // 2. <meta name="description">
  const metaDescTag = `<meta name="description" content="${escapeHtml(metaDesc)}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDescTag);
  } else {
    html = html.replace('</head>', `  ${metaDescTag}\n  </head>`);
  }

  // 3. Host-aware self-referencing canonical
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  // 4. Open Graph & Twitter tags
  const ogTags = `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(metaDesc)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(metaDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  `;
  html = html
    .replace(/<meta\s+property=["']og:title["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:description["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:url["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:image["'][^>]*>/gi, '')
    .replace('</head>', `${ogTags}\n  </head>`);

  // 5. Blog + BreadcrumbList JSON-LD (no FAQPage schema)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${canonicalUrl}#blog`,
        name: 'Royal Epic Design Journal & Interior Design Knowledge Centre',
        description: metaDesc,
        url: canonicalUrl,
        inLanguage: 'en-IN',
        publisher: {
          '@type': 'Organization',
          name: 'Royal Epic Interiors',
          url: `${effectiveOrigin}/`,
          telephone: '+91-7026119311',
        },
        blogPost: (Array.isArray(posts) ? posts : []).slice(0, 15).map((p) => ({
          '@type': 'BlogPosting',
          headline: p.title,
          url: `${effectiveOrigin}/blog/${p.slug}`,
          datePublished: p.datePublishedIso || '2026-11-18',
          description: p.metaDescription || p.excerpt,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${effectiveOrigin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Design Journal',
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  const jsonLdScript = `\n    <!-- Royal Epic Design Journal Structured Data -->\n    <script type="application/ld+json" id="blog-list-schema">\n${JSON.stringify(structuredData, null, 2)}\n    </script>\n  `;
  html = html.replace('</head>', `${jsonLdScript}</head>`);

  // 6. Pre-render crawlable article cards inside <div id="root">
  const cardsHtml = (Array.isArray(posts) ? posts : [])
    .map(
      (post) => `
      <article style="border: 1px solid #e5e7eb; background: #ffffff; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #b45309;">${escapeHtml(post.category || 'Interior Design')}</span>
          <h2 style="font-size: 20px; font-weight: 700; color: #0F291E; margin: 8px 0 10px 0; line-height: 1.35;">
            <a href="/blog/${escapeHtml(post.slug)}" style="color: #0F291E; text-decoration: none;">${escapeHtml(post.title)}</a>
          </h2>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.65; margin: 0 0 14px 0;">${escapeHtml(post.excerpt || '')}</p>
        </div>
        <div style="font-size: 12px; color: #6b7280; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 12px;">
          <span>${escapeHtml(post.date || 'Nov 2026')} • ${escapeHtml(post.readTime || '9 min read')}</span>
          <a href="/blog/${escapeHtml(post.slug)}" style="color: #0F291E; font-weight: 700; text-decoration: underline;">Read Article →</a>
        </div>
      </article>
    `
    )
    .join('');

  const preRenderedBlogList = `
    <div id="root">
      <main style="min-height: 100vh; background-color: #FAF8F5; color: #1f2937; font-family: Georgia, serif;">
        <header style="background: #0F291E; color: #ffffff; padding: 56px 24px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <nav aria-label="Breadcrumb" style="font-size: 12px; margin-bottom: 16px; color: #d1d5db;">
              <a href="/" style="color: #d1d5db; text-decoration: none;">Home</a> &gt; <span>Design Journal</span>
            </nav>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em; color: #D4AF37; font-weight: 700; display: block; margin-bottom: 12px;">ROYAL EPIC DESIGN JOURNAL</span>
            <h1 style="font-size: 42px; color: #ffffff; margin: 0 0 14px 0;">Design Better. Live Better.</h1>
            <p style="font-size: 17px; color: #e5e7eb; max-width: 760px; line-height: 1.6; margin: 0;">
              Practical guides on home interiors, modular kitchens, materials, wardrobes, false ceilings, pricing and planning for homeowners and businesses.
            </p>
          </div>
        </header>
        <section style="max-width: 1200px; margin: 0 auto; padding: 40px 24px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
            ${cardsHtml}
          </div>
        </section>
      </main>
    </div>
  `;

  html = html.replace('<div id="root"></div>', preRenderedBlogList);
  return html;
}

/**
 * Injects SEO metadata, host-aware self-referencing canonical, BlogPosting + BreadcrumbList JSON-LD
 * (without FAQPage JSON-LD), and full pre-rendered article body HTML for /blog/:slug.
 */
export function injectBlogPostIntoHtml(
  templateHtml: string,
  post: any,
  wordCount: number,
  siteOrigin?: string
): string {
  const effectiveOrigin = (siteOrigin || SITE_URL).replace(/\/+$/, '');
  const canonicalUrl = `${effectiveOrigin}/blog/${post.slug}`;
  const pageTitle = post.seoTitle || `${post.title} | Royal Epic Interiors`;
  const metaDesc = post.metaDescription || post.excerpt || '';
  const ogImage =
    post.image && String(post.image).startsWith('http')
      ? post.image
      : `${effectiveOrigin}${post.image || '/images/indian-luxury-living-room.jpg'}`;

  let html = templateHtml;

  // 1. <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);

  // 2. <meta name="description">
  const metaDescTag = `<meta name="description" content="${escapeHtml(metaDesc)}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDescTag);
  } else {
    html = html.replace('</head>', `  ${metaDescTag}\n  </head>`);
  }

  // 3. Host-aware self-referencing canonical
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  // 4. Open Graph & Twitter tags
  const ogTags = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(metaDesc)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(metaDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  `;
  html = html
    .replace(/<meta\s+property=["']og:title["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:description["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:url["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:image["'][^>]*>/gi, '')
    .replace('</head>', `${ogTags}\n  </head>`);

  // 5. BlogPosting + BreadcrumbList JSON-LD (no automatic FAQPage JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${canonicalUrl}#article`,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        headline: post.title,
        description: metaDesc,
        image: [ogImage],
        datePublished: post.datePublishedIso || '2026-11-18',
        dateModified: post.dateModifiedIso || '2026-11-26',
        wordCount: wordCount || 1800,
        articleSection: post.category,
        inLanguage: 'en-IN',
        keywords: [post.primaryKeyword, ...(post.secondaryKeywords || [])]
          .filter(Boolean)
          .join(', '),
        author: {
          '@type': 'Organization',
          name: post.author || 'Royal Epic Interiors Editorial Team',
          url: `${effectiveOrigin}/`,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Royal Epic Interiors',
          url: `${effectiveOrigin}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${effectiveOrigin}/images/royal-epic-logo.png`,
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${effectiveOrigin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Design Journal',
            item: `${effectiveOrigin}/blog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  const jsonLdScript = `\n    <!-- Royal Epic BlogPosting Structured Data -->\n    <script type="application/ld+json" id="blog-post-schema">\n${JSON.stringify(structuredData, null, 2)}\n    </script>\n  `;
  html = html.replace('</head>', `${jsonLdScript}</head>`);

  // 6. Full pre-rendered semantic HTML inside <div id="root">
  const sectionsHtml = (Array.isArray(post.sections) ? post.sections : [])
    .map((sec: any) => {
      const paras = (sec.paragraphs || [])
        .map((p: string) => `<p style="line-height: 1.8; margin: 0 0 14px 0;">${escapeHtml(p)}</p>`)
        .join('');

      const subs = (sec.subSections || [])
        .map(
          (sub: any) => `
          <div style="margin: 18px 0; padding-left: 16px; border-left: 2px solid #D4AF37;">
            <h3 style="font-size: 19px; color: #0F291E; margin: 0 0 8px 0;">${escapeHtml(sub.heading)}</h3>
            ${(sub.paragraphs || []).map((sp: string) => `<p style="line-height: 1.75; margin: 0 0 10px 0;">${escapeHtml(sp)}</p>`).join('')}
            ${sub.bullets ? `<ul>${sub.bullets.map((b: string) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
          </div>
        `
        )
        .join('');

      const bullets = sec.bullets
        ? `<ul style="margin: 14px 0 18px 20px; line-height: 1.7;">${sec.bullets.map((b: string) => `<li style="margin-bottom: 6px;">${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';

      const tableHtml = sec.table
        ? `
          <div style="overflow-x: auto; margin: 20px 0;">
            ${sec.table.caption ? `<p style="font-weight: 700; color: #0F291E; margin-bottom: 8px;">${escapeHtml(sec.table.caption)}</p>` : ''}
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 14px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  ${(sec.table.headers || []).map((h: string) => `<th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">${escapeHtml(h)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${(sec.table.rows || [])
                  .map(
                    (row: string[]) =>
                      `<tr>${row.map((cell: string) => `<td style="border: 1px solid #d1d5db; padding: 10px;">${escapeHtml(cell)}</td>`).join('')}</tr>`
                  )
                  .join('')}
              </tbody>
            </table>
            ${sec.table.footnote || sec.table.note ? `<p style="font-size: 12px; color: #6b7280; font-style: italic; margin-top: 6px;">${escapeHtml(sec.table.footnote || sec.table.note)}</p>` : ''}
          </div>
        `
        : '';

      const checklistItems = sec.checklist?.items || sec.checklistItems || [];
      const checklistHtml =
        checklistItems.length > 0
          ? `
            <div style="background: #0F291E; color: #ffffff; padding: 20px; margin: 20px 0;">
              <h3 style="color: #D4AF37; margin: 0 0 10px 0;">${escapeHtml(sec.checklist?.title || 'Homeowner Checklist')}</h3>
              <ul>
                ${checklistItems.map((item: string) => `<li style="margin-bottom: 6px;">${escapeHtml(item)}</li>`).join('')}
              </ul>
            </div>
          `
          : '';

      const internalLinksHtml =
        sec.internalLinks && sec.internalLinks.length > 0
          ? `<div style="margin: 16px 0;">${sec.internalLinks
              .map(
                (l: any) =>
                  `<p><a href="${escapeHtml(l.url)}" style="color: #0F291E; font-weight: 700;">${escapeHtml(l.label)}</a>${l.context ? ` — ${escapeHtml(l.context)}` : ''}</p>`
              )
              .join('')}</div>`
          : '';

      return `
        <section id="${escapeHtml(sec.id)}" style="margin-bottom: 36px;">
          <h2 style="font-size: 26px; color: #0F291E; margin: 0 0 14px 0;">${escapeHtml(sec.heading)}</h2>
          ${paras}
          ${subs}
          ${bullets}
          ${tableHtml}
          ${checklistHtml}
          ${internalLinksHtml}
        </section>
      `;
    })
    .join('');

  const conclusionParagraphs = Array.isArray(post.conclusion)
    ? post.conclusion
    : post.conclusion?.paragraphs || [];
  const conclusionHtml =
    conclusionParagraphs.length > 0
      ? `
        <section id="article-conclusion" style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
          <h2 style="font-size: 24px; color: #0F291E;">${escapeHtml(post.conclusion?.heading || 'Final Thoughts & Homeowner Takeaways')}</h2>
          ${conclusionParagraphs.map((p: string) => `<p style="line-height: 1.8;">${escapeHtml(p)}</p>`).join('')}
        </section>
      `
      : '';

  const faqsHtml =
    Array.isArray(post.faqs) && post.faqs.length > 0
      ? `
        <section id="frequently-asked-questions" style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
          <h2 style="font-size: 24px; color: #0F291E; margin-bottom: 16px;">Frequently Asked Questions</h2>
          ${post.faqs
            .map(
              (f: any, idx: number) => `
              <div style="margin-bottom: 16px; padding: 16px; background: #FAF8F5; border: 1px solid #e5e7eb;">
                <h3 style="font-size: 17px; color: #0F291E; margin: 0 0 6px 0;">${idx + 1}. ${escapeHtml(f.question)}</h3>
                <p style="margin: 0; line-height: 1.75;">${escapeHtml(f.answer)}</p>
              </div>
            `
            )
            .join('')}
        </section>
      `
      : '';

  const relatedServicesHtml =
    Array.isArray(post.relatedServiceLinks) && post.relatedServiceLinks.length > 0
      ? `
        <section style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
          <h2 style="font-size: 22px; color: #0F291E;">Explore Royal Epic Interior Services</h2>
          <ul>
            ${post.relatedServiceLinks
              .map(
                (s: any) =>
                  `<li><a href="${escapeHtml(s.url || s.href || '/our-services')}">${escapeHtml(s.title || s.label)}</a> — ${escapeHtml(s.description || '')}</li>`
              )
              .join('')}
          </ul>
        </section>
      `
      : '';

  const preRenderedArticle = `
    <div id="root">
      <article style="min-height: 100vh; background-color: #FAF8F5; color: #1f2937; font-family: Georgia, serif;">
        <header style="background: #0F291E; color: #ffffff; padding: 48px 24px;">
          <div style="max-width: 960px; margin: 0 auto;">
            <nav aria-label="Breadcrumb" style="font-size: 12px; margin-bottom: 16px; color: #d1d5db;">
              <a href="/" style="color: #d1d5db; text-decoration: none;">Home</a> &gt;
              <a href="/blog" style="color: #d1d5db; text-decoration: none;">Design Journal</a> &gt;
              <span>${escapeHtml(post.category)}</span>
            </nav>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #D4AF37; font-weight: 700;">${escapeHtml(post.category)}</span>
            <h1 style="font-size: 36px; color: #ffffff; margin: 10px 0 14px 0; line-height: 1.2;">${escapeHtml(post.title)}</h1>
            <p style="font-size: 17px; color: #e5e7eb; line-height: 1.65;">${escapeHtml(post.excerpt)}</p>
            <div style="font-size: 12px; color: #d1d5db; margin-top: 16px;">
              By ${escapeHtml(post.author)} • ${escapeHtml(post.date)} • ${escapeHtml(post.readTime)} • ${wordCount} words
            </div>
          </div>
        </header>
        <div style="max-width: 960px; margin: 0 auto; padding: 36px 24px; background: #ffffff;">
          ${post.content ? `<p style="font-size: 18px; line-height: 1.8; margin-bottom: 28px;">${escapeHtml(post.content)}</p>` : ''}
          ${sectionsHtml}
          ${conclusionHtml}
          ${faqsHtml}
          ${relatedServicesHtml}
          <div style="margin-top: 32px; padding: 24px; background: #0F291E; color: #ffffff;">
            <h2 style="font-size: 22px; color: #D4AF37; margin: 0 0 8px 0;">${escapeHtml(post.ctaConfig?.heading || 'Planning Your Home Interiors?')}</h2>
            <p style="margin: 0 0 14px 0;">${escapeHtml(post.ctaConfig?.subtext || 'Connect with Royal Epic Interiors in Bengaluru for a structured layout review and transparent quotation.')}</p>
            <a href="/contact-us" style="color: #D4AF37; font-weight: 700;">Discuss Your Interior Requirements with Royal Epic →</a>
          </div>
        </div>
      </article>
    </div>
  `;

  html = html.replace('<div id="root"></div>', preRenderedArticle);
  return html;
}


