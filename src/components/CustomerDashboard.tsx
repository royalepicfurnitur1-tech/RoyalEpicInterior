import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { 
  Package, FileText, Download, ChevronRight, Clock, CheckCircle2,
  Lock, LogOut, Mail, Sparkles, MapPin, Search, Truck, ArrowRight,
  ShieldCheck, AlertCircle, ChevronDown, ChevronUp, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { fetchCustomerOrders, Order, getOrderTimeline } from '../services/orderService';

interface CustomerDashboardProps {
  wishlistProducts: Product[];
  onRequestQuote: (item: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  wishlistProducts,
  onRequestQuote,
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
  
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes' | 'wishlist'>('orders');
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'register' ? 'register' : 'login';
  });

  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e.detail === 'register') setAuthMode('register');
      if (e.detail === 'login') setAuthMode('login');
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
      // Error is handled in context
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

  if (!user) {
    return (
      <section className="pt-32 pb-24 bg-neutral-950 min-h-screen font-sans selection:bg-gold/30 selection:text-gold relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-neutral-950/80 to-neutral-950"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 blur-[120px] rounded-full"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-md px-6">
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
                    placeholder="username@domain.com"
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
                className="w-full py-4 rounded-xl bg-gold hover:bg-gold/90 text-neutral-950 font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
      </section>
    );
  }

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
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">
              Welcome back, {profile?.name || user.email?.split('@')[0]}
            </h1>
            <p className="text-neutral-400">Manage your orders, quotes, and saved products.</p>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/50 transition-all font-bold text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2">
          {[
            { id: 'orders', label: 'My Orders', icon: <Package className="w-4 h-4" /> },
            { id: 'quotes', label: 'Saved Quotes', icon: <FileText className="w-4 h-4" /> },
            { id: 'wishlist', label: 'Wishlist', icon: <CheckCircle2 className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gold text-neutral-950 shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'bg-neutral-900 border border-white/10 text-neutral-300 hover:border-gold/40'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
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
                    <div className="space-y-6">
                      {filteredOrders.map((ord, idx) => {
                        const timeline = getOrderTimeline(ord);
                        const isExpanded = expandedOrderId === ord.id;

                        return (
                          <motion.div 
                            key={ord.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            className="rounded-3xl bg-black/60 border border-white/10 overflow-hidden shadow-xl"
                          >
                            {/* Order Summary Header Bar */}
                            <div 
                              onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
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
                                  className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Detailed Collapsible Tracking Timeline */}
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

                                {/* 2. Live Order Tracking Timeline Stepper (8 Stages) */}
                                <div>
                                  <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Manufacturing & Delivery Timeline (8 Stages)
                                  </h4>

                                  <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
                                    {timeline.map((step, sIdx) => {
                                      const isPassed = step.completed;
                                      const isCurrent = step.current;

                                      return (
                                        <div key={sIdx} className="relative flex items-start gap-4">
                                          {/* Stage Marker Dot */}
                                          <div className={`absolute -left-[23px] sm:-left-[31px] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                            isPassed 
                                              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 ring-4 ring-neutral-950'
                                              : isCurrent
                                              ? 'bg-gold text-black shadow-lg shadow-gold/30 ring-4 ring-neutral-950 animate-pulse'
                                              : 'bg-neutral-800 text-neutral-500 border border-white/10 ring-4 ring-neutral-950'
                                          }`}>
                                            {isPassed ? '✓' : sIdx + 1}
                                          </div>

                                          {/* Content Box */}
                                          <div className={`flex-1 p-4 rounded-2xl border transition-all ${
                                            isCurrent
                                              ? 'bg-gold/5 border-gold/40 shadow-lg'
                                              : isPassed
                                              ? 'bg-black/50 border-white/10'
                                              : 'bg-black/20 border-white/5 opacity-60'
                                          }`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                              <div className="flex items-center gap-2">
                                                <h5 className={`text-sm font-bold ${isCurrent ? 'text-gold' : isPassed ? 'text-white' : 'text-neutral-400'}`}>
                                                  {step.status}
                                                </h5>
                                                {isCurrent && (
                                                  <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                                    Current Phase
                                                  </span>
                                                )}
                                              </div>
                                              {(step.date || step.time) && (
                                                <span className="text-[11px] font-mono text-neutral-400">
                                                  {step.date} {step.time ? `• ${step.time}` : ''}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-neutral-300 mt-1">{step.remarks}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* 3. Ordered Items Breakdown with Variations */}
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
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'quotes' && (
                <div>
                  <h3 className="text-xl font-serif font-bold text-white mb-6">Saved Quotes</h3>
                  <p className="text-neutral-400 text-sm">No quotes found.</p>
                </div>
              )}
              
              {activeTab === 'wishlist' && (
                <div>
                  <h3 className="text-xl font-serif font-bold text-white mb-6">Saved Wishlist ({wishlistProducts.length})</h3>
                  {wishlistProducts.length === 0 ? (
                    <p className="text-xs text-neutral-400">No products saved to wishlist yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wishlistProducts.map((p, idx) => (
                        <motion.div 
                          key={p.id}
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: idx * 0.06 }}
                          className="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-3"
                        >
                          <img src={p.image} alt={p.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div>
                            <h4 className="text-xs font-bold text-white line-clamp-1">{p.name}</h4>
                            <span className="text-xs font-mono text-gold font-bold">₹{p.price.toLocaleString('en-IN')}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
