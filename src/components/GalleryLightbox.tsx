import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Sparkles, 
  MessageSquare, ShieldCheck, Tag, Info
} from 'lucide-react';

export interface GalleryLightboxItem {
  id: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  description?: string;
  isAiGenerated?: boolean;
  tags?: string[];
}

interface GalleryLightboxProps {
  isOpen: boolean;
  items: GalleryLightboxItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onRequestQuote?: (title: string) => void;
}

export const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  isOpen,
  items,
  currentIndex,
  onClose,
  onNavigate,
  onRequestQuote
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const currentItem = items[currentIndex];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsZoomed(false);
      setImageLoaded(false);
      onNavigate(currentIndex - 1);
    } else {
      setIsZoomed(false);
      setImageLoaded(false);
      onNavigate(items.length - 1);
    }
  }, [currentIndex, items.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setIsZoomed(false);
      setImageLoaded(false);
      onNavigate(currentIndex + 1);
    } else {
      setIsZoomed(false);
      setImageLoaded(false);
      onNavigate(0);
    }
  }, [currentIndex, items.length, onNavigate]);

  // Keyboard navigation & accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Reset zoom on item change
  useEffect(() => {
    setIsZoomed(false);
    setImageLoaded(false);
  }, [currentIndex]);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Minimum swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStart(null);
  };

  if (!isOpen || !currentItem) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Image details: ${currentItem.title}`}
      ref={dialogRef}
    >
      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between px-4 sm:px-8 z-30 pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 bg-black/60 px-3 py-1.5 rounded-full border border-amber-400/30">
            {currentIndex + 1} / {items.length}
          </span>
          <span className="hidden sm:inline-block text-xs font-medium text-neutral-300 truncate max-w-xs md:max-w-md">
            {currentItem.category}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom Toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer hover:scale-105"
            aria-label={isZoomed ? "Zoom out image" : "Zoom in image"}
            title={isZoomed ? "Zoom out (Esc)" : "Zoom in"}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-all cursor-pointer hover:scale-105"
            aria-label="Close image gallery modal"
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Area with Touch Swipe */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-12 md:p-16 overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // Close if clicking outside the image container
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Previous Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black border border-white/20 text-white shadow-2xl transition-all cursor-pointer hover:scale-110"
          aria-label="Previous image in gallery"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Next Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black border border-white/20 text-white shadow-2xl transition-all cursor-pointer hover:scale-110"
          aria-label="Next image in gallery"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Image Display */}
        <div className="relative max-w-5xl max-h-[72vh] sm:max-h-[76vh] flex items-center justify-center">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center min-w-[280px] min-h-[280px]">
              <div className="w-12 h-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
            </div>
          )}
          <img
            key={currentItem.id}
            src={currentItem.image}
            alt={currentItem.alt}
            onLoad={() => setImageLoaded(true)}
            className={`max-w-full max-h-[68vh] sm:max-h-[74vh] object-contain rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-300 ${
              isZoomed ? 'scale-125 sm:scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsZoomed(!isZoomed)}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/85 to-transparent pt-8 pb-5 px-4 sm:px-8 z-30 pointer-events-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black bg-gradient-to-r from-amber-300 to-yellow-500 px-2.5 py-0.5 rounded-md">
                {currentItem.category}
              </span>
              {currentItem.isAiGenerated && (
                <span className="text-[10px] font-bold text-amber-200 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Architectural Concept
                </span>
              )}
            </div>
            
            <h3 className="text-base sm:text-xl font-serif font-bold text-white tracking-tight">
              {currentItem.title}
            </h3>

            {currentItem.description && (
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-2 sm:line-clamp-none">
                {currentItem.description}
              </p>
            )}

            {currentItem.tags && currentItem.tags.length > 0 && (
              <div className="hidden sm:flex flex-wrap items-center gap-1.5 pt-1">
                {currentItem.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Consultation CTA */}
          {onRequestQuote && (
            <button
              onClick={() => {
                onClose();
                onRequestQuote(`${currentItem.category} - ${currentItem.title}`);
              }}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> Get Custom Quote
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
