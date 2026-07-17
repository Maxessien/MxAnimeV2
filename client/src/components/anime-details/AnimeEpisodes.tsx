import { Skeleton } from "@/components/ui/skeleton";
import { downloadQueue } from "@/lib/queue";
import { Episode } from "@/types/anizip";
import { Anime } from "@/types/jikan";
import { ListVideo } from "lucide-react";
import { FaDownload, FaSpinner } from "react-icons/fa";

type AnimeEpisodesProps = {
  episodes: (Episode & { hasAired: boolean })[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  anime: Anime;
  showDlPopup: (val: {
    mal_id: string | number;
    eId: number;
    sId: number;
  }) => void;
};

export function AnimeEpisodes({
  episodes,
  isLoading,
  isFetching,
  error,
  anime,
  showDlPopup,
}: AnimeEpisodesProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-display border-l-4 border-primary pl-3 flex items-center gap-2">
          <ListVideo size={24} className="text-primary" /> Episodes
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <p className="text-muted-foreground italic">
          Episode list is unavailable for this title right now.
        </p>
      ) : episodes.length > 0 ? (
        <div
          className={`space-y-3 transition-opacity ${isFetching ? "opacity-50" : "opacity-100"}`}
        >
          {episodes.map((episode, index) => (
            <div
              key={index}
              className="flex items-center gap-4 bg-card p-4 rounded-xl border hover:border-primary/50 transition-colors group animate-in fade-in slide-in-from-bottom-1"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-sm">
                {`${episode.episodeNumber || index + 1}`}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate group-hover:text-primary transition-colors">
                    {`Episode ${episode.episodeNumber || index + 1}`}
                  </span>
                  {!episode.hasAired && (
                    <span className="text-sm bg-muted px-2 py-1 rounded-md text-muted-foreground">
                      Not yet aired
                    </span>
                  )}
                </div>
                {episode.airDate && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(episode.airDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
              {episode.hasAired && (
                <button
                  onClick={() => {
                    if (
                      episode.hasAired &&
                      episode.episodeNumber &&
                      episode.seasonNumber
                    )
                      showDlPopup({
                        eId: episode.episodeNumber,
                        mal_id: anime.mal_id,
                        sId: episode.seasonNumber,
                      });
                  }}
                  className="rounded-full hover:bg-primary/90 transition-all p-4 border-2 border-(--border) bg-primary hover:cursor-pointer"
                >
                  {!downloadQueue
                    .traverse()
                    .find(
                      (v) =>
                        v.mal_id === anime.mal_id &&
                        v.episode.ep === episode.episodeNumber &&
                        v.episode.season === episode.seasonNumber,
                    ) ? (
                    <FaDownload />
                  ) : (
                    <FaSpinner className="animate-spin" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground italic">
          No episode data available.
        </p>
      )}
    </section>
  );
}
