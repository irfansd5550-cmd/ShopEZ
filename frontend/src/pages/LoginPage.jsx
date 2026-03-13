import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Eye, EyeOff, Mail, Lock, ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-purple-600 to-indigo-700 relative overflow-hidden flex-col items-center justify-center p-16">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage:'radial-gradient(circle at 30% 70%, white 0%, transparent 60%)' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />

        <div className="relative text-white text-center max-w-sm">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <ShoppingBag size={36} className="text-white"/>
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight">Welcome back to ShopEZ</h1>
          <p className="text-white/70 text-lg leading-relaxed mb-10">Your e-commerce dashboard is one click away. Manage stores, products, and orders effortlessly.</p>
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { n: '12K+', l: 'Active Stores' },
              { n: '₹2Cr+', l: 'Revenue Generated' },
              { n: '85K+', l: 'Products Listed' },
              { n: '98%', l: 'Uptime' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-black">{s.n}</div>
                <div className="text-white/60 text-sm">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5 }}
          className="w-full max-w-md">

          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-white"/>
            </div>
            <span className="font-black text-xl text-gray-900 dark:text-white">ShopEZ</span>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Sign in</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Enter your credentials to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type="email" required value={form.email}
                    onChange={e => setForm({...form, email:e.target.value})}
                    className="input-field pl-10" placeholder="you@example.com"/>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label !mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type={showPass ? 'text' : 'password'} required value={form.password}
                    onChange={e => setForm({...form, password:e.target.value})}
                    className="input-field pl-10 pr-10" placeholder="••••••••"/>
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3 text-base font-bold group">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"/></div>
              <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-800 px-3 text-xs text-gray-400 font-medium">OR</span></div>
            </div>

            <div className="flex items-center justify-center gap-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 border border-primary-100 dark:border-primary-800">
              <Zap size={14} className="text-primary-500"/>
              <span className="text-xs text-primary-700 dark:text-primary-400 font-medium">
                Demo: admin@shopez.com / Admin@123
              </span>
            </div>

            <p className="text-center text-gray-500 dark:text-gray-400 mt-6 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">Create one free →</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
