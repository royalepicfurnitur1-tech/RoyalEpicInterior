import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, CheckCircle2, Clock, MapPin, Package, Save, X, Edit, User, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAllOrders, updateOrderStatus, Order } from '../services/orderService';

export const AdminOrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit states
  const [editStatus, setEditStatus] = useState('');
  const [editCourier, setEditCourier] = useState('');
  const [editTracking, setEditTracking] = useState('');
  const [editExpectedDate, setEditExpectedDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchAllOrders();
    setOrders(data);
    setLoading(false);
  };

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditCourier(order.courier_name || '');
    setEditTracking(order.tracking_number || '');
    setEditExpectedDate(order.expected_delivery_date || '');
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    
    const updates = {
      status: editStatus,
      courier_name: editCourier,
      tracking_number: editTracking,
      expected_delivery_date: editExpectedDate
    };

    const success = await updateOrderStatus(selectedOrder.id, updates);
    if (success) {
      await loadOrders();
      setSelectedOrder(null);
    }
    
    setIsSaving(false);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (o.delivery_address?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || o.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const STATUS_OPTIONS = [
    'Order Placed', 'Confirmed', 'Processing', 'Ready to Dispatch', 
    'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-gold" /> Order Management
          </h2>
          <p className="text-xs text-neutral-400 mt-1">Manage e-commerce orders, update tracking, and process fulfillments.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search by Order ID or Customer Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 appearance-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-400">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-black/30 rounded-2xl border border-white/5">
          <ShoppingCart className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 font-bold mb-1">No orders found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10 rounded-2xl bg-black/40">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="text-xs uppercase bg-black/60 text-gold border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Order ID & Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono">
                    <span className="font-bold text-white block">{order.id}</span>
                    <span className="text-[10px] text-neutral-500">{new Date(order.created_at).toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-white block">{order.delivery_address?.name || 'N/A'}</span>
                    <span className="text-[10px] text-neutral-500">{order.delivery_address?.phone || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-gold">
                    ₹{order.total_amount.toLocaleString('en-IN')}
                    <span className={`block mt-1 text-[10px] px-1.5 py-0.5 rounded w-max ${order.payment_status === 'Paid' ? 'bg-green-900/30 text-green-400' : 'bg-orange-900/30 text-orange-400'}`}>
                      {order.payment_status?.toUpperCase() || 'UNPAID'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-neutral-900 border border-white/10 rounded-full text-xs font-bold text-white">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleOpenDetails(order)}
                      className="px-4 py-2 bg-gold/10 hover:bg-gold text-gold hover:text-black rounded-lg font-bold text-xs transition-all"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          <div className="relative bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                  Manage Order <span className="font-mono text-gold">{selectedOrder.id}</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full bg-black/50 text-neutral-400 hover:text-white border border-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto hide-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Col: Order Info */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gold uppercase tracking-wider mb-3 border-b border-white/10 pb-2">Customer & Delivery</h4>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-sm space-y-2">
                    <p><span className="text-neutral-500 w-24 inline-block">Name:</span> <span className="font-bold text-white">{selectedOrder.delivery_address?.name}</span></p>
                    <p><span className="text-neutral-500 w-24 inline-block">Phone:</span> <span className="text-white">{selectedOrder.delivery_address?.phone}</span></p>
                    <p><span className="text-neutral-500 w-24 inline-block">Email:</span> <span className="text-white">{selectedOrder.delivery_address?.email}</span></p>
                    <div className="pt-2 mt-2 border-t border-white/5">
                      <span className="text-neutral-500 block mb-1">Address:</span>
                      <p className="text-white">{selectedOrder.delivery_address?.address}, {selectedOrder.delivery_address?.city}, {selectedOrder.delivery_address?.state} - {selectedOrder.delivery_address?.pincode}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gold uppercase tracking-wider mb-3 border-b border-white/10 pb-2">Order Items ({selectedOrder.items?.length || 0})</h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 items-center bg-black/40 p-3 rounded-xl border border-white/5">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                          {item.product?.image && <img src={item.product.image} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{item.product?.name}</p>
                          <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="font-mono text-sm font-bold text-gold shrink-0">
                          ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Col: Admin Actions */}
              <div className="bg-black/40 p-6 rounded-2xl border border-gold/20 flex flex-col h-full">
                <h4 className="text-sm font-bold text-gold uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Update Order Details
                </h4>

                <div className="space-y-5 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Order Status</label>
                    <select 
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold"
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Courier / Partner Name</label>
                    <input 
                      type="text" 
                      value={editCourier}
                      onChange={e => setEditCourier(e.target.value)}
                      placeholder="e.g. BlueDart, Delhivery"
                      className="w-full bg-neutral-900 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Tracking Number</label>
                    <input 
                      type="text" 
                      value={editTracking}
                      onChange={e => setEditTracking(e.target.value)}
                      placeholder="AWB Number"
                      className="w-full bg-neutral-900 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Expected Delivery Date</label>
                    <input 
                      type="text" 
                      value={editExpectedDate}
                      onChange={e => setEditExpectedDate(e.target.value)}
                      placeholder="e.g. 24th Oct 2026"
                      className="w-full bg-neutral-900 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleUpdateOrder}
                  disabled={isSaving}
                  className="w-full py-4 mt-6 rounded-xl bg-gold hover:bg-gold/90 text-neutral-950 font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
