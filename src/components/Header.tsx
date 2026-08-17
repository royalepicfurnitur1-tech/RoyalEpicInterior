import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  Crown, Menu, X, FileText, User, ChevronRight, MessageSquare, ShieldCheck, LogOut, Code, Building,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenQuote: () => void;
  onOpenSearch: () => void;
  onOpenAiConsultant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenQuote,
  onOpenSearch,
  onOpenAiConsultant,
}) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const baseNavItems: { id: ActiveTab; label: string; badge?: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'products', label: 'Products' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'ai-design', label: 'AI Design', badge: 'New' },
    { id: 'estimator', label: 'Estimator', badge: 'AI' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'blog', label: 'Blog' },
    { id: 'contact', label: 'Contact' },
  ];

  // Conditional Rendering: Add protected dashboard options based on auth session & role
  const navItems = [
    ...baseNavItems,
    ...(user ? [{ id: 'dashboard' as ActiveTab, label: 'Client Portal', badge: 'Live' }] : []),
    ...(isAdmin ? [{ id: 'admin' as ActiveTab, label: 'Admin Hub', badge: 'ERP' }] : []),
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-neutral-200 text-neutral-900 transition-all shadow-sm">
      {/* Top Bar for Contact & Quick Info */}
      <div className="bg-neutral-900 text-neutral-200 py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-amber-400 font-mono">
              <Sparkles className="w-3 h-3 text-gold" /> Real-time Project Tracking Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> SSL Encrypted
            </span>
            <span className="text-neutral-700">|</span>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-neutral-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-amber-400" /> Client Portal
            </button>

            <span className="text-neutral-700">|</span>
            <button
              onClick={() => handleNavClick('admin')}
              className={`text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'admin' ? 'text-purple-400 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-purple-400" /> Admin SAS
            </button>

            <span className="text-neutral-700">|</span>
            <button
              onClick={() => handleNavClick('developer')}
              className={`text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'developer' ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-emerald-400'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" /> Dev Console
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('home')}
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
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
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
              </button>
            );
          })}
        </nav>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          
          {/* AI Voice Consultant Button */}
          {onOpenAiConsultant && (
            <button
              onClick={onOpenAiConsultant}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black border border-amber-500 hover:shadow-lg shadow-gold/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold font-serif"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>AI Consultant</span>
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-[#f8f5ee] border border-gold/40 text-neutral-900 cursor-pointer hover:bg-gold transition-colors"
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
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black shadow-md'
                    : 'bg-[#f8f5ee] text-neutral-800 hover:bg-neutral-200 border border-gold/20'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-neutral-200 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenQuote();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:brightness-105"
            >
              <FileText className="w-4 h-4 text-black" /> Custom Quotation
            </button>
            <a
              href="https://wa.me/919916633338?text=Hi%20Royal%20Epic,%20I%20want%20to%20inquire%20about%20interior%20design"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#f8f5ee] hover:bg-gold text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-gold/40 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Inquiry
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

