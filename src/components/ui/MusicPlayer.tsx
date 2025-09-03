'use client'

import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
} from 'lucide-react'
import Image from 'next/image'
import {useState, useEffect} from 'react'

import {useMusic} from '@/components/providers/MusicProvider'
import {Button} from '@/components/ui/button'
import {Slider} from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MusicPlayerProps {
  className?: string
}

export function MusicPlayer({className = ''}: MusicPlayerProps) {
  const {
    isPlaying,
    currentTrack,
    tracks,
    volume,
    isLoading,
    error,
    youtubeTitle,
    toggleMusic,
    setVolume,
    playTrack,
  } = useMusic()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(volume)

  // Auto-play first track when component mounts
  useEffect(() => {
    if (tracks.length > 0 && !currentTrack) {
      // Auto-play after a short delay to ensure user interaction
      const timer = setTimeout(() => {
        playTrack(tracks[0])
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [tracks, currentTrack, playTrack])

  const handleVolumeToggle = () => {
    if (isMuted) {
      setVolume(previousVolume)
      setIsMuted(false)
    } else {
      setPreviousVolume(volume)
      setVolume(0)
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  const playNext = () => {
    if (!currentTrack || tracks.length === 0) return
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id)
    const nextIndex = (currentIndex + 1) % tracks.length
    playTrack(tracks[nextIndex])
  }

  const playPrevious = () => {
    if (!currentTrack || tracks.length === 0) return
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id)
    const previousIndex =
      currentIndex === 0 ? tracks.length - 1 : currentIndex - 1
    playTrack(tracks[previousIndex])
  }

  if (error) {
    return null // Hide player on error
  }

  return (
    <TooltipProvider>
      <div
        className={`fixed right-6 bottom-6 z-50 transition-all duration-300 ${className}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        style={{visibility: 'visible', opacity: 1}}
      >
        {/* Expanded Control Panel */}
        <div
          className={`absolute right-0 bottom-full mb-4 transition-all duration-300 ease-in-out ${
            isExpanded
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <div className="bg-background/95 border-border/50 min-w-[280px] rounded-2xl border p-4 shadow-2xl backdrop-blur-md">
            {/* Track Info */}
            <div className="mb-3">
              <h4 className="text-foreground truncate text-sm font-medium">
                {youtubeTitle || currentTrack?.title || 'Loading...'}
              </h4>
              <p className="text-muted-foreground text-xs">Background Music</p>
            </div>

            {/* Controls */}
            <div className="mb-3 flex items-center justify-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playPrevious}
                    disabled={tracks.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous Track</TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMusic}
                disabled={isLoading}
                className="h-10 w-10 p-0"
              >
                {isLoading ? (
                  <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playNext}
                    disabled={tracks.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next Track</TooltipContent>
              </Tooltip>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVolumeToggle}
                className="h-8 w-8 flex-shrink-0 p-0"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-muted-foreground w-8 text-right text-xs">
                {Math.round(isMuted ? 0 : volume)}
              </span>
            </div>
          </div>
        </div>

        {/* Vinyl Record Player */}
        <div className="relative z-10">
          {/* Vinyl Record */}
          <div
            className={`relative z-20 h-16 w-16 transition-transform duration-300 ${
              isPlaying ? 'animate-spin' : ''
            } ${isExpanded ? 'scale-110' : 'scale-100'}`}
            style={{animationDuration: '3s'}}
          >
            {/* Record Base */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl">
              {/* Vinyl Grooves */}
              <div className="absolute inset-2 rounded-full border border-gray-600/30"></div>
              <div className="absolute inset-3 rounded-full border border-gray-600/20"></div>
              <div className="absolute inset-4 rounded-full border border-gray-600/10"></div>

              {/* Record Image */}
              <div className="absolute inset-3 overflow-hidden rounded-full">
                <Image
                  src="/img/vinly-record.png"
                  alt="Music"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full border border-red-500/50 bg-gradient-to-br from-red-600 to-red-800 shadow-inner">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-red-500/50 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* Tone Arm */}
            <div
              className={`absolute -top-1 -right-2 z-25 h-1 w-8 origin-left transform rounded-full bg-gradient-to-r from-gray-600 to-gray-800 shadow-lg transition-transform duration-300 ${
                isPlaying ? 'rotate-12' : 'rotate-0'
              }`}
              style={{transformOrigin: '10% 50%'}}
            >
              <div className="absolute top-0 right-0 h-1 w-1 rounded-full bg-yellow-400 shadow-sm"></div>
            </div>
          </div>

          {/* Play/Pause Overlay */}
          <button
            onClick={toggleMusic}
            disabled={isLoading}
            className="absolute inset-0 z-30 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-black/10"
            title={isPlaying ? 'Pause Music' : 'Play Music'}
          >
            {isLoading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : !isPlaying && !isExpanded ? (
              <div className="opacity-100 transition-opacity duration-200 hover:opacity-80">
                <Play className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            ) : isExpanded && !isPlaying ? (
              <div className="opacity-80 transition-opacity duration-200 hover:opacity-100">
                <Play className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
            ) : null}
          </button>

          {/* Glowing Ring Effect */}
          {isPlaying && (
            <div className="from-primary/20 via-primary/10 absolute -inset-2 z-10 animate-pulse rounded-full bg-gradient-to-br to-transparent"></div>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform">
            <div className="flex space-x-1">
              <div className="bg-primary h-1 w-1 animate-bounce rounded-full"></div>
              <div
                className="bg-primary h-1 w-1 animate-bounce rounded-full"
                style={{animationDelay: '0.1s'}}
              ></div>
              <div
                className="bg-primary h-1 w-1 animate-bounce rounded-full"
                style={{animationDelay: '0.2s'}}
              ></div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
