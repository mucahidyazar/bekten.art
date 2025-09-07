'use client'

import {usePathname, useSearchParams} from 'next/navigation'
import NProgress from 'nprogress'
import {useEffect, useState} from 'react'

import {cn} from '@/utils/cn'

interface ProgressBarProps {
  /**
   * Height of the progress bar
   */
  height?: string
  /**
   * Color of the progress bar
   */
  color?: string
  /**
   * Whether to show a glow effect
   */
  glow?: boolean
  /**
   * Animation duration in milliseconds
   */
  duration?: number
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Whether to auto-start on route changes
   */
  autoStart?: boolean
}

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  minimum: 0.08,
  speed: 200,
  trickleSpeed: 200,
})

// Global progress state for manual control
let globalProgressState = {
  isLoading: false,
  progress: 0,
  listeners: new Set<(state: {isLoading: boolean; progress: number}) => void>(),
}

const updateGlobalProgress = (updates: Partial<typeof globalProgressState>) => {
  globalProgressState = {...globalProgressState, ...updates}
  globalProgressState.listeners.forEach(listener =>
    listener({
      isLoading: globalProgressState.isLoading,
      progress: globalProgressState.progress,
    }),
  )
}

/**
 * NProgress-powered ProgressBar component
 * Can be used anywhere in the app by importing:
 * import {ProgressBar} from '@/components/ui/progress-bar'
 *
 * Example usage:
 * <ProgressBar color="red" height="6px" />
 * <ProgressBar autoStart={false} /> // Manual control
 */
export function ProgressBar({
  height = '4px',
  color = 'var(--color-primary)',
  glow = true,
  duration = 300,
  className,
  autoStart = true,
}: ProgressBarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [localState, setLocalState] = useState({isLoading: false, progress: 0})

  // Listen to global progress state
  useEffect(() => {
    const listener = (state: {isLoading: boolean; progress: number}) => {
      setLocalState(state)
    }

    globalProgressState.listeners.add(listener)

    return () => {
      globalProgressState.listeners.delete(listener)
    }
  }, [])

  // Auto-start on route changes
  useEffect(() => {
    if (!autoStart) return

    // Start progress
    updateGlobalProgress({isLoading: true, progress: 8})

    // Simulate progress
    const progressTimer = setInterval(() => {
      if (globalProgressState.progress >= 90) return
      updateGlobalProgress({
        progress: globalProgressState.progress + Math.random() * 10,
      })
    }, 100)

    // Complete after a short delay
    const completeTimer = setTimeout(() => {
      updateGlobalProgress({progress: 100})
      setTimeout(() => {
        updateGlobalProgress({isLoading: false, progress: 0})
        clearInterval(progressTimer)
      }, 200)
    }, 300)

    return () => {
      clearInterval(progressTimer)
      clearTimeout(completeTimer)
    }
  }, [pathname, searchParams, autoStart])

  return (
    <div
      id="progress-bar"
      className={cn('z-[2147483647] min-h-1 w-full overflow-hidden', className)}
      style={{height}}
    >
      {/* Progress Bar */}
      <div
        className="h-full transition-all ease-out"
        style={{
          width: `${localState.progress}%`,
          backgroundColor: color,
          transitionDuration: `${duration}ms`,
          boxShadow: glow ? `0 0 10px ${color}, 0 0 5px ${color}` : undefined,
        }}
      />
    </div>
  )
}

// Static methods for manual control
ProgressBar.start = () => {
  updateGlobalProgress({isLoading: true, progress: 8})
}
ProgressBar.done = () => {
  updateGlobalProgress({progress: 100})
  setTimeout(() => {
    updateGlobalProgress({isLoading: false, progress: 0})
  }, 200)
}
ProgressBar.set = (progress: number) => {
  updateGlobalProgress({progress: progress * 100})
}
ProgressBar.inc = (amount: number = 0.1) => {
  const newProgress = Math.min(100, globalProgressState.progress + amount * 100)

  updateGlobalProgress({progress: newProgress})
}

export default ProgressBar
