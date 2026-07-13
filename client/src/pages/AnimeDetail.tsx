import {
  AnimeDetailEpisodes,
  AnimeDetailHero,
  AnimeDetailInfo,
  AnimeSynopsis,
  AnimeTrailer,
} from "@/components/anime-details";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimeEpisodes, useAnimeFull } from "@/hooks/use-jikan";
import { useJson } from "@/hooks/use-json";
import { AnimeSummary } from "@/lib/local-store";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRoute } from "wouter";

export default function AnimeDetail() {
  const [, params] = useRoute("/anime/:id");
  const id = params?.id || "";
  const [episodePage, setEpisodePage] = useState(1);

  const {
    data: animeData,
    isLoading: isLoadingAnime,
    error: animeError,
  } = useAnimeFull(id);
  
  const {
    data: episodesData,
    isLoading: isLoadingEpisodes,
    isFetching: isFetchingEpisodes,
    error: episodesError,
  } = useAnimeEpisodes(id, episodePage);

  const { add, remove, json } = useJson<AnimeSummary>({ type: "downloads", addOptions: {
    onError: ()=> toast.error("Couldn't start download"),
    onSuccess: ()=> toast.success("Download started")
  } });

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
        <div className="h-100 bg-muted rounded-3xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 space-y-4">
            <Skeleton className="h-100 w-full rounded-2xl" />
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
  const downloaded = json.downloads.some((v) => v.mal_id === anime.mal_id);

  const toggleDownload = () => {
    if (downloaded) {
      remove.mutateAsync((lt)=> lt.filter(v=> v.mal_id !== anime.mal_id));
    } else {
      add.mutateAsync({
        anime: {
          mal_id: anime.mal_id,
          title: anime.title_english || anime.title,
          image:
            anime.images?.webp?.large_image_url ||
            anime.images?.jpg?.large_image_url ||
            null,
          type: anime.type,
          episodes: anime.episodes,
          score: anime.score,
        },
        type: "downloads",
        exists: (l) => l.some((v) => v.mal_id === anime.mal_id),
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
      <AnimeDetailHero
        anime={anime}
        trailerUrl={trailerUrl}
        downloaded={downloaded}
        onToggleDownload={toggleDownload}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <AnimeDetailInfo anime={anime} />

        <div className="lg:col-span-2 space-y-12 order-1 lg:order-2">
          <AnimeSynopsis anime={anime} />
          <AnimeTrailer animeTitle={anime.title} youtubeId={anime.trailer?.youtube_id} />
          <AnimeDetailEpisodes
            episodes={episodes}
            pagination={episodesPagination}
            episodePage={episodePage}
            isLoading={isLoadingEpisodes}
            isFetching={isFetchingEpisodes}
            error={episodesError}
            onPreviousPage={() => setEpisodePage((page) => Math.max(1, page - 1))}
            onNextPage={() => setEpisodePage((page) => page + 1)}
          />
        </div>
      </div>
    </div>
  );
}
