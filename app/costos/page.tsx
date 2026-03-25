'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Loader2, TrendingUp, Building2, Wrench, Truck } from 'lucide-react'

type Expense = { id: string; category: string; description: string; amount: number; date: string; vendor: string; branch_name: string; recorded_by_name: string }
type OrderCost = { id: string; cost_type: string; description: string; amount: number; order_number: string; order_title: string }

const catLabels: Record<string, string> = { rent: '🏢 Renta', utilities: '💡 Servicios', supplies: '📦 Insumos', insurance: '🛡️ Seguros', payroll: '💰 Nómina', other: '📌 Otros' }
const costLabels: Record<string, string> = { materials: '📦 Materiales', labor: '👷 Mano de Obra', transport: '🚛 Traslado', other: '📌 Otro' }

function fmtMoney(n: number | string) { return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0 }) }

export default function CostosPage() {
  const [data, setData] = useState<{expenses: Expense[]; orderCosts: OrderCost[]; summary: Record<string, number>; orderCostSummary: Record<string, number>} | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'expenses'|'orders'>('expenses')

  useEffect(() => { fetch('/api/costos').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null
  const s = data.summary; const oc = data.orderCostSummary

  return (
    <div data-tour="costos-summary" className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><DollarSign className="h-6 w-6 text-lime-400" /> Costos</h1></div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/60 border border-lime-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-500">Gastos del Mes</p><p className="text-xl font-bold text-lime-400">{fmtMoney(s.month_total)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-zinc-900/60 border border-blue-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-500">Costos OS (Total)</p><p className="text-xl font-bold text-blue-400">{fmtMoney(oc.total)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900/60 border border-purple-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-500">Mano de Obra</p><p className="text-xl font-bold text-purple-400">{fmtMoney(oc.labor)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-zinc-900/60 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-500">Traslados</p><p className="text-xl font-bold text-yellow-400">{fmtMoney(oc.transport)}</p>
        </motion.div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">📊 Gastos Operativos por Categoría</h3>
          <div className="space-y-2">
            {[['rent','Renta',s.rent],['utilities','Servicios',s.utilities],['supplies','Insumos',s.supplies],['insurance','Seguros',s.insurance],['payroll','Nómina',s.payroll],['other','Otros',s.other_cat]].map(([k,l,v]) => (
              <div key={k as string} className="flex items-center justify-between"><span className="text-sm text-slate-400">{catLabels[k as string] || l}</span><span className="text-sm font-semibold text-slate-200">{fmtMoney(v as number)}</span></div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">📊 Costos por Tipo de OS</h3>
          <div className="space-y-2">
            {[['materials','Materiales',oc.materials],['labor','Mano de Obra',oc.labor],['transport','Traslados',oc.transport]].map(([k,l,v]) => (
              <div key={k as string} className="flex items-center justify-between"><span className="text-sm text-slate-400">{costLabels[k as string] || l}</span><span className="text-sm font-semibold text-slate-200">{fmtMoney(v as number)}</span></div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-800 pt-2"><span className="text-sm text-slate-300 font-medium">Total</span><span className="text-sm font-bold text-white">{fmtMoney(oc.total)}</span></div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900/60 border border-slate-800 rounded-xl overflow-hidden w-fit">
        <button onClick={() => setTab('expenses')} className={`px-4 py-2 text-sm ${tab === 'expenses' ? 'bg-lime-500/10 text-lime-400' : 'text-slate-400'}`}>🏢 Gastos Operativos</button>
        <button onClick={() => setTab('orders')} className={`px-4 py-2 text-sm ${tab === 'orders' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400'}`}>📋 Costos por OS</button>
      </div>

      {tab === 'expenses' && (
        <div className="space-y-2">{data.expenses.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="flex items-center gap-3 bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
            <div className="min-w-0 flex-1"><p className="text-sm text-slate-200">{e.description}</p>
              <p className="text-[10px] text-slate-500">{catLabels[e.category] || e.category} · {e.vendor} · {e.branch_name} · {new Date(e.date).toLocaleDateString('es-MX')}</p></div>
            <span className="text-sm font-semibold text-lime-400">{fmtMoney(e.amount)}</span>
          </motion.div>
        ))}</div>
      )}
      {tab === 'orders' && (
        <div className="space-y-2">{data.orderCosts.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="flex items-center gap-3 bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
            <div className="min-w-0 flex-1"><p className="text-sm text-slate-200"><span className="text-cyan-400 font-mono text-xs">{c.order_number}</span> — {c.description}</p>
              <p className="text-[10px] text-slate-500">{costLabels[c.cost_type] || c.cost_type} · {c.order_title}</p></div>
            <span className="text-sm font-semibold text-blue-400">{fmtMoney(c.amount)}</span>
          </motion.div>
        ))}</div>
      )}
    </div>
  )
}
