import { ScheduleFilter } from "./jikan";

export interface MediaResponse {
  /** The id of the media */
  id: number;

  /** The mal id of the media */
  idMal: number;

  /** The format the media was released in */
  format:
    | "TV"
    | "TV_SHORT"
    | "MOVIE"
    | "SPECIAL"
    | "OVA"
    | "ONA"
    | "MUSIC"
    | "MANGA"
    | "NOVEL"
  | "ONE_SHOT";

  status: MediaStatus

  /** The official titles of the media in various languages */
  title: {
    romaji: string;
    english: string;
    native: string;
    userPreferred: string;
  };

  /** The first official release date of the media */
  startDate: {
    year?: number;
    month?: number;
    day?: number;
  };

  /** The last official release date of the media */
  endDate: {
    year?: number;
    month?: number;
    day?: number;
  };

  /** Media trailer or advertisement */
  trailer: {
    id: string;
    site: string;
    thumbnail: string;
  };

  /** If the media is intended only for 18+ adult audiences */
  isAdult: boolean;

  /** The media's next episode airing schedule */
  nextAiringEpisode: {
    id: number;
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
    mediaId: number;
  };
  episodes: number;
  airingSchedule: {
    nodes: Array<{
      /** The AniList ID of the airing schedule entry */
      id: number;

      /** The episode number (1, 2, 3...) */
      episode: number;

      /** Unix timestamp (seconds) when the episode is scheduled to air */
      airingAt: number;

      /**
       * Seconds until the episode airs.
       * Negative value if the scheduled air time has already passed.
       */
      timeUntilAiring: number;
    }>;
  };
}

export type AnimeFormat =
  "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC";

export type AnimeSeason = "SUMMER" | "WINTER" | "FALL" | "SPRING"

export type AnimeSort =
  | 'TITLE_ROMAJI'
  | 'TITLE_ROMAJI_DESC'
  | 'TITLE_ENGLISH'
  | 'TITLE_ENGLISH_DESC'
  | 'START_DATE'
  | 'START_DATE_DESC'
  | 'END_DATE'
  | 'END_DATE_DESC'
  | 'SCORE'
  | 'SCORE_DESC'
  | 'POPULARITY'
  | 'POPULARITY_DESC'
  | 'TRENDING'
  | 'TRENDING_DESC';


export type MediaStatus =
  | "FINISHED" // Has completed and finished airing or being published
  | "RELEASING" // Currently releasing episodes or chapters
  | "NOT_YET_RELEASED" // To be released at a future date
  | "CANCELLED" // Ended before the planned completion
  | "HIATUS"; // Paused releasing with plans to resume at a later date

export const ANIME_STATUS = [
  "FINISHED",
  "RELEASING",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS"
]

export const ANIME_FORMATS: ReadonlySet<string> = new Set<AnimeFormat>([
  "TV",
  "TV_SHORT",
  "MOVIE",
  "SPECIAL",
  "OVA",
  "ONA",
  "MUSIC",
]);

export const FORMAT = [
  "TV",
  "TV_SHORT",
  "MOVIE",
  "SPECIAL",
  "OVA",
  "ONA",
  "MUSIC",
]

export const ANIME_SEASON = ["SUMMER", "WINTER", "FALL", "SPRING"]

export const ANIME_SORT = [
  'TITLE_ROMAJI',
  'TITLE_ROMAJI_DESC',
  'TITLE_ENGLISH',
  'TITLE_ENGLISH_DESC',
  'START_DATE',
  'START_DATE_DESC',
  'END_DATE',
  'END_DATE_DESC',
  'SCORE',
  'SCORE_DESC',
  'POPULARITY',
  'POPULARITY_DESC',
  'TRENDING',
  'TRENDING_DESC',
];

export interface AnimeRelationNode {
  idMal: number | null;
  format: AnimeFormat | string;
  type: "ANIME";
  title: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
    userPreferred?: string | null;
  };
}

export interface AnimeRelationEdge {
  id: number;
  relationType: string;
  node: AnimeRelationNode;
}

export interface AugmentedAnimeMedia extends Omit<MediaResponse, "relations"> {
  seasonNumber: number;
  relations: {
    edges: AnimeRelationEdge[];
  };
}

export interface RawMediaWithRelations extends MediaResponse {
  relations: {
    edges: Array<{
      id: number;
      relationType: string;
      node: {
        id: number;
        idMal: number | null;
        type: string;
        format: string;
        title: {
          romaji?: string | null;
          english?: string | null;
          native?: string | null;
          userPreferred?: string | null;
        };
      };
    }>;
  };
}

export interface RecentEpisode {
  id: number;
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
  media: {
    id: number;
    idMal: number; // Always present
    format: string;
    description: string | null;
    title: {
      romaji: string | null;
      english: string | null;
    };
    coverImage: {
      large: string | null;
      extraLarge: string | null,
      medium: string | null
    };
    startDate: {year: number}
  };
}

export interface AnimeListMedia {
  id: number;
  idMal: number;
  format: AnimeFormat;
  description: string | null;
  episodes: number | null;
  score?: number | null;
  genres?: string[];
  title: {
    english: string | null;
    romaji: string | null;
  };
  coverImage: {
    large: string | null;
    extraLarge: string | null;
    medium: string | null;
  };
  startDate: { year: number };
}

export interface PageInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

interface RawRecentEpisode extends Omit<RecentEpisode, "media"> {
  media: Omit<RecentEpisode["media"], "idMal"> & {
    idMal: number | null;
  };
}

interface AnilistResponse<T> {
  data?: T, errors?: Array<{ message: string }>;
}

interface AnilistPage<T> {
  Page?: {pageInfo?: PageInfo} & T
}

export type AniListGraphQLResponse = AnilistResponse<AnilistPage<{airingSchedules?: RawRecentEpisode[];}>>

export type AniListGraphQLSearchResponse = AnilistResponse<AnilistPage<{media: RawRecentEpisode["media"][]}>>

export interface PaginatedRecentEpisodes {
  pageInfo: PageInfo;
  data: RecentEpisode[];
}

export interface PaginatedSearchResponse {
  pageInfo: PageInfo,
  data: AnimeListMedia[]
}

export interface AnilinkServiceOptions {
  endpoint?: string;
  fetchFn?: typeof fetch;
}

export interface FuzzyDateInput {
  year?: number | null;
  month?: number | null;
  day?: number | null;
}

export interface SyntheticAiringScheduleNode {
  id: number;
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
}

export type WeekTimestamps = {
  [key in ScheduleFilter]: {
    startTime: number;
    endTime: number;
  };
};
