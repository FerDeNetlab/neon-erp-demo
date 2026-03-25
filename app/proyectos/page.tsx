'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderKanban, Loader2, CheckCircle2, Clock, AlertCircle, User, Calendar } from 'lucide-react'

type Project = { id: string; name: string; description: string; status: string; priority: string; start_date: string; due_date: string; owner_name: string; task_count: number; done_count: number }
type Task = { id: string; title: string; status: string; priority: string; project_name: string; assigned_to_name: string; due_date: string }
type Meeting = { id: string; title: string; date: string; location: string; created_by_name: string; project_name: string }

const projStatusColors: Record<string, string> = { active: 'text-green-400 bg-green-500/10', paused: 'text-yellow-400 bg-yellow-500/10', completed: 'text-blue-400 bg-blue-500/10', cancelled: 'text-red-400 bg-red-500/10' }
const taskStatusColors: Record<string, string> = { todo: 'text-slate-400 bg-slate-500/10', in_progress: 'text-amber-400 bg-amber-500/10', done: 'text-green-400 bg-green-500/10', blocked: 'text-red-400 bg-red-500/10' }
const taskStatusLabels: Record<string, string> = { todo: 'Por hacer', in_progress: 'En progreso', done: 'Hecho', blocked: 'Bloqueado' }

export default function ProyectosPage() {
  const [data, setData] = useState<{projects: Project[]; tasks: Task[]; meetings: Meeting[]} | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'projects'|'tasks'|'meetings'>('projects')

  useEffect(() => { fetch('/api/proyectos').then(r => r.json()).then(setData).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
  if (!data) return null

  return (
    <div data-tour="proyectos-tabs" className="space-y-5">
      <div><h1 className="text-2xl font-black text-white flex items-center gap-2"><FolderKanban className="h-6 w-6 text-indigo-400" /> Proyectos</h1></div>

      <div className="flex bg-zinc-900/60 border border-slate-800 rounded-xl overflow-hidden w-fit">
        <button onClick={() => setTab('projects')} className={`px-4 py-2 text-sm ${tab === 'projects' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400'}`}>📁 Proyectos</button>
        <button onClick={() => setTab('tasks')} className={`px-4 py-2 text-sm ${tab === 'tasks' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400'}`}>✅ Tareas</button>
        <button onClick={() => setTab('meetings')} className={`px-4 py-2 text-sm ${tab === 'meetings' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400'}`}>📅 Juntas</button>
      </div>

      {tab === 'projects' && (
        <div className="space-y-3">
          {(!data.projects || data.projects.length === 0) ? <p className="text-center py-12 text-slate-500">Sin proyectos registrados. Crea el primero desde el API.</p> :
          data.projects.map((p, i) => {
            const progress = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div><h3 className="text-base font-semibold text-white">{p.name}</h3>
                    {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${projStatusColors[p.status]}`}>{p.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  {p.owner_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.owner_name}</span>}
                  {p.due_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(p.due_date).toLocaleDateString('es-MX')}</span>}
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{p.done_count}/{p.task_count} tareas</span>
                </div>
                {p.task_count > 0 && (
                  <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-2">{(!data.tasks || data.tasks.length === 0) ? <p className="text-center py-12 text-slate-500">Sin tareas</p> :
          data.tasks.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="flex items-center gap-3 bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
            {t.status === 'done' ? <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" /> :
             t.status === 'blocked' ? <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" /> :
             <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />}
            <div className="min-w-0 flex-1"><p className="text-sm text-slate-200">{t.title}</p>
              <p className="text-[10px] text-slate-500">{t.project_name}{t.assigned_to_name && ` · ${t.assigned_to_name}`}{t.due_date && ` · ${new Date(t.due_date).toLocaleDateString('es-MX')}`}</p></div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${taskStatusColors[t.status]}`}>{taskStatusLabels[t.status] || t.status}</span>
          </motion.div>
        ))}</div>
      )}

      {tab === 'meetings' && (
        <div className="space-y-2">{(!data.meetings || data.meetings.length === 0) ? <p className="text-center py-12 text-slate-500">Sin juntas registradas</p> :
          data.meetings.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="flex items-center gap-3 bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
            <Calendar className="h-5 w-5 text-teal-400 flex-shrink-0" />
            <div className="min-w-0 flex-1"><p className="text-sm text-slate-200">{m.title}</p>
              <p className="text-[10px] text-slate-500">{m.date && new Date(m.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{m.location && ` · ${m.location}`}{m.project_name && ` · ${m.project_name}`}</p></div>
          </motion.div>
        ))}</div>
      )}
    </div>
  )
}
