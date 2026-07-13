// --- Types & Interfaces ---

import { Anime, JikanPaginatedResponse } from "@/types/jikan";

export interface MalAnimeNode {
  id: number;
  title: string;
  main_picture?: {
    medium?: string;
    large?: string;
  };
  alternative_titles?: {
    en?: string;
    ja?: string;
  };
  media_type?: string;
  source?: string;
  num_episodes?: number;
  status?: string;
  mean?: number;
  num_scoring_users?: number;
  rank?: number;
  popularity?: number;
  synopsis?: string;
  start_season?: {
    year: number;
    season: string;
  };
  studios?: Array<{ id: number; name: string }>;
  genres?: Array<{ id: number; name: string }>;
}

export interface JikanAnimeData {
  mal_id: number;
  url: string;
  images: {
    jpg: Record<string, string | null>;
    webp: Record<string, string | null>;
  };
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  titles: Array<{ type: string; title: string }>;
  type: string | null;
  source: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  synopsis: string | null;
  season: string | null;
  year: number | null;
  studios: Array<{ mal_id: number; type: string; name: string; url: string }>;
  genres: Array<{ mal_id: number; type: string; name: string; url: string }>;
}

export interface JikanSingleResponse {
  data: Anime;
}

export interface MalSearchResponse {
  data?: Array<{ node: MalAnimeNode }>;
  paging?: {
    next?: string;
    previous?: string;
  };
}

// --- Transformation Functions ---

/**
 * Transforms an official MyAnimeList API v2 response into a Jikan v4 compliant schema.
 */
function transformMalToJikan(
  malData: MalAnimeNode | null | undefined,
): JikanSingleResponse | null {
  if (!malData) return null;

  return {
    data: {
      mal_id: malData.id,
      url: `https://myanimelist.net/anime/${malData.id}`,
      images: {
        jpg: {
          image_url:
            malData.main_picture?.large || malData.main_picture?.medium || "",
          small_image_url: malData.main_picture?.medium || "",
          large_image_url: malData.main_picture?.large || "",
        },
        webp: {
          image_url:
            malData.main_picture?.large || malData.main_picture?.medium || "",
          small_image_url: malData.main_picture?.medium || "",
          large_image_url: malData.main_picture?.large || "",
        },
      },
      title: malData.title,
      title_english: malData.alternative_titles?.en || null,
      title_japanese: malData.alternative_titles?.ja || null,
      titles: [
        { type: "Default", title: malData.title },
        ...(malData.alternative_titles?.en
          ? [{ type: "English", title: malData.alternative_titles.en }]
          : []),
        ...(malData.alternative_titles?.ja
          ? [{ type: "Japanese", title: malData.alternative_titles.ja }]
          : []),
      ],
      type: malData.media_type ? malData.media_type.toUpperCase() : null,
      source: malData.source ? malData.source.replace(/_/g, " ") : null,
      episodes: malData.num_episodes || null,
      status: malData.status ? malData.status.replace(/_/g, " ") : null,
      airing: malData.status === "currently_airing",
      score: malData.mean || null,
      scored_by: malData.num_scoring_users || null,
      rank: malData.rank || null,
      popularity: malData.popularity || null,
      synopsis: malData.synopsis || null,
      season: malData.start_season?.season || null,
      year: malData.start_season?.year || null,
      studios: (malData.studios || []).map((studio) => ({
        mal_id: studio.id,
        type: "anime",
        name: studio.name,
        url: `https://myanimelist.net/anime/producer/${studio.id}`,
      })),
      genres: (malData.genres || []).map((genre) => ({
        mal_id: genre.id,
        type: "anime",
        name: genre.name,
        url: `https://myanimelist.net/anime/genre/${genre.id}`,
      })),
    },
  };
}

function transformMalSearchToJikan(
  malSearchData: MalSearchResponse,
): JikanPaginatedResponse<Anime> {
  const dataList: JikanAnimeData[] = (malSearchData.data || [])
    .map((item) => transformMalToJikan(item.node)?.data)
    .filter((item): item is JikanAnimeData => !!item); // Filter out any null values safely

  return {
    data: dataList,
    pagination: {
      has_next_page: !!malSearchData.paging?.next,
      current_page: 1,
      last_visible_page: 0,
    },
  };
}

export { transformMalSearchToJikan, transformMalToJikan };
