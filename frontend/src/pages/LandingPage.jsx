import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Zap, Globe, Star, ArrowRight, Check, Palette, Package,
  BarChart3, MessageCircle, Github, Rocket, Shield, Users, TrendingUp,
  Play, ChevronDown, Sparkles, Code2, Smartphone, Moon, Sun, Menu, X,
  Store, Tag, ClipboardList, Bot, Download, Instagram
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = end / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, end, duration])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

// ── Floating particle ─────────────────────────────────────────────────────────
function Particle({ style }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={style}
      animate={{ y: [0, -30, 0], opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 3 }}
    />
  )
}

// ── Typewriter ────────────────────────────────────────────────────────────────
function Typewriter({ words }) {
  const [idx, setIdx] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = words[idx]
    const speed = deleting ? 40 : 80
    const timer = setTimeout(() => {
      if (!deleting && text === current) {
        setTimeout(() => setDeleting(true), 1600)
      } else if (deleting && text === '') {
        setDeleting(false)
        setIdx(i => (i + 1) % words.length)
      } else {
        setText(prev => deleting ? prev.slice(0, -1) : current.slice(0, prev.length + 1))
      }
    }, speed)
    return () => clearTimeout(timer)
  }, [text, deleting, idx, words])

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-purple-500">
      {text}<span className="animate-pulse">|</span>
    </span>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────
const features = [
  { icon: <Palette size={26} />, title: 'Drag & Drop Builder', desc: 'Build stunning stores with our GrapesJS-powered visual editor. Drag sections, edit text, upload images — no code needed.', color: 'from-violet-500 to-purple-600' },
  { icon: <Package size={26} />, title: 'Product Management', desc: 'Add unlimited products with multiple images, categories, variants and inventory tracking in seconds.', color: 'from-blue-500 to-cyan-600' },
  { icon: <ShoppingBag size={26} />, title: 'Cart & Checkout', desc: 'Full e-commerce flow with persistent cart, customer checkout form, order confirmation and email notifications.', color: 'from-emerald-500 to-teal-600' },
  { icon: <BarChart3 size={26} />, title: 'Analytics Dashboard', desc: 'Track revenue, orders, best-sellers and monthly growth with beautiful interactive Chart.js visualizations.', color: 'from-orange-500 to-amber-600' },
  { icon: <Bot size={26} />, title: 'AI Assistant', desc: 'Built-in AI chatbot powered by Anthropic Claude. Answers questions in English and Hinglish to guide you step by step.', color: 'from-pink-500 to-rose-600' },
  { icon: <MessageCircle size={26} />, title: 'WhatsApp & Instagram', desc: 'Let customers contact you instantly. Smart FAB buttons on your store with direct order links via WhatsApp.', color: 'from-green-500 to-emerald-600' },
  { icon: <Github size={26} />, title: 'GitHub Publish', desc: 'Push your entire store code to GitHub in one click. Enables GitHub Pages hosting and version control.', color: 'from-gray-600 to-gray-800' },
  { icon: <Rocket size={26} />, title: 'One-Click Deploy', desc: 'Deploy to Render instantly or download your store as a complete ZIP with HTML, CSS, JS and database SQL.', color: 'from-indigo-500 to-blue-600' },
]

