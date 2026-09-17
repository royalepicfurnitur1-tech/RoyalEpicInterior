import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  Crown, Menu, X, FileText, User, ChevronRight, MessageSquare, ShieldCheck, LogOut, Code, Building,
  Sparkles, Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onTabChange?: (tab: ActiveTab) => void;
  onNavigate?: (path: string) => void;
  onContactClick?: () => void;
  cartCount?: number;
  wishlistCount?: number;
  onOpenCart?: () => void;
  onOpenQuote?: () => void;
  onOpenSearch?: () => void;
  onSearchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onTabChange,
  onNavigate,
  onContactClick,
  cartCount = 0,
  wishlistCount = 0,
  onOpenCart = () => {},
  onOpenQuote = () => {},
  onOpenSearch = () => {},
  onSearchClick,
}) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; path: string; label: string; badge?: string }[] = [
    { id: 'home', path: '/', label: 'Home' },
    { id: 'services', path: '/our-services', label: 'Services' },
    { id: 'products', path: '/products', label: 'Products' },
    { id: 'portfolio', path: '/portfolio', label: 'Portfolio' },
    { id: 'gallery', path: '/completed-projects', label: 'Gallery' },
    { id: 'blog', path: '/blog', label: 'Blog' },
    { id: 'contact', path: '/contact-us', label: 'Contact' },
    { id: 'track-order', path: '/track-order', label: 'Track Your Order' },
  ];

  const handleContactClick = () => {
    setMobileMenuOpen(false);

    if (onContactClick) {
      onContactClick();
      return;
    }

    const scrollToContactSection = () => {
      const contactEl = document.getElementById('contact');
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    };

    const isHome = activeTab === 'home' && (window.location.pathname === '/' || window.location.pathname === '');

    if (isHome) {
      scrollToContactSection();
    } else {
      if (typeof setActiveTab === 'function') {
        setActiveTab('home');
      } else if (typeof onTabChange === 'function') {
        onTabChange('home');
      }
      if (onNavigate) {
        onNavigate('/');
      }
      setTimeout(scrollToContactSection, 150);
    }
  };

  const handleNavClick = (id: ActiveTab, path: string) => {
    if (id === 'contact' || path === '/contact-us') {
      handleContactClick();
      return;
    }
    if (typeof setActiveTab === 'function') {
      setActiveTab(id);
    } else if (typeof onTabChange === 'function') {
      onTabChange(id);
    }
    if (onNavigate) {
      onNavigate(path);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-neutral-200 text-neutral-900 transition-all shadow-sm">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-4 sm:gap-6">
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home', '/');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-md group-hover:bg-black transition-all">
              <Crown className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-neutral-900 group-hover:text-black transition-colors">
                ROYAL EPIC
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-neutral-600 font-sans font-bold">
                Interior & Furniture
              </p>
            </div>
          </a>
        </div>
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            if (item.id === 'services') {
              return (
                <div key={item.id} className="relative group">
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.id, item.path);
                    }}
                    className={`relative px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'text-black bg-gradient-to-r from-gold via-amber-400 to-yellow-500 shadow-md'
                        : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{item.label}</span>
                  </a>

                  {/* Services Submenu Dropdown */}
                  <div className="absolute top-full left-0 w-80 pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 p-2 space-y-1">
                      <a
                        href="/services/heritage-homes"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate?.('/services/heritage-homes');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="block px-3 py-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 transition-colors group/sub border border-amber-200/60"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-amber-900 block group-hover/sub:text-amber-800">
                            Heritage Homes & Traditional Design
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold uppercase">
                            New
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-600 block">
                          Kerala Nalukettu, Chettinad, courtyards & timber architecture
                        </span>
                      </a>
                      <a
                        href="/our-services"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick('services', '/our-services');
                        }}
                        className="block px-3 py-2.5 rounded-xl hover:bg-[#f8f5ee] transition-colors group/sub"
                      >
                        <span className="text-xs font-bold text-neutral-900 block group-hover/sub:text-amber-700">
                          All Interior & Turnkey Services
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          Residential, commercial, modular kitchens, and fitouts
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.id === 'gallery') {
              return (
                <div key={item.id} className="relative group">
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.id, item.path);
                    }}
                    className={`relative px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'text-black bg-gradient-to-r from-gold via-amber-400 to-yellow-500 shadow-md'
                        : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{item.label}</span>
                  </a>

                  {/* Gallery Submenu Dropdown */}
                  <div className="absolute top-full left-0 w-72 pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 p-2 space-y-1">
                      <a
                        href="/completed-projects"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick('gallery', '/completed-projects');
                        }}
                        className="block px-3 py-2.5 rounded-xl hover:bg-[#f8f5ee] transition-colors group/sub"
                      >
                        <span className="text-xs font-bold text-neutral-900 block group-hover/sub:text-amber-700">
                          All Completed Projects
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          Turnkey residences, villas, & commercial interiors
                        </span>
                      </a>
                      <a
                        href="/restaurant-interior-gallery"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate?.('/restaurant-interior-gallery');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="block px-3 py-2.5 rounded-xl hover:bg-[#f8f5ee] transition-colors group/sub"
                      >
                        <span className="text-xs font-bold text-neutral-900 block group-hover/sub:text-amber-700">
                          Restaurant Interior Gallery
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          Fine dining, cafes, bars, and food courts
                        </span>
                      </a>
                      <a
                        href="/chettinad-kerala-traditional-homes"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate?.('/chettinad-kerala-traditional-homes');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="block px-3 py-2.5 rounded-xl hover:bg-[#f8f5ee] transition-colors group/sub"
                      >
                        <span className="text-xs font-bold text-neutral-900 block group-hover/sub:text-amber-700">
                          Chettinad & Kerala Traditional Homes
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          Nalukettu homes, heritage villas, & carved teakwood
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id, item.path);
                }}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-block ${
                  isActive
                    ? 'text-black bg-gradient-to-r from-gold via-amber-400 to-yellow-500 shadow-md'
                    : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-gold text-black border border-amber-600 text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Top Contact Us Button */}
          <button
            onClick={handleContactClick}
            className="flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md hover:brightness-105 transition-all cursor-pointer border border-amber-600/30 whitespace-nowrap"
            aria-label="Contact Us"
          >
            <Phone className="w-3.5 h-3.5 text-black shrink-0" />
            <span>Contact Us</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-[#f8f5ee] border border-gold/40 text-neutral-900 cursor-pointer hover:bg-gold transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-neutral-200 px-4 pt-4 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id, item.path);
                }}
                className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all ${ 
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black shadow-md'
                    : 'bg-[#f8f5ee] text-neutral-800 hover:bg-neutral-200 border border-gold/20'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </a>
            ))}
          </div>

          {/* Quick Dedicated Services & Galleries on Mobile */}
          <div className="space-y-2 pt-1">
            <a
              href="/services/heritage-homes"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                onNavigate?.('/services/heritage-homes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-3 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold flex items-center justify-between shadow-sm hover:brightness-105 transition-all border border-amber-600/30"
            >
              <span className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-neutral-950" />
                Heritage Homes & Traditional Design
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-950" />
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="/restaurant-interior-gallery"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  onNavigate?.('/restaurant-interior-gallery');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold flex items-center justify-between hover:bg-amber-600 transition-colors"
              >
                <span>Restaurant Gallery</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </a>
              <a
                href="/chettinad-kerala-traditional-homes"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  onNavigate?.('/chettinad-kerala-traditional-homes');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold flex items-center justify-between hover:bg-amber-600 transition-colors"
              >
                <span>Chettinad & Kerala Homes</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </a>
            </div>
          </div>
          <div className="pt-2 border-t border-neutral-200 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleContactClick();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:brightness-105 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-black" /> Contact Us
            </button>
            <button
              onClick={() => {
                onOpenQuote();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 rounded-xl bg-[#f8f5ee] hover:bg-gold/20 text-neutral-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-gold/40 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-black" /> Custom Quotation
            </button>
            <a
              href="https://wa.me/919916633338?text=Hi%20Royal%20Epic,%20I%20want%20to%20inquire%20about%20interior%20design"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#f8f5ee] hover:bg-gold text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-gold/40 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Inquiry
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
