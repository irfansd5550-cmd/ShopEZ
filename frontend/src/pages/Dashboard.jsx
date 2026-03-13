import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  ShoppingBag, LayoutDashboard, Store, Package, Tag, ShoppingCart,
  ClipboardList, BarChart2, Settings, LogOut, Sun, Moon, Menu, X,
  ChevronRight, Bell, User, Wrench
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DashboardHome from '../components/dashboard/DashboardHome'
import ShopsManager from '../components/dashboard/ShopsManager'
import ProductsManager from '../components/dashboard/ProductsManager'
import CategoriesManager from '../components/dashboard/CategoriesManager'
import OrdersManager from '../components/dashboard/OrdersManager'
import AnalyticsView from '../components/dashboard/AnalyticsView'
import StoreSettings from '../components/dashboard/StoreSettings'
import AIAssistant from '../components/dashboard/AIAssistant'

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} />, exact: true },
  { path: '/dashboard/stores', label: 'My Stores', icon: <Store size={18} /> },
  { path: '/dashboard/products', label: 'Products', icon: <Package size={18} /> },
  { path: '/dashboard/categories', label: 'Categories', icon: <Tag size={18} /> },
  { path: '/dashboard/orders', label: 'Orders', icon: <ClipboardList size={18} /> },
  { path: '/dashboard/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
  { path: '/dashboard/settings', label: 'Settings', icon: <Settings size={18} /> },
  { path: '/dashboard/ai', label: 'AI Assistant', icon: <Wrench size={18} /> }
]

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <span className="font-black text-lg text-gray-900 dark:text-white">ShopEZ</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin" className="sidebar-link text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20">
              <Settings size={18} />
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="text-primary-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
              <Menu size={20} />
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400 hidden md:flex items-center gap-1">
              <span>Dashboard</span>
              <ChevronRight size={14} />
              <span className="text-gray-900 dark:text-white font-medium">
                {navItems.find(n => isActive(n.path, n.exact))?.label || 'Home'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-primary-600" />
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="stores" element={<ShopsManager />} />
            <Route path="products" element={<ProductsManager />} />
            <Route path="categories" element={<CategoriesManager />} />
            <Route path="orders" element={<OrdersManager />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="settings" element={<StoreSettings />} />
            <Route path="ai" element={<AIAssistant />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
