import { AnimeResolution, MediaSource, ParsedAnimeMetadata, ParsedAnimeStream, ParsedFileSize, ParsedQuality, ParseOptions, TorrentioApiResponse, TorrentioRawStream } from "@/types/torrentio";
import { DEFAULT_ANIME_TRACKERS, getIdSForTorrentio, UNIT_MULTIPLIERS } from "./utils";
import axios from "axios";


/**
 * Fetches anime torrents from torrentio
 *
 * @param malId MyAnimelist ID for anime entry
 * @param episode Episode number for torrentio to retreive
 * @param season Optional season number of anime entry
 */
export async function getTorrentioTorrents(malId: string | number, episode: number, season?: number) {
  let torrentioUrl = "https://torrentio.strem.fun/sort=qualitysize|qualityfilter=unknown|sizefilter=1.7GB/stream/series/"

  const {kitsu, imdb} = await getIdSForTorrentio(malId)

  if (kitsu) torrentioUrl += `/anime/kitsu:${episode}.json`
  else if (imdb && season) torrentioUrl += `/series/${imdb}:${season}:${episode}`
  else return null

  return (await axios.get(torrentioUrl)).data
}

/**
 * Parses a raw Torrentio anime API response into a typed, highly detailed array
 * of stream objects.
 *
 * @param response Raw API response object or JSON string from Torrentio
 * @param options  Optional parsing configuration
 * @returns Array of parsed anime streams
 */
export function parseTorrentioAnimeResponse(
  response: unknown,
  options: ParseOptions = {}
): ParsedAnimeStream[] {
  if (!response) {
    return [];
  }

  let payload: unknown = response;
  if (typeof response === 'string') {
    try {
      payload = JSON.parse(response);
    } catch {
      return [];
    }
  }

  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const rawStreams = (payload as TorrentioApiResponse).streams;
  if (!Array.isArray(rawStreams)) {
    return [];
  }

  const parsedList: ParsedAnimeStream[] = [];
  for (const rawStream of rawStreams) {
    if (typeof rawStream === 'object' && rawStream !== null) {
      const parsed = parseTorrentioStream(rawStream as TorrentioRawStream, options);
      if (parsed) {
        parsedList.push(parsed);
      }
    }
  }

  return parsedList;
}

/**
 * Parses a single raw Torrentio stream item.
 *
 * @param stream  Raw Torrentio stream object
 * @param options Optional parser settings
 * @returns ParsedAnimeStream or null if invalid
 */
export function parseTorrentioStream(
  stream: TorrentioRawStream,
  options: ParseOptions = {}
): ParsedAnimeStream | null {
  if (!stream || typeof stream !== 'object') {
    return null;
  }

  const titleStr = typeof stream.title === 'string' ? stream.title : '';
  const nameStr = typeof stream.name === 'string' ? stream.name : '';

  // 1. Title Lines & Release Title
  const titleLines = titleStr.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const releaseTitle = extractReleaseTitle(titleLines, stream.behaviorHints?.filename);

  // 2. InfoHash & Debrid Status
  const { isDebrid, debridService } = detectDebrid(nameStr);
  const infoHash = resolveInfoHash(stream, options);

  // 3. File Size
  const filesize = extractFileSize(titleStr);

  // 4. Quality Parsing
  const quality = extractQuality(nameStr, titleStr);

  // 5. Magnet URI
  const magnetUri = buildMagnetUri(stream, releaseTitle, infoHash, options);

  // 6. Seeders & Provider
  const seeders = extractSeeders(titleStr);
  const provider = extractProvider(titleStr);

  // 7. Anime Details (Release group, CRC, Episode)
  const anime = extractAnimeMetadata(releaseTitle);

  // 8. Languages & Audio
  const languages = extractLanguages(titleStr);

  return {
    releaseTitle,
    filename: stream.behaviorHints?.filename || (releaseTitle.endsWith('.mkv') || releaseTitle.endsWith('.mp4') ? releaseTitle : null),
    filesize,
    magnetUri,
    infoHash,
    fileIndex: typeof stream.fileIdx === 'number' ? stream.fileIdx : null,
    quality,
    anime,
    seeders,
    provider,
    languages,
    isDebrid,
    debridService,
    debridUrl: typeof stream.url === 'string' ? stream.url : null,
    raw: stream,
  };
}

