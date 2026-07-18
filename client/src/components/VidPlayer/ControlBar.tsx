import { useState } from 'react';
import {
  Play, Pause, Square, SkipBack, SkipForward,
  List, Settings, Repeat, Repeat1, Shuffle, Maximize, History,
} from 'lucide-react';
import { RepeatMode } from './types';
import { VolumeControl } from './VolumeControl';
import { formatTime } from './helpers';

export interface ControlBarProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  volume: number;
  isMuted: boolean;
  onChangeVolume: (v: number) => void;
  onToggleMute: () => void;
  currentTime: number;
  duration: number;
  onTogglePlaylist: () => void;
  showExtendedControls: boolean;
  onToggleExtendedControls: () => void;
  onFrameStep: () => void;
  onToggleRecord: () => void;
  isRecording: boolean;
  repeatMode: RepeatMode;
  onToggleRepeat: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  onToggleFullscreen: () => void;
  abRepeat: { a: number | null; b: number | null };
  onToggleABRepeat: () => void;
  playbackRate: number;
  onSpeedChange: (s: number) => void;
}

const SPEEDS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 1.67, 2, 2.5, 3, 4];

export function ControlBar(props: ControlBarProps) {
  const [showRemaining, setShowRemaining] = useState(false);

  const btn = "p-1.5 hover:bg-[#3A3A3A] rounded text-[#E0E0E0] transition-colors";
  const active = "p-1.5 rounded text-[#FF8800] bg-[#3A3A3A]";

  const timeDisplay = showRemaining
    ? `-${formatTime(props.duration - props.currentTime)}`
    : formatTime(props.currentTime);

  const abLabel =
    props.abRepeat.a === null ? 'A-B'
    : props.abRepeat.b === null ? `A=${formatTime(props.abRepeat.a)}`
    : `${formatTime(props.abRepeat.a)}–${formatTime(props.abRepeat.b)}`;

  return (
    <div className="flex flex-col bg-[#242424] border-t border-[#404040] px-2 py-1.5 shrink-0">
      <div className="flex items-center justify-between gap-2">

        {/* Left controls */}
        <div className="flex items-center gap-0.5">
          <button className={btn} onClick={props.onPlayPause} title="Play/Pause (Space)">
            {props.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
          <button className={btn} onClick={props.onPrevious} title="Previous (P)">
            <SkipBack className="w-4 h-4 fill-current" />
          </button>
          <button className={btn} onClick={props.onStop} title="Stop (S)">
            <Square className="w-4 h-4 fill-current" />
          </button>
          <button className={btn} onClick={props.onNext} title="Next (N)">
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
          <div className="w-px h-5 bg-[#404040] mx-1" />
          <VolumeControl
            volume={props.volume}
            isMuted={props.isMuted}
            onChangeVolume={props.onChangeVolume}
            onToggleMute={props.onToggleMute}
          />
        </div>

        {/* Center: time */}
        <div className="flex items-center gap-1 text-sm font-mono text-[#E0E0E0] select-none shrink-0">
          <span
            className="cursor-pointer hover:text-[#FF8800] w-16 text-right tabular-nums"
            onClick={() => setShowRemaining(r => !r)}
            title="Click to toggle remaining"
          >
            {timeDisplay}
          </span>
          <span className="text-[#909090]">/</span>
          <span className="w-16 tabular-nums">{formatTime(props.duration)}</span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-0.5">
          <button className={btn} onClick={props.onTogglePlaylist} title="Toggle Playlist"><List className="w-4 h-4" /></button>
          <button className={props.showExtendedControls ? active : btn} onClick={props.onToggleExtendedControls} title="Extended Controls">
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-[#404040] mx-0.5" />
          <button className={btn} onClick={props.onFrameStep} title="Frame Step (E)"><History className="w-4 h-4" /></button>
          <button
            className={`p-1.5 rounded transition-colors ${props.isRecording ? 'text-red-400 bg-red-500/10' : 'hover:bg-[#3A3A3A] text-[#E0E0E0]'}`}
            onClick={props.onToggleRecord}
            title="Record"
          >
            <div className={`w-3 h-3 rounded-full border-2 ${props.isRecording ? 'bg-red-500 border-red-400' : 'border-current'}`} />
          </button>
          <button className={props.repeatMode !== 'none' ? active : btn} onClick={props.onToggleRepeat} title="Loop (L)">
            {props.repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
          <button className={props.isShuffle ? active : btn} onClick={props.onToggleShuffle} title="Shuffle (R)">
            <Shuffle className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-[#404040] mx-0.5" />
          <button className={btn} onClick={props.onToggleFullscreen} title="Fullscreen (F)"><Maximize className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Extended controls */}
      {props.showExtendedControls && (
        <div className="flex items-center gap-4 mt-1.5 pt-1.5 border-t border-[#404040] text-xs text-[#909090]">
          <div className="flex items-center gap-2">
            <span>A-B:</span>
            <button
              onClick={props.onToggleABRepeat}
              className={`px-2 py-0.5 border text-xs rounded transition-colors ${
                props.abRepeat.a !== null ? 'border-[#FF8800] text-[#FF8800]' : 'border-[#404040] hover:border-[#909090]'
              }`}
              title="Set A/B repeat points"
            >
              {abLabel}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span>Speed:</span>
            <select
              value={props.playbackRate}
              onChange={e => props.onSpeedChange(parseFloat(e.target.value))}
              className="bg-[#1C1C1C] border border-[#404040] text-[#E0E0E0] text-xs px-1 py-0.5 rounded"
            >
              {SPEEDS.map(s => <option key={s} value={s}>{s === 1 ? 'Normal' : `${s}x`}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
