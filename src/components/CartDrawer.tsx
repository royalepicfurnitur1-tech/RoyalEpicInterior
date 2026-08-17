import React, { useState } from 'react';
import { CartItem } from '../types';
import { 
  X, Trash2, ShoppingBag, ArrowRight, Tag, ShieldCheck, CreditCard 
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedCheckout: (finalSubtotal: number, discountAmount: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
}) => {
  if (!isOpen) return null;

  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // percentage
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * appliedDiscount) / 100);
  const finalTotal = subtotal - discountAmount;

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'ROYAL10') {
      setAppliedDiscount(10);
      setCouponMsg('10% Royal Discount Applied!');
    } else if (couponCode.trim().toUpperCase() === 'EPICVIP') {
      setAppliedDiscount(20);
      setCouponMsg('20% VIP Coupon Applied!');
    } else {
      setCouponMsg('Invalid Coupon Code (Try: ROYAL10)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border-l border-gold/40 w-full max-w-md h-full flex flex-col justify-between p-6 text-white shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold" />
            <h2 className="text-xl font-serif font-bold text-white">Your Shopping Cart</h2>
            <span className="text-xs font-mono font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/30">
              {cartItems.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-400 font-serif">Your cart is empty.</p>
              <p className="text-xs text-neutral-500 mt-1">Explore our product catalog to add luxury doors, kitchens & sofas.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-3 relative group"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    {item.product.name}
                  </h4>
                  <p className="text-[10px] text-gold font-mono uppercase mt-0.5">
                    {item.product.category}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-mono font-bold text-white">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-neutral-800 rounded-lg p-0.5 border border-white/10">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        className="w-5 h-5 rounded text-xs font-bold text-neutral-300 hover:bg-white/10 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-[11px] font-mono font-bold px-1">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="w-5 h-5 rounded text-xs font-bold text-neutral-300 hover:bg-white/10 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1.5 text-neutral-500 hover:text-red-400 cursor-pointer transition-colors"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout Area */}
        {cartItems.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-3">
            
            {/* Coupon Code Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-gold absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon (e.g. ROYAL10)"
                  className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-gold"
                />
              </div>
              <button
                onClick={handleApplyCoupon}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-gold hover:text-black text-white text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Apply
              </button>
            </div>
            {couponMsg && (
              <p className={`text-[10px] ${appliedDiscount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {couponMsg}
              </p>
            )}

            {/* Subtotal Calculation */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Coupon Discount ({appliedDiscount}%)</span>
                  <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                <span>Grand Total</span>
                <span className="font-mono text-gold">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => onProceedCheckout(subtotal, discountAmount)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
