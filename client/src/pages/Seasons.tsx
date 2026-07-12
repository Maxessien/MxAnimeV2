import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSeason } from '@/hooks/use-jikan';
import { AnimeCard, AnimeCardSkeleton } from '@/components/AnimeCard';
import { CalendarDays } from 'lucide-react';

export default function Seasons() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultSeason = currentMonth < 3 ? 'winter' : currentMonth < 6 ? 'spring' : currentMonth < 9 ? 'summer' : 'fall';
  
  const [year, setYear] = useState(Number(searchParams.get('year')) || currentYear);
  const [season, setSeason] = useState(searchParams.get('season') || defaultSeason);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const years = Array.from({ length: currentYear - 1980 + 2 }, (_, i) => currentYear + 1 - i);
  const seasonsList = ['winter', 'spring', 'summer', 'fall'];

  useEffect(() => {
    const params = new URLSearchParams();
    if (year !== currentYear) params.set('year', year.toString());
    if (season !== defaultSeason) params.set('season', season);
    if (page > 1) params.set('page', page.toString());
    
    const newSearch = params.toString();
    const newUrl = newSearch ? `/seasons?${newSearch}` : '/seasons';
    if (window.location.pathname + window.location.search !== newUrl) {
      setLocation(newUrl, { replace: true });
    }
  }, [year, season, page, currentYear, defaultSeason, setLocation]);

  const { data, isLoading, error } = useSeason(year, season, page);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight flex items-center gap-3 capitalize">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <CalendarDays size={32} />
          </div>
          {season} {year} Anime
        </h1>
        <p className="text-muted-foreground text-lg">Browse anime released during specific seasons and years.</p>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {seasonsList.map((s) => (
            <button
              key={s}
              onClick={() => { setSeason(s); setPage(1); }}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm capitalize transition-all whitespace-nowrap ${
                season === s 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        
        <div className="h-8 w-px bg-border hidden md:block mx-2"></div>
        
        <select 
          value={year}
          onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }}
          className="flex-1 md:w-40 py-2.5 px-4 bg-muted rounded-lg border-none focus:ring-2 focus:ring-primary outline-none text-sm appearance-none font-medium cursor-pointer"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Error loading season data: {(error as Error).message}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {Array.from({ length: 24 }).map((_, i) => <AnimeCardSkeleton key={i} />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed">
            <p className="text-lg">No anime found for this season.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
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
