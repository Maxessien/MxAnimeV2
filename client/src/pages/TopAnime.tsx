import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTopAnime } from '@/hooks/use-jikan';
import { AnimeCard, AnimeCardSkeleton } from '@/components/AnimeCard';
import { Loader2, Filter, Trophy } from 'lucide-react';

export default function TopAnime() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [filter, setFilter] = useState(searchParams.get('filter') || '');
  const [type, setType] = useState(searchParams.get('type') || '');

  // Sync URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (filter) params.set('filter', filter);
    if (type) params.set('type', type);
    
    const newSearch = params.toString();
    const newUrl = newSearch ? `/top?${newSearch}` : '/top';
    if (window.location.pathname + window.location.search !== newUrl) {
      setLocation(newUrl, { replace: true });
    }
  }, [page, filter, type, setLocation]);

  const { data, isLoading, error } = useTopAnime(page, filter, type);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Trophy size={32} />
          </div>
          Top Anime
        </h1>
        <p className="text-muted-foreground text-lg">The highest rated and most popular anime of all time.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter size={20} />
          <span className="font-medium hidden sm:inline">Filters:</span>
        </div>
        
        <div className="flex gap-4 w-full sm:w-auto">
          <select 
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="flex-1 sm:w-48 py-2.5 px-4 bg-muted rounded-lg border-none focus:ring-2 focus:ring-primary outline-none text-sm appearance-none font-medium cursor-pointer"
          >
            <option value="">Ranking (All)</option>
            <option value="airing">Top Airing</option>
            <option value="upcoming">Top Upcoming</option>
            <option value="bypopularity">Most Popular</option>
            <option value="favorite">Most Favorited</option>
          </select>

          <select 
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="flex-1 sm:w-40 py-2.5 px-4 bg-muted rounded-lg border-none focus:ring-2 focus:ring-primary outline-none text-sm appearance-none font-medium cursor-pointer"
          >
            <option value="">Any Format</option>
            <option value="tv">TV Series</option>
            <option value="movie">Movie</option>
            <option value="ova">OVA</option>
            <option value="special">Special</option>
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Error loading top anime: {(error as Error).message}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {Array.from({ length: 24 }).map((_, i) => <AnimeCardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
              {data?.data?.map((anime: any, i: number) => (
                <div key={anime.mal_id} className="relative animate-in fade-in zoom-in-95" style={{ animationDelay: `${Math.min(i, 10) * 50}ms`, animationFillMode: 'both' }}>
                  {/* Rank Badge */}
                  <div className="absolute -top-3 -left-3 z-10 bg-foreground text-background font-black text-xs md:text-sm w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full shadow-lg border-2 border-background">
                    #{anime.rank || (page - 1) * 25 + i + 1}
                  </div>
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
