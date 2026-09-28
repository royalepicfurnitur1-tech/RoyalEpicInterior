import React, { useState, useEffect } from 'react';
import { 
  Package, FileText, Clock,
  Lock, LogOut, Mail, Sparkles, MapPin, Search, Truck,
  ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { fetchCustomerOrders, Order } from '../services/orderService';
import { ReviewForm } from './ReviewForm';
import { ReviewsSection } from './ReviewsSection';

interface CustomerDashboardProps {
  onRequestQuote: (item: string) => void;
  onNavigate?: (path: string) => void;
  initialTab?: 'orders' | 'quotes';
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onRequestQuote,
  onNavigate,
  initialTab,
}) => {
  const { 
    user, 
    profile, 
    loginWithEmail, 
    registerWithEmail, 
    logout, 
    error, 
    clearError 
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes' | 'feedback'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'quotes' || tabParam === 'orders' || tabParam === 'feedback') return tabParam as any;
    return initialTab || 'orders';
  });

  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'register' ? 'register' : 'login';
  });

  const [unauthTab, setUnauthTab] = useState<'login' | 'feedback'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'feedback') return 'feedback';
    return 'login';
  });

  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderId') || null;
  });

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e.detail === 'register') setAuthMode('register');
      if (e.detail === 'login') setAuthMode('login');
      setUnauthTab('login');
    };
    window.addEventListener('auth-mode-change', handleAuthChange);
    return () => window.removeEventListener('auth-mode-change', handleAuthChange);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (user && activeTab === 'orders') {
      setLoadingOrders(true);
      fetchCustomerOrders(user.id).then(data => {
        setOrders(data);
        if (data.length > 0 && !expandedOrderId) {
          setExpandedOrderId(data[0].id);
        }
        setLoadingOrders(false);
      });
    }
  }, [user, activeTab]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'register' && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(name, email, password);
      }
    } catch (err) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(ord => {
    if (!searchOrderQuery.trim()) return true;
    const q = searchOrderQuery.toLowerCase().trim();
    return ord.id.toLowerCase().includes(q) ||
      (ord.tracking_number || '').toLowerCase().includes(q) ||
      (ord.courier_name || '').toLowerCase().includes(q) ||
      (ord.items || []).some(it => it.product?.name.toLowerCase().includes(q));
  });

  // Reusable Order Card Component (used for logged-in list)
  const renderOrderCard = (ord: Order, defaultExpanded = false) => {
    const isExpanded = expandedOrderId === ord.id || defaultExpanded;

    return (
      <div 
        key={ord.id}
        className="rounded-3xl bg-black/60 border border-white/10 overflow-hidden shadow-xl mb-6"
      >
        {/* Order Summary Header Bar */}
        <div 
          onClick={() => setExpandedOrderId(isExpanded && !defaultExpanded ? null : ord.id)}
          className="p-6 cursor-pointer hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-2xl bg-gold/10 text-gold border border-gold/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-white tracking-wide">{ord.id}</span>
                <span className="text-xs text-neutral-500">• {new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  {ord.status}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ord.payment_status === 'Paid' ? 'bg-green-950 text-green-300 border border-green-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'}`}>
                  {ord.payment_status}
                </span>
                {ord.payment_method && (
                  <span className="text-[10px] text-neutral-400 font-mono bg-white/5 px-2 py-0.5 rounded-full">
                    {ord.payment_method}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Order Total</span>
              <span className="text-lg font-mono font-bold text-gold">₹{ord.total_amount.toLocaleString('en-IN')}</span>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setExpandedOrderId(isExpanded ? null : ord.id);
              }}
              className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Detailed Collapsible Order Details */}
        {isExpanded && (
          <div className="p-6 sm:p-8 space-y-8 bg-neutral-950/70">
            {/* 1. Courier & Logistics Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/70 border border-white/10 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-neutral-900 text-gold border border-white/5">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Logistics Partner</span>
                  <span className="text-xs font-bold text-white">{ord.courier_name || 'Royal Epic Express Logistics'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-neutral-900 text-gold border border-white/5">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Tracking / AWB Number</span>
                  <span className="text-xs font-mono font-bold text-gold">{ord.tracking_number || `RE-AWB-${ord.id.slice(-6)}`}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-neutral-900 text-gold border border-white/5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Expected Delivery</span>
                  <span className="text-xs font-bold text-emerald-400">{ord.expected_delivery_date || 'Within 5-7 Business Days'}</span>
                </div>
              </div>
            </div>

            {/* 2. Ordered Items Breakdown with Variations */}
            <div>
              <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> Ordered Items ({ord.items?.length || 0})
              </h4>
              <div className="space-y-3">
                {ord.items && ord.items.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/50 border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-neutral-900 overflow-hidden border border-white/10 shrink-0">
                        {item.product?.image ? (
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-neutral-600 m-5" />
                        )}
                      </div>
                      <div>
                        <h6 className="text-sm font-bold text-white">{item.product?.name || 'Interior Furniture Item'}</h6>
                        {item.selectedVariation && (
                          <p className="text-xs text-gold font-mono mt-0.5">
                            {[
                              item.selectedVariation.sku && `SKU: ${item.selectedVariation.sku}`,
                              item.selectedVariation.size && `Size: ${item.selectedVariation.size}`,
                              item.selectedVariation.color && `Color: ${item.selectedVariation.color}`,
                              item.selectedVariation.finish && `Finish: ${item.selectedVariation.finish}`
                            ].filter(Boolean).join(' | ')}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 mt-1">Quantity: <strong className="text-white">{item.quantity}</strong></p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-sm font-bold text-gold">₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-neutral-500 block">₹{(item.product?.price || 0).toLocaleString('en-IN')} each</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Delivery Address & Guarantee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {ord.delivery_address && (
                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-1 text-xs">
                  <span className="font-bold text-gold uppercase tracking-wider text-[11px] block mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Shipping & Assembly Address
                  </span>
                  <p className="font-bold text-white">{ord.delivery_address.name} ({ord.delivery_address.phone})</p>
                  <p className="text-neutral-300">{ord.delivery_address.address}</p>
                  <p className="text-neutral-300">{ord.delivery_address.city}, {ord.delivery_address.state} - {ord.delivery_address.pincode}</p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs">
                <span className="font-bold text-gold uppercase tracking-wider text-[11px] block mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Royal Epic Guarantee
                </span>
                <p className="text-neutral-300">● 10-Year Factory Warranty on Woodwork & German Hardware</p>
                <p className="text-neutral-300">● White-glove doorstep delivery & professional carpenter installation in Bengaluru</p>
              </div>
            </div>

          </div>
        )}
      </div>
    );
  };

  // Unauthenticated / Guest View
  if (!user) {
    return (
      <section className="pt-28 pb-24 bg-neutral-950 min-h-screen font-sans selection:bg-gold/30 selection:text-gold relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Top Switcher Tabs for Guest */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-2xl bg-neutral-900 border border-white/10 shadow-xl">
              <button
                onClick={() => setUnauthTab('login')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
                  unauthTab === 'login'
                    ? 'bg-gold text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Client Account</span>
              </button>
              <button
                onClick={() => setUnauthTab('feedback')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
                  unauthTab === 'feedback'
                    ? 'bg-gold text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Feedback & Reviews</span>
              </button>
            </div>
          </div>

          {/* Guest Tab: Login / Register Form */}
          {unauthTab === 'login' && (
            <div className="max-w-md mx-auto">
              <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gold/10 text-gold mb-6 mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                
                <h2 className="text-2xl font-serif font-bold text-white text-center mb-2">
                  {authMode === 'login' ? 'Client Login' : 'Create Account'}
                </h2>
                <p className="text-sm text-neutral-400 text-center mb-8">
                  {authMode === 'login' 
                    ? 'Access your orders and project history.' 
                    : 'Register to start tracking your premium interior journey.'}
                </p>
                {error && (
                  <div className={`mb-6 p-4 border rounded-xl text-sm flex items-start gap-2 ${error.includes('successful') ? 'bg-green-950/50 border-green-500/50 text-green-200' : 'bg-red-950/50 border-red-500/50 text-red-200'}`}>
                    <span className="mt-0.5">{error.includes('successful') ? '✅' : '⚠️'}</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => { setName(e.target.value); clearError(); }}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"
                        placeholder="Enter your name"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Username / Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearError(); }}
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearError(); }}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"
                      placeholder="Enter your password"
                    />
                  </div>
                  {authMode === 'register' && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"
                        placeholder="Confirm your password"
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-gold hover:bg-gold/90 text-neutral-950 font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button 
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      clearError();
                    }}
                    className="text-sm text-gold hover:text-white transition-colors cursor-pointer"
                  >
                    {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Sign In"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Guest Tab: Customer Feedback & Reviews */}
          {unauthTab === 'feedback' && (
            <div className="space-y-8">
              <ReviewForm
                projectType="Turnkey Home Interior"
                onSuccess={() => {}}
              />
              <div className="bg-white p-6 sm:p-8 rounded-3xl text-neutral-900">
                <ReviewsSection
                  title="Approved Customer Reviews & Ratings"
                  subtitle="Verified testimonials directly loaded from our central database."
                  allowSubmit={false}
                />
              </div>
            </div>
          )}

        </div>
      </section>
    );
  }

  // Authenticated Customer Dashboard
  return (
    <section className="pt-32 pb-24 bg-neutral-950 min-h-screen font-sans selection:bg-gold/30 selection:text-gold relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Client Portal
            </div>
            <h1 className="text-4xl font-serif font-bold text-white tracking-tight">
              Welcome back, {profile?.name || user?.user_metadata?.name || user.email?.split('@')[0]}
            </h1>
            <p className="text-neutral-400 text-sm mt-2 max-w-xl">
              Track manufacturing timelines, review architectural estimates, and monitor logistics with Royal Epic.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders' 
                ? 'border-gold text-gold bg-gold/5' 
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Track Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'quotes' 
                ? 'border-gold text-gold bg-gold/5' 
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Saved Quotes</span>
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'feedback' 
                ? 'border-gold text-gold bg-gold/5' 
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Share Feedback & Review</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                        <Truck className="w-6 h-6 text-gold" /> Track Your Orders ({orders.length})
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">Real-time status updates, live manufacturing milestones, and logistics tracking.</p>
                    </div>

                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input 
                        type="text"
                        placeholder="Search by Order ID or Product..."
                        value={searchOrderQuery}
                        onChange={(e) => setSearchOrderQuery(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  
                  {loadingOrders ? (
                    <div className="text-center py-16 text-neutral-400">
                      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-xs">Fetching your order history & live tracking status...</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-black/40 rounded-2xl border border-white/5">
                      <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-300 font-bold mb-1">No matching orders found.</p>
                      <p className="text-neutral-500 text-xs">When you place an order, your live manufacturing & delivery timeline will appear here.</p>
                    </div>
                  ) : (
                    <div>
                      {filteredOrders.map((ord) => renderOrderCard(ord))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'quotes' && (
                <div>
                  <h3 className="text-xl font-serif font-bold text-white mb-2">Saved Estimates & Quotations</h3>
                  <p className="text-neutral-400 text-xs mb-6">Review your architectural estimates, 3D designs, and material specifications.</p>
                  <div className="p-8 rounded-3xl bg-neutral-900/60 border border-white/10 text-center">
                    <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400 text-sm">No custom quotes saved yet.</p>
                    <button
                      onClick={() => onRequestQuote('Custom Interior Quotation')}
                      className="mt-4 px-6 py-2.5 rounded-xl bg-gold text-black text-xs font-bold uppercase tracking-wider hover:brightness-105 transition-all cursor-pointer"
                    >
                      Request Free Estimate
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'feedback' && (
                <div className="space-y-8">
                  <ReviewForm
                    projectType="Turnkey Home Interior"
                    onSuccess={() => {}}
                  />
                  <div className="bg-white p-6 sm:p-8 rounded-3xl text-neutral-900">
                    <ReviewsSection
                      title="Verified Client Reviews & Testimonials"
                      subtitle="All published feedback verified by our quality assurance engineering team."
                      allowSubmit={false}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
