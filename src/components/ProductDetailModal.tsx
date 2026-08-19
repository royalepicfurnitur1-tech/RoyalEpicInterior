import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Product, ProductVariation } from '../types';
import { 
  X, Box, Rotate3d, Heart, ShoppingBag, Download, MessageSquare, 
  Phone, CheckCircle2, ShieldCheck, Sparkles, Truck, FileText,
  Smartphone, Camera, Scan, Maximize2, Layers, Move, RefreshCw, Tag, Layers3
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variation?: ProductVariation, selectedAttributes?: Record<string, string>) => void;
  onBuyNow: (product: Product, variation?: ProductVariation, selectedAttributes?: Record<string, string>) => void;
  onRequestQuote: (productName: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  onRequestQuote,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | '3d-viewer' | '360-degree' | 'ar-preview'>('gallery');
  const [selectedImage, setSelectedImage] = useState<string>(product?.image || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [arScale, setArScale] = useState<number>(100);
  const [arScanning, setArScanning] = useState<boolean>(false);

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

  // Reset/sync when product changes
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
    const width = container.clientWidth;
    const height = container.clientHeight;

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

    // Central 3D Product Geometric Proxy (Door / Cabinet / Sofa / Table)
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

  if (!product) return null;

  // Current effective price and SKU
  const currentPrice = selectedVariation ? (selectedVariation.discountPrice || selectedVariation.price) : (product.price || 0);
  const currentOriginalPrice = selectedVariation ? selectedVariation.price : (product.originalPrice || currentPrice);
  const currentSku = selectedVariation?.sku || product.sku || `RE-SKU-${product.id}`;
  const currentStock = selectedVariation?.stock !== undefined ? selectedVariation.stock : (product.stockQuantity || 10);

  const handleDownloadBrochure = () => {
    const blob = new Blob(
      [`ROYAL EPIC INTERIOR & FURNITURE\nProduct Specification & Brochure: ${product.name}\nSKU: ${currentSku}\n\nPrice: ₹${(currentPrice || 0).toLocaleString('en-IN')}\nMaterial: ${product.specifications?.material || product.material || 'Factory Plywood'}\nWarranty: ${product.specifications?.warranty || '15 Years Factory Warranty'}\nContact: +91 99166 33338`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Royal_Epic_${(product.name || 'product').replace(/\s+/g, '_')}_Brochure.txt`;
    a.click();
  };

  const handleStartArScan = () => {
    setArScanning(true);
    setTimeout(() => {
      setArScanning(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          
          {/* Left Column: Interactive Visual Showcase */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* View Mode Switcher Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'gallery' ? 'bg-gold text-black shadow-md' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" /> High-Res Gallery
              </button>
              <button
                onClick={() => setActiveTab('3d-viewer')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === '3d-viewer' ? 'bg-gold text-black shadow-md' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Rotate3d className="w-3.5 h-3.5" /> 3D Orbit View
              </button>
              <button
                onClick={() => setActiveTab('ar-preview')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'ar-preview' ? 'bg-gold text-black shadow-md' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-500" /> AR Live Scan
              </button>
            </div>

            {/* Display Stage Container */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
              
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
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono text-neutral-300 pointer-events-none">
                    Click image to toggle 1.5x zoom
                  </div>
                </div>
              )}

              {/* Three.js 3D WebGL Model View */}
              {activeTab === '3d-viewer' && (
                <div className="relative w-full h-full">
                  <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono text-gold pointer-events-none flex items-center gap-1.5">
                    <Rotate3d className="w-3.5 h-3.5 text-gold animate-spin" /> Click & drag to rotate 3D mesh
                  </div>
                </div>
              )}

              {/* AR Augmented Reality Space Scanner Simulator */}
              {activeTab === 'ar-preview' && (
                <div className="relative w-full h-full flex flex-col justify-between p-4 overflow-hidden">
                  
                  {/* AR Camera Viewfinder Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                  
                  {/* Viewfinder Reticle */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gold pointer-events-none" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gold pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gold pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gold pointer-events-none" />

                  {/* Top Status Header */}
                  <div className="relative z-10 flex items-center justify-between bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[11px] font-mono font-bold text-neutral-200">
                        {arScanning ? 'Detecting Floor Plane...' : 'Surface Locked (Bengaluru Living Room)'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
                      Scale: 1:1
                    </span>
                  </div>

                  {/* AR Projected Object in Real Space */}
                  <div className="relative z-10 flex-1 flex items-center justify-center my-4">
                    {arScanning ? (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-gold animate-spin" />
                        <p className="text-xs font-mono text-neutral-300">Point phone camera at floor...</p>
                      </div>
                    ) : (
                      <div className="relative group flex items-center justify-center">
                        <div className="absolute bottom-[-10px] w-56 h-28 bg-gold/10 border border-gold/30 rounded-[50%] rotate-x-60 blur-[1px] shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
                        <img
                          src={selectedImage}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          style={{ transform: `scale(${arScale / 100})` }}
                          className="max-h-48 object-contain transition-transform duration-200 drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] relative z-10"
                        />
                        <div className="absolute bottom-[-24px] z-20 bg-black/80 text-[10px] font-mono text-gold px-2 py-0.5 rounded-full border border-gold/40 flex items-center gap-1 shadow-md">
                          <Move className="w-3 h-3" /> Tap & drag to reposition piece
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AR Interactive Controls Toolbar */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-400 text-[10px] font-mono">Model Scale:</span>
                      <button
                        onClick={() => setArScale(Math.max(50, arScale - 10))}
                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold text-gold w-8 text-center">{arScale}%</span>
                      <button
                        onClick={() => setArScale(Math.min(150, arScale + 10))}
                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleStartArScan}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-mono font-bold text-neutral-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Scan className="w-3 h-3 text-gold" /> Re-scan Floor
                      </button>
                      <a
                        href={`https://wa.me/919916633338?text=Hi%20Royal%20Epic,%20I%20want%20an%20AR%20Site%20Consultation%20for%20${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-gold hover:bg-amber-400 text-black rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <Camera className="w-3 h-3" /> Book AR Site Scan
                      </a>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Thumbnail Gallery Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {[product.image, ...(product.galleryImages || [])].map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedImage(img);
                    setActiveTab('gallery');
                  }}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImage === img ? 'border-gold shadow-[0_0_10px_#d4af37]' : 'border-white/10 hover:border-white/40'
                  }`}
                >
                  <img
                    src={img}
                    alt="Thumbnail"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

          </div>

          {/* Right Column: Specifications, Variations, Price & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-gold font-mono">
                    {product.category}
                  </span>
                  {product.subCategory && (
                    <span className="text-[10px] font-semibold text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {product.subCategory}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`p-2 rounded-full border transition-all cursor-pointer ${
                    isWishlisted ? 'bg-red-500 text-white border-red-500' : 'bg-white/5 border-white/20 text-neutral-300 hover:text-red-400'
                  }`}
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>

              <h2 className="text-2xl font-serif font-bold text-white mb-1">
                {product.name}
              </h2>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-gold" /> SKU: <strong className="text-white">{currentSku}</strong>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  currentStock > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'
                }`}>
                  {currentStock > 0 ? `In Stock (${currentStock} Units)` : 'Made to Order'}
                </span>
              </div>

              {/* Price & Discount */}
              <div className="flex items-baseline gap-3 mb-4 p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-2xl font-mono font-bold text-gold">
                  ₹{(currentPrice * quantity).toLocaleString('en-IN')}
                </span>
                {currentOriginalPrice > currentPrice && (
                  <span className="text-xs text-neutral-500 line-through font-mono">
                    ₹{(currentOriginalPrice * quantity).toLocaleString('en-IN')}
                  </span>
                )}
                {product.taxGst && (
                  <span className="text-[10px] font-mono text-neutral-400 ml-1">
                    (incl. {product.taxGst}% GST)
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="ml-auto text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    Save {product.discount}%
                  </span>
                )}
              </div>

              {/* Product Short Description */}
              {(product.shortDescription || product.description) && (
                <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                  {product.shortDescription || product.description}
                </p>
              )}

              {/* Product Variations Selector (If Available) */}
              {product.variations && product.variations.length > 0 && (
                <div className="mb-5 p-3 rounded-2xl bg-black/40 border border-white/10">
                  <label className="block text-[11px] font-bold uppercase text-gold tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers3 className="w-3.5 h-3.5" /> Select Variation / Size & Finish:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {product.variations.map((v) => {
                      const isSelected = selectedVariation?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariation(v);
                            if (v.image) setSelectedImage(v.image);
                          }}
                          className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-gold/15 border-gold shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                              : 'bg-black/30 border-white/10 hover:border-white/30 text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {v.image && (
                              <img src={v.image} alt={v.name || v.sku} className="w-8 h-8 rounded-lg object-cover" />
                            )}
                            <div>
                              <p className={`text-xs font-bold ${isSelected ? 'text-gold' : 'text-white'}`}>
                                {v.name || `${v.size || ''} ${v.finish ? `• ${v.finish}` : ''} ${v.color ? `• ${v.color}` : ''}`}
                              </p>
                              <span className="text-[10px] font-mono text-neutral-400">SKU: {v.sku}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-gold">
                              ₹{(v.discountPrice || v.price).toLocaleString('en-IN')}
                            </span>
                            <span className="block text-[9px] text-neutral-400">Stock: {v.stock}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attributes Selectors (Size, Colour, Finish, Material) */}
              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="space-y-3 mb-5 p-3 rounded-2xl bg-black/40 border border-white/10">
                  {Object.entries(product.attributes).map(([attrName, rawValues]) => {
                    const values = Array.isArray(rawValues) ? (rawValues as string[]) : [];
                    if (values.length === 0) return null;

                    return (
                      <div key={attrName}>
                        <label className="block text-[10px] font-bold uppercase text-neutral-400 tracking-wider mb-1.5">
                          {attrName}: <span className="text-gold font-normal">{selectedAttributes[attrName] || 'None'}</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {values.map((val) => {
                            const isSelected = selectedAttributes[attrName] === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setSelectedAttributes(prev => ({ ...prev, [attrName]: val }))}
                                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-gold text-black border-gold font-bold shadow-sm'
                                    : 'bg-black/50 border-white/10 text-neutral-300 hover:border-white/30'
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Technical Specifications */}
              <div className="space-y-2 mb-5">
                <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
                  Specifications & Material
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-neutral-500 block">Material:</span>
                    <span className="font-semibold text-neutral-200">{product.material || product.specifications.material}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-neutral-500 block">Dimensions:</span>
                    <span className="font-semibold text-neutral-200">{product.dimensions || product.specifications.size}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-neutral-500 block">Finish Coating:</span>
                    <span className="font-semibold text-neutral-200">{product.finish || product.specifications.finish}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-neutral-500 block">Warranty:</span>
                    <span className="font-semibold text-gold">{product.specifications.warranty}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-black/60 border border-white/20 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-mono font-bold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => onAddToCart(product, quantity, selectedVariation || undefined, selectedAttributes)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onBuyNow(product, selectedVariation || undefined, selectedAttributes)}
                  className="py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => onRequestQuote(product.name)}
                  className="py-3 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" /> Request Quote
                </button>
              </div>

              {/* Direct Instant Contact Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleDownloadBrochure}
                  className="py-2.5 rounded-xl bg-[#f8f5ee] hover:bg-gold text-neutral-950 font-bold text-[11px] uppercase flex items-center justify-center gap-1.5 border border-gold/40 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-950" /> Download Brochure
                </button>
                <a
                  href={`https://wa.me/919916633338?text=Hi%20Royal%20Epic,%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}%20(SKU:%20${encodeURIComponent(currentSku)})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Inquiry
                </a>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

