'use client'

import { useEffect, useState } from 'react'
import { getMenu, createOrder, MenuCategory, MenuItem, CreateOrderPayload } from '@/lib/api'
import { useParams } from 'next/navigation'

interface CartItem {
  item: MenuItem
  quantity: number
  notes: string
}

export default function RestaurantePage() {
  const params = useParams()
  const slug = params.slug as string

  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
        setCategories(data)
        if (data.length > 0) setActiveCategory(data[0].id)
      })
      .catch(() => setError('Restaurante no encontrado'))
      .finally(() => setLoading(false))
  }, [slug])

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id)
      if (existing) {
        return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { item, quantity: 1, notes: '' }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map((c) => c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
      }
      return prev.filter((c) => c.item.id !== itemId)
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
        items: cart.map((c) => ({
          menu_item_id: c.item.id,
          quantity: c.quantity,
          notes: c.notes || undefined,
        })),
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Cargando menú...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">{error}</p>
    </div>
  )

  if (orderSuccess) return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Pedido enviado!</h2>
        <p className="text-gray-500 mb-6">En breve el restaurante lo confirma.</p>
        <button
          onClick={() => setOrderSuccess(false)}
          className="bg-orange-500 text-white px-6 py-3 rounded-full font-medium"
        >
          Ver menú
        </button>
      </div>
    </div>
  )

  const activeItems = categories.find(c => c.id === activeCategory)?.items || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 capitalize">{slug.replace(/-/g, ' ')}</h1>
          {cartCount > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
            >
              🛒 {cartCount} · ${cartTotal.toLocaleString()}
            </button>
          )}
        </div>

        {/* Categorías */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {activeItems.filter(i => i.is_available).map((item) => {
          const cartItem = cart.find(c => c.item.id === item.id)
          return (
            <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                )}
                <p className="text-orange-500 font-bold mt-1">${parseFloat(item.price).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {cartItem ? (
                  <>
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">−</button>
                    <span className="w-5 text-center font-semibold">{cartItem.quantity}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white">+</button>
                  </>
                ) : (
                  <button onClick={() => addToCart(item)} className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white">+</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Tu pedido</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3 mb-6">
              {cart.map((c) => (
                <div key={c.item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(c.item.id)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">−</button>
                      <span className="w-4 text-center font-semibold text-sm">{c.quantity}</span>
                      <button onClick={() => addToCart(c.item)} className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white">+</button>
                    </div>
                    <span className="text-sm font-medium">{c.item.name}</span>
                  </div>
                  <span className="text-sm font-bold">${(parseFloat(c.item.price) * c.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-orange-500">${cartTotal.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => { setShowCart(false); setShowForm(true) }}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg"
            >
              Confirmar pedido
            </button>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Tus datos</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3 mb-6">
              <input
                placeholder="Tu nombre"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400"
              />
              <input
                placeholder="Tu teléfono (opcional)"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400"
              />
              <input
                placeholder="Número de mesa (opcional)"
                value={form.table_number}
                onChange={(e) => setForm({ ...form, table_number: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400"
              />
              <textarea
                placeholder="Notas adicionales (opcional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 resize-none"
                rows={3}
              />
            </div>
            <button
              onClick={handleOrder}
              disabled={submitting}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : `Pedir · $${cartTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}