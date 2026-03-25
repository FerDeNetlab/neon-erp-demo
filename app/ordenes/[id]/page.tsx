'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Calendar, User, Camera, Package, DollarSign,
  AlertTriangle, Loader2, PlayCircle, CheckCircle2, Lock, Phone, Mail,
  Clock, Upload, Send, X, Truck
} from 'lucide-react'
import Link from 'next/link'

type OrderDetail = {
  id: string; order_number: string; title: string; description: string
  service_type: string; status: string; priority: string
  client_name: string; client_phone: string; client_email: string; client_address: string; client_city: string
  branch_name: string; scheduled_date: string; quoted_amount: number
  started_at: string; completed_at: string; closed_at: string; created_at: string; notes: string
  assignments: Array<{ full_name: string; email: string; phone: string; role: string; user_role: string }>
  evidence: Array<{ id: string; type: string; url: string; description: string; stage: string; uploaded_by_name: string; created_at: string }>
  incidents: Array<{ id: string; type: string; severity: string; title: string; description: string; status: string; reported_by_name: string; created_at: string }>
  materials: Array<{ id: string; item_name: string; unit: string; quantity: number; unit_cost: number; created_at: string }>
  costs: Array<{ id: string; cost_type: string; description: string; amount: number; hours: number; km_traveled: number }>
}

