import React, { useState, useEffect } from 'react';
import { PORTFOLIO_PROJECTS as DEFAULT_PROJECTS } from '../data/mockData';
import { PortfolioProject, CustomerReview } from '../types';
import { getPortfolioProjects } from '../services/portfolioService';
import { getManualCustomerReviews } from '../services/reviewService';
import { 
  Sparkles, MapPin, Calendar, Maximize2, Star, Quote, 
  Check, Eye, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

// Official Google Maps business destination configured for Royal Epic Commercial & Home Interiors
const GOOGLE_REVIEWS_URL =
  'https://maps.google.com/?q=Royal+Epic+Commercial+%26+Home+Interiors,+No.+10,+Royal+EPIC+Interiors,+2nd,+Thanisandra+Main+Road,+Near+Railway+Bridge,+Sinthan+Nagar,+Rachenahalli,+Nagawara,+Bengaluru,+Karnataka+560045';

const GOOGLE_WRITE_REVIEW_URL =
  'https://www.google.com/maps/search/?api=1&query=Royal+Epic+Commercial+%26+Home+Interiors,+No.+10,+Royal+EPIC+Interiors,+2nd,+Thanisandra+Main+Road,+Near+Railway+Bridge,+Sinthan+Nagar,+Rachenahalli,+Nagawara,+Bengaluru,+Karnataka+560045';

const GoogleIcon: React.FC = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const getInitials = (name?: string) => {
  if (!name) return 'RE';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ReviewAvatar: React.FC<{
  src?: string | null;
  name: string;
  initials: string;
}> = ({ src, name, initials }) => {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div 
        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EFEAE2] to-[#D8D2C6] border-2 border-white shadow-xs ring-1 ring-stone-300/80 flex items-center justify-center font-serif font-bold text-stone-700 text-xs shrink-0 tracking-wider"
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      loading="lazy"
      className="w-12 h-12 rounded-full object-cover object-top border-2 border-white shadow-xs ring-1 ring-stone-300/80 shrink-0"
    />
  );
};

interface PortfolioSectionProps {
  onRequestQuote: (projectTitle: string) => void;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ onRequestQuote }) => {
  const [projectsList, setProjectsList] = useState<PortfolioProject[]>(DEFAULT_PROJECTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<PortfolioProject>(DEFAULT_PROJECTS[0]);
  const [approvedServiceReviews, setApprovedServiceReviews] = useState<CustomerReview[]>([]);

  // Carousel state: exactly 4 cards on desktop, 2 on tablet, 1 on mobile
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 4;
  });
  const [isCarouselHovered, setIsCarouselHovered] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Responsive visible cards listener: 4 on desktop, 2 on tablet, 1 on mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalReviews = approvedServiceReviews.length;
  const maxIndex = Math.max(0, totalReviews - visibleCount);

  // Keep carouselIndex bounded
  useEffect(() => {
    if (carouselIndex > maxIndex) {
      setCarouselIndex(maxIndex);
    }
  }, [maxIndex, carouselIndex]);

  const handlePrevReview = () => {
    setCarouselIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNextReview = () => {
    setCarouselIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Subtle slow autoplay (6s), pauses when user hovers or interacts
  useEffect(() => {
    if (isCarouselHovered || totalReviews <= visibleCount) return;
    const timer = setInterval(() => {
      setCarouselIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [isCarouselHovered, totalReviews, visibleCount, maxIndex]);

  // Touch / Swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsCarouselHovered(true);
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      handleNextReview();
    } else if (diff < -45) {
      handlePrevReview();
    }
    setTouchStartX(null);
    setTimeout(() => setIsCarouselHovered(false), 2000);
  };

  useEffect(() => {
    getPortfolioProjects().then(res => {
      if (res.projects && res.projects.length > 0) {
        setProjectsList(res.projects);
        setActiveProject(res.projects[0]);
      }
    });

    const loadServiceReviews = async () => {
      try {
        const reviews = await getManualCustomerReviews({ activeOnly: true });
        setApprovedServiceReviews(reviews || []);
      } catch (_) {}
    };

    loadServiceReviews();

    const handleUpdate = () => loadServiceReviews();
    window.addEventListener('royalepic-reviews-updated', handleUpdate);
    return () => window.removeEventListener('royalepic-reviews-updated', handleUpdate);
  }, []);

  const categories = ['All', 'Residential', 'Commercial', 'Modular Kitchen', 'Hospitality', 'Architectural'];

  const filteredProjects = (selectedCategory === 'All'
    ? projectsList
    : projectsList.filter(p => p.category === selectedCategory)).slice(0, 4);

  return (
    <section className="py-20 sm:py-24 bg-[#A8A492] text-stone-900 relative overflow-hidden" id="portfolio">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#735422] font-mono block mb-2">
              Transformations & Case Studies
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
              Interior Portfolio & Walkthroughs
            </h2>
          </div>
          <p className="text-sm text-stone-700 max-w-md leading-relaxed">
            Explore turnkey transformations and completed architectural projects delivered by Royal Epic across Bengaluru.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                const firstMatch = projectsList.find(p => cat === 'All' || p.category === cat);
                if (firstMatch) setActiveProject(firstMatch);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white shadow-md font-bold'
                  : 'bg-white/80 border border-stone-300/80 text-stone-800 hover:text-stone-950 hover:bg-white hover:border-stone-400 font-medium'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Exactly 4 Portfolio Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => setActiveProject(project)}
              className={`rounded-3xl overflow-hidden border transition-all cursor-pointer group bg-white shadow-sm hover:shadow-xl ${
                activeProject.id === project.id
                  ? 'border-amber-600 ring-2 ring-amber-500/30'
                  : 'border-stone-200/90 hover:border-amber-500/60'
              }`}
            >
              <div className="h-52 overflow-hidden relative bg-stone-100">
                <img
                  src={project.afterImage}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-amber-300 text-[10px] font-bold uppercase font-mono shadow-xs">
                  {project.category}
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-serif font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                  {project.title}
                </h4>
                <p className="text-xs text-stone-600 mt-1 font-mono">
                  {project.location} • {project.areaSqFt} sq.ft.
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* CUSTOMER REVIEW SECTION: Harmonized Warm Taupe Container with White Cards */}
        {/* Responsive: 4 desktop / 2 tablet / 1 mobile. Constant fixed height.       */}
        {/* Unlimited reviews slide horizontally without expanding page length.       */}
        {/* ========================================================================= */}
        <div 
          className="bg-[#9E9A88] rounded-3xl p-5 sm:p-7 lg:p-8 border border-stone-300/60 shadow-sm text-stone-900"
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
        >
          {/* Centred Heading */}
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-full bg-black/10 border border-black/5 text-stone-900 text-[10px] font-mono uppercase tracking-widest font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-stone-900" />
              <span>Client Testimonials</span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              What Our Customers Say About Royal Epic Interiors
            </h3>
            <p className="text-xs text-stone-800/80 mt-1 max-w-lg mx-auto leading-relaxed">
              Authentic design journeys and client experiences from residential, commercial, and turnkey projects across Bengaluru.
            </p>
          </div>

          {/* Carousel Track with Previous Arrow on the Left & Next Arrow on the Right */}
          {approvedServiceReviews.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-8 text-center border border-stone-200/80 max-w-lg mx-auto my-4 shadow-xs">
              <Quote className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="font-serif font-bold text-stone-900 text-sm">
                Verified Customer Reviews
              </p>
              <p className="text-xs text-stone-600 mt-1">
                Customer reviews curated from recent turnkey handovers in Bengaluru are currently being updated.
              </p>
            </div>
          ) : (
            <div className="relative flex items-center">
              {/* Previous Arrow on the Left */}
              {totalReviews > visibleCount && (
                <button
                  onClick={handlePrevReview}
                  aria-label="Previous customer reviews"
                  className="shrink-0 -ml-2 sm:-ml-3 mr-2 sm:mr-3 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-stone-900 shadow-md border border-stone-300/80 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </button>
              )}

              {/* Overflow Hidden Sliding Window */}
              <div 
                className="overflow-hidden w-full relative pb-2"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ 
                    transform: `translateX(-${carouselIndex * (100 / visibleCount)}%)`,
                  }}
                >
                  {approvedServiceReviews.map((card, cardIdx) => {
                    const name = card.customer_name || card.name || 'Valued Client';
                    const rating = Math.min(5, Math.max(1, Math.round(card.rating || 5)));
                    const initials = getInitials(name);

                    return (
                      <div 
                        key={card.id || `carousel-card-${cardIdx}`}
                        className="w-full sm:w-1/2 lg:w-1/4 shrink-0 px-2 py-3"
                      >
                        <div className="bg-white rounded-[20px] p-5 sm:p-5.5 shadow-[0_10px_25px_-5px_rgba(30,25,20,0.08),0_8px_10px_-6px_rgba(30,25,20,0.04)] hover:shadow-[0_20px_35px_-5px_rgba(30,25,20,0.14),0_10px_15px_-5px_rgba(30,25,20,0.06)] hover:-translate-y-1.5 transition-all duration-300 ease-out border border-[#E7E2DA]/90 flex flex-col justify-between h-[275px]">
                          {/* TOP AREA: Quotation Mark & Gold Star Rating */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <Quote className="w-5 h-5 text-[#C49746] fill-[#C49746]/20" />
                              <div className="flex items-center gap-0.5 text-[#E5A93C]">
                                {Array.from({ length: rating }).map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-current text-[#E5A93C]" />
                                ))}
                              </div>
                            </div>

                            {/* MIDDLE AREA: Review Message */}
                            <p className="text-[12px] sm:text-[12.5px] text-[#3D3A37] leading-relaxed italic line-clamp-4 font-normal">
                              "{card.review_message}"
                            </p>
                          </div>

                          {/* BOTTOM AREA: Divider, Profile Photo, Customer Name */}
                          <div>
                            <hr className="border-t border-[#F0EBE3] mb-3" />

                            <div className="flex items-center gap-3">
                              <ReviewAvatar
                                src={card.profile_image_url}
                                name={name}
                                initials={initials}
                              />
                              <div className="truncate min-w-0">
                                <span className="font-serif font-bold text-stone-900 text-[13px] sm:text-sm tracking-tight block truncate">
                                  {name}
                                </span>
                                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block truncate">
                                  {card.city || card.project_type || 'Bengaluru Client'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next Arrow on the Right */}
              {totalReviews > visibleCount && (
                <button
                  onClick={handleNextReview}
                  aria-label="Next customer reviews"
                  className="shrink-0 -mr-2 sm:-mr-4 ml-2 sm:ml-3 z-10 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-stone-900 shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-stone-200/80 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
            </div>
          )}

          {/* Carousel Pagination Dots */}
          {totalReviews > visibleCount && (
            <div className="flex items-center justify-center gap-1.5 my-3">
              {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setCarouselIndex(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    carouselIndex === dotIdx 
                      ? 'w-6 bg-stone-900' 
                      : 'w-1.5 bg-stone-900/30 hover:bg-stone-900/60'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Action Buttons & Google Links - Compact */}
          <div className="pt-4 border-t border-stone-300/40 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
            <p className="text-[11px] text-stone-800/80 text-center sm:text-left">
              ⭐ Genuine reviews and curated design showcases managed via Royal Epic Admin Dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <a
                href={GOOGLE_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider shadow-xs transition-all"
              >
                <span>View Business on Google Maps</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </a>

              <a
                href={GOOGLE_WRITE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 hover:border-stone-400 text-xs font-semibold uppercase tracking-wider shadow-xs transition-all"
              >
                <Star className="w-3 h-3 text-amber-500" />
                <span>Write a Google Review</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
