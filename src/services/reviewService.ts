import { getSupabase } from '../lib/supabase';
import { CustomerReview, SubmitReviewPayload } from '../types';

/**
 * Service to manage customer feedback and reviews.
 * Supabase is the primary single source of truth, with seamless server API proxy fallbacks.
 */

export interface PublicReviewsResponse {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: Record<number, number>;
  reviews: CustomerReview[];
}

export interface AdminReviewsResponse {
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  reviews: CustomerReview[];
}

/**
 * Fetch approved reviews for public display (main site, product page, portfolio)
 */
export async function fetchPublicReviews(options?: {
  productId?: string;
  projectType?: string;
}): Promise<PublicReviewsResponse> {
  const { productId, projectType } = options || {};

  // 1. Try server API route first
  try {
    let url = '/api/reviews/public';
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    if (projectType) params.append('projectType', projectType);
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const res = await fetch(url);
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data && data.success) {
        return {
          totalReviews: data.totalReviews || 0,
          averageRating: data.averageRating || 0,
          ratingBreakdown: data.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          reviews: data.reviews || []
        };
      }
    }
  } catch (err) {
    console.warn('Backend reviews fetch note:', err);
  }

  // 2. Direct client Supabase fallback
  const supabase = getSupabase();
  if (supabase) {
    try {
      let query = supabase
        .from('customer_reviews')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (projectType) {
        query = query.eq('project_type', projectType);
      }

      const { data, error } = await query;
      if (error) {
        const isMissingTable =
          error.code === 'PGRST204' ||
          error.code === '42P01' ||
          error.message?.includes('not found') ||
          error.message?.includes('relation "customer_reviews" does not exist') ||
          error.message?.includes('404');

        if (!isMissingTable) {
          console.warn('Direct Supabase reviews fetch note:', error.message);
        }
      } else if (data) {
        const reviews = data as CustomerReview[];
        const total = reviews.length;
        const avg = total > 0
          ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / total).toFixed(1))
          : 0;

        const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
          const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
          breakdown[star] = (breakdown[star] || 0) + 1;
        });

        return {
          totalReviews: total,
          averageRating: avg,
          ratingBreakdown: breakdown,
          reviews
        };
      }
    } catch (e: any) {
      if (!e?.message?.includes('404') && !e?.message?.includes('not found')) {
        console.warn('Direct Supabase reviews fetch note:', e);
      }
    }
  }

  return {
    totalReviews: 0,
    averageRating: 0,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    reviews: []
  };
}

/**
 * Fetch all reviews for Admin Dashboard (includes pending, approved, rejected)
 */
export async function fetchAdminReviews(options?: {
  status?: string;
  productId?: string;
  search?: string;
}): Promise<AdminReviewsResponse> {
  const { status, productId, search } = options || {};

  try {
    let url = '/api/reviews/admin';
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (productId) params.append('productId', productId);
    if (search) params.append('search', search);
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const res = await fetch(url);
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data && data.success) {
        return {
          counts: data.counts || { total: 0, pending: 0, approved: 0, rejected: 0 },
          reviews: data.reviews || []
        };
      }
    }
  } catch (err) {
    console.warn('Backend admin reviews fetch error:', err);
  }

  // Fallback to Supabase direct client
  const supabase = getSupabase();
  if (supabase) {
    try {
      let query = supabase
        .from('customer_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (!error && data) {
        const reviews = data as CustomerReview[];
        const counts = {
          total: reviews.length,
          pending: reviews.filter(r => r.status === 'pending').length,
          approved: reviews.filter(r => r.status === 'approved').length,
          rejected: reviews.filter(r => r.status === 'rejected').length
        };
        return { counts, reviews };
      }
    } catch (_) {}
  }

  return {
    counts: { total: 0, pending: 0, approved: 0, rejected: 0 },
    reviews: []
  };
}

/**
 * Submit a customer review (Always pending by default)
 */
