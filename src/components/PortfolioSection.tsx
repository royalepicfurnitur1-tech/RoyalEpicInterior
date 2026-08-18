import React, { useState, useEffect } from 'react';
import { PORTFOLIO_PROJECTS as DEFAULT_PROJECTS } from '../data/mockData';
import { PortfolioProject } from '../types';
import { getPortfolioProjects } from '../services/portfolioService';
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

  useEffect(() => {
    getPortfolioProjects().then(res => {
      if (res.projects && res.projects.length > 0) {
        setProjectsList(res.projects);
        setActiveProject(res.projects[0]);
      }
    });
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
    <section className="py-20 bg-neutral-950 text-white relative overflow-hidden" id="portfolio">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Architectural Showcase & Transformations
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            Interior Portfolio & Before/After Walkthroughs
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Drag the Before & After transformation slider below to witness how Royal Epic converts raw slab structures into breathtaking luxury spaces.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-6 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                const firstMatch = projectsList.find(p => cat === 'All' || p.category === cat);
                if (firstMatch) setActiveProject(firstMatch);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Project Showcase Display with Before/After Slider */}
        <div className="bg-neutral-900/80 border border-gold/30 rounded-3xl p-6 lg:p-8 mb-16 shadow-2xl">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gold font-mono">
                Featured Case Study
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                {activeProject.title}
              </h3>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('before-after')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'before-after'
                    ? 'bg-gold text-black shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" /> Before & After Slider
              </button>
              <button
                onClick={() => setActiveTab('walkthrough')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'walkthrough'
                    ? 'bg-gold text-black shadow'
                    : 'text-neutral-400 hover:text-white'
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
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider z-10">
                    RAW STRUCTURE BEFORE
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
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-gold/50 text-gold text-xs font-bold uppercase tracking-wider whitespace-nowrap z-10">
                      ROYAL EPIC LUXURY AFTER
                    </div>
                  </div>

                  {/* Drag Handle Bar */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-gold shadow-[0_0_15px_#d4af37] cursor-ew-resize z-20 flex items-center justify-center"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="w-9 h-9 rounded-full bg-gold text-black font-bold flex items-center justify-center shadow-2xl border-2 border-black group-hover:scale-110 transition-transform">
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
                    className="w-full h-full object-cover opacity-80 animate-pulse-slow"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center text-gold mb-3 animate-bounce">
                      <Rotate3d className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-serif font-bold text-white mb-2">
                      Interactive 360° Virtual Room Tour
                    </h4>
                    <p className="text-xs text-neutral-300 max-w-md mb-4">
                      Explore floor-to-ceiling material textures, cove lighting channels, and custom furniture fittings in 3D walkthrough mode.
                    </p>
                    <button
                      onClick={() => onRequestQuote(activeProject.title)}
                      className="px-5 py-2.5 rounded-xl bg-gold text-black text-xs font-bold uppercase tracking-wider"
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
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gold" /> Location
                    </span>
                    <span className="text-xs font-semibold text-white truncate block mt-0.5">
                      {activeProject.location}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-gold" /> Area
                    </span>
                    <span className="text-xs font-semibold text-white truncate block mt-0.5">
                      {activeProject.areaSqFt.toLocaleString()} sq. ft.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gold" /> Completion
                    </span>
                    <span className="text-xs font-semibold text-white truncate block mt-0.5">
                      {activeProject.completionTime}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-current" /> Rating
                    </span>
                    <span className="text-xs font-semibold text-white truncate block mt-0.5">
                      {activeProject.clientRating} / 5.0
                    </span>
                  </div>
                </div>

                {/* Client Review Box */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-800/80 to-black border border-gold/20 mb-6 relative">
                  <Quote className="w-6 h-6 text-gold/30 absolute top-3 right-3" />
                  <p className="text-xs text-neutral-300 italic leading-relaxed mb-3">
                    "{activeProject.clientReview}"
                  </p>
                  <span className="text-xs font-bold text-gold block">
                    — {activeProject.clientName}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onRequestQuote(activeProject.title)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
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
              className={`rounded-2xl overflow-hidden border transition-all cursor-pointer group bg-neutral-900 ${
                activeProject.id === project.id
                  ? 'border-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={project.afterImage}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-gold text-[10px] font-bold uppercase">
                  {project.category}
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-serif font-bold text-white group-hover:text-gold transition-colors line-clamp-1">
                  {project.title}
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
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
