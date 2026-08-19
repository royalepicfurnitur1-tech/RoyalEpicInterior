import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Product, ProductVariation } from '../types';
import { getProductSlug, getCategorySlug } from '../utils/productSlug';
import { 
  Heart, ShoppingBag, Rotate3d, CheckCircle2, ShieldCheck, 
  Sparkles, Download, Phone, MessageSquare, ChevronRight,
  Maximize2, Smartphone, ArrowLeft, Layers, Truck, Award,
  Clock, RefreshCw, Star, Share2, Check
} from 'lucide-react';

interface ProductDetailPageProps {
  product: Product | null;
  allProducts: Product[];
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, quantity: number, variation?: ProductVariation, selectedAttributes?: Record<string, string>) => void;
  onBuyNow: (product: Product, variation?: ProductVariation, selectedAttributes?: Record<string, string>) => void;
  onRequestQuote: (productName: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  onNavigate,
  onAddToCart,
  onBuyNow,
  onRequestQuote,
  isWishlisted,
  onToggleWishlist
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | '3d-viewer' | 'ar-preview'>('gallery');
  const [selectedImage, setSelectedImage] = useState<string>(product?.image || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [arScanning, setArScanning] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Variations & Attributes Selection State
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(() => {
    return product?.variations && product.variations.length > 0 ? product.variations[0] : null;
  });

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product?.attributes) {
      Object.entries(product.attributes).forEach(([attrName, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          initial[attrName] = values[0];
        }
      });
    }
    return initial;
  });

  // Sync state when product changes
  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      if (product.variations && product.variations.length > 0) {
        setSelectedVariation(product.variations[0]);
        if (product.variations[0].image) {
          setSelectedImage(product.variations[0].image);
        }
      } else {
        setSelectedVariation(null);
      }
    }
  }, [product]);

  // 3D Canvas Reference
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Interactive 3D Model Canvas Orbit Simulation
  useEffect(() => {
    if (!product || activeTab !== '3d-viewer' || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xd4af37, 3, 10);
    pointLight.position.set(3, 4, 3);
    scene.add(pointLight);

    // Create 3D Furniture / Architectural Mesh Representation
    const group = new THREE.Group();

    // Metallic Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.2, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.8;
    group.add(baseMesh);

    // Central 3D Product Geometric Proxy
    let productMesh: THREE.Mesh;
    if (product.category.includes('Door')) {
      const geo = new THREE.BoxGeometry(1.2, 2.2, 0.12);
      const mat = new THREE.MeshStandardMaterial({ color: 0x8c7851, roughness: 0.4 });
      productMesh = new THREE.Mesh(geo, mat);
    } else if (product.category.includes('Kitchen') || product.category.includes('Equipment')) {
      const geo = new THREE.BoxGeometry(1.8, 1.2, 1.0);
      const mat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.8, roughness: 0.2 });
      productMesh = new THREE.Mesh(geo, mat);
    } else {
      const geo = new THREE.BoxGeometry(1.6, 1.0, 1.2);
      const mat = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.3 });
      productMesh = new THREE.Mesh(geo, mat);
    }

    productMesh.position.y = 0.2;
    group.add(productMesh);
    scene.add(group);

    // Mouse drag Orbit Controls
    let isDragging = false;
    let previousMouseX = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      group.rotation.y += deltaX * 0.01;
      previousMouseX = e.clientX;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation frame
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        group.rotation.y += 0.005; // slow idle rotation
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [activeTab, product]);

  // 404 NOT FOUND STATE
  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-6">
          <Layers className="w-10 h-10" />
        </div>
        <span className="text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase mb-2">Error 404 • Not Found</span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 mb-4">Product Not Found</h1>
        <p className="text-neutral-600 max-w-md mx-auto text-sm leading-relaxed mb-8">
          The requested product does not exist, may have been renamed, or is currently undergoing factory catalog updates.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => onNavigate('/products')}
            className="px-6 py-3 rounded-xl bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Browse All Products
          </button>
          <button
            onClick={() => onRequestQuote('Custom Product Inquiry')}
            className="px-6 py-3 rounded-xl bg-neutral-100 text-neutral-900 font-medium text-sm hover:bg-neutral-200 transition-all cursor-pointer"
          >
            Request Custom Consultation
          </button>
        </div>
      </div>
    );
  }

  // Active Effective Pricing & SKU
  const currentPrice = selectedVariation ? (selectedVariation.discountPrice || selectedVariation.price) : product.price;
  const currentOriginalPrice = selectedVariation ? selectedVariation.price : product.originalPrice;
  const currentSku = selectedVariation?.sku || product.sku || `RE-SKU-${product.id}`;
  const currentStock = selectedVariation?.stock !== undefined ? selectedVariation.stock : (product.stockQuantity || 10);
  const galleryImages = product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages : [product.image];
  const categorySlug = getCategorySlug(product.category);

  const handleDownloadBrochure = () => {
    const blob = new Blob(
      [`ROYAL EPIC INTERIOR & FURNITURE\nProduct Specification & Brochure: ${product.name}\nSKU: ${currentSku}\n\nPrice: ₹${currentPrice.toLocaleString('en-IN')}\nMaterial: ${product.specifications?.material || product.material || 'Factory Plywood'}\nWarranty: ${product.specifications?.warranty || '15 Years Factory Warranty'}\nContact: +91 99166 33338\nAddress: No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Royal_Epic_${product.name.replace(/\s+/g, '_')}_Brochure.txt`;
    a.click();
  };

  const handleStartArScan = () => {
    setArScanning(true);
    setTimeout(() => {
      setArScanning(false);
    }, 2000);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      
      {/* 1. BREADCRUMBS BAR */}
      <div className="bg-neutral-50 border-b border-neutral-200 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-neutral-500 overflow-x-auto whitespace-nowrap">
          <button 
            onClick={() => onNavigate('/')}
            className="hover:text-neutral-900 transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <button 
            onClick={() => onNavigate('/products')}
            className="hover:text-neutral-900 transition-colors cursor-pointer"
          >
            Products
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <button 
            onClick={() => onNavigate(`/products/${categorySlug}`)}
            className="hover:text-neutral-900 transition-colors cursor-pointer"
          >
            {product.category}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="font-semibold text-neutral-900 truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </div>
      </div>

      {/* 2. MAIN PRODUCT CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Visual Media Showcase & 3D Viewer */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* View Mode Switcher Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-neutral-100 border border-neutral-200">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'gallery' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" /> High-Res Gallery
              </button>
              <button
                onClick={() => setActiveTab('3d-viewer')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === '3d-viewer' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Rotate3d className="w-3.5 h-3.5 text-amber-500" /> 3D Orbit View
              </button>
              <button
                onClick={() => setActiveTab('ar-preview')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'ar-preview' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> AR Live Scan
              </button>
            </div>

            {/* Display Stage Container */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-200 shadow-xl flex items-center justify-center">
              
              {/* High-Res Image Gallery View */}
              {activeTab === 'gallery' && (
                <div className="relative w-full h-full group">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                    }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  />
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium pointer-events-none flex items-center gap-1.5">
                    <Maximize2 className="w-3 h-3" /> Click to Zoom
                  </div>
                </div>
              )}

              {/* 3D Orbit Model Canvas */}
              {activeTab === '3d-viewer' && (
                <div className="relative w-full h-full">
                  <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-neutral-900/80 backdrop-blur-md text-amber-400 border border-amber-500/20 text-xs font-mono flex items-center gap-1.5">
                    <Rotate3d className="w-3.5 h-3.5 animate-spin" /> Interactive WebGL Canvas
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-neutral-300 text-xs pointer-events-none">
                    Drag to rotate • 360° Studio Lighting
                  </div>
                </div>
              )}

              {/* AR Live View Mode */}
              {activeTab === 'ar-preview' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-900 text-white">
                  {arScanning ? (
                    <div className="flex flex-col items-center animate-pulse">
                      <Smartphone className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
                      <p className="text-sm font-semibold">Calibrating Room Floor Plane...</p>
                      <p className="text-xs text-neutral-400 mt-1">Point device camera at room surface</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 mb-4 border border-white/10">
                        <Smartphone className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold">Augmented Reality Space Preview</h4>
                      <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-6">
                        Test this {product.name} inside your room at 1:1 scale using LiDAR sensor calibration.
                      </p>
                      <button
                        onClick={handleStartArScan}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        Launch Camera AR Scanner
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(img);
                      setActiveTab('gallery');
                    }}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImage === img && activeTab === 'gallery'
                        ? 'border-neutral-900 scale-105 shadow-md'
                        : 'border-neutral-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Factory Trust & Certification Guarantee Banner */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="flex flex-col items-center p-2">
                <ShieldCheck className="w-5 h-5 text-neutral-900 mb-1" />
                <span className="text-xs font-bold text-neutral-900">15-Yr Warranty</span>
                <span className="text-[10px] text-neutral-500">Termite & Borer Proof</span>
              </div>
              <div className="flex flex-col items-center p-2">
                <Award className="w-5 h-5 text-neutral-900 mb-1" />
                <span className="text-xs font-bold text-neutral-900">ISO 9001:2025</span>
                <span className="text-[10px] text-neutral-500">Certified Facility</span>
              </div>
              <div className="flex flex-col items-center p-2">
                <Truck className="w-5 h-5 text-neutral-900 mb-1" />
                <span className="text-xs font-bold text-neutral-900">Direct Delivery</span>
                <span className="text-[10px] text-neutral-500">Safe Bengaluru Logistics</span>
              </div>
              <div className="flex flex-col items-center p-2">
                <Clock className="w-5 h-5 text-neutral-900 mb-1" />
                <span className="text-xs font-bold text-neutral-900">45-Day Delivery</span>
                <span className="text-[10px] text-neutral-500">Factory Tracked</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Details, Variations, Pricing, CTA */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Category & Status Badges */}
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wider border border-neutral-200">
                {product.category}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer relative"
                  title="Share Product"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`p-2 rounded-full border transition-all cursor-pointer ${
                    isWishlisted 
                      ? 'bg-rose-50 border-rose-200 text-rose-500' 
                      : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-rose-500'
                  }`}
                  title="Add to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Product Title (H1) */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 tracking-tight leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span className="text-xs font-bold text-neutral-900">{product.rating}</span>
                </div>
                <span className="text-xs text-neutral-400">•</span>
                <span className="text-xs text-neutral-500 font-mono">SKU: {currentSku}</span>
                <span className="text-xs text-neutral-400">•</span>
                <span className={`text-xs font-medium ${product.inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {product.inStock ? 'In Stock (Direct Factory Ready)' : 'Made to Order'}
                </span>
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-mono font-bold text-neutral-900">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
                {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                  <span className="text-base font-mono text-neutral-400 line-through">
                    ₹{currentOriginalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    Save ₹{(currentOriginalPrice - currentPrice).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                * Includes 18% GST, Factory Manufacturing, Termite-Proof Chemical Treatment & Standard Bengaluru Installation.
              </p>
            </div>

            {/* Product Short Description */}
            <p className="text-sm text-neutral-700 leading-relaxed">
              {product.description}
            </p>

            {/* Variations Selector (e.g. Dimensions / Finish) */}
            {product.variations && product.variations.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Select Dimension / Model Variation:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.variations.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariation(v);
                        if (v.image) setSelectedImage(v.image);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        selectedVariation?.id === v.id
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      <span className="text-xs font-bold">{v.name}</span>
                      <span className="text-[11px] font-mono mt-1 opacity-90">
                        ₹{(v.discountPrice || v.price).toLocaleString('en-IN')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Main Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-neutral-300 rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2.5 text-neutral-600 hover:bg-neutral-100 font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2.5 font-mono text-sm font-bold text-neutral-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3.5 py-2.5 text-neutral-600 hover:bg-neutral-100 font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => onAddToCart(product, quantity, selectedVariation || undefined, selectedAttributes)}
                  className="flex-1 py-3 px-5 rounded-xl bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onBuyNow(product, selectedVariation || undefined, selectedAttributes)}
                  className="py-3 px-4 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" /> Buy Now
                </button>
                <button
                  onClick={() => onRequestQuote(product.name)}
                  className="py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-200"
                >
                  <MessageSquare className="w-4 h-4" /> Request BOQ Quote
                </button>
              </div>
            </div>

            {/* Direct WhatsApp Consultation & Brochure */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-200">
              <a
                href="https://wa.me/919916633338?text=Hello%20Royal%20Epic%20Interior,%20I%20am%20interested%20in%20"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> WhatsApp Senior Factory Designer
              </a>

              <button
                onClick={handleDownloadBrochure}
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Specs Sheet
              </button>
            </div>
          </div>
        </div>

        {/* 3. TECHNICAL SPECIFICATIONS & DETAILS ACCORDION */}
        <div className="mt-16 pt-12 border-t border-neutral-200">
          <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-6">
            Technical Specifications & Material Engineering
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-900" /> Core Build & Material Grades
              </h3>
              <dl className="divide-y divide-neutral-200 text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-neutral-500 font-medium">Core Material</dt>
                  <dd className="font-semibold text-neutral-900">{product.specifications?.material || product.material || '18mm BWR Marine Plywood / Action TESA HDHMR'}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-neutral-500 font-medium">Hardware & Runners</dt>
                  <dd className="font-semibold text-neutral-900">{product.specifications?.hardware || 'Hettich / Hafele Soft-Close Hinges'}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-neutral-500 font-medium">Surface Finish</dt>
                  <dd className="font-semibold text-neutral-900">{product.specifications?.finish || '1.5mm Italian High Gloss Acrylic / Anti-Fingerprint PU'}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-neutral-500 font-medium">Dimensions</dt>
                  <dd className="font-semibold text-neutral-900">{product.specifications?.dimensions || 'Custom Factory Sized as per Site Blueprint'}</dd>
                </div>
              </dl>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-900" /> Warranty & Factory Support
              </h3>
              <dl className="divide-y divide-neutral-200 text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-neutral-500 font-medium">Factory Warranty</dt>
                  <dd className="font-semibold text-emerald-700">{product.specifications?.warranty || '15-Year Replacement Warranty'}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-neutral-500 font-medium">Manufacturing Plant</dt>
                  <dd className="font-semibold text-neutral-900">Rachenahalli, Thanisandra Factory, Bengaluru</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-neutral-500 font-medium">Turnaround Timeline</dt>
                  <dd className="font-semibold text-neutral-900">45 Working Days (Factory Direct)</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-neutral-500 font-medium">Installation</dt>
                  <dd className="font-semibold text-neutral-900">Complimentary Turnkey Execution by Royal Epic Carpenters</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* 4. RELATED PRODUCTS FROM SAME CATEGORY */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider">Explore More</span>
                <h2 className="text-2xl font-serif font-bold text-neutral-900">Similar Factory Creations</h2>
              </div>
              <button
                onClick={() => onNavigate(`/products/${categorySlug}`)}
                className="text-xs font-bold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 cursor-pointer"
              >
                View all {product.category} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => {
                const relSlug = getProductSlug(rel);
                return (
                  <a
                    key={rel.id}
                    href={`/products/${relSlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/products/${relSlug}`);
                    }}
                    className="group rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                      <img
                        src={rel.image}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                        {rel.category}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="font-serif font-bold text-neutral-900 text-sm group-hover:text-amber-600 transition-colors line-clamp-1">
                          {rel.name}
                        </h4>
                        <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                          {rel.shortDescription || rel.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                        <span className="font-mono font-bold text-sm text-neutral-900">
                          ₹{rel.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] font-bold text-neutral-900 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                          View Details <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
