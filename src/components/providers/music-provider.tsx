'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import {useConsent} from '@/components/consent/consent-provider'

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

function extractYouTubeId(url: string): string {
  try {
    const parsedUrl = new URL(url)
    const candidate =
      parsedUrl.hostname === 'youtu.be'
        ? parsedUrl.pathname.slice(1)
        : parsedUrl.searchParams.get('v') ||
          parsedUrl.pathname.match(/^\/embed\/([^/]+)$/)?.[1] ||
          ''

    return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : ''
  } catch {
    return ''
  }
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
  const {decision, hydrated, openPreferences} = useConsent()
  const externalMediaAllowed = hydrated && decision?.externalMedia === true

  const playTrack = useCallback(
    async (track: Track) => {
      try {
        setIsLoading(true)
        setError(null)

        const videoId = getTrackYouTubeId(track)

        if (!videoId) {
          throw new Error('Invalid YouTube URL')
        }

        if (!externalMediaAllowed) {
          setIsLoading(false)

          openPreferences()

          return
        }

        setCurrentTrack(track)
        setYoutubeTitle(track.title)
        setIsPlaying(true)
      } catch (err) {
        console.error('Error playing track:', err)
        setError('Failed to load track')
        setIsLoading(false)
        setIsPlaying(false)
      }
    },
    [externalMediaAllowed, openPreferences],
  )

  const pauseMusic = useCallback(() => {
    setIsPlaying(false)
    setIsLoading(false)
  }, [])

  const toggleMusic = useCallback(async () => {
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

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) pauseMusic()
    }

    document.addEventListener('visibilitychange', pauseWhenHidden)

    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden)
    }
  }, [pauseMusic])

  useEffect(() => {
    if (!hydrated || decision?.externalMedia) return

    const timeout = window.setTimeout(pauseMusic, 0)

    return () => window.clearTimeout(timeout)
  }, [decision?.externalMedia, hydrated, pauseMusic])

  const videoId = currentTrack ? getTrackYouTubeId(currentTrack) : ''
  const embedUrl =
    externalMediaAllowed && isPlaying && videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&loop=1&playlist=${videoId}&enablejsapi=0&disablekb=1&fs=0&cc_load_policy=0`
      : null

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

      {embedUrl ? (
        <iframe
          src={embedUrl}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '1px',
            height: '1px',
            border: 'none',
          }}
          title="YouTube music player"
          aria-hidden="true"
          tabIndex={-1}
          referrerPolicy="no-referrer"
          allow="autoplay; encrypted-media"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          onLoad={() => {
            setIsLoading(false)
          }}
          onError={() => {
            console.error('Iframe error')
            setError('Failed to load music')
            setIsLoading(false)
            setIsPlaying(false)
          }}
        />
      ) : null}
    </MusicContext.Provider>
  )
}

function getTrackYouTubeId(track: Track) {
  return /^[a-zA-Z0-9_-]{11}$/.test(track.youtubeId)
    ? track.youtubeId
    : extractYouTubeId(track.url)
}

export function useMusic() {
  const context = useContext(MusicContext)

  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider')
  }

  return context
}
