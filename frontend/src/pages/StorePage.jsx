import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  ShoppingCart, MessageCircle, Instagram, Search, Star, X, Plus, Minus,
  ChevronRight, Heart, Share2, SortAsc, Filter, ChevronUp, Package
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useDebounce } from '../hooks/useDebounce'

const getImages = (p) => {
  try { return (typeof p.images==='string' ? JSON.parse(p.images||'[]') : p.images||[]) } catch { return [] }
}

export default function StorePage() {
  const { slug } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [quickView, setQuickView] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [sort, setSort] = useState('default')
  const [wishlist, setWishlist] = useState([])
  const [scrolled, setScrolled] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name:'', customer_email:'', customer_phone:'',
    shipping_address:'', city:'', state:'', postal_code:''
  })
  const [placing, setPlacing] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadStore()
    const savedCart = localStorage.getItem(`cart_${slug}`)
    const savedWishlist = localStorage.getItem(`wish_${slug}`)
    if (savedCart) setCart(JSON.parse(savedCart))
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist))
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [slug])

  const loadStore = async () => {
    try {
      const res = await api.get(`/shops/public/${slug}`)
      setStore(res.data.shop)
      setProducts(res.data.products || [])
      setCategories(res.data.categories || [])
      document.title = res.data.shop.name
    } catch { setError('Store not found or unavailable') }
    finally { setLoading(false) }
  }

  const saveCart = (newCart) => { localStorage.setItem(`cart_${slug}`, JSON.stringify(newCart)); setCart(newCart) }
  const toggleWishlist = (id) => {
    const next = wishlist.includes(id) ? wishlist.filter(i=>i!==id) : [...wishlist, id]
    localStorage.setItem(`wish_${slug}`, JSON.stringify(next))
    setWishlist(next)
  }

  const addToCart = useCallback((product, qty=1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      const next = existing
        ? prev.map(i => i.id===product.id ? {...i, qty:i.qty+qty} : i)
        : [...prev, { id:product.id, name:product.name, price:parseFloat(product.price), qty, image:getImages(product)[0]||null }]
      localStorage.setItem(`cart_${slug}`, JSON.stringify(next))
      return next
    })
    toast.success(`${product.name} added!`, { icon:'🛒', duration:1500 })
  }, [slug])

  const updateQty = (id, delta) => {
    const next = cart.map(i => i.id===id ? {...i, qty:i.qty+delta} : i).filter(i=>i.qty>0)
    saveCart(next)
  }

  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty, 0)
  const cartCount = cart.reduce((s,i)=>s+i.qty, 0)

  const filteredProducts = products
    .filter(p => {
      const matchS = !debouncedSearch || p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || (p.description||'').toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchC = !activeCategory || p.category_id===activeCategory
      return matchS && matchC
    })
    .sort((a,b) => {
      if (sort==='price_asc')  return parseFloat(a.price)-parseFloat(b.price)
      if (sort==='price_desc') return parseFloat(b.price)-parseFloat(a.price)
      if (sort==='name')       return a.name.localeCompare(b.name)
      return (b.is_featured||0)-(a.is_featured||0)
    })

  const placeOrder = async (e) => {
    e.preventDefault()
    if (cart.length===0) return toast.error('Cart is empty')
    setPlacing(true)
    try {
      const items = cart.map(i=>({ product_id:i.id, quantity:i.qty }))
      const res = await api.post('/orders', { shop_id:store.id, items, ...checkoutForm })
      toast.success(`Order placed! #${res.data.order_number} 🎉`, { duration:4000 })
      saveCart([])
      setCheckoutOpen(false)
      setCartOpen(false)
    } catch (e) { toast.error(e.response?.data?.error || 'Order failed') }
    finally { setPlacing(false) }
  }

  const tc  = store?.theme_color || '#6366f1'
  const sc  = store?.secondary_color || '#8b5cf6'
  const font = store?.font_family || 'Poppins'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-14 h-14 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor:`${tc}30`, borderTopColor:tc }}/>
        <p className="text-gray-500 font-medium">Loading store...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-6">
        <div className="text-7xl mb-4">🏪</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Store Not Found</h1>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  )

  const discountPct = (p) => p.compare_price ? Math.round((1 - parseFloat(p.price)/parseFloat(p.compare_price))*100) : 0

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily:`'${font}',sans-serif` }}>

      {/* Navbar */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-md' : 'bg-white shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-10 w-10 object-cover rounded-xl"/>
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background:`linear-gradient(135deg,${tc},${sc})` }}>
                {store.name[0]}
              </div>
            )}
            <span className="font-black text-xl text-gray-900">{store.name}</span>
          </div>

          {/* Desktop search */}
          <div className="hidden md:flex relative flex-1 max-w-xs mx-6">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 bg-gray-50"
              style={{ '--tw-ring-color': tc+'40' }}
              placeholder="Search products..."/>
          </div>

          <div className="flex items-center gap-2">
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number}`} target="_blank" rel="noreferrer"
                className="w-9 h-9 bg-green-100 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-200 transition-colors" title="WhatsApp">
                <MessageCircle size={17}/>
              </a>
            )}
            {store.instagram_url && (
              <a href={store.instagram_url} target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ background:'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', color:'white' }} title="Instagram">
                <Instagram size={17}/>
              </a>
            )}
            <button onClick={() => setCartOpen(true)}
              className="relative w-10 h-10 text-white rounded-xl flex items-center justify-center transition-transform hover:scale-105"
              style={{ background:`linear-gradient(135deg,${tc},${sc})` }}>
              <ShoppingCart size={18}/>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-black">
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {store.banner_url ? (
        <div className="w-full h-52 md:h-80 overflow-hidden">
          <img src={store.banner_url} alt="Banner" className="w-full h-full object-cover"/>
        </div>
      ) : (
        <div className="w-full h-44 md:h-64 flex items-center justify-center overflow-hidden relative"
          style={{ background:`linear-gradient(135deg,${tc},${sc})` }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage:'radial-gradient(circle at 30% 50%, white 0%, transparent 50%)' }}/>
          <div className="text-center text-white px-6 relative">
            <h1 className="text-3xl md:text-5xl font-black mb-3">{store.name}</h1>
            {store.description && <p className="text-white/80 text-base md:text-lg max-w-xl mx-auto">{store.description}</p>}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Mobile search */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2"
              placeholder="Search products..."/>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!activeCategory ? 'text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}
              style={!activeCategory ? { background:`linear-gradient(135deg,${tc},${sc})` } : {}}>
              All ({products.length})
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(activeCategory===cat.id ? null : cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory===cat.id ? 'text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}
                style={activeCategory===cat.id ? { background:`linear-gradient(135deg,${tc},${sc})` } : {}}>
                {cat.name}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none text-gray-600 font-medium">
            <option value="default">Sort: Featured</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="name">Name: A → Z</option>
          </select>
        </div>

        {/* Products */}
        <p className="text-sm text-gray-400 mb-4 font-medium">{filteredProducts.length} products</p>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-400 text-lg font-medium">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const imgs = getImages(product)
              const pct  = discountPct(product)
              return (
                <motion.div key={product.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  onClick={() => setQuickView(product)}>
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {imgs[0] ? (
                      <img src={imgs[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart size={32} className="text-gray-300"/>
                      </div>
                    )}
                    {pct > 0 && <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">-{pct}%</div>}
                    {product.is_featured===1 && <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><Star size={9}/> Featured</div>}
                    <button onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
                      className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                      <Heart size={14} className={wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}/>
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 leading-snug">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-black text-base" style={{ color:tc }}>₹{parseFloat(product.price).toFixed(2)}</span>
                      {product.compare_price && <span className="text-xs text-gray-400 line-through">₹{parseFloat(product.compare_price).toFixed(2)}</span>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); addToCart(product) }}
                      className="w-full text-white py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 hover:shadow-md"
                      style={{ background:`linear-gradient(135deg,${tc},${sc})` }}>
                      Add to Cart
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center border-t border-gray-200 bg-white">
        <p className="text-gray-400 text-sm">© {new Date().getFullYear()} <strong className="text-gray-700">{store.name}</strong></p>
        <p className="text-xs text-gray-300 mt-1">Powered by <span style={{ color:tc }} className="font-bold">ShopEZ</span></p>
      </footer>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickView && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setQuickView(null)}>
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
              <div className="grid sm:grid-cols-2 gap-0">
                <div className="aspect-square sm:aspect-auto bg-gray-100 sm:rounded-l-3xl rounded-t-3xl sm:rounded-t-none overflow-hidden">
                  {getImages(quickView)[0]
                    ? <img src={getImages(quickView)[0]} alt={quickView.name} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center"><Package size={48} className="text-gray-300"/></div>}
                </div>
                <div className="p-6">
                  <button onClick={() => setQuickView(null)} className="float-right text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  {quickView.is_featured===1 && <div className="badge badge-yellow inline-flex mb-2"><Star size={10}/>Featured</div>}
                  <h2 className="text-xl font-black text-gray-900 mb-2 leading-tight">{quickView.name}</h2>
                  {quickView.description && <p className="text-gray-500 text-sm leading-relaxed mb-4">{quickView.description}</p>}
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-black" style={{ color:tc }}>₹{parseFloat(quickView.price).toFixed(2)}</span>
                    {quickView.compare_price && <span className="text-gray-400 line-through">₹{parseFloat(quickView.compare_price).toFixed(2)}</span>}
                    {discountPct(quickView) > 0 && <span className="badge badge-red">{discountPct(quickView)}% OFF</span>}
                  </div>
                  <button onClick={() => { addToCart(quickView); setQuickView(null) }}
                    className="w-full text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-lg"
                    style={{ background:`linear-gradient(135deg,${tc},${sc})` }}>
                    <ShoppingCart size={18}/> Add to Cart
                  </button>
                  {store.whatsapp_number && (
                    <a href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(`Hi! I'm interested in: ${quickView.name} (₹${parseFloat(quickView.price).toFixed(2)})`)}`}
                      target="_blank" rel="noreferrer"
                      className="w-full mt-2 bg-green-500 text-white py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                      <MessageCircle size={16}/> Enquire on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 bg-black/40 z-50" onClick={() => setCartOpen(false)}/>
            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }} transition={{ type:'spring', damping:25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 className="font-black text-lg text-gray-900">Cart ({cartCount})</h2>
                <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-hide">
                {cart.length===0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <ShoppingCart size={48} className="mx-auto mb-3 opacity-30"/>
                    <p className="font-medium">Your cart is empty</p>
                    <button onClick={() => setCartOpen(false)} className="mt-4 text-sm font-semibold" style={{ color:tc }}>Continue Shopping →</button>
                  </div>
                ) : cart.map(item => (
                  <motion.div key={item.id} layout className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/>
                      : <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0"><ShoppingCart size={18} className="text-gray-400"/></div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-sm font-black" style={{ color:tc }}>₹{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(item.id,-1)} className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50"><Minus size={11}/></button>
                      <span className="text-sm font-black w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50"><Plus size={11}/></button>
                    </div>
                  </motion.div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="p-5 border-t space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Subtotal</span>
                    <span className="font-black text-xl" style={{ color:tc }}>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <button onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}
                    className="w-full text-white py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-lg"
                    style={{ background:`linear-gradient(135deg,${tc},${sc})` }}>
                    Checkout <ChevronRight size={18}/>
                  </button>
                  {store.whatsapp_number && (
                    <a href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent('Hi! I want to order:\n' + cart.map(i=>`${i.name} ×${i.qty} = ₹${(i.price*i.qty).toFixed(2)}`).join('\n') + `\n\nTotal: ₹${cartTotal.toFixed(2)}`)}`}
                      target="_blank" rel="noreferrer"
                      className="w-full bg-green-500 text-white py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                      <MessageCircle size={16}/> Order via WhatsApp
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
              className="bg-white rounded-3xl w-full max-w-lg p-7 my-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900">Complete Order</h2>
                <button onClick={() => setCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22}/></button>
              </div>
              <form onSubmit={placeOrder} className="space-y-3.5">
                {[
                  { label:'Full Name *',     key:'customer_name',     ph:'John Doe',           req:true },
                  { label:'Email *',         key:'customer_email',     ph:'you@example.com',    req:true, type:'email' },
                  { label:'Phone',           key:'customer_phone',     ph:'+91 9876543210' },
                  { label:'Address *',       key:'shipping_address',  ph:'Street address',      req:true },
                  { label:'City',            key:'city',               ph:'Mumbai' },
                  { label:'State',           key:'state',              ph:'Maharashtra' },
                  { label:'Postal Code',     key:'postal_code',        ph:'400001' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">{f.label}</label>
                    <input type={f.type||'text'} required={f.req} placeholder={f.ph}
                      value={checkoutForm[f.key]} onChange={e => setCheckoutForm({...checkoutForm,[f.key]:e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition-all"
                      style={{ '--tw-ring-color': tc+'40' }}/>
                  </div>
                ))}
                <div className="bg-gray-50 rounded-2xl p-4 mt-2">
                  {cart.map((i,idx) => (
                    <div key={idx} className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">{i.name} ×{i.qty}</span>
                      <span className="font-semibold text-gray-900">₹{(i.price*i.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-black">
                    <span>Total</span><span style={{ color:tc }}>₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button type="submit" disabled={placing}
                  className="w-full text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 mt-2"
                  style={{ background:`linear-gradient(135deg,${tc},${sc})` }}>
                  {placing
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Placing Order...</>
                    : `Place Order • ₹${cartTotal.toFixed(2)}`}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FABs */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30">
        {store?.whatsapp_number && (
          <motion.a initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.5 }}
            href={`https://wa.me/${store.whatsapp_number}`} target="_blank" rel="noreferrer"
            className="w-13 h-13 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-green-600 transition-all hover:scale-110 w-12 h-12">
            <MessageCircle size={22}/>
          </motion.a>
        )}
        {store?.instagram_url && (
          <motion.a initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.6 }}
            href={store.instagram_url} target="_blank" rel="noreferrer"
            className="w-12 h-12 text-white rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110"
            style={{ background:'linear-gradient(135deg,#f09433,#dc2743,#bc1888)' }}>
            <Instagram size={22}/>
          </motion.a>
        )}
      </div>
    </div>
  )
}
