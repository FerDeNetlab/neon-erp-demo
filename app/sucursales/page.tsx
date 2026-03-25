'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Loader2, MapPin, Users, ClipboardList, Warehouse, Truck, Phone, Star } from 'lucide-react'

type Branch = { id: string; name: string; address: string; city: string; state: string; phone: string; is_main: boolean; manager_name: string; user_count: number; order_count: number; warehouse_count: number; vehicle_count: number }
type Contract = { id: string; type: string; provider: string; description: string; amount: number; start_date: string; end_date: string; branch_name: string; status: string }

export default function SucursalesPage() {
  const [data, setData] = useState<{branches: Branch[]; contracts: Contract[]} | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'branches'|'contracts'>('branches')

  useEffect(() => { fetch('/api/sucursales').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><Building2 className="h-6 w-6 text-rose-400" /> Sucursales</h1></div>

      <div className="flex bg-zinc-900/60 border border-slate-800 rounded-xl overflow-hidden w-fit">
        <button onClick={() => setTab('branches')} className={`px-4 py-2 text-sm ${tab === 'branches' ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400'}`}>🏢 Sucursales</button>
        <button onClick={() => setTab('contracts')} className={`px-4 py-2 text-sm ${tab === 'contracts' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400'}`}>📄 Contratos</button>
      </div>

      {tab === 'branches' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {data.branches.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5 hover:border-rose-500/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">{b.name} {b.is_main && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}, {b.state}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3">{b.address}</p>
              {b.phone && <p className="text-xs text-cyan-400 flex items-center gap-1 mb-3"><Phone className="h-3 w-3" />{b.phone}</p>}
              {b.manager_name && <p className="text-xs text-slate-400 mb-3">👤 Gerente: <span className="text-slate-200">{b.manager_name}</span></p>}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/50">
                <div className="text-center"><Users className="h-4 w-4 mx-auto text-blue-400 mb-1" /><p className="text-sm font-bold text-white">{b.user_count}</p><p className="text-[9px] text-slate-500">Usuarios</p></div>
                <div className="text-center"><ClipboardList className="h-4 w-4 mx-auto text-green-400 mb-1" /><p className="text-sm font-bold text-white">{b.order_count}</p><p className="text-[9px] text-slate-500">Órdenes</p></div>
                <div className="text-center"><Warehouse className="h-4 w-4 mx-auto text-emerald-400 mb-1" /><p className="text-sm font-bold text-white">{b.warehouse_count}</p><p className="text-[9px] text-slate-500">Almacenes</p></div>
                <div className="text-center"><Truck className="h-4 w-4 mx-auto text-yellow-400 mb-1" /><p className="text-sm font-bold text-white">{b.vehicle_count}</p><p className="text-[9px] text-slate-500">Vehículos</p></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'contracts' && (
        <div className="space-y-2">
          {data.contracts.length === 0 ? <p className="text-center py-12 text-slate-500">Sin contratos registrados</p> :
            data.contracts.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
                <div className="min-w-0 flex-1"><p className="text-sm text-slate-200">{c.provider} — {c.type}</p>
                  <p className="text-[10px] text-slate-500">{c.branch_name} · {c.description} · {new Date(c.start_date).toLocaleDateString('es-MX')} — {new Date(c.end_date).toLocaleDateString('es-MX')}</p></div>
                <span className="text-sm font-semibold text-amber-400">${Number(c.amount).toLocaleString('es-MX')}</span>
              </motion.div>
            ))}
        </div>
      )}
    </div>
  )
}
