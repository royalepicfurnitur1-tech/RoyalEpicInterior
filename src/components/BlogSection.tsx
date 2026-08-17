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
    <section className="py-20 bg-neutral-950 text-white relative" id="blog">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-3">
            <BookOpen className="w-3.5 h-3.5" /> Architectural Insights & Interior Design Journal
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            Royal Epic Design & Execution Journal
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            In-depth architectural guides on turnkey execution, beauty spa ambiance, home decorating, restaurant fit-outs, and corporate office workspace planning.
          </p>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-neutral-900 text-neutral-400 border border-white/10 hover:border-gold/50 hover:text-white'
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
              className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden hover:border-gold/60 transition-all group flex flex-col justify-between cursor-pointer hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)]"
            >
              <div>
                <div className="h-56 overflow-hidden relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-60" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/30">
                    {post.category}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 mb-3 font-mono">
                    <span className="flex items-center gap-1 text-gold"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-white mb-3 group-hover:text-gold transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-white/5 mt-auto">
                <span className="text-[11px] text-neutral-400 font-medium">{post.author}</span>
                <span className="text-xs font-bold text-gold group-hover:underline flex items-center gap-1">
                  Read Article <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Full Article Reader Modal */}
        <AnimatePresence>
          {activeArticle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
              >
                {/* Modal Banner */}
                <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-t-3xl">
                  <img
                    src={activeArticle.image}
                    alt={activeArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent" />
                  
                  <button
                    onClick={() => setActiveArticle(null)}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-black/80 text-white hover:bg-gold hover:text-black transition-all cursor-pointer border border-white/20"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="px-3 py-1 rounded-full bg-gold text-black text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                      {activeArticle.category}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white drop-shadow-md">
                      {activeArticle.title}
                    </h2>
                  </div>
                </div>

                {/* Article Body */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between text-xs text-neutral-400 pb-4 border-b border-white/10 font-mono">
                    <span>By {activeArticle.author}</span>
                    <span className="flex items-center gap-1 text-gold"><Clock className="w-3.5 h-3.5" /> {activeArticle.readTime} • {activeArticle.date}</span>
                  </div>

                  <p className="text-sm sm:text-base text-gold font-medium leading-relaxed italic border-l-2 border-gold pl-4">
                    "{activeArticle.excerpt}"
                  </p>

                  <div className="text-neutral-300 text-sm leading-relaxed space-y-4 whitespace-pre-line font-sans">
                    {activeArticle.content}
                  </div>

                  {/* Consultation / Quote Call to Action */}
                  <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-black via-neutral-950 to-neutral-900 border border-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-serif font-bold text-white mb-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold" /> Plan Your Project With Royal Epic
                      </h4>
                      <p className="text-xs text-neutral-400">
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
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all cursor-pointer shrink-0"
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

