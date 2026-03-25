'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Play, Monitor, Shield, BarChart3, Truck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDemo = async () => {
    setError('')
    setLoading(true)
    try {
      await fetch('/api/demo-setup', { method: 'POST' })
      await authClient.signUp.email({ email: 'demo@frabe.mx', password: 'demo1234', name: 'Usuario Demo' }).catch(() => {})
      const result = await authClient.signIn.email({ email: 'demo@frabe.mx', password: 'demo1234' })
      if (result.error) { setError('Error al iniciar. Intenta de nuevo.'); setLoading(false); return }
      localStorage.setItem('frabe-tour', 'pending')
      router.push('/')
      router.refresh()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-[#0c0c0c] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-lg">

        {/* Logo + Title */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-cyan-500/30 mb-4">
            F
          </motion.div>
          <h1 className="text-3xl font-black text-white">Frabe <span className="text-cyan-400">ERP</span></h1>
          <p className="text-sm text-slate-500 mt-1 tracking-widest uppercase">Sistema de Gestión · Redes Ópticas</p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#0a0a0a] overflow-hidden shadow-2xl">
          <div className="p-8 space-y-6">
            {/* Features preview */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Monitor, label: '15 Módulos', desc: 'Operación completa', color: 'text-cyan-400 bg-cyan-500/10' },
                { icon: BarChart3, label: 'Dashboard Directivo', desc: 'KPIs en tiempo real', color: 'text-violet-400 bg-violet-500/10' },
                { icon: Truck, label: 'Flotillas', desc: 'Control vehicular', color: 'text-yellow-400 bg-yellow-500/10' },
                { icon: Shield, label: 'Multi-tenancy', desc: 'RBAC por rol', color: 'text-emerald-400 bg-emerald-500/10' },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-zinc-900/60 border border-slate-800/50 rounded-xl p-3">
                  <f.icon className={`h-5 w-5 mb-1.5 ${f.color.split(' ')[0]}`} />
                  <p className="text-xs font-semibold text-slate-200">{f.label}</p>
                  <p className="text-[10px] text-slate-500">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">{error}</motion.p>}

            {/* CTA Button */}
            <motion.button onClick={handleDemo} disabled={loading}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white disabled:opacity-50 rounded-xl transition-all text-base font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 group">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />}
              {loading ? 'Preparando demo...' : 'Comenzar Demo Interactivo'}
            </motion.button>

            <p className="text-[10px] text-slate-600 text-center">
              Acceso instantáneo · Tour guiado del sistema · Datos de ejemplo
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 text-center mt-6">Frabe ERP v1.0 · Powered by <span className="text-cyan-400/50">Netlab</span></p>
      </motion.div>
    </main>
  )
}
