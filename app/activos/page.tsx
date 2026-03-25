'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Loader2, DollarSign, MapPin, User, Calendar } from 'lucide-react'

type Asset = { id: string; name: string; category: string; serial_number: string; asset_tag: string; status: string; assigned_to_name: string; branch_name: string; acquisition_cost: number; acquisition_date: string }

const statusLabels: Record<string, string> = { available: 'Disponible', assigned: 'Asignado', in_maintenance: 'En Mant.', decommissioned: 'Baja' }
const statusColors: Record<string, string> = { available: 'text-green-400 bg-green-500/10 border-green-500/30', assigned: 'text-blue-400 bg-blue-500/10 border-blue-500/30', in_maintenance: 'text-orange-400 bg-orange-500/10 border-orange-500/30', decommissioned: 'text-gray-400 bg-gray-500/10 border-gray-500/30' }
const catIcons: Record<string, string> = { networking: '🌐', power: '⚡', office: '🖨️', computing: '💻', hvac: '❄️', furniture: '🪑' }

export default function ActivosPage() {
  const [data, setData] = useState<{assets: Asset[]; stats: Record<string, number>} | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/activos').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  return (
    <div data-tour="activos-grid" className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><Package className="h-6 w-6 text-purple-400" /> Activos Fijos</h1></div>
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/60 border border-purple-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-purple-400">{data.stats.total}</p><p className="text-xs text-slate-500">Total activos</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-zinc-900/60 border border-blue-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">{data.stats.assigned}</p><p className="text-xs text-slate-500">Asignados</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-400">${Number(data.stats.total_value).toLocaleString('es-MX')}</p><p className="text-xs text-slate-500">Valor total</p></motion.div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.assets.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
            className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2"><span className="text-xl">{catIcons[a.category] || '📦'}</span>
                <div><h3 className="text-sm font-semibold text-white">{a.name}</h3><p className="text-[10px] text-slate-500">{a.category} · {a.serial_number}</p></div></div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] border ${statusColors[a.status]}`}>{statusLabels[a.status]}</span>
            </div>
            <div className="space-y-1 text-xs text-slate-400 mt-2">
              <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.branch_name}</p>
              {a.assigned_to_name && <p className="flex items-center gap-1 text-blue-400"><User className="h-3 w-3" />{a.assigned_to_name}</p>}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${Number(a.acquisition_cost).toLocaleString('es-MX')}</span>
                {a.acquisition_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(a.acquisition_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
