export interface PlaylistItem {
  id: string;
  file?: File;
  url?: string;
  title: string;
  duration?: number;
}

export type RepeatMode = 'none' | 'one' | 'all';
export type AspectRatio = 'default' | '1:1' | '4:3' | '16:9' | '16:10' | '2.21:1' | '5:4';
export type ZoomLevel = 0 | 0.25 | 0.5 | 1 | 2;

export interface PlayerPreferences {
  showStatusBar: boolean;
  showPlaylistOnStart: boolean;
  defaultVolume: number;
  continuePlayback: 'ask' | 'always' | 'never';
  defaultAspectRatio: AspectRatio;
  defaultSpeed: number;
}