/* ============================================================================
 * 4. MODULAR EXTRACTION SUB-FUNCTIONS
 * ============================================================================ */

/**
 * Extracts and calculates the file size in exact bytes and human-readable formatting.
 *
 * Torrentio outputs file sizes in stream.title with the disk icon:
 * e.g. "👤 142 💾 1.42 GB ⚙️ NyaaSi" or "💾 850 MB ⚙️ AniDex"
 */
export function extractFileSize(text: string): ParsedFileSize | null {
  if (!text) return null;

  // Primary pattern: Look for 💾 followed by number and unit
  const emojiPattern = /💾\s*([\d,.]+)\s*([a-zA-Z]+)/;
  const match = text.match(emojiPattern);

  if (match) {
    return parseSizeValue(match[1], match[2]);
  }

  // Fallback pattern: Look for isolated size patterns e.g. "1.42 GB" or "[850MB]"
  const fallbackPattern = /\b([\d,.]+)\s*(TB|TIB|GB|GIB|MB|MIB|KB|KIB|kB|B)\b/i;
  const fallbackMatch = text.match(fallbackPattern);

  if (fallbackMatch) {
    return parseSizeValue(fallbackMatch[1], fallbackMatch[2]);
  }

  return null;
}

function parseSizeValue(numStr: string, unitStr: string): ParsedFileSize | null {
  const cleanNum = parseFloat(numStr.replace(/,/g, ''));
  if (isNaN(cleanNum) || cleanNum < 0) {
    return null;
  }

  const normalizedUnitKey = unitStr.toUpperCase();
  const multiplier = UNIT_MULTIPLIERS[normalizedUnitKey];

  if (!multiplier) {
    return null;
  }

  const bytes = Math.round(cleanNum * multiplier);

  // Normalize unit display to standard representation
  let displayUnit: 'B' | 'KB' | 'MB' | 'GB' | 'TB' = 'B';
  if (normalizedUnitKey.startsWith('T')) displayUnit = 'TB';
  else if (normalizedUnitKey.startsWith('G')) displayUnit = 'GB';
  else if (normalizedUnitKey.startsWith('M')) displayUnit = 'MB';
  else if (normalizedUnitKey.startsWith('K')) displayUnit = 'KB';

  return {
    bytes,
    formatted: `${cleanNum} ${displayUnit}`,
    value: cleanNum,
    unit: displayUnit,
  };
}

/**
 * Constructs a fully qualified BitTorrent magnet URI from the stream info.
 *
 * Format:
 * magnet:?xt=urn:btih:<infoHash>&dn=<releaseTitle>&tr=<tracker1>&tr=<tracker2>
 */
export function buildMagnetUri(
  stream: TorrentioRawStream,
  releaseTitle: string,
  resolvedInfoHash: string | null = null,
  options: ParseOptions = {}
): string | null {
  const hash = resolvedInfoHash || (typeof stream.infoHash === 'string' ? stream.infoHash.trim() : null);
  if (!hash) {
    return null;
  }

  // Validate infohash format (40 hex chars or 32 base32 chars)
  const isValidHex = /^[0-9a-fA-F]{40}$/.test(hash);
  const isValidBase32 = /^[2-7a-zA-Z]{32}$/.test(hash);

  if (!isValidHex && !isValidBase32) {
    return null;
  }

  const xt = `urn:btih:${hash.toLowerCase()}`;
  const params: string[] = [`xt=${xt}`];

  if (releaseTitle) {
    params.push(`dn=${encodeURIComponent(releaseTitle)}`);
  }

  // Collect tracker announce URLs
  const trackerSet = new Set<string>();

  // 1. From stream.sources
  if (Array.isArray(stream.sources)) {
    for (const source of stream.sources) {
      if (typeof source === 'string' && source.startsWith('tracker:')) {
        const trackerUrl = source.replace(/^tracker:/, '').trim();
        if (trackerUrl.length > 0) {
          trackerSet.add(trackerUrl);
        }
      }
    }
  }

  // 2. Custom trackers provided via options
  if (Array.isArray(options.customTrackers)) {
    for (const tracker of options.customTrackers) {
      if (tracker && typeof tracker === 'string') {
        trackerSet.add(tracker.trim());
      }
    }
  }

  // 3. Fallback anime trackers if none present or enabled by default
  const includeFallback = options.includeFallbackTrackers !== false;
  if (includeFallback && trackerSet.size === 0) {
    for (const tracker of DEFAULT_ANIME_TRACKERS) {
      trackerSet.add(tracker);
    }
  }

  for (const tracker of trackerSet) {
    params.push(`tr=${encodeURIComponent(tracker)}`);
  }

  return `magnet:?${params.join('&')}`;
}

