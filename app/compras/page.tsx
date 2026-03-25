'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Loader2, DollarSign, CheckCircle2, Clock, FileText } from 'lucide-react'

type PO = { id: string; po_number: string; supplier_name: string; status: string; subtotal: number; tax: number; total: number; branch_name: string; created_by_name: string; approved_by_name: string; created_at: string; items: Array<{description: string; quantity: number; unit: string; unit_price: number; total: number; received_qty: number}> }

const statusLabels: Record<string, string> = { draft: 'Borrador', submitted: 'Enviada', approved: 'Aprobada', received: 'Recibida', cancelled: 'Cancelada' }
const statusColors: Record<string, string> = { draft: 'text-slate-400 bg-slate-500/10', submitted: 'text-blue-400 bg-blue-500/10', approved: 'text-green-400 bg-green-500/10', received: 'text-emerald-400 bg-emerald-500/10', cancelled: 'text-red-400 bg-red-500/10' }

function fmtMoney(n: number | string) { return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0 }) }

export default function ComprasPage() {
  const [data, setData] = useState<{orders: PO[]; stats: Record<string, number>} | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { fetch('/api/compras').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  return (
    <div data-tour="compras-list" className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-pink-400" /> Órdenes de Compra</h1></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total OC', value: data.stats.total, color: 'text-pink-400 bg-pink-500/10' },
          { label: 'Borradores', value: data.stats.drafts, color: 'text-slate-400 bg-slate-500/10' },
          { label: 'Enviadas', value: data.stats.submitted, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Monto Aprobado', value: fmtMoney(data.stats.approved_total), color: 'text-green-400 bg-green-500/10', isText: true },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.color} border border-slate-800/50 rounded-xl p-4`}>
            <p className="text-2xl font-bold">{s.value}</p><p className="text-xs opacity-70">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        {data.orders.map((po, i) => (
          <motion.div key={po.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-zinc-900/60 border border-slate-800/50 rounded-xl overflow-hidden">
            <div className="p-4 cursor-pointer hover:bg-zinc-900/80 transition-colors" onClick={() => setExpanded(expanded === po.id ? null : po.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-pink-400" />
                  <div><span className="font-mono text-cyan-400 text-sm">{po.po_number}</span>
                    <p className="text-sm text-slate-200 font-medium">{po.supplier_name}</p>
                    <p className="text-[10px] text-slate-500">{po.branch_name} · {po.created_by_name} · {new Date(po.created_at).toLocaleDateString('es-MX')}</p></div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusColors[po.status]}`}>{statusLabels[po.status]}</span>
                  <p className="text-sm font-bold text-white mt-1">{fmtMoney(po.total)}</p>
                </div>
              </div>
            </div>
            {expanded === po.id && po.items?.length > 0 && (
              <div className="border-t border-slate-800 px-4 py-3 bg-zinc-800/20">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-500 border-b border-slate-800"><th className="pb-2">Descripción</th><th className="pb-2 text-right">Cant.</th><th className="pb-2 text-right">P.U.</th><th className="pb-2 text-right">Total</th></tr></thead>
                  <tbody>{po.items.map((item, j) => (
                    <tr key={j} className="border-b border-slate-800/30"><td className="py-2 text-slate-300">{item.description || '—'}</td><td className="py-2 text-right text-slate-400">{Number(item.quantity)} {item.unit}</td><td className="py-2 text-right text-slate-400">{fmtMoney(item.unit_price)}</td><td className="py-2 text-right text-slate-200 font-medium">{fmtMoney(item.total)}</td></tr>
                  ))}</tbody>
                </table>
                <div className="flex justify-end gap-4 pt-2 text-xs"><span className="text-slate-500">Subtotal: {fmtMoney(po.subtotal)}</span><span className="text-slate-500">IVA: {fmtMoney(po.tax)}</span><span className="text-white font-bold">Total: {fmtMoney(po.total)}</span></div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
