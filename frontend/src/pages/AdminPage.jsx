import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Store, ShoppingCart, DollarSign, Shield, Trash2, Ban, CheckCircle,
  Search, BarChart2, Package, TrendingUp, AlertTriangle, RefreshCw,
  ChevronRight, Eye, Settings, UserCheck, UserX, ArrowLeft
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { formatCurrency, timeAgo } from '../utils/helpers'

const tabs = [
  { id:'overview', label:'Overview', icon:<BarChart2 size={16}/> },
  { id:'users',    label:'Users',    icon:<Users size={16}/> },
  { id:'shops',    label:'Shops',    icon:<Store size={16}/> },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/dashboard')
      setStats(res.data)
    } catch { toast.error('Admin access required') }
    finally { setLoading(false) }
  }

  const loadUsers = async () => {
    try {
      const res = await api.get(`/admin/users?search=${search}`)
      setUsers(res.data.users || [])
    } catch { toast.error('Failed to load users') }
  }

  const loadShops = async () => {
    try {
      const res = await api.get(`/admin/shops?search=${search}`)
      setShops(res.data.shops || [])
    } catch { toast.error('Failed to load shops') }
  }

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'shops') loadShops()
  }, [activeTab, search])

  const toggleUser = async (id) => {
    try {
      await api.post(`/admin/users/${id}/toggle`)
      loadUsers()
      toast.success('User status updated')
    } catch { toast.error('Failed') }
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete this user and all their data?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      loadUsers()
      toast.success('User deleted')
    } catch { toast.error('Failed') }
  }

  const toggleShop = async (id) => {
    try {
      await api.post(`/admin/shops/${id}/suspend`)
      loadShops()
      toast.success('Shop status updated')
    } catch { toast.error('Failed') }
  }

  const deleteShop = async (id) => {
    if (!confirm('Delete this shop permanently?')) return
    try {
      await api.delete(`/admin/shops/${id}`)
      loadShops()
      toast.success('Shop deleted')
    } catch { toast.error('Failed') }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading admin panel...</p>
      </div>
    </div>
  )

  const s = stats?.stats || {}
  const statCards = [
    { label:'Total Users',    value:s.users||0,              icon:<Users size={20}/>,     color:'from-blue-500 to-cyan-500' },
    { label:'Total Shops',    value:s.shops||0,              icon:<Store size={20}/>,     color:'from-violet-500 to-purple-600' },
    { label:'Total Orders',   value:s.orders||0,             icon:<ShoppingCart size={20}/>, color:'from-emerald-500 to-teal-500' },
    { label:'Total Revenue',  value:formatCurrency(s.revenue||0), icon:<DollarSign size={20}/>, color:'from-orange-500 to-amber-500' },
    { label:'Live Shops',     value:s.published_shops||0,    icon:<CheckCircle size={20}/>, color:'from-green-500 to-emerald-600' },
    { label:'Products',       value:s.products||0,           icon:<Package size={20}/>,   color:'from-pink-500 to-rose-500' },
    { label:"Today's Orders", value:s.today_orders||0,       icon:<TrendingUp size={20}/>, color:'from-indigo-500 to-blue-600' },
    { label:"Today's Revenue",value:formatCurrency(s.today_revenue||0), icon:<BarChart2 size={20}/>, color:'from-teal-500 to-cyan-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <ArrowLeft size={20}/>
            </Link>
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-white"/>
            </div>
            <div>
              <h1 className="font-black text-gray-900 dark:text-white text-lg leading-none">Super Admin</h1>
              <p className="text-xs text-gray-400 mt-0.5">Platform management</p>
            </div>
          </div>
          <button onClick={loadDashboard} className="btn-ghost text-sm gap-1.5">
            <RefreshCw size={15}/> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl p-1.5 border border-gray-200 dark:border-gray-700 mb-8 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab===tab.id
                  ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((c, i) => (
                <motion.div key={i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                  className="card p-5">
                  <div className={`w-11 h-11 bg-gradient-to-br ${c.color} rounded-xl flex items-center justify-center text-white mb-3 shadow-md`}>
                    {c.icon}
                  </div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">{c.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">{c.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Recent activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {(stats?.recent_users||[]).slice(0,6).map((u, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {u.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email} · {timeAgo(u.created_at)}</p>
                      </div>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active ? 'Active' : 'Banned'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Shops</h3>
                <div className="space-y-3">
                  {(stats?.recent_shops||[]).slice(0,6).map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                        <Store size={14}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.name}</p>
                        <p className="text-xs text-gray-400 truncate">by {s.owner_name} · {timeAgo(s.created_at)}</p>
                      </div>
                      <span className={`badge ${s.is_published ? 'badge-green' : 'badge-gray'}`}>
                        {s.is_published ? 'Live' : 'Draft'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-5">
            <div className="relative max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10"
                placeholder="Search users..."/>
            </div>
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr><th>User</th><th>Shops</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-blue">{u.shops_count}</span></td>
                      <td className="text-xs text-gray-400">{timeAgo(u.created_at)}</td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                          {u.is_active ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => toggleUser(u.id)}
                            className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                            title={u.is_active ? 'Ban user' : 'Unban user'}>
                            {u.is_active ? <UserX size={15}/> : <UserCheck size={15}/>}
                          </button>
                          <button onClick={() => deleteUser(u.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-sm">No users found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Shops tab */}
        {activeTab === 'shops' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-5">
            <div className="relative max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10"
                placeholder="Search shops..."/>
            </div>
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr><th>Store</th><th>Owner</th><th>Products</th><th>Orders</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {shops.map((s, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                            <Store size={13}/>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.name}</p>
                            <p className="text-xs text-gray-400">/{s.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{s.owner_name}</p>
                        <p className="text-xs text-gray-400">{s.owner_email}</p>
                      </td>
                      <td><span className="badge badge-purple">{s.products_count}</span></td>
                      <td><span className="badge badge-blue">{s.orders_count}</span></td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className={`badge ${s.is_published ? 'badge-green' : 'badge-gray'}`}>{s.is_published?'Live':'Draft'}</span>
                          {s.is_suspended && <span className="badge badge-red">Suspended</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => toggleShop(s.id)}
                            className={`p-1.5 rounded-lg transition-colors ${s.is_suspended ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                            title={s.is_suspended ? 'Unsuspend' : 'Suspend'}>
                            {s.is_suspended ? <CheckCircle size={15}/> : <Ban size={15}/>}
                          </button>
                          {s.is_published && (
                            <a href={`/store/${s.slug}`} target="_blank" rel="noreferrer"
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <Eye size={15}/>
                            </a>
                          )}
                          <button onClick={() => deleteShop(s.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shops.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Store size={32} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-sm">No shops found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
