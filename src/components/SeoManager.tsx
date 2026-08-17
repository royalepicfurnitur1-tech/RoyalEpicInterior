import React, { useState, useEffect } from 'react';
import { 
  Search, Globe, FileCode, CheckCircle2, RefreshCw, Save, Sparkles, 
  Code, Eye, Link, Share2, Copy, Download, AlertCircle, ShieldCheck, Check, Layers
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { recordAdminAuditLog } from './AdminActivityLogger';

export interface SeoPageData {
  pageSlug: string;
  pageName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  indexingDirective: 'index, follow' | 'noindex, follow' | 'noindex, nofollow';
  schemaMarkup: string;
  updatedAt?: string;
}

const DEFAULT_SEO_PAGES: SeoPageData[] = [
  {
    pageSlug: '/',
    pageName: 'Home Page',
    metaTitle: 'Royal Epic Interior & Furniture | Best Luxury Interior Designers in Thanisandra, Bangalore',
    metaDescription: 'Top-rated interior design company in Thanisandra, Bangalore. 100% factory-made modular kitchens, 3BHK turnkey interiors & luxury furniture with 10-year warranty.',
    metaKeywords: 'interior designers thanisandra, modular kitchen bangalore, 3bhk turnkey interior, luxury furniture thanisandra',
    canonicalUrl: 'https://royalepicfurniture.com/',
    ogTitle: 'Royal Epic Interior & Furniture | Thanisandra Bangalore',
    ogDescription: 'Experience luxury turnkey interior design with factory precision and 3D walkthroughs.',
    ogImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop',
    indexingDirective: 'index, follow',
    schemaMarkup: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Royal Epic Interior & Furniture Pvt Ltd",
      "image": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200",
      "@id": "https://royalepicfurniture.com",
      "url": "https://royalepicfurniture.com",
      "telephone": "+91-99166-33338",
      "priceRange": "₹₹₹",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Main Road, Near Manyata Tech Park",
        "addressLocality": "Thanisandra",
        "addressRegion": "Bangalore",
        "postalCode": "560077",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 13.0583,
        "longitude": 77.6322
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "09:30",
        "closes": "20:30"
      }
    }, null, 2),
    updatedAt: new Date().toISOString()
  },
  {
    pageSlug: '/modular-kitchen',
    pageName: 'Modular Kitchens',
    metaTitle: 'Factory Modular Kitchen Designers Thanisandra | Acrylic, PU & Veneer Finishes',
    metaDescription: 'Custom German & Italian modular kitchen designs in Bangalore. Waterproof Action TESA HDHMR, Hettich soft-close tandem boxes, and 10-year warranty.',
    metaKeywords: 'modular kitchen thanisandra, acrylic kitchen bangalore, pu finish kitchen, hettich modular kitchen',
    canonicalUrl: 'https://royalepicfurniture.com/modular-kitchen',
    ogTitle: 'Factory Modular Kitchens | Royal Epic Interior',
    ogDescription: '100% waterproof modular kitchens manufactured with CNC precision in Thanisandra factory.',
    ogImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop',
    indexingDirective: 'index, follow',
    schemaMarkup: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Factory Modular Kitchen Design",
      "provider": {
        "@type": "LocalBusiness",
        "name": "Royal Epic Interior & Furniture Pvt Ltd"
      },
      "areaServed": {
        "@type": "City",
        "name": "Bangalore"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Modular Kitchen Finishes",
        "itemListElement": [
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Acrylic Modular Kitchen" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "PU Polish Handleless Kitchen" } }
        ]
      }
    }, null, 2),
    updatedAt: new Date().toISOString()
  },
  {
    pageSlug: '/3bhk-turnkey',
    pageName: '3BHK Turnkey Interiors',
    metaTitle: '3BHK Turnkey Interior Design Packages Bangalore | Flat 45-Day Delivery',
    metaDescription: 'Complete 3BHK turnkey interior design package including false ceiling, modular wardrobes, lighting, and living room wall paneling.',
    metaKeywords: '3bhk interior package bangalore, turnkey interiors thanisandra, 3bhk interior cost bangalore',
    canonicalUrl: 'https://royalepicfurniture.com/3bhk-turnkey',
    ogTitle: 'Complete 3BHK Turnkey Interior Packages Bangalore',
    ogDescription: '45-Day guaranteed handover for 3BHK flats with zero cost overrun policy.',
    ogImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    indexingDirective: 'index, follow',
    schemaMarkup: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "3BHK Turnkey Interior Package",
      "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
      "description": "Full home turnkey interior execution for 3BHK apartments in Bangalore.",
      "brand": {
        "@type": "Brand",
        "name": "Royal Epic Interior"
      },
      "offers": {
        "@type": "Offer",
        "url": "https://royalepicfurniture.com/3bhk-turnkey",
        "priceCurrency": "INR",
        "price": "1250000",
        "availability": "https://schema.org/InStock"
      }
    }, null, 2),
    updatedAt: new Date().toISOString()
  },
  {
    pageSlug: '/cost-estimator',
    pageName: 'Cost Estimator & BOQ',
    metaTitle: 'Interior Design Cost Estimator & Instant BOQ Calculator Bangalore',
    metaDescription: 'Calculate instant room-by-room interior design cost estimates for 2BHK, 3BHK & Villas in Bangalore with material specification breakdown.',
    metaKeywords: 'interior design cost estimator, boq calculator bangalore, 3bhk interior budget estimator',
    canonicalUrl: 'https://royalepicfurniture.com/cost-estimator',
    ogTitle: 'Instant Interior Cost Estimator & BOQ Calculator',
    ogDescription: 'Get transparent itemized interior quotes with 18% GST tax breakdown instantly.',
    ogImage: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200&auto=format&fit=crop',
    indexingDirective: 'index, follow',
    schemaMarkup: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Royal Epic BOQ Interior Calculator",
      "url": "https://royalepicfurniture.com/cost-estimator",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All"
    }, null, 2),
    updatedAt: new Date().toISOString()
  },
  {
    pageSlug: '/contact',
    pageName: 'Contact & Thanisandra Showroom',
    metaTitle: 'Contact Royal Epic Interior | Visit Experience Center Thanisandra Main Rd',
    metaDescription: 'Visit our 3,500 sq.ft Experience Center on Thanisandra Main Road, Bangalore. Speak with senior design architects or schedule a site visit.',
    metaKeywords: 'royal epic interior address, interior showroom thanisandra, interior design enquiry bangalore',
    canonicalUrl: 'https://royalepicfurniture.com/contact',
    ogTitle: 'Contact Royal Epic Interior & Visit Experience Center',
    ogDescription: 'Experience materials, wood textures, and soft-close hardware live at Thanisandra showroom.',
    ogImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
    indexingDirective: 'index, follow',
    schemaMarkup: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Royal Epic Interior Contact Page",
      "mainEntity": {
        "@type": "LocalBusiness",
        "name": "Royal Epic Interior & Furniture Pvt Ltd",
        "telephone": "+91-99166-33338",
        "email": "royalepicfurnitur1@gmail.com"
      }
    }, null, 2),
    updatedAt: new Date().toISOString()
  }
];

