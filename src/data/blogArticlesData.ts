import { BlogPost } from '../types';
import { BLOG_ARTICLES_PART_1 } from './blogArticlesPart1';
import { BLOG_ARTICLES_PART2 } from './blogArticlesPart2';
import { BLOG_POSTS as LEGACY_BLOG_POSTS } from './mockData';

export const NEW_SEO_BLOG_ARTICLES: BlogPost[] = [
  ...BLOG_ARTICLES_PART_1,
  ...BLOG_ARTICLES_PART2,
];

export const BLOG_CATEGORIES: string[] = [
  'All Articles',
  'Home Planning',
  'Modular Kitchens',
  'Materials & Finishes',
  'Cost & Budget Guides',
  'Storage & Furniture',
  'Lighting & False Ceilings',
  'Maintenance & Care',
  'Office & Commercial Interiors',
];

/**
 * Computes the complete plain-text representation of an article (including title,
 * introduction, sections, sub-sections, bullets, tables, checklists, conclusions, and FAQs).
 */
export function computeArticlePlainText(post: BlogPost): string {
  const parts: string[] = [post.title, post.excerpt, post.content];

  if (post.sections) {
    for (const sec of post.sections) {
      parts.push(sec.heading);
      if (sec.paragraphs) parts.push(...sec.paragraphs);
      if (sec.bullets) parts.push(...sec.bullets);
      if (sec.checklistItems) parts.push(...sec.checklistItems);
      if (sec.checklist) {
        parts.push(sec.checklist.title);
        if (sec.checklist.subtitle) parts.push(sec.checklist.subtitle);
        parts.push(...sec.checklist.items);
      }
      if (sec.callout) {
        parts.push(sec.callout.title, sec.callout.text);
      }
      if (sec.subSections) {
        for (const sub of sec.subSections) {
          parts.push(sub.heading);
          if (sub.paragraphs) parts.push(...sub.paragraphs);
          if (sub.bullets) parts.push(...sub.bullets);
        }
      }
      if (sec.table) {
        if (sec.table.caption) parts.push(sec.table.caption);
        parts.push(...sec.table.headers);
        for (const row of sec.table.rows) {
          parts.push(...row);
        }
        if (sec.table.note) parts.push(sec.table.note);
        if (sec.table.footnote) parts.push(sec.table.footnote);
      }
      if (sec.inlineImage?.caption) {
        parts.push(sec.inlineImage.caption);
      }
    }
  }

  if (post.conclusion) {
    if (Array.isArray(post.conclusion)) {
      parts.push(...post.conclusion);
    } else {
      parts.push(post.conclusion.heading, ...post.conclusion.paragraphs);
    }
  }

  if (post.faqs) {
    for (const faq of post.faqs) {
      parts.push(faq.question, faq.answer);
    }
  }

  return parts.filter(Boolean).join(' ');
}

