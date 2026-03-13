import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Eye, X, Package, MapPin, Phone, Mail, User, ChevronDown, Search, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, timeAgo } from '../../utils/helpers'

const STATUS_COLORS = {
  pending:    'badge-yellow',
  processing: 'badge-blue',
  shipped:    'badge-purple',
  delivered:  'badge-green',
  cancelled:  'badge-red',
}
const STATUS_OPTIONS = ['pending','processing','shipped','delivered','cancelled']

export default function OrdersManager() {
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    api.get('/shops').then(r => {
      setShops(r.data.shops || [])
      if (r.data.shops?.length > 0) setSelectedShop(r.data.shops[0])
    })
  }, [])

  useEffect(() => {
    if (selectedShop) loadOrders()
  }, [selectedShop, statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: 50 })
      if (statusFilter) params.append('status', statusFilter)
      const res = await api.get(`/orders/shop/${selectedShop.id}?${params}`)
      setOrders(res.data.orders || [])
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  const openOrder = async (order) => {
    setSelectedOrder(order)
    try {
      const res = await api.get(`/orders/${order.id}`)
      setOrderItems(res.data.items || [])
    } catch { toast.error('Failed to load order details') }
  }

  const updateStatus = async (orderId, status) => {
    setUpdatingStatus(true)
    try {
      await api.put(`/orders/${orderId}/status`, { status })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status }))
      toast.success('Status updated!')
    } catch { toast.error('Failed to update status') }
    finally { setUpdatingStatus(false) }
  }

  const filteredOrders = orders.filter(o =>
    !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_email?.toLowerCase().includes(search.toLowerCase())
  )

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
        <div className="flex gap-3">
          {shops.length > 1 && (
            <select value={selectedShop?.id} onChange={e => setSelectedShop(shops.find(s=>s.id===parseInt(e.target.value)))}
              className="input-field !w-auto text-sm">
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button onClick={loadOrders} className="btn-ghost gap-1.5">
            <RefreshCw size={15}/> Refresh
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${!statusFilter ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
          All ({orders.length})
        </button>
        {STATUS_OPTIONS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${statusFilter===s ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 text-sm"
          placeholder="Search by order #, name, email..."/>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl"/>)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-500 dark:text-gray-400">{search || statusFilter ? 'No orders match your filters' : 'No orders yet'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <motion.tr key={order.id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="cursor-pointer" onClick={() => openOrder(order)}>
                    <td>
                      <span className="font-mono font-bold text-primary-600 dark:text-primary-400 text-sm">
                        #{order.order_number}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</td>
                    <td>
                      <select
                        value={order.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value) }}
                        className={`badge ${STATUS_COLORS[order.status]} bg-transparent border-0 cursor-pointer text-xs font-semibold capitalize pr-1`}
                        disabled={updatingStatus}>
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white capitalize">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-xs text-gray-400" title={formatDate(order.created_at, {hour:'2-digit',minute:'2-digit'})}>
                      {timeAgo(order.created_at)}
                    </td>
                    <td>
                      <button onClick={e => { e.stopPropagation(); openOrder(order) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 transition-colors">
                        <Eye size={15}/>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order detail modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              className="card w-full max-w-2xl p-6 my-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Order #{selectedOrder.order_number}
                  </h2>
                  <p className="text-sm text-gray-400">{formatDate(selectedOrder.created_at, { hour:'2-digit', minute:'2-digit' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select value={selectedOrder.status}
                    onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                    className="input-field !w-auto text-sm capitalize" disabled={updatingStatus}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                  <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={22}/>
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                {/* Customer info */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Customer</h3>
                  {[
                    { icon:<User size={14}/>,    label:'Name',  val:selectedOrder.customer_name },
                    { icon:<Mail size={14}/>,    label:'Email', val:selectedOrder.customer_email },
                    { icon:<Phone size={14}/>,   label:'Phone', val:selectedOrder.customer_phone },
                  ].map((row, i) => row.val && (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-400 mt-0.5">{row.icon}</span>
                      <div>
                        <span className="text-gray-400 text-xs">{row.label}: </span>
                        <span className="text-gray-900 dark:text-white font-medium">{row.val}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Address */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Shipping Address</h3>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                    <div className="text-gray-700 dark:text-gray-300">
                      <p>{selectedOrder.shipping_address}</p>
                      <p>{[selectedOrder.city, selectedOrder.state, selectedOrder.postal_code].filter(Boolean).join(', ')}</p>
                      <p>{selectedOrder.country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide mb-3">
                  <Package size={14} className="inline mr-1.5"/>Order Items
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">Product</th>
                        <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">Qty</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">Price</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-600/50 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{item.product_name}</td>
                          <td className="px-4 py-2.5 text-center text-gray-500">×{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right text-gray-500">{formatCurrency(item.product_price)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 dark:border-gray-600">
                        <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">Order Total</td>
                        <td className="px-4 py-3 text-right font-black text-primary-600 dark:text-primary-400 text-base">{formatCurrency(selectedOrder.total_amount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
