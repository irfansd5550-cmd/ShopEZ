import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Sun, Moon, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isLanding ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50' : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'
    }`}>
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
            <ShoppingBag size={18} className="text-white" />
          </div>
          <span className="font-black text-xl text-gray-900 dark:text-white tracking-tight">ShopEZ</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {!user ? (
            <>
              <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 font-medium transition-colors">Sign In</Link>
              <Link to="/register" className="btn-primary">Start Free</Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn-primary">Dashboard</Link>
          )}
          <button onClick={toggleTheme} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-col gap-3">
          {!user ? (
            <>
              <Link to="/login" className="text-gray-600 dark:text-gray-300 py-2">Sign In</Link>
              <Link to="/register" className="btn-primary text-center">Start Free</Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn-primary text-center">Dashboard</Link>
          )}
          <button onClick={toggleTheme} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
          </button>
        </div>
      )}
    </nav>
  )
}