const templates = [
  { name: 'Fashion', emoji: '👗', desc: 'Elegant and stylish', color: 'from-pink-400 to-rose-500', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  { name: 'Electronics', emoji: '💻', desc: 'Tech-forward design', color: 'from-blue-400 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { name: 'Furniture', emoji: '🛋️', desc: 'Warm & homely feel', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { name: 'Luxury', emoji: '💎', desc: 'Premium & exclusive', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  { name: 'Minimal', emoji: '⬜', desc: 'Clean & minimal', color: 'from-gray-500 to-gray-700', bg: 'bg-gray-50 dark:bg-gray-900/30' },
  { name: 'Creative', emoji: '🎨', desc: 'Bold & expressive', color: 'from-fuchsia-500 to-pink-600', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30' },
  { name: 'Modern', emoji: '🚀', desc: 'SaaS-style layout', color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
]

const plans = [
  {
    name: 'Starter', price: 'Free', period: '', badge: '',
    desc: 'Perfect to explore ShopEZ',
    features: ['1 Store', '10 Products', '3 Templates', 'WhatsApp Button', 'Basic Analytics', 'Community Support'],
    cta: 'Start Free', link: '/register', highlight: false
  },
  {
    name: 'Pro', price: '₹999', period: '/month', badge: '🔥 Most Popular',
    desc: 'For growing businesses',
    features: ['5 Stores', 'Unlimited Products', 'All 7 Templates', 'AI Assistant', 'Full Analytics', 'GitHub Publish', 'Priority Support'],
    cta: 'Start Pro Trial', link: '/register', highlight: true
  },
  {
    name: 'Enterprise', price: '₹2,999', period: '/month', badge: '',
    desc: 'For large operations',
    features: ['Unlimited Stores', 'Unlimited Products', 'Custom Domain', 'White Label', 'API Access', 'Team Members', '24/7 Dedicated Support'],
    cta: 'Contact Sales', link: '/register', highlight: false
  },
]

const testimonials = [
  { name: 'Priya Sharma', role: 'Fashion Boutique Owner', text: 'ShopEZ helped me launch my fashion store in under 2 hours. The templates are stunning and the WhatsApp integration is perfect!', rating: 5, avatar: '👩‍💼' },
  { name: 'Rahul Mehta', role: 'Electronics Reseller', text: 'The analytics dashboard is incredible. I can see exactly which products are selling and adjust my inventory accordingly.', rating: 5, avatar: '👨‍💻' },
  { name: 'Anjali Gupta', role: 'Handicraft Seller', text: 'Main ek non-technical person hoon. ShopEZ ka AI assistant ne meri bahut help ki. Ab mera store live hai!', rating: 5, avatar: '👩‍🎨' },
]

const stats = [
  { value: 12000, suffix: '+', label: 'Stores Created', icon: <Store size={24} /> },
  { value: 85000, suffix: '+', label: 'Products Listed', icon: <Package size={24} /> },
  { value: 3200, suffix: '+', label: 'Orders Placed', icon: <ClipboardList size={24} /> },
  { value: 98, suffix: '%', label: 'Customer Satisfaction', icon: <Star size={24} /> },
]

const steps = [
  { step: '01', title: 'Create Account', desc: 'Sign up free with email or Google OAuth in 30 seconds.' },
  { step: '02', title: 'Pick a Template', desc: 'Choose from 7 professional templates built for your niche.' },
  { step: '03', title: 'Add Products', desc: 'Upload images, set prices, add categories — all in minutes.' },
  { step: '04', title: 'Publish & Sell', desc: 'Go live with one click. Share your store link and start selling!' },
]

const particles = Array.from({ length: 18 }, (_, i) => ({
  width: `${8 + Math.random() * 24}px`,
  height: `${8 + Math.random() * 24}px`,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  background: i % 3 === 0 ? 'rgba(99,102,241,0.25)' : i % 3 === 1 ? 'rgba(139,92,246,0.2)' : 'rgba(236,72,153,0.15)',
}))

// ── Component ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [hoveredTemplate, setHoveredTemplate] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(i => (i + 1) % testimonials.length), 4000)
    return () => clearInterval(timer)
  }, [])

  const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }
  const stagger = { visible: { transition: { staggerChildren: 0.12 } } }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden selection:bg-primary-200 dark:selection:bg-primary-800">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg shadow-black/5' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary-500/40 transition-shadow">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <span className="font-black text-xl text-gray-900 dark:text-white">ShopEZ</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Templates', 'Pricing', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/login" className="hidden md:block text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/register"
              className="bg-gradient-to-r from-primary-500 to-purple-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all hover:-translate-y-0.5">
              Get Started Free
            </Link>
            <button onClick={() => setMenuOpen(o => !o)} className="md:hidden w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-6 py-4 space-y-3">
              {['Features', 'Templates', 'Pricing'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 py-2 hover:text-primary-600 transition-colors">
                  {item}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl text-sm font-bold">Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/50 to-indigo-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 60%)' }} />

        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        {/* Floating particles */}
        {particles.map((p, i) => <Particle key={i} style={p} />)}

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/10 dark:bg-primary-400/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-400/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 rounded-full px-4 py-2 text-sm font-semibold mb-8 shadow-lg shadow-primary-500/10">
            <Sparkles size={14} className="text-primary-500" />
            AI-Powered No-Code E-commerce Platform
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-8xl font-black text-gray-900 dark:text-white mb-6 leading-[1.02] tracking-tight">
            Build your
            <br />
            <Typewriter words={['Online Store', 'Fashion Shop', 'Tech Store', 'Dream Brand']} />
            <br />
            without code
          </motion.h1>

          {/* Subtitle */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Create a stunning e-commerce store in minutes with drag-and-drop tools, AI assistant,
            WhatsApp integration, and one-click deployment.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link to="/register"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:shadow-2xl hover:shadow-primary-500/40 transition-all hover:-translate-y-1">
              <Zap size={20} /> Start Building Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features"
              className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-bold text-lg px-8 py-4 rounded-2xl hover:border-primary-400 transition-all hover:-translate-y-1">
              <Play size={18} className="text-primary-500" /> See How It Works
            </a>
          </motion.div>

          {/* Social proof bar */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['👩‍💼', '👨‍💻', '👩‍🎨', '👨‍🍳', '👩‍🔬'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-sm border-2 border-white dark:border-gray-950">{e}</div>
                ))}
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">12,000+ stores</span> created
            </span>
            <span className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
              <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">4.9/5</span> rating
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={14} className="text-green-500" /> No credit card required
            </span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400">
          <span className="text-xs font-medium">Scroll to explore</span>
          <ChevronDown size={20} className="animate-bounce" />
        </motion.div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)' }} />
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center text-white">
                <div className="flex justify-center mb-3 opacity-80">{s.icon}</div>
                <div className="text-4xl font-black mb-1">
                  <AnimatedCounter end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-white/70 text-sm font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full px-4 py-2 text-sm font-semibold mb-5 border border-primary-200 dark:border-primary-800">
              <Zap size={14} /> Everything You Need
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-5 leading-tight">
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-purple-600">entrepreneurs</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From store creation to analytics — everything you need to run a successful online business.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp}
                className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700 cursor-pointer">
                <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3 leading-tight">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="py-28 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full px-4 py-2 text-sm font-semibold mb-5 border border-emerald-200 dark:border-emerald-800">
              <Zap size={14} /> Simple 4-Step Process
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-5 leading-tight">
              From idea to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">live store</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary-200 via-purple-300 to-primary-200 dark:from-primary-800 dark:via-purple-700 dark:to-primary-800" />
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative text-center group">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 text-white text-2xl font-black rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl group-hover:scale-105 transition-transform relative z-10">
                  {s.step}
                </div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">{s.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Templates ────────────────────────────────────────────────────────── */}
      <section id="templates" className="py-28 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full px-4 py-2 text-sm font-semibold mb-5 border border-purple-200 dark:border-purple-800">
              <Palette size={14} /> 7 Pro Templates
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-5">
              Start with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600">perfect template</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Professionally designed for every niche. Fully customizable with our builder.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {templates.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                onMouseEnter={() => setHoveredTemplate(i)} onMouseLeave={() => setHoveredTemplate(null)}
                className={`${t.bg} rounded-2xl p-5 text-center cursor-pointer border-2 transition-all duration-300 group ${hoveredTemplate === i ? 'border-primary-400 shadow-xl -translate-y-2' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'}`}>
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{t.emoji}</div>
                <div className={`text-sm font-bold bg-gradient-to-r ${t.color} bg-clip-text text-transparent mb-1`}>{t.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl hover:shadow-xl hover:shadow-primary-500/30 transition-all hover:-translate-y-1">
              <Palette size={18} /> Browse All Templates <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-28 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full px-4 py-2 text-sm font-semibold mb-5 border border-yellow-200 dark:border-yellow-800">
              <Star size={14} /> Real Customer Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
              Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">12,000+</span> sellers
            </h2>
          </motion.div>

          <div className="relative h-64">
            <AnimatePresence mode="wait">
              {testimonials.map((t, i) => i === activeTestimonial && (
                <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                  className="absolute inset-0 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 md:p-10 border border-primary-100 dark:border-gray-700">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed italic mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-purple-500 rounded-xl flex items-center justify-center text-xl">{t.avatar}</div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{t.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeTestimonial ? 'bg-primary-500 w-6' : 'bg-gray-300 dark:bg-gray-700'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-4 py-2 text-sm font-semibold mb-5 border border-green-200 dark:border-green-800">
              <TrendingUp size={14} /> Simple, Transparent Pricing
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-5">
              Start free, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-600">scale as you grow</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">No hidden fees. No surprise charges. Cancel anytime.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className={`relative rounded-3xl p-8 border-2 transition-all hover:-translate-y-1 ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-primary-500 to-purple-600 border-transparent text-white shadow-2xl shadow-primary-500/30'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 shadow-sm'
                }`}>
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                )}
                <div className={`text-sm font-bold mb-3 ${plan.highlight ? 'text-white/70' : 'text-primary-600 dark:text-primary-400'}`}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-5xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.price}</span>
                  <span className={`text-lg ${plan.highlight ? 'text-white/70' : 'text-gray-500'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-8 ${plan.highlight ? 'text-white/70' : 'text-gray-600 dark:text-gray-400'}`}>{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2.5 text-sm font-medium ${plan.highlight ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
                        <Check size={11} className={plan.highlight ? 'text-white' : 'text-primary-600 dark:text-primary-400'} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.link}
                  className={`block text-center py-3.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 ${
                    plan.highlight
                      ? 'bg-white text-primary-700 hover:shadow-xl'
                      : 'bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:shadow-lg hover:shadow-primary-500/30'
                  }`}>
                  {plan.cta} <ArrowRight size={14} className="inline ml-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-28 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="bg-gradient-to-br from-primary-500 via-purple-600 to-indigo-600 rounded-3xl p-12 md:p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)' }} />
            <div className="relative">
              <div className="text-6xl mb-6">🚀</div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
                Ready to launch your store?
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
                Join 12,000+ entrepreneurs who built their dream stores with ShopEZ. Free to start, no credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"
                  className="inline-flex items-center gap-2 bg-white text-primary-700 font-black text-lg px-8 py-4 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1">
                  <Zap size={20} /> Start Building Free
                </Link>
                <a href="#features"
                  className="inline-flex items-center gap-2 bg-white/10 text-white border-2 border-white/30 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-white/20 transition-all">
                  <Play size={18} /> See Features
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer id="about" className="bg-gray-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={18} className="text-white" />
                </div>
                <span className="font-black text-xl">ShopEZ</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">Build professional e-commerce stores without writing code. Powered by AI.</p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-colors"><Github size={16} /></a>
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-green-600 hover:text-white transition-colors"><MessageCircle size={16} /></a>
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-colors"><Instagram size={16} /></a>
              </div>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Templates', 'Pricing', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-5">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">© 2024 ShopEZ. All rights reserved. Built with ❤️ in India.</p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Code2 size={14} /> <span>Made with</span>
              <span className="text-primary-400 font-semibold">React + Flask</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
