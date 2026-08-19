import { CartItem, Product, ProductVariation, DbCartItem } from '../types';
import { PRODUCTS_DATA } from '../data/mockData';

// Helper to map DB cart item to frontend CartItem
export const mapDbItemToCartItem = (dbItem: any): CartItem => {
  const existingProduct = PRODUCTS_DATA.find((p) => p.id === dbItem.product_id);

  let product: Product;
  if (existingProduct) {
    product = {
      ...existingProduct,
      price: dbItem.unit_price || existingProduct.price,
    };
  } else {
    product = {
      id: dbItem.product_id,
      name: dbItem.product_name_snapshot || 'Royal Epic Furniture Item',
      category: 'Luxury Furniture',
      categorySlug: 'furniture',
      price: Number(dbItem.unit_price) || 0,
      originalPrice: Math.round((Number(dbItem.unit_price) || 0) * 1.25),
      discount: 20,
      rating: 4.9,
      reviewsCount: 15,
      image: dbItem.product_image_snapshot || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      galleryImages: [dbItem.product_image_snapshot || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'],
      description: 'Factory handcrafted piece by Royal Epic Interior & Furniture.',
      specifications: {
        material: 'Premium Marine Plywood / Solid Teak',
        size: 'Custom Architectural Size',
        finish: 'Italian PU Polish',
        warranty: '15 Years Factory Warranty',
        brand: 'Royal Epic Interior',
        origin: 'Bengaluru Factory'
      },
      features: ['100% Termite Resistant', 'German Soft-Close Hardware', 'Factory Direct Pricing'],
      inStock: true
    };
  }

  let selectedVariation: ProductVariation | undefined = undefined;
  if (dbItem.selected_variation) {
    selectedVariation = typeof dbItem.selected_variation === 'string' 
      ? JSON.parse(dbItem.selected_variation) 
      : dbItem.selected_variation;
  } else if (dbItem.variation_id && product.variations) {
    selectedVariation = product.variations.find(v => v.id === dbItem.variation_id);
  }

  let selectedAttributes: Record<string, string> | undefined = undefined;
  if (dbItem.selected_attributes) {
    selectedAttributes = typeof dbItem.selected_attributes === 'string'
      ? JSON.parse(dbItem.selected_attributes)
      : dbItem.selected_attributes;
  }

  return {
    id: dbItem.id,
    cartId: dbItem.cart_id,
    product,
    quantity: Math.max(1, Number(dbItem.quantity) || 1),
    selectedVariation,
    selectedAttributes,
    selectedColor: selectedAttributes?.Color || selectedAttributes?.['Wood Finish'] || undefined,
    customSize: selectedAttributes?.Size || selectedAttributes?.Dimensions || undefined,
    unitPrice: Number(dbItem.unit_price) || selectedVariation?.price || product.price,
  };
};

/**
 * Fetch authenticated user's cart from database
 */
export async function fetchDbCart(userId: string): Promise<CartItem[]> {
  if (!userId) return [];
  try {
    const res = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, {
      headers: {
        'x-user-id': userId
      }
    });
    if (!res.ok) {
      console.warn('Failed to fetch cart from server DB:', res.status);
      return [];
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.items)) {
      return data.items.map(mapDbItemToCartItem);
    }
    return [];
  } catch (err) {
    console.warn('fetchDbCart network error:', err);
    return [];
  }
}

/**
 * Add or update item in user's database cart
 */
export async function addToDbCart(
  userId: string,
  product: Product,
  quantity = 1,
  variation?: ProductVariation,
  selectedAttributes?: Record<string, string>
): Promise<CartItem[]> {
  if (!userId) return [];
  try {
    const unitPrice = variation ? variation.price : product.price;
    const payload = {
      userId,
      productId: product.id,
      variationId: variation?.id || null,
      quantity,
      unitPrice,
      productNameSnapshot: product.name,
      productImageSnapshot: variation?.image || product.image,
      selectedAttributes: selectedAttributes || {},
      selectedVariation: variation || null
    };

    const res = await fetch('/api/cart/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to save item to cart: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.items)) {
      return data.items.map(mapDbItemToCartItem);
    }
    return [];
  } catch (err) {
    console.error('addToDbCart error:', err);
    throw err;
  }
}

/**
 * Update quantity in user's database cart
 */
export async function updateDbCartQuantity(
  userId: string,
  productId: string,
  quantity: number,
  variationId?: string,
  itemId?: string
): Promise<CartItem[]> {
  if (!userId) return [];
  try {
    const res = await fetch('/api/cart/items', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        userId,
        itemId,
        productId,
        variationId,
        quantity
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to update quantity: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.items)) {
      return data.items.map(mapDbItemToCartItem);
    }
    return [];
  } catch (err) {
    console.error('updateDbCartQuantity error:', err);
    throw err;
  }
}

/**
 * Remove an item from user's database cart
 */
export async function removeDbCartItem(
  userId: string,
  productId: string,
  variationId?: string,
  itemId?: string
): Promise<CartItem[]> {
  if (!userId) return [];
  try {
    const res = await fetch('/api/cart/items', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        userId,
        itemId,
        productId,
        variationId
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to remove item: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.items)) {
      return data.items.map(mapDbItemToCartItem);
    }
    return [];
  } catch (err) {
    console.error('removeDbCartItem error:', err);
    throw err;
  }
}

/**
 * Merge guest items into authenticated user's database cart
 */
export async function mergeGuestCartToDb(
  userId: string,
  guestItems: CartItem[]
): Promise<CartItem[]> {
  if (!userId || !guestItems.length) {
    return fetchDbCart(userId);
  }

  try {
    const formattedGuestItems = guestItems.map((item) => ({
      productId: item.product.id,
      variationId: item.selectedVariation?.id || null,
      quantity: item.quantity,
      unitPrice: item.selectedVariation?.price || item.product.price,
      productNameSnapshot: item.product.name,
      productImageSnapshot: item.selectedVariation?.image || item.product.image,
      selectedAttributes: item.selectedAttributes || {},
      selectedVariation: item.selectedVariation || null,
    }));

    const res = await fetch('/api/cart/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        userId,
        guestItems: formattedGuestItems
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to merge guest cart: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.items)) {
      return data.items.map(mapDbItemToCartItem);
    }
    return fetchDbCart(userId);
  } catch (err) {
    console.error('mergeGuestCartToDb error:', err);
    return fetchDbCart(userId);
  }
}

/**
 * Clear user's database cart after successful checkout
 */
export async function clearDbCart(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const res = await fetch('/api/cart/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ userId })
    });
    return res.ok;
  } catch (err) {
    console.error('clearDbCart error:', err);
    return false;
  }
}
