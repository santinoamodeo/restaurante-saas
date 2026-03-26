'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, removeToken } from '@/lib/auth'
import { setAuthToken, getTenants, createTenant, toggleTenant, updateTenant } from '@/lib/api'

interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  is_active: boolean
  created_at: string
  total_orders: number
  owner_email: string | null
  owner_name: string | null
  owner_phone: string | null
  billing_day: number | null
  internal_notes: string | null
  plan_price: number
}

interface ServiceStatus {
  name: string
  url: string
  displayUrl: string
  status: 'ok' | 'error' | 'checking' | 'idle'
  latency: number | null
  checkedAt: Date | null
  error: string | null
}

interface DrawerEdit {
  plan: string
  billing_day: string
  plan_price: string
  internal_notes: string
  owner_name: string
  owner_phone: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ tenant_name: '', tenant_slug: '', admin_email: '', admin_password: '' })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Backend', url: 'https://restaurante-saas-production-136b.up.railway.app/health', displayUrl: 'railway.app', status: 'idle', latency: null, checkedAt: null, error: null },
    { name: 'Web pública', url: 'https://trayly.com.ar/mi-restaurante-2', displayUrl: 'trayly.com.ar', status: 'idle', latency: null, checkedAt: null, error: null },
    { name: 'Admin panel', url: 'https://admin.trayly.com.ar', displayUrl: 'admin.trayly.com.ar', status: 'idle', latency: null, checkedAt: null, error: null },
  ])
  const [checking, setChecking] = useState(false)

  const [drawerTenant, setDrawerTenant] = useState<Tenant | null>(null)
  const [drawerEdit, setDrawerEdit] = useState<DrawerEdit>({ plan: '', billing_day: '', plan_price: '', internal_notes: '', owner_name: '', owner_phone: '' })
  const [drawerSaving, setDrawerSaving] = useState(false)
  const [drawerSaved, setDrawerSaved] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/'); return }
    setAuthToken(token)
    loadTenants()
  }, [])

  async function checkService(svc: ServiceStatus): Promise<ServiceStatus> {
    const start = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    try {
      const fetchOpts: RequestInit = { signal: controller.signal }
      // Use no-cors for external sites that don't allow our origin
      if (!svc.url.includes('railway.app')) fetchOpts.mode = 'no-cors'
      const res = await fetch(svc.url, fetchOpts)
      clearTimeout(timer)
      const latency = Date.now() - start
      // no-cors gives opaque response (status 0) — treat as ok if no throw
      const ok = res.type === 'opaque' || res.ok
      return { ...svc, status: ok ? 'ok' : 'error', latency, checkedAt: new Date(), error: ok ? null : `HTTP ${res.status}` }
    } catch (e: any) {
      clearTimeout(timer)
      return { ...svc, status: 'error', latency: null, checkedAt: new Date(), error: e?.name === 'AbortError' ? 'Timeout (10s)' : e?.message ?? 'Error' }
    }
  }

  async function checkAllServices() {
    setChecking(true)
    setServices(prev => prev.map(s => ({ ...s, status: 'checking' as const })))
    const results = await Promise.all(services.map(checkService))
    setServices(results)
    setChecking(false)
  }

  useEffect(() => {
    checkAllServices()
    const interval = setInterval(checkAllServices, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function loadTenants() {
    try {
      const data = await getTenants()
      setTenants(data)
    } catch {
      removeToken(); router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setFormError(''); setFormSuccess('')
    try {
      await createTenant(form)
      setFormSuccess(`Restaurante "${form.tenant_name}" creado correctamente`)
      setForm({ tenant_name: '', tenant_slug: '', admin_email: '', admin_password: '' })
      await loadTenants()
      setTimeout(() => { setShowForm(false); setFormSuccess('') }, 2000)
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Error al crear el restaurante')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(id: string) {
    await toggleTenant(id)
    await loadTenants()
  }

  function openDrawer(t: Tenant) {
    setDrawerTenant(t)
    setDrawerEdit({
      plan: t.plan,
      billing_day: t.billing_day != null ? String(t.billing_day) : '',
      plan_price: String(t.plan_price),
      internal_notes: t.internal_notes ?? '',
      owner_name: t.owner_name ?? '',
      owner_phone: t.owner_phone ?? '',
    })
    setDrawerSaved(false)
  }

  async function handleDrawerSave() {
    if (!drawerTenant) return
    setDrawerSaving(true)
    try {
      await updateTenant(drawerTenant.id, {
        plan: drawerEdit.plan,
        billing_day: drawerEdit.billing_day ? parseInt(drawerEdit.billing_day) : undefined,
        plan_price: drawerEdit.plan_price ? parseInt(drawerEdit.plan_price) : 0,
        internal_notes: drawerEdit.internal_notes,
        owner_name: drawerEdit.owner_name,
        owner_phone: drawerEdit.owner_phone,
      })
      await loadTenants()
      setDrawerSaved(true)
      setTimeout(() => setDrawerSaved(false), 2500)
    } finally {
      setDrawerSaving(false)
    }
  }

  const fmt = (s: string) => new Date(s).toLocaleDateString('es-AR')
  const active = tenants.filter(t => t.is_active).length
  const totalOrders = tenants.reduce((s, t) => s + t.total_orders, 0)
  const mrr = tenants.filter(t => t.is_active).reduce((s, t) => s + (t.plan_price || 0), 0)

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --ac: #6366f1; --ac-dim: rgba(99,102,241,0.12); --bg: #0C0C0C; --bg2: #141414; --bg3: #1C1C1C; --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.12); --txt: #fff; --txt2: rgba(255,255,255,0.45); --txt3: rgba(255,255,255,0.2); }

    .root { min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }

    .nav { background: rgba(12,12,12,0.92); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
    .nav-in { max-width: 1100px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; height: 56px; }
    .nav-left { display: flex; align-items: center; gap: 10px; }
    .nav-logo { width: 30px; height: 30px; background: var(--ac-dim); border: 1px solid rgba(99,102,241,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .nav-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--txt); }
    .nav-badge { font-size: 10px; background: var(--ac-dim); color: #818cf8; border: 1px solid rgba(99,102,241,0.2); padding: 3px 8px; border-radius: 100px; letter-spacing: 0.08em; text-transform: uppercase; }
    .nav-exit { padding: 6px 12px; border-radius: 8px; font-size: 13px; color: var(--txt3); cursor: pointer; border: none; background: transparent; font-family: 'Inter', sans-serif; transition: all 0.15s; }
    .nav-exit:hover { color: #f87171; background: rgba(239,68,68,0.08); }

    .body { max-width: 1100px; margin: 0 auto; padding: 28px 20px 60px; }

    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .stat { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
    .stat-label { font-size: 11px; color: var(--txt3); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 10px; }
    .stat-val { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -1px; }
    .indigo { color: #818cf8; }
    .green { color: #22c55e; }
    .white { color: var(--txt); }
    .emerald { color: #34d399; }

    .toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .toolbar-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--txt); }
    .btn-new { background: var(--ac); color: #fff; border: none; border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 600; font-family: 'Syne', sans-serif; cursor: pointer; transition: filter 0.15s; display: flex; align-items: center; gap: 6px; }
    .btn-new:hover { filter: brightness(1.1); }

    .form-card { background: var(--bg2); border: 1px solid rgba(99,102,241,0.15); border-radius: 18px; padding: 24px; margin-bottom: 20px; }
    .form-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--txt); margin-bottom: 20px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { margin-bottom: 0; }
    .form-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt3); display: block; margin-bottom: 6px; }
    .form-input { width: 100%; background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 11px 13px; font-size: 14px; color: var(--txt); font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.18s; }
    .form-input:focus { border-color: var(--ac); }
    .form-input::placeholder { color: var(--txt3); }
    .form-actions { display: flex; gap: 8px; margin-top: 16px; }
    .form-save { flex: 1; background: var(--ac); color: #fff; border: none; border-radius: 10px; padding: 12px; font-size: 14px; font-weight: 600; font-family: 'Syne', sans-serif; cursor: pointer; transition: filter 0.15s; }
    .form-save:hover { filter: brightness(1.1); }
    .form-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .form-cancel { padding: 12px 16px; border-radius: 10px; font-size: 14px; color: var(--txt3); cursor: pointer; border: 1px solid var(--border); background: transparent; font-family: 'Inter', sans-serif; transition: all 0.15s; }
    .form-cancel:hover { color: var(--txt2); border-color: var(--border2); }
    .form-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 9px; padding: 9px 13px; font-size: 13px; color: #f87171; margin-top: 12px; }
    .form-success { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 9px; padding: 9px 13px; font-size: 13px; color: #22c55e; margin-top: 12px; }

    .table-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }
    .table-head { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 80px 90px; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--border); }
    .th { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--txt3); font-weight: 500; }

    .row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 80px 90px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); align-items: center; transition: background 0.15s; }
    .row:last-child { border-bottom: none; }
    .row:hover { background: rgba(255,255,255,0.02); }
    .row.inactive { opacity: 0.45; }

    .r-name { font-size: 14px; font-weight: 500; color: var(--txt); }
    .r-slug { font-size: 12px; color: var(--txt3); margin-top: 2px; }
    .r-plan { font-size: 12px; background: var(--bg3); color: var(--txt2); padding: 3px 9px; border-radius: 6px; display: inline-block; }
    .r-orders { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 600; color: var(--txt); }
    .r-date { font-size: 12px; color: var(--txt3); }

    .toggle-on { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; white-space: nowrap; }
    .toggle-on:hover { background: rgba(34,197,94,0.15); }
    .toggle-off { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; background: rgba(239,68,68,0.08); color: #f87171; border: 1px solid rgba(239,68,68,0.2); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; white-space: nowrap; }
    .toggle-off:hover { background: rgba(239,68,68,0.12); }

    .btn-detail { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; background: var(--ac-dim); color: #818cf8; border: 1px solid rgba(99,102,241,0.2); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; white-space: nowrap; }
    .btn-detail:hover { background: rgba(99,102,241,0.18); }

    .empty { padding: 60px 20px; text-align: center; color: var(--txt3); font-size: 14px; }
    .empty-icon { font-size: 32px; margin-bottom: 10px; opacity: 0.3; }

    .LD { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
    .ring { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.06); border-top-color: var(--ac); border-radius: 50%; animation: spin 0.65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg) } }

    /* ── Drawer ── */
    .drw-ov { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
    .drw { position: fixed; top: 0; right: 0; bottom: 0; z-index: 101; width: 440px; max-width: 100vw; background: var(--bg2); border-left: 1px solid var(--border); display: flex; flex-direction: column; animation: sldin .22s ease; overflow: hidden; }
    @keyframes sldin { from { transform: translateX(100%) } to { transform: translateX(0) } }

    .drw-header { padding: 20px 22px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; }
    .drw-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: var(--txt); }
    .drw-slug { font-size: 12px; color: var(--txt3); margin-top: 3px; }
    .drw-close { background: none; border: none; color: var(--txt3); font-size: 18px; cursor: pointer; padding: 2px 6px; border-radius: 6px; transition: all 0.15s; line-height: 1; }
    .drw-close:hover { color: var(--txt); background: rgba(255,255,255,0.06); }

    .drw-body { flex: 1; overflow-y: auto; padding: 20px 22px; display: flex; flex-direction: column; gap: 20px; }
    .drw-body::-webkit-scrollbar { width: 4px; }
    .drw-body::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

    .drw-section { display: flex; flex-direction: column; gap: 12px; }
    .drw-section-title { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt3); padding-bottom: 8px; border-bottom: 1px solid var(--border); }

    .drw-links { display: flex; gap: 8px; flex-wrap: wrap; }
    .drw-link { display: inline-flex; align-items: center; gap: 5px; padding: 7px 13px; border-radius: 9px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.15s; border: 1px solid var(--border); color: var(--txt2); background: var(--bg3); cursor: pointer; }
    .drw-link:hover { color: var(--txt); border-color: var(--border2); }

    .drw-info-row { display: flex; justify-content: space-between; align-items: center; }
    .drw-info-label { font-size: 12px; color: var(--txt3); }
    .drw-info-val { font-size: 13px; color: var(--txt2); font-weight: 500; }

    .drw-field { display: flex; flex-direction: column; gap: 5px; }
    .drw-field-label { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--txt3); }
    .drw-input { background: var(--bg3); border: 1px solid var(--border); border-radius: 9px; padding: 9px 12px; font-size: 13px; color: var(--txt); font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.15s; width: 100%; }
    .drw-input:focus { border-color: rgba(99,102,241,0.4); }
    .drw-input::placeholder { color: var(--txt3); }
    .drw-select { background: var(--bg3); border: 1px solid var(--border); border-radius: 9px; padding: 9px 12px; font-size: 13px; color: var(--txt); font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.15s; width: 100%; cursor: pointer; }
    .drw-select:focus { border-color: rgba(99,102,241,0.4); }
    .drw-textarea { background: var(--bg3); border: 1px solid var(--border); border-radius: 9px; padding: 9px 12px; font-size: 13px; color: var(--txt); font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.15s; width: 100%; resize: vertical; min-height: 80px; }
    .drw-textarea:focus { border-color: rgba(99,102,241,0.4); }
    .drw-textarea::placeholder { color: var(--txt3); }
    .drw-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    .drw-mrr { background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.15); border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
    .drw-mrr-label { font-size: 11px; color: rgba(52,211,153,0.7); text-transform: uppercase; letter-spacing: 0.06em; }
    .drw-mrr-val { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #34d399; }

    .drw-footer { padding: 16px 22px; border-top: 1px solid var(--border); flex-shrink: 0; }
    .drw-save { width: 100%; background: var(--ac); color: #fff; border: none; border-radius: 10px; padding: 12px; font-size: 14px; font-weight: 600; font-family: 'Syne', sans-serif; cursor: pointer; transition: all 0.15s; }
    .drw-save:hover { filter: brightness(1.1); }
    .drw-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .drw-saved { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); width: 100%; border-radius: 10px; padding: 12px; font-size: 14px; font-weight: 600; font-family: 'Syne', sans-serif; text-align: center; }

    /* ── Monitor ── */
    .monitor-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
    .monitor-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--txt2); text-transform: uppercase; letter-spacing: 0.06em; }
    .monitor-meta { font-size: 11px; color: var(--txt3); }
    .btn-check { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: 'Syne', sans-serif; border: 1px solid var(--border); background: transparent; color: var(--txt2); cursor: pointer; transition: all 0.15s; }
    .btn-check:hover { color: var(--txt); border-color: var(--border2); }
    .btn-check:disabled { opacity: 0.4; cursor: not-allowed; }

    .svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 28px; }
    .svc-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; transition: border-color 0.2s; }
    .svc-card.ok    { border-color: rgba(34,197,94,0.2); }
    .svc-card.error { border-color: rgba(239,68,68,0.25); }
    .svc-card.checking { border-color: rgba(99,102,241,0.2); }
    .svc-top { display: flex; align-items: center; justify-content: space-between; }
    .svc-name { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--txt); }
    .svc-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .svc-dot.ok      { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5); }
    .svc-dot.error   { background: #f87171; box-shadow: 0 0 6px rgba(239,68,68,0.5); }
    .svc-dot.checking { background: #818cf8; animation: pulse 1s ease-in-out infinite; }
    .svc-dot.idle    { background: var(--txt3); }
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
    .svc-url { font-size: 11px; color: var(--txt3); }
    .svc-status-txt { font-size: 12px; font-weight: 500; }
    .svc-status-txt.ok      { color: #22c55e; }
    .svc-status-txt.error   { color: #f87171; }
    .svc-status-txt.checking { color: #818cf8; }
    .svc-status-txt.idle    { color: var(--txt3); }
    .svc-latency { font-size: 11px; color: var(--txt3); }
    .svc-time { font-size: 10px; color: var(--txt3); }

    @media (max-width: 900px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .svc-grid { grid-template-columns: 1fr; }
      .table-head { display: none; }
      .row { grid-template-columns: 1fr auto; grid-template-rows: auto auto; }
      .drw { width: 100vw; }
    }
    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
    }
  `

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="LD"><div className="ring" /></div>
    </>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="root">
        <nav className="nav">
          <div className="nav-in">
            <div className="nav-left">
              <div className="nav-logo">⚡</div>
              <span className="nav-title">Super Admin</span>
              <span className="nav-badge">Trayly</span>
            </div>
            <button className="nav-exit" onClick={() => { removeToken(); router.push('/') }}>Salir</button>
          </div>
        </nav>

        <div className="body">
          <div className="stats">
            <div className="stat">
              <p className="stat-label">Restaurantes activos</p>
              <p className="stat-val indigo">{active}</p>
            </div>
            <div className="stat">
              <p className="stat-label">Total pedidos</p>
              <p className="stat-val green">{totalOrders}</p>
            </div>
            <div className="stat">
              <p className="stat-label">Total clientes</p>
              <p className="stat-val white">{tenants.length}</p>
            </div>
            <div className="stat">
              <p className="stat-label">MRR</p>
              <p className="stat-val emerald">${mrr.toLocaleString('es-AR')}</p>
            </div>
          </div>

          {/* Monitoreo */}
          <div className="monitor-bar">
            <span className="monitor-title">Estado de servicios</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {services[0].checkedAt && (
                <span className="monitor-meta">
                  Última verificación: {services[0].checkedAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
              <button className="btn-check" onClick={checkAllServices} disabled={checking}>
                {checking ? '↻ Verificando...' : '↻ Verificar ahora'}
              </button>
            </div>
          </div>
          <div className="svc-grid">
            {services.map(svc => (
              <div key={svc.name} className={`svc-card ${svc.status}`}>
                <div className="svc-top">
                  <span className="svc-name">{svc.name}</span>
                  <span className={`svc-dot ${svc.status}`} />
                </div>
                <span className="svc-url">{svc.displayUrl}</span>
                <span className={`svc-status-txt ${svc.status}`}>
                  {svc.status === 'ok' && 'Operativo'}
                  {svc.status === 'error' && (svc.error ?? 'Error')}
                  {svc.status === 'checking' && 'Verificando...'}
                  {svc.status === 'idle' && 'Sin verificar'}
                </span>
                {svc.latency != null && <span className="svc-latency">{svc.latency} ms</span>}
                {svc.checkedAt && (
                  <span className="svc-time">
                    {svc.checkedAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="toolbar">
            <h2 className="toolbar-title">Restaurantes</h2>
            <button className="btn-new" onClick={() => setShowForm(!showForm)}>
              + Nuevo restaurante
            </button>
          </div>

          {showForm && (
            <div className="form-card">
              <p className="form-title">Crear nuevo restaurante</p>
              <form onSubmit={handleCreate}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombre del restaurante</label>
                    <input className="form-input" placeholder="La Trattoria" value={form.tenant_name} onChange={e => setForm({ ...form, tenant_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Slug (URL)</label>
                    <input className="form-input" placeholder="la-trattoria" value={form.tenant_slug} onChange={e => setForm({ ...form, tenant_slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email del admin</label>
                    <input className="form-input" type="email" placeholder="admin@latrattoria.com" value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña del admin</label>
                    <input className="form-input" type="password" placeholder="••••••••" value={form.admin_password} onChange={e => setForm({ ...form, admin_password: e.target.value })} required />
                  </div>
                </div>
                {formError && <div className="form-error">{formError}</div>}
                {formSuccess && <div className="form-success">{formSuccess}</div>}
                <div className="form-actions">
                  <button className="form-save" type="submit" disabled={saving}>
                    {saving ? 'Creando...' : 'Crear restaurante'}
                  </button>
                  <button className="form-cancel" type="button" onClick={() => { setShowForm(false); setFormError(''); setFormSuccess('') }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="table-card">
            <div className="table-head">
              <span className="th">Restaurante</span>
              <span className="th">Plan</span>
              <span className="th">Pedidos</span>
              <span className="th">Creado</span>
              <span className="th">Estado</span>
              <span className="th">Detalle</span>
            </div>
            {tenants.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🍽️</div>
                Sin restaurantes todavía
              </div>
            ) : tenants.map(t => (
              <div key={t.id} className={`row${!t.is_active ? ' inactive' : ''}`}>
                <div>
                  <p className="r-name">{t.name}</p>
                  <p className="r-slug">/{t.slug}</p>
                </div>
                <span className="r-plan">{t.plan}</span>
                <span className="r-orders">{t.total_orders}</span>
                <span className="r-date">{fmt(t.created_at)}</span>
                <button
                  className={t.is_active ? 'toggle-on' : 'toggle-off'}
                  onClick={() => handleToggle(t.id)}
                >
                  {t.is_active ? 'Activo' : 'Inactivo'}
                </button>
                <button className="btn-detail" onClick={() => openDrawer(t)}>
                  Ver detalle
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {drawerTenant && (
        <>
          <div className="drw-ov" onClick={() => setDrawerTenant(null)} />
          <div className="drw">
            <div className="drw-header">
              <div>
                <p className="drw-title">{drawerTenant.name}</p>
                <p className="drw-slug">/{drawerTenant.slug}</p>
              </div>
              <button className="drw-close" onClick={() => setDrawerTenant(null)}>✕</button>
            </div>

            <div className="drw-body">

              {/* Info del restaurante */}
              <div className="drw-section">
                <p className="drw-section-title">Restaurante</p>
                <div className="drw-links">
                  <a className="drw-link" href={`https://trayly.com.ar/${drawerTenant.slug}`} target="_blank" rel="noreferrer">
                    🌐 Ver menú
                  </a>
                  <a className="drw-link" href="https://admin.trayly.com.ar" target="_blank" rel="noreferrer">
                    ⚙️ Panel admin
                  </a>
                </div>
                <div className="drw-info-row">
                  <span className="drw-info-label">Estado</span>
                  <span className="drw-info-val" style={{ color: drawerTenant.is_active ? '#22c55e' : '#f87171' }}>
                    {drawerTenant.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="drw-info-row">
                  <span className="drw-info-label">Alta</span>
                  <span className="drw-info-val">{fmt(drawerTenant.created_at)}</span>
                </div>
                <div className="drw-info-row">
                  <span className="drw-info-label">Pedidos totales</span>
                  <span className="drw-info-val">{drawerTenant.total_orders}</span>
                </div>
                <div className="drw-field">
                  <label className="drw-field-label">Plan</label>
                  <select className="drw-select" value={drawerEdit.plan} onChange={e => setDrawerEdit({ ...drawerEdit, plan: e.target.value })}>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </div>

              {/* Datos del dueño */}
              <div className="drw-section">
                <p className="drw-section-title">Dueño</p>
                <div className="drw-info-row">
                  <span className="drw-info-label">Email</span>
                  <span className="drw-info-val">{drawerTenant.owner_email ?? '—'}</span>
                </div>
                <div className="drw-field">
                  <label className="drw-field-label">Nombre</label>
                  <input className="drw-input" placeholder="Nombre completo" value={drawerEdit.owner_name} onChange={e => setDrawerEdit({ ...drawerEdit, owner_name: e.target.value })} />
                </div>
                <div className="drw-field">
                  <label className="drw-field-label">Teléfono</label>
                  <input className="drw-input" placeholder="+54 9 11 ..." value={drawerEdit.owner_phone} onChange={e => setDrawerEdit({ ...drawerEdit, owner_phone: e.target.value })} />
                </div>
              </div>

              {/* Facturación */}
              <div className="drw-section">
                <p className="drw-section-title">Facturación</p>
                <div className="drw-row2">
                  <div className="drw-field">
                    <label className="drw-field-label">Día de cobro</label>
                    <input className="drw-input" type="number" min="1" max="31" placeholder="Ej: 5" value={drawerEdit.billing_day} onChange={e => setDrawerEdit({ ...drawerEdit, billing_day: e.target.value })} />
                  </div>
                  <div className="drw-field">
                    <label className="drw-field-label">Precio del plan ($)</label>
                    <input className="drw-input" type="number" min="0" placeholder="0" value={drawerEdit.plan_price} onChange={e => setDrawerEdit({ ...drawerEdit, plan_price: e.target.value })} />
                  </div>
                </div>
                <div className="drw-mrr">
                  <span className="drw-mrr-label">MRR este cliente</span>
                  <span className="drw-mrr-val">${(parseInt(drawerEdit.plan_price) || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* Notas internas */}
              <div className="drw-section">
                <p className="drw-section-title">Notas internas</p>
                <textarea
                  className="drw-textarea"
                  placeholder="Notas internas sobre este cliente..."
                  value={drawerEdit.internal_notes}
                  onChange={e => setDrawerEdit({ ...drawerEdit, internal_notes: e.target.value })}
                />
              </div>

            </div>

            <div className="drw-footer">
              {drawerSaved
                ? <div className="drw-saved">✓ Cambios guardados</div>
                : (
                  <button className="drw-save" onClick={handleDrawerSave} disabled={drawerSaving}>
                    {drawerSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                )
              }
            </div>
          </div>
        </>
      )}
    </>
  )
}
