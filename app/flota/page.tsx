'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, Plus, X, Loader2, Search, Fuel, Settings, AlertTriangle, Eye,
  Calendar, Gauge
} from 'lucide-react'
import Link from 'next/link'

type Vehiculo = {
  id: string; placa: string; marca: string; modelo: string; anio: number; color: string
  tipo: string; estado: string; conductor_nombre: string; km_actual: number
  vigencia_seguro: string; verificacion_vigencia: string
}

const estadoColors: Record<string, string> = {
  activo: 'text-green-400 bg-green-400/10 border-green-500/30',
  en_taller: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30',
  dado_de_baja: 'text-red-400 bg-red-400/10 border-red-500/30',
}

export default function FlotaPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ placa: '', marca: '', modelo: '', anio: '', color: '', tipo: 'camioneta', km_actual: '' })

  const fetchVehiculos = useCallback(async () => {
    try { const res = await fetch('/api/flota'); const data = await res.json(); setVehiculos(Array.isArray(data) ? data : []) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchVehiculos() }, [fetchVehiculos])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true)
    try {
      const res = await fetch('/api/flota', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, anio: form.anio ? parseInt(form.anio) : null, km_actual: form.km_actual ? parseInt(form.km_actual) : 0 }) })
      if (res.ok) { setShowModal(false); setForm({ placa: '', marca: '', modelo: '', anio: '', color: '', tipo: 'camioneta', km_actual: '' }); fetchVehiculos() }
    } finally { setCreating(false) }
  }

  const filtered = vehiculos.filter(v => v.placa?.toLowerCase().includes(search.toLowerCase()) || v.marca?.toLowerCase().includes(search.toLowerCase()) || v.modelo?.toLowerCase().includes(search.toLowerCase()))

  // Check for documents near expiry (30 days)
  const today = new Date()
  const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringDocs = vehiculos.filter(v => {
    const seguro = v.vigencia_seguro ? new Date(v.vigencia_seguro) : null
    const verif = v.verificacion_vigencia ? new Date(v.verificacion_vigencia) : null
    return (seguro && seguro <= thirtyDays) || (verif && verif <= thirtyDays)
  })

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2"><Truck className="h-6 w-6" /> Flota Vehicular</h1>
          <p className="text-sm text-slate-500 mt-1">{vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/30 rounded-lg text-sm font-medium transition-all"><Plus className="h-4 w-4" /> Nuevo Vehículo</button>
      </motion.div>

      {expiringDocs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-orange-400 font-medium">{expiringDocs.length} vehículo{expiringDocs.length !== 1 ? 's' : ''} con documentos por vencer</p>
            <p className="text-xs text-orange-400/70 mt-1">{expiringDocs.map(v => v.placa).join(', ')}</p>
          </div>
        </motion.div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input type="text" placeholder="Buscar por placa, marca o modelo..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-500/50 transition-colors" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-yellow-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 border border-slate-800 rounded-lg"><Truck className="h-12 w-12 mx-auto mb-4 text-slate-600" /><p className="text-slate-400">No hay vehículos</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/50 border border-slate-800 rounded-lg overflow-hidden hover:border-yellow-500/20 transition-colors group">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-yellow-400 font-mono">{v.placa}</h3>
                  <p className="text-sm text-slate-400">{[v.marca, v.modelo, v.anio].filter(Boolean).join(' ')}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${estadoColors[v.estado] || estadoColors.activo}`}>{v.estado?.replace('_', ' ')}</span>
              </div>
              {/* Details */}
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Gauge className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">{v.km_actual ? `${Number(v.km_actual).toLocaleString('es-MX')} km` : '— km'}</span>
                </div>
                {v.conductor_nombre && (
                  <div className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4 text-slate-500" />
                    <span className="text-blue-400">{v.conductor_nombre}</span>
                  </div>
                )}
                {v.color && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full border border-slate-600" style={{ background: v.color.toLowerCase() }} />
                    <span className="text-slate-400 capitalize">{v.color}</span>
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="px-5 py-3 border-t border-slate-800 flex items-center gap-3">
                <Link href={`/flota/${v.id}`} className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
                  <Eye className="h-3.5 w-3.5" /> Ver Detalle
                </Link>
                <span className="text-slate-700">|</span>
                <Link href={`/flota/${v.id}?tab=combustible`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-green-400 transition-colors">
                  <Fuel className="h-3.5 w-3.5" /> Combustible
                </Link>
                <Link href={`/flota/${v.id}?tab=mantenimiento`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors">
                  <Calendar className="h-3.5 w-3.5" /> Manto.
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-yellow-400">Nuevo Vehículo</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div><label className="text-xs text-slate-400 uppercase tracking-wider">Placa *</label>
                    <input required value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-yellow-500/50 font-mono uppercase" placeholder="Ej: ABC-123" /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">Marca</label>
                      <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-yellow-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">Modelo</label>
                      <input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-yellow-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">Año</label>
                      <input type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-yellow-500/50" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">Color</label>
                      <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-yellow-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">Tipo</label>
                      <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-yellow-500/50">
                        <option value="camioneta">Camioneta</option><option value="sedan">Sedán</option><option value="van">Van</option><option value="otro">Otro</option>
                      </select></div>
                    <div><label className="text-xs text-slate-400 uppercase tracking-wider">Km Actual</label>
                      <input type="number" value={form.km_actual} onChange={(e) => setForm({ ...form, km_actual: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-yellow-500/50" /></div>
                  </div>
                  <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/30 disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{creating ? 'Creando...' : 'Registrar Vehículo'}
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
