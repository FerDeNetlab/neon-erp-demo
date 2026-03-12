'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList, Camera, AlertTriangle, Truck, Receipt, TrendingUp,
  Users, Package, Wrench, ShoppingCart, Loader2, ArrowDown, DollarSign,
  Fuel, AlertCircle, Clock, CheckCircle2, BarChart3
} from 'lucide-react'

type DashData = {
  tickets: { byEstado: { estado: string; count: number }[]; byType: { tipo: string; count: number }[]; byPriority: { prioridad: string; count: number }[]; byCity: { ciudad: string; count: number }[] }
  incidencias: { byEstado: { estado: string; count: number }[]; bySeverity: { severidad: string; count: number }[] }
  evidencias: { total: number }
  activos: { byEstado: { estado: string; count: number }[]; valorTotal: number }
  materiales: { total: number; lowStock: { nombre: string; stock_actual: number; stock_minimo: number }[] }
  flota: { byEstado: { estado: string; count: number }[]; gastoCombustible: number; gastoMantenimiento: number; gastoMultas: number; multasPendientes: number }
  ventas: { byEstado: { estado: string; count: number }[]; totalAceptadas: number }
  facturacion: { byEstado: { estado: string; count: number }[]; porCobrar: number; cobrado: number; monthlyRevenue: { mes: string; total: number }[] }
  recentTickets: { numero_ticket: string; titulo: string; estado: string; created_at: string }[]
  totalUsuarios: number
}

