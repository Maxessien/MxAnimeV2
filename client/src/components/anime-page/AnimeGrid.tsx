import { Loader2, SearchX } from "lucide-react";
import { AnimeListMedia } from "@/types/anilist";
import { AnimeCardSkeleton, RecentEpisodeAnimeCard } from "@/components/AnimeCard";

export function AnimeGrid({ anime, loading }: { anime: AnimeListMedia[]; loading: boolean }) {
  if (loading && anime.length === 0) {
    return <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{Array.from({ length: 18 }, (_, index) => <AnimeCardSkeleton key={index} />)}</div>;
  }

  if (!loading && anime.length === 0) {
    return <div className="rounded-2xl border border-dashed bg-muted/20 py-20 text-center"><SearchX className="mx-auto mb-4 text-muted-foreground" size={42} /><p className="font-medium">No anime found</p><p className="mt-1 text-sm text-muted-foreground">Try changing your search or filters.</p></div>;
  }

  return (
    <div className="relative">
      {loading && <Loader2 className="absolute right-0 top-0 z-10 animate-spin text-primary" />}
      <div className={`grid grid-cols-2 gap-x-3 gap-y-8 transition-opacity sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ${loading ? "opacity-50" : ""}`}>
        {anime.map((item, index) => (
          <div key={item.idMal} className="animate-in fade-in zoom-in-95" style={{ animationDelay: `${Math.min(index, 10) * 40}ms`, animationFillMode: "both" }}>
            <RecentEpisodeAnimeCard anime={{ media: item, episode: item.episodes ?? 0 }} type="search" />
          </div>
        ))}
      </div>
    </div>
  );
}
