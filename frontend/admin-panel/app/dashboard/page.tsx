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
  pending: '⏳ Pendiente',
  confirmed: '✅ Confirmado',
  preparing: '👨‍🍳 Preparando',
  ready: '🔔 Listo',
  delivered: '✔️ Entregado',
  cancelled: '❌ Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
}

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

export default function DashboardPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active')

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/')
      return
    }
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

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const displayOrders = activeTab === 'active' ? activeOrders : orders

  const todayTotal = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + parseFloat(o.total), 0)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <div>
            <h1 className="font-bold text-gray-800">Panel Admin</h1>
            <p className="text-xs text-gray-500">Gestión de pedidos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/menu')}
            className="text-sm text-gray-600 hover:text-orange-500 font-medium transition-colors"
          >
            🍔 Menú
          </button>
          <button
            onClick={() => router.push('/dashboard/config')}
            className="text-sm text-gray-600 hover:text-orange-500 font-medium transition-colors"
          >
            ⚙️ Config
          </button>
          <button
            onClick={() => { removeToken(); router.push('/') }}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Pedidos activos</p>
            <p className="text-3xl font-bold text-orange-500">{activeOrders.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total del día</p>
            <p className="text-3xl font-bold text-green-500">${todayTotal.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total pedidos</p>
            <p className="text-3xl font-bold text-gray-700">{orders.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'active' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'
            }`}
          >
            Activos ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={loadOrders}
            className="ml-auto px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 hover:text-orange-500 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Orders */}
        {displayOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>No hay pedidos {activeTab === 'active' ? 'activos' : ''}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-0.5">
                      {order.customer_name && <p>👤 {order.customer_name}</p>}
                      {order.customer_phone && <p>📞 {order.customer_phone}</p>}
                      {order.table_number && <p>🪑 Mesa {order.table_number}</p>}
                      {order.notes && <p>📝 {order.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-500">${parseFloat(order.total).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-gray-50 pt-3 mb-3 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.quantity}x item</span>
                      <span className="text-gray-700 font-medium">${parseFloat(item.subtotal).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {NEXT_STATUS[order.status] && (
                    <button
                      onClick={() => handleStatusChange(order.id, NEXT_STATUS[order.status])}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      → {STATUS_LABELS[NEXT_STATUS[order.status]]}
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange(order.id, 'cancelled')}
                    className="px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}