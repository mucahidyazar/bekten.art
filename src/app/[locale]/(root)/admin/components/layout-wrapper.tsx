'use client'

import {usePathname} from 'next/navigation'

import {useState} from 'react'

import {useUser} from '@/components/providers/user-provider'

import AdminSidebar from './admin-sidebar'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({children}: LayoutWrapperProps) {
  const pathname = usePathname()
  const {user} = useUser()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check if current page is admin page
  const isAdminPage = pathname.startsWith('/admin')

  if (!isAdminPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar - Desktop */}
      <div
        className={`hidden transition-all duration-300 lg:flex ${
          sidebarCollapsed ? 'w-16' : 'w-[280px]'
        }`}
      >
        <AdminSidebar
          user={user}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar user={user} />
      </div>

      {/* Main content */}
      {children}
    </div>
  )
}
