import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

export function AnimeCard({ anime }: { anime: any }) {
  const imageUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;
  const title = anime.title_english || anime.title;
  
  return (
    <Link href={`/anime/${anime.mal_id}`} className="group flex flex-col gap-3 cursor-pointer outline-none focus-visible:ring-2 ring-primary rounded-xl">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-focus:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
            No Image
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4">
          <p className="text-white text-xs leading-relaxed line-clamp-4">
            {anime.synopsis ? anime.synopsis : "No synopsis available."}
          </p>
        </div>
        
        {anime.score && (
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-md text-foreground text-xs font-bold px-2 py-1 rounded-md shadow-sm border">
            ★ {anime.score}
          </div>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex flex-wrap gap-1 mt-1.5 opacity-80">
          {anime.year && <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{anime.year}</span>}
          {anime.type && <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{anime.type}</span>}
          {anime.episodes ? <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{anime.episodes} eps</span> : null}
        </div>
      </div>
    </Link>
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[3/4] w-full rounded-xl" />
      <Skeleton className="h-5 w-full" />
      <div className="flex gap-1">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  );
}
