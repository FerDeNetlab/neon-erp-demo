'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  HardHat, ClipboardList, Clock, CheckCircle2, AlertTriangle, Camera,
  MapPin, ChevronRight, Loader2, CalendarDays, Zap, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

type Ticket = {
  id: string; numero_ticket: string; titulo: string; descripcion: string
  tipo: string; estado: string; prioridad: string; cliente_nombre: string
  direccion: string; ciudad: string; fecha_programada: string; asignado_nombre: string
}
type Evidencia = { id: string; numero_ticket: string; ticket_titulo: string; tipo: string; descripcion: string; created_at: string }
type Incidencia = { id: string; numero_ticket: string; descripcion: string; severidad: string; estado: string }

type TecnicoData = {
  ticketsPendientes: Ticket[]; ticketsHoy: Ticket[]; completadosHoy: number
  evidenciasRecientes: Evidencia[]; incidenciasAbiertas: Incidencia[]
  stats: { pendientes: number; enProgreso: number; completados: number }
}

const prioridadConfig: Record<string, { color: string; bg: string; border: string }> = {
  urgente: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-500/30' },
  alta: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-500/30' },
  media: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500/30' },
  baja: { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-500/30' },
}

const tipoIcons: Record<string, string> = { fibra: '🔌', cctv: '📹', cableado: '🔗', servidor: '🖥️', otro: '🔧' }

export default function TecnicoPage() {
  const [data, setData] = useState<TecnicoData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try { const res = await fetch('/api/tecnico'); const d = await res.json(); setData(d) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return <div className="text-center py-20 text-slate-400">Error al cargar datos</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-cyan-400/10 border border-cyan-500/20"><HardHat className="h-6 w-6 text-cyan-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">Portal del Técnico</h1>
            <p className="text-sm text-slate-500">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pendientes', value: data.stats.pendientes, icon: Clock, color: 'text-yellow-400', border: 'border-yellow-500/20' },
          { label: 'En Progreso', value: data.stats.enProgreso, icon: Zap, color: 'text-blue-400', border: 'border-blue-500/20' },
          { label: 'Completados', value: data.stats.completados, icon: CheckCircle2, color: 'text-green-400', border: 'border-green-500/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`bg-zinc-900/50 border ${s.border} rounded-xl p-4 text-center`}>
            <s.icon className={`h-5 w-5 ${s.color} mx-auto mb-1`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Today's schedule */}
      {data.ticketsHoy.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-5">
          <h2 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Trabajos para Hoy ({data.ticketsHoy.length})</h2>
          <div className="space-y-2">
            {data.ticketsHoy.map(t => (
              <Link key={t.id} href={`/tecnico/${t.id}`}
                className="flex items-center justify-between bg-zinc-900/80 border border-slate-700/50 rounded-lg p-3 hover:border-cyan-500/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tipoIcons[t.tipo] || '🔧'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cyan-400 font-mono">{t.numero_ticket}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border ${(prioridadConfig[t.prioridad] || prioridadConfig.media).bg} ${(prioridadConfig[t.prioridad] || prioridadConfig.media).color} ${(prioridadConfig[t.prioridad] || prioridadConfig.media).border}`}>{t.prioridad}</span>
                    </div>
                    <p className="text-sm text-slate-200 mt-0.5">{t.titulo}</p>
                    {t.direccion && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{t.direccion}{t.ciudad ? `, ${t.ciudad}` : ''}</p>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pending tickets */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <h2 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-yellow-400" /> Tickets Pendientes</h2>
        {data.ticketsPendientes.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/50 border border-slate-800 rounded-xl"><CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-400" /><p className="text-slate-400">¡Sin pendientes! 🎉</p></div>
        ) : (
          <div className="space-y-2">
            {data.ticketsPendientes.map((t, i) => {
              const prio = prioridadConfig[t.prioridad] || prioridadConfig.media
              return (
                <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04 }}>
                  <Link href={`/tecnico/${t.id}`}
                    className="flex items-center justify-between bg-zinc-900/50 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/20 transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${t.prioridad === 'urgente' ? 'bg-red-500 animate-pulse' : t.prioridad === 'alta' ? 'bg-orange-400' : t.prioridad === 'media' ? 'bg-yellow-400' : 'bg-slate-500'}`} />
                      <span className="text-xl flex-shrink-0">{tipoIcons[t.tipo] || '🔧'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-cyan-400 font-mono">{t.numero_ticket}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${prio.bg} ${prio.color} ${prio.border}`}>{t.prioridad}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${t.estado === 'en_progreso' ? 'bg-blue-400/10 text-blue-400 border border-blue-500/30' : 'bg-yellow-400/10 text-yellow-400 border border-yellow-500/30'}`}>{t.estado === 'en_progreso' ? 'En Progreso' : 'Pendiente'}</span>
                        </div>
                        <p className="text-sm text-slate-200 mt-1 truncate">{t.titulo}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {t.cliente_nombre && <span>{t.cliente_nombre}</span>}
                          {t.fecha_programada && <span>📅 {new Date(t.fecha_programada).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>}
                          {t.ciudad && <span><MapPin className="h-3 w-3 inline" /> {t.ciudad}</span>}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0 ml-2" />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Bottom grid: Recent evidence & Open incidents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent evidence */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="bg-zinc-900/50 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2"><Camera className="h-4 w-4" /> Evidencias Recientes</h2>
          {data.evidenciasRecientes.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Sin evidencias recientes</p>
          ) : (
            <div className="space-y-2">
              {data.evidenciasRecientes.map(e => (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0">
                  <div className="p-1.5 rounded bg-blue-400/10"><Camera className="h-3.5 w-3.5 text-blue-400" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-200 truncate">{e.descripcion}</p>
                    <p className="text-[10px] text-slate-500">{e.numero_ticket} • {new Date(e.created_at).toLocaleDateString('es-MX')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Open incidents */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="bg-zinc-900/50 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Incidencias Abiertas</h2>
          {data.incidenciasAbiertas.length === 0 ? (
            <p className="text-xs text-green-400 py-4 text-center">✓ Sin incidencias abiertas</p>
          ) : (
            <div className="space-y-2">
              {data.incidenciasAbiertas.map(inc => (
                <div key={inc.id} className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0">
                  <div className={`px-1.5 py-0.5 rounded text-[10px] ${inc.severidad === 'critica' ? 'bg-red-400/10 text-red-400' : inc.severidad === 'alta' ? 'bg-orange-400/10 text-orange-400' : 'bg-yellow-400/10 text-yellow-400'}`}>{inc.severidad}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-200 truncate">{inc.descripcion}</p>
                    <p className="text-[10px] text-slate-500">{inc.numero_ticket}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
