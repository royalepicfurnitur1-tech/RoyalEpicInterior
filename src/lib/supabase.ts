import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable retrieval with production project fallbacks
const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

export const SUPABASE_URL = 
  metaEnv.VITE_SUPABASE_URL || 
  'https://lwrfoztfsyffgtybesia.supabase.co';

export const SUPABASE_ANON_KEY = 
  metaEnv.VITE_SUPABASE_ANON_KEY || 
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL && 
    SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_ANON_KEY && 
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    try {
      clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return clientInstance;
};

// Lead / Inquiry Payload Type
export interface LeadInquiryPayload {
  id?: string;
  full_name: string;
  phone: string;
  email?: string;
  city?: string;
  service_type?: string;
  estimated_budget?: string;
  project_scope?: string;
  source?: string;
  status?: 'new' | 'contacted' | 'site_visit_scheduled' | 'boq_sent' | 'converted' | 'archived';
  preferred_date?: string;
  drawing_name?: string;
  notes?: string;
  raw_details?: any;
}

/**
 * Diagnostic helper to test the live connection to Supabase
 */
export async function checkSupabaseLiveConnection(): Promise<{
  connected: boolean;
  message: string;
  tableFound?: boolean;
  details?: any;
}> {
  // First, check backend server diagnosis
  try {
    const res = await fetch('/api/supabase/check');
    if (res.ok) {
      const data = await res.json();
      if (data.connected) {
        return {
          connected: true,
          message: 'Supabase PostgreSQL connected successfully! Leads table accessible.',
          tableFound: true,
          details: data
        };
      } else if (data.hasUrl && data.hasKey) {
        return {
          connected: false,
          message: data.hint || data.status || 'Supabase credentials set, but could not query leads_and_inquiries table.',
          details: data
        };
      }
    }
  } catch (_) {}

  // Next, check client-side Supabase client directly
  const supabase = getSupabase();
  if (!supabase) {
    return {
      connected: false,
      message: 'Supabase credentials (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) are missing or set to placeholder values.'
    };
  }

  try {
    const { count, error } = await supabase
      .from('leads_and_inquiries')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        message: `Connected to Supabase endpoint, but table query error: ${error.message}. (Did you execute supabase_schema.sql?)`,
        details: error
      };
    }

    return {
      connected: true,
      message: `Supabase PostgreSQL is fully connected and online (${count ?? 0} leads currently in database).`,
      tableFound: true
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Supabase connection attempt failed: ${err.message || 'Unknown network error'}`
    };
  }
}

/**
 * Submit an inquiry/lead to Supabase PostgreSQL table 'leads_and_inquiries'
 * Falls back safely to local CRM if network is unreachable.
 */
export async function submitLeadToSupabase(payload: LeadInquiryPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabase();
  const generatedId = payload.id || `LEAD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const record = {
    id: generatedId,
    full_name: payload.full_name,
    phone: payload.phone,
    email: payload.email || null,
    city: payload.city || 'Bengaluru',
    service_type: payload.service_type || 'General Interior Consultation',
    estimated_budget: payload.estimated_budget || 'Custom Quote',
    project_scope: payload.project_scope || '',
    source: payload.source || 'Website Form',
    status: payload.status || 'new',
    preferred_date: payload.preferred_date || null,
    drawing_name: payload.drawing_name || null,
    notes: payload.notes || null,
    raw_details: payload.raw_details || null,
    created_at: new Date().toISOString()
  };

  // 1. Dispatch through backend proxy route with full diagnostic logging
  let backendSuccess = false;
  try {
    const backendRes = await fetch('/api/supabase/submit-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (backendRes.ok) {
      const bData = await backendRes.json();
      console.log('✅ Lead synced to Supabase via server API:', bData);
      backendSuccess = true;
    } else {
      const errJson = await backendRes.json().catch(() => null);
      console.warn('⚠️ Server Supabase submit warning:', errJson);
    }
  } catch (backendErr) {
    console.warn('Backend proxy fetch note:', backendErr);
  }

  // 2. Also attempt direct client-side Supabase client insert
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('leads_and_inquiries')
        .insert([record])
        .select()
        .single();

      if (error) {
        console.warn('⚠️ Direct Supabase client insert returned:', error.message, error.details);
      } else {
        console.log('✅ Direct Supabase client insert succeeded:', data?.id || generatedId);
        saveLeadLocally(record);
        return { success: true, id: data?.id || generatedId };
      }
    } catch (clientErr: any) {
      console.warn('Client Supabase insertion error:', clientErr);
    }
  }

  // Always save locally so no customer data is ever lost
  saveLeadLocally(record);

  // Also notify local CRM endpoint
  try {
    fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: generatedId,
        name: record.full_name,
        phone: record.phone,
        email: record.email || '',
        location: record.city || '',
        budget: record.estimated_budget || '',
        projectType: record.service_type || '',
        preferredDate: record.preferred_date || '',
        source: record.source || 'Website',
        discoveredInfo: record.raw_details || {}
      })
    }).catch(() => {});
  } catch (_) {}

  return { success: true, id: generatedId };
}

function saveLeadLocally(lead: any) {
  try {
    const existingStr = localStorage.getItem('royal_epic_leads') || '[]';
    const existing = JSON.parse(existingStr);
    existing.unshift(lead);
    localStorage.setItem('royal_epic_leads', JSON.stringify(existing.slice(0, 100)));
  } catch (_) {}
}

/**
 * Fetch all leads from Supabase PostgreSQL (or local fallback)
 */
export async function fetchLeadsFromSupabase(): Promise<any[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('leads_and_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Failed to query Supabase leads:', err);
    }
  }

  // Fallback to local storage
  try {
    const stored = localStorage.getItem('royal_epic_leads');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (_) {}

  return [];
}

/**
 * Update a lead status in Supabase
 */
export async function updateLeadInSupabase(id: string, updates: Partial<LeadInquiryPayload>): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('leads_and_inquiries')
        .update(updates)
        .eq('id', id);
      return !error;
    } catch (_) {
      return false;
    }
  }

  // Update in localStorage
  try {
    const stored = localStorage.getItem('royal_epic_leads');
    if (stored) {
      const leads = JSON.parse(stored);
      const index = leads.findIndex((l: any) => l.id === id);
      if (index !== -1) {
        leads[index] = { ...leads[index], ...updates };
        localStorage.setItem('royal_epic_leads', JSON.stringify(leads));
        return true;
      }
    }
  } catch (_) {}

  return true;
}
