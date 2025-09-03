'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'

// YouTube Player API types
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

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
  const [volume, setVolume] = useState(30) // 0-100 scale for YouTube
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isYTReady, setIsYTReady] = useState(false)
  const [youtubeTitle, setYoutubeTitle] = useState<string | null>(null)

  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize YouTube API
  useEffect(() => {
    // Check if YouTube API is already loaded
    if (window.YT && window.YT.Player) {
      setIsYTReady(true)
      return
    }

    // Load YouTube API
    const loadYouTubeAPI = () => {
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        return
      }

      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.body.appendChild(script)
    }

    // Set up global callback
    window.onYouTubeIframeAPIReady = () => {
      setIsYTReady(true)
    }

    loadYouTubeAPI()

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy()
      }
    }
  }, [])

  // Initialize player when YouTube API is ready
  useEffect(() => {
    if (!isYTReady || !containerRef.current || playerRef.current) return

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          widget_referrer: window.location.href,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume)
            // Get video title when ready
            try {
              const videoData = event.target.getVideoData()
              if (videoData && videoData.title) {
                setYoutubeTitle(videoData.title)
                // Update current track with YouTube title
                setCurrentTrack(prev =>
                  prev ? {...prev, youtubeTitle: videoData.title} : prev,
                )
              }
            } catch (err) {
              console.log('Could not get video title:', err)
            }
          },
          onStateChange: (event: any) => {
            const state = event.data
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              setIsLoading(false)
              setError(null)
              // Try to get title again when playing
              try {
                const videoData = event.target.getVideoData()
                if (videoData && videoData.title) {
                  setYoutubeTitle(videoData.title)
                  setCurrentTrack(prev =>
                    prev ? {...prev, youtubeTitle: videoData.title} : prev,
                  )
                }
              } catch (err) {
                console.log('Could not get video title:', err)
              }
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              setIsLoading(false)
            } else if (state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
              setIsLoading(false)
              // Auto-play next track if available
              playNextTrack()
            } else if (state === window.YT.PlayerState.BUFFERING) {
              setIsLoading(true)
            }
          },
          onError: (_event: any) => {
            setError('Failed to load video')
            setIsLoading(false)
            setIsPlaying(false)
          },
        },
      })
    } catch (err) {
      setError('Failed to initialize player')
      console.error('YouTube player initialization error:', err)
    }
  }, [isYTReady, volume])

  // Update volume when changed
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume)
    }
  }, [volume])

  const extractYouTubeId = (url: string): string => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : ''
  }

  const playTrack = useCallback(async (track: Track) => {
    if (!playerRef.current || !playerRef.current.loadVideoById) {
      setError('Player not ready')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setCurrentTrack(track)

      const videoId = track.youtubeId || extractYouTubeId(track.url)
      if (!videoId) {
        throw new Error('Invalid YouTube URL')
      }

      playerRef.current.loadVideoById(videoId)
      // Note: playVideo() will be called automatically after loadVideoById
    } catch (err) {
      setError('Failed to load track')
      setIsLoading(false)
      console.error('Error playing track:', err)
    }
  }, [])

  const pauseMusic = useCallback(() => {
    if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo()
    }
  }, [])

  const toggleMusic = useCallback(async () => {
    if (!playerRef.current) return

    if (isPlaying) {
      pauseMusic()
    } else {
      if (currentTrack) {
        // Resume current track
        if (playerRef.current.playVideo) {
          playerRef.current.playVideo()
        }
      } else if (tracks.length > 0) {
        // Play first track
        await playTrack(tracks[0])
      }
    }
  }, [isPlaying, currentTrack, tracks, playTrack, pauseMusic])

  const playNextTrack = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return

    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id)
    const nextIndex = (currentIndex + 1) % tracks.length
    playTrack(tracks[nextIndex])
  }, [currentTrack, tracks, playTrack])

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
      {/* Hidden YouTube player container */}
      <div ref={containerRef} style={{display: 'none'}} aria-hidden="true" />
    </MusicContext.Provider>
  )
}

// Default tracks - can be moved to a separate config file later
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
