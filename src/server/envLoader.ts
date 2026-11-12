/**
 * ==============================================================================
 * ROYAL EPIC INTERIORS — SERVER RUNTIME ENVIRONMENT LOADER
 * File: src/server/envLoader.ts
 *
 * Ensures server-side environment variables (especially SUPABASE_SERVICE_ROLE_KEY)
 * are authoritatively loaded from the runtime environment or .env files BEFORE
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
 * Finds all candidate .env file locations across the deployment directory hierarchy,
 * including Hostinger hbuilds version trees, domain roots, and public_html.
 */
export function getCandidateEnvPaths(): { searched: string[]; found: string[] } {
  const searched: string[] = [];
  const found: string[] = [];

  const addPath = (filePath: string) => {
    if (!filePath || searched.includes(filePath)) return;
    searched.push(filePath);
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        found.push(filePath);
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

    // Add tele.royalepicinterior.com locations
    const teleDomain = path.join(domainsDir, 'tele.royalepicinterior.com');
    for (const name of fileNames) {
      addPath(path.join(teleDomain, name));
      addPath(path.join(teleDomain, 'public_html', name));
      addPath(path.join(teleDomain, 'hbuilds', name));
    }
  }

  return { searched, found };
}

/**
 * Loads environment variables from all discovered .env locations
 * and normalizes the server-side runtime variables.
 */
export function ensureServerEnvLoaded(): void {
  const { found } = getCandidateEnvPaths();

  for (const envPath of found) {
    try {
      dotenv.config({ path: envPath });
    } catch (_) {}
  }

  // Standard fallback to default cwd
  try {
    dotenv.config();
  } catch (_) {}

  // Normalize SUPABASE_SERVICE_ROLE_KEY from process.env or aliases
  const rawServiceKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SERVICE_ROLE_KEY;

  const cleanedKey = cleanEnvVar(rawServiceKey);
  if (cleanedKey) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = cleanedKey;
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

// Immediately execute on module load so importing this module at the top of server.ts
// guarantees immediate environment availability before subsequent imports execute.
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
  const { searched, found } = getCandidateEnvPaths();

  // Extract Hostinger active domain from cwd
  const fullCwd = path.resolve(process.cwd());
  let detectedDomain = 'unknown';
  const domainMatch = fullCwd.match(/\/domains\/([^\/]+)/);
  if (domainMatch && domainMatch[1]) {
    detectedDomain = domainMatch[1];
  }

  return {
    serviceRoleKeyExists: isPresent,
    serviceRoleKeyNonEmpty: isPresent && keyLength > 0,
    serviceRoleKeyValidFormat: isValidLength,
    serviceRoleKeyLength: isPresent ? keyLength : 0,
    processId: process.pid,
    cwd: fullCwd,
    nodeEnv: process.env.NODE_ENV || 'development',
    supabaseUrlConfigured: Boolean(process.env.SUPABASE_URL),
    detectedHostingerDomain: detectedDomain,
    envFilesLoaded: found,
    candidatePathsSearchedCount: searched.length,
    sampleSearchedPaths: searched.slice(0, 8)
  };
}
