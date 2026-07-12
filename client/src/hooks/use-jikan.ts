import { useQuery } from '@tanstack/react-query';
import { fetchJikan } from '@/lib/jikan';

export const useTopAnime = (page = 1, filter?: string, type?: string) => {
  return useQuery({
    queryKey: ['top-anime', page, filter, type],
    queryFn: () => fetchJikan<any>('/top/anime', { page, filter, type }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSeasonsNow = (page = 1) => {
  return useQuery({
    queryKey: ['seasons-now', page],
    queryFn: () => fetchJikan<any>('/seasons/now', { page }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSeason = (year: number, season: string, page = 1) => {
  return useQuery({
    queryKey: ['season', year, season, page],
    queryFn: () => fetchJikan<any>(`/seasons/${year}/${season}`, { page }),
    enabled: !!year && !!season,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSearchAnime = (q: string, page = 1, genres?: string, type?: string, order_by?: string) => {
  return useQuery({
    queryKey: ['search-anime', q, page, genres, type, order_by],
    queryFn: () => fetchJikan<any>('/anime', { q, page, genres, type, order_by }),
    enabled: !!q || !!genres || !!type || !!order_by || page > 1, // trigger on page change even if empty search
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnimeFull = (id: string) => {
  return useQuery({
    queryKey: ['anime-full', id],
    queryFn: () => fetchJikan<any>(`/anime/${id}/full`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnimeCharacters = (id: string) => {
  return useQuery({
    queryKey: ['anime-characters', id],
    queryFn: () => fetchJikan<any>(`/anime/${id}/characters`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnimeEpisodes = (id: string, page = 1) => {
  return useQuery({
    queryKey: ['anime-episodes', id, page],
    queryFn: () => fetchJikan<any>(`/anime/${id}/episodes`, { page }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSchedules = (filter?: string, page = 1) => {
  return useQuery({
    queryKey: ['schedules', filter, page],
    queryFn: () => fetchJikan<any>('/schedules', { filter }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres-anime'],
    queryFn: () => fetchJikan<any>('/genres/anime'),
    staleTime: 24 * 60 * 60 * 1000,
  });
};
