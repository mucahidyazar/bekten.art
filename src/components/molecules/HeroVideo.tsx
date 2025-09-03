'use client'

import {useEffect, useRef} from 'react'

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.4
      videoRef.current.play()
    }
  }, [])

  return (
    <div className="aspect-video w-full overflow-hidden">
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        loop
        muted
        playsInline
        controls={false}
        preload="auto"
        className="h-full w-full max-w-full object-cover"
        src="/video/hero-video.mp4"
      />
    </div>
  )
}
