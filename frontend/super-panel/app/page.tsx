'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { superadminLogin } from '@/lib/api'
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
      const data = await superadminLogin(email, password)
      saveToken(data.access_token)
      router.push('/dashboard')
    } catch {
      setError('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --ac: #6366f1; --ac-dim: rgba(99,102,241,0.12); --bg: #0C0C0C; --bg2: #141414; --bg3: #1C1C1C; --border: rgba(255,255,255,0.07); --txt: #fff; --txt2: rgba(255,255,255,0.45); --txt3: rgba(255,255,255,0.2); }
    .root { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; padding: 20px; position: relative; overflow: hidden; }
    .root::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%); pointer-events: none; }
    .card { width: 100%; max-width: 380px; background: var(--bg2); border: 1px solid var(--border); border-radius: 24px; padding: 40px 32px; position: relative; z-index: 1; }
    .top { text-align: center; margin-bottom: 32px; }
    .icon { width: 48px; height: 48px; background: var(--ac-dim); border: 1px solid rgba(99,102,241,0.25); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 20px; }
    .title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--txt); letter-spacing: -0.5px; margin-bottom: 4px; }
    .sub { font-size: 13px; color: var(--txt2); }
    .group { margin-bottom: 12px; }
    .label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--txt3); display: block; margin-bottom: 7px; }
    .input { width: 100%; background: var(--bg3); border: 1px solid var(--border); border-radius: 11px; padding: 13px 15px; font-size: 14px; color: var(--txt); font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.18s; }
    .input::placeholder { color: var(--txt3); }
    .input:focus { border-color: var(--ac); }
    .error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 9px; padding: 9px 13px; font-size: 13px; color: #f87171; text-align: center; margin-bottom: 14px; }
    .btn { width: 100%; background: var(--ac); color: #fff; border: none; border-radius: 11px; padding: 14px; font-size: 14px; font-weight: 600; font-family: 'Syne', sans-serif; cursor: pointer; margin-top: 6px; transition: all 0.18s; }
    .btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: var(--txt3); }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="root">
        <div className="card">
          <div className="top">
            <div className="icon">⚡</div>
            <h1 className="title">Super Admin</h1>
            <p className="sub">Acceso restringido</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="group">
              <label className="label">Contraseña</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
          <div className="footer">RestauranteSaaS · Super Panel</div>
        </div>
      </div>
    </>
  )
}