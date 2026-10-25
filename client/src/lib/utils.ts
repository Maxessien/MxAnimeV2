import { AniZipMetadata, ThirdPartyMappings } from "@/types/anizip";
import { ParsedAnimeStream, ParsedQuality } from "@/types/torrentio";
import { fetch } from "@tauri-apps/plugin-http";
import { platform } from "@tauri-apps/plugin-os";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export const MEDIA_BY_MAL_ID_QUERY = `
  query ($idMal: Int) {
    Media (idMal: $idMal, type: ANIME) {
      id
      idMal
      format
      episodes
      status
      title {
        romaji
        english
        native
        userPreferred
      }
      startDate {
        year
        month
        day
      }
      airingSchedule(notYetAired: false, perPage: 50) {
        nodes {
          id
          episode
          airingAt
          timeUntilAiring
        }
      }
      endDate {
        year
        month
        day
      }
      nextAiringEpisode {
        id
        airingAt
        timeUntilAiring
        episode
        mediaId
      }
      trailer {
        id
        site
        thumbnail
      }
      relations {
        edges {
          id
          relationType
          node {
            id
            idMal
            type
            format
            title {
              romaji
              english
              native
              userPreferred
            }
          }
        }
      }
      siteUrl
    }
  }
`;

export const PREQUEL_MINIMAL_QUERY = `
  query ($id: Int) {
    Media (id: $id, type: ANIME) {
      id
      idMal
      format
      relations {
        edges {
          relationType
          node {
            id
            idMal
            type
            format
          }
        }
      }
    }
  }
`;

export const RECENTLY_AIRED = `
  query ($airingAt_lesser: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      airingSchedules(airingAt_lesser: $airingAt_lesser, sort: TIME_DESC) {
        id
        episode
        airingAt
        timeUntilAiring
        media {
          id
          idMal
          format
          description(asHtml: false)
          title { romaji english }
          coverImage { large }
        }
      }
    }
  }
`

export function constructStreamUrl(
  malId: string,
  ep: string,
  category?: "sub" | "dub",
) {
  return `https://gogoanime.me.uk/newplayer.php?mal_id=${malId}&ep=${ep}&category=${category ?? "sub"}`;
}

export const isMobile = platform() === "android"

export const DEFAULT_ANIME_TRACKERS: readonly string[] = [
  'http://nyaa.tracker.wf:7777/announce',
  'http://anidex.moe:6969/announce',
  'http://tracker.anirena.com:80/announce',
  'udp://tracker.uw0.xyz:6969/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://exodus.desync.com:6969/announce',
];

export const UNIT_MULTIPLIERS: Record<string, number> = {
  B: 1,
  BYTES: 1,
  KB: 1024,
  KIB: 1024,
  MB: 1024 * 1024,
  MIB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  GIB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024,
  TIB: 1024 * 1024 * 1024 * 1024,
};

export const ANIZIP_BASE_URL = "https://api.ani.zip/mappings"

const FRIBBS_LIST_URL = "https://raw.githubusercontent.com/Fribb/anime-lists/refs/heads/master/anime-offline-database-reduced.json"
const TMDB_API = "https://api.themoviedb.org/3/tv/{tmdbId}/external_ids?api_key=" + import.meta.env.VITE_TMDB_KEY


interface TorrentIds {kitsu: string | null, imdb: string | null}

export async function getIdSForTorrentio(malId: string | number): Promise<TorrentIds> {
  const ids: TorrentIds = { kitsu: null, imdb: null }
  const { data: anizipMappings } = await axios.get<AniZipMetadata>(`${ANIZIP_BASE_URL}?mal_id=${malId}`)

  let tmdbId: string | null = null

  const {kitsu_id, imdb_id, themoviedb_id } = anizipMappings.mappings
  ids.kitsu = kitsu_id ? kitsu_id.toString() : null
  ids.imdb = imdb_id ? imdb_id.toString() : null
  tmdbId = themoviedb_id

  if (!kitsu_id) {
    const fribbsEntry = (await axios.get<ThirdPartyMappings[]>(FRIBBS_LIST_URL))
      .data.find(v => v?.mal_id && v.mal_id.toString() === malId.toString())

    if (fribbsEntry?.kitsu_id) ids.kitsu = fribbsEntry.kitsu_id.toString()
  }

  if (kitsu_id || imdb_id) return ids

  const { data } = tmdbId ? await axios.get(TMDB_API.replace("{tmdbId}", tmdbId)) : { data: null }

  if (data?.imdb_id) ids.imdb = data.imdb_id

  return ids
}

export function filterParsed(entries: ParsedAnimeStream[]) {
  const allQualities: Record<ParsedQuality["resolution"], ParsedAnimeStream[]> = {
    "1080p": [],
    "2160p": [],
    "360p": [],
    "4320p": [],
    "480p": [],
    "720p": [],
    "Unknown": []
  }

  const parsed: {quality: string, magnetUri: string}[] = []

  for (const entry of entries) {
    allQualities[entry.quality.resolution].push(entry)
  }

  for (const [quality, entries] of Object.entries(allQualities)) {
    if (quality === "Unknown" || entries.length === 0) continue
    const chosen = entries.reduce((prev, curr) => (prev.seeders || 0) > (curr.seeders || 0) ? prev : curr)

    console.log({quality: chosen.quality.resolution, magnetUri: chosen.magnetUri})

    if (chosen.magnetUri) parsed.push({quality: chosen.quality.resolution, magnetUri: chosen.magnetUri})
  }

  return parsed
}

export async function fetchWithProgress(
  url: string,
  controller: AbortController,
  onProgress: (total: number, loaded: number, progress: number) => void
): Promise<Response> {
  const response = await fetch(url, {signal: controller.signal});

  if (!response.body || !response.ok) {
    throw new Error("Response body is not readable");
  }

  // 1. Extract the total file size from headers (fallback to 0 if chunked/missing)
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : Infinity;
  let loaded = 0;

  // 2. Setup a pass-through stream that monitors data chunks
  const progressTracker = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      loaded += chunk.byteLength;

      // Calculate progress percentage decimal (0.0 to 1.0)
      const progress = total > 0 ? loaded / total : 0;

      // Execute your progress hook
      onProgress(total, loaded, progress);

      // Pass the data chunk through completely untouched
      controller.enqueue(chunk);
    }
  });

  // 3. Pipe the original body through our tracker to create a monitored stream
  const monitoredBody = response.body.pipeThrough(progressTracker);

  // 4. Construct and return a new Response pointing to our monitored stream
  return new Response(monitoredBody, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}
