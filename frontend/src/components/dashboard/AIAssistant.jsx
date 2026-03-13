import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Sparkles, RotateCcw, Copy, Check, Zap, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import toast from 'react-hot-toast'

const QUICK_PROMPTS = [
  { label: '🏪 Create a store', msg: 'How do I create my first store?' },
  { label: '📦 Add products', msg: 'How to add products to my store?' },
  { label: '🎨 Use builder', msg: 'Builder kaise use karein step by step?' },
  { label: '🚀 Publish store', msg: 'How to publish and go live?' },
  { label: '📊 View analytics', msg: 'Analytics dashboard kaise use karein?' },
  { label: '📱 WhatsApp setup', msg: 'How to set up WhatsApp button on my store?' },
  { label: '🐙 GitHub deploy', msg: 'How to push my store to GitHub?' },
  { label: '💰 Track orders', msg: 'How to manage and track customer orders?' },
]

const WELCOME_MSG = {
  role: 'assistant',
  content: `Namaste! 👋 Main **ShopEZ AI Assistant** hoon — powered by Anthropic Claude.

Main aapki help kar sakta hoon:
• 🏪 Store create karna & customize karna
• 🎨 Drag & Drop Builder use karna
• 📦 Products & categories manage karna
• 📊 Analytics & orders track karna
• 🚀 Store publish & deploy karna
• 💬 WhatsApp + Instagram integration

**English ya Hinglish** — dono mein pooch sakte hain! 😊

Neeche quick prompts bhi hain — woh try karo!`
}

function MessageBubble({ msg, idx }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copyMsg = async () => {
    await navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderContent = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\n/g, '<br/>')
      .replace(/^• /gm, '&bull; ')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-primary-500 to-purple-600 text-white'
          : 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white'
      }`}>
        {isUser ? <User size={16}/> : <Bot size={16}/>}
      </div>
      <div className={`max-w-[80%] relative ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-primary-500 to-purple-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-gray-600'
        }`}>
          <div dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}/>
        </div>
        <button onClick={copyMsg}
          className="opacity-0 group-hover:opacity-100 transition-opacity self-end text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 p-1">
          {copied ? <Check size={12} className="text-emerald-500"/> : <Copy size={12}/>}
        </button>
      </div>
    </motion.div>
  )
}

function ThinkingBubble() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white flex-shrink-0">
        <Bot size={16}/>
      </div>
      <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1.5 items-center">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-2 h-2 bg-primary-400 rounded-full"
              animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}/>
          ))}
          <span className="text-xs text-gray-400 ml-1 font-medium">AI is thinking...</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async (text = input.trim()) => {
    if (!text || loading) return
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setShowQuick(false)

    try {
      const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/ai/chat', { message: text, history })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment. 🔄'
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, messages])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([WELCOME_MSG])
    setShowQuick(true)
    toast.success('Chat cleared')
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Bot size={20} className="text-white"/>
          </div>
          <div>
            <h2 className="font-bold text-white text-base leading-none">ShopEZ AI</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
              <span className="text-white/70 text-xs font-medium">Powered by Claude · Always Online</span>
            </div>
          </div>
        </div>
        <button onClick={clearChat}
          className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          title="Clear chat">
          <RotateCcw size={15}/>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-5 space-y-4 scrollbar-hide">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} idx={i}/>)}
        {loading && <ThinkingBubble/>}
        <div ref={messagesEndRef}/>
      </div>

      {/* Quick prompts */}
      <AnimatePresence>
        {showQuick && messages.length <= 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-5 py-3">
            <p className="text-xs font-semibold text-gray-400 mb-2.5 flex items-center gap-1.5">
              <Zap size={11}/> Quick start
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.msg)}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg font-medium hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything in English ya Hinglish..."
            rows={1}
            className="flex-1 resize-none input-field !py-2.5 max-h-32 text-sm"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 text-white rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-primary-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex-shrink-0">
            <Send size={16}/>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