export async function submitCustomerReview(payload: SubmitReviewPayload): Promise<{
  success: boolean;
  message?: string;
  review?: CustomerReview;
  error?: string;
}> {
  // Validate input
  if (!payload.name || !payload.name.trim()) {
    return { success: false, error: 'Please enter your name.' };
  }
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    return { success: false, error: 'Please select a star rating between 1 and 5.' };
  }
  if (!payload.review_title || !payload.review_title.trim()) {
    return { success: false, error: 'Please provide a review headline/title.' };
  }
  if (!payload.review_message || !payload.review_message.trim()) {
    return { success: false, error: 'Please write your review feedback.' };
  }

  // 1. Submit through backend route
  try {
    const res = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data && data.success) {
        // Dispatch global event for live listeners
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('royalepic-review-submitted', { detail: data.review }));
        }
        return {
          success: true,
          message: data.message || 'Review submitted successfully and is pending approval.',
          review: data.review
        };
      }
    }
  } catch (err) {
    console.warn('Backend review submit note:', err);
  }

  // 2. Direct Supabase client insert as fallback
  const supabase = getSupabase();
  if (supabase) {
    try {
      const newReview = {
        name: payload.name.trim(),
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        rating: Math.min(5, Math.max(1, Math.round(payload.rating))),
        review_title: payload.review_title.trim(),
        review_message: payload.review_message.trim(),
        product_id: payload.product_id?.trim() || null,
        product_name: payload.product_name?.trim() || null,
        project_type: payload.project_type?.trim() || 'Custom Interior & Furniture Work',
        status: 'pending', // REQUIRED: Default is always pending
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('customer_reviews')
        .insert([newReview])
        .select()
        .single();

      if (!error && data) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('royalepic-review-submitted', { detail: data }));
        }
        return {
          success: true,
          message: 'Thank you for your feedback! Your review has been saved to Supabase and is awaiting verification.',
          review: data as CustomerReview
        };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to submit review to Supabase.' };
    }
  }

  return {
    success: false,
    error: 'Unable to connect to database. Please check your network connection.'
  };
}

/**
 * Moderate a review (Approve, Reject, or Edit details) - Admin action
 */
export async function moderateReview(params: {
  id: string;
  status?: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  rating?: number;
  review_title?: string;
  review_message?: string;
  name?: string;
  service_type?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/reviews/moderate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data && data.success) {
        // Broadcast change event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('royalepic-reviews-updated', { detail: data.review }));
        }
        return { success: true, message: data.message };
      }
    }
  } catch (e) {
    console.warn('Backend review moderation note:', e);
  }

  // Direct Supabase update fallback
  const supabase = getSupabase();
  if (supabase) {
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      if (params.status) updates.status = params.status;
      if (params.admin_notes !== undefined) updates.admin_notes = params.admin_notes;
      if (params.rating !== undefined) updates.rating = params.rating;
      if (params.review_title !== undefined) updates.review_title = params.review_title;
      if (params.review_message !== undefined) updates.review_message = params.review_message;
      if (params.name !== undefined) updates.name = params.name;

      const { error } = await supabase
        .from('customer_reviews')
        .update(updates)
        .eq('id', params.id);

      if (!error) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('royalepic-reviews-updated', { detail: params }));
        }
        return { success: true, message: 'Review updated in Supabase.' };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  return { success: false, error: 'Failed to update review.' };
}

/**
 * Delete a review - Admin action
 */
export async function deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'DELETE'
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data && data.success) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('royalepic-reviews-updated', { detail: { id: reviewId, deleted: true } }));
        }
        return { success: true };
      }
    }
  } catch (e) {
    console.warn('Backend review delete note:', e);
  }

  // Direct Supabase delete fallback
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .delete()
        .eq('id', reviewId);

      if (!error) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('royalepic-reviews-updated', { detail: { id: reviewId, deleted: true } }));
        }
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  return { success: false, error: 'Failed to delete review.' };
}

/**
 * Backward compatibility aliases for AdminReviewManagement
 */
export async function getAllReviews(statusFilter: string = 'all'): Promise<{
  reviews: CustomerReview[];
  counts: { pending: number; approved: number; rejected: number; all: number };
}> {
  const res = await fetchAdminReviews({ status: statusFilter });
  return {
    reviews: res.reviews,
    counts: {
      pending: res.counts.pending || 0,
      approved: res.counts.approved || 0,
      rejected: res.counts.rejected || 0,
      all: res.counts.total || 0
    }
  };
}

export async function approveReview(id: string, adminNotes?: string) {
  return moderateReview({ id, status: 'approved', admin_notes: adminNotes });
}

export async function rejectReview(id: string, adminNotes?: string) {
  return moderateReview({ id, status: 'rejected', admin_notes: adminNotes });
}

export async function updateReview(id: string, updates: {
  rating?: number;
  review_title?: string;
  title?: string;
  review_message?: string;
  message?: string;
  status?: 'pending' | 'approved' | 'rejected';
  name?: string;
  admin_notes?: string;
  service_type?: string;
}) {
  return moderateReview({
    id,
    ...updates,
    review_title: updates.review_title || updates.title,
    review_message: updates.review_message || updates.message
  });
}

