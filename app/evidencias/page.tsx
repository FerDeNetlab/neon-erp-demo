'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Camera, Image as ImageIcon, FileText, Video, Loader2, ExternalLink } from 'lucide-react'

type Evidencia = {
  id: string
  ticket_id: string
  numero_ticket?: string
  ticket_titulo?: string
  tipo: string
  url: string
  descripcion: string
  subido_por: string
  created_at: string
}

const tipoIcones: Record<string, typeof Camera> = {
  foto: ImageIcon,
  documento: FileText,
  video: Video,
}

export default function EvidenciasPage() {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvidencias = useCallback(async () => {
    try {
      const res = await fetch('/api/evidencias')
      const data = await res.json()
      setEvidencias(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvidencias() }, [fetchEvidencias])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
          <Camera className="h-6 w-6" /> Evidencias
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Galería de fotos, documentos y videos ligados a tickets
        </p>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : evidencias.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 bg-zinc-900/50 border border-slate-800 rounded-lg">
          <Camera className="h-12 w-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-lg mb-2">No hay evidencias registradas</p>
          <p className="text-sm text-slate-500">Las evidencias se agregan desde los tickets de trabajo</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {evidencias.map((ev, i) => {
            const Icon = tipoIcones[ev.tipo] || ImageIcon
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-zinc-900/50 border border-slate-800 rounded-lg overflow-hidden hover:border-blue-500/30 transition-colors group"
              >
                {/* Preview area */}
                <div className="aspect-video bg-zinc-800 flex items-center justify-center relative">
                  {ev.tipo === 'foto' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ev.url} alt={ev.descripcion || 'Evidencia'} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="h-12 w-12 text-slate-500" />
                  )}
                  <a href={ev.url} target="_blank" rel="noopener noreferrer"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/60 p-1.5 rounded-md transition-opacity">
                    <ExternalLink className="h-4 w-4 text-white" />
                  </a>
                </div>
                {/* Info */}
                <div className="p-4 space-y-2">
                  {ev.descripcion && <p className="text-sm text-slate-200">{ev.descripcion}</p>}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {ev.tipo}
                    </span>
                    {ev.numero_ticket && (
                      <span className="text-blue-400 font-mono">{ev.numero_ticket}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    {new Date(ev.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {ev.subido_por && ` • ${ev.subido_por}`}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
