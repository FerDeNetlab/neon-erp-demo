'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Plus, X, Loader2, Filter, Trash2, DollarSign } from 'lucide-react'

type Cotizacion = {
  id: string; numero_cotizacion: string; cliente_nombre: string; cliente_empresa: string
  estado: string; subtotal: number; iva: number; total: number; vigencia: string; created_at: string
}

type Partida = { descripcion: string; cantidad: number; unidad: string; precio_unitario: number }

const estadoConfig: Record<string, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'text-slate-400 bg-slate-400/10 border-slate-500/30' },
  enviada: { label: 'Enviada', color: 'text-blue-400 bg-blue-400/10 border-blue-500/30' },
  aceptada: { label: 'Aceptada', color: 'text-green-400 bg-green-400/10 border-green-500/30' },
  rechazada: { label: 'Rechazada', color: 'text-red-400 bg-red-400/10 border-red-500/30' },
}

export default function VentasPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterEstado, setFilterEstado] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ cliente_nombre: '', cliente_email: '', cliente_telefono: '', cliente_empresa: '', vigencia: '', notas: '' })
  const [partidas, setPartidas] = useState<Partida[]>([{ descripcion: '', cantidad: 1, unidad: 'servicio', precio_unitario: 0 }])

  const fetchCotizaciones = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterEstado) params.set('estado', filterEstado)
      const res = await fetch(`/api/ventas?${params}`)
      const data = await res.json()
      setCotizaciones(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [filterEstado])
  useEffect(() => { fetchCotizaciones() }, [fetchCotizaciones])

  const addPartida = () => setPartidas([...partidas, { descripcion: '', cantidad: 1, unidad: 'servicio', precio_unitario: 0 }])
  const removePartida = (i: number) => setPartidas(partidas.filter((_, idx) => idx !== i))
  const updatePartida = (i: number, field: string, value: string | number) => {
    const updated = [...partidas]
    updated[i] = { ...updated[i], [field]: value }
    setPartidas(updated)
  }

  const subtotal = partidas.reduce((s, p) => s + (p.cantidad * p.precio_unitario), 0)
  const iva = subtotal * 0.16
  const total = subtotal + iva

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true)
    try {
      const res = await fetch('/api/ventas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, partidas }) })
      if (res.ok) {
        setShowModal(false)
        setForm({ cliente_nombre: '', cliente_email: '', cliente_telefono: '', cliente_empresa: '', vigencia: '', notas: '' })
        setPartidas([{ descripcion: '', cantidad: 1, unidad: 'servicio', precio_unitario: 0 }])
        fetchCotizaciones()
      }
    } finally { setCreating(false) }
  }

  const updateEstado = async (id: string, estado: string) => {
    await fetch(`/api/ventas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) })
    fetchCotizaciones()
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2"><ShoppingCart className="h-6 w-6" /> Ventas / Cotizaciones</h1>
          <p className="text-sm text-slate-500 mt-1">{cotizaciones.length} cotización{cotizaciones.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-sm font-medium transition-all"><Plus className="h-4 w-4" /> Nueva Cotización</button>
      </motion.div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-slate-500" />
        {['', 'borrador', 'enviada', 'aceptada', 'rechazada'].map(estado => (
          <button key={estado} onClick={() => setFilterEstado(estado)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterEstado === estado ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}>
            {estado ? estadoConfig[estado]?.label : 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>
      ) : cotizaciones.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 border border-slate-800 rounded-lg"><ShoppingCart className="h-12 w-12 mx-auto mb-4 text-slate-600" /><p className="text-slate-400">No hay cotizaciones</p></div>
      ) : (
        <div className="space-y-3">
          {cotizaciones.map((cot, i) => {
            const est = estadoConfig[cot.estado] || estadoConfig.borrador
            return (
              <motion.div key={cot.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5 hover:border-emerald-500/20 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-emerald-400 font-mono text-sm">{cot.numero_cotizacion}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${est.color}`}>{est.label}</span>
                      </div>
                      <h3 className="text-slate-200 font-medium">{cot.cliente_nombre}</h3>
                      {cot.cliente_empresa && <p className="text-xs text-slate-500">{cot.cliente_empresa}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-400">${Number(cot.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-slate-500">Subtotal: ${Number(cot.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-500">{new Date(cot.created_at).toLocaleDateString('es-MX')}</span>
                  {cot.vigencia && <span className="text-slate-500">• Vigencia: {new Date(cot.vigencia).toLocaleDateString('es-MX')}</span>}
                  <span className="flex-1" />
                  {cot.estado === 'borrador' && <button onClick={() => updateEstado(cot.id, 'enviada')} className="text-blue-400 hover:text-blue-300">→ Marcar Enviada</button>}
                  {cot.estado === 'enviada' && (
                    <>
                      <button onClick={() => updateEstado(cot.id, 'aceptada')} className="text-green-400 hover:text-green-300">✓ Aceptar</button>
                      <button onClick={() => updateEstado(cot.id, 'rechazada')} className="text-red-400 hover:text-red-300 ml-2">✗ Rechazar</button>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-emerald-400">Nueva Cotización</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-5">
                  {/* Client info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-slate-400 uppercase">Cliente *</label>
                      <input required value={form.cliente_nombre} onChange={e => setForm({ ...form, cliente_nombre: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase">Empresa</label>
                      <input value={form.cliente_empresa} onChange={e => setForm({ ...form, cliente_empresa: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="text-xs text-slate-400 uppercase">Email</label>
                      <input type="email" value={form.cliente_email} onChange={e => setForm({ ...form, cliente_email: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase">Teléfono</label>
                      <input value={form.cliente_telefono} onChange={e => setForm({ ...form, cliente_telefono: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase">Vigencia</label>
                      <input type="date" value={form.vigencia} onChange={e => setForm({ ...form, vigencia: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" /></div>
                  </div>

                  {/* Partidas */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-slate-400 uppercase tracking-wider">Partidas</label>
                      <button type="button" onClick={addPartida} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Agregar</button>
                    </div>
                    <div className="space-y-2">
                      {partidas.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 bg-zinc-900/50 border border-slate-800 rounded-md p-3">
                          <input placeholder="Descripción *" required value={p.descripcion} onChange={e => updatePartida(i, 'descripcion', e.target.value)} className="flex-1 px-2 py-1.5 bg-transparent border-b border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                          <input type="number" min="1" placeholder="Cant." value={p.cantidad} onChange={e => updatePartida(i, 'cantidad', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1.5 bg-transparent border-b border-slate-700 text-sm text-slate-200 text-center focus:outline-none focus:border-emerald-500/50" />
                          <input type="number" step="0.01" placeholder="$ Precio" value={p.precio_unitario || ''} onChange={e => updatePartida(i, 'precio_unitario', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1.5 bg-transparent border-b border-slate-700 text-sm text-slate-200 text-right focus:outline-none focus:border-emerald-500/50" />
                          <span className="text-sm text-emerald-400 w-24 text-right font-mono">${(p.cantidad * p.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                          {partidas.length > 1 && <button type="button" onClick={() => removePartida(i)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="bg-zinc-900 border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-slate-200 font-mono">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">IVA (16%)</span><span className="text-slate-200 font-mono">${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-lg font-bold border-t border-slate-700 pt-2"><span className="text-emerald-400">Total</span><span className="text-emerald-400 font-mono">${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                  </div>

                  <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}{creating ? 'Creando...' : 'Crear Cotización'}
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
