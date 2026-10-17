import { Product } from '../types';

export type PriceType = 'fixed' | 'per_sq_ft';

/**
 * Returns the price type for a product, defaulting to 'fixed' for backward compatibility.
 */
export function getProductPriceType(product?: { priceType?: string; specifications?: any } | null): PriceType {
  if (!product) return 'fixed';
  const raw = product.priceType || product.specifications?.priceType || product.specifications?.price_type;
  if (raw === 'per_sq_ft' || raw === 'per_sqft' || raw === 'sqft') {
    return 'per_sq_ft';
  }
  return 'fixed';
}

/**
 * Formats a product price with the Indian Rupee symbol and applies the appropriate price type unit.
 * 
 * Option A — Fixed Price (Whole Product):
 *   Example: ₹50,000
 *   Do not display "per sq. ft." for this price type.
 * 
 * Option B — Price per Square Foot:
 *   Example: ₹500 / sq. ft.
 */
export function formatProductPrice(
  price: number | undefined | null,
  productOrType?: { priceType?: string; specifications?: any } | string | null
): string {
  const numeric = Math.round(Number(price) || 0);
  const formatted = `₹${numeric.toLocaleString('en-IN')}`;
  
  const priceType = typeof productOrType === 'string'
    ? (productOrType === 'per_sq_ft' || productOrType === 'per_sqft' ? 'per_sq_ft' : 'fixed')
    : getProductPriceType(productOrType);

  if (priceType === 'per_sq_ft') {
    return `${formatted} / sq. ft.`;
  }
  return formatted;
}

/**
 * Formats the savings amount with the appropriate price type unit.
 */
export function formatProductSavings(
  savings: number | undefined | null,
  productOrType?: { priceType?: string; specifications?: any } | string | null
): string {
  const numeric = Math.round(Number(savings) || 0);
  const formatted = `Save ₹${numeric.toLocaleString('en-IN')}`;
  
  const priceType = typeof productOrType === 'string'
    ? (productOrType === 'per_sq_ft' || productOrType === 'per_sqft' ? 'per_sq_ft' : 'fixed')
    : getProductPriceType(productOrType);

  if (priceType === 'per_sq_ft') {
    return `${formatted} / sq. ft.`;
  }
  return formatted;
}
