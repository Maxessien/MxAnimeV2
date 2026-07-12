import { useRoute } from 'wouter';
import { useEffect, useState } from 'react';
import { useAnimeFull, useAnimeEpisodes } from '@/hooks/use-jikan';
import { useWatchHistory } from '@/hooks/use-watch-history';
import { useDownloads } from '@/hooks/use-downloads';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Play, ListVideo, LayoutDashboard, Calendar, Video, Loader2, PlayCircle, ExternalLink, ChevronLeft, ChevronRight, Download, Check } from 'lucide-react';

export default function AnimeDetail() {
  const [, params] = useRoute('/anime/:id');
  const id = params?.id || '';
  const [episodePage, setEpisodePage] = useState(1);

  const { data: animeData, isLoading: isLoadingAnime, error: animeError } = useAnimeFull(id);
  const { data: episodesData, isLoading: isLoadingEpisodes, isFetching: isFetchingEpisodes, error: episodesError } = useAnimeEpisodes(id, episodePage);
  const { record: recordHistory } = useWatchHistory();
  const { isDownloaded, add: addDownload, remove: removeDownload } = useDownloads();

  useEffect(() => {
    const anime = animeData?.data;
    if (!anime) return;
    recordHistory({
      mal_id: anime.mal_id,
      title: anime.title_english || anime.title,
      image: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || null,
      type: anime.type,
      episodes: anime.episodes,
      score: anime.score,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeData?.data?.mal_id]);

  if (animeError) {
    return (
      <div className="py-20 text-center text-destructive">
        <h2 className="text-2xl font-bold">Failed to load anime details</h2>
        <p className={(animeError as Error).message}></p>
      </div>
    );
  }

  if (isLoadingAnime) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-[400px] bg-muted rounded-3xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 space-y-4">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  const anime = animeData?.data;
  if (!anime) return null;

  const episodes = episodesData?.data || [];
  const episodesPagination = episodesData?.pagination;
  const trailerUrl = anime.trailer?.embed_url;
  const downloaded = isDownloaded(anime.mal_id);

  const toggleDownload = () => {
    if (downloaded) {
      removeDownload(anime.mal_id);
    } else {
      addDownload({
        mal_id: anime.mal_id,
        title: anime.title_english || anime.title,
        image: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || null,
        type: anime.type,
        episodes: anime.episodes,
        score: anime.score,
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
      {/* Hero Banner Section */}
      <div className="relative -mt-8 -mx-4 md:-mx-8 mb-8 md:mb-16">
        <div className="h-[300px] md:h-[450px] w-full overflow-hidden bg-black">
          {trailerUrl ? (
            <iframe 
              src={`${trailerUrl}&autoplay=1&mute=1&controls=0&loop=1`} 
              className="w-full h-[150%] -mt-[10%] opacity-40 pointer-events-none scale-110 object-cover"
              frameBorder="0"
              allow="autoplay; encrypted-media"
            />
          ) : (
            <img 
              src={anime.images.webp.large_image_url} 
              alt={anime.title}
              className="w-full h-full object-cover opacity-30 blur-sm scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        
        {/* Main Info Card floating over banner */}
        <div className="container mx-auto px-4 relative z-10 -mt-32 md:-mt-48 flex flex-col md:flex-row gap-8">
          <div className="w-48 md:w-72 flex-shrink-0 mx-auto md:mx-0 shadow-2xl rounded-2xl overflow-hidden border-4 border-background bg-background">
            <img 
              src={anime.images.webp.large_image_url} 
              alt={anime.title} 
              className="w-full h-auto object-cover"
            />
          </div>
          
          <div className="flex-1 flex flex-col justify-end pt-4 md:pt-20 text-center md:text-left">
            <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
              {anime.status && (
                <Badge variant={anime.status === 'Currently Airing' ? 'default' : 'secondary'} className="font-mono uppercase tracking-wider">
                  {anime.status}
                </Badge>
              )}
              {anime.type && <Badge variant="outline">{anime.type}</Badge>}
              {anime.rating && <Badge variant="outline" className="opacity-70">{anime.rating}</Badge>}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight mb-2 text-foreground">
              {anime.title_english || anime.title}
            </h1>
            {anime.title_english && anime.title !== anime.title_english && (
              <h2 className="text-xl md:text-2xl text-muted-foreground font-medium mb-6">
                {anime.title}
              </h2>
            )}
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-auto bg-card/50 backdrop-blur-md p-4 rounded-2xl border shadow-sm w-fit">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1"><Star size={14} className="text-yellow-500"/> Score</span>
                <span className="text-2xl font-bold">{anime.score ? anime.score.toFixed(2) : 'N/A'}</span>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Rank</span>
                <span className="text-2xl font-bold">#{anime.rank || '?'}</span>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Popularity</span>
                <span className="text-2xl font-bold">#{anime.popularity || '?'}</span>
              </div>
            </div>

            <button
              onClick={toggleDownload}
              className={`mt-4 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm w-fit mx-auto md:mx-0 transition-colors ${
                downloaded
                  ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {downloaded ? <Check size={16} /> : <Download size={16} />}
              {downloaded ? 'Saved for Offline' : 'Save for Offline'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-8 order-2 lg:order-1">
          <div className="bg-muted/30 p-6 rounded-2xl border">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-primary"/>
              Information
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Format</span>
                <span className="font-medium text-right">{anime.type}</span>
              </li>
              <li className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Episodes</span>
                <span className="font-medium text-right">{anime.episodes || 'Unknown'}</span>
              </li>
              <li className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-right">{anime.duration}</span>
              </li>
              <li className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Season</span>
                <span className="font-medium text-right capitalize">{anime.season} {anime.year}</span>
              </li>
              <li className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Broadcast</span>
                <span className="font-medium text-right">{anime.broadcast?.string || 'Unknown'}</span>
              </li>
              <li className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Studios</span>
                <span className="font-medium text-right">
                  {anime.studios?.map((s: any) => s.name).join(', ') || 'Unknown'}
                </span>
              </li>
              <li className="flex justify-between pt-2">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium text-right">{anime.source}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-lg mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {[...anime.genres, ...anime.explicit_genres, ...anime.themes, ...anime.demographics].map((g: any) => (
                <Badge key={g.mal_id} variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  {g.name}
                </Badge>
              ))}
            </div>
          </div>
          
          {anime.url && (
            <a 
              href={anime.url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-colors"
            >
              View on MyAnimeList <ExternalLink size={16} />
            </a>
          )}
        </div>

        {/* Right Column - Synopsis & Characters & Trailer */}
        <div className="lg:col-span-2 space-y-12 order-1 lg:order-2">
          {/* Synopsis */}
          <section>
            <h2 className="text-2xl font-bold font-display mb-4 border-l-4 border-primary pl-3">Synopsis</h2>
            <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
              {anime.synopsis || "No synopsis available for this title."}
            </p>
            {anime.background && (
              <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-dashed">
                <h4 className="font-semibold text-sm mb-2 uppercase tracking-wider text-muted-foreground">Background</h4>
                <p className="text-sm leading-relaxed">{anime.background}</p>
              </div>
            )}
          </section>

          {/* Trailer */}
          {anime.trailer?.youtube_id && (
            <section>
              <h2 className="text-2xl font-bold font-display mb-4 border-l-4 border-primary pl-3 flex items-center gap-2">
                <Video size={24} className="text-primary"/> Trailer
              </h2>
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border">
                <iframe 
                  src={`https://www.youtube.com/embed/${anime.trailer.youtube_id}`} 
                  title={`${anime.title} Trailer`}
                  className="w-full h-full"
                  allowFullScreen
                ></iframe>
              </div>
            </section>
          )}

          {/* Episodes */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-display border-l-4 border-primary pl-3 flex items-center gap-2">
                <ListVideo size={24} className="text-primary"/> Episodes
              </h2>
              {episodesPagination?.last_visible_page > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEpisodePage((p) => Math.max(1, p - 1))}
                    disabled={episodePage <= 1 || isFetchingEpisodes}
                    className="p-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous episodes page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-muted-foreground font-mono min-w-[64px] text-center">
                    {episodePage} / {episodesPagination.last_visible_page}
                  </span>
                  <button
                    onClick={() => setEpisodePage((p) => p + 1)}
                    disabled={!episodesPagination?.has_next_page || isFetchingEpisodes}
                    className="p-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next episodes page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {isLoadingEpisodes ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : episodesError ? (
              <p className="text-muted-foreground italic">Episode list is unavailable for this title right now.</p>
            ) : episodes.length > 0 ? (
              <div className={`space-y-3 transition-opacity ${isFetchingEpisodes ? 'opacity-50' : 'opacity-100'}`}>
                {episodes.map((ep: any, i: number) => (
                  <a
                    key={ep.mal_id}
                    href={ep.url || undefined}
                    target={ep.url ? '_blank' : undefined}
                    rel={ep.url ? 'noreferrer' : undefined}
                    className="flex items-center gap-4 bg-card p-4 rounded-xl border hover:border-primary/50 transition-colors group animate-in fade-in slide-in-from-bottom-1"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-sm">
                      {ep.mal_id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate group-hover:text-primary transition-colors">
                          {ep.title || `Episode ${ep.mal_id}`}
                        </span>
                        {ep.filler && <Badge variant="outline" className="text-xs opacity-70">Filler</Badge>}
                        {ep.recap && <Badge variant="outline" className="text-xs opacity-70">Recap</Badge>}
                      </div>
                      {ep.aired && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(ep.aired).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {typeof ep.score === 'number' && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                        <Star size={14} className="text-yellow-500" />
                        {ep.score.toFixed(1)}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No episode data available.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
