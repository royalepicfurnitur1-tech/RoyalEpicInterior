// Hostinger Node.js Application Entry Point
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const target = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(target)) {
  const require = createRequire(import.meta.url);
  require(target);
} else {
  console.error('Error: dist/server.cjs not found. Please run "npm run build" first.');
  process.exit(1);
}