/**
 * Extracts comprehensive quality indicators (resolution, source, codec, HDR, bit depth).
 */
export function extractQuality(name: string, title: string): ParsedQuality {
  const combined = `${name} ${title}`;
  const rawQuality = name.split('\n')[1] || name;

  // 1. Resolution
  let resolution: AnimeResolution = 'Unknown';
  if (/4320p|8k/i.test(combined)) {
    resolution = '4320p';
  } else if (/2160p|4k|uhd/i.test(combined)) {
    resolution = '2160p';
  } else if (/1080p/i.test(combined)) {
    resolution = '1080p';
  } else if (/720p/i.test(combined)) {
    resolution = '720p';
  } else if (/480p/i.test(combined)) {
    resolution = '480p';
  } else if (/360p/i.test(combined)) {
    resolution = '360p';
  }

  // 2. Source
  let source: MediaSource | null = null;
  if (/\b(?:bluray|bdrip|brrip)\b/i.test(combined)) {
    source = 'BluRay';
  } else if (/\bweb-?dl\b/i.test(combined)) {
    source = 'WEB-DL';
  } else if (/\bwebrip\b/i.test(combined)) {
    source = 'WEBRip';
  } else if (/\bhdtv\b/i.test(combined)) {
    source = 'HDTV';
  } else if (/\bdvdrip\b/i.test(combined)) {
    source = 'DVDRip';
  } else if (/\bcam\b/i.test(combined)) {
    source = 'CAM';
  } else if (/\b(?:telesync|ts)\b/i.test(combined)) {
    source = 'TeleSync';
  } else if (/\bscr\b/i.test(combined)) {
    source = 'SCR';
  }

  // 3. Codec
  let codec: string | null = null;
  if (/\b(?:hevc|x265|h\.?265)\b/i.test(combined)) {
    codec = 'HEVC/x265';
  } else if (/\b(?:avc|x264|h\.?264)\b/i.test(combined)) {
    codec = 'AVC/x264';
  } else if (/\bav1\b/i.test(combined)) {
    codec = 'AV1';
  }

  // 4. Bit Depth
  let bitDepth: string | null = null;
  if (/\b(?:10-?bit|hi10p?)\b/i.test(combined)) {
    bitDepth = '10-bit';
  } else if (/\b8-?bit\b/i.test(combined)) {
    bitDepth = '8-bit';
  }

  // 5. HDR Profiles
  const hdr: string[] = [];
  if (/\bhdr10\+\b/i.test(combined)) {
    hdr.push('HDR10+');
  } else if (/\bhdr\b/i.test(combined)) {
    hdr.push('HDR');
  }
  if (/\b(?:dv|dolby\s*vision)\b/i.test(combined)) {
    hdr.push('DV');
  }

  // 6. Remux Check
  const isRemux = /\bremux\b/i.test(combined);

  return {
    resolution,
    raw: rawQuality.trim(),
    source,
    codec,
    bitDepth,
    hdr,
    isRemux,
  };
}

/**
 * Extracts active seeders from the stream title metrics line (`👤 <count>`).
 */
