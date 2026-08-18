cat << 'INNER_EOF' > src/components/CheckoutModal.tsx
import React, { useState } from 'react';
import { CartItem } from '../types';
import { 
  X, CreditCard, ShieldCheck, CheckCircle2, Download, Truck, 
  MapPin, Phone, Mail, User, Lock, Sparkles
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
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  discountAmount,
  onOrderSuccess,
}) => {
  const { user } = useAuth();
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'card' | 'cod'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const finalTotal = subtotal - discountAmount;

  const submitOrder = async (status: string, payment_status: string) => {
    try {
      const orderData = {
        user_id: user?.id || 'guest',
        items: cartItems,
        total_amount: finalTotal,
        status: status,
        payment_status: payment_status,
        delivery_address: formData
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
      setErrorMessage("Please login from the Customer Portal before checking out to track your orders.");
      return;
    }
    
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Fake checkout for testing purposes since Razorpay might not be fully configured without backend
      // In a real app we would call Razorpay. For now, we simulate a successful payment after 1 second.
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
        <div className="relative bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-900/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Order Confirmed</h2>
          <p className="text-neutral-400 mb-6 text-sm">Thank you for your premium order.</p>
          
          <div className="bg-black/50 rounded-xl p-4 mb-6 border border-white/5 text-left">
            <p className="text-xs text-neutral-500 mb-1">Order ID</p>
            <p className="text-sm font-mono text-gold mb-3">{orderId}</p>
            <p className="text-xs text-neutral-500 mb-1">Amount Paid</p>
            <p className="text-sm font-mono text-white">₹{finalTotal.toLocaleString('en-IN')}</p>
          </div>

          <button onClick={onClose} className="w-full py-3 rounded-xl bg-neutral-800 text-white font-bold text-sm hover:bg-neutral-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white border border-white/10">
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Forms */}
        <div className="w-full md:w-3/5 p-6 sm:p-8 overflow-y-auto hide-scrollbar">
          <h2 className="text-2xl font-serif font-bold text-white mb-6">Checkout</h2>
          
          {!user && (
            <div className="mb-6 p-4 rounded-xl bg-orange-900/20 border border-orange-500/30 text-orange-200 text-sm flex items-start gap-3">
              <User className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold mb-1">Guest Checkout</p>
                <p className="text-xs opacity-80">You are not logged in. Please log in via the Customer tab to track your orders, or continue below to checkout as a guest.</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-200 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" /> Delivery Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
                <input type="text" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
                <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 sm:col-span-2" />
                <input type="text" placeholder="Complete Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 sm:col-span-2" />
                <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
                <input type="text" placeholder="PIN Code" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" /> Payment Method
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaymentMethod('razorpay')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'razorpay' ? 'bg-gold/10 border-gold text-gold' : 'bg-black/30 border-white/10 text-neutral-400 hover:border-white/30'}`}>
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold">Online Payment</span>
                </button>
                <button onClick={() => setPaymentMethod('cod')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'cod' ? 'bg-gold/10 border-gold text-gold' : 'bg-black/30 border-white/10 text-neutral-400 hover:border-white/30'}`}>
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
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white line-clamp-1">{item.product.name}</h4>
                  <p className="text-xs text-neutral-500 mb-1">Qty: {item.quantity}</p>
                  <p className="text-sm font-mono text-gold font-bold">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Subtotal</span>
              <span className="text-white font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400">Discount</span>
                <span className="text-emerald-400 font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-3 border-t border-white/5">
              <span className="text-white">Total</span>
              <span className="text-gold font-mono">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={handlePayNow}
            disabled={isProcessing}
            className="w-full py-4 mt-6 rounded-xl bg-gold hover:bg-gold/90 text-neutral-950 font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              'Processing...'
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> 
                {paymentMethod === 'cod' ? 'Place Order' : 'Pay Securely'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
INNER_EOF
