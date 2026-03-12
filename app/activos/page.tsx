'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, Plus, X, Loader2, Search, Box, Cpu, Monitor } from 'lucide-react'

type Activo = {
  id: string; nombre: string; categoria: string; numero_serie: string; estado: string
  asignado_nombre: string; valor_adquisicion: number; fecha_adquisicion: string; created_at: string
}

const categoriaIcons: Record<string, typeof Wrench> = { herramienta: Wrench, equipo_medicion: Box, equipo_computo: Monitor, otro: Cpu }
const estadoColors: Record<string, string> = {
  disponible: 'text-green-400 bg-green-400/10 border-green-500/30',
  asignado: 'text-blue-400 bg-blue-400/10 border-blue-500/30',
  en_reparacion: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30',
  dado_de_baja: 'text-red-400 bg-red-400/10 border-red-500/30',
}

export default function ActivosPage() {
  const [activos, setActivos] = useState<Activo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ nombre: '', categoria: 'herramienta', numero_serie: '', valor_adquisicion: '', fecha_adquisicion: '', notas: '' })

  const fetchActivos = useCallback(async () => {
    try { const res = await fetch('/api/activos'); const data = await res.json(); setActivos(Array.isArray(data) ? data : []) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchActivos() }, [fetchActivos])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true)
    try {
      const res = await fetch('/api/activos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, valor_adquisicion: form.valor_adquisicion ? parseFloat(form.valor_adquisicion) : null }) })
      if (res.ok) { setShowModal(false); setForm({ nombre: '', categoria: 'herramienta', numero_serie: '', valor_adquisicion: '', fecha_adquisicion: '', notas: '' }); fetchActivos() }
    } finally { setCreating(false) }
  }

  const filtered = activos.filter(a => a.nombre?.toLowerCase().includes(search.toLowerCase()) || a.numero_serie?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orange-400 flex items-center gap-2"><Wrench className="h-6 w-6" /> Activos Fijos</h1>
          <p className="text-sm text-slate-500 mt-1">{activos.length} activo{activos.length !== 1 ? 's' : ''} registrado{activos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-600/20 border border-orange-500/50 text-orange-400 hover:bg-orange-600/30 rounded-lg text-sm font-medium transition-all"><Plus className="h-4 w-4" /> Nuevo Activo</button>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input type="text" placeholder="Buscar activos..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-orange-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 border border-slate-800 rounded-lg"><Wrench className="h-12 w-12 mx-auto mb-4 text-slate-600" /><p className="text-slate-400">No hay activos{search ? ` para "${search}"` : ''}</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((activo, i) => {
            const Icon = categoriaIcons[activo.categoria] || Wrench
            return (
              <motion.div key={activo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5 hover:border-orange-500/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-orange-400/10"><Icon className="h-5 w-5 text-orange-400" /></div>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${estadoColors[activo.estado] || estadoColors.disponible}`}>{activo.estado?.replace('_', ' ')}</span>
                </div>
                <h3 className="font-medium text-slate-200 mb-1">{activo.nombre}</h3>
                {activo.numero_serie && <p className="text-xs text-slate-500 font-mono mb-2">S/N: {activo.numero_serie}</p>}
                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800">
                  <span className="capitalize">{activo.categoria?.replace('_', ' ')}</span>
                  {activo.valor_adquisicion && <span className="text-orange-400">${Number(activo.valor_adquisicion).toLocaleString('es-MX')}</span>}
                </div>
                {activo.asignado_nombre && <p className="text-xs text-blue-400 mt-2">→ {activo.asignado_nombre}</p>}
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-orange-400">Nuevo Activo</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div><label className="text-xs text-slate-400 uppercase tracking-wider">Nombre *</label>
                    <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-orange-500/50" placeholder="Ej: Taladro Bosch GSB 13RE" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">Categoría</label>
                      <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-orange-500/50">
                        <option value="herramienta">Herramienta</option><option value="equipo_medicion">Equipo de Medición</option><option value="equipo_computo">Equipo de Cómputo</option><option value="otro">Otro</option>
                      </select></div>
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">No. Serie</label>
                      <input value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-orange-500/50" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">Valor ($)</label>
                      <input type="number" step="0.01" value={form.valor_adquisicion} onChange={(e) => setForm({ ...form, valor_adquisicion: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-orange-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">F. Adquisición</label>
                      <input type="date" value={form.fecha_adquisicion} onChange={(e) => setForm({ ...form, fecha_adquisicion: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-orange-500/50" /></div>
                  </div>
                  <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600/20 border border-orange-500/50 text-orange-400 hover:bg-orange-600/30 disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{creating ? 'Creando...' : 'Registrar Activo'}
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
