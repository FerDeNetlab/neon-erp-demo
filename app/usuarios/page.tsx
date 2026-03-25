'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Loader2, Mail, MapPin, Briefcase } from 'lucide-react'

type User = { id: string; full_name: string; email: string; phone: string; role: string; active: boolean; branch_name: string; position: string; department: string; employee_number: string; last_login_at: string }

const roleLabels: Record<string, string> = { admin: 'Administrador', manager: 'Gerente', supervisor: 'Supervisor', installer: 'Instalador', warehouse: 'Almacenista' }
const roleColors: Record<string, string> = { admin: 'text-red-400 bg-red-500/10 border-red-500/30', manager: 'text-blue-400 bg-blue-500/10 border-blue-500/30', supervisor: 'text-orange-400 bg-orange-500/10 border-orange-500/30', installer: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', warehouse: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }

export default function UsuariosPage() {
  const [data, setData] = useState<{users: User[]} | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => { fetch('/api/usuarios').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  const filtered = roleFilter ? data.users.filter(u => u.role === roleFilter) : data.users
  const roleCounts = data.users.reduce<Record<string, number>>((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc }, {})

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><Shield className="h-6 w-6 text-gray-400" /> Usuarios</h1>
        <p className="text-sm text-slate-500 mt-0.5">{data.users.length} usuarios registrados</p></div>

      {/* Role filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setRoleFilter('')} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${!roleFilter ? 'bg-white/10 text-white border-white/20' : 'bg-zinc-900/60 text-slate-400 border-slate-800'}`}>Todos ({data.users.length})</button>
        {Object.entries(roleLabels).map(([k, v]) => (
          <button key={k} onClick={() => setRoleFilter(roleFilter === k ? '' : k)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${roleFilter === k ? roleColors[k] : 'bg-zinc-900/60 text-slate-400 border-slate-800'}`}>
            {v} ({roleCounts[k] || 0})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
            className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm border border-slate-700">{u.full_name?.charAt(0)}{u.full_name?.split(' ')[1]?.charAt(0) || ''}</div>
              <div className="min-w-0"><h3 className="text-sm font-semibold text-white truncate">{u.full_name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] border ${roleColors[u.role]}`}>{roleLabels[u.role]}</span></div>
            </div>
            <div className="space-y-1 text-xs text-slate-400">
              {u.position && <p className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{u.position} · {u.department}</p>}
              <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</p>
              {u.branch_name && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{u.branch_name}</p>}
              {u.employee_number && <p className="font-mono text-[10px] text-slate-600">{u.employee_number}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