export function computeArticleWordCount(post: BlogPost): number {
  const text = computeArticlePlainText(post);
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Enrich the 7 legacy blog posts so they also work seamlessly on `/blog/:slug`
 * and inside the new category filter system without losing any original fields.
 */
const CATEGORY_MAP_FOR_LEGACY: Record<string, string> = {
  'Turnkey Execution': 'Home Planning',
  'Turnkey Architecture': 'Home Planning',
  'Modular Kitchens': 'Modular Kitchens',
  'Residential Design': 'Home Planning',
  'Residential Interior': 'Home Planning',
  'Commercial Interiors': 'Office & Commercial Interiors',
  'Commercial Office': 'Office & Commercial Interiors',
  'Hospitality Design': 'Office & Commercial Interiors',
  'Hospitality & Dining': 'Office & Commercial Interiors',
  'Design Trends': 'Materials & Finishes',
  'Architectural Woodwork': 'Materials & Finishes',
  'Wellness & Retail': 'Office & Commercial Interiors',
  'Wellness & Spa': 'Office & Commercial Interiors',
};

const LEGACY_INLINE_IMAGES: Record<string, { src: string; alt: string; caption: string }> = {
  'turnkey-interior-projects-guide': {
    src: '/images/blog/project-timeline-turnkey-inline.jpg',
    alt: 'Open-plan turnkey apartment living, dining and modular kitchen execution',
    caption: 'Coordinated turnkey execution integrates ceiling lighting, wall panelling, dining furniture, and modular kitchen cabinetry under a single timeline.',
  },
  'modular-kitchen-cost-bangalore': {
    src: '/images/blog/kitchen-moisture-protection-featured.jpg',
    alt: 'Modular kitchen island with quartz countertop, brass sink faucet and precision cabinetry',
    caption: 'High-density moisture-resistant carcasses paired with non-porous quartz countertops and soft-close tandem hardware ensure long-term durability.',
  },
  'home-interior-decorating-guide': {
    src: '/images/blog/interior-boq-joinery-inline.jpg',
    alt: 'Custom dining room wooden sideboard cabinet, round mirror and emerald dining chairs',
    caption: 'Layering natural timber cabinetry, warm brass pendant lighting, and tactile upholstery creates timeless residential harmony.',
  },
  'corporate-office-workspace-planning': {
    src: '/images/blog/bengaluru-apartment-wfh-inline.jpg',
    alt: 'Ergonomic workspace desk overlooking urban high-rise skyline',
    caption: 'Acoustic zoning, glare-free daylight orientation, and concealed cable management support high-focus commercial and hybrid workspaces.',
  },
  'restaurant-interior-design-trends': {
    src: '/images/blog/legacy-spatial-curation.jpg',
    alt: 'Curated hospitality dining setting with velvet seating and warm pendant illumination',
    caption: 'Thoughtful table spacing, acoustic ceiling treatments, and warm ambient lighting elevate the fine-dining guest experience.',
  },
  'interior-design-trends-2026': {
    src: '/images/blog/shutter-finishes-textures-inline.png',
    alt: 'Architectural surface finishes and textures for modern doors and cabinetry',
    caption: 'Selecting moisture-impervious WPC and seasoned hardwood finishes tailored to each doorway threshold ensures decades of structural stability.',
  },
  'beauty-spa-interior-design': {
    src: '/images/blog/wet-zone-vanity-cabinet-inline.jpg',
    alt: 'Moisture-resistant vanity counter with quartz top and warm wood-framed mirror',
    caption: 'Non-porous quartz vanity tops and moisture-sealed millwork maintain hygiene and serenity in wellness and salon treatment rooms.',
  },
};

export const ENRICHED_LEGACY_BLOG_POSTS: BlogPost[] = LEGACY_BLOG_POSTS.map((post) => {
  const mappedCategory = CATEGORY_MAP_FOR_LEGACY[post.category] || post.category;
  const paragraphs = post.content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    ...post,
    category: mappedCategory,
    seoTitle: `${post.title} | Royal Epic Interiors`,
    metaDescription: post.excerpt,
    datePublishedIso: '2026-07-15',
    dateModifiedIso: '2026-11-26',
    imageAlt: `${post.title} - Royal Epic Interiors Bengaluru`,
    imageCaption: `${post.title} — architectural insights by Royal Epic Interiors.`,
    sections:
      post.sections && post.sections.length > 0
        ? post.sections
        : [
            {
              id: 'architectural-overview',
              heading: 'Architectural Overview & Planning Approach',
              paragraphs: paragraphs.slice(0, 2),
            },
            {
              id: 'materiality-and-execution-standards',
              heading: 'Materiality, Ergonomics & Execution Standards',
              paragraphs: paragraphs.slice(2),
              bullets: [
                'Precision factory manufacturing with calibrated substrates and zero-joint edge banding.',
                'Dedicated turnkey site supervision ensuring timeline and quality compliance.',
                'Backed by Royal Epic Interiors 15-Year Warranty across residential and commercial commissions.',
              ],
              inlineImage: LEGACY_INLINE_IMAGES[post.slug],
            },
          ],
    conclusion: [
      'Every successful interior project balances architectural proportion, durable material engineering, and disciplined turnkey project management.',
      'Speak with the design team at Royal Epic Interiors in Bengaluru to tailor these principles to your upcoming home or commercial space.',
    ],
    relatedArticleSlugs: [
      '2bhk-3bhk-home-interior-planning-checklist',
      'plywood-vs-mdf-vs-hdhmr-vs-particle-board',
      'how-to-read-interior-design-quotation',
    ],
    relatedServiceLinks: [
      {
        label: 'Turnkey Interior Projects',
        href: '/turnkey-interior-projects',
        description: 'End-to-end residential and commercial interior execution in Bengaluru.',
      },
      {
        label: 'Modular Kitchens',
        href: '/modular-kitchens',
        description: 'Bespoke German-engineered modular kitchen systems.',
      },
      {
        label: 'Custom Furniture & Wardrobes',
        href: '/custom-furniture-and-wardrobes',
        description: 'Precision-crafted wardrobes, consoles, and storage solutions.',
      },
    ],
  };
});

export const ALL_BLOG_POSTS: BlogPost[] = [
  ...NEW_SEO_BLOG_ARTICLES,
  ...ENRICHED_LEGACY_BLOG_POSTS,
];

export function findBlogPostBySlug(slug: string): BlogPost | undefined {
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '').replace(/^blog\//, '');
  return ALL_BLOG_POSTS.find((post) => post.slug === cleanSlug);
}
