import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: API_URL,
})

export function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function removeAuthToken() {
  delete api.defaults.headers.common['Authorization']
}

// Auth
export async function login(email: string, password: string) {
  const res = await api.post('/api/v1/auth/login', { email, password })
  return res.data
}

// Menu
export async function getCategories() {
  const res = await api.get('/api/v1/admin/menu/categories')
  return res.data
}

export async function createCategory(data: { name: string; order_index: number }) {
  const res = await api.post('/api/v1/admin/menu/categories', data)
  return res.data
}

export async function deleteCategory(id: string) {
  await api.delete(`/api/v1/admin/menu/categories/${id}`)
}

export async function getItems() {
  const res = await api.get('/api/v1/admin/menu/items')
  return res.data
}

export async function createItem(data: {
  category_id: string
  name: string
  description?: string
  price: number
  is_available: boolean
  order_index: number
}) {
  const res = await api.post('/api/v1/admin/menu/items', data)
  return res.data
}

export async function updateItem(id: string, data: Partial<{
  name: string
  description: string
  price: number
  is_available: boolean
  category_id: string
}>) {
  const res = await api.put(`/api/v1/admin/menu/items/${id}`, data)
  return res.data
}

export async function deleteItem(id: string) {
  await api.delete(`/api/v1/admin/menu/items/${id}`)
}

// Orders
export async function getOrders() {
  const res = await api.get('/api/v1/admin/orders')
  return res.data
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await api.patch(`/api/v1/admin/orders/${id}/status`, { status })
  return res.data
}

export async function deleteOrder(id: string) {
  await api.delete(`/api/v1/admin/orders/${id}`)
}

// Config
export async function getTenantConfig() {
  const res = await api.get('/api/v1/admin/config')
  return res.data
}

export async function updateTenantConfig(data: {
  whatsapp_number: string | null
  callmebot_api_key: string | null
}) {
  const res = await api.patch('/api/v1/admin/config', data)
  return res.data
}