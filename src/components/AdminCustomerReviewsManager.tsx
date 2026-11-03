import React, { useState, useEffect } from 'react';
import { 
  Star, Plus, Edit2, Trash2, Search, Filter, Check, X, 
  Upload, Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle2, User,
  Sparkles, Layers
} from 'lucide-react';
import { CustomerReview } from '../types';
import { 
  getManualCustomerReviews, 
  saveManualCustomerReview, 
  deleteManualCustomerReview, 
  toggleManualReviewActive 
} from '../services/reviewService';
import { uploadReviewAvatar } from '../services/storageService';

export const AdminCustomerReviewsManager: React.FC = () => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'demo'>('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewType, setReviewType] = useState<'customer' | 'demo'>('customer');
  const [customerName, setCustomerName] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [displayOrder, setDisplayOrder] = useState<number>(1);

  // Upload & Save UI feedback state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingReview, setDeletingReview] = useState<CustomerReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load reviews
  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await getManualCustomerReviews();
      setReviews(data);
    } catch (e: any) {
      console.error('Failed to load customer reviews:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();

    const handleUpdate = () => {
      loadReviews();
    };
    window.addEventListener('royalepic-reviews-updated', handleUpdate);
    return () => window.removeEventListener('royalepic-reviews-updated', handleUpdate);
  }, []);

  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    const matchesSearch = 
      (r.customer_name || r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.review_message || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const rIsActive = r.is_active !== false && r.status !== 'rejected';
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? rIsActive :
      !rIsActive;

    const isDemoReview = r.is_demo === true || r.review_type === 'demo';
    const matchesType =
      typeFilter === 'all' ? true :
      typeFilter === 'demo' ? isDemoReview :
      !isDemoReview;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalCount = reviews.length;
  const activeCount = reviews.filter(r => r.is_active !== false && r.status !== 'rejected').length;
  const customerCount = reviews.filter(r => !r.is_demo && r.review_type !== 'demo').length;
  const demoCount = reviews.filter(r => r.is_demo || r.review_type === 'demo').length;

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingReviewId(null);
    setReviewType('customer');
    setCustomerName('');
    setReviewMessage('');
    setProfileImageUrl(null);
    setRating(5);
    setIsActive(true);
    const nextOrder = reviews.length > 0 
      ? Math.max(...reviews.map(r => r.display_order || 0)) + 1 
      : 1;
    setDisplayOrder(nextOrder);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (review: CustomerReview) => {
    setEditingReviewId(review.id);
    const isDemo = review.is_demo === true || review.review_type === 'demo';
    setReviewType(isDemo ? 'demo' : 'customer');
    setCustomerName(review.customer_name || review.name || '');
    setReviewMessage(review.review_message || '');
    setProfileImageUrl(review.profile_image_url || null);
    setRating(review.rating || 5);
    setIsActive(review.is_active !== false && review.status !== 'rejected');
    setDisplayOrder(review.display_order ?? 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle avatar file selection & upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type.toLowerCase())) {
      setFormError('Please select a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size exceeds 5MB limit. Please upload a smaller photo.');
      return;
    }

    setIsUploadingImage(true);
    setFormError(null);

    try {
      const res = await uploadReviewAvatar(file);
      if (res.success && res.url) {
        setProfileImageUrl(res.url);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setProfileImageUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setFormError('Failed to upload image. Using local preview.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save (Add or Update)
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setFormError('Customer Name / Label is required.');
      return;
    }
    if (!reviewMessage.trim()) {
      setFormError('Review Message is required.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setFormError('Star Rating must be between 1 and 5.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const isDemo = reviewType === 'demo';
      const res = await saveManualCustomerReview({
        id: editingReviewId || undefined,
        customer_name: customerName.trim(),
        review_message: reviewMessage.trim(),
        profile_image_url: profileImageUrl,
        rating,
        is_active: isActive,
        display_order: Number(displayOrder) || 1,
        is_demo: isDemo,
        review_type: reviewType
      });

      if (res.success) {
        setIsModalOpen(false);
        setActionSuccessMessage(
          editingReviewId 
            ? `${isDemo ? 'Demo review' : 'Customer review'} updated successfully!` 
            : `New ${isDemo ? 'demo review' : 'customer review'} added successfully!`
        );
        setTimeout(() => setActionSuccessMessage(null), 4000);
        await loadReviews();
      } else {
        setFormError(res.error || 'Failed to save review.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving review.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle active
  const handleToggleActive = async (review: CustomerReview) => {
    const currentActive = review.is_active !== false && review.status !== 'rejected';
    const nextActive = !currentActive;
    try {
      await toggleManualReviewActive(review.id, nextActive);
      await loadReviews();
      setActionSuccessMessage(
        `"${review.customer_name || review.name}" set to ${nextActive ? 'Active (Visible on Homepage Carousel)' : 'Inactive (Hidden)'}.`
      );
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (e: any) {
      alert('Failed to update status: ' + e.message);
    }
  };

  // Delete review
  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    setIsDeleting(true);
    try {
      const res = await deleteManualCustomerReview(deletingReview.id);
      if (res.success) {
        setDeletingReview(null);
        setActionSuccessMessage(`Review "${deletingReview.customer_name || deletingReview.name}" deleted.`);
        setTimeout(() => setActionSuccessMessage(null), 3500);
        await loadReviews();
      } else {
        alert('Failed to delete review: ' + (res.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Delete error: ' + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for circular initials
  const getInitials = (name: string) => {
    if (!name) return 'RE';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono uppercase tracking-wider font-bold">
              Manual Reviews Control
            </span>
            <span className="text-xs text-neutral-400 font-mono">Horizontal Carousel System • Unlimited Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-gold fill-gold" /> Customer Reviews Management
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Manage genuine client reviews and preserve demo testimonials. Active reviews seamlessly appear in the compact horizontal carousel on the homepage.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gold via-amber-500 to-yellow-500 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-lg shadow-gold/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Review</span>
        </button>
      </div>

      {/* Success Alert Banner */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{actionSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Cards: Total, Genuine Customer, Demo, Active */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 uppercase font-mono tracking-wider">Total Stored</p>
            <p className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">{totalCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center text-gold shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-gold/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] text-gold/90 uppercase font-mono tracking-wider">Customer Reviews</p>
            <p className="text-xl sm:text-2xl font-serif font-bold text-gold mt-1">{customerCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
            <User className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] text-purple-400 uppercase font-mono tracking-wider">Demo Reviews</p>
            <p className="text-xl sm:text-2xl font-serif font-bold text-purple-400 mt-1">{demoCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] text-emerald-400/90 uppercase font-mono tracking-wider">Active in Carousel</p>
            <p className="text-xl sm:text-2xl font-serif font-bold text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search, Type Filter & Status Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-neutral-900/60 border border-white/10 rounded-2xl p-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or testimonial text..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold/50"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-[11px] text-neutral-400 mr-1 font-mono">Type:</span>
          {(['all', 'customer', 'demo'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                typeFilter === t 
                  ? 'bg-amber-500 text-neutral-950 shadow-xs font-bold' 
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {t === 'all' ? 'All Types' : t === 'customer' ? 'Customer Reviews' : 'Demo Reviews'}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 pt-2 lg:pt-0 lg:pl-3">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[11px] text-neutral-400 font-mono">Status:</span>
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === f 
                  ? 'bg-gold text-neutral-950 shadow-xs font-bold' 
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={loadReviews}
            title="Refresh list"
            className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-gold hover:bg-neutral-700 transition-colors ml-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gold mb-3" />
            <p className="text-xs">Loading reviews catalog...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <Star className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-neutral-300">No matching reviews found</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search query or filter options.'
                : 'Click "+ Add New Review" above to manually add client feedback.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-white/10 text-neutral-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Customer / Label</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Review Message Excerpt</th>
                  <th className="py-3 px-4 text-center">Carousel Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReviews.map((review) => {
                  const isCurActive = review.is_active !== false && review.status !== 'rejected';
                  const isDemo = review.is_demo === true || review.review_type === 'demo';
                  const initials = getInitials(review.customer_name || review.name || 'Client');

                  return (
                    <tr key={review.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Display Order */}
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-300">
                        <span className="px-2 py-1 rounded bg-neutral-800 border border-white/10 text-gold">
                          #{review.display_order ?? 0}
                        </span>
                      </td>

                      {/* Review Type Badge */}
                      <td className="py-3.5 px-4">
                        {isDemo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
                            <Sparkles className="w-3 h-3 text-purple-400" /> Demo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                            <User className="w-3 h-3 text-amber-400" /> Customer
                          </span>
                        )}
                      </td>

                      {/* Customer Info & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {review.profile_image_url ? (
                            <img
                              src={review.profile_image_url}
                              alt={review.customer_name || review.name}
                              className="w-10 h-10 rounded-full object-cover border border-gold/40 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 border border-gold/30 flex items-center justify-center font-bold text-gold text-xs shrink-0 tracking-wider">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="font-serif font-bold text-white text-sm">
                              {review.customer_name || review.name}
                            </p>
                            <span className="text-[10px] font-mono text-neutral-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Star Rating */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (review.rating || 5)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-neutral-700'
                              }`}
                            />
                          ))}
                          <span className="ml-1.5 font-mono text-xs font-bold text-white">
                            {review.rating || 5}.0
                          </span>
                        </div>
                      </td>

                      {/* Message Excerpt */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-neutral-300 italic line-clamp-2">
                          "{review.review_message}"
                        </p>
                      </td>

                      {/* Active Status & Quick Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(review)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider border cursor-pointer transition-all ${
                            isCurActive
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                          }`}
                          title={`Click to set ${isCurActive ? 'Inactive (Hide from Carousel)' : 'Active (Show in Carousel)'}`}
                        >
                          {isCurActive ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-neutral-400" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(review)}
                            className="p-2 rounded-xl bg-neutral-800 hover:bg-gold/20 text-neutral-300 hover:text-gold border border-white/5 hover:border-gold/30 transition-colors cursor-pointer"
                            title="Edit Review"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingReview(review)}
                            className="p-2 rounded-xl bg-neutral-800 hover:bg-red-950/50 text-neutral-300 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-colors cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold fill-gold" />
                  {editingReviewId ? 'Edit Review' : 'Add New Review'}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Fields marked with <span className="text-amber-400 font-bold">*</span> are required.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error in modal */}
            {formError && (
              <div className="p-3.5 mb-5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveReview} className="space-y-4">
              {/* Review Type Selector (Customer vs Demo) */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Review Classification <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-1.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setReviewType('customer')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      reviewType === 'customer'
                        ? 'bg-gold text-neutral-950 shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Review</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewType('demo')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      reviewType === 'demo'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Demo Testimonial</span>
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  {reviewType === 'demo'
                    ? 'Demonstration testimonial card. Transparently displayed without claiming false Google client verification.'
                    : 'Authentic client feedback. Displays verified customer badge on public carousel.'}
                </p>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  {reviewType === 'demo' ? 'Sample Name / Client Persona' : 'Customer Name & Location'} <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={reviewType === 'demo' ? 'e.g. Residential Client' : 'e.g. Ramesh Kulkarni, Thanisandra'}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold/50"
                />
              </div>

              {/* Star Rating Interactive Selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Star Rating (1 to 5) <span className="text-amber-400">*</span>
                </label>
                <div className="flex items-center gap-2 bg-neutral-950 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <button
                        type="button"
                        key={starNum}
                        onClick={() => setRating(starNum)}
                        className="p-1 text-neutral-600 hover:scale-110 transition-transform cursor-pointer"
                        title={`${starNum} Stars`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            starNum <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-700 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold text-gold ml-auto">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Message */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Review Message <span className="text-amber-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewMessage}
                  onChange={(e) => setReviewMessage(e.target.value)}
                  placeholder="Write the full customer feedback or testimonial statement here..."
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold/50 leading-relaxed"
                />
              </div>

              {/* Profile Picture Upload & Preview */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Profile Avatar (Optional)
                </label>
                <div className="p-3 bg-neutral-950 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-4">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Preview"
                        className="w-14 h-14 rounded-full object-cover border-2 border-gold/50 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-neutral-800 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-neutral-400 shrink-0">
                        {customerName ? (
                          <span className="font-bold text-gold text-sm tracking-wider">
                            {getInitials(customerName)}
                          </span>
                        ) : (
                          <User className="w-5 h-5 text-neutral-500" />
                        )}
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <p className="text-[11px] text-neutral-300 font-semibold">
                        {profileImageUrl ? 'Custom photo attached' : 'No photo uploaded (Initials avatar will be generated)'}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Supports JPG, PNG, WebP up to 5MB.
                      </p>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <label className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>{isUploadingImage ? 'Uploading...' : profileImageUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleAvatarFileChange}
                            className="hidden"
                            disabled={isUploadingImage}
                          />
                        </label>

                        {profileImageUrl && (
                          <button
                            type="button"
                            onClick={() => setProfileImageUrl(null)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/30 text-[11px] cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold/50"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Lower numbers appear first in the carousel.</p>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Carousel Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs font-bold cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        : 'bg-neutral-950 border-white/10 text-neutral-400'
                    }`}
                  >
                    <span>{isActive ? 'Active (Live in Carousel)' : 'Inactive (Hidden)'}</span>
                    {isActive ? <Check className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-neutral-500" />}
                  </button>
                  <p className="text-[10px] text-neutral-500 mt-1">Controls immediate visibility on homepage.</p>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold via-amber-500 to-yellow-500 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{editingReviewId ? 'Update Review' : 'Save Review'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-red-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-white">Delete Review?</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Are you sure you want to delete the {deletingReview.is_demo ? 'demo testimonial' : 'customer review'} for{' '}
              <span className="text-white font-bold">"{deletingReview.customer_name || deletingReview.name}"</span>?
              {deletingReview.is_demo && (
                <span className="block mt-1 text-purple-300">
                  Tip: You can deactivate demo reviews instead of deleting them.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
