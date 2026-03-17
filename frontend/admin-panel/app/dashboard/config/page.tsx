'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, removeToken } from '@/lib/auth'
import { setAuthToken } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export default function ConfigPage() {
  const router = useRouter()
  const [whatsapp, setWhatsapp] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [bankInfo, setBankInfo] = useState('')
  const [address, setAddress] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#E85D04')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/'); return }
    setAuthToken(token)
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const { api } = await import('@/lib/api')
      const res = await api.get('/api/v1/admin/config')
      setWhatsapp(res.data.whatsapp_number || '')
      setApiKey(res.data.callmebot_api_key || '')
      setBankInfo(res.data.bank_info || '')
      setAddress(res.data.address || '')
      setPrimaryColor(res.data.primary_color || '#E85D04')
      const url = res.data.logo_url || null
      setLogoUrl(url)
      if (url) {
        const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') || document.createElement('link')
        link.rel = 'icon'
        link.href = url
        document.head.appendChild(link)
      }
    } catch {
      removeToken(); router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const { api } = await import('@/lib/api')
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/api/v1/admin/config/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setLogoUrl(res.data.logo_url)
    } catch {
      setError('Error al subir el logo.')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false)
    try {
      const { api } = await import('@/lib/api')
      await api.patch('/api/v1/admin/config', {
        whatsapp_number: whatsapp || null,
        callmebot_api_key: apiKey || null,
        primary_color: primaryColor,
        bank_info: bankInfo || null,
        address: address || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0C0C0C; --bg2: #141414; --bg3: #1C1C1C;
      --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.12);
      --txt: #FFFFFF; --txt2: rgba(255,255,255,0.45); --txt3: rgba(255,255,255,0.2);
      --ac: #E85D04; --ac-dim: rgba(232,93,4,0.12);
    }

    .C-root { min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }

    .C-nav { background: rgba(12,12,12,0.9); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
    .C-nav-in { max-width: 640px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; height: 58px; }
    .C-nav-left { display: flex; align-items: center; gap: 10px; }
    .C-nav-back { width: 32px; height: 32px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--txt2); font-size: 14px; transition: all 0.15s; }
    .C-nav-back:hover { color: var(--txt); border-color: var(--border2); }
    .C-nav-logo { width: 32px; height: 32px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
    .C-nav-logo img { width: 100%; height: 100%; object-fit: contain; }
    .C-nav-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--txt); }
    .C-nav-exit { padding: 6px 12px; border-radius: 8px; font-size: 13px; color: var(--txt3); cursor: pointer; transition: all 0.15s; border: none; background: transparent; font-family: 'Inter', sans-serif; }
    .C-nav-exit:hover { color: #f87171; background: rgba(239,68,68,0.08); }
    .C-burger { display: none; background: none; border: none; color: var(--txt); font-size: 20px; cursor: pointer; padding: 4px 8px; line-height: 1; }
    .C-drawer-ov { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
    .C-drawer { position: fixed; top: 0; right: 0; bottom: 0; z-index: 201; width: 220px; background: #141414; border-left: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; padding: 20px 12px; gap: 4px; animation: cdrw .2s ease; }
    @keyframes cdrw { from { transform: translateX(100%) } to { transform: translateX(0) } }
    .C-drawer-link { padding: 12px 14px; border-radius: 10px; font-size: 14px; color: var(--txt2); cursor: pointer; background: none; border: none; font-family: 'Inter', sans-serif; text-align: left; width: 100%; transition: all 0.15s; }
    .C-drawer-link:hover { color: var(--txt); background: rgba(255,255,255,0.06); }
    .C-drawer-exit { color: #f87171; }
    .C-drawer-exit:hover { background: rgba(239,68,68,0.08) !important; }
    @media (max-width: 640px) {
      .C-nav-exit { display: none; }
      .C-burger { display: block; }
    }

    .C-body { max-width: 640px; margin: 0 auto; padding: 32px 20px 60px; }

    .C-section { background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; padding: 28px; margin-bottom: 16px; }

    .C-section-head { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .C-section-icon { width: 40px; height: 40px; background: var(--ac-dim); border: 1px solid rgba(232,93,4,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .C-section-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: var(--txt); }
    .C-section-sub { font-size: 13px; color: var(--txt3); margin-top: 2px; }

    .C-group { margin-bottom: 16px; }
    .C-label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt3); display: block; margin-bottom: 8px; }
    .C-input { width: 100%; background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; padding: 13px 16px; font-size: 15px; color: var(--txt); font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.18s; }
    .C-input:focus { border-color: var(--ac); }
    .C-input::placeholder { color: var(--txt3); }
    .C-input-hint { font-size: 12px; color: var(--txt3); margin-top: 6px; line-height: 1.5; }
    .C-input-hint a { color: var(--ac); text-decoration: none; }

    .C-divider { height: 1px; background: var(--border); margin: 20px 0; }

    .C-save { width: 100%; background: var(--ac); color: #fff; border: none; border-radius: 12px; padding: 15px; font-size: 15px; font-weight: 600; font-family: 'Syne', sans-serif; cursor: pointer; transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .C-save:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .C-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .C-save.saved { background: #22c55e; }

    .C-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #f87171; margin-bottom: 16px; }

    .C-info { background: var(--bg3); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
    .C-info-title { font-size: 13px; font-weight: 500; color: var(--txt2); margin-bottom: 12px; }
    .C-info-step { display: flex; gap: 10px; margin-bottom: 8px; align-items: flex-start; }
    .C-info-step:last-child { margin-bottom: 0; }
    .C-info-num { width: 20px; height: 20px; background: var(--ac-dim); border: 1px solid rgba(232,93,4,0.2); border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--ac); font-weight: 600; flex-shrink: 0; margin-top: 1px; }
    .C-info-text { font-size: 13px; color: var(--txt3); line-height: 1.5; }
    .C-info-text code { background: rgba(255,255,255,0.07); padding: 1px 6px; border-radius: 4px; font-size: 12px; color: var(--txt2); }

    .C-logo-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .C-logo-preview {
      width: 96px; height: 96px; border-radius: 14px;
      border: 1px solid var(--border); background: var(--bg3);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; flex-shrink: 0;
    }
    .C-logo-preview img { width: 100%; height: 100%; object-fit: contain; }
    .C-logo-empty { font-size: 28px; opacity: 0.3; }
    .C-logo-actions { display: flex; flex-direction: column; gap: 8px; }
    .C-logo-btn {
      padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600;
      font-family: 'Syne', sans-serif; cursor: pointer; transition: all 0.15s;
      border: 1px solid var(--border); background: var(--bg3); color: var(--txt2);
    }
    .C-logo-btn:hover { color: var(--txt); border-color: var(--border2); }
    .C-logo-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .C-logo-hint { font-size: 12px; color: var(--txt3); }

    .C-color-row { display: flex; align-items: center; gap: 14px; }
    .C-color-input {
      width: 52px; height: 52px; border-radius: 12px; border: 1px solid var(--border);
      background: none; cursor: pointer; padding: 3px; flex-shrink: 0;
    }
    .C-color-input::-webkit-color-swatch-wrapper { padding: 0; border-radius: 8px; }
    .C-color-input::-webkit-color-swatch { border: none; border-radius: 8px; }
    .C-color-preview {
      flex: 1; height: 52px; border-radius: 12px;
      border: 1px solid var(--border);
      display: flex; align-items: center; padding: 0 16px; gap: 10px;
    }
    .C-color-dot { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; }
    .C-color-hex { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--txt); }
    .C-color-label { font-size: 12px; color: var(--txt3); }

    .LD { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
    .LD-ring { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.06); border-top-color: var(--ac); border-radius: 50%; animation: spin 0.65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg) } }
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
      <div className="C-root">
        <nav className="C-nav">
          <div className="C-nav-in">
            <div className="C-nav-left">
              <button className="C-nav-back" onClick={() => router.push('/dashboard')}>←</button>
              {logoUrl && <div className="C-nav-logo"><img src={logoUrl} alt="Logo" /></div>}
              <span className="C-nav-title">Configuración</span>
            </div>
            <button className="C-nav-exit" onClick={() => { removeToken(); router.push('/') }}>Salir</button>
            <button className="C-burger" onClick={() => setDrawerOpen(true)}>☰</button>
          </div>
        </nav>

        <div className="C-body">
          <div className="C-section">
            <div className="C-section-head">
              <div className="C-section-icon">💬</div>
              <div>
                <p className="C-section-title">Notificaciones WhatsApp</p>
                <p className="C-section-sub">Recibí cada pedido en tu teléfono</p>
              </div>
            </div>

            <div className="C-group">
              <label className="C-label">Número de WhatsApp</label>
              <input
                className="C-input"
                placeholder="5492615551234"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
              />
              <p className="C-input-hint">Formato internacional sin + ni espacios. Ej: 5492615551234</p>
            </div>

            <div className="C-group">
              <label className="C-label">CallMeBot API Key</label>
              <input
                className="C-input"
                placeholder="Tu API key de CallMeBot"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <p className="C-input-hint">
                Obtenela gratis en <a href="https://callmebot.com" target="_blank">callmebot.com</a>
              </p>
            </div>

            <div className="C-divider" />

            <div className="C-info">
              <p className="C-info-title">Cómo activar CallMeBot</p>
              <div className="C-info-step">
                <div className="C-info-num">1</div>
                <p className="C-info-text">Guardá el número <code>+34 644 59 73 45</code> en tus contactos como "CallMeBot"</p>
              </div>
              <div className="C-info-step">
                <div className="C-info-num">2</div>
                <p className="C-info-text">Enviále el mensaje: <code>I allow callmebot to send me messages</code></p>
              </div>
              <div className="C-info-step">
                <div className="C-info-num">3</div>
                <p className="C-info-text">Te responde con tu API key. Copiala acá arriba.</p>
              </div>
            </div>
          </div>

          <div className="C-section">
            <div className="C-section-head">
              <div className="C-section-icon">🖼️</div>
              <div>
                <p className="C-section-title">Logo</p>
                <p className="C-section-sub">Se muestra en el encabezado del menú público</p>
              </div>
            </div>

            <div className="C-group">
              <label className="C-label">Logo del restaurante</label>
              <div className="C-logo-row">
                <div className="C-logo-preview">
                  {logoUrl
                    ? <img src={logoUrl} alt="Logo" />
                    : <span className="C-logo-empty">🍽️</span>
                  }
                </div>
                <div className="C-logo-actions">
                  <button
                    className="C-logo-btn"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? 'Subiendo...' : logoUrl ? '↑ Cambiar logo' : '↑ Subir logo'}
                  </button>
                  <p className="C-logo-hint">PNG, JPG o SVG. Recomendado: 512×512px</p>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <div className="C-section">
            <div className="C-section-head">
              <div className="C-section-icon">🎨</div>
              <div>
                <p className="C-section-title">Apariencia</p>
                <p className="C-section-sub">Personalizá el color del menú público</p>
              </div>
            </div>

            <div className="C-group">
              <label className="C-label">Color principal del restaurante</label>
              <div className="C-color-row">
                <input
                  type="color"
                  className="C-color-input"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                />
                <div className="C-color-preview" style={{ background: primaryColor + '18' }}>
                  <div className="C-color-dot" style={{ background: primaryColor }} />
                  <div>
                    <p className="C-color-hex">{primaryColor.toUpperCase()}</p>
                    <p className="C-color-label">Se aplica en botones, precios y badges del menú</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="C-section">
            <div className="C-section-head">
              <div className="C-section-icon">🏦</div>
              <div>
                <p className="C-section-title">Pagos</p>
                <p className="C-section-sub">Datos para transferencia bancaria</p>
              </div>
            </div>

            <div className="C-group">
              <label className="C-label">CBU / Alias</label>
              <input
                className="C-input"
                placeholder="Ej: mi.restaurante o 0000003100..."
                value={bankInfo}
                onChange={e => setBankInfo(e.target.value)}
              />
              <p className="C-input-hint">Se mostrará al cliente cuando elija pagar por transferencia</p>
            </div>
          </div>

          <div className="C-section">
            <div className="C-section-head">
              <div className="C-section-icon">📍</div>
              <div>
                <p className="C-section-title">Ubicación</p>
                <p className="C-section-sub">Dirección del local para pedidos para llevar</p>
              </div>
            </div>

            <div className="C-group">
              <label className="C-label">Dirección del local</label>
              <input
                className="C-input"
                placeholder="Av. San Martín 1234, Mendoza"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
              <p className="C-input-hint">Se muestra en el mapa cuando el cliente elige "Para llevar"</p>
            </div>
          </div>

          <button
            className={`C-save${saved ? ' saved' : ''}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="C-drawer-ov" onClick={() => setDrawerOpen(false)} />
          <div className="C-drawer">
            <button className="C-drawer-link" onClick={() => { router.push('/dashboard'); setDrawerOpen(false) }}>Pedidos</button>
            <button className="C-drawer-link" onClick={() => { router.push('/dashboard/menu'); setDrawerOpen(false) }}>Menú</button>
            <button className="C-drawer-link" onClick={() => { router.push('/dashboard/qr'); setDrawerOpen(false) }}>QR Mesas</button>
            <button className="C-drawer-link" onClick={() => { router.push('/dashboard/config'); setDrawerOpen(false) }}>Config</button>
            <button className="C-drawer-link C-drawer-exit" onClick={() => { removeToken(); router.push('/') }}>Salir</button>
          </div>
        </>
      )}
    </>
  )
}