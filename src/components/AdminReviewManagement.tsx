import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Star, CheckCircle2, XCircle, Trash2, Edit3, Search, 
  Clock, ShieldCheck, AlertCircle, RefreshCw, Eye, MessageSquare, 
  Filter, ThumbsUp, X, Save
} from 'lucide-react';
import { CustomerReview } from '../types';
import { 
  getAllReviews, approveReview, rejectReview, 
  updateReview, deleteReview, subscribeToReviews 
} from '../services/reviewService';

export const AdminReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 });
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Editing state
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [editName, setEditName] = useState('');
  const [editServiceType, setEditServiceType] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch reviews
  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllReviews(statusFilter);
      setReviews(data.reviews);
      setCounts(data.counts);
    } catch (err) {
      console.warn('Failed to load reviews in admin:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReviews();
    const unsubscribe = subscribeToReviews(() => {
      loadReviews();
    });
    return unsubscribe;
  }, [loadReviews]);

  // Flash action message
  const showFeedback = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(''), 4000);
  };

  // Actions
  const handleApprove = async (id: string, name: string) => {
    try {
      const res = await approveReview(id);
      if (res.success) {
        showFeedback(`Approved review from ${name}. Now visible on the public website!`);
        await loadReviews();
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      const res = await rejectReview(id);
      if (res.success) {
        showFeedback(`Review from ${name} marked as rejected.`);
        await loadReviews();
      }
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete this review from ${name}?`)) {
      return;
    }
    try {
      const res = await deleteReview(id);
      if (res.success) {
        showFeedback(`Deleted review permanently from Supabase & database.`);
        await loadReviews();
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const openEditModal = (review: CustomerReview) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditTitle(review.title);
    setEditMessage(review.message);
    setEditStatus(review.status);
    setEditName(review.name);
    setEditServiceType(review.service_type || 'Residential Interior');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setIsSavingEdit(true);
    try {
      const res = await updateReview(editingReview.id, {
        rating: editRating,
        title: editTitle.trim(),
        message: editMessage.trim(),
        status: editStatus,
        name: editName.trim(),
        service_type: editServiceType
      });
      if (res.success) {
        showFeedback(`Review updated successfully!`);
        setEditingReview(null);
        await loadReviews();
      }
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Filtered reviews
  const filteredList = useMemo(() => {
    return reviews.filter(r => {
      // Rating filter
      if (ratingFilter !== 'all' && Number(r.rating) !== Number(ratingFilter)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesTitle = r.title?.toLowerCase().includes(q);
        const matchesMsg = r.message?.toLowerCase().includes(q);
        const matchesEmail = r.email?.toLowerCase().includes(q);
        const matchesProduct = r.product_name?.toLowerCase().includes(q);
        const matchesService = r.service_type?.toLowerCase().includes(q);
        return matchesName || matchesTitle || matchesMsg || matchesEmail || matchesProduct || matchesService;
      }
      return true;
    });
  }, [reviews, searchQuery, ratingFilter]);

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Top Banner & Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900 border border-gold/30 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Star className="w-3.5 h-3.5 fill-current" /> Live Customer Feedback & Reviews
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Customer Reviews Management
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Moderate, edit, approve, or reject customer reviews submitted across the main website, product pages, and customer portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReviews}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          {actionSuccessMessage}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500/15 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-neutral-900 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-amber-400">
            {counts.pending}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Requires admin action</span>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-emerald-500/15 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-neutral-900 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Approved & Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400">
            {counts.approved}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Visible on website & products</span>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-rose-500/15 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              : 'bg-neutral-900 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-rose-400">
            {counts.rejected}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Hidden from public</span>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-gold/15 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]'
              : 'bg-neutral-900 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">All Records</span>
            <Filter className="w-4 h-4 text-gold" />
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            {counts.all}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Total logged reviews</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by customer, title, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
          />
        </div>

        {/* Rating filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-neutral-400 whitespace-nowrap">Filter Stars:</span>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-gold"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars Only</option>
            <option value="3">3 Stars Only</option>
            <option value="2">2 Stars Only</option>
            <option value="1">1 Star Only</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-neutral-900 border border-white/10 text-neutral-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-gold" />
            <h3 className="text-lg font-serif font-bold text-white mb-1">
              No Reviews Found
            </h3>
            <p className="text-xs max-w-sm mx-auto">
              {statusFilter === 'pending'
                ? 'All pending reviews have been moderated. Check "Approved" or "All Records" tab.'
                : 'No reviews match the current filter or search criteria.'}
            </p>
          </div>
        ) : (
          filteredList.map((review) => {
            const isPending = review.status === 'pending';
            const isApproved = review.status === 'approved';
            const isRejected = review.status === 'rejected';

            return (
              <div 
                key={review.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isPending 
                    ? 'bg-neutral-900/90 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.08)]' 
                    : isApproved
                    ? 'bg-neutral-900/70 border-emerald-500/30'
                    : 'bg-neutral-900/40 border-rose-500/20 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  {/* Left: Rating, Title & Target */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Star Rating */}
                      <div className="flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-lg border border-white/10">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-current' : 'text-neutral-700'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 ml-1">
                          {review.rating}.0
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${
                        isPending 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                          : isApproved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {isPending && <Clock className="w-3 h-3" />}
                        {isApproved && <CheckCircle2 className="w-3 h-3" />}
                        {isRejected && <XCircle className="w-3 h-3" />}
                        {review.status}
                      </span>

                      {/* Target Product or Service Category */}
                      {review.product_name ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 text-[10px] font-bold">
                          Product: {review.product_name}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/20 text-[10px] font-bold">
                          Service: {review.service_type || 'Interior Consultation'}
                        </span>
                      )}

                      {review.verified_purchase && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified Client
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                      "{review.title}"
                    </h3>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Approve button */}
                    {!isApproved && (
                      <button
                        onClick={() => handleApprove(review.id, review.name)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        title="Approve & Publish to Website"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                      </button>
                    )}

                    {/* Reject button */}
                    {!isRejected && (
                      <button
                        onClick={() => handleReject(review.id, review.name)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/60 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Mark as Rejected"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => openEditModal(review)}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white border border-white/20 transition-all cursor-pointer"
                      title="Edit Review Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(review.id, review.name)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                      title="Delete Review Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Review Message Body */}
                <div className="py-3 text-neutral-300 text-xs sm:text-sm leading-relaxed">
                  <p className="italic font-normal">
                    "{review.message}"
                  </p>
                </div>

                {/* Footer: Reviewer Info & Timestamp */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-white flex items-center gap-1">
                      — {review.name}
                    </span>
                    {review.email && (
                      <span className="text-neutral-500 font-mono text-[11px]">
                        📧 {review.email}
                      </span>
                    )}
                    {review.phone && (
                      <span className="text-neutral-500 font-mono text-[11px]">
                        📞 {review.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-500">
                    <span>ID: {review.id}</span>
                    <span>•</span>
                    <span>{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-gold/40 rounded-3xl p-6 shadow-2xl text-white">
            <button
              onClick={() => setEditingReview(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-4">
              Edit Review ({editingReview.id})
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-300 font-bold block mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white"
                >
                  <option value="pending">Pending Moderation</option>
                  <option value="approved">Approved & Published</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-300 font-bold block mb-1">Star Rating (1 - 5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditRating(s)}
                      className="p-1 cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${s <= editRating ? 'text-amber-400 fill-current' : 'text-neutral-700'}`} />
                    </button>
                  ))}
                  <span className="font-bold text-amber-400 ml-2">{editRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-bold block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-bold block mb-1">Review Headline</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-bold block mb-1">Review Message</label>
                <textarea
                  rows={4}
                  required
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white resize-none"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-bold block mb-1">Service / Project Category</label>
                <input
                  type="text"
                  value={editServiceType}
                  onChange={(e) => setEditServiceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
