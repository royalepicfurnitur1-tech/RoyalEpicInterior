import React, { useState } from 'react';
import { CartItem } from '../types';
import { 
  X, CreditCard, ShieldCheck, CheckCircle2, Download, Truck, 
  MapPin, Phone, Mail, User, Lock, Sparkles
} from 'lucide-react';

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
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'card' | 'cod'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
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

  const handlePayNow = async () => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // 1. Create Razorpay Order on Backend
      const createOrderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal > 0 ? finalTotal : 1, // Amount in INR
          isRupees: true,
          currency: 'INR',
          receipt: `rcpt_${Math.floor(Date.now() / 1000)}`,
        }),
      });

      const orderData = await createOrderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment order.');
      }

      // 2. Open Razorpay Standard Checkout Modal
      const keyId = orderData.key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_TLdbeJzTprNsdX';

      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Royal Epic Interior & Furniture',
        description: 'Luxury Turnkey Interiors & Furniture Order',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80',
        order_id: orderData.order_id,
        handler: async function (paymentResponse: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 3. Verify Payment Signature on Backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setOrderId(paymentResponse.razorpay_order_id);
              setPaymentId(paymentResponse.razorpay_payment_id);
              setIsPaid(true);
              onOrderSuccess();
            } else {
              setErrorMessage(verifyData.error || 'Payment signature verification failed.');
            }
          } catch (verifyError: any) {
            setErrorMessage(verifyError.message || 'Error verifying payment signature.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.name || 'Valued Client',
          email: formData.email || 'client@royalepicfurniture.com',
          contact: formData.phone || '9916633338',
        },
        theme: {
          color: '#D4AF37',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      if (typeof (window as any).Razorpay !== 'undefined') {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setIsProcessing(false);
          setErrorMessage(response.error?.description || 'Payment transaction failed or cancelled.');
        });
        rzp.open();
      } else {
        setIsProcessing(false);
        setErrorMessage('Razorpay Checkout SDK is loading. Please try again in a moment.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'An unexpected error occurred during order creation.');
    }
  };

  const handleDownloadInvoice = () => {
    const text = `ROYAL EPIC INTERIOR & FURNITURE
TAX INVOICE / ORDER RECEIPT
Order ID: ${orderId}
Date: ${new Date().toLocaleDateString('en-IN')}

Customer Details:
Name: ${formData.name}
Phone: ${formData.phone}
Shipping Address: ${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}

Items Ordered:
${cartItems.map(i => `- ${i.product.name} (Qty: ${i.quantity}) - ₹${(i.product.price * i.quantity).toLocaleString('en-IN')}`).join('\n')}

Subtotal: ₹${subtotal.toLocaleString('en-IN')}
Discount Applied: -₹${discountAmount.toLocaleString('en-IN')}
Grand Total Paid: ₹${finalTotal.toLocaleString('en-IN')}

Payment Status: SUCCESS (Simulated Razorpay / UPI Gateway)
GSTIN: 27AAAAA0000A1Z5`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Royal_Epic_Invoice_${orderId}.txt`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
      <div className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto relative text-white shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-black/60 border border-white/20 text-neutral-400 hover:text-white hover:border-gold transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isPaid ? (
          <div>
            <div className="flex items-center gap-2 mb-2 text-gold text-xs font-bold uppercase tracking-widest">
              <Lock className="w-4 h-4" /> 256-Bit SSL Encrypted Checkout
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-6">
              Complete Your Royal Order
            </h2>

            <div className="space-y-6">
              
              {/* Shipping Address Inputs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold" /> Delivery & Billing Address
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full Name"
                    className="bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:border-gold"
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Mobile Number"
                    className="bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:border-gold"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email Address"
                    className="bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:border-gold"
                  />
                </div>

                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street Address / Flat No."
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold"
                />

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-gold"
                  />
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-gold"
                  />
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="Pincode"
                    className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-gold"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gold" /> Select Payment Option
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'razorpay', label: 'Razorpay / UPI' },
                    { id: 'card', label: 'Credit/Debit' },
                    { id: 'upi', label: 'GPay / PhonePe' },
                    { id: 'cod', label: 'Token Booking' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === method.id
                          ? 'bg-gold/20 text-gold border-gold shadow-md'
                          : 'bg-black/40 border-white/10 text-neutral-300 hover:border-white/30'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount</span>
                    <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-400">
                  <span>Insured Factory Logistics</span>
                  <span className="text-emerald-400 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                  <span>Total Amount Payable</span>
                  <span className="font-mono text-gold text-lg">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button onClick={() => setErrorMessage(null)} className="text-red-400 font-bold hover:text-white">✕</button>
                </div>
              )}

              {/* Submit Pay Button */}
              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.7)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-black" /> Processing Secure Payment...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" /> Pay ₹{finalTotal.toLocaleString('en-IN')} via Razorpay
                  </>
                )}
              </button>

            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-950 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h3 className="text-2xl font-serif font-bold text-white mb-2">
              Payment Verified & Successful!
            </h3>

            <p className="text-xs text-neutral-300 max-w-md mx-auto mb-2">
              Thank you, <span className="font-bold text-white">{formData.name || 'Valued Client'}</span>. Your order <span className="font-mono text-gold font-bold">{orderId}</span> has been confirmed.
            </p>

            {paymentId && (
              <p className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 py-1 px-3 rounded-full border border-emerald-500/30 w-fit mx-auto mb-6">
                Razorpay Payment ID: {paymentId}
              </p>
            )}

            <div className="flex items-center gap-3 max-w-md mx-auto">
              <button
                onClick={handleDownloadInvoice}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-gold" /> Download Tax Invoice
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gold text-black text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
