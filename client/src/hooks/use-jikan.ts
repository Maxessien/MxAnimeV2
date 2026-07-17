// src/hooks/useAnime.ts
import { useQuery } from "@tanstack/react-query";
import {
  Anime,
  AnimeCharacter,
  AnimeEpisode,
  AnimeFull,
  AnimeOrderBy,
  AnimeSeason,
  AnimeType,
  Genre,
  JikanPaginatedResponse,
  JikanResponse,
  ScheduleFilter,
  TopAnimeFilter,
} from "@/types/jikan";
import {
  transformMalSearchToJikan,
  transformMalToJikan,
} from "@/lib/mal-transform";
import { fetchJikan, fetchMal, MAL_DEFAULT_FIELDS } from "@/lib/jikan";
import { AniZipMetadata } from "@/types/anizip";
import axios, { AxiosResponse } from "axios";

// --- MAL SUPPORTED ENDPOINTS ---

const PAGE_LIMIT = 25;
const getOffset = (page: number) => (page - 1) * PAGE_LIMIT;

export const useTopAnime = (
  page = 1,
  filter?: TopAnimeFilter,
  type?: AnimeType,
) => {
  return useQuery<JikanPaginatedResponse<Anime>>({
    queryKey: ["top-anime", page, filter, type],
    queryFn: async () => {
      // Map Jikan filters to MAL ranking types
      let ranking_type = "all";
      if (filter === "airing") ranking_type = "airing";
      if (filter === "upcoming") ranking_type = "upcoming";
      if (filter === "bypopularity") ranking_type = "bypopularity";
      if (type === "tv") ranking_type = "tv";
      if (type === "movie") ranking_type = "movie";

      const data = await fetchMal<any>("/anime/ranking", {
        ranking_type,
        offset: getOffset(page),
        limit: PAGE_LIMIT,
        fields: MAL_DEFAULT_FIELDS,
      });
      return transformMalSearchToJikan(data);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSeasonsNow = (page = 1) => {
  return useQuery<JikanPaginatedResponse<Anime>>({
    queryKey: ["seasons-now", page],
    queryFn: async () => {
      // MAL requires explicit year and season
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth();
      let season = "winter";
      if (month >= 2 && month <= 4) season = "spring";
      else if (month >= 5 && month <= 7) season = "summer";
      else if (month >= 8 && month <= 10) season = "fall";

      const data = await fetchMal<any>(`/anime/season/${year}/${season}`, {
        offset: getOffset(page),
        limit: PAGE_LIMIT,
        fields: MAL_DEFAULT_FIELDS,
      });
      return transformMalSearchToJikan(data) as JikanPaginatedResponse<Anime>;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSeason = (
  year: number,
  season: AnimeSeason | string,
  page = 1,
) => {
  return useQuery<JikanPaginatedResponse<Anime>>({
    queryKey: ["season", year, season, page],
    queryFn: async () => {
      const data = await fetchMal<any>(`/anime/season/${year}/${season}`, {
        offset: getOffset(page),
        limit: PAGE_LIMIT,
        fields: MAL_DEFAULT_FIELDS,
      });
      return transformMalSearchToJikan(data) as JikanPaginatedResponse<Anime>;
    },
    enabled: !!year && !!season,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSearchAnime = (
  q: string,
  page = 1,
  genres?: string,
  type?: AnimeType,
  order_by?: AnimeOrderBy,
) => {
  return useQuery<JikanPaginatedResponse<Anime>>({
    queryKey: ["search-anime", q, page, genres, type, order_by],
    queryFn: async () => {
      // MAL has limited search parameters compared to Jikan.
      // It mainly uses 'q' (query string).
      const data = await fetchMal<any>("/anime", {
        q,
        offset: getOffset(page),
        limit: PAGE_LIMIT,
        fields: MAL_DEFAULT_FIELDS,
      });
      return transformMalSearchToJikan(data) as JikanPaginatedResponse<Anime>;
    },
    enabled: !!q || page > 1,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnimeFull = (id: string | number) => {
  return useQuery<JikanResponse<AnimeFull>>({
    queryKey: ["anime-full", id],
    queryFn: async () => {
      const data = await fetchMal<any>(`/anime/${id}`, {
        fields: MAL_DEFAULT_FIELDS,
      });
      return transformMalToJikan(data) as JikanResponse<AnimeFull>;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// --- JIKAN FALLBACK ENDPOINTS ---
// MAL API v2 does not support Characters, Episodes, Schedules, or a Genres list natively.
// We retain fetchJikan here so your app doesn't break.

export const useAnimeCharacters = (id: string | number) => {
  return useQuery<JikanResponse<AnimeCharacter[]>>({
    queryKey: ["anime-characters", id],
    queryFn: () => fetchJikan(`/anime/${id}/characters`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnimeEpisodes = (id: string | number) => {
  return useQuery<AxiosResponse<AniZipMetadata>>({
    queryKey: ["anime-episodes", id],
    queryFn: () => axios.get<AniZipMetadata>(`https://api.ani.zip/mappings?mal_id=${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSchedules = (filter?: ScheduleFilter, page = 1) => {
  return useQuery<JikanPaginatedResponse<Anime>>({
    queryKey: ["schedules", filter, page],
    queryFn: () => fetchJikan("/schedules", { filter, page }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenres = () => {
  return useQuery<JikanResponse<Genre[]>>({
    queryKey: ["genres-anime"],
    queryFn: () => fetchJikan("/genres/anime"),
    staleTime: 24 * 60 * 60 * 1000,
  });
};
