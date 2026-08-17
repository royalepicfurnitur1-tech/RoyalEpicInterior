import React, { useState } from 'react';
import { PRODUCTS_DATA, SERVICES_DATA, PORTFOLIO_PROJECTS } from '../data/mockData';
import { Product } from '../types';
import { Search, X, ArrowRight, Box, Wrench, Sparkles } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (p: Product) => void;
  onRequestQuote: (title: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onRequestQuote,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const matchingProducts = query
    ? PRODUCTS_DATA.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()))
    : PRODUCTS_DATA.slice(0, 4);

  const matchingServices = query
    ? SERVICES_DATA.filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/85 backdrop-blur-lg">
      <div className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative mb-6">
          <Search className="w-5 h-5 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doors, modular kitchens, wardrobes, sofas, partitions..."
            className="w-full bg-black/80 border border-white/20 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-gold tracking-widest block mb-2 font-mono">
              Products ({matchingProducts.length})
            </span>
            <div className="space-y-2">
              {matchingProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onClose();
                    onSelectProduct(p);
                  }}
                  className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-gold/50 flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-gold transition-colors">{p.name}</h4>
                      <span className="text-[10px] text-neutral-400 font-mono">₹{p.price.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-gold transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {matchingServices.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase text-gold tracking-widest block mb-2 font-mono">
                Services
              </span>
              <div className="space-y-2">
                {matchingServices.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onClose();
                      onRequestQuote(s.title);
                    }}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-gold/50 flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-gold transition-colors">{s.title}</h4>
                      <p className="text-[10px] text-neutral-400 line-clamp-1">{s.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-gold" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
