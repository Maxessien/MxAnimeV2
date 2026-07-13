import { useQuery } from '@tanstack/react-query';
import { fetchJikan } from '@/lib/jikan';
import { Anime, AnimeCharacter, AnimeEpisode, AnimeFull, AnimeOrderBy, AnimeSeason, AnimeType, Genre, JikanPaginatedResponse, JikanResponse, ScheduleFilter, TopAnimeFilter } from '@/types/jikan';

export const useTopAnime = (
  page = 1, 
  filter?: TopAnimeFilter, 
  type?: AnimeType
) => {
  return useQuery<JikanPaginatedResponse<Anime>>({
    queryKey: ['top-anime', page, filter, type],
    queryFn: () => fetchJikan('/top/anime', { page, filter, type }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSeasonsNow = (page = 1) => {
  return useQuery<JikanPaginatedResponse<Anime>>({
    queryKey: ['seasons-now', page],
    queryFn: () => fetchJikan('/seasons/now', { page }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSeason = (
  year: number, 
  season: AnimeSeason | string, 
  page = 1
) => {
  return useQuery<JikanPaginatedResponse<Anime>>({
    queryKey: ['season', year, season, page],
    queryFn: () => fetchJikan(`/seasons/${year}/${season}`, { page }),
    enabled: !!year && !!season,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSearchAnime = (
  q: string, 
  page = 1, 
  genres?: string, 
  type?: AnimeType, 
  order_by?: AnimeOrderBy
) => {
  return useQuery<JikanPaginatedResponse<Anime>>({
    queryKey: ['search-anime', q, page, genres, type, order_by],
    queryFn: () => fetchJikan('/anime', { q, page, genres, type, order_by }),
    enabled: !!q || !!genres || !!type || !!order_by || page > 1,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnimeFull = (id: string | number) => {
  return useQuery<JikanResponse<AnimeFull>>({
    queryKey: ['anime-full', id],
    queryFn: () => fetchJikan(`/anime/${id}/full`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnimeCharacters = (id: string | number) => {
  return useQuery<JikanResponse<AnimeCharacter[]>>({
    queryKey: ['anime-characters', id],
    queryFn: () => fetchJikan(`/anime/${id}/characters`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnimeEpisodes = (id: string | number, page = 1) => {
  return useQuery<JikanPaginatedResponse<AnimeEpisode>>({
    queryKey: ['anime-episodes', id, page],
    queryFn: () => fetchJikan(`/anime/${id}/episodes`, { page }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSchedules = (filter?: ScheduleFilter, page = 1) => {
  return useQuery<JikanPaginatedResponse<Anime>>({
    queryKey: ['schedules', filter, page],
    queryFn: () => fetchJikan('/schedules', { filter, page }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenres = () => {
  return useQuery<JikanResponse<Genre[]>>({
    queryKey: ['genres-anime'],
    queryFn: () => fetchJikan('/genres/anime'),
    staleTime: 24 * 60 * 60 * 1000,
  });
};
