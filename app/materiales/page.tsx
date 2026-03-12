'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, X, Loader2, Search, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react'

type Material = {
  id: string; nombre: string; categoria: string; unidad: string
  stock_actual: number; stock_minimo: number; costo_unitario: number; ubicacion: string
}

export default function MaterialesPage() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ nombre: '', categoria: 'cableado', unidad: 'pieza', stock_actual: '', stock_minimo: '', costo_unitario: '', ubicacion: '' })

  const fetchMateriales = useCallback(async () => {
    try { const res = await fetch('/api/materiales'); const data = await res.json(); setMateriales(Array.isArray(data) ? data : []) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchMateriales() }, [fetchMateriales])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true)
    try {
      const res = await fetch('/api/materiales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, stock_actual: parseFloat(form.stock_actual) || 0, stock_minimo: parseFloat(form.stock_minimo) || 0, costo_unitario: form.costo_unitario ? parseFloat(form.costo_unitario) : null }) })
      if (res.ok) { setShowModal(false); setForm({ nombre: '', categoria: 'cableado', unidad: 'pieza', stock_actual: '', stock_minimo: '', costo_unitario: '', ubicacion: '' }); fetchMateriales() }
    } finally { setCreating(false) }
  }

  const filtered = materiales.filter(m => m.nombre?.toLowerCase().includes(search.toLowerCase()))
  const lowStock = filtered.filter(m => Number(m.stock_actual) <= Number(m.stock_minimo) && Number(m.stock_minimo) > 0)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-400 flex items-center gap-2"><Package className="h-6 w-6" /> Materiales</h1>
          <p className="text-sm text-slate-500 mt-1">{materiales.length} material{materiales.length !== 1 ? 'es' : ''} en inventario</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600/20 border border-purple-500/50 text-purple-400 hover:bg-purple-600/30 rounded-lg text-sm font-medium transition-all"><Plus className="h-4 w-4" /> Nuevo Material</button>
      </motion.div>

      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400 font-medium">Stock bajo en {lowStock.length} material{lowStock.length !== 1 ? 'es' : ''}</p>
            <p className="text-xs text-red-400/70 mt-1">{lowStock.map(m => m.nombre).join(', ')}</p>
          </div>
        </motion.div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input type="text" placeholder="Buscar materiales..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-purple-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 border border-slate-800 rounded-lg"><Package className="h-12 w-12 mx-auto mb-4 text-slate-600" /><p className="text-slate-400">No hay materiales</p></div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900/50 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Material</th>
                  <th className="text-left px-4 py-3">Categoría</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="text-right px-4 py-3">Mínimo</th>
                  <th className="text-left px-4 py-3">Unidad</th>
                  <th className="text-right px-4 py-3">Costo Unit.</th>
                  <th className="text-left px-4 py-3">Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((mat, i) => {
                  const isLow = Number(mat.stock_actual) <= Number(mat.stock_minimo) && Number(mat.stock_minimo) > 0
                  return (
                    <motion.tr key={mat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${isLow ? 'bg-red-500/5' : ''}`}>
                      <td className="px-4 py-3 text-slate-200 font-medium flex items-center gap-2">
                        {isLow && <ArrowDown className="h-3 w-3 text-red-400" />}
                        {mat.nombre}
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400 text-xs capitalize">{mat.categoria}</span></td>
                      <td className={`px-4 py-3 text-right font-mono ${isLow ? 'text-red-400 font-bold' : 'text-slate-200'}`}>{Number(mat.stock_actual)}</td>
                      <td className="px-4 py-3 text-right text-slate-500 font-mono">{Number(mat.stock_minimo)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{mat.unidad}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{mat.costo_unitario ? `$${Number(mat.costo_unitario).toLocaleString('es-MX')}` : '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{mat.ubicacion || '—'}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-purple-400">Nuevo Material</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div><label className="text-xs text-slate-400 uppercase tracking-wider">Nombre *</label>
                    <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-purple-500/50" placeholder="Ej: Cable UTP Cat6 305m" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">Categoría</label>
                      <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-purple-500/50">
                        <option value="cableado">Cableado</option><option value="conectores">Conectores</option><option value="herramientas_consumibles">Herramientas Consumibles</option><option value="otro">Otro</option>
                      </select></div>
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">Unidad</label>
                      <select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-purple-500/50">
                        <option value="pieza">Pieza</option><option value="metro">Metro</option><option value="rollo">Rollo</option><option value="caja">Caja</option><option value="kg">Kg</option>
                      </select></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1"><ArrowUp className="h-3 w-3" />Stock</label>
                      <input type="number" value={form.stock_actual} onChange={(e) => setForm({ ...form, stock_actual: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-purple-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1"><ArrowDown className="h-3 w-3" />Mínimo</label>
                      <input type="number" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-purple-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">$ Unit.</label>
                      <input type="number" step="0.01" value={form.costo_unitario} onChange={(e) => setForm({ ...form, costo_unitario: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-purple-500/50" /></div>
                  </div>
                  <div><label className="text-xs text-slate-400 uppercase tracking-wider">Ubicación</label>
                    <input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-purple-500/50" placeholder="Ej: Almacén principal" /></div>
                  <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600/20 border border-purple-500/50 text-purple-400 hover:bg-purple-600/30 disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{creating ? 'Creando...' : 'Registrar Material'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
