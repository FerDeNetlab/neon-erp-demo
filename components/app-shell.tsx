'use client'

import Sidebar from '@/components/sidebar'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState('admin')

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.role) setUserRole(d.user.role) })
      .catch(() => {})
  }, [])

  // Don't show sidebar on login page
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex">
      <Sidebar userRole={userRole} />
      <main className="flex-1 min-h-screen transition-all duration-300">
        <div className="p-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
