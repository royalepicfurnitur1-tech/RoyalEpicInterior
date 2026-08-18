import { createClient } from '@supabase/supabase-js';
import { PortfolioProject } from '../types';
import { PORTFOLIO_PROJECTS as DEFAULT_PORTFOLIO } from '../data/mockData';

// Supabase Connection Credentials (with fallbacks)
const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const SUPABASE_URL = 
  metaEnv.VITE_SUPABASE_URL || 
  'https://lwrfoztfsyffgtybesia.supabase.co';

const SUPABASE_ANON_KEY = 
  metaEnv.VITE_SUPABASE_ANON_KEY || 
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PORTFOLIO_STORAGE_KEY = 'royal_epic_portfolio_projects';

// Fetch all portfolio projects (Supabase with LocalStorage fallback)
export async function getPortfolioProjects(): Promise<{ projects: PortfolioProject[]; source: 'supabase' | 'cache' | 'default' }> {
  // 1. Try Supabase first
  try {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data && data.length > 0) {
      // Map from DB row to TypeScript interface
      const formatted: PortfolioProject[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        category: item.category || 'Residential',
        location: item.location || 'Bengaluru',
        areaSqFt: Number(item.area_sqft || item.areaSqFt) || 3500,
        completionTime: item.completion_time || item.completionTime || '10 Weeks',
        beforeImage: item.before_image || item.beforeImage || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
        afterImage: item.after_image || item.afterImage || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
        clientName: item.client_name || item.clientName || 'Valued Client',
        clientReview: item.client_review || item.clientReview || 'Magnificent turnkey execution by Royal Epic!',
        clientRating: Number(item.client_rating || item.clientRating) || 5.0,
        has3dWalkthrough: Boolean(item.has_3d_walkthrough || item.has3dWalkthrough),
        gallery: Array.isArray(item.gallery) ? item.gallery : [item.after_image || '']
      }));

      // Cache locally for offline resiliency
      if (typeof window !== 'undefined') {
        localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(formatted));
      }
      return { projects: formatted, source: 'supabase' };
    }
  } catch (e) {
    console.warn('Failed to query Supabase portfolio_projects:', e);
  }

  // 2. Local storage cache fallback
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { projects: parsed, source: 'cache' };
        }
      } catch (e) {
        console.error('Failed to parse portfolio cache:', e);
      }
    }
  }

  // 3. Fallback to default mock data
  return { projects: DEFAULT_PORTFOLIO, source: 'default' };
}

// Save or Update a Portfolio Project
export async function savePortfolioProject(project: Partial<PortfolioProject>): Promise<{ success: boolean; project?: PortfolioProject; error?: string }> {
  try {
    const fullProject: PortfolioProject = {
      id: project.id || `port-${Date.now()}`,
      title: project.title || 'New Luxury Turnkey Project',
      category: project.category || 'Residential',
      location: project.location || 'Bengaluru',
      areaSqFt: Number(project.areaSqFt) || 3000,
      completionTime: project.completionTime || '8 Weeks',
      beforeImage: project.beforeImage || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
      afterImage: project.afterImage || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
      clientName: project.clientName || 'Private Client',
      clientReview: project.clientReview || 'Outstanding turnkey craftsmanship and on-time handover.',
      clientRating: Number(project.clientRating) || 5.0,
      has3dWalkthrough: Boolean(project.has3dWalkthrough),
      gallery: project.gallery && project.gallery.length > 0 ? project.gallery : [project.afterImage || '']
    };

    // Save to Supabase
    try {
      const dbPayload = {
        id: fullProject.id,
        title: fullProject.title,
        category: fullProject.category,
        location: fullProject.location,
        area_sqft: fullProject.areaSqFt,
        completion_time: fullProject.completionTime,
        before_image: fullProject.beforeImage,
        after_image: fullProject.afterImage,
        client_name: fullProject.clientName,
        client_review: fullProject.clientReview,
        client_rating: fullProject.clientRating,
        has_3d_walkthrough: fullProject.has3dWalkthrough,
        gallery: fullProject.gallery
      };

      const { error } = await supabase
        .from('portfolio_projects')
        .upsert(dbPayload, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase portfolio upsert warning:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase portfolio upsert error:', err);
    }

    // Always persist to localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      let list: PortfolioProject[] = cached ? JSON.parse(cached) : [...DEFAULT_PORTFOLIO];
      const index = list.findIndex(p => p.id === fullProject.id);
      if (index >= 0) {
        list[index] = fullProject;
      } else {
        list.unshift(fullProject);
      }
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(list));
    }

    return { success: true, project: fullProject };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save project' };
  }
}

// Delete a Project
export async function deletePortfolioProject(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      await supabase.from('portfolio_projects').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      let list: PortfolioProject[] = cached ? JSON.parse(cached) : [...DEFAULT_PORTFOLIO];
      list = list.filter(p => p.id !== id);
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(list));
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 1-Click Sync Default Projects to Supabase
export async function seedPortfolioToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const records = DEFAULT_PORTFOLIO.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      location: p.location,
      area_sqft: p.areaSqFt,
      completion_time: p.completionTime,
      before_image: p.beforeImage,
      after_image: p.afterImage,
      client_name: p.clientName,
      client_review: p.clientReview,
      client_rating: p.clientRating,
      has_3d_walkthrough: p.has3dWalkthrough,
      gallery: p.gallery
    }));

    const { error } = await supabase
      .from('portfolio_projects')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: records.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
  }
}
