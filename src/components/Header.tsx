import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  Crown, Menu, X, User, ChevronRight, ChevronDown, MessageSquare, Phone, Search, ShoppingBag, ArrowRight
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
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exact navigation items specified in reference design & user prompt
  const navItems = [
    { id: 'home' as ActiveTab, path: '/', label: 'Home' },
    { id: 'products' as ActiveTab, path: '/products', label: 'Products', hasDropdown: true },
    { id: 'services' as ActiveTab, path: '/our-services', label: 'Services', hasDropdown: true },
    { id: 'portfolio' as ActiveTab, path: '/portfolio', label: 'Projects' },
    { id: 'about' as ActiveTab, path: '/about-us', label: 'About Us' },
    { id: 'contact' as ActiveTab, path: '/contact-us', label: 'Contact' },
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
    <header className="sticky top-0 z-50 w-full bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-800/90 text-white transition-all shadow-md">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Left Side: Brand Logo matching reference */}
        <div className="flex items-center gap-4 sm:gap-6">
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home', '/');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs group-hover:bg-amber-500/20 transition-all">
              <Crown className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-amber-400 group-hover:text-amber-300 transition-colors uppercase">
                ROYAL EPIC
              </h1>
              <p className="text-[9px] uppercase tracking-[0.24em] text-neutral-400 font-sans font-semibold">
                INTERIORS
              </p>
            </div>
          </a>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            // Products Dropdown
            if (item.id === 'products') {
              return (
                <div key={item.id} className="relative group">
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.id, item.path);
                    }}
                    className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'text-amber-400 bg-neutral-900 border border-neutral-800'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                  </a>

                  {/* Products Mega Dropdown */}
                  <div className="absolute top-full left-0 w-80 pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                    <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 p-2 space-y-1">
                      <a
                        href="/products"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick('products', '/products');
                        }}
                        className="block px-3 py-2.5 rounded-xl hover:bg-neutral-800/80 transition-colors group/sub"
                      >
                        <span className="text-xs font-bold text-white block group-hover/sub:text-amber-400">
                          Complete Furniture Catalog
                        </span>
                        <span className="text-[10px] text-neutral-400 block">
                          Browse all 85+ bespoke luxury pieces & materials
                        </span>
                      </a>
                      <a
                        href="/products/dining-tables"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick('products', '/products');
                        }}
                        className="block px-3 py-2 rounded-xl hover:bg-neutral-800/60 transition-colors"
                      >
                        <span className="text-xs text-neutral-300 hover:text-amber-400 block">
                          Italian Marble & Onyx Dining Tables
                        </span>
                      </a>
                      <a
                        href="/products/modular-kitchens"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick('products', '/products');
                        }}
                        className="block px-3 py-2 rounded-xl hover:bg-neutral-800/60 transition-colors"
                      >
                        <span className="text-xs text-neutral-300 hover:text-amber-400 block">
                          Modular Kitchens & Island Units
                        </span>
                      </a>
                      <a
                        href="/products/wpc-bathroom-doors"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick('products', '/products');
                        }}
                        className="block px-3 py-2 rounded-xl hover:bg-neutral-800/60 transition-colors"
                      >
                        <span className="text-xs text-neutral-300 hover:text-amber-400 block">
                          WPC Waterproof Doors & Panels
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            }

            // Services Dropdown
            if (item.id === 'services') {
              return (
                <div key={item.id} className="relative group">
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.id, item.path);
                    }}
                    className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'text-amber-400 bg-neutral-900 border border-neutral-800'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                  </a>

                  {/* Services Submenu Dropdown */}
                  <div className="absolute top-full left-0 w-80 pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                    <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 p-2 space-y-1">
                      <a
                        href="/services/heritage-homes"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate?.('/services/heritage-homes');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="block px-3 py-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-950/60 transition-colors group/sub border border-amber-800/40"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-amber-400 block group-hover/sub:text-amber-300">
                            Heritage Homes & Traditional Design
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase border border-amber-500/30">
                            Exclusive
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 block">
                          Kerala Nalukettu, Chettinad, courtyards & timber architecture
                        </span>
                      </a>
                      <a
                        href="/our-services"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick('services', '/our-services');
                        }}
                        className="block px-3 py-2.5 rounded-xl hover:bg-neutral-800/80 transition-colors group/sub"
                      >
                        <span className="text-xs font-bold text-white block group-hover/sub:text-amber-400">
                          All Interior & Turnkey Services
                        </span>
                        <span className="text-[10px] text-neutral-400 block">
                          Residential, commercial, modular kitchens, & spa fitouts
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            }

            // Normal Nav Links (Home, Projects, About Us, Contact)
            return (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id, item.path);
                }}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer inline-block ${
                  isActive
                    ? 'text-amber-400 bg-neutral-900 border border-neutral-800'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right Side: CTAs & Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Search Button */}
          <button
            onClick={() => onOpenSearch ? onOpenSearch() : onSearchClick?.()}
            className="p-2 sm:p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all flex items-center justify-center cursor-pointer shadow-xs"
            aria-label="Search Catalog"
            title="Search Products & Services"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative p-2 sm:p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all flex items-center justify-center cursor-pointer shadow-xs"
            aria-label="Shopping Cart"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* User Sign In / Profile */}
          {user ? (
            <button
              onClick={() => handleNavClick('dashboard', '/dashboard')}
              className="hidden sm:flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 transition-colors cursor-pointer"
              title="Customer Account"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-neutral-950 font-bold text-[10px] flex items-center justify-center uppercase">
                {profile?.name ? profile.name.charAt(0) : user.email?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-medium max-w-[80px] truncate">
                {profile?.name?.split(' ')[0] || user.email?.split('@')[0] || 'Account'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('dashboard', '/dashboard')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In</span>
            </button>
          )}

          {/* Primary CTA: "Get Free Quote" matching reference image */}
          <button
            onClick={() => onOpenQuote?.()}
            className="hidden md:inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl border border-amber-500/70 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer"
          >
            <span>Get Free Quote</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white cursor-pointer hover:bg-neutral-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-neutral-950 border-b border-neutral-800 px-4 pt-4 pb-6 space-y-3 animate-fadeIn">
          
          {/* Quick Action Icons */}
          <div className="grid grid-cols-3 gap-2 pb-3 border-b border-neutral-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSearch ? onOpenSearch() : onSearchClick?.();
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-semibold"
            >
              <Search className="w-4 h-4 mb-1 text-amber-400" />
              <span>Search</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCart();
              }}
              className="relative flex flex-col items-center justify-center p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-semibold"
            >
              <ShoppingBag className="w-4 h-4 mb-1 text-amber-400" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute top-1 right-2 bg-amber-500 text-neutral-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavClick('dashboard', '/dashboard');
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-semibold"
            >
              <User className="w-4 h-4 mb-1 text-amber-400" />
              <span>{user ? 'Account' : 'Sign In'}</span>
            </button>
          </div>

          {/* Navigation Items Grid */}
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id, item.path);
                }}
                className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-left transition-all ${ 
                  activeTab === item.id
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-850 border border-neutral-800'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </a>
            ))}
          </div>

          {/* Direct CTA Buttons on Mobile */}
          <div className="pt-2 border-t border-neutral-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuote?.();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>Get Free Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleContactClick();
                }}
                className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Call Us</span>
              </button>
              <a
                href="https://wa.me/919916633338?text=Hi%20Royal%20Epic,%20I%20want%20to%20inquire%20about%20interior%20design"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
