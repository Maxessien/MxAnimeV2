import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onToggleFullscreen: () => void;
  onShowMediaInfo: () => void;
}

export function ContextMenu({ x, y, onClose, isPlaying, onPlayPause, onStop, onToggleFullscreen, onShowMediaInfo }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => {
      document.addEventListener('click', close);
      document.addEventListener('contextmenu', close);
    }, 0);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('contextmenu', close);
    };
  }, [onClose]);

  const safeX = Math.min(x, window.innerWidth - 210);
  const safeY = Math.min(y, window.innerHeight - 250);

  const Item = ({ label, onClick, disabled = false }: { label: string; onClick?: () => void; disabled?: boolean }) => (
    <div
      onClick={() => { if (!disabled && onClick) { onClick(); onClose(); } }}
      className={`px-4 py-1.5 text-xs ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#FF8800] hover:text-white cursor-default'}`}
    >
      {label}
    </div>
  );

  const Sep = () => <div className="h-px bg-[#404040] my-1 mx-1" />;

  return (
    <div
      ref={ref}
      className="fixed z-100 bg-[#242424] border border-[#404040] shadow-2xl py-1 text-[#E0E0E0] min-w-50"
      style={{ top: safeY, left: safeX }}
      onContextMenu={e => e.preventDefault()}
    >
      <Item label={isPlaying ? 'Pause' : 'Play'} onClick={onPlayPause} />
      <Item label="Stop" onClick={onStop} />
      <Sep />
      <Item label="Fullscreen" onClick={onToggleFullscreen} />
      <Sep />
      <Item label="Media Information" onClick={onShowMediaInfo} />
    </div>
  );
}
