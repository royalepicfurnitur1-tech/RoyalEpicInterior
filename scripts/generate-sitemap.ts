import fs from 'fs';
import path from 'path';
import { SEO_PAGES } from '../src/data/seoPages.ts';
import { PRODUCTS_DATA } from '../src/data/mockData.ts';

const DOMAIN = 'https://royalepicinterior.com';
const TODAY = new Date().toISOString().split('T')[0];

const categoryPriorityMap: Record<string, { priority: string; changefreq: string }> = {
  main: { priority: '0.85', changefreq: 'weekly' },
  service: { priority: '0.90', changefreq: 'weekly' },
  location: { priority: '0.85', changefreq: 'weekly' },
  blog: { priority: '0.80', changefreq: 'weekly' }
};

const PRODUCT_CATEGORIES = [
  'main-entrance-doors',
  'wpc-bathroom-doors',
  'modular-kitchens',
  'sliding-wardrobes',
  'tv-units',
  'sofas',
  'dining-tables',
  'commercial-furniture',
  'kitchen-equipment',
  'glass-partitions'
];

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function generateSitemapXml() {
  const pages = Object.values(SEO_PAGES);

  // 1. Core SEO Pages
  const pageXmlNodes = pages.map(page => {
    const isHome = page.slug === '/';
    const cleanSlug = isHome ? '' : (page.slug.startsWith('/') ? page.slug : `/${page.slug}`);
    const loc = `${DOMAIN}${cleanSlug}`;

    let priority = isHome ? '1.0' : (categoryPriorityMap[page.category]?.priority || '0.80');
    let changefreq = isHome ? 'daily' : (categoryPriorityMap[page.category]?.changefreq || 'weekly');

    if (page.slug === '/get-free-quote') {
      priority = '0.95';
    }

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  // 2. Products Hub Page
  const productsHubXml = `  <url>
    <loc>${DOMAIN}/products</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
  </url>`;

  // 3. Product Categories
  const categoryXmlNodes = PRODUCT_CATEGORIES.map(catSlug => {
    return `  <url>
    <loc>${DOMAIN}/products/${catSlug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`;
  });

  // 4. Individual Product Pages
  const productXmlNodes = PRODUCTS_DATA.map(product => {
    const slug = slugify(product.name);
    return `  <url>
    <loc>${DOMAIN}/products/${slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`;
  });

  const allUrls = [
    ...pageXmlNodes,
    productsHubXml,
    ...categoryXmlNodes,
    ...productXmlNodes
  ].join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls}
</urlset>`;

  const publicSitemapPath = path.resolve('public', 'sitemap.xml');
  fs.writeFileSync(publicSitemapPath, xmlContent, 'utf-8');
  console.log(`✅ Automated sitemap successfully generated at ${publicSitemapPath} (${pages.length + 1 + PRODUCT_CATEGORIES.length + PRODUCTS_DATA.length} URLs indexable).`);

  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    const distSitemapPath = path.resolve('dist', 'sitemap.xml');
    fs.writeFileSync(distSitemapPath, xmlContent, 'utf-8');
    console.log(`✅ Synced sitemap to ${distSitemapPath}`);
  }
}

generateSitemapXml();
