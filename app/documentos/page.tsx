'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, Search, Download, Tag } from 'lucide-react'

type Doc = { id: string; title: string; description: string; category: string; version: string; file_url: string; tags: string[]; uploaded_by_name: string; created_at: string; updated_at: string }

const catLabels: Record<string, string> = { procedure: '📋 Procedimiento', policy: '📜 Política', manual: '📖 Manual', template: '📝 Plantilla' }
const catColors: Record<string, string> = { procedure: 'text-blue-400 bg-blue-500/10', policy: 'text-purple-400 bg-purple-500/10', manual: 'text-green-400 bg-green-500/10', template: 'text-amber-400 bg-amber-500/10' }

export default function DocumentosPage() {
  const [data, setData] = useState<{documents: Doc[]} | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetch('/api/documentos').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  const filtered = search ? data.documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase())) : data.documents

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><FileText className="h-6 w-6 text-amber-400" /> Documentos</h1>
        <p className="text-sm text-slate-500 mt-0.5">{data.documents.length} documentos registrados</p></div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documento..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500/50" />
      </div>

      {filtered.length === 0 ? <p className="text-center py-12 text-slate-500">Sin documentos{search && ' que coincidan'}</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${catColors[d.category] || 'text-slate-400 bg-slate-500/10'}`}>{catLabels[d.category] || d.category}</span>
                <span className="text-[10px] text-slate-500">v{d.version}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{d.title}</h3>
              {d.description && <p className="text-xs text-slate-400 mb-2 line-clamp-2">{d.description}</p>}
              {d.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-2">{d.tags.map((t: string, j: number) => (
                  <span key={j} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 flex items-center gap-0.5"><Tag className="h-2.5 w-2.5" />{t}</span>
                ))}</div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/50 text-[10px] text-slate-500">
                <span>{d.uploaded_by_name} · {new Date(d.updated_at).toLocaleDateString('es-MX')}</span>
                {d.file_url && <a href={d.file_url} target="_blank" className="text-cyan-400 hover:text-cyan-300"><Download className="h-3.5 w-3.5" /></a>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
