'use client'

import { 
  Users, 
  ImageIcon, 
  NewspaperIcon, 
  MessageSquare,
  TrendingUp,
  Eye,
  Calendar,
  Mail
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, description }: StatCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400'
      case 'negative':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card className="relative overflow-hidden border-border/30 hover:border-border/60 transition-all duration-200 hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          {value}
        </div>
        {change && (
          <div className={`text-xs flex items-center font-medium ${getChangeColor()}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {change}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            {description}
          </p>
        )}
      </CardContent>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent rounded-bl-3xl" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
    </Card>
  )
}

export default function DashboardStats() {
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12% from last month',
      changeType: 'positive' as const,
      icon: Users,
      description: 'Registered users'
    },
    {
      title: 'Artworks',
      value: '89',
      change: '+3 this week',
      changeType: 'positive' as const,
      icon: ImageIcon,
      description: 'Published artworks'
    },
    {
      title: 'News Articles',
      value: '45',
      change: '+2 this month',
      changeType: 'positive' as const,
      icon: NewspaperIcon,
      description: 'Published articles'
    },
    {
      title: 'Messages',
      value: '23',
      change: '5 unread',
      changeType: 'neutral' as const,
      icon: MessageSquare,
      description: 'Contact messages'
    },
    {
      title: 'Page Views',
      value: '12.5K',
      change: '+8% from last week',
      changeType: 'positive' as const,
      icon: Eye,
      description: 'This month'
    },
    {
      title: 'Events',
      value: '7',
      change: '2 upcoming',
      changeType: 'neutral' as const,
      icon: Calendar,
      description: 'Scheduled events'
    },
    {
      title: 'Newsletter',
      value: '892',
      change: '+24 this week',
      changeType: 'positive' as const,
      icon: Mail,
      description: 'Subscribers'
    },
    {
      title: 'Gallery Views',
      value: '3.2K',
      change: '+15% from last month',
      changeType: 'positive' as const,
      icon: ImageIcon,
      description: 'Monthly views'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
