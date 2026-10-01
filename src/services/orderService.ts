import { getSupabase } from '../lib/supabase';
import { OrderTimelineStep } from '../types';

export const ORDER_STAGES = [
  'Order Placed',
  'Payment Confirmed',
  'Processing',
  'Quality Check',
  'Packed',
  'Dispatched',
  'Out for Delivery',
  'Delivered'
] as const;

export interface TimelineEntry {
  status: string;
  timestamp: string;
  date?: string;
  time?: string;
  remarks?: string;
}

export interface OrderItem {
  product: {
    id: string;
    name: string;
    image: string;
    category?: string;
    price: number;
    sku?: string;
  };
  quantity: number;
  selectedColor?: string;
  customSize?: string;
  selectedVariation?: {
    id?: string;
    sku?: string;
    size?: string;
    color?: string;
    material?: string;
    finish?: string;
    price?: number;
    image?: string;
    customAttributes?: Record<string, string>;
  };
  selectedAttributes?: Record<string, string>;
}

export interface Order {
  id: string;
  user_id: string;
  customer_email?: string;
  customer_name?: string;
  items: OrderItem[];
  total_amount: number;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  status: string;
  payment_status: 'Paid' | 'Pending' | 'Refunded' | 'Failed';
  payment_method?: string;
  delivery_address: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  expected_delivery_date?: string;
  courier_name?: string;
  tracking_number?: string;
  dispatch_date?: string;
  timeline_history?: TimelineEntry[];
  admin_remarks?: Record<string, string>; // stage -> remark
  created_at: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'royal_epic_orders';

export function getOrderTimeline(order: Order): OrderTimelineStep[] {
  const currentStageIndex = ORDER_STAGES.indexOf(order.status as any);
  const effectiveIndex = currentStageIndex >= 0 ? currentStageIndex : 0;
  
  const createdDate = new Date(order.created_at || Date.now());

  return ORDER_STAGES.map((stageName, idx) => {
    const isCompleted = idx < effectiveIndex;
    const isCurrent = idx === effectiveIndex;

    // Look for matching entry in timeline_history
    const historyEntry = (order.timeline_history || []).find(h => h.status.toLowerCase() === stageName.toLowerCase());
    
    // Approximate date/time calculations for historical progression if not explicitly timestamped
    let dateStr = '';
    let timeStr = '';
    
    if (historyEntry?.timestamp) {
      const d = new Date(historyEntry.timestamp);
      dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (idx <= effectiveIndex) {
      const stepDate = new Date(createdDate.getTime() + idx * 86400000 * 0.8);
      dateStr = stepDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      timeStr = stepDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }

    const defaultRemarks: Record<string, string> = {
      'Order Placed': 'Order received and logged into Royal Epic automated manufacturing portal.',
      'Payment Confirmed': 'Payment verified and credited via secure encrypted gateway.',
      'Processing': 'Materials reserved at Thanisandra 10,000 sq.ft factory & cut-list scheduled.',
      'Quality Check': 'Multi-point inspection for woodwork finish, edge-banding & hardware tolerance passed.',
      'Packed': 'Protected with 5-ply shock-resistant corrugated wrap and corner guards.',
      'Dispatched': `Handed over to logistics carrier ${order.courier_name ? `(${order.courier_name})` : ''}.`,
      'Out for Delivery': 'Out for final doorstep installation and white-glove assembly in Bengaluru.',
      'Delivered': 'Product delivered and installed successfully with warranty certificate issued.'
    };

    const customRemark = order.admin_remarks?.[stageName] || historyEntry?.remarks || (isCompleted || isCurrent ? defaultRemarks[stageName] : '');

    return {
      status: stageName,
      date: dateStr,
      time: timeStr,
      remarks: customRemark,
      completed: isCompleted,
      current: isCurrent
    };
  });
}

/**
 * @deprecated LEGACY CLIENT-SIDE ORDER HELPER
 * WARNING: Do NOT use this client-side function for e-commerce orders.
 * The active, secure production payment flow strictly uses:
 *   - POST /api/create-order (server-side price calculation & Razorpay order creation)
 *   - POST /api/verify-payment (cryptographic HMAC SHA256 signature verification)
 *   - POST /api/razorpay/webhook (asynchronous idempotent event confirmation)
 */
export async function createOrder(_orderData: Partial<Order>): Promise<{ success: boolean; data?: Order; error?: string }> {
  console.warn(
    "⚠️ [DEPRECATED] client-side createOrder() is disabled. Orders must be created via POST /api/create-order and verified via POST /api/verify-payment."
  );
  return {
    success: false,
    error: "Client-side order creation is disabled. Use the secure server API (/api/create-order) with Razorpay verification."
  };
}

export async function fetchCustomerOrders(userIdOrEmail: string): Promise<Order[]> {
  try {
    const isEmail = userIdOrEmail.includes('@');
    const param = isEmail ? `customer_email=${encodeURIComponent(userIdOrEmail)}` : `user_id=${encodeURIComponent(userIdOrEmail)}`;
    const res = await fetch(`/api/orders?${param}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.orders) && json.orders.length > 0) {
        return json.orders.map(mapDbOrderToLegacyOrder);
      }
    }
    // Also try the other parameter if first returned no results
    const fallbackParam = isEmail ? `user_id=${encodeURIComponent(userIdOrEmail)}` : `customer_email=${encodeURIComponent(userIdOrEmail)}`;
    const res2 = await fetch(`/api/orders?${fallbackParam}`);
    if (res2.ok) {
      const json2 = await res2.json();
      if (json2.success && Array.isArray(json2.orders) && json2.orders.length > 0) {
        return json2.orders.map(mapDbOrderToLegacyOrder);
      }
    }
  } catch (_) {}

  const supabase = getSupabase();
  let orders: Order[] = [];
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${userIdOrEmail},customer_email.eq.${userIdOrEmail}`)
        .order('created_at', { ascending: false });
        
      if (!error && data && data.length > 0) {
        return (data as any[]).map(mapDbOrderToLegacyOrder);
      }
    } catch (e) {
      console.warn("Failed to fetch orders from supabase", e);
    }
  }

  // Fallback to local storage cache
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const allOrders: any[] = JSON.parse(local);
      orders = allOrders
        .filter((o: any) => 
          o.user_id === userIdOrEmail || 
          (o.customer_email && o.customer_email.toLowerCase() === userIdOrEmail.toLowerCase()) ||
          (o.delivery_address?.email && o.delivery_address.email.toLowerCase() === userIdOrEmail.toLowerCase())
        )
        .map(mapDbOrderToLegacyOrder);
    }
  } catch (e) {}

  return orders;
}

