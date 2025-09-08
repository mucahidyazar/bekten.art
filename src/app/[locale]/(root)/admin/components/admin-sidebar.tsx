'use client'

import Image from 'next/image'
import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {
  LayoutDashboard,
  Users,
  Store,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {cn} from '@/utils/cn'

interface AdminSidebarProps {
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      name?: string
      avatar_url?: string
    }
    role?: string
  } | null
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview and statistics',
    href: '/admin',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Site analytics and metrics',
    href: '/admin/analytics',
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    icon: MessageSquare,
    description: 'Testimonials management',
    href: '/admin/testimonials',
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    description: 'User management',
    href: '/admin/users',
  },
  {
    id: 'store',
    label: 'Store',
    icon: Store,
    description: 'Store management',
    href: '/admin/store',
  },
]

export default function AdminSidebar({
  user,
  collapsed = false,
  onCollapsedChange,
}: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        'from-card/95 via-card/90 to-card/95 border-border/30 flex h-full flex-col border-r bg-gradient-to-b backdrop-blur-xl transition-all duration-500 ease-out',
        'shadow-primary/5 shadow-2xl',
        collapsed ? 'w-16' : 'w-[280px]',
      )}
    >
      {/* Header */}
      <div className="border-border/20 relative overflow-hidden border-b p-5">
        <div className="from-primary/3 to-primary/5 absolute inset-0 bg-gradient-to-br via-transparent" />
        <div className="relative flex items-center justify-between">
          {!collapsed && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <LayoutDashboard className="text-primary h-4 w-4" />
                </div>
                <h2 className="text-foreground text-lg font-bold tracking-tight">
                  Admin
                </h2>
              </div>
              <p className="text-muted-foreground text-xs font-medium">
                Bekten Usubaliev Studio
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="hover:bg-primary/10 hover:text-primary h-8 w-8 rounded-lg p-0 transition-all duration-300 hover:scale-110"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map(item => {
            const IconComponent = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.id}
                href={item.href || '#'}
                className={cn(
                  'group relative flex h-10 w-full items-center justify-start rounded-lg px-3 py-2 text-left transition-all duration-200',
                  collapsed ? 'px-2' : 'px-3',
                  isActive
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="bg-primary-foreground absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-r-full" />
                )}

                <div className="flex w-full items-center">
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center transition-colors duration-200',
                      collapsed ? 'mx-auto' : 'mr-3',
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>

                  {!collapsed && (
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm leading-tight font-medium">
                        {item.label}
                      </span>
                      {!isActive && (
                        <span className="text-muted-foreground/70 text-xs leading-tight">
                          {item.description}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      {!collapsed && user && (
        <div className="border-border/20 space-y-3 border-t p-4">
          {/* User Info */}
          <div className="bg-card/50 flex items-center space-x-3 rounded-lg p-3 backdrop-blur-sm">
            {user.user_metadata?.avatar_url ? (
              <div className="relative">
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="User avatar"
                  width={36}
                  height={36}
                  className="ring-primary/20 h-9 w-9 rounded-full object-cover ring-2"
                />
                <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
              </div>
            ) : (
              <div className="relative">
                <div className="bg-primary/10 ring-primary/20 flex h-9 w-9 items-center justify-center rounded-full ring-2">
                  <Users className="text-primary h-4 w-4" />
                </div>
                <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-semibold">
                {user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  'Admin User'}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {user.email || 'admin@bekten.art'}
              </p>
              {user.role && (
                <div className="bg-primary/10 text-primary mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize">
                  {user.role}
                </div>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-9 w-full justify-center rounded-lg px-3 pr-8 transition-colors"
            onClick={() => {
              // TODO: Implement logout functionality
              console.log('Logout clicked')
            }}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </Button>
        </div>
      )}
    </div>
  )
}
