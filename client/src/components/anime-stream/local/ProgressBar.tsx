import React, { useRef, useState, useCallback } from 'react'

interface ProgressBarProps {
  currentTime: number
  duration: number
  bufferedAhead: number
  onSeek: (targetTime: number) => void
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const hours = Math.floor(mins / 60)

  if (hours > 0) {
    const remMins = mins % 60
    return `${hours}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  bufferedAhead,
  onSeek,
}) => {
  const barRef = useRef<HTMLDivElement>(null)
  const [touchScrubTime, setTouchScrubTime] = useState<number | null>(null)

  const effectiveDuration = duration > 0 ? duration : 1
  const displayTime = touchScrubTime ?? currentTime
  const currentPercent = Math.min(100, Math.max(0, (displayTime / effectiveDuration) * 100))
  const bufferPercent = Math.min(100, Math.max(0, ((currentTime + bufferedAhead) / effectiveDuration) * 100))

  const calculateTimeFromTouch = useCallback(
    (clientX: number): number => {
      if (!barRef.current) return 0
      const rect = barRef.current.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      return ratio * duration
    },
    [duration]
  )

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const touch = e.touches[0]
    const seekTime = calculateTimeFromTouch(touch.clientX)
    setTouchScrubTime(seekTime)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const touch = e.touches[0]
    const seekTime = calculateTimeFromTouch(touch.clientX)
    setTouchScrubTime(seekTime)
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (touchScrubTime !== null) {
      onSeek(touchScrubTime)
      setTouchScrubTime(null)
    }
  }

  return (
    <div className="w-full flex items-center gap-3 select-none">
      <span className="text-xs font-mono text-foreground/80 min-w-10 text-right">
        {formatTime(displayTime)}
      </span>

      <div
        ref={barRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative flex-1 h-8 flex items-center cursor-pointer touch-none"
      >
        {/* Background track */}
        <div className="w-full h-1.5 rounded-full bg-muted/60 relative overflow-hidden">
          {/* Buffer track */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-muted-foreground/30 transition-all duration-300 rounded-full"
            style={{ width: `${bufferPercent}%` }}
          />
          {/* Played track */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-primary rounded-full"
            style={{ width: `${currentPercent}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className={`absolute w-3.5 h-3.5 -ml-1.5 rounded-full bg-primary ring-2 ring-primary-foreground shadow transition-transform ${
            touchScrubTime !== null ? 'scale-125' : 'scale-100'
          }`}
          style={{ left: `${currentPercent}%` }}
        />
      </div>

      <span className="text-xs font-mono text-muted-foreground min-w-10">
        {formatTime(duration)}
      </span>
    </div>
  )
}
