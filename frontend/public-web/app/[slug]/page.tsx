'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getMenu, createOrder, MenuCategory, MenuItem, CreateOrderPayload } from '@/lib/api'

interface CartItem {
  item: MenuItem
  quantity: number
}

export default function RestaurantePage() {
  const params = useParams()
  const slug = params.slug as string

  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [tenantName, setTenantName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeCategory, setActiveCategory] = useState('')
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    table_number: '',
    notes: '',
  })

  useEffect(() => {
    getMenu(slug)
      .then((data) => {
        setTenantName(data.tenant_name)
        setCategories(data.categories)
        document.documentElement.style.setProperty('--accent', data.primary_color)
        if (data.categories.length > 0) setActiveCategory(data.categories[0].id)
      })
      .catch(() => setError('Restaurante no encontrado'))
      .finally(() => setLoading(false))
  }, [slug])

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id)
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === itemId)
      if (existing && existing.quantity > 1) return prev.map(c => c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
      return prev.filter(c => c.item.id !== itemId)
    })
  }

  const cartTotal = cart.reduce((sum, c) => sum + parseFloat(c.item.price) * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  const handleOrder = async () => {
    setSubmitting(true)
    try {
      const payload: CreateOrderPayload = {
        ...form,
        payment_method: 'cash',
        items: cart.map(c => ({ menu_item_id: c.item.id, quantity: c.quantity })),
      }
      await createOrder(slug, payload)
      setOrderSuccess(true)
      setCart([])
      setShowForm(false)
      setShowCart(false)
    } catch {
      alert('Error al enviar el pedido. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#444] text-sm">Cargando menú...</p>
      </div>
    </div>
  )

  // ── Error ────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-[#555]">{error}</p>
    </div>
  )

  // ── Éxito ────────────────────────────────────────────────────
  if (orderSuccess) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-7xl mb-6 animate-pulse">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">¡Pedido enviado!</h2>
        <p className="text-[#666] mb-8 text-sm">En breve el restaurante lo confirma.</p>
        <button
          onClick={() => setOrderSuccess(false)}
          className="bg-[var(--accent)] text-white px-8 py-3 rounded-full font-semibold text-sm"
        >
          Ver menú
        </button>
      </div>
    </div>
  )

  const activeItems = categories.find(c => c.id === activeCategory)?.items.filter(i => i.is_available) || []

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-28">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#181818]">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-3">
          <p className="text-[#444] text-[10px] uppercase tracking-widest mb-1">Menú digital</p>
          <h1 className="text-2xl font-serif text-white leading-tight">{tenantName}</h1>
        </div>

        {/* Category pills */}
        <div className="max-w-2xl mx-auto px-4 pb-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeCategory === cat.id
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                  : 'border-[#333] text-[#777] hover:border-[var(--accent)] hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── Items ── */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {activeItems.map(item => {
          const cartItem = cart.find(c => c.item.id === item.id)
          return (
            <div
              key={item.id}
              className="bg-[#141414] border border-[#1e1e1e] rounded-2xl p-4 flex items-center gap-4"
            >
              {/* Image / Placeholder */}
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#1e1e1e] flex items-center justify-center">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  : <span className="text-2xl" style={{ filter: 'grayscale(1) opacity(0.3)' }}>🍴</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-[15px]">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-[#666] mt-0.5 line-clamp-2 leading-snug">{item.description}</p>
                )}
                <p className="font-bold text-[var(--accent)] mt-1.5 text-[15px]">
                  ${parseFloat(item.price).toLocaleString()}
                </p>
              </div>

              {/* Qty controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {cartItem ? (
                  <>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 rounded-full border border-[#333] text-white flex items-center justify-center text-lg leading-none hover:border-[var(--accent)] transition-colors"
                    >−</button>
                    <span className="w-5 text-center font-semibold text-white text-sm">{cartItem.quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-lg leading-none"
                    >+</button>
                  </>
                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-lg leading-none"
                  >+</button>
                )}
              </div>
            </div>
          )
        })}

        {activeItems.length === 0 && (
          <p className="text-center text-[#333] py-16 text-sm">Sin items disponibles</p>
        )}
      </main>

      {/* ── Carrito flotante ── */}
      <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center px-6 pointer-events-none">
        <button
          onClick={() => setShowCart(true)}
          className={`pointer-events-auto px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 shadow-2xl ${
            cartCount > 0
              ? 'bg-[var(--accent)] text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-[#141414] border border-[#2a2a2a] text-[#444]'
          }`}
        >
          🛒 {cartCount > 0
            ? `${cartCount} ${cartCount === 1 ? 'item' : 'items'} · $${cartTotal.toLocaleString()}`
            : 'Tu pedido'
          }
        </button>
      </div>

      {/* ── Modal carrito ── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/75" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-2xl mx-auto bg-[#141414] rounded-t-[24px] p-6 max-h-[80vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Tu pedido</h2>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 rounded-full bg-[#222] text-[#666] hover:text-white flex items-center justify-center text-xl leading-none transition-colors"
              >×</button>
            </div>

            <div className="space-y-4 mb-6">
              {cart.map(c => (
                <div key={c.item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(c.item.id)}
                        className="w-7 h-7 rounded-full border border-[#333] text-white flex items-center justify-center hover:border-[var(--accent)] transition-colors text-base leading-none"
                      >−</button>
                      <span className="w-5 text-center font-semibold text-white text-sm">{c.quantity}</span>
                      <button
                        onClick={() => addToCart(c.item)}
                        className="w-7 h-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-base leading-none"
                      >+</button>
                    </div>
                    <span className="text-sm font-medium text-white">{c.item.name}</span>
                  </div>
                  <span className="text-sm text-[#888]">${(parseFloat(c.item.price) * c.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#222] pt-4 mb-5">
              <div className="flex justify-between font-bold text-lg">
                <span className="text-white">Total</span>
                <span className="text-[var(--accent)]">${cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => { setShowCart(false); setShowForm(true) }}
              className="w-full py-4 rounded-2xl font-bold text-white text-base bg-[var(--accent)]"
            >
              Confirmar pedido
            </button>
          </div>
        </div>
      )}

      {/* ── Modal formulario ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/75" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-2xl mx-auto bg-[#141414] rounded-t-[24px] p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Tus datos</h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-[#222] text-[#666] hover:text-white flex items-center justify-center text-xl leading-none transition-colors"
              >×</button>
            </div>

            <div className="space-y-3 mb-5">
              <input
                placeholder="Tu nombre"
                value={form.customer_name}
                onChange={e => setForm({ ...form, customer_name: e.target.value })}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white placeholder-[#444] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              />
              <input
                placeholder="Tu teléfono (opcional)"
                value={form.customer_phone}
                onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white placeholder-[#444] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              />
              <input
                placeholder="Número de mesa (opcional)"
                value={form.table_number}
                onChange={e => setForm({ ...form, table_number: e.target.value })}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white placeholder-[#444] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              />
              <textarea
                placeholder="Notas adicionales (opcional)"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white placeholder-[#444] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] resize-none transition-colors"
                rows={3}
              />
            </div>

            <button
              onClick={handleOrder}
              disabled={submitting}
              className="w-full py-4 rounded-2xl font-bold text-white text-base bg-[var(--accent)] disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Enviando...' : `Pedir · $${cartTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
