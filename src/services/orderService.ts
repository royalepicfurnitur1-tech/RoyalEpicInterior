import { getSupabase } from '../lib/supabase';

export interface Order {
  id: string;
  user_id: string;
  items: any[];
  total_amount: number;
  status: string;
  payment_status: string;
  delivery_address: any;
  expected_delivery_date?: string;
  courier_name?: string;
  tracking_number?: string;
  created_at: string;
}

export async function createOrder(orderData: Partial<Order>): Promise<{ success: boolean; data?: Order; error?: string }> {
  const supabase = getSupabase();
  const orderId = orderData.id || `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  
  const record = {
    ...orderData,
    id: orderId,
    created_at: new Date().toISOString(),
    status: orderData.status || 'Order Placed',
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').insert([record]).select().single();
      if (!error && data) {
        saveOrderLocally(data);
        return { success: true, data };
      } else {
        console.warn("Supabase orders insert error:", error);
      }
    } catch (e) {
      console.warn("Supabase orders insert exception:", e);
    }
  }
  
  // Fallback to local
  saveOrderLocally(record);
  return { success: true, data: record as Order };
}

export async function fetchCustomerOrders(userId: string): Promise<Order[]> {
  const supabase = getSupabase();
  let orders: Order[] = [];
  
  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (!error && data) {
        return data as Order[];
      }
    } catch (e) {
      console.warn("Failed to fetch orders from supabase", e);
    }
  }

  // Fallback
  try {
    const local = localStorage.getItem('royal_epic_orders');
    if (local) {
      const allOrders = JSON.parse(local);
      orders = allOrders.filter((o: Order) => o.user_id === userId);
    }
  } catch (e) {}

  return orders;
}

export async function fetchAllOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  
  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data as Order[];
      }
    } catch (e) {
      console.warn("Failed to fetch all orders from supabase", e);
    }
  }

  try {
    const local = localStorage.getItem('royal_epic_orders');
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {}

  return [];
}

export async function updateOrderStatus(orderId: string, updates: Partial<Order>): Promise<boolean> {
  const supabase = getSupabase();
  
  if (supabase) {
    try {
      const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
      if (!error) {
        updateOrderLocally(orderId, updates);
        return true;
      }
    } catch (e) {}
  }
  
  return updateOrderLocally(orderId, updates);
}

function saveOrderLocally(order: any) {
  try {
    const existingStr = localStorage.getItem('royal_epic_orders') || '[]';
    const existing = JSON.parse(existingStr);
    existing.unshift(order);
    localStorage.setItem('royal_epic_orders', JSON.stringify(existing));
  } catch (e) {}
}

function updateOrderLocally(orderId: string, updates: any): boolean {
  try {
    const existingStr = localStorage.getItem('royal_epic_orders') || '[]';
    const existing = JSON.parse(existingStr);
    const index = existing.findIndex((o: any) => o.id === orderId);
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updates };
      localStorage.setItem('royal_epic_orders', JSON.stringify(existing));
      return true;
    }
  } catch (e) {}
  return false;
}
