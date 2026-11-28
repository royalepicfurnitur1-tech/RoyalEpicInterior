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
              <a
                href="/loans/home-construction-finance"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  onNavigate('/loans/home-construction-finance');
                }}
                className="inline-flex items-center gap-1.5 hover:text-[#8C6D3B] transition-colors underline decoration-[#C5A059]/50 underline-offset-4"
              >
                <Home className="w-3.5 h-3.5 text-[#8C6D3B]" />
                Home Construction Finance
              </a>
              <a
                href="/loans/home-interior-finance"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  onNavigate('/loans/home-interior-finance');
                }}
                className="inline-flex items-center gap-1.5 hover:text-[#8C6D3B] transition-colors underline decoration-[#C5A059]/50 underline-offset-4"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8C6D3B]" />
                Home Interior Finance
              </a>
              <a
                href="/loans/home-renovation-finance"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  onNavigate('/loans/home-renovation-finance');
                }}
                className="inline-flex items-center gap-1.5 hover:text-[#8C6D3B] transition-colors underline decoration-[#C5A059]/50 underline-offset-4"
              >
                <Hammer className="w-3.5 h-3.5 text-[#8C6D3B]" />
                Home Renovation Finance
              </a>
              <a
                href="/loans/property-related-finance"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  onNavigate('/loans/property-related-finance');
                }}
                className="inline-flex items-center gap-1.5 hover:text-[#8C6D3B] transition-colors underline decoration-[#C5A059]/50 underline-offset-4"
              >
                <Building2 className="w-3.5 h-3.5 text-[#8C6D3B]" />
                Property-Related Finance
              </a>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3">
            <a
              href="/loans"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                handleExploreClick();
              }}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-[#1C2331] hover:bg-[#283246] text-[#FAF7F2] rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer"
            >
              Explore Finance Options
              <ArrowRight className="w-4 h-4 text-[#C5A059]" />
            </a>
            <span className="text-[11px] text-stone-500 text-center lg:text-right max-w-xs">
              Personal enquiry review &amp; guidance by our Bengaluru team.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
