import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AnimeCardSkeleton, RecentEpisodeAnimeCard } from "@/components/AnimeCard";
import { useRecentlyReleased } from "@/hooks/use-jikan";
import { Tv } from "lucide-react";

export default function LatestEpisodes() {
  const [_, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  // Sync URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());

    const newSearch = params.toString();
    const newUrl = newSearch ? `/latest?${newSearch}` : "/latest";
    if (window.location.pathname + window.location.search !== newUrl) {
      setLocation(newUrl, { replace: true });
    }
  }, [page, setLocation]);

  const { data, isLoading, error } = useRecentlyReleased(page, 25)

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Tv size={32} />
          </div>
          Recently Aired
        </h1>
        <p className="text-muted-foreground text-lg">
          Most recently aired episodes.
        </p>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Error loading top anime: {(error as Error).message}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {Array.from({ length: 24 }).map((_, i) => (
              <AnimeCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
              {data?.data.map((anime, i: number) => (
                <div
                  key={anime.media.idMal}
                  className="relative animate-in fade-in zoom-in-95"
                  style={{
                    animationDelay: `${Math.min(i, 10) * 50}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <RecentEpisodeAnimeCard anime={anime} />
                </div>
              ))}
              </div>

              <div className="flex items-center justify-center gap-4 pt-8 border-t">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={page === 1}
                  className="px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl disabled:opacity-50 hover:bg-secondary/80 transition-all active:scale-95"
                >
                  Previous
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold bg-muted px-4 py-2 rounded-lg">
                    Page {page} of {data?.pageInfo.total}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPage((p) =>
                      Math.min(data?.pageInfo.lastPage || 99999, p + 1),
                    );
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={!data?.pageInfo.hasNextPage}
                  className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
                >
                  Next
                </button>
              </div>
          </>
        )}
      </div>
    </div>
  );
}
