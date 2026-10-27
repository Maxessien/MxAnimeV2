import React, { useRef } from 'react'
import { RotateCcw, RotateCw, Play, Pause } from 'lucide-react'
import type { GestureFeedbackState } from './types'

interface PlayerGestureOverlayProps {
  feedback: GestureFeedbackState | null
  onSingleTap: () => void
  onDoubleTapSeekBackward: () => void
  onDoubleTapSeekForward: () => void
  onDoubleTapPlayPause: () => void
}

export const PlayerGestureOverlay: React.FC<PlayerGestureOverlayProps> = ({
  feedback,
  onSingleTap,
  onDoubleTapSeekBackward,
  onDoubleTapSeekForward,
  onDoubleTapPlayPause,
}) => {
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null)
  const singleTapTimerRef = useRef<number | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const touch = e
    const currentTime = Date.now()
    const rect = e.currentTarget.getBoundingClientRect()
    const tapX = touch.clientX - rect.left
    const width = rect.width

    const lastTap = lastTapRef.current

    // Double-tap threshold: < 300ms and within 50px
    if (
      lastTap &&
      currentTime - lastTap.time < 500 &&
      Math.abs(touch.clientX - lastTap.x) < 50 &&
      Math.abs(touch.clientY - lastTap.y) < 50
    ) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current)
        singleTapTimerRef.current = null
      }
      lastTapRef.current = null

      const relativeXRatio = tapX / width
      if (relativeXRatio < 0.35) {
        onDoubleTapSeekBackward()
      } else if (relativeXRatio > 0.65) {
        onDoubleTapSeekForward()
      } else {
        onDoubleTapPlayPause()
      }
      return
    }

    lastTapRef.current = { time: currentTime, x: touch.clientX, y: touch.clientY }

    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current)
    }

    singleTapTimerRef.current = window.setTimeout(() => {
      onSingleTap()
      singleTapTimerRef.current = null
    }, 280)
  }

  return (
    <div
      onClick={handleClick}
      className="flex pointer-events-auto flex-1 items-center justify-center select-none"
    >
    </div>
  )
}
