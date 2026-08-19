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

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || profile?.name || user?.user_metadata?.name || '',
        phone: prev.phone || profile?.phone || user?.user_metadata?.phone || '',
        email: prev.email || profile?.email || user?.email || '',
      }));
    }
  }, [user, profile]);

  if (!isOpen) return null;

  const finalTotal = subtotal - discountAmount;

  const submitOrder = async (status: string, payment_status: 'Paid' | 'Pending' | 'Refunded' | 'Failed' | string) => {
    if (!user) {
      setErrorMessage("Authentication is required to place an order and track its manufacturing timeline.");
      setIsProcessing(false);
      return;
    }

    try {
      const orderData = {
        user_id: user.id,
        items: cartItems,
        total_amount: finalTotal,
        status: status,
        payment_status: (payment_status as any) || 'Paid',
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

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Simulate payment processing
      setTimeout(() => {
        submitOrder('Order Placed', paymentMethod === 'cod' ? 'Pending' : 'Paid');
      }, 1000);
      
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'An unexpected error occurred during order creation.');
    }
  };

  if (isPaid) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
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
              <span className="text-xs text-neutral-400">Amount Paid</span>
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
                if (onNavigateToTrackOrder) {
                  onNavigateToTrackOrder(orderId);
                } else {
                  onClose();
                }
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:brightness-105 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" /> Track Your Order in Live Stepper
            </button>
            <button 
              onClick={onClose} 
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
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-neutral-900 border border-gold/40 rounded-3xl w-full max-w-lg p-8 shadow-2xl text-center">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white border border-white/10 cursor-pointer">
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
                if (onNavigateToAuth) {
                  onNavigateToAuth();
                } else {
                  onClose();
                }
              }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:brightness-105 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Sign In / Create Account to Checkout
            </button>
            <button
              onClick={onClose}
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white border border-white/10 cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Forms */}
        <div className="w-full md:w-3/5 p-6 sm:p-8 overflow-y-auto hide-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-white">Checkout</h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Logged in as <strong>{profile?.name || user.email?.split('@')[0]}</strong></span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-200 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" /> Delivery Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Full Name *" 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" 
                />
                <input 
                  type="text" 
                  placeholder="Phone Number *" 
                  required
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" 
                />
                <input 
                  type="email" 
                  placeholder="Email Address *" 
                  required
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 sm:col-span-2" 
                />
                <input 
                  type="text" 
                  placeholder="Complete Delivery Address *" 
                  required
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 sm:col-span-2" 
                />
                <input 
                  type="text" 
                  placeholder="City *" 
                  required
                  value={formData.city} 
                  onChange={e => setFormData({...formData, city: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" 
                />
                <input 
                  type="text" 
                  placeholder="PIN Code *" 
                  required
                  value={formData.pincode} 
                  onChange={e => setFormData({...formData, pincode: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" 
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" /> Payment Method
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')} 
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${paymentMethod === 'razorpay' ? 'bg-gold/10 border-gold text-gold' : 'bg-black/30 border-white/10 text-neutral-400 hover:border-white/30'}`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold">Online Payment</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('cod')} 
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${paymentMethod === 'cod' ? 'bg-gold/10 border-gold text-gold' : 'bg-black/30 border-white/10 text-neutral-400 hover:border-white/30'}`}
                >
                  <Truck className="w-6 h-6" />
                  <span className="text-xs font-bold">Cash on Delivery</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full md:w-2/5 bg-black/50 p-6 sm:p-8 flex flex-col border-l border-white/5">
          <h3 className="text-lg font-serif font-bold text-white mb-6">Order Summary</h3>
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 mb-6">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  <img src={item.product.image} alt={item.product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white line-clamp-1">{item.product.name}</h4>
                  <p className="text-xs text-neutral-500 mb-1">Qty: {item.quantity}</p>
                  <p className="text-xs font-mono text-gold font-bold">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400">Subtotal</span>
              <span className="text-white font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400">Discount</span>
                <span className="text-emerald-400 font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-3 border-t border-white/5">
              <span className="text-white">Total</span>
              <span className="text-gold font-mono">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={handlePayNow}
            disabled={isProcessing}
            className="w-full py-4 mt-6 rounded-xl bg-gold hover:bg-gold/90 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {isProcessing ? (
              'Processing...'
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> 
                {paymentMethod === 'cod' ? 'Place Order & Track Live' : 'Pay Securely & Track Live'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
