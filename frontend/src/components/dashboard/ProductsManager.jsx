import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Search, X, Package, Star, ImagePlus, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ProductsManager() {
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [search, setSearch] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    name: '', description: '', price: '', compare_price: '',
    sku: '', stock_quantity: 0, category_id: '', images: [], is_featured: false
  })

  useEffect(() => {
    api.get('/shops').then(r => {
      setShops(r.data.shops || [])
      if (r.data.shops?.length > 0) setSelectedShop(r.data.shops[0])
    })
  }, [])

  useEffect(() => {
    if (selectedShop) {
      loadProducts()
      api.get(`/categories/shop/${selectedShop.id}`).then(r => setCategories(r.data.categories || []))
    }
  }, [selectedShop, search])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/products/shop/${selectedShop.id}`, { params: { search } })
      setProducts(res.data.products || [])
    } catch (e) {}
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditingProduct(null)
    setForm({ name: '', description: '', price: '', compare_price: '', sku: '', stock_quantity: 0, category_id: '', images: [], is_featured: false })
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      compare_price: product.compare_price || '',
      sku: product.sku || '',
      stock_quantity: product.stock_quantity || 0,
      category_id: product.category_id || '',
      images: typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images || [],
      is_featured: product.is_featured === 1
    })
    setShowModal(true)
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    if (form.images.length >= 5) { toast.error('Max 5 images per product'); return }
    setUploadingImage(true)
    try {
      const uploadedUrls = []
      const remaining = 5 - form.images.length
      for (const file of files.slice(0, remaining)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await api.post('/upload/image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploadedUrls.push(res.data.url)
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }))
      toast.success(`${uploadedUrls.length} image(s) uploaded!`)
    } catch {
      toast.error('Upload failed. Ensure file is an image under 16MB.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (idx) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) return toast.error('Name and price required')
    try {
      const data = { ...form, shop_id: selectedShop.id, price: parseFloat(form.price) }
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data)
        toast.success('Product updated')
      } else {
        await api.post('/products', data)
        toast.success('Product created!')
      }
      setShowModal(false)
      loadProducts()
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(p => p.filter(pr => pr.id !== id))
      toast.success('Deleted')
    } catch (e) { toast.error('Failed') }
  }

  const getFirstImage = (product) => {
    try {
      const imgs = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images || []
      return imgs[0] || null
    } catch { return null }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your store products</p>
        </div>
        {selectedShop && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      {shops.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {shops.map(s => (
            <button key={s.id} onClick={() => setSelectedShop(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedShop?.id === s.id ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-500'}`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {selectedShop ? (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search products..." />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-64 rounded-2xl"></div>)}
            </div>
          ) : products.length === 0 ? (
            <div className="card p-16 text-center">
              <Package size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">{search ? 'No products found' : 'No products yet'}</p>
              <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
                <Plus size={16} /> Add First Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden group">
                  <div className="relative h-44 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {getFirstImage(product) ? (
                      <img src={getFirstImage(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                        <Package size={36} />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                    {product.is_featured === 1 && (
                      <div className="absolute top-2 left-2">
                        <span className="badge badge-yellow flex items-center gap-1"><Star size={10} /> Featured</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(product)} className="w-8 h-8 bg-white text-gray-700 rounded-lg flex items-center justify-center shadow hover:bg-gray-50">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => deleteProduct(product.id)} className="w-8 h-8 bg-white text-red-500 rounded-lg flex items-center justify-center shadow hover:bg-red-50">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{product.name}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-bold text-primary-600 dark:text-primary-400">₹{parseFloat(product.price).toFixed(2)}</span>
                      {product.compare_price && <span className="text-xs text-gray-400 line-through">₹{parseFloat(product.compare_price).toFixed(2)}</span>}
                    </div>
                    {product.category_name && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{product.category_name}</span>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">Stock: {product.stock_quantity}</span>
                      <span className={`badge ${product.is_active ? 'badge-green' : 'badge-red'}`}>{product.is_active ? 'Active' : 'Hidden'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Create a store first to manage products</p>
        </div>
      )}

      {/* Product modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card w-full max-w-lg p-6 my-4"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="label">Product Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" placeholder="e.g. Classic White T-Shirt" required />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={3} placeholder="Describe your product..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Price (₹) *</label>
                    <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="input-field" placeholder="999.00" required />
                  </div>
                  <div>
                    <label className="label">Compare Price</label>
                    <input type="number" step="0.01" min="0" value={form.compare_price} onChange={e => setForm({...form, compare_price: e.target.value})} className="input-field" placeholder="1499.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">SKU</label>
                    <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="input-field" placeholder="SKU-001" />
                  </div>
                  <div>
                    <label className="label">Stock Qty</label>
                    <input type="number" min="0" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: parseInt(e.target.value) || 0})} className="input-field" placeholder="100" />
                  </div>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="input-field">
                    <option value="">No category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="label">Product Images <span className="text-gray-400 font-normal">(up to 5 images)</span></label>

                  <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    form.images.length >= 5
                      ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                      : uploadingImage
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                  }`}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage || form.images.length >= 5}
                    />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2 text-primary-600 dark:text-primary-400">
                        <Loader2 size={26} className="animate-spin" />
                        <span className="text-sm font-medium">Uploading images...</span>
                      </div>
                    ) : form.images.length >= 5 ? (
                      <div className="flex flex-col items-center gap-1 text-gray-400">
                        <ImagePlus size={24} />
                        <span className="text-xs">Maximum 5 images reached</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                        <ImagePlus size={26} />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload images</span>
                        <span className="text-xs">PNG, JPG, WEBP, GIF — max 16 MB each</span>
                      </div>
                    )}
                  </label>

                  {form.images.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {form.images.map((url, idx) => (
                        <div key={idx} className="relative group w-[72px] h-[72px] rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <img src={url} alt={`product-img-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} className="text-white" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-0.5 left-0.5 bg-primary-600 text-white text-[9px] px-1 py-0.5 rounded font-bold leading-none">MAIN</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={form.is_featured}
                    onChange={e => setForm({...form, is_featured: e.target.checked})}
                    className="w-4 h-4 accent-primary-600"
                  />
                  <label htmlFor="featured" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    ⭐ Feature this product on homepage
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={uploadingImage} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {uploadingImage ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
