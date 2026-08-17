import fs from 'fs';
import path from 'path';

// Load SEO_PAGES from the TypeScript source file dynamically
import { SEO_PAGES } from '../src/data/seoPages.ts';

const DOMAIN = 'https://royalepicfurniture.com';

const COMMON_ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "name": "Royal Epic Interior & Furniture",
  "image": `${DOMAIN}/logo.png`,
  "@id": `${DOMAIN}/#organization`,
  "url": DOMAIN,
  "telephone": "+91-9916633338",
  "priceRange": "₹₹₹",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra",
    "addressLocality": "Bengaluru",
    "addressRegion": "Karnataka",
    "postalCode": "560077",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 13.0612,
    "longitude": 77.6254
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "09:30",
    "closes": "20:00"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "320"
  }
};

// Helper to generate keywords based on slug & category
function generateKeywords(slug: string, title: string, category: string): string[] {
  const cleanSlug = slug.replace('/', '').replaceAll('-', ' ');
  const keywordsSet = new Set<string>();

  keywordsSet.add(cleanSlug);
  keywordsSet.add(`${cleanSlug} bangalore`);
  keywordsSet.add(`royal epic ${cleanSlug}`);

  if (category === 'service') {
    keywordsSet.add(`best ${cleanSlug}`);
    keywordsSet.add(`turnkey ${cleanSlug}`);
    keywordsSet.add(`factory modular ${cleanSlug}`);
    keywordsSet.add(`interior designers thanisandra`);
  } else if (category === 'location') {
    keywordsSet.add(`interior designers in ${cleanSlug.replace('interior designer ', '')}`);
    keywordsSet.add(`turnkey interiors ${cleanSlug.replace('interior designer ', '')}`);
    keywordsSet.add(`modular kitchen ${cleanSlug.replace('interior designer ', '')}`);
    keywordsSet.add(`2bhk 3bhk interiors ${cleanSlug.replace('interior designer ', '')}`);
  } else if (category === 'blog') {
    keywordsSet.add(`${cleanSlug} 2026`);
    keywordsSet.add(`${cleanSlug} price guide`);
    keywordsSet.add(`home interior budget bangalore`);
  } else {
    keywordsSet.add(`interior designers bangalore`);
    keywordsSet.add(`turnkey interior contractors`);
    keywordsSet.add(`modular furniture factory thanisandra`);
  }

  return Array.from(keywordsSet);
}

// Helper to generate schema based on category and page data
function buildStructuredSchema(slug: string, page: any) {
  const pageUrl = `${DOMAIN}${slug === '/' ? '' : slug}`;

  if (slug === '/') {
    return COMMON_ORGANIZATION_SCHEMA;
  }

  if (slug === '/about-us') {
    return {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": page.title,
      "description": page.metaDescription,
      "url": pageUrl,
      "mainEntity": {
        ...COMMON_ORGANIZATION_SCHEMA,
        "description": "Royal Epic Interior & Furniture operates a 10,000 sq.ft wood manufacturing plant in Thanisandra, Bengaluru, delivering turnkey interiors with a 15-year warranty."
      }
    };
  }

  if (slug === '/contact-us') {
    return {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": page.title,
      "description": page.metaDescription,
      "url": pageUrl,
      "mainEntity": COMMON_ORGANIZATION_SCHEMA
    };
  }

  if (slug === '/portfolio' || slug === '/completed-projects') {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": page.title,
      "description": page.metaDescription,
      "url": pageUrl,
      "publisher": COMMON_ORGANIZATION_SCHEMA
    };
  }

  if (slug === '/our-services') {
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Turnkey Interior Design & Manufacturing Services",
      "serviceType": "Interior Architecture & Manufacturing",
      "description": page.metaDescription,
      "provider": COMMON_ORGANIZATION_SCHEMA,
      "areaServed": {
        "@type": "City",
        "name": "Bengaluru"
      }
    };
  }

  if (slug === '/get-free-quote') {
    return {
      "@context": "https://schema.org",
      "@type": "Offer",
      "name": "Free Turnkey Interior Design BOQ Consultation & Estimate",
      "description": page.metaDescription,
      "price": "0",
      "priceCurrency": "INR",
      "offeredBy": COMMON_ORGANIZATION_SCHEMA,
      "url": pageUrl
    };
  }

  if (slug === '/customer-reviews') {
    return {
      "@context": "https://schema.org",
      "@type": "ItemPage",
      "name": page.title,
      "description": page.metaDescription,
      "url": pageUrl,
      "mainEntity": COMMON_ORGANIZATION_SCHEMA
    };
  }

  if (slug === '/faq') {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": page.faqs.map((f: any) => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    };
  }

  if (slug === '/blog') {
    return {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Royal Epic Interior & Cost Guide Journal",
      "description": page.metaDescription,
      "url": pageUrl,
      "publisher": COMMON_ORGANIZATION_SCHEMA
    };
  }

  if (page.category === 'service') {
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": page.h1,
      "serviceType": page.title,
      "description": page.metaDescription,
      "url": pageUrl,
      "image": page.heroImage,
      "provider": COMMON_ORGANIZATION_SCHEMA,
      "areaServed": {
        "@type": "City",
        "name": "Bengaluru",
        "containedInPlace": {
          "@type": "State",
          "name": "Karnataka"
        }
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": page.h1,
        "itemListElement": (page.contentSections || []).map((s: any) => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": s.title,
            "description": s.description
          }
        }))
      }
    };
  }

  if (page.category === 'location') {
    const localityName = page.breadcrumbs[page.breadcrumbs.length - 1]?.name || 'Bengaluru';
    return {
      "@context": "https://schema.org",
      "@type": "HomeAndConstructionBusiness",
      "name": `Royal Epic Interior Designer - ${localityName}`,
      "description": page.metaDescription,
      "image": page.heroImage,
      "url": pageUrl,
      "telephone": "+91-9916633338",
      "priceRange": "₹₹₹",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": `${localityName} Main Road`,
        "addressLocality": `${localityName}, Bengaluru`,
        "addressRegion": "Karnataka",
        "postalCode": "560077",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 13.0612,
        "longitude": 77.6254
      },
      "parentOrganization": COMMON_ORGANIZATION_SCHEMA,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "320"
      }
    };
  }

  if (page.category === 'blog') {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": page.h1,
      "description": page.metaDescription,
      "image": page.heroImage,
      "url": pageUrl,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": pageUrl
      },
      "author": {
        "@type": "Organization",
        "name": "Royal Epic Senior Design Team",
        "url": `${DOMAIN}/about-us`
      },
      "publisher": COMMON_ORGANIZATION_SCHEMA,
      "datePublished": "2026-01-15T08:00:00+05:30",
      "dateModified": "2026-08-05T08:00:00+05:30"
    };
  }

  return COMMON_ORGANIZATION_SCHEMA;
}

