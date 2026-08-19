import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { HERO_RING_ITEMS } from '../data/mockData';
import { ArrowRight, Sparkles, Eye, CheckCircle2, ChevronLeft, ChevronRight, Layers, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ThreeHeroRingProps {
  onSelectItem: (category: string, title: string) => void;
  onRequestQuote: (itemTitle: string) => void;
}

export const ThreeHeroRing: React.FC<ThreeHeroRingProps> = ({ onSelectItem, onRequestQuote }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isExpanding, setIsExpanding] = useState<boolean>(false);

  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ringMeshRef = useRef<THREE.Mesh | null>(null);
  const innerRingMeshRef = useRef<THREE.Mesh | null>(null);
  const particlesMeshRef = useRef<THREE.Points | null>(null);
  const lightRef = useRef<THREE.PointLight | null>(null);

  // Auto-rotate 40 images every 3.5 seconds
  useEffect(() => {
    if (!isAutoRotate || isHovered || isExpanding) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_RING_ITEMS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isAutoRotate, isHovered, isExpanding]);

  // Render static 3D frame function (no background animation running)
  const renderFrame = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  // Three.js Static Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 500;

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(50, width / (height || 1), 0.1, 1000);
      camera.position.z = 8.5;
      cameraRef.current = camera;

      // Renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'default' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xd4af37, 5, 20); // Gold Light
      pointLight.position.set(0, 0, 5);
      scene.add(pointLight);
      lightRef.current = pointLight;

      const topLight = new THREE.DirectionalLight(0xffffff, 2);
      topLight.position.set(5, 10, 7);
      scene.add(topLight);

      // 1. Primary Outer Torus Ring (Static)
      const geometry = new THREE.TorusGeometry(4.2, 0.09, 30, 200);
      const material = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x997015,
        emissiveIntensity: 0.6,
      });
      const ringMesh = new THREE.Mesh(geometry, material);
      scene.add(ringMesh);
      ringMeshRef.current = ringMesh;

      // 2. Secondary Inner Thin Gold Ring (Static)
      const innerGeometry = new THREE.TorusGeometry(3.7, 0.035, 20, 150);
      const innerMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1.0,
        roughness: 0.0,
        emissive: 0xd4af37,
        emissiveIntensity: 0.8,
      });
      const innerRingMesh = new THREE.Mesh(innerGeometry, innerMaterial);
      innerRingMesh.rotation.x = Math.PI / 4;
      scene.add(innerRingMesh);
      innerRingMeshRef.current = innerRingMesh;

      // 3. Gold Particles Ring (Static)
      const particleCount = 1400;
      const particlesGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 3.3 + Math.random() * 1.8;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.4;

        colors[i * 3] = 0.83 + Math.random() * 0.17;
        colors[i * 3 + 1] = 0.68 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.2 + Math.random() * 0.3;
      }

      particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particlesMat = new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
      scene.add(particlesMesh);
      particlesMeshRef.current = particlesMesh;

      // Continuous 3D Animation Loop
      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        if (ringMeshRef.current) {
          ringMeshRef.current.rotation.z = elapsedTime * 0.2;
          ringMeshRef.current.rotation.x = Math.sin(elapsedTime * 0.3) * 0.15;
        }

        if (innerRingMeshRef.current) {
          innerRingMeshRef.current.rotation.z = -elapsedTime * 0.35;
          innerRingMeshRef.current.rotation.y = Math.cos(elapsedTime * 0.25) * 0.2;
        }

        if (particlesMeshRef.current) {
          particlesMeshRef.current.rotation.z = elapsedTime * 0.08;
        }

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();
    } catch (e) {
      console.warn("ThreeHeroRing WebGL initialization failed (using graceful fallback):", e);
    }

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      cameraRef.current.aspect = w / (h || 1);
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (renderer) renderer.dispose();
    };
  }, []);

  // Update light & scale statically when item changes or expands
  useEffect(() => {
    if (ringMeshRef.current) {
      const targetScale = isExpanding ? 1.35 : isHovered ? 1.12 : 1.0;
      ringMeshRef.current.scale.set(targetScale, targetScale, targetScale);
    }
    if (lightRef.current) {
      lightRef.current.intensity = isHovered || isExpanding ? 8 : 4;
    }
    renderFrame();
  }, [isHovered, isExpanding, activeIndex]);

  const activeItem = HERO_RING_ITEMS[activeIndex] || HERO_RING_ITEMS[0];

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
    setIsExpanding(true);

    setTimeout(() => {
      setIsExpanding(false);
      onSelectItem(HERO_RING_ITEMS[index].category, HERO_RING_ITEMS[index].title);
    }, 600);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + HERO_RING_ITEMS.length) % HERO_RING_ITEMS.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % HERO_RING_ITEMS.length);
  };

  return (
    <div className="relative w-full min-h-[720px] lg:min-h-[840px] flex items-center justify-center overflow-hidden py-12 bg-gradient-to-b from-white via-neutral-50 to-neutral-100 text-neutral-900">
      {/* Background Static Soft Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Three.js Static Background Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 z-10 w-full h-full flex items-center justify-center pointer-events-none"
      />

      {/* Overlay Rotating Circular Ring Nodes */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 flex flex-col items-center justify-center pointer-events-none">
        
        {/* Full Width Center: 40 Images Running in 3D Circular Orbit */}
        <div className="w-full relative h-[560px] sm:h-[640px] flex items-center justify-center pointer-events-auto overflow-visible">
          
          {HERO_RING_ITEMS.map((item, index) => {
            const total = HERO_RING_ITEMS.length; // 40
            // Angle around the circular track
            const angle = ((index - activeIndex) / total) * (Math.PI * 2);
            
            // Dynamic Radii for circular orbit layout based on screen width
            const radiusX = windowWidth < 640 ? Math.min(windowWidth * 0.38, 150) : windowWidth < 1024 ? 300 : 460;
            const radiusY = windowWidth < 640 ? 80 : windowWidth < 1024 ? 140 : 200;
            const x = Math.sin(angle) * radiusX;
            const y = Math.cos(angle) * radiusY;

            // Distance factor relative to active front node
            const normalizedAngle = Math.atan2(Math.sin(angle), Math.cos(angle)); // -PI to PI
            const distFromFront = Math.abs(normalizedAngle);

            const isCurrent = index === activeIndex;

            // Scale & Opacity taper naturally along circular path
            let scale = isCurrent ? 1.38 : Math.max(0.42, 0.94 - distFromFront * 0.24);
            let opacity = isCurrent ? 1 : Math.max(0.25, 1 - distFromFront * 0.38);
            let zIndex = isCurrent ? 50 : Math.round((1 - distFromFront) * 40);

            return (
              <motion.div
                key={item.id}
                animate={{
                  x,
                  y,
                  scale,
                  opacity,
                  zIndex,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                onClick={() => handleCardClick(index)}
                onMouseEnter={() => {
                  setActiveIndex(index);
                  setIsHovered(true);
                }}
                onMouseLeave={() => setIsHovered(false)}
                className={`absolute w-28 h-28 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group ${
                  isCurrent
                    ? 'border-neutral-900 shadow-2xl ring-4 ring-neutral-900/40'
                    : 'border-neutral-300 hover:border-neutral-900 hover:opacity-100 hover:scale-110 shadow-md'
                }`}
                style={{
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider truncate">
                    #{index + 1} {item.category}
                  </span>
                  <p className="text-xs sm:text-sm text-white font-bold line-clamp-1 leading-tight">
                    {item.title}
                  </p>
                </div>

                {isCurrent && (
                  <div className="absolute top-2.5 right-2.5 bg-neutral-900 text-gold rounded-full p-1.5 shadow-lg border border-gold/40">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

