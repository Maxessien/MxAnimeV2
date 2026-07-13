import { Badge } from "@/components/ui/badge";
import { AnimeFull } from "@/types/jikan";
import { LayoutDashboard } from "lucide-react";

type AnimeDetailInfoProps = {
  anime: AnimeFull;
};

export function AnimeDetailInfo({ anime }: AnimeDetailInfoProps) {
  const genres = [
    ...(anime.genres || []),
    ...(anime.explicit_genres || []),
    ...(anime.themes || []),
    ...(anime.demographics || []),
  ];

  return (
    <div className="lg:col-span-1 space-y-8 order-2 lg:order-1">
      <div className="bg-muted/30 p-6 rounded-2xl border">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <LayoutDashboard size={20} className="text-primary" />
          Information
        </h3>
        <ul className="space-y-4 text-sm">
          <li className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Format</span>
            <span className="font-medium text-right">{anime.type}</span>
          </li>
          <li className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Episodes</span>
            <span className="font-medium text-right">
              {anime.episodes || "Unknown"}
            </span>
          </li>
          <li className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium text-right">{anime.duration}</span>
          </li>
          <li className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Season</span>
            <span className="font-medium text-right capitalize">
              {anime.season} {anime.year}
            </span>
          </li>
          <li className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Broadcast</span>
            <span className="font-medium text-right">
              {anime.broadcast?.string || "Unknown"}
            </span>
          </li>
          <li className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Studios</span>
            <span className="font-medium text-right">
              {anime.studios?.map((studio) => studio.name).join(", ") || "Unknown"}
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
          {genres.map((genre) => (
            <Badge
              key={genre.mal_id}
              variant="secondary"
              className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {genre.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}