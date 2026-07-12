import { AnimeCard, AnimeCardSkeleton } from '@/components/AnimeCard';
import { useSeasonsNow, useTopAnime } from '@/hooks/use-jikan';
import { ArrowRight, Loader2, PlayCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function Home() {
  const { data: trending, isLoading: isLoadingTrending, error: trendingError } = useSeasonsNow(1);
  const { data: top, isLoading: isLoadingTop, error: topError } = useTopAnime(1, 'bypopularity');

  const spotlight = trending?.data?.[0];

  return (
    <div className="flex flex-col gap-16 pb-12 animate-in fade-in duration-500">
      {/* Hero / Spotlight */}
      <section className="relative rounded-2xl h-max md:rounded-3xl overflow-hidden bg-muted aspect-4/3 md:aspect-21/9 min-h-100 flex items-end shadow-xl border">
        {isLoadingTrending && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        )}
        
        {spotlight && (
          <>
            <img 
              src={spotlight.images.webp.large_image_url} 
              alt={spotlight.title}
              className="absolute inset-0 w-full h-full object-cover object-top opacity-60"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/40 to-transparent" />
            
            <div className="z-10 p-6 w-full mx-auto max-w-4xl">
              <div className="flex items-center gap-3 mb-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
                  Season Spotlight
                </span>
                <span className="text-foreground/80 text-sm font-medium backdrop-blur-md bg-background/30 px-3 py-1 rounded-full">
                  {spotlight.season} {spotlight.year}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-display font-extrabold text-foreground mb-4 leading-[1.1] animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100">
                {spotlight.title_english || spotlight.title}
              </h1>
              <p className="text-foreground/80 text-sm md:text-lg line-clamp-3 mb-8 max-w-2xl animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200 leading-relaxed">
                {spotlight.synopsis}
              </p>
              <div className="flex gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
                <Link 
                  href={`/anime/${spotlight.mal_id}`} 
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                >
                  <PlayCircle size={24} />
                  View Details
                </Link>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Airing Now Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight flex items-center gap-3">
              <span className="w-2 h-8 bg-primary rounded-full inline-block" />
              Airing This Season
            </h2>
            <p className="text-muted-foreground mt-1 ml-5 text-sm md:text-base">The hottest shows broadcasting right now.</p>
          </div>
          <Link href="/seasons" className="hidden md:flex text-muted-foreground hover:text-primary items-center gap-1 text-sm font-medium transition-colors bg-muted px-4 py-2 rounded-full">
            Browse Seasons <ArrowRight size={16} />
          </Link>
        </div>

        {trendingError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Failed to load airing anime.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
          {isLoadingTrending 
            ? Array.from({ length: 6 }).map((_, i) => <AnimeCardSkeleton key={i} />)
            : trending?.data?.slice(1, 7).map((anime: any, i: number) => (
                <div key={anime.mal_id} className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
                  <AnimeCard anime={anime} />
                </div>
              ))
          }
        </div>
        
        <div className="mt-8 md:hidden flex justify-center">
          <Link href="/seasons" className="text-muted-foreground hover:text-primary flex items-center gap-1 text-sm font-medium transition-colors bg-muted px-6 py-3 rounded-full w-full justify-center">
            Browse Seasons <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Top Anime Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight flex items-center gap-3">
              <span className="w-2 h-8 bg-primary rounded-full inline-block" />
              Most Popular
            </h2>
            <p className="text-muted-foreground mt-1 ml-5 text-sm md:text-base">All-time fan favorites and trending classics.</p>
          </div>
          <Link href="/top" className="hidden md:flex text-muted-foreground hover:text-primary items-center gap-1 text-sm font-medium transition-colors bg-muted px-4 py-2 rounded-full">
            View All Top Anime <ArrowRight size={16} />
          </Link>
        </div>

        {topError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Failed to load popular anime.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
          {isLoadingTop 
            ? Array.from({ length: 6 }).map((_, i) => <AnimeCardSkeleton key={i} />)
            : top?.data?.slice(0, 6).map((anime: any, i: number) => (
                <div key={anime.mal_id} className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
                  <AnimeCard anime={anime} />
                </div>
              ))
          }
        </div>

        <div className="mt-8 md:hidden flex justify-center">
          <Link href="/top" className="text-muted-foreground hover:text-primary flex items-center gap-1 text-sm font-medium transition-colors bg-muted px-6 py-3 rounded-full w-full justify-center">
            View All Top Anime <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
