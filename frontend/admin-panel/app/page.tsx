'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/api'
import { saveToken } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await login(email, password)
      saveToken(data.access_token)
      router.push('/dashboard')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

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

    .L-root {
      min-height: 100vh;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .L-root::before {
      content: '';
      position: absolute;
      top: -200px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(232,93,4,0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    .L-card {
      width: 100%;
      max-width: 400px;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 40px 36px;
      position: relative;
      z-index: 1;
    }

    .L-top {
      text-align: center;
      margin-bottom: 36px;
    }

    .L-icon {
      width: 52px;
      height: 52px;
      background: var(--ac-dim);
      border: 1px solid rgba(232,93,4,0.25);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 22px;
    }

    .L-title {
      font-family: 'Syne', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: var(--txt);
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }

    .L-sub {
      font-size: 14px;
      color: var(--txt2);
    }

    .L-group {
      margin-bottom: 14px;
    }

    .L-label {
      display: block;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--txt3);
      margin-bottom: 8px;
      font-weight: 500;
    }

    .L-input {
      width: 100%;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 13px 16px;
      font-size: 15px;
      color: var(--txt);
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: border-color 0.18s;
    }
    .L-input::placeholder { color: var(--txt3); }
    .L-input:focus { border-color: var(--ac); }

    .L-error {
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 13px;
      color: #f87171;
      text-align: center;
      margin-bottom: 16px;
    }

    .L-btn {
      width: 100%;
      background: var(--ac);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 15px;
      font-size: 15px;
      font-weight: 600;
      font-family: 'Syne', sans-serif;
      cursor: pointer;
      margin-top: 8px;
      transition: all 0.18s;
      letter-spacing: -0.2px;
      position: relative;
      overflow: hidden;
    }
    .L-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .L-btn:active { transform: translateY(0); }
    .L-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .L-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.65s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg) } }

    .L-footer {
      text-align: center;
      margin-top: 28px;
      font-size: 12px;
      color: var(--txt3);
    }

    .L-divider {
      height: 1px;
      background: var(--border);
      margin: 28px 0;
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="L-root">
        <div className="L-card">
          <div className="L-top">
            <div className="L-icon">🍽️</div>
            <h1 className="L-title">Panel Admin</h1>
            <p className="L-sub">Ingresá a tu restaurante</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="L-group">
              <label className="L-label">Email</label>
              <input
                type="email"
                className="L-input"
                placeholder="admin@mirestaurante.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="L-group">
              <label className="L-label">Contraseña</label>
              <input
                type="password"
                className="L-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="L-error">{error}</div>}

            <button type="submit" className="L-btn" disabled={loading}>
              {loading && <span className="L-spinner" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="L-footer">
            RestauranteSaaS · Panel de administración
          </div>
        </div>
      </div>
    </>
  )
}