/**
 * ==============================================================================
 * ROYAL EPIC INTERIORS — CRM CALL LOGS SAFE BACKFILL SCRIPT
 * Subdomain: https://tele.royalepicinterior.com/
 * File: scripts/backfill_call_logs.ts
 *
 * PURPOSE:
 * Safely backfills historical call logs from local JSON storage:
 * - data/crm_calls.json
 * - data/crm_calls_archived.json
 * into the Supabase PostgreSQL table: public.crm_call_logs.
 *
 * SAFETY & INTEGRITY GUARANTEES:
 * 1. Non-destructive: Does NOT delete or alter local JSON call records.
 * 2. Deduplication: Checks existing call IDs in Supabase before inserting.
 * 3. Orphan Retention Strategy: Call logs whose lead_id does NOT exist in
 *    public.leads_and_inquiries are NEVER discarded; they are saved to
 *    data/crm_calls_orphaned.json and retained in data/crm_calls_archived.json.
 * 4. Categorized Reporting: Separately reports imported, skipped, and failed records.
 *
 * EXECUTION INSTRUCTIONS:
 * Run manually in the terminal when ready:
 *   npx tsx scripts/backfill_call_logs.ts
 * ==============================================================================
 */

import '../src/server/envLoader';
import fs from 'fs';
import path from 'path';
import { cleanEnvVar, ensureServerEnvLoaded } from '../src/server/envLoader';

interface CallRecord {
  id: string;
  lead_id: string;
  call_date: string;
  outcome: string;
  notes?: string;
  followup_date?: string;
  logged_by?: string;
  logged_by_name?: string;
  duration_seconds?: number;
  created_at?: string;
  [key: string]: any;
}

interface BackfillReport {
  totalEvaluated: number;
  imported: { id: string; lead_id: string; outcome: string }[];
  skippedDuplicate: { id: string; lead_id: string; reason: string }[];
  skippedOrphaned: { id: string; lead_id: string; reason: string }[];
  failed: { id: string; lead_id: string; error: string }[];
}

const getSupabaseCredentials = () => {
  ensureServerEnvLoaded();
  const url = (
    cleanEnvVar(process.env.SUPABASE_URL) || 
    cleanEnvVar(process.env.VITE_SUPABASE_URL) || 
    'https://lwrfoztfsyffgtybesia.supabase.co'
  ).replace(/\/+$/, '');

  const rawKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SERVICE_ROLE_KEY;

  const key = cleanEnvVar(rawKey);
  if (!key || key.length < 20 || key.includes('YOUR_')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required to backfill call logs into public.crm_call_logs.\n' +
      'In accordance with database security policy, crm_call_logs is restricted exclusively to the service_role.\n' +
      'Please configure SUPABASE_SERVICE_ROLE_KEY in your Hostinger environment before running this script.'
    );
  }
  return { url, key };
};