// Process all SEO_PAGES entries
const enrichedPages: Record<string, any> = {};

for (const [slug, page] of Object.entries(SEO_PAGES)) {
  const p = { ...page };

  // Enrich keywords if missing or short
  p.keywords = generateKeywords(slug, p.title, p.category);

  // Enrich OpenGraph metadata
  p.openGraph = {
    title: p.title,
    description: p.metaDescription,
    image: p.heroImage,
    type: p.category === 'blog' ? 'article' : 'website'
  };

  // Build full rich structured schema
  p.schema = buildStructuredSchema(slug, p);

  enrichedPages[slug] = p;
}

// Write the updated file
const fileHeader = `export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ContentSection {
  title: string;
  description: string;
  highlights?: string[];
}

export interface RelatedLink {
  title: string;
  url: string;
  category: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface SeoPageData {
  slug: string;
  title: string;
  metaDescription: string;
  keywords?: string[];
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
  };
  h1: string;
  subtitle: string;
  category: 'main' | 'service' | 'location' | 'blog';
  heroImage: string;
  breadcrumbs: BreadcrumbItem[];
  schema: Record<string, any>;
  faqs: FAQItem[];
  contentSections: ContentSection[];
  relatedLinks: RelatedLink[];
  stats?: { label: string; value: string }[];
}

const COMMON_ORGANIZATION_SCHEMA = ${JSON.stringify(COMMON_ORGANIZATION_SCHEMA, null, 2)};

const COMMON_SERVICES_LINKS: RelatedLink[] = [
  { title: "Modular Kitchen Bangalore", url: "/modular-kitchen-bangalore", category: "Services" },
  { title: "Turnkey Interior Contractors", url: "/turnkey-interior-contractors-bangalore", category: "Services" },
  { title: "Modular Wardrobe Design", url: "/modular-wardrobe-bangalore", category: "Services" },
  { title: "Luxury Home Interiors", url: "/luxury-home-interiors-bangalore", category: "Services" },
  { title: "Custom Furniture Manufacturer", url: "/custom-furniture-manufacturer", category: "Services" },
  { title: "Living Room Interior Design", url: "/living-room-interior-design", category: "Services" },
  { title: "False Ceiling Design", url: "/false-ceiling-design", category: "Services" },
  { title: "Office Interior Design", url: "/office-interior-design-bangalore", category: "Services" }
];

const COMMON_LOCATION_LINKS: RelatedLink[] = [
  { title: "Interior Designer Whitefield", url: "/interior-designer-whitefield", category: "Locations" },
  { title: "Interior Designer HSR Layout", url: "/interior-designer-hsr-layout", category: "Locations" },
  { title: "Interior Designer Koramangala", url: "/interior-designer-koramangala", category: "Locations" },
  { title: "Interior Designer Indiranagar", url: "/interior-designer-indiranagar", category: "Locations" },
  { title: "Interior Designer Thanisandra", url: "/interior-designer-thanisandra", category: "Locations" },
  { title: "Interior Designer Electronic City", url: "/interior-designer-electronic-city", category: "Locations" }
];

const COMMON_BLOG_LINKS: RelatedLink[] = [
  { title: "Home Interior Cost Bangalore", url: "/home-interior-cost-bangalore", category: "Guides" },
  { title: "Modular Kitchen Cost Guide", url: "/modular-kitchen-cost-bangalore", category: "Guides" },
  { title: "2BHK Interior Cost Breakdown", url: "/2bhk-interior-cost-bangalore", category: "Guides" },
  { title: "3BHK Interior Cost Breakdown", url: "/3bhk-interior-cost-bangalore", category: "Guides" },
  { title: "Villa Interior Design Guide", url: "/villa-interior-design-guide", category: "Guides" }
];

export const SEO_PAGES: Record<string, SeoPageData> = ${JSON.stringify(enrichedPages, null, 2)};
`;

const outputPath = path.resolve('src/data/seoPages.ts');
fs.writeFileSync(outputPath, fileHeader, 'utf-8');
console.log(`✅ SEO_PAGES configuration in ${outputPath} updated with structured metadata for ${Object.keys(enrichedPages).length} pages.`);
