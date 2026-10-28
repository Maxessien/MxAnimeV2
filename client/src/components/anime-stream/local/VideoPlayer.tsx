import React, { useEffect, useRef, useState, useCallback } from 'react'
import { type TrackKind, type VideoController } from '@get-air/video'
import { createTauriVideoClient } from '@get-air/video-tauri'

import { PlayerGestureOverlay } from './PlayerGestureOverlay'
import { PlayerControlsOverlay } from './PlayerControlsOverlay'
import { TrackSelectionModal } from './TrackSelectionModal'

import type {
  ControlsState,
  GestureFeedbackState,
  PlaybackState,
  TracksState,
  VideoPlayerProps,
} from './types'
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react'

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  title,
  client,
  engine,
  autoPlay = true,
  className = '',
  onControllerReady,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controllerRef = useRef<VideoController | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const triggerTimerRef = useRef<number | null>(null)

  // 1. Playback grouped state
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: autoPlay,
    isBuffering: true,
    currentTime: 0,
    duration: 0,
    bufferedAhead: 0,
  })

  // 2. Controls & modal grouped state
  const [controlsState, setControlsState] = useState<ControlsState>({
    isVisible: true,
    showTrackModal: false,
    activeModalTab: 'subtitle',
  })

  // 3. Gesture feedback state
  const [gestureFeedback, setGestureFeedback] = useState<GestureFeedbackState | null>(null)

  // 4. Tracks grouped state
  const [tracksState, setTracksState] = useState<TracksState>({
    tracks: [],
    selectedSubtitleId: undefined,
    selectedAudioId: undefined,
    selectedVideoId: undefined,
  })

  // Auto-hide controls timer
  const scheduleControlsHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)

    hideTimerRef.current = window.setTimeout(() => {
      setControlsState((prev) => ({ ...prev, isVisible: false }))
    }, 3500)
  }, [])

  const triggerFeedback = useCallback((type: GestureFeedbackState['type'], label: string) => {
    clearTimeout(triggerTimerRef.current || undefined)
    const id = Date.now()
    setGestureFeedback({
      id,
      type,
      label,
      x: 0,
      y: 0,
    })
    triggerTimerRef.current = window.setTimeout(() => {
      setGestureFeedback((curr) => (curr?.id === id ? null : curr))
    }, 750)
  }, [])

  // Initialize @get-air/video controller
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    let isDisposed = false
    const videoClient = client ?? createTauriVideoClient()

    let unsubTime: ()=> void | undefined
    let unsubBuffer: ()=> void | undefined
    let unsubTrack: ()=> void | undefined

    async function setupPlayer() {
      if (!videoElement) return
      try {
        const controller = await videoClient.attach(videoElement, {
          source,
          backend: 'tauri',
          backendOptions: {
            tauri: { engine: engine ?? 'media3' },
          },
          autoplay: autoPlay !== undefined && autoPlay !== null ? autoPlay : true
        })

        if (isDisposed) {
          await controller.destroy()
          return
        }

        controllerRef.current = controller

        // Initial tracks & media info
        const mediaInfo = controller.media
        const initialTracks = [...controller.tracks]
        setTracksState({
          tracks: initialTracks,
          selectedSubtitleId: initialTracks.find((t) => t.kind === 'subtitle' && t.selected)?.id,
          selectedAudioId: initialTracks.find((t) => t.kind === 'audio' && t.selected)?.id,
          selectedVideoId: initialTracks.find((t) => t.kind === 'video' && t.selected)?.id,
        })

        setPlaybackState((prev) => ({
          ...prev,
          duration: mediaInfo.durationSeconds || videoElement.duration || 0,
          isBuffering: false,
        }))

        // Subscribe to controller events
        unsubTime = controller.on('timeupdate', (e) => {
          setPlaybackState((prev) => ({
            ...prev,
            currentTime: e.detail.currentTime,
            duration: controller.media.durationSeconds || prev.duration,
          }))
        })

        unsubBuffer = controller.on('bufferprogress', (e) => {
          setPlaybackState((prev) => ({
            ...prev,
            bufferedAhead: e.detail.bufferedAhead,
          }))
        })

        unsubTrack = controller.on('trackchange', () => {
          const currentTracks = [...controller.tracks]
          setTracksState({
            tracks: currentTracks,
            selectedSubtitleId: currentTracks.find((t) => t.kind === 'subtitle' && t.selected)?.id,
            selectedAudioId: currentTracks.find((t) => t.kind === 'audio' && t.selected)?.id,
            selectedVideoId: currentTracks.find((t) => t.kind === 'video' && t.selected)?.id,
          })
        })

        if (isDisposed) {
          unsubTime()
          unsubBuffer()
          unsubTrack()
          return
        }

        onControllerReady?.(controller)

        if (autoPlay) {
          await controller.play()
          setPlaybackState((prev) => ({ ...prev, isPlaying: true }))
        }
      } catch (err) {
        if (!isDisposed) {
          onError?.(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }

    setupPlayer()

    return () => {
      isDisposed = true
      unsubTime?.()
      unsubBuffer?.()
      unsubTrack?.()
      if (controllerRef.current) {
        controllerRef.current.destroy().catch(() => undefined)
        controllerRef.current = null
      }
    }
  }, [source, client, engine, autoPlay])

  // Play / Pause toggle
  const handlePlayPause = useCallback(async () => {
    const controller = controllerRef.current
    if (!controller) return

    if (playbackState.isPlaying) {
      controller.pause()
      setPlaybackState((prev) => ({ ...prev, isPlaying: false }))
      setControlsState((prev) => ({ ...prev, isVisible: true }))
      triggerFeedback('play_pause', 'Paused')
    } else {
      await controller.play()
      setPlaybackState((prev) => ({ ...prev, isPlaying: true }))
      scheduleControlsHide()
      triggerFeedback('play_pause', 'Playing')
    }
  }, [playbackState.isPlaying, scheduleControlsHide, triggerFeedback])

  // Seeking
  const handleSeek = useCallback(async (targetSeconds: number) => {
    const controller = controllerRef.current
    if (!controller) return

    const clampedTime = Math.max(0, Math.min(targetSeconds, playbackState.duration))
    await controller.seek(clampedTime)
  }, [playbackState.duration])

  let tapCount = useRef(1)

  // Double tap backward (-10s)
  const handleDoubleTapSeekBackward = useCallback(() => {
    const newTime = Math.max(0, playbackState.currentTime - 10)
    handleSeek(newTime)
    triggerFeedback('backward', `-${(tapCount.current - 1) * -10}s`)
  }, [playbackState.currentTime, handleSeek, triggerFeedback])

  // Double tap forward (+10s)
  const handleDoubleTapSeekForward = useCallback(() => {
    const newTime = Math.min(playbackState.duration, playbackState.currentTime + 10)
    handleSeek(newTime)
    triggerFeedback('forward', `+${(tapCount.current - 1) * 10}s`)
  }, [playbackState.currentTime, playbackState.duration, handleSeek, triggerFeedback])

  // Single tap toggles controls visibility
  const handleSingleTap = useCallback(() => {
    setControlsState((prev) => {
      const nextVisible = !prev.isVisible
      if (nextVisible) scheduleControlsHide()
      return { ...prev, isVisible: nextVisible }
    })
  }, [scheduleControlsHide])

  useEffect(() => {
    return () => {
      clearTimeout(hideTimerRef.current || undefined)
      clearTimeout(triggerTimerRef.current || undefined)
    }
  }, [])

  // Track selection
  const handleSelectTrack = useCallback(async (kind: TrackKind, trackId?: string) => {
    const controller = controllerRef.current
    if (!controller) return

    await controller.selectTrack(kind, trackId)

    setTracksState((prev) => ({
      ...prev,
      ...(kind === 'subtitle' && { selectedSubtitleId: trackId }),
      ...(kind === 'audio' && { selectedAudioId: trackId }),
      ...(kind === 'video' && { selectedVideoId: trackId }),
    }))
    setControlsState((prev) => ({ ...prev, showTrackModal: false }))
  }, [])

  return (
    <div
      ref={containerRef}
      className={`bg-black flex items-center relative w-screen h-screen justify-center overflow-hidden select-none font-sans ${className}`}
    >

      {/* Video Anchor element for native or HTML rendering */}
      <video
        ref={videoRef}
        playsInline
        className="w-full h-full max-h-[calc(100vh-(env(safe-area-inset-top)+env(safe-area-inset-bottom)))] max-w-[calc(100vw-(env(safe-area-inset-right)+env(safe-area-inset-left)))] object-contain pointer-events-none"
        onPlay={() => setPlaybackState(st => ({ ...st, isPlaying: true, isBuffering: false }))}
        onPause={() => setPlaybackState(st => ({ ...st, isPlaying: false }))}
        onWaiting={()=> setPlaybackState(st => ({...st, isBuffering: true})) }
        onStalled={() => setPlaybackState(st => ({ ...st, isBuffering: true }))}
        onCanPlay={()=> setPlaybackState(st => ({...st, isBuffering: false}))}
      />

      {Boolean(gestureFeedback) && (
        <>
          <div
            key={gestureFeedback?.id}
            data-air-video-controls
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 aspect-square flex flex-col items-center justify-center px-4 bg-background/80 text-foreground rounded-full border border-border shadow-xl animate-in zoom-in-75 fade-in duration-200"
          >
            {gestureFeedback?.type === 'backward' && <RotateCcw className="w-8 h-8 text-primary" />}
            {gestureFeedback?.type === 'forward' && <RotateCw className="w-8 h-8 text-primary" />}
            {gestureFeedback?.type === 'play_pause' && (
              gestureFeedback?.label.includes('Play') ? (
                <Play className="w-8 h-8 text-primary fill-primary" />
              ) : (
                <Pause className="w-8 h-8 text-primary fill-primary" />
              )
            )}
            <span className="text-xs font-semibold mt-1 text-primary">{gestureFeedback?.label}</span>
          </div>
        </>
      )}


      {/* Main Controls Overlay */}
      <PlayerControlsOverlay
        title={title}
        playbackState={playbackState}
        controlsState={controlsState}
        onPlayPauseToggle={handlePlayPause}
        onSeek={handleSeek}
        onOpenTrackModal={() =>
          setControlsState((prev) => ({ ...prev, showTrackModal: true }))
        }
        onDoubleTapSeekBackward={handleDoubleTapSeekBackward}
        onDoubleTapSeekForward={handleDoubleTapSeekForward}
      >
        {/* Touch Gesture Layer */}
        <PlayerGestureOverlay
          onSingleTap={handleSingleTap}
          onDoubleTapSeekBackward={handleDoubleTapSeekBackward}
          onDoubleTapSeekForward={handleDoubleTapSeekForward}
          onDoubleTapPlayPause={handlePlayPause}
          tapCount={tapCount}
        />
      </PlayerControlsOverlay>

      {/* Modal Track Selection Overlay */}
      <TrackSelectionModal
        controlsState={controlsState}
        tracksState={tracksState}
        onSelectTrack={handleSelectTrack}
        onClose={() => setControlsState((prev) => ({ ...prev, showTrackModal: false }))}
        onTabChange={(tab) =>
          setControlsState((prev) => ({ ...prev, activeModalTab: tab }))
        }
      />
    </div>
  )
}
