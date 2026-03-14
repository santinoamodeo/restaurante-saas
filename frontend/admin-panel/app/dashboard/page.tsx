'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, removeToken } from '@/lib/auth'
import { setAuthToken, getOrders, updateOrderStatus, deleteOrder } from '@/lib/api'

interface OrderItem {
  id: string
  menu_item_id: string
  quantity: number
  unit_price: string
  subtotal: string
  notes: string | null
}

interface Order {
  id: string
  status: string
  customer_name: string | null
  customer_phone: string | null
  table_number: string | null
  notes: string | null
  total: string
  payment_method: string
  created_at: string
  items: OrderItem[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'rgba(234,179,8,0.12)',
  confirmed: 'rgba(59,130,246,0.12)',
  preparing: 'rgba(232,93,4,0.12)',
  ready: 'rgba(34,197,94,0.12)',
  delivered: 'rgba(255,255,255,0.05)',
  cancelled: 'rgba(239,68,68,0.08)',
}

const STATUS_TEXT: Record<string, string> = {
  pending: '#eab308',
  confirmed: '#60a5fa',
  preparing: '#E85D04',
  ready: '#22c55e',
  delivered: 'rgba(255,255,255,0.3)',
  cancelled: '#f87171',
}

const STATUS_DOT: Record<string, string> = {
  pending: '#eab308',
  confirmed: '#60a5fa',
  preparing: '#E85D04',
  ready: '#22c55e',
  delivered: 'rgba(255,255,255,0.2)',
  cancelled: '#f87171',
}

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

const NEXT_LABEL: Record<string, string> = {
  pending: 'Confirmar',
  confirmed: 'Preparando',
  preparing: 'Listo',
  ready: 'Entregado',
}

export default function DashboardPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/'); return }
    setAuthToken(token)
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      const data = await getOrders()
      setOrders(data)
    } catch {
      removeToken()
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(orderId: string, status: string) {
    await updateOrderStatus(orderId, status)
    await loadOrders()
  }

  async function handleDelete(orderId: string) {
    if (!confirm('¿Eliminar este pedido?')) return
    await deleteOrder(orderId)
    await loadOrders()
  }

  const fmt = (n: string | number) => parseFloat(String(n)).toLocaleString('es-AR')
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const displayOrders = activeTab === 'active' ? activeOrders : orders
  const todayTotal = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + parseFloat(o.total), 0)

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0C0C0C;
      --bg2: #141414;
      --bg3: #1C1C1C;
      --border: rgba(255,255,255,0.07);
      --border2: rgba(255,255,255,0.12);
      --txt: #FFFFFF;
      --txt2: rgba(255,255,255,0.45);
      --txt3: rgba(255,255,255,0.2);
      --ac: #E85D04;
      --ac-dim: rgba(232,93,4,0.12);
    }

    .D-root { min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }

    .D-nav {
      background: rgba(12,12,12,0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 50;
    }
    .D-nav-in {
      max-width: 900px; margin: 0 auto;
      padding: 0 20px;
      display: flex; align-items: center; justify-content: space-between;
      height: 58px;
    }
    .D-nav-left { display: flex; align-items: center; gap: 10px; }
    .D-nav-logo {
      width: 32px; height: 32px;
      background: var(--ac-dim);
      border: 1px solid rgba(232,93,4,0.2);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
    }
    .D-nav-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--txt); }

    .D-nav-links { display: flex; align-items: center; gap: 4px; }
    .D-nav-link {
      padding: 6px 12px; border-radius: 8px;
      font-size: 13px; color: var(--txt2);
      cursor: pointer; transition: all 0.15s;
      border: none; background: transparent;
      font-family: 'Inter', sans-serif;
    }
    .D-nav-link:hover { color: var(--txt); background: rgba(255,255,255,0.05); }
    .D-nav-link.active { color: var(--txt); background: rgba(255,255,255,0.08); }
    .D-nav-exit {
      padding: 6px 12px; border-radius: 8px;
      font-size: 13px; color: var(--txt3);
      cursor: pointer; transition: all 0.15s;
      border: none; background: transparent;
      font-family: 'Inter', sans-serif;
    }
    .D-nav-exit:hover { color: #f87171; background: rgba(239,68,68,0.08); }

    .D-body { max-width: 900px; margin: 0 auto; padding: 28px 20px 60px; }

    .D-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
    .D-stat {
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: 16px; padding: 20px;
    }
    .D-stat-label { font-size: 12px; color: var(--txt3); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 10px; }
    .D-stat-val { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -1px; }
    .D-stat-val.orange { color: var(--ac); }
    .D-stat-val.green { color: #22c55e; }
    .D-stat-val.white { color: var(--txt); }

    .D-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .D-tab {
      padding: 7px 16px; border-radius: 100px;
      font-size: 13px; font-weight: 400;
      cursor: pointer; transition: all 0.15s;
      border: 1px solid var(--border);
      background: transparent; color: var(--txt2);
      font-family: 'Inter', sans-serif;
    }
    .D-tab:hover { border-color: var(--border2); color: var(--txt); }
    .D-tab.on { background: var(--ac); border-color: var(--ac); color: #fff; font-weight: 500; }

    .D-refresh {
      margin-left: auto;
      padding: 7px 14px; border-radius: 100px;
      font-size: 13px; color: var(--txt3);
      cursor: pointer; transition: all 0.15s;
      border: 1px solid var(--border);
      background: transparent;
      font-family: 'Inter', sans-serif;
      display: flex; align-items: center; gap: 6px;
    }
    .D-refresh:hover { color: var(--txt2); border-color: var(--border2); }

    .D-empty { text-align: center; padding: 72px 20px; color: var(--txt3); font-size: 14px; }
    .D-empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.3; }

    .D-orders { display: flex; flex-direction: column; gap: 10px; }

    .D-order {
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: 18px; overflow: hidden;
      transition: border-color 0.2s;
    }
    .D-order:hover { border-color: var(--border2); }

    .D-order-head {
      padding: 16px 18px;
      display: flex; align-items: center; gap: 12px;
      cursor: pointer;
    }

    .D-order-id {
      font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
      color: var(--txt); letter-spacing: 0.02em;
    }

    .D-status-badge {
      padding: 4px 10px; border-radius: 100px;
      font-size: 12px; font-weight: 500;
      display: flex; align-items: center; gap: 5px;
    }
    .D-status-dot { width: 6px; height: 6px; border-radius: 50%; }

    .D-order-info { flex: 1; min-width: 0; }
    .D-order-customer { font-size: 13px; color: var(--txt2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .D-order-total {
      font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800;
      color: var(--ac); letter-spacing: -0.5px;
      flex-shrink: 0;
    }

    .D-order-time { font-size: 11px; color: var(--txt3); flex-shrink: 0; }

    .D-order-body {
      border-top: 1px solid var(--border);
      padding: 16px 18px;
    }

    .D-order-details { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
    .D-detail-chip {
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 12px; color: var(--txt2);
      display: flex; align-items: center; gap: 5px;
    }

    .D-items-list { margin-bottom: 16px; }
    .D-item-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .D-item-row:last-child { border-bottom: none; }
    .D-item-name { font-size: 13px; color: var(--txt2); }
    .D-item-price { font-size: 13px; font-weight: 500; color: var(--txt); }

    .D-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .D-btn-next {
      flex: 1; min-width: 140px;
      background: var(--ac); color: #fff; border: none;
      border-radius: 10px; padding: 11px 16px;
      font-size: 13px; font-weight: 600;
      font-family: 'Syne', sans-serif;
      cursor: pointer; transition: all 0.15s;
    }
    .D-btn-next:hover { filter: brightness(1.1); }

    .D-btn-cancel {
      padding: 11px 14px; border-radius: 10px;
      font-size: 13px; color: #f87171;
      cursor: pointer; transition: all 0.15s;
      border: 1px solid rgba(239,68,68,0.15);
      background: rgba(239,68,68,0.05);
      font-family: 'Inter', sans-serif;
    }
    .D-btn-cancel:hover { background: rgba(239,68,68,0.1); }

    .D-btn-del {
      padding: 11px 14px; border-radius: 10px;
      font-size: 13px; color: var(--txt3);
      cursor: pointer; transition: all 0.15s;
      border: 1px solid var(--border);
      background: transparent;
      font-family: 'Inter', sans-serif;
    }
    .D-btn-del:hover { color: var(--txt2); border-color: var(--border2); }

    .D-chevron { color: var(--txt3); font-size: 12px; transition: transform 0.2s; flex-shrink: 0; }
    .D-chevron.open { transform: rotate(180deg); }

    .LD { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
    .LD-ring { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.06); border-top-color: var(--ac); border-radius: 50%; animation: spin 0.65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg) } }

    @media (max-width: 600px) {
      .D-stats { grid-template-columns: repeat(2, 1fr); }
      .D-stat:last-child { grid-column: span 2; }
      .D-stat-val { font-size: 22px; }
    }
  `

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="LD"><div className="LD-ring" /></div>
    </>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="D-root">
        <nav className="D-nav">
          <div className="D-nav-in">
            <div className="D-nav-left">
              <div className="D-nav-logo">🍽️</div>
              <span className="D-nav-title">Panel Admin</span>
            </div>
            <div className="D-nav-links">
              <button className="D-nav-link active" onClick={() => router.push('/dashboard')}>Pedidos</button>
              <button className="D-nav-link" onClick={() => router.push('/dashboard/menu')}>Menú</button>
              <button className="D-nav-link" onClick={() => router.push('/dashboard/config')}>Config</button>
              <button className="D-nav-exit" onClick={() => { removeToken(); router.push('/') }}>Salir</button>
            </div>
          </div>
        </nav>

        <div className="D-body">
          <div className="D-stats">
            <div className="D-stat">
              <p className="D-stat-label">Activos</p>
              <p className="D-stat-val orange">{activeOrders.length}</p>
            </div>
            <div className="D-stat">
              <p className="D-stat-label">Total del día</p>
              <p className="D-stat-val green">${fmt(todayTotal)}</p>
            </div>
            <div className="D-stat">
              <p className="D-stat-label">Total pedidos</p>
              <p className="D-stat-val white">{orders.length}</p>
            </div>
          </div>

          <div className="D-toolbar">
            <button className={`D-tab${activeTab === 'active' ? ' on' : ''}`} onClick={() => setActiveTab('active')}>
              Activos ({activeOrders.length})
            </button>
            <button className={`D-tab${activeTab === 'all' ? ' on' : ''}`} onClick={() => setActiveTab('all')}>
              Todos ({orders.length})
            </button>
            <button className="D-refresh" onClick={loadOrders}>
              ↺ Actualizar
            </button>
          </div>

          {displayOrders.length === 0 ? (
            <div className="D-empty">
              <div className="D-empty-icon">📋</div>
              No hay pedidos {activeTab === 'active' ? 'activos' : ''}
            </div>
          ) : (
            <div className="D-orders">
              {displayOrders.map(order => {
                const isOpen = expandedId === order.id
                return (
                  <div key={order.id} className="D-order">
                    <div className="D-order-head" onClick={() => setExpandedId(isOpen ? null : order.id)}>
                      <div>
                        <p className="D-order-id">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="D-order-customer">
                          {[order.customer_name, order.table_number && `Mesa ${order.table_number}`].filter(Boolean).join(' · ') || 'Sin datos'}
                        </p>
                      </div>
                      <div
                        className="D-status-badge"
                        style={{ background: STATUS_COLORS[order.status], color: STATUS_TEXT[order.status] }}
                      >
                        <span className="D-status-dot" style={{ background: STATUS_DOT[order.status] }} />
                        {STATUS_LABELS[order.status]}
                      </div>
                      <div style={{ flex: 1 }} />
                      <p className="D-order-total">${fmt(order.total)}</p>
                      <p className="D-order-time">
                        {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className={`D-chevron${isOpen ? ' open' : ''}`}>▼</span>
                    </div>

                    {isOpen && (
                      <div className="D-order-body">
                        <div className="D-order-details">
                          {order.customer_name && <span className="D-detail-chip">👤 {order.customer_name}</span>}
                          {order.customer_phone && <span className="D-detail-chip">📞 {order.customer_phone}</span>}
                          {order.table_number && <span className="D-detail-chip">🪑 Mesa {order.table_number}</span>}
                          {order.notes && <span className="D-detail-chip">📝 {order.notes}</span>}
                          <span className="D-detail-chip">{order.payment_method === 'cash' ? '💵 Efectivo' : '💳 Online'}</span>
                        </div>

                        <div className="D-items-list">
                          {order.items.map(item => (
                            <div key={item.id} className="D-item-row">
                              <span className="D-item-name">{item.quantity}x item</span>
                              <span className="D-item-price">${fmt(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="D-actions">
                          {NEXT_STATUS[order.status] && (
                            <button className="D-btn-next" onClick={() => handleStatusChange(order.id, NEXT_STATUS[order.status])}>
                              {NEXT_LABEL[order.status]} →
                            </button>
                          )}
                          {order.status !== 'cancelled' && (
                            <button className="D-btn-cancel" onClick={() => handleStatusChange(order.id, 'cancelled')}>
                              Cancelar
                            </button>
                          )}
                          <button className="D-btn-del" onClick={() => handleDelete(order.id)}>🗑️</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}