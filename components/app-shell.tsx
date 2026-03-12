'use client'

import { Sidebar } from '@/components/sidebar'
import { usePathname } from 'next/navigation'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on login page
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      <Sidebar />
      {/* Main content with left margin that matches sidebar width */}
      <main className="md:ml-[240px] min-h-screen transition-all duration-300">
        <div className="p-6 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
