import { useRef, useState } from 'react';
import { formatTime } from './helpers';

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
}

export function SeekBar({ currentTime, duration, onSeek }: SeekBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState(0);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const timeAt = (e: React.PointerEvent) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (duration <= 0) return;
    onSeek(timeAt(e));
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
    setHoverPos(e.clientX - rect.left);
    if (isDragging) onSeek(timeAt(e));
  };

  const onUp = (e: React.PointerEvent) => {
    if (isDragging) { setIsDragging(false); (e.target as HTMLElement).releasePointerCapture(e.pointerId); }
  };

  return (
    <div className="w-full bg-[#242424] pt-1 pb-2 px-3 relative select-none">
      <div
        ref={containerRef}
        className="w-full h-2 bg-[#404040] rounded hover:h-3 transition-[height] relative cursor-pointer overflow-hidden group"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={() => setHoverTime(null)}
        onPointerCancel={onUp}
      >
        <div className="absolute inset-0 bg-[#505050] opacity-50" />
        <div className="absolute top-0 left-0 h-full bg-[#FF8800]" style={{ width: `${pct}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      {hoverTime !== null && (
        <div
          className="absolute bottom-5 bg-[#2E2E2E] border border-[#404040] text-xs px-2 py-0.5 pointer-events-none -translate-x-1/2 z-50 text-white font-mono"
          style={{ left: `${hoverPos + 12}px` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
}
