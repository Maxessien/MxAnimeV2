import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useSearchAnime, useGenres } from '@/hooks/use-jikan';
import { AnimeCard, AnimeCardSkeleton } from '@/components/AnimeCard';
import { Search as SearchIcon, Loader2, FilterX } from 'lucide-react';
import { AnimeType } from '@/types/jikan';
import { parseType } from './TopAnime';

export default function Search() {
  const [_, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [genre, setGenre] = useState(searchParams.get('genre') || '');
  const [type, setType] = useState<AnimeType>(parseType(searchParams.get('type') || ''));
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Debounce logic without triggering loops
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedQ(q);
    }, 500);
    return () => clearTimeout(timerRef.current || undefined);
  }, [q]);

  // Sync with URL and reset page on new search
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    if (genre) params.set('genre', genre);
    if (type) params.set('type', type);
    if (page > 1) params.set('page', page.toString());
    
    const newSearch = params.toString();
    const newUrl = newSearch ? `/search?${newSearch}` : '/search';
    if (window.location.pathname + window.location.search !== newUrl) {
      setLocation(newUrl, { replace: true });
    }
  }, [debouncedQ, genre, type, page, setLocation]);

  // Reset page when filters change (but not when page changes)
  const prevFilters = useRef({ debouncedQ, genre, type });
  useEffect(() => {
    if (
      prevFilters.current.debouncedQ !== debouncedQ ||
      prevFilters.current.genre !== genre ||
      prevFilters.current.type !== type
    ) {
      setPage(1);
      prevFilters.current = { debouncedQ, genre, type };
    }
  }, [debouncedQ, genre, type]);

  const { data: genresData } = useGenres();
  const { data, isLoading, error, isFetching } = useSearchAnime(debouncedQ, page, genre, type);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="relative w-full">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
          <input 
            type="text" 
            placeholder="Search anime by title..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-muted/50 rounded-xl border border-transparent focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium"
          />
          {q && (
            <button 
              onClick={() => setQ('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <FilterX size={20} />
            </button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="flex-1 py-3 px-4 bg-muted/50 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none text-sm appearance-none font-medium cursor-pointer"
          >
            <option value="">All Genres</option>
            {genresData?.data?.map((g: any) => (
              <option key={g.mal_id} value={g.mal_id}>{g.name}</option>
            ))}
          </select>

          <select 
            value={type}
            onChange={(e) => setType(parseType(e.target.value))}
            className="flex-1 py-3 px-4 bg-muted/50 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none text-sm appearance-none font-medium cursor-pointer"
          >
            <option value="">Any Format</option>
            <option value="tv">TV Series</option>
            <option value="movie">Movie</option>
            <option value="ova">OVA</option>
            <option value="special">Special</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold tracking-tight">
            {debouncedQ || genre || type ? (
              <span className="flex items-center gap-2">
                Results {data?.pagination?.items?.total ? <span className="text-muted-foreground text-sm font-normal">({data.pagination.items.total} found)</span> : ''}
              </span>
            ) : 'Browse All'}
          </h2>
          {(isLoading || isFetching) && <Loader2 className="animate-spin text-primary" />}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Error searching anime: {(error as Error).message}
          </div>
        )}

        {isLoading && !data ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {Array.from({ length: 12 }).map((_, i) => <AnimeCardSkeleton key={i} />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed">
            <SearchIcon className="mx-auto mb-4 opacity-50" size={48} />
            <p className="text-xl font-medium text-foreground">No results found</p>
            <p className="mt-2">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
              {data?.data?.map((anime: any, i: number) => (
                <div key={anime.mal_id} className="animate-in fade-in zoom-in-95" style={{ animationDelay: `${Math.min(i, 10) * 50}ms`, animationFillMode: 'both' }}>
                  <AnimeCard anime={anime} />
                </div>
              ))}
            </div>

            {data?.pagination && data.pagination.last_visible_page > 1 && (
              <div className="flex items-center justify-center gap-4 pt-8 border-t">
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === 1}
                  className="px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl disabled:opacity-50 hover:bg-secondary/80 transition-all active:scale-95"
                >
                  Previous
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold bg-muted px-4 py-2 rounded-lg">Page {page} of {data.pagination.last_visible_page}</span>
                </div>
                <button
                  onClick={() => { setPage(p => Math.min(data.pagination.last_visible_page, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={!data.pagination.has_next_page}
                  className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
