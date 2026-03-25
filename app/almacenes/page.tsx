'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Warehouse, Loader2, Search, Package, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, RotateCcw, Filter, AlertTriangle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

type WH = { id: string; name: string; type: string; branch_name: string; manager_name: string }
type Item = { id: string; name: string; category: string; unit: string; stock_qty: number; min_stock: number; unit_cost: number; sku: string; warehouse_name: string; warehouse_id: string }
type Movement = { id: string; type: string; quantity: number; item_name: string; from_warehouse: string; to_warehouse: string; reference: string; performed_by_name: string; created_at: string }

const catColors: Record<string, string> = { fibra: 'text-cyan-400 bg-cyan-500/10', cableado: 'text-blue-400 bg-blue-500/10', conectores: 'text-purple-400 bg-purple-500/10', accesorios: 'text-amber-400 bg-amber-500/10' }
const moveIcons: Record<string, typeof ArrowDownLeft> = { entry: ArrowDownLeft, exit: ArrowUpRight, transfer: ArrowLeftRight, adjustment: RotateCcw, return: ArrowDownLeft }
const moveColors: Record<string, string> = { entry: 'text-green-400', exit: 'text-red-400', transfer: 'text-blue-400', adjustment: 'text-amber-400', return: 'text-cyan-400' }
const moveLabels: Record<string, string> = { entry: 'Entrada', exit: 'Salida', transfer: 'Traspaso', adjustment: 'Ajuste', return: 'Devolución' }

function fmtMoney(n: number) { return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0 }) }

