import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Store, Package, ShoppingCart, TrendingUp, Plus, ArrowRight,
  ExternalLink, Zap, BarChart2, AlertTriangle, Clock, CheckCircle,
  Users, DollarSign, Eye, Star
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { formatCurrency, timeAgo } from '../../utils/helpers'

const statusBadge = {
  pending:    'badge-yellow',
  processing: 'badge-blue',
  shipped:    'badge-purple',
  delivered:  'badge-green',
  cancelled:  'badge-red',
}

export default function DashboardHome() {
  const { user } = useAuth()
  const [shops, setShops] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await api.get('/shops')
      const shopList = res.data.shops || []
      setShops(shopList)
      if (shopList.length > 0) {
        const aRes = await api.get(`/analytics/shop/${shopList[0].id}`)
        setAnalytics(aRes.data)
      }
    } catch (err) { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  const rev   = analytics?.revenue   || {}
  const today = analytics?.today     || {}
  const thisM = analytics?.this_month?.revenue || 0
  const lastM = analytics?.last_month?.revenue || 0
  const growth = lastM > 0 ? (((thisM - lastM) / lastM) * 100).toFixed(1) : 0

  const statCards = [
    {
      label: 'My Stores', value: shops.length, sub: `${shops.filter(s=>s.is_published).length} live`,
      icon: <Store size={22} />, color: 'blue', link: '/dashboard/stores'
    },
    {
      label: 'Total Products', value: analytics?.products_count || 0,
      sub: `${analytics?.categories_count || 0} categories`,
      icon: <Package size={22} />, color: 'purple', link: '/dashboard/products'
    },
    {
      label: 'Total Orders', value: rev.total_orders || 0,
      sub: `${today.orders || 0} today`,
      icon: <ShoppingCart size={22} />, color: 'green', link: '/dashboard/orders'
    },
    {
      label: 'Total Revenue', value: formatCurrency(rev.total_revenue || 0),
      sub: growth > 0 ? `↑ ${growth}% this month` : growth < 0 ? `↓ ${Math.abs(growth)}% this month` : 'No change',
      icon: <DollarSign size={22} />, color: 'orange', link: '/dashboard/analytics'
    },
  ]

  const colorMap = {
    blue:   'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-violet-600',
    green:  'from-emerald-500 to-teal-500',
    orange: 'from-orange-500 to-amber-500',
  }
  const bgMap = {
    blue:   'bg-blue-50 dark:bg-blue-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    green:  'bg-emerald-50 dark:bg-emerald-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20',
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-28 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="relative bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-700 rounded-2xl p-7 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage:'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-1">
              <Zap size={14} /> AI-Powered Platform
            </div>
            <h1 className="text-2xl md:text-3xl font-black mb-1">
              Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-white/70">Your store is waiting. Let's make some sales today.</p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <Link to="/dashboard/stores"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold py-2.5 px-5 rounded-xl text-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
              <Plus size={16}/> New Store
            </Link>
            <Link to="/dashboard/analytics"
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold py-2.5 px-5 rounded-xl text-sm hover:bg-white/25 transition-all">
              <BarChart2 size={16}/> Analytics
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.08 }}>
            <Link to={s.link}
              className="card p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group block">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 bg-gradient-to-br ${colorMap[s.color]} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">{s.value}</div>
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">{s.label}</div>
              {s.sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.sub}</div>}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Stores */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">My Stores</h2>
            <Link to="/dashboard/stores" className="text-primary-600 dark:text-primary-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight size={14}/>
            </Link>
          </div>
          {shops.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store size={28} className="text-primary-500" />
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No stores yet</p>
              <p className="text-sm text-gray-400 mb-5">Create your first store to start selling</p>
              <Link to="/dashboard/stores" className="btn-primary">
                <Plus size={16}/> Create Store
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {shops.slice(0,4).map(shop => (
                <div key={shop.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    {shop.logo_url
                      ? <img src={shop.logo_url} alt="" className="w-full h-full object-cover" />
                      : <Store size={18} className="text-white"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{shop.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{shop.category || 'No category'} • /{shop.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge ${shop.is_published ? 'badge-green' : 'badge-gray'}`}>
                      {shop.is_published ? '● Live' : '○ Draft'}
                    </span>
                    {shop.is_published && (
                      <a href={`/store/${shop.slug}`} target="_blank" rel="noreferrer"
                        className="text-gray-400 hover:text-primary-500 transition-colors">
                        <ExternalLink size={14}/>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions + Today stats */}
        <div className="space-y-5">
          {/* Today's stats */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-primary-500"/> Today
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Orders</span>
                <span className="font-bold text-gray-900 dark:text-white">{today.orders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                <span className="font-bold text-emerald-600">{formatCurrency(today.revenue || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Order</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(rev.avg_order || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Customers</span>
                <span className="font-bold text-gray-900 dark:text-white">{rev.unique_customers || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon: <Plus size={15}/>, label: 'Add Product', to: '/dashboard/products', color: 'text-blue-600' },
                { icon: <Eye size={15}/>, label: 'View Orders', to: '/dashboard/orders', color: 'text-green-600' },
                { icon: <BarChart2 size={15}/>, label: 'Analytics', to: '/dashboard/analytics', color: 'text-purple-600' },
                { icon: <Star size={15}/>, label: 'AI Assistant', to: '/dashboard/ai', color: 'text-orange-500' },
              ].map((a, i) => (
                <Link key={i} to={a.to}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <span className={`${a.color}`}>{a.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{a.label}</span>
                  <ArrowRight size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 ml-auto group-hover:translate-x-0.5 transition-all"/>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders + Low stock */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link to="/dashboard/orders" className="text-primary-600 dark:text-primary-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight size={14}/>
            </Link>
          </div>
          {(analytics?.recent_orders || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-40"/>
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(analytics?.recent_orders || []).map((o, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={14} className="text-primary-600 dark:text-primary-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">#{o.order_number}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{o.customer_name} · {timeAgo(o.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(o.total_amount)}</p>
                    <span className={`badge text-xs ${statusBadge[o.status] || 'badge-gray'}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500"/> Low Stock Alerts
            </h2>
            <Link to="/dashboard/products" className="text-primary-600 dark:text-primary-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Manage <ArrowRight size={14}/>
            </Link>
          </div>
          {(analytics?.low_stock || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400 opacity-70"/>
              <p className="text-sm">All products well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(analytics?.low_stock || []).map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p.stock_quantity === 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                    <AlertTriangle size={14} className={p.stock_quantity === 0 ? 'text-red-500' : 'text-amber-500'}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(p.price)}</p>
                  </div>
                  <span className={`badge ${p.stock_quantity === 0 ? 'badge-red' : 'badge-yellow'}`}>
                    {p.stock_quantity === 0 ? 'Out of stock' : `${p.stock_quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
