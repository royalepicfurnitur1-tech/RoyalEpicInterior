export interface ProductVariation {
  id: string;
  sku: string;
  name?: string;
  size?: string;
  color?: string;
  material?: string;
  finish?: string;
  customAttributes?: Record<string, string>;
  price: number;
  discountPrice?: number;
  stock: number;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  category: string;
  categorySlug: string;
  subCategory?: string;
  price: number;
  originalPrice: number;
  discount: number; // percentage
  discountPrice?: number;
  taxGst?: number; // GST percentage (e.g. 18)
  stockQuantity?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  galleryImages: string[];
  shortDescription?: string;
  description: string;
  dimensions?: string;
  material?: string;
  finish?: string;
  specifications?: {
    material?: string;
    size?: string;
    finish?: string;
    warranty?: string;
    brand?: string;
    origin?: string;
    hardware?: string;
    dimensions?: string;
    [key: string]: any;
  };
  features: string[];
  attributes?: Record<string, string[]>;
  variations?: ProductVariation[];
  isHot?: boolean;
  isNew?: boolean;
  has3dViewer?: boolean;
  has360View?: boolean;
  inStock: boolean;
  status?: 'Active' | 'Inactive' | 'Draft';
  brochureUrl?: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  iconName: string;
  description: string;
  image: string;
  subservices: string[];
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: 'Residential' | 'Commercial' | 'Modular Kitchen' | 'Hospitality' | 'Architectural';
  location: string;
  areaSqFt: number;
  completionTime: string;
  beforeImage: string;
  afterImage: string;
  clientName: string;
  clientReview: string;
  clientRating: number;
  gallery: string[];
  has3dWalkthrough?: boolean;
}

export interface CartItem {
  id?: string;
  cartId?: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  customSize?: string;
  selectedVariation?: ProductVariation;
  selectedAttributes?: Record<string, string>;
  unitPrice?: number;
}

export interface DbCart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbCartItem {
  id: string;
  cart_id: string;
  user_id: string;
  product_id: string;
  variation_id?: string | null;
  product_name_snapshot: string;
  product_image_snapshot: string;
  selected_attributes?: Record<string, string>;
  selected_variation?: ProductVariation | null;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface OrderTimelineStep {
  status: string;
  date: string;
  time: string;
  remarks?: string;
  completed: boolean;
  current: boolean;
}

export interface QuotationRequest {
  id?: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  projectType: string;
  budget: string;
  message: string;
  roomTypes?: string[];
  floorPlanUrl?: string;
  createdAt?: string;
}

export interface CustomAiDesignResult {
  conceptTitle: string;
  description: string;
  recommendedMaterials: string[];
  colorPalette: string[];
  estimatedCostRange: string;
  timelineWeeks: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
}

export interface KitchenEquipmentItem {
  id: string;
  name: string;
  specification: string;
  unit: string;
  priceRange: string;
  priceMin: number;
  priceMax: number;
  warranty: string;
  category: string;
  image: string;
}

export interface ProjectMilestone {
  id: string;
  stageNumber: number;
  title: string;
  category: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'delayed';
  startDate: string;
  completedDate?: string;
  targetDate: string;
  description: string;
  department: string;
  assignedPerson: string;
  deliverables: string[];
  progressPercent: number;
  notes?: string;
}

export interface WebsiteFeedback {
  id?: string;
  name: string;
  email?: string | null;
  rating: number;
  message: string;
  created_at?: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface CustomerReview {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  rating: number;
  review_title?: string | null;
  title?: string | null;
  review_message: string;
  message?: string | null;
  project_type?: string | null;
  service_type?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  status: ReviewStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
  helpful_count?: number;
  is_verified_buyer?: boolean;
  verified_purchase?: boolean;
}

export interface SubmitReviewPayload {
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  rating: number;
  review_title?: string;
  title?: string;
  review_message?: string;
  message?: string;
  project_type?: string;
  service_type?: string;
  product_id?: string;
  product_name?: string;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface DbOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state?: string;
    pincode: string;
  };
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
  items?: DbOrderItem[];
  payments?: DbPayment[];
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface DbPayment {
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

export type ActiveTab = 
  | 'home' 
  | 'services' 
  | 'products' 
  | 'portfolio' 
  | 'custom-quote'
  | 'gallery'
  | 'blog' 
  | 'contact' 
  | 'track-order'
  | 'dashboard' 
  | 'admin'
  | 'developer'
  | 'customers'
  | 'product-manager'
  | 'product-management';

