import { PRODUCTS_DATA } from '../data/mockData';
import { getProductSlug } from './productSlug';

export const SITE_URL = 'https://royalepicinterior.com';

export interface SitemapRoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
}

export const SITEMAP_ROUTES: SitemapRoute[] = [
  // Main Navigation & Core Public Pages
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/our-services', changefreq: 'weekly', priority: 0.95 },
  { path: '/products', changefreq: 'daily', priority: 0.95 },
  { path: '/portfolio', changefreq: 'weekly', priority: 0.9 },
  { path: '/completed-projects', changefreq: 'weekly', priority: 0.9 },
  { path: '/blog', changefreq: 'weekly', priority: 0.85 },
  { path: '/about-us', changefreq: 'monthly', priority: 0.8 },
  { path: '/contact-us', changefreq: 'monthly', priority: 0.8 },
  { path: '/get-free-quote', changefreq: 'weekly', priority: 0.95 },
  { path: '/customer-reviews', changefreq: 'weekly', priority: 0.8 },
  { path: '/faq', changefreq: 'monthly', priority: 0.7 },
  { path: '/track-order', changefreq: 'weekly', priority: 0.8 },

  // Product Category Pages
  { path: '/products/main-entrance-doors', changefreq: 'weekly', priority: 0.85 },
  { path: '/products/wpc-bathroom-doors', changefreq: 'weekly', priority: 0.85 },
  { path: '/products/modular-kitchens', changefreq: 'weekly', priority: 0.9 },
  { path: '/products/sliding-wardrobes', changefreq: 'weekly', priority: 0.85 },
  { path: '/products/tv-units', changefreq: 'weekly', priority: 0.8 },
  { path: '/products/sofas', changefreq: 'weekly', priority: 0.8 },
  { path: '/products/dining-tables', changefreq: 'weekly', priority: 0.8 },
  { path: '/products/commercial-furniture', changefreq: 'weekly', priority: 0.85 },
  { path: '/products/kitchen-equipment', changefreq: 'weekly', priority: 0.85 },
  { path: '/products/glass-partitions', changefreq: 'weekly', priority: 0.8 },

  // Dedicated Service Pages
  { path: '/home-interior-design-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/luxury-home-interiors-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/turnkey-interior-contractors-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/modular-kitchen-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/modular-wardrobe-bangalore', changefreq: 'weekly', priority: 0.85 },
  { path: '/living-room-interior-design', changefreq: 'weekly', priority: 0.85 },
  { path: '/bedroom-interior-design', changefreq: 'weekly', priority: 0.85 },
  { path: '/tv-unit-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/pooja-room-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/false-ceiling-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/office-interior-design-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/commercial-interior-design-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/restaurant-interior-design', changefreq: 'weekly', priority: 0.85 },
  { path: '/retail-shop-interior-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/hospital-interior-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/painting-services-bangalore', changefreq: 'weekly', priority: 0.75 },
  { path: '/custom-furniture-manufacturer', changefreq: 'weekly', priority: 0.85 },
  { path: '/wooden-furniture-bangalore', changefreq: 'weekly', priority: 0.85 },

  // Location-based Pages
  { path: '/interior-designer-whitefield', changefreq: 'weekly', priority: 0.85 },
  { path: '/interior-designer-jp-nagar', changefreq: 'weekly', priority: 0.85 },
  { path: '/interior-designer-hsr-layout', changefreq: 'weekly', priority: 0.85 },
  { path: '/interior-designer-electronic-city', changefreq: 'weekly', priority: 0.85 },
  { path: '/interior-designer-yelahanka', changefreq: 'weekly', priority: 0.85 },
  { path: '/interior-designer-hebbal', changefreq: 'weekly', priority: 0.85 },
  { path: '/interior-designer-koramangala', changefreq: 'weekly', priority: 0.85 },
  { path: '/interior-designer-marathahalli', changefreq: 'weekly', priority: 0.85 },
  { path: '/interior-designer-indiranagar', changefreq: 'weekly', priority: 0.85 },
  { path: '/interior-designer-thanisandra', changefreq: 'weekly', priority: 0.9 },

  // Informational Guides & Blog Pages
  { path: '/modular-kitchen-cost-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/home-interior-cost-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/2bhk-interior-cost-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/3bhk-interior-cost-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/villa-interior-design-guide', changefreq: 'weekly', priority: 0.8 },
  { path: '/best-interior-design-company-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/latest-home-interior-trends', changefreq: 'weekly', priority: 0.75 },
  { path: '/wardrobe-design-ideas', changefreq: 'weekly', priority: 0.75 },
  { path: '/false-ceiling-design-ideas', changefreq: 'weekly', priority: 0.75 }
];

export function generateSitemapXml(): string {
  const today = new Date().toISOString().split('T')[0];

  // Base routes
  const baseNodes = SITEMAP_ROUTES.map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(2)}</priority>
  </url>`
  );

  // Individual product URLs
  const productNodes = PRODUCTS_DATA.map((product) => {
    const slug = getProductSlug(product);
    return `  <url>
    <loc>${SITE_URL}/products/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`;
  });

  const allNodes = [...baseNodes, ...productNodes].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allNodes}
</urlset>`;
}

export function generateRobotsTxt(): string {
  return `# Robots.txt for Royal Epic Interior & Furniture (https://royalepicinterior.com)
User-agent: *
Allow: /
Allow: /products
Allow: /products/*
Allow: /our-services
Allow: /portfolio
Allow: /completed-projects
Allow: /blog
Allow: /about-us
Allow: /contact-us
Allow: /get-free-quote
Allow: /customer-reviews
Allow: /faq
Allow: /track-order

# Disallow private administrative & user dashboard paths from search engine indexing
Disallow: /admin
Disallow: /developer
Disallow: /dev
Disallow: /customer-dashboard
Disallow: /customers
Disallow: /product-manager
Disallow: /product-management
Disallow: /products-hub
Disallow: /api/

# Sitemap location for Search Engine Crawlers
Sitemap: ${SITE_URL}/sitemap.xml
`;
}
