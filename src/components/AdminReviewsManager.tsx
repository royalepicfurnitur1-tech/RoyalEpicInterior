import React, { useState, useEffect } from 'react';
import { 
  Star, CheckCircle2, XCircle, Trash2, Edit3, Search, 
  Filter, AlertCircle, RefreshCw, Eye, MessageSquare, Clock, 
  ThumbsUp, ShieldCheck, Check, Save, X
} from 'lucide-react';
import { CustomerReview, ReviewStatus } from '../types';
import { fetchAdminReviews, moderateReview, deleteReview } from '../services/reviewService';

export const AdminReviewsManager: React.FC = () => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editMessage, setEditMessage] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editAdminNotes, setEditAdminNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<ReviewStatus>('approved');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminReviews({
        status: selectedStatus,
        search: searchQuery
      });
      setReviews(res.reviews);
      setCounts(res.counts);
    } catch (e: any) {
      console.error('Failed to load admin reviews:', e);
      setActionMessage({ type: 'error', text: 'Failed to load reviews from Supabase.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [selectedStatus]);

  // Handle immediate status change (Approve or Reject)
  const handleQuickStatus = async (review: CustomerReview, newStatus: ReviewStatus) => {
    setActionMessage(null);
    try {
      const res = await moderateReview({
        id: review.id,
        status: newStatus
      });
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Review from ${review.name} has been marked as ${newStatus.toUpperCase()} in Supabase.`
        });
        await loadReviews();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to update review status.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error updating review.' });
    }
  };

  // Handle delete
  const handleDelete = async (id: string, clientName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the review from "${clientName}"? This action updates Supabase immediately.`)) {
      return;
    }
    setActionMessage(null);
    try {
      const res = await deleteReview(id);
      if (res.success) {
        setActionMessage({ type: 'success', text: `Review permanently deleted from database.` });
        await loadReviews();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to delete review.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error deleting review.' });
    }
  };

  // Open Edit Modal
  const openEditModal = (review: CustomerReview) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditTitle(review.review_title);
    setEditMessage(review.review_message);
    setEditName(review.name);
    setEditAdminNotes(review.admin_notes || '');
    setEditStatus(review.status);
  };

  // Save Edit Modal Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setIsSaving(true);
    setActionMessage(null);
    try {
      const res = await moderateReview({
        id: editingReview.id,
        status: editStatus,
        rating: editRating,
        review_title: editTitle,
        review_message: editMessage,
        name: editName,
        admin_notes: editAdminNotes
      });
      if (res.success) {
        setEditingReview(null);
        setActionMessage({ type: 'success', text: 'Review details updated in Supabase successfully.' });
        await loadReviews();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to update review.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error saving review.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-gold/30 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-widest mb-2 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Supabase Single Source of Truth
          </div>
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            ⭐ Customer Reviews & Feedback Management
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Moderate, verify, edit, and publish verified client feedback across the Royal Epic portal and product pages.
          </p>
        </div>

        <button
          onClick={loadReviews}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-gold' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-neutral-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-neutral-800 border-gold text-white shadow-md'
              : 'bg-neutral-900 border-white/10 text-neutral-400 hover:border-white/20'
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-bold block mb-1">All Reviews</span>
          <span className="text-2xl font-mono font-bold text-white">{counts.total}</span>
        </button>

        <button
          onClick={() => setSelectedStatus('pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'pending'
              ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/30'
              : 'bg-neutral-900 border-white/10 text-neutral-400 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold block mb-1 text-amber-400">
              ⏳ Pending Approval
            </span>
            {counts.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <span className="text-2xl font-mono font-bold text-amber-400">{counts.pending}</span>
        </button>

        <button
          onClick={() => setSelectedStatus('approved')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'approved'
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-md ring-1 ring-emerald-500/30'
              : 'bg-neutral-900 border-white/10 text-neutral-400 hover:border-white/20'
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-bold block mb-1 text-emerald-400">
            ✅ Published (Approved)
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400">{counts.approved}</span>
        </button>

        <button
          onClick={() => setSelectedStatus('rejected')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'rejected'
              ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/30'
              : 'bg-neutral-900 border-white/10 text-neutral-400 hover:border-white/20'
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-bold block mb-1 text-rose-400">
            ❌ Rejected
          </span>
          <span className="text-2xl font-mono font-bold text-rose-400">{counts.rejected}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadReviews()}
            placeholder="Search reviews by client name, email, headline, message, or project..."
            className="w-full bg-black/60 border border-white/15 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
          />
        </div>
        <button
          onClick={loadReviews}
          className="px-5 py-3 rounded-xl bg-gold hover:bg-gold/90 text-black text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Reviews Table / Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-neutral-400 bg-neutral-900/60 rounded-3xl border border-white/10">
            <RefreshCw className="w-8 h-8 animate-spin text-gold mx-auto mb-3" />
            <p className="text-xs">Querying reviews from Supabase database...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 bg-neutral-900/60 rounded-3xl border border-white/10">
            <MessageSquare className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-white mb-1">No reviews found</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              There are no reviews matching the current status filter. When clients submit feedback, they will appear here as "Pending".
            </p>
          </div>
        ) : (
          reviews.map((rev) => {
            const isPending = rev.status === 'pending';
            const isApproved = rev.status === 'approved';
            const isRejected = rev.status === 'rejected';

            return (
              <div
                key={rev.id}
                className={`p-6 rounded-3xl border transition-all ${
                  isPending
                    ? 'bg-neutral-900/90 border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                    : isApproved
                    ? 'bg-neutral-900/70 border-emerald-500/30'
                    : 'bg-neutral-950/70 border-white/10 opacity-70'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-black border border-white/15 text-gold font-bold text-sm flex items-center justify-center font-mono">
                      {rev.name ? rev.name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{rev.name}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : isPending
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}>
                          {rev.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        {rev.email && <span>{rev.email}</span>}
                        {rev.phone && <span>• {rev.phone}</span>}
                        <span>• {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars & ID */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-amber-400 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'
                          }`}
                        />
                      ))}
                      <span className="ml-1.5 text-xs font-mono font-bold text-white">{rev.rating}.0</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">ID: {rev.id}</span>
                  </div>
                </div>

                {/* Content body */}
                <div className="py-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-sm font-bold text-white">{rev.review_title}</h5>
                    {rev.product_name && (
                      <span className="px-2 py-0.5 rounded-md bg-gold/10 text-gold border border-gold/30 text-[10px] font-mono">
                        Product: {rev.product_name}
                      </span>
                    )}
                    {rev.project_type && (
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-neutral-300 border border-white/10 text-[10px] font-mono">
                        Service: {rev.project_type}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                    "{rev.review_message}"
                  </p>

                  {rev.admin_notes && (
                    <div className="text-[11px] text-amber-300/80 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/20">
                      <strong>Admin Notes:</strong> {rev.admin_notes}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <div className="text-[11px] text-neutral-400">
                    {isPending && <span className="text-amber-400">⚠️ Hidden from public website until approved.</span>}
                    {isApproved && <span className="text-emerald-400">✓ Currently visible on public website & product pages.</span>}
                    {isRejected && <span className="text-rose-400">✕ Hidden from public view.</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Approve button */}
                    {!isApproved && (
                      <button
                        onClick={() => handleQuickStatus(rev, 'approved')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}

                    {/* Reject button */}
                    {!isRejected && (
                      <button
                        onClick={() => handleQuickStatus(rev, 'rejected')}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-950 text-neutral-300 hover:text-rose-300 border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => openEditModal(rev)}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-gold" /> Edit
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(rev.id, rev.name)}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
                      title="Permanently Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-neutral-900 border border-gold/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative my-8">
            <button
              onClick={() => setEditingReview(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-1">
              Edit Review Details
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Review ID: <span className="font-mono text-gold">{editingReview.id}</span> • Changes update Supabase immediately.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-bold uppercase tracking-wider mb-1">Reviewer Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-bold uppercase tracking-wider mb-1">Moderation Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ReviewStatus)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-gold font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="pending" className="bg-neutral-900 text-amber-400">⏳ Pending</option>
                    <option value="approved" className="bg-neutral-900 text-emerald-400">✅ Approved (Live)</option>
                    <option value="rejected" className="bg-neutral-900 text-rose-400">❌ Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-bold uppercase tracking-wider mb-1">Star Rating (1 - 5)</label>
                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setEditRating(s)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= editRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-mono font-bold text-amber-400 ml-2">{editRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-bold uppercase tracking-wider mb-1">Review Headline</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-bold uppercase tracking-wider mb-1">Review Message</label>
                <textarea
                  required
                  rows={4}
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-gold resize-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-bold uppercase tracking-wider mb-1">Internal Admin Notes</label>
                <input
                  type="text"
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="e.g. Verified with project supervisor; customer was very pleased"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-neutral-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold/90 text-black font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save to Database</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
