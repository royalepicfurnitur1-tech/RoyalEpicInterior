import { getSupabase } from '../lib/supabase';
import { DEFAULT_HERITAGE_HOMES } from '../data/heritageHomesData';

export interface HeritageHomeItem {
  id: string;
  slug: string;
  sectionNumber: number; // Display order
  title: string;
  subtitle: string; // Short description
  fullDescription?: string;
  category?: string;
  subCategory?: string;
  image: string; // Main image
  galleryImages?: string[]; // Additional gallery images
  alt: string; // Image alt text
  designStyle: string;
  architecturalFeatures: string;
  interiorCharacter: string;
  suitableFor: string;
  highlights: string[];
  keyElements: string[];
  featured?: boolean;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'royalepic_heritage_homes_store';

export async function getHeritageHomes(): Promise<HeritageHomeItem[]> {
  try {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('heritage_home_items').select('*').order('sectionNumber');
      if (!error && data && data.length > 0) {
        // Map from DB schema to frontend schema if needed
        const items = data.map((d: any) => ({
          id: d.id,
          slug: d.slug,
          sectionNumber: d.display_order || d.sectionNumber,
          title: d.title,
          subtitle: d.subtitle || d.short_description,
          fullDescription: d.full_description,
          category: d.category,
          subCategory: d.sub_category,
          image: d.image || d.main_image,
          galleryImages: d.gallery_images || [],
          alt: d.alt || d.image_alt,
          designStyle: d.design_style,
          architecturalFeatures: d.architectural_features,
          interiorCharacter: d.interior_character,
          suitableFor: d.suitable_for,
          highlights: d.highlights || [],
          keyElements: d.key_elements || [],
          featured: d.featured,
          published: d.published,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        }));
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
        return items;
      }
    }
  } catch (e) {
    console.warn('Supabase heritage homes fetch notice:', e);
  }
  
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
  }
  
  return DEFAULT_HERITAGE_HOMES as HeritageHomeItem[]; // We will provide the default data in the component or seed it
}

export async function saveHeritageHome(item: Partial<HeritageHomeItem>): Promise<{ success: boolean; item?: HeritageHomeItem; error?: string }> {
  try {
    const fullItem: HeritageHomeItem = {
      id: item.id || `heritage-${Date.now()}`,
      slug: item.slug || (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      sectionNumber: item.sectionNumber ?? 999,
      title: item.title || 'New Heritage Home',
      subtitle: item.subtitle || '',
      fullDescription: item.fullDescription || '',
      category: item.category || '',
      subCategory: item.subCategory || '',
      image: item.image || '',
      galleryImages: item.galleryImages || [],
      alt: item.alt || '',
      designStyle: item.designStyle || '',
      architecturalFeatures: item.architecturalFeatures || '',
      interiorCharacter: item.interiorCharacter || '',
      suitableFor: item.suitableFor || '',
      highlights: item.highlights || [],
      keyElements: item.keyElements || [],
      featured: item.featured ?? false,
      published: item.published ?? true,
      updatedAt: new Date().toISOString()
    };
    if (!item.id) fullItem.createdAt = new Date().toISOString();

    const sb = getSupabase();
    if (sb) {
      // Upsert to DB
      const dbPayload = {
        id: fullItem.id,
        slug: fullItem.slug,
        display_order: fullItem.sectionNumber,
        title: fullItem.title,
        subtitle: fullItem.subtitle,
        short_description: fullItem.subtitle,
        full_description: fullItem.fullDescription,
        category: fullItem.category,
        sub_category: fullItem.subCategory,
        image: fullItem.image,
        main_image: fullItem.image,
        gallery_images: fullItem.galleryImages,
        alt: fullItem.alt,
        image_alt: fullItem.alt,
        design_style: fullItem.designStyle,
        architectural_features: fullItem.architecturalFeatures,
        interior_character: fullItem.interiorCharacter,
        suitable_for: fullItem.suitableFor,
        highlights: fullItem.highlights,
        key_elements: fullItem.keyElements,
        featured: fullItem.featured,
        published: fullItem.published,
        updated_at: fullItem.updatedAt,
      };
      
      if (!item.id) (dbPayload as any).created_at = fullItem.createdAt;

      const { error } = await sb.from('heritage_home_items').upsert(dbPayload);
      if (error) {
        console.error('Error saving heritage home to Supabase:', error);
      }
    }
    
    // Update local storage
    if (typeof window !== 'undefined') {
      const existingStr = localStorage.getItem(STORAGE_KEY);
      let existing: HeritageHomeItem[] = [];
      if (existingStr) {
        try { existing = JSON.parse(existingStr); } catch {}
      }
      
      const idx = existing.findIndex(x => x.id === fullItem.id);
      if (idx >= 0) {
        existing[idx] = { ...existing[idx], ...fullItem };
      } else {
        existing.push(fullItem);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
    
    return { success: true, item: fullItem };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteHeritageHome(id: string): Promise<boolean> {
  try {
    const sb = getSupabase();
    if (sb) {
      await sb.from('heritage_home_items').delete().eq('id', id);
    }
    
    if (typeof window !== 'undefined') {
      const existingStr = localStorage.getItem(STORAGE_KEY);
      if (existingStr) {
        let existing: HeritageHomeItem[] = [];
        try { existing = JSON.parse(existingStr); } catch {}
        existing = existing.filter(x => x.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      }
    }
    return true;
  } catch {
    return false;
  }
}