export function extractSeeders(text: string): number | null {
  if (!text) return null;
  const match = text.match(/👤\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extracts the scraper indexer / provider name from the metrics line (`⚙️ <provider>`).
 */
export function extractProvider(text: string): string | null {
  if (!text) return null;
  const match = text.match(/⚙[️\uFE0F]?\s*([^\n\r]+)/);
  if (!match) return null;
  return match[1].trim();
}

/**
 * Parses anime-specific identifiers: release group, episode number, CRC32, and clean title.
 */
export function extractAnimeMetadata(releaseTitle: string): ParsedAnimeMetadata {
  let clean = releaseTitle;

  // 1. Release Group (typically in first bracket: [SubsPlease], [Erai-raws], [Judas])
  let group: string | null = null;
  const groupMatch = clean.match(/^\[([a-zA-Z0-9_\-\s]+)\]/);
  if (groupMatch) {
    group = groupMatch[1].trim();
    clean = clean.substring(groupMatch[0].length).trim();
  }

  // 2. CRC32 Checksum (8 hex characters in square brackets at the end: [E9D320BA])
  let crc32: string | null = null;
  const crcMatch = clean.match(/\[([0-9a-fA-F]{8})\](?:\.[a-zA-Z0-9]+)?$/);
  if (crcMatch) {
    crc32 = crcMatch[1].toUpperCase();
    clean = clean.replace(crcMatch[0], '').trim();
  }

  // 3. Episode Number (e.g. " - 28", " S01E28", " Episode 12", " 01v2")
  let episode: number | null = null;
  const epMatch = clean.match(/(?:[-_]|\bS\d+E|\bEpisode|\bEP|\bE)\s*(\d+)(?:v\d+)?\b/i);
  if (epMatch) {
    episode = parseInt(epMatch[1], 10);
  }

  // Strip file extension if present in clean title
  clean = clean.replace(/\.(mkv|mp4|avi|webm)$/i, '').trim();

  return {
    group,
    episode,
    crc32,
    cleanTitle: clean,
  };
}

/**
 * Extracts audio and subtitle language cues from the title lines.
 */
export function extractLanguages(text: string): string[] {
  const languages: string[] = [];
  if (/dual[\s-]audio/i.test(text)) languages.push('Dual Audio');
  if (/multi[\s-]audio/i.test(text)) languages.push('Multi Audio');
  if (/multi[\s-]subs?/i.test(text)) languages.push('Multi Subs');
  if (/dubbed|\beng[\s-]dub\b/i.test(text)) languages.push('Dubbed');

  // Flag emoji checks (e.g. 🇬🇧 English, 🇯🇵 Japanese)
  if (/🇬🇧|english/i.test(text)) languages.push('English');
  if (/🇯🇵|japanese/i.test(text)) languages.push('Japanese');
  if (/🇪🇸|spanish/i.test(text)) languages.push('Spanish');
  if (/🇫🇷|french/i.test(text)) languages.push('French');
  if (/🇩🇪|german/i.test(text)) languages.push('German');
  if (/🇮🇹|italian/i.test(text)) languages.push('Italian');
  if (/🇵🇹|portuguese/i.test(text)) languages.push('Portuguese');
  if (/🇷🇺|russian/i.test(text)) languages.push('Russian');

  return Array.from(new Set(languages));
}

/* ============================================================================
 * INTERNAL UTILITY HELPERS
 * ============================================================================ */

function extractReleaseTitle(lines: string[], filenameHint?: string): string {
  if (filenameHint && filenameHint.length > 0) {
    return filenameHint;
  }
  if (lines.length > 0) {
    return lines[0];
  }
  return 'Unknown Release';
}

function detectDebrid(name: string): { isDebrid: boolean; debridService: string | null } {
  // Matches tags like [RD+], [AD+], [PM+], [TB+], [DL+], [RD download], etc.
  const match = name.match(/\[([a-zA-Z]+)(?:\+|\s+download)?\]/i);
  if (match) {
    return {
      isDebrid: true,
      debridService: match[1].toUpperCase(),
    };
  }
  return {
    isDebrid: false,
    debridService: null,
  };
}

function resolveInfoHash(stream: TorrentioRawStream, options: ParseOptions): string | null {
  // 1. Direct stream infoHash
  if (typeof stream.infoHash === 'string' && stream.infoHash.trim().length > 0) {
    return stream.infoHash.trim().toLowerCase();
  }

  // 2. Check bingeGroup in behaviorHints (often contains infoHash for non-grouped streams)
  const binge = stream.behaviorHints?.bingeGroup;
  if (typeof binge === 'string') {
    const bingeParts = binge.split('|');
    const lastPart = bingeParts[bingeParts.length - 1];
    if (/^[0-9a-fA-F]{40}$/.test(lastPart)) {
      return lastPart.toLowerCase();
    }
  }

  // 3. Optional extraction from debrid resolver URL
  if (options.extractInfoHashFromDebridUrl !== false && typeof stream.url === 'string') {
    const hashMatch = stream.url.match(/infoHash=([0-9a-fA-F]{40})/i);
    if (hashMatch) {
      return hashMatch[1].toLowerCase();
    }
  }

  return null;
}
