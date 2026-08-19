import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Phone, ArrowUp, Instagram, Facebook, Youtube, Linkedin, MapPin, Share2, X, Star, Send, Sparkles, Building2, User, Clock, CheckCircle2, ChevronRight, Bot
} from 'lucide-react';

interface FloatingActionsProps {
  onOpenAiConsultant?: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onOpenAiConsultant }) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showSocialMenu, setShowSocialMenu] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);

  // Form state for pre-populating inquiry on WhatsApp
  const [inquiryType, setInquiryType] = useState('Modular Kitchen & SS Carcass');
  const [clientName, setClientName] = useState('');
  const [cityLocation, setCityLocation] = useState('');
  const [budget, setBudget] = useState('₹5L - ₹15L');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateWhatsappUrl = (customMsg?: string) => {
    const phone = '919916633338';
    if (customMsg) {
      return `https://wa.me/${phone}?text=${encodeURIComponent(customMsg)}`;
    }

    const message = `Hello Royal Epic Interior & Furniture Team 👋,

I am interested in an interior consultation for my project:
📌 *Requirement:* ${inquiryType}
${clientName ? `👤 *Name:* ${clientName}\n` : ''}${cityLocation ? `📍 *Location/City:* ${cityLocation}\n` : ''}💰 *Budget:* ${budget}

Please connect me with a Senior Interior Designer and share your latest design catalog.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleSendWhatsapp = (customMsg?: string) => {
    const url = generateWhatsappUrl(customMsg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">
      
      {/* WhatsApp Detailed Inquiry Popover Card */}
      {showWhatsappModal && (
        <div className="bg-neutral-900/98 border border-emerald-500/40 backdrop-blur-2xl p-3.5 sm:p-4 rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-80 max-w-[340px] max-h-[80vh] overflow-y-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-200 custom-scrollbar">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-serif">
                  Chat on WhatsApp <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                </h4>
                <p className="text-[10px] text-emerald-400 font-mono">Instant Support • Royal Epic</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowWhatsappModal(false)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Structured Custom Inquiry Builder */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-gold uppercase tracking-wider font-mono block">
              📝 Pre-Fill Details for Faster Quote
            </label>

            <div>
              <span className="text-[10px] text-neutral-300 font-medium block mb-0.5">Requirement</span>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full bg-black/70 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="Modular Kitchen & SS Carcass">Modular Kitchen & SS Carcass</option>
                <option value="Full Home Interior (2BHK / 3BHK / Villa)">Full Home Interior (2BHK / 3BHK)</option>
                <option value="Living Room & TV Unit">Living Room & Luxury TV Unit</option>
                <option value="Bedroom & Wardrobe Systems">Bedroom & Wardrobe Systems</option>
                <option value="Commercial & Office Space">Commercial & Office Space</option>
                <option value="Site Measurement & 3D Walkthrough">Site Measurement & 3D Walkthrough</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <span className="text-[10px] text-neutral-300 font-medium block mb-0.5">Name (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. Rahul"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-black/70 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-neutral-300 font-medium block mb-0.5">City / Area</span>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={cityLocation}
                  onChange={(e) => setCityLocation(e.target.value)}
                  className="w-full bg-black/70 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-neutral-300 font-medium block mb-0.5">Estimated Budget</span>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-black/70 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="Under ₹5 Lakhs">Under ₹5 Lakhs</option>
                <option value="₹5L - ₹15L">₹5L - ₹15L</option>
                <option value="₹15L - ₹30L">₹15L - ₹30L</option>
                <option value="₹30L+ Luxury Segment">₹30L+ Luxury Segment</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => handleSendWhatsapp()}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Start WhatsApp Chat Now
          </button>

          <p className="text-[9px] text-center text-neutral-400 font-mono">
            Directly connects with Royal Epic (+91 99166 33338)
          </p>

        </div>
      )}

      {/* Expanded Social Media Quick Access Menu */}
      {showSocialMenu && (
        <div className="bg-neutral-900/95 border border-gold/40 backdrop-blur-xl p-4 rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-64 max-w-xs space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-1">
            <span className="text-[11px] font-bold text-gold uppercase tracking-wider font-mono">
              Royal Epic Socials
            </span>
            <button 
              onClick={() => setShowSocialMenu(false)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href="https://maps.google.com/?q=Royal+Epic+Interior"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded-xl bg-gold/10 hover:bg-gold hover:text-black border border-gold/30 text-gold transition-all"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold shrink-0" />
              <span className="text-xs font-bold">Google My Business</span>
            </div>
            <span className="text-[10px] font-bold bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">4.9 ★</span>
          </a>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-black/50 border border-white/10 text-neutral-300 hover:text-pink-400 hover:border-pink-500/40 text-xs transition-all"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="text-[11px]">Instagram</span>
            </a>

            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-black/50 border border-white/10 text-neutral-300 hover:text-blue-400 hover:border-blue-500/40 text-xs transition-all"
            >
              <Facebook className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px]">Facebook</span>
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-black/50 border border-white/10 text-neutral-300 hover:text-blue-500 hover:border-blue-500/40 text-xs transition-all"
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-[11px]">LinkedIn</span>
            </a>

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-black/50 border border-white/10 text-neutral-300 hover:text-red-500 hover:border-red-500/40 text-xs transition-all"
            >
              <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-[11px]">YouTube</span>
            </a>
          </div>
        </div>
      )}

      {/* Social Toggle Button */}
      <button
        onClick={() => setShowSocialMenu(!showSocialMenu)}
        className="p-3.5 rounded-full bg-[#f8f5ee] border-2 border-gold/60 text-neutral-950 hover:bg-gold hover:scale-110 shadow-2xl transition-all cursor-pointer flex items-center justify-center group"
        title="Official Social Media & Google Business Links"
      >
        <Share2 className="w-5 h-5 text-neutral-950 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="p-3 rounded-full bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-neutral-950 border border-gold hover:scale-110 transition-all shadow-2xl cursor-pointer font-bold"
          title="Back to Top"
        >
          <ArrowUp className="w-5 h-5 text-neutral-950" />
        </button>
      )}

      {/* Chat on WhatsApp Interactive Floating Button */}
      <div className="relative flex items-center">
        {/* Pulsing indicator tooltip */}
        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold mr-2 shadow-lg animate-pulse">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Chat on WhatsApp
        </span>

        <button
          onClick={() => setShowWhatsappModal(!showWhatsappModal)}
          className="p-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-110 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center justify-center group relative"
          title="Chat on WhatsApp (Pre-fill Inquiry)"
        >
          <MessageSquare className="w-5 h-5 group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-black animate-ping" />
        </button>
      </div>

    </div>
  );
};

