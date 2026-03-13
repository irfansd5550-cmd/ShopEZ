// Format currency
export const formatCurrency = (amount, currency = '₹') =>
  `${currency}${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Format date
export const formatDate = (dateStr, opts = {}) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', ...opts
  })

// Format relative time
export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return formatDate(dateStr)
}

// Truncate text
export const truncate = (str, n = 80) =>
  str && str.length > n ? str.slice(0, n) + '...' : str

// Get first image from JSON array
export const getFirstImage = (images) => {
  try {
    const arr = typeof images === 'string' ? JSON.parse(images || '[]') : images || []
    return arr[0] || null
  } catch { return null }
}

// WhatsApp link builder
export const buildWhatsAppLink = (phone, message = '') =>
  `https://wa.me/${phone.replace(/\D/g, '')}${message ? `?text=${encodeURIComponent(message)}` : ''}`

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Status badge color map
export const statusColor = {
  pending:    'badge-yellow',
  processing: 'badge-blue',
  shipped:    'badge-purple',
  delivered:  'badge-green',
  cancelled:  'badge-red',
  active:     'badge-green',
  draft:      'badge-gray',
  live:       'badge-green',
  suspended:  'badge-red',
}

// Validate URL
export const isValidUrl = (str) => {
  try { new URL(str); return true } catch { return false }
}
