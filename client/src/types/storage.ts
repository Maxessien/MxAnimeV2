export interface WatchHistory {
  malId: string;
  episode: string | number;
  lastWatch: number;
  watchTimeSec: number;
  duration: number
}

export interface Saved {
  mal_id: number;
  title: string;
  image: string | null;
}
