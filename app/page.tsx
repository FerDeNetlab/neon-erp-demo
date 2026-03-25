'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList, AlertTriangle, Truck, Wrench, Package, Users,
  DollarSign, TrendingUp, Loader2, Flame, BarChart3, Activity
} from 'lucide-react'

type DashboardData = {
  user: { role: string }
  kpis: Record<string, number>
  charts: { ordersByStatus: Array<{status: string; count: number}>; ordersByType: Array<{service_type: string; count: number}>; ordersByBranch: Array<{branch: string; count: number}> }
  fleet: { fuel_cost: number; maint_cost: number; fines_cost: number }
  recentOrders: Array<Record<string, unknown>>
  recentIncidents: Array<Record<string, unknown>>
}

const statusLabels: Record<string, string> = { created: 'Creada', assigned: 'Asignada', in_progress: 'En Progreso', completed: 'Completada', closed: 'Cerrada' }
const statusColors: Record<string, string> = { created: 'bg-slate-500', assigned: 'bg-blue-500', in_progress: 'bg-amber-500', completed: 'bg-green-500', closed: 'bg-gray-600' }
const typeLabels: Record<string, string> = { fibra: 'Fibra Óptica', cctv: 'CCTV', cableado: 'Cableado', servidor: 'Servidores', otro: 'Otro' }
const typeIcons: Record<string, string> = { fibra: '🔌', cctv: '📹', cableado: '🔗', servidor: '🖥️', otro: '🔧' }
const prioColors: Record<string, string> = { urgent: 'text-red-400 bg-red-500/10 border-red-500/30', high: 'text-orange-400 bg-orange-500/10 border-orange-500/30', medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', low: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }

function fmt(n: number | string) { return Number(n).toLocaleString('es-MX') }
function fmtMoney(n: number | string) { return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

function KpiCard({ icon: Icon, label, value, sub, color, delay = 0 }: { icon: typeof ClipboardList; label: string; value: string; sub?: string; color: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </motion.div>
  )
}

function BarSimple({ data, maxVal }: { data: Array<{label: string; value: number; color: string}>; maxVal: number }) {
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-24 truncate">{d.label}</span>
          <div className="flex-1 h-5 bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%` }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
              className={`h-full rounded-full ${d.color}`} />
          </div>
          <span className="text-xs font-medium text-slate-300 w-8 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard').then(r => {
      if (!r.ok) {
        if (r.status === 401 || r.status === 403) { window.location.href = '/login'; return null }
        throw new Error('Error al cargar')
      }
      return r.json()
    }).then(d => { if (d) setData(d) }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (error || !data) return <div className="text-center py-20 text-slate-400">{error || 'Error al cargar dashboard'}</div>

  const k = data.kpis
  const maxOrders = Math.max(...(data.charts.ordersByStatus?.map(o => Number(o.count)) || [1]))
  const maxTypes = Math.max(...(data.charts.ordersByType?.map(o => Number(o.count)) || [1]))
  const margin = Number(k.total_revenue) - Number(k.total_costs)

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500">Vista general de Redes Ópticas</p>
      </motion.div>

      {/* KPI Grid */}
      <div data-tour="dashboard-kpis" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <KpiCard icon={ClipboardList} label="Órdenes Activas" value={fmt(k.active_orders)} sub={`${fmt(k.urgent)} urgentes`} color="bg-blue-500/10 text-blue-400" delay={0} />
        <KpiCard icon={Activity} label="En Progreso" value={fmt(k.in_progress)} sub={`${fmt(k.completed_week)} completadas esta semana`} color="bg-amber-500/10 text-amber-400" delay={0.05} />
        <KpiCard icon={AlertTriangle} label="Incidencias" value={fmt(k.open_incidents)} sub={`${fmt(k.critical_incidents)} críticas`} color="bg-red-500/10 text-red-400" delay={0.1} />
        <KpiCard icon={Package} label="Stock Bajo" value={fmt(k.low_stock)} sub={`de ${fmt(k.total_items)} productos`} color="bg-orange-500/10 text-orange-400" delay={0.15} />
        <KpiCard icon={Truck} label="Vehículos" value={fmt(k.active_vehicles)} sub={`${fmt(k.vehicles_in_shop)} en taller · ${fmt(k.insurance_alerts)} alertas seguro`} color="bg-yellow-500/10 text-yellow-400" delay={0.2} />
        <KpiCard icon={Wrench} label="Herramientas" value={`${fmt(k.tools_assigned)}/${fmt(k.tools_total)}`} sub={`${fmt(k.tools_maintenance)} en mantenimiento`} color="bg-purple-500/10 text-purple-400" delay={0.25} />
        <KpiCard icon={Users} label="Empleados" value={fmt(k.total_employees)} color="bg-teal-500/10 text-teal-400" delay={0.3} />
        <KpiCard icon={DollarSign} label="Gastos del Mes" value={fmtMoney(k.expenses_month)} color="bg-rose-500/10 text-rose-400" delay={0.35} />
        <KpiCard icon={TrendingUp} label="Ingresos (ord. cerradas)" value={fmtMoney(k.total_revenue)} sub={`Costos: ${fmtMoney(k.total_costs)}`} color="bg-emerald-500/10 text-emerald-400" delay={0.4} />
        <KpiCard icon={BarChart3} label="Margen" value={fmtMoney(margin)} sub={Number(k.total_revenue) > 0 ? `${Math.round(margin / Number(k.total_revenue) * 100)}%` : '—'} color={margin >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} delay={0.45} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders by Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-blue-400" /> Órdenes por Estado</h3>
          <BarSimple maxVal={maxOrders}
            data={(data.charts.ordersByStatus || []).map(o => ({ label: statusLabels[o.status] || o.status, value: Number(o.count), color: statusColors[o.status] || 'bg-slate-500' }))} />
        </motion.div>

        {/* Orders by Type */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-cyan-400" /> Órdenes por Tipo</h3>
          <BarSimple maxVal={maxTypes}
            data={(data.charts.ordersByType || []).map(o => ({ label: `${typeIcons[o.service_type] || '🔧'} ${typeLabels[o.service_type] || o.service_type}`, value: Number(o.count), color: 'bg-cyan-500' }))} />
        </motion.div>

        {/* Orders by Branch */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Flame className="h-4 w-4 text-orange-400" /> Órdenes por Sucursal</h3>
          <BarSimple maxVal={Math.max(...(data.charts.ordersByBranch?.map(o => Number(o.count)) || [1]))}
            data={(data.charts.ordersByBranch || []).map((o, i) => ({ label: String(o.branch), value: Number(o.count), color: ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500'][i] || 'bg-slate-500' }))} />
        </motion.div>
      </div>

      {/* Fleet Costs + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fleet costs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Truck className="h-4 w-4 text-yellow-400" /> Costos Flotilla (90 días)</h3>
          <div className="space-y-3">
            {[
              { label: '⛽ Combustible', val: data.fleet.fuel_cost, color: 'text-yellow-400' },
              { label: '🔧 Mantenimiento', val: data.fleet.maint_cost, color: 'text-blue-400' },
              { label: '🚫 Multas', val: data.fleet.fines_cost, color: 'text-red-400' },
            ].map((f, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{f.label}</span>
                <span className={`text-sm font-semibold ${f.color}`}>{fmtMoney(f.val)}</span>
              </div>
            ))}
            <div className="border-t border-slate-800 pt-2 flex justify-between">
              <span className="text-sm text-slate-300 font-medium">Total</span>
              <span className="text-sm font-bold text-white">{fmtMoney(Number(data.fleet.fuel_cost) + Number(data.fleet.maint_cost) + Number(data.fleet.fines_cost))}</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-blue-400" /> Órdenes Recientes</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(data.recentOrders || []).map((o, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/60 transition-colors">
                <span className="text-lg">{typeIcons[String(o.service_type)] || '🔧'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400">{String(o.order_number)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${statusColors[String(o.status)] ? 'text-white' : 'text-slate-400'} ${prioColors[String(o.priority)]?.split(' ').slice(1).join(' ') || ''}`}>{String(o.priority)}</span>
                  </div>
                  <p className="text-sm text-slate-200 truncate">{String(o.title)}</p>
                  <p className="text-[10px] text-slate-500">{String(o.client_name)} · {String(o.branch_name)}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${statusColors[String(o.status)]} text-white`}>
                  {statusLabels[String(o.status)] || String(o.status)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Incidents */}
      {data.recentIncidents && data.recentIncidents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-zinc-900/60 border border-red-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Incidencias Recientes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.recentIncidents.map((inc, i) => {
              const sevColors: Record<string, string> = { critical: 'text-red-400 bg-red-500/10', high: 'text-orange-400 bg-orange-500/10', medium: 'text-yellow-400 bg-yellow-500/10', low: 'text-slate-400 bg-slate-500/10' }
              return (
                <div key={i} className="bg-zinc-800/40 border border-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${sevColors[String(inc.severity)] || sevColors.medium}`}>{String(inc.severity)}</span>
                    <span className={`text-[10px] ${String(inc.status) === 'open' ? 'text-yellow-400' : 'text-green-400'}`}>{String(inc.status)}</span>
                  </div>
                  <p className="text-sm text-slate-200">{String(inc.title)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{String(inc.reported_by_name)} · {new Date(String(inc.created_at)).toLocaleDateString('es-MX')}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
