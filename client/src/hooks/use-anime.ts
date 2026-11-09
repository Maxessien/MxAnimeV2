// src/hooks/useAnime.ts
import { useQuery } from "@tanstack/react-query";
import {
  AnimeFull,
  AnimeType,
  Genre,
  JikanResponse,
  TopAnimeFilter,
} from "@/types/jikan";
import {
  transformMalToJikan,
} from "@/lib/mal-transform";
import { fetchJikan, fetchMal, MAL_DEFAULT_FIELDS } from "@/lib/jikan";
import { AniZipMetadata } from "@/types/anizip";
import axios from "axios";
import { anilinkService, getAnimeList, getRecentlyReleasedEpisodes } from "@/lib/anilist";
import { AugmentedAnimeMedia, PaginatedRecentEpisodes, PaginatedSearchResponse } from "@/types/anilist";

// --- ANILIST SUPPORTED ENDPOINTS ---

export const useRecentlyReleased = (page: number, perPage?: number, startTime?: number, endTime?: number) => {
  return useQuery<PaginatedRecentEpisodes>({
    queryKey: ["recently-released", page, perPage, startTime, endTime],
    queryFn: async () => {
      const res = await getRecentlyReleasedEpisodes(page, perPage, startTime, endTime);
      return res;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

export const useTopAnime = (
  page = 1,
  filter?: TopAnimeFilter,
  type?: AnimeType,
) => {
  return useQuery<PaginatedSearchResponse>({
    queryKey: ["top-anime", page, filter, type],
    queryFn: async () => {
      return await
        getAnimeList(page, "All", "All", "All", ["POPULARITY_DESC", "TRENDING_DESC", "SCORE_DESC"], "All", undefined, 10)
    },
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

export const useSeasonsNow = (page = 1) => {
  return useQuery<PaginatedSearchResponse>({
    queryKey: ["seasons-now", page],
    queryFn: async () => {
      const currSeason = (()=> {
        const month = new Date().getMonth(); // 0-indexed (Jan = 0, Dec = 11)

        if (month >= 0 && month <= 2) return "WINTER"; // Jan, Feb, Mar
        if (month >= 3 && month <= 5) return "SPRING"; // Apr, May, Jun
        if (month >= 6 && month <= 8) return "SUMMER"; // Jul, Aug, Sep
        return "FALL";                                 // Oct, Nov, Dec
      })()
      return await
        getAnimeList(page, "All", 2026, currSeason, ["TRENDING_DESC", "POPULARITY_DESC"], "All", undefined, 6)
    },
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

export const useAnimeFull = (
  id: string | number,
  enabled: boolean) => {
  return useQuery<JikanResponse<AnimeFull>>({
    queryKey: ["anime-full", id],
    queryFn: async () => {
      const data = await fetchMal<any>(`/anime/${id}`, {
        fields: MAL_DEFAULT_FIELDS,
      });
      return transformMalToJikan(data) as JikanResponse<AnimeFull>;
    },
    enabled: !!id && enabled,
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

// --- JIKAN FALLBACK ENDPOINTS ---
// MAL API v2 does not support Characters, Episodes, Schedules, or a Genres list natively.
// We retain fetchJikan here so your app doesn't break.

export const useAnimeEpisodes = (id: string | number) => {
  return useQuery<
    (AniZipMetadata | AugmentedAnimeMedia) & { isAnilist: boolean }
  >({
    queryKey: ["anime-episodes", id],
    queryFn: async () => {
      const anilinkRes = await anilinkService.getAnimeByMalId(id);

      if (
        ((anilinkRes?.airingSchedule?.nodes &&
          anilinkRes?.airingSchedule.nodes.length > 0) ||
          anilinkRes?.nextAiringEpisode?.episode) &&
        anilinkRes.seasonNumber
      ) {
        return { ...anilinkRes, isAnilist: true };
      }

      const { data } = await axios.get<AniZipMetadata>(
        `https://api.ani.zip/mappings?mal_id=${id}`,
      );
      const filteredEps: AniZipMetadata["episodes"] = {};

      for (const key in data.episodes) {
        if (Number.isFinite(Number(key))) filteredEps[key] = data.episodes[key];
      }

      return { ...data, episodes: filteredEps, isAnilist: false };
    },
    enabled: !!id,
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

export const useGenres = () => {
  return useQuery<JikanResponse<Genre[]>>({
    queryKey: ["genres-anime"],
    queryFn: () => fetchJikan("/genres/anime"),
    staleTime: 24 * 60 * 60 * 1000,
  });
};
