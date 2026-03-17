'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ClipboardList,
  Camera,
  AlertTriangle,
  Wrench,
  Package,
  Truck,
  ShoppingCart,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  HardHat,
} from 'lucide-react'
import Link from 'next/link'

const modules = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  { label: 'Tickets', icon: ClipboardList, href: '/tickets', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
  { label: 'Evidencias', icon: Camera, href: '/evidencias', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  { label: 'Incidencias', icon: AlertTriangle, href: '/incidencias', color: 'text-red-400', bgColor: 'bg-red-400/10' },
  { label: 'Activos Fijos', icon: Wrench, href: '/activos', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  { label: 'Materiales', icon: Package, href: '/materiales', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  { label: 'Flota', icon: Truck, href: '/flota', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  { label: 'Ventas', icon: ShoppingCart, href: '/ventas', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  { label: 'Facturación', icon: Receipt, href: '/facturacion', color: 'text-lime-400', bgColor: 'bg-lime-400/10' },
  { label: 'Portal Técnico', icon: HardHat, href: '/tecnico', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
  { label: 'Ajustes', icon: Settings, href: '/ajustes', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <span className="text-green-400 font-bold text-sm">N</span>
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="text-green-400 font-bold text-sm">NEON ERP</span>
              <span className="text-slate-500 text-[10px]">v1.0</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {modules.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${active
                  ? `${item.bgColor} ${item.color} border border-current/20`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? item.color : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all w-full"
          title={collapsed ? 'Cerrar Sesión' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-zinc-900 border border-slate-700 rounded-lg p-2 text-slate-400 hover:text-green-400 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-[#0a0a0a] border-r border-slate-800 z-50 md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-[#0a0a0a] border-r border-slate-800 z-30 transition-all duration-300
          ${collapsed ? 'w-[68px]' : 'w-[240px]'}
        `}
      >
        <NavContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-zinc-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-green-400 transition-colors"
        >
          <ChevronLeft className={`h-3 w-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  )
}
