// --- Types & Interfaces ---

import { MediaResponse } from "@/types/anilist";
import { Anime } from "@/types/jikan";


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

const transformAnilistToJikan = (anilistData: MediaResponse): Anime => {
  const dummyGenreObj = {mal_id: 123456, name: "", type: "", url: ""}
  return {
    airing: anilistData.status === "RELEASING",
    episodes: anilistData.episodes,
    genres: anilistData.genres
      .map(val => ({ ...dummyGenreObj, mal_id: Math.random() * 1_000_000, name: val })),
    images: {
      jpg: {
        image_url:
          anilistData.coverImage.extraLarge || anilistData.coverImage.large || "",
          small_image_url: anilistData.coverImage.large || "",
        large_image_url: anilistData.coverImage.extraLarge || "",
      },
      webp: {
        image_url:
          anilistData.coverImage.extraLarge || anilistData.coverImage.large || "",
          small_image_url: anilistData.coverImage.large || "",
        large_image_url: anilistData.coverImage.extraLarge || "",
      },
    },
    mal_id: anilistData.idMal,
    popularity: null,
    rank: null,
    score: null,
    scored_by: null,
    season: anilistData.season,
    source: null,
    status: anilistData.status,
    studios: anilistData.studios.nodes
      .map(({ name }) => ({ ...dummyGenreObj, mal_id: Math.random() * 1_000_000, name })),
    synopsis: anilistData.description,
    title: anilistData.title.english || anilistData.title.romaji,
    title_english: anilistData.title.english,
    title_japanese: anilistData.title.romaji,
    titles: [
      { title: anilistData.title.english, type: "english" },
      {title: anilistData.title.romaji, type: "romaji"}
    ],
    type: anilistData.format,
    year: anilistData.startDate.year || null,
    url: anilistData.siteUrl
  }
}

export { transformMalToJikan, transformAnilistToJikan };
