import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const perks = [
  'Free forever starter plan',
  'No credit card required',
  'Unlimited products',
  'Deploy in one click',
]

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 6) s++
    if (p.length >= 10) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^a-zA-Z0-9]/.test(p)) s++
    return s
  })()
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'][strength]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created! Welcome to ShopEZ 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-700 via-purple-600 to-primary-600 relative overflow-hidden flex-col items-center justify-center p-16">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage:'radial-gradient(circle at 80% 30%, white 0%, transparent 60%)' }} />
        <div className="relative text-white max-w-sm">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <ShoppingBag size={28} className="text-white"/>
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight">Start selling in minutes</h1>
          <p className="text-white/70 text-lg leading-relaxed mb-10">
            Join 12,000+ entrepreneurs who built their dream stores with ShopEZ. No coding required.
          </p>
          <ul className="space-y-4">
            {perks.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-white"/>
                </div>
                <span className="text-white/90 font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5 }}
          className="w-full max-w-md py-8">

          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-white"/>
            </div>
            <span className="font-black text-xl text-gray-900 dark:text-white">ShopEZ</span>
          </div>

          <div className="card p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Create account</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Free forever. No credit card needed.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type="text" required value={form.name}
                    onChange={e => setForm({...form, name:e.target.value})}
                    className="input-field pl-10" placeholder="Rahul Sharma"/>
                </div>
              </div>

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
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type={showPass ? 'text' : 'password'} required value={form.password}
                    onChange={e => setForm({...form, password:e.target.value})}
                    className="input-field pl-10 pr-10" placeholder="Min. 6 characters"/>
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i<=strength ? strengthColor : 'bg-gray-200 dark:bg-gray-700'}`}/>
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength<=1?'text-red-500':strength<=2?'text-orange-500':strength<=3?'text-yellow-500':'text-emerald-500'}`}>
                      {strengthLabel}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type="password" required value={form.confirm}
                    onChange={e => setForm({...form, confirm:e.target.value})}
                    className={`input-field pl-10 ${form.confirm && form.confirm!==form.password ? '!border-red-400 focus:!ring-red-400/40' : ''}`}
                    placeholder="Repeat password"/>
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Passwords don't match</p>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3 text-base font-bold group mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Free Account <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              By registering, you agree to our{' '}
              <a href="#" className="text-primary-600 hover:underline">Terms</a> and{' '}
              <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
            </p>

            <p className="text-center text-gray-500 dark:text-gray-400 mt-5 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">Sign in →</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
