import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function CategoriesManager() {
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    api.get('/shops').then(r => {
      setShops(r.data.shops || [])
      if (r.data.shops?.length > 0) setSelectedShop(r.data.shops[0])
    })
  }, [])

  useEffect(() => {
    if (selectedShop) loadCategories()
  }, [selectedShop])

  const loadCategories = async () => {
    const res = await api.get(`/categories/shop/${selectedShop.id}`)
    setCategories(res.data.categories || [])
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '' })
    setShowModal(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, description: cat.description || '' })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form)
        toast.success('Updated')
      } else {
        await api.post('/categories', { ...form, shop_id: selectedShop.id })
        toast.success('Category created!')
      }
      setShowModal(false)
      loadCategories()
    } catch (e) { toast.error('Failed') }
  }

  const deleteCategory = async (id) => {
    if (!confirm('Delete category?')) return
    try {
      await api.delete(`/categories/${id}`)
      setCategories(c => c.filter(cat => cat.id !== id))
      toast.success('Deleted')
    } catch (e) { toast.error('Failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Organize your products</p>
        </div>
        {selectedShop && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Category
          </button>
        )}
      </div>

      {shops.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {shops.map(s => (
            <button key={s.id} onClick={() => setSelectedShop(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedShop?.id === s.id ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {selectedShop ? (
        categories.length === 0 ? (
          <div className="card p-12 text-center">
            <Tag size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No categories yet</p>
            <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Create Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <motion.div key={cat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <Tag size={18} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{cat.name}</p>
                    {cat.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{cat.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Create a store first to manage categories</p>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit' : 'New'} Category</h2>
                <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="label">Category Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" placeholder="Electronics" required />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={2} placeholder="Optional description..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
