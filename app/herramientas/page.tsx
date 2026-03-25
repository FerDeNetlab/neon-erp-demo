'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wrench, Loader2, Search, Shield, AlertTriangle, CheckCircle2, Settings, User, DollarSign, Calendar, MapPin } from 'lucide-react'

type Tool = { id: string; name: string; brand: string; model: string; serial_number: string; category: string; status: string; acquisition_cost: number; acquisition_date: string; branch_name: string; custodian_name: string }
type Custody = { id: string; tool_name: string; user_name: string; status: string; assigned_at: string; returned_at: string }

const statusLabels: Record<string, string> = { available: 'Disponible', assigned: 'Asignada', in_maintenance: 'Mant.', retired: 'Baja' }
const statusColors: Record<string, string> = { available: 'text-green-400 bg-green-500/10 border-green-500/30', assigned: 'text-blue-400 bg-blue-500/10 border-blue-500/30', in_maintenance: 'text-amber-400 bg-amber-500/10 border-amber-500/30', retired: 'text-gray-400 bg-gray-500/10 border-gray-500/30' }
const catLabels: Record<string, string> = { measurement: '📐 Medición', computing: '💻 Cómputo', hand_tool: '🔧 Manual', power_tool: '⚡ Eléctrica' }

function fmtMoney(n: number) { return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0 }) }

export default function HerramientasPage() {
  const [data, setData] = useState<{tools: Tool[]; stats: Record<string, number>; custodies: Custody[]} | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'grid'|'custodies'|'maintenance'>('grid')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)

  useEffect(() => { fetch('/api/herramientas').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  const filtered = data.tools.filter(t =>
    (!search || t.name.toLowerCase().includes(search.toLowerCase()) || t.serial_number.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || t.status === statusFilter)
  )
  const totalValue = data.tools.reduce((s, t) => s + Number(t.acquisition_cost), 0)

  return (
    <div data-tour="herramientas-grid" className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><Wrench className="h-6 w-6 text-orange-400" /> Herramientas</h1></div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: Wrench, label: 'Total', value: data.stats.total, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
          { icon: CheckCircle2, label: 'Disponibles', value: data.stats.available, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
          { icon: User, label: 'Asignadas', value: data.stats.assigned, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { icon: Settings, label: 'Mantenimiento', value: data.stats.in_maintenance, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { icon: DollarSign, label: 'Valor total', value: fmtMoney(totalValue), color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', isText: true },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`${s.color} border rounded-xl p-3`}>
            <s.icon className="h-4 w-4 mb-1 opacity-70" />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[10px] opacity-60">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs + Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex bg-zinc-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <button onClick={() => setTab('grid')} className={`px-4 py-2 text-sm ${tab === 'grid' ? 'bg-orange-500/10 text-orange-400' : 'text-slate-400'}`}>🔧 Herramientas</button>
          <button onClick={() => setTab('custodies')} className={`px-4 py-2 text-sm ${tab === 'custodies' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400'}`}>📋 Resguardos</button>
          <button onClick={() => setTab('maintenance')} className={`px-4 py-2 text-sm ${tab === 'maintenance' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400'}`}>⚙️ Mantenimiento</button>
        </div>
        {tab === 'grid' && (<>
          <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar herramienta o SN..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-orange-500/50" /></div>
          <div className="flex gap-1">
            {['available','assigned','in_maintenance'].map(s => (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${statusFilter === s ? statusColors[s] : 'bg-zinc-900/60 text-slate-400 border-slate-800'}`}>
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </>)}
      </div>

      {tab === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              onClick={() => setSelectedTool(selectedTool?.id === t.id ? null : t)}
              className={`bg-zinc-900/60 border rounded-xl p-4 cursor-pointer transition-all hover:border-slate-700/50 ${selectedTool?.id === t.id ? 'border-orange-500/50 ring-1 ring-orange-500/20' : 'border-slate-800/50'}`}>
              <div className="flex items-start justify-between mb-2">
                <div><h3 className="text-sm font-semibold text-white">{t.name}</h3>
                  <p className="text-[10px] text-slate-500">{t.brand} {t.model}</p></div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] border ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                <p className="font-mono text-[10px]">SN: {t.serial_number}</p>
                <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.branch_name}</p>
                {t.custodian_name && <p className="flex items-center gap-1 text-blue-400"><User className="h-3 w-3" />{t.custodian_name}</p>}
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{fmtMoney(Number(t.acquisition_cost))}</span>
                  <span className="text-[10px] text-slate-500">{catLabels[t.category] || t.category}</span>
                </div>
              </div>
              {selectedTool?.id === t.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-slate-800/50 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-slate-500">Fecha adquisición</p><p className="text-slate-300">{t.acquisition_date ? new Date(t.acquisition_date).toLocaleDateString('es-MX') : '—'}</p></div>
                    <div><p className="text-slate-500">Categoría</p><p className="text-slate-300">{catLabels[t.category] || t.category}</p></div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20">Asignar</button>
                    <button className="px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20">Mantenimiento</button>
                    <button className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">Dar de baja</button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'custodies' && (
        <div className="space-y-2">
          {data.custodies.length === 0 ? <p className="text-center py-12 text-slate-500">Sin resguardos activos</p> :
          data.custodies.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${c.status === 'active' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'}`}>
                <Shield className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm text-slate-200">{c.tool_name}</p>
                <p className="text-[10px] text-slate-500"><User className="h-3 w-3 inline" /> {c.user_name} · Desde {new Date(c.assigned_at).toLocaleDateString('es-MX')}</p></div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${c.status === 'active' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 bg-slate-500/10'}`}>{c.status === 'active' ? 'Activo' : 'Devuelto'}</span>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'maintenance' && (
        <div className="space-y-2">
          {data.tools.filter(t => t.status === 'in_maintenance').length === 0 ? <p className="text-center py-12 text-slate-500">Sin herramientas en mantenimiento 🎉</p> :
          data.tools.filter(t => t.status === 'in_maintenance').map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 bg-zinc-900/60 border border-amber-500/20 rounded-xl p-4">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0 flex-1"><p className="text-sm text-slate-200 font-medium">{t.name}</p>
                <p className="text-[10px] text-slate-500">{t.brand} {t.model} · SN: {t.serial_number} · {t.branch_name}</p></div>
              <div className="text-right"><p className="text-sm font-semibold text-amber-400">{fmtMoney(Number(t.acquisition_cost))}</p>
                <button className="text-[10px] text-green-400 hover:text-green-300 mt-1">Marcar disponible →</button></div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
