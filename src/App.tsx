import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Product, CartItem } from './types';
import { PRODUCTS_DATA } from './data/mockData';
import { SEO_PAGES } from './data/seoPages';
import { SeoPageRenderer } from './components/SeoPageRenderer';
import { Header } from './components/Header';
import { ThreeHeroRing } from './components/ThreeHeroRing';
import { ServicesSection } from './components/ServicesSection';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductDetailPage } from './components/ProductDetailPage';
import { PortfolioSection } from './components/PortfolioSection';
import { QuoteModal } from './components/QuoteModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { ContactSection } from './components/ContactSection';
import { BlogSection } from './components/BlogSection';
import { InquiryPopup } from './components/InquiryPopup';
import { FloatingActions } from './components/FloatingActions';
import { SearchModal } from './components/SearchModal';
import { AiConsultantModal } from './components/AiConsultantModal';
import { CustomersSubdomainPortal } from './components/CustomersSubdomainPortal';
import { ProductManagerPortal } from './components/ProductManagerPortal';
import { ProductManagementModule } from './components/ProductManagementModule';
import { Footer } from './components/Footer';
import { ShieldCheck, Award, Wrench, Sparkles } from 'lucide-react';
import { submitLeadToSupabase } from './lib/supabase';
import { getProducts } from './services/productService';
import { useAuth } from './context/AuthContext';
import { deduplicateProducts } from './utils/productSlug';
import { 
  fetchDbCart, 
  addToDbCart, 
  updateDbCartQuantity, 
  removeDbCartItem, 
  mergeGuestCartToDb, 
  clearDbCart 
} from './services/cartService';
import { 
  getProductSlug, 
  findProductBySlug, 
  findCategoryBySlug 
} from './utils/productSlug';
import { 
  updatePageHead, 
  updateProductSeo, 
  updateCategorySeo, 
  BASE_PRODUCTION_DOMAIN 
} from './utils/seoHelper';

