'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Loader2, DollarSign, TrendingUp, TrendingDown,
  Users, Truck, Package, AlertTriangle, ClipboardList,
  Building2, Award, ShieldAlert, Calendar, Wrench
} from 'lucide-react'

type Data = {
  financial: Record<string, number>
  branchPerf: Array<{name: string; orders: number; completed: number; revenue: number; team_size: number; vehicles: number}>
  monthlyTrend: Array<{month: string; orders: number; revenue: number}>
  typeDistribution: Array<{service_type: string; count: number; revenue: number}>
  teamPerf: Array<{full_name: string; total_orders: number; completed: number; avg_hours: number}>
  inventoryHealth: Record<string, number>
  fleetHealth: Record<string, number>
  hrSummary: Record<string, number>
  pendingActions: Array<{type: string; title: string; count: number}>
}

const typeLabels: Record<string, string> = { fibra: '🔌 Fibra', cctv: '📹 CCTV', cableado: '🔗 Cableado', servidor: '🖥️ Servidor', otro: '🔧 Otro' }

function fmtMoney(n: number | string) { return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0 }) }

export default function DirectivoPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch('/api/directivo').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return <p className="text-center py-20 text-slate-500">Sin acceso al dashboard directivo</p>

  const f = data.financial
  const totalCosts = Number(f.total_order_costs) + Number(f.total_opex) + Number(f.total_fuel)
  const grossMargin = Number(f.total_revenue) - totalCosts
  const marginPct = Number(f.total_revenue) > 0 ? Math.round((grossMargin / Number(f.total_revenue)) * 100) : 0

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><BarChart3 className="h-6 w-6 text-violet-400" /> Dashboard Directivo</h1>
        <p className="text-sm text-slate-500 mt-0.5">Vista ejecutiva — Redes Ópticas</p></div>

      {/* ── Pending Actions banner ── */}
      {data.pendingActions?.some(a => Number(a.count) > 0) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Requiere Atención</h3>
          <div className="flex gap-3 flex-wrap">
            {data.pendingActions.filter(a => Number(a.count) > 0).map((a, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {a.title}: <span className="font-bold">{a.count}</span>
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Financial KPIs ── */}
      <div data-tour="directivo-financial" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, label: 'Ingresos Totales', value: fmtMoney(f.total_revenue), color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { icon: TrendingUp, label: 'Ingresos del Mes', value: fmtMoney(f.month_revenue), color: 'text-green-400 bg-green-500/10 border-green-500/20' },
          { icon: TrendingDown, label: 'Costos Totales', value: fmtMoney(totalCosts), color: 'text-red-400 bg-red-500/10 border-red-500/20' },
          { icon: BarChart3, label: 'Margen Bruto', value: `${fmtMoney(grossMargin)} (${marginPct}%)`, color: marginPct >= 0 ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${kpi.color} border rounded-xl p-4`}>
            <kpi.icon className="h-5 w-5 mb-2 opacity-70" />
            <p className="text-xl font-bold">{kpi.value}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-60">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Cost Breakdown ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Costos OS', value: fmtMoney(f.total_order_costs), sub: 'Materiales + MO + Traslado', color: 'text-blue-400' },
          { label: 'Gastos Operativos', value: fmtMoney(f.total_opex), sub: `Mes: ${fmtMoney(f.month_opex)}`, color: 'text-purple-400' },
          { label: 'Combustible', value: fmtMoney(f.total_fuel), sub: 'Flotilla completa', color: 'text-yellow-400' },
          { label: 'Compras (OC)', value: fmtMoney(f.total_purchases), sub: 'Aprobadas/Recibidas', color: 'text-pink-400' },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
            className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-4">
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-300">{c.label}</p>
            <p className="text-[10px] text-slate-500">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Branch Performance ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-rose-400" /> Rendimiento por Sucursal</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase">
              <th className="pb-2">Sucursal</th><th className="pb-2 text-right">Órdenes</th><th className="pb-2 text-right">Completadas</th><th className="pb-2 text-right">Ingresos</th><th className="pb-2 text-right">Equipo</th><th className="pb-2 text-right">Vehículos</th>
            </tr></thead>
            <tbody>{data.branchPerf.map((b, i) => {
              const rate = b.orders > 0 ? Math.round((b.completed / b.orders) * 100) : 0
              return (
                <tr key={i} className="border-b border-slate-800/30">
                  <td className="py-3 text-white font-medium">{b.name}</td>
                  <td className="py-3 text-right text-slate-300">{b.orders}</td>
                  <td className="py-3 text-right"><span className="text-slate-300">{b.completed}</span> <span className="text-[10px] text-slate-500">({rate}%)</span></td>
                  <td className="py-3 text-right text-emerald-400 font-semibold">{fmtMoney(b.revenue)}</td>
                  <td className="py-3 text-right text-slate-300">{b.team_size}</td>
                  <td className="py-3 text-right text-slate-300">{b.vehicles}</td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Monthly Trend ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-400" /> Tendencia Mensual</h3>
          {data.monthlyTrend.length === 0 ? <p className="text-sm text-slate-500 py-4">Sin datos suficientes</p> : (
            <div className="space-y-2">
              {data.monthlyTrend.map((m, i) => {
                const maxRev = Math.max(...data.monthlyTrend.map(t => Number(t.revenue))) || 1
                const pct = (Number(m.revenue) / maxRev) * 100
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-10">{m.month}</span>
                    <div className="flex-1 h-6 bg-slate-800 rounded-lg overflow-hidden relative">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.5 + i * 0.1 }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-green-500 rounded-lg" />
                    </div>
                    <span className="text-xs text-emerald-400 font-mono w-24 text-right">{fmtMoney(m.revenue)}</span>
                    <span className="text-[10px] text-slate-500 w-6">{m.orders}</span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* ── Service Type Distribution ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-blue-400" /> Distribución por Tipo</h3>
          <div className="space-y-3">
            {data.typeDistribution.map((t, i) => {
              const totalOrders = data.typeDistribution.reduce((s, x) => s + Number(x.count), 0) || 1
              const pct = Math.round((Number(t.count) / totalOrders) * 100)
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">{typeLabels[t.service_type] || t.service_type}</span><span className="text-slate-400">{t.count} ({pct}%) · {fmtMoney(t.revenue)}</span></div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.5 + i * 0.08 }}
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full" />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Team Performance ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-amber-400" /> Top Técnicos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.teamPerf.map((t, i) => (
            <div key={i} className="flex items-center gap-3 bg-zinc-800/40 rounded-lg p-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200 font-medium">{t.full_name}</p>
                <p className="text-[10px] text-slate-500">{t.completed}/{t.total_orders} completadas · {Number(t.avg_hours).toFixed(1)}h promedio</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">{t.completed}</p>
                <p className="text-[10px] text-slate-500">completadas</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Health Panels ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Inventario</h3>
          <p className="text-2xl font-bold text-white">{fmtMoney(data.inventoryHealth.inventory_value)}</p>
          <p className="text-xs text-slate-500">Valor total en almacén</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-800/50 text-xs">
            <span className="text-slate-300">{data.inventoryHealth.total_items} productos</span>
            {Number(data.inventoryHealth.low_stock) > 0 && <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{data.inventoryHealth.low_stock} bajo stock</span>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-zinc-900/60 border border-yellow-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2"><Truck className="h-4 w-4" /> Flotilla</h3>
          <p className="text-2xl font-bold text-white">{data.fleetHealth.active} <span className="text-sm text-slate-500 font-normal">/ {data.fleetHealth.total}</span></p>
          <p className="text-xs text-slate-500">Vehículos activos</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-800/50 text-xs">
            {Number(data.fleetHealth.in_shop) > 0 && <span className="text-orange-400"><Wrench className="h-3 w-3 inline" /> {data.fleetHealth.in_shop} en taller</span>}
            {Number(data.fleetHealth.insurance_alert) > 0 && <span className="text-red-400"><AlertTriangle className="h-3 w-3 inline" /> {data.fleetHealth.insurance_alert} alertas</span>}
            <span className="text-slate-400">{Number(data.fleetHealth.total_km).toLocaleString('es-MX')} km</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="bg-zinc-900/60 border border-teal-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-teal-400 mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Personal</h3>
          <p className="text-2xl font-bold text-white">{data.hrSummary.active_employees}</p>
          <p className="text-xs text-slate-500">Empleados activos</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-800/50 text-xs">
            {Number(data.hrSummary.pending_vac) > 0 && <span className="text-yellow-400"><Calendar className="h-3 w-3 inline" /> {data.hrSummary.pending_vac} vacaciones</span>}
            {Number(data.hrSummary.recent_incidents) > 0 && <span className="text-red-400"><AlertTriangle className="h-3 w-3 inline" /> {data.hrSummary.recent_incidents} incidencias</span>}
            <span className="text-slate-400">{data.hrSummary.recent_trainings} capacitaciones</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
