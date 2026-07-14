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
