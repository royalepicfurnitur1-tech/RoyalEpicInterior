import React from 'react';
import { ArrowRight, Home, Sparkles, Hammer, Building2 } from 'lucide-react';

interface LoansShowcaseSectionProps {
  onNavigate: (path: string) => void;
}

export const LoansShowcaseSection: React.FC<LoansShowcaseSectionProps> = ({ onNavigate }) => {
  const handleExploreClick = () => {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'loans_homepage_cta_click', {
          event_category: 'Royal Epic Loans',
          event_label: 'Homepage Explore Finance Options',
        });
      }
    } catch (_) {}
    onNavigate('/loans');
  };

  return (
    <section className="py-10 sm:py-14 bg-[#F5EFE6]/70 border-b border-stone-300/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF7F2] border border-[#E7E2DA] rounded-3xl p-6 sm:p-10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6D3B] mb-2.5 font-mono">
              ROYAL EPIC LOANS
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1C2331] leading-tight mb-3">
              Planning Your Dream Home? Let&apos;s Explore Your Finance Options.
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-5">
              From home construction to complete interiors and renovations, share your finance requirements with Royal Epic and let our team guide you through the next steps.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-600 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-[#8C6D3B]" />
                Home Construction Finance
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8C6D3B]" />
                Home Interior Finance
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-[#8C6D3B]" />
                Home Renovation Finance
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#8C6D3B]" />
                Property-Related Finance
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3">
            <button
              type="button"
              onClick={handleExploreClick}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-[#1C2331] hover:bg-[#283246] text-[#FAF7F2] rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer"
            >
              Explore Finance Options
              <ArrowRight className="w-4 h-4 text-[#C5A059]" />
            </button>
            <span className="text-[11px] text-stone-500 text-center lg:text-right max-w-xs">
              Personal enquiry review &amp; guidance by our Bengaluru team.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
