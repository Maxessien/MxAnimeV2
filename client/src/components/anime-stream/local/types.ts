import type { MediaTrack, VideoController, VideoSource } from "@get-air/video";
import type { NativeVideoBackend, VideoClient } from "@get-air/video-tauri";

export interface PlaybackState {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  bufferedAhead: number;
}

export interface ControlsState {
  isVisible: boolean;
  showTrackModal: boolean;
  activeModalTab: "subtitle" | "audio" | "video";
}

export type GestureFeedbackType = "forward" | "backward" | "play_pause";

export interface GestureFeedbackState {
  id: number;
  type: GestureFeedbackType;
  label: string;
  x: number;
  y: number;
}

export interface TracksState {
  tracks: MediaTrack[];
  selectedSubtitleId?: string;
  selectedAudioId?: string;
  selectedVideoId?: string;
}

export interface ScreenState {
  isLandscape: boolean;
}

export interface VideoPlayerProps {
  source: string | VideoSource;
  updateWatchHistory: (time: number, duration: number)=> void
  startTimeSec?: number;
  title?: string;
  client?: VideoClient;
  engine?: NativeVideoBackend;
  autoPlay?: boolean;
  className?: string;
  onControllerReady?: (controller: VideoController) => void;
  onError?: (error: Error) => void;
}
