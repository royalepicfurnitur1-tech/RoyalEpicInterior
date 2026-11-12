// Hostinger Node.js Application Entry Point
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

process.env.APP_ENTRY_POINT = 'server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch (_) {}

const target = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(target)) {
  require(target);
} else {
  console.error('Error: dist/server.cjs not found. Please run "npm run build" first.');
  process.exit(1);
}
