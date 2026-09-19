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

// Dynamically imported portal chunks to prevent giant monolithic bundle issues
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const CustomersSubdomainPortal = React.lazy(() => import('./components/CustomersSubdomainPortal').then(m => ({ default: m.CustomersSubdomainPortal })));

const SubdomainLoadingFallback = () => (
  <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-4">
    <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-4" />
    <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">Loading Royal Epic Workspace...</p>
  </div>
);

/**
 * Helper to detect current hostname.
 * Detects:
 * - admin.royalepicinterior.com -> Admin Dashboard directly
 * - customers.royalepicinterior.com -> Customer Subdomain Portal directly
 * - royalepicinterior.com / www.royalepicinterior.com -> Normal public homepage
 * Also supports ?hostname=, ?host=, or ?subdomain= parameters for test/preview simulation.
 */
function getResolvedHostname(): string {
  if (typeof window === 'undefined') return '';
  try {
    const params = new URLSearchParams(window.location.search);
    const hostParam = params.get('hostname') || params.get('host');
    if (hostParam) {
      return hostParam.toLowerCase().trim();
    }
    const subdomainParam = params.get('subdomain');
    if (subdomainParam === 'admin') return 'admin.royalepicinterior.com';
    if (subdomainParam === 'customers' || subdomainParam === 'customer') return 'customers.royalepicinterior.com';
  } catch (_) {}
  return window.location.hostname.toLowerCase().trim();
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [hostname, setHostname] = useState<string>(getResolvedHostname);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [products, setProducts] = useState(PRODUCTS_DATA);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiConsultantOpen, setIsAiConsultantOpen] = useState(false);
  const [showInquiryPopup, setShowInquiryPopup] = useState(false);
  const [quoteModalTitle, setQuoteModalTitle] = useState('');

  // Subdomain identification
  const isAdminSubdomain = 
    hostname === 'admin.royalepicinterior.com' || 
    hostname.startsWith('admin.');

  const isCustomersSubdomain = 
    hostname === 'customers.royalepicinterior.com' || 
    hostname === 'customer.royalepicinterior.com' ||
    hostname.startsWith('customers.') || 
    hostname.startsWith('customer.');

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setHostname(getResolvedHostname());
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setHostname(getResolvedHostname());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update document title for dedicated subdomains
  useEffect(() => {
    if (isAdminSubdomain) {
      document.title = 'Royal Epic Admin Dashboard | ERP & Management Portal';
    } else if (isCustomersSubdomain) {
      document.title = 'Royal Epic Customer Portal | Client & Executive Workspace';
    }
  }, [isAdminSubdomain, isCustomersSubdomain]);

  const handleSubdomainBackToWebsite = () => {
    if (window.location.hostname.endsWith('royalepicinterior.com')) {
      window.location.href = 'https://royalepicinterior.com';
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('subdomain');
      url.searchParams.delete('hostname');
      url.searchParams.delete('host');
      window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
      setHostname(getResolvedHostname());
      setActiveTab('home');
    }
  };

  const handleSubdomainNavigateToAdmin = () => {
    if (window.location.hostname.endsWith('royalepicinterior.com')) {
      window.location.href = 'https://admin.royalepicinterior.com';
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set('subdomain', 'admin');
      window.history.pushState({}, '', url.pathname + url.search);
      setHostname(getResolvedHostname());
    }
  };

  const handleSubdomainNavigateToCustomers = () => {
    if (window.location.hostname.endsWith('royalepicinterior.com')) {
      window.location.href = 'https://customers.royalepicinterior.com';
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set('subdomain', 'customers');
      window.history.pushState({}, '', url.pathname + url.search);
      setHostname(getResolvedHostname());
    }
  };

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

  // Automated Enquiry Popup Trigger on page visit (only on main public site)
  useEffect(() => {
    if (isAdminSubdomain || isCustomersSubdomain) return;

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
  }, [isAdminSubdomain, isCustomersSubdomain]);

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

  // -------------------------------------------------------------
  // 1. DEDICATED ADMIN SUBDOMAIN (admin.royalepicinterior.com)
  // When visited at https://admin.royalepicinterior.com, load the
  // existing Admin Dashboard directly.
  // -------------------------------------------------------------
  if (isAdminSubdomain) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white font-sans">
        <React.Suspense fallback={<SubdomainLoadingFallback />}>
          <AdminDashboard
            products={products}
            onProductsUpdated={fetchProducts}
            onBackToWebsite={handleSubdomainBackToWebsite}
            onNavigateToCustomers={handleSubdomainNavigateToCustomers}
          />
        </React.Suspense>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. DEDICATED CUSTOMERS SUBDOMAIN (customers.royalepicinterior.com)
  // When visited at https://customers.royalepicinterior.com, load the
  // existing Customer Portal directly.
  // -------------------------------------------------------------
  if (isCustomersSubdomain) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white font-sans">
        <React.Suspense fallback={<SubdomainLoadingFallback />}>
          <CustomersSubdomainPortal
            onBackToWebsite={handleSubdomainBackToWebsite}
            onNavigateToAdmin={handleSubdomainNavigateToAdmin}
            onOpenQuote={(title) => handleOpenQuote(title || '')}
          />
          {quoteModalTitle && (
            <QuoteModal
              isOpen={!!quoteModalTitle}
              onClose={() => setQuoteModalTitle('')}
              prefilledTitle={quoteModalTitle}
            />
          )}
        </React.Suspense>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. MAIN DOMAIN & WWW (royalepicinterior.com / www.royalepicinterior.com)
  // Loads normal public website with all existing path-based routes preserved.
  // -------------------------------------------------------------
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

            {(activeTab === 'customers' || currentPath === '/customers' || currentPath === '/customer') && (
              <React.Suspense fallback={<SubdomainLoadingFallback />}>
                <CustomersSubdomainPortal
                  onBackToWebsite={() => { setActiveTab('home'); navigateTo('/'); }}
                  onNavigateToAdmin={() => { setActiveTab('admin'); navigateTo('/admin'); }}
                  onOpenQuote={(title) => handleOpenQuote(title || '')}
                />
              </React.Suspense>
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

            {(activeTab === 'admin' || currentPath === '/admin') && (
              <React.Suspense fallback={<SubdomainLoadingFallback />}>
                <AdminDashboard 
                  products={products} 
                  onProductsUpdated={fetchProducts}
                  onBackToWebsite={() => { setActiveTab('home'); navigateTo('/'); }}
                  onNavigateToCustomers={() => { setActiveTab('customers'); navigateTo('/customers'); }}
                />
              </React.Suspense>
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
