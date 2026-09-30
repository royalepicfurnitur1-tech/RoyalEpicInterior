import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Search, RefreshCw, Eye, X, CheckCircle2, 
  Clock, Truck, AlertCircle, Calendar, CreditCard, ChevronRight,
  ShieldCheck, Package, ExternalLink
} from 'lucide-react';
import { DbOrder, OrderStatus, PaymentStatus } from '../types';

export const AdminOrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  
  // Selected Order for detail modal
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>('CONFIRMED');
  const [stageRemark, setStageRemark] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenDetail = (order: DbOrder) => {
    setSelectedOrder(order);
    setNewOrderStatus(order.order_status);
    setStageRemark('');
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdatingStatus(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(selectedOrder.id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: newOrderStatus,
          stage_remark: stageRemark.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUpdateSuccess(`Order status updated to ${newOrderStatus}`);
        // Refresh local orders list
        await fetchOrders();
        // Update selected order view
        setSelectedOrder(prev => prev ? {
          ...prev,
          order_status: newOrderStatus,
          timeline_history: data.order?.timeline_history || prev.timeline_history
        } : null);
      } else {
        setUpdateError(data.error || 'Failed to update order status');
      }
    } catch (err: any) {
      setUpdateError(err.message || 'Error communicating with orders server');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      (o.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer_phone || '').includes(searchTerm) ||
      (o.razorpay_order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.razorpay_payment_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || o.order_status === statusFilter;
    const matchesPayment = paymentFilter === 'ALL' || o.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-950 text-blue-300 border border-blue-500/40">CONFIRMED</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-950 text-amber-300 border border-amber-500/40">PROCESSING</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-950 text-purple-300 border border-purple-500/40">SHIPPED</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">DELIVERED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-950 text-red-300 border border-red-500/40">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-neutral-800 text-neutral-300 border border-white/10">PENDING_PAYMENT</span>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/40">PAID</span>;
      case 'FAILED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-950 text-red-400 border border-red-500/40">FAILED</span>;
      case 'REFUNDED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-950 text-purple-300 border border-purple-500/40">REFUNDED</span>;
      case 'PARTIALLY_REFUNDED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-950 text-amber-300 border border-amber-500/40">PARTIALLY REFUNDED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-950/60 text-amber-400 border border-amber-500/40">PENDING</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-gold" /> E-Commerce Orders Management
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time Razorpay verified transactions, order status tracking, and Supabase synchronization.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by order #, customer, email, Razorpay ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-gold cursor-pointer"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-gold cursor-pointer"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="p-16 text-center text-neutral-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gold mb-2" />
          <p className="text-xs font-mono">Loading orders from server...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-black/40 border border-white/10 text-neutral-400">
          <ShoppingCart className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
          <h3 className="text-sm font-bold text-white mb-1">No Orders Found</h3>
          <p className="text-xs text-neutral-500">
            {searchTerm || statusFilter !== 'ALL' || paymentFilter !== 'ALL' 
              ? 'Try adjusting your filters or search terms.' 
              : 'New orders placed via Razorpay checkout will automatically appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/80 text-neutral-400 uppercase font-mono tracking-wider border-b border-white/10 text-[11px]">
              <tr>
                <th className="p-4">Order Number</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Order Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-mono font-bold text-gold">
                    {order.order_number || order.id}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white">{order.customer_name}</div>
                    <div className="text-[11px] text-neutral-400 truncate max-w-[180px]">{order.customer_email}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-white">
                    ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">
                    {getPaymentBadge(order.payment_status)}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(order.order_status)}
                  </td>
                  <td className="p-4 text-[11px] font-mono text-neutral-400 whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenDetail(order)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ORDER DETAILS & STATUS UPDATE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-4xl w-full p-6 sm:p-8 text-white shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold block mb-1">
                  Verified Order Specification
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
                  <span>{selectedOrder.order_number || selectedOrder.id}</span>
                  <span className="text-xs font-normal text-neutral-400">({selectedOrder.currency})</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {getPaymentBadge(selectedOrder.payment_status)}
                {getStatusBadge(selectedOrder.order_status)}
              </div>
            </div>

            {/* Split Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-6">
              {/* Customer & Shipping Details */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-gold text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-gold" /> Customer & Delivery Details
                </h4>
                <div className="space-y-1.5 text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Customer Name:</span>
                    <span className="font-bold text-white">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Email:</span>
                    <span className="text-white font-mono">{selectedOrder.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Phone:</span>
                    <span className="text-white font-mono">{selectedOrder.customer_phone || 'N/A'}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-neutral-500 block mb-1">Shipping Address:</span>
                    <p className="text-neutral-200 leading-relaxed bg-neutral-900/80 p-2.5 rounded-xl border border-white/5">
                      {selectedOrder.shipping_address?.address || 'N/A'}, {selectedOrder.shipping_address?.city || ''} {selectedOrder.shipping_address?.state || ''} - {selectedOrder.shipping_address?.pincode || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Razorpay Transaction Details */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-gold text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Razorpay Payment Info
                </h4>
                <div className="space-y-1.5 text-neutral-300 font-mono">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Payment Status:</span>
                    <span className="font-bold text-emerald-400">{selectedOrder.payment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Order Status:</span>
                    <span className="font-bold text-gold">{selectedOrder.order_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Razorpay Order ID:</span>
                    <span className="text-white truncate max-w-[200px]" title={selectedOrder.razorpay_order_id || ''}>
                      {selectedOrder.razorpay_order_id || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Razorpay Payment ID:</span>
                    <span className="text-emerald-300 truncate max-w-[200px]" title={selectedOrder.razorpay_payment_id || ''}>
                      {selectedOrder.razorpay_payment_id || 'Awaiting Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 text-white font-bold">
                    <span>Total Verified Amount:</span>
                    <span className="text-gold text-sm">₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Snapshot List */}
            <div className="bg-black/50 border border-white/10 rounded-2xl p-5 mb-6 text-xs">
              <h4 className="font-bold text-gold text-sm uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-gold" /> Ordered Products ({selectedOrder.items?.length || 0})
              </h4>
              
              <div className="divide-y divide-white/10 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between gap-3 ${idx > 0 ? 'pt-2.5' : ''} pb-2.5`}>
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-10 h-10 rounded-lg object-cover border border-white/10 bg-neutral-900 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-bold text-white block">{item.product_name}</span>
                          <span className="text-[11px] font-mono text-neutral-400">ID: {item.product_id}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-neutral-400 block">{item.quantity} × ₹{Number(item.unit_price).toLocaleString('en-IN')}</span>
                        <span className="font-bold text-gold">₹{Number(item.total_price).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500 py-2">No individual product items attached to this order record.</p>
                )}
              </div>
            </div>

            {/* Order Timeline History */}
            <div className="bg-black/50 border border-white/10 rounded-2xl p-5 mb-6 text-xs">
              <h4 className="font-bold text-gold text-sm uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gold" /> Order Timeline & Milestones
              </h4>
              <div className="space-y-3">
                {selectedOrder.timeline_history && selectedOrder.timeline_history.length > 0 ? (
                  selectedOrder.timeline_history.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 border-l-2 border-gold/40 pl-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white font-mono">{step.status}</span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {new Date(step.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {step.remarks && (
                          <p className="text-neutral-400 text-[11px] mt-0.5">{step.remarks}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500">No timeline entries recorded yet.</p>
                )}
              </div>
            </div>

            {/* Admin Order Status Update Section (Admin can update ORDER status only) */}
            <div className="bg-neutral-950 border border-gold/30 rounded-2xl p-5 text-xs">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-2 flex items-center gap-1.5">
                Update Order Status
              </h4>
              <p className="text-neutral-400 text-[11px] mb-4">
                Note: Payment status is determined solely by verified Razorpay transactions and cannot be manually modified.
              </p>

              {updateError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{updateError}</span>
                </div>
              )}

              {updateSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateOrderStatus} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                      New Order Status
                    </label>
                    <select
                      value={newOrderStatus}
                      onChange={(e) => setNewOrderStatus(e.target.value as OrderStatus)}
                      className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold cursor-pointer"
                    >
                      <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                      Timeline Milestone Remark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cut-list finalized at Thanisandra factory."
                      value={stageRemark}
                      onChange={(e) => setStageRemark(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="px-5 py-2 rounded-xl bg-gold text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer shadow-lg"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Save Order Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
