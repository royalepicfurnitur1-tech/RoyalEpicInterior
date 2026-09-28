import React, { useState } from 'react';
import { X, Star, MessageSquare, CheckCircle2, User, Mail, Sparkles } from 'lucide-react';
import { submitWebsiteFeedback } from '../lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Please write your feedback message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitWebsiteFeedback({
        name: name.trim(),
        email: email.trim() || null,
        rating: rating || 5,
        message: message.trim(),
      });

      if (res.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          setName('');
          setEmail('');
          setRating(5);
          setMessage('');
          onClose();
        }, 2200);
      } else {
        setErrorMessage(res.error || 'Failed to submit feedback. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDescriptions: Record<number, string> = {
    1: 'Needs Improvement',
    2: 'Fair Experience',
    3: 'Good Quality',
    4: 'Very Good & Impressive',
    5: 'Exceptional Luxury Standard'
  };

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div 
        className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-md w-full p-6 sm:p-7 relative text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/60 border border-white/10 text-neutral-400 hover:text-white hover:border-gold transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white mb-1">
                Thank You for Your Feedback!
              </h3>
              <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
                Your thoughts have been securely recorded in our database. We appreciate you helping us elevate the Royal Epic experience.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold text-[11px] font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              Rating: {rating} / 5 Stars
            </div>
          </div>
        ) : (
          <div>
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest mb-2 border border-gold/30">
              <MessageSquare className="w-3 h-3 text-gold" /> Website Feedback
            </div>

            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-1">
              Share Your Thoughts
            </h3>

            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Tell us about your experience browsing Royal Epic Interior. Your feedback is stored privately and reviewed by our design directors.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Rating <span className="text-gold">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-black/60 border border-white/10 px-3 py-2 rounded-xl">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= activeDisplayRating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                          aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : 'text-neutral-600'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs text-gold font-medium font-sans">
                    {ratingDescriptions[activeDisplayRating] || `${rating} Stars`}
                  </span>
                </div>
              </div>

              {/* Name Input (Required) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Your Name <span className="text-gold">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-black/60 border border-white/15 focus:border-gold rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email Input (Optional) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Email Address <span className="text-neutral-500 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com (optional)"
                    className="w-full bg-black/60 border border-white/15 focus:border-gold rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Message (Required) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Feedback Message <span className="text-gold">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share what you liked, suggestions for our furniture catalog, 3D experience, or service clarity..."
                  className="w-full bg-black/60 border border-white/15 focus:border-gold rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none resize-none transition-colors"
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 rounded-xl p-2.5">
                  {errorMessage}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold/20 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-neutral-950" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