export function mapDbOrderToLegacyOrder(row: any): Order {
  const deliveryAddress = row.shipping_address || row.delivery_address || {};
  return {
    id: row.order_number || row.id,
    user_id: row.user_id || 'guest',
    customer_email: row.customer_email || deliveryAddress.email,
    customer_name: row.customer_name || deliveryAddress.name,
    items: Array.isArray(row.items) ? row.items.map((i: any) => ({
      product: {
        id: i.product_id || i.product?.id || 'prod',
        name: i.product_name || i.product?.name || 'Royal Epic Furniture',
        image: i.product_image || i.product?.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        price: Number(i.unit_price || i.product?.price || 0)
      },
      selectedVariation: i.selected_variation || i.selectedVariation,
      selectedAttributes: i.selected_attributes || i.selectedAttributes,
      quantity: Number(i.quantity || 1)
    })) : [],
    total_amount: Number(row.total_amount || 0),
    subtotal: Number(row.subtotal || row.total_amount || 0),
    discount_amount: Number(row.discount || row.discount_amount || 0),
    tax_amount: Number(row.tax || row.tax_amount || 0),
    status: row.order_status || row.status || 'Order Placed',
    payment_status: row.payment_status === 'PAID' ? 'Paid' : (row.payment_status === 'FAILED' ? 'Failed' : 'Pending'),
    payment_method: row.payments?.[0]?.payment_method || row.payment_method || 'Razorpay Online',
    delivery_address: {
      name: deliveryAddress.name || row.customer_name || '',
      phone: deliveryAddress.phone || row.customer_phone || '',
      email: deliveryAddress.email || row.customer_email || '',
      address: deliveryAddress.address || '',
      city: deliveryAddress.city || 'Bengaluru',
      state: deliveryAddress.state || 'Karnataka',
      pincode: deliveryAddress.pincode || ''
    },
    expected_delivery_date: row.expected_delivery_date,
    courier_name: row.courier_name,
    tracking_number: row.tracking_number,
    timeline_history: row.timeline_history,
    admin_remarks: row.admin_remarks,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  if (!orderId) return null;
  const cleanId = orderId.trim();

  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(cleanId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.order) {
        return mapDbOrderToLegacyOrder(json.order);
      }
    }
  } catch (_) {}

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${cleanId},order_number.eq.${cleanId},tracking_number.eq.${cleanId},razorpay_order_id.eq.${cleanId}`)
        .single();
      if (!error && data) {
        return mapDbOrderToLegacyOrder(data);
      }
    } catch (e) {
      console.warn("fetchOrderById error:", e);
    }
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const allOrders: any[] = JSON.parse(local);
      const found = allOrders.find(
        (o: any) =>
          o.id?.toLowerCase() === cleanId.toLowerCase() ||
          o.order_number?.toLowerCase() === cleanId.toLowerCase() ||
          o.tracking_number?.toLowerCase() === cleanId.toLowerCase()
      );
      if (found) return mapDbOrderToLegacyOrder(found);
    }
  } catch (e) {}

  return null;
}

export async function fetchAllOrders(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.orders)) {
        return json.orders.map(mapDbOrderToLegacyOrder);
      }
    }
  } catch (_) {}

  const supabase = getSupabase();
  
  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return (data as any[]).map(mapDbOrderToLegacyOrder);
      }
    } catch (e) {
      console.warn("Failed to fetch all orders from supabase", e);
    }
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const all: any[] = JSON.parse(local);
      return all.map(mapDbOrderToLegacyOrder);
    }
  } catch (e) {}

  return [];
}

export async function updateOrderStatus(
  orderId: string, 
  updates: Partial<Order> & { stage_remark?: string }
): Promise<boolean> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  
  // Find existing order to append timeline
  const localOrdersStr = localStorage.getItem(LOCAL_STORAGE_KEY) || '[]';
  let existingOrder: Order | null = null;
  try {
    const all = JSON.parse(localOrdersStr);
    existingOrder = all.find((o: any) => o.id === orderId) || null;
  } catch {}

  const newTimeline = existingOrder?.timeline_history ? [...existingOrder.timeline_history] : [];
  if (updates.status && (!newTimeline.length || newTimeline[newTimeline.length - 1].status !== updates.status)) {
    newTimeline.push({
      status: updates.status,
      timestamp: now,
      remarks: updates.stage_remark
    });
  }

  const mergedUpdates: Partial<Order> = {
    ...updates,
    timeline_history: newTimeline,
    updated_at: now
  };

  if (updates.stage_remark && updates.status) {
    mergedUpdates.admin_remarks = {
      ...(existingOrder?.admin_remarks || {}),
      [updates.status]: updates.stage_remark
    };
  }

  if (supabase) {
    try {
      const { error } = await supabase.from('orders').update(mergedUpdates).eq('id', orderId);
      if (!error) {
        updateOrderLocally(orderId, mergedUpdates);
        return true;
      }
    } catch (e) {}
  }
  
  return updateOrderLocally(orderId, mergedUpdates);
}

function saveOrderLocally(order: any) {
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY) || '[]';
    const existing = JSON.parse(existingStr);
    existing.unshift(order);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {}
}

function updateOrderLocally(orderId: string, updates: any): boolean {
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY) || '[]';
    const existing = JSON.parse(existingStr);
    const index = existing.findIndex((o: any) => o.id === orderId);
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updates };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
      return true;
    }
  } catch (e) {}
  return false;
}