const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const getCount = (arr: { estado?: string; count: number }[], key: string) => arr.find(i => i.estado === key)?.count || 0

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      const d = await res.json()
      setData(d)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-green-400" /></div>
  if (!data) return <div className="text-center py-20 text-slate-400">Error al cargar datos</div>

  const totalTickets = data.tickets.byEstado.reduce((s, i) => s + i.count, 0)
  const ticketsActivos = getCount(data.tickets.byEstado, 'pendiente') + getCount(data.tickets.byEstado, 'en_progreso')
  const ticketsCompletos = getCount(data.tickets.byEstado, 'completado')
  const incAbiertas = getCount(data.incidencias.byEstado, 'abierta') + getCount(data.incidencias.byEstado, 'en_revision')
  const totalVehiculos = data.flota.byEstado.reduce((s, i) => s + i.count, 0)
  const totalFacturas = data.facturacion.byEstado.reduce((s, i) => s + i.count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl font-bold text-green-400">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Panel de control • {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* KPI Row 1 — Top level */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { title: 'Tickets Activos', value: String(ticketsActivos), icon: ClipboardList, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-500/20' },
          { title: 'Evidencias', value: String(data.evidencias.total), icon: Camera, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/20' },
          { title: 'Incidencias', value: String(incAbiertas), icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-500/20' },
          { title: 'Vehículos', value: String(totalVehiculos), icon: Truck, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500/20' },
          { title: 'Empleados', value: String(data.totalUsuarios), icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/20' },
          { title: 'Materiales', value: String(data.materiales.total), icon: Package, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-500/20' },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-zinc-900/50 border ${stat.border} rounded-lg p-4 hover:scale-[1.03] transition-transform cursor-default`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{stat.title}</span>
              <div className={`p-1.5 rounded-md ${stat.bg}`}><stat.icon className={`h-3.5 w-3.5 ${stat.color}`} /></div>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* KPI Row 2 — Financial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: 'Por Cobrar', value: `$${fmt(data.facturacion.porCobrar)}`, icon: Clock, color: 'text-yellow-400', border: 'border-yellow-500/20' },
          { title: 'Cobrado', value: `$${fmt(data.facturacion.cobrado)}`, icon: CheckCircle2, color: 'text-green-400', border: 'border-green-500/20' },
          { title: 'Cotizaciones Ganaadas', value: `$${fmt(data.ventas.totalAceptadas)}`, icon: TrendingUp, color: 'text-emerald-400', border: 'border-emerald-500/20' },
          { title: 'Valor Activos', value: `$${fmt(data.activos.valorTotal)}`, icon: Wrench, color: 'text-orange-400', border: 'border-orange-500/20' },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.06 }}
            className={`bg-zinc-900/50 border ${stat.border} rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-2"><stat.icon className={`h-4 w-4 ${stat.color}`} /><span className="text-xs text-slate-400">{stat.title}</span></div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tickets by Status */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-cyan-400" /> Tickets por Estado</h2>
          <div className="space-y-3">
            {[
              { key: 'pendiente', label: 'Pendientes', color: 'bg-yellow-400' },
              { key: 'en_progreso', label: 'En Progreso', color: 'bg-blue-400' },
              { key: 'completado', label: 'Completados', color: 'bg-green-400' },
              { key: 'cancelado', label: 'Cancelados', color: 'bg-red-400' },
            ].map(s => {
              const count = getCount(data.tickets.byEstado, s.key)
              const pct = totalTickets > 0 ? (count / totalTickets) * 100 : 0
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{s.label}</span><span className="text-slate-200 font-mono">{count}</span></div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${s.color} transition-all duration-1000`} style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Tickets by Type */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-cyan-400" /> Tickets por Tipo</h2>
          <div className="space-y-3">
            {data.tickets.byType.map(t => {
              const pct = totalTickets > 0 ? (t.count / totalTickets) * 100 : 0
              const colors: Record<string, string> = { fibra: 'bg-cyan-400', cctv: 'bg-purple-400', cableado: 'bg-blue-400', servidor: 'bg-orange-400', otro: 'bg-slate-400' }
              return (
                <div key={t.tipo}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-400 capitalize">{t.tipo}</span><span className="text-slate-200 font-mono">{t.count}</span></div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${colors[t.tipo] || 'bg-slate-400'} transition-all duration-1000`} style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Gastos de Flota */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2"><Truck className="h-4 w-4 text-yellow-400" /> Gastos de Flota</h2>
          <div className="space-y-4">
            {[
              { label: 'Combustible', value: data.flota.gastoCombustible, icon: Fuel, color: 'text-green-400' },
              { label: 'Mantenimiento', value: data.flota.gastoMantenimiento, icon: Wrench, color: 'text-blue-400' },
              { label: 'Multas', value: data.flota.gastoMultas, icon: AlertTriangle, color: 'text-red-400', extra: data.flota.multasPendientes > 0 ? `(${data.flota.multasPendientes} pendientes)` : '' },
            ].map(g => (
              <div key={g.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800"><g.icon className={`h-4 w-4 ${g.color}`} /></div>
                  <div>
                    <p className="text-sm text-slate-200">{g.label}</p>
                    {g.extra && <p className="text-xs text-red-400">{g.extra}</p>}
                  </div>
                </div>
                <span className={`text-lg font-bold ${g.color}`}>${fmt(g.value)}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-slate-800 flex justify-between">
              <span className="text-sm text-slate-400">Total Flota</span>
              <span className="text-lg font-bold text-yellow-400">${fmt(data.flota.gastoCombustible + data.flota.gastoMantenimiento + data.flota.gastoMultas)}</span>
            </div>
          </div>
        </motion.div>

        {/* Facturación mensual */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2"><DollarSign className="h-4 w-4 text-lime-400" /> Ingresos por Mes</h2>
          {data.facturacion.monthlyRevenue.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Sin datos de ingresos mensuales</p>
          ) : (
            <div className="space-y-3">
              {data.facturacion.monthlyRevenue.map(m => {
                const maxVal = Math.max(...data.facturacion.monthlyRevenue.map(r => Number(r.total)))
                const pct = maxVal > 0 ? (Number(m.total) / maxVal) * 100 : 0
                return (
                  <div key={m.mes}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{m.mes}</span><span className="text-lime-400 font-mono font-medium">${fmt(Number(m.total))}</span></div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-lime-400 transition-all duration-1000" style={{ width: `${pct}%` }} /></div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Material bajo stock */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-400" /> Materiales con Stock Bajo</h2>
          {data.materiales.lowStock.length === 0 ? (
            <p className="text-sm text-green-400 py-4 text-center">✓ Todos los materiales tienen stock suficiente</p>
          ) : (
            <div className="space-y-2">
              {data.materiales.lowStock.map((m, i) => (
                <div key={i} className="flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2"><ArrowDown className="h-3 w-3 text-red-400" /><span className="text-sm text-slate-200">{m.nombre}</span></div>
                  <div className="text-xs"><span className="text-red-400 font-bold">{Number(m.stock_actual)}</span><span className="text-slate-500"> / {Number(m.stock_minimo)} min</span></div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Tickets */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2"><Receipt className="h-4 w-4 text-cyan-400" /> Últimos Tickets</h2>
          <div className="space-y-2">
            {data.recentTickets.map(t => {
              const estadoColors: Record<string, string> = { pendiente: 'text-yellow-400', en_progreso: 'text-blue-400', completado: 'text-green-400', cancelado: 'text-red-400' }
              return (
                <div key={t.numero_ticket} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-cyan-400 font-mono">{t.numero_ticket}</span>
                    <span className="text-sm text-slate-200 truncate max-w-[200px]">{t.titulo}</span>
                  </div>
                  <span className={`text-xs capitalize ${estadoColors[t.estado] || 'text-slate-400'}`}>{t.estado?.replace('_', ' ')}</span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Incidencias by Severity */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
          className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-400" /> Incidencias por Severidad</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'baja', label: 'Baja', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-500/20' },
              { key: 'media', label: 'Media', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500/20' },
              { key: 'alta', label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-500/20' },
              { key: 'critica', label: 'Crítica', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-500/20' },
            ].map(s => {
              const count = data.incidencias.bySeverity.find(i => i.severidad === s.key)?.count || 0
              return (
                <div key={s.key} className={`${s.bg} border ${s.border} rounded-lg p-3 text-center`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{count}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Cotizaciones pipeline */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="bg-zinc-900/50 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-emerald-400" /> Pipeline de Ventas</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'borrador', label: 'Borrador', color: 'text-slate-400', border: 'border-slate-500/20' },
              { key: 'enviada', label: 'Enviadas', color: 'text-blue-400', border: 'border-blue-500/20' },
              { key: 'aceptada', label: 'Aceptadas', color: 'text-green-400', border: 'border-green-500/20' },
              { key: 'rechazada', label: 'Rechazadas', color: 'text-red-400', border: 'border-red-500/20' },
            ].map(s => {
              const count = getCount(data.ventas.byEstado, s.key)
              return (
                <div key={s.key} className={`bg-zinc-900 border ${s.border} rounded-lg p-3 text-center`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{count}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
