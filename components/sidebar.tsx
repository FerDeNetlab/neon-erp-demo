'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ClipboardList, Warehouse, Wrench, Truck, Package,
  ShoppingCart, DollarSign, Users, FolderKanban, FileText,
  Settings, LogOut, Menu, X, ChevronLeft, HardHat, Building2,
  Shield, BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { authClient } from '@/lib/auth/client'

type Module = { label: string; icon: typeof LayoutDashboard; href: string; color: string; bgColor: string; roles?: string[] }

const modules: Module[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
  { label: 'Órdenes de Servicio', icon: ClipboardList, href: '/ordenes', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  { label: 'Almacenes', icon: Warehouse, href: '/almacenes', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', roles: ['admin', 'manager', 'supervisor', 'warehouse'] },
  { label: 'Herramientas', icon: Wrench, href: '/herramientas', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  { label: 'Flotillas', icon: Truck, href: '/flotillas', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', roles: ['admin', 'manager', 'supervisor'] },
  { label: 'Activos', icon: Package, href: '/activos', color: 'text-purple-400', bgColor: 'bg-purple-400/10', roles: ['admin', 'manager'] },
  { label: 'Compras', icon: ShoppingCart, href: '/compras', color: 'text-pink-400', bgColor: 'bg-pink-400/10', roles: ['admin', 'manager', 'warehouse'] },
  { label: 'Costos', icon: DollarSign, href: '/costos', color: 'text-lime-400', bgColor: 'bg-lime-400/10', roles: ['admin', 'manager'] },
  { label: 'RH', icon: Users, href: '/rh', color: 'text-teal-400', bgColor: 'bg-teal-400/10', roles: ['admin', 'manager'] },
  { label: 'Proyectos', icon: FolderKanban, href: '/proyectos', color: 'text-indigo-400', bgColor: 'bg-indigo-400/10', roles: ['admin', 'manager'] },
  { label: 'Documentos', icon: FileText, href: '/documentos', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  { label: 'Sucursales', icon: Building2, href: '/sucursales', color: 'text-rose-400', bgColor: 'bg-rose-400/10', roles: ['admin'] },
  { label: 'Portal Técnico', icon: HardHat, href: '/tecnico', color: 'text-cyan-300', bgColor: 'bg-cyan-300/10', roles: ['installer'] },
  { label: 'Directivo', icon: BarChart3, href: '/directivo', color: 'text-violet-400', bgColor: 'bg-violet-400/10', roles: ['admin', 'manager'] },
  { label: 'Usuarios', icon: Shield, href: '/usuarios', color: 'text-gray-400', bgColor: 'bg-gray-400/10', roles: ['admin'] },
]

export default function Sidebar({ userRole = 'admin' }: { userRole?: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const filteredModules = useMemo(() => {
    return modules.filter(m => !m.roles || m.roles.includes(userRole))
  }, [userRole])

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.href = '/login'
  }

  const nav = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-cyan-500/20">F</div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <h1 className="text-lg font-black text-white tracking-tight">Frabe</h1>
              <p className="text-[10px] text-slate-500 -mt-0.5 tracking-widest uppercase">ERP System</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {filteredModules.map((mod) => {
          const isActive = mod.href === '/' ? pathname === '/' : pathname.startsWith(mod.href)
          return (
            <Link key={mod.href} href={mod.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? `${mod.bgColor} ${mod.color} shadow-sm`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }
                ${collapsed ? 'justify-center' : ''}`}>
              <mod.icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? mod.color : 'text-slate-500 group-hover:text-slate-300'}`} />
              {!collapsed && <span className="truncate">{mod.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-800/50 space-y-1">
        <Link href="/ajustes"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <Settings className="h-[18px] w-[18px]" />
          {!collapsed && <span>Ajustes</span>}
        </Link>
        <button onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-slate-800/50 z-40 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}>
        {nav}
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm text-slate-400 hover:text-white">
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/60 z-50" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[260px] bg-[#0a0a0a] border-r border-slate-800/50 z-50">
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
              {nav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`} />
    </>
  )
}
