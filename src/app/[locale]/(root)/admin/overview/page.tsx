import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

import DashboardStats from '../components/DashboardStats'
import QuickActions from '../components/QuickActions'
import RecentActivity from '../components/RecentActivity'

export default function AdminOverviewPage() {
  return (
    <div className="admin-container">
      {/* Stats Grid */}
      <DashboardStats />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity />

        {/* System Status */}
        <Card className="border-border/30 hover:border-border/60 transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/30 border-border/20 flex items-center justify-between rounded-lg border p-3">
                <span className="text-foreground text-sm font-medium">
                  Server Status
                </span>
                <Badge
                  variant="default"
                  className="border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-600"
                >
                  Online
                </Badge>
              </div>
              <div className="bg-muted/30 border-border/20 flex items-center justify-between rounded-lg border p-3">
                <span className="text-foreground text-sm font-medium">
                  Database
                </span>
                <Badge
                  variant="default"
                  className="border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-600"
                >
                  Connected
                </Badge>
              </div>
              <div className="bg-muted/30 border-border/20 flex items-center justify-between rounded-lg border p-3">
                <span className="text-foreground text-sm font-medium">
                  Storage
                </span>
                <div className="flex items-center gap-2">
                  <div className="bg-muted h-2 w-16 overflow-hidden rounded-full">
                    <div className="bg-primary h-full w-3/4 rounded-full"></div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-foreground font-medium"
                  >
                    75% Used
                  </Badge>
                </div>
              </div>
              <div className="bg-muted/30 border-border/20 flex items-center justify-between rounded-lg border p-3">
                <span className="text-foreground text-sm font-medium">
                  Last Backup
                </span>
                <span className="text-foreground/80 text-sm font-medium">
                  2 hours ago
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
