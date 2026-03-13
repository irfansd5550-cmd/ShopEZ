import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Store, ExternalLink, Trash2, Globe, Eye, EyeOff,
  Download, Rocket, MessageCircle, Instagram, X, Palette,
  Github, Loader2, CheckCircle, AlertCircle
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import TemplateSelector from '../builder/TemplateSelector'

const CATEGORIES = [
  'Fashion', 'Electronics', 'Furniture', 'Food & Grocery', 'Books',
  'Sports', 'Beauty & Health', 'Toys', 'Jewelry', 'Home Decor', 'Other'
]

export default function ShopsManager() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [selectedShop, setSelectedShop] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', category: '', whatsapp_number: '', instagram_url: '' })
  const [saving, setSaving] = useState(false)
  const [githubModal, setGithubModal] = useState(null)
  const [githubForm, setGithubForm] = useState({ token: '', repoName: '' })
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubResult, setGithubResult] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { loadShops() }, [])

  const loadShops = async () => {
    try {
      const res = await api.get('/shops')
      setShops(res.data.shops || [])
    } catch (e) { toast.error('Failed to load stores') }
    finally { setLoading(false) }
  }

  const createShop = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Store name is required')
    setSaving(true)
    try {
      const res = await api.post('/shops', form)
      setShops(s => [res.data.shop, ...s])
      setShowCreate(false)
      setForm({ name: '', description: '', category: '', whatsapp_number: '', instagram_url: '' })
      toast.success('Store created! 🎉')
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const togglePublish = async (shop) => {
    try {
      if (shop.is_published) {
        await api.post(`/shops/${shop.id}/unpublish`)
        toast.success('Store unpublished')
      } else {
        await api.post(`/shops/${shop.id}/publish`)
        toast.success('Store is live! 🚀')
      }
      setShops(s => s.map(sh => sh.id === shop.id ? { ...sh, is_published: !sh.is_published } : sh))
    } catch (e) { toast.error('Failed') }
  }

  const deleteShop = async (shopId) => {
    if (!confirm('Delete this store? This cannot be undone.')) return
    try {
      await api.delete(`/shops/${shopId}`)
      setShops(s => s.filter(sh => sh.id !== shopId))
      toast.success('Store deleted')
    } catch (e) { toast.error('Failed') }
  }

  const downloadStore = async (shop) => {
    const toastId = toast.loading('Generating store files...')
    try {
      const res = await api.get(`/builder/download/${shop.id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${shop.slug}-store.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Store downloaded!', { id: toastId })
    } catch (e) {
      toast.error('Download failed', { id: toastId })
    }
  }

  const openBuilder = (shop) => {
    setSelectedShop(shop)
    setShowTemplate(true)
  }

  const openGithub = (shop) => {
    setGithubModal(shop)
    setGithubResult(null)
    setGithubForm({ token: '', repoName: shop.slug || shop.name.toLowerCase().replace(/\s+/g, '-') })
  }

  const publishToGithub = async (e) => {
    e.preventDefault()
    if (!githubForm.token) { toast.error('GitHub token is required'); return }
    if (!githubForm.repoName) { toast.error('Repository name is required'); return }

    setGithubLoading(true)
    setGithubResult(null)

    try {
      const res = await api.post(`/builder/github/${githubModal.id}`, {
        token: githubForm.token,
        repo_name: githubForm.repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      })
      setGithubResult({ success: true, url: res.data.repo_url, message: res.data.message })
      toast.success('Published to GitHub!')
    } catch (err) {
      const msg = err.response?.data?.error || 'GitHub publish failed'
      setGithubResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setGithubLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Stores</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your online stores</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Store
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl"></div>)}
        </div>
      ) : shops.length === 0 ? (
        <div className="card p-16 text-center">
          <Store size={56} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No stores yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first online store to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={18} /> Create Your First Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {shops.map(shop => (
            <motion.div key={shop.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: (shop.theme_color || '#6366f1') + '22' }}>
                    {shop.logo_url
                      ? <img src={shop.logo_url} alt="" className="w-full h-full object-cover" />
                      : <Store size={22} style={{ color: shop.theme_color || '#6366f1' }} />
                    }
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{shop.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{shop.category || 'No category'} • /{shop.slug}</p>
                  </div>
                </div>
                <span className={`badge ${shop.is_suspended ? 'badge-red' : shop.is_published ? 'badge-green' : 'badge-gray'}`}>
                  {shop.is_suspended ? 'Suspended' : shop.is_published ? '● Live' : '○ Draft'}
                </span>
              </div>

              {shop.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{shop.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {shop.whatsapp_number && (
                  <a href={`https://wa.me/${shop.whatsapp_number}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-lg hover:scale-105 transition-transform">
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                )}
                {shop.instagram_url && (
                  <a href={shop.instagram_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 px-2.5 py-1 rounded-lg hover:scale-105 transition-transform">
                    <Instagram size={12} /> Instagram
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => openBuilder(shop)} className="flex items-center gap-1.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-3 py-2 rounded-xl hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors font-medium">
                  <Palette size={14} /> Builder
                </button>

                <button onClick={() => togglePublish(shop)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-colors font-medium ${shop.is_published
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'}`}>
                  {shop.is_published ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
                </button>

                {shop.is_published && (
                  <a href={`/store/${shop.slug}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-xl hover:bg-blue-200 transition-colors font-medium">
                    <Globe size={14} /> Visit
                  </a>
                )}

                <button onClick={() => downloadStore(shop)}
                  className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                  <Download size={14} /> Download
                </button>

                {/* GitHub publish */}
                <button onClick={() => openGithub(shop)}
                  className="flex items-center gap-1.5 text-xs bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium">
                  <Github size={14} /> GitHub
                </button>

                {/* Render deploy */}
                <a href="https://render.com/deploy" target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-2 rounded-xl hover:bg-purple-200 transition-colors font-medium">
                  <Rocket size={14} /> Deploy
                </a>

                <button onClick={() => deleteShop(shop.id)}
                  className="flex items-center gap-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-xl hover:bg-red-200 transition-colors font-medium ml-auto">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Store</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={createShop} className="space-y-4">
                <div>
                  <label className="label">Store Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" placeholder="My Awesome Store" required />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={3} placeholder="What do you sell?" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field">
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">WhatsApp Number</label>
                  <input value={form.whatsapp_number} onChange={e => setForm({...form, whatsapp_number: e.target.value})} className="input-field" placeholder="+91 9876543210" />
                </div>
                <div>
                  <label className="label">Instagram URL</label>
                  <input value={form.instagram_url} onChange={e => setForm({...form, instagram_url: e.target.value})} className="input-field" placeholder="https://instagram.com/yourstore" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Creating...' : 'Create Store'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GitHub publish modal */}
      <AnimatePresence>
        {githubModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <Github size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Publish to GitHub</h2>
                    <p className="text-xs text-gray-500">{githubModal.name}</p>
                  </div>
                </div>
                <button onClick={() => { setGithubModal(null); setGithubResult(null) }}><X size={20} className="text-gray-400" /></button>
              </div>

              {githubResult ? (
                <div className={`rounded-xl p-4 mb-4 ${githubResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                  <div className="flex items-start gap-3">
                    {githubResult.success
                      ? <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                      : <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    }
                    <div>
                      <p className={`font-semibold text-sm ${githubResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                        {githubResult.success ? 'Successfully published!' : 'Publish failed'}
                      </p>
                      <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">{githubResult.message}</p>
                      {githubResult.url && (
                        <a href={githubResult.url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                          <Github size={12} /> View Repository <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <form onSubmit={publishToGithub} className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
                  <strong>How to get a GitHub token:</strong><br />
                  1. Go to GitHub → Settings → Developer settings<br />
                  2. Personal access tokens → Tokens (classic)<br />
                  3. Generate new token with <strong>repo</strong> scope
                </div>

                <div>
                  <label className="label">GitHub Personal Access Token *</label>
                  <input
                    type="password"
                    value={githubForm.token}
                    onChange={e => setGithubForm({...githubForm, token: e.target.value})}
                    className="input-field font-mono text-sm"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                </div>

                <div>
                  <label className="label">Repository Name *</label>
                  <input
                    value={githubForm.repoName}
                    onChange={e => setGithubForm({...githubForm, repoName: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                    className="input-field"
                    placeholder="my-store"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Only lowercase letters, numbers, and hyphens</p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setGithubModal(null); setGithubResult(null) }} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={githubLoading} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-700 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors disabled:opacity-60">
                    {githubLoading ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : <><Github size={16} /> Publish to GitHub</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Template selector */}
      <AnimatePresence>
        {showTemplate && selectedShop && (
          <TemplateSelector
            shop={selectedShop}
            onSelect={(template) => {
              setShowTemplate(false)
              navigate(`/builder/${selectedShop.id}?template=${template}`)
            }}
            onClose={() => setShowTemplate(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
