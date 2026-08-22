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

export interface PikPakMediaLink {
  url: string;
  token: string;
  expire: string; // ISO Date String
  type: string;
  fallbacks: any[];
  mirrors: any[];
}

export interface PikPakResponse {
  info: PikPakMediaLink[];
  status: string;
}

export interface PikPakTaskParams {
  predict_speed: string;
  predict_type: string;
}

export interface PikPakTaskResponse {
  callback: string;
  created_time: string; // ISO 8601 Date String
  file_id: string;
  file_name: string;
  file_size: string; // Kept as string to match payload type
  icon_link: string;
  id: string;
  kind: string;
  message: string;
  name: string;
  params: PikPakTaskParams;
  phase: 'PHASE_TYPE_RUNNING' | 'PHASE_TYPE_COMPLETE' | 'PHASE_TYPE_ERROR' | string; // Strong typed phase
  progress: number;
  space: string;
  status_size: number;
  statuses: any[]; // Adjust type if statuses items contain specific structural properties
  third_task_id: string;
  type: string;
  updated_time: string; // ISO 8601 Date String
  user_id: string;
}
