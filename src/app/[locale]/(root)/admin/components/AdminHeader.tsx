'use client'

import {
  Menu,
  Bell,
  Settings,
  User,
  LogOut,
  Shield,
  HelpCircle,
} from 'lucide-react'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AdminHeaderProps {
  onMenuClick: () => void
  sidebarOpen: boolean
}

export default function AdminHeader({onMenuClick}: AdminHeaderProps) {
  return (
    <header className="border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 flex h-16 items-center gap-4 border-b px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-muted/80 transition-colors lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="text-foreground h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-muted relative transition-colors"
        >
          <Bell className="text-foreground h-4 w-4" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full p-0 text-xs font-semibold"
          >
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Help */}
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-muted transition-colors"
        >
          <HelpCircle className="text-foreground h-4 w-4" />
          <span className="sr-only">Help</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-muted/80 relative h-10 w-10 transition-colors"
            >
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">Admin User</p>
                <p className="text-muted-foreground text-xs leading-none">
                  admin@bekten.art
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              <span>Security</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
