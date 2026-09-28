import React, { useState } from 'react';
import { Star, Send, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { submitCustomerReview } from '../services/reviewService';
import { SubmitReviewPayload, CustomerReview } from '../types';

interface ReviewFormProps {
  productId?: string;
  productName?: string;
  projectType?: string;
  onSuccess?: (review?: CustomerReview) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  productName,
  projectType,
  onSuccess,
  onCancel,
  isModal = false
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState(projectType || '3BHK Luxury Interior');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const projectTypeOptions = [
    '3BHK Luxury Interior',
    '2BHK Premium Interior',
    'Villa / Independent House Turnkey',
    'German Modular Kitchen',
    'Custom Wooden Wardrobes & Storage',
    'Heritage Home Renovation',
    'Commercial Office / Retail Interior',
    'Luxury Solid Wood Doors & Furniture',
    'Other Bespoke Woodwork'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!reviewTitle.trim()) {
      setErrorMessage('Please enter a review headline.');
      return;
    }
    if (!reviewMessage.trim()) {
      setErrorMessage('Please share your detailed feedback.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: SubmitReviewPayload = {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      rating,
      review_title: reviewTitle.trim(),
      review_message: reviewMessage.trim(),
      product_id: productId || null,
      product_name: productName || null,
      project_type: selectedProjectType
    };

    const res = await submitCustomerReview(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitSuccess(true);
      if (onSuccess) {
        onSuccess(res.review);
      }
    } else {
      setErrorMessage(res.error || 'Failed to submit review. Please try again.');
    }
  };

  if (submitSuccess) {
    return (
      <div className="p-8 rounded-3xl bg-neutral-900 border border-gold/40 text-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-serif font-bold text-white mb-2">Thank You for Your Feedback!</h3>
        <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed mb-6">
          Your review has been successfully submitted to Royal Epic. To maintain authenticity and protect our community, every review is verified by our QA team before going live on our public catalog.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setSubmitSuccess(false);
              setName('');
              setEmail('');
              setPhone('');
              setReviewTitle('');
              setReviewMessage('');
              onCancel?.();
            }}
            className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold/90 text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl bg-neutral-900/90 border border-white/10 text-white p-6 sm:p-8 relative ${isModal ? 'shadow-2xl' : ''}`}>
      {isModal && onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-widest mb-2 font-mono">
          <Sparkles className="w-3 h-3" /> Verified Client Feedback
        </div>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
          {productName ? `Review ${productName}` : 'Share Your Royal Epic Experience'}
        </h3>
        <p className="text-xs text-neutral-400 mt-1">
          {productName
            ? 'Rate this architectural product and help fellow homeowners make confident design choices.'
            : 'Share your interior renovation, modular woodwork, or turnkey project experience.'}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
            Overall Rating <span className="text-amber-400">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/50 p-2.5 rounded-xl border border-white/10">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-neutral-600 hover:text-amber-400 transition-colors cursor-pointer focus:outline-none"
                  aria-label={`${star} star`}
                >
                  <Star
                    className={`w-6 h-6 transition-all ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400 scale-110'
                        : 'text-neutral-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-400 font-mono">
              {rating === 5 && '5.0 — Exceptional & Flawless'}
              {rating === 4 && '4.0 — High Quality Craftsmanship'}
              {rating === 3 && '3.0 — Satisfactory Experience'}
              {rating === 2 && '2.0 — Needs Quality Improvement'}
              {rating === 1 && '1.0 — Disappointing'}
            </span>
          </div>
        </div>

        {/* Project or Service Category (if not a specific product) */}
        {!productId && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Project / Service Type
            </label>
            <select
              value={selectedProjectType}
              onChange={(e) => setSelectedProjectType(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
            >
              {projectTypeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-neutral-900 text-white">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Client Name & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Your Name <span className="text-gold">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kulkarni"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Email Address <span className="text-[10px] text-neutral-500 font-normal">(Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ramesh@example.com"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Phone Number <span className="text-[10px] text-neutral-500 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98450 XXXXX"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* Review Title Headline */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
            Review Headline / Summary <span className="text-gold">*</span>
          </label>
          <input
            type="text"
            required
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            placeholder="e.g. Outstanding Italian Acrylic Finish & On-Time Turnkey Delivery!"
            className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
          />
        </div>

        {/* Review Message Textarea */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
            Detailed Review & Experience <span className="text-gold">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={reviewMessage}
            onChange={(e) => setReviewMessage(e.target.value)}
            placeholder="Describe your design consultations, factory finish quality, carpenter assembly, hardware smoothness, and overall satisfaction..."
            className="w-full bg-black/60 border border-white/15 rounded-xl p-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold resize-none"
          />
        </div>

        {/* Notice on Moderation */}
        <p className="text-[11px] text-neutral-400 italic">
          🔒 Note: To maintain verified credibility on Royal Epic, submitted reviews undergo rapid administrative verification before publishing to the live website.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl border border-white/15 text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-3 rounded-xl bg-gold hover:bg-gold/90 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting to Database...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
