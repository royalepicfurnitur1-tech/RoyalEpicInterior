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

export async function createOrder(orderData: Partial<Order>): Promise<{ success: boolean; data?: Order; error?: string }> {
  const supabase = getSupabase();
  const orderId = orderData.id || `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  
  const now = new Date().toISOString();
  const initialStatus = orderData.status || 'Order Placed';
  
  const record: Order = {
    id: orderId,
    user_id: orderData.user_id || 'guest',
    customer_email: orderData.customer_email || orderData.delivery_address?.email,
    customer_name: orderData.customer_name || orderData.delivery_address?.name,
    items: orderData.items || [],
    total_amount: Number(orderData.total_amount) || 0,
    subtotal: orderData.subtotal,
    discount_amount: orderData.discount_amount,
    tax_amount: orderData.tax_amount,
    status: initialStatus,
    payment_status: (orderData.payment_status as any) || 'Paid',
    payment_method: orderData.payment_method || 'Online Payment',
    delivery_address: orderData.delivery_address || {
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    expected_delivery_date: orderData.expected_delivery_date || new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    courier_name: orderData.courier_name || 'Royal Epic Express Logistics',
    tracking_number: orderData.tracking_number || `RE-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
    timeline_history: [
      {
        status: initialStatus,
        timestamp: now,
        remarks: 'Order received and logged into Royal Epic automated manufacturing portal.'
      }
    ],
    admin_remarks: orderData.admin_remarks || {},
    created_at: now,
    updated_at: now
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').insert([record]).select().single();
      if (!error && data) {
        saveOrderLocally(data);
        return { success: true, data };
      } else {
        console.warn("Supabase orders insert notice:", error);
      }
    } catch (e) {
      console.warn("Supabase orders insert exception:", e);
    }
  }
  
  // Fallback to local storage
  saveOrderLocally(record);
  return { success: true, data: record };
}

export async function fetchCustomerOrders(userIdOrEmail: string): Promise<Order[]> {
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
        return data as Order[];
      }
    } catch (e) {
      console.warn("Failed to fetch orders from supabase", e);
    }
  }

  // Fallback to local storage cache
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const allOrders: Order[] = JSON.parse(local);
      orders = allOrders.filter((o: Order) => 
        o.user_id === userIdOrEmail || 
        (o.customer_email && o.customer_email.toLowerCase() === userIdOrEmail.toLowerCase()) ||
        (o.delivery_address?.email && o.delivery_address.email.toLowerCase() === userIdOrEmail.toLowerCase())
      );
    }
  } catch (e) {}

  return orders;
}

export async function fetchAllOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  
  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Order[];
      }
    } catch (e) {
      console.warn("Failed to fetch all orders from supabase", e);
    }
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      return JSON.parse(local);
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

