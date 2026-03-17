import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: API_URL,
})

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: string
  image_url: string | null
  is_available: boolean
  order_index: number
  category_id: string
}

export interface MenuCategory {
  id: string
  name: string
  order_index: number
  is_active: boolean
  items: MenuItem[]
}

export interface MenuResponse {
  tenant_name: string
  primary_color: string
  categories: MenuCategory[]
}

export interface OrderItem {
  menu_item_id: string
  quantity: number
  notes?: string
}

export interface CreateOrderPayload {
  customer_name?: string
  customer_phone?: string
  table_number?: string
  notes?: string
  payment_method: 'cash' | 'online' | 'transfer'
  items: OrderItem[]
}

export async function getMenu(tenantSlug: string): Promise<MenuResponse> {
  const res = await api.get(`/api/v1/public/${tenantSlug}/menu`)
  return res.data
}

export async function createOrder(tenantSlug: string, payload: CreateOrderPayload) {
  const res = await api.post(`/api/v1/public/${tenantSlug}/orders`, payload)
  return res.data
}
