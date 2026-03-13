'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, removeToken } from '@/lib/auth'
import {
  setAuthToken,
  getCategories,
  createCategory,
  deleteCategory,
  getItems,
  createItem,
  updateItem,
  deleteItem,
  uploadItemImage,
} from '@/lib/api'

interface Category {
  id: string
  name: string
  order_index: number
  is_active: boolean
}

interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string | null
  price: string
  image_url: string | null
  is_available: boolean
  order_index: number
}

export default function MenuPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('')

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  // Forms
  const [showCatForm, setShowCatForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [catName, setCatName] = useState('')
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    is_available: true,
    order_index: 0,
  })

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/'); return }
    setAuthToken(token)
    loadData()
  }, [])

  async function loadData() {
    try {
      const [cats, its] = await Promise.all([getCategories(), getItems()])
      setCategories(cats)
      setItems(its)
      if (cats.length > 0 && !activeCategory) setActiveCategory(cats[0].id)
    } catch {
      removeToken()
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCategory() {
    if (!catName.trim()) return
    await createCategory({ name: catName, order_index: categories.length })
    setCatName('')
    setShowCatForm(false)
    await loadData()
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('¿Eliminar categoría? También se eliminan sus items.')) return
    await deleteCategory(id)
    await loadData()
  }

  async function handleSaveItem() {
    if (!itemForm.name || !itemForm.price) return
    const payload = {
      category_id: activeCategory,
      name: itemForm.name,
      description: itemForm.description || undefined,
      price: parseFloat(itemForm.price),
      is_available: itemForm.is_available,
      order_index: itemForm.order_index,
    }
    if (editingItem) {
      await updateItem(editingItem.id, payload)
    } else {
      await createItem(payload)
    }
    resetItemForm()
    await loadData()
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('¿Eliminar item?')) return
    await deleteItem(id)
    await loadData()
  }

  async function handleToggleAvailable(item: MenuItem) {
    await updateItem(item.id, { is_available: !item.is_available })
    await loadData()
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      is_available: item.is_available,
      order_index: item.order_index,
    })
    setShowItemForm(true)
  }

  function handleImageClick(itemId: string) {
    setUploadingId(itemId)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uploadingId) return
    e.target.value = ''
    await uploadItemImage(uploadingId, file)
    setUploadingId(null)
    await loadData()
  }

  function resetItemForm() {
    setEditingItem(null)
    setItemForm({ name: '', description: '', price: '', is_available: true, order_index: 0 })
    setShowItemForm(false)
  }

  const categoryItems = items.filter(i => i.category_id === activeCategory)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">←</button>
          <h1 className="font-bold text-gray-800">Gestión de Menú</h1>
        </div>
        <button
          onClick={() => { removeToken(); router.push('/') }}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Salir
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6">

          {/* Categorías */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-700 text-sm">Categorías</h2>
                <button
                  onClick={() => setShowCatForm(!showCatForm)}
                  className="w-6 h-6 bg-orange-500 text-white rounded-full text-sm flex items-center justify-center"
                >+</button>
              </div>

              {showCatForm && (
                <div className="px-4 py-3 border-b border-gray-50 flex gap-2">
                  <input
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    placeholder="Nombre"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-orange-400"
                    onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                  />
                  <button onClick={handleCreateCategory} className="text-orange-500 text-sm font-medium">✓</button>
                </div>
              )}

              <div className="divide-y divide-gray-50">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                      activeCategory === cat.id ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-medium ${activeCategory === cat.id ? 'text-orange-600' : 'text-gray-700'}`}>
                      {cat.name}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteCategory(cat.id) }}
                      className="text-gray-300 hover:text-red-400 transition-colors text-xs"
                    >🗑️</button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">Sin categorías</p>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-700 text-sm">
                  {categories.find(c => c.id === activeCategory)?.name || 'Items'}
                </h2>
                {activeCategory && (
                  <button
                    onClick={() => { resetItemForm(); setShowItemForm(true) }}
                    className="text-sm text-orange-500 font-medium flex items-center gap-1"
                  >
                    + Agregar item
                  </button>
                )}
              </div>

              {/* Item form */}
              {showItemForm && (
                <div className="px-4 py-4 border-b border-orange-50 bg-orange-50/30">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {editingItem ? 'Editar item' : 'Nuevo item'}
                  </h3>
                  <div className="space-y-2">
                    <input
                      placeholder="Nombre del producto *"
                      value={itemForm.name}
                      onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                    <textarea
                      placeholder="Descripción (opcional)"
                      value={itemForm.description}
                      onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <input
                        placeholder="Precio *"
                        type="number"
                        value={itemForm.price}
                        onChange={e => setItemForm({ ...itemForm, price: e.target.value })}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                      <input
                        placeholder="Orden"
                        type="number"
                        value={itemForm.order_index}
                        onChange={e => setItemForm({ ...itemForm, order_index: parseInt(e.target.value) })}
                        className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={itemForm.is_available}
                        onChange={e => setItemForm({ ...itemForm, is_available: e.target.checked })}
                        className="accent-orange-500"
                      />
                      Disponible
                    </label>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSaveItem}
                      className="flex-1 bg-orange-500 text-white py-2 rounded-xl text-sm font-medium"
                    >
                      {editingItem ? 'Guardar cambios' : 'Crear item'}
                    </button>
                    <button
                      onClick={resetItemForm}
                      className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-gray-50">
                {categoryItems.map(item => (
                  <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Thumbnail */}
                      <button
                        onClick={() => handleImageClick(item.id)}
                        title="Subir imagen"
                        className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 hover:border-orange-400 transition-colors"
                      >
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-gray-300 text-lg bg-gray-50">
                            {uploadingId === item.id ? (
                              <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                            ) : '📷'}
                          </span>
                        )}
                        {uploadingId === item.id && item.image_url && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                        {!item.is_available && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">No disponible</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                      )}
                      <p className="text-sm font-bold text-orange-500 mt-0.5">
                        ${parseFloat(item.price).toLocaleString()}
                      </p>
                    </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                          item.is_available
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {item.is_available ? '✓' : '○'}
                      </button>
                      <button
                        onClick={() => openEditItem(item)}
                        className="text-xs px-2 py-1 rounded-lg text-blue-400 hover:bg-blue-50 transition-colors"
                      >✏️</button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-xs px-2 py-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                      >🗑️</button>
                    </div>
                  </div>
                ))}
                {categoryItems.length === 0 && (
                  <p className="px-4 py-8 text-sm text-gray-400 text-center">
                    {activeCategory ? 'Sin items en esta categoría' : 'Seleccioná una categoría'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}