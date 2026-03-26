'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, removeToken } from '@/lib/auth'
import { setAuthToken, getTenantConfig } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export default function QRPage() {
  const router = useRouter()
  const [slug, setSlug] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mesa, setMesa] = useState('')
  const [desde, setDesde] = useState('1')
  const [hasta, setHasta] = useState('10')
  const [multi, setMulti] = useState(false)
  const [previewMesa, setPreviewMesa] = useState<string | null>(null)
  const [generalQrVisible, setGeneralQrVisible] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/'); return }
    setAuthToken(token)
    getTenantConfig()
      .then(cfg => setSlug(cfg.slug))
      .catch(() => { removeToken(); router.push('/') })
  }, [])

  function qrUrl(table: string | number) {
    return `${API_URL}/api/v1/public/${slug}/qr/${table}`
  }

  function generalQrUrl() {
    return `${API_URL}/api/v1/public/${slug}/qr/general`
  }

  function handleDownloadGeneral() {
    const a = document.createElement('a')
    a.href = generalQrUrl()
    a.download = `qr-general-${slug}.png`
    a.click()
  }

  function handlePrintGeneral() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;">
        <div style="text-align:center;font-family:sans-serif;">
          <img src="${generalQrUrl()}" style="width:260px;height:260px;" />
          <p style="margin-top:12px;font-size:18px;font-weight:bold;">${slug}</p>
        </div>
      </body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  function handleSingle() {
    if (!mesa.trim()) return
    setPreviewMesa(mesa.trim())
  }

  function handleDownload(table: string | number) {
    const a = document.createElement('a')
    a.href = qrUrl(table)
    a.download = `qr-mesa-${table}.png`
    a.click()
  }

  function handlePrint(table: string | number) {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;">
        <div style="text-align:center;font-family:sans-serif;">
          <img src="${qrUrl(table)}" style="width:260px;height:260px;" />
          <p style="margin-top:12px;font-size:18px;font-weight:bold;">Mesa ${table}</p>
        </div>
      </body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  const multiRange = (() => {
    const d = parseInt(desde)
    const h = parseInt(hasta)
    if (isNaN(d) || isNaN(h) || d > h || h - d > 49) return []
    return Array.from({ length: h - d + 1 }, (_, i) => d + i)
  })()

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0C0C0C; --bg2: #141414; --bg3: #1C1C1C;
      --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.12);
      --txt: #FFFFFF; --txt2: rgba(255,255,255,0.45); --txt3: rgba(255,255,255,0.2);
      --ac: #E85D04; --ac-dim: rgba(232,93,4,0.12);
    }
    body { background: var(--bg); }
    .Q-root { min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }

    .Q-nav {
      background: rgba(12,12,12,0.9); backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 50;
    }
    .Q-nav-in {
      max-width: 900px; margin: 0 auto; padding: 0 20px;
      display: flex; align-items: center; justify-content: space-between; height: 58px;
    }
    .Q-nav-left { display: flex; align-items: center; gap: 10px; }
    .Q-nav-logo {
      width: 32px; height: 32px; background: var(--ac-dim);
      border: 1px solid rgba(232,93,4,0.2); border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 15px;
    }
    .Q-nav-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--txt); }
    .Q-nav-links { display: flex; align-items: center; gap: 4px; }
    .Q-nav-link {
      padding: 6px 12px; border-radius: 8px; font-size: 13px; color: var(--txt2);
      cursor: pointer; transition: all 0.15s; border: none; background: transparent; font-family: 'Inter', sans-serif;
    }
    .Q-nav-link:hover { color: var(--txt); background: rgba(255,255,255,0.05); }
    .Q-nav-link.active { color: var(--txt); background: rgba(255,255,255,0.08); }
    .Q-nav-exit {
      padding: 6px 12px; border-radius: 8px; font-size: 13px; color: var(--txt3);
      cursor: pointer; transition: all 0.15s; border: none; background: transparent; font-family: 'Inter', sans-serif;
    }
    .Q-nav-exit:hover { color: #f87171; background: rgba(239,68,68,0.08); }
    .Q-burger { display: none; background: none; border: none; color: var(--txt); font-size: 20px; cursor: pointer; padding: 4px 8px; line-height: 1; }
    .Q-drawer-ov { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
    .Q-drawer { position: fixed; top: 0; right: 0; bottom: 0; z-index: 201; width: 220px; background: var(--bg2); border-left: 1px solid var(--border); display: flex; flex-direction: column; padding: 20px 12px; gap: 4px; animation: qdrw .2s ease; }
    @keyframes qdrw { from { transform: translateX(100%) } to { transform: translateX(0) } }
    .Q-drawer-link { padding: 12px 14px; border-radius: 10px; font-size: 14px; color: var(--txt2); cursor: pointer; background: none; border: none; font-family: 'Inter', sans-serif; text-align: left; width: 100%; transition: all 0.15s; }
    .Q-drawer-link:hover { color: var(--txt); background: rgba(255,255,255,0.06); }
    .Q-drawer-exit { color: #f87171; }
    .Q-drawer-exit:hover { background: rgba(239,68,68,0.08) !important; }
    @media (max-width: 640px) {
      .Q-nav-links { display: none; }
      .Q-nav-exit { display: none; }
      .Q-burger { display: block; }
    }

    .Q-body { max-width: 900px; margin: 0 auto; padding: 32px 20px 60px; }

    .Q-heading { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--txt); margin-bottom: 6px; }
    .Q-sub { font-size: 13px; color: var(--txt3); margin-bottom: 28px; }

    .Q-card {
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: 18px; padding: 24px; margin-bottom: 16px;
    }
    .Q-card-title {
      font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
      color: var(--txt2); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;
    }

    .Q-row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }

    .Q-field { display: flex; flex-direction: column; gap: 6px; }
    .Q-label { font-size: 12px; color: var(--txt3); }
    .Q-input {
      background: var(--bg3); border: 1px solid var(--border);
      border-radius: 10px; padding: 10px 14px;
      font-size: 14px; color: var(--txt); font-family: 'Inter', sans-serif;
      outline: none; width: 120px; transition: border-color 0.15s;
    }
    .Q-input:focus { border-color: var(--border2); }

    .Q-btn {
      padding: 10px 20px; border-radius: 10px;
      font-size: 13px; font-weight: 600; font-family: 'Syne', sans-serif;
      cursor: pointer; transition: all 0.15s; border: none;
    }
    .Q-btn.primary { background: var(--ac); color: #fff; }
    .Q-btn.primary:hover { filter: brightness(1.1); }
    .Q-btn.secondary {
      background: transparent; color: var(--txt2);
      border: 1px solid var(--border);
    }
    .Q-btn.secondary:hover { color: var(--txt); border-color: var(--border2); }

    /* Preview single */
    .Q-preview {
      margin-top: 24px;
      display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;
    }
    .Q-img-wrap {
      background: #fff; border-radius: 14px; padding: 16px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .Q-img-wrap img { width: 200px; height: 200px; display: block; }
    .Q-img-label { font-size: 14px; font-weight: 700; color: #111; font-family: 'Syne', sans-serif; }
    .Q-preview-actions { display: flex; flex-direction: column; gap: 8px; justify-content: center; }

    /* Grid multi */
    .Q-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px; margin-top: 20px;
    }
    .Q-grid-item {
      background: var(--bg3); border: 1px solid var(--border);
      border-radius: 14px; padding: 16px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .Q-grid-item img { width: 140px; height: 140px; border-radius: 8px; background: #fff; }
    .Q-grid-item-label { font-size: 13px; color: var(--txt2); }
    .Q-grid-item-actions { display: flex; gap: 6px; }
    .Q-grid-btn {
      padding: 5px 10px; border-radius: 7px; font-size: 11px;
      cursor: pointer; transition: all 0.15s; border: 1px solid var(--border);
      background: transparent; color: var(--txt3); font-family: 'Inter', sans-serif;
    }
    .Q-grid-btn:hover { color: var(--txt2); border-color: var(--border2); }

    .Q-warn { font-size: 12px; color: #f87171; margin-top: 8px; }

    .LD { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
    .LD-ring { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.06); border-top-color: var(--ac); border-radius: 50%; animation: spin 0.65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg) } }
  `

  if (!slug) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="LD"><div className="LD-ring" /></div>
    </>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="Q-root">
        <nav className="Q-nav">
          <div className="Q-nav-in">
            <div className="Q-nav-left">
              <div className="Q-nav-logo">🍽️</div>
              <span className="Q-nav-title">Panel Admin</span>
            </div>
            <div className="Q-nav-links">
              <button className="Q-nav-link" onClick={() => router.push('/dashboard')}>Pedidos</button>
              <button className="Q-nav-link" onClick={() => router.push('/dashboard/menu')}>Menú</button>
              <button className="Q-nav-link active" onClick={() => router.push('/dashboard/qr')}>QR Mesas</button>
              <button className="Q-nav-link" onClick={() => router.push('/dashboard/config')}>Config</button>
              <button className="Q-nav-exit" onClick={() => { removeToken(); router.push('/') }}>Salir</button>
            </div>
            <button className="Q-burger" onClick={() => setDrawerOpen(true)}>☰</button>
          </div>
        </nav>

        <div className="Q-body">
          <p className="Q-heading">Códigos QR</p>
          <p className="Q-sub">Generá QRs por mesa para que los clientes accedan al menú directamente.</p>

          {/* QR General */}
          <div className="Q-card">
            <p className="Q-card-title">QR General del restaurante</p>
            <p style={{ fontSize: '13px', color: 'var(--txt2)', marginBottom: '16px' }}>
              Para flyers, Instagram o cualquier material. Lleva directamente al menú sin número de mesa.
            </p>
            <button className="Q-btn primary" onClick={() => setGeneralQrVisible(true)}>
              Generar QR general
            </button>

            {generalQrVisible && (
              <div className="Q-preview">
                <div className="Q-img-wrap">
                  <img src={generalQrUrl()} alt="QR General" />
                  <span className="Q-img-label">{slug}</span>
                </div>
                <div className="Q-preview-actions">
                  <button className="Q-btn primary" onClick={handleDownloadGeneral}>
                    ↓ Descargar PNG
                  </button>
                  <button className="Q-btn secondary" onClick={handlePrintGeneral}>
                    🖨 Imprimir
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QR individual */}
          <div className="Q-card">
            <p className="Q-card-title">QR individual</p>
            <div className="Q-row">
              <div className="Q-field">
                <label className="Q-label">Número de mesa</label>
                <input
                  className="Q-input"
                  type="text"
                  placeholder="Ej: 5"
                  value={mesa}
                  onChange={e => { setMesa(e.target.value); setPreviewMesa(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleSingle()}
                />
              </div>
              <button className="Q-btn primary" onClick={handleSingle}>Generar</button>
            </div>

            {previewMesa && (
              <div className="Q-preview">
                <div className="Q-img-wrap">
                  <img src={qrUrl(previewMesa)} alt={`QR Mesa ${previewMesa}`} />
                  <span className="Q-img-label">Mesa {previewMesa}</span>
                </div>
                <div className="Q-preview-actions">
                  <button className="Q-btn primary" onClick={() => handleDownload(previewMesa)}>
                    ↓ Descargar PNG
                  </button>
                  <button className="Q-btn secondary" onClick={() => handlePrint(previewMesa)}>
                    🖨 Imprimir
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QR múltiples */}
          <div className="Q-card">
            <p className="Q-card-title">Múltiples mesas</p>
            <div className="Q-row">
              <div className="Q-field">
                <label className="Q-label">Desde mesa</label>
                <input
                  className="Q-input"
                  type="number"
                  min="1"
                  value={desde}
                  onChange={e => setDesde(e.target.value)}
                />
              </div>
              <div className="Q-field">
                <label className="Q-label">Hasta mesa</label>
                <input
                  className="Q-input"
                  type="number"
                  min="1"
                  value={hasta}
                  onChange={e => setHasta(e.target.value)}
                />
              </div>
              <button className="Q-btn primary" onClick={() => setMulti(true)}>
                Generar {multiRange.length > 0 ? `(${multiRange.length})` : ''}
              </button>
              {multi && multiRange.length > 0 && (
                <button
                  className="Q-btn secondary"
                  onClick={() => multiRange.forEach(n => handleDownload(n))}
                >
                  ↓ Descargar todos
                </button>
              )}
            </div>
            {multiRange.length === 0 && (desde || hasta) && (
              <p className="Q-warn">Rango inválido — máximo 50 mesas por vez.</p>
            )}

            {multi && multiRange.length > 0 && (
              <div className="Q-grid">
                {multiRange.map(n => (
                  <div key={n} className="Q-grid-item">
                    <img src={qrUrl(n)} alt={`QR Mesa ${n}`} />
                    <span className="Q-grid-item-label">Mesa {n}</span>
                    <div className="Q-grid-item-actions">
                      <button className="Q-grid-btn" onClick={() => handleDownload(n)}>↓ PNG</button>
                      <button className="Q-grid-btn" onClick={() => handlePrint(n)}>🖨</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="Q-drawer-ov" onClick={() => setDrawerOpen(false)} />
          <div className="Q-drawer">
            <button className="Q-drawer-link" onClick={() => { router.push('/dashboard'); setDrawerOpen(false) }}>Pedidos</button>
            <button className="Q-drawer-link" onClick={() => { router.push('/dashboard/menu'); setDrawerOpen(false) }}>Menú</button>
            <button className="Q-drawer-link" onClick={() => { router.push('/dashboard/qr'); setDrawerOpen(false) }}>QR Mesas</button>
            <button className="Q-drawer-link" onClick={() => { router.push('/dashboard/config'); setDrawerOpen(false) }}>Config</button>
            <button className="Q-drawer-link Q-drawer-exit" onClick={() => { removeToken(); router.push('/') }}>Salir</button>
          </div>
        </>
      )}
    </>
  )
}
