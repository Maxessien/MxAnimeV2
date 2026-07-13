import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useJson } from "@/hooks/use-json";
import { AnimeSummary, downloadAnime } from "@/lib/local-store";
import { downloadQueue } from "@/lib/queue";
import { Anime, AnimeEpisode, JikanPagination } from "@/types/jikan";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ListVideo } from "lucide-react";
import { FaDownload, FaSpinner } from "react-icons/fa";

type AnimeEpisodesProps = {
  episodes: AnimeEpisode[];
  pagination?: JikanPagination;
  episodePage: number;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  anime: Anime;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function AnimeEpisodes({
  episodes,
  pagination,
  episodePage,
  isLoading,
  isFetching,
  error,
  anime,
  onPreviousPage,
  onNextPage,
}: AnimeEpisodesProps) {
  const { add } = useJson<AnimeSummary>({
    type: "downloads",
  });

  const { mutateAsync } = useMutation({
    mutationFn: async (eid: string | number) => {
      downloadQueue.push({
        mal_id: anime.mal_id,
        title: anime.title,
        image: anime.images.webp.large_image_url,
        type: anime.type,
        episode: {
          ep: eid,
          path: "",
        },
        score: anime.score,
      });

      if (!downloadQueue.isProcessing) await downloadAnime(add.mutateAsync);
    },
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-display border-l-4 border-primary pl-3 flex items-center gap-2">
          <ListVideo size={24} className="text-primary" /> Episodes
        </h2>
        {(pagination?.last_visible_page || 0) > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onPreviousPage}
              disabled={episodePage <= 1 || isFetching}
              className="p-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous episodes page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-muted-foreground font-mono min-w-16 text-center">
              {episodePage} / {pagination?.last_visible_page || 1}
            </span>
            <button
              onClick={onNextPage}
              disabled={!pagination?.has_next_page || isFetching}
              className="p-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next episodes page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
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
              key={episode.mal_id}
              className="flex items-center gap-4 bg-card p-4 rounded-xl border hover:border-primary/50 transition-colors group animate-in fade-in slide-in-from-bottom-1"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-sm">
                {episode.mal_id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate group-hover:text-primary transition-colors">
                    {episode.title || `Episode ${episode.mal_id}`}
                  </span>
                  {episode.filler && (
                    <Badge variant="outline" className="text-xs opacity-70">
                      Filler
                    </Badge>
                  )}
                  {episode.recap && (
                    <Badge variant="outline" className="text-xs opacity-70">
                      Recap
                    </Badge>
                  )}
                </div>
                {episode.aired && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(episode.aired).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
              <button
                onClick={() => mutateAsync(episode.mal_id)}
                className="rounded-full hover:bg-primary/90 transition-all p-4 border-2 border-(--border) bg-primary hover:cursor-pointer"
              >
                {!downloadQueue
                  .traverse()
                  .find(
                    (v) =>
                      v.mal_id === anime.mal_id &&
                      v.episode.ep === episode.mal_id,
                  ) ? (
                  <FaDownload />
                ) : (
                  <FaSpinner className="animate-spin" />
                )}
              </button>
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
