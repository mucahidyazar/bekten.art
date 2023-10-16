'use client'
import {useRef, useState} from 'react'
import {OnProgressProps} from 'react-player/base'
import LazyReactPlayer from 'react-player/lazy'

import {Icons} from '@/components/ui/icons'
import {cn} from '@/utils'

type CircularProgressProps = {
  progress: number
  className?: string
}
function CircularProgress({progress, className}: CircularProgressProps) {
  const radius = 17
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <svg width="36" height="36" className={cn('mx-auto', className)}>
      <circle
        cx="18"
        cy="18"
        r={radius}
        stroke="#e0e0e0"
        strokeWidth="2"
        fill="transparent"
        className="transition-all ease-out duration-300"
      />
      <circle
        cx="18"
        cy="18"
        r={radius}
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        fill="transparent"
        className="transition-all ease-out duration-300"
      />
    </svg>
  )
}

type ReactPlayerProps = {
  withoutBg?: boolean
}
export function ReactPlayer({withoutBg}: ReactPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState<number>(0)
  const [progress, setProgress] = useState<OnProgressProps>({
    loaded: 0,
    played: 0,
    playedSeconds: 0,
    loadedSeconds: 0,
  })
  const playerRef = useRef(null)

  const togglePlayPause = () => {
    setPlaying(prev => !prev)
  }

  return (
    <>
      <LazyReactPlayer
        ref={playerRef}
        url={[
          'https://youtu.be/cdIY8ZwI2no?si=4X2RfH_NGSCftkbP',
          'https://youtu.be/JsZbiOkItHI?si=XRaAEB3CIf7cGYhB',
        ]}
        playing={playing}
        controls={true}
        muted={!playing}
        width={0}
        height={0}
        onProgress={progress => setProgress(progress)}
        onDuration={duration => setDuration(duration)}
      />

      <button
        onClick={togglePlayPause}
        className={cn(
          'w-9 h-9 flex items-center justify-center border border-primary-500 border-opacity-10 rounded-full bg-primary-500 bg-opacity-5 shadow-soft-md hover:shadow-soft-lg text-primary-500 z-50 relative',
          !!withoutBg &&
            'hover:shadow-none shadow-none bg-none border-none bg-opacity-0 w-fit px-2',
        )}
      >
        {!withoutBg && (
          <CircularProgress
            progress={(progress?.playedSeconds / duration) * 100}
            className="absolute inset-0 z-50"
          />
        )}
        {playing ? (
          <Icons.stop className="w-3" />
        ) : (
          <Icons.play className="w-3" />
        )}
      </button>
    </>
  )
}
