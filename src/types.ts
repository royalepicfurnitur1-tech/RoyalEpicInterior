export interface Product {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice: number;
  discount: number; // percentage
  rating: number;
  reviewsCount: number;
  image: string;
  galleryImages: string[];
  description: string;
  specifications: {
    material: string;
    size: string;
    finish: string;
    warranty: string;
    brand: string;
    origin: string;
  };
  features: string[];
  isHot?: boolean;
  isNew?: boolean;
  has3dViewer?: boolean;
  has360View?: boolean;
  inStock: boolean;
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
  | 'ai-design' 
  | 'estimator'
  | 'custom-quote'
  | 'gallery'
  | 'blog' 
  | 'contact' 
  | 'dashboard' 
  | 'admin'
  | 'developer'
  | 'customers';
