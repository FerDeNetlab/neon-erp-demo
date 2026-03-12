'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogIn, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message || 'Credenciales incorrectas. Intenta de nuevo.')
        setLoading(false)
        return
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0c0c0c] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Terminal Frame */}
        <div className="rounded-lg border border-slate-800 bg-[#0a0a0a] overflow-hidden shadow-2xl font-mono">
          {/* Terminal Header */}
          <div className="flex items-center px-4 py-2 bg-[#1a1b26] border-b border-slate-800">
            <div className="flex space-x-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="text-xs text-slate-400 select-none flex-1 text-center font-medium opacity-70">
              root@neon:~/login
            </div>
            <div className="w-12" />
          </div>

          {/* Login Content */}
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-green-400">
                NEON ERP
              </h1>
              <p className="text-sm text-slate-400">
                Ingresa tus credenciales para acceder al sistema
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                  className="w-full px-4 py-3 bg-zinc-900/80 border border-slate-700 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-colors text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-zinc-900/80 border border-slate-700 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-colors text-sm"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all text-sm font-medium"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 text-center">
                NEON ERP v1.0 • Powered by Netlab
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
