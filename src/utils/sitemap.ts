export const SITE_URL = 'https://royalepicfurniture.com';

export interface SitemapRoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
}

export const SITEMAP_ROUTES: SitemapRoute[] = [
  // Main Pages
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/about-us', changefreq: 'monthly', priority: 0.8 },
  { path: '/contact-us', changefreq: 'monthly', priority: 0.8 },
  { path: '/portfolio', changefreq: 'weekly', priority: 0.9 },
  { path: '/completed-projects', changefreq: 'weekly', priority: 0.9 },
  { path: '/our-services', changefreq: 'weekly', priority: 0.9 },
  { path: '/get-free-quote', changefreq: 'weekly', priority: 0.9 },
  { path: '/customer-reviews', changefreq: 'weekly', priority: 0.8 },
  { path: '/faq', changefreq: 'monthly', priority: 0.7 },
  { path: '/blog', changefreq: 'weekly', priority: 0.8 },

  // Service Pages
  { path: '/home-interior-design-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/luxury-home-interiors-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/turnkey-interior-contractors-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/modular-kitchen-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/modular-wardrobe-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/living-room-interior-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/bedroom-interior-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/tv-unit-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/pooja-room-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/false-ceiling-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/office-interior-design-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/commercial-interior-design-bangalore', changefreq: 'weekly', priority: 0.9 },
  { path: '/restaurant-interior-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/retail-shop-interior-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/hospital-interior-design', changefreq: 'weekly', priority: 0.8 },
  { path: '/painting-services-bangalore', changefreq: 'weekly', priority: 0.7 },
  { path: '/custom-furniture-manufacturer', changefreq: 'weekly', priority: 0.8 },
  { path: '/wooden-furniture-bangalore', changefreq: 'weekly', priority: 0.8 },

  // Location Pages
  { path: '/interior-designer-whitefield', changefreq: 'weekly', priority: 0.9 },
  { path: '/interior-designer-jp-nagar', changefreq: 'weekly', priority: 0.8 },
  { path: '/interior-designer-hsr-layout', changefreq: 'weekly', priority: 0.8 },
  { path: '/interior-designer-electronic-city', changefreq: 'weekly', priority: 0.8 },
  { path: '/interior-designer-yelahanka', changefreq: 'weekly', priority: 0.8 },
  { path: '/interior-designer-hebbal', changefreq: 'weekly', priority: 0.8 },
  { path: '/interior-designer-koramangala', changefreq: 'weekly', priority: 0.9 },
  { path: '/interior-designer-marathahalli', changefreq: 'weekly', priority: 0.8 },
  { path: '/interior-designer-indiranagar', changefreq: 'weekly', priority: 0.9 },
  { path: '/interior-designer-thanisandra', changefreq: 'weekly', priority: 0.9 },

  // Blog Pages
  { path: '/modular-kitchen-cost-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/home-interior-cost-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/2bhk-interior-cost-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/3bhk-interior-cost-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/villa-interior-design-guide', changefreq: 'weekly', priority: 0.8 },
  { path: '/best-interior-design-company-bangalore', changefreq: 'weekly', priority: 0.8 },
  { path: '/latest-home-interior-trends', changefreq: 'weekly', priority: 0.7 },
  { path: '/wardrobe-design-ideas', changefreq: 'weekly', priority: 0.7 },
  { path: '/false-ceiling-design-ideas', changefreq: 'weekly', priority: 0.7 },
];

export function generateSitemapXml(): string {
  const today = new Date().toISOString().split('T')[0];
  const urlNodes = SITEMAP_ROUTES.map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>`;
}

export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}
