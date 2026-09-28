import React, { useState } from 'react';
import { Star, X, CheckCircle2, MessageSquare, Sparkles, Building, User, Mail, Phone, Tag } from 'lucide-react';
import { submitCustomerReview } from '../services/reviewService';
import { Product } from '../types';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledProduct?: Product | null;
  prefilledServiceType?: string;
  onReviewSubmitted?: () => void;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  isOpen,
  onClose,
  prefilledProduct,
  prefilledServiceType,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [serviceType, setServiceType] = useState<string>(
    prefilledServiceType || (prefilledProduct ? prefilledProduct.category : 'Residential Interior')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please provide a title for your review.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Please write your review feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitCustomerReview({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        rating,
        title: title.trim(),
        message: message.trim(),
        product_id: prefilledProduct ? prefilledProduct.id : undefined,
        product_name: prefilledProduct ? prefilledProduct.name : undefined,
        service_type: serviceType
      });

      if (res.success) {
        setIsSuccess(true);
        if (onReviewSubmitted) onReviewSubmitted();
      } else {
        setErrorMessage(res.error || 'Failed to submit review. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error submitting review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setErrorMessage('');
    setName('');
    setEmail('');
    setPhone('');
    setTitle('');
    setMessage('');
    setRating(5);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl my-8 bg-neutral-900 border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white">
              Thank You For Your Review!
            </h3>
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-black/40 border border-gold/20 text-xs text-neutral-300 leading-relaxed space-y-2">
              <p className="font-semibold text-gold">
                Status: Pending Moderation
              </p>
              <p>
                Your feedback has been logged in our central database. In accordance with Royal Epic quality standards, reviews are verified by our team and will appear publicly once approved.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={handleResetAndClose}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-widest mb-2 font-mono">
                <Sparkles className="w-3 h-3" /> Royal Epic Client Feedback
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                Share Your Experience
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                {prefilledProduct 
                  ? `Reviewing: ${prefilledProduct.name}`
                  : 'Your honest feedback helps us maintain world-class craftsmanship and turnkey service.'}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Selector */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-center">
                <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-400 block mb-2 font-mono">
                  Your Rating (1 to 5 Stars)
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-neutral-600 hover:scale-125 transition-all cursor-pointer"
                      >
                        <Star 
                          className={`w-8 h-8 transition-colors ${
                            isFilled 
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                              : 'text-neutral-700'
                          }`} 
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs font-semibold text-gold">
                  {rating === 5 && '★★★★★ Outstanding / Flawless (5.0)'}
                  {rating === 4 && '★★★★☆ Very Good / High Quality (4.0)'}
                  {rating === 3 && '★★★☆☆ Average Experience (3.0)'}
                  {rating === 2 && '★★☆☆☆ Below Expectations (2.0)'}
                  {rating === 1 && '★☆☆☆☆ Unsatisfactory (1.0)'}
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Review Headline / Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stunning Turnkey Finish for our 3BHK Penthouse"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              {/* Review Message */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Your Review / Experience <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share details about the craftsmanship, timeline, material quality, and team communication..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>

              {/* Service / Project Category Selection */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gold" /> Project / Product Category
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-gold transition-colors"
                >
                  <option value="Residential Interior">Residential Luxury Turnkey Interior</option>
                  <option value="Modular Kitchen">Modular Island & Acrylic Kitchen</option>
                  <option value="Living Room Luxury">Living Room Luxury & Sofas</option>
                  <option value="Dining Room Elegance">Dining Room & Teak Wood Tables</option>
                  <option value="Bedroom & Wardrobes">Floor-to-Ceiling Wardrobes & Beds</option>
                  <option value="Commercial Interior">Commercial Office & Retail Interior</option>
                  <option value="Heritage Traditional Home">Heritage & Traditional Wooden Home</option>
                  <option value="Hospitality & Restaurant">Restaurant & Commercial Kitchen</option>
                </select>
              </div>

              {/* Customer Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-gold" /> Your Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gold" /> Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gold" /> Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-neutral-400 flex items-start gap-2">
                <Building className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>
                  All submitted reviews are stored in the central database as <strong className="text-amber-400">Pending</strong> until moderated by our admin team.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
