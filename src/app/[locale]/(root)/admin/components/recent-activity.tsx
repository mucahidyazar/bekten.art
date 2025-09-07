'use client'

import {
  User,
  ImageIcon,
  NewspaperIcon,
  MessageSquare,
  Calendar,
  Settings
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityItem {
  id: string
  type: 'user' | 'artwork' | 'news' | 'message' | 'event' | 'system'
  title: string
  description: string
  timestamp: string
  user?: {
    name: string
    avatar?: string
  }
  status?: 'success' | 'warning' | 'error' | 'info'
}

const activityItems: ActivityItem[] = [
  {
    id: '1',
    type: 'user',
    title: 'New user registration',
    description: 'John Doe joined the platform',
    timestamp: '2 minutes ago',
    user: {
      name: 'John Doe',
      avatar: '/img/me.jpg'
    },
    status: 'success'
  },
  {
    id: '2',
    type: 'artwork',
    title: 'New artwork uploaded',
    description: 'Abstract Painting #47 was added to gallery',
    timestamp: '15 minutes ago',
    status: 'info'
  },
  {
    id: '3',
    type: 'message',
    title: 'Contact message received',
    description: 'New inquiry about commission work',
    timestamp: '1 hour ago',
    status: 'warning'
  },
  {
    id: '4',
    type: 'news',
    title: 'News article published',
    description: 'Exhibition announcement went live',
    timestamp: '2 hours ago',
    status: 'success'
  },
  {
    id: '5',
    type: 'event',
    title: 'Event updated',
    description: 'Workshop schedule changed',
    timestamp: '3 hours ago',
    status: 'info'
  },
  {
    id: '6',
    type: 'system',
    title: 'System backup completed',
    description: 'Daily backup finished successfully',
    timestamp: '6 hours ago',
    status: 'success'
  }
]

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'user':
      return User
    case 'artwork':
      return ImageIcon
    case 'news':
      return NewspaperIcon
    case 'message':
      return MessageSquare
    case 'event':
      return Calendar
    case 'system':
      return Settings
    default:
      return Settings
  }
}

const getStatusColor = (status?: ActivityItem['status']) => {
  switch (status) {
    case 'success':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400'
    case 'warning':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
    case 'error':
      return 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400'
    case 'info':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export default function RecentActivity() {
  return (
    <Card className="border-border/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activityItems.map((item) => {
            const IconComponent = getActivityIcon(item.type)

            return (
              <div key={item.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-muted/30 transition-all duration-200 border border-transparent hover:border-border/50 group">
                <div className={`p-2.5 rounded-xl border ${getStatusColor(item.status)} group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-medium shrink-0 text-foreground border-border">
                      {item.timestamp}
                    </Badge>
                  </div>

                  {item.user && (
                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-border/30">
                      <Avatar className="h-6 w-6 ring-2 ring-background">
                        <AvatarImage src={item.user.avatar} alt={item.user.name} />
                        <AvatarFallback className="text-xs font-medium">
                          {item.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground font-medium">
                        {item.user.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
