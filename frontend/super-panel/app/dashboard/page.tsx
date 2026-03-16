'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, removeToken } from '@/lib/auth'
import { setAuthToken, getTenants, createTenant, toggleTenant } from '@/lib/api'

interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  is_active: boolean
  created_at: string
  total_orders: number
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

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/'); return }
    setAuthToken(token)
    loadTenants()
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

  const fmt = (s: string) => new Date(s).toLocaleDateString('es-AR')
  const active = tenants.filter(t => t.is_active).length
  const totalOrders = tenants.reduce((s, t) => s + t.total_orders, 0)

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --ac: #6366f1; --ac-dim: rgba(99,102,241,0.12); --bg: #0C0C0C; --bg2: #141414; --bg3: #1C1C1C; --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.12); --txt: #fff; --txt2: rgba(255,255,255,0.45); --txt3: rgba(255,255,255,0.2); }

    .root { min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }

    .nav { background: rgba(12,12,12,0.92); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
    .nav-in { max-width: 960px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; height: 56px; }
    .nav-left { display: flex; align-items: center; gap: 10px; }
    .nav-logo { width: 30px; height: 30px; background: var(--ac-dim); border: 1px solid rgba(99,102,241,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .nav-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--txt); }
    .nav-badge { font-size: 10px; background: var(--ac-dim); color: #818cf8; border: 1px solid rgba(99,102,241,0.2); padding: 3px 8px; border-radius: 100px; letter-spacing: 0.08em; text-transform: uppercase; }
    .nav-exit { padding: 6px 12px; border-radius: 8px; font-size: 13px; color: var(--txt3); cursor: pointer; border: none; background: transparent; font-family: 'Inter', sans-serif; transition: all 0.15s; }
    .nav-exit:hover { color: #f87171; background: rgba(239,68,68,0.08); }

    .body { max-width: 960px; margin: 0 auto; padding: 28px 20px 60px; }

    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
    .stat { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
    .stat-label { font-size: 11px; color: var(--txt3); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 10px; }
    .stat-val { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; letter-spacing: -1px; }
    .indigo { color: #818cf8; }
    .green { color: #22c55e; }
    .white { color: var(--txt); }

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
    .table-head { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 80px; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--border); }
    .th { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--txt3); font-weight: 500; }

    .row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 80px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); align-items: center; transition: background 0.15s; }
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

    .empty { padding: 60px 20px; text-align: center; color: var(--txt3); font-size: 14px; }
    .empty-icon { font-size: 32px; margin-bottom: 10px; opacity: 0.3; }

    .LD { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
    .ring { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.06); border-top-color: var(--ac); border-radius: 50%; animation: spin 0.65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg) } }

    @media (max-width: 640px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .stat:last-child { grid-column: span 2; }
      .form-grid { grid-template-columns: 1fr; }
      .table-head { display: none; }
      .row { grid-template-columns: 1fr auto; grid-template-rows: auto auto; }
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
              <span className="nav-badge">RestauranteSaaS</span>
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}