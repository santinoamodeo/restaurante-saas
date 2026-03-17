'use client'

import { useEffect, useState, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface OrderItem {
  id: string
  menu_item_id: string
  quantity: number
  unit_price: string
  subtotal: string
  notes: string | null
  item_name: string | null
}

interface Order {
  id: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  customer_name: string | null
  customer_phone: string | null
  table_number: string | null
  notes: string | null
  total: string
  payment_method: 'cash' | 'online' | 'transfer'
  created_at: string
  items: OrderItem[]
}

const STEPS: { key: Order['status']; label: string; icon: string }[] = [
  { key: 'pending',   label: 'Recibido',   icon: '📥' },
  { key: 'confirmed', label: 'Confirmado', icon: '✅' },
  { key: 'preparing', label: 'Preparando', icon: '👨‍🍳' },
  { key: 'ready',     label: 'Listo',      icon: '🔔' },
  { key: 'delivered', label: 'Entregado',  icon: '🎉' },
]

const STATUS_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, preparing: 2, ready: 3, delivered: 4, cancelled: -1,
}

const fmt = (n: number | string) => parseFloat(String(n)).toLocaleString('es-AR')

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function PedidoClient({ slug, orderId }: { slug: string; orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [bankInfo, setBankInfo] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#FF4D00')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/public/${slug}/orders/${orderId}`)
      if (!res.ok) throw new Error('not found')
      const data: Order = await res.json()
      setOrder(data)
    } catch {
      setError('No se pudo encontrar el pedido.')
    }
  }, [slug, orderId])

  useEffect(() => {
    // Fetch menu config for tenant name, color, bank info
    fetch(`${API_URL}/api/v1/public/${slug}/menu`)
      .then(r => r.json())
      .then(d => {
        setTenantName(d.tenant_name || slug)
        setPrimaryColor(d.primary_color || '#FF4D00')
        setBankInfo(d.bank_info || null)
        setAddress(d.address || null)
        document.documentElement.style.setProperty('--ac', d.primary_color || '#FF4D00')
        document.documentElement.style.setProperty('--ac-dim', (d.primary_color || '#FF4D00') + '22')
      })
      .catch(() => {})

    fetchOrder().finally(() => setLoading(false))
  }, [slug, fetchOrder])

  // Poll every 15s while order is not terminal
  useEffect(() => {
    if (!order) return
    if (order.status === 'delivered' || order.status === 'cancelled') return
    const interval = setInterval(fetchOrder, 15000)
    return () => clearInterval(interval)
  }, [order, fetchOrder])

  const copyBankInfo = () => {
    if (bankInfo) {
      navigator.clipboard.writeText(bankInfo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');

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

    body { background: var(--bg); }

    .P { min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; padding-bottom: 48px; }

    .P-nav { background: rgba(12,12,12,0.92); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
    .P-nav-in { max-width: 520px; margin: 0 auto; padding: 0 16px; height: 54px; display: flex; align-items: center; justify-content: space-between; }
    .P-nav-back { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 7px 13px; color: var(--txt2); font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
    .P-nav-back:hover { color: var(--txt); border-color: var(--border2); }
    .P-nav-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--txt); }

    .P-body { max-width: 520px; margin: 0 auto; padding: 20px 16px 0; display: flex; flex-direction: column; gap: 12px; }

    /* ── Ready alert ── */
    .P-ready {
      background: linear-gradient(135deg, #22c55e18, #16a34a10);
      border: 1px solid #22c55e55;
      border-radius: 18px; padding: 20px;
      display: flex; align-items: center; gap: 14px;
      animation: readypulse 2s ease-in-out infinite;
    }
    @keyframes readypulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
      50% { box-shadow: 0 0 0 8px rgba(34,197,94,0.08); }
    }
    .P-ready-icon { font-size: 36px; animation: readybounce 1s ease-in-out infinite; }
    @keyframes readybounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    .P-ready-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #4ade80; margin-bottom: 2px; }
    .P-ready-sub { font-size: 13px; color: rgba(74,222,128,0.65); }

    /* ── Cancelled ── */
    .P-cancelled { background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); border-radius: 18px; padding: 20px; text-align: center; }
    .P-cancelled-icon { font-size: 32px; margin-bottom: 8px; }
    .P-cancelled-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #f87171; }

    /* ── Timeline ── */
    .TL { background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; padding: 20px 16px; }
    .TL-title { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--txt3); margin-bottom: 18px; }
    .TL-steps { display: flex; align-items: flex-start; gap: 0; }
    .TL-step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
    .TL-connector {
      position: absolute; top: 16px; left: 50%; right: -50%;
      height: 2px; background: var(--border);
      z-index: 0;
    }
    .TL-connector.done { background: var(--ac); }
    .TL-step:last-child .TL-connector { display: none; }
    .TL-dot {
      width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border);
      background: var(--bg3); display: flex; align-items: center; justify-content: center;
      font-size: 14px; z-index: 1; position: relative; transition: all 0.3s; flex-shrink: 0;
    }
    .TL-dot.done { border-color: var(--ac); background: var(--ac-dim); }
    .TL-dot.current { border-color: var(--ac); background: var(--ac); box-shadow: 0 0 0 4px var(--ac-dim); }
    .TL-label { font-size: 10px; color: var(--txt3); text-align: center; margin-top: 7px; line-height: 1.3; transition: color 0.3s; }
    .TL-label.done { color: var(--txt2); }
    .TL-label.current { color: var(--ac); font-weight: 600; }

    /* ── Order number header ── */
    .P-head { text-align: center; padding: 28px 16px 4px; }
    .P-num { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--ac); letter-spacing: 0.05em; margin-bottom: 4px; }
    .P-date { font-size: 12px; color: var(--txt3); }
    .P-restaurant { font-size: 13px; color: var(--txt2); margin-top: 3px; }

    /* ── Card ── */
    .RC { background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }
    .RC-head { padding: 14px 16px 10px; border-bottom: 1px solid var(--border); }
    .RC-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--txt3); }
    .RC-item { display: flex; align-items: baseline; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--border); }
    .RC-item:last-child { border-bottom: none; }
    .RC-item-qty { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--ac); min-width: 22px; }
    .RC-item-name { flex: 1; font-size: 14px; color: rgba(255,255,255,0.8); }
    .RC-item-price { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: var(--txt); }
    .RC-total { display: flex; justify-content: space-between; align-items: center; padding: 16px; }
    .RC-total-label { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt2); }
    .RC-total-amt { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--ac); }
    .RC-info-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 16px; border-bottom: 1px solid var(--border); }
    .RC-info-row:last-child { border-bottom: none; }
    .RC-info-key { font-size: 12px; color: var(--txt3); }
    .RC-info-val { font-size: 14px; font-weight: 500; color: var(--txt); text-align: right; }
    .RC-transfer { padding: 14px 16px; display: flex; align-items: center; gap: 10px; }
    .RC-transfer-inner { flex: 1; }
    .RC-transfer-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt3); margin-bottom: 3px; }
    .RC-transfer-val { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--txt); word-break: break-all; }
    .RC-copy-btn { flex-shrink: 0; padding: 8px 12px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--txt2); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif; }
    .RC-copy-btn:hover { color: var(--txt); border-color: var(--border2); }
    .RC-copy-btn.ok { color: #4ade80; border-color: #22c55e55; }

    /* ── Map ── */
    .P-map-btn { display: flex; align-items: center; gap: 12px; width: 100%; background: #1a1a1a; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; cursor: pointer; text-decoration: none; transition: border-color 0.15s, background 0.15s; }
    .P-map-btn:hover { background: #222; border-color: rgba(255,255,255,0.15); }
    .P-map-btn-icon { font-size: 22px; flex-shrink: 0; }
    .P-map-btn-texts { display: flex; flex-direction: column; gap: 2px; }
    .P-map-btn-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: #fff; }
    .P-map-btn-addr { font-size: 12px; color: rgba(255,255,255,0.4); }

    /* ── Loading / Error ── */
    .LD { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg); gap: 14px; }
    .LD-ring { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.06); border-top-color: var(--ac); border-radius: 50%; animation: spin 0.65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg) } }
    .LD-txt { font-size: 12px; color: var(--txt3); }
  `

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="LD">
        <div className="LD-ring" />
        <p className="LD-txt">Cargando pedido…</p>
      </div>
    </>
  )

  if (error || !order) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="LD"><p className="LD-txt">{error || 'Pedido no encontrado'}</p></div>
    </>
  )

  const orderNumber = '#' + order.id.replace(/-/g, '').slice(0, 8).toUpperCase()
  const currentIdx = STATUS_INDEX[order.status] ?? 0
  const isCancelled = order.status === 'cancelled'
  const isReady = order.status === 'ready'

  const payLabel = order.payment_method === 'cash'
    ? '💵 Efectivo'
    : order.payment_method === 'transfer'
      ? '🏦 Transferencia'
      : '💳 Online'

  const orderTypeLabel = order.table_number
    ? `🪑 Mesa ${order.table_number}`
    : '🛍️ Para llevar'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="P">
        <nav className="P-nav">
          <div className="P-nav-in">
            <button className="P-nav-back" onClick={() => history.back()}>← Volver</button>
            <span className="P-nav-title">{tenantName}</span>
            <span style={{ width: 70 }} />
          </div>
        </nav>

        <div className="P-head">
          <p className="P-num">{orderNumber}</p>
          <p className="P-date">{fmtDate(order.created_at)}</p>
          <p className="P-restaurant">{tenantName}</p>
        </div>

        <div className="P-body">
          {/* Ready alert */}
          {isReady && (
            <div className="P-ready">
              <span className="P-ready-icon">🔔</span>
              <div>
                <p className="P-ready-title">¡Tu pedido está listo!</p>
                <p className="P-ready-sub">Podés pasar a retirarlo</p>
              </div>
            </div>
          )}

          {/* Cancelled */}
          {isCancelled && (
            <div className="P-cancelled">
              <div className="P-cancelled-icon">❌</div>
              <p className="P-cancelled-title">Pedido cancelado</p>
            </div>
          )}

          {/* Timeline */}
          {!isCancelled && (
            <div className="TL">
              <p className="TL-title">Estado del pedido</p>
              <div className="TL-steps">
                {STEPS.map((step, i) => {
                  const isDone = i < currentIdx
                  const isCurrent = i === currentIdx
                  return (
                    <div key={step.key} className="TL-step">
                      <div className="TL-connector" style={i < currentIdx ? { background: primaryColor } : {}} />
                      <div className={`TL-dot${isDone ? ' done' : ''}${isCurrent ? ' current' : ''}`}>
                        {isDone ? '✓' : step.icon}
                      </div>
                      <span className={`TL-label${isDone ? ' done' : ''}${isCurrent ? ' current' : ''}`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="RC">
            <div className="RC-head"><span className="RC-label">Tu pedido</span></div>
            {order.items.map(item => (
              <div key={item.id} className="RC-item">
                <span className="RC-item-qty">{item.quantity}×</span>
                <span className="RC-item-name">{item.item_name || '—'}</span>
                <span className="RC-item-price">${fmt(item.subtotal)}</span>
              </div>
            ))}
            <div className="RC-total">
              <span className="RC-total-label">Total</span>
              <span className="RC-total-amt">${fmt(order.total)}</span>
            </div>
          </div>

          {/* Info */}
          <div className="RC">
            {order.customer_name && (
              <div className="RC-info-row">
                <span className="RC-info-key">Cliente</span>
                <span className="RC-info-val">{order.customer_name}</span>
              </div>
            )}
            <div className="RC-info-row">
              <span className="RC-info-key">Tipo de pedido</span>
              <span className="RC-info-val">{orderTypeLabel}</span>
            </div>
            <div className="RC-info-row">
              <span className="RC-info-key">Método de pago</span>
              <span className="RC-info-val">{payLabel}</span>
            </div>
          </div>

          {/* Transfer */}
          {order.payment_method === 'transfer' && bankInfo && (
            <div className="RC">
              <div className="RC-head"><span className="RC-label">Datos para la transferencia</span></div>
              <div className="RC-transfer">
                <div className="RC-transfer-inner">
                  <p className="RC-transfer-label">CBU / Alias</p>
                  <p className="RC-transfer-val">{bankInfo}</p>
                </div>
                <button className={`RC-copy-btn${copied ? ' ok' : ''}`} onClick={copyBankInfo}>
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          )}

          {/* Map for takeaway */}
          {!order.table_number && address && (
            <a
              className="P-map-btn"
              href={address.startsWith('http') ? address : `https://maps.google.com/maps?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="P-map-btn-icon">📍</span>
              <span className="P-map-btn-texts">
                <span className="P-map-btn-title">Ver en Google Maps</span>
                <span className="P-map-btn-addr">{address.startsWith('http') ? 'Abrir ubicación del local' : address}</span>
              </span>
            </a>
          )}
        </div>
      </div>
    </>
  )
}
