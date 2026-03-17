'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, removeToken } from '@/lib/auth'
import {
  setAuthToken, getCategories, createCategory, deleteCategory,
  getItems, createItem, updateItem, deleteItem
} from '@/lib/api'

interface Category { id: string; name: string; order_index: number; is_active: boolean }
interface MenuItem { id: string; category_id: string; name: string; description: string | null; price: string; image_url: string | null; is_available: boolean; order_index: number }

const LIGHT_THEME: Record<string, string> = {
  '--bg': '#FAFAFA', '--bg2': '#FFFFFF', '--bg3': '#F0F0F0',
  '--border': 'rgba(0,0,0,0.08)', '--border2': 'rgba(0,0,0,0.15)',
  '--txt': '#1a1a1a', '--txt2': 'rgba(0,0,0,0.5)', '--txt3': 'rgba(0,0,0,0.3)',
}
const DARK_THEME: Record<string, string> = {
  '--bg': '#0C0C0C', '--bg2': '#141414', '--bg3': '#1C1C1C',
  '--border': 'rgba(255,255,255,0.07)', '--border2': 'rgba(255,255,255,0.12)',
  '--txt': '#FFFFFF', '--txt2': 'rgba(255,255,255,0.45)', '--txt3': 'rgba(255,255,255,0.2)',
}
function applyTheme(isDark: boolean) {
  const vars = isDark ? DARK_THEME : LIGHT_THEME
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  localStorage.setItem('eatly_theme', isDark ? 'dark' : 'light')
}

