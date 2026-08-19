import fs from 'fs';
import path from 'path';
import { generateSitemapXml, generateRobotsTxt } from '../src/utils/sitemap.ts';

function buildSitemapAndRobots() {
  const xmlContent = generateSitemapXml();
  const robotsContent = generateRobotsTxt();

  // 1. Write to public/ directory
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const publicSitemapPath = path.resolve(publicDir, 'sitemap.xml');
  const publicRobotsPath = path.resolve(publicDir, 'robots.txt');

  fs.writeFileSync(publicSitemapPath, xmlContent, 'utf-8');
  fs.writeFileSync(publicRobotsPath, robotsContent, 'utf-8');
  console.log(`✅ Automated sitemap successfully generated at ${publicSitemapPath}`);
  console.log(`✅ Automated robots.txt successfully generated at ${publicRobotsPath}`);

  // 2. Sync to dist/ if built
  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    const distSitemapPath = path.resolve(distDir, 'sitemap.xml');
    const distRobotsPath = path.resolve(distDir, 'robots.txt');
    fs.writeFileSync(distSitemapPath, xmlContent, 'utf-8');
    fs.writeFileSync(distRobotsPath, robotsContent, 'utf-8');
    console.log(`✅ Synced sitemap & robots to ${distDir}`);
  }
}

buildSitemapAndRobots();

