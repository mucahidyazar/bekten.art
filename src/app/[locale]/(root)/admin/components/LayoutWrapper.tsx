'use client'

import {usePathname} from 'next/navigation'
import {useState, useEffect} from 'react'

import {createClient} from '@/utils/supabase/client'

import AdminSidebar from './AdminSidebar'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({
  children,
}: LayoutWrapperProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if current page is admin page
  const isAdminPage = pathname.startsWith('/admin')

  useEffect(() => {
    async function fetchUser() {
      if (isAdminPage) {
        try {
          const supabase = createClient()
          const {
            data: {user},
          } = await supabase.auth.getUser()
          setUser(user)
        } catch (error) {
          console.error('Error fetching user:', error)
        }
      }
      setLoading(false)
    }

    fetchUser()
  }, [isAdminPage])

  if (!isAdminPage) {
    return <>{children}</>
  }

  if (loading) {
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
