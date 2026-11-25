import React, { useEffect, useMemo, useState } from 'react';
import { SeoPageData } from '../data/seoPages';
import {
  ChevronRight,
  Phone,
  ArrowRight,
  Check,
  Plus,
  Minus,
} from 'lucide-react';

interface SeoPageRendererProps {
  pageData: SeoPageData;
  onNavigate: (path: string) => void;
  onRequestQuote: (prefillTitle?: string) => void;
}

export const SeoPageRenderer: React.FC<SeoPageRendererProps> = ({
  pageData,
  onNavigate,
  onRequestQuote,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    setHeroImageError(false);
    setOpenFaqIndex(0);
  }, [pageData.slug]);

  // Curate at most 6 relevant related links (excluding current page, balanced across services & locations)
  const curatedRelatedLinks = useMemo(() => {
    const raw = Array.isArray(pageData.relatedLinks) ? pageData.relatedLinks : [];
    const seen = new Set<string>([pageData.slug]);
    const unique = raw.filter((link) => {
      if (!link?.url || seen.has(link.url)) return false;
      seen.add(link.url);
      return true;
    });

    const services = unique.filter((l) => (l.category || '').toLowerCase() !== 'locations');
    const locations = unique.filter((l) => (l.category || '').toLowerCase() === 'locations');

    const picked = [...services.slice(0, 4), ...locations.slice(0, 2)];
    if (picked.length < 6) {
      for (const item of unique) {
        if (picked.length >= 6) break;
        if (!picked.some((p) => p.url === item.url)) picked.push(item);
      }
    }
    return picked.slice(0, 6);
  }, [pageData.relatedLinks, pageData.slug]);

  // Synchronize Document Head (Title, Meta Description, Keywords, OpenGraph, Canonical Tag, Schema JSON-LD)
  useEffect(() => {
    document.title = pageData.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageData.metaDescription);

    if (pageData.keywords && pageData.keywords.length > 0) {
      let metaKw = document.querySelector('meta[name="keywords"]');
      if (!metaKw) {
        metaKw = document.createElement('meta');
        metaKw.setAttribute('name', 'keywords');
        document.head.appendChild(metaKw);
      }
      metaKw.setAttribute('content', pageData.keywords.join(', '));
    }

    const getBaseOrigin = (): string => {
      if (typeof window !== 'undefined' && window.location) {
        const hostname = (window.location.hostname || '').toLowerCase();
        if (hostname.includes('royalepicinterior.in') || (hostname.endsWith('.in') && hostname.includes('royalepic'))) {
          return 'https://royalepicinterior.in';
        }
        if (hostname.includes('royalepicinterior.com') || (hostname.endsWith('.com') && hostname.includes('royalepic'))) {
          return 'https://royalepicinterior.com';
        }
        if (window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
          return window.location.origin.includes('.in') ? 'https://royalepicinterior.in' : 'https://royalepicinterior.com';
        }
      }
      return 'https://royalepicinterior.com';
    };

    const currentOrigin = getBaseOrigin();
    const cleanSlug = pageData.slug === '/' ? '' : (pageData.slug.startsWith('/') ? pageData.slug : `/${pageData.slug}`);
    const fullUrl = `${currentOrigin}${cleanSlug}`;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    const setMetaTag = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (property.startsWith('og:')) {
          el.setAttribute('property', property);
        } else {
          el.setAttribute('name', property);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const ogTitle = pageData.openGraph?.title || pageData.title;
    const ogDesc = pageData.openGraph?.description || pageData.metaDescription;
    const ogImg = pageData.openGraph?.image || pageData.heroImage;
    const ogType = pageData.openGraph?.type || (pageData.category === 'blog' ? 'article' : 'website');

    setMetaTag('og:title', ogTitle);
    setMetaTag('og:description', ogDesc);
    setMetaTag('og:image', ogImg);
    setMetaTag('og:url', fullUrl);
    setMetaTag('og:type', ogType);
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', ogTitle);
    setMetaTag('twitter:description', ogDesc);
    setMetaTag('twitter:image', ogImg);

    let schemaScript = document.getElementById('seo-schema-script');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'seo-schema-script';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }

    const breadcrumbListSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": pageData.breadcrumbs.map((b, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": b.name,
        "item": `${currentOrigin}${b.url === '/' ? '' : (b.url.startsWith('/') ? b.url : `/${b.url}`)}`
      }))
    };

    const faqSchema = pageData.faqs.length > 0 ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": pageData.faqs.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    } : null;

    let localizedBaseSchema = pageData.schema;
    try {
      localizedBaseSchema = JSON.parse(
        JSON.stringify(pageData.schema)
          .replace(/https:\/\/royalepicinterior\.com/g, currentOrigin)
          .replace(/https:\/\/royalepicfurniture\.com/g, currentOrigin)
      );
    } catch (_) {}

    const schemasToInject = [localizedBaseSchema, breadcrumbListSchema, faqSchema].filter(Boolean);
    schemaScript.textContent = JSON.stringify(schemasToInject);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageData]);

  return (
    <div className="w-full bg-[#A8A492] text-neutral-900">
      {/* 1. Slim Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="bg-[#9E9A88]/40 border-b border-neutral-900/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center flex-wrap gap-1.5 text-xs text-neutral-700">
          {pageData.breadcrumbs.map((item, idx) => (
            <React.Fragment key={item.url + idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-neutral-500 shrink-0" />}
              {idx === pageData.breadcrumbs.length - 1 ? (
                <span className="font-medium text-neutral-950">{item.name}</span>
              ) : (
                <button
                  onClick={() => onNavigate(item.url)}
                  className="hover:text-neutral-950 transition-colors underline-offset-2 hover:underline cursor-pointer"
                >
                  {item.name}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* 2. Compact Editorial Hero */}
      <section className="relative bg-neutral-950 text-white overflow-hidden">
        {!heroImageError && pageData.heroImage && (
          <div className="absolute inset-0 opacity-30">
            <img
              src={pageData.heroImage}
              alt={`${pageData.h1} - Royal Epic Interior & Furniture Bengaluru`}
              referrerPolicy="no-referrer"
              onError={() => setHeroImageError(true)}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/80 to-neutral-950/55" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="max-w-2xl space-y-3.5">
            <p className="text-xs font-medium tracking-wide text-gold/90">
              Royal Epic Bengaluru <span aria-hidden="true" className="mx-1.5 text-neutral-500">·</span> Factory Direct Craftsmanship
            </p>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white leading-tight [text-wrap:balance]">
              {pageData.h1}
            </h1>

            <p className="text-sm sm:text-[15px] text-neutral-300 leading-relaxed max-w-xl">
              {pageData.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onRequestQuote(pageData.h1)}
                className="px-5 py-2.5 bg-gold hover:bg-gold-light text-neutral-950 font-semibold rounded-lg transition-colors text-xs sm:text-sm inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <span>Get Free Quote</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('/products')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg border border-white/15 transition-colors text-xs sm:text-sm whitespace-nowrap cursor-pointer"
              >
                Browse Products
              </button>

              <a
                href="tel:+917026119311"
                className="px-3 py-2 text-neutral-300 hover:text-gold transition-colors text-xs sm:text-sm inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5 text-gold shrink-0" />
                <span className="tabular-nums">+91 70261 19311</span>
              </a>
            </div>
          </div>

          {/* Quiet Inline Proof Strip */}
          <div className="mt-7 pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-neutral-400">
            <span><strong className="text-neutral-200 font-medium tabular-nums">15-Year</strong> Warranty</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span><strong className="text-neutral-200 font-medium tabular-nums">500+</strong> Bengaluru Projects</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span><strong className="text-neutral-200 font-medium tabular-nums">4.9 / 5</strong> Client Rating</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>Thanisandra In-House Factory</span>
          </div>
        </div>
      </section>

      {/* 3. Main Content & Compact Consultation Column */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-9 md:py-11 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Primary Content Column */}
          <div className="lg:col-span-8 bg-[#FAF9F6] rounded-2xl border border-neutral-900/10 p-6 sm:p-7 space-y-7">
            {pageData.contentSections.map((section, idx) => (
              <div
                key={idx}
                className={idx > 0 ? 'pt-6 border-t border-neutral-200/80 space-y-2.5' : 'space-y-2.5'}
              >
                <h2 className="text-lg sm:text-xl font-serif font-semibold text-neutral-900 leading-snug">
                  {section.title}
                </h2>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {section.description}
                </p>
                {section.highlights && section.highlights.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 pt-2 text-xs text-neutral-800">
                    {section.highlights.map((item, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Compact FAQ Accordion */}
            {pageData.faqs && pageData.faqs.length > 0 && (
              <div className="pt-6 border-t border-neutral-200/80 space-y-3">
                <h2 className="text-base sm:text-lg font-serif font-semibold text-neutral-900">
                  Frequently Asked Questions
                </h2>

                <div className="divide-y divide-neutral-200/80 border-y border-neutral-200/80">
                  {pageData.faqs.map((faq, fIdx) => {
                    const isOpen = openFaqIndex === fIdx;
                    return (
                      <div key={fIdx}>
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                          className="w-full text-left py-3 text-sm font-medium text-neutral-900 flex justify-between items-center gap-4 hover:text-amber-800 transition-colors cursor-pointer"
                        >
                          <span>{faq.question}</span>
                          {isOpen ? (
                            <Minus className="w-4 h-4 text-neutral-500 shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-neutral-500 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="pb-3.5 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Compact Consultation Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-neutral-900 text-white p-5 sm:p-6 rounded-2xl border border-neutral-800 space-y-3.5">
              <h3 className="font-serif font-semibold text-base text-gold">
                Schedule Site Consultation
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Speak with our Bengaluru design &amp; factory team for custom dimensions, material samples, and an itemized quote.
              </p>
              <button
                onClick={() => onRequestQuote(pageData.h1)}
                className="w-full py-2.5 px-4 bg-gold hover:bg-gold-light text-neutral-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Book Site Visit
              </button>
              <p className="text-[11px] text-neutral-400 text-center pt-0.5">
                Thanisandra Hub ·{' '}
                <a href="tel:+917026119311" className="text-gold hover:underline tabular-nums">
                  +91 70261 19311
                </a>
              </p>
            </div>
          </aside>
        </div>

        {/* 4. Compact Related Services & Locations (capped at 6 items, fits cleanly in 2 rows) */}
        {curatedRelatedLinks.length > 0 && (
          <div className="pt-6 border-t border-neutral-900/15 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-serif font-semibold text-sm sm:text-base text-neutral-900">
                Related Services &amp; Locations
              </h3>
              <button
                onClick={() => onNavigate('/our-services')}
                className="text-xs font-medium text-neutral-800 hover:text-neutral-950 inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>All Services</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {curatedRelatedLinks.map((link) => (
                <button
                  key={link.url}
                  onClick={() => onNavigate(link.url)}
                  className="group text-left px-3.5 py-2.5 rounded-xl bg-[#FAF9F6]/85 hover:bg-[#FAF9F6] border border-neutral-900/10 hover:border-neutral-900/25 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-neutral-800 group-hover:text-neutral-950 truncate">
                    {link.title}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-800 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
