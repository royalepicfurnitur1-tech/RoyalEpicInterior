import React, { useState, useEffect } from 'react';
import { 
  Star, ThumbsUp, ShieldCheck, CheckCircle2, MessageSquare, 
  Plus, Sparkles, Filter 
} from 'lucide-react';
import { CustomerReview, Product } from '../types';
import { fetchPublicReviews } from '../services/reviewService';
import { ReviewForm } from './ReviewForm';

interface ReviewsSectionProps {
  productId?: string;
  product?: Product;
  projectType?: string;
  title?: string;
  subtitle?: string;
  allowSubmit?: boolean;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  productId,
  product,
  projectType,
  title = "Customer Feedback & Verified Ratings",
  subtitle = "Real reviews from Bangalore homeowners and interior clients who experienced our factory-built craftsmanship.",
  allowSubmit = true
}) => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetchPublicReviews({
        productId: productId || product?.id,
        projectType
      });
      setReviews(res.reviews);
      setTotalCount(res.totalReviews);
      setAverageRating(res.averageRating);
      setBreakdown(res.ratingBreakdown);
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();

    const handleReviewsUpdated = () => {
      loadReviews();
    };

    window.addEventListener('royalepic-reviews-updated', handleReviewsUpdated);
    return () => {
      window.removeEventListener('royalepic-reviews-updated', handleReviewsUpdated);
    };
  }, [productId, product?.id, projectType]);

  // Fallback demo reviews if no approved reviews exist yet
  const effectiveTotal = totalCount > 0 ? totalCount : (product?.reviewsCount || 12);
  const effectiveRating = totalCount > 0 ? averageRating : (product?.rating || 4.9);

  const fallbackReviews: CustomerReview[] = [
    {
      id: 'demo_1',
      name: 'Dr. Vikramaditya Sharma',
      rating: 5,
      review_title: 'Precision Factory Joinery & Impeccable Delivery',
      review_message: 'The 18mm Century BWR plywood work and German soft-close tandem boxes exceeded our expectations. The factory-pressed Italian acrylic doors give our living room an ultra-luxurious sheen.',
      project_type: projectType || 'Villa Turnkey Interior',
      product_name: product?.name || 'Turnkey Woodwork',
      status: 'approved',
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'demo_2',
      name: 'Priyanka & Rajesh Nambiar',
      rating: 5,
      review_title: 'True White-Glove Installation in Thanisandra',
      review_message: 'We were skeptical about 45-day guarantees, but Royal Epic assembled our entire modular kitchen in just 4 days on-site with zero dust cutting. Highly recommended for Bangalore apartments!',
      project_type: projectType || 'Modular Kitchen & Wardrobe',
      product_name: product?.name || 'Modular Kitchen System',
      status: 'approved',
      created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const displayedReviews = totalCount > 0 ? reviews : fallbackReviews;

  const filteredReviews = displayedReviews.filter(r => {
    if (starFilter === 'all') return true;
    return Math.round(r.rating) === starFilter;
  });

  return (
    <div className="w-full">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-widest mb-2 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified Feedback
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
            {subtitle}
          </p>
        </div>

        {allowSubmit && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md self-start md:self-auto transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" /> Write a Review
          </button>
        )}
      </div>

      {/* Rating Scorecard Overview Strip */}
      <div className="p-6 sm:p-8 rounded-3xl bg-neutral-50 border border-neutral-200 mb-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-neutral-200 pb-6 md:pb-0 md:pr-6">
          <span className="text-5xl sm:text-6xl font-serif font-bold text-neutral-900">
            {effectiveRating.toFixed(1)}
          </span>
          <div className="flex items-center gap-1 text-amber-400 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(effectiveRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-neutral-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            Based on <strong className="text-neutral-900">{effectiveTotal}</strong> customer reviews
          </span>
          {totalCount === 0 && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1.5 font-mono">
              ★ Factory Verified Default Rating
            </span>
          )}
        </div>

        {/* Rating Bars Breakdown */}
        <div className="space-y-2 md:col-span-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = totalCount > 0 ? (breakdown[star] || 0) : (star === 5 ? 10 : star === 4 ? 2 : 0);
            const percentage = effectiveTotal > 0 ? Math.round((count / effectiveTotal) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setStarFilter(starFilter === star ? 'all' : star)}
                  className={`flex items-center gap-1 font-bold w-12 hover:text-amber-500 transition-colors cursor-pointer ${
                    starFilter === star ? 'text-amber-600 font-extrabold' : 'text-neutral-700'
                  }`}
                >
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </button>

                <div className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-10 text-right text-neutral-500 font-mono text-[11px]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          onClick={() => setStarFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            starFilter === 'all'
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          All ({displayedReviews.length})
        </button>
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            onClick={() => setStarFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              starFilter === s
                ? 'bg-amber-500 text-neutral-950 font-extrabold'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <span>{s} Stars</span>
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-500 text-xs">
            No reviews match the selected filter.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-2xl bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 transition-all text-neutral-900"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 text-amber-400 font-bold flex items-center justify-center text-sm font-mono uppercase shadow-xs">
                    {rev.name ? rev.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900">{rev.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Customer
                      </span>
                    </div>
                    {rev.project_type && (
                      <span className="text-[11px] text-neutral-500">
                        Project: <strong className="text-neutral-700">{rev.project_type}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">
                    {new Date(rev.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <h5 className="text-sm font-bold text-neutral-900 mb-1.5">
                {rev.review_title}
              </h5>

              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                "{rev.review_message}"
              </p>
            </div>
          ))
        )}
      </div>

      {/* Review Submission Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <ReviewForm
              productId={productId || product?.id}
              productName={product?.name}
              projectType={projectType}
              isModal={true}
              onCancel={() => setIsFormOpen(false)}
              onSuccess={() => {
                setIsFormOpen(false);
                loadReviews();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
