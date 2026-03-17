'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, MapPin, Clock, Calendar, User, Camera, Plus, X, Loader2,
  AlertTriangle, CheckCircle2, PlayCircle, Send, Upload, FileText, Package, Hash
} from 'lucide-react'
import Link from 'next/link'

type TicketDetail = {
  id: string; numero_ticket: string; titulo: string; descripcion: string
  tipo: string; estado: string; prioridad: string; cliente_nombre: string; cliente_telefono: string
  direccion: string; ciudad: string; fecha_programada: string; asignado_nombre: string; notas: string
  evidencias: Array<{ id: string; tipo: string; url: string; descripcion: string; created_at: string }>
  incidencias: Array<{ id: string; tipo: string; severidad: string; descripcion: string; estado: string; created_at: string }>
  materiales_asignados: Array<{ id: string; nombre_material: string; cantidad: number; unidad: string; numero_serie: string; estado: string; notas: string; fecha_asignacion: string }>
}

const tipoIcons: Record<string, string> = { fibra: '🔌', cctv: '📹', cableado: '🔗', servidor: '🖥️', otro: '🔧' }
const prioColors: Record<string, string> = { urgente: 'text-red-400 bg-red-400/10 border-red-500/30', alta: 'text-orange-400 bg-orange-400/10 border-orange-500/30', media: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30', baja: 'text-slate-400 bg-slate-400/10 border-slate-500/30' }
const estadoColors: Record<string, string> = { pendiente: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30', en_progreso: 'text-blue-400 bg-blue-400/10 border-blue-500/30', completado: 'text-green-400 bg-green-400/10 border-green-500/30', cancelado: 'text-red-400 bg-red-400/10 border-red-500/30' }

export default function TecnicoTicketPage() {
  const { id } = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'evidencia' | 'incidencia' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [updatingEstado, setUpdatingEstado] = useState(false)

  const [evForm, setEvForm] = useState({ descripcion: '', url: '', tipo: 'foto' })
  const [incForm, setIncForm] = useState({ tipo: 'otro', severidad: 'media', descripcion: '' })

  const fetchTicket = useCallback(async () => {
    try { const res = await fetch(`/api/tickets/${id}`); const d = await res.json(); setTicket(d) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [id])
  useEffect(() => { fetchTicket() }, [fetchTicket])

  const updateEstado = async (newEstado: string) => {
    setUpdatingEstado(true)
    try {
      await fetch(`/api/tickets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: newEstado }) })
      fetchTicket()
    } finally { setUpdatingEstado(false) }
  }

  const submitEvidencia = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await fetch('/api/evidencias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: id, ...evForm }) })
      setActiveModal(null); setEvForm({ descripcion: '', url: '', tipo: 'foto' }); fetchTicket()
    } finally { setSubmitting(false) }
  }

  const submitIncidencia = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await fetch('/api/incidencias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: id, reportado_por: 'tecnico@neon.mx', ...incForm }) })
      setActiveModal(null); setIncForm({ tipo: 'otro', severidad: 'media', descripcion: '' }); fetchTicket()
    } finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!ticket) return <div className="text-center py-20 text-slate-400">Ticket no encontrado</div>

  const nextEstado: Record<string, { label: string; value: string; icon: typeof PlayCircle; color: string }> = {
    pendiente: { label: 'Iniciar Trabajo', value: 'en_progreso', icon: PlayCircle, color: 'text-blue-400 bg-blue-600/20 border-blue-500/50' },
    en_progreso: { label: 'Marcar Completado', value: 'completado', icon: CheckCircle2, color: 'text-green-400 bg-green-600/20 border-green-500/50' },
  }
  const action = nextEstado[ticket.estado]

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Back */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link href="/tecnico" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Volver</Link>
      </motion.div>

      {/* Ticket header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 border border-slate-800 rounded-xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tipoIcons[ticket.tipo] || '🔧'}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-cyan-400 font-mono text-sm font-medium">{ticket.numero_ticket}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${prioColors[ticket.prioridad] || prioColors.media}`}>{ticket.prioridad}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${estadoColors[ticket.estado] || estadoColors.pendiente}`}>{ticket.estado?.replace('_', ' ')}</span>
              </div>
              <h1 className="text-lg font-bold text-slate-200">{ticket.titulo}</h1>
            </div>
          </div>
        </div>

        {ticket.descripcion && <p className="text-sm text-slate-400 mt-3 leading-relaxed">{ticket.descripcion}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          {ticket.cliente_nombre && <div className="text-xs"><span className="text-slate-500 block">Cliente</span><span className="text-slate-200 font-medium">{ticket.cliente_nombre}</span></div>}
          {ticket.cliente_telefono && <div className="text-xs"><span className="text-slate-500 block">Teléfono</span><a href={`tel:${ticket.cliente_telefono}`} className="text-cyan-400">{ticket.cliente_telefono}</a></div>}
          {ticket.fecha_programada && <div className="text-xs"><span className="text-slate-500 block flex items-center gap-1"><Calendar className="h-3 w-3" />Programado</span><span className="text-slate-200">{new Date(ticket.fecha_programada).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>}
          {ticket.asignado_nombre && <div className="text-xs"><span className="text-slate-500 block flex items-center gap-1"><User className="h-3 w-3" />Asignado</span><span className="text-slate-200">{ticket.asignado_nombre}</span></div>}
        </div>
        {ticket.direccion && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <span className="text-slate-300">{ticket.direccion}{ticket.ciudad ? `, ${ticket.ciudad}` : ''}</span>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {action && (
          <button onClick={() => updateEstado(action.value)} disabled={updatingEstado}
            className={`flex items-center justify-center gap-2 px-4 py-3.5 border rounded-xl text-sm font-medium transition-all ${action.color} hover:opacity-80 disabled:opacity-50`}>
            {updatingEstado ? <Loader2 className="h-4 w-4 animate-spin" /> : <action.icon className="h-5 w-5" />}
            {action.label}
          </button>
        )}
        <button onClick={() => setActiveModal('evidencia')}
          className="flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30 rounded-xl text-sm font-medium transition-all">
          <Upload className="h-5 w-5" /> Subir Evidencia
        </button>
        <button onClick={() => setActiveModal('incidencia')}
          className="flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-xl text-sm font-medium transition-all">
          <AlertTriangle className="h-5 w-5" /> Reportar Incidencia
        </button>
      </motion.div>

      {/* Materials section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="bg-zinc-900/50 border border-purple-500/20 rounded-xl p-5">
        <h2 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Material Asignado ({ticket.materiales_asignados?.length || 0})</h2>
        {!ticket.materiales_asignados || ticket.materiales_asignados.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Sin material asignado para este ticket</p>
        ) : (
          <div className="space-y-2">
            {ticket.materiales_asignados.map(mat => {
              const estadoMat: Record<string, { label: string; color: string }> = {
                asignado: { label: 'Por recoger', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30' },
                entregado: { label: 'Entregado', color: 'text-green-400 bg-green-400/10 border-green-500/30' },
                devuelto: { label: 'Devuelto', color: 'text-blue-400 bg-blue-400/10 border-blue-500/30' },
                consumido: { label: 'Consumido', color: 'text-slate-400 bg-slate-400/10 border-slate-500/30' },
              }
              const est = estadoMat[mat.estado] || estadoMat.asignado
              return (
                <div key={mat.id} className="flex items-center gap-3 bg-zinc-800/50 border border-slate-700/50 rounded-lg p-3">
                  <div className="p-1.5 rounded-lg bg-purple-400/10 flex-shrink-0"><Package className="h-4 w-4 text-purple-400" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-slate-200 font-medium">{mat.nombre_material}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border ${est.color}`}>{est.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{Number(mat.cantidad)} {mat.unidad}</span>
                      {mat.numero_serie && (
                        <span className="flex items-center gap-1 text-purple-400 font-mono bg-purple-400/5 px-1.5 py-0.5 rounded">
                          <Hash className="h-3 w-3" />S/N: {mat.numero_serie}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Evidence section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="bg-zinc-900/50 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2"><Camera className="h-4 w-4" /> Evidencias ({ticket.evidencias?.length || 0})</h2>
        {!ticket.evidencias || ticket.evidencias.length === 0 ? (
          <div className="text-center py-8"><Camera className="h-8 w-8 mx-auto mb-2 text-slate-600" /><p className="text-xs text-slate-500">Sin evidencias aún</p><button onClick={() => setActiveModal('evidencia')} className="text-xs text-blue-400 hover:text-blue-300 mt-2">+ Subir primera evidencia</button></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ticket.evidencias.map(ev => (
              <div key={ev.id} className="bg-zinc-800/50 border border-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-blue-400/10"><Camera className="h-3.5 w-3.5 text-blue-400" /></div>
                  <span className="text-xs text-slate-400 capitalize">{ev.tipo}</span>
                  <span className="text-[10px] text-slate-500 ml-auto">{new Date(ev.created_at).toLocaleDateString('es-MX')}</span>
                </div>
                <p className="text-sm text-slate-200">{ev.descripcion}</p>
                {ev.url && <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-1 block truncate">{ev.url}</a>}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Incidents section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-zinc-900/50 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Incidencias ({ticket.incidencias?.length || 0})</h2>
        {!ticket.incidencias || ticket.incidencias.length === 0 ? (
          <p className="text-xs text-green-400 py-6 text-center">✓ Sin incidencias reportadas</p>
        ) : (
          <div className="space-y-2">
            {ticket.incidencias.map(inc => {
              const sevColors: Record<string, string> = { critica: 'text-red-400 bg-red-400/10', alta: 'text-orange-400 bg-orange-400/10', media: 'text-yellow-400 bg-yellow-400/10', baja: 'text-slate-400 bg-slate-400/10' }
              return (
                <div key={inc.id} className="flex items-start gap-3 bg-zinc-800/50 border border-slate-700/50 rounded-lg p-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] text-nowrap ${sevColors[inc.severidad] || sevColors.media}`}>{inc.severidad}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200">{inc.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      <span className="capitalize">{inc.tipo?.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className={inc.estado === 'resuelta' || inc.estado === 'cerrada' ? 'text-green-400' : 'text-yellow-400'}>{inc.estado}</span>
                      <span>•</span>
                      <span>{new Date(inc.created_at).toLocaleDateString('es-MX')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 sm:flex sm:items-center sm:justify-center sm:p-4">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-slate-200">
                    {activeModal === 'evidencia' ? '📸 Subir Evidencia' : '⚠️ Reportar Incidencia'}
                  </h2>
                  <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>

                {activeModal === 'evidencia' && (
                  <form onSubmit={submitEvidencia} className="p-6 space-y-4">
                    <div><label className="text-xs text-slate-400 uppercase">Tipo</label>
                      <select value={evForm.tipo} onChange={e => setEvForm({ ...evForm, tipo: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500/50">
                        <option value="foto">📷 Foto</option><option value="documento">📄 Documento</option><option value="video">🎥 Video</option>
                      </select></div>
                    <div><label className="text-xs text-slate-400 uppercase">Descripción *</label>
                      <textarea required value={evForm.descripcion} onChange={e => setEvForm({ ...evForm, descripcion: e.target.value })} rows={3} placeholder="Ej: Foto antes de iniciar instalación de fibra..."
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 resize-none focus:outline-none focus:border-blue-500/50" /></div>
                    <div><label className="text-xs text-slate-400 uppercase">URL del archivo</label>
                      <input value={evForm.url} onChange={e => setEvForm({ ...evForm, url: e.target.value })} placeholder="https://..." className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500/50" /></div>
                    <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/20 border border-blue-500/50 text-blue-400 disabled:opacity-50 rounded-xl text-sm font-medium">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{submitting ? 'Subiendo...' : 'Subir Evidencia'}
                    </button>
                  </form>
                )}

                {activeModal === 'incidencia' && (
                  <form onSubmit={submitIncidencia} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-slate-400 uppercase">Tipo</label>
                        <select value={incForm.tipo} onChange={e => setIncForm({ ...incForm, tipo: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-red-500/50">
                          <option value="accidente">Accidente</option><option value="retraso">Retraso</option><option value="material_faltante">Material Faltante</option><option value="equipo_dañado">Equipo Dañado</option><option value="otro">Otro</option>
                        </select></div>
                      <div><label className="text-xs text-slate-400 uppercase">Severidad</label>
                        <select value={incForm.severidad} onChange={e => setIncForm({ ...incForm, severidad: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-red-500/50">
                          <option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="critica">Crítica</option>
                        </select></div>
                    </div>
                    <div><label className="text-xs text-slate-400 uppercase">Descripción *</label>
                      <textarea required value={incForm.descripcion} onChange={e => setIncForm({ ...incForm, descripcion: e.target.value })} rows={3} placeholder="Describe la incidencia con el mayor detalle posible..."
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-lg text-sm text-slate-200 resize-none focus:outline-none focus:border-red-500/50" /></div>
                    <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 border border-red-500/50 text-red-400 disabled:opacity-50 rounded-xl text-sm font-medium">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{submitting ? 'Enviando...' : 'Reportar Incidencia'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
