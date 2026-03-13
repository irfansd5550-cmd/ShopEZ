import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useState } from 'react'

const TEMPLATES = [
  { id: 'fashion', name: 'Fashion Store', emoji: '👗', desc: 'Elegant design for clothing & accessories', color: 'from-pink-400 to-rose-500', tags: ['Minimal', 'Elegant'] },
  { id: 'electronics', name: 'Electronics', emoji: '💻', desc: 'Tech-focused layout with specs display', color: 'from-blue-400 to-cyan-500', tags: ['Modern', 'Clean'] },
  { id: 'furniture', name: 'Furniture', emoji: '🛋️', desc: 'Showcase home decor with large imagery', color: 'from-amber-400 to-orange-500', tags: ['Bold', 'Warm'] },
  { id: 'luxury', name: 'Luxury', emoji: '💎', desc: 'Premium feel for high-end products', color: 'from-violet-500 to-purple-600', tags: ['Premium', 'Dark'] },
  { id: 'minimal', name: 'Minimal', emoji: '⬜', desc: 'Clean, distraction-free product focus', color: 'from-gray-500 to-gray-700', tags: ['Minimal', 'Simple'] },
  { id: 'modern', name: 'Modern SaaS', emoji: '🚀', desc: 'Gradient-heavy modern digital store', color: 'from-indigo-500 to-blue-600', tags: ['Vibrant', 'Bold'] },
  { id: 'creative', name: 'Creative Studio', emoji: '🎨', desc: 'Artistic layout for creative products', color: 'from-teal-400 to-emerald-500', tags: ['Artistic', 'Fun'] }
]

export default function TemplateSelector({ shop, onSelect, onClose }) {
  const [selected, setSelected] = useState(shop.template_id || 'minimal')

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose a Template</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Select a starting point for "{shop.name}"</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map(t => (
              <motion.button
                key={t.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(t.id)}
                className={`text-left rounded-2xl overflow-hidden border-2 transition-all ${selected === t.id ? 'border-primary-500 shadow-xl shadow-primary-500/20' : 'border-transparent'}`}
              >
                <div className={`bg-gradient-to-br ${t.color} p-8 flex items-center justify-center relative`}>
                  <span className="text-5xl">{t.emoji}</span>
                  {selected === t.id && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full flex items-center justify-center">
                      <Check size={14} className="text-primary-600" />
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white dark:bg-gray-800">
                  <h3 className="font-bold text-gray-900 dark:text-white">{t.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{t.desc}</p>
                  <div className="flex gap-1.5 mt-2">
                    {t.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSelect(selected)} className="btn-primary flex items-center gap-2">
            Open Builder with {TEMPLATES.find(t => t.id === selected)?.name}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
