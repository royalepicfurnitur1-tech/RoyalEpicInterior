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
  specifications: {
    material: string;
    size: string;
    finish: string;
    warranty: string;
    brand: string;
    origin: string;
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
  product: Product;
  quantity: number;
  selectedColor?: string;
  customSize?: string;
  selectedVariation?: ProductVariation;
  selectedAttributes?: Record<string, string>;
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

