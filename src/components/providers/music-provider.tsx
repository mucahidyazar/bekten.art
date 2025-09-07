'use client'

import {createContext, useContext, useState, useRef, useCallback} from 'react'

interface Track {
  id: string
  title: string
  youtubeId: string
  url: string
  youtubeTitle?: string
}

interface MusicContextType {
  isPlaying: boolean
  currentTrack: Track | null
  tracks: Track[]
  volume: number
  isLoading: boolean
  error: string | null
  youtubeTitle: string | null
  playTrack: (track: Track) => void
  pauseMusic: () => void
  toggleMusic: () => void
  setVolume: (volume: number) => void
  addTrack: (track: Track) => void
  removeTrack: (trackId: string) => void
}

const MusicContext = createContext<MusicContextType | undefined>(undefined)

interface MusicProviderProps {
  children: React.ReactNode
  defaultTracks?: Track[]
}

export function MusicProvider({
  children,
  defaultTracks = [],
}: MusicProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [tracks, setTracks] = useState<Track[]>(defaultTracks)
  const [volume, setVolume] = useState(30) // 0-100
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [youtubeTitle, setYoutubeTitle] = useState<string | null>(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const extractYouTubeId = (url: string): string => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    return match && match[2].length === 11 ? match[2] : ''
  }

  const playTrack = useCallback(async (track: Track) => {
    // console.log('MusicProvider: playTrack called with:', track.url)

    try {
      setIsLoading(true)
      setError(null)
      setCurrentTrack(track)
      setYoutubeTitle(track.title)

      const videoId = track.youtubeId || extractYouTubeId(track.url)

      if (!videoId) {
        throw new Error('Invalid YouTube URL')
      }

      if (iframeRef.current) {
        // Use nocookie domain and minimal parameters to reduce tracking
        const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&loop=1&playlist=${videoId}&enablejsapi=0&disablekb=1&fs=0&cc_load_policy=0&origin=${window.location.origin}`

        // console.log('Loading embed URL:', embedUrl)
        iframeRef.current.src = embedUrl
        setIsPlaying(true)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Error playing track:', err)
      setError('Failed to load track')
      setIsLoading(false)
      setIsPlaying(false)
    }
  }, [])

  const pauseMusic = useCallback(() => {
    // console.log('MusicProvider: pauseMusic called')
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank'
    }
    setIsPlaying(false)
  }, [])

  const toggleMusic = useCallback(async () => {
    // console.log('MusicProvider: toggleMusic called, isPlaying:', isPlaying, 'currentTrack:', currentTrack?.title)

    if (isPlaying) {
      pauseMusic()
    } else {
      if (currentTrack) {
        await playTrack(currentTrack)
      } else if (tracks.length > 0) {
        await playTrack(tracks[0])
      }
    }
  }, [isPlaying, currentTrack, tracks, playTrack, pauseMusic])

  const addTrack = useCallback((track: Track) => {
    setTracks(prev => [...prev, track])
  }, [])

  const removeTrack = useCallback(
    (trackId: string) => {
      setTracks(prev => prev.filter(t => t.id !== trackId))
      if (currentTrack?.id === trackId) {
        setCurrentTrack(null)
        pauseMusic()
      }
    },
    [currentTrack, pauseMusic],
  )

  const contextValue: MusicContextType = {
    isPlaying,
    currentTrack,
    tracks,
    volume,
    isLoading,
    error,
    youtubeTitle,
    playTrack,
    pauseMusic,
    toggleMusic,
    setVolume,
    addTrack,
    removeTrack,
  }

  return (
    <MusicContext.Provider value={contextValue}>
      {children}

      {/* Hidden YouTube iframe */}
      <iframe
        ref={iframeRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          border: 'none',
        }}
        title="YouTube Music Player"
        allow="autoplay; encrypted-media"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        onLoad={() => {
          // console.log('Iframe loaded')
          setIsLoading(false)
        }}
        onError={() => {
          console.error('Iframe error')
          setError('Failed to load music')
          setIsLoading(false)
          setIsPlaying(false)
        }}
      />
    </MusicContext.Provider>
  )
}

// Default tracks
export const defaultTracks: Track[] = [
  {
    id: '1',
    title: 'Ambient Music',
    youtubeId: 'uxLBxGloIGo',
    url: 'https://www.youtube.com/watch?v=uxLBxGloIGo',
  },
]

export function useMusic() {
  const context = useContext(MusicContext)

  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider')
  }

  return context
}
