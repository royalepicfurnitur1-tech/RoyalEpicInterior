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
 * 4. Resolves across all possible Hostinger directory layouts (cwd, __dirname, ..).
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
 * Finds all candidate .env file locations across the deployment directory hierarchy.
 */
export function getCandidateEnvPaths(): string[] {
  const candidates: string[] = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env.production'),
    path.resolve(process.cwd(), '..', '.env')
  ];

  if (typeof __dirname !== 'undefined') {
    candidates.push(
      path.resolve(__dirname, '.env'),
      path.resolve(__dirname, '..', '.env'),
      path.resolve(__dirname, '..', '.env.production'),
      path.resolve(__dirname, '..', '.env.local'),
      path.resolve(__dirname, '..', '..', '.env')
    );
  }

  // Deduplicate and filter to existing files
  const existing = Array.from(new Set(candidates)).filter(p => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isFile();
    } catch {
      return false;
    }
  });

  return existing;
}

/**
 * Loads environment variables from all discovered .env locations
 * and normalizes the server-side runtime variables.
 */
export function ensureServerEnvLoaded(): void {
  const existingFiles = getCandidateEnvPaths();

  for (const envPath of existingFiles) {
    try {
      dotenv.config({ path: envPath });
    } catch (_) {}
  }

  // Standard fallback to default cwd
  try {
    dotenv.config();
  } catch (_) {}

  // Normalize SUPABASE_SERVICE_ROLE_KEY
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
  const envFilesFound = getCandidateEnvPaths();

  return {
    serviceRoleKeyExists: isPresent,
    serviceRoleKeyNonEmpty: isPresent && keyLength > 0,
    serviceRoleKeyValidFormat: isValidLength,
    serviceRoleKeyLength: isPresent ? keyLength : 0,
    processId: process.pid,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV || 'development',
    supabaseUrlConfigured: Boolean(process.env.SUPABASE_URL),
    envFilesLoaded: envFilesFound.map(f => path.basename(f))
  };
}
