/**
 * ==============================================================================
 * ROYAL EPIC INTERIORS — SERVER RUNTIME ENVIRONMENT LOADER
 * File: src/server/envLoader.ts
 *
 * Ensures server-side environment variables (especially SUPABASE_SERVICE_ROLE_KEY)
 * are authoritatively loaded from the runtime environment, Hostinger process.env,
 * .htaccess directives (PassengerEnvVar/SetEnv), or .env files BEFORE
 * any server routes, CRM modules, or Supabase clients are initialized.
 *
 * SAFETY GUARANTEES:
 * 1. Reads SUPABASE_SERVICE_ROLE_KEY directly from the server-side environment.
 * 2. Never uses or checks VITE_SUPABASE_SERVICE_ROLE_KEY.
 * 3. Never prints the key, partial key, or secret contents in logs or responses.
 * 4. Resolves across all possible Hostinger directory layouts (hbuilds, cwd,
 *    domain root, public_html, sibling subdomains, user home).
 * 5. Sanitizes quotes, trailing \r, and whitespace from pasted keys.
 * ==============================================================================
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

let detectedKeySource: 'process.env' | '.env' | '.htaccess' | 'none' = 'none';

/**
 * Sanitizes an environment variable value by trimming whitespace and
 * removing surrounding single or double quotes if present.
 */
export function cleanEnvVar(val: string | undefined): string | undefined {
  if (!val) return undefined;
  let s = val.trim();
  // Strip carriage returns and newlines
  s = s.replace(/[\r\n]+/g, '').trim();
  // Strip surrounding quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s.length > 0 ? s : undefined;
}

/**
 * Parses .htaccess files for directives that Hostinger / Passenger / Apache write:
 * - PassengerEnvVar KEY VALUE
 * - SetEnv KEY VALUE
 */
export function extractEnvFromHtaccess(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return result;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const match = line.match(/^(?:PassengerEnvVar|SetEnv)\s+([A-Za-z0-9_]+)\s+["']?([^"'\r\n]+)["']?/i);
      if (match) {
        const key = match[1].trim();
        const val = cleanEnvVar(match[2]);
        if (key && val) {
          result[key] = val;
        }
      }
    }
  } catch (_) {}
  return result;
}

/**
 * Finds all candidate .env and .htaccess file locations across the deployment directory hierarchy,
 * including Hostinger hbuilds version trees, domain roots, and public_html.
 */
export function getCandidateEnvPaths(): { searched: string[]; found: string[]; htaccessFound: string[] } {
  const searched: string[] = [];
  const found: string[] = [];
  const htaccessFound: string[] = [];

  const addPath = (filePath: string) => {
    if (!filePath || searched.includes(filePath)) return;
    searched.push(filePath);
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        found.push(filePath);
      }
    } catch (_) {}
  };

  const addHtaccess = (filePath: string) => {
    if (!filePath) return;
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        if (!htaccessFound.includes(filePath)) htaccessFound.push(filePath);
      }
    } catch (_) {}
  };

  const fileNames = ['.env', '.env.production', '.env.local'];

  // 1. Walk up from process.cwd() (handles hbuilds deep nesting up to 8 levels)
  let curr = path.resolve(process.cwd());
  for (let i = 0; i < 8; i++) {
    for (const name of fileNames) {
      addPath(path.join(curr, name));
      addPath(path.join(curr, 'public_html', name));
    }
    addHtaccess(path.join(curr, '.htaccess'));
    addHtaccess(path.join(curr, 'public_html', '.htaccess'));
    const parent = path.dirname(curr);
    if (!parent || parent === curr) break;
    curr = parent;
  }

  // 2. Walk up from __dirname if available
  if (typeof __dirname !== 'undefined') {
    let d = path.resolve(__dirname);
    for (let i = 0; i < 8; i++) {
      for (const name of fileNames) {
        addPath(path.join(d, name));
        addPath(path.join(d, 'public_html', name));
      }
      addHtaccess(path.join(d, '.htaccess'));
      addHtaccess(path.join(d, 'public_html', '.htaccess'));
      const parent = path.dirname(d);
      if (!parent || parent === d) break;
      d = parent;
    }
  }

  // 3. Inspect Hostinger domains folder specifically if detected in path
  const fullCwd = path.resolve(process.cwd());
  const domainsIdx = fullCwd.indexOf('/domains/');
  if (domainsIdx !== -1) {
    const userRoot = fullCwd.substring(0, domainsIdx);
    const domainsDir = path.join(userRoot, 'domains');

    // Add user home .env (/home/u943712954/.env)
    for (const name of fileNames) {
      addPath(path.join(userRoot, name));
    }

    // Add royalepicinterior.com locations
    const mainDomain = path.join(domainsDir, 'royalepicinterior.com');
    for (const name of fileNames) {
      addPath(path.join(mainDomain, name));
      addPath(path.join(mainDomain, 'public_html', name));
      addPath(path.join(mainDomain, 'hbuilds', name));
    }
    addHtaccess(path.join(mainDomain, '.htaccess'));
    addHtaccess(path.join(mainDomain, 'public_html', '.htaccess'));

    // Add tele.royalepicinterior.com locations
    const teleDomain = path.join(domainsDir, 'tele.royalepicinterior.com');
    for (const name of fileNames) {
      addPath(path.join(teleDomain, name));
      addPath(path.join(teleDomain, 'public_html', name));
      addPath(path.join(teleDomain, 'hbuilds', name));
    }
    addHtaccess(path.join(teleDomain, '.htaccess'));
    addHtaccess(path.join(teleDomain, 'public_html', '.htaccess'));
  }

  return { searched, found, htaccessFound };
}

