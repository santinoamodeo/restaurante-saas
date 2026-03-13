'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, removeToken } from '@/lib/auth'
import { setAuthToken, getTenantConfig, updateTenantConfig } from '@/lib/api'

export default function ConfigPage() {
  const router = useRouter()
  const [whatsapp, setWhatsapp] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/')
      return
    }
    setAuthToken(token)
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const data = await getTenantConfig()
      setWhatsapp(data.whatsapp_number ?? '')
      setApiKey(data.callmebot_api_key ?? '')
    } catch {
      removeToken()
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateTenantConfig({
        whatsapp_number: whatsapp.trim() || null,
        callmebot_api_key: apiKey.trim() || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <div>
            <h1 className="font-bold text-gray-800">Panel Admin</h1>
            <p className="text-xs text-gray-500">Configuración</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-orange-500 font-medium transition-colors"
          >
            📋 Pedidos
          </button>
          <button
            onClick={() => router.push('/dashboard/menu')}
            className="text-sm text-gray-600 hover:text-orange-500 font-medium transition-colors"
          >
            🍔 Menú
          </button>
          <button
            onClick={() => { removeToken(); router.push('/') }}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Configuración de notificaciones</h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de WhatsApp
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Formato internacional sin espacios, ej: 5491112345678
            </p>
            <input
              type="text"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="5491112345678"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CallMeBot API Key
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Obtenela en <span className="font-medium text-gray-500">callmebot.com</span> enviando un mensaje a su bot de WhatsApp
            </p>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="123456"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
          )}

          {saved && (
            <p className="text-sm text-green-600 bg-green-50 rounded-xl px-4 py-2.5">
              ✅ Configuración guardada
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
