import { ZoomLevel } from './types';

interface StatusBarProps {
  statusText: string;
  zoomLevel: ZoomLevel;
  speed: number;
}

export function StatusBar({ statusText, zoomLevel, speed }: StatusBarProps) {
  return (
    <div className="h-5 bg-[#181818] border-t border-black flex items-center justify-between px-2 text-xs text-[#909090] select-none shrink-0">
      <div className="flex-1 truncate pr-4">{statusText}</div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-px h-3 bg-[#404040]" />
        <span>{zoomLevel === 0 ? 'Fit' : `${zoomLevel * 100}%`}</span>
        <div className="w-px h-3 bg-[#404040]" />
        <span>{speed}x</span>
      </div>
    </div>
  );
}