export default function AlmacenesPage() {
  const [data, setData] = useState<{warehouses: WH[]; items: Item[]; movements: Movement[]} | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'inventory'|'movements'|'analytics'>('inventory')
  const [search, setSearch] = useState('')
  const [whFilter, setWhFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [lowStock, setLowStock] = useState(false)

  useEffect(() => { fetch('/api/almacenes').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  const filtered = data.items.filter(i =>
    (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())) &&
    (!whFilter || i.warehouse_id === whFilter) &&
    (!catFilter || i.category === catFilter) &&
    (!lowStock || i.stock_qty <= i.min_stock)
  )
  const categories = [...new Set(data.items.map(i => i.category))]
  const totalValue = data.items.reduce((s, i) => s + i.stock_qty * i.unit_cost, 0)
  const lowStockCount = data.items.filter(i => i.stock_qty <= i.min_stock && i.min_stock > 0).length

  return (
    <div data-tour="almacenes-stats" className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><Warehouse className="h-6 w-6 text-emerald-400" /> Almacenes</h1></div>
      </div>

      {/* Warehouse cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {data.warehouses.map((wh, i) => {
          const whItems = data.items.filter(it => it.warehouse_id === wh.id)
          const whValue = whItems.reduce((s, it) => s + it.stock_qty * it.unit_cost, 0)
          const whLow = whItems.filter(it => it.stock_qty <= it.min_stock && it.min_stock > 0).length
          return (
            <motion.div key={wh.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setWhFilter(whFilter === wh.id ? '' : wh.id)}
              className={`bg-zinc-900/60 border rounded-xl p-4 cursor-pointer transition-all hover:bg-zinc-900/80 ${whFilter === wh.id ? 'border-emerald-500/50' : 'border-slate-800/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">{wh.name}</h3>
                {whLow > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] text-red-400 bg-red-500/10">{whLow} bajo</span>}
              </div>
              <p className="text-[10px] text-slate-500">{wh.branch_name} · {wh.manager_name || 'Sin gerente'}</p>
              <div className="flex gap-3 mt-2 pt-2 border-t border-slate-800/50">
                <div><p className="text-lg font-bold text-emerald-400">{whItems.length}</p><p className="text-[9px] text-slate-500">Productos</p></div>
                <div><p className="text-lg font-bold text-blue-400">{fmtMoney(whValue)}</p><p className="text-[9px] text-slate-500">Valor</p></div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3"><p className="text-lg font-bold text-white">{data.items.length}</p><p className="text-[10px] text-slate-500">Total productos</p></div>
        <div className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3"><p className="text-lg font-bold text-emerald-400">{fmtMoney(totalValue)}</p><p className="text-[10px] text-slate-500">Valor inventario</p></div>
        <div className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3"><p className="text-lg font-bold text-red-400">{lowStockCount}</p><p className="text-[10px] text-slate-500">Bajo stock</p></div>
        <div className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3"><p className="text-lg font-bold text-blue-400">{data.movements.length}</p><p className="text-[10px] text-slate-500">Movimientos</p></div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900/60 border border-slate-800 rounded-xl overflow-hidden w-fit">
        <button onClick={() => setTab('inventory')} className={`px-4 py-2 text-sm ${tab === 'inventory' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400'}`}>📦 Inventario</button>
        <button onClick={() => setTab('movements')} className={`px-4 py-2 text-sm ${tab === 'movements' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400'}`}>📊 Movimientos</button>
        <button onClick={() => setTab('analytics')} className={`px-4 py-2 text-sm ${tab === 'analytics' ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400'}`}>📈 Análisis</button>
      </div>

      {tab === 'inventory' && (
        <>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto o SKU..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" /></div>
            <div className="flex gap-1">
              {categories.map(c => (
                <button key={c} onClick={() => setCatFilter(catFilter === c ? '' : c)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${catFilter === c ? (catColors[c] || 'text-white bg-white/10') + ' border-current/30' : 'bg-zinc-900/60 text-slate-400 border-slate-800'}`}>
                  {c}
                </button>
              ))}
            </div>
            <button onClick={() => setLowStock(!lowStock)}
              className={`px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1 ${lowStock ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-slate-400 bg-zinc-900/60 border-slate-800'}`}>
              <AlertTriangle className="h-3 w-3" /> Stock bajo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase">
                <th className="pb-2 pl-3">Producto</th><th className="pb-2">SKU</th><th className="pb-2">Almacén</th><th className="pb-2 text-right">Stock</th><th className="pb-2 text-right">Mín.</th><th className="pb-2 text-right">P.U.</th><th className="pb-2 text-right">Valor</th>
              </tr></thead>
              <tbody>{filtered.map((item, i) => {
                const isLow = item.stock_qty <= item.min_stock && item.min_stock > 0
                return (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                    className={`border-b border-slate-800/30 hover:bg-slate-800/20 ${isLow ? 'bg-red-500/5' : ''}`}>
                    <td className="py-2.5 pl-3"><span className="text-slate-200">{item.name}</span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${catColors[item.category] || 'text-slate-400 bg-slate-500/10'}`}>{item.category}</span></td>
                    <td className="py-2.5 font-mono text-xs text-slate-500">{item.sku}</td>
                    <td className="py-2.5 text-xs text-slate-400">{item.warehouse_name}</td>
                    <td className={`py-2.5 text-right font-semibold ${isLow ? 'text-red-400' : 'text-slate-200'}`}>{item.stock_qty} <span className="text-[10px] text-slate-500">{item.unit}</span></td>
                    <td className="py-2.5 text-right text-slate-500">{item.min_stock}</td>
                    <td className="py-2.5 text-right text-slate-400">{fmtMoney(item.unit_cost)}</td>
                    <td className="py-2.5 text-right text-emerald-400 font-medium">{fmtMoney(item.stock_qty * item.unit_cost)}</td>
                  </motion.tr>
                )
              })}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'movements' && (
        <div className="space-y-2">{data.movements.map((m, i) => {
          const Icon = moveIcons[m.type] || Package
          return (
            <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${moveColors[m.type]} bg-current/10`}>
                <Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200">{m.item_name}</p>
                <p className="text-[10px] text-slate-500">
                  <span className={`${moveColors[m.type]} font-medium`}>{moveLabels[m.type]}</span>
                  <span className="mx-1">·</span>{m.quantity} uds
                  {m.from_warehouse && <span> · De: {m.from_warehouse}</span>}{m.to_warehouse && <span> · A: {m.to_warehouse}</span>}
                  <span className="mx-1">·</span>{m.reference}<span className="mx-1">·</span>{m.performed_by_name}
                </p>
              </div>
              <span className="text-[10px] text-slate-600">{new Date(m.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
            </motion.div>
          )
        })}</div>
      )}

      {tab === 'analytics' && (() => {
        const byCat = data.items.reduce<Record<string, {count: number; value: number}>>((acc, i) => {
          if (!acc[i.category]) acc[i.category] = { count: 0, value: 0 }
          acc[i.category].count += i.stock_qty
          acc[i.category].value += i.stock_qty * i.unit_cost
          return acc
        }, {})
        const maxVal = Math.max(...Object.values(byCat).map(v => v.value)) || 1
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-purple-400" /> Valor por Categoría</h3>
              <div className="space-y-3">
                {Object.entries(byCat).sort((a, b) => b[1].value - a[1].value).map(([cat, d], i) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1"><span className={catColors[cat]?.split(' ')[0] || 'text-slate-300'}>{cat}</span><span className="text-slate-400">{d.count} uds · {fmtMoney(d.value)}</span></div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(d.value / maxVal) * 100}%` }} transition={{ delay: 0.3 + i * 0.1 }} className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full" /></div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-400" /> Productos en Alerta</h3>
              <div className="space-y-2">
                {data.items.filter(i => i.stock_qty <= i.min_stock && i.min_stock > 0).map((i, idx) => (
                  <div key={i.id} className="flex items-center justify-between p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                    <div><p className="text-sm text-slate-200">{i.name}</p><p className="text-[10px] text-slate-500">{i.warehouse_name} · {i.sku}</p></div>
                    <div className="text-right"><p className="text-sm font-bold text-red-400">{i.stock_qty}</p><p className="text-[10px] text-slate-500">mín: {i.min_stock}</p></div>
                  </div>
                ))}
                {data.items.filter(i => i.stock_qty <= i.min_stock && i.min_stock > 0).length === 0 && <p className="text-sm text-slate-500 py-4 text-center">Sin alertas 🎉</p>}
              </div>
            </motion.div>
          </div>
        )
      })()}
    </div>
  )
}
