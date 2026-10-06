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
            'You have the right to review, update, or request the deletion of your personal contact records at any time. For privacy inquiries, please contact our Data Protection Officer at enquiry@royalepicinterior.com or call +91 99166 33338.'
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
            'Royal Epic provides up to a 10-Year Factory Warranty covering structural wood integrity, anti-termite treatment, and mechanical hardware (such as soft-close drawer slides and hydraulic hinges) under normal residential use.',
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
            'Every shipment is 100% insured against transit damage. If damage occurs, contact our support team at +91 99166 33338 within 48 hours for immediate replacement.'
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
            'Notify us within 48 hours of delivery by calling +91 99166 33338 or emailing enquiry@royalepicinterior.com with clear photos of the issue.',
            'We will arrange a priority free pickup and dispatch a brand-new factory replacement at zero additional expense to you.',
            'If a replacement is not available or desired, you will receive a 100% full refund including any delivery charges paid.'
          ]
        },
        {
          heading: '3. Custom & Bespoke Orders Policy',
          paragraphs: [
            'For custom-made architectural elements, personalized dining tables with custom-cut marble, bespoke modular kitchens, and custom-upholstered sofas manufactured to non-standard customer dimensions:',
            'Because these items are manufactured to your unique specifications, returns based solely on change of mind are not accepted after factory fabrication has commenced.',
            'However, our 10-Year Factory Guarantee applies in full: any structural defect, hardware malfunction, or transit damage is repaired or replaced free of charge.'
          ]
        },
        {
          heading: '4. How to Initiate a Return',
          paragraphs: [
            'Initiating a return is simple and straightforward:'
          ],
          bullets: [
            'Step 1: Contact our support team via email (enquiry@royalepicinterior.com) or WhatsApp/Phone (+91 99166 33338) with your Order ID and reason for return.',
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
            <p style="margin: 0;"><strong>Company:</strong> Royal Epic Interior &amp; Furniture Ltd.</p>
            <p style="margin: 0;"><strong>Factory &amp; Studio Address:</strong> No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru, Karnataka 560077</p>
            <p style="margin: 0;"><strong>Official Phone:</strong> +91 99166 33338 / +91 96063 56839</p>
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
    const img = p.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column;">
        <a href="/products/${slug}" style="text-decoration: none; color: inherit;">
          <img src="${img}" alt="${escapeHtml(p.name)}" style="width: 100%; height: 200px; object-fit: cover;" loading="lazy" />
          <div style="padding: 16px;">
            <span style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase;">${escapeHtml(p.category || 'Luxury Furniture')}</span>
            <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 4px 0 8px 0; line-height: 1.3;">${escapeHtml(p.name)}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
              <span style="font-size: 16px; font-weight: 700; color: #b45309;">₹${price.toLocaleString('en-IN')} INR</span>
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
        <section style="background: #fdfaf6; border-bottom: 1px solid #f3ebe1; padding: 48px 24px;">
          <div style="max-width: 1280px; margin: 0 auto;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #b45309; display: block; margin-bottom: 8px;">
              Manufacturing Excellence • Thanisandra, Bengaluru
            </span>
            <h1 style="font-size: 38px; font-weight: 800; color: #111827; margin: 0 0 16px 0; line-height: 1.2;">
              Luxury Turnkey Interiors, Modular Kitchens &amp; Handcrafted Furniture
            </h1>
            <p style="font-size: 17px; line-height: 1.6; color: #4b5563; max-width: 800px; margin: 0 0 24px 0;">
              Royal Epic Interior &amp; Furniture operates an advanced manufacturing facility and interior design studio in Bengaluru. We specialize in precision modular kitchens, luxury sliding wardrobes, solid onyx &amp; marble dining tables, acoustic sound-absorbing wall panels, and factory-tested WPC waterproof doors.
            </p>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <a href="/products" style="background: #b45309; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">
                Explore 85+ Factory Products
              </a>
              <a href="/contact-us" style="background: #ffffff; color: #111827; border: 1px solid #d1d5db; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">
                Consult an Architect (+91 99166 33338)
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
              <h4 style="color: #ffffff; font-size: 15px; margin: 0 0 12px 0;">Royal Epic Interior &amp; Furniture Ltd.</h4>
              <p style="line-height: 1.6; margin: 0 0 8px 0;">Factory &amp; Studio: No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru, Karnataka 560077</p>
              <p style="margin: 0 0 4px 0;">Phone: <strong style="color: #ffffff;">+91 99166 33338</strong> / +91 96063 56839</p>
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
              <p style="line-height: 1.6; margin: 0 0 8px 0;">● 10-Year Factory Warranty on Solid Wood &amp; Hardware</p>
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
    const img = p.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column;">
        <a href="/products/${slug}" style="text-decoration: none; color: inherit;">
          <img src="${img}" alt="${escapeHtml(p.name)}" style="width: 100%; height: 220px; object-fit: cover;" loading="lazy" />
          <div style="padding: 16px;">
            <span style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase;">${escapeHtml(p.category || 'Luxury Furniture')}</span>
            <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 4px 0 8px 0; line-height: 1.3;">${escapeHtml(p.name)}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
              <span style="font-size: 16px; font-weight: 700; color: #b45309;">₹${price.toLocaleString('en-IN')} INR</span>
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
            Browse our complete collection of bespoke dining tables, designer sofas, modular sliding wardrobes, TV entertainment consoles, acoustic panels, and solid WPC waterproof doors manufactured in Bengaluru. All products are backed by our 10-year factory warranty.
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
            <p style="margin: 0;"><strong>Custom Requirements?</strong> Need bespoke dimensions, rare Italian marble, or customized upholstery? Visit our studio at Rachenahalli, Thanisandra, Bengaluru or call <strong>+91 99166 33338</strong> for architectural consultations.</p>
          </div>
        </div>
      </main>
    </div>
  `;

  return html.replace('<div id="root"></div>', preRenderedCatalog);
}
