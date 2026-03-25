'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Truck, Loader2, AlertTriangle, Shield, Fuel, Wrench, MapPin, User, Calendar, DollarSign, Gauge, ChevronDown, FileText, Activity } from 'lucide-react'

type Vehicle = { id: string; plate_number: string; economic_number: string; brand: string; model: string; year: number; color: string; type: string; status: string; branch_name: string; assigned_to_name: string; current_km: number; insurance_expiry: string; verification_expiry: string; maintenance_count: number; fuel_costs: number; fine_count: number; vin: string }

const statusLabels: Record<string, string> = { active: 'Activo', in_shop: 'En Taller', decommissioned: 'Baja' }
const statusColors: Record<string, string> = { active: 'text-green-400 bg-green-500/10 border-green-500/30', in_shop: 'text-amber-400 bg-amber-500/10 border-amber-500/30', decommissioned: 'text-gray-400 bg-gray-500/10 border-gray-500/30' }
const typeIcons: Record<string, string> = { pickup: '🛻', van: '🚐', sedan: '🚗', truck: '🚚' }

function fmtMoney(n: number) { return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0 }) }
function daysLeft(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) }

export default function FlotillasPage() {
  const [data, setData] = useState<{vehicles: Vehicle[]; stats: Record<string, number>} | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { fetch('/api/flotillas').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  const filtered = statusFilter ? data.vehicles.filter(v => v.status === statusFilter) : data.vehicles
  const totalFuel = data.vehicles.reduce((s, v) => s + Number(v.fuel_costs || 0), 0)
  const totalKm = data.vehicles.reduce((s, v) => s + Number(v.current_km), 0)

  return (
    <div data-tour="flotillas-grid" className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><Truck className="h-6 w-6 text-yellow-400" /> Flotillas</h1></div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: Truck, label: 'Total', value: data.stats.total, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
          { icon: Activity, label: 'Activos', value: data.stats.active, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
          { icon: Wrench, label: 'En Taller', value: data.stats.in_shop, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { icon: Fuel, label: 'Combustible', value: fmtMoney(totalFuel), color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { icon: Gauge, label: 'Km Totales', value: totalKm.toLocaleString('es-MX'), color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`${s.color} border rounded-xl p-3`}>
            <s.icon className="h-4 w-4 mb-1 opacity-70" /><p className="text-xl font-bold">{s.value}</p><p className="text-[10px] opacity-60">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {(Number(data.stats.insurance_alert) > 0 || Number(data.stats.verification_alert) > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Alertas de Vencimiento</h3>
          <div className="flex gap-3">
            {Number(data.stats.insurance_alert) > 0 && <span className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-300 border border-red-500/20"><Shield className="h-3 w-3 inline mr-1" />{data.stats.insurance_alert} seguros por vencer</span>}
            {Number(data.stats.verification_alert) > 0 && <span className="px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20"><FileText className="h-3 w-3 inline mr-1" />{data.stats.verification_alert} verificaciones por vencer</span>}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'active', 'in_shop', 'decommissioned'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs border ${statusFilter === s ? (s ? statusColors[s] : 'bg-white/10 text-white border-white/20') : 'bg-zinc-900/60 text-slate-400 border-slate-800'}`}>
            {s ? statusLabels[s] : `Todos (${data.vehicles.length})`}
          </button>
        ))}
      </div>

      {/* Vehicles Grid */}
      <div className="space-y-3">
        {filtered.map((v, i) => {
          const insLeft = v.insurance_expiry ? daysLeft(v.insurance_expiry) : 999
          const verLeft = v.verification_expiry ? daysLeft(v.verification_expiry) : 999
          const isExpanded = expanded === v.id
          return (
            <motion.div key={v.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-zinc-900/60 border border-slate-800/50 rounded-xl overflow-hidden">
              <div className="p-4 cursor-pointer hover:bg-zinc-900/80 transition-colors" onClick={() => setExpanded(isExpanded ? null : v.id)}>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{typeIcons[v.type] || '🚗'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white">{v.brand} {v.model} {v.year}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${statusColors[v.status]}`}>{statusLabels[v.status]}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="font-mono text-cyan-400">{v.plate_number}</span>
                      <span className="font-mono">{v.economic_number}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.branch_name}</span>
                      {v.assigned_to_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{v.assigned_to_name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-4 items-center text-right">
                    <div><p className="text-sm font-bold text-white">{Number(v.current_km).toLocaleString('es-MX')}</p><p className="text-[10px] text-slate-500">km</p></div>
                    {insLeft <= 30 && <AlertTriangle className={`h-5 w-5 ${insLeft <= 0 ? 'text-red-400' : 'text-amber-400'} animate-pulse`} />}
                    <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
              {isExpanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-slate-800 px-4 py-4 bg-zinc-800/20">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="bg-zinc-900/60 rounded-lg p-3"><p className="text-[10px] text-slate-500">Color</p><p className="text-sm text-slate-200">{v.color}</p></div>
                    <div className="bg-zinc-900/60 rounded-lg p-3"><p className="text-[10px] text-slate-500">VIN</p><p className="text-xs font-mono text-slate-300">{v.vin}</p></div>
                    <div className={`bg-zinc-900/60 rounded-lg p-3 ${insLeft <= 30 ? 'border border-red-500/30' : ''}`}><p className="text-[10px] text-slate-500">Seguro vence</p>
                      <p className={`text-sm ${insLeft <= 30 ? (insLeft <= 0 ? 'text-red-400' : 'text-amber-400') : 'text-slate-200'}`}>{v.insurance_expiry ? new Date(v.insurance_expiry).toLocaleDateString('es-MX') : '—'}{insLeft <= 30 && ` (${insLeft}d)`}</p></div>
                    <div className={`bg-zinc-900/60 rounded-lg p-3 ${verLeft <= 30 ? 'border border-amber-500/30' : ''}`}><p className="text-[10px] text-slate-500">Verificación vence</p>
                      <p className={`text-sm ${verLeft <= 30 ? 'text-amber-400' : 'text-slate-200'}`}>{v.verification_expiry ? new Date(v.verification_expiry).toLocaleDateString('es-MX') : '—'}{verLeft <= 30 && ` (${verLeft}d)`}</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-zinc-900/60 rounded-lg p-3 text-center"><Wrench className="h-4 w-4 mx-auto text-amber-400 mb-1" /><p className="text-lg font-bold text-white">{v.maintenance_count}</p><p className="text-[9px] text-slate-500">Mantenimientos</p></div>
                    <div className="bg-zinc-900/60 rounded-lg p-3 text-center"><Fuel className="h-4 w-4 mx-auto text-blue-400 mb-1" /><p className="text-lg font-bold text-blue-400">{fmtMoney(Number(v.fuel_costs || 0))}</p><p className="text-[9px] text-slate-500">Combustible</p></div>
                    <div className="bg-zinc-900/60 rounded-lg p-3 text-center"><AlertTriangle className="h-4 w-4 mx-auto text-red-400 mb-1" /><p className="text-lg font-bold text-red-400">{v.fine_count || 0}</p><p className="text-[9px] text-slate-500">Multas</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">+ Mantenimiento</button>
                    <button className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">+ Carga gasolina</button>
                    <button className="px-3 py-1.5 rounded-lg text-xs bg-green-500/10 text-green-400 border border-green-500/20">Renovar seguro</button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
