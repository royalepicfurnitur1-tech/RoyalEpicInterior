import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  Crown, Phone, Mail, MapPin, Send, ArrowRight, Instagram, 
  Facebook, Youtube, Linkedin, ShieldCheck, Heart, Sparkles, Globe 
} from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuote: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onOpenQuote }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [policyModal, setPolicyModal] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  const serviceLinks = [
    { label: 'Turnkey Interior Contractors', path: '/turnkey-interior-contractors-bangalore' },
    { label: 'Home Interior Design', path: '/home-interior-design-bangalore' },
    { label: 'Luxury Home Interiors', path: '/luxury-home-interiors-bangalore' },
    { label: 'Modular Kitchen Bangalore', path: '/modular-kitchen-bangalore' },
    { label: 'Modular Wardrobe Solutions', path: '/modular-wardrobe-bangalore' },
    { label: 'Commercial Office Interiors', path: '/office-interior-design-bangalore' },
    { label: 'Restaurant Interior Design', path: '/restaurant-interior-design' },
    { label: 'Custom Furniture Manufacturer', path: '/custom-furniture-manufacturer' },
    { label: 'False Ceiling & Lighting', path: '/false-ceiling-design' }
  ];

  const productLinks = [
    { label: 'Main Entrance Doors', path: '/products/main-entrance-doors' },
    { label: 'WPC Bathroom Doors', path: '/products/wpc-bathroom-doors' },
    { label: 'Modular Kitchen Units', path: '/products/modular-kitchens' },
    { label: 'Sliding Wardrobes', path: '/products/sliding-wardrobes' },
    { label: 'TV Console Units', path: '/products/tv-units' },
    { label: 'Chesterfield Sofas', path: '/products/sofas' },
    { label: 'Onyx Dining Tables', path: '/products/dining-tables' },
    { label: 'Commercial Equipment', path: '/products/kitchen-equipment' },
    { label: 'Glass Partitions', path: '/products/glass-partitions' }
  ];

  const handleNavClick = (tab: ActiveTab, path: string) => {
    setActiveTab(tab);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-gold/30 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Newsletter Banner */}
        <div className="bg-neutral-900/90 border border-gold/30 rounded-3xl p-8 mb-16 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl">
            <span className="text-xs font-bold text-gold uppercase tracking-widest block mb-1">
              Stay Inspired & Updated
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
              Subscribe to Royal Epic Design Digest
            </h3>
            <p className="text-xs text-neutral-400">
              Get exclusive architectural trends, material durability guides, and seasonal luxury offers delivered to your inbox.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full lg:w-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold w-full lg:w-72"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" /> Subscribe
            </button>
          </form>
          {subscribed && (
            <p className="text-xs text-emerald-400 font-bold">Successfully subscribed to Royal Digest!</p>
          )}
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-yellow-600 p-0.5 shadow-lg">
                <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                  <Crown className="w-6 h-6 text-gold" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-white">ROYAL EPIC</h2>
                <p className="text-[9px] uppercase tracking-widest text-gold font-sans font-semibold">
                  Interior & Furniture Platform
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed mb-6 max-w-sm">
              World-class interior design, custom furniture manufacturing, commercial kitchen equipment fabrication, and architectural door systems. Delivering turnkey excellence across residences, hotels, offices, and restaurants in Bengaluru.
            </p>

            {/* Contact Quick Info */}
            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru - 560077</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="text-neutral-400 block font-semibold text-[11px]">Customer Care:</span>
                  <a href="tel:+919916633338" className="hover:text-gold font-mono text-white font-bold block">+91 99166 33338</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-neutral-400 block font-semibold text-[11px]">Email Support:</span>
                  <a href="mailto:royalepicfurnitur1@gmail.com" className="hover:text-gold block font-mono text-[11px]">royalepicfurnitur1@gmail.com</a>
                  <a href="mailto:info@royalepicinterior.com" className="hover:text-gold block font-mono text-[11px]">info@royalepicinterior.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Services Divisions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4 font-mono">
              Interior Services
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              {serviceLinks.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('services', item.path);
                    }}
                    className="hover:text-white hover:underline transition-colors cursor-pointer text-left block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Product Offerings */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4 font-mono">
              Product Categories
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              {productLinks.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('products', item.path);
                    }}
                    className="hover:text-white hover:underline transition-colors cursor-pointer text-left block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Quick Links & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4 font-mono">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              {['Privacy Policy', 'Terms & Conditions', 'Refund & Return Policy', 'Shipping Policy', 'Careers at Royal Epic', 'Contact Us'].map((item, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => setPolicyModal(item)}
                    className="hover:text-white hover:underline transition-colors cursor-pointer text-left"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={onOpenQuote}
              className="mt-6 w-full py-2.5 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-transform cursor-pointer"
            >
              Get Free Quote
            </button>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => {
                  setActiveTab('customers');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] text-neutral-400 hover:text-gold transition-colors flex items-center gap-1 cursor-pointer font-mono"
                title="Customer & Executive Leads Portal"
              >
                <Sparkles className="w-3 h-3 text-gold" /> Customers & Leads Portal
              </button>
              <button
                onClick={() => {
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] text-neutral-500 hover:text-gold transition-colors flex items-center gap-1 cursor-pointer font-mono"
                title="Management Portal Login"
              >
                <ShieldCheck className="w-3 h-3 text-gold/70" /> Admin ERP
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Credits & Social Links */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500">
          <p>© 2026 Royal Epic Interior & Furniture Ltd. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-[11px] font-mono text-gold uppercase tracking-wider font-semibold mr-1">
              Connect With Us:
            </span>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-pink-400 hover:border-pink-500/50 transition-all flex items-center gap-1.5"
              title="Instagram - @royalepicinterior"
            >
              <Instagram className="w-4 h-4 text-pink-400" />
              <span className="text-[11px] font-medium hidden sm:inline">Instagram</span>
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-blue-400 hover:border-blue-500/50 transition-all flex items-center gap-1.5"
              title="Facebook - Royal Epic Interior"
            >
              <Facebook className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] font-medium hidden sm:inline">Facebook</span>
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-blue-500 hover:border-blue-500/50 transition-all flex items-center gap-1.5"
              title="LinkedIn - Royal Epic Interior & Furniture"
            >
              <Linkedin className="w-4 h-4 text-blue-500" />
              <span className="text-[11px] font-medium hidden sm:inline">LinkedIn</span>
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-red-500 hover:border-red-500/50 transition-all flex items-center gap-1.5"
              title="YouTube - Royal Epic Interior Studio"
            >
              <Youtube className="w-4 h-4 text-red-500" />
              <span className="text-[11px] font-medium hidden sm:inline">YouTube</span>
            </a>
            <a 
              href="https://maps.google.com/?q=Royal+Epic+Interior" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-xl bg-[#f8f5ee] border border-gold/50 text-neutral-950 hover:bg-gold transition-all flex items-center gap-1.5 font-bold shadow-sm"
              title="Google My Business Listing & Reviews"
            >
              <MapPin className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-bold text-neutral-950">Google Business</span>
            </a>
          </div>
        </div>

      </div>

      {/* Policy Modal */}
      {policyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-gold/40 rounded-2xl max-w-lg w-full p-6 text-white">
            <h3 className="text-xl font-serif font-bold text-gold mb-3">{policyModal}</h3>
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              Royal Epic Interior & Furniture adheres strictly to ISO quality standards, transparent pricing, and 100% customer data protection. All manufacturing warranties are backed by our factory guarantee.
            </p>
            <button
              onClick={() => setPolicyModal(null)}
              className="px-4 py-2 rounded-xl bg-gold text-black text-xs font-bold uppercase cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};
