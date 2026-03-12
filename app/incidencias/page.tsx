'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Plus, X, Loader2, Filter,
  AlertOctagon, AlertCircle, Info, ShieldAlert
} from 'lucide-react'

type Incidencia = {
  id: string
  ticket_id: string
  numero_ticket?: string
  ticket_titulo?: string
  reportado_por: string
  tipo: string
  severidad: string
  descripcion: string
  estado: string
  resolucion: string
  created_at: string
}

const severidadConfig: Record<string, { label: string; color: string; icon: typeof Info }> = {
  baja: { label: 'Baja', color: 'text-slate-400 bg-slate-400/10 border-slate-500/30', icon: Info },
  media: { label: 'Media', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30', icon: AlertCircle },
  alta: { label: 'Alta', color: 'text-orange-400 bg-orange-400/10 border-orange-500/30', icon: AlertTriangle },
  critica: { label: 'Crítica', color: 'text-red-400 bg-red-400/10 border-red-500/30', icon: AlertOctagon },
}

const estadoConfig: Record<string, { label: string; color: string }> = {
  abierta: { label: 'Abierta', color: 'text-red-400 bg-red-400/10 border-red-500/30' },
  en_revision: { label: 'En Revisión', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30' },
  resuelta: { label: 'Resuelta', color: 'text-green-400 bg-green-400/10 border-green-500/30' },
  cerrada: { label: 'Cerrada', color: 'text-slate-400 bg-slate-400/10 border-slate-500/30' },
}

const tipoOptions = ['accidente', 'retraso', 'material_faltante', 'equipo_dañado', 'otro']

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterEstado, setFilterEstado] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ticket_id: '', tipo: 'otro', severidad: 'media', descripcion: '' })

  const fetchIncidencias = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterEstado) params.set('estado', filterEstado)
      const res = await fetch(`/api/incidencias?${params}`)
      const data = await res.json()
      setIncidencias(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [filterEstado])

  useEffect(() => { fetchIncidencias() }, [fetchIncidencias])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowModal(false)
        setForm({ ticket_id: '', tipo: 'otro', severidad: 'media', descripcion: '' })
        fetchIncidencias()
      }
    } finally {
      setCreating(false)
    }
  }

  const updateEstado = async (id: string, estado: string) => {
    try {
      await fetch(`/api/incidencias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      fetchIncidencias()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-400 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" /> Incidencias
          </h1>
          <p className="text-sm text-slate-500 mt-1">{incidencias.length} incidencia{incidencias.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-all">
          <Plus className="h-4 w-4" /> Reportar Incidencia
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-slate-500" />
        {['', 'abierta', 'en_revision', 'resuelta', 'cerrada'].map(estado => (
          <button key={estado} onClick={() => setFilterEstado(estado)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterEstado === estado ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}>
            {estado ? estadoConfig[estado]?.label : 'Todas'}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-red-400" /></div>
      ) : incidencias.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 border border-slate-800 rounded-lg">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-lg">No hay incidencias{filterEstado ? ` con estado "${estadoConfig[filterEstado]?.label}"` : ''}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {incidencias.map((inc, i) => {
            const sev = severidadConfig[inc.severidad] || severidadConfig.media
            const est = estadoConfig[inc.estado] || estadoConfig.abierta
            const SevIcon = sev.icon
            return (
              <motion.div key={inc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5 hover:border-red-500/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${sev.color}`}>
                      <SevIcon className="h-3 w-3" /> {sev.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${est.color}`}>{est.label}</span>
                  </div>
                  {inc.numero_ticket && <span className="text-xs text-cyan-400 font-mono">{inc.numero_ticket}</span>}
                </div>
                <p className="text-sm text-slate-200 mb-2">{inc.descripcion}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{inc.reportado_por}</span>
                  <span>{new Date(inc.created_at).toLocaleDateString('es-MX')}</span>
                </div>
                {inc.resolucion && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <p className="text-xs text-green-400 mb-1">Resolución:</p>
                    <p className="text-sm text-slate-300">{inc.resolucion}</p>
                  </div>
                )}
                {/* Quick actions */}
                {inc.estado !== 'cerrada' && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                    {inc.estado === 'abierta' && (
                      <button onClick={() => updateEstado(inc.id, 'en_revision')} className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">→ En Revisión</button>
                    )}
                    {inc.estado === 'en_revision' && (
                      <button onClick={() => updateEstado(inc.id, 'resuelta')} className="text-xs text-green-400 hover:text-green-300 transition-colors">→ Resuelta</button>
                    )}
                    {inc.estado === 'resuelta' && (
                      <button onClick={() => updateEstado(inc.id, 'cerrada')} className="text-xs text-slate-400 hover:text-slate-300 transition-colors">→ Cerrar</button>
                    )}
                  </div>
                )}
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-red-400">Reportar Incidencia</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider">Tipo *</label>
                      <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-red-500/50">
                        {tipoOptions.map(t => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider">Severidad</label>
                      <select value={form.severidad} onChange={(e) => setForm({ ...form, severidad: e.target.value })}
                        className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-red-500/50">
                        {Object.entries(severidadConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Descripción *</label>
                    <textarea required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={4}
                      className="w-full mt-1 px-3 py-2.5 bg-zinc-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-red-500/50 resize-none"
                      placeholder="Describe la incidencia en detalle..." />
                  </div>
                  <button type="submit" disabled={creating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                    {creating ? 'Reportando...' : 'Reportar'}
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
