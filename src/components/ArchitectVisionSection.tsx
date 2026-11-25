import React from 'react';
import { Quote } from 'lucide-react';
import { motion } from 'motion/react';

interface ArchitectVisionSectionProps {
  onRequestQuote?: (title: string) => void;
}

export const ArchitectVisionSection: React.FC<ArchitectVisionSectionProps> = () => {
  return (
    <section 
      id="vision" 
      className="py-12 sm:py-14 lg:py-18 bg-[#FAF7F2] text-stone-900 border-b border-[#E7E2DA] relative overflow-hidden"
    >
      {/* Subtle Floating Architectural Brass Ornaments */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 -left-16 w-48 h-48 rounded-full border border-[#C49746]/15 animate-arch-float"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 right-12 w-60 h-60 rounded-full bg-[#C49746]/8 blur-3xl animate-arch-float-reverse"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Architect's Message */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-center"
          >
            
            {/* Eyebrow Label */}
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.24em] text-[#8C6D3B] font-mono font-semibold block mb-2.5">
              A MESSAGE FROM OUR MANAGING DIRECTOR & ARCHITECT
            </span>

            {/* Main Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-serif font-bold text-stone-900 tracking-tight leading-[1.2] mb-5">
              A Vision Beyond Spaces. A Passion for Perfection.
            </h2>

            {/* Highlighted Quotation */}
            <div className="relative my-1.5 pl-5 sm:pl-6 border-l-2 border-[#C49746] py-1">
              <Quote className="w-5 h-5 text-[#C49746]/40 absolute -top-1 -left-2.5 bg-[#FAF7F2] fill-[#C49746]/10" />
              <p className="font-serif italic text-lg sm:text-xl text-stone-800 leading-relaxed">
                "Every space has a story to tell, and thoughtful design brings that story to life."
              </p>
            </div>

            {/* Supporting Paragraph */}
            <p className="text-stone-700 text-sm sm:text-[15px] leading-relaxed mt-4 mb-5 font-normal">
              At Royal Epic Interiors, my vision is to transform ordinary spaces into extraordinary experiences. Through innovative design, exceptional craftsmanship and attention to detail, we create timeless spaces that reflect the dreams, personality and aspirations of every client.
            </p>

            {/* Small Subheading & Philosophy Sentence */}
            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-[#E7E2DA] mb-6 transition-shadow duration-300 hover:shadow-sm">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#8C6D3B] font-bold block mb-1.5">
                Our Philosophy
              </span>
              <p className="text-stone-800 text-sm sm:text-[14.5px] font-medium leading-relaxed">
                "We don't just design spaces; we create experiences, build relationships and bring dreams to life."
              </p>
            </div>

            {/* Signature Block */}
            <div className="pt-5 border-t border-[#E5DFD5] flex flex-col gap-1">
              <p className="font-serif font-bold text-stone-900 text-base sm:text-lg tracking-wide">
                Managing Director & Architect
              </p>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#8C6D3B] font-semibold">
                ROYAL EPIC INTERIORS
              </p>
            </div>

          </motion.div>

          {/* RIGHT COLUMN: Architect's Photograph */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-md lg:max-w-none">
              
              {/* Subtle Floating Architectural Brass Corner Frame */}
              <div
                aria-hidden="true"
                className="pointer-events-none hidden sm:block absolute -top-4 -right-4 w-24 h-24 rounded-2xl border border-[#C49746]/35 -z-10 animate-arch-float"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none hidden sm:block absolute -bottom-3 -left-4 w-20 h-20 rounded-2xl border border-[#C49746]/25 -z-10 animate-arch-float-reverse"
              />

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
                  className="w-full h-auto max-h-[600px] object-cover object-top hover:scale-[1.015] transition-transform duration-700 ease-out"
                  loading="eager"
                />
              </div>

              {/* Minimal caption details */}
              <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono text-stone-500 uppercase tracking-wider px-1">
                <span>Turnkey Architecture & Joinery</span>
                <span className="text-[#8C6D3B] font-semibold">Bengaluru Studio</span>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
