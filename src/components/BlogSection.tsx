import React, { useState } from 'react';
import { BLOG_POSTS } from '../data/mockData';
import { BlogPost } from '../types';
import { ArrowUpRight, ArrowRight, Share2, Check, Clock, X, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BlogSectionProps {
  onRequestQuote?: (topic?: string) => void;
  onNavigate?: (path: string) => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ onRequestQuote, onNavigate }) => {
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showAllArchive, setShowAllArchive] = useState<boolean>(false);

  // Safeguard: Ensure at least one post exists
  const allPosts = BLOG_POSTS && BLOG_POSTS.length > 0 ? BLOG_POSTS : [];
  const featuredPost: BlogPost | undefined = allPosts[featuredIndex] || allPosts[0];

  // Up to 4 next articles (excluding the currently featured one)
  const nextArticles = allPosts.filter((_, idx) => idx !== featuredIndex).slice(0, 4);

  const handleCopyShare = async (e: React.MouseEvent, post: BlogPost) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/blog#${post.slug}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2400);
      }
    } catch (_) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  const handleOpenArticle = (post: BlogPost) => {
    setActiveArticle(post);
  };

  const handleViewAllArticles = () => {
    if (onNavigate) {
      onNavigate('/blog');
    } else {
      setShowAllArchive(true);
    }
  };

  if (!featuredPost) return null;

  return (
    <section 
      id="blog" 
      className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2] text-stone-900 border-t border-b border-[#E7E2DA] relative selection:bg-[#C49746]/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Masthead */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 mb-10 border-b border-[#E5DFD5]">
          <div>
            <span className="text-[11px] uppercase tracking-[0.24em] font-medium text-[#8C6D3B] block mb-2 font-sans">
              Architectural Monographs & Journal
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-serif font-normal text-stone-900 tracking-tight leading-tight">
              Royal Epic Design Journal
            </h2>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-sans text-stone-500">
            <span className="hidden sm:inline">Curated spatial insights & joinery craft</span>
            <button
              onClick={handleViewAllArticles}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] font-semibold text-stone-800 hover:text-[#8C6D3B] transition-colors cursor-pointer group"
            >
              <span>View All Articles</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#8C6D3B] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Magazine-Style Three-Column Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10 xl:gap-12">
          
          {/* ==================================================== */}
          {/* 1. LEFT COLUMN: Article Number & Minimal Actions     */}
          {/* ==================================================== */}
          <div className="hidden lg:flex flex-col items-start gap-6 w-12 xl:w-14 shrink-0 pt-1 text-stone-400">
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-widest font-mono text-stone-400">NO.</span>
              <span className="text-2xl xl:text-3xl font-serif text-stone-900 font-normal leading-none mt-0.5">
                {String(featuredIndex + 1).padStart(2, '0')}
              </span>
            </div>

            <div className="w-6 h-px bg-[#E5DFD5]" />

            <div className="flex flex-col items-start gap-3">
              <button
                onClick={(e) => handleCopyShare(e, featuredPost)}
                title="Copy article link"
                className="p-2 -ml-2 rounded text-stone-400 hover:text-stone-900 hover:bg-stone-200/50 transition-colors relative cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                {copiedLink && (
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-stone-900 text-white text-[10px] font-mono tracking-normal rounded whitespace-nowrap shadow-sm">
                    Copied
                  </span>
                )}
              </button>
              
              <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase [writing-mode:vertical-lr] rotate-180 pt-2">
                Royal Epic
              </span>
            </div>
          </div>

          {/* ==================================================== */}
          {/* 2. CENTRE COLUMN: Featured Article Showcase          */}
          {/* ==================================================== */}
          <div className="flex-1 w-full flex flex-col justify-between">
            <article className="group">
              
              {/* Category & Mobile Index */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#8C6D3B]">
                  {featuredPost.category}
                </span>
                <span className="lg:hidden text-xs font-mono text-stone-400">
                  {String(featuredIndex + 1).padStart(2, '0')} / {String(allPosts.length).padStart(2, '0')}
                </span>
              </div>

              {/* Headline */}
              <h3 
                onClick={() => handleOpenArticle(featuredPost)}
                className="text-2xl sm:text-3xl lg:text-[2.2rem] xl:text-[2.35rem] font-serif font-normal text-stone-900 leading-[1.22] tracking-tight mb-4 group-hover:text-stone-700 transition-colors cursor-pointer"
              >
                {featuredPost.title}
              </h3>

              {/* Byline Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-sans mb-5 pb-4 border-b border-[#E5DFD5]">
                <span>By {featuredPost.author}</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span>{featuredPost.date}</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="flex items-center gap-1 text-stone-500 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-[#8C6D3B]" /> {featuredPost.readTime}
                </span>
              </div>

              {/* Featured Architectural Photograph */}
              <div 
                onClick={() => handleOpenArticle(featuredPost)}
                className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100 cursor-pointer mb-5 border border-stone-200/70"
              >
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              </div>

              {/* Excerpt Introduction */}
              <p className="text-stone-600 font-serif italic text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
                "{featuredPost.excerpt}"
              </p>

              {/* Action: Read Full Article */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleOpenArticle(featuredPost)}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-stone-900 border-b border-stone-900 pb-1 hover:text-[#8C6D3B] hover:border-[#8C6D3B] transition-colors cursor-pointer group/btn"
                >
                  <span>Read Full Article</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-stone-700 group-hover/btn:text-[#8C6D3B] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </button>

                <div className="lg:hidden flex items-center gap-2">
                  <button
                    onClick={(e) => handleCopyShare(e, featuredPost)}
                    className="p-2 text-stone-500 hover:text-stone-900 cursor-pointer"
                    title="Share article"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </article>
          </div>

          {/* ==================================================== */}
          {/* 3. RIGHT COLUMN: Next Articles                       */}
          {/* ==================================================== */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 pt-6 lg:pt-0 lg:border-l lg:border-[#E5DFD5] lg:pl-8 xl:pl-10">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3 mb-6">
              <h4 className="text-xs uppercase tracking-[0.22em] font-bold text-stone-900 font-sans">
                Next Articles
              </h4>
              <span className="text-[11px] font-mono text-stone-400">
                {nextArticles.length} Stories
              </span>
            </div>

            {/* List of 3 to 4 compact horizontal links */}
            <div className="space-y-6">
              {nextArticles.map((post) => {
                const originalIndex = allPosts.findIndex((p) => p.id === post.id);
                return (
                  <div
                    key={post.id}
                    className="group flex items-start gap-4 pb-5 border-b border-[#EAE5DC] last:border-b-0 cursor-pointer"
                    onClick={() => {
                      if (originalIndex !== -1) {
                        setFeaturedIndex(originalIndex);
                      }
                    }}
                  >
                    {/* Small Thumbnail */}
                    <div className="w-20 h-16 sm:w-22 sm:h-18 rounded-xs overflow-hidden shrink-0 bg-stone-200 border border-stone-200/80">
                      <img
                        src={post.image}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase tracking-widest text-[#8C6D3B] font-medium block truncate mb-1">
                        {post.category}
                      </span>
                      
                      <h5 className="text-xs sm:text-[13px] font-serif font-medium text-stone-900 line-clamp-2 leading-snug group-hover:text-[#8C6D3B] transition-colors">
                        {post.title}
                      </h5>

                      <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-stone-400 font-mono">
                        <span>{post.date}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenArticle(post);
                          }}
                          className="text-[#8C6D3B] hover:text-stone-900 font-sans font-medium hover:underline inline-flex items-center gap-0.5"
                        >
                          Read <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtle View All Action */}
            <div className="pt-6 mt-2 border-t border-[#E5DFD5]">
              <button
                onClick={handleViewAllArticles}
                className="w-full py-2.5 text-center text-xs uppercase tracking-[0.2em] font-medium text-stone-700 hover:text-stone-950 border border-stone-300 hover:border-stone-800 transition-all cursor-pointer bg-transparent"
              >
                Explore All Monographs
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ==================================================== */}
      {/* 4. FULL ARTICLE READER MODAL (Architectural Monograph) */}
      {/* ==================================================== */}
      <AnimatePresence>
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-[#FBF9F5] border border-[#E5DFD5] max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-stone-900 selection:bg-[#C49746]/20"
            >
              {/* Modal Top Bar */}
              <div className="sticky top-0 z-20 bg-[#FBF9F5]/95 backdrop-blur-md px-6 py-4 border-b border-[#E5DFD5] flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#8C6D3B]">
                  {activeArticle.category}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => handleCopyShare(e, activeArticle)}
                    className="p-1.5 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer text-xs flex items-center gap-1 font-sans"
                    title="Copy article link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-mono hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
                  </button>

                  <button
                    onClick={() => setActiveArticle(null)}
                    className="p-1.5 text-stone-500 hover:text-stone-950 hover:bg-stone-200/50 rounded transition-all cursor-pointer"
                    aria-label="Close reader"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Article Header & Image */}
              <div className="p-6 sm:p-10 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-stone-900 leading-[1.25] tracking-tight mb-4">
                    {activeArticle.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-sans pb-4 border-b border-[#E5DFD5]">
                    <span>By {activeArticle.author}</span>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <span>{activeArticle.date}</span>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <span className="flex items-center gap-1 text-stone-500 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-[#8C6D3B]" /> {activeArticle.readTime}
                    </span>
                  </div>
                </div>

                {/* Hero Photograph */}
                <div className="aspect-[16/9] w-full overflow-hidden bg-stone-100 border border-stone-200/80">
                  <img
                    src={activeArticle.image}
                    alt={activeArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Pull-Quote Excerpt */}
                <div className="border-t border-b border-[#E5DFD5] py-4 my-6">
                  <p className="text-base sm:text-lg text-stone-800 font-serif italic leading-relaxed text-center max-w-xl mx-auto">
                    "{activeArticle.excerpt}"
                  </p>
                </div>

                {/* Prose Body */}
                <div className="text-stone-700 text-sm sm:text-base leading-relaxed space-y-5 whitespace-pre-line font-sans max-w-prose mx-auto">
                  {activeArticle.content}
                </div>

                {/* Architectural Consultation Card */}
                <div className="mt-10 p-6 sm:p-8 bg-[#F4EFE6] border border-[#E5DFD5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="max-w-md">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#8C6D3B] block mb-1">
                      Project Consultation
                    </span>
                    <h4 className="text-lg font-serif font-normal text-stone-900 mb-1">
                      Plan Your Space with Royal Epic
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Discuss architectural floorplans, material BOQ estimation, and direct factory execution with our design team.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const topic = activeArticle.title;
                      setActiveArticle(null);
                      if (onRequestQuote) {
                        onRequestQuote(topic);
                      } else {
                        const contactSection = document.getElementById('contact');
                        if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-6 py-3 bg-stone-900 hover:bg-[#8C6D3B] text-white text-xs uppercase tracking-[0.18em] font-medium transition-colors cursor-pointer shrink-0 shadow-sm"
                  >
                    Request Consultation
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* 5. ALL MONOGRAPHS ARCHIVE DRAWER / MODAL              */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showAllArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[#FBF9F5] border border-[#E5DFD5] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-10"
            >
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E5DFD5]">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#8C6D3B] block mb-1">
                    Complete Collection
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900">
                    All Royal Epic Articles & Guides
                  </h3>
                </div>
                <button
                  onClick={() => setShowAllArchive(false)}
                  className="p-2 text-stone-500 hover:text-stone-950 hover:bg-stone-200/50 rounded transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allPosts.map((post, index) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      setShowAllArchive(false);
                      setFeaturedIndex(index);
                      setActiveArticle(post);
                    }}
                    className="p-4 bg-white border border-[#E7E2DA] hover:border-[#8C6D3B] transition-all cursor-pointer group flex gap-4"
                  >
                    <div className="w-24 h-20 bg-stone-100 overflow-hidden shrink-0">
                      <img
                        src={post.image}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase tracking-widest text-[#8C6D3B] font-medium block truncate mb-1">
                        {post.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-serif font-medium text-stone-900 line-clamp-2 leading-snug group-hover:text-[#8C6D3B] transition-colors">
                        {post.title}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-mono block mt-2">
                        {post.date} · {post.readTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};
