import { AnitomyResult } from "anitomy";

export interface TorrentioResponse {
  streams: TorrentioStream[];
}

export interface TorrentioStream {
  name?: string;
  title?: string;
  description?: string;
  url?: string;
  ytId?: string;
  infoHash?: string;
  fileIdx?: number;
  externalUrl?: string;
  subtitles?: Subtitle[];
  sources?: string[];
  behaviorHints?: TorrentioBehaviorHints;
}

export interface ParsedTorrentioStream extends TorrentioStream {
  info: AnitomyResult | null | undefined;
  magUri: string | null;
}

export interface TorrentioBehaviorHints {
  countryWhitelist?: string[];
  notWebReady?: boolean;
  bingeGroup?: string;
  group?: string;
  proxyHeaders?: {
    request?: Record<string, string>;
    response?: Record<string, string>;
  };
  videoHash?: string;
  videoSize?: number;
  filename?: string;
}

export interface Subtitle {
  id: string;
  url: string;
  lang: string;
}

export interface SeedrTransfer {
  id: number;
  hash: string;
  node_id: string;
  stopped: number; // Can also use 0 | 1 if it is strictly binary
  folder_created_id: number;
  folder_id: number;
  last_update: string; // ISO / UTC Date string format
  unwanted: string;
  space_max: number;
  space_used: number;
  space_scope: string;
  name: string;
  type: 'torrent' | string; // Strongly types 'torrent' while leaving room for alternatives
  progress: number;
  speed: number;
  size: number;
  progress_url: string;
  parent: number;
  timestamp: string; // ISO / UTC Date string format
}
