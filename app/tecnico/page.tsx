'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HardHat, Loader2, MapPin, Calendar, User, Phone, Wrench, ChevronRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type Order = { id: string; order_number: string; title: string; service_type: string; status: string; priority: string; client_name: string; client_address: string; client_phone: string; branch_name: string; scheduled_date: string; team: Array<{full_name: string; role: string}> }
type Tool = { name: string; brand: string; serial_number: string; assigned_at: string }

const statusLabels: Record<string, string> = { created: 'Creada', assigned: 'Asignada', in_progress: 'En Progreso', completed: 'Completada' }
const statusColors: Record<string, string> = { created: 'bg-slate-500/20 text-slate-400', assigned: 'bg-blue-500/20 text-blue-400', in_progress: 'bg-amber-500/20 text-amber-400', completed: 'bg-green-500/20 text-green-400' }
const typeIcons: Record<string, string> = { fibra: '🔌', cctv: '📹', cableado: '🔗', servidor: '🖥️', otro: '🔧' }
const prioColors: Record<string, string> = { urgent: 'border-red-500/50 bg-red-500/5', high: 'border-orange-500/30', medium: 'border-slate-800/50', low: 'border-slate-800/50' }

export default function TecnicoPage() {
  const [data, setData] = useState<{orders: Order[]; tools: Tool[]; stats: Record<string, number>} | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch('/api/tecnico').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  return (
    <div data-tour="tecnico-orders" className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><HardHat className="h-6 w-6 text-cyan-400" /> Portal Técnico</h1>
        <p className="text-sm text-slate-500 mt-0.5">Tus órdenes asignadas y herramientas en resguardo</p></div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/60 border border-amber-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{data.stats.in_progress}</p><p className="text-xs text-slate-500">En Progreso</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-zinc-900/60 border border-green-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{data.stats.completed_week}</p><p className="text-xs text-slate-500">Completadas (semana)</p></motion.div>
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">📋 Mis Órdenes ({data.orders?.length || 0})</h2>
        <div className="space-y-2">
          {(data.orders || []).map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link href={`/ordenes/${o.id}`}
                className={`block bg-zinc-900/60 border rounded-xl p-4 hover:bg-zinc-900/80 transition-all group ${prioColors[o.priority]}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeIcons[o.service_type] || '🔧'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cyan-400 font-mono text-xs">{o.order_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusColors[o.status]}`}>{statusLabels[o.status]}</span>
                      {o.priority === 'urgent' && <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white">{o.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      {o.client_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{o.client_name}</span>}
                      {o.client_phone && <a href={`tel:${o.client_phone}`} className="flex items-center gap-1 text-cyan-400"><Phone className="h-3 w-3" />{o.client_phone}</a>}
                      {o.branch_name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.branch_name}</span>}
                      {o.scheduled_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(o.scheduled_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                    {o.client_address && <p className="text-[10px] text-slate-600 mt-1">📍 {o.client_address}</p>}
                    {o.team?.length > 0 && <p className="text-[10px] text-slate-600 mt-1">👥 {o.team.map(t => t.full_name.split(' ')[0]).join(', ')}</p>}
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400" />
                </div>
              </Link>
            </motion.div>
          ))}
          {(!data.orders || data.orders.length === 0) && <p className="text-center py-12 text-slate-500">Sin órdenes asignadas 🎉</p>}
        </div>
      </div>

      {/* Tools */}
      {data.tools?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2"><Wrench className="h-4 w-4" /> Herramientas en Resguardo ({data.tools.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.tools.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.03 }}
                className="bg-zinc-900/60 border border-orange-500/20 rounded-xl p-3 flex items-center gap-3">
                <Wrench className="h-5 w-5 text-orange-400 flex-shrink-0" />
                <div><p className="text-sm text-slate-200">{t.name}</p>
                  <p className="text-[10px] text-slate-500">{t.brand} · {t.serial_number}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
