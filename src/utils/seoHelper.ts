import { Product } from '../types';
import { getProductSlug, getCategorySlug } from './productSlug';

export const BASE_PRODUCTION_DOMAIN = 'https://royalepicinterior.com';

export function updatePageHead(options: {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  type?: string;
  keywords?: string[];
  schemas?: object[];
}) {
  const {
    title,
    description,
    canonicalPath,
    image = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    type = 'website',
    keywords = [],
    schemas = []
  } = options;

  if (typeof document === 'undefined') return;

  // 1. Title
  document.title = title;

  // 2. Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);

  // 2b. Meta Keywords
  if (keywords.length > 0) {
    let metaKw = document.querySelector('meta[name="keywords"]');
    if (!metaKw) {
      metaKw = document.createElement('meta');
      metaKw.setAttribute('name', 'keywords');
      document.head.appendChild(metaKw);
    }
    metaKw.setAttribute('content', keywords.join(', '));
  }

  // 3. Canonical Tag
  const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = `${BASE_PRODUCTION_DOMAIN}${cleanPath === '/' ? '' : cleanPath}`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);

  // 4. OpenGraph and Twitter Meta Tags
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

  setMetaTag('og:title', title);
  setMetaTag('og:description', description);
  setMetaTag('og:image', image);
  setMetaTag('og:url', canonicalUrl);
  setMetaTag('og:type', type);
  setMetaTag('og:site_name', 'Royal Epic Interior & Furniture');
  setMetaTag('og:locale', 'en_IN');

  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', title);
  setMetaTag('twitter:description', description);
  setMetaTag('twitter:image', image);

  // 5. Schema.org JSON-LD Script
  let schemaScript = document.getElementById('dynamic-page-schema');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'dynamic-page-schema';
    schemaScript.setAttribute('type', 'application/ld+json');
    document.head.appendChild(schemaScript);
  }

  if (schemas.length > 0) {
    schemaScript.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
  } else {
    schemaScript.textContent = '';
  }
}

export function updateProductSeo(product: Product) {
  const slug = getProductSlug(product);
  const catSlug = getCategorySlug(product.category);
  const title = `${product.name} | Royal Epic Interior`;
  const description = product.shortDescription || 
    `${product.name} by Royal Epic Interior. Material: ${product.specifications?.material || product.material || 'Premium'}. Warranty: ${product.specifications?.warranty || 'Factory Guaranteed'}. Factory direct pricing in Bengaluru.`;
  const canonicalPath = `/products/${slug}`;
  const images = product.galleryImages && product.galleryImages.length > 0 
    ? product.galleryImages 
    : [product.image];

  // Schema.org Product Schema
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${BASE_PRODUCTION_DOMAIN}/products/${slug}#product`,
    'name': product.name,
    'image': images,
    'description': product.description || description,
    'sku': product.sku || product.id,
    'category': product.category,
    'material': product.specifications?.material || product.material || undefined,
    'brand': {
      '@type': 'Brand',
      'name': product.specifications?.brand || 'Royal Epic Interior'
    },
    'manufacturer': {
      '@type': 'Organization',
      'name': 'Royal Epic Interior & Furniture',
      'url': BASE_PRODUCTION_DOMAIN
    },
    'offers': {
      '@type': 'Offer',
      'url': `${BASE_PRODUCTION_DOMAIN}/products/${slug}`,
      'priceCurrency': 'INR',
      'price': product.price,
      'priceValidUntil': '2027-12-31',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'seller': {
        '@type': 'Organization',
        'name': 'Royal Epic Interior & Furniture',
        'url': BASE_PRODUCTION_DOMAIN
      }
    }
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': `${BASE_PRODUCTION_DOMAIN}/`
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Products',
        'item': `${BASE_PRODUCTION_DOMAIN}/products`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': product.category,
        'item': `${BASE_PRODUCTION_DOMAIN}/products/${catSlug}`
      },
      {
        '@type': 'ListItem',
        'position': 4,
        'name': product.name,
        'item': `${BASE_PRODUCTION_DOMAIN}/products/${slug}`
      }
    ]
  };

  updatePageHead({
    title,
    description,
    canonicalPath,
    image: product.image,
    type: 'product',
    keywords: [
      product.name,
      product.category,
      'Royal Epic Interior',
      'Bengaluru Furniture Factory',
      'Custom Interior Furniture'
    ],
    schemas: [productSchema, breadcrumbSchema]
  });
}

export function updateCategorySeo(categoryName: string, categorySlug: string) {
  const title = `${categoryName} - Factory Crafted & Custom Designs | Royal Epic`;
  const description = `Browse luxury custom ${categoryName} designed and factory manufactured in Bengaluru by Royal Epic Interior. 15-year warranty, premium materials & turnkey installation.`;
  const canonicalPath = `/products/${categorySlug}`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': `${BASE_PRODUCTION_DOMAIN}/`
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Products',
        'item': `${BASE_PRODUCTION_DOMAIN}/products`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': categoryName,
        'item': `${BASE_PRODUCTION_DOMAIN}/products/${categorySlug}`
      }
    ]
  };

  updatePageHead({
    title,
    description,
    canonicalPath,
    schemas: [breadcrumbSchema]
  });
}
