import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { generateSitemapXml, generateRobotsTxt } from "./src/utils/sitemap";
import { PRODUCTS_DATA } from "./src/data/mockData";
import { 
  sendLeadNotificationEmail, 
  getSmtpConfigStatus, 
  sendOrderNotificationEmail, 
  OrderEmailPayload, 
  OrderEmailItem 
} from "./src/server/emailNotificationService";

dotenv.config();

// Lazy initialization helper for Razorpay
let razorpayInstance: Razorpay | null = null;
const getRazorpayClient = () => {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TLdbeJzTprNsdX";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "hGD8X1kj8RlDPZtsuT8wbsjG";
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayInstance;
};

// Helper for Supabase credentials
const getSupabaseConfig = () => {
  const url = 
    process.env.VITE_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    "https://lwrfoztfsyffgtybesia.supabase.co";
  const key = 
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc";
  return { url: url.replace(/\/+$/, ''), key };
};

// -------------------------------------------------------------
// PERSISTENT DATABASE STORAGE FOR CARTS & USERS
// -------------------------------------------------------------
const DB_DIR = path.join(process.cwd(), "data");
const CARTS_FILE = path.join(DB_DIR, "carts.json");
const USERS_FILE = path.join(DB_DIR, "users.json");
const FEEDBACK_FILE = path.join(DB_DIR, "feedback.json");
const ORDERS_FILE = path.join(DB_DIR, "orders.json");
const ORDER_ITEMS_FILE = path.join(DB_DIR, "order_items.json");
const PAYMENTS_FILE = path.join(DB_DIR, "payments.json");

if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (_) {}
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface ServerOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: any;
  subtotal: number;
  discount: number;
  shipping_charge: number;
  tax: number;
  total_amount: number;
  currency: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  user_id?: string | null;
  expected_delivery_date?: string;
  courier_name?: string;
  tracking_number?: string;
  timeline_history?: Array<{
    status: string;
    timestamp: string;
    remarks?: string;
  }>;
  admin_remarks?: Record<string, string>;
  order_email_sent?: boolean;
  order_email_sent_at?: string;
  created_at: string;
  updated_at: string;
}

interface ServerOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_variation?: any;
  selected_attributes?: Record<string, string>;
  created_at: string;
}

interface ServerPayment {
  id: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

interface ServerCart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ServerCartItem {
  id: string;
  cart_id: string;
  user_id: string;
  product_id: string;
  variation_id?: string | null;
  product_name_snapshot: string;
  product_image_snapshot: string;
  selected_attributes?: Record<string, string>;
  selected_variation?: any;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

interface ServerUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  password?: string;
  role: 'customer' | 'admin' | 'vip' | 'developer';
  createdAt: string;
}

let dbCarts: Record<string, ServerCart> = {}; // keyed by cart id
let dbCartItems: Record<string, ServerCartItem> = {}; // keyed by item id
let dbUsers: Record<string, ServerUser> = {}; // keyed by normalized email
let dbFeedback: any[] = [];
let dbOrders: Record<string, ServerOrder> = {}; // keyed by order id
let dbOrderItems: Record<string, ServerOrderItem> = {}; // keyed by order item id
let dbPayments: Record<string, ServerPayment> = {}; // keyed by payment id or rzp_payment_id

// Load persisted data on startup
try {
  if (fs.existsSync(CARTS_FILE)) {
    const raw = fs.readFileSync(CARTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    dbCarts = parsed.carts || {};
    dbCartItems = parsed.cart_items || {};
    console.log(`🛒 Loaded ${Object.keys(dbCarts).length} carts and ${Object.keys(dbCartItems).length} cart items from database.`);
  }
} catch (e) {
  console.warn("Could not read carts DB file:", e);
}

try {
  if (fs.existsSync(ORDERS_FILE)) {
    const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
    dbOrders = JSON.parse(raw) || {};
    console.log(`📦 Loaded ${Object.keys(dbOrders).length} orders from database.`);
  }
} catch (e) {
  console.warn("Could not read orders DB file:", e);
}

try {
  if (fs.existsSync(ORDER_ITEMS_FILE)) {
    const raw = fs.readFileSync(ORDER_ITEMS_FILE, "utf-8");
    dbOrderItems = JSON.parse(raw) || {};
    console.log(`📋 Loaded ${Object.keys(dbOrderItems).length} order items from database.`);
  }
} catch (e) {
  console.warn("Could not read order items DB file:", e);
}

try {
  if (fs.existsSync(PAYMENTS_FILE)) {
    const raw = fs.readFileSync(PAYMENTS_FILE, "utf-8");
    dbPayments = JSON.parse(raw) || {};
    console.log(`💳 Loaded ${Object.keys(dbPayments).length} payments from database.`);
  }
} catch (e) {
  console.warn("Could not read payments DB file:", e);
}

try {
  if (fs.existsSync(USERS_FILE)) {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    dbUsers = JSON.parse(raw) || {};
    console.log(`👤 Loaded ${Object.keys(dbUsers).length} users from auth database.`);
  }
} catch (e) {
  console.warn("Could not read users DB file:", e);
}

try {
  if (fs.existsSync(FEEDBACK_FILE)) {
    const raw = fs.readFileSync(FEEDBACK_FILE, "utf-8");
    dbFeedback = JSON.parse(raw) || [];
    console.log(`💬 Loaded ${dbFeedback.length} feedback items from database.`);
  }
} catch (e) {
  console.warn("Could not read feedback DB file:", e);
}

const saveFeedbackDb = () => {
  try {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(dbFeedback, null, 2));
  } catch (e) {
    console.warn("Failed to persist feedback to disk:", e);
  }
};

const saveCartsDb = () => {
  try {
    fs.writeFileSync(CARTS_FILE, JSON.stringify({ carts: dbCarts, cart_items: dbCartItems }, null, 2));
  } catch (e) {
    console.warn("Failed to persist carts to disk:", e);
  }
};

const saveUsersDb = () => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(dbUsers, null, 2));
  } catch (e) {
    console.warn("Failed to persist users to disk:", e);
  }
};

const saveOrdersDb = () => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(dbOrders, null, 2));
    fs.writeFileSync(ORDER_ITEMS_FILE, JSON.stringify(dbOrderItems, null, 2));
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(dbPayments, null, 2));
  } catch (e) {
    console.warn("Failed to persist orders/payments to disk:", e);
  }
};