/**
 * Loads environment variables from all discovered sources:
 * 1. process.env (Hostinger injected variables with case/whitespace insensitivity)
 * 2. .env files across all hierarchy levels
 * 3. .htaccess PassengerEnvVar/SetEnv directives written by Hostinger
 */
export function ensureServerEnvLoaded(): void {
  // Step 1: Check if already present directly in process.env (with case & whitespace insensitivity)
  for (const [k, v] of Object.entries(process.env)) {
    const normalized = k.trim().toUpperCase();
    if (
      normalized === 'SUPABASE_SERVICE_ROLE_KEY' ||
      normalized === 'SUPABASE_SERVICE_KEY' ||
      normalized === 'SUPABASE_SECRET_KEY' ||
      normalized === 'SERVICE_ROLE_KEY'
    ) {
      const cleaned = cleanEnvVar(v);
      if (cleaned && cleaned.length > 20 && !cleaned.includes('YOUR_')) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = cleaned;
        detectedKeySource = 'process.env';
      }
    }
  }

  // Step 2: Load candidate .env files
  const { found, htaccessFound } = getCandidateEnvPaths();

  for (const envPath of found) {
    try {
      dotenv.config({ path: envPath });
    } catch (_) {}
  }

  try {
    dotenv.config();
  } catch (_) {}

  // Step 3: Parse .htaccess files if key is still missing
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.length < 20) {
    for (const htPath of htaccessFound) {
      const parsed = extractEnvFromHtaccess(htPath);
      for (const [k, v] of Object.entries(parsed)) {
        const normalized = k.trim().toUpperCase();
        if (
          normalized === 'SUPABASE_SERVICE_ROLE_KEY' ||
          normalized === 'SUPABASE_SERVICE_KEY' ||
          normalized === 'SUPABASE_SECRET_KEY' ||
          normalized === 'SERVICE_ROLE_KEY'
        ) {
          if (v && v.length > 20 && !v.includes('YOUR_')) {
            process.env.SUPABASE_SERVICE_ROLE_KEY = v;
            detectedKeySource = '.htaccess';
            break;
          }
        }
      }
      if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20) {
        break;
      }
    }
  }

  // Re-check process.env
  const rawServiceKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SERVICE_ROLE_KEY;

  const cleanedKey = cleanEnvVar(rawServiceKey);
  if (cleanedKey && cleanedKey.length > 20) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = cleanedKey;
    if (detectedKeySource === 'none') {
      detectedKeySource = '.env';
    }
  }

  // Normalize SUPABASE_URL
  const rawUrl = 
    process.env.SUPABASE_URL || 
    process.env.VITE_SUPABASE_URL || 
    'https://lwrfoztfsyffgtybesia.supabase.co';
  const cleanedUrl = cleanEnvVar(rawUrl);
  if (cleanedUrl) {
    process.env.SUPABASE_URL = cleanedUrl.replace(/\/+$/, '');
  }
}

// Immediately execute on module load
ensureServerEnvLoaded();

/**
 * Safe diagnostic status inspector.
 * Never exposes key characters or secrets.
 */
export function getSafeEnvDiagnostics() {
  ensureServerEnvLoaded();

  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isPresent = Boolean(rawKey && rawKey.trim().length > 0);
  const keyLength = rawKey ? rawKey.trim().length : 0;
  const isValidLength = keyLength > 20 && !rawKey?.includes('YOUR_');
  const { searched, found, htaccessFound } = getCandidateEnvPaths();

  // Extract Hostinger active domain from cwd
  const fullCwd = path.resolve(process.cwd());
  let detectedDomain = 'unknown';
  const domainMatch = fullCwd.match(/\/domains\/([^\/]+)/);
  if (domainMatch && domainMatch[1]) {
    detectedDomain = domainMatch[1];
  }

  // Safe list of environment variable KEYS only (strictly NO values)
  const allEnvKeys = Object.keys(process.env).sort();

  return {
    serviceRoleKeyExists: isPresent,
    serviceRoleKeyNonEmpty: isPresent && keyLength > 0,
    serviceRoleKeyValidFormat: isValidLength,
    serviceRoleKeyLength: isPresent ? keyLength : 0,
    serviceRoleKeySource: isPresent ? detectedKeySource : 'none',
    processId: process.pid,
    processParentId: process.ppid,
    processUptimeSeconds: Math.round(process.uptime()),
    processStartedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    entryPoint: process.argv.join(' '),
    execPath: process.execPath,
    nodeVersion: process.version,
    cwd: fullCwd,
    nodeEnv: process.env.NODE_ENV || 'development',
    supabaseUrlConfigured: Boolean(process.env.SUPABASE_URL),
    detectedHostingerDomain: detectedDomain,
    envFilesLoaded: found,
    htaccessFilesFound: htaccessFound,
    candidatePathsSearchedCount: searched.length,
    allEnvKeysInProcess: allEnvKeys
  };
}
