import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Product } from '../types';
import { 
  X, Box, Rotate3d, Heart, ShoppingBag, Download, MessageSquare, 
  Phone, CheckCircle2, ShieldCheck, Sparkles, Truck, FileText,
  Smartphone, Camera, Scan, Maximize2, Layers, Move, RefreshCw
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product) => void;
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
  if (!product) return null;

  const [activeTab, setActiveTab] = useState<'gallery' | '3d-viewer' | '360-degree' | 'ar-preview'>('3d-viewer');
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [quantity, setQuantity] = useState<number>(1);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [arScale, setArScale] = useState<number>(100);
  const [arScanning, setArScanning] = useState<boolean>(false);

  // 3D Canvas Reference
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Interactive 3D Model Canvas Orbit Simulation
  useEffect(() => {
    if (activeTab !== '3d-viewer' || !canvasContainerRef.current) return;

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

  const handleDownloadBrochure = () => {
    // Generate brochure download simulation
    const blob = new Blob(
      [`ROYAL EPIC INTERIOR & FURNITURE\nProduct Brochure: ${product.name}\n\nPrice: ₹${product.price}\nMaterial: ${product.specifications.material}\nWarranty: ${product.specifications.warranty}\nContact: +91 99166 33338`],
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg overflow-y-auto">
      <div className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-5xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto relative text-white shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-black/60 border border-white/20 text-neutral-400 hover:text-white hover:border-gold transition-all cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Multi-view Media Canvas & Gallery */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            
            {/* View Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-4 bg-black/60 p-1.5 rounded-xl border border-white/10 w-fit">
              <button
                onClick={() => setActiveTab('3d-viewer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === '3d-viewer'
                    ? 'bg-gold text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" /> 3D Viewer
              </button>
              <button
                onClick={() => setActiveTab('360-degree')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === '360-degree'
                    ? 'bg-gold text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Rotate3d className="w-3.5 h-3.5" /> 360° Orbit
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'bg-gold text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                HD Gallery
              </button>
              <button
                onClick={() => setActiveTab('ar-preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  activeTab === 'ar-preview'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-300 font-extrabold shadow-lg shadow-gold/20'
                    : 'bg-amber-500/10 border-gold/40 text-gold hover:bg-gold/20'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> View in AR
              </button>
            </div>

            {/* Media Display Area */}
            <div className="relative w-full h-[340px] sm:h-[400px] rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center mb-4">
              
              {activeTab === '3d-viewer' && (
                <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
                  <div ref={canvasContainerRef} className="w-full h-full" />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-gold/30 text-[10px] font-mono text-gold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Click & Drag to Orbit 3D Model
                  </div>
                </div>
              )}

              {activeTab === '360-degree' && (
                <div className="w-full h-full relative flex items-center justify-center bg-radial from-neutral-800 to-black p-4">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain animate-spin-slow"
                  />
                  <div className="absolute bottom-3 right-3 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full text-emerald-400 text-[10px] font-mono">
                    360° Rotational View Active
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="w-full h-full relative flex items-center justify-center p-2">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className={`max-h-full max-w-full object-contain transition-transform duration-300 ${
                      isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                    }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  />
                </div>
              )}

              {/* Augmented Reality Interactive Spatial Preview */}
              {activeTab === 'ar-preview' && (
                <div className="w-full h-full relative flex flex-col justify-between p-4 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black overflow-hidden border border-gold/30">
                  {/* AR Viewfinder Camera Reticle Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                  
                  {/* Corner Target Markers */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gold/70" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gold/70" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gold/70" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gold/70" />

                  {/* Top Status Banner */}
                  <div className="relative z-10 flex items-center justify-between bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl border border-gold/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-mono font-bold text-gold">
                        AR Spatial Surface Detected
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                      1:1 Scale Mode
                    </span>
                  </div>

                  {/* Simulated AR Furniture Placement Scene */}
                  <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-2">
                    {arScanning ? (
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <RefreshCw className="w-8 h-8 text-gold animate-spin" />
                        <span className="text-xs font-mono text-gold/90">
                          Scanning room floor plane & lighting...
                        </span>
                      </div>
                    ) : (
                      <div className="relative group flex items-center justify-center">
                        {/* Floor Perspective Grid Line */}
                        <div className="absolute bottom-[-10px] w-56 h-28 bg-gold/10 border border-gold/30 rounded-[50%] rotate-x-60 blur-[1px] shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
                        
                        {/* Product Render Floating on AR Surface */}
                        <img
                          src={product.image}
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

          {/* Right Column: Specifications, Price & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold font-mono">
                  {product.category}
                </span>
                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`p-2 rounded-full border transition-all cursor-pointer ${
                    isWishlisted ? 'bg-red-500 text-white border-red-500' : 'bg-white/5 border-white/20 text-neutral-300 hover:text-red-400'
                  }`}
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>

              <h2 className="text-2xl font-serif font-bold text-white mb-3">
                {product.name}
              </h2>

              {/* Price & Discount */}
              <div className="flex items-baseline gap-3 mb-4 p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-2xl font-mono font-bold text-gold">
                  ₹{(product.price * quantity).toLocaleString('en-IN')}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-xs text-neutral-500 line-through font-mono">
                    ₹{(product.originalPrice * quantity).toLocaleString('en-IN')}
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="ml-auto text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    Save {product.discount}%
                  </span>
                )}
              </div>

              {/* Augmented Reality Feature Banner / Quick Launch Button */}
              <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-amber-950/60 via-black to-neutral-900 border border-gold/40 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gold/10 border border-gold/30 text-gold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gold block">
                      Visualize Furniture in Your Space (AR)
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      Preview 3D scale, dimensions & finish in your home
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('ar-preview')}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Scan className="w-3.5 h-3.5" /> Launch AR
                </button>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2 mb-6">
                <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
                  Specifications & Material
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-neutral-500 block">Material:</span>
                    <span className="font-semibold text-neutral-200">{product.specifications.material}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-neutral-500 block">Dimensions:</span>
                    <span className="font-semibold text-neutral-200">{product.specifications.size}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-neutral-500 block">Finish Coating:</span>
                    <span className="font-semibold text-neutral-200">{product.specifications.finish}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-neutral-500 block">Warranty:</span>
                    <span className="font-semibold text-gold">{product.specifications.warranty}</span>
                  </div>
                </div>
              </div>

              {/* Key Features List */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-2">
                  Highlight Features
                </h4>
                <div className="space-y-1.5">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              
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
                  onClick={() => onAddToCart(product, quantity)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onBuyNow(product)}
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
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleDownloadBrochure}
                  className="py-2.5 rounded-xl bg-[#f8f5ee] hover:bg-gold text-neutral-950 font-bold text-[11px] uppercase flex items-center justify-center gap-1.5 border border-gold/40 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-950" /> Download Brochure
                </button>
                <a
                  href={`https://wa.me/919916633338?text=Hi%20Royal%20Epic,%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}`}
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

