import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://restaurante-saas-production-136b.up.railway.app'

export const api = axios.create({ baseURL: API_URL })

export function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export async function superadminLogin(email: string, password: string) {
  const res = await api.post('/api/v1/superadmin/login', { email, password })
  return res.data
}

export async function getTenants() {
  const res = await api.get('/api/v1/superadmin/tenants')
  return res.data
}

export async function createTenant(data: {
  tenant_name: string
  tenant_slug: string
  admin_email: string
  admin_password: string
}) {
  const res = await api.post('/api/v1/superadmin/tenants', data, {
    headers: { 'X-Setup-Key': process.env.NEXT_PUBLIC_SETUP_KEY },
  })
  return res.data
}

export async function toggleTenant(id: string) {
  const res = await api.patch(`/api/v1/superadmin/tenants/${id}/toggle`)
  return res.data
}

export async function updateTenant(id: string, data: {
  plan?: string
  billing_day?: number | null
  plan_price?: number
  internal_notes?: string
  owner_name?: string
  owner_phone?: string
}) {
  const res = await api.patch(`/api/v1/superadmin/tenants/${id}`, data)
  return res.data
}