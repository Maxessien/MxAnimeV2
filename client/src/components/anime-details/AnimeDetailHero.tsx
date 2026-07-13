import { Badge } from "@/components/ui/badge";
import { AnimeFull } from "@/types/jikan";
import { Check, Download, Star } from "lucide-react";

type AnimeDetailHeroProps = {
  anime: AnimeFull;
  trailerUrl?: string | null;
  downloaded: boolean;
  onToggleDownload: () => void;
};

export function AnimeDetailHero({
  anime,
  trailerUrl,
  downloaded,
  onToggleDownload,
}: AnimeDetailHeroProps) {
  const coverImage =
    anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;

  return (
    <div className="relative -mt-8 -mx-4 md:-mx-8 mb-8 md:mb-16">
      <div className="h-75 md:h-112.5 w-full overflow-hidden bg-black">
        {trailerUrl ? (
          <iframe
            src={`${trailerUrl}&autoplay=1&mute=1&controls=0&loop=1`}
            className="w-full h-[150%] mt-[-10%] opacity-40 pointer-events-none scale-110 object-cover"
            title={`${anime.title} banner trailer`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
          />
        ) : (
          <img
            src={coverImage}
            alt={anime.title}
            className="w-full h-full object-cover opacity-30 blur-sm scale-110"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10 -mt-32 md:-mt-48 flex flex-col lg:flex-row gap-8">
        <div className="w-48 md:w-72 shrink-0 mx-auto md:mx-0 shadow-2xl rounded-2xl overflow-hidden border-4 border-background bg-background">
          <img
            src={coverImage}
            alt={anime.title}
            className="w-full h-full object-center object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col justify-end pt-4 md:pt-20 text-center md:text-left">
          <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
            {anime.status && (
              <Badge
                variant={anime.status === "Currently Airing" ? "default" : "secondary"}
                className="font-mono uppercase tracking-wider"
              >
                {anime.status}
              </Badge>
            )}
            {anime.type && <Badge variant="outline">{anime.type}</Badge>}
            {anime.rating && (
              <Badge variant="outline" className="opacity-70">
                {anime.rating}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight mb-2 text-foreground">
            {anime.title_english || anime.title}
          </h1>
          {anime.title_english && anime.title !== anime.title_english && (
            <h2 className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium mb-6">
              {anime.title}
            </h2>
          )}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-auto bg-card/50 backdrop-blur-md p-4 rounded-2xl border shadow-sm w-fit">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                <Star size={14} className="text-yellow-500" /> Score
              </span>
              <span className="text-2xl font-bold">
                {anime.score ? anime.score.toFixed(2) : "N/A"}
              </span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col items-center md:items-start">
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                Rank
              </span>
              <span className="text-2xl font-bold">#{anime.rank || "?"}</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col items-center md:items-start">
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                Popularity
              </span>
              <span className="text-2xl font-bold">
                #{anime.popularity || "?"}
              </span>
            </div>
          </div>

          <button
            onClick={onToggleDownload}
            className={`mt-4 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm w-fit mx-auto md:mx-0 transition-colors ${
              downloaded
                ? "bg-primary/10 text-primary border border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {downloaded ? <Check size={16} /> : <Download size={16} />}
            {downloaded ? "Saved for Offline" : "Save for Offline"}
          </button>
        </div>
      </div>
    </div>
  );
}