export default function App() {
  // Subdomain & Path-based detection for Admin, Customers, and Dev workspaces
  const isDedicatedAdmin = typeof window !== 'undefined' && (
    window.location.hostname.startsWith('admin.') || 
    window.location.pathname.startsWith('/admin')
  );

  const isDedicatedCustomers = typeof window !== 'undefined' && (
    window.location.hostname.startsWith('customers.') || 
    window.location.hostname.startsWith('customer.') || 
    window.location.hostname.startsWith('portal.') || 
    window.location.pathname.startsWith('/customers') ||
    window.location.pathname.startsWith('/customer-portal')
  );

  const isDedicatedDev = typeof window !== 'undefined' && (
    window.location.hostname.startsWith('dev.') || 
    window.location.pathname.startsWith('/dev')
  );

  const isDedicatedProductModule = typeof window !== 'undefined' && (
    window.location.hostname.startsWith('product.') ||
    window.location.pathname.startsWith('/product-management') ||
    window.location.pathname === '/product'
  );

  const isDedicatedProducts = typeof window !== 'undefined' && (
    window.location.hostname.startsWith('products.') || 
    window.location.pathname.startsWith('/products-hub') ||
    window.location.pathname.startsWith('/product-manager')
  );

  const isProductsRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/products')
  );

  const initialTab: ActiveTab = isDedicatedProductModule
    ? 'product-management'
    : (isDedicatedProducts
        ? 'product-manager'
        : (isDedicatedAdmin 
            ? 'admin' 
            : (isDedicatedCustomers 
                ? 'customers' 
                : (isDedicatedDev 
                    ? 'developer' 
                    : (isProductsRoute ? 'products' : 'home')))));

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [currentPath, setCurrentPath] = useState<string>(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['prod-1', 'prod-2']);
  const [products, setProducts] = useState<Product[]>(PRODUCTS_DATA);
  const [catalogCategory, setCatalogCategory] = useState<string>(() => {
    if (typeof window === 'undefined') return 'All';
    const path = window.location.pathname;
    if (path.startsWith('/products/')) {
      const slug = path.replace(/^\/products\//, '').split('?')[0].replace(/\/$/, '');
      if (slug) {
        const cat = findCategoryBySlug(slug);
        if (cat) return cat;
      }
    }
    return 'All';
  });

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState<boolean>(false);
  const [quotePrefill, setQuotePrefill] = useState({ title: '', budget: '' });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAiConsultantOpen, setIsAiConsultantOpen] = useState<boolean>(false);
  const [showInquiryPopup, setShowInquiryPopup] = useState<boolean>(false);

  // Sync Cart with Server Database upon Authentication / User Change
  useEffect(() => {
    let isMounted = true;

    async function syncUserCart() {
      if (user?.id) {
        try {
          if (cartItems.length > 0) {
            const merged = await mergeGuestCartToDb(user.id, cartItems);
            if (isMounted) {
              setCartItems(merged);
            }
          } else {
            const dbItems = await fetchDbCart(user.id);
            if (isMounted) {
              setCartItems(dbItems);
            }
          }
        } catch (err) {
          console.error("Cart sync error:", err);
        }
      }
    }

    syncUserCart();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Fetch products from Supabase CMS / Local Storage
  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      if (res.products && res.products.length > 0) {
        setProducts(deduplicateProducts(res.products));
      }
    } catch (e) {
      console.error("Failed to load CMS products:", e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sync state with URL popstate (Browser Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle Dynamic URL Routing (e.g., /products/:slug, /our-services, /portfolio, etc.)
  useEffect(() => {
    const path = currentPath;

    // 1. Check for /products/:slug or /products/:category
    if (path.startsWith('/products/')) {
      const slug = path.replace(/^\/products\//, '').split('?')[0].replace(/\/$/, '');
      if (slug) {
        // Check if category slug
        const categoryMatch = findCategoryBySlug(slug);
        if (categoryMatch) {
          setActiveTab('products');
          setCatalogCategory(categoryMatch);
          setSelectedProduct(null);
          updateCategorySeo(categoryMatch, slug);
          return;
        }

        // Check if product slug
        const productMatch = findProductBySlug(products, slug);
        if (productMatch) {
          setActiveTab('products');
          setSelectedProduct(null);
          updateProductSeo(productMatch);
          return;
        }

        // If neither category nor product match, set 404 SEO
        setActiveTab('products');
        setSelectedProduct(null);
        updatePageHead({
          title: 'Product Not Found | Royal Epic Interior',
          description: 'The requested product could not be found or may have been renamed in our factory catalog.',
          canonicalPath: path,
          type: 'website'
        });
        return;
      }
    }

    // 2. Exact Route Mappings
    if (path === '/products' || path === '/products/') {
      setActiveTab('products');
      setSelectedProduct(null);
      updatePageHead({
        title: 'Luxury Modular Kitchens, Wardrobes & Custom Furniture | Royal Epic Interior',
        description: 'Browse direct factory-crafted interior products: modular kitchens, sliding wardrobes, teak wood main entrance doors, WPC bathroom doors, dining tables, and commercial kitchen equipment.',
        canonicalPath: '/products',
        type: 'website'
      });
      return;
    }

    if (path === '/our-services') {
      setActiveTab('services');
      setSelectedProduct(null);
      return;
    }

    if (path === '/portfolio') {
      setActiveTab('portfolio');
      setSelectedProduct(null);
      return;
    }

    if (path === '/completed-projects') {
      setActiveTab('gallery');
      setSelectedProduct(null);
      return;
    }

    if (path === '/blog') {
      setActiveTab('blog');
      setSelectedProduct(null);
      return;
    }

    if (path === '/contact-us') {
      setActiveTab('contact');
      setSelectedProduct(null);
      return;
    }

    if (path === '/track-order') {
      setActiveTab('track-order');
      setSelectedProduct(null);
      return;
    }

    if (path === '/get-free-quote') {
      setIsQuoteOpen(true);
      return;
    }

    // 3. Fallback to Active Tab Metadata if not an SEO sub-page
    if (!SEO_PAGES[path]) {
      const seoMap: Record<string, { title: string; description: string }> = {
        home: {
          title: 'Royal Epic Interior & Furniture | Luxury Turnkey Interiors Bengaluru',
          description: 'Complete end-to-end turnkey interior execution, custom furniture manufacturing, WPC waterproof doors, beauty spa fit-outs, restaurant interior design, and corporate office space planning in Bengaluru.'
        },
        services: {
          title: 'Interior Design Services & Turnkey Execution | Royal Epic Bengaluru',
          description: 'Explore Royal Epic turnkey interior services: Residential homes, Beauty Spa interiors, Restaurant fit-outs, Corporate office workspace planning, and WPC waterproof doors.'
        },
        products: {
          title: 'Luxury Modular Kitchens, Wardrobes & Custom Furniture | Royal Epic Interior',
          description: 'Browse factory-crafted luxury furniture: Modular kitchens, sliding wardrobes, solid teak main entrance doors, WPC bathroom doors, and TV consoles.'
        },
        portfolio: {
          title: 'Completed Turnkey Interior Projects & Showcase | Royal Epic Interior',
          description: 'View real project photo galleries and video walk-throughs of completed luxury villas, corporate offices, beauty spas, and fine dining restaurants.'
        },
        gallery: {
          title: 'Interior Design Inspiration & Media Gallery | Royal Epic Interior',
          description: 'High-definition photo gallery and project walkthroughs of completed turnkey interior works, SS modular kitchens, and custom woodwork.'
        },
        blog: {
          title: 'Interior Design Journal & Turnkey Project Guides | Royal Epic Interior',
          description: 'Expert articles on turnkey interior execution, beauty spa design principles, home decorating, restaurant fit-outs, and corporate office planning.'
        },
        contact: {
          title: 'Contact Royal Epic Interior & Furniture | Thanisandra, Bengaluru',
          description: 'Visit our main showroom and factory at No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru - 560077 or call +91 99166 33338.'
        },
        'track-order': {
          title: 'Customer Project Dashboard & Live Tracking | Royal Epic RE Teams',
          description: 'Track your ongoing interior project stages from site measurement, 3D design approval, factory production, to final dispatch and site installation.'
        },
        dashboard: {
          title: 'Customer Project Dashboard & Live Tracking | Royal Epic RE Teams',
          description: 'Track your ongoing interior project stages from site measurement, 3D design approval, factory production, to final dispatch and site installation.'
        },
        admin: {
          title: 'Internal ERP & Operations Command | RE Teams Royal Epic',
          description: 'Internal ERP and CRM system for Royal Epic Interior & Furniture employees and management.'
        },
        developer: {
          title: 'Developer Console | Royal Epic Architecture',
          description: 'Technical developer console and system metrics.'
        },
        customers: {
          title: 'Customers & Leads Workspace | Royal Epic Portal',
          description: 'Marketing executive workstation and client customer intelligence directory.'
        },
        'product-manager': {
          title: 'Product Catalog Management Hub | Royal Epic Products',
          description: 'Authorized Product Manager portal for updating inventory, prices, specifications, and photography.'
        },
        'product-management': {
          title: 'Product Management Module | product.royalepic.com',
          description: 'Dedicated Add-on Product Management module for managing categories, subcategories, and product catalog items.'
        }
      };

      const currentSeo = seoMap[activeTab] || seoMap.home;
      updatePageHead({
        title: currentSeo.title,
        description: currentSeo.description,
        canonicalPath: path === '/' ? '' : path,
        type: 'website'
      });
    }

    // Google Analytics Page View Tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: currentPath !== '/' ? currentPath : `/${activeTab}`,
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }, [activeTab, currentPath, products]);

  // Handle Product Selection with URL synchronization
  const handleSelectProduct = (product: Product) => {
    const slug = getProductSlug(product);
    navigateTo(`/products/${slug}`);
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
  };

  // Auto trigger inquiry popup after 15s if not closed
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInquiryPopup(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  // Database-backed Persistent Cart operations
  const handleAddToCart = async (
    product: Product, 
    quantity = 1, 
    variation?: any, 
    selectedAttributes?: Record<string, string>
  ) => {
    if (user?.id) {
      try {
        const updated = await addToDbCart(user.id, product, quantity, variation, selectedAttributes);
        if (updated && updated.length > 0) {
          setCartItems(updated);
        } else {
          // Fallback optimistic
          setCartItems((prev) => {
            const varId = variation?.id || null;
            const existing = prev.find((i) => 
              i.product.id === product.id && 
              (varId ? i.selectedVariation?.id === varId : JSON.stringify(i.selectedAttributes || {}) === JSON.stringify(selectedAttributes || {}))
            );
            if (existing) {
              return prev.map((i) =>
                i === existing ? { ...i, quantity: i.quantity + quantity } : i
              );
            }
            return [...prev, { product, quantity, selectedVariation: variation, selectedAttributes, unitPrice: variation?.price || product.price }];
          });
        }
      } catch (e) {
        console.error("Failed to add to database cart:", e);
      }
    } else {
      setCartItems((prev) => {
        const varId = variation?.id || null;
        const existing = prev.find((i) => 
          i.product.id === product.id && 
          (varId ? i.selectedVariation?.id === varId : JSON.stringify(i.selectedAttributes || {}) === JSON.stringify(selectedAttributes || {}))
        );
        if (existing) {
          return prev.map((i) =>
            i === existing ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        return [...prev, { product, quantity, selectedVariation: variation, selectedAttributes, unitPrice: variation?.price || product.price }];
      });
    }
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = async (productId: string, quantity: number, variationId?: string, itemId?: string) => {
    if (user?.id) {
      try {
        const updated = await updateDbCartQuantity(user.id, productId, quantity, variationId, itemId);
        setCartItems(updated);
      } catch (e) {
        console.error("Failed to update database cart quantity:", e);
      }
    } else {
      if (quantity <= 0) {
        setCartItems((prev) => prev.filter((i) => {
          if (itemId && i.id) return i.id !== itemId;
          if (i.product.id !== productId) return true;
          if (variationId) return i.selectedVariation?.id !== variationId;
          return false;
        }));
      } else {
        setCartItems((prev) =>
          prev.map((i) => {
            if (itemId && i.id === itemId) return { ...i, quantity };
            if (i.product.id === productId && (!variationId || i.selectedVariation?.id === variationId)) {
              return { ...i, quantity };
            }
            return i;
          })
        );
      }
    }
  };

  const handleRemoveCartItem = async (productId: string, variationId?: string, itemId?: string) => {
    if (user?.id) {
      try {
        const updated = await removeDbCartItem(user.id, productId, variationId, itemId);
        setCartItems(updated);
      } catch (e) {
        console.error("Failed to remove from database cart:", e);
      }
    } else {
      setCartItems((prev) => prev.filter((i) => {
        if (itemId && i.id) return i.id !== itemId;
        if (i.product.id !== productId) return true;
        if (variationId) return i.selectedVariation?.id !== variationId;
        return false;
      }));
    }
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  const handleOpenQuote = (title?: string, budget?: string) => {
    setQuotePrefill({
      title: title || '',
      budget: budget || '',
    });
    setIsQuoteOpen(true);
  };

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  // If visiting dedicated Customer Portal on customers.royalepic.com or activeTab is customers
  if (isDedicatedCustomers || activeTab === 'customers') {
    return (
      <div className="min-h-screen w-full bg-neutral-950 text-white font-sans selection:bg-gold selection:text-black antialiased">
        <CustomersSubdomainPortal 
          onBackToWebsite={() => setActiveTab('home')}
          onOpenQuote={(title) => handleOpenQuote(title)}
        />
      </div>
    );
  }

  // If visiting dedicated Dev subdomain or activeTab is developer
  if (isDedicatedDev || activeTab === 'developer') {
    return (
      <div className="min-h-screen w-full bg-neutral-950 text-white font-sans selection:bg-emerald-500 selection:text-black antialiased">
        <DeveloperDashboard />
      </div>
    );
  }

  // If visiting dedicated Product Management module on product.royalepic.com or activeTab is product-management
  if (isDedicatedProductModule || activeTab === 'product-management') {
    return (
      <div className="min-h-screen w-full bg-neutral-950 text-white font-sans selection:bg-gold selection:text-black antialiased">
        <ProductManagementModule 
          onBackToWebsite={() => setActiveTab('home')}
        />
      </div>
    );
  }

  // If visiting dedicated Products subdomain/path or activeTab is product-manager
  if (isDedicatedProducts || activeTab === 'product-manager') {
    return (
      <div className="min-h-screen w-full bg-neutral-950 text-white font-sans selection:bg-gold selection:text-black antialiased">
        <ProductManagerPortal 
          onBackToWebsite={() => setActiveTab('home')}
          onNavigateToAdmin={() => setActiveTab('admin')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white antialiased">
      
      {/* Glassmorphism Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          const tabToPathMap: Record<string, string> = {
            home: '/',
            services: '/our-services',
            products: '/products',
            portfolio: '/portfolio',
            gallery: '/completed-projects',
            blog: '/blog',
            contact: '/contact-us',
            'track-order': '/track-order',
            dashboard: '/track-order',
            customers: '/customers',
            admin: '/admin',
            developer: '/dev'
          };
          if (tabToPathMap[tab]) {
            navigateTo(tabToPathMap[tab]);
          } else {
            setCurrentPath('/');
          }
        }}
        onNavigate={navigateTo}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenQuote={() => handleOpenQuote()}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main View Router */}
      <main>
        {currentPath !== '/' && SEO_PAGES[currentPath] ? (
          <SeoPageRenderer
            pageData={SEO_PAGES[currentPath]}
            onNavigate={navigateTo}
            onRequestQuote={(title) => handleOpenQuote(title)}
          />
        ) : currentPath.startsWith('/products/') ? (
          (() => {
            const slug = currentPath.replace(/^\/products\//, '').split('?')[0].replace(/\/$/, '');
            const categoryMatch = findCategoryBySlug(slug);
            if (categoryMatch) {
              return (
                <ProductCatalog
                  products={products}
                  initialCategory={categoryMatch}
                  onSelectProduct={(p) => handleSelectProduct(p)}
                  onAddToCart={(p) => handleAddToCart(p)}
                  onToggleWishlist={(p) => handleToggleWishlist(p)}
                  wishlistIds={wishlistIds}
                  onRequestQuote={(title) => handleOpenQuote(title)}
                />
              );
            }
            const productMatch = findProductBySlug(products, slug);
            return (
              <ProductDetailPage
                product={productMatch || null}
                allProducts={products}
                onNavigate={navigateTo}
                onAddToCart={(p, q, v, a) => handleAddToCart(p, q, v, a)}
                onBuyNow={(p, v, a) => {
                  handleAddToCart(p, 1, v, a);
                  setIsCheckoutOpen(true);
                }}
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
                {/* Three.js Interactive 3D Hero Section */}
                <ThreeHeroRing
                  onSelectItem={(category, title) => {
                    if (category.includes('Kitchen') || category.includes('Door') || category.includes('Furniture') || category.includes('Wardrobe')) {
                      setActiveTab('products');
                      navigateTo('/products');
                    } else {
                      setActiveTab('portfolio');
                      navigateTo('/portfolio');
                    }
                  }}
                  onRequestQuote={(title) => handleOpenQuote(title)}
                />

                {/* Brand Trust Metrics & Certification Banner */}
                <section className="py-8 bg-neutral-100 border-y border-neutral-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div className="p-4 flex flex-col items-center">
                      <ShieldCheck className="w-8 h-8 text-neutral-900 mb-2" />
                      <span className="text-xl font-serif font-bold text-neutral-900 font-mono">15 Years</span>
                      <span className="text-[11px] text-neutral-600 font-medium">Termite & Waterproof Guarantee</span>
                    </div>
                    <div className="p-4 flex flex-col items-center">
                      <Award className="w-8 h-8 text-neutral-900 mb-2" />
                      <span className="text-xl font-serif font-bold text-neutral-900 font-mono">ISO 9001:2025</span>
                      <span className="text-[11px] text-neutral-600 font-medium">Certified Manufacturing Plant</span>
                    </div>
                    <div className="p-4 flex flex-col items-center">
                      <Wrench className="w-8 h-8 text-neutral-900 mb-2" />
                      <span className="text-xl font-serif font-bold text-neutral-900 font-mono">304 SS Grade</span>
                      <span className="text-[11px] text-neutral-600 font-medium">Commercial Kitchen Equipment</span>
                    </div>
                    <div className="p-4 flex flex-col items-center">
                      <Sparkles className="w-8 h-8 text-neutral-900 mb-2" />
                      <span className="text-xl font-serif font-bold text-neutral-900 font-mono">500+ Projects</span>
                      <span className="text-[11px] text-neutral-600 font-medium">Turnkey Villas & Offices Completed</span>
                    </div>
                  </div>
                </section>

                {/* Featured Services */}
                <ServicesSection onRequestQuote={(title) => handleOpenQuote(title)} />

                {/* Featured Product Catalog */}
                <ProductCatalog
                  products={products}
                  initialCategory={catalogCategory}
                  onSelectProduct={(p) => handleSelectProduct(p)}
                  onAddToCart={(p) => handleAddToCart(p)}
                  onToggleWishlist={(p) => handleToggleWishlist(p)}
                  wishlistIds={wishlistIds}
                  onRequestQuote={(title) => handleOpenQuote(title)}
                />

                {/* Portfolio Before & After Slider */}
                <PortfolioSection onRequestQuote={(title) => handleOpenQuote(title)} />

                {/* Blog Section */}
                <BlogSection onRequestQuote={(title) => handleOpenQuote(title)} />

                {/* Contact & Map Section */}
                <ContactSection />
              </>
            )}

            {activeTab === 'services' && (
              <ServicesSection onRequestQuote={(title) => handleOpenQuote(title)} />
            )}

            {activeTab === 'products' && (
              <ProductCatalog
                products={products}
                initialCategory={catalogCategory}
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
                wishlistProducts={wishlistProducts}
                onRequestQuote={(title) => handleOpenQuote(title)}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard products={products} onProductsUpdated={fetchProducts} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        setActiveTab={(tab) => {
          setActiveTab(tab);
          const tabToPathMap: Record<string, string> = {
            home: '/',
            services: '/our-services',
            products: '/products',
            portfolio: '/portfolio',
            gallery: '/completed-projects',
            blog: '/blog',
            contact: '/contact-us',
            'track-order': '/track-order',
            dashboard: '/track-order',
            customers: '/customers',
            admin: '/admin',
            developer: '/dev'
          };
          if (tabToPathMap[tab]) {
            navigateTo(tabToPathMap[tab]);
          } else {
            setCurrentPath('/');
          }
        }}
        onOpenQuote={() => handleOpenQuote()}
      />

      {/* Modals & Overlays */}
      {selectedProduct && !currentPath.startsWith('/products/') && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={handleCloseProduct}
          onAddToCart={(p, q) => handleAddToCart(p, q)}
          onBuyNow={(p) => {
            handleAddToCart(p, 1);
            handleCloseProduct();
            setIsCheckoutOpen(true);
          }}
          onRequestQuote={(pTitle) => {
            handleCloseProduct();
            handleOpenQuote(pTitle);
          }}
          isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
          onToggleWishlist={(p) => handleToggleWishlist(p)}
        />
      )}

      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        prefilledTitle={quotePrefill.title}
        prefilledBudget={quotePrefill.budget}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onNavigateToAuth={() => {
          setIsCartOpen(false);
          setActiveTab('track-order');
          navigateTo('/track-order');
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        subtotal={cartItems.reduce((acc, i) => acc + (i.unitPrice || i.selectedVariation?.price || i.product.price) * i.quantity, 0)}
        discountAmount={0}
        onOrderSuccess={async () => {
          if (user?.id) {
            await clearDbCart(user.id);
          }
          setCartItems([]);
        }}
        onNavigateToAuth={() => {
          setIsCheckoutOpen(false);
          setActiveTab('track-order');
          navigateTo('/track-order');
        }}
        onNavigateToTrackOrder={(orderId) => {
          setIsCheckoutOpen(false);
          setActiveTab('track-order');
          navigateTo('/track-order');
        }}
      />

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

      {/* Auto Lead Inquiry Popup */}
      {showInquiryPopup && (
        <InquiryPopup
          onClose={() => setShowInquiryPopup(false)}
          onSubmitLead={(name, phone, email, description, projectType, budget) => {
            submitLeadToSupabase({
              full_name: name,
              phone: phone,
              email: email,
              project_scope: description,
              service_type: projectType,
              estimated_budget: budget,
              source: 'Auto Inquiry Modal',
              status: 'new'
            });
          }}
        />
      )}

      {/* Floating Action Buttons */}
      <FloatingActions onOpenAiConsultant={() => setIsAiConsultantOpen(true)} />

    </div>
  );
}
