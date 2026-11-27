import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Clock,
  Calendar,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  FileText,
  Layers,
  Share2,
  Check,
  Building2,
  HelpCircle,
  ListChecks,
  ExternalLink,
} from 'lucide-react';
import {
  ALL_BLOG_POSTS,
  BLOG_CATEGORIES,
  findBlogPostBySlug,
  computeArticleWordCount,
} from '../data/blogArticlesData';
import { BlogPost } from '../types';

interface BlogKnowledgeCentrePageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenConsultation?: () => void;
}

/**
 * Resolves the canonical origin based on current hostname, supporting both
 * https://royalepicinterior.com and https://royalepicinterior.in independently.
 */
function getCanonicalOrigin(): string {
  if (typeof window === 'undefined') {
    return 'https://royalepicinterior.com';
  }
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith('royalepicinterior.in')) {
    return 'https://royalepicinterior.in';
  }
  if (host.endsWith('royalepicinterior.com')) {
    return 'https://royalepicinterior.com';
  }
  return window.location.origin;
}

const ImageWithArchitecturalFallback: React.FC<{
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  category?: string;
}> = ({ src, alt, className = '', loading = 'lazy', category = 'Royal Epic Design Journal' }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-[#0F291E] via-[#163829] to-[#0A1C14] flex flex-col items-center justify-center p-8 text-center border border-[#D4AF37]/30 ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 border border-[#D4AF37]/40 flex items-center justify-center mb-3">
          <Building2 className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-1">
          {category}
        </span>
        <span className="text-xs text-white/75 max-w-md font-serif italic line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const BlogKnowledgeCentrePage: React.FC<BlogKnowledgeCentrePageProps> = ({
  currentPath,
  onNavigate,
  onOpenConsultation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Articles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [mobileTocOpen, setMobileTocOpen] = useState<boolean>(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Determine if we are on /blog or /blog/:slug
  const cleanPath = currentPath.replace(/\/+$/, '') || '/blog';
  const isDetailPage = cleanPath.startsWith('/blog/') && cleanPath.length > '/blog/'.length;
  const currentSlug = isDetailPage ? cleanPath.slice('/blog/'.length) : '';
  const activePost: BlogPost | undefined = useMemo(
    () => (isDetailPage ? findBlogPostBySlug(currentSlug) : undefined),
    [isDetailPage, currentSlug]
  );

  // Featured post for main /blog page
  const featuredPost: BlogPost = useMemo(() => {
    return (
      ALL_BLOG_POSTS.find((p) => p.slug === '2bhk-3bhk-home-interior-planning-checklist') ||
      ALL_BLOG_POSTS.find((p) => p.isFeatured) ||
      ALL_BLOG_POSTS[0]
    );
  }, []);

  // Filtered articles on /blog listing
  const filteredPosts = useMemo(() => {
    return ALL_BLOG_POSTS.filter((post) => {
      const matchesCat =
        selectedCategory === 'All Articles' ||
        post.category.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const inTitle = post.title.toLowerCase().includes(q);
      const inExcerpt = post.excerpt.toLowerCase().includes(q);
      const inCategory = post.category.toLowerCase().includes(q);
      const inPrimaryKw = (post.primaryKeyword || '').toLowerCase().includes(q);
      const inSecondaryKw = (post.secondaryKeywords || []).some((k) =>
        k.toLowerCase().includes(q)
      );
      return inTitle || inExcerpt || inCategory || inPrimaryKw || inSecondaryKw;
    });
  }, [selectedCategory, searchQuery]);

  // Synchronize SEO metadata, canonical URL, Open Graph, and JSON-LD schema
  useEffect(() => {
    const origin = getCanonicalOrigin();
    const canonicalUrl = isDetailPage && activePost
      ? `${origin}/blog/${activePost.slug}`
      : `${origin}/blog`;

    const pageTitle =
      isDetailPage && activePost
        ? activePost.seoTitle || `${activePost.title} | Royal Epic Interiors`
        : 'Design Journal & Interior Design Guides | Royal Epic Interiors';

    const pageDescription =
      isDetailPage && activePost
        ? activePost.metaDescription || activePost.excerpt
        : 'Read practical guides on home interiors, modular kitchens, materials, wardrobes, false ceilings, pricing and planning by Royal Epic Interiors in Bengaluru.';

    const pageImage =
      isDetailPage && activePost
        ? activePost.image.startsWith('http')
          ? activePost.image
          : `${origin}${activePost.image}`
        : `${origin}/images/indian-luxury-living-room.jpg`;

    document.title = pageTitle;

    const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('name', 'description', pageDescription);
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large');
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDescription);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', isDetailPage ? 'article' : 'website');
    setMetaTag('property', 'og:image', pageImage);
    setMetaTag('property', 'og:site_name', 'Royal Epic Interiors');
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDescription);
    setMetaTag('name', 'twitter:image', pageImage);

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // JSON-LD Structured Data (BlogPosting + BreadcrumbList on article pages; Blog + BreadcrumbList on /blog)
    // Note: No automatic FAQPage JSON-LD is emitted on commercial blog posts per Google's FAQPage eligibility rules.
    const existingScript = document.getElementById('royal-epic-blog-jsonld');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'royal-epic-blog-jsonld';
    script.type = 'application/ld+json';

    if (isDetailPage && activePost) {
      const wordCount = activePost.wordCount || computeArticleWordCount(activePost);
      const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BlogPosting',
            '@id': `${canonicalUrl}#article`,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': canonicalUrl,
            },
            headline: activePost.title,
            description: pageDescription,
            image: [pageImage],
            datePublished: activePost.datePublishedIso || '2026-11-18',
            dateModified: activePost.dateModifiedIso || '2026-11-26',
            wordCount,
            articleSection: activePost.category,
            inLanguage: 'en-IN',
            keywords: [
              activePost.primaryKeyword,
              ...(activePost.secondaryKeywords || []),
            ]
              .filter(Boolean)
              .join(', '),
            author: {
              '@type': 'Organization',
              name: activePost.author || 'Royal Epic Interiors Editorial Team',
              url: origin,
            },
            publisher: {
              '@type': 'Organization',
              name: 'Royal Epic Interiors',
              url: origin,
              logo: {
                '@type': 'ImageObject',
                url: `${origin}/images/royal-epic-logo.png`,
              },
            },
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumb`,
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${origin}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Design Journal',
                item: `${origin}/blog`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: activePost.title,
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
      script.textContent = JSON.stringify(jsonLd);
    } else {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Blog',
            '@id': `${canonicalUrl}#blog`,
            name: 'Royal Epic Design Journal & Interior Design Knowledge Centre',
            description: pageDescription,
            url: canonicalUrl,
            inLanguage: 'en-IN',
            publisher: {
              '@type': 'Organization',
              name: 'Royal Epic Interiors',
              url: origin,
            },
            blogPost: ALL_BLOG_POSTS.slice(0, 10).map((post) => ({
              '@type': 'BlogPosting',
              headline: post.title,
              url: `${origin}/blog/${post.slug}`,
              datePublished: post.datePublishedIso || '2026-11-18',
              description: post.metaDescription || post.excerpt,
            })),
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumb`,
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${origin}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Design Journal',
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
      script.textContent = JSON.stringify(jsonLd);
    }

    document.head.appendChild(script);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      const cleanup = document.getElementById('royal-epic-blog-jsonld');
      if (cleanup) cleanup.remove();
    };
  }, [isDetailPage, activePost, cleanPath]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      href.startsWith('/') &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      e.preventDefault();
      onNavigate(href);
    }
  };

  const handleShareCopy = () => {
    const origin = getCanonicalOrigin();
    const url =
      isDetailPage && activePost ? `${origin}/blog/${activePost.slug}` : `${origin}/blog`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const toggleChecklistItem = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ============================================================================
  // CASE A: 404 ARTICLE NOT FOUND ON /blog/:invalid-slug
  // ============================================================================
  if (isDetailPage && !activePost) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 p-10 sm:p-14 text-center shadow-sm">
          <span className="inline-block text-[11px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-3">
            ROYAL EPIC DESIGN JOURNAL
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#0F291E] mb-4">
            Article Not Found
          </h1>
          <p className="text-stone-600 mb-8 leading-relaxed">
            The design guide you are looking for may have moved or the URL slug is incorrect. Explore our complete collection of homeowner guides and interior planning resources below.
          </p>
          <a
            href="/blog"
            onClick={(e) => handleLinkClick(e, '/blog')}
            className="inline-flex items-center gap-2 bg-[#0F291E] text-white px-7 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#163829] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
            Back to Design Journal
          </a>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CASE B: INDIVIDUAL BLOG ARTICLE DETAIL PAGE (/blog/:slug)
  // ============================================================================
  if (isDetailPage && activePost) {
    const wordCount = activePost.wordCount || computeArticleWordCount(activePost);
    const sections = activePost.sections || [];
    const conclusionObj = activePost.conclusion
      ? Array.isArray(activePost.conclusion)
        ? {
            heading: 'Final Thoughts & Homeowner Takeaways',
            paragraphs: activePost.conclusion,
          }
        : activePost.conclusion
      : null;

    const relatedPosts: BlogPost[] = (activePost.relatedArticleSlugs || [])
      .map((slug) => findBlogPostBySlug(slug))
      .filter((p): p is BlogPost => Boolean(p && p.slug !== activePost.slug))
      .slice(0, 3);

    if (relatedPosts.length < 3) {
      for (const candidate of ALL_BLOG_POSTS) {
        if (
          candidate.slug !== activePost.slug &&
          !relatedPosts.some((r) => r.slug === candidate.slug)
        ) {
          relatedPosts.push(candidate);
          if (relatedPosts.length >= 3) break;
        }
      }
    }

    const ctaHeading =
      activePost.ctaConfig?.heading || 'Planning Your Home Interiors?';
    const ctaSubtext =
      activePost.ctaConfig?.subtext ||
      'Connect with Royal Epic Interiors in Bengaluru for a structured floor-plan review, material walkthrough, and transparent itemised quotation.';
    const ctaPrimaryText =
      activePost.ctaConfig?.primaryButtonText ||
      activePost.ctaConfig?.buttonText ||
      'Discuss Your Interior Requirements with Royal Epic';
    const ctaPrimaryHref = activePost.ctaConfig?.buttonHref || '/contact-us';
    const ctaSecondaryText =
      activePost.ctaConfig?.secondaryLinkText || 'Explore Our Interior Design Services';
    const ctaSecondaryHref =
      activePost.ctaConfig?.secondaryLinkUrl || '/our-services';

    return (
      <article className="min-h-screen bg-[#FAF8F5] text-stone-800 pb-20">
        {/* Top Editorial Header Banner */}
        <header className="bg-[#0F291E] text-white pt-24 pb-12 sm:pt-28 sm:pb-16 border-b border-[#D4AF37]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-xs text-stone-300 mb-6"
            >
              <a
                href="/"
                onClick={(e) => handleLinkClick(e, '/')}
                className="hover:text-[#D4AF37] transition-colors"
              >
                Home
              </a>
              <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]/70" />
              <a
                href="/blog"
                onClick={(e) => handleLinkClick(e, '/blog')}
                className="hover:text-[#D4AF37] transition-colors"
              >
                Design Journal
              </a>
              <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]/70" />
              <span className="text-[#D4AF37] font-medium">{activePost.category}</span>
            </nav>

            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] uppercase tracking-[0.2em] font-semibold mb-4">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{activePost.category}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-serif text-white leading-[1.2] mb-5">
                {activePost.title}
              </h1>

              <p className="text-stone-200 text-base sm:text-lg leading-relaxed mb-6">
                {activePost.excerpt}
              </p>

              {/* Metadata Bar */}
              <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-4 border-t border-white/15 text-xs text-stone-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#D4AF37] inline-block" />
                  <span className="font-medium text-white">{activePost.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <time dateTime={activePost.datePublishedIso || '2026-11-18'}>
                    {activePost.date}
                  </time>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{activePost.readTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{wordCount.toLocaleString('en-IN')} words</span>
                </div>
                <button
                  type="button"
                  onClick={handleShareCopy}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-colors text-xs cursor-pointer"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Share Guide</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Grid with Sticky Desktop TOC */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Sidebar: Desktop Sticky Table of Contents */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-28">
              <div className="bg-white border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-stone-200">
                  <Layers className="w-4 h-4 text-[#0F291E]" />
                  <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#0F291E]">
                    Table of Contents
                  </h2>
                </div>
                <nav aria-label="Table of contents">
                  <ol className="space-y-2.5 text-xs leading-snug">
                    {sections.map((sec, idx) => (
                      <li key={sec.id}>
                        <a
                          href={`#${sec.id}`}
                          className="text-stone-600 hover:text-[#0F291E] hover:font-semibold flex items-start gap-2 py-0.5 transition-colors"
                        >
                          <span className="text-[#D4AF37] font-mono font-semibold">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <span>{sec.heading.replace(/^\d+\.\s*/, '')}</span>
                        </a>
                      </li>
                    ))}
                    {conclusionObj && (
                      <li>
                        <a
                          href="#article-conclusion"
                          className="text-stone-600 hover:text-[#0F291E] hover:font-semibold flex items-start gap-2 py-0.5 transition-colors"
                        >
                          <span className="text-[#D4AF37] font-mono font-semibold">
                            {String(sections.length + 1).padStart(2, '0')}.
                          </span>
                          <span>Conclusion & Takeaways</span>
                        </a>
                      </li>
                    )}
                    {activePost.faqs && activePost.faqs.length > 0 && (
                      <li>
                        <a
                          href="#frequently-asked-questions"
                          className="text-stone-600 hover:text-[#0F291E] hover:font-semibold flex items-start gap-2 py-0.5 transition-colors"
                        >
                          <span className="text-[#D4AF37] font-mono font-semibold">
                            FAQ
                          </span>
                          <span>Frequently Asked Questions ({activePost.faqs.length})</span>
                        </a>
                      </li>
                    )}
                  </ol>
                </nav>

                {/* Sidebar Consultation Card */}
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold block mb-1.5">
                    ROYAL EPIC BENGALURU
                  </span>
                  <p className="text-xs text-stone-600 leading-relaxed mb-4">
                    Need help applying this guide to your 2BHK, 3BHK, villa, or office floor plan?
                  </p>
                  <a
                    href="/contact-us"
                    onClick={(e) => {
                      if (onOpenConsultation) {
                        e.preventDefault();
                        onOpenConsultation();
                      } else {
                        handleLinkClick(e, '/contact-us');
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#0F291E] text-white px-4 py-2.5 text-[11px] uppercase tracking-[0.15em] font-semibold hover:bg-[#163829] transition-colors"
                  >
                    <span>Book Free Design Session</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Reading Column */}
            <div className="lg:col-span-8 xl:col-span-9">
              {/* Featured 16:9 Image */}
              <figure className="mb-8 bg-white border border-stone-200 overflow-hidden shadow-sm">
                <div className="aspect-[16/9] w-full overflow-hidden bg-stone-100">
                  <ImageWithArchitecturalFallback
                    src={activePost.image}
                    alt={activePost.imageAlt || activePost.title}
                    loading="eager"
                    category={activePost.category}
                    className="w-full h-full object-cover"
                  />
                </div>
                {activePost.imageCaption && (
                  <figcaption className="px-5 py-3 text-xs text-stone-500 bg-stone-50 border-t border-stone-200 italic">
                    {activePost.imageCaption}
                  </figcaption>
                )}
              </figure>

              {/* Mobile Collapsible Table of Contents */}
              <div className="lg:hidden mb-8 bg-white border border-stone-200 p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => setMobileTocOpen(!mobileTocOpen)}
                  className="w-full flex items-center justify-between text-left text-xs uppercase tracking-[0.18em] font-bold text-[#0F291E]"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#D4AF37]" />
                    Table of Contents ({sections.length} Sections)
                  </span>
                  <span className="text-[#D4AF37]">{mobileTocOpen ? 'Hide' : 'Show'}</span>
                </button>
                {mobileTocOpen && (
                  <ol className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs">
                    {sections.map((sec, idx) => (
                      <li key={sec.id}>
                        <a
                          href={`#${sec.id}`}
                          onClick={() => setMobileTocOpen(false)}
                          className="text-stone-700 hover:text-[#0F291E] flex items-start gap-2 py-1"
                        >
                          <span className="text-[#D4AF37] font-mono font-semibold">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <span>{sec.heading.replace(/^\d+\.\s*/, '')}</span>
                        </a>
                      </li>
                    ))}
                    {activePost.faqs && activePost.faqs.length > 0 && (
                      <li>
                        <a
                          href="#frequently-asked-questions"
                          onClick={() => setMobileTocOpen(false)}
                          className="text-stone-700 hover:text-[#0F291E] flex items-start gap-2 py-1 font-medium"
                        >
                          <span className="text-[#D4AF37] font-mono font-semibold">FAQ</span>
                          <span>Frequently Asked Questions</span>
                        </a>
                      </li>
                    )}
                  </ol>
                )}
              </div>

              {/* Article Body Container */}
              <div className="bg-white border border-stone-200 p-6 sm:p-10 lg:p-12 shadow-sm">
                {/* Optional Lead Content Paragraph */}
                {activePost.content && (
                  <div className="mb-10 pb-8 border-b border-stone-200">
                    <p className="text-base sm:text-[18px] text-stone-700 leading-[1.8] font-normal">
                      {activePost.content}
                    </p>
                  </div>
                )}

                {/* H2 Sections */}
                <div className="space-y-12">
                  {sections.map((section) => (
                    <section
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-28 border-b border-stone-100 pb-10 last:border-b-0 last:pb-0"
                    >
                      <h2 className="text-xl sm:text-2xl lg:text-[26px] font-serif text-[#0F291E] leading-snug mb-5">
                        {section.heading}
                      </h2>

                      {/* Paragraphs */}
                      {section.paragraphs && section.paragraphs.length > 0 && (
                        <div className="space-y-4 text-stone-700 text-base sm:text-[17px] leading-[1.8]">
                          {section.paragraphs.map((para, pIdx) => (
                            <p key={pIdx}>{para}</p>
                          ))}
                        </div>
                      )}

                      {/* H3 Subsections */}
                      {section.subSections && section.subSections.length > 0 && (
                        <div className="mt-6 space-y-6">
                          {section.subSections.map((sub, sIdx) => (
                            <div
                              key={sIdx}
                              className="pl-4 sm:pl-5 border-l-2 border-[#D4AF37]/60 bg-[#FAF8F5]/60 py-3 pr-4"
                            >
                              <h3 className="text-base sm:text-lg font-serif font-semibold text-[#0F291E] mb-2.5">
                                {sub.heading}
                              </h3>
                              {sub.paragraphs && sub.paragraphs.length > 0 && (
                                <div className="space-y-3 text-stone-700 text-sm sm:text-base leading-[1.75]">
                                  {sub.paragraphs.map((sp, spIdx) => (
                                    <p key={spIdx}>{sp}</p>
                                  ))}
                                </div>
                              )}
                              {sub.bullets && sub.bullets.length > 0 && (
                                <ul className="mt-3 space-y-2.5 text-stone-700 text-sm sm:text-base leading-[1.7]">
                                  {sub.bullets.map((b, bIdx) => (
                                    <li key={bIdx} className="flex items-start gap-2.5">
                                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-1" />
                                      <span>{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Section Bullet Points */}
                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="mt-6 space-y-3 bg-[#FAF8F5] border border-stone-200/80 p-5 sm:p-6">
                          {section.bullets.map((bullet, bIdx) => (
                            <li
                              key={bIdx}
                              className="flex items-start gap-3 text-stone-700 text-sm sm:text-base leading-[1.7]"
                            >
                              <CheckCircle2 className="w-4 h-4 text-[#0F291E] shrink-0 mt-1" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Responsive Comparison Table */}
                      {section.table && (
                        <div className="mt-8">
                          {section.table.caption && (
                            <div className="bg-[#0F291E] text-white px-4 py-3 text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-between">
                              <span>{section.table.caption}</span>
                              <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
                                Swipe horizontally on mobile →
                              </span>
                            </div>
                          )}
                          <div className="overflow-x-auto border border-stone-200">
                            <table className="w-full text-left border-collapse min-w-[640px]">
                              <thead>
                                <tr className="bg-stone-100 border-b border-stone-200">
                                  {section.table.headers.map((header, hIdx) => (
                                    <th
                                      key={hIdx}
                                      className="py-3.5 px-4 text-xs uppercase tracking-wider font-bold text-[#0F291E] border-r border-stone-200 last:border-r-0"
                                    >
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-200 text-sm">
                                {section.table.rows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className={
                                      rIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]/70'
                                    }
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className={`py-3.5 px-4 leading-relaxed border-r border-stone-200 last:border-r-0 ${
                                          cIdx === 0
                                            ? 'font-semibold text-[#0F291E]'
                                            : 'text-stone-700'
                                        }`}
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {(section.table.footnote || section.table.note) && (
                            <p className="mt-2.5 text-xs text-stone-500 italic bg-stone-50 px-4 py-2.5 border border-stone-200">
                              {section.table.footnote || section.table.note}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Printable / Interactive Homeowner Checklist */}
                      {(section.checklist ||
                        (section.checklistItems && section.checklistItems.length > 0)) && (
                        <div className="mt-8 bg-[#0F291E] text-white p-6 sm:p-8 border border-[#D4AF37]/40">
                          <div className="flex items-center gap-2.5 text-[#D4AF37] text-xs uppercase tracking-[0.2em] font-semibold mb-2">
                            <ListChecks className="w-4 h-4" />
                            <span>Interactive Homeowner Checklist</span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-serif text-white mb-1">
                            {section.checklist?.title ||
                              'Pre-Execution Homeowner Verification Checklist'}
                          </h3>
                          {section.checklist?.subtitle && (
                            <p className="text-xs sm:text-sm text-stone-300 mb-5">
                              {section.checklist.subtitle}
                            </p>
                          )}
                          <ul className="space-y-3 mt-4">
                            {(
                              section.checklist?.items ||
                              section.checklistItems ||
                              []
                            ).map((item, idx) => {
                              const itemKey = `${section.id}-chk-${idx}`;
                              const isChecked = Boolean(checkedItems[itemKey]);
                              return (
                                <li
                                  key={itemKey}
                                  onClick={() => toggleChecklistItem(itemKey)}
                                  className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    aria-label={item}
                                    className="mt-1 h-4 w-4 accent-[#D4AF37] cursor-pointer"
                                  />
                                  <span
                                    className={`text-sm leading-relaxed ${
                                      isChecked
                                        ? 'line-through text-stone-400'
                                        : 'text-stone-100'
                                    }`}
                                  >
                                    {item}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Editorial Callout Box */}
                      {section.callout && (
                        <div className="mt-6 bg-[#FAF8F5] border-l-4 border-[#0F291E] p-5 sm:p-6">
                          <h4 className="text-xs uppercase tracking-[0.18em] font-bold text-[#0F291E] mb-2">
                            {section.callout.title}
                          </h4>
                          <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
                            {section.callout.text}
                          </p>
                        </div>
                      )}

                      {/* Supporting Inline Image */}
                      {section.inlineImage && (
                        <figure className="mt-8 border border-stone-200 overflow-hidden bg-stone-50">
                          <div className="aspect-[16/9] w-full overflow-hidden">
                            <ImageWithArchitecturalFallback
                              src={section.inlineImage.src}
                              alt={section.inlineImage.alt}
                              loading="lazy"
                              category={activePost.category}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {section.inlineImage.caption && (
                            <figcaption className="px-4 py-2.5 text-xs text-stone-500 italic border-t border-stone-200">
                              {section.inlineImage.caption}
                            </figcaption>
                          )}
                        </figure>
                      )}

                      {/* Contextual Internal Links */}
                      {section.internalLinks && section.internalLinks.length > 0 && (
                        <div className="mt-6 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {section.internalLinks.map((link, lIdx) => (
                            <a
                              key={lIdx}
                              href={link.url}
                              onClick={(e) => handleLinkClick(e, link.url)}
                              className="group flex flex-col justify-between p-4 bg-[#FAF8F5] hover:bg-[#0F291E] border border-stone-200 hover:border-[#0F291E] transition-all"
                            >
                              <div>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold block mb-1">
                                  Recommended Resource
                                </span>
                                <span className="text-sm font-semibold text-[#0F291E] group-hover:text-white flex items-center justify-between gap-2">
                                  <span>{link.label}</span>
                                  <ArrowRight className="w-4 h-4 text-[#D4AF37] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              </div>
                              {link.context && (
                                <p className="mt-1.5 text-xs text-stone-500 group-hover:text-stone-300 leading-relaxed">
                                  {link.context}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>

                {/* Conclusion Section */}
                {conclusionObj && (
                  <section
                    id="article-conclusion"
                    className="mt-12 pt-10 border-t-2 border-[#0F291E]/20 scroll-mt-28"
                  >
                    <h2 className="text-xl sm:text-2xl font-serif text-[#0F291E] mb-4">
                      {conclusionObj.heading}
                    </h2>
                    <div className="space-y-4 text-stone-700 text-base sm:text-[17px] leading-[1.8]">
                      {conclusionObj.paragraphs.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                  </section>
                )}

                {/* Frequently Asked Questions Section (Visible in DOM without requiring JS clicks) */}
                {activePost.faqs && activePost.faqs.length > 0 && (
                  <section
                    id="frequently-asked-questions"
                    className="mt-12 pt-10 border-t border-stone-200 scroll-mt-28"
                  >
                    <div className="flex items-center gap-2 text-[#D4AF37] text-xs uppercase tracking-[0.2em] font-bold mb-2">
                      <HelpCircle className="w-4 h-4" />
                      <span>Homeowner FAQ Guide</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif text-[#0F291E] mb-6">
                      Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                      {activePost.faqs.map((faq, fIdx) => (
                        <div
                          key={fIdx}
                          className="p-5 sm:p-6 bg-[#FAF8F5] border border-stone-200"
                        >
                          <h3 className="text-base sm:text-lg font-serif font-semibold text-[#0F291E] mb-2">
                            {fIdx + 1}. {faq.question}
                          </h3>
                          <p className="text-sm sm:text-base text-stone-700 leading-[1.75]">
                            {faq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Editorial Attribution Box */}
                <div className="mt-12 p-6 bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] font-bold block mb-1">
                      EDITORIAL & ARCHITECTURAL REVIEW
                    </span>
                    <p className="text-sm font-semibold text-[#0F291E]">
                      {activePost.author || 'Royal Epic Editorial Team'}
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      Prepared by Royal Epic Interiors’ residential planning, modular factory engineering, and turnkey execution specialists in Bengaluru.
                    </p>
                  </div>
                  <div className="text-xs text-stone-500 shrink-0">
                    <div>15-Year Warranty Standard</div>
                    <div>500+ Completed Projects</div>
                  </div>
                </div>

                {/* Tasteful End-of-Article Enquiry CTA */}
                <div className="mt-12 bg-[#0F291E] text-white p-7 sm:p-10 border border-[#D4AF37]/40">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block mb-2">
                    ROYAL EPIC INTERIORS • BENGALURU
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif text-white mb-3">
                    {ctaHeading}
                  </h2>
                  <p className="text-stone-200 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
                    {ctaSubtext}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <a
                      href={ctaPrimaryHref}
                      onClick={(e) => {
                        if (onOpenConsultation && ctaPrimaryHref === '/contact-us') {
                          e.preventDefault();
                          onOpenConsultation();
                        } else {
                          handleLinkClick(e, ctaPrimaryHref);
                        }
                      }}
                      className="inline-flex items-center gap-2.5 bg-[#D4AF37] text-[#0F291E] px-6 py-3.5 text-xs uppercase tracking-[0.18em] font-bold hover:bg-[#e0bd42] transition-colors"
                    >
                      <span>{ctaPrimaryText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <a
                      href={ctaSecondaryHref}
                      onClick={(e) => handleLinkClick(e, ctaSecondaryHref)}
                      className="inline-flex items-center gap-2 border border-white/30 hover:border-[#D4AF37] text-white px-5 py-3.5 text-xs uppercase tracking-[0.18em] font-semibold transition-colors"
                    >
                      <span>{ctaSecondaryText}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </a>
                  </div>
                </div>

                {/* Related Royal Epic Services */}
                {activePost.relatedServiceLinks &&
                  activePost.relatedServiceLinks.length > 0 && (
                    <div className="mt-12 pt-10 border-t border-stone-200">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] font-bold block mb-1.5">
                        EXPLORE ROYAL EPIC SERVICES
                      </span>
                      <h3 className="text-lg sm:text-xl font-serif text-[#0F291E] mb-5">
                        Related Interior Design & Execution Services
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {activePost.relatedServiceLinks.map((srv, sIdx) => {
                          const srvTitle = srv.title || srv.label || 'Interior Design Service';
                          const srvUrl = srv.url || srv.href || '/our-services';
                          return (
                            <a
                              key={sIdx}
                              href={srvUrl}
                              onClick={(e) => handleLinkClick(e, srvUrl)}
                              className="group p-5 bg-[#FAF8F5] border border-stone-200 hover:border-[#0F291E] transition-all flex flex-col justify-between"
                            >
                              <div>
                                <h4 className="text-sm font-serif font-bold text-[#0F291E] group-hover:text-[#D4AF37] transition-colors mb-2">
                                  {srvTitle}
                                </h4>
                                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                                  {srv.description}
                                </p>
                              </div>
                              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#0F291E] inline-flex items-center gap-1.5">
                                <span>Explore Service</span>
                                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>

              {/* Related Articles Section */}
              {relatedPosts.length > 0 && (
                <section className="mt-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold block mb-1">
                        CONTINUE READING
                      </span>
                      <h2 className="text-2xl font-serif text-[#0F291E]">
                        Related Interior Design Guides
                      </h2>
                    </div>
                    <a
                      href="/blog"
                      onClick={(e) => handleLinkClick(e, '/blog')}
                      className="text-xs uppercase tracking-[0.18em] font-semibold text-[#0F291E] hover:text-[#D4AF37] inline-flex items-center gap-1.5"
                    >
                      <span>View All Guides</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedPosts.map((rPost) => (
                      <article
                        key={rPost.id}
                        className="bg-white border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                      >
                        <a
                          href={`/blog/${rPost.slug}`}
                          onClick={(e) => handleLinkClick(e, `/blog/${rPost.slug}`)}
                          className="block aspect-[16/10] overflow-hidden bg-stone-100"
                        >
                          <ImageWithArchitecturalFallback
                            src={rPost.image}
                            alt={rPost.imageAlt || rPost.title}
                            category={rPost.category}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                        </a>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2">
                              <span className="uppercase tracking-[0.15em] text-[#0F291E] font-bold">
                                {rPost.category}
                              </span>
                              <span>{rPost.readTime}</span>
                            </div>
                            <h3 className="text-base font-serif font-semibold text-[#0F291E] leading-snug mb-2 line-clamp-2">
                              <a
                                href={`/blog/${rPost.slug}`}
                                onClick={(e) => handleLinkClick(e, `/blog/${rPost.slug}`)}
                                className="hover:text-[#D4AF37] transition-colors"
                              >
                                {rPost.title}
                              </a>
                            </h3>
                            <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">
                              {rPost.excerpt}
                            </p>
                          </div>
                          <a
                            href={`/blog/${rPost.slug}`}
                            onClick={(e) => handleLinkClick(e, `/blog/${rPost.slug}`)}
                            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] font-bold text-[#0F291E] hover:text-[#D4AF37] transition-colors"
                          >
                            <span>Read Article</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ============================================================================
  // CASE C: MAIN BLOG / DESIGN JOURNAL LISTING PAGE (/blog)
  // ============================================================================
  const displayedPosts = filteredPosts.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 pb-20">
      {/* 1. Hero Section */}
      <section className="bg-[#0F291E] text-white pt-24 pb-14 sm:pt-32 sm:pb-20 border-b border-[#D4AF37]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] uppercase tracking-[0.25em] font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ROYAL EPIC DESIGN JOURNAL</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif text-white tracking-tight leading-[1.12] mb-5">
              Design Better. Live Better.
            </h1>
            <p className="text-base sm:text-lg text-stone-200 leading-relaxed max-w-2xl">
              Practical guides on home interiors, modular kitchens, materials, wardrobes, false ceilings, pricing and planning for homeowners and businesses.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        {/* 2. Featured Article Showcase */}
        {featuredPost && selectedCategory === 'All Articles' && !searchQuery.trim() && (
          <section aria-label="Featured Guide" className="mb-14">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-[0.22em] font-bold text-[#0F291E] flex items-center gap-2">
                <span className="w-2 h-2 bg-[#D4AF37] inline-block" />
                Featured Homeowner Guide
              </span>
              <span className="text-xs text-stone-500">
                Essential Pre-Execution Blueprint
              </span>
            </div>

            <div className="bg-white border border-stone-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
              <a
                href={`/blog/${featuredPost.slug}`}
                onClick={(e) => handleLinkClick(e, `/blog/${featuredPost.slug}`)}
                className="lg:col-span-7 block aspect-[16/10] lg:aspect-auto overflow-hidden bg-stone-100"
              >
                <ImageWithArchitecturalFallback
                  src={featuredPost.image}
                  alt={featuredPost.imageAlt || featuredPost.title}
                  loading="eager"
                  category={featuredPost.category}
                  className="w-full h-full object-cover hover:scale-103 transition-transform duration-700"
                />
              </a>

              <div className="lg:col-span-5 p-6 sm:p-9 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mb-4">
                    <span className="px-2.5 py-1 bg-[#0F291E] text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-semibold">
                      {featuredPost.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {featuredPost.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {featuredPost.date}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif text-[#0F291E] leading-snug mb-4">
                    <a
                      href={`/blog/${featuredPost.slug}`}
                      onClick={(e) => handleLinkClick(e, `/blog/${featuredPost.slug}`)}
                      className="hover:text-[#D4AF37] transition-colors"
                    >
                      {featuredPost.title}
                    </a>
                  </h2>

                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="pt-5 border-t border-stone-100 flex items-center justify-between">
                  <a
                    href={`/blog/${featuredPost.slug}`}
                    onClick={(e) => handleLinkClick(e, `/blog/${featuredPost.slug}`)}
                    className="inline-flex items-center gap-2 bg-[#0F291E] text-white px-6 py-3 text-xs uppercase tracking-[0.18em] font-semibold hover:bg-[#163829] transition-colors"
                  >
                    <span>Read Complete Guide</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </a>
                  <span className="text-xs text-stone-500 font-medium">
                    {(
                      featuredPost.wordCount || computeArticleWordCount(featuredPost)
                    ).toLocaleString('en-IN')}{' '}
                    words
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. Category Filter & Search Controls */}
        <section aria-label="Filter and search articles" className="mb-10">
          <div className="bg-white border border-stone-200 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-serif text-[#0F291E]">
                  Explore Interior Design Knowledge Centre ({filteredPosts.length} Guides)
                </h2>
                <p className="text-xs text-stone-500">
                  Filter by architectural topic or search for materials, BOQ, kitchen layouts, wardrobes, and timelines.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(20);
                  }}
                  placeholder="Search ply, BOQ, kitchen, wardrobe..."
                  aria-label="Search blog articles"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 focus:border-[#0F291E] focus:outline-none text-stone-800"
                />
              </div>
            </div>

            {/* Category Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {BLOG_CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      setVisibleCount(20);
                    }}
                    className={`px-3.5 py-2 text-xs uppercase tracking-[0.14em] font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-[#0F291E] text-[#D4AF37] border-[#0F291E]'
                        : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:border-[#0F291E]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Article Card Grid (3 per row on desktop, 2 on tablet, 1 on mobile) */}
        {displayedPosts.length === 0 ? (
          <div className="bg-white border border-stone-200 p-12 text-center">
            <h3 className="text-xl font-serif text-[#0F291E] mb-2">
              No matching articles found
            </h3>
            <p className="text-sm text-stone-600 mb-6">
              Try clearing your search filter or selecting "All Articles" to browse our full knowledge base.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All Articles');
                setSearchQuery('');
              }}
              className="bg-[#0F291E] text-white px-6 py-2.5 text-xs uppercase tracking-[0.18em] font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <section aria-label="Articles list">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {displayedPosts.map((post) => {
                const wc = post.wordCount || computeArticleWordCount(post);
                return (
                  <article
                    key={post.id}
                    className="bg-white border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                  >
                    <a
                      href={`/blog/${post.slug}`}
                      onClick={(e) => handleLinkClick(e, `/blog/${post.slug}`)}
                      className="block aspect-[16/10] overflow-hidden bg-stone-100 relative"
                    >
                      <ImageWithArchitecturalFallback
                        src={post.image}
                        alt={post.imageAlt || post.title}
                        loading="lazy"
                        category={post.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#0F291E]/95 text-[#D4AF37] text-[10px] uppercase tracking-[0.18em] font-semibold">
                        {post.category}
                      </span>
                    </a>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-4 text-xs text-stone-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                            {post.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                            {post.readTime}
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-serif text-[#0F291E] leading-snug mb-3">
                          <a
                            href={`/blog/${post.slug}`}
                            onClick={(e) => handleLinkClick(e, `/blog/${post.slug}`)}
                            className="hover:text-[#D4AF37] transition-colors"
                          >
                            {post.title}
                          </a>
                        </h3>

                        <p className="text-sm text-stone-600 leading-relaxed line-clamp-3 mb-5">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                        <a
                          href={`/blog/${post.slug}`}
                          onClick={(e) => handleLinkClick(e, `/blog/${post.slug}`)}
                          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] font-bold text-[#0F291E] group-hover:text-[#D4AF37] transition-colors"
                        >
                          <span>Read Article</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                        </a>
                        <span className="text-[11px] text-stone-400">
                          {wc.toLocaleString('en-IN')} words
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Load More Button if there are more articles */}
            {filteredPosts.length > visibleCount && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="inline-flex items-center gap-2 bg-white border border-[#0F291E] text-[#0F291E] hover:bg-[#0F291E] hover:text-white px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
                >
                  <span>
                    Show All {filteredPosts.length} Design Guides
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* 5. Crawlable Directory of All 10 Flagship Homeowner Guides + Consultation Banner */}
        <section className="mt-16 bg-white border border-stone-200 p-7 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#D4AF37] font-bold block mb-2">
                COMPLETE HOMEOWNER HANDBOOK
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[#0F291E] mb-3">
                Essential Interior Planning Guides for Indian Homeowners
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed mb-5">
                Bookmark our 10 foundational guides covering 2BHK/3BHK checklists, plywood vs HDHMR selection, modular kitchen ergonomics, BOQ quotation transparency, shutter finishes, false ceilings, wardrobe dimensions, moisture protection, Bengaluru apartment rules, and project timelines:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {ALL_BLOG_POSTS.slice(0, 10).map((guide, idx) => (
                  <a
                    key={guide.slug}
                    href={`/blog/${guide.slug}`}
                    onClick={(e) => handleLinkClick(e, `/blog/${guide.slug}`)}
                    className="flex items-start gap-2 p-2.5 bg-[#FAF8F5] hover:bg-[#0F291E] text-[#0F291E] hover:text-white border border-stone-200 transition-colors"
                  >
                    <span className="text-[#D4AF37] font-mono font-bold">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className="font-medium leading-snug">{guide.title}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#0F291E] text-white p-7 sm:p-8 border border-[#D4AF37]/40">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold block mb-2">
                EXPERIENCE CENTRE • BENGALURU
              </span>
              <h3 className="text-xl sm:text-2xl font-serif text-white mb-3">
                Have a Floor Plan Ready?
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6">
                Bring your 2BHK, 3BHK, villa, or commercial layout to our Bengaluru design studio for a complimentary space-planning discussion, material sample comparison, and transparent itemised quotation.
              </p>
              <div className="space-y-3">
                <a
                  href="/contact-us"
                  onClick={(e) => {
                    if (onOpenConsultation) {
                      e.preventDefault();
                      onOpenConsultation();
                    } else {
                      handleLinkClick(e, '/contact-us');
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#D4AF37] text-[#0F291E] px-6 py-3.5 text-xs uppercase tracking-[0.18em] font-bold hover:bg-[#e0bd42] transition-colors"
                >
                  <span>Book a Design Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/our-services"
                  onClick={(e) => handleLinkClick(e, '/our-services')}
                  className="w-full inline-flex items-center justify-center gap-2 border border-white/25 hover:border-[#D4AF37] text-white px-6 py-3 text-xs uppercase tracking-[0.18em] font-semibold transition-colors"
                >
                  <span>Explore Our Interior Services</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BlogKnowledgeCentrePage;
