import React from 'react';
import { CartItem } from '../types';
import { 
  X, Trash2, ShoppingBag, ArrowRight, AlertCircle, LogIn 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, variationId?: string, itemId?: string) => void;
  onRemoveItem: (productId: string, variationId?: string, itemId?: string) => void;
  onProceedCheckout: (finalSubtotal: number, discountAmount: number) => void;
  onNavigateToAuth?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
  onNavigateToAuth,
}) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => {
    const itemPrice = item.unitPrice || item.selectedVariation?.price || item.product.price;
    return acc + itemPrice * item.quantity;
  }, 0);
  const finalTotal = subtotal;

  const handleCheckoutClick = () => {
    if (!user) {
      return;
    }
    onProceedCheckout(subtotal, 0);
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
            cartItems.map((item, idx) => {
              const itemKey = item.id || `${item.product.id}-${item.selectedVariation?.id || idx}-${JSON.stringify(item.selectedAttributes || {})}`;
              const itemPrice = item.unitPrice || item.selectedVariation?.price || item.product.price;
              const itemImage = item.selectedVariation?.image || item.product.image;

              return (
                <div
                  key={itemKey}
                  className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex items-start gap-3 relative group"
                >
                  <img
                    src={itemImage}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white line-clamp-1">
                      {item.product.name}
                    </h4>

                    {/* Variations & Selected Attributes Tag */}
                    {(item.selectedVariation || item.selectedAttributes) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedVariation?.size && (
                          <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-neutral-300">
                            {item.selectedVariation.size}
                          </span>
                        )}
                        {item.selectedVariation?.finish && (
                          <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-neutral-300">
                            {item.selectedVariation.finish}
                          </span>
                        )}
                        {item.selectedAttributes && Object.entries(item.selectedAttributes).map(([k, v]) => (
                          <span key={k} className="text-[10px] bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded text-gold">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-gold font-mono uppercase mt-1">
                      {item.product.category}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-mono font-bold text-white">
                        ₹{(itemPrice * item.quantity).toLocaleString('en-IN')}
                      </span>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-1.5 bg-neutral-800 rounded-lg p-0.5 border border-white/10">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedVariation?.id, item.id)}
                          className="w-5 h-5 rounded text-xs font-bold text-neutral-300 hover:bg-white/10 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-[11px] font-mono font-bold px-1">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedVariation?.id, item.id)}
                          className="w-5 h-5 rounded text-xs font-bold text-neutral-300 hover:bg-white/10 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.product.id, item.selectedVariation?.id, item.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 cursor-pointer transition-colors"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Checkout Area */}
        {cartItems.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-3">
            
            {/* Subtotal Calculation */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                <span>Grand Total</span>
                <span className="font-mono text-gold">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Auth Required Warning for Guest / Unauthenticated */}
            {!user ? (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="text-amber-300 font-semibold block">Account Required for Live Tracking</strong>
                    Please log in or create an account to proceed. This links your order to your account for live manufacturing & delivery updates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToAuth) {
                      onNavigateToAuth();
                    } else {
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-gold hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In / Register to Checkout
                </button>
              </div>
            ) : (
              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
