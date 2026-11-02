import React, { useState, useEffect } from 'react';
import { PORTFOLIO_PROJECTS as DEFAULT_PROJECTS } from '../data/mockData';
import { PortfolioProject, CustomerReview } from '../types';
import { getPortfolioProjects } from '../services/portfolioService';
import { fetchPublicReviews } from '../services/reviewService';
import { 
  Sparkles, MapPin, Calendar, Maximize2, Star, Quote, 
  Rotate3d, ArrowLeftRight, Check, Eye, ExternalLink
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

interface PortfolioSectionProps {
  onRequestQuote: (projectTitle: string) => void;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ onRequestQuote }) => {
  const [projectsList, setProjectsList] = useState<PortfolioProject[]>(DEFAULT_PROJECTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 to 100
  const [activeProject, setActiveProject] = useState<PortfolioProject>(DEFAULT_PROJECTS[0]);
  const [activeTab, setActiveTab] = useState<'before-after' | 'walkthrough' | 'gallery'>('before-after');
  const [approvedServiceReviews, setApprovedServiceReviews] = useState<CustomerReview[]>([]);

  useEffect(() => {
    getPortfolioProjects().then(res => {
      if (res.projects && res.projects.length > 0) {
        setProjectsList(res.projects);
        setActiveProject(res.projects[0]);
      }
    });

    const loadServiceReviews = async () => {
      try {
        const res = await fetchPublicReviews();
        if (res.reviews && res.reviews.length > 0) {
          setApprovedServiceReviews(res.reviews);
        }
      } catch (_) {}
    };

    loadServiceReviews();

    const handleUpdate = () => loadServiceReviews();
    window.addEventListener('royalepic-reviews-updated', handleUpdate);
    return () => window.removeEventListener('royalepic-reviews-updated', handleUpdate);
  }, []);

  const categories = ['All', 'Residential', 'Commercial', 'Modular Kitchen', 'Hospitality', 'Architectural'];

  const filteredProjects = selectedCategory === 'All'
    ? projectsList
    : projectsList.filter(p => p.category === selectedCategory);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <section className="py-20 sm:py-28 bg-[#121214] text-white relative overflow-hidden" id="portfolio">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono block mb-2">
              Transformations & Case Studies
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
              Interior Portfolio & Walkthroughs
            </h2>
          </div>
          <p className="text-sm text-stone-400 max-w-md leading-relaxed">
            Drag the Before & After transformation slider below to witness how Royal Epic converts raw slab structures into bespoke architectural spaces.
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
                  ? 'bg-amber-500 text-black shadow-md font-bold'
                  : 'bg-stone-900 border border-white/10 text-stone-300 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Project Showcase Display with Before/After Slider */}
        <div className="bg-stone-900/90 border border-white/10 rounded-3xl p-6 lg:p-8 mb-16 shadow-2xl">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-mono block">
                Featured Case Study
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-0.5">
                {activeProject.title}
              </h3>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveTab('before-after')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'before-after'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" /> Before & After Slider
              </button>
              <button
                onClick={() => setActiveTab('walkthrough')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'walkthrough'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Rotate3d className="w-3.5 h-3.5" /> 360° Walkthrough
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left/Center: Interactive Before & After Slider or 360° Walkthrough Canvas */}
            <div className="lg:col-span-8">
              {activeTab === 'before-after' && (
                <div
                  onMouseMove={handleSliderMove}
                  onTouchMove={handleSliderMove}
                  className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-white/10 select-none cursor-ew-resize group shadow-2xl"
                >
                  {/* Before Image (Underneath) */}
                  <img
                    src={activeProject.beforeImage}
                    alt="Before Construction"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full border border-stone-700 text-stone-300 text-[11px] font-mono font-bold uppercase tracking-wider z-10">
                    Raw Site Before
                  </div>

                  {/* After Image (Clipped Overlay) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={activeProject.afterImage}
                      alt="After Royal Interior Finish"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover max-w-none"
                      style={{ width: '100%', height: '100%' }}
                    />
                    <div className="absolute top-4 left-4 bg-amber-500 text-black px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider whitespace-nowrap z-10 shadow-md">
                      Executed Handover
                    </div>
                  </div>

                  {/* Drag Handle Bar */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_15px_#f59e0b] cursor-ew-resize z-20 flex items-center justify-center"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center shadow-2xl border-2 border-black group-hover:scale-110 transition-transform">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'walkthrough' && (
                <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center p-4">
                  <img
                    src={activeProject.afterImage}
                    alt="360 View"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-3">
                      <Rotate3d className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-serif font-bold text-white mb-2">
                      Interactive 360° Virtual Room Tour
                    </h4>
                    <p className="text-xs text-stone-300 max-w-md mb-4 leading-relaxed">
                      Explore floor-to-ceiling material textures, cove lighting channels, and custom furniture fittings in 3D walkthrough mode.
                    </p>
                    <button
                      onClick={() => onRequestQuote(activeProject.title)}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors cursor-pointer"
                    >
                      Book 3D Room Consultation
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Project Execution Specifications */}
            <div className="lg:col-span-4 flex flex-col justify-between h-full">
              <div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-stone-400 font-bold uppercase block flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-amber-400" /> Location
                    </span>
                    <span className="text-xs font-semibold text-white truncate block mt-0.5">
                      {activeProject.location}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-stone-400 font-bold uppercase block flex items-center gap-1 font-mono">
                      <Maximize2 className="w-3 h-3 text-amber-400" /> Area
                    </span>
                    <span className="text-xs font-semibold text-white truncate block mt-0.5 font-mono">
                      {activeProject.areaSqFt.toLocaleString()} sq. ft.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-stone-400 font-bold uppercase block flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-amber-400" /> Completion
                    </span>
                    <span className="text-xs font-semibold text-white truncate block mt-0.5">
                      {activeProject.completionTime}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-stone-400 font-bold uppercase block flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Scope
                    </span>
                    <span className="text-xs font-semibold text-white truncate block mt-0.5">
                      Turnkey Execution
                    </span>
                  </div>
                </div>

                {/* Project Overview Note */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-6">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
                    Design & Build Overview
                  </span>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Custom manufacturing, factory-engineered finishes, and dedicated site supervision delivered for {activeProject.title}.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onRequestQuote(activeProject.title)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
              >
                Request Similar Design
              </button>
            </div>

          </div>

        </div>

        {/* Other Portfolio Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => setActiveProject(project)}
              className={`rounded-3xl overflow-hidden border transition-all cursor-pointer group bg-stone-900 ${
                activeProject.id === project.id
                  ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="h-52 overflow-hidden relative">
                <img
                  src={project.afterImage}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-400 text-[10px] font-bold uppercase font-mono">
                  {project.category}
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-serif font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {project.title}
                </h4>
                <p className="text-xs text-stone-400 mt-1 font-mono">
                  {project.location} • {project.areaSqFt} sq.ft.
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* CUSTOMER REVIEW SECTION: "What our customers say"                         */}
        {/* Minimal, natural, elegant, premium design with Google Reviews attribution */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 lg:p-10 shadow-sm text-stone-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GoogleIcon />
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-stone-500">
                  Google Business Profile
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                What our customers say
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl leading-relaxed">
                Authentic client feedback, project photos, and ratings from residential and commercial clients across Bengaluru are hosted on our official Google Maps profile.
              </p>
            </div>

            {/* Direct Google Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                href={GOOGLE_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider shadow-xs transition-all"
              >
                <span>Read All Google Reviews</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              </a>

              <a
                href={GOOGLE_WRITE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 hover:border-stone-300 text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>Write a Google Review</span>
              </a>
            </div>
          </div>

          {/* Dynamic Review Render: Genuine Verified Reviews only if available */}
          {approvedServiceReviews && approvedServiceReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              {approvedServiceReviews.slice(0, 3).map((review) => (
                <div key={review.id} className="p-5 rounded-2xl bg-[#FCFAF7] border border-stone-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-amber-500 mb-2.5">
                      {Array.from({ length: Math.min(5, Math.max(1, Math.round(review.rating || 5))) }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    {review.review_title && (
                      <h4 className="text-xs font-bold text-stone-900 mb-1.5">{review.review_title}</h4>
                    )}
                    <p className="text-xs text-stone-600 leading-relaxed italic mb-4">
                      "{review.review_message}"
                    </p>
                  </div>
                  <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                    <span className="font-semibold text-stone-800">{review.name}</span>
                    <span className="font-mono text-[10px] text-stone-400">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Verified Client'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Verified Studio Location: Thanisandra Main Road, Nagawara, Bengaluru</span>
              </div>
              <span className="text-[11px] font-mono text-stone-400">
                Official Google Maps Destination
              </span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
