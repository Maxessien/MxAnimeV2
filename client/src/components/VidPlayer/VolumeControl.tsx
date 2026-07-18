import { Volume2, VolumeX } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onChangeVolume: (v: number) => void;
  onToggleMute: () => void;
}

export function VolumeControl({ volume, isMuted, onChangeVolume, onToggleMute }: VolumeControlProps) {
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    onChangeVolume(e.deltaY < 0 ? Math.min(2, volume + 0.05) : Math.max(0, volume - 0.05));
  };

  return (
    <div className="flex items-center gap-1.5" onWheel={handleWheel}>
      <button
        className="p-1.5 hover:bg-[#3A3A3A] rounded text-[#E0E0E0] hover:text-[#FF8800] transition-colors"
        onClick={onToggleMute}
        title="Mute (M)"
      >
        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      <input
        type="range" min="0" max="2" step="0.01"
        value={isMuted ? 0 : volume}
        onChange={e => onChangeVolume(parseFloat(e.target.value))}
        className="w-24 h-1 cursor-pointer accent-[#FF8800]"
        title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
      />
      <span className="text-xs text-[#909090] w-10 tabular-nums">
        {Math.round((isMuted ? 0 : volume) * 100)}%
      </span>
    </div>
  );
}
