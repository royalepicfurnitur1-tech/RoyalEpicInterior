import React, { useState, useEffect } from 'react';
import { PRODUCTS_DATA } from './data/mockData';
import { SEO_PAGES } from './data/seoPages';
import { SeoPageRenderer } from './components/SeoPageRenderer';
import { Header } from './components/Header';
import { HeritageHomes } from './pages/HeritageHomes';
import { TurnkeyInteriorsPage } from './pages/TurnkeyInteriorsPage';
import { ThreeHeroRing } from './components/ThreeHeroRing';
import { ServicesSection } from './components/ServicesSection';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PortfolioSection } from './components/PortfolioSection';
import { BlogSection } from './components/BlogSection';
import { ContactSection } from './components/ContactSection';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomersSubdomainPortal } from './components/CustomersSubdomainPortal';
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { ProductManagerPortal } from './components/ProductManagerPortal';
import { ProductDetailPage } from './components/ProductDetailPage';
import { QuoteModal } from './components/QuoteModal';
import { SearchModal } from './components/SearchModal';
import { AiConsultantModal } from './components/AiConsultantModal';
import { InquiryPopup } from './components/InquiryPopup';
import { Footer } from './components/Footer';
import { ActiveTab } from './types';
import { submitLeadToSupabase } from './lib/supabase';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [products, setProducts] = useState(PRODUCTS_DATA);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiConsultantOpen, setIsAiConsultantOpen] = useState(false);
  const [showInquiryPopup, setShowInquiryPopup] = useState(false);
  const [quoteModalTitle, setQuoteModalTitle] = useState('');
  
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleScrollToContact = () => {
    if (currentPath !== '/') {
      navigateTo('/');
    }
    if (activeTab !== 'home') {
      setActiveTab('home');
    }
    setTimeout(() => {
      const contactEl = document.getElementById('contact');
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 150);
  };

  // If user navigates to /contact-us, direct to bottom home contact form
  useEffect(() => {
    if (currentPath === '/contact-us') {
      handleScrollToContact();
    }
  }, [currentPath]);

  // Automated Enquiry Popup Trigger on page visit
  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem('royalepic_inquiry_popup_dismissed');
      const isSubmitted = sessionStorage.getItem('royalepic_inquiry_popup_submitted');
      if (!isDismissed && !isSubmitted) {
        const timer = setTimeout(() => {
          setShowInquiryPopup(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Inquiry session check note:', e);
    }
  }, []);

  // Global helper for opening enquiry popup
  useEffect(() => {
    (window as any).openInquiryPopup = () => setShowInquiryPopup(true);
    return () => {
      delete (window as any).openInquiryPopup;
    };
  }, []);

  const handleCloseInquiryPopup = () => {
    setShowInquiryPopup(false);
    try {
      sessionStorage.setItem('royalepic_inquiry_popup_dismissed', 'true');
    } catch (e) {}
  };

  const handleInquiryLeadSubmit = async (
    name: string,
    phone: string,
    email?: string,
    description?: string,
    projectType?: string,
    budget?: string
  ) => {
    try {
      await submitLeadToSupabase({
        full_name: name,
        phone: phone,
        email: email || undefined,
        service_type: projectType || 'Complete Turnkey Project',
        estimated_budget: budget || '₹5 Lakhs - ₹15 Lakhs',
        project_scope: description || '',
        source: 'Website Enquiry Popup Form'
      });
      try {
        sessionStorage.setItem('royalepic_inquiry_popup_submitted', 'true');
      } catch (e) {}
    } catch (err) {
      console.warn('Inquiry popup submit note:', err);
    }
  };

  const handleOpenQuote = (title: string) => {
    setQuoteModalTitle(title);
  };

  const findCategoryBySlug = (slug: string) => null;
  const findProductBySlug = (prods: any[], slug: string) => prods.find(p => p.id === slug);
  const handleSelectProduct = (p: any) => {};
  const handleAddToCart = (p: any) => {};
  const handleToggleWishlist = (p: any) => {};
  const fetchProducts = async () => {};

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onTabChange={setActiveTab} 
        onNavigate={navigateTo}
        onContactClick={handleScrollToContact}
        wishlistCount={wishlistIds.length}
        cartCount={0}
        onOpenCart={() => {}}
        onOpenQuote={() => handleOpenQuote('')}
        onOpenSearch={() => setIsSearchOpen(true)}
        onSearchClick={() => setIsSearchOpen(true)}
      />
      <main className="flex-1 flex flex-col pt-[72px]">
        {currentPath === '/services/heritage-homes' ? (
          <HeritageHomes
            onNavigate={navigateTo}
            onRequestQuote={(title) => handleOpenQuote(title)}
          />
        ) : currentPath === '/turnkey-interior-contractors-bangalore' ? (
          <TurnkeyInteriorsPage
            onNavigate={navigateTo}
            onRequestQuote={(title) => handleOpenQuote(title)}
          />
        ) : currentPath !== '/' && currentPath !== '/contact-us' && SEO_PAGES[currentPath] ? (
          <SeoPageRenderer
            pageData={SEO_PAGES[currentPath]}
            onNavigate={navigateTo}
            onRequestQuote={(title) => handleOpenQuote(title)}
          />
        ) : currentPath.startsWith('/products/') ? (
          (() => {
            const slug = currentPath.replace(/^\/products\//, '').split('?')[0].replace(/\/$/, '');
            const productMatch = findProductBySlug(products, slug);
            return (
              <ProductDetailPage
                product={productMatch || null}
                allProducts={products}
                onNavigate={navigateTo}
                onAddToCart={(p) => handleAddToCart(p)}
                onBuyNow={(p) => {}}
                onRequestQuote={(title) => handleOpenQuote(title)}
                isWishlisted={productMatch ? wishlistIds.includes(productMatch.id) : false}
                onToggleWishlist={(p) => handleToggleWishlist(p)}
              />
            );
          })()
        ) : (
          <>
            {activeTab === 'home' && (
              <>
                <ThreeHeroRing 
                  onSelectItem={(cat, title) => {}}
                  onRequestQuote={(title) => handleOpenQuote(title)} 
                />
                <ServicesSection onRequestQuote={(title) => handleOpenQuote(title)} />
                <ProductCatalog
                  products={products}
                  initialCategory="All"
                  onSelectProduct={(p) => handleSelectProduct(p)}
                  onAddToCart={(p) => handleAddToCart(p)}
                  onToggleWishlist={(p) => handleToggleWishlist(p)}
                  wishlistIds={wishlistIds}
                  onRequestQuote={(title) => handleOpenQuote(title)}
                />
                <PortfolioSection onRequestQuote={(title) => handleOpenQuote(title)} />
                <BlogSection onRequestQuote={(title) => handleOpenQuote(title)} />
                <ContactSection />
              </>
            )}

            {activeTab === 'services' && (
              <ServicesSection onRequestQuote={(title) => handleOpenQuote(title)} />
            )}

            {activeTab === 'products' && (
              <ProductCatalog
                products={products}
                initialCategory="All"
                onSelectProduct={(p) => handleSelectProduct(p)}
                onAddToCart={(p) => handleAddToCart(p)}
                onToggleWishlist={(p) => handleToggleWishlist(p)}
                wishlistIds={wishlistIds}
                onRequestQuote={(title) => handleOpenQuote(title)}
              />
            )}

            {activeTab === 'portfolio' && (
              <PortfolioSection onRequestQuote={(title) => handleOpenQuote(title)} />
            )}

            {activeTab === 'gallery' && (
              <PortfolioSection onRequestQuote={(title) => handleOpenQuote(title)} />
            )}

            {activeTab === 'blog' && <BlogSection onRequestQuote={(title) => handleOpenQuote(title)} />}

            {activeTab === 'contact' && <ContactSection />}

            {(activeTab === 'dashboard' || activeTab === 'track-order') && (
              <CustomerDashboard
                wishlistProducts={[]}
                onRequestQuote={(title) => handleOpenQuote(title)}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersSubdomainPortal
                onBackToWebsite={() => setActiveTab('home')}
                onNavigateToAdmin={() => setActiveTab('admin')}
                onOpenQuote={(title) => handleOpenQuote(title || '')}
              />
            )}

            {activeTab === 'developer' && (
              <DeveloperDashboard />
            )}

            {(activeTab === 'product-manager' || activeTab === 'product-management') && (
              <ProductManagerPortal
                onBackToWebsite={() => setActiveTab('home')}
                onNavigateToAdmin={() => setActiveTab('admin')}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard products={products} onProductsUpdated={fetchProducts} />
            )}
          </>
        )}
      </main>

      <Footer setActiveTab={setActiveTab} onOpenQuote={() => handleOpenQuote('')} />

      {quoteModalTitle && (
        <QuoteModal
          isOpen={!!quoteModalTitle}
          onClose={() => setQuoteModalTitle('')}
          prefilledTitle={quoteModalTitle}
        />
      )}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(p) => handleSelectProduct(p)}
        onRequestQuote={(title) => handleOpenQuote(title)}
      />

      <AiConsultantModal
        isOpen={isAiConsultantOpen}
        onClose={() => setIsAiConsultantOpen(false)}
        onRequestQuote={(title) => handleOpenQuote(title)}
      />

      {showInquiryPopup && (
        <InquiryPopup
          onClose={handleCloseInquiryPopup}
          onSubmitLead={handleInquiryLeadSubmit}
        />
      )}
    </div>
  );
}
