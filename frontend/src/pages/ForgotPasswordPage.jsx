import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Mail, ArrowLeft } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('Reset link sent!')
    } catch (err) {
      toast.error('Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <span className="font-black text-xl text-gray-900 dark:text-white">ShopEZ</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Enter your email to receive a reset link</p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-green-600" size={28} />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">If an account exists for <strong>{email}</strong>, you'll receive a reset email shortly.</p>
              <Link to="/login" className="btn-primary w-full block text-center">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <Link to="/login" className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mt-6 text-sm hover:text-primary-600">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
