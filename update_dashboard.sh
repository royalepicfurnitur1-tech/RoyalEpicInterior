#!/bin/bash
cat << 'INNER_EOF' > src/components/CustomerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { 
  Package, FileText, Download, ChevronRight, Clock, CheckCircle2,
  Lock, LogOut, Mail, Sparkles, MapPin, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { fetchCustomerOrders, Order } from '../services/orderService';

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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (user && activeTab === 'orders') {
      setLoadingOrders(true);
      fetchCustomerOrders(user.id).then(data => {
        setOrders(data);
        setLoadingOrders(false);
      });
    }
  }, [user, activeTab]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
              <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
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

              <div>
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
                <div>
                  <h3 className="text-xl font-serif font-bold text-white mb-6">Order History ({orders.length})</h3>
                  
                  {loadingOrders ? (
                    <div className="text-center py-12 text-neutral-400">Loading orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-400 font-bold mb-1">No orders found.</p>
                      <p className="text-neutral-500 text-sm">When you place an order, it will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((ord, idx) => (
                        <motion.div 
                          key={ord.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.08 }}
                          className="p-6 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-4"
                        >
                          {/* Order Header */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-bold text-gold">{ord.id}</span>
                                <span className="text-xs text-neutral-500">• {new Date(ord.created_at).toLocaleDateString('en-IN')}</span>
                              </div>
                              <div className="flex gap-2 items-center">
                                <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                                  {ord.status}
                                </span>
                                {ord.payment_status === 'Paid' ? (
                                  <span className="px-2 py-1 rounded bg-green-900/30 text-green-400 border border-green-500/20 text-[10px] font-bold">PAID</span>
                                ) : (
                                  <span className="px-2 py-1 rounded bg-orange-900/30 text-orange-400 border border-orange-500/20 text-[10px] font-bold">UNPAID / COD</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">Total Amount</p>
                              <span className="text-xl font-mono font-bold text-white">₹{ord.total_amount.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                          
                          {/* Order Tracking Info */}
                          {(ord.courier_name || ord.tracking_number || ord.expected_delivery_date) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                              {ord.courier_name && (
                                <div>
                                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Courier Partner</p>
                                  <p className="text-sm font-bold text-white flex items-center gap-2"><Package className="w-4 h-4 text-gold" /> {ord.courier_name}</p>
                                </div>
                              )}
                              {ord.tracking_number && (
                                <div>
                                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Tracking Number</p>
                                  <p className="text-sm font-bold font-mono text-white flex items-center gap-2"><Search className="w-4 h-4 text-gold" /> {ord.tracking_number}</p>
                                </div>
                              )}
                              {ord.expected_delivery_date && (
                                <div>
                                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Expected Delivery</p>
                                  <p className="text-sm font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-gold" /> {ord.expected_delivery_date}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Address */}
                          {ord.delivery_address && (
                            <div className="mt-2">
                              <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Delivery Address</p>
                              <p className="text-sm text-neutral-300">
                                {ord.delivery_address.name}, {ord.delivery_address.phone}<br/>
                                {ord.delivery_address.address}, {ord.delivery_address.city}, {ord.delivery_address.state} - {ord.delivery_address.pincode}
                              </p>
                            </div>
                          )}

                          {/* Items */}
                          <div className="mt-4">
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-3">Order Items</p>
                            <div className="space-y-2">
                              {ord.items && ord.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-neutral-800 overflow-hidden shrink-0">
                                      {item.product?.image ? (
                                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Package className="w-5 h-5 text-neutral-500 m-2.5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-white">{item.product?.name || 'Unknown Product'}</p>
                                      <p className="text-[10px] text-neutral-500">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                  <span className="font-mono text-sm font-bold text-gold">₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
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
INNER_EOF
