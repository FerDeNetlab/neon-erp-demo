'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Search, Filter, Plus, X, Loader2, Calendar, User,
  MapPin, ChevronRight, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

type Order = {
  id: string; order_number: string; title: string; description: string
  service_type: string; status: string; priority: string
  client_name: string; client_phone: string; client_city: string
  scheduled_date: string; branch_name: string; created_at: string
  assignments: Array<{ full_name: string; role: string }>
}

const statusLabels: Record<string, string> = { created: 'Creada', assigned: 'Asignada', in_progress: 'En Progreso', completed: 'Completada', closed: 'Cerrada' }
const statusColors: Record<string, string> = { created: 'bg-slate-500/20 text-slate-400 border-slate-500/30', assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30', in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30', completed: 'bg-green-500/20 text-green-400 border-green-500/30', closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
const typeLabels: Record<string, string> = { fibra: 'Fibra', cctv: 'CCTV', cableado: 'Cableado', servidor: 'Servidor', otro: 'Otro' }
const typeIcons: Record<string, string> = { fibra: '🔌', cctv: '📹', cableado: '🔗', servidor: '🖥️', otro: '🔧' }
const prioColors: Record<string, string> = { urgent: 'text-red-400 bg-red-500/10 border-red-500/30', high: 'text-orange-400 bg-orange-500/10 border-orange-500/30', medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', low: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
const prioLabels: Record<string, string> = { urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' }

export default function OrdenesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [branches, setBranches] = useState<Array<{id: string; name: string}>>([])
  const [installers, setInstallers] = useState<Array<{id: string; full_name: string}>>([])

  const [form, setForm] = useState({
    title: '', description: '', service_type: 'fibra', priority: 'medium', branch_id: '',
    client_name: '', client_phone: '', client_email: '', client_address: '', client_city: '',
    scheduled_date: '', quoted_amount: '', notes: '', assigned_installers: [] as string[]
  })

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterType) params.set('type', filterType)
    if (search) params.set('search', search)
    try {
      const res = await fetch(`/api/ordenes?${params}`)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch { setOrders([]) }
    finally { setLoading(false) }
  }, [filterStatus, filterType, search])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(d => {
      if (d?.branches) setBranches(d.branches)
    })
    fetch('/api/ordenes?status=__get_installers__').catch(() => {}) // We'll add a proper endpoint
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true)
    try {
      await fetch('/api/ordenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setShowCreate(false); setForm({ title: '', description: '', service_type: 'fibra', priority: 'medium', branch_id: '', client_name: '', client_phone: '', client_email: '', client_address: '', client_city: '', scheduled_date: '', quoted_amount: '', notes: '', assigned_installers: [] })
      fetchOrders()
    } finally { setCreating(false) }
  }

  const stats = {
    total: orders.length,
    active: orders.filter(o => ['created', 'assigned', 'in_progress'].includes(o.status)).length,
    urgent: orders.filter(o => o.priority === 'urgent' && o.status !== 'completed' && o.status !== 'closed').length,
  }

  return (
    <div data-tour="ordenes-list" className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><ClipboardList className="h-6 w-6 text-blue-400" /> Órdenes de Servicio</h1>
          <p className="text-sm text-slate-500 mt-0.5">{stats.total} órdenes · {stats.active} activas{stats.urgent > 0 && <span className="text-red-400"> · {stats.urgent} urgentes</span>}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30 rounded-xl text-sm font-medium transition-all">
          <Plus className="h-4 w-4" /> Nueva Orden
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título, número o cliente..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500/50" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 bg-zinc-900/60 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none">
          <option value="">Todos los estados</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2.5 bg-zinc-900/60 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none">
          <option value="">Todos los tipos</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20"><ClipboardList className="h-12 w-12 mx-auto mb-3 text-slate-700" /><p className="text-slate-500">Sin órdenes</p></div>
      ) : (
        <div className="space-y-2">
          {orders.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Link href={`/ordenes/${o.id}`}
                className="block bg-zinc-900/60 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700/50 hover:bg-zinc-900/80 transition-all group">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{typeIcons[o.service_type] || '🔧'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-cyan-400 font-mono text-sm font-medium">{o.order_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${statusColors[o.status]}`}>{statusLabels[o.status]}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border ${prioColors[o.priority]}`}>{prioLabels[o.priority]}</span>
                      {o.priority === 'urgent' && <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{o.title}</h3>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                      {o.client_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{o.client_name}</span>}
                      {o.branch_name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.branch_name}</span>}
                      {o.scheduled_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(o.scheduled_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>}
                      {o.assignments?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {o.assignments.slice(0, 2).map(a => a.full_name?.split(' ')[0]).join(', ')}
                          {o.assignments.length > 2 && ` +${o.assignments.length - 2}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 sm:flex sm:items-center sm:justify-center sm:p-4">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#0a0a0a] z-10">
                  <h2 className="text-lg font-bold text-white">📋 Nueva Orden de Servicio</h2>
                  <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="text-xs text-slate-400 uppercase">Título *</label>
                      <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Instalación fibra FTTH"
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase">Tipo</label>
                      <select value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none">
                        {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{typeIcons[k]} {v}</option>)}
                      </select></div>
                    <div><label className="text-xs text-slate-400 uppercase">Prioridad</label>
                      <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none">
                        {Object.entries(prioLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select></div>
                    <div><label className="text-xs text-slate-400 uppercase">Sucursal *</label>
                      <select required value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none">
                        <option value="">Seleccionar...</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select></div>
                    <div><label className="text-xs text-slate-400 uppercase">Fecha Programada</label>
                      <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none" /></div>
                  </div>
                  <div className="border-t border-slate-800 pt-4">
                    <p className="text-xs text-slate-500 uppercase font-medium mb-3">Datos del Cliente</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-slate-400">Nombre</label>
                        <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
                          className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none" /></div>
                      <div><label className="text-xs text-slate-400">Teléfono</label>
                        <input value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })}
                          className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none" /></div>
                      <div className="col-span-2"><label className="text-xs text-slate-400">Dirección</label>
                        <input value={form.client_address} onChange={e => setForm({ ...form, client_address: e.target.value })}
                          className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none" /></div>
                      <div><label className="text-xs text-slate-400">Ciudad</label>
                        <input value={form.client_city} onChange={e => setForm({ ...form, client_city: e.target.value })}
                          className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none" /></div>
                      <div><label className="text-xs text-slate-400">Monto Cotizado</label>
                        <input type="number" value={form.quoted_amount} onChange={e => setForm({ ...form, quoted_amount: e.target.value })} placeholder="$0"
                          className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none" /></div>
                    </div>
                  </div>
                  <div><label className="text-xs text-slate-400 uppercase">Descripción</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                      className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 resize-none focus:outline-none" /></div>
                  <button type="submit" disabled={creating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/20 border border-blue-500/50 text-blue-400 disabled:opacity-50 rounded-xl text-sm font-medium">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {creating ? 'Creando...' : 'Crear Orden'}
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
