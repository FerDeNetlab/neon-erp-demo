'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Loader2, Calendar, AlertTriangle, GraduationCap, Mail, Phone, MapPin, Briefcase } from 'lucide-react'

type Employee = { id: string; full_name: string; email: string; phone: string; role: string; position: string; department: string; employee_number: string; hire_date: string; branch_name: string }
type Vacation = { id: string; employee_name: string; start_date: string; end_date: string; days: number; type: string; status: string }
type HrIncident = { id: string; employee_name: string; type: string; date: string; description: string; severity: string }
type Training = { id: string; title: string; trainer: string; date: string; duration_hours: number; attendee_count: number }

const roleLabels: Record<string, string> = { admin: 'Admin', manager: 'Gerente', supervisor: 'Supervisor', installer: 'Instalador', warehouse: 'Almacenista' }
const vacStatusColors: Record<string, string> = { requested: 'text-yellow-400 bg-yellow-500/10', approved: 'text-green-400 bg-green-500/10', rejected: 'text-red-400 bg-red-500/10', taken: 'text-blue-400 bg-blue-500/10' }

export default function RHPage() {
  const [data, setData] = useState<{employees: Employee[]; vacations: Vacation[]; incidents: HrIncident[]; trainings: Training[]; stats: Record<string, number>} | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'employees'|'vacations'|'incidents'|'trainings'>('employees')

  useEffect(() => { fetch('/api/rh').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  return (
    <div data-tour="rh-tabs" className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><Users className="h-6 w-6 text-teal-400" /> Recursos Humanos</h1></div>

      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/60 border border-teal-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-teal-400">{data.stats.total_employees}</p><p className="text-xs text-slate-500">Empleados activos</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-zinc-900/60 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-400">{data.stats.pending_vacations}</p><p className="text-xs text-slate-500">Vacaciones pendientes</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900/60 border border-red-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400">{data.stats.recent_incidents}</p><p className="text-xs text-slate-500">Incidencias (30 días)</p></motion.div>
      </div>

      <div className="flex bg-zinc-900/60 border border-slate-800 rounded-xl overflow-hidden w-fit">
        <button onClick={() => setTab('employees')} className={`px-4 py-2 text-sm ${tab === 'employees' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400'}`}>👥 Empleados</button>
        <button onClick={() => setTab('vacations')} className={`px-4 py-2 text-sm ${tab === 'vacations' ? 'bg-yellow-500/10 text-yellow-400' : 'text-slate-400'}`}>🏖️ Vacaciones</button>
        <button onClick={() => setTab('incidents')} className={`px-4 py-2 text-sm ${tab === 'incidents' ? 'bg-red-500/10 text-red-400' : 'text-slate-400'}`}>⚠️ Incidencias</button>
        <button onClick={() => setTab('trainings')} className={`px-4 py-2 text-sm ${tab === 'trainings' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400'}`}>🎓 Capacitaciones</button>
      </div>

      {tab === 'employees' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.employees.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">{e.full_name?.charAt(0)}{e.full_name?.split(' ')[1]?.charAt(0) || ''}</div>
                <div><h3 className="text-sm font-semibold text-white">{e.full_name}</h3><p className="text-[10px] text-slate-500">{e.position} · {e.department}</p></div>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                <p className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{roleLabels[e.role] || e.role} · <span className="font-mono">{e.employee_number}</span></p>
                <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.branch_name}</p>
                <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{e.email}</p>
                {e.hire_date && <p className="flex items-center gap-1"><Calendar className="h-3 w-3" />Desde {new Date(e.hire_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'vacations' && (
        <div className="space-y-2">{data.vacations.map((v, i) => (
          <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="flex items-center gap-3 bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
            <div className="min-w-0 flex-1"><p className="text-sm text-slate-200">{v.employee_name}</p>
              <p className="text-[10px] text-slate-500">{new Date(v.start_date).toLocaleDateString('es-MX')} — {new Date(v.end_date).toLocaleDateString('es-MX')} · {v.days} días · {v.type}</p></div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${vacStatusColors[v.status] || 'text-slate-400'}`}>{v.status}</span>
          </motion.div>
        ))}</div>
      )}

      {tab === 'incidents' && (
        <div className="space-y-2">{data.incidents.map((inc, i) => (
          <motion.div key={inc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><span className={`px-1.5 py-0.5 rounded text-[10px] ${inc.severity === 'major' ? 'text-red-400 bg-red-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>{inc.severity}</span><span className="text-[10px] text-slate-500">{inc.type} · {new Date(inc.date).toLocaleDateString('es-MX')}</span></div>
            <p className="text-sm text-slate-200">{inc.description}</p>
            <p className="text-[10px] text-slate-500 mt-1">Empleado: {inc.employee_name}</p>
          </motion.div>
        ))}</div>
      )}

      {tab === 'trainings' && (
        <div className="space-y-2">{data.trainings.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="flex items-center gap-3 bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
            <GraduationCap className="h-5 w-5 text-indigo-400 flex-shrink-0" />
            <div className="min-w-0 flex-1"><p className="text-sm text-slate-200">{t.title}</p>
              <p className="text-[10px] text-slate-500">{t.trainer} · {new Date(t.date).toLocaleDateString('es-MX')} · {t.duration_hours}h</p></div>
            <span className="text-xs text-indigo-400">{t.attendee_count} asistentes</span>
          </motion.div>
        ))}</div>
      )}
    </div>
  )
}