export function subscribeToReviews(callback: (review: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => {
    callback(e.detail);
  };
  window.addEventListener('royalepic-reviews-updated', handler);
  window.addEventListener('royalepic-review-submitted', handler);
  return () => {
    window.removeEventListener('royalepic-reviews-updated', handler);
    window.removeEventListener('royalepic-review-submitted', handler);
  };
}

// -----------------------------------------------------------------------------
// MANUAL CUSTOMER REVIEWS MANAGEMENT (Admin Dashboard & Homepage Integration)
// -----------------------------------------------------------------------------

const LOCAL_STORAGE_REVIEWS_KEY = 'royalepic_manual_reviews';

export const DEFAULT_DEMO_REVIEWS: CustomerReview[] = [
  {
    id: 'demo-slot-1',
    customer_name: 'Sanjay & Meera Hegde',
    name: 'Sanjay & Meera Hegde',
    city: 'Sobha City, Thanisandra',
    project_type: 'Turnkey 4BHK Flat',
    review_message: 'The turnkey transformation of our 4BHK flat at Sobha City exceeded our expectations. Flawless modular kitchen woodwork, custom TV unit in the living room, and timely handover by Royal Epic.',
    profile_image_url: 'https://images.unsplash.com/photo-1589386417686-0d34b5903d23?auto=format&fit=crop&w=256&h=256&q=80',
    rating: 5,
    is_active: true,
    display_order: 1,
    is_demo: true,
    review_type: 'demo',
    status: 'approved',
    created_at: '2025-01-10T10:00:00.000Z',
    updated_at: '2025-01-10T10:00:00.000Z'
  },
  {
    id: 'demo-slot-2',
    customer_name: 'Priyanka Venkatesh',
    name: 'Priyanka Venkatesh',
    city: 'Prestige Golfshire, N. Bengaluru',
    project_type: 'Luxury Villa Interiors',
    review_message: 'Exceptional craftsmanship on our villa interiors at Prestige Golfshire. From Italian marble installation to false ceiling cove lighting, their site supervisors managed everything with meticulous attention.',
    profile_image_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=256&h=256&q=80',
    rating: 5,
    is_active: true,
    display_order: 2,
    is_demo: true,
    review_type: 'demo',
    status: 'approved',
    created_at: '2025-01-15T11:00:00.000Z',
    updated_at: '2025-01-15T11:00:00.000Z'
  },
  {
    id: 'demo-slot-3',
    customer_name: 'Arjun Nambiar',
    name: 'Arjun Nambiar',
    city: 'Manyata Tech Park, Nagawara',
    project_type: 'Corporate Office Fit-out',
    review_message: 'Royal Epic handled our 8,000 sq.ft tech office fit-out near Manyata. Acoustic glass partitions, modular workstations, and breakout zones were delivered 5 days ahead of schedule.',
    profile_image_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&h=256&q=80',
    rating: 5,
    is_active: true,
    display_order: 3,
    is_demo: true,
    review_type: 'demo',
    status: 'approved',
    created_at: '2025-01-20T14:30:00.000Z',
    updated_at: '2025-01-20T14:30:00.000Z'
  },
  {
    id: 'demo-slot-4',
    customer_name: 'Kavitha & R. Sundaram',
    name: 'Kavitha & R. Sundaram',
    city: 'Brigade Gateway, Malleshwaram',
    project_type: 'Apartment Renovation',
    review_message: 'From initial 3D visualization to final installation, the attention to detail in our master suite wardrobes and cove lighting channels was truly world-class.',
    profile_image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
    rating: 5,
    is_active: true,
    display_order: 4,
    is_demo: true,
    review_type: 'demo',
    status: 'approved',
    created_at: '2025-02-01T09:15:00.000Z',
    updated_at: '2025-02-01T09:15:00.000Z'
  },
  {
    id: 'demo-slot-5',
    customer_name: 'Dr. Anand Swaminathan',
    name: 'Dr. Anand Swaminathan',
    city: 'Salarpuria Sattva, Hebbal',
    project_type: 'Turnkey Civil & Joinery',
    review_message: 'High-grade commercial kitchen stainless steel equipment and dining area woodwork executed seamlessly with robust build quality and dedicated customer service.',
    profile_image_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80',
    rating: 5,
    is_active: true,
    display_order: 5,
    is_demo: true,
    review_type: 'demo',
    status: 'approved',
    created_at: '2025-02-10T16:00:00.000Z',
    updated_at: '2025-02-10T16:00:00.000Z'
  }
];

function getLocalStoredReviews(): CustomerReview[] {
  if (typeof window === 'undefined') return DEFAULT_DEMO_REVIEWS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REVIEWS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(DEFAULT_DEMO_REVIEWS));
      return DEFAULT_DEMO_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Clean and upgrade any old dicebear illustrated URLs or Caucasian stock photos to genuine Indian client photography
      let upgraded = false;
      const cleanList = parsed.map(item => {
        const match = DEFAULT_DEMO_REVIEWS.find(d => d.id === item.id);
        const hasOldPhoto = 
          item.profile_image_url?.includes('dicebear.com') ||
          item.profile_image_url?.includes('photo-1507003211169') ||
          item.profile_image_url?.includes('photo-1573496359142') ||
          item.profile_image_url?.includes('photo-1500648767791') ||
          item.profile_image_url?.includes('photo-1534528741775') ||
          item.profile_image_url?.includes('photo-1506794778202') ||
          item.customer_name === 'Residential Client' ||
          item.customer_name === 'Villa Homeowner' ||
          item.customer_name === 'Corporate Office Lead' ||
          item.customer_name === 'Penthouse Owner' ||
          item.customer_name === 'Hospitality Partner';

        if (hasOldPhoto && match) {
          upgraded = true;
          return {
            ...item,
            customer_name: match.customer_name,
            name: match.name,
            city: match.city,
            project_type: match.project_type,
            profile_image_url: match.profile_image_url,
            review_message: match.review_message
          };
        }
        return item;
      });
      if (upgraded) {
        localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(cleanList));
      }
      return cleanList;
    }
    localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(DEFAULT_DEMO_REVIEWS));
    return DEFAULT_DEMO_REVIEWS;
  } catch (_) {
    return DEFAULT_DEMO_REVIEWS;
  }
}

