'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { getMenu, createOrder, MenuCategory, MenuItem, CreateOrderPayload } from '@/lib/api'
import { useParams, useSearchParams } from 'next/navigation'

interface CartItem {
  item: MenuItem
  quantity: number
  notes: string
}

type OrderType = 'dine_in' | 'takeaway' | null

function RestauranteInner() {
  const params = useParams()
  const slug = params.slug as string
  const searchParams = useSearchParams()

  const [tenantName, setTenantName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#FF4D00')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [bankInfo, setBankInfo] = useState<string | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  interface ReceiptData {
    orderId: string
    orderNumber: string
    date: string
    items: { name: string; quantity: number; unitPrice: number; subtotal: number }[]
    total: number
    customerName: string
    paymentMethod: 'cash' | 'transfer'
    orderType: OrderType
    tableNumber: string
    trackingUrl: string
  }
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [activeCategory, setActiveCategory] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash')
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', table_number: '', notes: '' })
  const [formErrors, setFormErrors] = useState<{ customer_name?: string; customer_phone?: string; table_number?: string }>({})

  // My orders
  interface StoredOrder {
    id: string
    order_number: string
    date: string
    items: { name: string; quantity: number; subtotal: number }[]
    total: number
    restaurant: string
    slug: string
    status: string
    payment_method: string
    customer_name: string
    order_type: string
    table_number: string
    tracking_url: string
  }
  const [myOrders, setMyOrders] = useState<StoredOrder[]>([])
  const [showMyOrders, setShowMyOrders] = useState(false)
  const [refreshingOrders, setRefreshingOrders] = useState(false)

  // Welcome screen state
  const [orderType, setOrderType] = useState<OrderType>(null)
  const [mesaInput, setMesaInput] = useState('')
  const [showMesaInput, setShowMesaInput] = useState(false)
  const mesaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const mesa = searchParams.get('mesa')
    if (mesa) {
      setForm(prev => ({ ...prev, table_number: mesa }))
      setOrderType('dine_in')
    }
  }, [searchParams])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  const readLocalOrders = (): StoredOrder[] => {
    try {
      const all = JSON.parse(localStorage.getItem('eatly_orders') || '[]')
      return all.filter((o: any) => o.slug === slug || o.tracking_url?.startsWith(`/${slug}/pedido/`))
    } catch { return [] }
  }

  const refreshOrderStatuses = async (orders: StoredOrder[], silent = false) => {
    if (!silent) setRefreshingOrders(true)
    const updated = await Promise.all(orders.map(async o => {
      if (o.status === 'delivered' || o.status === 'cancelled') return o
      try {
        const res = await fetch(`${API_URL}/api/v1/public/${slug}/orders/${o.id}`)
        if (res.ok) return { ...o, status: (await res.json()).status }
      } catch {}
      return o
    }))
    // Always update state — this makes activeOrder recompute and excludes terminal orders
    setMyOrders(updated)
    // Sync updated statuses back to localStorage
    try {
      const all = JSON.parse(localStorage.getItem('eatly_orders') || '[]')
      const map = new Map(updated.map(o => [o.id, o]))
      localStorage.setItem('eatly_orders', JSON.stringify(all.map((o: any) => map.get(o.id) || o)))
    } catch {}
    if (!silent) setRefreshingOrders(false)
  }

  const deleteFinished = () => {
    const active = myOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    setMyOrders(active)
    try {
      const all = JSON.parse(localStorage.getItem('eatly_orders') || '[]')
      const ids = new Set(active.map(o => o.id))
      localStorage.setItem('eatly_orders', JSON.stringify(all.filter((o: any) => ids.has(o.id) || !o.tracking_url?.startsWith(`/${slug}/pedido/`))))
    } catch {}
  }

  useEffect(() => {
    const orders = readLocalOrders()
    setMyOrders(orders)
    // Silent background refresh so welcome screen reflects real server status
    const active = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    if (active.length > 0) refreshOrderStatuses(orders, true)
  }, [slug])

  useEffect(() => {
    getMenu(slug)
      .then((data: any) => {
        const cats = data.categories || data
        const name = data.tenant_name || slug.replace(/-/g, ' ')
        const color = data.primary_color || '#FF4D00'
        setTenantName(name)
        setPrimaryColor(color)
        setLogoUrl(data.logo_url || null)
        setBankInfo(data.bank_info || null)
        setCategories(cats)
        if (cats.length > 0) setActiveCategory(cats[0].id)
        document.documentElement.style.setProperty('--ac', color)
        document.documentElement.style.setProperty('--ac-dim', color + '22')
      })
      .catch(() => setError('Restaurante no encontrado'))
      .finally(() => setLoading(false))
  }, [slug])

  function handleDineIn() {
    setShowMesaInput(true)
    setTimeout(() => mesaRef.current?.focus(), 50)
  }

  function handleGoToMenu() {
    setOrderType('dine_in')
    setForm(prev => ({ ...prev, table_number: mesaInput.trim() }))
  }

  function handleTakeaway() {
    setOrderType('takeaway')
    setForm(prev => ({ ...prev, table_number: '' }))
  }

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.item.id === item.id)
      if (ex) return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { item, quantity: 1, notes: '' }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.item.id === itemId)
      if (ex && ex.quantity > 1) return prev.map(c => c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
      return prev.filter(c => c.item.id !== itemId)
    })
  }

  const cartTotal = cart.reduce((s, c) => s + parseFloat(c.item.price) * c.quantity, 0)
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  const validateForm = () => {
    const errors: { customer_name?: string; customer_phone?: string; table_number?: string } = {}
    if (!form.customer_name.trim()) errors.customer_name = 'El nombre es obligatorio'
    if (!form.customer_phone.trim()) errors.customer_phone = 'El teléfono es obligatorio'
    if (orderType === 'dine_in' && !form.table_number.trim()) errors.table_number = 'Ingresá el número de mesa'
    return errors
  }

  const handleOrder = async () => {
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    setSubmitting(true)
    const cartSnapshot = [...cart]
    const total = cartSnapshot.reduce((s, c) => s + parseFloat(c.item.price) * c.quantity, 0)
    try {
      const res = await createOrder(slug, {
        ...form,
        payment_method: paymentMethod,
        items: cartSnapshot.map(c => ({ menu_item_id: c.item.id, quantity: c.quantity, notes: c.notes || undefined })),
      } as CreateOrderPayload)

      const orderId: string = res?.id || crypto.randomUUID()
      const orderNumber = '#' + orderId.replace(/-/g, '').slice(0, 8).toUpperCase()
      const date = new Date().toISOString()

      const trackingUrl = `/${slug}/pedido/${orderId}`

      const receiptData: ReceiptData = {
        orderId,
        orderNumber,
        date,
        items: cartSnapshot.map(c => ({
          name: c.item.name,
          quantity: c.quantity,
          unitPrice: parseFloat(c.item.price),
          subtotal: parseFloat(c.item.price) * c.quantity,
        })),
        total,
        customerName: form.customer_name,
        paymentMethod,
        orderType,
        tableNumber: form.table_number,
        trackingUrl,
      }

      // Save to localStorage history
      try {
        const stored = JSON.parse(localStorage.getItem('eatly_orders') || '[]')
        const newEntry = {
          id: orderId,
          order_number: orderNumber,
          date,
          items: receiptData.items,
          total,
          restaurant: tenantName,
          slug,
          status: 'pending',
          payment_method: paymentMethod,
          customer_name: form.customer_name,
          order_type: orderType,
          table_number: form.table_number,
          tracking_url: trackingUrl,
        }
        stored.unshift(newEntry)
        setMyOrders(prev => [newEntry as StoredOrder, ...prev])
        localStorage.setItem('eatly_orders', JSON.stringify(stored.slice(0, 50)))
      } catch { /* storage unavailable */ }

      setReceipt(receiptData)
      setOrderSuccess(true)
      setCart([])
      setShowForm(false)
    } catch {
      alert('Error al enviar el pedido.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyBankInfo = () => { if (bankInfo) navigator.clipboard.writeText(bankInfo) }

  const fmt = (n: number | string) => parseFloat(String(n)).toLocaleString('es-AR')

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
      + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const STATUS_LABEL: Record<string, string> = {
    pending: '⏳ Recibido',
    confirmed: '✅ Confirmado',
    preparing: '👨‍🍳 Preparando',
    ready: '🔔 Listo para retirar',
    delivered: '🎉 Entregado',
    cancelled: '❌ Cancelado',
  }

  const activeOrder = myOrders.find(o => o.status !== 'delivered' && o.status !== 'cancelled') || null
  const hasFinished = myOrders.some(o => o.status === 'delivered' || o.status === 'cancelled')
  const activeItems = categories.find(c => c.id === activeCategory)?.items?.filter(i => i.is_available) || []

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --ac: ${primaryColor};
      --ac-dim: ${primaryColor}22;
      --bg: #0C0C0C;
      --bg2: #161616;
      --bg3: #1E1E1E;
      --border: rgba(255,255,255,0.07);
      --border2: rgba(255,255,255,0.14);
      --txt: #FFFFFF;
      --txt2: rgba(255,255,255,0.45);
      --txt3: rgba(255,255,255,0.2);
    }

    .R { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--txt); min-height: 100vh; -webkit-font-smoothing: antialiased; }

    /* ── Welcome screen ── */
    .W {
      min-height: 100vh; background: var(--bg);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 32px 20px 48px; font-family: 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
      animation: wfade 0.3s ease;
    }
    @keyframes wfade { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }

    .W-brand { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 36px; }
    .W-logo { height: 72px; max-width: 200px; object-fit: contain; }
    .W-name {
      font-family: 'Syne', sans-serif; font-size: clamp(26px, 7vw, 38px);
      font-weight: 800; letter-spacing: -1px; color: var(--txt);
      text-transform: capitalize; text-align: center;
    }
    .W-sub { font-size: 14px; color: var(--txt3); text-align: center; margin-top: -8px; }

    .W-heading {
      font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
      color: var(--txt2); text-transform: uppercase; letter-spacing: 0.1em;
      margin-bottom: 16px; text-align: center;
    }

    .W-cards { display: flex; gap: 12px; width: 100%; max-width: 420px; }

    .W-card {
      flex: 1; background: #141414; border: 1px solid var(--border);
      border-radius: 22px; padding: 28px 16px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      cursor: pointer; transition: all 0.2s; text-align: center;
      -webkit-tap-highlight-color: transparent;
    }
    .W-card:hover { border-color: var(--ac); background: #191919; transform: translateY(-2px); }
    .W-card.active { border-color: var(--ac); background: var(--ac-dim); }

    .W-card-icon { font-size: 40px; line-height: 1; }
    .W-card-label { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--txt); }
    .W-card-sub { font-size: 12px; color: var(--txt3); line-height: 1.4; }

    .W-mesa-wrap {
      width: 100%; max-width: 420px; margin-top: 16px;
      animation: wfade 0.2s ease;
    }
    .W-mesa-label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt3); display: block; margin-bottom: 8px; }
    .W-mesa-input {
      width: 100%; background: #141414; border: 1px solid var(--border);
      border-radius: 14px; padding: 15px 18px;
      font-size: 18px; font-family: 'Syne', sans-serif; font-weight: 700;
      color: var(--txt); outline: none; transition: border-color 0.18s;
      text-align: center; letter-spacing: 2px;
    }
    .W-mesa-input::placeholder { color: var(--txt3); font-weight: 400; letter-spacing: 0; font-size: 15px; }
    .W-mesa-input:focus { border-color: var(--ac); }

    .W-btn {
      width: 100%; max-width: 420px; margin-top: 12px;
      background: var(--ac); color: #fff; border: none;
      border-radius: 100px; padding: 17px;
      font-size: 16px; font-weight: 700; font-family: 'Syne', sans-serif;
      cursor: pointer; transition: all 0.18s;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    }
    .W-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

    /* ── Active order card (welcome) ── */
    .W-active {
      width: 100%; max-width: 420px; margin-bottom: 20px;
      background: var(--bg2); border: 1px solid var(--border2);
      border-radius: 20px; padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
      animation: wfade 0.3s ease;
    }
    .W-active-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
      background: var(--ac); box-shadow: 0 0 0 3px var(--ac-dim);
      animation: dotpulse 2s ease-in-out infinite;
    }
    @keyframes dotpulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .W-active-txt { flex: 1; min-width: 0; }
    .W-active-label { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--txt3); margin-bottom: 2px; }
    .W-active-num { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--txt); }
    .W-active-status { font-size: 12px; color: var(--txt2); margin-top: 1px; }
    .W-active-btn {
      flex-shrink: 0; background: var(--ac); color: #fff; border: none;
      border-radius: 100px; padding: 8px 16px; font-size: 13px; font-weight: 700;
      font-family: 'Syne', sans-serif; cursor: pointer; transition: all 0.18s;
      text-decoration: none; display: inline-block;
    }
    .W-active-btn:hover { filter: brightness(1.1); }

    /* ── My orders sheet ── */
    .MO-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--txt); margin-bottom: 4px; }
    .MO-sub { font-size: 13px; color: var(--txt3); margin-bottom: 18px; }
    .MO-item {
      background: var(--bg3); border: 1px solid var(--border); border-radius: 14px;
      padding: 14px; margin-bottom: 10px;
    }
    .MO-item-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .MO-num { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--txt); }
    .MO-date { font-size: 11px; color: var(--txt3); margin-top: 1px; }
    .MO-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; gap: 8px; }
    .MO-total { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--ac); }
    .MO-link { font-size: 13px; font-weight: 600; color: var(--ac); text-decoration: none; font-family: 'Syne', sans-serif; padding: 7px 14px; border: 1px solid var(--ac); border-radius: 100px; transition: all 0.15s; }
    .MO-link:hover { background: var(--ac-dim); }
    .MO-empty { text-align: center; padding: 40px 20px; color: var(--txt3); font-size: 14px; }
    .MO-clear { width: 100%; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 12px; font-size: 13px; color: #f87171; cursor: pointer; font-family: 'Inter', sans-serif; margin-top: 8px; transition: all 0.15s; }
    .MO-clear:hover { background: rgba(239,68,68,0.1); }
    .MO-refreshing { font-size: 11px; color: var(--txt3); text-align: center; padding: 6px 0 0; }

    .W-skip {
      margin-top: 24px; font-size: 13px; color: var(--txt3);
      background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: color 0.15s;
    }
    .W-skip:hover { color: var(--txt2); }

    /* ── Header ── */
    .H {
      position: sticky; top: 0; z-index: 100;
      background: rgba(12,12,12,0.92);
      backdrop-filter: saturate(180%) blur(24px);
      -webkit-backdrop-filter: saturate(180%) blur(24px);
      border-bottom: 1px solid var(--border);
    }
    .H-in { max-width: 600px; margin: 0 auto; padding: 18px 16px 0; }
    .H-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 12px; }
    .H-logo { height: 48px; max-width: 160px; object-fit: contain; display: block; }
    .H-name {
      font-family: 'Syne', sans-serif; font-size: clamp(20px, 6vw, 30px);
      font-weight: 800; letter-spacing: -0.8px; line-height: 1;
      color: var(--txt); text-transform: capitalize;
    }
    .H-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .H-badge {
      background: var(--ac-dim); color: var(--ac);
      font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
      padding: 5px 11px; border-radius: 100px; border: 1px solid var(--ac);
    }
    .H-orders-btn {
      background: var(--bg3); border: 1px solid var(--border); border-radius: 100px;
      padding: 5px 11px; display: flex; align-items: center; gap: 5px;
      font-size: 12px; color: var(--txt2); cursor: pointer; transition: all 0.18s;
      font-family: 'Inter', sans-serif;
    }
    .H-orders-btn:hover { color: var(--txt); border-color: var(--border2); }
    .H-otype {
      background: rgba(255,255,255,0.06);
      color: var(--txt2); font-size: 10px; font-weight: 500;
      padding: 5px 10px; border-radius: 100px;
      border: 1px solid var(--border); white-space: nowrap;
    }
    .C-wrap { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 14px; scrollbar-width: none; }
    .C-wrap::-webkit-scrollbar { display: none; }
    .C-btn {
      flex-shrink: 0; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 400;
      padding: 6px 15px; border-radius: 100px; border: 1px solid var(--border);
      background: transparent; color: var(--txt2); cursor: pointer; transition: all 0.18s; white-space: nowrap;
    }
    .C-btn:hover { border-color: rgba(255,255,255,0.18); color: var(--txt); }
    .C-btn.on { background: var(--ac); border-color: var(--ac); color: #fff; font-weight: 500; }

    .I-list { max-width: 600px; margin: 0 auto; padding: 12px 12px 140px; display: flex; flex-direction: column; gap: 8px; }

    .I-card {
      background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; padding: 14px;
      display: flex; align-items: center; gap: 14px; transition: border-color 0.2s, background 0.2s;
    }
    .I-card:hover { border-color: rgba(255,255,255,0.12); background: #181818; }
    .I-img { width: 76px; height: 76px; border-radius: 13px; object-fit: cover; flex-shrink: 0; }
    .I-ph { width: 76px; height: 76px; border-radius: 13px; background: var(--bg3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--txt3); font-size: 22px; }
    .I-info { flex: 1; min-width: 0; }
    .I-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 600; color: var(--txt); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .I-desc { font-size: 12px; color: var(--txt2); line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 7px; }
    .I-price { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: var(--ac); }
    .I-ctrl { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .Btn-add { width: 36px; height: 36px; border-radius: 50%; background: var(--ac); border: none; color: #fff; font-size: 20px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.15s, filter 0.15s; }
    .Btn-add:hover { filter: brightness(1.15); transform: scale(1.07); }
    .Btn-add:active { transform: scale(0.93); }
    .Btn-sub { width: 32px; height: 32px; border-radius: 50%; background: var(--bg3); border: none; color: var(--txt); font-size: 18px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
    .Btn-sub:hover { background: #2a2a2a; }
    .I-qty { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; min-width: 18px; text-align: center; }

    .CF { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 90; }
    .CF-empty { display: flex; align-items: center; gap: 8px; background: rgba(22,22,22,0.88); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); color: var(--txt3); padding: 12px 24px; border-radius: 100px; font-size: 13px; font-family: 'Inter', sans-serif; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
    .CF-empty:hover { border-color: rgba(255,255,255,0.18); color: var(--txt2); }
    .CF-full { display: flex; align-items: center; gap: 10px; background: var(--ac); color: #fff; padding: 15px 26px; border-radius: 100px; font-size: 15px; font-weight: 600; font-family: 'Syne', sans-serif; border: none; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 28px rgba(0,0,0,0.55); transition: all 0.2s; }
    .CF-full:hover { filter: brightness(1.1); transform: translateY(-2px); }
    .CF-pill { background: rgba(0,0,0,0.22); border-radius: 100px; padding: 2px 9px; font-size: 13px; font-weight: 700; }

    .OV { position: fixed; inset: 0; z-index: 110; background: rgba(0,0,0,0.72); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); animation: fadein 0.2s; }
    @keyframes fadein { from{opacity:0} to{opacity:1} }

    .BS { position: fixed; bottom: 0; left: 0; right: 0; z-index: 120; background: #141414; border: 1px solid rgba(255,255,255,0.08); border-bottom: none; border-radius: 24px 24px 0 0; padding: 0 16px 28px; max-height: 88vh; overflow-y: auto; animation: slideup 0.3s cubic-bezier(0.32,0.72,0,1); max-width: 600px; margin: 0 auto; }
    @keyframes slideup { from{transform:translateY(100%)} to{transform:translateY(0)} }
    .BS-handle { width: 36px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 12px auto 20px; }
    .BS-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--txt); margin-bottom: 18px; letter-spacing: -0.5px; }
    .BS-line { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--border); }
    .BS-lname { flex:1; font-size: 14px; color: rgba(255,255,255,0.75); }
    .BS-lprice { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; min-width: 72px; text-align: right; }
    .BS-total { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; }
    .BS-tlabel { font-size: 12px; color: var(--txt2); letter-spacing: 0.1em; text-transform: uppercase; }
    .BS-tamount { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: var(--ac); letter-spacing: -0.5px; }
    .BS-btn { width: 100%; background: var(--ac); color: #fff; border: none; border-radius: 14px; padding: 17px; font-size: 16px; font-weight: 600; font-family: 'Syne', sans-serif; cursor: pointer; margin-bottom: 8px; transition: all 0.18s; }
    .BS-btn:hover { filter: brightness(1.08); }
    .BS-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .F-group { margin-bottom: 10px; }
    .F-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt3); display: block; margin-bottom: 6px; }
    .F-input { width: 100%; background: #1C1C1C; border: 1px solid rgba(255,255,255,0.08); border-radius: 11px; padding: 13px 14px; font-size: 15px; color: var(--txt); font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.18s; }
    .F-input::placeholder { color: var(--txt3); }
    .F-input:focus { border-color: var(--ac); }
    .F-ta { resize: none; height: 74px; }
    .F-otype-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--ac-dim); border: 1px solid var(--ac); border-radius: 100px; padding: 5px 12px; font-size: 12px; color: var(--ac); font-weight: 500; margin-bottom: 16px; }
    .F-input.err { border-color: #E53E3E; }
    .F-error { font-size: 11px; color: #E53E3E; margin-top: 5px; display: block; }
    .F-req { color: var(--ac); margin-left: 2px; }

    .PM-cards { display: flex; gap: 10px; margin-top: 2px; }
    .PM-card {
      flex: 1; background: #1C1C1C; border: 1px solid var(--border);
      border-radius: 14px; padding: 14px 12px;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      cursor: pointer; transition: all 0.18s; text-align: center;
      -webkit-tap-highlight-color: transparent;
    }
    .PM-card:hover { border-color: rgba(255,255,255,0.15); }
    .PM-card.on { border-color: var(--ac); background: var(--ac-dim); }
    .PM-card-icon { font-size: 26px; line-height: 1; }
    .PM-card-label { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--txt); }

    .PM-transfer-info {
      margin-top: 10px; background: #1C1C1C; border: 1px solid var(--border);
      border-radius: 12px; padding: 13px 14px;
      display: flex; align-items: center; gap: 10px;
    }
    .PM-transfer-label { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--txt3); margin-bottom: 3px; }
    .PM-transfer-value { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--txt); word-break: break-all; }
    .PM-copy-btn {
      flex-shrink: 0; padding: 8px 12px; background: var(--bg3); border: 1px solid var(--border);
      border-radius: 8px; color: var(--txt2); font-size: 12px; font-weight: 500;
      cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif;
    }
    .PM-copy-btn:hover { color: var(--txt); border-color: rgba(255,255,255,0.18); }

    /* ── Receipt ── */
    .RC { min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; padding-bottom: 40px; }
    .RC-head { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 28px 20px 24px; text-align: center; }
    .RC-check { font-size: 52px; margin-bottom: 12px; animation: rcpop 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
    @keyframes rcpop { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
    .RC-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--txt); letter-spacing: -0.5px; margin-bottom: 4px; }
    .RC-num { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--ac); letter-spacing: 0.05em; }
    .RC-date { font-size: 12px; color: var(--txt3); margin-top: 4px; }

    .RC-body { max-width: 480px; margin: 0 auto; padding: 20px 16px 0; display: flex; flex-direction: column; gap: 12px; }

    .RC-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }
    .RC-card-head { padding: 14px 16px 10px; border-bottom: 1px solid var(--border); }
    .RC-card-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--txt3); font-weight: 500; }

    .RC-item { display: flex; align-items: baseline; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--border); }
    .RC-item:last-child { border-bottom: none; }
    .RC-item-qty { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--ac); min-width: 22px; }
    .RC-item-name { flex: 1; font-size: 14px; color: rgba(255,255,255,0.8); }
    .RC-item-price { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: var(--txt); }

    .RC-total-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 16px; }
    .RC-total-label { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt2); }
    .RC-total-amount { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--ac); letter-spacing: -0.5px; }

    .RC-info-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 16px; border-bottom: 1px solid var(--border); }
    .RC-info-row:last-child { border-bottom: none; }
    .RC-info-key { font-size: 12px; color: var(--txt3); }
    .RC-info-val { font-size: 14px; font-weight: 500; color: var(--txt); text-align: right; }

    .RC-transfer { padding: 14px 16px; display: flex; align-items: center; gap: 10px; }
    .RC-transfer-inner { flex: 1; }
    .RC-transfer-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt3); margin-bottom: 3px; }
    .RC-transfer-val { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--txt); word-break: break-all; }

    .RC-actions { max-width: 480px; margin: 0 auto; padding: 16px 16px 0; display: flex; flex-direction: column; gap: 10px; }
    .RC-btn-wa { width: 100%; background: #25D366; color: #fff; border: none; border-radius: 14px; padding: 16px; font-size: 15px; font-weight: 700; font-family: 'Syne', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.18s; }
    .RC-btn-wa:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .RC-btn-back { width: 100%; background: transparent; color: var(--txt2); border: 1px solid var(--border); border-radius: 14px; padding: 15px; font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.18s; }
    .RC-btn-back:hover { color: var(--txt); border-color: var(--border2); }
    .RC-btn-track { width: 100%; background: var(--bg2); color: var(--txt); border: 1px solid var(--border2); border-radius: 14px; padding: 15px; font-size: 14px; font-weight: 600; font-family: 'Syne', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.18s; text-decoration: none; }
    .RC-btn-track:hover { background: var(--bg3); }

    .LD { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg); gap: 14px; }
    .LD-ring { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.06); border-top-color: var(--ac); border-radius: 50%; animation: spin 0.65s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .LD-txt { font-size: 12px; color: var(--txt3); letter-spacing: 0.06em; }

    .SC { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg); padding: 32px 20px; text-align: center; }
    .SC-icon { font-size: 68px; margin-bottom: 24px; animation: bounce 2s ease-in-out infinite; }
    @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    .SC-t { font-family: 'Syne', sans-serif; font-size: 34px; font-weight: 800; letter-spacing: -1px; color: var(--txt); margin-bottom: 10px; }
    .SC-s { font-size: 15px; color: var(--txt2); line-height: 1.6; margin-bottom: 40px; }

    .empty { text-align: center; padding: 72px 20px; color: var(--txt3); font-size: 14px; }
    .empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.3; }
  `

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="LD">
        <div className="LD-ring" />
        <p className="LD-txt">Cargando menú</p>
      </div>
    </>
  )

  if (error) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="LD"><p className="LD-txt">{error}</p></div>
    </>
  )

  if (orderSuccess && receipt) {
    const fmtDate = (iso: string) => {
      const d = new Date(iso)
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }

    const orderTypeLabel = receipt.orderType === 'dine_in'
      ? (receipt.tableNumber ? `🪑 Mesa ${receipt.tableNumber}` : '🪑 Comer aquí')
      : '🛍️ Para llevar'

    const payLabel = receipt.paymentMethod === 'cash' ? '💵 Efectivo' : '🏦 Transferencia'

    const waText = encodeURIComponent(
      `🧾 *Comprobante de pedido*\n` +
      `Restaurante: ${tenantName}\n` +
      `Pedido: ${receipt.orderNumber}\n` +
      `Fecha: ${fmtDate(receipt.date)}\n\n` +
      `*Items:*\n` +
      receipt.items.map(i => `• ${i.quantity}x ${i.name} — $${fmt(i.subtotal)}`).join('\n') +
      `\n\n*Total: $${fmt(receipt.total)}*\n` +
      `Pago: ${payLabel}\n` +
      `${receipt.orderType === 'dine_in' && receipt.tableNumber ? `Mesa: ${receipt.tableNumber}\n` : ''}` +
      `Cliente: ${receipt.customerName}`
    )

    const handleBack = () => {
      setOrderSuccess(false)
      setReceipt(null)
      setOrderType(null)
      setShowMesaInput(false)
      setMesaInput('')
      setPaymentMethod('cash')
      setForm({ customer_name: '', customer_phone: '', table_number: '', notes: '' })
    }

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="RC">
          <div className="RC-head">
            <div className="RC-check">🎉</div>
            <h2 className="RC-title">¡Pedido confirmado!</h2>
            <p className="RC-num">{receipt.orderNumber}</p>
            <p className="RC-date">{fmtDate(receipt.date)}</p>
          </div>

          <div className="RC-body">
            {/* Items */}
            <div className="RC-card">
              <div className="RC-card-head">
                <span className="RC-card-label">Tu pedido</span>
              </div>
              {receipt.items.map((item, i) => (
                <div key={i} className="RC-item">
                  <span className="RC-item-qty">{item.quantity}×</span>
                  <span className="RC-item-name">{item.name}</span>
                  <span className="RC-item-price">${fmt(item.subtotal)}</span>
                </div>
              ))}
              <div className="RC-total-row">
                <span className="RC-total-label">Total</span>
                <span className="RC-total-amount">${fmt(receipt.total)}</span>
              </div>
            </div>

            {/* Info */}
            <div className="RC-card">
              <div className="RC-info-row">
                <span className="RC-info-key">Cliente</span>
                <span className="RC-info-val">{receipt.customerName}</span>
              </div>
              <div className="RC-info-row">
                <span className="RC-info-key">Tipo de pedido</span>
                <span className="RC-info-val">{orderTypeLabel}</span>
              </div>
              <div className="RC-info-row">
                <span className="RC-info-key">Método de pago</span>
                <span className="RC-info-val">{payLabel}</span>
              </div>
            </div>

            {/* Transfer info */}
            {receipt.paymentMethod === 'transfer' && bankInfo && (
              <div className="RC-card">
                <div className="RC-card-head">
                  <span className="RC-card-label">Datos para la transferencia</span>
                </div>
                <div className="RC-transfer">
                  <div className="RC-transfer-inner">
                    <p className="RC-transfer-label">CBU / Alias</p>
                    <p className="RC-transfer-val">{bankInfo}</p>
                  </div>
                  <button className="PM-copy-btn" onClick={copyBankInfo}>Copiar</button>
                </div>
              </div>
            )}
          </div>

          <div className="RC-actions">
            <a href={receipt.trackingUrl} className="RC-btn-track">
              📍 Ver estado del pedido
            </a>
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <button className="RC-btn-wa">
                <span>💬</span> Enviar por WhatsApp
              </button>
            </a>
            <button className="RC-btn-back" onClick={handleBack}>
              ← Volver al menú
            </button>
          </div>
        </div>
      </>
    )
  }

  // Welcome screen — only if orderType not yet chosen
  if (orderType === null) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="W">
        {activeOrder && (
          <div className="W-active">
            <div className="W-active-dot" />
            <div className="W-active-txt">
              <p className="W-active-label">Pedido en curso</p>
              <p className="W-active-num">{activeOrder.order_number}</p>
              <p className="W-active-status">{STATUS_LABEL[activeOrder.status] || activeOrder.status}</p>
            </div>
            <a href={activeOrder.tracking_url} className="W-active-btn">Ver pedido</a>
          </div>
        )}

        <div className="W-brand">
          {logoUrl
            ? <img src={logoUrl} alt={tenantName} className="W-logo" />
            : <h1 className="W-name">{tenantName}</h1>
          }
          {logoUrl && <p className="W-name" style={{ fontSize: 'clamp(18px,5vw,26px)' }}>{tenantName}</p>}
          <p className="W-sub">¿Cómo querés pedir?</p>
        </div>

        <div className="W-cards">
          <div
            className={`W-card${showMesaInput ? ' active' : ''}`}
            onClick={handleDineIn}
          >
            <span className="W-card-icon">🪑</span>
            <span className="W-card-label">Comer aquí</span>
            <span className="W-card-sub">Pedido en mesa</span>
          </div>
          <div className="W-card" onClick={handleTakeaway}>
            <span className="W-card-icon">🛍️</span>
            <span className="W-card-label">Para llevar</span>
            <span className="W-card-sub">Retirás en mostrador</span>
          </div>
        </div>

        {showMesaInput && (
          <div className="W-mesa-wrap">
            <label className="W-mesa-label">Número de mesa (opcional)</label>
            <input
              ref={mesaRef}
              className="W-mesa-input"
              type="text"
              inputMode="numeric"
              placeholder="Ej: 4"
              value={mesaInput}
              onChange={e => setMesaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGoToMenu()}
            />
          </div>
        )}

        {showMesaInput && (
          <button className="W-btn" onClick={handleGoToMenu}>
            Ver menú →
          </button>
        )}

        <button className="W-skip" onClick={() => setOrderType('takeaway')}>
          Continuar sin seleccionar
        </button>
      </div>
    </>
  )

  // Menu view
  const orderTypeBadge = orderType === 'dine_in'
    ? (form.table_number ? `🪑 Mesa ${form.table_number}` : '🪑 Comer aquí')
    : '🛍️ Para llevar'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="R">
        <header className="H">
          <div className="H-in">
            <div className="H-top">
              {logoUrl
                ? <img src={logoUrl} alt={tenantName} className="H-logo" />
                : <h1 className="H-name">{tenantName}</h1>
              }
              <div className="H-right">
                {myOrders.length > 0 && (
                  <button className="H-orders-btn" onClick={() => { setShowMyOrders(true); refreshOrderStatuses(myOrders) }}>
                    🕐 {myOrders.length}
                  </button>
                )}
                <span className="H-otype">{orderTypeBadge}</span>
                <span className="H-badge">Menú</span>
              </div>
            </div>
            <div className="C-wrap">
              {categories.map(cat => (
                <button key={cat.id} className={`C-btn${activeCategory === cat.id ? ' on' : ''}`} onClick={() => setActiveCategory(cat.id)}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="I-list">
          {activeItems.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🍽️</div>
              Sin items disponibles
            </div>
          ) : activeItems.map(item => {
            const ci = cart.find(c => c.item.id === item.id)
            return (
              <div key={item.id} className="I-card">
                {item.image_url ? <img src={item.image_url} alt={item.name} className="I-img" /> : <div className="I-ph">🍴</div>}
                <div className="I-info">
                  <p className="I-name">{item.name}</p>
                  {item.description && <p className="I-desc">{item.description}</p>}
                  <p className="I-price">${fmt(item.price)}</p>
                </div>
                <div className="I-ctrl">
                  {ci ? (
                    <>
                      <button className="Btn-sub" onClick={() => removeFromCart(item.id)}>−</button>
                      <span className="I-qty">{ci.quantity}</span>
                      <button className="Btn-add" onClick={() => addToCart(item)}>+</button>
                    </>
                  ) : (
                    <button className="Btn-add" onClick={() => addToCart(item)}>+</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="CF">
          {cartCount === 0 ? (
            <button className="CF-empty" onClick={() => setShowCart(true)}>🛒 Tu pedido</button>
          ) : (
            <button className="CF-full" onClick={() => setShowCart(true)}>
              🛒 <span className="CF-pill">{cartCount}</span> ${fmt(cartTotal)}
            </button>
          )}
        </div>

        {showCart && (
          <>
            <div className="OV" onClick={() => setShowCart(false)} />
            <div className="BS">
              <div className="BS-handle" />
              <h2 className="BS-title">Tu pedido</h2>
              {cart.map(c => (
                <div key={c.item.id} className="BS-line">
                  <div className="I-ctrl" style={{ gap: 6 }}>
                    <button className="Btn-sub" style={{ width: 28, height: 28, fontSize: 16 }} onClick={() => removeFromCart(c.item.id)}>−</button>
                    <span className="I-qty" style={{ fontSize: 14 }}>{c.quantity}</span>
                    <button className="Btn-add" style={{ width: 28, height: 28, fontSize: 16 }} onClick={() => addToCart(c.item)}>+</button>
                  </div>
                  <span className="BS-lname">{c.item.name}</span>
                  <span className="BS-lprice">${fmt(parseFloat(c.item.price) * c.quantity)}</span>
                </div>
              ))}
              <div className="BS-total">
                <span className="BS-tlabel">Total</span>
                <span className="BS-tamount">${fmt(cartTotal)}</span>
              </div>
              <button className="BS-btn" onClick={() => { setShowCart(false); setShowForm(true) }}>
                Confirmar pedido →
              </button>
            </div>
          </>
        )}

        {showForm && (
          <>
            <div className="OV" onClick={() => { setShowForm(false); setFormErrors({}) }} />
            <div className="BS">
              <div className="BS-handle" />
              <h2 className="BS-title">Tus datos</h2>
              <span className="F-otype-badge">{orderTypeBadge}</span>
              <div className="F-group">
                <label className="F-label">Nombre<span className="F-req">*</span></label>
                <input
                  className={`F-input${formErrors.customer_name ? ' err' : ''}`}
                  placeholder="¿Cómo te llamás?"
                  value={form.customer_name}
                  onChange={e => { setForm({ ...form, customer_name: e.target.value }); if (formErrors.customer_name) setFormErrors(p => ({ ...p, customer_name: undefined })) }}
                />
                {formErrors.customer_name && <span className="F-error">{formErrors.customer_name}</span>}
              </div>
              <div className="F-group">
                <label className="F-label">Teléfono<span className="F-req">*</span></label>
                <input
                  className={`F-input${formErrors.customer_phone ? ' err' : ''}`}
                  placeholder="2615xxxxxx"
                  inputMode="tel"
                  value={form.customer_phone}
                  onChange={e => { setForm({ ...form, customer_phone: e.target.value }); if (formErrors.customer_phone) setFormErrors(p => ({ ...p, customer_phone: undefined })) }}
                />
                {formErrors.customer_phone && <span className="F-error">{formErrors.customer_phone}</span>}
              </div>
              {orderType === 'dine_in' && (
                <div className="F-group">
                  <label className="F-label">Mesa<span className="F-req">*</span></label>
                  <input
                    className={`F-input${formErrors.table_number ? ' err' : ''}`}
                    placeholder="Ej: 4"
                    inputMode="numeric"
                    value={form.table_number}
                    onChange={e => { setForm({ ...form, table_number: e.target.value }); if (formErrors.table_number) setFormErrors(p => ({ ...p, table_number: undefined })) }}
                  />
                  {formErrors.table_number && <span className="F-error">{formErrors.table_number}</span>}
                </div>
              )}
              <div className="F-group" style={{ marginBottom: 20 }}>
                <label className="F-label">Notas</label>
                <textarea className="F-input F-ta" placeholder="Sin cebolla, alergias, etc." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="F-group" style={{ marginBottom: 20 }}>
                <label className="F-label">Método de pago</label>
                <div className="PM-cards">
                  <div className={`PM-card${paymentMethod === 'cash' ? ' on' : ''}`} onClick={() => setPaymentMethod('cash')}>
                    <span className="PM-card-icon">💵</span>
                    <span className="PM-card-label">Efectivo</span>
                  </div>
                  <div className={`PM-card${paymentMethod === 'transfer' ? ' on' : ''}`} onClick={() => setPaymentMethod('transfer')}>
                    <span className="PM-card-icon">🏦</span>
                    <span className="PM-card-label">Transferencia</span>
                  </div>
                </div>
                {paymentMethod === 'transfer' && bankInfo && (
                  <div className="PM-transfer-info">
                    <div style={{ flex: 1 }}>
                      <p className="PM-transfer-label">CBU / Alias</p>
                      <p className="PM-transfer-value">{bankInfo}</p>
                    </div>
                    <button className="PM-copy-btn" onClick={copyBankInfo}>Copiar</button>
                  </div>
                )}
              </div>

              <button className="BS-btn" onClick={handleOrder} disabled={submitting}>
                {submitting ? 'Enviando...' : `Pedir · $${fmt(cartTotal)}`}
              </button>
            </div>
          </>
        )}
        {showMyOrders && (
          <>
            <div className="OV" onClick={() => setShowMyOrders(false)} />
            <div className="BS">
              <div className="BS-handle" />
              <h2 className="MO-title">Mis pedidos</h2>
              <p className="MO-sub">{tenantName}</p>
              {refreshingOrders && <p className="MO-refreshing">Actualizando estados…</p>}
              {myOrders.length === 0 ? (
                <div className="MO-empty">No tenés pedidos guardados</div>
              ) : (
                <>
                  {myOrders.map(o => (
                    <div key={o.id} className="MO-item">
                      <div className="MO-item-top">
                        <div>
                          <p className="MO-num">{o.order_number}</p>
                          <p className="MO-date">{fmtDate(o.date)}</p>
                        </div>
                        <span style={{ fontSize: 12, color: o.status === 'ready' ? '#4ade80' : o.status === 'cancelled' ? '#f87171' : 'rgba(255,255,255,0.45)' }}>
                          {STATUS_LABEL[o.status] || o.status}
                        </span>
                      </div>
                      <div className="MO-bottom">
                        <span className="MO-total">${fmt(o.total)}</span>
                        <a href={o.tracking_url} className="MO-link">Ver detalle →</a>
                      </div>
                    </div>
                  ))}
                  {hasFinished && (
                    <button className="MO-clear" onClick={deleteFinished}>
                      🗑 Limpiar pedidos terminados
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default function RestaurantePage() {
  return (
    <Suspense>
      <RestauranteInner />
    </Suspense>
  )
}
