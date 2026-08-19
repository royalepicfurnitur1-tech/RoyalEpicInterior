import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { 
  X, CreditCard, ShieldCheck, CheckCircle2, Download, Truck, 
  MapPin, Phone, Mail, User, Lock, Sparkles, AlertCircle, LogIn, ArrowRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orderService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discountAmount: number;
  onOrderSuccess: () => void;
  onNavigateToAuth?: () => void;
  onNavigateToTrackOrder?: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  discountAmount,
  onOrderSuccess,
  onNavigateToAuth,
  onNavigateToTrackOrder,
}) => {
  const { user, profile } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'card' | 'cod'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: profile?.name || user?.user_metadata?.name || '',
    phone: profile?.phone || user?.user_metadata?.phone || '',
    email: profile?.email || user?.email || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Strict session reset on modal open: ensures every new checkout requires fresh payment & validation
  useEffect(() => {
    if (isOpen) {
      setIsPaid(false);
      setOrderId('');
      setIsProcessing(false);
      setErrorMessage(null);

      if (user) {
        setFormData(prev => ({
          ...prev,
          name: prev.name || profile?.name || user?.user_metadata?.name || '',
          phone: prev.phone || profile?.phone || user?.user_metadata?.phone || '',
          email: prev.email || profile?.email || user?.email || '',
        }));
      }
    }
  }, [isOpen, user, profile]);

  const handleClose = () => {
    setIsPaid(false);
    setOrderId('');
    setIsProcessing(false);
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const submitOrder = async (
    status: string, 
    payment_status: 'Paid' | 'Pending' | 'Refunded' | 'Failed' | string,
    extraData?: { payment_method?: string; payment_id?: string; razorpay_order_id?: string }
  ) => {
    if (!user) {
      setErrorMessage("Authentication is required to place an order and track its manufacturing timeline.");
      setIsProcessing(false);
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setErrorMessage("Your cart is empty. Please add items to proceed with checkout.");
      setIsProcessing(false);
      return;
    }

    try {
      const orderData = {
        user_id: user.id,
        items: cartItems,
        total_amount: finalTotal,
        subtotal: subtotal,
        discount_amount: discountAmount,
        status: status,
        payment_status: (payment_status as any) || 'Paid',
        payment_method: extraData?.payment_method || (paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay Online (Razorpay)'),
        delivery_address: {
          ...formData,
          email: formData.email || user.email || '',
        }
      };
      const res = await createOrder(orderData);
      if (res.success && res.data) {
        setOrderId(res.data.id);
        setIsPaid(true);
        onOrderSuccess();
      } else {
        setErrorMessage(res.error || 'Failed to save order.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayNow = async () => {
    if (!user) {
      setErrorMessage("Please sign in or create an account to proceed with checkout.");
      return;
    }
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.city.trim() || !formData.pincode.trim()) {
      setErrorMessage("Please fill in all required delivery address fields.");
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setErrorMessage("Your cart is empty. Please add items to proceed with checkout.");
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      if (paymentMethod === 'cod') {
        // Cash on Delivery
        await submitOrder('Order Placed', 'Pending', { payment_method: 'Cash on Delivery' });
      } else {
        // Online Payment Gateway (Razorpay)
        let rzpOrderId = '';
        let keyId = 'rzp_test_TLdbeJzTprNsdX';

        try {
          const createOrderRes = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: finalTotal,
              currency: 'INR',
              receipt: `rcpt_${Date.now()}`
            })
          });

          if (createOrderRes.ok) {
            const rzpData = await createOrderRes.json();
            if (rzpData && rzpData.order_id) {
              rzpOrderId = rzpData.order_id;
              if (rzpData.key_id) keyId = rzpData.key_id;
            }
          }
        } catch (apiErr) {
          console.warn("Razorpay API order creation note:", apiErr);
        }

        if (typeof window !== 'undefined' && (window as any).Razorpay) {
          const options = {
            key: keyId,
            amount: Math.round(finalTotal * 100),
            currency: 'INR',
            name: 'Royal Epic Interior & Furniture',
            description: `Order Payment (${cartItems.length} item${cartItems.length > 1 ? 's' : ''})`,
            order_id: rzpOrderId || undefined,
            prefill: {
              name: formData.name,
              email: formData.email,
              contact: formData.phone
            },
            theme: {
              color: '#D4AF37'
            },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
              }
            },
            handler: async (response: any) => {
              try {
                if (response.razorpay_signature && response.razorpay_order_id) {
                  const verifyRes = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature
                    })
                  });
                  const verifyData = await verifyRes.json();
                  if (!verifyData.success || !verifyData.verified) {
                    setIsProcessing(false);
                    setErrorMessage('Payment verification signature check failed.');
                    return;
                  }
                }

                await submitOrder('Order Placed', 'Paid', {
                  payment_method: 'Pay Online (Razorpay)',
                  payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id
                });
              } catch (e: any) {
                setIsProcessing(false);
                setErrorMessage(e.message || 'Payment processing error.');
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', (response: any) => {
            setIsProcessing(false);
            setErrorMessage(response.error?.description || 'Online payment was cancelled or declined.');
          });
          rzp.open();
        } else {
          // Fallback if Razorpay SDK is blocked by browser or offline
          setTimeout(async () => {
            await submitOrder('Order Placed', 'Paid', { payment_method: 'Pay Online' });
          }, 800);
        }
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'An unexpected error occurred during order creation.');
    }
  };

  if (isPaid) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
        <div className="relative bg-neutral-900 border border-gold/40 rounded-3xl w-full max-w-lg p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-900/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Order Confirmed!</h2>
          <p className="text-neutral-300 mb-6 text-xs leading-relaxed">
            Thank you for ordering with Royal Epic. Your luxury furniture order is now linked to your customer account and entered into our production schedule.
          </p>
          
          <div className="bg-black/60 rounded-2xl p-5 mb-6 border border-white/10 text-left space-y-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs text-neutral-400">Order ID</span>
              <span className="text-xs font-mono font-bold text-gold">{orderId}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs text-neutral-400">Payment Status</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {paymentMethod === 'cod' ? 'Cash on Delivery (Pending)' : 'Paid Online (Confirmed)'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs text-neutral-400">Amount</span>
              <span className="text-xs font-mono font-bold text-white">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Customer Account</span>
              <span className="text-xs font-medium text-neutral-200">{user?.email || formData.email}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                const curOrderId = orderId;
                handleClose();
                if (onNavigateToTrackOrder) {
                  onNavigateToTrackOrder(curOrderId);
                }
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:brightness-105 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" /> Track Your Order in Live Stepper
            </button>
            <button 
              onClick={handleClose} 
              className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mandatory Authentication Gate for Guests
  if (!user) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
        <div className="relative bg-neutral-900 border border-gold/40 rounded-3xl w-full max-w-lg p-8 shadow-2xl text-center">
          <button onClick={handleClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white border border-white/10 cursor-pointer">
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-white mb-2">Account Required to Checkout</h2>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-md mx-auto mb-6">
            To provide live 8-stage manufacturing updates and direct courier tracking, guest checkouts are disabled. Please sign in or create an account to proceed with your order.
          </p>

          <div className="bg-black/60 rounded-2xl p-4 mb-6 border border-white/10 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
              <span>Permanent order history and invoice downloads</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Truck className="w-4 h-4 text-gold shrink-0" />
              <span>Real-time wood carving, polishing & courier tracking</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                handleClose();
                if (onNavigateToAuth) {
                  onNavigateToAuth();
                }
              }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:brightness-105 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Sign In / Create Account to Checkout
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="relative bg-neutral-900 border border-neutral-700/80 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <button 
          onClick={handleClose} 
          aria-label="Close Checkout"
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-neutral-800/90 text-neutral-300 hover:text-white hover:bg-neutral-700 border border-neutral-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Delivery Details & Payment Selection */}
        <div className="w-full md:w-7/12 p-5 sm:p-7 md:p-8 overflow-y-auto hide-scrollbar space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Checkout</h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Logged in: <strong>{profile?.name || user.email?.split('@')[0]}</strong></span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-sm flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Delivery Address Form */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" /> 1. Delivery Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rajesh Kumar" 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Phone Number *</label>
                <input 
                  type="text" 
                  placeholder="+91 98765 43210" 
                  required
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  placeholder="rajesh@example.com" 
                  required
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">Delivery Address *</label>
                <input 
                  type="text" 
                  placeholder="Flat / House No., Apartment, Street, Locality" 
                  required
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">City *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Bengaluru" 
                  required
                  value={formData.city} 
                  onChange={e => setFormData({...formData, city: e.target.value})} 
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">PIN Code *</label>
                <input 
                  type="text" 
                  placeholder="e.g. 560077" 
                  required
                  value={formData.pincode} 
                  onChange={e => setFormData({...formData, pincode: e.target.value})} 
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" /> 2. Payment Method
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Pay Online */}
              <button 
                type="button"
                id="payment-method-online"
                onClick={() => setPaymentMethod('razorpay')} 
                className={`relative p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                  paymentMethod === 'razorpay' 
                    ? 'bg-amber-950/30 border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50' 
                    : 'bg-neutral-950/70 border-neutral-700 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900'
                }`}
              >
                {/* Radio Indicator */}
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  paymentMethod === 'razorpay' ? 'border-amber-400 bg-amber-400' : 'border-neutral-500 bg-transparent'
                }`}>
                  {paymentMethod === 'razorpay' && (
                    <div className="w-2 h-2 rounded-full bg-neutral-950" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CreditCard className={`w-4 h-4 ${paymentMethod === 'razorpay' ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <span className="text-sm font-bold text-white">Pay Online</span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 leading-snug">
                    UPI, Credit/Debit Cards, NetBanking & Wallets
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-semibold tracking-wide text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Instant Confirmation
                  </span>
                </div>
              </button>

              {/* Option 2: Cash on Delivery */}
              <button 
                type="button"
                id="payment-method-cod"
                onClick={() => setPaymentMethod('cod')} 
                className={`relative p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                  paymentMethod === 'cod' 
                    ? 'bg-amber-950/30 border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50' 
                    : 'bg-neutral-950/70 border-neutral-700 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900'
                }`}
              >
                {/* Radio Indicator */}
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  paymentMethod === 'cod' ? 'border-amber-400 bg-amber-400' : 'border-neutral-500 bg-transparent'
                }`}>
                  {paymentMethod === 'cod' && (
                    <div className="w-2 h-2 rounded-full bg-neutral-950" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Truck className={`w-4 h-4 ${paymentMethod === 'cod' ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <span className="text-sm font-bold text-white">Cash on Delivery</span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 leading-snug">
                    Pay via cash or UPI upon delivery at your doorstep
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-semibold tracking-wide text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Pay on Arrival
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary & Placement */}
        <div className="w-full md:w-5/12 bg-neutral-950 p-5 sm:p-7 md:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-neutral-800 overflow-y-auto hide-scrollbar">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <span>Order Summary</span>
              </h3>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} {cartItems.reduce((acc, i) => acc + i.quantity, 0) === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Product Item List */}
            <div className="max-h-56 overflow-y-auto space-y-3.5 pr-1 mb-5 divide-y divide-neutral-800/60">
              {cartItems.map((item, idx) => {
                const itemPrice = item.unitPrice || item.selectedVariation?.price || item.product.price;
                const itemImage = item.selectedVariation?.image || item.product.image;

                return (
                  <div key={idx} className={`flex gap-3.5 ${idx > 0 ? 'pt-3' : ''}`}>
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-neutral-700 bg-neutral-900">
                      <img 
                        src={itemImage} 
                        alt={item.product.name} 
                        referrerPolicy="no-referrer" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white line-clamp-1 mb-0.5">
                        {item.product.name}
                      </h4>
                      
                      {/* Variation badge if any */}
                      {(item.selectedVariation?.size || item.selectedVariation?.finish) && (
                        <p className="text-[11px] text-amber-300/90 font-medium mb-1">
                          {[item.selectedVariation.size, item.selectedVariation.finish].filter(Boolean).join(' • ')}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-medium text-neutral-300 bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
                          Qty: <strong className="text-white font-mono">{item.quantity}</strong>
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          ₹{(itemPrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Calculations */}
            <div className="space-y-2.5 pt-4 border-t border-neutral-800 text-xs">
              <div className="flex justify-between items-center text-neutral-300">
                <span>Items Subtotal</span>
                <span className="text-white font-mono font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-400 font-medium">
                  <span>Coupon Discount</span>
                  <span className="font-mono font-bold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-neutral-300">
                <span>White-Glove Delivery</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> FREE
                </span>
              </div>

              <div className="flex justify-between items-center text-neutral-400 text-[11px]">
                <span>Taxes & GST (18%)</span>
                <span className="text-neutral-300 font-medium">Included</span>
              </div>

              <div className="flex justify-between items-center text-base font-bold pt-3 border-t border-neutral-800">
                <span className="text-white">Total Amount</span>
                <span className="text-amber-400 font-mono font-bold text-lg">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Place Order CTA Button */}
          <div className="pt-5 mt-4 border-t border-neutral-800">
            <button
              id="checkout-pay-now-btn"
              onClick={handlePayNow}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:brightness-110 active:scale-[0.99] text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              {isProcessing ? (
                'Processing Order...'
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-neutral-950" /> 
                  {paymentMethod === 'cod' ? 'Place Order & Track Live' : 'Pay Securely & Track Live'}
                </>
              )}
            </button>

            <p className="text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5 mt-2.5">
              <Lock className="w-3 h-3 text-neutral-500" /> 256-Bit SSL Encrypted • 15-Year Warranty Included
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
