import React, { useState, useEffect } from 'react';
import { PORTFOLIO_PROJECTS as DEFAULT_PROJECTS } from '../data/mockData';
import { PortfolioProject, CustomerReview } from '../types';
import { getPortfolioProjects } from '../services/portfolioService';
import { fetchPublicReviews } from '../services/reviewService';
import { 
  Sparkles, MapPin, Calendar, Maximize2, Star, Quote, 
  Rotate3d, ArrowLeftRight, Check, Eye
} from 'lucide-react';
import { motion } from 'motion/react';

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

            {/* Right: Project Details & Client Testimonial */}
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
                      <Star className="w-3 h-3 text-amber-400 fill-current" /> Rating
                    </span>
                    <span className="text-xs font-semibold text-white truncate block mt-0.5 font-mono">
                      {activeProject.clientRating} / 5.0
                    </span>
                  </div>
                </div>

                {/* Client Review Box (Live Approved Review from Supabase or Fallback Demo) */}
                {(() => {
                  const matchedReview = approvedServiceReviews.find(
                    r => (r.project_type && r.project_type.toLowerCase().includes(activeProject.category.toLowerCase())) ||
                         (r.project_type && r.project_type.toLowerCase().includes(activeProject.title.toLowerCase()))
                  ) || (approvedServiceReviews.length > 0 ? approvedServiceReviews[0] : null);

                  const reviewText = matchedReview ? matchedReview.review_message : activeProject.clientReview;
                  const reviewerName = matchedReview ? matchedReview.name : activeProject.clientName;
                  const reviewTitle = matchedReview ? matchedReview.review_title : null;
                  const isVerifiedLive = Boolean(matchedReview);

                  return (
                    <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/20 mb-6 relative">
                      <Quote className="w-5 h-5 text-amber-500/30 absolute top-3 right-3" />
                      {reviewTitle && (
                        <h5 className="text-xs font-bold text-white mb-1.5 line-clamp-1">{reviewTitle}</h5>
                      )}
                      <p className="text-xs text-stone-300 italic leading-relaxed mb-3">
                        "{reviewText}"
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 block">
                          — {reviewerName}
                        </span>
                        {isVerifiedLive && (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <Check className="w-3 h-3" /> Live Verified
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      </div>
    </section>
  );
};
