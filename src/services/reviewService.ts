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