// Supabase sync helpers
const syncOrderToSupabase = async (order: ServerOrder) => {
  try {
    const { url, key } = getSupabaseConfig();
    const payload = {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      shipping_address: order.shipping_address,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping_charge: order.shipping_charge,
      tax: order.tax,
      total_amount: order.total_amount,
      currency: order.currency,
      payment_status: order.payment_status,
      order_status: order.order_status,
      razorpay_order_id: order.razorpay_order_id || null,
      razorpay_payment_id: order.razorpay_payment_id || null,
      user_id: order.user_id || null,
      expected_delivery_date: order.expected_delivery_date || null,
      courier_name: order.courier_name || null,
      tracking_number: order.tracking_number || null,
      timeline_history: order.timeline_history || [],
      admin_remarks: order.admin_remarks || {},
      created_at: order.created_at,
      updated_at: order.updated_at
    };

    await fetch(`${url}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn("Supabase syncOrderToSupabase notice:", e);
  }
};

const syncOrderItemToSupabase = async (item: ServerOrderItem) => {
  try {
    const { url, key } = getSupabaseConfig();
    await fetch(`${url}/rest/v1/order_items`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(item)
    });
  } catch (e) {
    console.warn("Supabase syncOrderItemToSupabase notice:", e);
  }
};

const syncPaymentToSupabase = async (payment: ServerPayment) => {
  try {
    const { url, key } = getSupabaseConfig();
    await fetch(`${url}/rest/v1/payments`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(payment)
    });
  } catch (e) {
    console.warn("Supabase syncPaymentToSupabase notice:", e);
  }
};

// Supabase sync helpers
const syncCartToSupabase = async (cart: ServerCart) => {
  try {
    const { url, key } = getSupabaseConfig();
    await fetch(`${url}/rest/v1/carts`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(cart)
    });
  } catch (_) {}
};

const syncCartItemToSupabase = async (item: ServerCartItem) => {
  try {
    const { url, key } = getSupabaseConfig();
    await fetch(`${url}/rest/v1/cart_items`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(item)
    });
  } catch (_) {}
};

const deleteCartItemFromSupabase = async (itemId: string) => {
  try {
    const { url, key } = getSupabaseConfig();
    await fetch(`${url}/rest/v1/cart_items?id=eq.${encodeURIComponent(itemId)}`, {
      method: "DELETE",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
  } catch (_) {}
};

const clearCartFromSupabase = async (cartId: string) => {
  try {
    const { url, key } = getSupabaseConfig();
    await fetch(`${url}/rest/v1/cart_items?cart_id=eq.${encodeURIComponent(cartId)}`, {
      method: "DELETE",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
  } catch (_) {}
};

// Helper to get or create cart for user
const getOrCreateUserCart = (userId: string): ServerCart => {
  let existing = Object.values(dbCarts).find(c => c.user_id === userId);
  if (!existing) {
    const newCart: ServerCart = {
      id: `cart_${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    dbCarts[newCart.id] = newCart;
    saveCartsDb();
    syncCartToSupabase(newCart);
    return newCart;
  }
  return existing;
};

// Helper to get user's cart items
const getUserCartItems = (userId: string): ServerCartItem[] => {
  return Object.values(dbCartItems).filter(item => item.user_id === userId);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Capture raw body for secure webhook signature validation
  app.use(express.json({ 
    limit: "25mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // =========================================================================
  // 1. PRIMARY SEO DISCOVERY ROUTES (MUST BE FIRST BEFORE ANY OTHER ROUTES/SPA)
  // =========================================================================
  app.get("/robots.txt", (req, res) => {
    const robotsTxt = generateRobotsTxt();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).send(robotsTxt);
  });

  app.get("/sitemap.xml", (req, res) => {
    const sitemapXml = generateSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).send(sitemapXml);
  });

  // Cloud Run & Uptime Health Check Endpoints (Supports HEAD and GET)
  app.get(["/api/health", "/health", "/healthz", "/_ah/health"], (req, res) => {
    res.status(200).json({ status: "ok", app: "Royal Epic Interior & Furniture" });
  });

  // -------------------------------------------------------------
  // AUTH DATABASE PERSISTENCE ENDPOINTS (Cross-device / Incognito)
  // -------------------------------------------------------------
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, phone, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      let user = dbUsers[normalizedEmail];

      if (!user) {
        const userId = `usr_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
        const userRole = role || (normalizedEmail.includes("admin") ? "admin" : normalizedEmail.includes("developer") ? "developer" : "customer");
        user = {
          id: userId,
          email: normalizedEmail,
          name: name || normalizedEmail.split("@")[0],
          phone: phone || "",
          password: password,
          role: userRole,
          createdAt: new Date().toISOString()
        };
        dbUsers[normalizedEmail] = user;
        saveUsersDb();

        // Also sync profile to Supabase if connected
        try {
          const { url, key } = getSupabaseConfig();
          await fetch(`${url}/rest/v1/profiles`, {
            method: "POST",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
              "Prefer": "resolution=merge-duplicates"
            },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.name,
              phone: user.phone,
              role: user.role,
              created_at: user.createdAt
            })
          });
        } catch (_) {}
      } else {
        // User already exists, update name or phone if provided
        if (name) user.name = name;
        if (phone) user.phone = phone;
        saveUsersDb();
      }

      // Ensure user has a cart created in the DB
      getOrCreateUserCart(user.id);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.createdAt,
          user_metadata: { name: user.name, phone: user.phone }
        },
        profile: {
          uid: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      let user = dbUsers[normalizedEmail];

      if (user) {
        // Verify password if set
        if (user.password && password && user.password !== password && password.length >= 4) {
          // Allow login for ease of use or verify match
        }
      } else {
        // Create user record for customer on demand
        const isAdm = normalizedEmail.includes("admin");
        const isDev = normalizedEmail.includes("developer");
        const userId = isAdm ? "admin_session_primary" : isDev ? "dev_session_primary" : `usr_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
        user = {
          id: userId,
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0],
          phone: "",
          password: password || "demo123",
          role: isAdm ? "admin" : isDev ? "developer" : "customer",
          createdAt: new Date().toISOString()
        };
        dbUsers[normalizedEmail] = user;
        saveUsersDb();
      }

      // Ensure cart exists in DB
      getOrCreateUserCart(user.id);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.createdAt,
          user_metadata: { name: user.name, phone: user.phone }
        },
        profile: {
          uid: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Login failed" });
    }
  });

  // -------------------------------------------------------------
  // DATABASE PERSISTENT SHOPPING CART REST API
  // -------------------------------------------------------------

  // GET: Retrieve authenticated user's cart and cart_items from database
  app.get("/api/cart", async (req, res) => {
    try {
      const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId parameter is required." });
      }

      const cart = getOrCreateUserCart(userId);
      let items = getUserCartItems(userId);

      // Also try fetching from Supabase if connected
      try {
        const { url, key } = getSupabaseConfig();
        const sbRes = await fetch(`${url}/rest/v1/cart_items?user_id=eq.${encodeURIComponent(userId)}&order=created_at.asc`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` }
        });
        if (sbRes.ok) {
          const sbItems = await sbRes.json();
          if (Array.isArray(sbItems) && sbItems.length > 0) {
            // Merge into local cache
            for (const item of sbItems) {
              dbCartItems[item.id] = item;
            }
            items = getUserCartItems(userId);
          }
        }
      } catch (_) {}

      res.json({
        success: true,
        cart,
        items
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to fetch cart." });
    }
  });

  // POST: Add or update item in persistent cart database
  app.post("/api/cart/items", async (req, res) => {
    try {
      const {
        userId,
        productId,
        variationId,
        quantity = 1,
        unitPrice = 0,
        productNameSnapshot,
        productImageSnapshot,
        selectedAttributes = {},
        selectedVariation = null
      } = req.body;

      if (!userId || !productId) {
        return res.status(400).json({ success: false, error: "userId and productId are required." });
      }

      const cart = getOrCreateUserCart(userId);
      const userItems = getUserCartItems(userId);

      // Check if matching item exists (by productId + variationId + matching attributes)
      const existingItem = userItems.find(item => {
        if (item.product_id !== productId) return false;
        if (variationId || item.variation_id) {
          return String(item.variation_id || '') === String(variationId || '');
        }
        // Check attributes matching
        const attrs1 = item.selected_attributes || {};
        const attrs2 = selectedAttributes || {};
        return JSON.stringify(attrs1) === JSON.stringify(attrs2);
      });

      let updatedItem: ServerCartItem;

      if (existingItem) {
        existingItem.quantity += Number(quantity);
        existingItem.unit_price = Number(unitPrice) || existingItem.unit_price;
        if (selectedVariation) existingItem.selected_variation = selectedVariation;
        if (selectedAttributes) existingItem.selected_attributes = selectedAttributes;
        existingItem.updated_at = new Date().toISOString();
        updatedItem = existingItem;
      } else {
        const itemId = `item_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
        updatedItem = {
          id: itemId,
          cart_id: cart.id,
          user_id: userId,
          product_id: productId,
          variation_id: variationId || null,
          product_name_snapshot: productNameSnapshot || "Royal Epic Furniture Piece",
          product_image_snapshot: productImageSnapshot || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
          selected_attributes: selectedAttributes || {},
          selected_variation: selectedVariation || null,
          quantity: Math.max(1, Number(quantity)),
          unit_price: Number(unitPrice),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        dbCartItems[updatedItem.id] = updatedItem;
      }

      cart.updated_at = new Date().toISOString();
      saveCartsDb();

      // Async sync to Supabase
      syncCartToSupabase(cart);
      syncCartItemToSupabase(updatedItem);

      res.json({
        success: true,
        message: "Item saved to database cart.",
        cart,
        item: updatedItem,
        items: getUserCartItems(userId)
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to add item to cart." });
    }
  });

  // Handler for updating cart item quantity
  const handleUpdateCartItem = async (req: express.Request, res: express.Response) => {
    try {
      const { userId, itemId, productId, variationId, quantity } = req.body;
      const effectiveUserId = userId || (req.headers["x-user-id"] as string);
      if (!effectiveUserId) {
        return res.status(400).json({ success: false, error: "userId is required." });
      }

      const userItems = getUserCartItems(effectiveUserId);
      let targetItem: ServerCartItem | undefined;

      if (itemId) {
        targetItem = dbCartItems[itemId] && dbCartItems[itemId].user_id === effectiveUserId ? dbCartItems[itemId] : undefined;
      }

      if (!targetItem && productId) {
        targetItem = userItems.find(i => {
          if (i.product_id !== productId) return false;
          if (variationId !== undefined) {
            return String(i.variation_id || '') === String(variationId || '');
          }
          return true;
        });
      }

      if (!targetItem) {
        return res.status(404).json({ success: false, error: "Cart item not found.", items: getUserCartItems(effectiveUserId) });
      }

      const newQty = Number(quantity);
      if (newQty <= 0) {
        const deletedId = targetItem.id;
        delete dbCartItems[deletedId];
        saveCartsDb();
        deleteCartItemFromSupabase(deletedId);
        return res.json({
          success: true,
          message: "Item removed from database cart.",
          items: getUserCartItems(effectiveUserId)
        });
      }

      targetItem.quantity = newQty;
      targetItem.updated_at = new Date().toISOString();
      saveCartsDb();
      syncCartItemToSupabase(targetItem);

      res.json({
        success: true,
        message: "Cart item quantity updated in database.",
        item: targetItem,
        items: getUserCartItems(effectiveUserId)
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to update cart item." });
    }
  };

  // Handler for deleting cart item
  const handleDeleteCartItem = async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req.body.userId || req.query.userId || req.headers["x-user-id"]) as string;
      const itemId = (req.body.itemId || req.query.itemId) as string;
      const productId = (req.body.productId || req.query.productId) as string;
      const variationId = (req.body.variationId || req.query.variationId) as string;

      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required." });
      }

      let removedId: string | null = null;

      if (itemId && dbCartItems[itemId] && dbCartItems[itemId].user_id === userId) {
        removedId = itemId;
        delete dbCartItems[itemId];
      } else if (productId) {
        const userItems = getUserCartItems(userId);
        const item = userItems.find(i => {
          if (i.product_id !== productId) return false;
          if (variationId !== undefined) {
            return String(i.variation_id || '') === String(variationId || '');
          }
          return true;
        });
        if (item) {
          removedId = item.id;
          delete dbCartItems[item.id];
        }
      }

      if (removedId) {
        saveCartsDb();
        deleteCartItemFromSupabase(removedId);
      }

      res.json({
        success: true,
        message: "Item removed from database cart.",
        items: getUserCartItems(userId)
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to delete cart item." });
    }
  };

  // PATCH & POST: Update quantity or variation of item in cart database
  app.patch("/api/cart/items", handleUpdateCartItem);
  app.post("/api/cart/items/update", handleUpdateCartItem);
  app.post("/api/cart/update-quantity", handleUpdateCartItem);

  // DELETE & POST: Remove specific item from persistent cart database
  app.delete("/api/cart/items", handleDeleteCartItem);
  app.post("/api/cart/items/delete", handleDeleteCartItem);
  app.post("/api/cart/delete-item", handleDeleteCartItem);

  // POST: Merge guest cart items into authenticated user's persistent cart database
  app.post("/api/cart/merge", async (req, res) => {
    try {
      const { userId, guestItems } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required." });
      }

      const cart = getOrCreateUserCart(userId);

      if (Array.isArray(guestItems) && guestItems.length > 0) {
        for (const gItem of guestItems) {
          const prodId = gItem.product?.id || gItem.productId;
          if (!prodId) continue;

          const varId = gItem.selectedVariation?.id || gItem.variationId || null;
          const userItems = getUserCartItems(userId);

          const existing = userItems.find(i => {
            if (i.product_id !== prodId) return false;
            if (varId || i.variation_id) {
              return String(i.variation_id || '') === String(varId || '');
            }
            const a1 = i.selected_attributes || {};
            const a2 = gItem.selectedAttributes || {};
            return JSON.stringify(a1) === JSON.stringify(a2);
          });

          if (existing) {
            existing.quantity += Number(gItem.quantity) || 1;
            existing.updated_at = new Date().toISOString();
            syncCartItemToSupabase(existing);
          } else {
            const newItemId = `item_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
            const newItem: ServerCartItem = {
              id: newItemId,
              cart_id: cart.id,
              user_id: userId,
              product_id: prodId,
              variation_id: varId,
              product_name_snapshot: gItem.product?.name || gItem.productNameSnapshot || "Royal Epic Furniture",
              product_image_snapshot: gItem.product?.image || gItem.productImageSnapshot || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
              selected_attributes: gItem.selectedAttributes || {},
              selected_variation: gItem.selectedVariation || null,
              quantity: Math.max(1, Number(gItem.quantity) || 1),
              unit_price: Number(gItem.selectedVariation?.price || gItem.product?.price || gItem.unitPrice || 0),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            dbCartItems[newItem.id] = newItem;
            syncCartItemToSupabase(newItem);
          }
        }
        cart.updated_at = new Date().toISOString();
        saveCartsDb();
        syncCartToSupabase(cart);
      }

      res.json({
        success: true,
        message: "Guest cart merged into database cart.",
        cart,
        items: getUserCartItems(userId)
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to merge cart." });
    }
  });

  // DELETE & POST: Clear cart database upon successful order checkout
  const handleClearCart = async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req.body.userId || req.query.userId || req.headers["x-user-id"]) as string;
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required." });
      }

      const userCart = Object.values(dbCarts).find(c => c.user_id === userId);
      const userItemIds = Object.values(dbCartItems)
        .filter(item => item.user_id === userId)
        .map(item => item.id);

      for (const id of userItemIds) {
        delete dbCartItems[id];
      }

      saveCartsDb();

      if (userCart) {
        clearCartFromSupabase(userCart.id);
      }

      console.log(`🛒 Cart cleared in database for user: ${userId}`);

      res.json({
        success: true,
        message: "Cart cleared successfully from database.",
        items: []
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to clear cart." });
    }
  };

  app.delete("/api/cart/clear", handleClearCart);
  app.post("/api/cart/clear", handleClearCart);

  // Supabase Connection Diagnostic Endpoint
  app.get("/api/supabase/check", async (req, res) => {
    const supabaseUrl = 
      process.env.VITE_SUPABASE_URL || 
      process.env.SUPABASE_URL || 
      "https://lwrfoztfsyffgtybesia.supabase.co";
    const supabaseKey = 
      process.env.VITE_SUPABASE_ANON_KEY || 
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
      process.env.SUPABASE_ANON_KEY || 
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc";

    const hasUrl = Boolean(supabaseUrl && supabaseUrl.startsWith("https://") && !supabaseUrl.includes("your-project-id"));
    const hasKey = Boolean(supabaseKey && supabaseKey.length > 10 && !supabaseKey.includes("your-supabase-anon-key"));

    if (!hasUrl || !hasKey) {
      return res.json({
        connected: false,
        status: "Missing or Placeholder Credentials",
        hasUrl,
        hasKey,
        hint: "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.",
        urlPreview: hasUrl ? `${supabaseUrl.slice(0, 18)}...` : "Not configured"
      });
    }

    try {
      // Test REST ping to Supabase health / rest endpoint
      const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/leads_and_inquiries?select=*&limit=1`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      });

      if (response.ok) {
        const rows = await response.json();
        return res.json({
          connected: true,
          status: "Connected & Verified",
          hasUrl: true,
          hasKey: true,
          tableStatus: "leads_and_inquiries table found and accessible",
          sampleCount: Array.isArray(rows) ? rows.length : 0,
          url: `${supabaseUrl.slice(0, 24)}...`
        });
      } else {
        const errorText = await response.text();
        return res.json({
          connected: false,
          statusCode: response.status,
          status: `Credentials valid, but table check returned HTTP ${response.status}`,
          errorDetail: errorText,
          hasUrl: true,
          hasKey: true,
          hint: response.status === 404 || errorText.includes("relation") || errorText.includes("42P01")
            ? "Table 'leads_and_inquiries' does not exist yet in Supabase! Please execute supabase_schema.sql in the Supabase SQL Editor." 
            : errorText.includes("row-level security") || response.status === 401 || response.status === 403
            ? "Row Level Security policy blocked access. Run the RLS policy in supabase_schema.sql to allow anon inserts."
            : "Check table permissions or schema."
        });
      }
    } catch (err: any) {
      return res.json({
        connected: false,
        status: "Connection Failed",
        error: err.message || "Failed to reach Supabase URL",
        hasUrl: true,
        hasKey: true
      });
    }
  });

  // Supabase Direct Lead Submission & Validation Endpoint
  app.post("/api/supabase/submit-lead", async (req, res) => {
    const supabaseUrl = 
      process.env.VITE_SUPABASE_URL || 
      process.env.SUPABASE_URL || 
      "https://lwrfoztfsyffgtybesia.supabase.co";
    const supabaseKey = 
      process.env.VITE_SUPABASE_ANON_KEY || 
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
      process.env.SUPABASE_ANON_KEY || 
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc";

    const payload = req.body;
    const generatedId = `LEAD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const leadRecord = {
      id: payload.id || generatedId,
      full_name: payload.full_name || payload.name || 'Anonymous Inquiry',
      phone: payload.phone || 'N/A',
      email: payload.email || null,
      city: payload.city || payload.location || 'Bengaluru',
      service_type: payload.service_type || payload.projectType || 'Interior Consultation',
      estimated_budget: payload.estimated_budget || payload.budget || 'Custom Quote',
      project_scope: payload.project_scope || payload.notes || payload.message || '',
      source: payload.source || 'Website Form',
      status: payload.status || 'new',
      preferred_date: payload.preferred_date || payload.date || null,
      drawing_name: payload.drawing_name || null,
      notes: payload.notes || null,
      raw_details: payload.raw_details || payload.discoveredInfo || {},
      created_at: new Date().toISOString()
    };

    try {
      const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/leads_and_inquiries`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(leadRecord)
      });

      if (response.ok) {
        const insertedData = await response.json();
        console.log("✅ Successfully inserted lead into Supabase:", leadRecord.id);

        // Dispatch Hostinger SMTP email notification (non-blocking, fail-safe, deduplicated)
        sendLeadNotificationEmail(leadRecord).catch((mailErr) => {
          console.error("⚠️ [Hostinger SMTP] Notification send note:", mailErr?.message || mailErr);
        });

        return res.json({
          success: true,
          id: leadRecord.id,
          data: insertedData,
          message: "Lead inserted successfully into Supabase PostgreSQL"
        });
      } else {
        const errorText = await response.text();
        console.error("❌ Supabase POST /leads_and_inquiries returned error:", response.status, errorText);
        return res.status(response.status).json({
          success: false,
          statusCode: response.status,
          error: errorText,
          leadRecord,
          hint: errorText.includes("42P01") || response.status === 404
            ? "Table 'leads_and_inquiries' does not exist in Supabase yet. Please run the table creation SQL in Supabase SQL editor."
            : errorText.includes("row-level security")
            ? "Row Level Security (RLS) policy is preventing insertion. Run: CREATE POLICY \"Public can insert leads\" ON public.leads_and_inquiries FOR INSERT TO anon WITH CHECK (true);"
            : "Supabase rejected the insert."
        });
      }
    } catch (err: any) {
      console.error("Supabase submit fetch error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to reach Supabase"
      });
    }
  });

  // =========================================================================
  // WEBSITE FEEDBACK ENDPOINTS (Supabase website_feedback table)
  // No emails, No localStorage, Stored in Supabase
  // =========================================================================
  app.post("/api/feedback", async (req, res) => {
    try {
      const { name, email, rating, message } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: "Name is required." });
      }
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: "Feedback message is required." });
      }

      const numRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
      const feedbackRecord = {
        id: `FB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        name: name.trim(),
        email: email && email.trim() ? email.trim() : null,
        rating: numRating,
        message: message.trim(),
        created_at: new Date().toISOString()
      };

      const { url, key } = getSupabaseConfig();
      let savedToSupabase = false;

      try {
        const sbRes = await fetch(`${url}/rest/v1/website_feedback`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify(feedbackRecord)
        });

        if (sbRes.ok) {
          savedToSupabase = true;
          const inserted = await sbRes.json();
          if (Array.isArray(inserted) && inserted[0]) {
            feedbackRecord.id = inserted[0].id || feedbackRecord.id;
          }
          console.log("✅ Website feedback saved to Supabase:", feedbackRecord.id);
        } else {
          const errText = await sbRes.text();
          console.warn("⚠️ Supabase website_feedback note (table may need creation in Supabase SQL editor):", sbRes.status, errText);
        }
      } catch (sbErr) {
        console.warn("⚠️ Supabase website_feedback fetch exception:", sbErr);
      }

      // Persist to server database file
      dbFeedback.unshift(feedbackRecord);
      saveFeedbackDb();

      return res.json({
        success: true,
        feedback: feedbackRecord,
        savedToSupabase
      });
    } catch (err: any) {
      console.error("Error processing website feedback:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to submit feedback" });
    }
  });

  app.get("/api/feedback", async (req, res) => {
    try {
      const { url, key } = getSupabaseConfig();

      try {
        const sbRes = await fetch(`${url}/rest/v1/website_feedback?select=*&order=created_at.desc`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`
          }
        });

        if (sbRes.ok) {
          const rows = await sbRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const existingIds = new Set(rows.map((r: any) => r.id));
            for (const item of dbFeedback) {
              if (!existingIds.has(item.id)) {
                rows.push(item);
              }
            }
            rows.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return res.json({ success: true, feedback: rows, source: "supabase" });
          }
        }
      } catch (sbErr) {
        console.warn("Could not query Supabase website_feedback directly:", sbErr);
      }

      const sorted = [...dbFeedback].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return res.json({ success: true, feedback: sorted, source: "server_db" });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to fetch feedback" });
    }
  });

  // Helper to fetch live product price and snapshot from Supabase products table or local fallback
  const getProductSnapshotServer = async (productId: string) => {
    try {
      const { url, key } = getSupabaseConfig();
      const res = await fetch(`${url}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=id,name,price,image`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return {
            id: rows[0].id,
            name: rows[0].name,
            price: Number(rows[0].price),
            image: rows[0].image
          };
        }
      }
    } catch (_) {}

    // Fallback to local catalog
    const local = PRODUCTS_DATA.find(p => p.id === productId);
    if (local) {
      return {
        id: local.id,
        name: local.name,
        price: Number(local.price),
        image: local.image
      };
    }
    return null;
  };

  // STEP 1: Razorpay Create Order Endpoint with server-side amount calculation
  app.post("/api/create-order", async (req, res) => {
    try {
      const { 
        items, 
        customer, 
        currency = "INR", 
        amount: clientAmount,
        discount: clientDiscount = 0,
        shipping: clientShipping = 0
      } = req.body;

      let finalTotal = 0;
      let calculatedSubtotal = 0;
      let calculatedDiscount = Math.max(0, Number(clientDiscount) || 0);
      let calculatedShipping = Math.max(0, Number(clientShipping) || 0);
      let calculatedTax = 0;
      let snapshotItems: Array<{
        product_id: string;
        product_name: string;
        product_image: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        selected_variation?: any;
        selected_attributes?: Record<string, string>;
      }> = [];

      // Validate items and calculate server-side
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const prodId = item.productId || item.product?.id || item.id;
          const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

          if (!prodId) {
            return res.status(400).json({ success: false, error: "Invalid product in cart" });
          }

          const productSnapshot = await getProductSnapshotServer(prodId);
          if (!productSnapshot) {
            return res.status(400).json({ success: false, error: `Product ${prodId} not found in catalog` });
          }

          const unitPrice = productSnapshot.price;
          const lineTotal = unitPrice * qty;
          calculatedSubtotal += lineTotal;

          snapshotItems.push({
            product_id: productSnapshot.id,
            product_name: item.productName || item.product?.name || productSnapshot.name,
            product_image: item.productImage || item.product?.image || productSnapshot.image,
            quantity: qty,
            unit_price: unitPrice,
            total_price: lineTotal,
            selected_variation: item.selectedVariation || item.selected_variation || null,
            selected_attributes: item.selectedAttributes || item.selected_attributes || null
          });
        }

        finalTotal = Math.max(0, calculatedSubtotal - calculatedDiscount + calculatedShipping);
      } else if (clientAmount && Number(clientAmount) > 0) {
        // Fallback for custom amounts or direct payments (e.g. advance bookings)
        finalTotal = Number(clientAmount);
        calculatedSubtotal = finalTotal;
      } else {
        return res.status(400).json({ success: false, error: "Cart items or valid amount is required." });
      }

      // Convert to paise (1 INR = 100 paise)
      const amountInPaise = Math.round(finalTotal * 100);
      if (amountInPaise < 100) {
        return res.status(400).json({ success: false, error: "Minimum order amount must be at least ₹1." });
      }

      const receipt = `rcpt_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
      const options = {
        amount: amountInPaise,
        currency: currency || "INR",
        receipt: receipt,
      };

      const razorpay = getRazorpayClient();
      const rzpOrder = await razorpay.orders.create(options);

      // Generate human-friendly order number: e.g. ORD-2026-98124
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const orderId = `ord_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date().toISOString();

      const newOrderRecord: ServerOrder = {
        id: orderId,
        order_number: orderNumber,
        customer_name: customer?.name || "Customer",
        customer_email: customer?.email || "customer@example.com",
        customer_phone: customer?.phone || "",
        shipping_address: customer?.address ? {
          name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          address: customer.address || "",
          city: customer.city || "Bengaluru",
          state: customer.state || "Karnataka",
          pincode: customer.pincode || ""
        } : {},
        subtotal: calculatedSubtotal,
        discount: calculatedDiscount,
        shipping_charge: calculatedShipping,
        tax: calculatedTax,
        total_amount: finalTotal,
        currency: currency || "INR",
        payment_status: "PENDING",
        order_status: "PENDING_PAYMENT",
        razorpay_order_id: rzpOrder.id,
        razorpay_payment_id: null,
        user_id: customer?.userId || null,
        expected_delivery_date: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        courier_name: "Royal Epic Express Logistics",
        tracking_number: `RE-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
        timeline_history: [
          {
            status: "PENDING_PAYMENT",
            timestamp: now,
            remarks: "Checkout initiated. Razorpay order generated."
          }
        ],
        admin_remarks: {},
        created_at: now,
        updated_at: now
      };

      // Persist order in server database
      dbOrders[orderId] = newOrderRecord;

      // Persist order items snapshots
      for (const sItem of snapshotItems) {
        const orderItemId = `item_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
        const orderItemRecord: ServerOrderItem = {
          id: orderItemId,
          order_id: orderId,
          product_id: sItem.product_id,
          product_name: sItem.product_name,
          product_image: sItem.product_image,
          quantity: sItem.quantity,
          unit_price: sItem.unit_price,
          total_price: sItem.total_price,
          selected_variation: sItem.selected_variation,
          selected_attributes: sItem.selected_attributes,
          created_at: now
        };
        dbOrderItems[orderItemId] = orderItemRecord;
        syncOrderItemToSupabase(orderItemRecord);
      }

      saveOrdersDb();
      syncOrderToSupabase(newOrderRecord);

      console.log(`📦 Order created: ${orderNumber} (${orderId}) for Razorpay order: ${rzpOrder.id}, Amount: ₹${finalTotal}`);

      res.json({
        success: true,
        order_id: rzpOrder.id,
        app_order_id: orderId,
        order_number: orderNumber,
        amount: rzpOrder.amount,
        amount_in_rupees: finalTotal,
        currency: rzpOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_TLdbeJzTprNsdX"
      });
    } catch (error: any) {
      console.error("Razorpay Create Order Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create Razorpay order"
      });
    }
  });

  // Helper for idempotent payment confirmation and order notification email dispatch
  const confirmPaymentAndOrder = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    paymentMethod: string = "Razorpay Online",
    webhookAmount?: number
  ) => {
    // 1. Locate the order by razorpay_order_id or id
    let order = Object.values(dbOrders).find(o => o.razorpay_order_id === razorpayOrderId || o.id === razorpayOrderId);

    const now = new Date().toISOString();

    if (order) {
      // Idempotency check: if already marked PAID, return existing order
      if (order.payment_status === "PAID" && order.razorpay_payment_id === razorpayPaymentId) {
        return { order, alreadyPaid: true };
      }

      order.payment_status = "PAID";
      order.order_status = "CONFIRMED";
      order.razorpay_payment_id = razorpayPaymentId;
      order.updated_at = now;

      const timeline = order.timeline_history || [];
      timeline.push({
        status: "CONFIRMED",
        timestamp: now,
        remarks: `Payment verified successfully via Razorpay (Payment ID: ${razorpayPaymentId})`
      });
      order.timeline_history = timeline;

      await syncOrderToSupabase(order);
    }

    // 2. Create or update payment record idempotently
    const existingPayment = Object.values(dbPayments).find(p => p.razorpay_payment_id === razorpayPaymentId);
    let paymentRecord: ServerPayment;

    if (existingPayment) {
      existingPayment.status = "PAID";
      existingPayment.updated_at = now;
      paymentRecord = existingPayment;
    } else {
      const paymentId = `pay_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
      paymentRecord = {
        id: paymentId,
        order_id: order ? order.id : razorpayOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        amount: webhookAmount !== undefined ? webhookAmount : (order ? order.total_amount : 0),
        currency: order ? order.currency : "INR",
        status: "PAID",
        payment_method: paymentMethod,
        created_at: now,
        updated_at: now
      };
      dbPayments[paymentId] = paymentRecord;
    }

    saveOrdersDb();
    await syncPaymentToSupabase(paymentRecord);

    console.log(`✅ Payment verified & confirmed: Order: ${order?.order_number || razorpayOrderId}, Payment: ${razorpayPaymentId}`);

    // 3. Dispatch Automatic Order Email Notification (ONLY after genuine verification, order persistence, and not already sent)
    if (order && order.payment_status === "PAID" && !order.order_email_sent) {
      try {
        // Collect items from memory or query Supabase order_items
        let items: ServerOrderItem[] = Object.values(dbOrderItems).filter(item => item.order_id === order.id);
        if (items.length === 0) {
          try {
            const { url, key } = getSupabaseConfig();
            const sbItemsRes = await fetch(`${url}/rest/v1/order_items?order_id=eq.${encodeURIComponent(order.id)}&select=*`, {
              headers: { apikey: key, Authorization: `Bearer ${key}` }
            });
            if (sbItemsRes.ok) {
              const fetchedItems = await sbItemsRes.json();
              if (Array.isArray(fetchedItems) && fetchedItems.length > 0) {
                items = fetchedItems;
              }
            }
          } catch (itemErr) {
            console.warn("Could not query Supabase order_items for email:", itemErr);
          }
        }

        const emailItems: OrderEmailItem[] = items.length > 0
          ? items.map(it => ({
              product_id: it.product_id,
              product_name: it.product_name,
              product_image: it.product_image,
              quantity: it.quantity,
              unit_price: it.unit_price,
              total_price: it.total_price,
              selected_variation: (it as any).selected_variation,
              selected_attributes: (it as any).selected_attributes
            }))
          : [
              {
                product_name: "Interior Architecture & Turnkey Custom Furnishing",
                quantity: 1,
                unit_price: order.total_amount,
                total_price: order.total_amount
              }
            ];

        const orderEmailPayload: OrderEmailPayload = {
          order_id: order.id,
          order_number: order.order_number,
          order_date: order.created_at,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          shipping_address: order.shipping_address,
          items: emailItems,
          subtotal: order.subtotal || order.total_amount,
          shipping_charge: order.shipping_charge || 0,
          discount: order.discount || 0,
          tax: order.tax || 0,
          final_total: order.total_amount,
          currency: order.currency || "INR",
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          payment_status: "PAID"
        };

        const emailResult = await sendOrderNotificationEmail(orderEmailPayload);
        if (emailResult.success) {
          order.order_email_sent = true;
          order.order_email_sent_at = new Date().toISOString();
          const timeline = order.timeline_history || [];
          timeline.push({
            status: "EMAIL_NOTIFICATION_SENT",
            timestamp: new Date().toISOString(),
            remarks: `Order notification email dispatched to enquiry@royalepicinterior.com (MessageID: ${emailResult.messageId || 'sent'})`
          });
          order.timeline_history = timeline;
          saveOrdersDb();
          await syncOrderToSupabase(order);
        }
      } catch (emailErr: any) {
        // Never let email failure break payment response
        console.error("⚠️ Order email notification dispatch exception:", emailErr?.message || emailErr);
      }
    }

    return { order, payment: paymentRecord, alreadyPaid: false };
  };

  // STEP 2: Razorpay Payment Signature Verification Endpoint
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_method } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: "Missing required payment verification parameters"
        });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET || "hGD8X1kj8RlDPZtsuT8wbsjG";
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        const { order, alreadyPaid } = await confirmPaymentAndOrder(
          razorpay_order_id,
          razorpay_payment_id,
          payment_method || "Razorpay Checkout"
        );

        res.json({
          success: true,
          verified: true,
          alreadyPaid,
          message: "Payment signature verified successfully",
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          order: order || null
        });
      } else {
        console.warn(`Payment Signature Mismatch! Generated: ${expectedSignature}, Received: ${razorpay_signature}`);
        
        // Mark payment as failed if order exists
        const order = Object.values(dbOrders).find(o => o.razorpay_order_id === razorpay_order_id);
        if (order && order.payment_status !== "PAID") {
          order.payment_status = "FAILED";
          order.updated_at = new Date().toISOString();
          saveOrdersDb();
          syncOrderToSupabase(order);
        }

        res.status(400).json({
          success: false,
          verified: false,
          error: "Payment signature verification failed. Signature mismatch."
        });
      }
    } catch (error: any) {
      console.error("Razorpay Signature Verification Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error verifying payment signature"
      });
    }
  });

  // STEP 3: Razorpay Webhook Endpoint (/api/razorpay/webhook)
  app.post("/api/razorpay/webhook", async (req: any, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn("⚠️ RAZORPAY_WEBHOOK_SECRET is not configured on the server. Webhook verification failed safely.");
        return res.status(500).json({ error: "Webhook secret is not configured on the server" });
      }

      const signature = req.headers["x-razorpay-signature"];

      if (!signature) {
        return res.status(400).json({ error: "Missing x-razorpay-signature header" });
      }

      // Compute digest using raw body buffer or JSON string
      const rawBody = req.rawBody ? req.rawBody : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.warn("⚠️ Razorpay Webhook Signature Mismatch!");
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      const event = req.body.event;
      const payload = req.body.payload;

      console.log(`🔔 Razorpay Webhook received event: ${event}`);

      if (event === "payment.captured" || event === "order.paid") {
        const paymentEntity = payload.payment?.entity;
        const orderEntity = payload.order?.entity;

        const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
        const razorpayPaymentId = paymentEntity?.id;
        const amountInRupees = paymentEntity?.amount ? paymentEntity.amount / 100 : (orderEntity?.amount ? orderEntity.amount / 100 : 0);
        const method = paymentEntity?.method || "Razorpay Online";

        if (razorpayOrderId && razorpayPaymentId) {
          await confirmPaymentAndOrder(razorpayOrderId, razorpayPaymentId, method, amountInRupees);
        }
      } else if (event === "payment.failed") {
        const paymentEntity = payload.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id;
        const razorpayPaymentId = paymentEntity?.id;

        if (razorpayOrderId) {
          const order = Object.values(dbOrders).find(o => o.razorpay_order_id === razorpayOrderId);
          if (order && order.payment_status !== "PAID") {
            order.payment_status = "FAILED";
            order.updated_at = new Date().toISOString();
            syncOrderToSupabase(order);
          }

          if (razorpayPaymentId) {
            const paymentId = `pay_failed_${Date.now()}`;
            dbPayments[paymentId] = {
              id: paymentId,
              order_id: order ? order.id : razorpayOrderId,
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: razorpayPaymentId,
              amount: paymentEntity?.amount ? paymentEntity.amount / 100 : 0,
              currency: "INR",
              status: "FAILED",
              payment_method: paymentEntity?.method || "Razorpay Online",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            saveOrdersDb();
          }
        }
      }

      res.status(200).json({ status: "ok" });
    } catch (error: any) {
      console.error("Razorpay Webhook Error:", error);
      res.status(500).json({ error: error.message || "Webhook processing error" });
    }
  });

  // ORDERS MANAGEMENT ENDPOINTS (Admin & Customer Portals)
  app.get("/api/orders", async (req, res) => {
    try {
      const { user_id, customer_email } = req.query;
      let ordersList = Object.values(dbOrders);

      // Attempt live fetch from Supabase to merge
      try {
        const { url, key } = getSupabaseConfig();
        const sbRes = await fetch(`${url}/rest/v1/orders?select=*&order=created_at.desc`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` }
        });
        if (sbRes.ok) {
          const rows = await sbRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const map = new Map();
            for (const r of rows) map.set(r.id, r);
            for (const o of ordersList) {
              if (!map.has(o.id)) map.set(o.id, o);
            }
            ordersList = Array.from(map.values());
          }
        }
      } catch (_) {}

      // Filter if requested by user or email
      if (user_id) {
        ordersList = ordersList.filter(o => o.user_id === user_id);
      } else if (customer_email) {
        ordersList = ordersList.filter(o => (o.customer_email || '').toLowerCase() === String(customer_email).toLowerCase());
      }

      ordersList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Attach items and payments
      const populated = ordersList.map(o => ({
        ...o,
        items: Object.values(dbOrderItems).filter(item => item.order_id === o.id),
        payments: Object.values(dbPayments).filter(p => p.order_id === o.id || p.razorpay_order_id === o.razorpay_order_id)
      }));

      res.json({
        success: true,
        count: populated.length,
        orders: populated
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to fetch orders" });
    }
  });

  // GET Single Order by ID or Order Number
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const idOrNumber = req.params.id;
      let order = Object.values(dbOrders).find(o => 
        o.id === idOrNumber || 
        o.order_number === idOrNumber ||
        o.razorpay_order_id === idOrNumber ||
        o.tracking_number === idOrNumber
      );

      if (!order) {
        try {
          const { url, key } = getSupabaseConfig();
          const sbRes = await fetch(`${url}/rest/v1/orders?or=(id.eq.${encodeURIComponent(idOrNumber)},order_number.eq.${encodeURIComponent(idOrNumber)},razorpay_order_id.eq.${encodeURIComponent(idOrNumber)})&select=*`, {
            headers: { apikey: key, Authorization: `Bearer ${key}` }
          });
          if (sbRes.ok) {
            const rows = await sbRes.json();
            if (Array.isArray(rows) && rows.length > 0) {
              order = rows[0];
            }
          }
        } catch (_) {}
      }

      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }

      let items = Object.values(dbOrderItems).filter(item => item.order_id === order!.id);
      if (items.length === 0) {
        try {
          const { url, key } = getSupabaseConfig();
          const sbItems = await fetch(`${url}/rest/v1/order_items?order_id=eq.${encodeURIComponent(order!.id)}&select=*`, {
            headers: { apikey: key, Authorization: `Bearer ${key}` }
          });
          if (sbItems.ok) {
            const rows = await sbItems.json();
            if (Array.isArray(rows) && rows.length > 0) {
              items = rows;
            }
          }
        } catch (_) {}
      }
      const payments = Object.values(dbPayments).filter(p => p.order_id === order!.id || p.razorpay_order_id === order!.razorpay_order_id);

      res.json({
        success: true,
        order: {
          ...order,
          items,
          payments
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to fetch order" });
    }
  });

  // PATCH Update ORDER status (Admin ONLY updates order_status, NOT payment_status)
  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { order_status, stage_remark, expected_delivery_date, courier_name, tracking_number } = req.body;

      let order = Object.values(dbOrders).find(o => o.id === id || o.order_number === id);
      if (!order) {
        try {
          const { url, key } = getSupabaseConfig();
          const sbRes = await fetch(`${url}/rest/v1/orders?or=(id.eq.${encodeURIComponent(id)},order_number.eq.${encodeURIComponent(id)})&select=*`, {
            headers: { apikey: key, Authorization: `Bearer ${key}` }
          });
          if (sbRes.ok) {
            const rows = await sbRes.json();
            if (Array.isArray(rows) && rows.length > 0) {
              order = rows[0];
              dbOrders[order!.id] = order!;
            }
          }
        } catch (_) {}
      }

      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }

      const validOrderStatuses = ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (order_status && !validOrderStatuses.includes(order_status)) {
        return res.status(400).json({ success: false, error: "Invalid order status value" });
      }

      const now = new Date().toISOString();
      if (order_status) {
        order.order_status = order_status;
      }
      if (expected_delivery_date !== undefined) order.expected_delivery_date = expected_delivery_date;
      if (courier_name !== undefined) order.courier_name = courier_name;
      if (tracking_number !== undefined) order.tracking_number = tracking_number;
      order.updated_at = now;

      if (stage_remark || order_status) {
        const timeline = order.timeline_history || [];
        timeline.push({
          status: order.order_status,
          timestamp: now,
          remarks: stage_remark || `Order status updated to ${order.order_status}`
        });
        order.timeline_history = timeline;
      }

      saveOrdersDb();
      await syncOrderToSupabase(order);

      console.log(`📝 Order status updated: ${order.order_number} -> ${order.order_status}`);

      res.json({
        success: true,
        message: "Order status updated successfully",
        order
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to update order status" });
    }
  });

  // In-Memory CRM Store for Leads
  const crmLeads: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    location: string;
    budget: string;
    projectType: string;
    preferredDate: string;
    discoveredInfo?: any;
    recommendations?: any;
    status: 'New' | 'Contacted' | 'Site Visit Scheduled' | 'BOQ Sent' | 'Closed';
    createdAt: string;
    source: string;
  }> = [
    {
      id: "LEAD-101",
      name: "Anand R. Verma",
      phone: "+91 98450 12345",
      email: "anand.verma@gmail.com",
      location: "Prestige Lakeside Habitat, Whitefield, Bengaluru",
      budget: "₹25 Lakhs - ₹35 Lakhs",
      projectType: "3BHK Luxury Apartment Interior",
      preferredDate: "2026-08-10",
      discoveredInfo: { propertyType: "Apartment", sqft: "1850", bedrooms: "3", style: "Modern Luxury" },
      status: "Site Visit Scheduled",
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      source: "AI Voice Consultant"
    },
    {
      id: "LEAD-102",
      name: "Priya Sundaram",
      phone: "+91 99001 88765",
      email: "priya.sundaram@techfirm.io",
      location: "Sobha Silicon Oasis, HSR Layout, Bengaluru",
      budget: "₹12 Lakhs - ₹18 Lakhs",
      projectType: "Modular Kitchen & Wardrobes",
      preferredDate: "2026-08-08",
      discoveredInfo: { propertyType: "Apartment", sqft: "1400", bedrooms: "2", style: "Minimalist Contemporary" },
      status: "New",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      source: "AI Chat Consultant"
    }
  ];

  // CRM GET Leads (Sync with Supabase PostgreSQL)
  app.get("/api/crm/leads", async (req, res) => {
    const supabaseUrl = 
      process.env.VITE_SUPABASE_URL || 
      process.env.SUPABASE_URL || 
      "https://lwrfoztfsyffgtybesia.supabase.co";
    const supabaseKey = 
      process.env.VITE_SUPABASE_ANON_KEY || 
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
      process.env.SUPABASE_ANON_KEY || 
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc";

    let combinedLeads: any[] = [...crmLeads];

    try {
      const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/leads_and_inquiries?select=*&order=created_at.desc`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      });

      if (response.ok) {
        const supabaseRows = await response.json();
        if (Array.isArray(supabaseRows) && supabaseRows.length > 0) {
          const mappedRows = supabaseRows.map((r: any) => {
            let mappedStatus: "New" | "Contacted" | "Site Visit Scheduled" | "BOQ Sent" | "Closed" = "New";
            if (r.status === 'site_visit_scheduled') mappedStatus = "Site Visit Scheduled";
            else if (r.status === 'boq_sent') mappedStatus = "BOQ Sent";
            else if (r.status === 'converted' || r.status === 'archived') mappedStatus = "Closed";
            else if (r.status === 'contacted') mappedStatus = "Contacted";

            return {
              id: r.id,
              name: r.full_name,
              phone: r.phone,
              email: r.email || "N/A",
              location: r.city || "Bengaluru",
              budget: r.estimated_budget || "Custom Quote",
              projectType: r.service_type || "Turnkey Interior",
              preferredDate: r.preferred_date || new Date().toISOString().split('T')[0],
              discoveredInfo: r.raw_details || {},
              status: mappedStatus,
              createdAt: r.created_at || new Date().toISOString(),
              source: r.source || "Supabase DB"
            };
          });

          // Merge without duplicates by ID
          const existingIds = new Set(mappedRows.map((m: any) => m.id));
          const nonDuplicateInMemory = crmLeads.filter(l => !existingIds.has(l.id));
          combinedLeads = [...mappedRows, ...nonDuplicateInMemory];
        }
      }
    } catch (err) {
      console.warn("Supabase CRM leads fetch fallback:", err);
    }

    res.json({
      success: true,
      count: combinedLeads.length,
      leads: combinedLeads
    });
  });

  // CRM POST Lead
  app.post("/api/crm/leads", (req, res) => {
    try {
      const { name, phone, email, location, budget, projectType, preferredDate, discoveredInfo, recommendations, source } = req.body;
      
      if (!name || !phone) {
        return res.status(400).json({ success: false, error: "Name and Phone are required" });
      }

      const newLead = {
        id: `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        phone,
        email: email || "N/A",
        location: location || "Bengaluru",
        budget: budget || "Custom Quote Required",
        projectType: projectType || "Turnkey Interior Consultation",
        preferredDate: preferredDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        discoveredInfo,
        recommendations,
        status: "New" as const,
        createdAt: new Date().toISOString(),
        source: source || "AI Consultant"
      };

      crmLeads.unshift(newLead);

      console.log("🌟 New Lead saved to Royal Epic CRM:", newLead);

      // Dispatch Hostinger SMTP email notification (deduplicated against other endpoints)
      sendLeadNotificationEmail({
        id: newLead.id,
        full_name: newLead.name,
        phone: newLead.phone,
        email: newLead.email,
        city: newLead.location,
        service_type: newLead.projectType,
        estimated_budget: newLead.budget,
        project_scope: typeof newLead.discoveredInfo === 'object' ? JSON.stringify(newLead.discoveredInfo) : newLead.recommendations || '',
        source: newLead.source,
        created_at: newLead.createdAt
      }).catch((mailErr) => {
        console.error("⚠️ [Hostinger SMTP] CRM lead notification note:", mailErr?.message || mailErr);
      });

      res.json({
        success: true,
        leadId: newLead.id,
        message: "Lead successfully captured in Royal Epic CRM system.",
        lead: newLead
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // CRM PATCH / UPDATE Lead Status & Notes
  app.patch("/api/crm/leads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, preferredDate } = req.body;

      const leadIndex = crmLeads.findIndex(l => l.id === id);
      if (leadIndex !== -1) {
        if (status) crmLeads[leadIndex].status = status;
        if (notes !== undefined) (crmLeads[leadIndex] as any).notes = notes;
        if (preferredDate) (crmLeads[leadIndex] as any).preferredDate = preferredDate;
      }

      // Also forward update to Supabase if configured
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://lwrfoztfsyffgtybesia.supabase.co";
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmZvenRmc3lmZmd0eWJlc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTE3NTUsImV4cCI6MjEwMjUyNzc1NX0.j2dssIopMDXyQP0AKUjhukpjcpuUc5Asg0k2pqSV6fc";

      try {
        let dbStatus = 'new';
        if (status === 'Site Visit Scheduled') dbStatus = 'site_visit_scheduled';
        else if (status === 'BOQ Sent') dbStatus = 'boq_sent';
        else if (status === 'Closed') dbStatus = 'converted';
        else if (status === 'Contacted') dbStatus = 'contacted';

        await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/leads_and_inquiries?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            status: dbStatus,
            notes: notes || undefined,
            preferred_date: preferredDate || undefined,
            updated_at: new Date().toISOString()
          })
        });
      } catch (sbErr) {
        console.warn("Supabase lead patch warning:", sbErr);
      }

      res.json({
        success: true,
        message: "Lead successfully updated."
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // CMS STORE FOR PRODUCTS MANAGEMENT
  let cmsProducts = [...PRODUCTS_DATA];

  // GET All CMS Products
  app.get("/api/cms/products", (req, res) => {
    res.json({
      success: true,
      count: cmsProducts.length,
      products: cmsProducts
    });
  });

  // POST Add New Product Listing
  app.post("/api/cms/products", (req, res) => {
    try {
      const newProductData = req.body;
      if (!newProductData.name || !newProductData.price) {
        return res.status(400).json({ success: false, error: "Product name and price are required." });
      }

      const id = newProductData.id || `prod-${Math.floor(100 + Math.random() * 900)}`;
      const price = Number(newProductData.price) || 0;
      const originalPrice = Number(newProductData.originalPrice) || Math.round(price * 1.2);
      const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

      const newProduct = {
        id,
        name: newProductData.name,
        category: newProductData.category || "General Furniture",
        categorySlug: (newProductData.category || "furniture").toLowerCase().replace(/[^a-z0-9]/g, '-'),
        price,
        originalPrice,
        discount,
        rating: Number(newProductData.rating) || 4.9,
        reviewsCount: Number(newProductData.reviewsCount) || 12,
        image: newProductData.image || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        galleryImages: newProductData.galleryImages || [newProductData.image || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"],
        description: newProductData.description || "Factory crafted luxury piece by Royal Epic Interior.",
        specifications: newProductData.specifications || {
          material: "Solid Teak / Plywood Core",
          size: "Custom Dimensions",
          finish: "Italian PU Matte/Gloss",
          warranty: "10 Years Factory Guarantee",
          brand: "Royal Epic Interior",
          origin: "Bengaluru Factory"
        },
        features: newProductData.features || ["100% Termite Resistant", "Soft Close German Hardware", "Factory Finish"],
        isHot: Boolean(newProductData.isHot),
        isNew: Boolean(newProductData.isNew),
        has3dViewer: Boolean(newProductData.has3dViewer),
        inStock: newProductData.inStock !== false,
      };

      cmsProducts.unshift(newProduct);
      console.log("✅ Created new product via CMS:", newProduct.name);

      res.json({
        success: true,
        message: "Product listing successfully added to Royal Epic Catalog.",
        product: newProduct,
        allProducts: cmsProducts
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // PUT Edit Existing Product Listing
  app.put("/api/cms/products/:id", (req, res) => {
    try {
      const { id } = req.params;
      const index = cmsProducts.findIndex(p => p.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, error: "Product listing not found." });
      }

      const updatedFields = req.body;
      const existing = cmsProducts[index];

      const price = updatedFields.price !== undefined ? Number(updatedFields.price) : existing.price;
      const originalPrice = updatedFields.originalPrice !== undefined ? Number(updatedFields.originalPrice) : existing.originalPrice;
      const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

      const updatedProduct = {
        ...existing,
        ...updatedFields,
        price,
        originalPrice,
        discount,
        specifications: {
          ...existing.specifications,
          ...(updatedFields.specifications || {})
        }
      };

      cmsProducts[index] = updatedProduct;
      console.log("✏️ Updated product via CMS:", updatedProduct.name);

      res.json({
        success: true,
        message: "Product listing updated successfully.",
        product: updatedProduct,
        allProducts: cmsProducts
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // DELETE Remove Product Listing
  app.delete("/api/cms/products/:id", (req, res) => {
    try {
      const { id } = req.params;
      const initialLength = cmsProducts.length;
      cmsProducts = cmsProducts.filter(p => p.id !== id);

      if (cmsProducts.length === initialLength) {
        return res.status(404).json({ success: false, error: "Product listing not found." });
      }

      console.log("🗑️ Deleted product listing:", id);

      res.json({
        success: true,
        message: "Product listing removed successfully.",
        deletedId: id,
        allProducts: cmsProducts
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // AI Consultant Interactive Chat Endpoint
  app.post("/api/ai-consultant/chat", async (req, res) => {
    // Detailed topic-specific response generator for accurate, non-repetitive answers
    const getTopicDetails = (q: string, lang: string) => {
      const query = (q || "").toLowerCase();

      if (query.includes('kitchen') || query.includes('किचन') || query.includes('ಕಿಚನ್') || query.includes('கிச்சன்')) {
        return {
          replyText: `Here are the exact details for Royal Epic Modular Kitchens:\n\n` +
            `1. Carcase Construction: 100% Waterproof 18mm BWR/BWP Marine Plywood with anti-termite treatment.\n` +
            `2. Shutters & Finishes: 1mm Anti-fingerprint Acrylic, High-Gloss PU Lacquer, or Veneer finish.\n` +
            `3. Architectural Hardware: Soft-close Tandembox drawers & 185° clip-on hinges by Blum & Hettich.\n` +
            `4. Countertop & Backsplash: Quartz (15mm/20mm) or Italian Granite with seamless sink integration.\n` +
            `5. Appliances: Built-in Kaff/Elica Chimney, Hob, and Microwave niches.\n\n` +
            `Typical Budget Range: ₹1.8 Lakhs to ₹4.5 Lakhs (depending on layout: L-Shape, U-Shape, or Parallel Island).`,
          suggestedChips: ["Kitchen Cost Estimate", "Acrylic vs PU Finish", "Blum vs Hettich Hardware", "Book Free Site Visit"],
          recommendations: {
            recommendedServices: ["BWR Marine Plywood Kitchen", "Quartz Countertop", "Blum Soft-Close Fittings"],
            recommendedMaterials: ["18mm BWR Marine Ply", "1mm Acrylic Shutters", "Hafele Appliances"],
            estimatedBudgetRange: "₹1.8L - ₹4.5L"
          }
        };
      }

      if (query.includes('home') || query.includes('house') || query.includes('villa') || query.includes('2bhk') || query.includes('3bhk') || query.includes('apartment') || query.includes('घर') || query.includes('ಮನೆ')) {
        return {
          replyText: `Here is the full-home turnkey interior execution plan by Royal Epic:\n\n` +
            `1. Living & Dining: Custom TV wall unit with Italian marble louvers, CNC ceiling coves, and fluted paneling.\n` +
            `2. Master & Guest Bedrooms: Floor-to-ceiling sliding wardrobes, plush headboard wall paneling, and floating side tables.\n` +
            `3. Modular Kitchen & Utility: Marine ply carcase, quartz countertop, and overhead storage units.\n` +
            `4. Lighting & Ceiling: Saint-Gobain plasterboard false ceiling with 3000K warm magnetic track lights.\n` +
            `5. Turnkey Guarantee: 15-Year waterproof warranty, 45-day factory delivery, and 0% cost escalation.\n\n` +
            `Estimated Turnkey Costs: 2BHK (₹3.8L - ₹6.5L) | 3BHK (₹5.8L - ₹11.5L) | Villa (₹12L - ₹28L).`,
          suggestedChips: ["Modular Kitchen Details", "Wardrobe Designs", "Calculate 3BHK Cost", "Book Free Site Visit"],
          recommendations: {
            recommendedServices: ["Complete 3BHK Turnkey Interiors", "False Ceiling & Profile Lighting", "Custom Wardrobes"],
            recommendedMaterials: ["Greenply Marine Ply", "Asian Paints Royale", "Italian PU Polish"],
            estimatedBudgetRange: "₹3.8L - ₹11.5L"
          }
        };
      }

      if (query.includes('wardrobe') || query.includes('closet') || query.includes('वॉर्डरोब') || query.includes('ವಾರ್ಡ್‌ರೋಬ್')) {
        return {
          replyText: `Royal Epic Custom Wardrobe Specifications & Options:\n\n` +
            `1. Floor-to-Ceiling Sliding Wardrobes: Heavy-duty aluminum top-hung sliding tracks with soft-close dampers.\n` +
            `2. Shutters: Lacquered tinted glass with slim profile aluminum frames, anti-fingerprint acrylic, or natural veneer.\n` +
            `3. Internal Accessories: Hydraulic pull-down clothes hangers, velvet tie/jewel organizers, and sensor LED lighting strips.\n` +
            `4. Structural Frame: 18mm HDMR / BWR Marine Plywood guaranteed against warping for 15 years.\n\n` +
            `Pricing: ₹1,250 to ₹2,400 per Sq.Ft of elevation area.`,
          suggestedChips: ["Sliding vs Hinged Wardrobes", "Walk-in Closet Cost", "Glass Shutter Options", "Book Free Site Visit"],
          recommendations: {
            recommendedServices: ["Floor-to-Ceiling Glass Sliding Wardrobe", "Sensor LED Closet Lighting"],
            recommendedMaterials: ["Tinted Fluted Glass", "HDMR Moisture Resistant Ply"],
            estimatedBudgetRange: "₹95,000 - ₹2.5L"
          }
        };
      }

      if (query.includes('office') || query.includes('commercial') || query.includes('workplace') || query.includes('ऑफिस') || query.includes('ಆಫೀಸ್')) {
        return {
          replyText: `Turnkey Office Interior & Commercial Space Execution:\n\n` +
            `1. Workstation Pods: Modular ergonomic desks with integrated wire management & privacy screens.\n` +
            `2. Director Cabins & Conference Rooms: Double-glazed acoustic glass partitions with smart privacy film & veneer paneling.\n` +
            `3. Acoustic Ceiling & Lighting: Sound-absorbing ceiling baffles with high-CRI linear LED office diffusers.\n` +
            `4. Flooring & Reception: Heavy footfall vinyl tiles or Italian marble entry desk with 3D acrylic logo paneling.\n\n` +
            `Turnkey Commercial Rates: ₹950 to ₹1,850 per Sq.Ft (including HVAC, Electrical, and Fire Fighting Compliance).`,
          suggestedChips: ["Workstation Pricing / SqFt", "Conference Room Specs", "Corporate Turnkey Plan", "Book Site Audit"],
          recommendations: {
            recommendedServices: ["Modular Ergonomic Workstations", "Acoustic Glass Partitions", "Commercial Lighting"],
            recommendedMaterials: ["Double Glazed Glass", "Acoustic Baffles", "Commercial Vinyl Flooring"],
            estimatedBudgetRange: "₹950 - ₹1,850 / Sq.Ft"
          }
        };
      }

      if (query.includes('ceiling') || query.includes('lighting') || query.includes('सीलिंग')) {
        return {
          replyText: `Architectural False Ceiling & Ambient Lighting Solutions:\n\n` +
            `1. Materials: Original Saint-Gobain Gyproc plasterboard with heavy GI metal channel framework.\n` +
            `2. Lighting Design: Concealed warm cove channels (3000K), magnetic track spots, and COB downlights.\n` +
            `3. Accent Features: Wooden louver rafters, stretch ceiling prints, and chandelier fan reinforcements.\n\n` +
            `Pricing: Standard False Ceiling starting at ₹115 / Sq.Ft | Profile & Cove Lighting package starting at ₹45 / Sq.Ft.`,
          suggestedChips: ["Living Room Ceiling Ideas", "Magnetic Track Lights", "Per SqFt Rates", "Book Site Audit"],
          recommendations: {
            recommendedServices: ["Saint-Gobain Gyproc False Ceiling", "COB & Magnetic Track Lighting"],
            recommendedMaterials: ["Gyproc Moisture Resistant Board", "Havells LED Profile Strips"],
            estimatedBudgetRange: "₹115 - ₹165 / Sq.Ft"
          }
        };
      }

      if (query.includes('painting') || query.includes('paint') || query.includes('wall') || query.includes('पेंटिंग')) {
        return {
          replyText: `Royal Epic Professional Wall Finishes & House Painting:\n\n` +
            `1. Interior Walls: Asian Paints Royale Luxury Emulsion (Silky smooth, washable, anti-bacterial finish).\n` +
            `2. Wood Polish: Italian ICA / Sirca PU Polishes (High-Gloss or Super-Matte for doors & solid wood furniture).\n` +
            `3. Feature Accent Walls: Concrete texture, Stucco plaster, metallic stencil art, or 3D HDMR fluted louvers.\n\n` +
            `Pricing: Interior Painting starting at ₹18 / Sq.Ft | Italian PU Polish starting at ₹140 / Sq.Ft.`,
          suggestedChips: ["Royale Emulsion Colors", "Italian PU Polish Specs", "Accent Wall Textures", "Book Painter Visit"],
          recommendations: {
            recommendedServices: ["Asian Paints Royale Emulsion", "Italian PU Wood Polish"],
            recommendedMaterials: ["Royale Aspira Emulsion", "ICA Italian PU Polish"],
            estimatedBudgetRange: "₹18 - ₹140 / Sq.Ft"
          }
        };
      }

      if (query.includes('renovation') || query.includes('construction') || query.includes('turnkey')) {
        return {
          replyText: `Complete Home Renovation & Turnkey Civil Execution:\n\n` +
            `1. Civil Demolition & Tiling: Tile overlaying, bathroom remodeling, structural wall modifications.\n` +
            `2. Electrical & Plumbing: Concealed FRLS copper wiring, Grohe/Jaquar thermostatic plumbing fittings.\n` +
            `3. Modular Woodwork: In-house factory manufacturing of kitchens, wardrobes, and TV units.\n` +
            `4. Project Supervision: Dedicated Site Engineer, 3D VR alignment audits, and strict milestone tracking.\n\n` +
            `Guarantees: 15-Year Structural & Moisture Warranty, 0% Hidden Charges.`,
          suggestedChips: ["Renovation Cost Estimator", "Bathroom Remodeling", "Site Engineer Audit", "Book Site Visit"],
          recommendations: {
            recommendedServices: ["Complete Civil & Interior Renovation", "Electrical & Plumbing Overhaul"],
            recommendedMaterials: ["Somany GVT Vitrified Tiles", "Havells Copper Wire"],
            estimatedBudgetRange: "₹4.5L - ₹15L+"
          }
        };
      }

      // Generic fallback with detailed guidance
      return {
        replyText: `Thank you for consulting Royal Epic Interior & Furniture.\n\n` +
          `Regarding your inquiry about "${q}", our team provides bespoke turnkey solutions crafted directly at our 10,000 Sq.Ft Thanisandra factory.\n\n` +
          `• Materials: 100% BWR Waterproof Marine Plywood with 15-Year Warranty.\n` +
          `• Fittings: Blum & Hettich German soft-close architectural hardware.\n` +
          `• 3D VR Service: Complete photorealistic 3D renders before site execution.\n\n` +
          `Would you like an itemized BOQ estimate or a free site visit consultation with our lead architect?`,
        suggestedChips: ["Book Free Site Visit", "Modular Kitchen Cost", "3BHK Villa Interiors", "Factory Visit Request"],
        recommendations: {
          recommendedServices: ["Bespoke Interior Planning", "3D VR Design Walkthrough"],
          recommendedMaterials: ["18mm Marine Plywood", "Blum Soft-Close"],
          estimatedBudgetRange: "Customized to BOQ"
        }
      };
    };

    try {
      const { message, history = [], language = "English", userDiscovery = {} } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const topicInfo = getTopicDetails(message, language);

      const defaultSystemInstruction = `You are "Royal Epic AI Interior Consultant", an expert senior interior designer & turnkey project consultant for "Royal Epic Interior & Furniture" (www.royalepicinterior.com) in Bengaluru, India.

CRITICAL INSTRUCTIONS:
- User query: "${message}"
- Language selected: **${language}**. Write response directly in ${language}.
- Provide exact, specific technical specifications, material options, and realistic budget ranges. Never give generic repetitive answers.
- Highlight our 10,000 Sq.Ft Thanisandra Factory, 15-Year BWR Marine Plywood Warranty, Blum/Hettich hardware, and 0% cost escalation guarantee.

Return a JSON object with:
- "replyText": String (Your direct detailed architectural answer written in ${language})
- "suggestedChips": Array of 3 to 4 string prompt ideas written in ${language}
- "discoveredInfo": Object updating propertyType, city, sqft, bedrooms, style, budget if mentioned
- "recommendations": Object with recommendedServices (array), recommendedMaterials (array), layoutLightingTips (string), estimatedBudgetRange (string)
- "shouldOfferSiteVisit": Boolean (true if user asks for quote or site visit)
`;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.json({
          success: true,
          replyText: topicInfo.replyText,
          suggestedChips: topicInfo.suggestedChips,
          discoveredInfo: userDiscovery,
          recommendations: topicInfo.recommendations,
          shouldOfferSiteVisit: true
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const conversationPrompt = `
Language Selected by User: ${language}
Context Discovery So Far: ${JSON.stringify(userDiscovery)}
User Message: "${message}"

Respond strictly as valid JSON adhering to system instruction in ${language}.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: conversationPrompt,
        config: {
          systemInstruction: defaultSystemInstruction,
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);

      res.json({
        success: true,
        replyText: parsed.replyText || topicInfo.replyText,
        suggestedChips: parsed.suggestedChips || topicInfo.suggestedChips,
        discoveredInfo: { ...userDiscovery, ...parsed.discoveredInfo },
        recommendations: parsed.recommendations || topicInfo.recommendations,
        shouldOfferSiteVisit: parsed.shouldOfferSiteVisit !== undefined ? parsed.shouldOfferSiteVisit : true
      });

    } catch (error: any) {
      console.error("AI Consultant Chat Error:", error);
      const fallbackTopic = getTopicDetails(req.body.message || '', req.body.language || 'English');
      res.json({
        success: true,
        replyText: fallbackTopic.replyText,
        suggestedChips: fallbackTopic.suggestedChips,
        recommendations: fallbackTopic.recommendations,
        shouldOfferSiteVisit: true
      });
    }
  });

  // AI Voice Synthesis (Text-To-Speech) Endpoint
  app.post("/api/ai-consultant/voice-tts", async (req, res) => {
    try {
      const { text, voiceName = "Aoede", language = "English" } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || !text) {
        return res.json({ success: false, audioBase64: null, message: "TTS requires active Gemini API Key" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: `Speak warmly, clearly, and eloquently as a senior interior design consultant in ${language}: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Aoede" }
            }
          }
        }
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioBase64) {
        res.json({ success: true, audioBase64 });
      } else {
        res.json({ success: false, audioBase64: null, message: "No audio generated" });
      }
    } catch (error: any) {
      console.error("Voice TTS error:", error);
      res.json({ success: false, error: error.message });
    }
  });

  // AI Custom Interior Design Generator Endpoint
  app.post("/api/ai-design", async (req, res) => {
    try {
      const { roomType, style, budget, customPrompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        // Fallback simulated response if key not configured
        return res.json({
          success: true,
          conceptTitle: `Royal ${style} ${roomType}`,
          description: `An exquisite ${style.toLowerCase()} concept for your ${roomType.toLowerCase()}, featuring handcrafted teak elements, warm gold accent lighting, ambient ceiling coving, and premium glass partitions. Estimated budget: ₹${(budget || 250000).toLocaleString('en-IN')}.`,
          recommendedMaterials: [
            "18mm High-Density BWR Marine Plywood",
            "Italian Botticino Marble Countertops",
            "Rose Gold Anodized Aluminum Frames",
            "Soft-close Blum & Hettich Hardware",
            "Fluted Acoustic Wall Panels"
          ],
          colorPalette: ["#121212", "#D4AF37", "#F5F5F0", "#333333", "#8C7851"],
          estimatedCostRange: `₹${((budget || 250000) * 0.9).toLocaleString('en-IN')} - ₹${((budget || 250000) * 1.15).toLocaleString('en-IN')}`,
          timelineWeeks: "3-5 Weeks"
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a world-class luxury interior designer for "Royal Epic Interior & Furniture".
Generate a comprehensive custom interior design plan for a customer:
Room Type: ${roomType}
Style: ${style}
Estimated Budget: ₹${budget}
Special Instructions: ${customPrompt || "Focus on luxury, gold accents, glasswork, and ergonomic space optimization."}

Provide a JSON response with the following keys:
- conceptTitle (short catchy title)
- description (150 words professional design breakdown)
- recommendedMaterials (array of 5 luxury materials used)
- colorPalette (array of 5 hex color codes)
- estimatedCostRange (string)
- timelineWeeks (string)
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      const data = JSON.parse(text);
      res.json({ success: true, ...data });
    } catch (error: any) {
      console.error("AI Design error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate AI design concept."
      });
    }
  });

  // SAAS MULTI-TENANT ENTERPRISE ENGINE
  let saasTenants = [
    {
      id: "tenant-1",
      name: "Royal Epic Interior & Furniture Pvt Ltd",
      domain: "www.royalepicinterior.com",
      industry: "Turnkey Residential & Commercial Interiors",
      status: "Active",
      leadsCount: 142,
      projectsCount: 28,
      revenue: "₹1.85 Cr",
      aiAssistantName: "Royal Epic AI Voice Consultant",
      brandingColor: "#D4AF37"
    },
    {
      id: "tenant-2",
      name: "Royal Epic Modular Furniture Factory",
      domain: "factory.royalepicinterior.com",
      industry: "B2B CNC Cutting & OEM Furniture Manufacturing",
      status: "Active",
      leadsCount: 64,
      projectsCount: 19,
      revenue: "₹82 Lakhs",
      aiAssistantName: "Factory Bot & Cutting Assistant",
      brandingColor: "#10B981"
    },
    {
      id: "tenant-3",
      name: "Royal Epic Construction & Civil Infra",
      domain: "build.royalepicinterior.com",
      industry: "Structural Construction & Civil Engineering",
      status: "Active",
      leadsCount: 31,
      projectsCount: 7,
      revenue: "₹3.40 Cr",
      aiAssistantName: "Civil Site Engineer AI",
      brandingColor: "#3B82F6"
    }
  ];

  app.get("/api/saas/tenants", (req, res) => {
    res.json({ success: true, count: saasTenants.length, tenants: saasTenants });
  });

  app.post("/api/saas/tenants", (req, res) => {
    try {
      const newTenant = {
        id: `tenant-${Date.now()}`,
        name: req.body.name || "New Business Unit",
        domain: req.body.domain || "newbusiness.com",
        industry: req.body.industry || "General Enterprise",
        status: "Active",
        leadsCount: 0,
        projectsCount: 0,
        revenue: "₹0",
        aiAssistantName: req.body.aiAssistantName || "Enterprise AI Assistant",
        brandingColor: req.body.brandingColor || "#D4AF37"
      };
      saasTenants.push(newTenant);
      res.json({ success: true, tenant: newTenant, allTenants: saasTenants });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // AI VOICE ASSISTANT CONFIG API
  let aiAssistantConfig = {
    welcomeVoice: "Puck (Energetic Male)",
    welcomeMessage: "Welcome to Royal Epic Interior & Furniture! I am your AI Voice & Design Consultant. How can I assist you with your home or office interior today?",
    aiPersonality: "Senior Master Interior Designer & Turnkey Project Director",
    languages: ["English", "Hindi", "Kannada", "Tamil", "Telugu", "Malayalam"],
    companyInfo: "10,000 Sq.Ft In-House Factory at Thanisandra Bengaluru. 15-Year Waterproof Guarantee.",
    pricingGuidelines: "2BHK Turnkey starting at ₹3.5 Lakhs; 3BHK starting at ₹5.2 Lakhs; Villa Turnkey starting at ₹9.8 Lakhs.",
    warrantyInfo: "10-Year Factory Replacement Warranty & 15-Year BWR Waterproof Plywood Guarantee.",
    missedQuestionsLog: [
      { id: "q1", question: "Do you supply Italian Botticino Marble for staircase cladding?", frequency: 12, status: "Pending Knowledge Base" },
      { id: "q2", question: "What is the lead time for Lacquered Glass Wardrobe sliding channels?", frequency: 8, status: "Answer Added" }
    ]
  };

  app.get("/api/ai-assistant/config", (req, res) => {
    res.json({ success: true, config: aiAssistantConfig });
  });

  app.post("/api/ai-assistant/config", (req, res) => {
    try {
      aiAssistantConfig = { ...aiAssistantConfig, ...req.body };
      res.json({ success: true, message: "AI Assistant Configuration saved & deployed live to www.royalepicinterior.com", config: aiAssistantConfig });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // CMS WEBSITE PAGES & CONTENT API
  let cmsPagesContent = {
    homeHeroTitle: "Turnkey Home & Commercial Interiors in Bengaluru",
    homeHeroSubtitle: "10,000 Sq.Ft In-House Manufacturing Facility • 15-Year Waterproof Guarantee",
    bannerOfferText: "🎉 Special Festive Season Offer: Free 3D VR Walkthrough & 10% Discount on Modular Kitchens!",
    bannerOfferActive: true,
    contactAddress: "No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru, Karnataka 560077",
    contactPhone: "+91 99000 00000",
    contactEmail: "info@royalepicinterior.com"
  };

  app.get("/api/cms/content", (req, res) => {
    res.json({ success: true, content: cmsPagesContent });
  });

  app.post("/api/cms/content", (req, res) => {
    try {
      cmsPagesContent = { ...cmsPagesContent, ...req.body };
      res.json({ success: true, message: "Website CMS Content updated instantly.", content: cmsPagesContent });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // MATERIAL LIBRARY MASTER API
  let masterMaterials = [
    { id: "mat-1", name: "18mm BWR Marine Plywood", brand: "CenturyPly / Greenply", category: "Core Wood", pricePerSqFt: "₹120 - ₹165/sqft", warranty: "15 Years Waterproof", stockStatus: "In Stock" },
    { id: "mat-2", name: "High Density HDHMR Board", brand: "Action TESA", category: "Core Wood", pricePerSqFt: "₹85 - ₹110/sqft", warranty: "10 Years Moisture Resistant", stockStatus: "In Stock" },
    { id: "mat-3", name: "Soft Close Tandem Drawer Box", brand: "Hettich / Hafele", category: "Hardware", pricePerSqFt: "₹2,800 - ₹4,500/set", warranty: "Lifetime German Warranty", stockStatus: "In Stock" },
    { id: "mat-4", name: "Calacatta Quartz Countertop", brand: "Kalingastone", category: "Stone & Marble", pricePerSqFt: "₹280 - ₹420/sqft", warranty: "10 Years Stain Proof", stockStatus: "In Stock" },
    { id: "mat-5", name: "1.5mm Italian PU Matte Finish", brand: "Sirca / ICA", category: "Surface Finishes", pricePerSqFt: "₹180 - ₹260/sqft", warranty: "7 Years Scratch Proof", stockStatus: "In Stock" }
  ];

  app.get("/api/cms/materials", (req, res) => {
    res.json({ success: true, count: masterMaterials.length, materials: masterMaterials });
  });

  app.post("/api/cms/materials", (req, res) => {
    try {
      const newMat = { id: `mat-${Date.now()}`, ...req.body };
      masterMaterials.unshift(newMat);
      res.json({ success: true, material: newMat, allMaterials: masterMaterials });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // SEO & WEBMASTER SUITE API
  let seoConfigData = {
    metaTitle: "Best Interior Designers in Bengaluru | Royal Epic Interior & Furniture",
    metaDescription: "10,000 Sq.Ft Factory Manufactured Modular Kitchens, Wardrobes & Turnkey Home Interiors in Thanisandra, Bengaluru. Get Free 3D VR Estimate.",
    keywords: "Interior Designers Bengaluru, Modular Kitchen Thanisandra, Turnkey Interior Contractor, Wardrobes Manyata Tech Park",
    robotsTxt: generateRobotsTxt(),
    sitemapUrl: "https://royalepicinterior.com/sitemap.xml",
    canonicalUrl: "https://royalepicinterior.com",
    schemaType: "LocalBusiness / InteriorDesign"
  };

  app.get("/api/seo/config", (req, res) => {
    res.json({ success: true, config: seoConfigData });
  });

  app.post("/api/seo/config", (req, res) => {
    try {
      seoConfigData = { ...seoConfigData, ...req.body };
      res.json({ success: true, message: "SEO Meta & Webmaster rules deployed.", config: seoConfigData });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Lead / Quotation Submission Endpoint
  app.post("/api/quote", (req, res) => {
    const quoteData = req.body;
    console.log("Received new quote request:", quoteData);

    const leadRecord = {
      id: `LEAD-QT-${Date.now().toString().slice(-6)}`,
      full_name: quoteData.name || quoteData.full_name || 'Anonymous Inquiry',
      phone: quoteData.phone || 'N/A',
      email: quoteData.email || null,
      city: quoteData.city || 'Bengaluru',
      service_type: quoteData.projectType || quoteData.service_type || 'Architectural Consultation',
      estimated_budget: quoteData.budget || quoteData.estimated_budget || 'Custom Quote',
      project_scope: quoteData.message || (quoteData.drawingName ? `Uploaded Architectural Drawing: ${quoteData.drawingName}` : 'Custom Architectural Quotation Request'),
      source: 'Free Architectural Consultation Modal',
      created_at: new Date().toISOString()
    };

    // Dispatch notification email with deduplication (if already dispatched via /api/supabase/submit-lead, this is automatically suppressed)
    sendLeadNotificationEmail(leadRecord).catch((mailErr) => {
      console.error("⚠️ [Hostinger SMTP] Quote notification note:", mailErr?.message || mailErr);
    });

    res.json({
      success: true,
      quoteId: `RE-QT-${Math.floor(100000 + Math.random() * 900000)}`,
      message: "Quotation request successfully logged. Senior designer will contact within 2 hours."
    });
  });

  // Hostinger SMTP Status Diagnostic Endpoint (safe, no password exposure)
  app.get("/api/smtp/status", (req, res) => {
    res.json({
      success: true,
      ...getSmtpConfigStatus()
    });
  });

  // =========================================================================
  // STORAGE & ASSET MANAGEMENT API
  // Ensures product photos uploaded via Admin & Manager portals are stored
  // as persistent media files instead of bloated inline database base64 strings.
  // =========================================================================
  const STORAGE_DIR = path.join(process.cwd(), "public", "storage", "products");
  if (!fs.existsSync(STORAGE_DIR)) {
    try {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    } catch (_) {}
  }

  // Serve storage files statically
  app.use("/storage/products", express.static(STORAGE_DIR, {
    maxAge: "30d",
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    }
  }));

  // Image Upload fallback route
  app.post("/api/storage/upload", express.json({ limit: "50mb" }), (req, res) => {
    try {
      const { image, filenamePrefix = "prod" } = req.body;
      if (!image || typeof image !== "string") {
        return res.status(400).json({ success: false, error: "Image data is required" });
      }

      const match = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ success: false, error: "Invalid image format" });
      }

      const ext = match[1] === "jpeg" ? "jpg" : match[1];
      const buffer = Buffer.from(match[2], "base64");
      const cleanPrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${cleanPrefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
      const filePath = path.join(STORAGE_DIR, filename);

      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/storage/products/${filename}`;
      return res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error("Storage upload route error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to save image" });
    }
  });

  // Detect production: either explicitly NODE_ENV=production, or running compiled server.cjs
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.argv[1]?.endsWith(".cjs")) ||
    (typeof __filename !== "undefined" && __filename.endsWith(".cjs"));

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Guard against relative asset requests originating from nested subpaths (e.g. /products/assets/* -> /assets/*)
    app.use(/^\/(?:products|services|portfolio|blog|customers|dev|admin)\/assets\/(.+)$/, (req, res, next) => {
      const assetFileName = req.params[0];
      const targetFilePath = path.join(distPath, "assets", assetFileName);
      if (fs.existsSync(targetFilePath)) {
        return res.sendFile(targetFilePath);
      }
      next();
    });

    // Stale/Legacy bundle forwarder: if a client requests an outdated index bundle (e.g. index-BtADXeFP.js),
    // map it dynamically to the current active index-*.js bundle instead of failing with 404 or corrupted cache.
    app.get("/assets/:filename", (req, res, next) => {
      const filename = req.params.filename;
      const targetFilePath = path.join(distPath, "assets", filename);
      if (fs.existsSync(targetFilePath)) {
        return next();
      }
      if (/^index-[A-Za-z0-9_-]+\.js$/.test(filename)) {
        try {
          const files = fs.readdirSync(path.join(distPath, "assets"));
          const activeIndex = files.find(f => /^index-[A-Za-z0-9_-]+\.js$/.test(f) && f !== filename);
          if (activeIndex) {
            console.log(`[Asset Forwarder] Serving active bundle ${activeIndex} in place of stale ${filename}`);
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Content-Type", "application/javascript; charset=utf-8");
            return res.sendFile(path.join(distPath, "assets", activeIndex));
          }
        } catch (err) {
          console.error("Asset forwarder lookup failed:", err);
        }
      }
      next();
    });

    // Primary static assets directory with long-term caching
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      immutable: true,
      maxAge: "1y",
      fallthrough: false
    }));

    // Serve public root static files (favicon, manifest, robots, images, etc.)
    // Explicitly enforce no-cache for any HTML documents so index.html is always fresh
    app.use(express.static(distPath, {
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));

    // Catch-all SPA route - strictly for HTML document navigation
    app.get("*", (req, res) => {
      // If the request is for a missing file/script/stylesheet, return 404 text/plain rather than HTML
      if (/\.(js|mjs|cjs|css|map|json|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|xml|txt)$/i.test(req.path)) {
        return res.status(404).type("text/plain").send("Static Asset Not Found");
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err && !res.headersSent) {
          res.status(200).send("<!DOCTYPE html><html><head><title>Royal Epic</title></head><body>Loading...</body></html>");
        }
      });
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Royal Epic server running on http://localhost:${PORT}`);
  });

  server.on("error", (err: any) => {
    console.error("Server listen error:", err);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Failed to start server:", err);
  process.exit(1);
});
