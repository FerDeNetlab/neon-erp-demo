'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Plus, Search, Filter, X, ArrowUpDown,
  Clock, CheckCircle2, AlertCircle, XCircle, Loader2
} from 'lucide-react'

type Ticket = {
  id: string
  numero_ticket: string
  titulo: string
  descripcion: string
  tipo: string
  estado: string
  prioridad: string
  cliente_nombre: string
  ciudad: string
  fecha_programada: string
  created_at: string
}

const estadoConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendiente: { label: 'Pendiente', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30', icon: Clock },
  en_progreso: { label: 'En Progreso', color: 'text-blue-400 bg-blue-400/10 border-blue-500/30', icon: ArrowUpDown },
  completado: { label: 'Completado', color: 'text-green-400 bg-green-400/10 border-green-500/30', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'text-red-400 bg-red-400/10 border-red-500/30', icon: XCircle },
}

const prioridadConfig: Record<string, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'text-slate-400' },
  media: { label: 'Media', color: 'text-yellow-400' },
  alta: { label: 'Alta', color: 'text-orange-400' },
  urgente: { label: 'Urgente', color: 'text-red-400' },
}

const tipoOptions = ['fibra', 'cctv', 'cableado', 'servidor', 'otro']

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    titulo: '', descripcion: '', tipo: 'otro', prioridad: 'media',
    cliente_nombre: '', cliente_telefono: '', direccion: '', ciudad: '', fecha_programada: ''
  })

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterEstado) params.set('estado', filterEstado)
      const res = await fetch(`/api/tickets?${params}`)
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [filterEstado])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowModal(false)
        setForm({ titulo: '', descripcion: '', tipo: 'otro', prioridad: 'media', cliente_nombre: '', cliente_telefono: '', direccion: '', ciudad: '', fecha_programada: '' })
        fetchTickets()
      }
    } finally {
      setCreating(false)
    }
  }

  const filtered = tickets.filter(t =>
    t.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    t.numero_ticket?.toLowerCase().includes(search.toLowerCase()) ||
    t.cliente_nombre?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <ClipboardList className="h-6 w-6" /> Tickets de Trabajo
          </h1>
          <p className="text-sm text-slate-500 mt-1">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} registrado{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-600/30 rounded-lg text-sm font-medium transition-all">
          <Plus className="h-4 w-4" /> Nuevo Ticket
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Buscar tickets..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          {['', 'pendiente', 'en_progreso', 'completado'].map(estado => (
            <button key={estado} onClick={() => setFilterEstado(estado)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterEstado === estado ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}>
              {estado ? estadoConfig[estado]?.label : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-zinc-900/50 border border-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500"><ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No hay tickets{search ? ` para "${search}"` : ''}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Título</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Prioridad</th>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket, i) => {
                  const estado = estadoConfig[ticket.estado] || estadoConfig.pendiente
                  const prioridad = prioridadConfig[ticket.prioridad] || prioridadConfig.media
                  const EstadoIcon = estado.icon
                  return (
                    <motion.tr key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors">
                      <td className="px-4 py-3 text-cyan-400 font-mono text-xs">{ticket.numero_ticket}</td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{ticket.titulo}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs capitalize">{ticket.tipo}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${estado.color}`}><EstadoIcon className="h-3 w-3" />{estado.label}</span></td>
                      <td className={`px-4 py-3 text-xs font-medium ${prioridad.color}`}>{prioridad.label}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{ticket.cliente_nombre || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{ticket.fecha_programada ? new Date(ticket.fecha_programada).toLocaleDateString('es-MX') : '—'}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-cyan-400">Nuevo Ticket</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Título *</label>
                    <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Descripción</label>
                    <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3}
                      className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider">Tipo</label>
                      <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                        {tipoOptions.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider">Prioridad</label>
                      <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                        {Object.entries(prioridadConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider">Cliente</label>
                      <input value={form.cliente_nombre} onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider">Teléfono</label>
                      <input value={form.cliente_telefono} onChange={(e) => setForm({ ...form, cliente_telefono: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Dirección</label>
                    <input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider">Ciudad</label>
                      <input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider">Fecha Programada</label>
                      <input type="date" value={form.fecha_programada} onChange={(e) => setForm({ ...form, fecha_programada: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                    </div>
                  </div>
                  <button type="submit" disabled={creating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-600/30 disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {creating ? 'Creando...' : 'Crear Ticket'}
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
