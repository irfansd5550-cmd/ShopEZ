import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Save, Eye, ArrowLeft, Globe, Download } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { getTemplateContent } from '../components/builder/templates'

export default function BuilderPage() {
  const { shopId } = useParams()
  const [searchParams] = useSearchParams()
  const template = searchParams.get('template') || 'minimal'
  const navigate = useNavigate()
  const editorRef = useRef(null)
  const [editor, setEditor] = useState(null)
  const [shop, setShop] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadShopAndBuilder()
  }, [shopId])

  useEffect(() => {
    if (!loading && shop) {
      initBuilder()
    }
    return () => {
      if (editor) editor.destroy()
    }
  }, [loading, shop])

  const loadShopAndBuilder = async () => {
    try {
      const [shopRes, builderRes] = await Promise.all([
        api.get(`/shops/${shopId}`),
        api.get(`/builder/load/${shopId}`)
      ])
      setShop(shopRes.data.shop)

      const savedHtml = builderRes.data.html
      const savedCss = builderRes.data.css

      if (savedHtml) {
        window.__builderSavedHtml = savedHtml
        window.__builderSavedCss = savedCss
      } else {
        const tmpl = getTemplateContent(template, shopRes.data.shop)
        window.__builderSavedHtml = tmpl.html
        window.__builderSavedCss = tmpl.css
      }
    } catch (e) {
      toast.error('Failed to load builder')
      navigate('/dashboard/stores')
    } finally {
      setLoading(false)
    }
  }

  const initBuilder = async () => {
    const grapesjs = (await import('grapesjs')).default
    const gjsBlocksBasic = (await import('grapesjs-blocks-basic')).default

    if (editorRef.current && !editor) {
      const ed = grapesjs.init({
        container: '#gjs',
        height: 'calc(100vh - 64px)',
        width: 'auto',
        plugins: [gjsBlocksBasic],
        pluginsOpts: {
          [gjsBlocksBasic]: { flexGrid: true }
        },
        storageManager: { type: 'none' },
        canvas: {
          styles: [
            'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
          ]
        },
        panels: {
          defaults: [
            {
              id: 'basic-actions',
              el: '.panel__top',
              buttons: [
                { id: 'visibility', active: true, className: 'btn-toggle-borders', label: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>', command: 'sw-visibility' },
                { id: 'undo', className: 'btn-undo', label: '↩', command: 'core:undo', attributes: { title: 'Undo' } },
                { id: 'redo', className: 'btn-redo', label: '↪', command: 'core:redo', attributes: { title: 'Redo' } }
              ]
            }
          ]
        },
        styleManager: {
          sectors: [
            { name: 'General', open: false, buildProps: ['float', 'display', 'position', 'top', 'right', 'left', 'bottom'] },
            { name: 'Dimension', open: false, buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'] },
            { name: 'Typography', open: false, buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'font-style', 'vertical-align', 'text-shadow'] },
            { name: 'Decorations', open: false, buildProps: ['opacity', 'border-radius', 'border', 'box-shadow', 'background', 'background-color', 'background-image', 'background-repeat', 'background-position', 'background-size'] },
            { name: 'Extra', open: false, buildProps: ['transition', 'perspective', 'transform'] }
          ]
        }
      })

      // Load saved content
      if (window.__builderSavedHtml) {
        ed.setComponents(window.__builderSavedHtml)
        ed.setStyle(window.__builderSavedCss || '')
      }

      setEditor(ed)

      // Save shortcut
      ed.on('keymap:emit', ({ key }) => {
        if (key === 'ctrl+s' || key === 'meta+s') handleSave(ed)
      })
    }
  }

  const handleSave = async (ed = editor) => {
    if (!ed) return
    setSaving(true)
    try {
      const html = ed.getHtml()
      const css = ed.getCss()
      await api.post(`/builder/save/${shopId}`, { html, css })
      toast.success('Saved!')
    } catch (e) {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    await handleSave()
    try {
      await api.post(`/shops/${shopId}/publish`)
      toast.success('Store published! 🚀')
    } catch (e) {
      toast.error('Publish failed')
    }
  }

  const handleDownload = async () => {
    try {
      const res = await api.get(`/builder/download/${shopId}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `store.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Downloaded!')
    } catch (e) {
      toast.error('Download failed')
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading Builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Builder toolbar */}
      <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/stores" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="w-px h-5 bg-gray-600"></div>
          <h2 className="text-white font-semibold text-sm">{shop?.name || 'Builder'}</h2>
          <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full capitalize">{template}</span>
        </div>

        <div className="panel__top"></div>

        <div className="flex items-center gap-2">
          <button onClick={() => handleSave()} disabled={saving} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg transition-colors">
            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg transition-colors">
            <Download size={14} /> Export
          </button>
          <button onClick={handlePublish} className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium">
            <Globe size={14} /> Publish
          </button>
        </div>
      </div>

      {/* GrapesJS container */}
      <div id="gjs" ref={editorRef} className="flex-1"></div>
    </div>
  )
}
