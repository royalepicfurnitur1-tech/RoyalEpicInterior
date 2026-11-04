import React from 'react';
import { Quote } from 'lucide-react';

interface ArchitectVisionSectionProps {
  onRequestQuote?: (title: string) => void;
}

export const ArchitectVisionSection: React.FC<ArchitectVisionSectionProps> = () => {
  return (
    <section 
      id="vision" 
      className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2] text-stone-900 border-b border-[#E7E2DA] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Architect's Message */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Eyebrow Label */}
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.24em] text-[#8C6D3B] font-mono font-semibold block mb-3">
              A MESSAGE FROM OUR MANAGING DIRECTOR & ARCHITECT
            </span>

            {/* Main Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-serif font-bold text-stone-900 tracking-tight leading-[1.2] mb-6">
              A Vision Beyond Spaces. A Passion for Perfection.
            </h2>

            {/* Highlighted Quotation */}
            <div className="relative my-2 pl-5 sm:pl-6 border-l-2 border-[#C49746] py-1">
              <Quote className="w-5 h-5 text-[#C49746]/40 absolute -top-1 -left-2.5 bg-[#FAF7F2] fill-[#C49746]/10" />
              <p className="font-serif italic text-lg sm:text-xl text-stone-800 leading-relaxed">
                "Every space has a story to tell, and thoughtful design brings that story to life."
              </p>
            </div>

            {/* Supporting Paragraph */}
            <p className="text-stone-700 text-sm sm:text-[15px] leading-relaxed mt-6 mb-6 font-normal">
              At Royal Epic Interiors, my vision is to transform ordinary spaces into extraordinary experiences. Through innovative design, exceptional craftsmanship and attention to detail, we create timeless spaces that reflect the dreams, personality and aspirations of every client.
            </p>

            {/* Small Subheading & Philosophy Sentence */}
            <div className="bg-white/70 rounded-2xl p-5 border border-[#E7E2DA] mb-8">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#8C6D3B] font-bold block mb-1.5">
                Our Philosophy
              </span>
              <p className="text-stone-800 text-sm sm:text-[14.5px] font-medium leading-relaxed">
                "We don't just design spaces; we create experiences, build relationships and bring dreams to life."
              </p>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-[#E5DFD5] flex flex-col gap-1">
              <p className="font-serif font-bold text-stone-900 text-base sm:text-lg tracking-wide">
                Managing Director & Architect
              </p>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#8C6D3B] font-semibold">
                ROYAL EPIC INTERIORS
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: Architect's Photograph */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-none">
              
              {/* Subtle warm architectural backing glow/border */}
              <div 
                className="absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-[#C49746]/15 via-transparent to-stone-300/30 -z-10 blur-xs" 
                aria-hidden="true" 
              />
              
              {/* Refined editorial frame */}
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E5DFD5] bg-stone-100 shadow-[0_16px_40px_-16px_rgba(40,30,20,0.12)]">
                <img
                  src="/assets/aistudio/proffesional-image_cb026225.png"
                  alt="Managing Director & Architect - Royal Epic Interiors"
                  className="w-full h-auto max-h-[600px] object-cover object-top hover:scale-[1.01] transition-transform duration-700 ease-out"
                  loading="eager"
                />
              </div>

              {/* Minimal caption details */}
              <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono text-stone-500 uppercase tracking-wider px-1">
                <span>Turnkey Architecture & Joinery</span>
                <span className="text-[#8C6D3B] font-semibold">Bengaluru Studio</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
