import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, ShoppingCart, Package, DollarSign, Users, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { formatCurrency, timeAgo } from '../../utils/helpers'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const statusColor = {
  pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6',
  delivered: '#10b981', cancelled: '#ef4444',
}

export default function AnalyticsView() {
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('monthly')

  useEffect(() => {
    api.get('/shops').then(r => {
      const s = r.data.shops || []
      setShops(s)
      if (s.length > 0) setSelectedShop(s[0])
    })
  }, [])

  useEffect(() => { if (selectedShop) loadAnalytics() }, [selectedShop])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/analytics/shop/${selectedShop.id}`)
      setData(res.data)
    } catch { toast.error('Failed to load analytics') }
    finally { setLoading(false) }
  }

  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#9ca3af' : '#6b7280'
  const gridColor = isDark ? 'rgba(55,65,81,0.5)' : 'rgba(243,244,246,1)'
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor, font: { family: 'Poppins', size: 12 }, padding: 16 } },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: textColor,
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: { ticks: { color: textColor, font: { family: 'Poppins', size: 11 } }, grid: { color: gridColor } },
      y: { ticks: { color: textColor, font: { family: 'Poppins', size: 11 } }, grid: { color: gridColor } },
    },
  }

  if (!data && loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-52 rounded-2xl"/>)}
    </div>
  )

  const rev     = data?.revenue || {}
  const monthly = data?.monthly || []
  const weekly  = data?.weekly  || []
  const thisM   = parseFloat(data?.this_month?.revenue || 0)
  const lastM   = parseFloat(data?.last_month?.revenue || 0)
  const growth  = lastM > 0 ? (((thisM - lastM) / lastM) * 100).toFixed(1) : null

  const periodData = period === 'monthly' ? monthly : weekly
  const labels     = period === 'monthly'
    ? periodData.map(m => { const [y,mo] = m.month.split('-'); return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo)-1]} ${y.slice(2)}` })
    : periodData.map(m => m.week_start?.slice(5) || m.week_key)

  const revenueData = periodData.map(m => parseFloat(m.revenue || 0))
  const ordersData  = periodData.map(m => parseInt(m.orders || 0))

  const statusCounts = data?.status_counts || []
  const doughnutData = {
    labels: statusCounts.map(s => s.status),
    datasets: [{
      data: statusCounts.map(s => s.count),
      backgroundColor: statusCounts.map(s => statusColor[s.status] || '#6b7280'),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  }

  const summaryCards = [
    { label: 'Total Revenue', value: formatCurrency(rev.total_revenue || 0), icon: <DollarSign size={20}/>, color: 'from-emerald-500 to-teal-500', sub: growth !== null ? `${growth > 0 ? '↑' : growth < 0 ? '↓' : '→'} ${Math.abs(growth)}% vs last month` : 'First month' },
    { label: 'Total Orders', value: rev.total_orders || 0, icon: <ShoppingCart size={20}/>, color: 'from-blue-500 to-cyan-500', sub: `${data?.today?.orders || 0} today` },
    { label: 'Avg Order Value', value: formatCurrency(rev.avg_order || 0), icon: <TrendingUp size={20}/>, color: 'from-purple-500 to-violet-600', sub: 'Per transaction' },
    { label: 'Unique Customers', value: rev.unique_customers || 0, icon: <Users size={20}/>, color: 'from-orange-500 to-amber-500', sub: 'All time' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Performance insights for your stores</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {shops.length > 1 && (
            <select value={selectedShop?.id} onChange={e => setSelectedShop(shops.find(s=>s.id===parseInt(e.target.value)))}
              className="input-field !w-auto text-sm">
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {['monthly','weekly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-semibold transition-colors capitalize ${period===p ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c, i) => (
          <motion.div key={i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
            className="card p-5">
            <div className={`w-11 h-11 bg-gradient-to-br ${c.color} rounded-xl flex items-center justify-center text-white mb-4 shadow-md`}>
              {c.icon}
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">{c.value}</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{c.label}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{c.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-5">Revenue Over Time</h3>
          {revenueData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="h-52">
              <Line
                data={{
                  labels,
                  datasets: [{
                    label: 'Revenue (₹)',
                    data: revenueData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 4,
                    pointHoverRadius: 7,
                  }],
                }}
                options={{ ...baseOpts, scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, beginAtZero: true } } }}
              />
            </div>
          )}
        </div>

        {/* Order status */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-5">Order Status</h3>
          {statusCounts.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <div className="h-52">
              <Doughnut data={doughnutData} options={{ ...baseOpts, scales: undefined, cutout: '65%', plugins: { ...baseOpts.plugins, legend: { ...baseOpts.plugins.legend, position: 'bottom' } } }} />
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders bar */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-5">Orders Volume</h3>
          {ordersData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="h-48">
              <Bar
                data={{
                  labels,
                  datasets: [{
                    label: 'Orders',
                    data: ordersData,
                    backgroundColor: 'rgba(139,92,246,0.75)',
                    borderRadius: 8,
                    borderSkipped: false,
                  }],
                }}
                options={{ ...baseOpts, scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, beginAtZero: true, ticks: { ...baseOpts.scales.y.ticks, precision: 0 } } } }}
              />
            </div>
          )}
        </div>

        {/* Best sellers */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-5">Best Sellers</h3>
          {(data?.best_sellers || []).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No products sold yet</div>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide">
              {(data?.best_sellers || []).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</span>
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400 ml-2 flex-shrink-0">{formatCurrency(p.revenue)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-primary-500 to-purple-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (p.sales_count / (data.best_sellers[0]?.sales_count || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{p.sales_count} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
