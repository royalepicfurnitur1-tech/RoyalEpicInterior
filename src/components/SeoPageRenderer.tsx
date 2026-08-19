import React, { useEffect, useState } from 'react';
import { SeoPageData } from '../data/seoPages';
import { 
  ChevronRight, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  ArrowRight,
  HelpCircle,
  FileText,
  Star,
  Award
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

  // Synchronize Document Head (Title, Meta Description, Keywords, OpenGraph, Canonical Tag, Schema JSON-LD)
  useEffect(() => {
    // 1. Title
    document.title = pageData.title;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageData.metaDescription);

    // 2b. Meta Keywords
    if (pageData.keywords && pageData.keywords.length > 0) {
      let metaKw = document.querySelector('meta[name="keywords"]');
      if (!metaKw) {
        metaKw = document.createElement('meta');
        metaKw.setAttribute('name', 'keywords');
        document.head.appendChild(metaKw);
      }
      metaKw.setAttribute('content', pageData.keywords.join(', '));
    }

    // 3. Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const fullUrl = `https://royalepicinterior.com${pageData.slug === '/' ? '' : pageData.slug}`;
    canonical.setAttribute('href', fullUrl);

    // 3b. OpenGraph and Twitter Meta Tags
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

    // 4. Schema.org JSON-LD Script
    let schemaScript = document.getElementById('seo-schema-script');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'seo-schema-script';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }

    // Breadcrumb Schema
    const breadcrumbListSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": pageData.breadcrumbs.map((b, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": b.name,
        "item": `https://royalepicinterior.com${b.url === '/' ? '' : b.url}`
      }))
    };

    // FAQ Schema
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

    const schemasToInject = [pageData.schema, breadcrumbListSchema, faqSchema].filter(Boolean);
    schemaScript.textContent = JSON.stringify(schemasToInject);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageData]);

  return (
    <div className="w-full bg-white text-neutral-900 min-h-screen">
      
      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="bg-neutral-100 py-3 border-b border-neutral-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center flex-wrap gap-2 text-neutral-600">
          {pageData.breadcrumbs.map((item, idx) => (
            <React.Fragment key={item.url + idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
              {idx === pageData.breadcrumbs.length - 1 ? (
                <span className="font-semibold text-neutral-900">{item.name}</span>
              ) : (
                <button
                  onClick={() => onNavigate(item.url)}
                  className="hover:text-gold transition-colors underline-offset-2 hover:underline"
                >
                  {item.name}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative bg-neutral-900 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img
            src={pageData.heroImage}
            alt={`${pageData.h1} - Royal Epic Interior & Furniture Bengaluru`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Royal Epic Bengaluru SEO Portal
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
              {pageData.h1}
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-light">
              {pageData.subtitle}
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => onRequestQuote(pageData.h1)}
                className="px-6 py-3.5 bg-gold hover:bg-gold-light text-neutral-950 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm flex items-center gap-2"
              >
                Get Free Turnkey BOQ Quote <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="tel:+919916633338"
                className="px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl border border-white/20 transition-all text-xs sm:text-sm flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-gold" /> Call Senior Designer (+91 99166 33338)
              </a>
            </div>
          </div>

          {/* Quick Trust Cards Box */}
          <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/15 max-w-sm w-full space-y-4 text-xs">
            <h3 className="font-serif font-bold text-base text-gold flex items-center gap-2">
              <Award className="w-5 h-5" /> Why Royal Epic Interior?
            </h3>
            <ul className="space-y-3 text-neutral-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>10,000 Sq.Ft In-House Factory</strong> in Thanisandra, Bengaluru</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>15-Year Guarantee</strong> on Waterproof BWR Marine Plywood</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>3D VR Design Walkthroughs</strong> & Itemized BOQ transparent pricing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>500+ Delivered Projects</strong> across Whitefield, HSR, Hebbal & Indiranagar</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Metrics Banner */}
      <section className="py-8 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-neutral-200/80">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 font-mono">15 Years</span>
            <p className="text-xs text-neutral-600 mt-1">Waterproof Wood Warranty</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-neutral-200/80">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 font-mono">500+</span>
            <p className="text-xs text-neutral-600 mt-1">Bengaluru Projects Delivered</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-neutral-200/80">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 font-mono">4.9 / 5.0</span>
            <p className="text-xs text-neutral-600 mt-1 flex items-center justify-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 320+ Client Ratings
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-neutral-200/80">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 font-mono">100%</span>
            <p className="text-xs text-neutral-600 mt-1">On-Time Delivery Record</p>
          </div>
        </div>
      </section>

      {/* 4. Main SEO Content Sections */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Copy */}
          <div className="lg:col-span-2 space-y-10">
            {pageData.contentSections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h2 className="text-2xl font-serif font-bold text-neutral-900 border-l-4 border-gold pl-3">
                  {section.title}
                </h2>
                <p className="text-neutral-700 leading-relaxed text-sm sm:text-base">
                  {section.description}
                </p>
                {section.highlights && section.highlights.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-neutral-800">
                    {section.highlights.map((item, hIdx) => (
                      <li key={hIdx} className="flex items-center gap-2 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                        <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* FAQs Accordion Section */}
            {pageData.faqs && pageData.faqs.length > 0 && (
              <div className="pt-8 border-t border-neutral-200 space-y-6">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-gold" />
                  <h2 className="text-2xl font-serif font-bold text-neutral-900">
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="space-y-3">
                  {pageData.faqs.map((faq, fIdx) => (
                    <div
                      key={fIdx}
                      className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === fIdx ? null : fIdx)}
                        className="w-full text-left p-4 font-semibold text-sm text-neutral-900 flex justify-between items-center bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <span>{faq.question}</span>
                        <span className="text-gold text-lg font-bold">
                          {openFaqIndex === fIdx ? '−' : '+'}
                        </span>
                      </button>
                      {openFaqIndex === fIdx && (
                        <div className="p-4 text-xs sm:text-sm text-neutral-700 bg-white border-t border-neutral-200 leading-relaxed">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar CTA & Internal Links */}
          <div className="space-y-8">
            
            {/* Consultation Card */}
            <div className="bg-neutral-900 text-white p-6 rounded-2xl shadow-xl border border-neutral-800 space-y-4">
              <h3 className="font-serif font-bold text-lg text-gold flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Schedule Site Consultation
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Book a senior interior architect for a 3D site layout discussion and free laser measurement in Bengaluru.
              </p>
              <button
                onClick={() => onRequestQuote(pageData.h1)}
                className="w-full py-3 bg-gold hover:bg-gold-light text-neutral-950 font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Book Site Visit Meeting
              </button>
              <p className="text-[11px] text-neutral-400 text-center">
                Or call our Thanisandra hub at <a href="tel:+919916633338" className="text-gold underline">+91 99166 33338</a>
              </p>
            </div>

            {/* Related Service & Location SEO Links */}
            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 space-y-4">
              <h3 className="font-serif font-bold text-base text-neutral-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold" /> Related SEO Services & Locations
              </h3>

              <div className="flex flex-col gap-2">
                {pageData.relatedLinks.map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigate(link.url)}
                    className="text-left text-xs font-medium text-neutral-700 hover:text-gold flex items-center justify-between p-2.5 rounded-lg hover:bg-white border border-transparent hover:border-neutral-200 transition-all"
                  >
                    <span>{link.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Bottom SEO Footer Nav Index */}
      <section className="py-12 bg-neutral-900 text-white border-t border-neutral-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="font-serif font-bold text-lg text-gold">
              Royal Epic Interior & Furniture — Bengaluru SEO Sitemap Directory
            </h3>
            <p className="text-neutral-400 text-xs max-w-2xl mx-auto">
              Explore our full catalog of residential interior services, Bengaluru location portals, modular kitchen cost calculators, and custom furniture solutions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-neutral-300">
            <div>
              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider text-gold">Main Pages</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => onNavigate('/')} className="hover:text-gold">Home</button></li>
                <li><button onClick={() => onNavigate('/about-us')} className="hover:text-gold">About Us</button></li>
                <li><button onClick={() => onNavigate('/our-services')} className="hover:text-gold">Our Services</button></li>
                <li><button onClick={() => onNavigate('/portfolio')} className="hover:text-gold">Portfolio</button></li>
                <li><button onClick={() => onNavigate('/completed-projects')} className="hover:text-gold">Completed Projects</button></li>
                <li><button onClick={() => onNavigate('/get-free-quote')} className="hover:text-gold">Get Free Quote</button></li>
                <li><button onClick={() => onNavigate('/customer-reviews')} className="hover:text-gold">Customer Reviews</button></li>
                <li><button onClick={() => onNavigate('/faq')} className="hover:text-gold">FAQ</button></li>
                <li><button onClick={() => onNavigate('/blog')} className="hover:text-gold">Blog Journal</button></li>
                <li><button onClick={() => onNavigate('/contact-us')} className="hover:text-gold">Contact Us</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider text-gold">Service Portals</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => onNavigate('/home-interior-design-bangalore')} className="hover:text-gold">Home Interior Bangalore</button></li>
                <li><button onClick={() => onNavigate('/luxury-home-interiors-bangalore')} className="hover:text-gold">Luxury Home Interiors</button></li>
                <li><button onClick={() => onNavigate('/turnkey-interior-contractors-bangalore')} className="hover:text-gold">Turnkey Contractors</button></li>
                <li><button onClick={() => onNavigate('/modular-kitchen-bangalore')} className="hover:text-gold">Modular Kitchen</button></li>
                <li><button onClick={() => onNavigate('/modular-wardrobe-bangalore')} className="hover:text-gold">Modular Wardrobe</button></li>
                <li><button onClick={() => onNavigate('/living-room-interior-design')} className="hover:text-gold">Living Room Design</button></li>
                <li><button onClick={() => onNavigate('/bedroom-interior-design')} className="hover:text-gold">Bedroom Design</button></li>
                <li><button onClick={() => onNavigate('/tv-unit-design')} className="hover:text-gold">TV Unit Design</button></li>
                <li><button onClick={() => onNavigate('/pooja-room-design')} className="hover:text-gold">Pooja Room Design</button></li>
                <li><button onClick={() => onNavigate('/false-ceiling-design')} className="hover:text-gold">False Ceiling Design</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider text-gold">Bengaluru Locations</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => onNavigate('/interior-designer-whitefield')} className="hover:text-gold">Whitefield</button></li>
                <li><button onClick={() => onNavigate('/interior-designer-jp-nagar')} className="hover:text-gold">JP Nagar</button></li>
                <li><button onClick={() => onNavigate('/interior-designer-hsr-layout')} className="hover:text-gold">HSR Layout</button></li>
                <li><button onClick={() => onNavigate('/interior-designer-electronic-city')} className="hover:text-gold">Electronic City</button></li>
                <li><button onClick={() => onNavigate('/interior-designer-yelahanka')} className="hover:text-gold">Yelahanka</button></li>
                <li><button onClick={() => onNavigate('/interior-designer-hebbal')} className="hover:text-gold">Hebbal</button></li>
                <li><button onClick={() => onNavigate('/interior-designer-koramangala')} className="hover:text-gold">Koramangala</button></li>
                <li><button onClick={() => onNavigate('/interior-designer-marathahalli')} className="hover:text-gold">Marathahalli</button></li>
                <li><button onClick={() => onNavigate('/interior-designer-indiranagar')} className="hover:text-gold">Indiranagar</button></li>
                <li><button onClick={() => onNavigate('/interior-designer-thanisandra')} className="hover:text-gold">Thanisandra Hub</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider text-gold">Cost & Decor Guides</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => onNavigate('/modular-kitchen-cost-bangalore')} className="hover:text-gold">Modular Kitchen Cost</button></li>
                <li><button onClick={() => onNavigate('/home-interior-cost-bangalore')} className="hover:text-gold">Home Interior Cost</button></li>
                <li><button onClick={() => onNavigate('/2bhk-interior-cost-bangalore')} className="hover:text-gold">2BHK Cost Breakdown</button></li>
                <li><button onClick={() => onNavigate('/3bhk-interior-cost-bangalore')} className="hover:text-gold">3BHK Cost Breakdown</button></li>
                <li><button onClick={() => onNavigate('/villa-interior-design-guide')} className="hover:text-gold">Villa Interior Guide</button></li>
                <li><button onClick={() => onNavigate('/best-interior-design-company-bangalore')} className="hover:text-gold">Best Interior Company</button></li>
                <li><button onClick={() => onNavigate('/latest-home-interior-trends')} className="hover:text-gold">2026 Design Trends</button></li>
                <li><button onClick={() => onNavigate('/wardrobe-design-ideas')} className="hover:text-gold">Wardrobe Ideas</button></li>
                <li><button onClick={() => onNavigate('/false-ceiling-design-ideas')} className="hover:text-gold">False Ceiling Ideas</button></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