const statusLabels: Record<string, string> = { created: 'Creada', assigned: 'Asignada', in_progress: 'En Progreso', completed: 'Completada', closed: 'Cerrada' }
const statusColors: Record<string, string> = { created: 'text-slate-400 bg-slate-500/20 border-slate-500/40', assigned: 'text-blue-400 bg-blue-500/20 border-blue-500/40', in_progress: 'text-amber-400 bg-amber-500/20 border-amber-500/40', completed: 'text-green-400 bg-green-500/20 border-green-500/40', closed: 'text-gray-400 bg-gray-500/20 border-gray-500/40' }
const typeIcons: Record<string, string> = { fibra: '🔌', cctv: '📹', cableado: '🔗', servidor: '🖥️', otro: '🔧' }
const prioColors: Record<string, string> = { urgent: 'text-red-400 bg-red-500/10 border-red-500/30', high: 'text-orange-400 bg-orange-500/10 border-orange-500/30', medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', low: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
const costTypeLabels: Record<string, string> = { materials: '📦 Materiales', labor: '👷 Mano de obra', transport: '🚛 Traslado', other: '📌 Otro' }
const sevColors: Record<string, string> = { critical: 'text-red-400 bg-red-500/10', high: 'text-orange-400 bg-orange-500/10', medium: 'text-yellow-400 bg-yellow-500/10', low: 'text-slate-400 bg-slate-500/10' }

function fmtMoney(n: number | string) { return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0 }) }

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchOrder = useCallback(async () => {
    try { const res = await fetch(`/api/ordenes/${id}`); const d = await res.json(); setOrder(d) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [id])
  useEffect(() => { fetchOrder() }, [fetchOrder])

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      await fetch(`/api/ordenes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
      fetchOrder()
    } finally { setUpdating(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!order) return <div className="text-center py-20 text-slate-400">Orden no encontrada</div>

  const nextActions: Record<string, { label: string; value: string; icon: typeof PlayCircle; color: string }> = {
    created: { label: 'Asignar', value: 'assigned', icon: User, color: 'text-blue-400 bg-blue-600/20 border-blue-500/50' },
    assigned: { label: 'Iniciar Trabajo', value: 'in_progress', icon: PlayCircle, color: 'text-amber-400 bg-amber-600/20 border-amber-500/50' },
    in_progress: { label: 'Completar', value: 'completed', icon: CheckCircle2, color: 'text-green-400 bg-green-600/20 border-green-500/50' },
    completed: { label: 'Cerrar', value: 'closed', icon: Lock, color: 'text-gray-400 bg-gray-600/20 border-gray-500/50' },
  }
  const action = nextActions[order.status]
  const totalCosts = (order.costs || []).reduce((sum, c) => sum + Number(c.amount), 0)

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link href="/ordenes" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Órdenes</Link>
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{typeIcons[order.service_type] || '🔧'}</span>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-cyan-400 font-mono text-sm font-semibold">{order.order_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs border ${prioColors[order.priority]}`}>{order.priority}</span>
              </div>
              <h1 className="text-lg font-bold text-white">{order.title}</h1>
            </div>
          </div>
          {action && (
            <button onClick={() => updateStatus(action.value)} disabled={updating}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${action.color} hover:opacity-80 disabled:opacity-50`}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <action.icon className="h-4 w-4" />} {action.label}
            </button>
          )}
        </div>
        {order.description && <p className="text-sm text-slate-400 mt-3">{order.description}</p>}

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          {order.client_name && <div className="text-xs"><span className="text-slate-500 block flex items-center gap-1"><User className="h-3 w-3" />Cliente</span><span className="text-slate-200 font-medium">{order.client_name}</span></div>}
          {order.client_phone && <div className="text-xs"><span className="text-slate-500 block flex items-center gap-1"><Phone className="h-3 w-3" />Teléfono</span><a href={`tel:${order.client_phone}`} className="text-cyan-400">{order.client_phone}</a></div>}
          {order.scheduled_date && <div className="text-xs"><span className="text-slate-500 block flex items-center gap-1"><Calendar className="h-3 w-3" />Programado</span><span className="text-slate-200">{new Date(order.scheduled_date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>}
          {order.branch_name && <div className="text-xs"><span className="text-slate-500 block flex items-center gap-1"><MapPin className="h-3 w-3" />Sucursal</span><span className="text-slate-200">{order.branch_name}</span></div>}
          {order.client_address && <div className="text-xs col-span-2"><span className="text-slate-500 block flex items-center gap-1"><MapPin className="h-3 w-3" />Dirección</span><span className="text-slate-200">{order.client_address}{order.client_city ? `, ${order.client_city}` : ''}</span></div>}
          <div className="text-xs"><span className="text-slate-500 block flex items-center gap-1"><DollarSign className="h-3 w-3" />Cotizado</span><span className="text-emerald-400 font-semibold">{fmtMoney(order.quoted_amount)}</span></div>
          {order.started_at && <div className="text-xs"><span className="text-slate-500 block flex items-center gap-1"><Clock className="h-3 w-3" />Iniciado</span><span className="text-slate-200">{new Date(order.started_at).toLocaleDateString('es-MX')}</span></div>}
        </div>
      </motion.div>

      {/* Assignments */}
      {order.assignments?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-zinc-900/60 border border-blue-500/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2"><User className="h-4 w-4" /> Técnicos Asignados ({order.assignments.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {order.assignments.map((a, i) => (
              <div key={i} className="flex items-center gap-3 bg-zinc-800/40 rounded-lg p-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">{a.full_name?.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 font-medium">{a.full_name}</p>
                  <p className="text-[10px] text-slate-500">{a.role === 'lead' ? '⭐ Líder' : 'Instalador'} · {a.email}</p>
                </div>
                {a.phone && <a href={`tel:${a.phone}`} className="ml-auto text-cyan-400"><Phone className="h-4 w-4" /></a>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Costs */}
      {order.costs?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Costeo ({order.costs.length})</h2>
          <div className="space-y-2">
            {order.costs.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-zinc-800/40 rounded-lg p-3">
                <div>
                  <p className="text-sm text-slate-200">{costTypeLabels[c.cost_type] || c.cost_type} — {c.description}</p>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {c.hours && `${c.hours}h `}{c.km_traveled && `${c.km_traveled}km`}
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-400">{fmtMoney(c.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-800 pt-3 mt-2">
              <span className="text-sm font-medium text-slate-300">Costo Total</span>
              <span className="text-sm font-bold text-white">{fmtMoney(totalCosts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-slate-300">Margen</span>
              <span className={`text-sm font-bold ${Number(order.quoted_amount) - totalCosts >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmtMoney(Number(order.quoted_amount) - totalCosts)} ({Number(order.quoted_amount) > 0 ? Math.round((Number(order.quoted_amount) - totalCosts) / Number(order.quoted_amount) * 100) : 0}%)
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Materials */}
      {order.materials?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-zinc-900/60 border border-purple-500/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Material Consumido ({order.materials.length})</h2>
          <div className="space-y-2">
            {order.materials.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-zinc-800/40 rounded-lg p-3">
                <div><p className="text-sm text-slate-200">{m.item_name}</p><p className="text-[10px] text-slate-500">{Number(m.quantity)} {m.unit}</p></div>
                <span className="text-xs text-slate-400">{fmtMoney(Number(m.quantity) * Number(m.unit_cost))}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Evidence */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2"><Camera className="h-4 w-4" /> Evidencias ({order.evidence?.length || 0})</h2>
        {!order.evidence?.length ? (
          <p className="text-xs text-slate-500 py-6 text-center">Sin evidencias registradas</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {order.evidence.map(ev => (
              <div key={ev.id} className="bg-zinc-800/40 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{ev.stage}</span>
                  <span className="text-[10px] text-slate-500">{new Date(ev.created_at).toLocaleDateString('es-MX')}</span>
                </div>
                <p className="text-sm text-slate-200">{ev.description}</p>
                {ev.uploaded_by_name && <p className="text-[10px] text-slate-500 mt-1">📸 {ev.uploaded_by_name}</p>}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Incidents */}
      {order.incidents?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-zinc-900/60 border border-red-500/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Incidencias ({order.incidents.length})</h2>
          <div className="space-y-2">
            {order.incidents.map(inc => (
              <div key={inc.id} className="bg-zinc-800/40 border border-slate-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${sevColors[inc.severity] || sevColors.medium}`}>{inc.severity}</span>
                  <span className={`text-[10px] ${inc.status === 'open' ? 'text-yellow-400' : 'text-green-400'}`}>{inc.status}</span>
                  <span className="text-[10px] text-slate-500 ml-auto">{new Date(inc.created_at).toLocaleDateString('es-MX')}</span>
                </div>
                <p className="text-sm text-slate-200">{inc.title || inc.description}</p>
                {inc.reported_by_name && <p className="text-[10px] text-slate-500 mt-1">Reportó: {inc.reported_by_name}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
