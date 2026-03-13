import { useState, useEffect, useRef } from 'react'
import { Save, Upload, Palette, Type, Store, Globe, MessageCircle, Instagram, Trash2, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import toast from 'react-hot-toast'

const FONTS = ['Poppins', 'Neuton', 'Playfair Display', 'Inter', 'Roboto', 'Lato', 'Montserrat', 'Open Sans']
const LAYOUTS = ['modern', 'minimal', 'classic', 'bold', 'elegant']
const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b',
  '#10b981','#06b6d4','#3b82f6','#1d4ed8','#111827',
]

export default function StoreSettings() {
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [saved, setSaved] = useState(false)
  const logoRef = useRef(null)
  const bannerRef = useRef(null)

  useEffect(() => {
    api.get('/shops').then(r => {
      const s = r.data.shops || []
      setShops(s)
      if (s.length > 0) { setSelectedShop(s[0]); populateForm(s[0]) }
    })
  }, [])

  const populateForm = (shop) => {
    setForm({
      name: shop.name || '',
      description: shop.description || '',
      category: shop.category || '',
      whatsapp_number: shop.whatsapp_number || '',
      instagram_url: shop.instagram_url || '',
      theme_color: shop.theme_color || '#6366f1',
      secondary_color: shop.secondary_color || '#8b5cf6',
      font_family: shop.font_family || 'Poppins',
      layout_style: shop.layout_style || 'modern',
      logo_url: shop.logo_url || '',
      banner_url: shop.banner_url || '',
    })
  }

  const handleShopChange = (shop) => {
    setSelectedShop(shop)
    populateForm(shop)
  }

  const uploadImage = async (file, field) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data.url
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const url = await uploadImage(file, 'logo')
      setForm(f => ({ ...f, logo_url: url }))
      toast.success('Logo uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setUploadingLogo(false) }
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    try {
      const url = await uploadImage(file, 'banner')
      setForm(f => ({ ...f, banner_url: url }))
      toast.success('Banner uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setUploadingBanner(false) }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/shops/${selectedShop.id}`, form)
      setSaved(true)
      toast.success('Settings saved!')
      setTimeout(() => setSaved(false), 2500)
      // update shop in list
      setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, ...form } : s))
      setSelectedShop(prev => ({ ...prev, ...form }))
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  if (shops.length === 0) return (
    <div className="card p-12 text-center">
      <Store size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3"/>
      <p className="text-gray-500 dark:text-gray-400">No stores yet. Create a store first.</p>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Customize your store appearance</p>
        </div>
        {shops.length > 1 && (
          <select value={selectedShop?.id} onChange={e => handleShopChange(shops.find(s=>s.id===parseInt(e.target.value)))}
            className="input-field !w-auto text-sm">
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <Store size={15}/> Basic Info
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Store Name *</label>
              <input value={form.name || ''} onChange={e => f('name', e.target.value)} className="input-field" required placeholder="My Awesome Store"/>
            </div>
            <div>
              <label className="label">Category</label>
              <select value={form.category || ''} onChange={e => f('category', e.target.value)} className="input-field">
                <option value="">Select category</option>
                {['Fashion','Electronics','Furniture','Food','Beauty','Handicraft','Books','Sports','Other'].map(c => (
                  <option key={c} value={c.toLowerCase()}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description || ''} onChange={e => f('description', e.target.value)} className="input-field" rows={3} placeholder="Tell customers about your store..."/>
          </div>
        </div>

        {/* Social links */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Globe size={15}/> Social & Contact
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-2">
                <MessageCircle size={14} className="text-green-500"/> WhatsApp Number
              </label>
              <input value={form.whatsapp_number || ''} onChange={e => f('whatsapp_number', e.target.value)}
                className="input-field" placeholder="919876543210 (with country code)"/>
              {form.whatsapp_number && (
                <p className="text-xs text-gray-400 mt-1">
                  Link: <a href={`https://wa.me/${form.whatsapp_number}`} target="_blank" rel="noreferrer" className="text-green-500 hover:underline">wa.me/{form.whatsapp_number}</a>
                </p>
              )}
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <Instagram size={14} className="text-pink-500"/> Instagram URL
              </label>
              <input value={form.instagram_url || ''} onChange={e => f('instagram_url', e.target.value)}
                className="input-field" placeholder="https://instagram.com/yourstore"/>
            </div>
          </div>
        </div>

        {/* Theme colors */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Palette size={15}/> Theme Colors
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="label">Primary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.theme_color || '#6366f1'} onChange={e => f('theme_color', e.target.value)}
                  className="w-12 h-10 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer"/>
                <input value={form.theme_color || ''} onChange={e => f('theme_color', e.target.value)}
                  className="input-field flex-1 font-mono text-sm" placeholder="#6366f1" maxLength={7}/>
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => f('theme_color', c)}
                    title={c}
                    className={`w-6 h-6 rounded-lg border-2 transition-transform hover:scale-110 ${form.theme_color===c ? 'border-gray-500 scale-110' : 'border-transparent'}`}
                    style={{ background: c }}/>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.secondary_color || '#8b5cf6'} onChange={e => f('secondary_color', e.target.value)}
                  className="w-12 h-10 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer"/>
                <input value={form.secondary_color || ''} onChange={e => f('secondary_color', e.target.value)}
                  className="input-field flex-1 font-mono text-sm" placeholder="#8b5cf6" maxLength={7}/>
              </div>
              {form.theme_color && form.secondary_color && (
                <div className="mt-2 h-6 rounded-lg" style={{ background: `linear-gradient(135deg, ${form.theme_color}, ${form.secondary_color})` }}/>
              )}
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Type size={15}/> Typography & Layout
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Font Family</label>
              <select value={form.font_family || 'Poppins'} onChange={e => f('font_family', e.target.value)} className="input-field">
                {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
              </select>
              <p className="text-sm mt-2 text-gray-500" style={{ fontFamily: form.font_family }}>
                Preview: The quick brown fox jumps over the lazy dog.
              </p>
            </div>
            <div>
              <label className="label">Layout Style</label>
              <select value={form.layout_style || 'modern'} onChange={e => f('layout_style', e.target.value)} className="input-field">
                {LAYOUTS.map(l => <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Upload size={15}/> Logo & Banner
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="label">Store Logo</label>
              <div className="relative">
                {form.logo_url ? (
                  <div className="relative group">
                    <img src={form.logo_url} alt="Logo" className="w-24 h-24 object-cover rounded-2xl border-2 border-gray-200 dark:border-gray-600"/>
                    <button type="button" onClick={() => f('logo_url', '')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={10}/>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => logoRef.current?.click()}
                    className="upload-zone h-24 w-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                    {uploadingLogo
                      ? <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
                      : <Upload size={20} className="text-gray-400"/>}
                  </button>
                )}
                <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden"/>
              </div>
              {!form.logo_url && <p className="text-xs text-gray-400 mt-2">Recommended: 200×200px</p>}
            </div>

            {/* Banner */}
            <div>
              <label className="label">Store Banner</label>
              {form.banner_url ? (
                <div className="relative group">
                  <img src={form.banner_url} alt="Banner" className="w-full h-24 object-cover rounded-2xl border-2 border-gray-200 dark:border-gray-600"/>
                  <button type="button" onClick={() => f('banner_url', '')}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={10}/>
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => bannerRef.current?.click()}
                  className="upload-zone w-full h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                  {uploadingBanner
                    ? <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
                    : <div className="text-center"><Upload size={18} className="text-gray-400 mx-auto mb-1"/><p className="text-xs text-gray-400">Upload banner</p></div>}
                </button>
              )}
              <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden"/>
              {!form.banner_url && <p className="text-xs text-gray-400 mt-2">Recommended: 1200×300px</p>}
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => selectedShop && populateForm(selectedShop)} className="btn-secondary">
            Reset Changes
          </button>
          <button type="submit" disabled={saving}
            className={`btn-primary gap-2 min-w-[140px] ${saved ? '!bg-emerald-500' : ''}`}>
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
            ) : saved ? (
              <><Check size={16}/> Saved!</>
            ) : (
              <><Save size={16}/> Save Settings</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
