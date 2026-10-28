import React, { JSX } from "react";
import { Play, Pause, Settings2 } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import type { ControlsState, PlaybackState } from "./types";
import { FaArrowLeft, FaFastBackward, FaFastForward } from "react-icons/fa";

interface PlayerControlsOverlayProps {
  title?: string;
  playbackState: PlaybackState;
  controlsState: ControlsState;
  children: JSX.Element;
  onPlayPauseToggle: () => void;
  onSeek: (seconds: number) => void;
  onOpenTrackModal: () => void;
  onDoubleTapSeekBackward: () => void;
  onDoubleTapSeekForward: () => void;
}

export const PlayerControlsOverlay: React.FC<PlayerControlsOverlayProps> = ({
  title,
  playbackState,
  controlsState,
  onPlayPauseToggle,
  onSeek,
  onOpenTrackModal,
  onDoubleTapSeekBackward,
  onDoubleTapSeekForward,
  children,
}) => {
  const isVisible = controlsState.isVisible;

  return (
    <div
      data-air-video-controls
      className={`absolute inset-0 z-30 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] pointer-events-none flex flex-col transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Top Bar Gradient & Controls */}
      {isVisible && (
        <div className="pointer-events-auto pt-[env(safe-area-inset-top)] p-4 gap-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-start">
          <button
            onClick={() => window.history.back()}
            className="text-foreground text-md"
            aria-label="Go back"
          >
            <FaArrowLeft className="h-4 w-4 transition-transform duration-200 ease-in-out group-hover:-translate-x-0.5" />
          </button>
          <h1 className="text-base font-medium text-white line-clamp-1 pr-2 drop-shadow">
            {title || "Playing Video"}
          </h1>
        </div>
      )}

      {children}

      {/* Bottom Bar: Progress Bar */}
      {isVisible && (
        <div className="pointer-events-auto p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
          <ProgressBar
            currentTime={playbackState.currentTime}
            duration={playbackState.duration}
            bufferedAhead={playbackState.bufferedAhead}
            onSeek={onSeek}
          />
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={onOpenTrackModal}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-transform"
              aria-label="Track settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <div className="flex gap-3 items-center justify-center">
              <button onClick={onDoubleTapSeekBackward}>
                <FaFastBackward />
              </button>
              <button
                className="rounded-full p-3 bg-primary"
                onClick={onPlayPauseToggle}
              >
                {playbackState.isPlaying ? <Pause /> : <Play />}
              </button>
              <button onClick={onDoubleTapSeekForward}>
                <FaFastForward />
              </button>
            </div>
            <button
              type="button"
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-transform"
              aria-label="Toggle Fullscreen"
            ></button>
          </div>
        </div>
      )}
    </div>
  );
};
