'use client'

import {PauseIcon, PlayIcon} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const pauseVideo = useCallback(() => {
    videoRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const playVideo = useCallback(async () => {
    if (!videoRef.current) return

    try {
      await videoRef.current.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    video.playbackRate = 0.4
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const applyMotionPreference = () => {
      if (reducedMotion.matches) {
        pauseVideo()
      } else {
        void playVideo()
      }
    }

    applyMotionPreference()
    reducedMotion.addEventListener('change', applyMotionPreference)

    return () => {
      reducedMotion.removeEventListener('change', applyMotionPreference)
      video.pause()
    }
  }, [pauseVideo, playVideo])

  return (
    <div className="group relative aspect-video w-full overflow-hidden">
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        loop
        muted
        playsInline
        controls={false}
        preload="metadata"
        aria-label="Bekten Usubaliev working in his art studio"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="h-full w-full max-w-full object-cover"
        src="/video/hero-video.mp4"
      />
      <button
        type="button"
        aria-label={
          isPlaying ? 'Pause background video' : 'Play background video'
        }
        aria-pressed={isPlaying}
        onClick={isPlaying ? pauseVideo : () => void playVideo()}
        className="bg-background/85 text-foreground focus-visible:ring-ring absolute right-3 bottom-3 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {isPlaying ? (
          <PauseIcon aria-hidden="true" className="h-4 w-4" />
        ) : (
          <PlayIcon aria-hidden="true" className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