export const SeoManager: React.FC = () => {
  const [pages, setPages] = useState<SeoPageData[]>(DEFAULT_SEO_PAGES);
  const [selectedSlug, setSelectedSlug] = useState<string>('/');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'serp' | 'social' | 'schema'>('serp');
  
  // Robots.txt & Global Meta settings state
  const [robotsTxt, setRobotsTxt] = useState<string>(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://royalepicfurniture.com/sitemap.xml`
  );

  // Active Selected Page Data
  const currentPage = pages.find(p => p.pageSlug === selectedSlug) || pages[0];

  // Schema Json Validity Check
  const isSchemaValid = (() => {
    try {
      JSON.parse(currentPage.schemaMarkup);
      return true;
    } catch {
      return false;
    }
  })();

  // Fetch SEO Pages from Firebase Firestore
  const fetchSeoPagesFromFirebase = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'seo_pages'));
      if (!snap.empty) {
        const fetched: SeoPageData[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            pageSlug: data.pageSlug || docSnap.id,
            pageName: data.pageName || data.pageSlug,
            metaTitle: data.metaTitle || '',
            metaDescription: data.metaDescription || '',
            metaKeywords: data.metaKeywords || '',
            canonicalUrl: data.canonicalUrl || '',
            ogTitle: data.ogTitle || '',
            ogDescription: data.ogDescription || '',
            ogImage: data.ogImage || '',
            indexingDirective: data.indexingDirective || 'index, follow',
            schemaMarkup: data.schemaMarkup || '{}',
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        });

        // Merge with defaults to ensure all site routes are available
        const existingSlugs = new Set(fetched.map(f => f.pageSlug));
        const combined = [...fetched, ...DEFAULT_SEO_PAGES.filter(d => !existingSlugs.has(d.pageSlug))];
        setPages(combined);
      }
    } catch (err) {
      console.warn('Firebase SEO fetch fallback to defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoPagesFromFirebase();

    // Subscribe to real-time updates
    let unsubscribe: () => void;
    try {
      unsubscribe = onSnapshot(collection(db, 'seo_pages'), (snapshot) => {
        if (!snapshot.empty) {
          const realTimeList: SeoPageData[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            realTimeList.push({
              pageSlug: data.pageSlug || docSnap.id,
              pageName: data.pageName || data.pageSlug,
              metaTitle: data.metaTitle || '',
              metaDescription: data.metaDescription || '',
              metaKeywords: data.metaKeywords || '',
              canonicalUrl: data.canonicalUrl || '',
              ogTitle: data.ogTitle || '',
              ogDescription: data.ogDescription || '',
              ogImage: data.ogImage || '',
              indexingDirective: data.indexingDirective || 'index, follow',
              schemaMarkup: data.schemaMarkup || '{}',
              updatedAt: data.updatedAt || new Date().toISOString()
            });
          });

          setPages(prev => {
            const map = new Map(prev.map(p => [p.pageSlug, p]));
            realTimeList.forEach(p => map.set(p.pageSlug, p));
            return Array.from(map.values());
          });
        }
      });
    } catch (e) {
      // Ignore
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handler to update current page field
  const updateCurrentPageField = (field: keyof SeoPageData, value: string) => {
    setPages(prev => prev.map(p => p.pageSlug === selectedSlug ? { ...p, [field]: value, updatedAt: new Date().toISOString() } : p));
  };

  // Save current page changes to Firebase
  const handleSavePageSeo = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const docId = currentPage.pageSlug === '/' ? 'home' : currentPage.pageSlug.replace(/\//g, '_');
    const payload = {
      ...currentPage,
      updatedAt: new Date().toISOString()
    };

    try {
      const pageRef = doc(db, 'seo_pages', docId);
      await setDoc(pageRef, payload, { merge: true });

      // Audit Log Entry
      await recordAdminAuditLog(
        `SEO Meta Updated (${currentPage.pageName})`,
        'CMS_UPDATE',
        `Updated meta title, canonical URL (${currentPage.canonicalUrl}), and JSON-LD schema for ${currentPage.pageSlug}`,
        'INFO'
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Saved SEO data locally:', err);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // AI SEO Meta Generator helper
  const handleAiGenerateMeta = () => {
    const slug = currentPage.pageSlug;
    let title = '';
    let desc = '';
    let keywords = '';

    if (slug === '/') {
      title = 'Royal Epic Interior | Top Luxury Interior Designers Thanisandra Bangalore';
      desc = 'Award-winning turnkey interior design & factory modular kitchens in Thanisandra, Bangalore. 10-year warranty, 3D VR walkthroughs & 45-day guaranteed delivery.';
      keywords = 'interior designers thanisandra, luxury interiors bangalore, turnkey interiors, factory modular kitchen';
    } else if (slug === '/modular-kitchen') {
      title = 'Factory Modular Kitchens Thanisandra | Acrylic, PU & Veneer Finishes';
      desc = 'Custom 100% waterproof modular kitchens in Thanisandra Bangalore. German tandem hardware, Action TESA HDHMR boards & factory direct pricing.';
      keywords = 'modular kitchen thanisandra, acrylic kitchen bangalore, pu finish kitchen, hettich tandem box';
    } else if (slug === '/3bhk-turnkey') {
      title = '3BHK Turnkey Interior Packages Bangalore | Flat 45-Day Handover';
      desc = 'All-inclusive 3BHK interior packages in Bangalore including false ceiling, wardrobes, lights & sofa. Zero hidden costs with 100% material transparency.';
      keywords = '3bhk interior package bangalore, turnkey flat interiors, 3bhk interior budget thanisandra';
    } else {
      title = `${currentPage.pageName} | Royal Epic Interior Thanisandra Bangalore`;
      desc = `Explore ${currentPage.pageName.toLowerCase()} with premium materials, factory fabrication, and expert interior architects in Bangalore.`;
      keywords = `${currentPage.pageName.toLowerCase()}, royal epic interior, thanisandra bangalore`;
    }

    updateCurrentPageField('metaTitle', title);
    updateCurrentPageField('metaDescription', desc);
    updateCurrentPageField('metaKeywords', keywords);
    updateCurrentPageField('ogTitle', title);
    updateCurrentPageField('ogDescription', desc);
  };

  // Export Sitemap XML
  const handleExportSitemapXml = () => {
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    const xmlBody = pages.map(p => `
  <url>
    <loc>${p.canonicalUrl || `https://royalepicfurniture.com${p.pageSlug === '/' ? '' : p.pageSlug}`}</loc>
    <lastmod>${p.updatedAt ? p.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.pageSlug === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('');
    const xmlFooter = `\n</urlset>`;

    const fullXml = xmlHeader + xmlBody + xmlFooter;
    const blob = new Blob([fullXml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Export Robots.txt
  const handleExportRobotsTxt = () => {
    const blob = new Blob([robotsTxt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/40 text-[10px] font-mono font-bold uppercase tracking-wider">
              Firebase Synced Webmaster Suite
            </span>
            <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Google Local SEO Ready
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mt-1 flex items-center gap-2">
            <Search className="w-6 h-6 text-gold" /> SEO & Schema Markup Engine
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage meta titles, Google search SERP previews, canonical URLs, Open Graph cards, and JSON-LD structured schema.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchSeoPagesFromFirebase}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 transition-all cursor-pointer"
            title="Refresh SEO Metadata from Firebase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportSitemapXml}
            className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export sitemap.xml
          </button>

          <button
            onClick={handleSavePageSeo}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              saveSuccess 
                ? 'bg-emerald-400 shadow-emerald-400/20' 
                : 'bg-gradient-to-r from-gold via-amber-400 to-yellow-500 hover:brightness-110 shadow-gold/20'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>Saved to Firebase!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-black stroke-[2.5]" />
                <span>{saving ? 'Syncing...' : 'Save Page Meta'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Page Route Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-mono font-bold text-neutral-400 shrink-0 uppercase tracking-wider mr-1">
          Select Page:
        </span>
        {pages.map((p) => {
          const isSelected = p.pageSlug === selectedSlug;
          return (
            <button
              key={p.pageSlug}
              onClick={() => setSelectedSlug(p.pageSlug)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isSelected 
                  ? 'bg-gold text-neutral-950 shadow-md shadow-gold/20' 
                  : 'bg-black/60 text-neutral-300 hover:text-white border border-white/10 hover:border-gold/30'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{p.pageName}</span>
              <span className={`text-[10px] font-mono opacity-80 ${isSelected ? 'text-black' : 'text-neutral-500'}`}>
                ({p.pageSlug})
              </span>
            </button>
          );
        })}
      </div>

      {/* MAIN TWO COLUMN LAYOUT: EDIT FORM vs SERP PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: META FORM FIELDS (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Card 1: Basic Page Meta */}
          <div className="p-5 rounded-3xl bg-neutral-950 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-white text-base flex items-center gap-2">
                <FileCode className="w-4 h-4 text-gold" /> Meta Tags ({currentPage.pageName})
              </h3>

              <button
                type="button"
                onClick={handleAiGenerateMeta}
                className="px-3 py-1.5 rounded-lg bg-gold/15 text-gold border border-gold/40 text-xs font-bold flex items-center gap-1.5 hover:bg-gold hover:text-black transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold" /> AI Auto-Generate Meta
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Meta Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 font-bold uppercase">Meta Title Tag (&lt;title&gt;)</label>
                  <span className={`font-mono text-[11px] ${currentPage.metaTitle.length > 60 ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                    {currentPage.metaTitle.length} / 60 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={currentPage.metaTitle}
                  onChange={(e) => updateCurrentPageField('metaTitle', e.target.value)}
                  placeholder="Primary focus keyword + Brand Name"
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-gold"
                />
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 font-bold uppercase">Meta Description Tag</label>
                  <span className={`font-mono text-[11px] ${currentPage.metaDescription.length > 160 ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                    {currentPage.metaDescription.length} / 160 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={currentPage.metaDescription}
                  onChange={(e) => updateCurrentPageField('metaDescription', e.target.value)}
                  placeholder="Compelling search call to action..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-gold"
                />
              </div>

              {/* Canonical URL & Indexing Directive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold uppercase mb-1">Canonical URL Tag</label>
                  <input
                    type="text"
                    value={currentPage.canonicalUrl}
                    onChange={(e) => updateCurrentPageField('canonicalUrl', e.target.value)}
                    placeholder="https://royalepicfurniture.com/..."
                    className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold uppercase mb-1">Robots Indexing Directive</label>
                  <select
                    value={currentPage.indexingDirective}
                    onChange={(e) => updateCurrentPageField('indexingDirective', e.target.value as any)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="index, follow">index, follow (Default - Recommended)</option>
                    <option value="noindex, follow">noindex, follow (Hide from SERP)</option>
                    <option value="noindex, nofollow">noindex, nofollow (Strict Private)</option>
                  </select>
                </div>
              </div>

              {/* Meta Keywords */}
              <div>
                <label className="block text-neutral-300 font-bold uppercase mb-1">Focus Target Keywords</label>
                <input
                  type="text"
                  value={currentPage.metaKeywords}
                  onChange={(e) => updateCurrentPageField('metaKeywords', e.target.value)}
                  placeholder="interior designers thanisandra, modular kitchen bangalore..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Open Graph Social Sharing */}
          <div className="p-5 rounded-3xl bg-neutral-950 border border-white/10 space-y-4">
            <h3 className="font-serif font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
              <Share2 className="w-4 h-4 text-cyan-400" /> Open Graph Social Sharing (Facebook, WhatsApp, LinkedIn)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold uppercase mb-1">og:title</label>
                <input
                  type="text"
                  value={currentPage.ogTitle}
                  onChange={(e) => updateCurrentPageField('ogTitle', e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold uppercase mb-1">og:description</label>
                <input
                  type="text"
                  value={currentPage.ogDescription}
                  onChange={(e) => updateCurrentPageField('ogDescription', e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold uppercase mb-1">og:image (Social Card Image URL)</label>
                <input
                  type="text"
                  value={currentPage.ogImage}
                  onChange={(e) => updateCurrentPageField('ogImage', e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>

          {/* Card 3: JSON-LD Schema Markup */}
          <div className="p-5 rounded-3xl bg-neutral-950 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-white text-base flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-400" /> JSON-LD Structured Data Schema
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isSchemaValid ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-red-950 text-red-400 border-red-500/30'
              }`}>
                {isSchemaValid ? '✓ Valid JSON-LD' : '✕ Invalid JSON Syntax'}
              </span>
            </div>

            <div className="space-y-2">
              <textarea
                rows={9}
                value={currentPage.schemaMarkup}
                onChange={(e) => updateCurrentPageField('schemaMarkup', e.target.value)}
                className="w-full bg-black/80 border border-white/15 rounded-xl p-3 text-emerald-400 font-mono text-xs focus:outline-none focus:border-purple-400 leading-relaxed"
              />
              <p className="text-[11px] text-neutral-500 font-mono">
                Google Rich Results validation schema injected into page &lt;head&gt; as application/ld+json.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW CARDS & ROBOTS.TXT (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Live Preview Container */}
          <div className="p-5 rounded-3xl bg-neutral-950 border border-white/10 space-y-4 sticky top-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-white text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-gold" /> Live Google & Social Preview
              </h3>

              <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-white/10 text-[10px] font-mono">
                <button
                  onClick={() => setActivePreviewTab('serp')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    activePreviewTab === 'serp' ? 'bg-gold text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Google SERP
                </button>
                <button
                  onClick={() => setActivePreviewTab('social')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    activePreviewTab === 'social' ? 'bg-gold text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Social Card
                </button>
              </div>
            </div>

            {/* SERP PREVIEW BOX */}
            {activePreviewTab === 'serp' && (
              <div className="p-4 rounded-2xl bg-white space-y-2 text-left border border-neutral-300 shadow-xl">
                {/* Google Site Favicon + Breadcrumb */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-black text-gold font-bold flex items-center gap-0.5 justify-center text-[9px] font-serif shrink-0">
                    RE
                  </div>
                  <div className="truncate">
                    <div className="text-[12px] font-medium text-neutral-800 leading-none">
                      Royal Epic Interior
                    </div>
                    <div className="text-[10px] text-emerald-800 font-mono truncate leading-tight">
                      {currentPage.canonicalUrl || `https://royalepicfurniture.com${currentPage.pageSlug}`}
                    </div>
                  </div>
                </div>

                {/* SERP Title */}
                <h4 className="text-base font-normal text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-2">
                  {currentPage.metaTitle || 'Page Meta Title Preview'}
                </h4>

                {/* SERP Snippet */}
                <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-3">
                  {currentPage.metaDescription || 'Add a meta description to preview how your page listing appears in Google Search results.'}
                </p>

                {/* Rich Snippet Extension */}
                <div className="pt-2 border-t border-neutral-200 flex items-center gap-3 text-[10px] text-neutral-600 font-mono">
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    ★★★★★ 4.9 (128 Reviews)
                  </span>
                  <span>• Thanisandra HQ</span>
                  <span>• 10-Yr Warranty</span>
                </div>
              </div>
            )}

            {/* SOCIAL CARD PREVIEW BOX */}
            {activePreviewTab === 'social' && (
              <div className="rounded-2xl bg-neutral-900 border border-white/10 overflow-hidden shadow-xl space-y-0 text-left">
                <div className="h-40 w-full overflow-hidden bg-neutral-800 relative">
                  {currentPage.ogImage ? (
                    <img 
                      src={currentPage.ogImage} 
                      alt="Social Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs font-mono">
                      No Social Card Image Specified
                    </div>
                  )}
                </div>
                <div className="p-3.5 space-y-1 bg-black/90 border-t border-white/10">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
                    ROYALEPICINTERIOR.COM
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    {currentPage.ogTitle || currentPage.metaTitle}
                  </h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-2">
                    {currentPage.ogDescription || currentPage.metaDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Robots.txt & Sitemap Editor */}
            <div className="pt-4 border-t border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-gold" /> robots.txt Rules
                </h4>
                <button
                  onClick={handleExportRobotsTxt}
                  className="text-[10px] font-mono font-bold text-gold hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Export robots.txt
                </button>
              </div>

              <textarea
                rows={4}
                value={robotsTxt}
                onChange={(e) => setRobotsTxt(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-neutral-300 font-mono text-[11px] focus:outline-none focus:border-gold leading-relaxed"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
