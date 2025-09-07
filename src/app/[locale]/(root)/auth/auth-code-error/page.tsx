'use client'

import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function AuthCodeErrorPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto redirect to sign-in after 5 seconds
    const timer = setTimeout(() => {
      router.push('/sign-in')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Authentication Error</h1>
          <p className="text-muted-foreground">
            There was an issue completing your sign-in. This might happen if:
          </p>
        </div>

        <div className="text-left space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>The authentication code expired</li>
            <li>The request was invalid or corrupted</li>
            <li>There was a temporary server issue</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/sign-in')}
            className="w-full"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full"
          >
            Go Home
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          You will be automatically redirected to sign-in in a few seconds.
        </p>
      </div>
    </div>
  )
}
