'use client'

import {Pause, Play} from 'lucide-react'
import Image from 'next/image'
import {useEffect, useState} from 'react'

import {useMusic} from '@/components/providers/music-provider'

interface MusicPlayerProps {
  className?: string
}

export function MusicPlayer({className = ''}: MusicPlayerProps) {
  const {
    isPlaying,
    currentTrack,
    tracks,
    isLoading,
    error,
    toggleMusic,
    playTrack,
  } = useMusic()

  const [isExpanded, setIsExpanded] = useState(false)

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

  if (error) {
    return null // Hide player on error
  }

  return (
    <div
      className={`fixed right-6 bottom-6 z-50 transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{visibility: 'visible', opacity: 1}}
    >
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
                sizes="(max-width: 768px) 32px, 48px"
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
              <Play className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          ) : (
            <div className="opacity-80 transition-opacity duration-200 hover:opacity-100">
              <Pause className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          )}
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
  )
}
