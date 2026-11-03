import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  Crown, Phone, Mail, MapPin, Send, ArrowRight, Instagram, 
  Facebook, Youtube, Linkedin, ShieldCheck, Heart, Sparkles, Globe, MessageSquare 
} from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

interface FooterProps {
  setActiveTab?: (tab: ActiveTab) => void;
  onOpenQuote?: () => void;
  onOpenFeedback?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onOpenQuote, onOpenFeedback }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [policyModal, setPolicyModal] = useState<string | null>(null);
  const [isLocalFeedbackOpen, setIsLocalFeedbackOpen] = useState(false);

  const handleTriggerFeedback = () => {
    if (onOpenFeedback) {
      onOpenFeedback();
    } else {
      setIsLocalFeedbackOpen(true);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  const serviceLinks = [
    { label: 'Heritage Homes & Traditional Design', path: '/services/heritage-homes' },
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
    { label: 'All Products & Collections', path: '/products' },
    { label: 'Living Room Interiors', path: '/products?category=living-room-interiors' },
    { label: 'Modular Kitchen Units', path: '/products?category=modular-kitchen' },
    { label: 'Bedroom & Wardrobes', path: '/products?category=bedroom-interiors' },
    { label: 'Bathroom Doors & Vanities', path: '/products?category=bathroom-interiors' },
    { label: 'Pooja Room Mandirs', path: '/products?category=pooja-room-interiors' },
    { label: 'Modular Interiors', path: '/products?category=modular-interiors' },
    { label: 'Onyx Dining Tables', path: '/products?category=dining-tables' },
    { label: 'Commercial Equipment', path: '/products?category=commercial-kitchen-equipment' }
  ];

  const galleryLinks = [
    { label: 'Restaurant Interior Gallery', path: '/restaurant-interior-gallery' },
    { label: 'Chettinad & Kerala Traditional Homes', path: '/chettinad-kerala-traditional-homes' },
    { label: 'Completed Project Showcase', path: '/completed-projects' }
  ];

  const handleNavClick = (tab: ActiveTab, path: string) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    }
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#989482] text-stone-900 pt-16 pb-8 border-t border-stone-300/80 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Newsletter Banner */}
        <div className="bg-[#FAF7F2] border border-[#E7E2DA] rounded-3xl p-8 mb-16 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="max-w-xl">
            <span className="text-xs font-bold text-[#8C6D3B] uppercase tracking-widest block mb-1 font-mono">
              Stay Inspired & Updated
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-2">
              Subscribe to Royal Epic Design Digest
            </h3>
            <p className="text-xs text-stone-600">
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
              className="bg-white border border-stone-300 rounded-xl px-4 py-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 w-full lg:w-72 shadow-2xs"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer shrink-0 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Subscribe
            </button>
          </form>
          {subscribed && (
            <p className="text-xs text-emerald-700 font-bold">Successfully subscribed to Royal Digest!</p>
          )}
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 flex items-center justify-center shadow-xs">
                <Crown className="w-6 h-6 text-amber-800" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900">ROYAL EPIC</h2>
                <p className="text-[9px] uppercase tracking-widest text-[#785928] font-sans font-semibold">
                  Interior & Furniture Platform
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed mb-6 max-w-sm">
              World-class interior design, custom furniture manufacturing, commercial kitchen equipment fabrication, and architectural door systems. Delivering turnkey excellence across residences, hotels, offices, and restaurants in Bengaluru.
            </p>

            {/* Contact Quick Info */}
            <div className="space-y-2 text-xs text-stone-800">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <span>No. 10, Royal EPIC Interiors, 2nd, Thanisandra Main Road, Near Railway Bridge, Sinthan Nagar, Rachenahalli, Nagawara, Bengaluru - 560045</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-600 block font-semibold text-[11px]">Customer Care:</span>
                  <a href="tel:+919916633338" className="hover:text-amber-800 font-mono text-stone-900 font-bold block">+91 99166 33338</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-stone-600 block font-semibold text-[11px]">Email Support:</span>
                  <a href="mailto:royalepicfurnitur1@gmail.com" className="hover:text-amber-800 block font-mono text-[11px] text-stone-800 font-medium">royalepicfurnitur1@gmail.com</a>
                  <a href="mailto:info@royalepicinterior.com" className="hover:text-amber-800 block font-mono text-[11px] text-stone-800 font-medium">info@royalepicinterior.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Services Divisions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-4 font-mono">
              Interior Services
            </h4>
            <ul className="space-y-2 text-xs text-stone-700">
              {serviceLinks.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('services', item.path);
                    }}
                    className="hover:text-stone-950 hover:underline transition-colors cursor-pointer text-left block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Product Offerings */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-4 font-mono">
              Product Categories
            </h4>
            <ul className="space-y-2 text-xs text-stone-700">
              {productLinks.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('products', item.path);
                    }}
                    className="hover:text-stone-950 hover:underline transition-colors cursor-pointer text-left block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Quick Links & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 font-mono">
              Design Galleries
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-700 mb-5">
              {galleryLinks.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('gallery', item.path);
                    }}
                    className="hover:text-stone-950 hover:underline transition-colors cursor-pointer text-left block text-[11px]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 font-mono">
              Legal & Support
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-700">
              <li>
                <button
                  onClick={handleTriggerFeedback}
                  className="hover:text-amber-900 transition-colors cursor-pointer text-left text-[11px] font-medium flex items-center gap-1.5 text-stone-800"
                >
                  <MessageSquare className="w-3 h-3 text-amber-800" />
                  Website Feedback
                </button>
              </li>
              {[
                { label: 'Privacy Policy', path: '/privacy-policy' },
                { label: 'Terms & Conditions', path: '/terms-and-conditions' },
                { label: 'Refund & Return Policy', path: '/refund-policy' },
                { label: 'Shipping Policy', path: '/shipping-policy' },
                { label: 'Contact Us', path: '/contact-us' }
              ].map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.path === '/contact-us') {
                        if (typeof setActiveTab === 'function') setActiveTab('home');
                        window.history.pushState({}, '', '/');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        setTimeout(() => {
                          const contactEl = document.getElementById('contact');
                          if (contactEl) {
                            contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          } else {
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                          }
                        }, 150);
                      } else {
                        if (typeof setActiveTab === 'function') setActiveTab('home');
                        window.history.pushState({}, '', item.path);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-stone-950 hover:underline transition-colors cursor-pointer text-left text-[11px] block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onOpenQuote?.()}
              className="mt-6 w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-transform cursor-pointer"
            >
              Get Free Quote
            </button>

            <button
              onClick={handleTriggerFeedback}
              className="mt-2.5 w-full py-2 rounded-xl bg-white/80 hover:bg-white text-stone-800 border border-stone-300 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-800" />
              Website Feedback
            </button>

            <div className="mt-4 pt-3 border-t border-stone-300/80 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => {
                  if (typeof setActiveTab === 'function') setActiveTab('customers');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] text-stone-700 hover:text-stone-950 transition-colors flex items-center gap-1 cursor-pointer font-mono"
                title="Customer & Executive Leads Portal"
              >
                <Sparkles className="w-3 h-3 text-amber-800" /> Customers & Leads Portal
              </button>
              <button
                onClick={() => {
                  if (typeof setActiveTab === 'function') setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] text-stone-600 hover:text-stone-950 transition-colors flex items-center gap-1 cursor-pointer font-mono"
                title="Management Portal Login"
              >
                <ShieldCheck className="w-3 h-3 text-amber-800" /> Admin ERP
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Credits & Social Links */}
        <div className="pt-8 border-t border-stone-300/80 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-stone-600">
          <p>© 2026 Royal Epic Interior & Furniture Ltd. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-[11px] font-mono text-stone-800 uppercase tracking-wider font-semibold mr-1">
              Connect With Us:
            </span>
            <a 
              href="https://www.instagram.com/royalepicinteriordesign/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-xl bg-white/80 border border-stone-300 text-stone-700 hover:bg-white hover:text-pink-600 transition-all flex items-center gap-1.5 shadow-2xs"
              title="Instagram - @royalepicinteriordesign"
            >
              <Instagram className="w-4 h-4 text-pink-600" />
              <span className="text-[11px] font-medium hidden sm:inline">Instagram</span>
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-xl bg-white/80 border border-stone-300 text-stone-700 hover:bg-white hover:text-blue-600 transition-all flex items-center gap-1.5 shadow-2xs"
              title="Facebook - Royal Epic Interior"
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-medium hidden sm:inline">Facebook</span>
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-xl bg-white/80 border border-stone-300 text-stone-700 hover:bg-white hover:text-blue-700 transition-all flex items-center gap-1.5 shadow-2xs"
              title="LinkedIn - Royal Epic Interior & Furniture"
            >
              <Linkedin className="w-4 h-4 text-blue-700" />
              <span className="text-[11px] font-medium hidden sm:inline">LinkedIn</span>
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-xl bg-white/80 border border-stone-300 text-stone-700 hover:bg-white hover:text-red-600 transition-all flex items-center gap-1.5 shadow-2xs"
              title="YouTube - Royal Epic Interior Studio"
            >
              <Youtube className="w-4 h-4 text-red-600" />
              <span className="text-[11px] font-medium hidden sm:inline">YouTube</span>
            </a>
            <a 
              href="https://maps.google.com/?q=Royal+Epic+Interior" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-xl bg-white border border-amber-600/40 text-stone-900 hover:bg-amber-50 transition-all flex items-center gap-1.5 font-bold shadow-xs"
              title="Google My Business Listing & Reviews"
            >
              <MapPin className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-bold text-stone-900">Google Business</span>
            </a>
          </div>
        </div>

      </div>

      {/* Policy Modal */}
      {policyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#FAF7F2] border border-[#E7E2DA] rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-[#8C6D3B] mb-3">{policyModal}</h3>
            <p className="text-xs text-stone-700 leading-relaxed mb-6">
              Royal Epic Interior & Furniture adheres strictly to ISO quality standards, transparent pricing, and 100% customer data protection. All manufacturing warranties are backed by our factory guarantee.
            </p>
            <button
              onClick={() => setPolicyModal(null)}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Website Feedback Modal */}
      <FeedbackModal
        isOpen={isLocalFeedbackOpen}
        onClose={() => setIsLocalFeedbackOpen(false)}
      />
    </footer>
  );
};
