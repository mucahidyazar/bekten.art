'use client'

import {
  Plus,
  Upload,
  FileText,
  Users,
  Settings,
  Download,
  Mail,
  Calendar,
} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{className?: string}>
  color: string
  action: () => void
}

export default function QuickActions() {
  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Add New Artwork',
      description: 'Upload and publish new artwork',
      icon: Plus,
      color:
        'bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 border-blue-500/20 hover:border-blue-500/30 dark:text-blue-400',
      action: () => console.log('Add artwork'),
    },
    {
      id: '2',
      title: 'Create News Article',
      description: 'Write and publish news',
      icon: FileText,
      color:
        'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 border-emerald-500/20 hover:border-emerald-500/30 dark:text-emerald-400',
      action: () => console.log('Create news'),
    },
    {
      id: '3',
      title: 'Upload Media',
      description: 'Add images and videos',
      icon: Upload,
      color:
        'bg-purple-500/10 text-purple-700 hover:bg-purple-500/15 border-purple-500/20 hover:border-purple-500/30 dark:text-purple-400',
      action: () => console.log('Upload media'),
    },
    {
      id: '4',
      title: 'Manage Users',
      description: 'View and edit user accounts',
      icon: Users,
      color:
        'bg-orange-500/10 text-orange-700 hover:bg-orange-500/15 border-orange-500/20 hover:border-orange-500/30 dark:text-orange-400',
      action: () => console.log('Manage users'),
    },
    {
      id: '5',
      title: 'Schedule Event',
      description: 'Create new event or workshop',
      icon: Calendar,
      color:
        'bg-pink-500/10 text-pink-700 hover:bg-pink-500/15 border-pink-500/20 hover:border-pink-500/30 dark:text-pink-400',
      action: () => console.log('Schedule event'),
    },
    {
      id: '6',
      title: 'Send Newsletter',
      description: 'Send email to subscribers',
      icon: Mail,
      color:
        'bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/15 border-cyan-500/20 hover:border-cyan-500/30 dark:text-cyan-400',
      action: () => console.log('Send newsletter'),
    },
    {
      id: '7',
      title: 'Export Data',
      description: 'Download reports and backups',
      icon: Download,
      color:
        'bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/15 border-indigo-500/20 hover:border-indigo-500/30 dark:text-indigo-400',
      action: () => console.log('Export data'),
    },
    {
      id: '8',
      title: 'System Settings',
      description: 'Configure site settings',
      icon: Settings,
      color:
        'bg-slate-500/10 text-slate-700 hover:bg-slate-500/15 border-slate-500/20 hover:border-slate-500/30 dark:text-slate-400',
      action: () => console.log('System settings'),
    },
  ]

  return (
    <Card className="border-border/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(action => {
            const IconComponent = action.icon

            return (
              <Button
                key={action.id}
                variant="ghost"
                className={`flex h-auto flex-col items-center space-y-3 p-5 ${action.color} group border border-transparent transition-all duration-300`}
                onClick={action.action}
              >
                <div className="bg-background border-border/30 rounded-xl border p-3 shadow-sm transition-all duration-200 group-hover:shadow-md">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-sm leading-tight font-bold">
                    {action.title}
                  </p>
                  <p className="text-foreground/70 text-xs leading-tight font-medium">
                    {action.description}
                  </p>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