function setLocalStoredReviews(reviews: CustomerReview[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(reviews));
  } catch (_) {}
}

/**
 * Fetch customer reviews for admin list or public homepage.
 */
export async function getManualCustomerReviews(options?: {
  activeOnly?: boolean;
  search?: string;
  filterType?: 'all' | 'customer' | 'demo';
}): Promise<CustomerReview[]> {
  const { activeOnly, search, filterType } = options || {};
  let list: CustomerReview[] = [];

  const supabase = getSupabase();
  if (supabase) {
    try {
      let query = supabase
        .from('customer_reviews')
        .select('*');

      if (activeOnly) {
        query = query.or('is_active.eq.true,status.eq.approved');
      }

      const { data, error } = await query;
      if (!error && data && Array.isArray(data) && data.length > 0) {
        list = data.map((item: any) => ({
          id: String(item.id),
          customer_name: item.customer_name || item.name || 'Valued Client',
          name: item.customer_name || item.name || 'Valued Client',
          review_message: item.review_message || item.message || '',
          profile_image_url: item.profile_image_url || null,
          rating: Number(item.rating) || 5,
          is_active: item.is_active !== undefined ? Boolean(item.is_active) : item.status === 'approved',
          display_order: Number(item.display_order) || 0,
          is_demo: item.is_demo !== undefined ? Boolean(item.is_demo) : (String(item.id).startsWith('demo-') || item.review_type === 'demo'),
          review_type: item.review_type || (item.is_demo || String(item.id).startsWith('demo-') ? 'demo' : 'customer'),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || item.created_at || new Date().toISOString(),
          status: (item.is_active || item.status === 'approved') ? 'approved' : 'rejected'
        }));
        setLocalStoredReviews(list);
      }
    } catch (_) {}
  }

  // Fallback to local storage
  if (list.length === 0) {
    list = getLocalStoredReviews();
  } else {
    // If Supabase returned reviews, check if any demo reviews from local storage exist that aren't in Supabase
    const local = getLocalStoredReviews();
    const demoItems = local.filter(l => l.is_demo || l.id.startsWith('demo-'));
    for (const d of demoItems) {
      if (!list.some(r => r.id === d.id)) {
        list.push(d);
      }
    }
  }

  // Filter active if requested
  if (activeOnly) {
    list = list.filter(r => r.is_active !== false && r.status !== 'rejected');
  }

  // Filter by review type (Customer vs Demo)
  if (filterType === 'demo') {
    list = list.filter(r => r.is_demo === true || r.review_type === 'demo');
  } else if (filterType === 'customer') {
    list = list.filter(r => !r.is_demo && r.review_type !== 'demo');
  }

  // Filter search query if present
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(r => 
      (r.customer_name || r.name || '').toLowerCase().includes(q) ||
      (r.review_message || '').toLowerCase().includes(q)
    );
  }

  // Sort by display_order ASC, then created_at DESC
  list.sort((a, b) => {
    const orderA = a.display_order ?? 0;
    const orderB = b.display_order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return list;
}

/**
 * Add or Edit a customer review.
 */
export async function saveManualCustomerReview(payload: {
  id?: string;
  customer_name: string;
  review_message: string;
  profile_image_url?: string | null;
  rating: number;
  is_active?: boolean;
  display_order?: number;
  is_demo?: boolean;
  review_type?: 'demo' | 'customer';
}): Promise<{ success: boolean; review?: CustomerReview; error?: string }> {
  if (!payload.customer_name || !payload.customer_name.trim()) {
    return { success: false, error: 'Customer Name is required.' };
  }
  if (!payload.review_message || !payload.review_message.trim()) {
    return { success: false, error: 'Review Message is required.' };
  }
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    return { success: false, error: 'Star rating must be between 1 and 5.' };
  }

  const isEdit = Boolean(payload.id);
  const isDemo = payload.is_demo !== undefined ? payload.is_demo : (payload.review_type === 'demo');
  const reviewType = payload.review_type || (isDemo ? 'demo' : 'customer');
  const reviewId = payload.id || (isDemo ? `demo-${Date.now()}` : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`));
  const now = new Date().toISOString();

  const record: CustomerReview = {
    id: reviewId,
    customer_name: payload.customer_name.trim(),
    name: payload.customer_name.trim(),
    review_message: payload.review_message.trim(),
    profile_image_url: payload.profile_image_url || null,
    rating: Math.min(5, Math.max(1, Math.round(payload.rating))),
    is_active: payload.is_active !== undefined ? payload.is_active : true,
    display_order: Number(payload.display_order) || 0,
    is_demo: isDemo,
    review_type: reviewType,
    status: (payload.is_active ?? true) ? 'approved' : 'rejected',
    created_at: now,
    updated_at: now
  };

  // 1. Try Supabase write
  const supabase = getSupabase();
  if (supabase) {
    try {
      const dbPayload = {
        id: reviewId,
        customer_name: record.customer_name,
        name: record.customer_name,
        review_message: record.review_message,
        profile_image_url: record.profile_image_url,
        rating: record.rating,
        is_active: record.is_active,
        display_order: record.display_order,
        is_demo: record.is_demo,
        status: record.status,
        updated_at: now
      };

      if (isEdit) {
        await supabase.from('customer_reviews').update(dbPayload).eq('id', reviewId);
      } else {
        await supabase.from('customer_reviews').insert([{ ...dbPayload, created_at: now }]);
      }
    } catch (_) {}
  }

  // 2. Always update local storage
  const currentList = getLocalStoredReviews();
  let updatedList: CustomerReview[];
  if (isEdit) {
    updatedList = currentList.map(r => r.id === reviewId ? { ...r, ...record, updated_at: now } : r);
  } else {
    updatedList = [record, ...currentList];
  }
  setLocalStoredReviews(updatedList);

  // 3. Broadcast update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('royalepic-reviews-updated', { detail: record }));
  }

  return { success: true, review: record };
}

/**
 * Delete a customer review.
 */
export async function deleteManualCustomerReview(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('customer_reviews').delete().eq('id', id);
    } catch (_) {}
  }

  const currentList = getLocalStoredReviews();
  const updatedList = currentList.filter(r => r.id !== id);
  setLocalStoredReviews(updatedList);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('royalepic-reviews-updated', { detail: { id, deleted: true } }));
  }

  return { success: true };
}

/**
 * Quick toggle active status.
 */
export async function toggleManualReviewActive(id: string, is_active: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('customer_reviews').update({ 
        is_active, 
        status: is_active ? 'approved' : 'rejected',
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (_) {}
  }

  const currentList = getLocalStoredReviews();
  const updatedList = currentList.map(r => r.id === id ? { 
    ...r, 
    is_active, 
    status: is_active ? 'approved' : 'rejected' as any,
    updated_at: new Date().toISOString() 
  } : r);
  setLocalStoredReviews(updatedList);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('royalepic-reviews-updated', { detail: { id, is_active } }));
  }

  return { success: true };
}