export default function MenuPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dark, setDark] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [showCatForm, setShowCatForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [catName, setCatName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadItemIdRef = useRef<string | null>(null)
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', is_available: true, order_index: 0 })

  useEffect(() => {
    const saved = localStorage.getItem('eatly_theme')
    const isDark = saved !== 'light'
    setDark(isDark)
    applyTheme(isDark)
  }, [])

  function toggleTheme() { const next = !dark; setDark(next); applyTheme(next) }

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/'); return }
    setAuthToken(token)
    loadData()
    import('@/lib/api').then(({ api }) =>
      api.get('/api/v1/admin/config').then(res => {
        const url = res.data.logo_url
        if (url) {
          setLogoUrl(url)
          const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') || document.createElement('link')
          link.rel = 'icon'
          link.href = url
          document.head.appendChild(link)
        }
      }).catch(() => {})
    )
  }, [])

  async function loadData() {
    try {
      const [cats, its] = await Promise.all([getCategories(), getItems()])
      setCategories(cats)
      setItems(its)
      if (cats.length > 0 && !activeCategory) setActiveCategory(cats[0].id)
    } catch {
      removeToken(); router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCategory() {
    if (!catName.trim()) return
    setSaving(true)
    await createCategory({ name: catName, order_index: categories.length })
    setCatName(''); setShowCatForm(false); setSaving(false)
    await loadData()
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('¿Eliminar categoría?')) return
    await deleteCategory(id); await loadData()
  }

  async function handleSaveItem() {
    if (!itemForm.name || !itemForm.price) return
    setSaving(true)
    const payload = { category_id: activeCategory, name: itemForm.name, description: itemForm.description || undefined, price: parseFloat(itemForm.price), is_available: itemForm.is_available, order_index: itemForm.order_index }
    if (editingItem) await updateItem(editingItem.id, payload)
    else await createItem(payload)
    resetItemForm(); setSaving(false); await loadData()
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('¿Eliminar item?')) return
    await deleteItem(id); await loadData()
  }

  async function handleToggle(item: MenuItem) {
    await updateItem(item.id, { is_available: !item.is_available }); await loadData()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const itemId = uploadItemIdRef.current
    if (!file || !itemId) return
    setUploadingId(itemId)
    try {
      const { uploadItemImage } = await import('@/lib/api')
      await uploadItemImage(itemId, file)
      await loadData()
    } finally {
      setUploadingId(null)
      uploadItemIdRef.current = null
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item)
    setItemForm({ name: item.name, description: item.description || '', price: item.price, is_available: item.is_available, order_index: item.order_index })
    setShowItemForm(true)
  }

  function resetItemForm() {
    setEditingItem(null)
    setItemForm({ name: '', description: '', price: '', is_available: true, order_index: 0 })
    setShowItemForm(false)
  }

  const fmt = (n: string | number) => parseFloat(String(n)).toLocaleString('es-AR')
  const categoryItems = items.filter(i => i.category_id === activeCategory)

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0C0C0C; --bg2: #141414; --bg3: #1C1C1C;
      --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.12);
      --txt: #FFFFFF; --txt2: rgba(255,255,255,0.45); --txt3: rgba(255,255,255,0.2);
      --ac: #E85D04; --ac-dim: rgba(232,93,4,0.12);
    }

    .M-root { min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }

    .M-nav { background: rgba(12,12,12,0.9); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
    .M-nav-in { max-width: 900px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; height: 58px; }
    .M-nav-left { display: flex; align-items: center; gap: 10px; }
    .M-nav-back { width: 32px; height: 32px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--txt2); font-size: 14px; transition: all 0.15s; }
    .M-nav-back:hover { color: var(--txt); border-color: var(--border2); }
    .M-nav-logo { width: 32px; height: 32px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
    .M-nav-logo img { width: 100%; height: 100%; object-fit: contain; }
    .M-nav-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--txt); }
    .M-nav-exit { padding: 6px 12px; border-radius: 8px; font-size: 13px; color: var(--txt3); cursor: pointer; transition: all 0.15s; border: none; background: transparent; font-family: 'Inter', sans-serif; }
    .M-nav-exit:hover { color: #f87171; background: rgba(239,68,68,0.08); }
    .M-theme-btn {
      width: 32px; height: 32px; border-radius: 8px;
      background: var(--bg3); border: 1px solid var(--border);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 15px; transition: all 0.15s; flex-shrink: 0;
    }
    .M-theme-btn:hover { border-color: var(--border2); }
    .M-burger { display: none; background: none; border: none; color: var(--txt); font-size: 20px; cursor: pointer; padding: 4px 8px; line-height: 1; }
    .M-drawer-ov { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
    .M-drawer { position: fixed; top: 0; right: 0; bottom: 0; z-index: 201; width: 220px; background: #141414; border-left: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; padding: 20px 12px; gap: 4px; animation: mdrw .2s ease; }
    @keyframes mdrw { from { transform: translateX(100%) } to { transform: translateX(0) } }
    .M-drawer-link { padding: 12px 14px; border-radius: 10px; font-size: 14px; color: var(--txt2); cursor: pointer; background: none; border: none; font-family: 'Inter', sans-serif; text-align: left; width: 100%; transition: all 0.15s; }
    .M-drawer-link:hover { color: var(--txt); background: rgba(255,255,255,0.06); }
    .M-drawer-exit { color: #f87171; }
    .M-drawer-exit:hover { background: rgba(239,68,68,0.08) !important; }
    @media (max-width: 640px) {
      .M-nav-exit { display: none; }
      .M-burger { display: block; }
    }

    .M-body { max-width: 900px; margin: 0 auto; padding: 24px 16px 60px; display: grid; grid-template-columns: 220px 1fr; gap: 16px; }

    .M-cats { background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; height: fit-content; }
    .M-cats-head { padding: 14px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
    .M-cats-title { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--txt3); font-weight: 500; }
    .M-cats-add { width: 26px; height: 26px; background: var(--ac); border: none; border-radius: 7px; color: #fff; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: filter 0.15s; }
    .M-cats-add:hover { filter: brightness(1.1); }

    .M-cat-form { padding: 10px 12px; border-bottom: 1px solid var(--border); display: flex; gap: 6px; }
    .M-cat-input { flex: 1; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px; font-size: 13px; color: var(--txt); font-family: 'Inter', sans-serif; outline: none; }
    .M-cat-input:focus { border-color: var(--ac); }
    .M-cat-input::placeholder { color: var(--txt3); }
    .M-cat-ok { padding: 7px 10px; background: var(--ac); border: none; border-radius: 8px; color: #fff; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }

    .M-cat-item { padding: 11px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .M-cat-item:last-child { border-bottom: none; }
    .M-cat-item:hover { background: rgba(255,255,255,0.03); }
    .M-cat-item.on { background: var(--ac-dim); }
    .M-cat-name { font-size: 14px; color: var(--txt2); transition: color 0.15s; }
    .M-cat-item.on .M-cat-name { color: var(--ac); font-weight: 500; }
    .M-cat-del { color: var(--txt3); font-size: 12px; cursor: pointer; padding: 2px 4px; border-radius: 4px; transition: all 0.15s; }
    .M-cat-del:hover { color: #f87171; background: rgba(239,68,68,0.1); }

    .M-items { background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }
    .M-items-head { padding: 14px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
    .M-items-title { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--txt3); font-weight: 500; }
    .M-items-add { padding: 6px 14px; background: var(--ac); border: none; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; transition: filter 0.15s; }
    .M-items-add:hover { filter: brightness(1.1); }

    .M-item-form { padding: 16px; border-bottom: 1px solid var(--border); background: rgba(232,93,4,0.04); }
    .M-form-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--txt); margin-bottom: 14px; }
    .M-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .M-form-group { margin-bottom: 10px; }
    .M-form-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt3); display: block; margin-bottom: 6px; }
    .M-form-input { width: 100%; background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 11px 13px; font-size: 14px; color: var(--txt); font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.18s; }
    .M-form-input:focus { border-color: var(--ac); }
    .M-form-input::placeholder { color: var(--txt3); }
    .M-form-ta { resize: none; height: 70px; }
    .M-form-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--txt2); cursor: pointer; margin-bottom: 14px; }
    .M-form-actions { display: flex; gap: 8px; }
    .M-form-save { flex: 1; background: var(--ac); color: #fff; border: none; border-radius: 10px; padding: 11px; font-size: 13px; font-weight: 600; font-family: 'Syne', sans-serif; cursor: pointer; transition: filter 0.15s; }
    .M-form-save:hover { filter: brightness(1.1); }
    .M-form-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .M-form-cancel { padding: 11px 14px; border-radius: 10px; font-size: 13px; color: var(--txt3); cursor: pointer; border: 1px solid var(--border); background: transparent; font-family: 'Inter', sans-serif; transition: all 0.15s; }
    .M-form-cancel:hover { color: var(--txt2); border-color: var(--border2); }

    .M-item { padding: 14px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; }
    .M-item:last-child { border-bottom: none; }
    .M-item:hover { background: rgba(255,255,255,0.02); }

    .M-item-img { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; flex-shrink: 0; cursor: pointer; transition: opacity 0.15s; }
    .M-item-img:hover { opacity: 0.8; }
    .M-item-ph { width: 52px; height: 52px; border-radius: 10px; background: var(--bg3); border: 1px dashed rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--txt3); font-size: 18px; cursor: pointer; transition: all 0.15s; }
    .M-item-ph:hover { border-color: var(--ac); color: var(--ac); }

    .M-item-info { flex: 1; min-width: 0; }
    .M-item-name { font-size: 14px; font-weight: 500; color: var(--txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
    .M-item-desc { font-size: 12px; color: var(--txt3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
    .M-item-price { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--ac); }

    .M-unavailable { font-size: 10px; background: rgba(255,255,255,0.06); color: var(--txt3); padding: 2px 7px; border-radius: 100px; display: inline-block; margin-left: 6px; vertical-align: middle; }

    .M-item-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .M-ia-btn { width: 30px; height: 30px; border-radius: 8px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: background 0.15s; color: var(--txt2); }
    .M-ia-btn:hover { background: rgba(255,255,255,0.08); }
    .M-ia-toggle { font-size: 11px; padding: 4px 9px; border-radius: 6px; border: none; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
    .M-ia-toggle.on { background: rgba(34,197,94,0.1); color: #22c55e; }
    .M-ia-toggle.off { background: rgba(255,255,255,0.05); color: var(--txt3); }

    .M-empty { padding: 48px 20px; text-align: center; color: var(--txt3); font-size: 14px; }
    .M-empty-icon { font-size: 32px; margin-bottom: 10px; opacity: 0.3; }

    .LD { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
    .LD-ring { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.06); border-top-color: var(--ac); border-radius: 50%; animation: spin 0.65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg) } }

    @media (max-width: 640px) {
      .M-body { grid-template-columns: 1fr; }
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
      <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      <div className="M-root">
        <nav className="M-nav">
          <div className="M-nav-in">
            <div className="M-nav-left">
              <button className="M-nav-back" onClick={() => router.push('/dashboard')}>←</button>
              {logoUrl && <div className="M-nav-logo"><img src={logoUrl} alt="Logo" /></div>}
              <span className="M-nav-title">Gestión de Menú</span>
            </div>
            <button className="M-nav-exit" onClick={() => { removeToken(); router.push('/') }}>Salir</button>
            <button className="M-theme-btn" onClick={toggleTheme} title="Cambiar tema">{dark ? '☀️' : '🌙'}</button>
            <button className="M-burger" onClick={() => setDrawerOpen(true)}>☰</button>
          </div>
        </nav>

        <div className="M-body">
          {/* Categorías */}
          <div className="M-cats">
            <div className="M-cats-head">
              <span className="M-cats-title">Categorías</span>
              <button className="M-cats-add" onClick={() => setShowCatForm(!showCatForm)}>+</button>
            </div>
            {showCatForm && (
              <div className="M-cat-form">
                <input
                  className="M-cat-input" placeholder="Nombre..."
                  value={catName} onChange={e => setCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                  autoFocus
                />
                <button className="M-cat-ok" onClick={handleCreateCategory}>✓</button>
              </div>
            )}
            {categories.map(cat => (
              <div key={cat.id} className={`M-cat-item${activeCategory === cat.id ? ' on' : ''}`} onClick={() => setActiveCategory(cat.id)}>
                <span className="M-cat-name">{cat.name}</span>
                <span className="M-cat-del" onClick={e => { e.stopPropagation(); handleDeleteCategory(cat.id) }}>✕</span>
              </div>
            ))}
            {categories.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Sin categorías</div>
            )}
          </div>

          {/* Items */}
          <div className="M-items">
            <div className="M-items-head">
              <span className="M-items-title">
                {categories.find(c => c.id === activeCategory)?.name || 'Items'}
              </span>
              {activeCategory && (
                <button className="M-items-add" onClick={() => { resetItemForm(); setShowItemForm(true) }}>+ Agregar</button>
              )}
            </div>

            {showItemForm && (
              <div className="M-item-form">
                <p className="M-form-title">{editingItem ? 'Editar item' : 'Nuevo item'}</p>
                <div className="M-form-group">
                  <label className="M-form-label">Nombre *</label>
                  <input className="M-form-input" placeholder="Ej: Hamburguesa clásica" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} />
                </div>
                <div className="M-form-group">
                  <label className="M-form-label">Descripción</label>
                  <textarea className="M-form-input M-form-ta" placeholder="Ingredientes, detalles..." value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} />
                </div>
                <div className="M-form-row">
                  <div className="M-form-group">
                    <label className="M-form-label">Precio *</label>
                    <input className="M-form-input" type="number" placeholder="2500" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} />
                  </div>
                  <div className="M-form-group">
                    <label className="M-form-label">Orden</label>
                    <input className="M-form-input" type="number" value={itemForm.order_index} onChange={e => setItemForm({ ...itemForm, order_index: parseInt(e.target.value) })} />
                  </div>
                </div>
                <label className="M-form-check">
                  <input type="checkbox" checked={itemForm.is_available} onChange={e => setItemForm({ ...itemForm, is_available: e.target.checked })} style={{ accentColor: 'var(--ac)' }} />
                  Disponible
                </label>
                <div className="M-form-actions">
                  <button className="M-form-save" onClick={handleSaveItem} disabled={saving}>
                    {saving ? 'Guardando...' : editingItem ? 'Guardar cambios' : 'Crear item'}
                  </button>
                  <button className="M-form-cancel" onClick={resetItemForm}>Cancelar</button>
                </div>
              </div>
            )}

            {categoryItems.length === 0 && !showItemForm ? (
              <div className="M-empty">
                <div className="M-empty-icon">🍽️</div>
                {activeCategory ? 'Sin items en esta categoría' : 'Seleccioná una categoría'}
              </div>
            ) : categoryItems.map(item => (
              <div key={item.id} className="M-item">
                {uploadingId === item.id ? (
                  <div className="M-item-ph" style={{ fontSize: 12, color: 'var(--ac)' }}>⟳</div>
                ) : item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="M-item-img" onClick={() => { uploadItemIdRef.current = item.id; fileRef.current?.click() }} />
                ) : (
                  <div className="M-item-ph" onClick={() => { uploadItemIdRef.current = item.id; fileRef.current?.click() }}>📷</div>
                )}
                <div className="M-item-info">
                  <p className="M-item-name">
                    {item.name}
                    {!item.is_available && <span className="M-unavailable">No disponible</span>}
                  </p>
                  {item.description && <p className="M-item-desc">{item.description}</p>}
                  <p className="M-item-price">${fmt(item.price)}</p>
                </div>
                <div className="M-item-actions">
                  <button className={`M-ia-toggle${item.is_available ? ' on' : ' off'}`} onClick={() => handleToggle(item)}>
                    {item.is_available ? '✓' : '○'}
                  </button>
                  <button className="M-ia-btn" onClick={() => openEditItem(item)}>✏️</button>
                  <button className="M-ia-btn" onClick={() => handleDeleteItem(item.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="M-drawer-ov" onClick={() => setDrawerOpen(false)} />
          <div className="M-drawer">
            <button className="M-drawer-link" onClick={() => { router.push('/dashboard'); setDrawerOpen(false) }}>Pedidos</button>
            <button className="M-drawer-link" onClick={() => { router.push('/dashboard/menu'); setDrawerOpen(false) }}>Menú</button>
            <button className="M-drawer-link" onClick={() => { router.push('/dashboard/qr'); setDrawerOpen(false) }}>QR Mesas</button>
            <button className="M-drawer-link" onClick={() => { router.push('/dashboard/config'); setDrawerOpen(false) }}>Config</button>
            <button className="M-drawer-link M-drawer-exit" onClick={() => { removeToken(); router.push('/') }}>Salir</button>
          </div>
        </>
      )}
    </>
  )
}