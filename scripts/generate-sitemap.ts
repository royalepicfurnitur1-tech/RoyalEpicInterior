import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEO_PAGES } from '../src/data/seoPages.ts';

const DOMAIN = 'https://royalepicfurniture.com';
const TODAY = new Date().toISOString().split('T')[0];

const categoryPriorityMap: Record<string, { priority: string; changefreq: string }> = {
  main: { priority: '0.85', changefreq: 'weekly' },
  service: { priority: '0.90', changefreq: 'weekly' },
  location: { priority: '0.85', changefreq: 'weekly' },
  blog: { priority: '0.80', changefreq: 'weekly' }
};

function generateSitemapXml() {
  const pages = Object.values(SEO_PAGES);

  const urlsXml = pages.map(page => {
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
  }).join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlsXml}
</urlset>`;

  const publicSitemapPath = path.resolve('public', 'sitemap.xml');
  fs.writeFileSync(publicSitemapPath, xmlContent, 'utf-8');
  console.log(`✅ Automated sitemap successfully generated at ${publicSitemapPath} (${pages.length} URLs indexable).`);

  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    const distSitemapPath = path.resolve('dist', 'sitemap.xml');
    fs.writeFileSync(distSitemapPath, xmlContent, 'utf-8');
    console.log(`✅ Synced sitemap to ${distSitemapPath}`);
  }
}

generateSitemapXml();
