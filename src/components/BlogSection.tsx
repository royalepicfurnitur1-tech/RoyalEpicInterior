import React, { useState } from 'react';
import { BLOG_POSTS } from '../data/mockData';
import { BlogPost } from '../types';
import { BookOpen, Clock, ArrowRight, X, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BlogSectionProps {
  onRequestQuote?: (topic?: string) => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ onRequestQuote }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);

  const categories = [
    'All',
    'Turnkey Projects',
    'Beauty Spa',
    'Home Interior',
    'Restaurant Interior',
    'Corporate Office',
    'Interior Decorating'
  ];

  const filteredPosts = selectedCategory === 'All'
    ? BLOG_POSTS
    : BLOG_POSTS.filter((post) => post.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <section className="py-20 sm:py-28 bg-[#FBFBFA] text-stone-900 relative" id="blog">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 font-mono block mb-2">
              Architectural Insights & Design Journal
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
              Royal Epic Design Journal
            </h2>
          </div>
          <p className="text-sm text-stone-600 max-w-md leading-relaxed">
            In-depth architectural guides on turnkey execution, beauty spa ambiance, luxury villa decorating, restaurant fit-outs, and workspace planning.
          </p>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-12 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white shadow-sm font-bold'
                  : 'bg-white text-stone-700 border border-stone-200/90 hover:border-stone-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => setActiveArticle(post)}
              className="bg-white border border-stone-200/90 rounded-3xl overflow-hidden hover:border-amber-400/80 transition-all duration-300 group flex flex-col justify-between cursor-pointer hover:shadow-xl"
            >
              <div>
                <div className="h-60 overflow-hidden relative bg-stone-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-stone-900 text-[10px] font-bold uppercase tracking-wider font-mono shadow-sm">
                    {post.category}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 text-[11px] text-stone-500 mb-3 font-mono">
                    <span className="flex items-center gap-1 text-amber-700 font-semibold"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-stone-900 mb-2.5 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-stone-100 mt-auto">
                <span className="text-[11px] text-stone-500 font-medium">{post.author}</span>
                <span className="text-xs font-bold text-stone-900 group-hover:text-amber-700 flex items-center gap-1 transition-colors">
                  Read Article <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Full Article Reader Modal */}
        <AnimatePresence>
          {activeArticle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-stone-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
              >
                {/* Modal Banner */}
                <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-t-3xl bg-stone-100">
                  <img
                    src={activeArticle.image}
                    alt={activeArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <button
                    onClick={() => setActiveArticle(null)}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 text-stone-800 hover:bg-stone-900 hover:text-white transition-all cursor-pointer shadow-md"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-bold uppercase tracking-wider mb-2 inline-block font-mono">
                      {activeArticle.category}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white drop-shadow-md">
                      {activeArticle.title}
                    </h2>
                  </div>
                </div>

                {/* Article Body */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between text-xs text-stone-500 pb-4 border-b border-stone-100 font-mono">
                    <span>By {activeArticle.author}</span>
                    <span className="flex items-center gap-1 text-amber-700 font-semibold"><Clock className="w-3.5 h-3.5" /> {activeArticle.readTime} • {activeArticle.date}</span>
                  </div>

                  <p className="text-sm sm:text-base text-stone-800 font-serif font-medium leading-relaxed italic border-l-2 border-amber-500 pl-4 bg-amber-50/50 py-2 rounded-r-xl">
                    "{activeArticle.excerpt}"
                  </p>

                  <div className="text-stone-700 text-sm leading-relaxed space-y-4 whitespace-pre-line font-sans">
                    {activeArticle.content}
                  </div>

                  {/* Consultation / Quote Call to Action */}
                  <div className="mt-8 p-6 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-serif font-bold text-stone-900 mb-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600" /> Plan Your Project With Royal Epic
                      </h4>
                      <p className="text-xs text-stone-500">
                        Get expert turnkey design, BOQ estimation, and factory execution for your space.
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
                      className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 shadow-sm"
                    >
                      Request Consult
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};

