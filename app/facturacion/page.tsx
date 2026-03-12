'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Plus, X, Loader2, Filter, DollarSign, CheckCircle2, Clock, Ban } from 'lucide-react'

type Factura = {
  id: string; numero_factura: string; numero_ticket: string; cliente_nombre: string; cliente_rfc: string
  concepto: string; subtotal: number; iva: number; total: number; estado: string
  metodo_pago: string; fecha_emision: string; fecha_vencimiento: string; fecha_pago: string; created_at: string
}

const estadoConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendiente: { label: 'Pendiente', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30', icon: Clock },
  pagada: { label: 'Pagada', color: 'text-green-400 bg-green-400/10 border-green-500/30', icon: CheckCircle2 },
  vencida: { label: 'Vencida', color: 'text-red-400 bg-red-400/10 border-red-500/30', icon: Ban },
  cancelada: { label: 'Cancelada', color: 'text-slate-400 bg-slate-400/10 border-slate-500/30', icon: Ban },
}

export default function FacturacionPage() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterEstado, setFilterEstado] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ cliente_nombre: '', cliente_rfc: '', cliente_email: '', concepto: '', subtotal: '', metodo_pago: 'transferencia', fecha_vencimiento: '' })

  const fetchFacturas = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterEstado) params.set('estado', filterEstado)
      const res = await fetch(`/api/facturacion?${params}`)
      const data = await res.json()
      setFacturas(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [filterEstado])
  useEffect(() => { fetchFacturas() }, [fetchFacturas])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true)
    try {
      const sub = parseFloat(form.subtotal) || 0
      const res = await fetch('/api/facturacion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, subtotal: sub, iva: sub * 0.16, total: sub * 1.16 }) })
      if (res.ok) { setShowModal(false); setForm({ cliente_nombre: '', cliente_rfc: '', cliente_email: '', concepto: '', subtotal: '', metodo_pago: 'transferencia', fecha_vencimiento: '' }); fetchFacturas() }
    } finally { setCreating(false) }
  }

  const markPaid = async (id: string) => {
    await fetch(`/api/facturacion/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'pagada', fecha_pago: new Date().toISOString().split('T')[0] }) })
    fetchFacturas()
  }

  const totalPendiente = facturas.filter(f => f.estado === 'pendiente').reduce((s, f) => s + Number(f.total), 0)
  const totalPagado = facturas.filter(f => f.estado === 'pagada').reduce((s, f) => s + Number(f.total), 0)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-lime-400 flex items-center gap-2"><Receipt className="h-6 w-6" /> Facturación</h1>
          <p className="text-sm text-slate-500 mt-1">{facturas.length} factura{facturas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-lime-600/20 border border-lime-500/50 text-lime-400 hover:bg-lime-600/30 rounded-lg text-sm font-medium transition-all"><Plus className="h-4 w-4" /> Nueva Factura</button>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Por Cobrar</p>
          <p className="text-2xl font-bold text-yellow-400">${totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Cobrado</p>
          <p className="text-2xl font-bold text-green-400">${totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-slate-500" />
        {['', 'pendiente', 'pagada', 'vencida', 'cancelada'].map(estado => (
          <button key={estado} onClick={() => setFilterEstado(estado)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterEstado === estado ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}>
            {estado ? estadoConfig[estado]?.label : 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-lime-400" /></div>
      ) : facturas.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 border border-slate-800 rounded-lg"><Receipt className="h-12 w-12 mx-auto mb-4 text-slate-600" /><p className="text-slate-400">No hay facturas</p></div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900/50 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Concepto</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Emisión</th>
                  <th className="text-left px-4 py-3">Ticket</th>
                  <th className="text-left px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f, i) => {
                  const est = estadoConfig[f.estado] || estadoConfig.pendiente
                  const EstIcon = est.icon
                  return (
                    <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-lime-400 font-mono text-xs">{f.numero_factura}</td>
                      <td className="px-4 py-3"><span className="text-slate-200 font-medium">{f.cliente_nombre}</span>{f.cliente_rfc && <span className="block text-xs text-slate-500">{f.cliente_rfc}</span>}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate">{f.concepto || '—'}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${est.color}`}><EstIcon className="h-3 w-3" />{est.label}</span></td>
                      <td className="px-4 py-3 text-right font-mono text-lime-400 font-medium">${Number(f.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString('es-MX') : '—'}</td>
                      <td className="px-4 py-3 text-cyan-400 font-mono text-xs">{f.numero_ticket || '—'}</td>
                      <td className="px-4 py-3">{f.estado === 'pendiente' && <button onClick={() => markPaid(f.id)} className="text-xs text-green-400 hover:text-green-300">✓ Pagada</button>}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-lime-400">Nueva Factura</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-slate-400 uppercase">Cliente *</label>
                      <input required value={form.cliente_nombre} onChange={e => setForm({ ...form, cliente_nombre: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-lime-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase">RFC</label>
                      <input value={form.cliente_rfc} onChange={e => setForm({ ...form, cliente_rfc: e.target.value.toUpperCase() })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 font-mono uppercase focus:outline-none focus:border-lime-500/50" /></div>
                  </div>
                  <div><label className="text-xs text-slate-400 uppercase">Concepto</label>
                    <textarea value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 resize-none focus:outline-none focus:border-lime-500/50" /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="text-xs text-slate-400 uppercase">Subtotal *</label>
                      <input required type="number" step="0.01" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-lime-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase">Método Pago</label>
                      <select value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-lime-500/50">
                        <option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="cheque">Cheque</option><option value="tarjeta">Tarjeta</option>
                      </select></div>
                    <div><label className="text-xs text-slate-400 uppercase">Vencimiento</label>
                      <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-lime-500/50" /></div>
                  </div>
                  {form.subtotal && (
                    <div className="bg-zinc-900 border border-slate-800 rounded-lg p-3 space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-slate-200 font-mono">${parseFloat(form.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">IVA (16%)</span><span className="text-slate-200 font-mono">${(parseFloat(form.subtotal) * 0.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between font-bold border-t border-slate-700 pt-1"><span className="text-lime-400">Total</span><span className="text-lime-400 font-mono">${(parseFloat(form.subtotal) * 1.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                    </div>
                  )}
                  <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-lime-600/20 border border-lime-500/50 text-lime-400 hover:bg-lime-600/30 disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}{creating ? 'Creando...' : 'Crear Factura'}
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
