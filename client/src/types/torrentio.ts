/**
 * Standard resolution identifiers.
 */
export type AnimeResolution =
  | '4320p' // 8K
  | '2160p' // 4K
  | '1080p' // Full HD
  | '720p'  // HD
  | '480p'  // SD
  | '360p'
  | 'Unknown';

/**
 * Common media source types.
 */
export type MediaSource =
  | 'BluRay'
  | 'BDRip'
  | 'BRRip'
  | 'WEB-DL'
  | 'WEBRip'
  | 'HDTV'
  | 'DVDRip'
  | 'CAM'
  | 'TeleSync'
  | 'SCR'
  | 'Other';

/**
 * Torrentio's raw behavior hints object in streams.
 */
export interface TorrentioStreamBehaviorHints {
  bingeGroup?: string;
  filename?: string;
  proxyHeaders?: Record<string, string>;
  notWebReady?: boolean;
  [key: string]: unknown;
}

/**
 * Raw stream object directly from Torrentio JSON.
 */
export interface TorrentioRawStream {
  name?: string;
  title?: string;
  infoHash?: string;
  fileIdx?: number;
  sources?: string[];
  url?: string;
  behaviorHints?: TorrentioStreamBehaviorHints;
  subtitles?: Array<{ id: string | number; lang: string; url: string }>;
  [key: string]: unknown;
}

/**
 * Top-level structure of a Torrentio / Stremio stream API response.
 */
export interface TorrentioApiResponse {
  streams?: TorrentioRawStream[];
  error?: string;
  [key: string]: unknown;
}

/**
 * Extracted file size representations.
 */
export interface ParsedFileSize {
  /** Size converted to total bytes */
  bytes: number;
  /** Normalized display string (e.g. "1.42 GB") */
  formatted: string;
  /** Raw numeric value extracted (e.g. 1.42) */
  value: number;
  /** Normalized unit (e.g. "GB", "MB") */
  unit: 'B' | 'KB' | 'MB' | 'GB' | 'TB';
}

/**
 * Extracted video and audio quality information.
 */
export interface ParsedQuality {
  /** Standardized resolution string (e.g. "1080p", "2160p") */
  resolution: AnimeResolution;
  /** Raw quality descriptor string from the stream header */
  raw: string;
  /** Media source classification (BluRay, WEB-DL, etc.) */
  source: MediaSource | null;
  /** Detected video codec (e.g. "HEVC", "x265", "x264", "AV1") */
  codec: string | null;
  /** Color bit depth (e.g. "10-bit", "8-bit") */
  bitDepth: string | null;
  /** Detected High Dynamic Range profiles (e.g. ["HDR", "DV"]) */
  hdr: string[];
  /** Whether the stream is identified as a Remux */
  isRemux: boolean;
}

/**
 * Specialized anime release metadata parsed from filenames and titles.
 */
export interface ParsedAnimeMetadata {
  /** Release group name if detected in brackets, e.g. "SubsPlease", "Erai-raws" */
  group: string | null;
  /** Episode number if detected, e.g. 28 */
  episode: number | null;
  /** 8-character hexadecimal CRC32 hash (e.g. "E9D320BA") */
  crc32: string | null;
  /** Title with release group tags, quality brackets, and hashes removed */
  cleanTitle: string;
}

/**
 * Fully parsed and normalized anime stream output.
 */
export interface ParsedAnimeStream {
  /** Full release title (usually first line of stream.title) */
  releaseTitle: string;
  /** Normalized episode / file name */
  filename: string | null;
  /** Parsed file size details */
  filesize: ParsedFileSize | null;
  /** Fully constructed BitTorrent magnet URI (null if unresolvable debrid link) */
  magnetUri: string | null;
  /** Cleaned lowercase 40-character infohash (or 32-char Base32) */
  infoHash: string | null;
  /** 0-based file index within the torrent */
  fileIndex: number | null;
  /** Comprehensive quality and format metadata */
  quality: ParsedQuality;
  /** Anime-specific metadata tags */
  anime: ParsedAnimeMetadata;
  /** Number of active seeders (null for cached debrid streams) */
  seeders: number | null;
  /** Origin indexer / tracker name (e.g. "NyaaSi", "AniDex", "TokyoTosho") */
  provider: string | null;
  /** Audio / subtitle language tags */
  languages: string[];
  /** Whether the stream is served via a Debrid caching provider */
  isDebrid: boolean;
  /** Detected debrid provider short code or name (e.g. "RD", "AD", "TB") */
  debridService: string | null;
  /** Direct HTTP/HTTPS playback or download URL (for debrid streams) */
  debridUrl: string | null;
  /** Original raw Torrentio stream object */
  raw: TorrentioRawStream;
}

/**
 * Configurable parser options.
 */
export interface ParseOptions {
  /**
   * Additional or custom tracker announce URLs to include in constructed magnet URIs.
   */
  customTrackers?: string[];
  /**
   * Whether to include standard public anime trackers if the stream doesn't list any.
   * Defaults to true.
   */
  includeFallbackTrackers?: boolean;
  /**
   * Whether to attempt extracting infoHash from Debrid resolver URLs if absent on the root stream.
   * Defaults to true.
   */
  extractInfoHashFromDebridUrl?: boolean;
}