export async function runCallLogsBackfill(): Promise<BackfillReport> {
  const { url, key } = getSupabaseCredentials();
  const crmCallsPath = path.resolve('data/crm_calls.json');
  const crmCallsArchivedPath = path.resolve('data/crm_calls_archived.json');
  const crmCallsOrphanedPath = path.resolve('data/crm_calls_orphaned.json');

  const report: BackfillReport = {
    totalEvaluated: 0,
    imported: [],
    skippedDuplicate: [],
    skippedOrphaned: [],
    failed: []
  };

  // 1. Load local call records
  const activeCalls: CallRecord[] = fs.existsSync(crmCallsPath) 
    ? JSON.parse(fs.readFileSync(crmCallsPath, 'utf8') || '[]') 
    : [];
  const archivedCalls: CallRecord[] = fs.existsSync(crmCallsArchivedPath) 
    ? JSON.parse(fs.readFileSync(crmCallsArchivedPath, 'utf8') || '[]') 
    : [];

  const allCallsMap = new Map<string, CallRecord>();
  for (const c of [...activeCalls, ...archivedCalls]) {
    if (c && c.id && !allCallsMap.has(c.id)) {
      allCallsMap.set(c.id, c);
    }
  }

  const callsToProcess = Array.from(allCallsMap.values());
  report.totalEvaluated = callsToProcess.length;

  if (callsToProcess.length === 0) {
    console.log('ℹ️ No local call records found to backfill.');
    return report;
  }

  // 2. Fetch existing lead IDs from public.leads_and_inquiries (to validate foreign-key relationships)
  console.log('🔍 Validating parent leads from Supabase...');
  const leadsRes = await fetch(`${url}/rest/v1/leads_and_inquiries?select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });

  if (!leadsRes.ok) {
    throw new Error(`Failed to query leads_and_inquiries: HTTP ${leadsRes.status}`);
  }

  const existingLeads = await leadsRes.json();
  const validLeadIds = new Set<string>((existingLeads || []).map((l: any) => l.id));
  console.log(`✅ Found ${validLeadIds.size} valid parent leads in Supabase.`);

  // 3. Fetch existing call IDs from public.crm_call_logs (to avoid duplicate inserts)
  console.log('🔍 Checking existing call logs in Supabase...');
  const callsRes = await fetch(`${url}/rest/v1/crm_call_logs?select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });

  const existingSupabaseCallIds = new Set<string>();
  if (callsRes.ok) {
    const existingCalls = await callsRes.json();
    (existingCalls || []).forEach((c: any) => existingSupabaseCallIds.add(c.id));
    console.log(`✅ Found ${existingSupabaseCallIds.size} pre-existing call records in Supabase.`);
  } else if (callsRes.status === 404 || callsRes.status === 400) {
    console.warn(`\n⚠️  TABLE NOT FOUND (HTTP ${callsRes.status}): public.crm_call_logs does not exist yet.`);
    console.warn('👉 Please run supabase_crm_v2_migration.sql in your Supabase SQL Editor first:\n   https://supabase.com/dashboard/project/lwrfoztfsyffgtybesia/sql\n');
    return report;
  } else {
    console.warn(`⚠️ crm_call_logs query note (HTTP ${callsRes.status}).`);
  }

  // 4. Process each call record
  const orphanedCallsToSave: CallRecord[] = [];

  for (const call of callsToProcess) {
    // Check 1: Already exists in Supabase
    if (existingSupabaseCallIds.has(call.id)) {
      report.skippedDuplicate.push({
        id: call.id,
        lead_id: call.lead_id,
        reason: 'Call ID already exists in public.crm_call_logs.'
      });
      continue;
    }

    // Check 2: Orphaned Record (lead_id does not exist in leads_and_inquiries)
    if (!validLeadIds.has(call.lead_id)) {
      report.skippedOrphaned.push({
        id: call.id,
        lead_id: call.lead_id,
        reason: `Parent lead "${call.lead_id}" does not exist in leads_and_inquiries. Retained in offline archive.`
      });
      orphanedCallsToSave.push(call);
      continue;
    }

    // Insert valid call record into Supabase
    try {
      const insertRes = await fetch(`${url}/rest/v1/crm_call_logs`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: call.id,
          lead_id: call.lead_id,
          call_date: call.call_date || call.created_at || new Date().toISOString(),
          outcome: call.outcome || 'Note Added',
          notes: call.notes || null,
          followup_date: call.followup_date || null,
          logged_by: call.logged_by || null,
          logged_by_name: call.logged_by_name || null,
          duration_seconds: call.duration_seconds || 0,
          created_at: call.created_at || call.call_date || new Date().toISOString()
        })
      });

      if (insertRes.ok || insertRes.status === 201) {
        report.imported.push({
          id: call.id,
          lead_id: call.lead_id,
          outcome: call.outcome
        });
        existingSupabaseCallIds.add(call.id);
      } else {
        const errText = await insertRes.text();
        report.failed.push({
          id: call.id,
          lead_id: call.lead_id,
          error: `HTTP ${insertRes.status}: ${errText}`
        });
      }
    } catch (err: any) {
      report.failed.push({
        id: call.id,
        lead_id: call.lead_id,
        error: err?.message || String(err)
      });
    }
  }

  // 5. Save orphaned records to data/crm_calls_orphaned.json for safety
  if (orphanedCallsToSave.length > 0) {
    let existingOrphans: CallRecord[] = [];
    if (fs.existsSync(crmCallsOrphanedPath)) {
      try {
        existingOrphans = JSON.parse(fs.readFileSync(crmCallsOrphanedPath, 'utf8') || '[]');
      } catch (_) {}
    }
    const orphanMap = new Map<string, CallRecord>();
    existingOrphans.forEach(o => orphanMap.set(o.id, o));
    orphanedCallsToSave.forEach(o => orphanMap.set(o.id, o));
    fs.writeFileSync(crmCallsOrphanedPath, JSON.stringify(Array.from(orphanMap.values()), null, 2));
    console.log(`📁 Retained ${orphanedCallsToSave.length} orphaned call records in ${crmCallsOrphanedPath}`);
  }

  // Print Summary
  console.log('\n==================================================');
  console.log('CRM CALL LOGS BACKFILL SUMMARY');
  console.log('==================================================');
  console.log(`Total Evaluated:       ${report.totalEvaluated}`);
  console.log(`Successfully Imported: ${report.imported.length}`);
  console.log(`Skipped (Duplicates):  ${report.skippedDuplicate.length}`);
  console.log(`Skipped (Orphaned):    ${report.skippedOrphaned.length}`);
  console.log(`Failed (Errors):       ${report.failed.length}`);
  console.log('==================================================\n');

  return report;
}

// Direct execution guard
if (process.argv[1] && process.argv[1].endsWith('backfill_call_logs.ts')) {
  runCallLogsBackfill().catch(console.error);
}
